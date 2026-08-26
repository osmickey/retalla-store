import { useEffect, useState } from 'react';
import { api } from './api';
import { auth } from './auth';

export const wishlist = {
  async getIds() {
    if (!auth.isLoggedIn()) return [];
    return api.get('/wishlist/ids');
  },
  async getProducts() {
    return api.get('/wishlist');
  },
  async add(productId) {
    await api.post(`/wishlist/${productId}`, {});
    window.dispatchEvent(new Event('retalla:wishlist-changed'));
  },
  async remove(productId) {
    await api.del(`/wishlist/${productId}`);
    window.dispatchEvent(new Event('retalla:wishlist-changed'));
  },
};

// Server-backed, unlike useCartCount()/useAuth() -- no synchronous
// localStorage value to seed the initial render with, so this starts empty
// and fills in once the network call resolves.
export function useWishlistIds() {
  const [ids, setIds] = useState(() => new Set());

  useEffect(() => {
    let cancelled = false;
    function load() {
      wishlist
        .getIds()
        .then((list) => {
          if (!cancelled) setIds(new Set(list));
        })
        .catch(() => {
          if (!cancelled) setIds(new Set());
        });
    }
    load();
    window.addEventListener('retalla:wishlist-changed', load);
    window.addEventListener('retalla:auth-changed', load);
    return () => {
      cancelled = true;
      window.removeEventListener('retalla:wishlist-changed', load);
      window.removeEventListener('retalla:auth-changed', load);
    };
  }, []);

  return ids;
}
