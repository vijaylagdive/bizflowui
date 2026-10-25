export interface Account {
  accountId: number;
  accountType: string;
  accountName: string;
}

export interface CreateAccountRequest {
  accountName: string;
  accountType: string;
}
