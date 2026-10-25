import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateVendorRequest, Vendor } from './vendor.model';

@Injectable({ providedIn: 'root' })
export class VendorService {
  private readonly http = inject(HttpClient);

  getVendors(): Observable<Vendor[]> {
    return this.http.get<Vendor[]>('/api/vendors');
  }

  createVendor(vendor: CreateVendorRequest): Observable<Vendor> {
    return this.http.post<Vendor>('/api/vendors', vendor);
  }

  updateVendor(vendorId: number, vendor: CreateVendorRequest): Observable<Vendor> {
    return this.http.put<Vendor>(`/api/vendors/${vendorId}`, vendor);
  }

  deleteVendor(vendorId: number): Observable<void> {
    return this.http.delete<void>(`/api/vendors/${vendorId}`);
  }
}
