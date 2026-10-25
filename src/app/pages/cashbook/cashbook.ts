import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Account } from '../accounts/account.model';
import { AccountService } from '../accounts/account.service';
import { Customer } from '../customers/customer.model';
import { CustomerService } from '../customers/customer.service';
import { Vendor } from '../vendors/vendor.model';
import { VendorService } from '../vendors/vendor.service';
import { CashbookEntry } from './cashbook.model';
import { CashbookService } from './cashbook.service';

interface PartyOption {
  value: string;
  label: string;
  partyId: number | null;
}

@Component({
  selector: 'app-cashbook',
  imports: [ReactiveFormsModule, DatePipe, DecimalPipe],
  templateUrl: './cashbook.html',
  styleUrl: './cashbook.scss',
})
export class Cashbook implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly cashbooksApi = inject(CashbookService);
  private readonly accountsApi = inject(AccountService);
  private readonly customersApi = inject(CustomerService);
  private readonly vendorsApi = inject(VendorService);

  protected readonly entries = signal<CashbookEntry[]>([]);
  protected readonly accounts = signal<Account[]>([]);
  protected readonly customers = signal<Customer[]>([]);
  protected readonly vendors = signal<Vendor[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadingAccounts = signal(true);
  protected readonly saving = signal(false);
  protected readonly showForm = signal(false);
  protected readonly editingId = signal<number | null>(null);
  protected readonly pendingDeleteId = signal<number | null>(null);
  protected readonly error = signal<string | null>(null);
  private suppressPartyReset = false;

  protected readonly form = this.formBuilder.group({
    date: [this.today(), Validators.required],
    transactionType: ['receipt', Validators.required],
    accountId: [null as number | null, Validators.required],
    fromTo: [null as string | null, Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    remark: ['', Validators.required],
  });

  constructor() {
    this.form.controls.transactionType.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      if (this.suppressPartyReset) {
        return;
      }
      this.form.controls.fromTo.setValue(null);
    });
  }

  ngOnInit(): void {
    this.loadEntries();
    this.accountsApi.getAccounts().subscribe({
      next: (accounts) => {
        this.accounts.set(accounts);
        this.loadingAccounts.set(false);
      },
      error: () => {
        this.error.set('Could not load accounts.');
        this.loadingAccounts.set(false);
      },
    });
    this.customersApi.getCustomers().subscribe({
      next: (customers) => this.customers.set(customers),
      error: () => this.error.set('Could not load customers.'),
    });
    this.vendorsApi.getVendors().subscribe({
      next: (vendors) => this.vendors.set(vendors),
      error: () => this.error.set('Could not load vendors.'),
    });
  }

  protected partyOptions(): PartyOption[] {
    const parties =
      this.form.controls.transactionType.value === 'payment'
        ? this.vendors().map((vendor) => ({
            value: `vendor:${vendor.vendorId}`,
            label: vendor.name,
            partyId: vendor.vendorId,
          }))
        : this.customers().map((customer) => ({
            value: `customer:${customer.customerId}`,
            label: customer.name,
            partyId: customer.customerId,
          }));
    return [...parties, { value: 'other', label: 'Other', partyId: null }];
  }

  protected openForm(): void {
    this.editingId.set(null);
    this.pendingDeleteId.set(null);
    this.form.reset({
      date: this.today(),
      transactionType: 'receipt',
      accountId: null,
      fromTo: null,
      amount: null,
      remark: '',
    });
    this.error.set(null);
    this.showForm.set(true);
  }

  protected edit(entry: CashbookEntry): void {
    const transactionType = entry.transactionType.toLowerCase() === 'payment' ? 'payment' : 'receipt';
    const fromTo =
      entry.partyId == null
        ? 'other'
        : transactionType === 'payment'
          ? `vendor:${entry.partyId}`
          : `customer:${entry.partyId}`;
    this.editingId.set(entry.id);
    this.pendingDeleteId.set(null);
    this.suppressPartyReset = true;
    this.form.reset({
      date: entry.date.slice(0, 10),
      transactionType,
      accountId: entry.accountId,
      fromTo,
      amount: entry.amount,
      remark: entry.remark,
    });
    this.suppressPartyReset = false;
    this.error.set(null);
    this.showForm.set(true);
  }

  protected cancel(): void {
    this.editingId.set(null);
    this.showForm.set(false);
  }

  protected askDelete(id: number): void {
    this.pendingDeleteId.set(id);
  }

  protected cancelDelete(): void {
    this.pendingDeleteId.set(null);
  }

  protected confirmDelete(entry: CashbookEntry): void {
    this.saving.set(true);
    this.error.set(null);
    this.cashbooksApi.deleteCashbook(entry.id).subscribe({
      next: () => {
        if (this.editingId() === entry.id) {
          this.cancel();
        }
        this.pendingDeleteId.set(null);
        this.saving.set(false);
        this.loadEntries();
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(this.errorMessage(error, 'Could not delete the transaction.'));
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
    const party = this.partyOptions().find((option) => option.value === value.fromTo);
    if (!party) {
      this.error.set('Select who the transaction is from or to.');
      return;
    }

    const entry = {
      date: value.date ?? '',
      transactionType: value.transactionType ?? 'receipt',
      accountId: Number(value.accountId),
      fromTo: party.partyId === null ? 'Other' : party.label,
      partyId: party.partyId,
      amount: Number(value.amount),
      remark: value.remark?.trim() ?? '',
    };
    const editingId = this.editingId();
    const request =
      editingId === null
        ? this.cashbooksApi.createCashbook(entry)
        : this.cashbooksApi.updateCashbook(editingId, entry);
    this.saving.set(true);
    this.error.set(null);
    request.subscribe({
      next: () => {
        this.cancel();
        this.saving.set(false);
        this.loadEntries();
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(
          this.errorMessage(
            error,
            editingId === null ? 'Could not save the transaction.' : 'Could not update the transaction.',
          ),
        );
        this.saving.set(false);
      },
    });
  }

  private loadEntries(): void {
    this.loading.set(true);
    this.cashbooksApi.getCashbooks().subscribe({
      next: (entries) => {
        this.entries.set(entries);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load cashbook transactions.');
        this.loading.set(false);
      },
    });
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
