const STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
let allOrders = [];

async function loadOrders() {
  const tbody = document.getElementById('orders-body');
  tbody.innerHTML = `<tr><td colspan="8" class="loading">Loading orders...</td></tr>`;
  try {
    allOrders = await adminApi.get('/orders');
    renderOrdersTable();
  } catch (err) {
    if (err.message !== 'Session expired') tbody.innerHTML = `<tr><td colspan="8" class="empty-state">${err.message}</td></tr>`;
  }
}

function renderOrdersTable() {
  const tbody = document.getElementById('orders-body');
  const statusFilter = document.getElementById('filter-status').value;
  const rows = statusFilter ? allOrders.filter((o) => o.status === statusFilter) : allOrders;

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-state">No orders found.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows
    .map(
      (o) => `
      <tr>
        <td>#${o._id.slice(-8).toUpperCase()}</td>
        <td>${o.user?.name || 'Unknown'}<br><span style="color:var(--text-muted);font-size:0.78rem;">${o.user?.email || ''}</span></td>
        <td>
          <div class="order-items-cell">
            ${o.items
              .map(
                (item) => `
              <div class="order-item-line">
                <span>${escapeOrdersHtml(item.name)} × ${item.qty}</span>
                ${item.sku ? `<code class="sku-code">${escapeOrdersHtml(item.sku)}</code>` : ''}
              </div>
            `
              )
              .join('')}
          </div>
        </td>
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
        <td>
          <button class="btn btn-outline btn-sm" onclick="printOrder('${o._id}')"><span data-icon="receipt" data-icon-size="14"></span> Print</button>
        </td>
      </tr>
    `
    )
    .join('');
  if (typeof renderIcons === 'function') renderIcons(tbody);
}

function printOrder(orderId) {
  const o = allOrders.find((x) => x._id === orderId);
  if (!o) return;

  const orderNumber = `#${o._id.slice(-8).toUpperCase()}`;
  const orderDate = new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const addr = o.shippingAddress || {};

  const itemRows = o.items
    .map(
      (item) => `
      <tr>
        <td>${escapeOrdersHtml(item.name)}</td>
        <td>${item.sku ? escapeOrdersHtml(item.sku) : '—'}</td>
        <td style="text-align:center;">${item.qty}</td>
        <td style="text-align:right;">Rs. ${item.price.toFixed(2)}</td>
        <td style="text-align:right;">Rs. ${(item.price * item.qty).toFixed(2)}</td>
      </tr>
    `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <title>Order ${orderNumber} — Retalla</title>
      <style>
        body { font-family: Arial, Helvetica, sans-serif; color: #1a1730; padding: 40px; max-width: 720px; margin: 0 auto; }
        h1 { font-size: 22px; margin-bottom: 2px; }
        .muted { color: #6b7280; font-size: 13px; }
        .row { display: flex; justify-content: space-between; margin: 24px 0; gap: 24px; }
        .box h3 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.04em; color: #6b7280; margin-bottom: 6px; }
        .box p { margin: 2px 0; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 8px 6px; border-bottom: 1px solid #e5e7eb; font-size: 13px; text-align: left; }
        th { text-transform: uppercase; font-size: 11px; letter-spacing: 0.04em; color: #6b7280; }
        .totals { margin-top: 16px; width: 260px; margin-left: auto; }
        .totals div { display: flex; justify-content: space-between; font-size: 14px; padding: 4px 0; }
        .totals .grand { font-weight: 700; font-size: 16px; border-top: 1px solid #1a1730; padding-top: 8px; margin-top: 4px; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #6b7280; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <h1>Retalla</h1>
      <p class="muted">Order Invoice</p>

      <div class="row">
        <div class="box">
          <h3>Order</h3>
          <p><strong>${orderNumber}</strong></p>
          <p class="muted">${orderDate}</p>
          <p class="muted">Status: ${o.status}</p>
          <p class="muted">Payment: ${o.paymentMethod}</p>
          ${o.trackingId ? `<p class="muted">Tracking: ${escapeOrdersHtml(o.courierName || '')} ${escapeOrdersHtml(o.trackingId)}</p>` : ''}
        </div>
        <div class="box">
          <h3>Ship To</h3>
          <p><strong>${escapeOrdersHtml(addr.fullName || '')}</strong></p>
          <p>${escapeOrdersHtml(addr.address || '')}</p>
          <p>${escapeOrdersHtml(addr.city || '')}, ${escapeOrdersHtml(addr.state || '')} ${escapeOrdersHtml(addr.pincode || '')}</p>
          <p>Phone: ${escapeOrdersHtml(addr.phone || '')}</p>
        </div>
      </div>

      <table>
        <thead><tr><th>Product</th><th>Code</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Price</th><th style="text-align:right;">Subtotal</th></tr></thead>
        <tbody>${itemRows}</tbody>
      </table>

      <div class="totals">
        <div><span>Items</span><span>Rs. ${o.itemsPrice.toFixed(2)}</span></div>
        <div><span>Shipping</span><span>${o.shippingPrice === 0 ? 'FREE' : `Rs. ${o.shippingPrice.toFixed(2)}`}</span></div>
        <div class="grand"><span>Total</span><span>Rs. ${o.totalPrice.toFixed(2)}</span></div>
      </div>

      <p class="footer">Thank you for shopping with Retalla — retalla.in</p>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to print this order.');
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.onload = () => printWindow.print();
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
