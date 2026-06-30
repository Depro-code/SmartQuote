import { Fragment, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Eye, Plus, Trash2 } from 'lucide-react';
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
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { customersService, productsService, salesService } from '../lib/services';
import type { Customer, Product, SaleItem, SaleTransaction, SaleType } from '../lib/types';

const PAGE_SIZE = 20;
const NATIVE_SELECT_CLASS =
  'h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring';
type ViewMode = 'monthly' | 'weekly';
type SaleDialogItem = SaleItem & {
  uiId: string;
  selectedProductId?: string;
  stock?: number;
  isPickerOpen?: boolean;
  productSearch?: string;
};

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getTodayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function getMonthFromDate(date: string) {
  return date.slice(0, 7);
}

function getWeekFromDate(date: string) {
  const day = new Date(date).getDate();
  if (day <= 7) return 1;
  if (day <= 15) return 2;
  if (day <= 22) return 3;
  return 4;
}

function createSaleDialogItem(): SaleDialogItem {
  return {
    uiId: `${Date.now()}-${Math.random()}`,
    description: '',
    quantity: 1,
    unitPrice: 0,
    total: 0,
  };
}

function getSaleWeek(sale: SaleTransaction) {
  return sale.week || getWeekFromDate(sale.date);
}

function getWeekRange(month: string, week: number) {
  const [year, monthNumber] = month.split('-').map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();
  const ranges: Record<number, [number, number]> = {
    1: [1, 7],
    2: [8, 15],
    3: [16, 22],
    4: [23, lastDay],
  };
  const [startDay, endDay] = ranges[week];
  return {
    start: new Date(year, monthNumber - 1, startDay),
    end: new Date(year, monthNumber - 1, endDay),
  };
}

function getWeekRangeLabel(month: string, week: number) {
  const { start, end } = getWeekRange(month, week);
  const formatter = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' });
  return `${formatter.format(start)} – ${formatter.format(end)}`;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('fr-CM', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-GB').format(new Date(date));
}

function getSaleDescription(sale: SaleTransaction) {
  if (sale.items.length === 0) return '-';
  if (sale.items.length === 1) return sale.items[0].description;
  return `${sale.items[0].description} + ${sale.items.length - 1} more`;
}

export default function SalesPage() {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [activeTab, setActiveTab] = useState<SaleType>('CASH');
  const [allSales, setAllSales] = useState<SaleTransaction[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteSaleId, setDeleteSaleId] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const sales = useMemo(
    () => {
      const filteredSales =
        viewMode === 'weekly'
          ? allSales.filter((sale) => getSaleWeek(sale) === selectedWeek)
          : allSales;

      return [...filteredSales].sort(
        (firstSale, secondSale) =>
          getSaleWeek(firstSale) - getSaleWeek(secondSale) ||
          new Date(firstSale.date).getTime() - new Date(secondSale.date).getTime(),
      );
    },
    [allSales, selectedMonth, selectedWeek, viewMode],
  );
  const totalAmount = sales.reduce((total, sale) => total + sale.grandTotal, 0);
  const totalCount = sales.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const from = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const to = Math.min(currentPage * PAGE_SIZE, totalCount);
  const paginatedSales = sales.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const weekRangeLabel = getWeekRangeLabel(selectedMonth, selectedWeek);

  const loadSales = () => {
    setAllSales(salesService.getByType(selectedMonth, activeTab));
  };

  useEffect(() => {
    loadSales();
  }, [selectedMonth, activeTab]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const handleTabChange = (type: SaleType) => {
    setActiveTab(type);
    setCurrentPage(1);
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    setCurrentPage(1);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setCurrentPage(1);
  };

  const handleWeekChange = (week: number) => {
    setSelectedWeek(week);
    setCurrentPage(1);
  };

  const confirmDelete = () => {
    if (!deleteSaleId) return;

    const success = salesService.delete(deleteSaleId);
    if (success) {
      toast.success('Sale transaction deleted');
      loadSales();
    } else {
      toast.error('Failed to delete sale transaction');
    }
    setDeleteSaleId(null);
  };

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100svh-5rem)] min-h-[620px] flex-col overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border bg-card px-4 py-3 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <h1 className="truncate text-xl font-semibold text-foreground sm:text-2xl">Sales</h1>
            <Button onClick={() => setIsAddDialogOpen(true)} className="shrink-0">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Sale</span>
            </Button>
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            <Input
              type="month"
              value={selectedMonth}
              onChange={(event) => handleMonthChange(event.target.value)}
              className="h-9 w-40 shrink-0"
            />
            <select
              value={activeTab}
              onChange={(event) => handleTabChange(event.target.value as SaleType)}
              className={`${NATIVE_SELECT_CLASS} shrink-0`}
            >
              <option value="CASH">Cash</option>
              <option value="CREDIT">Credit</option>
            </select>
            <select
              value={viewMode}
              onChange={(event) => handleViewModeChange(event.target.value as ViewMode)}
              className={`${NATIVE_SELECT_CLASS} shrink-0`}
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </select>
            {viewMode === 'weekly' && (
              <select
                value={selectedWeek}
                onChange={(event) => handleWeekChange(Number(event.target.value))}
                className={`${NATIVE_SELECT_CLASS} shrink-0`}
              >
                <option value={1}>Week 1</option>
                <option value={2}>Week 2</option>
                <option value={3}>Week 3</option>
                <option value={4}>Week 4</option>
              </select>
            )}
          </div>

          <div className="mt-2 text-sm text-muted-foreground">
            {totalCount} transactions &middot; Total: {formatCurrency(totalAmount)}
            {viewMode === 'weekly' ? ` · ${weekRangeLabel}` : ''}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto [scrollbar-gutter:stable]">
          <Table className="min-w-[980px] border-separate border-spacing-0">
            <TableHeader className="sticky top-0 z-20 bg-card">
              <TableRow className="hover:bg-transparent">
                <TableHead className="border-b border-border px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">S/N</TableHead>
                <TableHead className="border-b border-border px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Date</TableHead>
                <TableHead className="border-b border-border px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Customer</TableHead>
                <TableHead className="border-b border-border px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Description</TableHead>
                <TableHead className="border-b border-border px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Qty</TableHead>
                <TableHead className="border-b border-border px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Amount</TableHead>
                <TableHead className="border-b border-border px-4 py-3 text-right text-xs font-semibold uppercase text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-[420px] text-center text-muted-foreground">
                    No sale transactions found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedSales.map((sale, index) => {
                  const serialNumber = (currentPage - 1) * PAGE_SIZE + index + 1;
                  const previousSale = paginatedSales[index - 1];
                  const saleWeek = getSaleWeek(sale);
                  const showWeekHeader =
                    viewMode === 'monthly' &&
                    (!previousSale || getSaleWeek(previousSale) !== saleWeek);

                  return (
                    <Fragment key={sale.id}>
                      {showWeekHeader && (
                        <TableRow key={`week-${saleWeek}-${sale.id}`} className="hover:bg-transparent">
                          <TableCell colSpan={7} className="border-b border-border bg-muted/40 px-4 py-2 text-xs font-semibold uppercase text-muted-foreground">
                            Week {saleWeek} — {getWeekRangeLabel(selectedMonth, saleWeek)}
                          </TableCell>
                        </TableRow>
                      )}
                      <TableRow
                        className="group cursor-pointer hover:bg-muted/40"
                        onClick={() => navigate(`/sales/${sale.id}`)}
                      >
                        <TableCell className="px-4 py-3 text-muted-foreground">{serialNumber}</TableCell>
                        <TableCell className="px-4 py-3">{formatDate(sale.date)}</TableCell>
                        <TableCell className="max-w-[240px] truncate px-4 py-3 font-medium text-foreground">
                          {sale.customer}
                        </TableCell>
                        <TableCell className="max-w-[360px] truncate px-4 py-3 text-muted-foreground">
                          {getSaleDescription(sale)}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          {sale.items.length === 1 ? sale.items[0].quantity ?? '-' : '-'}
                        </TableCell>
                        <TableCell className="px-4 py-3 font-semibold text-foreground">
                          {formatCurrency(sale.grandTotal)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(event) => {
                                event.stopPropagation();
                                navigate(`/sales/${sale.id}`);
                              }}
                              aria-label="View sale"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(event) => {
                                event.stopPropagation();
                                setDeleteSaleId(sale.id);
                              }}
                              aria-label="Delete sale"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    </Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="border-t border-border bg-card px-4 py-3 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {from} to {to} of {totalCount} transactions
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AddSaleDialog
        activeTab={activeTab}
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={() => {
          setIsAddDialogOpen(false);
          loadSales();
        }}
      />

      <AlertDialog open={!!deleteSaleId} onOpenChange={() => setDeleteSaleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sale</AlertDialogTitle>
            <AlertDialogDescription>
              Delete this sale transaction? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

function AddSaleDialog({
  activeTab,
  open,
  onOpenChange,
  onSuccess,
}: {
  activeTab: SaleType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [date, setDate] = useState(getTodayInputValue());
  const [customer, setCustomer] = useState('');
  const [type, setType] = useState<SaleType>(activeTab);
  const [week, setWeek] = useState(String(getWeekFromDate(getTodayInputValue())));
  const [items, setItems] = useState<SaleDialogItem[]>([
    createSaleDialogItem(),
  ]);
  const inventory = useMemo(() => productsService.getAll(), []);
  const customers = useMemo(() => customersService.getAll(), []);
  const [isCustomerPickerOpen, setIsCustomerPickerOpen] = useState(false);

  const grandTotal = items.reduce((total, item) => total + item.total, 0);

  useEffect(() => {
    if (open) {
      const today = getTodayInputValue();
      setDate(today);
      setCustomer('');
      setType(activeTab);
      setWeek(String(getWeekFromDate(today)));
      setItems([createSaleDialogItem()]);
      setIsCustomerPickerOpen(false);
    }
  }, [activeTab, open]);

  const updateDate = (value: string) => {
    setDate(value);
    setWeek(String(getWeekFromDate(value)));
  };

  const updateItem = (index: number, updates: Partial<SaleDialogItem>) => {
    setItems((currentItems) =>
      currentItems.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        const nextItem = { ...item, ...updates };
        if ('quantity' in updates || 'unitPrice' in updates) {
          nextItem.total =
            nextItem.quantity === null ? nextItem.total : nextItem.quantity * nextItem.unitPrice;
        }
        return nextItem;
      }),
    );
  };

  const handleQuantityChange = (index: number, value: string) => {
    updateItem(index, { quantity: value === '' ? null : Number(value) });
  };

  const removeItem = (uiId: string) => {
    setItems((currentItems) =>
      currentItems.length === 1
        ? currentItems
        : currentItems.filter((item) => item.uiId !== uiId),
    );
  };

  const selectProduct = (index: number, product: Product) => {
    setItems((currentItems) =>
      currentItems.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        const quantity = item.quantity ?? 1;
        return {
          ...item,
          description: product.name,
          unitPrice: product.unitPrice,
          total: quantity * product.unitPrice,
          selectedProductId: product.id,
          stock: product.quantityInStock,
          isPickerOpen: false,
          productSearch: '',
        };
      }),
    );
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const saleItems = items.map((item) => ({
      description: item.description.trim(),
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: Number(item.total) || 0,
    }));

    salesService.create({
      date,
      customer: customer.trim(),
      items: saleItems,
      grandTotal,
      type,
      week: Number(week),
      month: getMonthFromDate(date),
    });

    toast.success('Sale transaction added');
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Sale</DialogTitle>
          <DialogDescription>Record a cash or credit transaction</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div>
              <Label htmlFor="sale-date">Date</Label>
              <Input
                id="sale-date"
                type="date"
                value={date}
                onChange={(event) => updateDate(event.target.value)}
                required
              />
            </div>
            <div className="relative">
              <Label htmlFor="sale-customer">Customer</Label>
              <div className="flex gap-2">
                <Input
                  id="sale-customer"
                  value={customer}
                  onChange={(event) => setCustomer(event.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={() => setIsCustomerPickerOpen((isOpen) => !isOpen)}
                >
                  Pick
                </Button>
              </div>
              {isCustomerPickerOpen && (
                <div className="absolute left-0 top-full z-40 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-md">
                  {customers.length === 0 ? (
                    <div className="px-2 py-2 text-sm text-muted-foreground">No customers found</div>
                  ) : (
                    customers.map((entry: Customer) => (
                      <button
                        key={entry.id}
                        type="button"
                        className="block w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                        onClick={() => {
                          setCustomer(entry.name);
                          setIsCustomerPickerOpen(false);
                        }}
                      >
                        {entry.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <div>
              <Label>Type</Label>
              <select
                value={type}
                onChange={(event) => setType(event.target.value as SaleType)}
                className={`${NATIVE_SELECT_CLASS} w-full`}
              >
                <option value="CASH">Cash</option>
                <option value="CREDIT">Credit</option>
              </select>
            </div>
            <div>
              <Label>Week</Label>
              <select
                value={week}
                onChange={(event) => setWeek(event.target.value)}
                className={`${NATIVE_SELECT_CLASS} w-full`}
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-foreground">Items</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setItems((currentItems) => [
                    ...currentItems,
                    createSaleDialogItem(),
                  ])
                }
              >
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </div>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={item.uiId} className="relative space-y-3 rounded-md border border-border p-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 z-10 h-8 w-8"
                    disabled={items.length === 1}
                    onClick={() => removeItem(item.uiId)}
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>

                  <div className="relative pr-10">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => updateItem(index, { isPickerOpen: !item.isPickerOpen })}
                    >
                      Pick from inventory
                    </Button>
                    {item.isPickerOpen && (
                      <div className="absolute left-0 top-10 z-30 w-full rounded-md border border-border bg-popover p-2 shadow-md">
                        <Input
                          placeholder="Search products..."
                          value={item.productSearch || ''}
                          onChange={(event) => updateItem(index, { productSearch: event.target.value })}
                          className="mb-2 h-8"
                        />
                        <div className="max-h-48 overflow-y-auto">
                          {inventory
                            .filter((product) => {
                              const query = (item.productSearch || '').toLowerCase();
                              return product.name.toLowerCase().includes(query) || product.sku?.toLowerCase().includes(query);
                            })
                            .map((product) => (
                              <button
                                key={product.id}
                                type="button"
                                className="flex w-full items-center justify-between gap-3 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                                onClick={() => selectProduct(index, product)}
                              >
                                <span className="truncate">{product.name}</span>
                                <span className="shrink-0 text-xs text-muted-foreground">Stock: {product.quantityInStock}</span>
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor={`sale-item-description-${index}`}>Description</Label>
                    <Input
                      id={`sale-item-description-${index}`}
                      value={item.description}
                      onChange={(event) => updateItem(index, { description: event.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label htmlFor={`sale-item-qty-${index}`}>Qty</Label>
                      <Input
                        id={`sale-item-qty-${index}`}
                        type="number"
                        min="0"
                        value={item.quantity ?? ''}
                        onChange={(event) => handleQuantityChange(index, event.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`sale-item-price-${index}`}>Unit Price</Label>
                      <Input
                        id={`sale-item-price-${index}`}
                        type="number"
                        min="0"
                        value={item.unitPrice}
                        onChange={(event) => updateItem(index, { unitPrice: Number(event.target.value) })}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`sale-item-total-${index}`}>Total</Label>
                      <Input
                        id={`sale-item-total-${index}`}
                        type="number"
                        min="0"
                        value={item.total}
                        readOnly={item.quantity !== null}
                        onChange={(event) => updateItem(index, { total: Number(event.target.value) })}
                      />
                    </div>
                  </div>
                  {item.stock !== undefined && item.quantity !== null && item.quantity > item.stock && (
                    <p className="mt-2 text-xs font-medium text-orange-600">Only {item.stock} in stock</p>
                  )}
                </div>
              ))}
            </div>
            <div className="rounded-md bg-muted/50 px-4 py-3">
              <span className="text-xl font-bold text-foreground">
                Grand total: {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Sale</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
