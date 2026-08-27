import { Routes, Route } from 'react-router-dom';
import StorefrontLayout from './layouts/StorefrontLayout';
import AuthLayout from './layouts/AuthLayout';
import ToastHost from './components/ToastHost';
import ErrorBoundary from './components/ErrorBoundary';
import CustomerServicePage from './pages/CustomerServicePage';
import ShippingReturnsPage from './pages/ShippingReturnsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsPage from './pages/TermsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ShopPage from './pages/ShopPage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import WishlistPage from './pages/WishlistPage';
import AccountPage from './pages/AccountPage';
import HomePage from './pages/HomePage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <>
      <ToastHost />
      <ErrorBoundary>
        <Routes>
          <Route element={<StorefrontLayout />}>
            <Route path="/customer-service.html" element={<CustomerServicePage />} />
            <Route path="/shipping-returns.html" element={<ShippingReturnsPage />} />
            <Route path="/privacy-policy.html" element={<PrivacyPolicyPage />} />
            <Route path="/terms.html" element={<TermsPage />} />
            <Route path="/checkout.html" element={<CheckoutPage />} />
          </Route>
          <Route element={<AuthLayout />}>
            <Route path="/login.html" element={<LoginPage />} />
            <Route path="/register.html" element={<RegisterPage />} />
            <Route path="/order-success.html" element={<OrderSuccessPage />} />
          </Route>
          <Route element={<StorefrontLayout navbarVariant="full" />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/index.html" element={<HomePage />} />
            <Route path="/shop.html" element={<ShopPage />} />
            <Route path="/product.html" element={<ProductPage />} />
            <Route path="/cart.html" element={<CartPage />} />
            <Route path="/wishlist.html" element={<WishlistPage />} />
            <Route path="/account.html" element={<AccountPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ErrorBoundary>
    </>
  );
}
