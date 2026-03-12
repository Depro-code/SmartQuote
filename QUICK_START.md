# SmartQuote Inventory - Quick Start Guide

## 🚀 30-Second Start

1. **Login:** `admin@smartquote.com` / `password123`
2. **Settings:** Add company info & logo
3. **Products:** Add your inventory items
4. **Quotations:** Create quotes & export PDFs
5. **Share:** Send via WhatsApp

---

## 📍 Navigation

| Page | Path | Purpose |
|------|------|---------|
| Dashboard | `/dashboard` | Overview & stats |
| Products | `/products` | Manage inventory |
| Quotations | `/quotations` | Manage quotes |
| Settings | `/settings` | Company profile |

---

## 🔑 Default Credentials

```
Email: admin@smartquote.com
Password: password123
```

---

## ⚡ Common Tasks

### Add a Product
1. Products → Add Product
2. Upload image
3. Fill details
4. Save

### Create Quotation
1. Quotations → New Quotation
2. Enter customer info
3. Add products
4. Create

### Export PDF
1. Open quotation
2. Export PDF
3. Share via WhatsApp

### Update Settings
1. Settings
2. Upload logo
3. Update company info
4. Save

---

## 💾 Data Storage

**Location:** Browser localStorage

**Keys:**
- `smartquote_users`
- `smartquote_current_user`
- `smartquote_settings`
- `smartquote_products`
- `smartquote_quotations`

**To Reset:** Clear browser localStorage

---

## 🎨 Customization

**Logo:** Settings → Upload logo

**Currency:** Settings → Currency field (XAF, USD, EUR)

**Footer:** Settings → Footer note

**Company:** Settings → All company fields

---

## 📱 WhatsApp Sharing

**Requirements:**
- Customer phone number
- Downloaded PDF

**Process:**
1. Export PDF (downloads automatically)
2. Click "Share via WhatsApp"
3. WhatsApp opens with message
4. Manually attach PDF
5. Send

---

## 🔄 Quotation Workflow

```
DRAFT → SENT → CONFIRMED → (Stock reduced)
           ↓
       CANCELLED
```

**Important:** Confirming reduces stock automatically!

---

## ⚠️ Important Notes

✅ **Do:**
- Set reorder levels for low stock alerts
- Export important quotations as PDFs
- Update stock after receiving shipments
- Use consistent product naming

❌ **Don't:**
- Clear browser data (will lose all data)
- Use for sensitive personal information
- Confirm quotations unless order is final
- Use in incognito/private mode (won't persist)

---

## 🐛 Quick Troubleshooting

**Can't login?**
→ Use: admin@smartquote.com / password123

**No data showing?**
→ Refresh page, sample data will load

**Images not uploading?**
→ Use JPG/PNG, max 5MB

**PDF not downloading?**
→ Check browser pop-up settings

**Lost all data?**
→ localStorage was cleared, refresh for sample data

---

## 📊 Sample Data Included

**Products (3):**
1. Digital Blood Pressure Monitor
2. Disposable Surgical Gloves
3. Infrared Thermometer

**Users (1):**
- Admin account (admin@smartquote.com)

**Delete sample data from Products page**

---

## 🎯 Best Practices

**Products:**
- Use clear images (800x800px)
- Fill all fields
- Set reorder levels
- Organize by category

**Quotations:**
- Review before sending
- Mark "Sent" when shared
- Only confirm when paid
- Use notes for special terms

**Images:**
- Clear, well-lit photos
- White/neutral background
- Show product clearly
- Under 2MB per image

---

## 🔒 Security

**Current:** localStorage (demo-grade)

**For Production:**
- Implement backend
- Use secure authentication
- Enable HTTPS
- Add data backup
- Don't store sensitive data

---

## 📚 Full Documentation

- **SMARTQUOTE_README.md** - Complete features
- **SETUP_GUIDE.md** - Detailed setup
- **FEATURES_CHECKLIST.md** - All features
- **PROJECT_SUMMARY.md** - Technical overview

---

## 💡 Pro Tips

1. **Logo:** PNG with transparent background works best
2. **Phone:** Include country code (+237...)
3. **Currency:** Use ISO codes (XAF, USD, EUR)
4. **Stock:** Confirm quotations to auto-reduce
5. **Search:** Works on name, SKU, category
6. **Backup:** Export important PDFs regularly

---

## ⌨️ Keyboard Shortcuts

- **Search:** Click search field, start typing
- **ESC:** Close dialogs
- **Tab:** Navigate forms
- **Enter:** Submit forms

---

## 📞 Need Help?

1. Check documentation files
2. Open browser console (F12)
3. Review error messages
4. Try different browser
5. Clear localStorage and refresh

---

## 🎉 You're Ready!

**Start using SmartQuote Inventory now!**

1. Login
2. Configure settings
3. Add products
4. Create quotations
5. Export & share

**Happy selling! 🚀**

---

*Quick Start Guide - Version 1.0.0*
