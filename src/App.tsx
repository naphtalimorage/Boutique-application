import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/components/ui/toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ProtectedRoute, PublicOnlyRoute } from '@/components/ProtectedRoute';
import Header from '@/components/Header';
import DashboardLayout from '@/components/DashboardLayout';

// Customer Pages
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import CartPage from '@/pages/CartPage';
import WishlistPage from '@/pages/WishlistPage';
import CheckoutPage from '@/pages/CheckoutPage';
import OrderConfirmationPage from '@/pages/OrderConfirmationPage';

// Dashboard Pages
import DashboardPage from '@/pages/dashboard/DashboardPage';
import ProductsPage from '@/pages/dashboard/ProductsPage';
import SalesPage from '@/pages/dashboard/SalesPage';

// Animated route wrapper
function AnimatedRoute({ children }: { children: React.ReactNode }) {
  return <div className="animate-fade-in">{children}</div>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes with Header */}
      <Route path="/" element={
        <AnimatedRoute>
          <div className="min-h-screen bg-background">
            <Header />
            <HomePage />
            <footer className="bg-dark text-white py-8 mt-12">
              <div className="max-w-7xl mx-auto px-4 text-center text-sm">
                <p>&copy; {new Date().getFullYear()} Lin Collection. All rights reserved.</p>
              </div>
            </footer>
          </div>
        </AnimatedRoute>
      } />
      <Route path="/product/:id" element={
        <AnimatedRoute>
          <div className="min-h-screen bg-background">
            <Header />
            <ProductDetailPage />
          </div>
        </AnimatedRoute>
      } />
      <Route path="/cart" element={
        <AnimatedRoute>
          <div className="min-h-screen bg-background">
            <Header />
            <CartPage />
          </div>
        </AnimatedRoute>
      } />
      <Route path="/wishlist" element={
        <AnimatedRoute>
          <div className="min-h-screen bg-background">
            <Header />
            <WishlistPage />
          </div>
        </AnimatedRoute>
      } />
      <Route path="/checkout" element={
        <AnimatedRoute>
          <div className="min-h-screen bg-background">
            <Header />
            <CheckoutPage />
          </div>
        </AnimatedRoute>
      } />
      <Route path="/order-confirmation" element={
        <AnimatedRoute>
          <div className="min-h-screen bg-background">
            <Header />
            <OrderConfirmationPage />
          </div>
        </AnimatedRoute>
      } />
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <AnimatedRoute>
              <LoginPage />
            </AnimatedRoute>
          </PublicOnlyRoute>
        }
      />

      {/* Protected Dashboard Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requireStaff>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AnimatedRoute><DashboardPage /></AnimatedRoute>} />
        <Route path="products" element={<AnimatedRoute><ProductsPage /></AnimatedRoute>} />
        <Route path="sales" element={<AnimatedRoute><SalesPage /></AnimatedRoute>} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <BrowserRouter>
                  <AppRoutes />
                </BrowserRouter>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
