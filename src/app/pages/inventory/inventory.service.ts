import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { StockItem } from './stock.model';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly http = inject(HttpClient);

  getStock(): Observable<StockItem[]> {
    return this.http.get<StockItem[]>('/api/inventory');
  }
}
