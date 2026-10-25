import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Customer } from './customer.model';
import { CustomerService } from './customer.service';

@Component({
  selector: 'app-customers',
  imports: [ReactiveFormsModule, DecimalPipe],
  templateUrl: './customers.html',
  styleUrl: './customers.scss',
})
export class Customers implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly customersApi = inject(CustomerService);

  protected readonly customers = signal<Customer[]>([]);
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
    this.loadCustomers();
  }

  protected openForm(): void {
    this.editingId.set(null);
    this.form.reset();
    this.error.set(null);
    this.showForm.set(true);
  }

  protected edit(customer: Customer): void {
    this.editingId.set(customer.customerId);
    this.pendingDeleteId.set(null);
    this.form.setValue({
      name: customer.name,
      contactNumber: customer.contactNumber,
      address: customer.address,
    });
    this.error.set(null);
    this.showForm.set(true);
  }

  protected cancel(): void {
    this.form.reset();
    this.editingId.set(null);
    this.showForm.set(false);
  }

  protected askDelete(customerId: number): void {
    this.pendingDeleteId.set(customerId);
  }

  protected cancelDelete(): void {
    this.pendingDeleteId.set(null);
  }

  protected confirmDelete(customer: Customer): void {
    this.saving.set(true);
    this.error.set(null);
    this.customersApi.deleteCustomer(customer.customerId).subscribe({
      next: () => {
        if (this.editingId() === customer.customerId) {
          this.cancel();
        }
        this.pendingDeleteId.set(null);
        this.saving.set(false);
        this.loadCustomers();
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(this.errorMessage(error, 'Could not delete the customer.'));
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
    const customer = {
      name: value.name.trim(),
      contactNumber: value.contactNumber.trim(),
      address: value.address.trim(),
    };
    const editingId = this.editingId();
    const request =
      editingId === null
        ? this.customersApi.createCustomer(customer)
        : this.customersApi.updateCustomer(editingId, customer);
    this.saving.set(true);
    this.error.set(null);
    request.subscribe({
      next: () => {
        this.cancel();
        this.saving.set(false);
        this.loadCustomers();
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(
          this.errorMessage(
            error,
            editingId === null ? 'Could not add the customer.' : 'Could not update the customer.',
          ),
        );
        this.saving.set(false);
      },
    });
  }

  private loadCustomers(): void {
    this.loading.set(true);
    this.customersApi.getCustomers().subscribe({
      next: (customers) => {
        this.customers.set(customers);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load the customers.');
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
