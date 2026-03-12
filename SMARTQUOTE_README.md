# SmartQuote Inventory MVP

A production-ready medical equipment inventory and quotation management system built with React, TypeScript, and Tailwind CSS.

## 🎯 Overview

SmartQuote Inventory is designed for medical equipment importers/suppliers who need to:
- Manage product inventory with images
- Create professional quotations quickly
- Export quotations as PDF with company letterhead
- Share quotations via WhatsApp

## ✨ Features

### 1. Product Management
- **Create/Edit/Delete** products with full details
- **Image upload** with automatic compression
- **Inventory tracking** with low stock alerts
- **Search & filter** by name, SKU, or category
- **Categories & brands** for organization
- **Stock levels** with reorder point warnings

### 2. Quotation Builder
- **Select products** from inventory with visual picker
- **Auto-calculate** totals including discounts and tax
- **Customer information** management
- **Draft/Sent/Confirmed/Cancelled** status tracking
- **Stock reduction** on confirmation
- **Search & filter** quotations

### 3. PDF Export
- **Professional PDF** generation with company letterhead
- **Customizable header** with logo and company details
- **Itemized table** with prices and totals
- **Footer notes** for terms and conditions
- **Download** directly to device
- **WhatsApp sharing** with pre-filled message

### 4. Settings
- **Company profile** customization
- **Logo upload** for quotation PDFs
- **Currency** configuration (default: XAF)
- **Contact information** management
- **Footer notes** for quotations

### 5. Authentication & Security
- **Email/password** authentication
- **Role-based access** (Admin/Staff)
- **Protected routes** for authenticated users
- **Session persistence**

## 🚀 Getting Started

### Default Credentials

**Admin Account:**
- Email: `admin@smartquote.com`
- Password: `password123`

### First Steps

1. **Login** with the default admin credentials
2. **Configure Settings** - Add your company information and logo
3. **Add Products** - Create your inventory with images
4. **Create Quotations** - Select products and generate quotes
5. **Export PDFs** - Download and share quotations

## 📊 Data Model

### Products
- Name, SKU, Category, Brand
- Unit Price & Stock Quantity
- Reorder Level (for low stock alerts)
- Product Image (required)
- Description & Unit type
- Active/Inactive status

### Quotations
- Quote Number (auto-generated: SQ-YYYY-NNNN)
- Customer Name, Phone, Email
- Issue Date & Valid Until
- Line Items (product snapshots)
- Subtotal, Discount, Tax, Grand Total
- Status (Draft/Sent/Confirmed/Cancelled)
- Notes & PDF data

### Settings
- App Name & Company Name
- Address, Phone, Email
- Company Logo
- Currency Code
- Footer Note for PDFs

## 💾 Data Storage

This MVP uses **localStorage** for data persistence:
- All data stored in browser localStorage
- No backend server required
- Data persists across sessions
- Can be exported/imported if needed

**Storage Keys:**
- `smartquote_users` - User accounts
- `smartquote_current_user` - Active session
- `smartquote_settings` - Company settings
- `smartquote_products` - Inventory
- `smartquote_quotations` - All quotations

## 📱 Features in Detail

### Product Management
1. Navigate to **Products** page
2. Click **Add Product** button
3. Upload product image (auto-compressed)
4. Fill in product details
5. Set stock quantity and reorder level
6. Save to add to inventory

### Creating Quotations
1. Navigate to **Quotations** page
2. Click **New Quotation** button
3. Enter customer information
4. Click **Add Product** to select items
5. Adjust quantities as needed
6. Add optional discount or tax
7. Add notes if needed
8. Click **Create Quotation**

### Exporting PDFs
1. Open a quotation
2. Click **Export PDF** button
3. PDF is generated and downloaded
4. Click **Share via WhatsApp** to open WhatsApp
5. Attach the downloaded PDF in WhatsApp chat

### Confirming Quotations
1. Open a quotation
2. Change status to **Confirmed**
3. Stock quantities are automatically reduced
4. Cannot be undone - stock is permanently adjusted

## 🎨 Customization

### Company Branding
1. Go to **Settings** page
2. Upload your company logo
3. Update company name and details
4. Set your currency (XAF, USD, EUR, etc.)
5. Add custom footer note
6. See live preview of PDF header

### Currency Support
The system supports any ISO currency code:
- XAF (Central African CFA franc)
- USD (US Dollar)
- EUR (Euro)
- GBP (British Pound)
- And more...

## 📋 User Roles

### Admin
- Full access to all features
- Can edit settings
- Manage products and quotations
- View all data

### Staff
- Manage products
- Create and manage quotations
- Export PDFs
- Read-only access to settings

## 🔧 Technical Details

### Tech Stack
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **jsPDF** for PDF generation
- **Sonner** for toast notifications
- **Radix UI** for components
- **Lucide React** for icons
- **date-fns** for date formatting

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Responsive design (mobile, tablet, desktop)
- localStorage support required

## 📝 Sample Data

The system includes 3 sample products:
1. Digital Blood Pressure Monitor
2. Disposable Surgical Gloves
3. Infrared Thermometer

Feel free to delete or modify these as needed.

## 💡 Tips & Best Practices

### Images
- Use clear, high-quality product images
- Images are automatically compressed to save space
- Recommended size: 800x800 pixels or less
- Supported formats: JPG, PNG, WebP

### Quotations
- Always review quotations before sending
- Mark as "Sent" when shared with customer
- Only confirm when payment/order is received
- Use notes field for special terms

### Stock Management
- Set reorder levels for critical items
- Monitor low stock alerts on dashboard
- Confirming quotations reduces stock automatically
- Update stock manually when receiving shipments

### WhatsApp Sharing
- Requires customer phone number
- Message is pre-filled for convenience
- PDF must be manually attached in WhatsApp
- Phone format: +237XXXXXXXXX (with country code)

## 🔐 Security Notes

This is a **front-end only** MVP using localStorage. For production use:
- Do NOT store sensitive customer data
- Do NOT use for PII (Personally Identifiable Information)
- Consider implementing a proper backend
- Use secure authentication system
- Implement data backup strategy
- Add SSL/HTTPS for web deployment

## 🚀 Future Enhancements

Potential features for future versions:
- Backend database integration
- Multi-user collaboration
- Inventory reports & analytics
- Customer database
- Purchase orders
- Invoice generation
- Email quotations
- Payment tracking
- Barcode scanning
- Multi-language support

## 📞 Support

This is a demonstration MVP. For production use, consider:
- Professional hosting
- Regular backups
- Security audit
- Custom feature development
- Training for staff
- Technical support

## 📄 License

This is a demonstration project. Modify and use as needed for your business.

---

**Built with ❤️ for Medical Equipment Suppliers**

*Version 1.0.0 - March 2026*
