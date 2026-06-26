import { createBrowserRouter, Navigate } from 'react-router';
import { ProtectedRoute } from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import NewProductPage from './pages/NewProductPage';
import ProductDetailPage from './pages/ProductDetailPage';
import QuotationsPage from './pages/QuotationsPage';
import NewQuotationPage from './pages/NewQuotationPage';
import ViewQuotationPage from './pages/ViewQuotationPage';
import SettingsPage from './pages/SettingsPage';
import CustomersPage from './pages/CustomersPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/products',
    element: (
      <ProtectedRoute>
        <ProductsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/products/new',
    element: (
      <ProtectedRoute>
        <NewProductPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/products/:id',
    element: (
      <ProtectedRoute>
        <ProductDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/customers',
    element: (
      <ProtectedRoute>
        <CustomersPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/quotations',
    element: (
      <ProtectedRoute>
        <QuotationsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/quotations/new',
    element: (
      <ProtectedRoute>
        <NewQuotationPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/quotations/:id/edit',
    element: (
      <ProtectedRoute>
        <NewQuotationPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/quotations/:id',
    element: (
      <ProtectedRoute>
        <ViewQuotationPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings',
    element: (
      <ProtectedRoute>
        <SettingsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
