import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Edit, Plus, Search, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '../components/DashboardLayout';
import { Button } from '../components/ui/button';
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
import { Textarea } from '../components/ui/textarea';
import { customersService, quotationsService } from '../lib/services';
import type { Customer } from '../lib/types';

interface CustomerFormState {
  name: string;
  phone: string;
}

const EMPTY_FORM: CustomerFormState = {
  name: '',
  phone: '',
};

const CUSTOMERS_PAGE_SIZE = 10;

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteCustomerId, setDeleteCustomerId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CustomerFormState>(EMPTY_FORM);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadCustomers();
  }, []);

  const quotationCounts = useMemo(() => {
    const quotations = quotationsService.getAll();
    return quotations.reduce<Record<string, number>>((accumulator, quotation) => {
      if (quotation.customerId) {
        accumulator[quotation.customerId] = (accumulator[quotation.customerId] || 0) + 1;
      }
      return accumulator;
    }, {});
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return customers;
    return customersService.search(searchQuery);
  }, [customers, searchQuery]);

  const totalCount = filteredCustomers.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / CUSTOMERS_PAGE_SIZE));
  const from = totalCount === 0 ? 0 : (currentPage - 1) * CUSTOMERS_PAGE_SIZE + 1;
  const to = Math.min(currentPage * CUSTOMERS_PAGE_SIZE, totalCount);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * CUSTOMERS_PAGE_SIZE,
    currentPage * CUSTOMERS_PAGE_SIZE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const loadCustomers = () => {
    setCustomers(
      customersService
        .getAll()
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    );
  };

  const resetDialog = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingCustomer(null);
      setFormData(EMPTY_FORM);
    }
  };

  const handleCreate = () => {
    setEditingCustomer(null);
    setFormData(EMPTY_FORM);
    setIsDialogOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const payload = {
      name: formData.name.trim(),
      phone: formData.phone.trim() || undefined,
    };

    if (editingCustomer) {
      const updated = customersService.update(editingCustomer.id, payload);
      if (!updated) {
        toast.error('Failed to update customer');
        return;
      }
      toast.success('Customer updated');
    } else {
      customersService.create(payload);
      toast.success('Customer created');
    }

    loadCustomers();
    resetDialog(false);
  };

  const confirmDelete = () => {
    if (!deleteCustomerId) return;

    const hasLinkedQuotations = quotationsService
      .getAll()
      .some((quotation) => quotation.customerId === deleteCustomerId);

    if (hasLinkedQuotations) {
      toast.error('This customer is linked to existing quotations');
      setDeleteCustomerId(null);
      return;
    }

    const success = customersService.delete(deleteCustomerId);
    if (success) {
      toast.success('Customer deleted');
      loadCustomers();
    } else {
      toast.error('Failed to delete customer');
    }
    setDeleteCustomerId(null);
  };

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100svh-5rem)] min-h-[620px] flex-col overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border bg-card px-4 py-3 sm:px-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Customers</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage saved customers for faster quotation creation.</p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            Add Customer
          </Button>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, or phone..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-9 pl-10"
            />
          </div>
          <div className="flex h-9 items-center rounded-md border border-border bg-background px-3">
            <Users className="mr-2 h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">
                Showing {totalCount} of {customers.length}
              </div>
            </div>
          </div>
        </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto [scrollbar-gutter:stable]">
            <Table className="min-w-[980px] border-separate border-spacing-0">
              <TableHeader className="sticky top-0 z-20 bg-card">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="border-b border-border px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Name</TableHead>
                  <TableHead className="border-b border-border px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Contact</TableHead>
                  <TableHead className="border-b border-border px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Quotes</TableHead>
                  <TableHead className="border-b border-border px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Updated</TableHead>
                  <TableHead className="border-b border-border px-4 py-3 text-right text-xs font-semibold uppercase text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-[420px] text-center text-muted-foreground">
                      No customers found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCustomers.map((customer) => (
                    <TableRow key={customer.id} className="group hover:bg-muted/40">
                      <TableCell className="px-4 py-3">
                        <div className="font-medium text-foreground">{customer.name}</div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="space-y-1 text-sm">
                          <div className="text-foreground">{customer.phone || '-'}</div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">{quotationCounts[customer.id] || 0}</TableCell>
                      <TableCell className="px-4 py-3 text-muted-foreground">
                        {format(new Date(customer.updatedAt), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(customer)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setDeleteCustomerId(customer.id)}
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
              Showing {from} to {to} of {totalCount} customers
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

      <Dialog open={isDialogOpen} onOpenChange={resetDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
            <DialogDescription>
              Save customer details once, then reuse them when creating quotations.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="customer-name">Customer Name</Label>
                <Input
                  id="customer-name"
                  value={formData.name}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="customer-phone">Phone</Label>
                <Input
                  id="customer-phone"
                  value={formData.phone}
                  onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => resetDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingCustomer ? 'Save Changes' : 'Create Customer'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteCustomerId} onOpenChange={() => setDeleteCustomerId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Customers linked to quotations cannot be deleted. Remove this record only if it is no
              longer needed and has no quotation history.
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
