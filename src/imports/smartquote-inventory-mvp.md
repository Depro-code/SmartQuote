You are an expert full-stack engineer. Build a production-ready MVP web app for a medical equipment supplier called “SmartQuote Inventory” (but EVERYTHING must be customizable: app name, company letterhead details, currency, etc.). The MVP must be built with React (web) + Tailwind CSS (highly responsive) and Appwrite (latest version, latest Web SDK syntax). Prepare a clean Appwrite services/helper layer using the latest Appwrite SDK (do not use deprecated syntax).

GOAL / CONTEXT:
This system is for a medical equipment importer/supplier in Cameroon who currently sends product photos on WhatsApp and manually types quotations (order lists) in documents with a company letterhead. Staff struggle with inventory tracking, and quotations should be generated fast and shared via WhatsApp as a PDF.

CORE MVP FEATURES (ONLY THESE 3):
1) Product Management (Inventory): create/edit/delete products with image upload.
2) Quotation Builder: create a quotation by selecting products and entering quantities; auto-calculate totals.
3) Export Quotation to PDF: generate a professional PDF that includes company letterhead/header and quotation table; allow download and a “Share via WhatsApp” action (WhatsApp share can be implemented as opening wa.me link with a prefilled message + instruct user to attach the PDF manually; do not attempt direct file upload to WhatsApp web).

TECH REQUIREMENTS:
- React + TypeScript (preferred). If you must use JS, keep types via JSDoc.
- Tailwind CSS for styling; highly responsive across mobile/desktop.
- Use reusable UI components (Input, Select, Button, Modal, Table, Badge, etc.).
- Use “sonner” toast notifications where applicable (success/error/loading).
- Use react-router for routing.
- Implement roles and protected routes (Admin/Staff) with a simple RBAC approach.

APPWRITE REQUIREMENTS:
- Use Appwrite Database + Storage for product images + (optional but recommended) storing generated quotation PDFs.
- Use the latest Appwrite Web SDK syntax (no deprecated imports).
- All IDs (endpoint, projectId, databaseId, collectionIds, bucketIds) must be loaded from env variables or a single config module so the app is customizable.
- Provide step-by-step setup instructions for Appwrite: create DB, create collections, attributes, indexes, buckets, permissions; then where to paste IDs.
- Ensure public users cannot access data.

DATA MODEL (MUST IMPLEMENT):

A) Settings / Company Profile (single document):
- appName (string)
- companyName (string)
- address (string)
- phone (string)
- email (string)
- logoFileId (string optional, stored in Appwrite Storage)
- currency (string, default “XAF”)
- footerNote (string optional, e.g. “Prices valid for 7 days”)
This must be editable from a “Settings” page and used automatically in PDFs.

B) Products Collection:
Required attributes:
- name (string, required)
- sku (string, optional but recommended unique)
- category (string, optional)
- brand (string, optional)
- unit (string, e.g. “box”, “piece”, optional)
- unitPrice (number, required)
- quantityInStock (number, required)
- reorderLevel (number optional)
- description (string optional)
- imageFileId (string required; uploaded to Storage bucket)
- isActive (boolean default true)

C) Quotations Collection:
- quoteNumber (string, required, unique-ish; generate like “AMZ-2026-0001”)
- customerName (string, required)
- customerPhone (string optional)
- customerEmail (string optional)
- status (string enum: “DRAFT”, “SENT”, “CONFIRMED”, “CANCELLED”)
- issueDate (string/date)
- validUntil (string/date optional)
- items (JSON array) each item contains:
   { productId, nameSnapshot, unitPriceSnapshot, quantity, unitSnapshot, lineTotal }
- subTotal (number)
- discount (number optional)
- taxRate (number optional)
- taxAmount (number optional)
- grandTotal (number)
- notes (string optional)
- pdfFileId (string optional, stored in Storage after export)

AUTH / ROLES / PERMISSIONS:
- Use Appwrite Auth with email/password.
- Roles:
  - admin: full access (products, quotations, settings, users if needed)
  - staff: can manage products + create quotations + export PDFs; settings read-only (or restrict settings edits to admin)
- Implement role storage either:
  1) in an Appwrite “profiles/users” collection keyed by userId, OR
  2) inside Appwrite user prefs if you prefer (but keep it consistent).
- Implement Protected Routes:
  - Block unauthenticated users from all app pages.
  - Block staff from admin-only screens (e.g., Settings edits if admin-only).
- Provide permissions helpers so later it can be tightened; for MVP default to “authenticated users only” access.

PAGES / SCREENS (MUST IMPLEMENT):
1) Auth
   - Login
   - Register (or Admin invites users; for MVP allow register + default role “staff”, admin can be manually set)
2) Dashboard
   - quick stats: number of products, low stock count, quotations this month
3) Products
   - list/search products (name, category, sku)
   - add product (form with image upload + preview)
   - edit product
   - delete product with confirmation
4) Quotations
   - list quotations with filters (status) + search (customer/quote number)
   - create quotation:
       - customer info inputs
       - add items by searching/selecting products
       - quantity input
       - auto-calc totals
       - save as DRAFT
   - view quotation details:
       - button “Export PDF”
       - button “Mark as Sent”
       - optional “Mark as Confirmed” which reduces stock quantities based on quotation items (only when status changes to CONFIRMED)
5) Settings (Company Profile)
   - edit company profile + upload logo (admin-only if you choose)
   - preview how it will look on the PDF header

PDF EXPORT REQUIREMENTS:
- Use a reliable PDF generator (react-pdf recommended, or pdf-lib/jspdf if you prefer).
- The PDF must include:
   - Company logo (if uploaded), companyName, address, phone, email
   - Title: “Quotation” or “Proforma Invoice”
   - Quote number, date, customer info
   - Table: item, qty, unit price, line total
   - totals summary (subtotal, tax, discount, grand total)
   - footer note
- Export action:
   - generate PDF client-side, download it
   - also upload the generated PDF to Appwrite Storage and store pdfFileId on the quotation doc
- Add a “Share WhatsApp” action:
   - open `https://wa.me/<customerPhone>?text=<encoded message>` with a message like:
     “Hello <customerName>, please find attached quotation <quoteNumber> from <companyName>.”
   - Also show a small UI hint/toast: “Attach the downloaded PDF in WhatsApp.”

IMAGE HANDLING:
- Product image is required.
- Use Appwrite Storage bucket “product-images”.
- Show product image thumbnails in the product list and inside the quotation item picker.
- Add simple client-side compression/resizing (optional but recommended) using canvas before upload to reduce file size.

UI / UX REQUIREMENTS:
- Use Tailwind with a clean dashboard layout.
- Make it highly responsive.
- Use consistent form components (inputs/selects/textareas) and accessible labels.
- Use loading skeletons/spinners where needed.
- Use “sonner” toast notifications for CRUD, exports, and errors.

DELIVERABLES:
1) Provide the full code implementation (React app) with all pages/features above.
2) Provide the Appwrite setup checklist (exact collections, attributes types, required indexes, buckets, permissions).
3) Provide environment variable template:
   VITE_APPWRITE_ENDPOINT=
   VITE_APPWRITE_PROJECT_ID=
   VITE_APPWRITE_DATABASE_ID=
   VITE_APPWRITE_PRODUCTS_COLLECTION_ID=
   VITE_APPWRITE_QUOTES_COLLECTION_ID=
   VITE_APPWRITE_SETTINGS_COLLECTION_ID=
   VITE_APPWRITE_PRODUCT_IMAGES_BUCKET_ID=
   VITE_APPWRITE_QUOTES_PDF_BUCKET_ID= (optional; can reuse one bucket)
4) Provide short “How to run” instructions.

IMPORTANT:
- Use the latest Appwrite SDK syntax (no deprecated imports).
- Do NOT ask me questions; make reasonable assumptions and implement.
- Do NOT include instructions about folder structure or where to create folders; just implement in the best structure you choose.
- Focus on speed and robustness: this should be a strong MVP I can build and demo within 2 days.

Now build it.