export interface Product {
  productId: number;
  productName: string;
  hsnSacCode: string;
  categoryId: number;
  categoryName: string;
  gstPercent: number;
}

export interface CreateProductRequest {
  productName: string;
  categoryId: number;
  hsnSacCode: string;
}