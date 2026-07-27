let selectedPayment = 'COD';

const INDIA_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

function populateStateSelect() {
  const sel = document.getElementById('addr-state');
  if (!sel) return;
  sel.innerHTML = `<option value="">Select State</option>` + INDIA_STATES.map((s) => `<option value="${s}">${s}</option>`).join('');
}

function applyCodAvailability() {
  const items = cart.getItems();
  const codBlocked = items.some((i) => i.codAvailable === false);
  const codOption = document.getElementById('payment-cod');
  const codNote = document.getElementById('payment-cod-note');
  if (!codOption) return;

  if (codBlocked) {
    codOption.classList.add('disabled');
    codOption.onclick = null;
    codNote.style.display = '';
    if (selectedPayment === 'COD') {
      selectedPayment = 'UPI';
      codOption.classList.remove('selected');
      const upiOption = document.querySelectorAll('.payment-option')[1];
      if (upiOption) upiOption.classList.add('selected');
    }
  } else {
    codOption.classList.remove('disabled');
    codOption.onclick = () => selectPayment('COD', codOption);
    codNote.style.display = 'none';
  }
}

function renderCheckoutSummary() {
  const items = cart.getItems();
  if (!items.length) {
    window.location.href = '/cart.html';
    return;
  }

  applyCodAvailability();

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
  const savings = cart.savings();
  const shipping = subtotal >= 499 ? 0 : 49;
  document.getElementById('co-subtotal').textContent = `Rs. ${subtotal.toFixed(2)}`;
  const savingsRow = document.getElementById('co-savings-row');
  if (savings > 0) {
    savingsRow.style.display = '';
    document.getElementById('co-savings').textContent = `− Rs. ${savings.toFixed(2)}`;
  } else {
    savingsRow.style.display = 'none';
  }
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

  const pincode = document.getElementById('addr-pincode').value.trim();
  if (!/^[0-9]{6}$/.test(pincode)) {
    showToast('Pincode must be exactly 6 digits.');
    document.getElementById('addr-pincode').focus();
    return;
  }

  const btn = document.getElementById('place-order-btn');
  btn.disabled = true;
  btn.textContent = 'Placing order...';

  const line1 = document.getElementById('addr-line1').value.trim();
  const line2 = document.getElementById('addr-line2').value.trim();

  const shippingAddress = {
    fullName: document.getElementById('addr-name').value.trim(),
    phone: document.getElementById('addr-phone').value.trim(),
    address: line2 ? `${line1}, ${line2}` : line1,
    city: document.getElementById('addr-city').value.trim(),
    state: document.getElementById('addr-state').value.trim(),
    pincode,
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
  populateStateSelect();
  renderCheckoutSummary();
});
