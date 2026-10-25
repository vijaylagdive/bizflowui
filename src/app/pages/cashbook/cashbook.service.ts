import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CashbookEntry, CreateCashbookRequest } from './cashbook.model';

@Injectable({ providedIn: 'root' })
export class CashbookService {
  private readonly http = inject(HttpClient);

  getCashbooks(): Observable<CashbookEntry[]> {
    return this.http.get<CashbookEntry[]>('/api/cashbooks');
  }

  createCashbook(entry: CreateCashbookRequest): Observable<CashbookEntry> {
    return this.http.post<CashbookEntry>('/api/cashbooks', entry);
  }

  updateCashbook(id: number, entry: CreateCashbookRequest): Observable<CashbookEntry> {
    return this.http.put<CashbookEntry>(`/api/cashbooks/${id}`, entry);
  }

  deleteCashbook(id: number): Observable<void> {
    return this.http.delete<void>(`/api/cashbooks/${id}`);
  }
}
