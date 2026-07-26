const STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
let allOrders = [];

async function loadOrders() {
  const tbody = document.getElementById('orders-body');
  tbody.innerHTML = `<tr><td colspan="6" class="loading">Loading orders...</td></tr>`;
  try {
    allOrders = await adminApi.get('/orders');
    renderOrdersTable();
  } catch (err) {
    if (err.message !== 'Session expired') tbody.innerHTML = `<tr><td colspan="6" class="empty-state">${err.message}</td></tr>`;
  }
}

function renderOrdersTable() {
  const tbody = document.getElementById('orders-body');
  const statusFilter = document.getElementById('filter-status').value;
  const rows = statusFilter ? allOrders.filter((o) => o.status === statusFilter) : allOrders;

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No orders found.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows
    .map(
      (o) => `
      <tr>
        <td>#${o._id.slice(-8).toUpperCase()}</td>
        <td>${o.user?.name || 'Unknown'}<br><span style="color:var(--text-muted);font-size:0.78rem;">${o.user?.email || ''}</span></td>
        <td>${o.items.length} item(s)</td>
        <td>Rs. ${o.totalPrice.toFixed(2)}</td>
        <td>
          <select class="status-pill status-${o.status}" onchange="updateStatus('${o._id}', this.value)">
            ${STATUSES.map((s) => `<option value="${s}" ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </td>
        <td>${new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
      </tr>
    `
    )
    .join('');
}

async function updateStatus(orderId, status) {
  try {
    await adminApi.put(`/orders/${orderId}/status`, { status });
    const order = allOrders.find((o) => o._id === orderId);
    if (order) order.status = status;
    renderOrdersTable();
  } catch (err) {
    alert(err.message);
    loadOrders();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!adminAuth.requireAdmin()) return;
  loadOrders();
  document.getElementById('filter-status').addEventListener('change', renderOrdersTable);
});
