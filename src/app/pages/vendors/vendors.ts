import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Vendor } from './vendor.model';
import { VendorService } from './vendor.service';

@Component({
  selector: 'app-vendors',
  imports: [ReactiveFormsModule, DecimalPipe],
  templateUrl: './vendors.html',
  styleUrl: './vendors.scss',
})
export class Vendors implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly vendorsApi = inject(VendorService);

  protected readonly vendors = signal<Vendor[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly showForm = signal(false);
  protected readonly editingId = signal<number | null>(null);
  protected readonly pendingDeleteId = signal<number | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    contactNumber: ['', Validators.required],
    address: ['', Validators.required],
  });

  ngOnInit(): void {
    this.loadVendors();
  }

  protected openForm(): void {
    this.editingId.set(null);
    this.form.reset();
    this.error.set(null);
    this.showForm.set(true);
  }

  protected edit(vendor: Vendor): void {
    this.editingId.set(vendor.vendorId);
    this.pendingDeleteId.set(null);
    this.form.setValue({
      name: vendor.name,
      contactNumber: vendor.contactNumber,
      address: vendor.address,
    });
    this.error.set(null);
    this.showForm.set(true);
  }

  protected cancel(): void {
    this.form.reset();
    this.editingId.set(null);
    this.showForm.set(false);
  }

  protected askDelete(vendorId: number): void {
    this.pendingDeleteId.set(vendorId);
  }

  protected cancelDelete(): void {
    this.pendingDeleteId.set(null);
  }

  protected confirmDelete(vendor: Vendor): void {
    this.saving.set(true);
    this.error.set(null);
    this.vendorsApi.deleteVendor(vendor.vendorId).subscribe({
      next: () => {
        if (this.editingId() === vendor.vendorId) {
          this.cancel();
        }
        this.pendingDeleteId.set(null);
        this.saving.set(false);
        this.loadVendors();
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(this.errorMessage(error, 'Could not delete the vendor.'));
        this.saving.set(false);
      },
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const vendor = {
      name: value.name.trim(),
      contactNumber: value.contactNumber.trim(),
      address: value.address.trim(),
    };
    const editingId = this.editingId();
    const request =
      editingId === null
        ? this.vendorsApi.createVendor(vendor)
        : this.vendorsApi.updateVendor(editingId, vendor);
    this.saving.set(true);
    this.error.set(null);
    request.subscribe({
      next: () => {
        this.cancel();
        this.saving.set(false);
        this.loadVendors();
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(
          this.errorMessage(error, editingId === null ? 'Could not add the vendor.' : 'Could not update the vendor.'),
        );
        this.saving.set(false);
      },
    });
  }

  private loadVendors(): void {
    this.loading.set(true);
    this.vendorsApi.getVendors().subscribe({
      next: (vendors) => {
        this.vendors.set(vendors);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load vendors.');
        this.loading.set(false);
      },
    });
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
