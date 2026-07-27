const STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
let allOrders = [];

async function loadOrders() {
  const tbody = document.getElementById('orders-body');
  tbody.innerHTML = `<tr><td colspan="7" class="loading">Loading orders...</td></tr>`;
  try {
    allOrders = await adminApi.get('/orders');
    renderOrdersTable();
  } catch (err) {
    if (err.message !== 'Session expired') tbody.innerHTML = `<tr><td colspan="7" class="empty-state">${err.message}</td></tr>`;
  }
}

function renderOrdersTable() {
  const tbody = document.getElementById('orders-body');
  const statusFilter = document.getElementById('filter-status').value;
  const rows = statusFilter ? allOrders.filter((o) => o.status === statusFilter) : allOrders;

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state">No orders found.</td></tr>`;
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
        <td>
          <div class="tracking-cell">
            <input type="text" placeholder="Courier (e.g. Delhivery)" value="${escapeOrdersHtml(o.courierName || '')}" id="courier-${o._id}" />
            <input type="text" placeholder="Tracking ID" value="${escapeOrdersHtml(o.trackingId || '')}" id="tracking-${o._id}" />
            <button class="btn btn-outline btn-sm" onclick="saveTracking('${o._id}')">Save</button>
          </div>
        </td>
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

async function saveTracking(orderId) {
  const courierName = document.getElementById(`courier-${orderId}`).value.trim();
  const trackingId = document.getElementById(`tracking-${orderId}`).value.trim();
  try {
    await adminApi.put(`/orders/${orderId}/tracking`, { trackingId, courierName });
    const order = allOrders.find((o) => o._id === orderId);
    if (order) {
      order.trackingId = trackingId;
      order.courierName = courierName;
    }
    showAdminToast('Tracking info saved');
  } catch (err) {
    alert(err.message);
  }
}

function showAdminToast(message) {
  const existing = document.querySelector('.admin-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'admin-toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

function escapeOrdersHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', () => {
  if (!adminAuth.requireAdmin()) return;
  loadOrders();
  document.getElementById('filter-status').addEventListener('change', renderOrdersTable);
});
