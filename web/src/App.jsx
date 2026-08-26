import { Routes, Route } from 'react-router-dom';
import StorefrontLayout from './layouts/StorefrontLayout';
import AuthLayout from './layouts/AuthLayout';
import CustomerServicePage from './pages/CustomerServicePage';
import ShippingReturnsPage from './pages/ShippingReturnsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsPage from './pages/TermsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
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
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
