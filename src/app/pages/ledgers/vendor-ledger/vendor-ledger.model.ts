export interface VendorLedgerEntry {
  id: number;
  vendorId: number;
  vendorName: string;
  purchaseOrderId: number;
  type: string;
  date: string;
  debit: number;
  credit: number;
  balance: number;
}
