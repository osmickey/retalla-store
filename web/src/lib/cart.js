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

  add(product, qty = 1) {
    const items = this.getItems();
    const existing = items.find((i) => i.productId === product._id);
    if (existing) {
      existing.qty += qty;
    } else {
      items.push({
        productId: product._id,
        name: product.name,
        image: product.image,
        price: product.price,
        mrp: product.mrp,
        stock: product.stock,
        codAvailable: product.codAvailable !== false,
        freeDelivery: product.freeDelivery !== false,
        deliveryCharge: product.deliveryCharge || 0,
        qty,
      });
    }
    this.saveItems(items);
  },

  updateQty(productId, qty) {
    const items = this.getItems();
    const item = items.find((i) => i.productId === productId);
    if (!item) return;
    item.qty = Math.max(1, qty);
    this.saveItems(items);
  },

  remove(productId) {
    this.saveItems(this.getItems().filter((i) => i.productId !== productId));
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

export function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2200);
}
