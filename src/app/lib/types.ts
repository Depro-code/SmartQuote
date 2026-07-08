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
  sku?: string | null;
  category?: string | null;
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

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuotationItem {
  productId?: string;
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
  customerId?: string;
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
  createdAt: string;
  updatedAt: string;
}

export type SaleType = 'CASH' | 'CREDIT';

export interface CashReceiptItem {
  description: string;
  quantity: number | null;
  unitPrice: number;
  total: number;
}

export interface CashReceipt {
  id: string;
  receiptNumber: string;
  saleId?: string;
  quotationId?: string;
  customerName: string;
  issueDate: string;
  items: CashReceiptItem[];
  subTotal: number;
  taxRate?: number;
  taxAmount?: number;
  grandTotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  productId?: string;
  description: string;
  quantity: number | null;
  unitPrice: number;
  total: number;
}

export interface SaleTransaction {
  id: string;
  date: string;
  customer: string;
  items: SaleItem[];
  grandTotal: number;
  type: SaleType;
  week: number; // 1-4
  month: string; // "2026-06"
  quotationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  date: string;
  details: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PetitCashTopUp {
  id: string;
  date: string;
  amount: number;
  note?: string;
}

export interface PetitCash {
  id: 'global';
  topUps: PetitCashTopUp[];
  updatedAt: string;
}

export type UserRole = 'admin' | 'staff';

export interface User {
  id: string;
  email: string;
  phone: string;
  fullName?: string;
  role: UserRole;
  createdAt: string;
}