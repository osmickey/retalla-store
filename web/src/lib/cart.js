import { useEffect, useState } from 'react';

// Port of public/js/cart.js. updateCartBadge()'s manual multi-node DOM sync
// (nav badge + tab-bar badge) is replaced by useCartCount() below — each
// component that needs the count just reads it independently from the same
// localStorage source, so there's nothing to keep in sync by hand anymore.

export const cart = {
  KEY: 'retalla_cart',

  getItems() {
    const raw = localStorage.getItem(this.KEY);
    return raw ? JSON.parse(raw) : [];
  },

  saveItems(items) {
    localStorage.setItem(this.KEY, JSON.stringify(items));
    window.dispatchEvent(new Event('retalla:cart-changed'));
  },

  // variant: { key, label, image, priceDelta } | null -- lets two different
  // variants of the same product coexist as distinct cart lines instead of
  // colliding into one ambiguous line. Every existing call site omits this
  // param, so (i.variantKey || null) === (variant?.key || null) is always
  // null === null there -- identical merge behavior to before this changed.
  add(product, qty = 1, variant = null) {
    const items = this.getItems();
    const existing = items.find(
      (i) => i.productId === product._id && (i.variantKey || null) === (variant?.key || null)
    );
    if (existing) {
      existing.qty += qty;
    } else {
      items.push({
        productId: product._id,
        name: product.name,
        image: variant?.image || product.image,
        price: product.price + (variant?.priceDelta || 0),
        mrp: product.mrp + (variant?.priceDelta || 0),
        stock: product.stock,
        codAvailable: product.codAvailable !== false,
        freeDelivery: product.freeDelivery !== false,
        deliveryCharge: product.deliveryCharge || 0,
        qty,
        ...(variant ? { variantKey: variant.key, variantLabel: variant.label } : {}),
      });
    }
    this.saveItems(items);
  },

  updateQty(productId, qty, variantKey = null) {
    const items = this.getItems();
    const item = items.find((i) => i.productId === productId && (i.variantKey || null) === variantKey);
    if (!item) return;
    item.qty = Math.max(1, qty);
    this.saveItems(items);
  },

  remove(productId, variantKey = null) {
    this.saveItems(
      this.getItems().filter((i) => !(i.productId === productId && (i.variantKey || null) === variantKey))
    );
  },

  clear() {
    localStorage.removeItem(this.KEY);
    window.dispatchEvent(new Event('retalla:cart-changed'));
  },

  count() {
    return this.getItems().reduce((sum, i) => sum + i.qty, 0);
  },

  subtotal() {
    return this.getItems().reduce((sum, i) => sum + i.qty * i.price, 0);
  },

  savings() {
    return this.getItems().reduce((sum, i) => sum + i.qty * Math.max(0, (i.mrp || i.price) - i.price), 0);
  },

  computeShipping() {
    let shipping = 0;
    this.getItems().forEach((i) => {
      if (i.freeDelivery === false) {
        shipping = Math.max(shipping, i.deliveryCharge || 0);
      }
    });
    return shipping;
  },
};

export function useCartCount() {
  const [count, setCount] = useState(() => cart.count());
  useEffect(() => {
    const sync = () => setCount(cart.count());
    window.addEventListener('storage', sync); // cross-tab
    window.addEventListener('retalla:cart-changed', sync); // same-tab
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('retalla:cart-changed', sync);
    };
  }, []);
  return count;
}

// Dispatches to <ToastHost> (mounted once at the app root), which animates the
// message in and out with framer-motion — the old DOM-imperative version just
// yanked the node out via setTimeout+remove() with no way to animate out.
// type is 'success' (default, unchanged behavior for existing callers) or
// 'error' -- ToastHost uses it only for a left-border color distinction.
export function showToast(message, type = 'success') {
  window.dispatchEvent(new CustomEvent('retalla:toast', { detail: { message, type } }));
}
