import type { Settings, Product, Quotation, User } from './types';

// localStorage keys
const KEYS = {
  USERS: 'smartquote_users',
  CURRENT_USER: 'smartquote_current_user',
  SETTINGS: 'smartquote_settings',
  PRODUCTS: 'smartquote_products',
  QUOTATIONS: 'smartquote_quotations',
};

const DEFAULT_SETTINGS: Settings = {
  id: '1',
  appName: 'SmartQuote Inventory',
  companyName: 'AMEN-CAM LTD',
  invoiceTitle: 'Proforma invoice no',
  headerLine1: 'AMAZING MEDICAL EQUIPMENT NETWORK-CAM LIMITED',
  headerLine2: 'Dealer in medical equipment, materials, contracts, import and general commerce',
  headerLine3: 'Tax Payer\'s No. M052014422532X CNPS No. 370-0131792-000-R',
  address: 'P.O Box 5210, Nkwen, Bamenda',
  phone: '+237 679689100',
  email: 'amencam77@gmail.com',
  website: '',
  registrationNumber: 'Tax Payer\'s No. M052014422532X CNPS No. 370-0131792-000-R',
  taxId: '',
  currency: 'XAF',
  footerNote: '',
};

const LEGACY_SAMPLE_PRODUCT_NAMES = [
  'Digital Blood Pressure Monitor',
  'Disposable Surgical Gloves',
  'Infrared Thermometer',
];

function createPlaceholderImage(label: string): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
      <rect width="400" height="300" fill="#f3f4f6" />
      <rect x="24" y="24" width="352" height="252" rx="20" fill="#ffffff" stroke="#d1d5db" />
      <text x="200" y="132" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="700" fill="#111827">
        Amen-Cam
      </text>
      <text x="200" y="164" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="15" fill="#4b5563">
        ${label}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function createSeedProduct(
  id: string,
  name: string,
  sku: string,
  category: string,
  unit: string,
  unitPrice: number,
  quantityInStock: number,
  reorderLevel: number,
  description: string,
  brand = 'Amen-Cam',
): Product {
  const timestamp = new Date().toISOString();
  return {
    id,
    name,
    sku,
    category,
    brand,
    unit,
    unitPrice,
    quantityInStock,
    reorderLevel,
    description,
    imageUrl: createPlaceholderImage(name),
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

const DEFAULT_SAMPLE_PRODUCTS: Product[] = [
  createSeedProduct('1', 'Hospitalization bed with adjustable foam mattresses', 'AMC-BED-001', 'Furniture', 'unit', 235000, 12, 3, 'Adjustable hospitalization bed supplied with anti-bedsores foam mattress.'),
  createSeedProduct('2', 'Bed pan Inox', 'AMC-BPN-002', 'Ward Care', 'unit', 22000, 30, 8, 'Stainless steel bed pan for patient care and hygiene.'),
  createSeedProduct('3', 'Stainless steel dust pan (20 liters)', 'AMC-DPN-003', 'Waste Management', 'unit', 45000, 18, 4, '20-liter stainless steel dust pan for clinical and cleaning use.'),
  createSeedProduct('4', 'Salter scale adult', 'AMC-SCL-004', 'Diagnostics', 'unit', 35000, 16, 4, 'Adult weighing scale for ward and consultation use.'),
  createSeedProduct('5', 'Complete delivery kit', 'AMC-DLK-005', 'Maternity', 'kit', 35000, 20, 5, 'Complete delivery kit for maternity and labor procedures.'),
  createSeedProduct('6', 'Minor surgical kit', 'AMC-MSK-006', 'Surgery', 'kit', 35000, 24, 6, 'Minor surgical instrument kit for routine interventions.'),
  createSeedProduct('7', 'Stainless steel dressing trolley', 'AMC-TRY-007', 'Furniture', 'unit', 100000, 10, 2, 'Mobile stainless steel trolley for dressing and procedure support.'),
  createSeedProduct('8', 'Protected baby’s cots', 'AMC-COT-008', 'Pediatrics', 'unit', 100000, 10, 2, 'Protected baby cot for neonatal and pediatric ward use.'),
  createSeedProduct('9', 'Autoclave', 'AMC-AUT-009', 'Sterilization', 'unit', 225000, 4, 1, 'Autoclave for sterilization of instruments and consumables.'),
  createSeedProduct('10', 'Electronic Footoscope', 'AMC-FOT-010', 'Diagnostics', 'unit', 75000, 8, 2, 'Electronic footoscope for specialized examination and care.'),
  createSeedProduct('11', 'Bedside cupboard with drawers', 'AMC-BCD-011', 'Furniture', 'unit', 95000, 12, 3, 'Bedside cupboard with storage drawers for patient rooms.'),
  createSeedProduct('12', 'Ward screen with movable joints', 'AMC-WSC-012', 'Furniture', 'unit', 100000, 10, 2, 'Ward privacy screen with movable joints and stable frame.'),
  createSeedProduct('13', 'Delivery bed', 'AMC-DVB-013', 'Maternity', 'unit', 320000, 5, 1, 'Delivery bed designed for labor and maternity procedures.'),
  createSeedProduct('14', 'Stretcher on wheel with adjustable stainless with drip stand', 'AMC-STR-014', 'Emergency', 'unit', 475000, 4, 1, 'Adjustable stainless stretcher on wheels with integrated drip stand.'),
  createSeedProduct('15', 'Cotton', 'AMC-CTN-015', 'Consumables', 'pack', 3500, 120, 30, 'Absorbent cotton for medical dressing and procedure use.'),
  createSeedProduct('16', 'Roll of Adhesive plaster', 'AMC-PLS-016', 'Consumables', 'roll', 2500, 240, 60, 'Medical adhesive plaster supplied in standard rolls.'),
  createSeedProduct('17', 'Sterile gauze 40x40', 'AMC-GAZ-017', 'Consumables', 'pack', 500, 500, 150, 'Sterile 40x40 gauze for dressing and wound care.'),
  createSeedProduct('18', 'Ambu bags', 'AMC-AMB-018', 'Emergency', 'unit', 35000, 15, 4, 'Manual resuscitator bag for emergency respiratory support.'),
  createSeedProduct('19', 'Littmann stethoscope', 'AMC-STH-019', 'Diagnostics', 'unit', 22000, 14, 4, 'Littmann stethoscope for clinical auscultation.'),
  createSeedProduct('20', 'Stainless steel Otoscope', 'AMC-OTO-020', 'Diagnostics', 'unit', 55000, 10, 2, 'Stainless steel otoscope for ear examination.'),
  createSeedProduct('21', 'Iodine (surgical spirit) 500ml', 'AMC-IOD-021', 'Consumables', 'bottle', 1800, 200, 50, '500ml iodine surgical spirit for antiseptic preparation.'),
];

function migrateLegacySettings(settings: Partial<Settings>): Partial<Settings> {
  if (
    settings.appName === DEFAULT_SETTINGS.appName &&
    settings.companyName === 'Medical Equipment Solutions'
  ) {
    return { ...DEFAULT_SETTINGS, logoUrl: settings.logoUrl };
  }
  return settings;
}

function shouldReplaceLegacySampleProducts(products: Product[]): boolean {
  return (
    products.length === LEGACY_SAMPLE_PRODUCT_NAMES.length &&
    LEGACY_SAMPLE_PRODUCT_NAMES.every((name) => products.some((product) => product.name === name))
  );
}

// Initialize default data
function initializeDefaults() {
  // Default settings
  if (!localStorage.getItem(KEYS.SETTINGS)) {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
  }

  // Default admin user
  if (!localStorage.getItem(KEYS.USERS)) {
    const defaultUsers: User[] = [
      {
        id: '1',
        email: 'admin@smartquote.com',
        role: 'admin',
        createdAt: new Date().toISOString(),
      },
    ];
    localStorage.setItem(KEYS.USERS, JSON.stringify(defaultUsers));
  }

  // Sample products
  if (!localStorage.getItem(KEYS.PRODUCTS)) {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(DEFAULT_SAMPLE_PRODUCTS));
  } else {
    const storedProducts = JSON.parse(localStorage.getItem(KEYS.PRODUCTS) || '[]') as Product[];
    if (shouldReplaceLegacySampleProducts(storedProducts)) {
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(DEFAULT_SAMPLE_PRODUCTS));
    }
  }

  // Initialize empty quotations
  if (!localStorage.getItem(KEYS.QUOTATIONS)) {
    localStorage.setItem(KEYS.QUOTATIONS, JSON.stringify([]));
  }
}

// Auth Service
export const authService = {
  login: (email: string, password: string): User | null => {
    initializeDefaults();
    const users: User[] = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
    const user = users.find((u) => u.email === email);
    
    // Simple password check (for demo: password is "password123")
    if (user && password === 'password123') {
      localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
      return user;
    }
    return null;
  },

  register: (email: string, password: string, role: 'admin' | 'staff' = 'staff'): User | null => {
    initializeDefaults();
    const users: User[] = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
    
    if (users.find((u) => u.email === email)) {
      return null; // User already exists
    }

    const newUser: User = {
      id: Date.now().toString(),
      email,
      role,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(newUser));
    return newUser;
  },

  logout: () => {
    localStorage.removeItem(KEYS.CURRENT_USER);
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem(KEYS.CURRENT_USER);
    return userStr ? JSON.parse(userStr) : null;
  },
};

// Settings Service
export const settingsService = {
  get: (): Settings => {
    initializeDefaults();
    const storedSettings = JSON.parse(localStorage.getItem(KEYS.SETTINGS) || '{}') as Partial<Settings>;
    const migratedSettings = migrateLegacySettings(storedSettings);
    const mergedSettings = { ...DEFAULT_SETTINGS, ...migratedSettings };
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(mergedSettings));
    return mergedSettings;
  },

  update: (settings: Settings): Settings => {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    return settings;
  },
};

// Products Service
export const productsService = {
  getAll: (): Product[] => {
    initializeDefaults();
    return JSON.parse(localStorage.getItem(KEYS.PRODUCTS) || '[]');
  },

  getById: (id: string): Product | null => {
    const products = productsService.getAll();
    return products.find((p) => p.id === id) || null;
  },

  create: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product => {
    const products = productsService.getAll();
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    products.push(newProduct);
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
    return newProduct;
  },

  update: (id: string, updates: Partial<Product>): Product | null => {
    const products = productsService.getAll();
    const index = products.findIndex((p) => p.id === id);
    
    if (index === -1) return null;

    products[index] = {
      ...products[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
    return products[index];
  },

  delete: (id: string): boolean => {
    const products = productsService.getAll();
    const filtered = products.filter((p) => p.id !== id);
    
    if (filtered.length === products.length) return false;
    
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(filtered));
    return true;
  },

  search: (query: string): Product[] => {
    const products = productsService.getAll();
    const lowerQuery = query.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.sku?.toLowerCase().includes(lowerQuery) ||
        p.category?.toLowerCase().includes(lowerQuery)
    );
  },

  getLowStock: (): Product[] => {
    const products = productsService.getAll();
    return products.filter((p) => p.reorderLevel && p.quantityInStock <= p.reorderLevel);
  },

  updateStock: (id: string, quantity: number): Product | null => {
    return productsService.update(id, { quantityInStock: quantity });
  },
};

// Quotations Service
export const quotationsService = {
  getAll: (): Quotation[] => {
    initializeDefaults();
    return JSON.parse(localStorage.getItem(KEYS.QUOTATIONS) || '[]');
  },

  getById: (id: string): Quotation | null => {
    const quotations = quotationsService.getAll();
    return quotations.find((q) => q.id === id) || null;
  },

  create: (quotation: Omit<Quotation, 'id' | 'quoteNumber' | 'createdAt' | 'updatedAt'>): Quotation => {
    const quotations = quotationsService.getAll();
    
    // Generate quote number
    const year = new Date().getFullYear();
    const count = quotations.filter((q) => q.quoteNumber.startsWith(`SQ-${year}`)).length + 1;
    const quoteNumber = `SQ-${year}-${String(count).padStart(4, '0')}`;

    const newQuotation: Quotation = {
      ...quotation,
      id: Date.now().toString(),
      quoteNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    quotations.push(newQuotation);
    localStorage.setItem(KEYS.QUOTATIONS, JSON.stringify(quotations));
    return newQuotation;
  },

  update: (id: string, updates: Partial<Quotation>): Quotation | null => {
    const quotations = quotationsService.getAll();
    const index = quotations.findIndex((q) => q.id === id);
    
    if (index === -1) return null;

    quotations[index] = {
      ...quotations[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    localStorage.setItem(KEYS.QUOTATIONS, JSON.stringify(quotations));
    return quotations[index];
  },

  delete: (id: string): boolean => {
    const quotations = quotationsService.getAll();
    const filtered = quotations.filter((q) => q.id !== id);
    
    if (filtered.length === quotations.length) return false;
    
    localStorage.setItem(KEYS.QUOTATIONS, JSON.stringify(filtered));
    return true;
  },

  search: (query: string): Quotation[] => {
    const quotations = quotationsService.getAll();
    const lowerQuery = query.toLowerCase();
    return quotations.filter(
      (q) =>
        q.quoteNumber.toLowerCase().includes(lowerQuery) ||
        q.customerName.toLowerCase().includes(lowerQuery) ||
        q.customerEmail?.toLowerCase().includes(lowerQuery)
    );
  },

  getByStatus: (status: Quotation['status']): Quotation[] => {
    const quotations = quotationsService.getAll();
    return quotations.filter((q) => q.status === status);
  },

  getThisMonth: (): Quotation[] => {
    const quotations = quotationsService.getAll();
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return quotations.filter((q) => new Date(q.createdAt) >= firstDay);
  },

  confirmQuotation: (id: string): boolean => {
    const quotation = quotationsService.getById(id);
    if (!quotation || quotation.status === 'CONFIRMED') return false;

    // Reduce stock quantities
    quotation.items.forEach((item) => {
      const product = productsService.getById(item.productId);
      if (product) {
        const newQuantity = Math.max(0, product.quantityInStock - item.quantity);
        productsService.updateStock(item.productId, newQuantity);
      }
    });

    // Update quotation status
    quotationsService.update(id, { status: 'CONFIRMED' });
    return true;
  },
};

// Image utilities
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
