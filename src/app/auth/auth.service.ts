import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AuthUser, LoginRequest } from './auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  readonly user = signal<AuthUser | null>(null);

  login(credentials: LoginRequest): Observable<AuthUser> {
    return this.http
      .post<AuthUser>('/api/auth/login', credentials, { withCredentials: true })
      .pipe(tap((user) => this.user.set(user)));
  }

  logout(): Observable<void> {
    return this.http
      .post<void>('/api/auth/logout', {}, { withCredentials: true })
      .pipe(tap(() => this.user.set(null)));
  }

  currentUser(): Observable<AuthUser> {
    return this.http
      .get<AuthUser>('/api/auth/me', { withCredentials: true })
      .pipe(tap((user) => this.user.set(user)));
  }

  clear(): void {
    this.user.set(null);
  }
}
