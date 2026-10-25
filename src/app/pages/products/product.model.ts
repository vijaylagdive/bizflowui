export interface Product {
  productId: number;
  productName: string;
  categoryId: number;
  categoryName: string;
}

export interface CreateProductRequest {
  productName: string;
  categoryId: number;
}
