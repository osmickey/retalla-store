import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Icon from '../icons/Icon';
import { useCartCount } from '../lib/cart';

// Port of public/js/tabbar.js. TABBAR_ITEMS/exclusion list kept verbatim —
// none of Phase 1's 6 routes are checkout.html, so the exclusion simply
// never triggers yet, but it's correct for when checkout is migrated later.
const TABBAR_EXCLUDED_PATHS = ['/checkout.html'];

const TABBAR_ITEMS = [
  { label: 'Home', icon: 'home', href: '/index.html', match: ['/', '/index.html'] },
  { label: 'Categories', icon: 'grid', href: '/shop.html', match: ['/shop.html', '/product.html'] },
  {
    label: 'Account',
    icon: 'user',
    href: '/account.html',
    match: ['/account.html', '/login.html', '/register.html', '/forgot-password.html', '/order-success.html'],
  },
  { label: 'Cart', icon: 'cart', href: '/cart.html', match: ['/cart.html'] },
];

export default function TabBar() {
  const { pathname } = useLocation();
  const cartCount = useCartCount();

  // body.has-tabbar is load-bearing CSS (style.css: `body.has-tabbar { padding-bottom: 58px }`)
  // that stops the fixed-position bar from covering page content on mobile. The old
  // tabbar.js set this on <body> imperatively; React renders into #root, so this
  // effect is what reproduces it.
  useEffect(() => {
    if (TABBAR_EXCLUDED_PATHS.includes(pathname)) return undefined;
    document.body.classList.add('has-tabbar');
    return () => document.body.classList.remove('has-tabbar');
  }, [pathname]);

  if (TABBAR_EXCLUDED_PATHS.includes(pathname)) return null;

  return (
    <nav className="mobile-tabbar" aria-label="Primary">
      {TABBAR_ITEMS.map((item) => {
        const isActive = item.match.includes(pathname);
        return (
          <a key={item.href} href={item.href} className={isActive ? 'active' : undefined} aria-current={isActive ? 'page' : undefined}>
            <span className="tab-ico">
              <Icon name={item.icon} size={21} />
            </span>
            <span>{item.label}</span>
            {item.icon === 'cart' && <span className="cart-badge tabbar-badge">{cartCount}</span>}
          </a>
        );
      })}
    </nav>
  );
}
