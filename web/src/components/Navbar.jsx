import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import Icon from '../icons/Icon';
import { useCartCount } from '../lib/cart';
import { useWishlistIds } from '../lib/wishlist';
import { useAuth } from '../lib/auth';
import { CATEGORIES } from '../lib/config';
import SidePanel from './SidePanel';
import SearchPanel from './SearchPanel';

// Links to pages outside this app's route table (/index.html, /account.html,
// /customer-service.html, etc.) stay plain <a href> on purpose. Links to pages
// that ARE in this app (Shop, Cart) use <Link> for client-side navigation.
export default function Navbar({ variant = 'simple' }) {
  if (variant === 'transparent') {
    return (
      <nav className="navbar navbar-transparent">
        <div className="container">
          <a href="/index.html" className="brand">
            Retalla
          </a>
        </div>
      </nav>
    );
  }

  if (variant === 'full') {
    return <FullNavbar />;
  }

  const cartCount = useCartCount();

  return (
    <nav className="navbar">
      <div className="container">
        <a href="/index.html" className="brand">
          Retalla
        </a>
        <div className="nav-actions" style={{ marginLeft: 'auto' }}>
          <Link className="nav-icon-link" to="/shop.html">
            <span className="icon">
              <Icon name="bag" />
            </span>
            <span>Shop</span>
          </Link>
          <Link className="nav-icon-link" to="/cart.html">
            <span className="icon">
              <Icon name="cart" />
            </span>
            <span>Cart</span>
            <span className="cart-badge">{cartCount}</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}

// Shared by Cart and Wishlist counts -- same pulse-on-increase treatment.
function CountBadge({ count }) {
  const prevCount = useRef(count);
  const bumped = count > prevCount.current;
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    prevCount.current = count;
  }, [count]);

  return (
    <motion.span
      className="cart-badge"
      animate={bumped && !reduceMotion ? { scale: [1, 1.18, 1] } : {}}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {count}
    </motion.span>
  );
}

// Reuse existing, already-seeded product data instead of new backend routes:
// bestseller passes straight through to GET /products?bestseller=true
// (already supported), new and offers are computed client-side by ShopPage
// from fields every product already has (createdAt, mrp vs price).
const SORT_LINKS = [
  { label: 'New Arrivals', sort: 'new' },
  { label: 'Best Sellers', sort: 'bestseller' },
  { label: 'Offers', sort: 'offers' },
];

function FullNavbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const cartCount = useCartCount();
  const wishlistIds = useWishlistIds();
  const user = useAuth();
  const location = useLocation();

  const closeDrawer = () => setDrawerOpen(false);

  // Subtle elevation once the page scrolls -- these pages don't sit under a
  // hero image (that's homepage-only, not built yet), so this is a modest
  // shadow/border pickup rather than a transparent-to-solid swap.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const params = new URLSearchParams(location.search);
  const activeCategory = location.pathname === '/shop.html' ? params.get('category') : null;
  const activeSort = location.pathname === '/shop.html' ? params.get('sort') : null;

  return (
    <>
      <nav className={`navbar${scrolled ? ' is-scrolled' : ''}`}>
        <div className="container">
          <button
            className={`hamburger-btn${drawerOpen ? ' open' : ''}`}
            type="button"
            aria-label={drawerOpen ? 'Close menu' : 'Menu'}
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen((v) => !v)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <a href="/index.html" className="brand">
            Retalla
          </a>
          <SearchPanel />
          <div className="nav-actions">
            <a className="nav-icon-link nav-desktop-only" href="/customer-service.html">
              <span className="icon">
                <Icon name="support" />
              </span>
              <span>Support</span>
            </a>
            {user ? (
              <Link className="nav-icon-link" to="/account.html">
                <span className="icon">
                  <Icon name="user" />
                </span>
                <span>{user.name.split(' ')[0]}</span>
              </Link>
            ) : (
              <Link className="nav-icon-link" to="/login.html">
                <span className="icon">
                  <Icon name="user" />
                </span>
                <span>Login</span>
              </Link>
            )}
            <Link className="nav-icon-link" to="/wishlist.html">
              <span className="icon">
                <Icon name="heart" />
              </span>
              <span>Wishlist</span>
              {wishlistIds.size > 0 && <CountBadge count={wishlistIds.size} />}
            </Link>
            <Link className="nav-icon-link" to="/cart.html">
              <span className="icon">
                <Icon name="cart" />
              </span>
              <span>Cart</span>
              <CountBadge count={cartCount} />
            </Link>
          </div>
        </div>
      </nav>
      <div className="category-nav">
        <div className="container category-nav-list">
          {SORT_LINKS.map((s) => (
            <Link
              key={s.sort}
              className={activeSort === s.sort ? 'active' : undefined}
              to={`/shop.html?sort=${s.sort}`}
            >
              {s.label}
            </Link>
          ))}
          <span className="category-nav-divider" aria-hidden="true"></span>
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              className={activeCategory === cat ? 'active' : undefined}
              to={`/shop.html?category=${encodeURIComponent(cat)}`}
            >
              {cat}
            </Link>
          ))}
        </div>
      </div>

      <SidePanel open={drawerOpen} onClose={closeDrawer}>
        <a href="/index.html">
          <Icon name="home" size={18} /> Home
        </a>
        {user ? (
          <Link to="/account.html" onClick={closeDrawer}>
            <Icon name="box" size={18} /> My Orders
          </Link>
        ) : (
          <Link to="/login.html" onClick={closeDrawer}>
            <Icon name="user" size={18} /> Login
          </Link>
        )}
        <Link to="/wishlist.html" onClick={closeDrawer}>
          <Icon name="heart" size={18} /> Wishlist
        </Link>
        <Link to="/cart.html" onClick={closeDrawer}>
          <Icon name="cart" size={18} /> Cart
        </Link>
        <a href="/customer-service.html">
          <Icon name="support" size={18} /> Customer Service
        </a>
        <div className="drawer-categories">
          {SORT_LINKS.map((s) => (
            <Link key={s.sort} to={`/shop.html?sort=${s.sort}`} onClick={closeDrawer}>
              {s.label}
            </Link>
          ))}
          {CATEGORIES.map((cat) => (
            <Link key={cat} to={`/shop.html?category=${encodeURIComponent(cat)}`} onClick={closeDrawer}>
              {cat}
            </Link>
          ))}
        </div>
      </SidePanel>
    </>
  );
}
