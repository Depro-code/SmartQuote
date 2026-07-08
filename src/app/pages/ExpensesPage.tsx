import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AlertCircle, ChevronDown, ChevronLeft, ChevronRight, Edit, Loader2, Plus, Trash2 } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { Button } from '../components/ui/button';
import { LoadingButton } from '../components/ui/loading-button';
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
import { expensesService, petitCashService } from '../lib/services';
import type { Expense, PetitCash } from '../lib/types';

const PAGE_SIZE = 30;
const NATIVE_SELECT_CLASS =
  'h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring';
type ViewMode = 'monthly' | 'weekly';

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

function isInWeek(date: string, month: string, week: number) {
  const expenseDate = new Date(date);
  const { start, end } = getWeekRange(month, week);
  return (
    getMonthFromDate(date) === month &&
    expenseDate.getDate() >= start.getDate() &&
    expenseDate.getDate() <= end.getDate()
  );
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

export default function ExpensesPage() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [petitCash, setPetitCash] = useState<PetitCash>({ id: 'global', topUps: [], updatedAt: new Date().toISOString() });
  const [runningBalance, setRunningBalance] = useState(0);
  const [monthTotal, setMonthTotal] = useState(0);
  const [allTimeExpenses, setAllTimeExpenses] = useState(0);
  const [topUpsTotal, setTopUpsTotal] = useState(0);
  const [showTopUpHistory, setShowTopUpHistory] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isTopUpDialogOpen, setIsTopUpDialogOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false);
  const [removingTopUpId, setRemovingTopUpId] = useState<string | null>(null);

  const expenses = useMemo(
    () => {
      const filteredExpenses =
        viewMode === 'weekly'
          ? allExpenses.filter((expense) => isInWeek(expense.date, selectedMonth, selectedWeek))
          : allExpenses;

      return [...filteredExpenses].sort(
        (firstExpense, secondExpense) =>
          new Date(firstExpense.date).getTime() - new Date(secondExpense.date).getTime(),
      );
    },
    [allExpenses, selectedMonth, selectedWeek, viewMode],
  );
  const filteredTotal = expenses.reduce((total, expense) => total + expense.amount, 0);
  const totalCount = expenses.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const from = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const to = Math.min(currentPage * PAGE_SIZE, totalCount);
  const paginatedExpenses = expenses.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const weekRangeLabel = getWeekRangeLabel(selectedMonth, selectedWeek);
  const totalLabel =
    viewMode === 'weekly'
      ? `Total - Week ${selectedWeek} (${weekRangeLabel}): ${formatCurrency(filteredTotal)}`
      : `Total Expenses This Month: ${formatCurrency(monthTotal)}`;

  const loadExpenses = async () => {
    setIsPageLoading(true);
    try {
      const [all, cash, balance, month, topUps] = await Promise.all([
        expensesService.getAll(),
        petitCashService.get(),
        petitCashService.getRunningBalance(),
        expensesService.getMonthTotal(selectedMonth),
        petitCashService.getTotalTopUps(),
      ]);
      setAllExpenses(all.filter((expense) => expense.date.startsWith(selectedMonth)));
      setAllTimeExpenses(all.reduce((total, expense) => total + expense.amount, 0));
      setPetitCash(cash);
      setRunningBalance(balance);
      setMonthTotal(month);
      setTopUpsTotal(topUps);
    } catch (error) {
      setLoadError (
        error instanceof Error
          ? error.message
          : 'Failed to load expenses. Check your connection and try again.',
      )
    } finally {
      setIsPageLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [selectedMonth]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

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

  const confirmDelete = async () => {
    if (!deleteExpenseId) return;

    setIsDeleting(true);
    try {
      const success = await expensesService.delete(deleteExpenseId);
      if (success) {
        toast.success('Expense deleted');
        await loadExpenses();
      } else {
        toast.error('Failed to delete expense');
      }
    } finally {
      setIsDeleting(false);
      setDeleteExpenseId(null);
    }
  };

  const removeTopUp = async (id: string) => {
    setRemovingTopUpId(id);
    try {
      await petitCashService.removeTopUp(id);
      toast.success('Top-up removed');
      await loadExpenses();
    } finally {
      setRemovingTopUpId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100svh-5rem)] min-h-[620px] flex-col overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border bg-card px-4 py-3 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <h1 className="truncate text-xl font-semibold text-foreground sm:text-2xl">Expenses</h1>
            <Button onClick={() => setIsAddDialogOpen(true)} className="shrink-0">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Expense</span>
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

          <div className="mt-3 rounded-md border border-border bg-background px-3 py-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                <span>
                  Petit Cash Balance:{' '}
                  <span className={`font-bold ${runningBalance > 5000 ? 'text-green-600' : 'text-destructive'}`}>
                    {formatCurrency(runningBalance)}
                  </span>
                </span>
                <span>&middot;</span>
                <span>Added: {formatCurrency(topUpsTotal)}</span>
                <span>&middot;</span>
                <span>Spent: {formatCurrency(allTimeExpenses)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => setIsTopUpDialogOpen(true)}>
                  Top-up
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowTopUpHistory((visible) => !visible)}
                  aria-label="Toggle top-up history"
                >
                  <ChevronDown className={`h-4 w-4 transition-transform ${showTopUpHistory ? 'rotate-180' : ''}`} />
                </Button>
              </div>
            </div>
            {showTopUpHistory && (
              <div className="mt-4 space-y-2 border-t border-border pt-3">
                {petitCash.topUps.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No top-ups recorded yet.</p>
                ) : (
                  petitCash.topUps.map((topUp) => (
                    <div key={topUp.id} className="flex flex-col gap-2 rounded-md border border-border bg-card px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{formatDate(topUp.date)}</p>
                        {topUp.note && <p className="truncate text-sm text-muted-foreground">{topUp.note}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{formatCurrency(topUp.amount)}</span>
                        <LoadingButton
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeTopUp(topUp.id)}
                          isLoading={removingTopUpId === topUp.id}
                          iconOnly
                          disabled={removingTopUpId !== null}
                          aria-label="Delete top-up"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </LoadingButton>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto [scrollbar-gutter:stable]">
          {isPageLoading ? (
            <div className="flex h-[420px] items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading expenses…
            </div>
          ) : loadError ? (
            <div className="flex h-[420px] flex-col items-center justify-center gap-3 px-4 text-center text-muted-foreground">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <p>{loadError}</p>
              <Button variant="outline" size="sm" onClick={loadExpenses}>
                Retry
              </Button>
            </div>
          ) : paginatedExpenses.length === 0 ? (
            <div className="flex h-[420px] items-center justify-center text-muted-foreground">
                No expenses found
            </div>
          ) : (
          <Table className="min-w-[820px] border-separate border-spacing-0">
            <TableHeader className="sticky top-0 z-20 bg-card">
              <TableRow className="hover:bg-transparent">
                <TableHead className="border-b border-border px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">S/N</TableHead>
                <TableHead className="border-b border-border px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Date</TableHead>
                <TableHead className="border-b border-border px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Details</TableHead>
                <TableHead className="border-b border-border px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Amount</TableHead>
                <TableHead className="border-b border-border px-4 py-3 text-right text-xs font-semibold uppercase text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedExpenses.map((expense, index) => (
                  <TableRow key={expense.id} className="group hover:bg-muted/40">
                    <TableCell className="px-4 py-3 text-muted-foreground">
                      {(currentPage - 1) * PAGE_SIZE + index + 1}
                    </TableCell>
                    <TableCell className="px-4 py-3">{formatDate(expense.date)}</TableCell>
                    <TableCell className="max-w-[520px] truncate px-4 py-3 font-medium text-foreground">
                      {expense.details}
                    </TableCell>
                    <TableCell className="px-4 py-3 font-semibold text-foreground">
                      {formatCurrency(expense.amount)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setEditExpense(expense)}
                          aria-label="Edit expense"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setDeleteExpenseId(expense.id)}
                          aria-label="Delete expense"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
          )}
        </div>

        <div className="border-t border-border bg-card px-4 py-3 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="rounded-md bg-primary px-4 py-2 text-base font-bold text-primary-foreground">
              {totalLabel}
            </div>
            <div className="flex items-center gap-3 sm:justify-end">
              <p className="text-sm text-muted-foreground">
                Showing {from} to {to} of {totalCount} expenses
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
      </div>

      <AddExpenseDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={() => {
          setIsAddDialogOpen(false);
          loadExpenses();
        }}
      />

      <EditExpenseDialog
        expense={editExpense}
        open={!!editExpense}
        onOpenChange={(open) => {
          if (!open) setEditExpense(null);
        }}
        onSuccess={() => {
          setEditExpense(null);
          loadExpenses();
        }}
      />

      <AddTopUpDialog
        open={isTopUpDialogOpen}
        onOpenChange={setIsTopUpDialogOpen}
        onSuccess={() => {
          setIsTopUpDialogOpen(false);
          loadExpenses();
        }}
      />

      <AlertDialog
        open={!!deleteExpenseId}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleteExpenseId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Delete this expense? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <LoadingButton
              variant="destructive"
              onClick={confirmDelete}
              isLoading={isDeleting}
            >
              Delete
            </LoadingButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

function AddExpenseDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [date, setDate] = useState(getTodayInputValue());
  const [details, setDetails] = useState('');
  const [amount, setAmount] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDate(getTodayInputValue());
      setDetails('');
      setAmount('');
    }
  }, [open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setIsSaving(true);
    try {
      await expensesService.create({
        date,
        details: details.trim(),
        amount: Number(amount),
      });

      toast.success('Expense added');
      onSuccess();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next && isSaving) return; onOpenChange(next); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
          <DialogDescription>Record a daily expenditure</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="expense-date">Date</Label>
            <Input
              id="expense-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="expense-details">Details</Label>
            <Input
              id="expense-details"
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="expense-amount">Amount</Label>
            <Input
              id="expense-amount"
              type="number"
              min="0"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <LoadingButton type="submit" isLoading={isSaving}>Save Expense</LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditExpenseDialog({
  expense,
  open,
  onOpenChange,
  onSuccess,
}: {
  expense: Expense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [date, setDate] = useState(getTodayInputValue());
  const [details, setDetails] = useState('');
  const [amount, setAmount] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (expense) {
      setDate(expense.date);
      setDetails(expense.details);
      setAmount(String(expense.amount));
    }
  }, [expense]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!expense) return;

    setIsSaving(true);
    try {
      const updated = await expensesService.update(expense.id, {
        date,
        details: details.trim(),
        amount: Number(amount),
      });

      if (updated) {
        toast.success('Expense updated');
        onSuccess();
      } else {
        toast.error('Failed to update expense');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next && isSaving) return; onOpenChange(next); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
          <DialogDescription>Update expenditure details</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-expense-date">Date</Label>
            <Input
              id="edit-expense-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="edit-expense-details">Details</Label>
            <Input
              id="edit-expense-details"
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="edit-expense-amount">Amount</Label>
            <Input
              id="edit-expense-amount"
              type="number"
              min="0"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <LoadingButton type="submit" isLoading={isSaving}>Save Changes</LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddTopUpDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [date, setDate] = useState(getTodayInputValue());
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDate(getTodayInputValue());
      setAmount('');
      setNote('');
    }
  }, [open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setIsSaving(true);
    try {
      await petitCashService.addTopUp(date, Number(amount), note.trim() || undefined);
      toast.success('Petit cash top-up added');
      onSuccess();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next && isSaving) return; onOpenChange(next); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Top-up</DialogTitle>
          <DialogDescription>Add cash to petit cash</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="top-up-date">Date</Label>
            <Input
              id="top-up-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="top-up-amount">Amount</Label>
            <Input
              id="top-up-amount"
              type="number"
              min="0"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="top-up-note">Note</Label>
            <Input
              id="top-up-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <LoadingButton type="submit" isLoading={isSaving}>Save Top-up</LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}