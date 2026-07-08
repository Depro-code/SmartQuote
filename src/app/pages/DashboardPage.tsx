import { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  expensesService,
  petitCashService,
  productsService,
  quotationsService,
  salesService,
} from '../lib/services';
import {
  AlertCircle,
  AlertTriangle,
  Banknote,
  Clock,
  CreditCard,
  FileText,
  Loader2,
  Package,
  Receipt,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { Link } from 'react-router';

// Same month/week bucketing used on SalesPage and ExpensesPage (fixed
// 1-7 / 8-15 / 16-22 / 23-end buckets, not calendar weeks) - kept
// identical so "this week" means the same thing everywhere in the app.
function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getWeekFromDate(date: string) {
  const day = new Date(date).getDate();
  if (day <= 7) return 1;
  if (day <= 15) return 2;
  if (day <= 22) return 3;
  return 4;
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

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('fr-CM', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0,
  }).format(amount);
}

interface DashboardStats {
  salesThisWeek: number;
  cashSalesThisWeek: number;
  creditSalesThisWeek: number;
  expensesThisWeek: number;
  totalProducts: number;
  lowStockCount: number;
  quotationsThisMonth: number;
  pendingQuotations: number;
  petitCashBalance: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadStats = () => {
    let isMounted = true;
    setIsPageLoading(true);
    setLoadError(null);

    const month = getCurrentMonth();
    const today = toDateInput(new Date());
    const week = getWeekFromDate(today);
    const { start, end } = getWeekRange(month, week);

    Promise.all([
      productsService.getAll(),
      productsService.getLowStock(),
      quotationsService.getAll(),
      quotationsService.getThisMonth(),
      salesService.getByMonthAndWeek(month, week),
      expensesService.getByDateRange(toDateInput(start), toDateInput(end)),
      petitCashService.getRunningBalance(),
    ])
      .then(
        ([
          products,
          lowStock,
          allQuotations,
          monthQuotations,
          weekSales,
          weekExpenses,
          petitCashBalance,
        ]) => {
          if (!isMounted) return;
          const cashSalesThisWeek = weekSales
            .filter((sale) => sale.type === 'CASH')
            .reduce((total, sale) => total + sale.grandTotal, 0);
          const creditSalesThisWeek = weekSales
            .filter((sale) => sale.type === 'CREDIT')
            .reduce((total, sale) => total + sale.grandTotal, 0);

          setStats({
            salesThisWeek: cashSalesThisWeek + creditSalesThisWeek,
            cashSalesThisWeek,
            creditSalesThisWeek,
            expensesThisWeek: weekExpenses.reduce((total, expense) => total + expense.amount, 0),
            totalProducts: products.length,
            lowStockCount: lowStock.length,
            quotationsThisMonth: monthQuotations.length,
            pendingQuotations: allQuotations.filter(
              (q) => q.status === 'DRAFT' || q.status === 'SENT',
            ).length,
            petitCashBalance,
          });
        },
      )
      .catch((error) => {
        if (!isMounted) return;
        setLoadError(
          error instanceof Error
            ? error.message
            : 'Failed to load dashboard data. Check your connection and try again.',
        );
      })
      .finally(() => {
        if (!isMounted) return;
        setIsPageLoading(false);
      });

    return () => {
      isMounted = false;
    };
  };

  useEffect(() => {
    const cleanup = loadStats();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isPageLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading dashboard…
        </div>
      </DashboardLayout>
    );
  }

  if (loadError || !stats) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-center text-muted-foreground">
          <AlertCircle className="h-6 w-6 text-destructive" />
          <p>{loadError ?? 'Something went wrong loading the dashboard.'}</p>
          <Button variant="outline" size="sm" onClick={loadStats}>
            Retry
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // Ordered by importance for the desktop 8-card layout. Mobile only ever
  // shows 4 cards - each card below carries a `visibility` flag so the
  // combined "Sales This Week" swaps for the separate Cash/Credit pair on
  // desktop while mobile still sees one joint number.
  const cards: {
    title: string;
    value: string | number;
    icon: typeof Package;
    color: string;
    bgColor: string;
    link: string;
    visibility: 'all' | 'mobile' | 'desktop';
  }[] = [
    {
      title: 'Sales This Week',
      value: formatCurrency(stats.salesThisWeek),
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      link: '/sales',
      visibility: 'mobile',
    },
    {
      title: 'Cash Sales This Week',
      value: formatCurrency(stats.cashSalesThisWeek),
      icon: Banknote,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      link: '/sales',
      visibility: 'desktop',
    },
    {
      title: 'Credit Sales This Week',
      value: formatCurrency(stats.creditSalesThisWeek),
      icon: CreditCard,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      link: '/sales',
      visibility: 'desktop',
    },
    {
      title: 'Expenses This Week',
      value: formatCurrency(stats.expensesThisWeek),
      icon: Receipt,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      link: '/expenses',
      visibility: 'all',
    },
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      link: '/products',
      visibility: 'all',
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStockCount,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      link: '/products',
      visibility: 'all',
    },
    {
      title: 'Quotations This Month',
      value: stats.quotationsThisMonth,
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      link: '/quotations',
      visibility: 'desktop',
    },
    {
      title: 'Pending Quotations',
      value: stats.pendingQuotations,
      icon: Clock,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      link: '/quotations',
      visibility: 'desktop',
    },
    {
      title: 'Petit Cash Balance',
      value: formatCurrency(stats.petitCashBalance),
      icon: Wallet,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      link: '/expenses',
      visibility: 'desktop',
    },
  ];

  const visibilityClass: Record<'all' | 'mobile' | 'desktop', string | undefined> = {
    all: undefined,
    mobile: 'block md:hidden',
    desktop: 'hidden md:block',
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome to SmartQuote Inventory</p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
          {cards.map((card) => (
            <Link
              key={card.title}
              to={card.link}
              className={visibilityClass[card.visibility]}
            >
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {card.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${card.bgColor}`}>
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-semibold text-gray-900">
                    {card.value}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {stats.lowStockCount > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center text-orange-900">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Low Stock Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-orange-800">
                You have {stats.lowStockCount} product(s) with low stock levels.{' '}
                <Link to="/products" className="underline font-medium">
                  View products
                </Link>
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link
                to="/products/new"
                className="block p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <Package className="h-5 w-5 text-blue-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Add New Product</p>
                    <p className="text-sm text-gray-600">Add items to inventory</p>
                  </div>
                </div>
              </Link>
              <Link
                to="/customers"
                className="block p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-amber-700 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Manage Customers</p>
                    <p className="text-sm text-gray-600">Save customer records for reuse</p>
                  </div>
                </div>
              </Link>
              <Link
                to="/quotations/new"
                className="block p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Create Quotation</p>
                    <p className="text-sm text-gray-600">Generate new quote</p>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Data Storage</span>
                <span className="font-medium text-gray-900">Supabase (PostgreSQL)</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Today</span>
                <span className="font-medium text-gray-900">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
              <Link
                to="/settings"
                className="inline-block text-blue-600 hover:underline text-sm"
              >
                Configure settings
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}