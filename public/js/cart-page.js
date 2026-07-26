function renderCartPage() {
  const items = cart.getItems();
  const layout = document.getElementById('cart-layout');
  const emptyState = document.getElementById('cart-empty');

  if (!items.length) {
    layout.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }
  layout.style.display = 'grid';
  emptyState.style.display = 'none';

  const list = document.getElementById('cart-items-list');
  list.innerHTML = items
    .map(
      (item) => `
      <div class="cart-item">
        <img src="${item.image}" alt="${escapeHTML(item.name)}" />
        <div>
          <h4>${escapeHTML(item.name)}</h4>
          <div>Rs. ${item.price.toFixed(2)}</div>
          <a class="remove-link" href="#" onclick="event.preventDefault(); removeCartItem('${item.productId}')">Remove</a>
        </div>
        <div class="qty-stepper">
          <button onclick="changeCartQty('${item.productId}', ${item.qty - 1})">−</button>
          <input type="number" value="${item.qty}" min="1" max="${item.stock}" onchange="changeCartQty('${item.productId}', this.value)" />
          <button onclick="changeCartQty('${item.productId}', ${item.qty + 1})">+</button>
        </div>
        <strong>Rs. ${(item.price * item.qty).toFixed(2)}</strong>
      </div>
    `
    )
    .join('');

  const subtotal = cart.subtotal();
  const shipping = subtotal >= 499 || subtotal === 0 ? 0 : 49;
  document.getElementById('summary-subtotal').textContent = `Rs. ${subtotal.toFixed(2)}`;
  document.getElementById('summary-shipping').textContent = shipping === 0 ? 'FREE' : `Rs. ${shipping.toFixed(2)}`;
  document.getElementById('summary-total').textContent = `Rs. ${(subtotal + shipping).toFixed(2)}`;
}

function changeCartQty(productId, qty) {
  const q = Number(qty);
  if (!q || q < 1) return;
  cart.updateQty(productId, q);
  renderCartPage();
}

function removeCartItem(productId) {
  cart.remove(productId);
  renderCartPage();
}

function goToCheckout() {
  if (!auth.requireLogin('/checkout.html')) return;
  window.location.href = '/checkout.html';
}

document.addEventListener('DOMContentLoaded', renderCartPage);
