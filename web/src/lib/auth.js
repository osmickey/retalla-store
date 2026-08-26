// Port of public/js/auth.js. renderAuthNav() is intentionally dropped here —
// it targets #nav-account, which only exists in the full navbar (out of scope
// for Phase 1). The phase that migrates the full navbar should add a
// useAuth() hook instead, so Login/username state re-renders reactively.

export const auth = {
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
