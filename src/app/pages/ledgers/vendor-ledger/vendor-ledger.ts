import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { VendorLedgerEntry } from './vendor-ledger.model';
import { VendorLedgerService } from './vendor-ledger.service';

@Component({
  selector: 'app-vendor-ledger',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './vendor-ledger.html',
  styleUrl: './vendor-ledger.scss',
})
export class VendorLedger implements OnInit {
  private readonly vendorLedgersApi = inject(VendorLedgerService);

  protected readonly entries = signal<VendorLedgerEntry[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.vendorLedgersApi.getVendorLedgers().subscribe({
      next: (entries) => {
        this.entries.set(entries);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load vendor ledgers.');
        this.loading.set(false);
      },
    });
  }
}
