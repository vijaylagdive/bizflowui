import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CustomerService } from '../../customers/customer.service';
import { VendorService } from '../../vendors/vendor.service';

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
  private readonly vendorsApi = inject(VendorService);
  private readonly customersApi = inject(CustomerService);

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
      this.vendorsApi.getVendors().subscribe({
        next: (vendors) => {
          if (loadId !== this.loadId) {
            return;
          }
          this.parties.set(
            vendors.map((vendor) => ({
              id: vendor.vendorId,
              name: vendor.name,
              currentBalance: vendor.currentBalance,
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

    this.customersApi.getCustomers().subscribe({
      next: (customers) => {
        if (loadId !== this.loadId) {
          return;
        }
        this.parties.set(
          customers.map((customer) => ({
            id: customer.customerId,
            name: customer.name,
            currentBalance: customer.currentBalance,
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
