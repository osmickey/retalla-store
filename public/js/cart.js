const cart = {
  KEY: 'retalla_cart',

  getItems() {
    const raw = localStorage.getItem(this.KEY);
    return raw ? JSON.parse(raw) : [];
  },

  saveItems(items) {
    localStorage.setItem(this.KEY, JSON.stringify(items));
    updateCartBadge();
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
    updateCartBadge();
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

function updateCartBadge() {
  // Matches every badge on the page — the nav one and the mobile tab bar's.
  const badges = document.querySelectorAll('.cart-badge');
  if (!badges.length) return;
  const next = cart.count();
  badges.forEach((badge) => {
    const prev = Number(badge.textContent) || 0;
    badge.textContent = next;
    if (next > prev) {
      badge.classList.remove('bump');
      void badge.offsetWidth;
      badge.classList.add('bump');
    }
  });
}

function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2200);
}

document.addEventListener('DOMContentLoaded', updateCartBadge);
