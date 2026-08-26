import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { cart } from '../lib/cart';
import { auth } from '../lib/auth';
import Icon from '../icons/Icon';
import QtyStepper from '../components/QtyStepper';

const REMOVE_DURATION = 250;

// changeQty() intentionally silently ignores an invalid value (< 1 or empty)
// rather than clamping it -- same as the original changeCartQty(), preserved
// deliberately, not an oversight.
function changeQty(items, productId, qty) {
  const q = Number(qty);
  if (!q || q < 1) return items;
  return items.map((i) => (i.productId === productId ? { ...i, qty: q } : i));
}

export default function CartPage() {
  useDocumentTitle('Shopping Cart — Retalla');
  const [items, setItems] = useState(() => cart.getItems());
  // Rows fading out mid-removal, keyed by productId -- kept in `items`
  // (visually faded via `animate`, not unmounted via AnimatePresence/exit)
  // until REMOVE_DURATION elapses, so the row genuinely always finishes
  // disappearing regardless of what completion signal the animation
  // library depends on internally. See useDelayedUnmount's comment for why.
  const [removingIds, setRemovingIds] = useState(() => new Set());
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const sync = () => setItems(cart.getItems());
    window.addEventListener('retalla:cart-changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('retalla:cart-changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  function updateQty(productId, qty) {
    const next = changeQty(items, productId, qty);
    if (next !== items) {
      setItems(next);
      cart.saveItems(next);
    }
  }

  function removeItem(productId) {
    setRemovingIds((prev) => new Set(prev).add(productId));
    setTimeout(() => {
      const next = cart.getItems().filter((i) => i.productId !== productId);
      cart.saveItems(next); // updates `items` via the retalla:cart-changed listener above
      setRemovingIds((prev) => {
        const copy = new Set(prev);
        copy.delete(productId);
        return copy;
      });
    }, REMOVE_DURATION);
  }

  function goToCheckout() {
    if (!auth.requireLogin('/checkout.html')) return;
    // Real navigation -- /checkout.html isn't in this app yet.
    window.location.href = '/checkout.html';
  }

  const subtotal = items.reduce((sum, i) => sum + i.qty * i.price, 0);
  const savings = items.reduce((sum, i) => sum + i.qty * Math.max(0, (i.mrp || i.price) - i.price), 0);
  const shipping = subtotal === 0 ? 0 : (() => {
    let s = 0;
    items.forEach((i) => {
      if (i.freeDelivery === false) s = Math.max(s, i.deliveryCharge || 0);
    });
    return s;
  })();
  const total = subtotal + shipping;

  return (
    <main className="container">
      <div className="breadcrumb">
        <a href="/index.html">Home</a> / <span>Cart</span>
      </div>

      <div className="cart-head">
        <h1>Shopping Cart</h1>
        <a href="/account.html" className="btn btn-outline btn-sm">
          My Orders
        </a>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <div className="icon-circle">
            <Icon name="cart" size={30} />
          </div>
          <p>Your cart is empty.</p>
          <a className="btn btn-primary" href="/shop.html">
            Continue Shopping
          </a>
          <a className="btn btn-outline" href="/account.html" style={{ marginLeft: '8px' }}>
            My Orders
          </a>
        </div>
      ) : (
        <div className="cart-layout">
          <div id="cart-items-list">
            {items.map((item) => {
              const removing = removingIds.has(item.productId);
              return (
                <motion.div
                  key={item.productId}
                  className="cart-item"
                  layout={!reduceMotion}
                  // Under reduced motion, opacity/height are driven by a
                  // plain style prop instead of framer's animate -- verified
                  // directly that animate + a duration:0 transition does not
                  // reliably commit on *updates* once multiple sibling rows
                  // share this animate shape (only the row actually being
                  // removed should change; without this, every row briefly
                  // renders at the removed row's opacity/height, and the
                  // remaining rows never recover). Same fix as
                  // ProductPage.jsx's gallery crossfade, same root cause.
                  initial={reduceMotion ? undefined : { opacity: 0, height: 0 }}
                  animate={reduceMotion ? undefined : { opacity: removing ? 0 : 1, height: removing ? 0 : 'auto' }}
                  transition={{ duration: REMOVE_DURATION / 1000, ease: 'easeOut' }}
                  style={reduceMotion ? { opacity: removing ? 0 : 1, height: removing ? 0 : 'auto', overflow: 'hidden' } : undefined}
                >
                  <img src={item.image} alt={item.name} />
                  <div>
                    <h4>{item.name}</h4>
                    <div>Rs. {item.price.toFixed(2)}</div>
                  </div>
                  <QtyStepper
                    value={item.qty}
                    max={item.stock}
                    onDecrement={() => updateQty(item.productId, item.qty - 1)}
                    onIncrement={() => updateQty(item.productId, item.qty + 1)}
                    onInputChange={(v) => updateQty(item.productId, v)}
                  />
                  <strong>Rs. {(item.price * item.qty).toFixed(2)}</strong>
                  <button
                    className="remove-btn"
                    onClick={() => removeItem(item.productId)}
                    disabled={removing}
                    aria-label="Remove item"
                    title="Remove item"
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </motion.div>
              );
            })}
          </div>

          <div className="summary-card">
            <h3>Order Summary</h3>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>Rs. {subtotal.toFixed(2)}</span>
            </div>
            {savings > 0 && (
              <div className="summary-row savings">
                <span>Savings</span>
                <span>− Rs. {savings.toFixed(2)}</span>
              </div>
            )}
            <div className="summary-row">
              <span>Shipping</span>
              <span>{shipping === 0 ? 'FREE' : `Rs. ${shipping.toFixed(2)}`}</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>Rs. {total.toFixed(2)}</span>
            </div>
            <button className="btn btn-primary btn-block" onClick={goToCheckout}>
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
