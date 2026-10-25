import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { CustomerLedgerEntry } from './customer-ledger.model';
import { CustomerLedgerService } from './customer-ledger.service';

@Component({
  selector: 'app-customer-ledger',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './customer-ledger.html',
  styleUrl: './customer-ledger.scss',
})
export class CustomerLedger implements OnInit {
  private readonly customerLedgersApi = inject(CustomerLedgerService);

  protected readonly entries = signal<CustomerLedgerEntry[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.customerLedgersApi.getCustomerLedgers().subscribe({
      next: (entries) => {
        this.entries.set(entries);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load the customer ledger.');
        this.loading.set(false);
      },
    });
  }
}
