import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ListQuery, PageResult, listParams, readPage } from '../../../shared/list-page';
import { CreatePurchaseOrderRequest, PurchaseOrder } from './purchase-order.model';

@Injectable({ providedIn: 'root' })
export class PurchaseOrderService {
  private readonly http = inject(HttpClient);

  getPurchaseOrders(query: ListQuery): Observable<PageResult<PurchaseOrder>> {
    return this.http
      .get<unknown>('/purchase-orders', { params: listParams(query) })
      .pipe(map((body) => readPage<PurchaseOrder>(body)));
  }

  getPurchaseOrder(id: number): Observable<PurchaseOrder> {
    return this.http.get<PurchaseOrder>(`/purchase-orders/${id}`);
  }

  createPurchaseOrder(order: CreatePurchaseOrderRequest): Observable<PurchaseOrder> {
    return this.http.post<PurchaseOrder>('/purchase-orders', order);
  }

  updatePurchaseOrder(id: number, order: CreatePurchaseOrderRequest): Observable<PurchaseOrder> {
    return this.http.put<PurchaseOrder>(`/purchase-orders/${id}`, order);
  }

  deletePurchaseOrder(id: number): Observable<void> {
    return this.http.delete<void>(`/purchase-orders/${id}`);
  }
}
