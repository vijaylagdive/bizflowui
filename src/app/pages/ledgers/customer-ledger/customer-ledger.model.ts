export interface CustomerLedgerEntry {
  id: number;
  customerId: number;
  customerName: string;
  salesOrderId: number;
  saleOrderNo: string;
  type: string;
  date: string;
  debit: number;
  credit: number;
  balance: number;
}
