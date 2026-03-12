# SmartQuote Inventory - Setup Guide

## 🚀 Quick Start

This application is **ready to use** immediately. No backend setup required!

### Access the Application

1. Open the application in your browser
2. You'll be redirected to the login page
3. Use the default credentials:
   - **Email:** `admin@smartquote.com`
   - **Password:** `password123`

### First Time Setup

#### 1. Configure Company Settings
```
Login → Settings → Update Company Information
- Add company name
- Upload company logo (optional)
- Set contact details (phone, email, address)
- Configure currency (XAF by default)
- Add footer note for quotations
```

#### 2. Add Products
```
Login → Products → Add Product
- Upload product image (required)
- Enter product name and details
- Set unit price and stock quantity
- Set reorder level for low stock alerts
- Save product
```

#### 3. Create Your First Quotation
```
Login → Quotations → New Quotation
- Enter customer information
- Add products from inventory
- Adjust quantities
- Add discount/tax if needed
- Create quotation
```

#### 4. Export and Share
```
Open Quotation → Export PDF → Share via WhatsApp
- PDF downloads automatically
- WhatsApp opens with pre-filled message
- Manually attach the PDF in WhatsApp
```

## 💾 Data Storage

### localStorage-Based System

All data is stored in your browser's localStorage:

| Storage Key | Description |
|------------|-------------|
| `smartquote_users` | User accounts |
| `smartquote_current_user` | Active session |
| `smartquote_settings` | Company profile |
| `smartquote_products` | Product inventory |
| `smartquote_quotations` | All quotations |

### Important Notes

⚠️ **Data Persistence:**
- Data persists across browser sessions
- Data is stored locally in browser
- Clearing browser data will delete all records
- Not shared between devices/browsers

⚠️ **Backup Recommendations:**
- Regularly export important quotations as PDF
- Take screenshots of critical data
- Consider implementing cloud backup for production

## 🎨 Customization Guide

### Branding

**Company Logo:**
- Supported formats: PNG, JPG, WebP
- Recommended size: 400x400px or smaller
- Automatically compressed
- Appears on PDF quotations

**Company Colors:**
The app uses a blue color scheme by default. To change:
1. Primary color: Currently blue-600
2. Modify in components as needed

### Currency

**Changing Currency:**
1. Go to Settings
2. Update Currency field
3. Use ISO currency codes: XAF, USD, EUR, GBP, etc.
4. All prices will format accordingly

**Supported Currencies:**
- XAF (Central African CFA franc) - Default
- USD (US Dollar)
- EUR (Euro)
- GBP (British Pound)
- Any valid ISO 4217 currency code

### PDF Customization

**Header Appearance:**
- Company name (large, bold)
- Logo (if uploaded)
- Address, phone, email
- Blue background (#2563EB)

**Footer Notes:**
- Customizable in Settings
- Default: "Prices valid for 7 days from issue date"
- Shows at bottom of every quotation

## 👥 User Management

### Creating New Users

**Via Registration:**
1. Logout (if logged in)
2. Click "Register" on login page
3. Enter email and password
4. New user created with "Staff" role

**Default Role:**
- All new registrations = Staff role
- Admin role must be set manually in localStorage

### Roles & Permissions

**Admin:**
- Full access to all features
- Edit company settings
- Manage products
- Create/manage quotations
- Export PDFs

**Staff:**
- Manage products
- Create/manage quotations
- Export PDFs
- View settings (read-only)

## 📱 Usage Tips

### Product Management

**Best Practices:**
- Use clear, well-lit product photos
- Fill in all details for better organization
- Set realistic reorder levels
- Use consistent naming conventions
- Categorize products logically

**Image Tips:**
- Use 800x800px or smaller
- Images auto-compress to save space
- Clear background recommended
- Show product clearly

### Quotation Workflow

**Recommended Process:**
1. **Draft** - Initial creation
2. **Sent** - When shared with customer
3. **Confirmed** - When order is confirmed (reduces stock)
4. **Cancelled** - If customer declines

**Stock Management:**
- Confirming reduces stock automatically
- Cannot undo confirmation
- Update stock manually for new shipments
- Monitor low stock alerts

### WhatsApp Sharing

**Phone Number Format:**
- Include country code: +237XXXXXXXXX
- No spaces or special characters in code
- Message is pre-filled
- PDF must be attached manually

**Message Template:**
```
Hello [Customer Name],

Please find attached quotation [Quote Number] from [Company Name].

Total: [Amount]

Thank you for your business!
```

## 🔧 Technical Information

### System Requirements

**Browser:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Features Used:**
- localStorage (required)
- FileReader API (for images)
- Canvas API (for compression)
- Modern JavaScript (ES6+)

### Performance

**Storage Limits:**
- localStorage: ~5-10MB depending on browser
- Recommended max products: 500
- Recommended max quotations: 1000
- Images automatically compressed

**Optimization:**
- Images compressed to 800px max
- JPEG quality: 80%
- Minimal DOM updates
- Lazy loading where applicable

## 🐛 Troubleshooting

### Common Issues

**Cannot Login:**
- Ensure you're using correct credentials
- Default: admin@smartquote.com / password123
- Check Caps Lock is off
- Try clearing browser cache

**Images Not Uploading:**
- Check file format (JPG, PNG, WebP only)
- Ensure file size < 5MB
- Try different image
- Check browser console for errors

**PDF Not Downloading:**
- Check browser pop-up settings
- Allow downloads from this site
- Try different browser
- Ensure quotation has items

**WhatsApp Not Opening:**
- Check customer phone number format
- Ensure phone includes country code
- Try opening WhatsApp web manually
- Check browser allows opening links

**Data Lost:**
- localStorage may have been cleared
- Browser data/cache cleared
- Different browser/device
- Incognito/private mode (doesn't persist)

### Resetting Data

**Clear All Data:**
```javascript
// Open browser console (F12)
localStorage.clear()
// Refresh page
```

**Reset to Defaults:**
1. Clear all localStorage data
2. Refresh application
3. Sample data will be recreated
4. Default admin account restored

## 📊 Sample Data

The application includes sample products:
1. Digital Blood Pressure Monitor
2. Disposable Surgical Gloves
3. Infrared Thermometer

**To Remove Sample Data:**
1. Go to Products page
2. Delete each sample product
3. Add your own products

## 🔒 Security Considerations

### Current Implementation

This MVP uses **front-end only** authentication:
- Passwords stored in localStorage
- No encryption
- Not suitable for sensitive data
- Demo/development use only

### Production Recommendations

For production deployment:
1. Implement proper backend
2. Use secure authentication (JWT, OAuth)
3. Encrypt sensitive data
4. Use HTTPS only
5. Implement data backup
6. Add access logs
7. Regular security audits

## 📞 Getting Help

### Resources

**Documentation:**
- See SMARTQUOTE_README.md for features
- Check this guide for setup
- Review code comments

**Browser Console:**
- Press F12 to open developer tools
- Check Console tab for errors
- Network tab for failed requests

## 🚀 Going to Production

### Deployment Checklist

- [ ] Build optimized version
- [ ] Configure production domain
- [ ] Set up HTTPS/SSL
- [ ] Configure backend (if implementing)
- [ ] Set up database (if implementing)
- [ ] Configure file storage
- [ ] Test on all devices
- [ ] Train staff
- [ ] Backup strategy
- [ ] Monitoring setup

### Recommended Upgrades

For serious production use:
1. **Backend Integration**
   - Node.js + Express
   - PostgreSQL or MongoDB
   - Cloud storage (AWS S3, Cloudinary)

2. **Authentication**
   - JWT tokens
   - Email verification
   - Password reset
   - 2FA (optional)

3. **Features**
   - Real-time sync
   - Multi-user collaboration
   - Advanced reporting
   - Email integration
   - Payment processing

## 📝 License & Usage

This is a demonstration MVP. You may:
- Use for your business
- Modify as needed
- Deploy to production (at your own risk)
- Create derivative works

Remember:
- No warranty provided
- Security is your responsibility
- Data backup is critical
- Test thoroughly before production use

---

**Ready to get started?** Login and explore! 🎉

*Updated: March 2026*
