const ADMIN_API_BASE = '/api';

const adminAuth = {
  getToken() {
    return localStorage.getItem('retalla_admin_token');
  },
  getUser() {
    const raw = localStorage.getItem('retalla_admin_user');
    return raw ? JSON.parse(raw) : null;
  },
  setSession(user, token) {
    localStorage.setItem('retalla_admin_token', token);
    localStorage.setItem('retalla_admin_user', JSON.stringify(user));
  },
  logout() {
    localStorage.removeItem('retalla_admin_token');
    localStorage.removeItem('retalla_admin_user');
    window.location.href = '/admin/login.html';
  },
  requireAdmin() {
    const user = this.getUser();
    if (!this.getToken() || !user || !user.isAdmin) {
      window.location.href = '/admin/login.html';
      return false;
    }
    return true;
  },
};

const adminApi = {
  async request(path, options = {}) {
    const token = adminAuth.getToken();
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${ADMIN_API_BASE}${path}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));

    if (res.status === 401 || res.status === 403) {
      adminAuth.logout();
      throw new Error(data.message || 'Session expired');
    }
    if (!res.ok) throw new Error(data.message || 'Something went wrong');
    return data;
  },
  get(path) { return this.request(path); },
  post(path, body) { return this.request(path, { method: 'POST', body: JSON.stringify(body) }); },
  put(path, body) { return this.request(path, { method: 'PUT', body: JSON.stringify(body) }); },
  del(path) { return this.request(path, { method: 'DELETE' }); },
};

function renderAdminIdentity() {
  const el = document.getElementById('admin-who');
  const user = adminAuth.getUser();
  if (el && user) el.textContent = `${user.name} (${user.email})`;
}

function setActiveNav() {
  const page = window.location.pathname.split('/').pop();
  document.querySelectorAll('.sidebar nav a').forEach((a) => {
    a.classList.toggle('active', a.getAttribute('href').endsWith(page));
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderAdminIdentity();
  setActiveNav();
});
