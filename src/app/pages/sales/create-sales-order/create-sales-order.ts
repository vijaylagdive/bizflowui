import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Customer } from '../../customers/customer.model';
import { CustomerService } from '../../customers/customer.service';
import { InventoryService } from '../../inventory/inventory.service';
import { StockItem } from '../../inventory/stock.model';
import { Product } from '../../products/product.model';
import { ProductService } from '../../products/product.service';
import { Unit } from '../../units/unit.model';
import { UnitService } from '../../units/unit.service';
import { CreateSalesOrderRequest, SalesOrder } from '../sales-orders/sales-order.model';
import { SalesOrderService } from '../sales-orders/sales-order.service';

@Component({
  selector: 'app-create-sales-order',
  imports: [ReactiveFormsModule, DecimalPipe],
  templateUrl: './create-sales-order.html',
  styleUrl: './create-sales-order.scss',
})
export class CreateSalesOrder implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly salesOrdersApi = inject(SalesOrderService);
  private readonly customersApi = inject(CustomerService);
  private readonly productsApi = inject(ProductService);
  private readonly unitsApi = inject(UnitService);
  private readonly inventoryApi = inject(InventoryService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly customers = signal<Customer[]>([]);
  protected readonly products = signal<Product[]>([]);
  protected readonly units = signal<Unit[]>([]);
  protected readonly stock = signal<StockItem[]>([]);
  private readonly reservedQty = signal<ReadonlyMap<string, number>>(new Map());
  protected readonly loadingCustomers = signal(true);
  protected readonly loadingProducts = signal(true);
  protected readonly loadingUnits = signal(true);
  protected readonly loadingStock = signal(true);
  protected readonly saving = signal(false);
  protected readonly loadingOrder = signal(false);
  protected readonly editingId = signal<number | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.formBuilder.group({
    salesDate: [this.today(), Validators.required],
    invoiceNumber: ['', Validators.required],
    customerId: [null as number | null, Validators.required],
    cashDiscount: [0, [Validators.required, Validators.min(0)]],
    items: this.formBuilder.array([this.createItem()]),
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (Number.isInteger(id) && id > 0) {
      this.editingId.set(id);
      this.loadingOrder.set(true);
      this.salesOrdersApi.getSalesOrder(id).subscribe({
        next: (order) => {
          this.fillForm(order);
          this.loadingOrder.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.error.set(this.errorMessage(error, 'Could not load the sales order.'));
          this.loadingOrder.set(false);
        },
      });
    }

    this.customersApi.getCustomers().subscribe({
      next: (customers) => {
        this.customers.set(customers);
        this.loadingCustomers.set(false);
      },
      error: () => {
        this.error.set('Could not load customers.');
        this.loadingCustomers.set(false);
      },
    });
    this.productsApi.getProducts().subscribe({
      next: (products) => {
        this.products.set(products);
        this.loadingProducts.set(false);
      },
      error: () => {
        this.error.set('Could not load products.');
        this.loadingProducts.set(false);
      },
    });
    this.unitsApi.getUnits().subscribe({
      next: (units) => {
        this.units.set(units);
        this.loadingUnits.set(false);
      },
      error: () => {
        this.error.set('Could not load units.');
        this.loadingUnits.set(false);
      },
    });
    this.inventoryApi.getStock().subscribe({
      next: (stock) => {
        this.stock.set(stock);
        this.loadingStock.set(false);
      },
      error: () => {
        this.error.set('Could not load inventory.');
        this.loadingStock.set(false);
      },
    });
  }

  protected get items(): FormArray {
    return this.form.controls.items;
  }

  protected addItem(): void {
    if (!this.canAddItem()) {
      return;
    }
    this.items.push(this.createItem());
  }

  protected canAddItem(): boolean {
    const lastItem = this.items.at(this.items.length - 1);
    return lastItem?.valid ?? false;
  }

  protected removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items.removeAt(index);
    }
  }

  protected lineAmount(index: number): number {
    const item = this.items.at(index).getRawValue();
    const base = Number(item.qty ?? 0) * Number(item.rate ?? 0);
    return base + base * (Number(item.gst ?? 0) / 100);
  }

  protected orderTotal(): number {
    const lines = this.items.controls.reduce((sum, _, index) => sum + this.lineAmount(index), 0);
    return lines - Number(this.form.controls.cashDiscount.value ?? 0);
  }

  protected itemProductId(item: AbstractControl): number | null {
    const value = item.get('productId')?.value;
    return value === null || value === undefined || value === '' ? null : Number(value);
  }

  protected itemUnit(item: AbstractControl): string | null {
    const value = item.get('unit')?.value;
    return typeof value === 'string' && value.trim() ? value : null;
  }

  protected knownProduct(productId: number | null): boolean {
    return this.products().some((product) => product.productId === productId);
  }

  protected knownUnit(unitName: string | null): boolean {
    return this.units().some((unit) => unit.unitName === unitName);
  }

  protected lineStockMessage(index: number): string | null {
    const item = this.items.at(index);
    const productId = this.itemProductId(item);
    const unit = this.itemUnit(item);
    if (productId === null || !unit) {
      return null;
    }
    return this.stockErrors().find((entry) => entry.productId === productId && entry.unit === unit)?.message ?? null;
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.loadingStock()) {
      this.error.set('Stock is still loading. Try again in a moment.');
      return;
    }

    const stockErrors = this.stockErrors();
    if (stockErrors.length > 0) {
      this.error.set(stockErrors.map((entry) => entry.message).join(' '));
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    const editingId = this.editingId();
    const request =
      editingId === null
        ? this.salesOrdersApi.createSalesOrder(this.requestBody())
        : this.salesOrdersApi.updateSalesOrder(editingId, this.requestBody());
    request.subscribe({
      next: () => {
        void this.router.navigate(['/sales/orders']);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(
          this.errorMessage(
            error,
            editingId === null ? 'Could not create the sales order.' : 'Could not update the sales order.',
          ),
        );
        this.saving.set(false);
      },
    });
  }

  private fillForm(order: SalesOrder): void {
    this.form.patchValue({
      salesDate: order.salesDate,
      invoiceNumber: order.invoiceNumber,
      customerId: order.customerId,
      cashDiscount: order.cashDiscount,
    });
    this.items.clear();
    for (const item of order.items) {
      const group = this.createItem();
      group.setValue({
        productId: item.productId,
        qty: item.qty,
        unit: item.unit,
        rate: item.rate,
        gst: item.gstPercent,
      });
      this.items.push(group);
    }
    if (this.items.length === 0) {
      this.items.push(this.createItem());
    }
    this.reservedQty.set(this.quantityByProduct(order.items));
  }

  private stockErrors(): { productId: number; unit: string; message: string }[] {
    const requested = new Map<string, { productId: number; unit: string; qty: number }>();
    for (const item of this.items.controls) {
      const productId = this.itemProductId(item);
      const unit = this.itemUnit(item);
      const qty = Number(item.get('qty')?.value);
      if (productId === null || !unit || !Number.isFinite(qty) || qty <= 0) {
        continue;
      }
      const key = this.stockKey(productId, unit);
      const current = requested.get(key);
      if (current) {
        current.qty += qty;
      } else {
        requested.set(key, { productId, unit, qty });
      }
    }

    const errors: { productId: number; unit: string; message: string }[] = [];
    for (const entry of requested.values()) {
      const available = this.availableQty(entry.productId, entry.unit);
      if (entry.qty > available) {
        const name =
          this.products().find((product) => product.productId === entry.productId)?.productName ??
          this.stock().find((row) => row.productId === entry.productId)?.productName ??
          `Product ${entry.productId}`;
        const requestedQty = this.formatQty(entry.qty);
        const message =
          available <= 0
            ? `${name} (${entry.unit}) is out of stock. Entered quantity is ${requestedQty}.`
            : `${name} (${entry.unit}) has only ${this.formatQty(available)} in stock, which is less than the entered quantity ${requestedQty}.`;
        errors.push({
          productId: entry.productId,
          unit: entry.unit,
          message,
        });
      }
    }
    return errors;
  }

  private availableQty(productId: number, unit: string): number {
    const onHand =
      this.stock().find((row) => row.productId === productId && row.unit === unit)?.currentStock ?? 0;
    return onHand + (this.reservedQty().get(this.stockKey(productId, unit)) ?? 0);
  }

  private quantityByProduct(items: { productId: number; unit: string; qty: number }[]): Map<string, number> {
    const quantities = new Map<string, number>();
    for (const item of items) {
      const key = this.stockKey(item.productId, item.unit);
      quantities.set(key, (quantities.get(key) ?? 0) + Number(item.qty));
    }
    return quantities;
  }

  private stockKey(productId: number, unit: string): string {
    return `${productId}|${unit.trim()}`;
  }

  private formatQty(value: number): string {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 3 }).format(value);
  }

  private createItem() {
    return this.formBuilder.group({
      productId: [null as number | null, [Validators.required, Validators.min(1)]],
      qty: [null as number | null, [Validators.required, Validators.min(0.001)]],
      unit: [null as string | null, Validators.required],
      rate: [null as number | null, [Validators.required, Validators.min(0)]],
      gst: [null as number | null, [Validators.required, Validators.min(0)]],
    });
  }

  private requestBody(): CreateSalesOrderRequest {
    const value = this.form.getRawValue();
    const customer = this.customers().find((entry) => entry.customerId === Number(value.customerId));
    return {
      salesDate: value.salesDate ?? '',
      invoiceNumber: value.invoiceNumber?.trim() ?? '',
      customerId: Number(value.customerId),
      customerName: customer?.name ?? '',
      cashDiscount: Number(value.cashDiscount),
      items: value.items.map((item) => ({
        productId: Number(item.productId),
        qty: Number(item.qty),
        unit: item.unit?.trim() ?? '',
        rate: Number(item.rate),
        gstPercent: Number(item.gst),
      })),
    };
  }

  private today(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
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
