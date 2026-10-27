import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { combineLatest, forkJoin, map, of, switchMap } from 'rxjs';
import { CustomerService } from '../../customers/customer.service';
import { VendorService } from '../../vendors/vendor.service';
import { CustomerLedgerService } from '../customer-ledger/customer-ledger.service';
import { VendorLedgerService } from '../vendor-ledger/vendor-ledger.service';

interface LedgerLine {
  id: number;
  date: string;
  type: string;
  reference: string;
  debit: number;
  credit: number;
  balance: number;
}

@Component({
  selector: 'app-ledger-detail',
  imports: [DatePipe, DecimalPipe, RouterLink],
  templateUrl: './ledger-detail.html',
  styleUrl: './ledger-detail.scss',
})
export class LedgerDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly vendorsApi = inject(VendorService);
  private readonly customersApi = inject(CustomerService);
  private readonly vendorLedgersApi = inject(VendorLedgerService);
  private readonly customerLedgersApi = inject(CustomerLedgerService);

  protected readonly party = signal<'vendor' | 'customer'>('vendor');
  protected readonly partyName = signal('');
  protected readonly lines = signal<LedgerLine[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected showDebit(line: LedgerLine): boolean {
    return line.type.trim().toLowerCase() !== 'receipt';
  }

  protected showCredit(line: LedgerLine): boolean {
    return line.type.trim().toLowerCase() !== 'sale';
  }

  constructor() {
    combineLatest([this.route.data, this.route.paramMap])
      .pipe(
        switchMap(([data, params]) => {
          const party = data['party'] === 'customer' ? 'customer' : 'vendor';
          const partyId = Number(params.get('partyId'));
          this.party.set(party);
          this.loading.set(true);
          this.error.set(null);
          this.partyName.set('');
          this.lines.set([]);

          if (!Number.isFinite(partyId)) {
            return of({ name: '', lines: [] as LedgerLine[], invalid: true });
          }

          if (party === 'vendor') {
            return forkJoin({
              vendors: this.vendorsApi.getVendors(),
              entries: this.vendorLedgersApi.getVendorLedgers(),
            }).pipe(
              map(({ vendors, entries }) => ({
                invalid: false,
                name: vendors.find((vendor) => vendor.vendorId === partyId)?.name ?? 'Vendor',
                lines: entries
                  .filter((entry) => entry.vendorId === partyId)
                  .map((entry) => ({
                    id: entry.id,
                    date: entry.date,
                    type: entry.type,
                    reference: entry.purchaseOrderId == null ? '' : String(entry.purchaseOrderId),
                    debit: entry.debit,
                    credit: entry.credit,
                    balance: entry.balance,
                  })),
              })),
            );
          }

          return forkJoin({
            customers: this.customersApi.getCustomers(),
            entries: this.customerLedgersApi.getCustomerLedgers(),
          }).pipe(
            map(({ customers, entries }) => ({
              invalid: false,
              name: customers.find((customer) => customer.customerId === partyId)?.name ?? 'Customer',
              lines: entries
                .filter((entry) => entry.customerId === partyId)
                .map((entry) => ({
                  id: entry.id,
                  date: entry.date,
                  type: entry.type,
                  reference: entry.saleOrderNo,
                  debit: entry.debit,
                  credit: entry.credit,
                  balance: entry.balance,
                })),
            })),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe({
        next: (result) => {
          if (result.invalid) {
            this.error.set('This ledger could not be opened.');
            this.loading.set(false);
            return;
          }
          this.partyName.set(result.name);
          this.lines.set(result.lines);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Could not load the ledger.');
          this.loading.set(false);
        },
      });
  }
}
