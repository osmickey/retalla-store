// Sticky mobile bottom nav. Injected here rather than copied into every page so the
// markup and the active-tab logic live in one place. Hidden on desktop via CSS.
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

function initTabbar() {
  const path = window.location.pathname;
  if (TABBAR_EXCLUDED_PATHS.includes(path)) return;
  if (document.querySelector('.mobile-tabbar')) return;

  const nav = document.createElement('nav');
  nav.className = 'mobile-tabbar';
  nav.setAttribute('aria-label', 'Primary');

  nav.innerHTML = TABBAR_ITEMS.map((item) => {
    const isActive = item.match.includes(path);
    const badge = item.icon === 'cart' ? '<span class="cart-badge tabbar-badge">0</span>' : '';
    return `
      <a href="${item.href}"${isActive ? ' class="active" aria-current="page"' : ''}>
        <span class="tab-ico" data-icon="${item.icon}" data-icon-size="21"></span>
        <span>${item.label}</span>
        ${badge}
      </a>`;
  }).join('');

  document.body.appendChild(nav);
  document.body.classList.add('has-tabbar');

  if (typeof renderIcons === 'function') renderIcons(nav);
  if (typeof updateCartBadge === 'function') updateCartBadge();
}

document.addEventListener('DOMContentLoaded', initTabbar);
