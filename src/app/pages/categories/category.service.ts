import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Category, CreateCategoryRequest } from './category.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>('/api/product-categories');
  }

  createCategory(category: CreateCategoryRequest): Observable<Category> {
    return this.http.post<Category>('/api/product-categories', category);
  }

  updateCategory(categoryId: number, category: CreateCategoryRequest): Observable<Category> {
    return this.http.put<Category>(`/api/product-categories/${categoryId}`, category);
  }

  deleteCategory(categoryId: number): Observable<void> {
    return this.http.delete<void>(`/api/product-categories/${categoryId}`);
  }
}
