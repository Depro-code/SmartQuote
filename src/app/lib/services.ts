import { supabase } from './supabaseClient';
import type {
  Customer,
  Expense,
  PetitCash,
  Product,
  Quotation,
  QuotationItem,
  QuotationStatus,
  SaleItem,
  SaleTransaction,
  SaleType,
  Settings,
  User,
} from './types';

// =====================================================================
// Row <-> app-type mappers (DB is snake_case, app is camelCase)
// =====================================================================

function toSettings(row: any): Settings {
  return {
    id: String(row.id),
    appName: row.app_name,
    companyName: row.company_name,
    invoiceTitle: row.invoice_title ?? undefined,
    headerLine1: row.header_line1 ?? undefined,
    headerLine2: row.header_line2 ?? undefined,
    headerLine3: row.header_line3 ?? undefined,
    address: row.address,
    phone: row.phone,
    email: row.email,
    website: row.website ?? undefined,
    registrationNumber: row.registration_number ?? undefined,
    taxId: row.tax_id ?? undefined,
    logoUrl: row.logo_url ?? undefined,
    currency: row.currency,
    footerNote: row.footer_note ?? undefined,
  };
}

function toProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku ?? undefined,
    category: row.category ?? undefined,
    brand: row.brand ?? undefined,
    unit: row.unit ?? undefined,
    unitPrice: Number(row.unit_price),
    quantityInStock: row.quantity_in_stock,
    reorderLevel: row.reorder_level ?? undefined,
    description: row.description ?? undefined,
    imageUrl: row.image_url ?? '',
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toCustomer(row: any): Customer {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toQuotationItem(row: any): QuotationItem {
  return {
    productId: row.product_id,
    nameSnapshot: row.name_snapshot,
    unitPriceSnapshot: Number(row.unit_price_snapshot),
    quantity: Number(row.quantity),
    unitSnapshot: row.unit_snapshot ?? undefined,
    lineTotal: Number(row.line_total),
  };
}

function toQuotation(row: any, items: QuotationItem[]): Quotation {
  return {
    id: row.id,
    quoteNumber: row.quote_number,
    customerId: row.customer_id ?? undefined,
    customerName: row.customer_name,
    customerPhone: row.customer_phone ?? undefined,
    customerEmail: row.customer_email ?? undefined,
    status: row.status as QuotationStatus,
    issueDate: row.issue_date,
    validUntil: row.valid_until ?? undefined,
    items,
    subTotal: Number(row.sub_total),
    discount: row.discount != null ? Number(row.discount) : undefined,
    taxRate: row.tax_rate != null ? Number(row.tax_rate) : undefined,
    taxAmount: row.tax_amount != null ? Number(row.tax_amount) : undefined,
    grandTotal: Number(row.grand_total),
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toSaleItem(row: any): SaleItem {
  return {
    description: row.description,
    quantity: row.quantity != null ? Number(row.quantity) : null,
    unitPrice: Number(row.unit_price),
    total: Number(row.total),
  };
}

function toSale(row: any, items: SaleItem[]): SaleTransaction {
  return {
    id: row.id,
    date: row.sale_date,
    customer: row.customer_name,
    items,
    grandTotal: Number(row.grand_total),
    type: row.type as SaleType,
    week: row.week,
    month: row.month,
    quotationId: row.quotation_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toExpense(row: any): Expense {
  return {
    id: row.id,
    date: row.expense_date,
    details: row.details,
    amount: Number(row.amount),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toUser(row: any, email: string): User {
  return {
    id: row.id,
    email,
    phone: row.phone,
    fullName: row.full_name ?? undefined,
    role: row.role,
    createdAt: row.created_at,
  };
}

function unwrap<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  if (data === null) throw new Error('No data returned from Supabase');
  return data;
}

// =====================================================================
// Auth
// =====================================================================

export const authService = {
  getCurrentUser: async (): Promise<User | null> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error || !profile) return null;
    return toUser(profile, session.user.email ?? '');
  },

  // Staff type their phone number + password. Under the hood: look up the
  // matching email via get_email_by_phone(), then sign in normally.
  loginWithPhone: async (phone: string, password: string): Promise<User | null> => {
    const { data: email, error: lookupError } = await supabase.rpc('get_email_by_phone', {
      p_phone: phone,
    });

    if (lookupError || !email) return null;

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !signInData.user) return null;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', signInData.user.id)
      .single();

    if (profileError || !profile) return null;
    return toUser(profile, signInData.user.email ?? '');
  },

  logout: async (): Promise<void> => {
    await supabase.auth.signOut();
  },

  // Admin-only. Calls the create-staff Edge Function, which uses the
  // service-role key server-side (a signed-in client can never create
  // auth.users rows directly). The Edge Function itself re-checks that
  // the caller is an admin before doing anything.
  createStaff: async (params: {
    phone: string;
    email: string;
    password: string;
    fullName?: string;
    role?: 'admin' | 'staff';
  }): Promise<{ success: boolean; message?: string }> => {
    const { data, error } = await supabase.functions.invoke('create-staff', {
      body: params,
    });

    if (error) return { success: false, message: error.message };
    return { success: true, ...(data as object) };
  },
};

// =====================================================================
// Settings
// =====================================================================

export const settingsService = {
  get: async (): Promise<Settings> => {
    const { data, error } = await supabase.from('settings').select('*').eq('id', 1).single();
    return toSettings(unwrap(data, error));
  },

  update: async (settings: Settings): Promise<Settings> => {
    const { data, error } = await supabase
      .from('settings')
      .update({
        app_name: settings.appName,
        company_name: settings.companyName,
        invoice_title: settings.invoiceTitle,
        header_line1: settings.headerLine1,
        header_line2: settings.headerLine2,
        header_line3: settings.headerLine3,
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        website: settings.website,
        registration_number: settings.registrationNumber,
        tax_id: settings.taxId,
        logo_url: settings.logoUrl,
        currency: settings.currency,
        footer_note: settings.footerNote,
      })
      .eq('id', 1)
      .select()
      .single();

    return toSettings(unwrap(data, error));
  },
};

// =====================================================================
// Products
// =====================================================================

export const productsService = {
  getAll: async (): Promise<Product[]> => {
    const { data, error } = await supabase.from('products').select('*').order('name');
    return unwrap(data, error).map(toProduct);
  },

  getById: async (id: string): Promise<Product | null> => {
    const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toProduct(data) : null;
  },

  create: async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: product.name,
        sku: product.sku,
        category: product.category,
        brand: product.brand,
        unit: product.unit,
        unit_price: product.unitPrice,
        quantity_in_stock: product.quantityInStock,
        reorder_level: product.reorderLevel,
        description: product.description,
        image_url: product.imageUrl,
        is_active: product.isActive,
      })
      .select()
      .single();

    return toProduct(unwrap(data, error));
  },

  update: async (id: string, updates: Partial<Product>): Promise<Product | null> => {
    const payload: Record<string, unknown> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.sku !== undefined) payload.sku = updates.sku;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.brand !== undefined) payload.brand = updates.brand;
    if (updates.unit !== undefined) payload.unit = updates.unit;
    if (updates.unitPrice !== undefined) payload.unit_price = updates.unitPrice;
    if (updates.quantityInStock !== undefined) payload.quantity_in_stock = updates.quantityInStock;
    if (updates.reorderLevel !== undefined) payload.reorder_level = updates.reorderLevel;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.imageUrl !== undefined) payload.image_url = updates.imageUrl;
    if (updates.isActive !== undefined) payload.is_active = updates.isActive;

    const { data, error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data ? toProduct(data) : null;
  },

  delete: async (id: string): Promise<boolean> => {
    const { error, count } = await supabase.from('products').delete({ count: 'exact' }).eq('id', id);
    if (error) throw new Error(error.message);
    return (count ?? 0) > 0;
  },

  search: async (query: string): Promise<Product[]> => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${query}%,sku.ilike.%${query}%,category.ilike.%${query}%`);
    return unwrap(data, error).map(toProduct);
  },

  getLowStock: async (): Promise<Product[]> => {
    const all = await productsService.getAll();
    return all.filter((p) => p.reorderLevel != null && p.quantityInStock <= p.reorderLevel);
  },

  updateStock: async (id: string, quantity: number): Promise<Product | null> => {
    return productsService.update(id, { quantityInStock: quantity });
  },
};

// =====================================================================
// Customers
// =====================================================================

export const customersService = {
  getAll: async (): Promise<Customer[]> => {
    const { data, error } = await supabase.from('customers').select('*').order('name');
    return unwrap(data, error).map(toCustomer);
  },

  getById: async (id: string): Promise<Customer | null> => {
    const { data, error } = await supabase.from('customers').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toCustomer(data) : null;
  },

  create: async (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> => {
    const { data, error } = await supabase
      .from('customers')
      .insert({ name: customer.name, phone: customer.phone })
      .select()
      .single();
    return toCustomer(unwrap(data, error));
  },

  update: async (id: string, updates: Partial<Customer>): Promise<Customer | null> => {
    const payload: Record<string, unknown> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.phone !== undefined) payload.phone = updates.phone;

    const { data, error } = await supabase
      .from('customers')
      .update(payload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data ? toCustomer(data) : null;
  },

  delete: async (id: string): Promise<boolean> => {
    const { error, count } = await supabase.from('customers').delete({ count: 'exact' }).eq('id', id);
    if (error) throw new Error(error.message);
    return (count ?? 0) > 0;
  },

  search: async (query: string): Promise<Customer[]> => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .or(`name.ilike.%${query}%,phone.ilike.%${query}%`);
    return unwrap(data, error).map(toCustomer);
  },
};

// =====================================================================
// Quotations (+ quotation_items child table)
// =====================================================================

async function loadQuotationItems(quotationId: string): Promise<QuotationItem[]> {
  const { data, error } = await supabase
    .from('quotation_items')
    .select('*')
    .eq('quotation_id', quotationId)
    .order('sort_order');
  return unwrap(data, error).map(toQuotationItem);
}

async function hydrateQuotation(row: any): Promise<Quotation> {
  const items = await loadQuotationItems(row.id);
  return toQuotation(row, items);
}

function quotationItemsPayload(quotationId: string, items: QuotationItem[]) {
  return items.map((item, index) => ({
    quotation_id: quotationId,
    product_id: item.productId,
    name_snapshot: item.nameSnapshot,
    unit_price_snapshot: item.unitPriceSnapshot,
    unit_snapshot: item.unitSnapshot,
    quantity: item.quantity,
    line_total: item.lineTotal,
    sort_order: index,
  }));
}

export const quotationsService = {
  getAll: async (): Promise<Quotation[]> => {
    const { data, error } = await supabase
      .from('quotations')
      .select('*')
      .order('created_at', { ascending: false });
    const rows = unwrap(data, error);
    return Promise.all(rows.map(hydrateQuotation));
  },

  getById: async (id: string): Promise<Quotation | null> => {
    const { data, error } = await supabase.from('quotations').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? hydrateQuotation(data) : null;
  },

  create: async (
    quotation: Omit<Quotation, 'id' | 'quoteNumber' | 'createdAt' | 'updatedAt'>,
  ): Promise<Quotation> => {
    const { data: qRow, error: qError } = await supabase
      .from('quotations')
      .insert({
        customer_id: quotation.customerId,
        customer_name: quotation.customerName,
        customer_phone: quotation.customerPhone,
        customer_email: quotation.customerEmail,
        status: quotation.status,
        issue_date: quotation.issueDate,
        valid_until: quotation.validUntil,
        sub_total: quotation.subTotal,
        discount: quotation.discount,
        tax_rate: quotation.taxRate,
        tax_amount: quotation.taxAmount,
        grand_total: quotation.grandTotal,
        notes: quotation.notes,
      })
      .select()
      .single();

    const row = unwrap(qRow, qError);

    if (quotation.items.length > 0) {
      const { error: itemsError } = await supabase
        .from('quotation_items')
        .insert(quotationItemsPayload(row.id, quotation.items));
      if (itemsError) throw new Error(itemsError.message);
    }

    return hydrateQuotation(row);
  },

  update: async (id: string, updates: Partial<Quotation>): Promise<Quotation | null> => {
    const payload: Record<string, unknown> = {};
    if (updates.customerId !== undefined) payload.customer_id = updates.customerId;
    if (updates.customerName !== undefined) payload.customer_name = updates.customerName;
    if (updates.customerPhone !== undefined) payload.customer_phone = updates.customerPhone;
    if (updates.customerEmail !== undefined) payload.customer_email = updates.customerEmail;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.issueDate !== undefined) payload.issue_date = updates.issueDate;
    if (updates.validUntil !== undefined) payload.valid_until = updates.validUntil;
    if (updates.subTotal !== undefined) payload.sub_total = updates.subTotal;
    if (updates.discount !== undefined) payload.discount = updates.discount;
    if (updates.taxRate !== undefined) payload.tax_rate = updates.taxRate;
    if (updates.taxAmount !== undefined) payload.tax_amount = updates.taxAmount;
    if (updates.grandTotal !== undefined) payload.grand_total = updates.grandTotal;
    if (updates.notes !== undefined) payload.notes = updates.notes;

    const { data, error } = await supabase
      .from('quotations')
      .update(payload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;

    if (updates.items) {
      const { error: deleteError } = await supabase
        .from('quotation_items')
        .delete()
        .eq('quotation_id', id);
      if (deleteError) throw new Error(deleteError.message);

      if (updates.items.length > 0) {
        const { error: insertError } = await supabase
          .from('quotation_items')
          .insert(quotationItemsPayload(id, updates.items));
        if (insertError) throw new Error(insertError.message);
      }
    }

    return hydrateQuotation(data);
  },

  delete: async (id: string): Promise<boolean> => {
    const { error, count } = await supabase.from('quotations').delete({ count: 'exact' }).eq('id', id);
    if (error) throw new Error(error.message);
    return (count ?? 0) > 0;
  },

  search: async (query: string): Promise<Quotation[]> => {
    const { data, error } = await supabase
      .from('quotations')
      .select('*')
      .or(
        `quote_number.ilike.%${query}%,customer_name.ilike.%${query}%,customer_phone.ilike.%${query}%,customer_email.ilike.%${query}%`,
      );
    const rows = unwrap(data, error);
    return Promise.all(rows.map(hydrateQuotation));
  },

  getByStatus: async (status: QuotationStatus): Promise<Quotation[]> => {
    const { data, error } = await supabase.from('quotations').select('*').eq('status', status);
    const rows = unwrap(data, error);
    return Promise.all(rows.map(hydrateQuotation));
  },

  getThisMonth: async (): Promise<Quotation[]> => {
    const firstDay = new Date();
    firstDay.setDate(1);
    firstDay.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('quotations')
      .select('*')
      .gte('created_at', firstDay.toISOString());
    const rows = unwrap(data, error);
    return Promise.all(rows.map(hydrateQuotation));
  },

  // Fully atomic on the DB side: decrements stock, creates the sale + its
  // items, and flips status to CONFIRMED, all in one transaction.
  confirmQuotation: async (id: string): Promise<boolean> => {
    const { error } = await supabase.rpc('confirm_quotation', { p_quotation_id: id });
    return !error;
  },
};

// =====================================================================
// Sales (+ sale_items child table)
// =====================================================================

async function loadSaleItems(saleId: string): Promise<SaleItem[]> {
  const { data, error } = await supabase.from('sale_items').select('*').eq('sale_id', saleId);
  return unwrap(data, error).map(toSaleItem);
}

async function hydrateSale(row: any): Promise<SaleTransaction> {
  const items = await loadSaleItems(row.id);
  return toSale(row, items);
}

export const salesService = {
  getAll: async (): Promise<SaleTransaction[]> => {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('sale_date', { ascending: false });
    const rows = unwrap(data, error);
    return Promise.all(rows.map(hydrateSale));
  },

  getById: async (id: string): Promise<SaleTransaction | null> => {
    const { data, error } = await supabase.from('sales').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? hydrateSale(data) : null;
  },

  getByMonth: async (month: string): Promise<SaleTransaction[]> => {
    const { data, error } = await supabase.from('sales').select('*').eq('month', month);
    const rows = unwrap(data, error);
    return Promise.all(rows.map(hydrateSale));
  },

  getByMonthAndWeek: async (month: string, week: number): Promise<SaleTransaction[]> => {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .eq('month', month)
      .eq('week', week);
    const rows = unwrap(data, error);
    return Promise.all(rows.map(hydrateSale));
  },

  getByType: async (month: string, type: SaleType): Promise<SaleTransaction[]> => {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .eq('month', month)
      .eq('type', type);
    const rows = unwrap(data, error);
    return Promise.all(rows.map(hydrateSale));
  },

  // Manual sale entry (not created via confirmQuotation).
  create: async (
    data: Omit<SaleTransaction, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<SaleTransaction> => {
    const { data: row, error } = await supabase
      .from('sales')
      .insert({
        sale_date: data.date,
        customer_name: data.customer,
        grand_total: data.grandTotal,
        type: data.type,
        week: data.week,
        month: data.month,
        quotation_id: data.quotationId,
      })
      .select()
      .single();

    const saleRow = unwrap(row, error);

    if (data.items.length > 0) {
      const { error: itemsError } = await supabase.from('sale_items').insert(
        data.items.map((item) => ({
          sale_id: saleRow.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total: item.total,
        })),
      );
      if (itemsError) throw new Error(itemsError.message);
    }

    return hydrateSale(saleRow);
  },

  update: async (id: string, updates: Partial<SaleTransaction>): Promise<SaleTransaction | null> => {
    const payload: Record<string, unknown> = {};
    if (updates.date !== undefined) payload.sale_date = updates.date;
    if (updates.customer !== undefined) payload.customer_name = updates.customer;
    if (updates.grandTotal !== undefined) payload.grand_total = updates.grandTotal;
    if (updates.type !== undefined) payload.type = updates.type;
    if (updates.week !== undefined) payload.week = updates.week;
    if (updates.month !== undefined) payload.month = updates.month;

    const { data, error } = await supabase
      .from('sales')
      .update(payload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data ? hydrateSale(data) : null;
  },

  delete: async (id: string): Promise<boolean> => {
    const { error, count } = await supabase.from('sales').delete({ count: 'exact' }).eq('id', id);
    if (error) throw new Error(error.message);
    return (count ?? 0) > 0;
  },

  getMonthSummary: async (
    month: string,
  ): Promise<{ cashTotal: number; creditTotal: number; grandTotal: number }> => {
    const sales = await salesService.getByMonth(month);
    const cashTotal = sales.filter((s) => s.type === 'CASH').reduce((t, s) => t + s.grandTotal, 0);
    const creditTotal = sales.filter((s) => s.type === 'CREDIT').reduce((t, s) => t + s.grandTotal, 0);
    return { cashTotal, creditTotal, grandTotal: cashTotal + creditTotal };
  },
};

// =====================================================================
// Expenses
// =====================================================================

export const expensesService = {
  getAll: async (): Promise<Expense[]> => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('expense_date', { ascending: false });
    return unwrap(data, error).map(toExpense);
  },

  getByDateRange: async (from: string, to: string): Promise<Expense[]> => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .gte('expense_date', from)
      .lte('expense_date', to);
    return unwrap(data, error).map(toExpense);
  },

  create: async (data: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Promise<Expense> => {
    const { data: row, error } = await supabase
      .from('expenses')
      .insert({ expense_date: data.date, details: data.details, amount: data.amount })
      .select()
      .single();
    return toExpense(unwrap(row, error));
  },

  update: async (id: string, updates: Partial<Expense>): Promise<Expense | null> => {
    const payload: Record<string, unknown> = {};
    if (updates.date !== undefined) payload.expense_date = updates.date;
    if (updates.details !== undefined) payload.details = updates.details;
    if (updates.amount !== undefined) payload.amount = updates.amount;

    const { data, error } = await supabase
      .from('expenses')
      .update(payload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data ? toExpense(data) : null;
  },

  delete: async (id: string): Promise<boolean> => {
    const { error, count } = await supabase.from('expenses').delete({ count: 'exact' }).eq('id', id);
    if (error) throw new Error(error.message);
    return (count ?? 0) > 0;
  },

  getMonthTotal: async (month: string): Promise<number> => {
    const [year, monthNum] = month.split('-').map(Number);
    const from = `${month}-01`;
    const to = new Date(year, monthNum, 1).toISOString().slice(0, 10); // first day of next month

    const { data, error } = await supabase
      .from('expenses')
      .select('amount')
      .gte('expense_date', from)
      .lt('expense_date', to);

    const rows = unwrap(data, error);
    return rows.reduce((total: number, r: any) => total + Number(r.amount), 0);
  },
};

// =====================================================================
// Petit Cash
// =====================================================================

export const petitCashService = {
  get: async (): Promise<PetitCash> => {
    const { data, error } = await supabase
      .from('petit_cash_topups')
      .select('*')
      .order('topup_date', { ascending: false });
    const rows = unwrap(data, error);
    return {
      id: 'global',
      topUps: rows.map((r: any) => ({
        id: r.id,
        date: r.topup_date,
        amount: Number(r.amount),
        note: r.note ?? undefined,
      })),
      updatedAt: rows[0]?.created_at ?? new Date().toISOString(),
    };
  },

  addTopUp: async (date: string, amount: number, note?: string): Promise<PetitCash> => {
    const { error } = await supabase
      .from('petit_cash_topups')
      .insert({ topup_date: date, amount, note });
    if (error) throw new Error(error.message);
    return petitCashService.get();
  },

  removeTopUp: async (id: string): Promise<PetitCash> => {
    const { error } = await supabase.from('petit_cash_topups').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return petitCashService.get();
  },

  getRunningBalance: async (): Promise<number> => {
    const { data, error } = await supabase.from('petit_cash_balance').select('balance').single();
    return Number(unwrap(data, error).balance);
  },

  getTotalTopUps: async (): Promise<number> => {
    const { data, error } = await supabase.from('petit_cash_balance').select('total_topups').single();
    return Number(unwrap(data, error).total_topups);
  },
};

// =====================================================================
// Image utilities (unchanged — purely client-side, no backend involved)
// =====================================================================

export const imageService = {
  convertToBase64: (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  compressImage: (file: File, maxWidth = 800, maxHeight = 800): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },
};