import { DecimalPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Product } from '../../products/product.model';
import { ProductService } from '../../products/product.service';
import { PageResult, monthToDate } from '../../../shared/list-page';
import { PurchaseOrder } from './purchase-order.model';
import { PurchaseOrderService } from './purchase-order.service';

@Component({
  selector: 'app-purchase-orders',
  imports: [DecimalPipe, DatePipe, RouterLink, ReactiveFormsModule],
  templateUrl: './purchase-orders.html',
  styleUrl: './purchase-orders.scss',
})
export class PurchaseOrders implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly purchaseOrdersApi = inject(PurchaseOrderService);
  private readonly productsApi = inject(ProductService);
  private readonly range = monthToDate();

  protected readonly orders = signal<PurchaseOrder[]>([]);
  protected readonly products = signal<Product[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly expandedId = signal<number | null>(null);
  protected readonly pendingDeleteId = signal<number | null>(null);
  protected readonly deletingId = signal<number | null>(null);
  protected readonly page = signal(0);
  protected readonly pageSize = signal(20);
  protected readonly totalElements = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly filters = this.formBuilder.group({
    fromDate: [this.range.fromDate],
    toDate: [this.range.toDate],
  });

  ngOnInit(): void {
    this.load();
    this.productsApi.getProducts().subscribe({
      next: (products) => this.products.set(products),
      error: () => undefined,
    });
  }

  protected toggle(orderId: number): void {
    this.expandedId.update((current) => (current === orderId ? null : orderId));
  }

  protected productName(productId: number): string {
    return this.products().find((product) => product.productId === productId)?.productName ?? `Product ${productId}`;
  }

  protected applyFilters(): void {
    this.page.set(0);
    this.load();
  }

  protected previousPage(): void {
    if (this.page() === 0) {
      return;
    }
    this.page.update((current) => current - 1);
    this.load();
  }

  protected nextPage(): void {
    if (this.page() + 1 >= this.totalPages()) {
      return;
    }
    this.page.update((current) => current + 1);
    this.load();
  }

  protected changePageSize(value: string): void {
    const size = Number(value);
    if (!Number.isFinite(size) || size <= 0) {
      return;
    }
    this.pageSize.set(size);
    this.page.set(0);
    this.load();
  }

  protected resultSummary(): string {
    const total = this.totalElements();
    if (total === 0) {
      return '0 results';
    }
    const start = this.page() * this.pageSize() + 1;
    const end = Math.min(total, (this.page() + 1) * this.pageSize());
    return `${start}–${end} of ${total}`;
  }

  protected confirmDelete(orderId: number): void {
    this.pendingDeleteId.set(orderId);
  }

  protected cancelDelete(): void {
    this.pendingDeleteId.set(null);
  }

  protected deleteOrder(order: PurchaseOrder): void {
    this.deletingId.set(order.id);
    this.error.set(null);
    this.purchaseOrdersApi.deletePurchaseOrder(order.id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.pendingDeleteId.set(null);
        if (this.expandedId() === order.id) {
          this.expandedId.set(null);
        }
        this.load();
      },
      error: (error: HttpErrorResponse) => {
        this.deletingId.set(null);
        this.error.set(this.errorMessage(error));
      },
    });
  }

  private load(allowStepBack = true): void {
    const filters = this.filters.getRawValue();
    this.loading.set(true);
    this.purchaseOrdersApi
      .getPurchaseOrders({
        page: this.page(),
        size: this.pageSize(),
        fromDate: filters.fromDate,
        toDate: filters.toDate,
      })
      .subscribe({
        next: (page) => {
          if (allowStepBack && page.content.length === 0 && this.page() > 0) {
            this.page.update((current) => current - 1);
            this.load(false);
            return;
          }
          this.applyPage(page);
        },
        error: () => {
          this.error.set('Could not load purchase orders.');
          this.loading.set(false);
        },
      });
  }

  private applyPage(page: PageResult<PurchaseOrder>): void {
    this.orders.set(page.content);
    this.totalElements.set(page.totalElements);
    this.totalPages.set(page.totalPages);
    if (page.number !== null) {
      this.page.set(page.number);
    }
    this.loading.set(false);
  }

  private errorMessage(error: HttpErrorResponse): string {
    if (typeof error.error === 'string' && error.error.trim()) {
      return error.error;
    }
    if (error.error && typeof error.error === 'object' && 'message' in error.error) {
      const message = error.error.message;
      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }
    return 'Could not delete the purchase order.';
  }
}
