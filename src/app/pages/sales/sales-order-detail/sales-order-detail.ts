import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Customer } from '../../customers/customer.model';
import { CustomerService } from '../../customers/customer.service';
import { Product } from '../../products/product.model';
import { ProductService } from '../../products/product.service';
import { SalesOrder, SalesOrderItem } from '../sales-orders/sales-order.model';
import { SalesOrderService } from '../sales-orders/sales-order.service';

@Component({
  selector: 'app-sales-order-detail',
  imports: [DatePipe, DecimalPipe, RouterLink],
  templateUrl: './sales-order-detail.html',
  styleUrl: './sales-order-detail.scss',
})
export class SalesOrderDetail implements OnInit {
  private readonly salesOrdersApi = inject(SalesOrderService);
  private readonly productsApi = inject(ProductService);
  private readonly customersApi = inject(CustomerService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly order = signal<SalesOrder | null>(null);
  protected readonly products = signal<Product[]>([]);
  protected readonly customers = signal<Customer[]>([]);
  protected readonly loading = signal(true);
  protected readonly deleting = signal(false);
  protected readonly confirmDelete = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id <= 0) {
      this.error.set('Could not find this sales order.');
      this.loading.set(false);
      return;
    }

    this.productsApi.getProducts().subscribe({
      next: (products) => this.products.set(products),
      error: () => undefined,
    });
    this.customersApi.getCustomers().subscribe({
      next: (customers) => this.customers.set(customers),
      error: () => undefined,
    });
    this.salesOrdersApi.getSalesOrder(id).subscribe({
      next: (order) => {
        this.order.set(order);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(this.errorMessage(error, 'Could not load the sales order.'));
        this.loading.set(false);
      },
    });
  }

  protected customer(): Customer | undefined {
    const order = this.order();
    if (!order) {
      return undefined;
    }
    return this.customers().find((customer) => customer.customerId === order.customerId);
  }

  protected productName(productId: number): string {
    return this.products().find((product) => product.productId === productId)?.productName ?? `Product ${productId}`;
  }

  protected productHsn(productId: number): string {
    return this.products().find((product) => product.productId === productId)?.hsnSacCode ?? '';
  }

  protected lineDiscount(item: SalesOrderItem): number {
    return Number(item.discount ?? 0);
  }

  protected lineAmount(item: SalesOrderItem): number {
    return this.roundMoney(Number(item.totalAmount ?? 0));
  }

  protected subtotal(): number {
    const order = this.order();
    if (!order) {
      return 0;
    }
    return this.roundMoney(order.items.reduce((sum, item) => sum + this.lineAmount(item), 0));
  }

  protected cgstTotal(): number {
    return this.taxSplit().cgst;
  }

  protected sgstTotal(): number {
    return this.taxSplit().sgst;
  }

  protected roundOff(): number {
    return this.roundMoney(this.roundedTotal() - this.grossBeforeRound());
  }

  protected roundedTotal(): number {
    return Math.round(this.grossBeforeRound());
  }

  protected orderDiscount(): number {
    return Number(this.order()?.cashDiscount ?? 0);
  }

  protected print(): void {
    const order = this.order();
    if (!order) {
      return;
    }
    const previousTitle = document.title;
    document.title = `Sales invoice ${order.invoiceNumber}`;
    document.body.classList.add('printing-bill');
    const cleanup = () => {
      document.body.classList.remove('printing-bill');
      document.title = previousTitle;
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
  }

  protected askDelete(): void {
    this.confirmDelete.set(true);
  }

  protected cancelDelete(): void {
    this.confirmDelete.set(false);
  }

  protected deleteOrder(): void {
    const order = this.order();
    if (!order) {
      return;
    }
    this.deleting.set(true);
    this.error.set(null);
    this.salesOrdersApi.deleteSalesOrder(order.id).subscribe({
      next: () => {
        void this.router.navigate(['/sales/orders']);
      },
      error: (error: HttpErrorResponse) => {
        this.deleting.set(false);
        this.error.set(this.errorMessage(error, 'Could not delete the sales order.'));
      },
    });
  }

  private taxSplit(): { cgst: number; sgst: number } {
    const order = this.order();
    if (!order) {
      return { cgst: 0, sgst: 0 };
    }
    let cgst = 0;
    let sgst = 0;
    for (const item of order.items) {
      const gst = this.roundMoney((this.lineAmount(item) * Number(item.gstPercent ?? 0)) / 100);
      const half = this.roundMoney(gst / 2);
      cgst += half;
      sgst += this.roundMoney(gst - half);
    }
    return { cgst: this.roundMoney(cgst), sgst: this.roundMoney(sgst) };
  }

  private grossBeforeRound(): number {
    return this.roundMoney(this.subtotal() + this.cgstTotal() + this.sgstTotal());
  }

  private roundMoney(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private errorMessage(error: HttpErrorResponse, fallback: string): string {
    if (typeof error.error === 'string' && error.error.trim()) {
      return error.error;
    }
    if (error.error && typeof error.error === 'object' && 'message' in error.error) {
      const message = error.error.message;
      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }
    return fallback;
  }
}
