// Core data types for SmartQuote Inventory

export interface Settings {
  id: string;
  appName: string;
  companyName: string;
  invoiceTitle?: string;
  headerLine1?: string;
  headerLine2?: string;
  headerLine3?: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  registrationNumber?: string;
  taxId?: string;
  logoUrl?: string;
  currency: string;
  footerNote?: string;
}

export interface Product {
  id: string;
  name: string;
  sku?: string;
  category?: string;
  brand?: string;
  unit?: string;
  unitPrice: number;
  quantityInStock: number;
  reorderLevel?: number;
  description?: string;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuotationItem {
  productId: string;
  nameSnapshot: string;
  unitPriceSnapshot: number;
  quantity: number;
  unitSnapshot?: string;
  lineTotal: number;
}

export type QuotationStatus = 'DRAFT' | 'SENT' | 'CONFIRMED' | 'CANCELLED';

export interface Quotation {
  id: string;
  quoteNumber: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  status: QuotationStatus;
  issueDate: string;
  validUntil?: string;
  items: QuotationItem[];
  subTotal: number;
  discount?: number;
  taxRate?: number;
  taxAmount?: number;
  grandTotal: number;
  notes?: string;
  pdfDataUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'admin' | 'staff';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
}
