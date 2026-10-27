import { isDevMode } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';

/** Spring API. Used by the deployed UI. Local `ng serve` still uses proxy.conf.json. */
export const API_ORIGIN = 'https://bizflow-y57h.onrender.com';

export const apiBaseInterceptor: HttpInterceptorFn = (req, next) => {
  if (isDevMode() || /^https?:\/\//.test(req.url)) {
    return next(req);
  }

  let path = req.url;
  if (path.startsWith('/api/')) {
    path = path.slice('/api'.length);
  } else if (!path.startsWith('/purchase-orders')) {
    return next(req);
  }

  return next(req.clone({ url: `${API_ORIGIN}${path}` }));
};
