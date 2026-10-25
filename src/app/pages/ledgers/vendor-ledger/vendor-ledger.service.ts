import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { VendorLedgerEntry } from './vendor-ledger.model';

@Injectable({ providedIn: 'root' })
export class VendorLedgerService {
  private readonly http = inject(HttpClient);

  getVendorLedgers(): Observable<VendorLedgerEntry[]> {
    return this.http.get<VendorLedgerEntry[]>('/api/vendor-ledgers');
  }
}
