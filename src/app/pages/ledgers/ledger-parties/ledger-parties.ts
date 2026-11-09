import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { VendorLedgerService } from '../vendor-ledger/vendor-ledger.service';
import { CustomerLedgerService } from '../customer-ledger/customer-ledger.service';

interface PartyRow {
  id: number;
  name: string;
  currentBalance: number;
}

@Component({
  selector: 'app-ledger-parties',
  imports: [DecimalPipe, RouterLink],
  templateUrl: './ledger-parties.html',
  styleUrl: './ledger-parties.scss',
})
export class LedgerParties {
  private readonly route = inject(ActivatedRoute);
  private readonly vendorsApi = inject(VendorLedgerService);
  private readonly customersApi = inject(CustomerLedgerService);

  protected readonly party = signal<'vendor' | 'customer'>('vendor');
  protected readonly parties = signal<PartyRow[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  private loadId = 0;

  constructor() {
    this.route.data.pipe(takeUntilDestroyed()).subscribe((data) => {
      const party = data['party'] === 'customer' ? 'customer' : 'vendor';
      this.party.set(party);
      this.load(party);
    });
  }

  private load(party: 'vendor' | 'customer'): void {
    const loadId = ++this.loadId;
    this.loading.set(true);
    this.error.set(null);
    if (party === 'vendor') {
      this.vendorsApi.getVendorLedgers().subscribe({
        next: (vendors) => {
          if (loadId !== this.loadId) {
            return;
          }
          this.parties.set(
            vendors.map((vendor) => ({
              id: vendor.vendorId,
              name: vendor.vendorName,
              currentBalance: vendor.balance,
            })),
          );
          this.loading.set(false);
        },
        error: () => {
          if (loadId !== this.loadId) {
            return;
          }
          this.error.set('Could not load vendors.');
          this.loading.set(false);
        },
      });
      return;
    }

    this.customersApi.getCustomerLedgers().subscribe({
      next: (customers) => {
        if (loadId !== this.loadId) {
          return;
        }
        this.parties.set(
          customers.map((customer) => ({
            id: customer.customerId,
            name: customer.customerName,
            currentBalance: customer.balance,
          })),
        );
        this.loading.set(false);
      },
      error: () => {
        if (loadId !== this.loadId) {
          return;
        }
        this.error.set('Could not load customers.');
        this.loading.set(false);
      },
    });
  }
}
