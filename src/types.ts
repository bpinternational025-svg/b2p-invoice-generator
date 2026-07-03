export type DocumentType = 'invoice' | 'quotation' | 'work_order';

export type ServiceUnit = 'Days' | 'Hours' | 'Months' | 'Quantity' | 'Fixed';

export interface Company {
  id: string;
  name: string;
  logoUrl?: string;
  letterheadUrl?: string;
  footerUrl?: string;
  signatureUrl?: string; // Signature + Stamp
  qrCodeUrl?: string;
  address: string;
  phone: string;
  mobile: string;
  email: string;
  website: string;
  gstNumber: string;
  pan: string;
  cin?: string;
  currency: string; // e.g. "INR", "USD", "EUR"
  
  // Bank Details
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifsc: string;
  branch: string;
  swift?: string;
  upiId?: string;

  // Settings / Defaults
  terms: string;
  taxRate: number; // default GST rate (e.g. 18)
  showLetterhead: boolean;
  showFooter: boolean;
  showSignature: boolean;
  showBankDetails: boolean;
  showTerms: boolean;
  watermark?: string;
}

export interface Customer {
  id: string;
  name: string;
  companyName?: string;
  address: string;
  gstNumber?: string;
  contactPerson?: string;
  mobile: string;
  email: string;
  notes?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  defaultRate: number;
  unit: ServiceUnit;
}

export interface DocumentItem {
  id: string;
  particulars: string;
  rate: number;
  qty: number;
  total: number;
}

export interface Document {
  id: string;
  type: DocumentType;
  companyId: string;
  customerId: string;
  documentNumber: string;
  date: string;
  dueDate: string; // Due date / Valid until
  referenceNumber?: string;
  subject?: string;
  notes?: string;
  
  // Items
  items: DocumentItem[];

  // Financials
  subtotal: number;
  discount: number; // as flat amount or percentage? We'll support flat amount discount
  additionalCharges: number;
  taxType: 'None' | 'GST';
  gstType: 'CGST_SGST' | 'IGST' | 'Custom';
  customGstRate?: number; // custom GST percentage
  taxAmount: number;
  grandTotal: number;
  amountInWords: string;

  // Overrides/Toggles from Company Settings at time of creation
  terms?: string;
  showLetterhead: boolean;
  showFooter: boolean;
  showSignature: boolean;
  showBankDetails: boolean;
  showTerms: boolean;
  watermark?: string;

  // Status
  status: 'Draft' | 'Sent' | 'Approved' | 'Paid' | 'Expired';
}

export interface AppSettings {
  invoicePrefix: string;
  invoiceNextNumber: number;
  quotationPrefix: string;
  quotationNextNumber: number;
  workOrderPrefix: string;
  workOrderNextNumber: number;
  theme: 'light' | 'dark';
}

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
}
