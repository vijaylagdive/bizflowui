import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const injector = inject(Injector);

  return next(req.clone({ withCredentials: true })).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/login')) {
        injector.get(AuthService).clear();
        if (!router.url.startsWith('/login')) {
          void router.navigateByUrl('/login');
        }
      }
      return throwError(() => error);
    }),
  );
};
