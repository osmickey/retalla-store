async function loadDashboard() {
  try {
    const [stats, orders] = await Promise.all([
      adminApi.get('/orders/stats/summary'),
      adminApi.get('/orders'),
    ]);

    document.getElementById('stat-orders').textContent = stats.totalOrders;
    document.getElementById('stat-products').textContent = stats.totalProducts;
    document.getElementById('stat-revenue').textContent = `Rs. ${stats.totalRevenue.toFixed(2)}`;
    document.getElementById('stat-pending').textContent = stats.pendingOrders;

    const recent = orders.slice(0, 6);
    const tbody = document.getElementById('recent-orders-body');
    if (!recent.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="empty-state">No orders yet.</td></tr>`;
      return;
    }
    tbody.innerHTML = recent
      .map(
        (o) => `
        <tr>
          <td>#${o._id.slice(-8).toUpperCase()}</td>
          <td>${o.user?.name || 'Unknown'}</td>
          <td>Rs. ${o.totalPrice.toFixed(2)}</td>
          <td><span class="status-pill status-${o.status}">${o.status}</span></td>
          <td>${new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
        </tr>
      `
      )
      .join('');
  } catch (err) {
    if (err.message !== 'Session expired') alert(err.message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!adminAuth.requireAdmin()) return;
  loadDashboard();
});
