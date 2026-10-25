import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateUnitRequest, Unit } from './unit.model';

@Injectable({ providedIn: 'root' })
export class UnitService {
  private readonly http = inject(HttpClient);

  getUnits(): Observable<Unit[]> {
    return this.http.get<Unit[]>('/api/units');
  }

  createUnit(unit: CreateUnitRequest): Observable<Unit> {
    return this.http.post<Unit>('/api/units', unit);
  }

  updateUnit(unitId: number, unit: CreateUnitRequest): Observable<Unit> {
    return this.http.put<Unit>(`/api/units/${unitId}`, unit);
  }

  deleteUnit(unitId: number): Observable<void> {
    return this.http.delete<void>(`/api/units/${unitId}`);
  }
}
