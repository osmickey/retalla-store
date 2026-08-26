// Same shape as recentlyViewed.js, but this one actually gets rendered (in
// SearchPanel.jsx) rather than write-only.
export const recentSearches = {
  KEY: 'retalla_recent_searches',
  MAX: 6,

  getAll() {
    const raw = localStorage.getItem(this.KEY);
    return raw ? JSON.parse(raw) : [];
  },

  record(term) {
    const clean = term.trim();
    if (!clean) return;
    let terms = this.getAll().filter((t) => t.toLowerCase() !== clean.toLowerCase());
    terms.unshift(clean);
    terms = terms.slice(0, this.MAX);
    localStorage.setItem(this.KEY, JSON.stringify(terms));
  },

  clear() {
    localStorage.removeItem(this.KEY);
  },
};
