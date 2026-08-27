import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SidePanel from './SidePanel';
import QtyStepper from './QtyStepper';
import Icon from '../icons/Icon';
import { cart } from '../lib/cart';
import { auth } from '../lib/auth';

// Right-side drawer, built entirely on the existing SidePanel (side="right"
// is already fully implemented there, just unused elsewhere so far) --
// no new slide-in mechanism. Reads cart.getItems() reactively via the same
// window events cart.js already dispatches, and calls cart.subtotal()/
// cart.savings() directly rather than re-deriving the math inline.
export default function CartDrawer({ open, onClose }) {
  const [items, setItems] = useState(() => cart.getItems());

  useEffect(() => {
    const sync = () => setItems(cart.getItems());
    window.addEventListener('retalla:cart-changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('retalla:cart-changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  function goToCheckout() {
    if (!auth.requireLogin('/checkout.html')) return;
    window.location.href = '/checkout.html';
  }

  const count = items.reduce((s, i) => s + i.qty, 0);

  return (
    <SidePanel open={open} onClose={onClose} side="right" panelClassName="cart-drawer" ariaLabel="Your cart">
      <div className="cart-drawer-head">
        <h3>Your Cart{count > 0 && ` (${count})`}</h3>
        <button type="button" className="cart-drawer-close" onClick={onClose} aria-label="Close cart">
          <Icon name="close" size={18} />
        </button>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <div className="icon-circle">
            <Icon name="cart" size={28} />
          </div>
          <p>Your cart is empty.</p>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Continue Shopping
          </button>
        </div>
      ) : (
        <>
          <div className="cart-drawer-items">
            {items.map((item) => (
              <div className="cart-drawer-item" key={item.productId + (item.variantKey || '')}>
                <img src={item.image} alt={item.name} />
                <div className="cart-drawer-item-info">
                  <span className="cart-drawer-item-name">{item.name}</span>
                  {item.variantLabel && <span className="cart-drawer-item-variant">{item.variantLabel}</span>}
                  <span className="cart-drawer-item-price">Rs. {item.price.toFixed(2)}</span>
                  <QtyStepper
                    value={item.qty}
                    max={item.stock}
                    onDecrement={() => cart.updateQty(item.productId, item.qty - 1, item.variantKey || null)}
                    onIncrement={() => cart.updateQty(item.productId, item.qty + 1, item.variantKey || null)}
                    onInputChange={(v) => Number(v) && cart.updateQty(item.productId, Number(v), item.variantKey || null)}
                  />
                </div>
                <button
                  type="button"
                  className="cart-drawer-item-remove"
                  onClick={() => cart.remove(item.productId, item.variantKey || null)}
                  aria-label={`Remove ${item.name}`}
                >
                  <Icon name="trash" size={15} />
                </button>
              </div>
            ))}
          </div>
          <div className="cart-drawer-footer">
            {cart.savings() > 0 && (
              <div className="summary-row savings">
                <span>You save</span>
                <span>− Rs. {cart.savings().toFixed(2)}</span>
              </div>
            )}
            <div className="summary-row total">
              <span>Subtotal</span>
              <span>Rs. {cart.subtotal().toFixed(2)}</span>
            </div>
            <button type="button" className="btn btn-primary btn-block" onClick={goToCheckout}>
              Checkout
            </button>
            <Link to="/cart.html" className="btn btn-outline btn-block" onClick={onClose}>
              View Full Cart
            </Link>
          </div>
        </>
      )}
    </SidePanel>
  );
}
