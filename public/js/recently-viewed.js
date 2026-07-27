const recentlyViewed = {
  KEY: 'retalla_recently_viewed',
  MAX: 10,

  getIds() {
    const raw = localStorage.getItem(this.KEY);
    return raw ? JSON.parse(raw) : [];
  },

  record(productId) {
    let ids = this.getIds().filter((id) => id !== productId);
    ids.unshift(productId);
    ids = ids.slice(0, this.MAX);
    localStorage.setItem(this.KEY, JSON.stringify(ids));
  },
};
