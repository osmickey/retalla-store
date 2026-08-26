// Port of public/js/auth.js. renderAuthNav() is intentionally dropped as a
// DOM function — the full navbar now uses useAuth() below instead, so
// Login/username state re-renders reactively rather than needing a manual
// re-hydration call after every DOM change.

import { useEffect, useState } from 'react';

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
    window.dispatchEvent(new Event('retalla:auth-changed'));
  },
  logout() {
    localStorage.removeItem('retalla_token');
    localStorage.removeItem('retalla_user');
    window.dispatchEvent(new Event('retalla:auth-changed'));
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

// Reactive current-user hook, backed by the same localStorage auth.setSession()/
// logout() already write to. Listens for 'storage' (cross-tab) and the custom
// 'retalla:auth-changed' event (same-tab, dispatched by setSession/logout above)
// so the navbar's account link updates without a full page reload.
export function useAuth() {
  const [user, setUser] = useState(() => auth.getUser());
  useEffect(() => {
    const sync = () => setUser(auth.getUser());
    window.addEventListener('storage', sync);
    window.addEventListener('retalla:auth-changed', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('retalla:auth-changed', sync);
    };
  }, []);
  return user;
}
