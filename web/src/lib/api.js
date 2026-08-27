import { API_BASE } from './config';
import { auth } from './auth';

export const api = {
  async request(path, options = {}) {
    const token = auth.getToken();
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;

    let res;
    try {
      res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    } catch {
      // fetch() itself rejects on network-level failures (server unreachable,
      // DNS/CORS) with a raw browser TypeError ("Failed to fetch"). Catch it
      // here so callers always get a friendly, consistent message instead of
      // that raw string reaching the UI.
      throw new Error('Unable to connect. Check your connection and try again.');
    }
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.message || 'Something went wrong');
    }
    return data;
  },

  get(path) {
    return this.request(path);
  },
  post(path, body) {
    return this.request(path, { method: 'POST', body: JSON.stringify(body) });
  },
  put(path, body) {
    return this.request(path, { method: 'PUT', body: JSON.stringify(body) });
  },
  del(path) {
    return this.request(path, { method: 'DELETE' });
  },
};
