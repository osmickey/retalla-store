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
        </div>
        <div class="qty-stepper">
          <button onclick="changeCartQty('${item.productId}', ${item.qty - 1})">−</button>
          <input type="number" value="${item.qty}" min="1" max="${item.stock}" onchange="changeCartQty('${item.productId}', this.value)" />
          <button onclick="changeCartQty('${item.productId}', ${item.qty + 1})">+</button>
        </div>
        <strong>Rs. ${(item.price * item.qty).toFixed(2)}</strong>
        <button class="remove-btn" onclick="removeCartItem('${item.productId}')" aria-label="Remove item" title="Remove item">
          <span data-icon="trash" data-icon-size="16"></span>
        </button>
      </div>
    `
    )
    .join('');
  renderIcons(list);

  const subtotal = cart.subtotal();
  const savings = cart.savings();
  const shipping = subtotal >= 499 || subtotal === 0 ? 0 : 49;
  document.getElementById('summary-subtotal').textContent = `Rs. ${subtotal.toFixed(2)}`;
  const savingsRow = document.getElementById('summary-savings-row');
  if (savings > 0) {
    savingsRow.style.display = '';
    document.getElementById('summary-savings').textContent = `− Rs. ${savings.toFixed(2)}`;
  } else {
    savingsRow.style.display = 'none';
  }
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
