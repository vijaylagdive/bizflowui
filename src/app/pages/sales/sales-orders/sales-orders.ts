import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../../products/product.model';
import { ProductService } from '../../products/product.service';
import { SalesOrder } from './sales-order.model';
import { SalesOrderService } from './sales-order.service';

@Component({
  selector: 'app-sales-orders',
  imports: [DatePipe, DecimalPipe, RouterLink],
  templateUrl: './sales-orders.html',
  styleUrl: './sales-orders.scss',
})
export class SalesOrders implements OnInit {
  private readonly salesOrdersApi = inject(SalesOrderService);
  private readonly productsApi = inject(ProductService);

  protected readonly orders = signal<SalesOrder[]>([]);
  protected readonly products = signal<Product[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly expandedId = signal<number | null>(null);
  protected readonly pendingDeleteId = signal<number | null>(null);
  protected readonly deletingId = signal<number | null>(null);

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

  protected confirmDelete(orderId: number): void {
    this.pendingDeleteId.set(orderId);
  }

  protected cancelDelete(): void {
    this.pendingDeleteId.set(null);
  }

  protected deleteOrder(order: SalesOrder): void {
    this.deletingId.set(order.id);
    this.error.set(null);
    this.salesOrdersApi.deleteSalesOrder(order.id).subscribe({
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

  private load(): void {
    this.loading.set(true);
    this.salesOrdersApi.getSalesOrders().subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load sales orders.');
        this.loading.set(false);
      },
    });
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
    return 'Could not delete the sales order.';
  }
}
