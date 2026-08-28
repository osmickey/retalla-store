import { Link } from 'react-router-dom';
import Icon from '../icons/Icon';
import { CATEGORIES } from '../lib/config';

// Multi-column footer shared by every StorefrontLayout page. Every link here
// points at a route that actually exists -- no placeholder "#" columns padded
// out to make the grid look fuller.
const SHOP_LINKS = [
  { label: 'All products', to: '/shop.html' },
  { label: 'New arrivals', to: '/shop.html?sort=new' },
  { label: 'Best sellers', to: '/shop.html?sort=bestseller' },
  { label: 'Offers', to: '/shop.html?sort=offers' },
];

const CARE_LINKS = [
  { label: 'Customer service', href: '/customer-service.html' },
  { label: 'Shipping & returns', href: '/shipping-returns.html' },
  { label: 'Privacy policy', href: '/privacy-policy.html' },
  { label: 'Terms & conditions', href: '/terms.html' },
];

const ACCOUNT_LINKS = [
  { label: 'My account', to: '/account.html' },
  { label: 'My orders', to: '/account.html?tab=orders' },
  { label: 'Wishlist', to: '/wishlist.html' },
  { label: 'Cart', to: '/cart.html' },
];

const PAYMENT_METHODS = ['Visa', 'Mastercard', 'RuPay', 'UPI', 'COD'];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand-col">
            <span className="footer-brand">Retalla</span>
            <p>
              Considered pieces for the home, the everyday and everything in between — chosen for quality, function
              and the way they feel to use.
            </p>
            <ul className="footer-assurances">
              <li>
                <Icon name="truck" size={15} /> Free shipping over Rs. 499
              </li>
              <li>
                <Icon name="return" size={15} /> 7-day returns
              </li>
            </ul>
          </div>

          <nav className="footer-col" aria-label="Shop">
            <h4>Shop</h4>
            <ul>
              {SHOP_LINKS.map((l) => (
                <li key={l.label}>
                  <Link to={l.to}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="footer-col" aria-label="Categories">
            <h4>Categories</h4>
            <ul>
              {CATEGORIES.slice(0, 5).map((c) => (
                <li key={c}>
                  <Link to={`/shop.html?category=${encodeURIComponent(c)}`}>{c}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="footer-col" aria-label="Customer care">
            <h4>Customer care</h4>
            <ul>
              {CARE_LINKS.map((l) => (
                <li key={l.label}>
                  <a href={l.href}>{l.label}</a>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="footer-col" aria-label="Account">
            <h4>Account</h4>
            <ul>
              {ACCOUNT_LINKS.map((l) => (
                <li key={l.label}>
                  <Link to={l.to}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="footer-base">
          <span>© {new Date().getFullYear()} Retalla. All rights reserved.</span>
          <ul className="footer-payments" aria-label="Accepted payment methods">
            {PAYMENT_METHODS.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
