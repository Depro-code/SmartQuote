import { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { quotationsService, salesService } from '../lib/services';
import type { Quotation } from '../lib/types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { ChevronLeft, ChevronRight, Plus, Search, Eye, Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { format } from 'date-fns';
import { AlertDialog } from '@radix-ui/react-alert-dialog';
import { AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { toast } from 'sonner';

const QUOTATIONS_PAGE_SIZE = 10;

export default function QuotationsPage() {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [filteredQuotations, setFilteredQuotations] = useState<Quotation[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteQuotationId, setDeleteQuotationId] = useState<string | null>(null);

  useEffect(() => {
    loadQuotations();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const applyFilter = (base: Quotation[]) => {
      const filtered = statusFilter !== 'all' ? base.filter((q) => q.status === statusFilter) : base;
      if (isMounted) setFilteredQuotations(filtered);
    };

    if (searchQuery) {
      quotationsService.search(searchQuery).then(applyFilter);
    } else {
      applyFilter(quotations);
    }

    return () => {
      isMounted = false;
    };
  }, [searchQuery, statusFilter, quotations]);

  const totalCount = filteredQuotations.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / QUOTATIONS_PAGE_SIZE));
  const from = totalCount === 0 ? 0 : (currentPage - 1) * QUOTATIONS_PAGE_SIZE + 1;
  const to = Math.min(currentPage * QUOTATIONS_PAGE_SIZE, totalCount);
  const paginatedQuotations = filteredQuotations.slice(
    (currentPage - 1) * QUOTATIONS_PAGE_SIZE,
    currentPage * QUOTATIONS_PAGE_SIZE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const loadQuotations = async () => {
    const all = await quotationsService.getAll();
    setQuotations(
      all.sort((a, b) => {
        if (a.status === 'CONFIRMED' && b.status !== 'CONFIRMED') return 1;
        if (a.status !== 'CONFIRMED' && b.status === 'CONFIRMED') return -1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }),
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: Quotation['status']) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      DRAFT: 'secondary',
      SENT: 'default',
      CONFIRMED: 'default',
      CANCELLED: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'default'}>
        {status}
      </Badge>
    );
  };

  const confirmDelete = async () => {
    if (!deleteQuotationId) return;

    // get sale id if quotation has a linked sale
    const allSales = await salesService.getAll();
    const linkedSale = allSales.find((sale) => sale.quotationId === deleteQuotationId);
    if (linkedSale) {
      // unlink the sale
      await salesService.update(linkedSale.id, { quotationId: undefined });
    }

    const success = await quotationsService.delete(deleteQuotationId);
    if (success) {
      toast.success('Quotation deleted successfully');
      loadQuotations();
    } else {
      toast.error('Error deleting quotation');
    }
    setDeleteQuotationId(null);
  };

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100svh-5rem)] min-h-[620px] flex-col overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border bg-card px-4 py-3 sm:px-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Quotations</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage your quotations</p>
          </div>
          <Button onClick={() => navigate('/quotations/new')}>
            <Plus className="h-4 w-4" />
            New Quotation
          </Button>
        </div>

        <div className="mt-3 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by quote number, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="SENT">Sent</SelectItem>
              <SelectItem value="CONFIRMED">Confirmed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex h-9 items-center rounded-md border border-border bg-background px-3 text-xs text-muted-foreground">
            Showing {totalCount} of {quotations.length}
          </div>
        </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto [scrollbar-gutter:stable]">
            <Table className="min-w-[980px] border-separate border-spacing-0">
              <TableHeader className="sticky top-0 z-20 bg-card">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="border-b border-border px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Quote #</TableHead>
                  <TableHead className="border-b border-border px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Customer</TableHead>
                  <TableHead className="border-b border-border px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Dates</TableHead>
                  <TableHead className="border-b border-border px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Items</TableHead>
                  <TableHead className="border-b border-border px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Total</TableHead>
                  <TableHead className="border-b border-border px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Status</TableHead>
                  <TableHead className="border-b border-border px-4 py-3 text-right text-xs font-semibold uppercase text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedQuotations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-[420px] text-center text-muted-foreground">
                      No quotations found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedQuotations.map((quotation) => (
                    <TableRow key={quotation.id} className="group hover:bg-muted/40" 
                      onClick={() => navigate(`/quotations/${quotation.id}`)}
                      >
                      <TableCell className="px-4 py-3 font-medium text-foreground">{quotation.quoteNumber}</TableCell>
                      <TableCell className="px-4 py-3">
                        <div>
                          <div className="font-medium text-foreground">{quotation.customerName}</div>
                          {quotation.customerPhone && (
                            <div className="text-sm text-muted-foreground">{quotation.customerPhone}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="text-sm">
                          <div className="font-medium text-foreground">
                            Created: {format(new Date(quotation.createdAt), 'MMM dd, yyyy')}
                          </div>
                          <div className="text-muted-foreground">
                            Modified: {format(new Date(quotation.updatedAt), 'MMM dd, yyyy')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">{quotation.items.length}</TableCell>
                      <TableCell className="px-4 py-3 font-medium text-foreground">{formatCurrency(quotation.grandTotal)}</TableCell>
                      <TableCell className="px-4 py-3">{getStatusBadge(quotation.status)}</TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          {quotation.status !== 'CONFIRMED' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) =>{ e.stopPropagation(); navigate(`/quotations/${quotation.id}/edit`)}}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteQuotationId(quotation.id);
                          }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

        <div className="border-t border-border bg-card px-4 py-3 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {from} to {to} of {totalCount} quotations
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

      <AlertDialog open={!!deleteQuotationId} onOpenChange={() => setDeleteQuotationId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quotation</AlertDialogTitle>
            <AlertDialogDescription>
              Delete this quotation? This cannot be undone.
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