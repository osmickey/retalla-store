import { Routes, Route } from 'react-router-dom';
import StorefrontLayout from './layouts/StorefrontLayout';
import AuthLayout from './layouts/AuthLayout';
import ToastHost from './components/ToastHost';
import CustomerServicePage from './pages/CustomerServicePage';
import ShippingReturnsPage from './pages/ShippingReturnsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsPage from './pages/TermsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ShopPage from './pages/ShopPage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <>
      <ToastHost />
      <Routes>
        <Route element={<StorefrontLayout />}>
          <Route path="/customer-service.html" element={<CustomerServicePage />} />
          <Route path="/shipping-returns.html" element={<ShippingReturnsPage />} />
          <Route path="/privacy-policy.html" element={<PrivacyPolicyPage />} />
          <Route path="/terms.html" element={<TermsPage />} />
        </Route>
        <Route element={<AuthLayout />}>
          <Route path="/login.html" element={<LoginPage />} />
          <Route path="/register.html" element={<RegisterPage />} />
        </Route>
        <Route element={<StorefrontLayout navbarVariant="full" />}>
          <Route path="/shop.html" element={<ShopPage />} />
          <Route path="/product.html" element={<ProductPage />} />
          <Route path="/cart.html" element={<CartPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
