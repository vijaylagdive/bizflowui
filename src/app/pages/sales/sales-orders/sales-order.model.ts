export interface CreateSalesOrderItem {
  productId: number;
  qty: number;
  unit: string;
  rate: number;
  gstPercent: number;
}

export interface CreateSalesOrderRequest {
  salesDate: string;
  invoiceNumber: string;
  customerId: number;
  customerName: string;
  cashDiscount: number;
  salesTotalAmount: number;
  items: CreateSalesOrderItem[];
}

export interface SalesOrderItem {
  id: number;
  productId: number;
  salesOrderId: number;
  qty: number;
  unit: string;
  rate: number;
  gstPercent: number;
  totalAmount: number;
}

export interface SalesOrder {
  id: number;
  invoiceNumber: string;
  customerId: number;
  customerName: string;
  salesDate: string;
  cashDiscount: number;
  salesTotalAmount: number;
  items: SalesOrderItem[];
  createdAt: string;
  updatedAt: string;
}
