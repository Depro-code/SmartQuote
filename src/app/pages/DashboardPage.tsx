import { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { productsService, quotationsService } from '../lib/services';
import { Package, AlertTriangle, FileText, TrendingUp } from 'lucide-react';
import { Link } from 'react-router';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockCount: 0,
    quotationsThisMonth: 0,
    totalQuotations: 0,
  });

  useEffect(() => {
    const products = productsService.getAll();
    const lowStock = productsService.getLowStock();
    const allQuotations = quotationsService.getAll();
    const monthQuotations = quotationsService.getThisMonth();

    setStats({
      totalProducts: products.length,
      lowStockCount: lowStock.length,
      quotationsThisMonth: monthQuotations.length,
      totalQuotations: allQuotations.length,
    });
  }, []);

  const cards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      link: '/products',
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStockCount,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      link: '/products',
    },
    {
      title: 'Quotations This Month',
      value: stats.quotationsThisMonth,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      link: '/quotations',
    },
    {
      title: 'Total Quotations',
      value: stats.totalQuotations,
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      link: '/quotations',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome to SmartQuote Inventory</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <Link key={card.title} to={card.link}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {card.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${card.bgColor}`}>
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold text-gray-900">
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
                <span className="font-medium text-gray-900">localStorage</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Last Updated</span>
                <span className="font-medium text-gray-900">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
              <Link
                to="/settings"
                className="inline-block text-blue-600 hover:underline text-sm"
              >
                Configure settings →
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
