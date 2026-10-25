import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Account, CreateAccountRequest } from './account.model';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly http = inject(HttpClient);

  getAccounts(): Observable<Account[]> {
    return this.http.get<Account[]>('/api/accounts');
  }

  createAccount(account: CreateAccountRequest): Observable<Account> {
    return this.http.post<Account>('/api/accounts', account);
  }

  updateAccount(accountId: number, account: CreateAccountRequest): Observable<Account> {
    return this.http.put<Account>(`/api/accounts/${accountId}`, account);
  }

  deleteAccount(accountId: number): Observable<void> {
    return this.http.delete<void>(`/api/accounts/${accountId}`);
  }
}
