import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { ArrowLeft, Edit, Plus, Save, Trash2, X } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { quotationsService, salesService } from '../lib/services';
import type { SaleItem, SaleTransaction, SaleType } from '../lib/types';

type SaleFormState = {
  date: string;
  customer: string;
  type: SaleType;
  week: number;
  items: SaleItem[];
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('fr-CM', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-GB').format(new Date(value));
}

function getMonthFromDate(date: string) {
  return date.slice(0, 7);
}

function toInputDate(date: string) {
  return date.slice(0, 10);
}

function getWeekFromDate(date: string) {
  const day = new Date(date).getDate();
  if (day <= 7) return 1;
  if (day <= 15) return 2;
  if (day <= 22) return 3;
  return 4;
}

function toFormState(sale: SaleTransaction): SaleFormState {
  return {
    date: toInputDate(sale.date),
    customer: sale.customer,
    type: sale.type,
    week: sale.week,
    items: sale.items.length > 0
      ? sale.items.map((item) => ({ ...item }))
      : [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
  };
}

export default function SaleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sale, setSale] = useState<SaleTransaction | null>(null);
  const [formData, setFormData] = useState<SaleFormState | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    salesService.getById(id).then((foundSale) => {
      if (!isMounted) return;
      setSale(foundSale);
      if (foundSale) setFormData(toFormState(foundSale));
    });
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (!sale || !formData) {
    return (
      <DashboardLayout>
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">Sale not found</p>
          <Button className="mt-4" onClick={() => navigate('/sales')}>
            Back to Sales
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const grandTotal = formData.items.reduce((total, item) => total + item.total, 0);

  const updateItem = (index: number, updates: Partial<SaleItem>) => {
    setFormData((current) => {
      if (!current) return current;

      return {
        ...current,
        items: current.items.map((item, itemIndex) => {
          if (itemIndex !== index) return item;

          const nextItem = { ...item, ...updates };
          if ('quantity' in updates || 'unitPrice' in updates) {
            nextItem.total =
              nextItem.quantity === null ? nextItem.total : nextItem.quantity * nextItem.unitPrice;
          }
          return nextItem;
        }),
      };
    });
  };

  const handleDateChange = (date: string) => {
    setFormData({
      ...formData,
      date,
      week: getWeekFromDate(date),
    });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, unitPrice: 0, total: 0 }],
    });
  };

  const removeItem = (index: number) => {
    if (formData.items.length === 1) return;
    setFormData({
      ...formData,
      items: formData.items.filter((_, itemIndex) => itemIndex !== index),
    });
  };

  const handleSave = async () => {
    if (!id) return;

    const updated = await salesService.update(id, {
      date: formData.date,
      customer: formData.customer.trim(),
      type: formData.type,
      week: formData.week,
      month: getMonthFromDate(formData.date),
      items: formData.items.map((item) => ({
        description: item.description.trim(),
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice) || 0,
        total: Number(item.total) || 0,
      })),
      grandTotal,
    });

    if (!updated) {
      toast.error('Failed to update sale');
      return;
    }

    setSale(updated);
    setFormData(toFormState(updated));
    setIsEditing(false);
    toast.success('Sale updated');
  };

  const handleCancel = () => {
    setFormData(toFormState(sale));
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!id) return;

    const success = await salesService.delete(id);
    if (!success) {
      toast.error('Failed to delete sale');
      return;
    }

    toast.success('Sale deleted');
    navigate('/sales');
  };

  const handleGenerateQuotation = async () => {
    if (!id || !sale) return;

    const quotation = await quotationsService.create({
      customerName: sale.customer,
      status: 'DRAFT',
      issueDate: toInputDate(sale.date),
      items: sale.items.map((item, index) => ({
        productId: `sale-item-${index + 1}`,
        nameSnapshot: item.description,
        unitPriceSnapshot: item.unitPrice,
        quantity: item.quantity ?? 1,
        lineTotal: item.total,
      })),
      subTotal: sale.grandTotal,
      grandTotal: sale.grandTotal,
    });

    const updatedSale = await salesService.update(id, { quotationId: quotation.id });
    if (updatedSale) {
      setSale(updatedSale);
      setFormData(toFormState(updatedSale));
    }

    toast.success('Quotation generated');
    navigate(`/quotations/${quotation.id}`);
  };

  return (
    <DashboardLayout>
      <div className="flex min-h-[calc(100svh-5rem)] flex-col overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => navigate('/sales')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <p className="text-xs uppercase text-muted-foreground">Sale details</p>
              <h1 className="truncate text-xl font-semibold text-foreground sm:text-2xl">
                {formatDate(sale.date)} - {sale.customer}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {sale.quotationId && (
              <Button variant="outline" onClick={() => navigate(`/quotations/${sale.quotationId}`)}>
                View Quotation
              </Button>
            )}
            {!sale.quotationId && (
              <Button variant="outline" onClick={handleGenerateQuotation}>
                Generate Quotation
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate(`/receipts/new?from=sale&saleId=${sale.id}`)}>
              Generate Cash Receipt
            </Button>
            {isEditing ? (
              <>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4" />
                  Save
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            )}
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        <div className="space-y-4 overflow-auto p-4 sm:p-5">
          <div className="rounded-lg border border-border bg-background p-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <InfoField label="Date">
                {isEditing ? (
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(event) => handleDateChange(event.target.value)}
                  />
                ) : (
                  formatDate(sale.date)
                )}
              </InfoField>
              <InfoField label="Customer">
                {isEditing ? (
                  <Input
                    value={formData.customer}
                    onChange={(event) => setFormData({ ...formData, customer: event.target.value })}
                  />
                ) : (
                  sale.customer
                )}
              </InfoField>
              <InfoField label="Type">
                {isEditing ? (
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as SaleType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">CASH</SelectItem>
                      <SelectItem value="CREDIT">CREDIT</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant={sale.type === 'CASH' ? 'default' : 'secondary'}>{sale.type}</Badge>
                )}
              </InfoField>
              <InfoField label="Week">
                {isEditing ? (
                  <Select
                    value={String(formData.week)}
                    onValueChange={(value) => setFormData({ ...formData, week: Number(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  sale.week
                )}
              </InfoField>
              <InfoField label="Month">{sale.month}</InfoField>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-border bg-background">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <h2 className="font-semibold text-foreground">Items</h2>
              {isEditing && (
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
              )}
            </div>
            <div className="overflow-auto">
              <Table className="min-w-[820px] border-separate border-spacing-0">
                <TableHeader className="sticky top-0 z-20 bg-background">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="border-b border-border px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">S/N</TableHead>
                    <TableHead className="border-b border-border px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Description</TableHead>
                    <TableHead className="border-b border-border px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Qty</TableHead>
                    <TableHead className="border-b border-border px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Unit Price</TableHead>
                    <TableHead className="border-b border-border px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Amount</TableHead>
                    {isEditing && (
                      <TableHead className="border-b border-border px-4 py-3 text-right text-xs font-semibold uppercase text-muted-foreground">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formData.items.map((item, index) => (
                    <TableRow key={index} className="hover:bg-muted/40">
                      <TableCell className="px-4 py-3 text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="max-w-[420px] px-4 py-3">
                        {isEditing ? (
                          <Input
                            value={item.description}
                            onChange={(event) => updateItem(index, { description: event.target.value })}
                          />
                        ) : (
                          <span className="font-medium text-foreground">{item.description}</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {isEditing ? (
                          <Input
                            type="number"
                            min="0"
                            value={item.quantity ?? ''}
                            onChange={(event) =>
                              updateItem(index, {
                                quantity: event.target.value === '' ? null : Number(event.target.value),
                              })
                            }
                            className="w-24"
                          />
                        ) : (
                          item.quantity ?? '-'
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {isEditing ? (
                          <Input
                            type="number"
                            min="0"
                            value={item.unitPrice}
                            onChange={(event) => updateItem(index, { unitPrice: Number(event.target.value) })}
                            className="w-36"
                          />
                        ) : (
                          formatCurrency(item.unitPrice)
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 font-semibold text-foreground">
                        {isEditing ? (
                          <Input
                            type="number"
                            min="0"
                            value={item.total}
                            readOnly={item.quantity !== null}
                            onChange={(event) => updateItem(index, { total: Number(event.target.value) })}
                            className="w-36"
                          />
                        ) : (
                          formatCurrency(item.total)
                        )}
                      </TableCell>
                      {isEditing && (
                        <TableCell className="px-4 py-3 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={formData.items.length === 1}
                            onClick={() => removeItem(index)}
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="border-t border-border bg-card px-4 py-4 text-right">
              <span className="inline-flex rounded-md bg-primary/10 px-4 py-3 text-lg font-bold text-foreground">
                Grand Total: {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sale</AlertDialogTitle>
            <AlertDialogDescription>
              Delete this sale? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

function InfoField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="text-xs uppercase text-muted-foreground">{label}</Label>
      <div className="mt-1 text-sm font-medium text-foreground">{children}</div>
    </div>
  );
}