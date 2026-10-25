import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateProductRequest, Product } from './product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>('/api/products');
  }

  createProduct(product: CreateProductRequest): Observable<Product> {
    return this.http.post<Product>('/api/products', product);
  }

  updateProduct(productId: number, product: CreateProductRequest): Observable<Product> {
    return this.http.put<Product>(`/api/products/${productId}`, product);
  }

  deleteProduct(productId: number): Observable<void> {
    return this.http.delete<void>(`/api/products/${productId}`);
  }
}
