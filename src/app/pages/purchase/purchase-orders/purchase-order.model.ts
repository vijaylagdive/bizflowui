export interface CreatePurchaseOrderItem {
  productId: number;
  qty: number;
  unit: string;
  rate: number;
  totalAmount: number;
}

export interface CreatePurchaseOrderRequest {
  purchaseDate: string;
  invoiceNumber: string;
  vendorId: number;
  vendorName: string;
  cashDiscount: number;
  purchaseTotalAmount: number;
  items: CreatePurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: number;
  productId: number;
  purchaseOrderId: number;
  qty: number;
  rate: number;
  totalAmount: number;
  unit: string;
}

export interface PurchaseOrder {
  id: number;
  invoiceNumber: string;
  vendorId: number;
  vendorName: string;
  purchaseDate: string;
  cashDiscount: number;
  purchaseTotalAmount: number;
  items: PurchaseOrderItem[];
  createdAt: string;
  updatedAt: string;
}
