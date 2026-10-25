export interface Vendor {
  vendorId: number;
  name: string;
  contactNumber: string;
  address: string;
  currentBalance: number;
}

export interface CreateVendorRequest {
  name: string;
  contactNumber: string;
  address: string;
}
