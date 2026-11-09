export interface CreatePurchaseOrderItem {
  productId: number;
  qty: number;
  unit: string;
  rate: number;
  discount: number;
  gstPercent: number;
  totalAmount: number;
}

export interface CreatePurchaseOrderRequest {
  purchaseDate: string;
  invoiceNumber: string;
  vendorId: number;
  vendorName: string;
  cashDiscount: number;
  purchaseTotalAmount: number;
  cgst: number;
  sgst: number;
  items: CreatePurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: number;
  productId: number;
  purchaseOrderId: number;
  qty: number;
  rate: number;
  discount?: number;
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
  cgst?: number;
  sgst?: number;
  items: PurchaseOrderItem[];
  createdAt: string;
  updatedAt: string;
}
