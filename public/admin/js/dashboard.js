let analyticsData = null;
let salesChart = null;

function switchRange(range) {
  document.getElementById('range-weekly').classList.toggle('active', range === 'weekly');
  document.getElementById('range-monthly').classList.toggle('active', range === 'monthly');
  renderChart(range);
}

function renderChart(range) {
  if (!analyticsData) return;
  const data = analyticsData[range];
  const ctx = document.getElementById('sales-chart').getContext('2d');
  if (salesChart) salesChart.destroy();
  salesChart = new Chart(ctx, {
    data: {
      labels: data.labels,
      datasets: [
        {
          type: 'bar',
          label: 'Orders',
          data: data.orders,
          backgroundColor: 'rgba(79, 70, 229, 0.65)',
          borderRadius: 6,
          yAxisID: 'y',
          order: 2,
        },
        {
          type: 'line',
          label: 'Revenue (Rs.)',
          data: data.revenue,
          borderColor: '#ff3e6c',
          backgroundColor: 'rgba(255, 62, 108, 0.12)',
          tension: 0.35,
          fill: true,
          pointRadius: 3,
          pointBackgroundColor: '#ff3e6c',
          yAxisID: 'y1',
          order: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        y: { beginAtZero: true, position: 'left', ticks: { precision: 0 }, title: { display: true, text: 'Orders' } },
        y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Revenue (Rs.)' } },
      },
      plugins: { legend: { position: 'bottom' } },
    },
  });
}

async function loadDashboard() {
  try {
    const [stats, orders, analytics] = await Promise.all([
      adminApi.get('/orders/stats/summary'),
      adminApi.get('/orders'),
      adminApi.get('/orders/stats/analytics'),
    ]);

    analyticsData = analytics;
    renderChart('weekly');

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
