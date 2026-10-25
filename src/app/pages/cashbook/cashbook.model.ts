export interface CashbookEntry {
  id: number;
  date: string;
  transactionType: string;
  accountId: number;
  account: string;
  fromTo: string;
  partyId: number | null;
  amount: number;
  balance: number;
  remark: string;
}

export interface CreateCashbookRequest {
  date: string;
  transactionType: string;
  accountId: number;
  fromTo: string;
  partyId: number | null;
  amount: number;
  remark: string;
}
