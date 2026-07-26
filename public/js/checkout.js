let selectedPayment = 'COD';

function renderCheckoutSummary() {
  const items = cart.getItems();
  if (!items.length) {
    window.location.href = '/cart.html';
    return;
  }

  const list = document.getElementById('checkout-items');
  list.innerHTML = items
    .map(
      (item) => `
      <div class="order-item-row">
        <img src="${item.image}" alt="${escapeHTML(item.name)}" />
        <div style="flex:1">${escapeHTML(item.name)} × ${item.qty}</div>
        <strong>Rs. ${(item.price * item.qty).toFixed(2)}</strong>
      </div>
    `
    )
    .join('');

  const subtotal = cart.subtotal();
  const shipping = subtotal >= 499 ? 0 : 49;
  document.getElementById('co-subtotal').textContent = `Rs. ${subtotal.toFixed(2)}`;
  document.getElementById('co-shipping').textContent = shipping === 0 ? 'FREE' : `Rs. ${shipping.toFixed(2)}`;
  document.getElementById('co-total').textContent = `Rs. ${(subtotal + shipping).toFixed(2)}`;
}

function selectPayment(method, el) {
  selectedPayment = method;
  document.querySelectorAll('.payment-option').forEach((o) => o.classList.remove('selected'));
  el.classList.add('selected');
}

async function placeOrder(e) {
  e.preventDefault();
  const btn = document.getElementById('place-order-btn');
  btn.disabled = true;
  btn.textContent = 'Placing order...';

  const shippingAddress = {
    fullName: document.getElementById('addr-name').value.trim(),
    phone: document.getElementById('addr-phone').value.trim(),
    address: document.getElementById('addr-line').value.trim(),
    city: document.getElementById('addr-city').value.trim(),
    state: document.getElementById('addr-state').value.trim(),
    pincode: document.getElementById('addr-pincode').value.trim(),
  };

  const items = cart.getItems().map((i) => ({ product: i.productId, qty: i.qty }));

  try {
    const order = await api.post('/orders', {
      items,
      shippingAddress,
      paymentMethod: selectedPayment,
    });
    cart.clear();
    window.location.href = `/order-success.html?id=${order._id}`;
  } catch (err) {
    showToast(err.message);
    btn.disabled = false;
    btn.textContent = 'Place Order';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!auth.requireLogin('/checkout.html')) return;
  renderCheckoutSummary();
});
