import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ListQuery, PageResult, listParams, readPage } from '../../shared/list-page';
import { CashbookEntry, CreateCashbookRequest } from './cashbook.model';

@Injectable({ providedIn: 'root' })
export class CashbookService {
  private readonly http = inject(HttpClient);

  getCashbooks(query: ListQuery): Observable<PageResult<CashbookEntry>> {
    return this.http
      .get<unknown>('/api/cashbooks', { params: listParams(query) })
      .pipe(map((body) => readPage<CashbookEntry>(body)));
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
