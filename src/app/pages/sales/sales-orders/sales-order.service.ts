import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateSalesOrderRequest, SalesOrder } from './sales-order.model';

@Injectable({ providedIn: 'root' })
export class SalesOrderService {
  private readonly http = inject(HttpClient);

  getSalesOrders(): Observable<SalesOrder[]> {
    return this.http.get<SalesOrder[]>('/api/sales-orders');
  }

  getSalesOrder(id: number): Observable<SalesOrder> {
    return this.http.get<SalesOrder>(`/api/sales-orders/${id}`);
  }

  createSalesOrder(order: CreateSalesOrderRequest): Observable<SalesOrder> {
    return this.http.post<SalesOrder>('/api/sales-orders', order);
  }

  updateSalesOrder(id: number, order: CreateSalesOrderRequest): Observable<SalesOrder> {
    return this.http.put<SalesOrder>(`/api/sales-orders/${id}`, order);
  }

  deleteSalesOrder(id: number): Observable<void> {
    return this.http.delete<void>(`/api/sales-orders/${id}`);
  }
}
