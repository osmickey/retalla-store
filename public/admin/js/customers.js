let allCustomers = [];

async function loadCustomers() {
  const tbody = document.getElementById('customers-body');
  tbody.innerHTML = `<tr><td colspan="4" class="loading">Loading customers...</td></tr>`;
  try {
    allCustomers = await adminApi.get('/users');
    document.getElementById('customer-count').textContent = `${allCustomers.length} registered`;
    renderCustomersTable();
  } catch (err) {
    if (err.message !== 'Session expired') tbody.innerHTML = `<tr><td colspan="4" class="empty-state">${err.message}</td></tr>`;
  }
}

function renderCustomersTable() {
  const tbody = document.getElementById('customers-body');
  const search = document.getElementById('filter-search').value.trim().toLowerCase();

  let rows = allCustomers;
  if (search) {
    rows = rows.filter(
      (u) => u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search)
    );
  }

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="empty-state">No customers found.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows
    .map(
      (u) => `
      <tr>
        <td>${escapeHtml(u.name)}</td>
        <td>${escapeHtml(u.email)}</td>
        <td>${escapeHtml(u.phone || '—')}</td>
        <td>${new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
      </tr>
    `
    )
    .join('');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', () => {
  if (!adminAuth.requireAdmin()) return;
  loadCustomers();
  document.getElementById('filter-search').addEventListener('input', renderCustomersTable);
});
