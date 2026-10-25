import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CreatePurchaseOrderRequest, PurchaseOrder } from '../purchase-orders/purchase-order.model';
import { PurchaseOrderService } from '../purchase-orders/purchase-order.service';
import { Product } from '../../products/product.model';
import { ProductService } from '../../products/product.service';
import { Unit } from '../../units/unit.model';
import { UnitService } from '../../units/unit.service';
import { Vendor } from '../../vendors/vendor.model';
import { VendorService } from '../../vendors/vendor.service';

@Component({
  selector: 'app-create-purchase-order',
  imports: [ReactiveFormsModule, DecimalPipe],
  templateUrl: './create-purchase-order.html',
  styleUrl: './create-purchase-order.scss',
})
export class CreatePurchaseOrder implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly purchaseOrdersApi = inject(PurchaseOrderService);
  private readonly vendorsApi = inject(VendorService);
  private readonly productsApi = inject(ProductService);
  private readonly unitsApi = inject(UnitService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly vendors = signal<Vendor[]>([]);
  protected readonly products = signal<Product[]>([]);
  protected readonly units = signal<Unit[]>([]);
  protected readonly loadingVendors = signal(true);
  protected readonly loadingProducts = signal(true);
  protected readonly loadingUnits = signal(true);
  protected readonly saving = signal(false);
  protected readonly loadingOrder = signal(false);
  protected readonly editingId = signal<number | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.formBuilder.group({
    purchaseDate: [this.today(), Validators.required],
    invoiceNumber: ['', Validators.required],
    vendorId: [null as number | null, Validators.required],
    cashDiscount: [0, Validators.required],
    items: this.formBuilder.array([this.createItem()]),
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (Number.isInteger(id) && id > 0) {
      this.editingId.set(id);
      this.loadingOrder.set(true);
      this.purchaseOrdersApi.getPurchaseOrder(id).subscribe({
        next: (order) => {
          this.fillForm(order);
          this.loadingOrder.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.error.set(this.errorMessage(error, 'Could not load the purchase order.'));
          this.loadingOrder.set(false);
        },
      });
    }

    this.vendorsApi.getVendors().subscribe({
      next: (vendors) => {
        this.vendors.set(vendors);
        this.loadingVendors.set(false);
      },
      error: () => {
        this.error.set('Could not load vendors.');
        this.loadingVendors.set(false);
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
    const gstPercent = Number(item.gst ?? 0);
    return base + base * (gstPercent / 100);
  }

  protected orderTotal(): number {
    let x = this.items.controls.reduce((sum, _, index) => sum + this.lineAmount(index), 0);
    return x - Number(this.form.get('cashDiscount')?.value ?? 0);
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

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    const editingId = this.editingId();
    const request =
      editingId === null
        ? this.purchaseOrdersApi.createPurchaseOrder(this.requestBody())
        : this.purchaseOrdersApi.updatePurchaseOrder(editingId, this.requestBody());
    request.subscribe({
      next: () => {
        void this.router.navigate(['/purchase/orders']);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(
          this.errorMessage(
            error,
            editingId === null
              ? 'Could not create the purchase order.'
              : 'Could not update the purchase order.',
          ),
        );
        this.saving.set(false);
      },
    });
  }

  private fillForm(order: PurchaseOrder): void {
    this.form.patchValue({
      purchaseDate: order.purchaseDate,
      invoiceNumber: order.invoiceNumber,
      vendorId: order.vendorId,
    });
    this.items.clear();
    for (const item of order.items) {
      const group = this.createItem();
      group.setValue({
        productId: item.productId,
        qty: item.qty,
        unit: item.unit,
        rate: item.rate,
        gst: this.gstPercent(item),
      });
      this.items.push(group);
    }
    if (this.items.length === 0) {
      this.items.push(this.createItem());
    }
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

  private gstPercent(item: PurchaseOrder['items'][number]): number {
    const base = Number(item.qty) * Number(item.rate);
    if (!base) {
      return 0;
    }
    return Math.round((item.totalAmount / base - 1) * 10000) / 100;
  }

  private requestBody(): CreatePurchaseOrderRequest {
    const value = this.form.getRawValue();
    const vendor = this.vendors().find((entry) => entry.vendorId === Number(value.vendorId));
    return {
      purchaseDate: value.purchaseDate ?? '',
      invoiceNumber: value.invoiceNumber?.trim() ?? '',
      vendorId: Number(value.vendorId),
      vendorName: vendor?.name ?? '',
      cashDiscount: Number(value.cashDiscount),
      purchaseTotalAmount: this.orderTotal(),
      items: value.items.map((item) => {
        const qty = Number(item.qty);
        const rate = Number(item.rate);
        const base = qty * rate;
        const gstPercent = Number(item.gst);
        const totalAmount = base + base * (Number(item.gst) / 100);
        return {
          productId: Number(item.productId),
          qty,
          unit: item.unit?.trim() ?? '',
          rate,
          gstPercent,
          totalAmount: Math.round(totalAmount * 100) / 100,
        };
      }),
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
