import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CustomerLedgerEntry } from './customer-ledger.model';

@Injectable({ providedIn: 'root' })
export class CustomerLedgerService {
  private readonly http = inject(HttpClient);

  getCustomerLedgers(): Observable<CustomerLedgerEntry[]> {
    return this.http.get<CustomerLedgerEntry[]>('/api/customer-ledgers');
  }
}
