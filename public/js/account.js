async function loadAccount() {
  const user = auth.getUser();
  if (!user) return;

  document.getElementById('acc-name').textContent = user.name;
  document.getElementById('acc-email').textContent = user.email;

  const list = document.getElementById('orders-list');
  list.innerHTML = '<div class="loading">Loading your orders...</div>';

  try {
    const orders = await api.get('/orders/myorders');
    if (!orders.length) {
      list.innerHTML = `<div class="empty-state"><div class="icon">📦</div><p>You haven't placed any orders yet.</p><a class="btn btn-primary" href="/shop.html">Start Shopping</a></div>`;
      return;
    }
    list.innerHTML = orders.map(orderCardHTML).join('');
  } catch (err) {
    list.innerHTML = `<div class="empty-state">${err.message}</div>`;
  }
}

function orderCardHTML(order) {
  return `
    <div class="order-card">
      <div class="head">
        <div>
          <strong>Order #${order._id.slice(-8).toUpperCase()}</strong>
          <div style="font-size:0.8rem;color:var(--text-muted)">${new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
        </div>
        <span class="status-pill status-${order.status}">${order.status}</span>
      </div>
      ${order.items
        .map(
          (item) => `
        <div class="order-item-row">
          <img src="${item.image}" alt="${escapeHTML(item.name)}" />
          <div style="flex:1">${escapeHTML(item.name)} × ${item.qty}</div>
          <strong>Rs. ${(item.price * item.qty).toFixed(2)}</strong>
        </div>
      `
        )
        .join('')}
      <div class="summary-row total" style="border-top:1px solid var(--border);margin-top:10px;padding-top:10px;">
        <span>Total</span><span>Rs. ${order.totalPrice.toFixed(2)}</span>
      </div>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  if (!auth.requireLogin('/account.html')) return;
  loadAccount();
});
