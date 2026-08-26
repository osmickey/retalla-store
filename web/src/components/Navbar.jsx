import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import Icon from '../icons/Icon';
import { useCartCount } from '../lib/cart';
import { useAuth } from '../lib/auth';
import { CATEGORIES } from '../lib/config';
import { useDelayedUnmount } from '../hooks/useDelayedUnmount';

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

function CartBadge({ count }) {
  const prevCount = useRef(count);
  const bumped = count > prevCount.current;
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    prevCount.current = count;
  }, [count]);

  return (
    <motion.span
      className="cart-badge"
      animate={bumped && !reduceMotion ? { scale: [1, 1.45, 0.9, 1] } : {}}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
    >
      {count}
    </motion.span>
  );
}

function FullNavbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const cartCount = useCartCount();
  const user = useAuth();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const closeDrawer = () => setDrawerOpen(false);

  // Escape-to-close + body scroll lock while the drawer is open. Neither
  // exists in the original inline accordion-panel drawer -- both only make
  // sense now that it's a real fixed overlay.
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeDrawer();
    };
    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [drawerOpen]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    const value = new FormData(e.target).get('search')?.toString().trim();
    closeDrawer();
    navigate(value ? `/shop.html?search=${encodeURIComponent(value)}` : '/shop.html');
  }

  const drawerVariants = reduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : { hidden: { x: '-100%' }, visible: { x: 0 } };
  const renderDrawer = useDelayedUnmount(drawerOpen, 250);

  return (
    <>
      <nav className="navbar">
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
          <form className="search-form" onSubmit={handleSearchSubmit}>
            <input type="text" name="search" placeholder="Search for gadgets, fashion, beauty & more..." />
            <button type="submit">
              <span className="icon">
                <Icon name="search" size={18} />
              </span>
            </button>
          </form>
          <div className="nav-actions">
            <a className="nav-icon-link nav-desktop-only" href="/customer-service.html">
              <span className="icon">
                <Icon name="support" />
              </span>
              <span>Support</span>
            </a>
            {user ? (
              <a className="nav-icon-link" href="/account.html">
                <span className="icon">
                  <Icon name="user" />
                </span>
                <span>{user.name.split(' ')[0]}</span>
              </a>
            ) : (
              <Link className="nav-icon-link" to="/login.html">
                <span className="icon">
                  <Icon name="user" />
                </span>
                <span>Login</span>
              </Link>
            )}
            <Link className="nav-icon-link" to="/cart.html">
              <span className="icon">
                <Icon name="cart" />
              </span>
              <span>Cart</span>
              <CartBadge count={cartCount} />
            </Link>
          </div>
        </div>
      </nav>
      <div className="category-nav">
        <div className="container category-nav-list">
          {CATEGORIES.map((cat) => (
            <Link key={cat} to={`/shop.html?category=${encodeURIComponent(cat)}`}>
              {cat}
            </Link>
          ))}
        </div>
      </div>

      {renderDrawer && (
        <motion.div
          className="drawer-backdrop"
          onClick={closeDrawer}
          animate={{ opacity: drawerOpen ? 1 : 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.2 }}
        />
      )}
      {renderDrawer && (
        <motion.div
          className="mobile-drawer open"
          variants={drawerVariants}
          animate={drawerOpen ? 'visible' : 'hidden'}
          transition={{ duration: reduceMotion ? 0 : 0.25, ease: 'easeOut' }}
        >
          <a href="/index.html">
            <Icon name="home" size={18} /> Home
          </a>
          {user ? (
            <a href="/account.html">
              <Icon name="box" size={18} /> My Orders
            </a>
          ) : (
            <Link to="/login.html" onClick={closeDrawer}>
              <Icon name="user" size={18} /> Login
            </Link>
          )}
          <Link to="/cart.html" onClick={closeDrawer}>
            <Icon name="cart" size={18} /> Cart
          </Link>
          <a href="/customer-service.html">
            <Icon name="support" size={18} /> Customer Service
          </a>
          <div className="drawer-categories">
            {CATEGORIES.map((cat) => (
              <Link key={cat} to={`/shop.html?category=${encodeURIComponent(cat)}`} onClick={closeDrawer}>
                {cat}
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </>
  );
}
