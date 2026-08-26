import Icon from '../icons/Icon';
import { useCartCount } from '../lib/cart';

// Links to pages outside Phase 1's route table (/index.html, /shop.html,
// /cart.html) stay plain <a href> on purpose — those pages aren't part of
// this app yet, so a React Router <Link> would be wrong here.
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

  const cartCount = useCartCount();

  return (
    <nav className="navbar">
      <div className="container">
        <a href="/index.html" className="brand">
          Retalla
        </a>
        <div className="nav-actions" style={{ marginLeft: 'auto' }}>
          <a className="nav-icon-link" href="/shop.html">
            <span className="icon">
              <Icon name="bag" />
            </span>
            <span>Shop</span>
          </a>
          <a className="nav-icon-link" href="/cart.html">
            <span className="icon">
              <Icon name="cart" />
            </span>
            <span>Cart</span>
            <span className="cart-badge">{cartCount}</span>
          </a>
        </div>
      </div>
    </nav>
  );
}
