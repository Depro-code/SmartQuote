import { Link, useLocation } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Package,
  FileText,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  DollarSign,
  Banknote,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Quotations', href: '/quotations', icon: FileText },
    { name: 'Sales', href: '/sales', icon: DollarSign },
    { name: 'Expenses', href: '/expenses', icon: Banknote },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-[#111827]/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-sidebar-border">
            <h1 className="font-semibold text-lg text-white">SmartQuote</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-sidebar-foreground hover:text-sidebar-accent-foreground"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center px-4 py-3 text-sm rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[#134E4A] text-[#2DD4BF]'
                      : 'text-sidebar-foreground hover:bg-[#374151] hover:text-white'
                  }`}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User info & logout */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-sidebar-foreground">{user?.email}</p>
                <p className="text-xs text-sidebar-foreground/70 capitalize">{user?.role}</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-[#374151] hover:text-white"
              onClick={logout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex items-center h-16 px-4 bg-card border-b border-border lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="ml-4 font-semibold text-lg text-foreground">
            SmartQuote
          </h1>
        </header>

        {/* Page content */}
        <main className="p-1 lg:p-2">{children}</main>
      </div>
    </div>
  );
}
