export interface Customer {
  customerId: number;
  name: string;
  contactNumber: string;
  address: string;
  currentBalance: number;
}

export interface CreateCustomerRequest {
  name: string;
  contactNumber: string;
  address: string;
}
