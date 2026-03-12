import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { settingsService, imageService } from '../lib/services';
import type { Settings } from '../lib/types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { toast } from 'sonner';
import { Save, Building2, Upload } from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [formData, setFormData] = useState<Settings>({
    id: '1',
    appName: '',
    companyName: '',
    invoiceTitle: '',
    headerLine1: '',
    headerLine2: '',
    headerLine3: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    registrationNumber: '',
    taxId: '',
    currency: 'XAF',
    footerNote: '',
  });

  useEffect(() => {
    const settings = settingsService.get();
    setFormData(settings);
    if (settings.logoUrl) {
      setLogoPreview(settings.logoUrl);
    }
  }, []);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await imageService.compressImage(file, 400, 400);
        setLogoPreview(compressed);
        setFormData((prev) => ({ ...prev, logoUrl: compressed }));
      } catch (error) {
        toast.error('Failed to process logo');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      settingsService.update(formData);
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your company profile and preferences</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Logo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Logo
              </CardTitle>
              <CardDescription>
                Upload your company logo (will appear on quotation PDFs)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {logoPreview ? (
                <div className="space-y-4">
                  <img
                    src={logoPreview}
                    alt="Company logo"
                    className="h-32 w-32 rounded-lg object-contain border"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setLogoPreview('');
                      setFormData({ ...formData, logoUrl: '' });
                    }}
                  >
                    Remove Logo
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <Label htmlFor="logo" className="cursor-pointer">
                    <span className="text-blue-600 hover:underline">Upload a logo</span>
                    <span className="text-gray-600"> or drag and drop</span>
                  </Label>
                  <p className="text-sm text-gray-500 mt-2">PNG, JPG up to 2MB</p>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                This information will appear on your quotation PDFs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="appName">Application Name *</Label>
                  <Input
                    id="appName"
                    value={formData.appName}
                    onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
                    required
                    placeholder="SmartQuote Inventory"
                  />
                </div>

                <div>
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    required
                    placeholder="AMEN-CAM LTD"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                    placeholder="P.O Box 5210, Nkwen, Bamenda"
                  />
                </div>

                <div>
                  <Label htmlFor="invoiceTitle">Document Title</Label>
                  <Input
                    id="invoiceTitle"
                    value={formData.invoiceTitle || ''}
                    onChange={(e) => setFormData({ ...formData, invoiceTitle: e.target.value })}
                    placeholder="Proforma invoice no"
                  />
                </div>

                <div>
                  <Label htmlFor="headerLine1">Header Line 1</Label>
                  <Input
                    id="headerLine1"
                    value={formData.headerLine1 || ''}
                    onChange={(e) => setFormData({ ...formData, headerLine1: e.target.value })}
                    placeholder="AMAZING MEDICAL EQUIPMENT NETWORK-CAM LIMITED"
                  />
                </div>

                <div>
                  <Label htmlFor="headerLine2">Header Line 2</Label>
                  <Input
                    id="headerLine2"
                    value={formData.headerLine2 || ''}
                    onChange={(e) => setFormData({ ...formData, headerLine2: e.target.value })}
                    placeholder="Dealer in medical equipment, materials, contracts, import and general commerce"
                  />
                </div>

                <div>
                  <Label htmlFor="headerLine3">Header Line 3</Label>
                  <Input
                    id="headerLine3"
                    value={formData.headerLine3 || ''}
                    onChange={(e) => setFormData({ ...formData, headerLine3: e.target.value })}
                    placeholder="Tax Payer's No. M052014422532X CNPS No. 370-0131792-000-R"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    placeholder="+237 679689100"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="amencam77@gmail.com"
                  />
                </div>

                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website || ''}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder=""
                  />
                </div>

                <div>
                  <Label htmlFor="registrationNumber">Registration Number</Label>
                  <Input
                    id="registrationNumber"
                    value={formData.registrationNumber || ''}
                    onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                    placeholder="Tax Payer's No. M052014422532X CNPS No. 370-0131792-000-R"
                  />
                </div>

                <div>
                  <Label htmlFor="taxId">Tax ID / NIU</Label>
                  <Input
                    id="taxId"
                    value={formData.taxId || ''}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    placeholder=""
                  />
                </div>

                <div>
                  <Label htmlFor="currency">Currency *</Label>
                  <Input
                    id="currency"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    required
                    placeholder="XAF"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    ISO currency code (e.g., XAF, USD, EUR)
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="footerNote">Footer Note</Label>
                <Textarea
                  id="footerNote"
                  value={formData.footerNote}
                  onChange={(e) => setFormData({ ...formData, footerNote: e.target.value })}
                  rows={3}
                  placeholder=""
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will appear at the bottom of quotation PDFs
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>PDF Header Preview</CardTitle>
              <CardDescription>
                This is how your company information will appear on quotations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-white text-gray-900 p-6 rounded-lg border">
                {logoPreview && (
                  <img
                    src={logoPreview}
                    alt="Logo"
                    className="h-16 mb-4 object-contain"
                  />
                )}
                <h2 className="text-2xl font-semibold uppercase">{formData.companyName || 'Company Name'}</h2>
                {formData.headerLine1 && <p className="mt-1 text-sm">{formData.headerLine1}</p>}
                {formData.headerLine2 && <p className="text-sm">{formData.headerLine2}</p>}
                {formData.headerLine3 && <p className="text-sm">{formData.headerLine3}</p>}
                <p className="mt-2 text-sm">{formData.address || 'Address'}</p>
                <p className="text-sm">{formData.phone || 'Phone'} | {formData.email || 'Email'}</p>
                {formData.website && <p className="text-sm">{formData.website}</p>}
                {formData.registrationNumber && <p className="text-sm">{formData.registrationNumber}</p>}
                {formData.taxId && <p className="text-sm">{formData.taxId}</p>}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
