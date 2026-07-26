const auth = {
  getToken() {
    return localStorage.getItem('retalla_token');
  },
  getUser() {
    const raw = localStorage.getItem('retalla_user');
    return raw ? JSON.parse(raw) : null;
  },
  setSession(user, token) {
    localStorage.setItem('retalla_token', token);
    localStorage.setItem('retalla_user', JSON.stringify(user));
  },
  logout() {
    localStorage.removeItem('retalla_token');
    localStorage.removeItem('retalla_user');
    window.location.href = '/index.html';
  },
  isLoggedIn() {
    return !!this.getToken();
  },
  requireLogin(redirectTo) {
    if (!this.isLoggedIn()) {
      window.location.href = `/login.html?redirect=${encodeURIComponent(redirectTo || window.location.pathname)}`;
      return false;
    }
    return true;
  },
};

function renderAuthNav() {
  const el = document.getElementById('nav-account');
  if (!el) return;
  const user = auth.getUser();
  if (user) {
    el.innerHTML = `
      <span class="icon">👤</span>
      <span>${user.name.split(' ')[0]}</span>
    `;
    el.href = '/account.html';
  } else {
    el.innerHTML = `<span class="icon">👤</span><span>Login</span>`;
    el.href = '/login.html';
  }
}

document.addEventListener('DOMContentLoaded', renderAuthNav);
