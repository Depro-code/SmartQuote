import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { DashboardLayout } from '../components/DashboardLayout';
import { customersService, productsService, quotationsService } from '../lib/services';
import type { Customer, Product, QuotationItem } from '../lib/types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, Calculator, CheckSquare, Plus, Search, Trash2, UserPlus } from 'lucide-react';

export default function NewQuotationPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('manual');

  const [formData, setFormData] = useState({
    customerName: '',
    issueDate: new Date().toISOString().split('T')[0],
    discount: '',
    taxRate: '',
  });

  useEffect(() => {
    setProducts(productsService.getAll().filter((p) => p.isActive));
    setCustomers(
      customersService
        .getAll()
        .sort((a, b) => a.name.localeCompare(b.name)),
    );
  }, []);

  useEffect(() => {
    if (!id) return;

    const quotation = quotationsService.getById(id);
    if (!quotation) {
      toast.error('Quotation not found');
      navigate('/quotations');
      return;
    }

    if (quotation.status === 'CONFIRMED') {
      toast.error('Confirmed quotations can only be viewed');
      navigate(`/quotations/${quotation.id}`, { replace: true });
      return;
    }

    setFormData({
      customerName: quotation.customerName,
      issueDate: quotation.issueDate,
      discount: quotation.discount ? String(quotation.discount) : '',
      taxRate: quotation.taxRate ? String(quotation.taxRate) : '',
    });
    setSelectedCustomerId(quotation.customerId || 'manual');
    setItems(quotation.items);
  }, [id, navigate]);

  useEffect(() => {
    if (selectedCustomerId === 'manual') return;
    if (!customers.some((customer) => customer.id === selectedCustomerId)) {
      setSelectedCustomerId('manual');
    }
  }, [customers, selectedCustomerId]);

  const availableProducts = products.filter(
    (product) => !items.some((item) => item.productId === product.id),
  );

  const filteredProducts = productSearchQuery
    ? availableProducts.filter((p) =>
        p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
        p.sku?.toLowerCase().includes(productSearchQuery.toLowerCase()),
      )
    : availableProducts;

  const filteredCustomers = customerSearchQuery
    ? customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
          customer.phone?.toLowerCase().includes(customerSearchQuery.toLowerCase()),
      )
    : customers;

  const getProductStock = (productId: string) =>
    products.find((product) => product.id === productId)?.quantityInStock ?? 0;

  const buildQuotationItem = (product: Product): QuotationItem => ({
    productId: product.id,
    nameSnapshot: product.name,
    unitPriceSnapshot: product.unitPrice,
    quantity: 1,
    unitSnapshot: product.unit,
    lineTotal: product.unitPrice,
  });

  const selectedCustomer =
    selectedCustomerId !== 'manual'
      ? customers.find((customer) => customer.id === selectedCustomerId) || null
      : null;

  const applyCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);

    if (customerId === 'manual') {
      return;
    }

    const customer = customers.find((entry) => entry.id === customerId);
    if (!customer) return;

    setFormData((current) => ({
      ...current,
      customerName: customer.name,
    }));
  };

  const addItem = (product: Product) => {
    if (items.some((item) => item.productId === product.id)) {
      toast.error('Product already added');
      return;
    }

    setItems([...items, buildQuotationItem(product)]);
    setShowProductDialog(false);
    setProductSearchQuery('');
    setSelectedProductIds([]);
    toast.success('Product added');
  };

  const addSelectedProducts = () => {
    if (selectedProductIds.length === 0) {
      toast.error('Select at least one product');
      return;
    }

    const selectedProducts = filteredProducts.filter((product) => selectedProductIds.includes(product.id));
    if (selectedProducts.length === 0) {
      toast.error('Selected products are no longer available');
      return;
    }

    setItems([...items, ...selectedProducts.map(buildQuotationItem)]);
    setShowProductDialog(false);
    setProductSearchQuery('');
    setSelectedProductIds([]);
    toast.success(`${selectedProducts.length} products added`);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;

    setItems(
      items.map((item) =>
        item.productId === productId
          ? { ...item, quantity, lineTotal: item.unitPriceSnapshot * quantity }
          : item,
      ),
    );
  };

  const removeItem = (productId: string) => {
    setItems(items.filter((item) => item.productId !== productId));
  };

  const toggleSelectedProduct = (productId: string) => {
    setSelectedProductIds((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId],
    );
  };

  const resetProductDialogState = (open: boolean) => {
    setShowProductDialog(open);
    if (!open) {
      setProductSearchQuery('');
      setSelectedProductIds([]);
    }
  };

  const resetCustomerDialogState = (open: boolean) => {
    setShowCustomerDialog(open);
    if (!open) {
      setCustomerSearchQuery('');
    }
  };

  const selectCustomerFromPicker = (customer: Customer) => {
    applyCustomer(customer.id);
    setShowCustomerDialog(false);
    setCustomerSearchQuery('');
    toast.success('Customer selected');
  };

  const switchToManualCustomer = () => {
    setSelectedCustomerId('manual');
    setShowCustomerDialog(false);
    setCustomerSearchQuery('');
  };

  const updateCustomerField = (
    field: 'customerName',
    value: string,
  ) => {
    setFormData((current) => ({ ...current, [field]: value }));

    if (selectedCustomerId !== 'manual') {
      const customer = customers.find((entry) => entry.id === selectedCustomerId);
      const selectedValue = 'customerName';

      if (value !== selectedValue) {
        setSelectedCustomerId('manual');
      }
    }
  };

  const calculateTotals = () => {
    const subTotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const discount = Number(formData.discount) || 0;
    const taxRate = Number(formData.taxRate) || 0;
    const taxAmount = (subTotal - discount) * (taxRate / 100);
    const grandTotal = subTotal - discount + taxAmount;

    return { subTotal, discount, taxRate, taxAmount, grandTotal };
  };

  const totals = calculateTotals();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    setLoading(true);

    try {
      if (id) {
        const existingQuotation = quotationsService.getById(id);
        if (!existingQuotation) {
          throw new Error('Quotation not found');
        }

        if (existingQuotation.status === 'CONFIRMED') {
          throw new Error('Confirmed quotations can only be viewed');
        }

        const updatedQuotation = quotationsService.update(id, {
          customerId: selectedCustomerId !== 'manual' ? selectedCustomerId : undefined,
          customerName: formData.customerName,
          issueDate: formData.issueDate,
          validUntil: undefined,
          items,
          subTotal: totals.subTotal,
          discount: totals.discount || undefined,
          taxRate: totals.taxRate || undefined,
          taxAmount: totals.taxAmount || undefined,
          grandTotal: totals.grandTotal,
          status: existingQuotation.status,
        });

        if (!updatedQuotation) {
          throw new Error('Failed to update quotation');
        }

        toast.success('Quotation updated successfully');
        navigate(`/quotations/${updatedQuotation.id}`);
      } else {
        const quotation = quotationsService.create({
          customerId: selectedCustomerId !== 'manual' ? selectedCustomerId : undefined,
          customerName: formData.customerName,
          status: 'DRAFT',
          issueDate: formData.issueDate,
          validUntil: undefined,
          items,
          subTotal: totals.subTotal,
          discount: totals.discount || undefined,
          taxRate: totals.taxRate || undefined,
          taxAmount: totals.taxAmount || undefined,
          grandTotal: totals.grandTotal,
        });

        toast.success('Quotation created successfully');
        navigate(`/quotations/${quotation.id}`);
      }
    } catch {
      toast.error(isEditMode ? 'Failed to update quotation' : 'Failed to create quotation');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/quotations')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Create Quotation</h1>
            <p className="text-gray-600 mt-1">
              {isEditMode ? 'Update quotation details' : 'Generate a new quotation'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                <div>
                  <Label>Saved Customer</Label>
                  <button
                    type="button"
                    onClick={() => setShowCustomerDialog(true)}
                    className="mt-2 flex min-h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors hover:bg-slate-50"
                  >
                    <span className={selectedCustomer ? 'text-slate-900' : 'text-slate-500'}>
                      {selectedCustomer
                        ? `${selectedCustomer.name}`
                        : 'Pick a saved customer'}
                    </span>
                    <Search className="h-4 w-4 text-slate-400" />
                  </button>
                </div>
                <Button type="button" variant="outline" onClick={() => navigate('/customers')}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Manage Customers
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => updateCustomerField('customerName', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="issueDate">Issue Date *</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Items</CardTitle>
              <Button type="button" onClick={() => setShowProductDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No items added yet. Click "Add Product" to get started.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead className="w-32">Quantity</TableHead>
                        <TableHead>Line Total</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => {
                        const stock = getProductStock(item.productId);

                        return (
                          <TableRow key={item.productId}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{item.nameSnapshot}</div>
                                {item.unitSnapshot && (
                                  <div className="text-sm text-gray-500">Unit: {item.unitSnapshot}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{formatCurrency(item.unitPriceSnapshot)}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateQuantity(item.productId, Number(e.target.value))}
                                className="w-24"
                              />
                              {item.quantity > stock && (
                                <p className="mt-1 text-xs font-medium text-orange-600">
                                  Only {stock} in stock
                                </p>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">{formatCurrency(item.lineTotal)}</TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(item.productId)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Calculations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discount">Discount (XAF)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(totals.subTotal)}</span>
                </div>
                {totals.discount > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Discount:</span>
                    <span>-{formatCurrency(totals.discount)}</span>
                  </div>
                )}
                {totals.taxAmount > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Tax ({totals.taxRate}%):</span>
                    <span>{formatCurrency(totals.taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-semibold border-t pt-2">
                  <span>Grand Total:</span>
                  <span>{formatCurrency(totals.grandTotal)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? (isEditMode ? 'Saving...' : 'Creating...') : isEditMode ? 'Save Changes' : 'Create Quotation'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/quotations')}>
              Cancel
            </Button>
          </div>
        </form>
      </div>

      <Dialog open={showProductDialog} onOpenChange={resetProductDialogState}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden p-0">
          <div className="flex max-h-[80vh] flex-col p-6">
          <DialogHeader>
            <DialogTitle>Select Product</DialogTitle>
            <DialogDescription>
              Choose one or more products to add to the quotation.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex min-h-0 flex-1 flex-col space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="button" onClick={addSelectedProducts}>
                <CheckSquare className="h-4 w-4 mr-2" />
                Add Selected ({selectedProductIds.length})
              </Button>
            </div>
            <div className="min-h-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="max-h-96 overflow-y-auto p-3 pb-12 scroll-pb-8">
                <div className="grid gap-3">
                {filteredProducts.map((product) => (
                  <ProductSelectionCard
                    key={product.id}
                    product={product}
                    isSelected={selectedProductIds.includes(product.id)}
                    formatCurrency={formatCurrency}
                    onClick={() => toggleSelectedProduct(product.id)}
                  />
                ))}
                {filteredProducts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {availableProducts.length === 0
                      ? 'All available products have already been added'
                      : 'No products found'}
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCustomerDialog} onOpenChange={resetCustomerDialogState}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden p-0">
          <div className="flex max-h-[80vh] flex-col p-6">
            <DialogHeader>
              <DialogTitle>Select Customer</DialogTitle>
              <DialogDescription>
                Pick a saved customer to prefill this quotation.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 flex min-h-0 flex-1 flex-col space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search customers..."
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button type="button" variant="outline" onClick={switchToManualCustomer}>
                  Manual Entry
                </Button>
              </div>
              <div className="min-h-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="max-h-96 overflow-y-auto p-3 pb-6">
                  <div className="grid gap-3">
                    {filteredCustomers.map((customer) => (
                      <CustomerSelectionCard
                        key={customer.id}
                        customer={customer}
                        isSelected={selectedCustomerId === customer.id}
                        onClick={() => selectCustomerFromPicker(customer)}
                      />
                    ))}
                    {filteredCustomers.length === 0 && (
                      <div className="py-8 text-center text-gray-500">
                        {customers.length === 0
                          ? 'No saved customers yet'
                          : 'No customers found'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

interface ProductSelectionCardProps {
  product: Product;
  isSelected: boolean;
  formatCurrency: (amount: number) => string;
  onClick: () => void;
}

function ProductSelectionCard({
  product,
  isSelected,
  formatCurrency,
  onClick,
}: ProductSelectionCardProps) {
  return (
    <div
      className={`flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors ${
        isSelected ? 'border-slate-900 bg-slate-100' : 'hover:bg-gray-50'
      }`}
      onClick={onClick}
    >
      <img src={product.imageUrl} alt={product.name} className="h-16 w-16 rounded object-cover" />
      <div className="flex-1">
        <div className="font-medium">{product.name}</div>
        <div className="text-sm text-gray-500">
          {product.sku && `SKU: ${product.sku} | `}
          {formatCurrency(product.unitPrice)}
          {product.unit && ` / ${product.unit}`}
        </div>
        <div className="text-sm text-gray-500">Stock: {product.quantityInStock}</div>
      </div>
      <div
        className={`flex h-6 w-6 items-center justify-center rounded border text-xs font-semibold ${
          isSelected ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 text-slate-400'
        }`}
      >
        {isSelected ? '✓' : ''}
      </div>
    </div>
  );
}

interface CustomerSelectionCardProps {
  customer: Customer;
  isSelected: boolean;
  onClick: () => void;
}

function CustomerSelectionCard({
  customer,
  isSelected,
  onClick,
}: CustomerSelectionCardProps) {
  return (
    <div
      className={`cursor-pointer rounded-lg border p-4 transition-colors ${
        isSelected ? 'border-slate-900 bg-slate-100' : 'hover:bg-gray-50'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="font-medium text-slate-900">{customer.name}</div>
          <div className="text-sm text-gray-500">
            {customer.phone || 'No phone'}
          </div>
        </div>
        <div
          className={`flex h-6 w-6 items-center justify-center rounded border text-xs font-semibold ${
            isSelected ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 text-slate-400'
          }`}
        >
          {isSelected ? '✓' : ''}
        </div>
      </div>
    </div>
  );
}
