function renderShopFilters(activeCategory) {
  const el = document.getElementById('shop-categories');
  if (!el) return;
  const all = [
    `<a href="/shop.html" class="${!activeCategory ? 'active' : ''}">All</a>`,
    ...CATEGORIES.map(
      (cat) =>
        `<a href="/shop.html?category=${encodeURIComponent(cat)}" class="${cat === activeCategory ? 'active' : ''}">${cat}</a>`
    ),
  ];
  el.innerHTML = all.join('');
}

async function loadShop() {
  const params = new URLSearchParams(window.location.search);
  const category = params.get('category') || '';
  const search = params.get('search') || '';

  renderShopFilters(category);

  const titleEl = document.getElementById('shop-title');
  if (titleEl) titleEl.textContent = search ? `Search: "${search}"` : category || 'All Products';

  const searchInput = document.getElementById('shop-search-input');
  if (searchInput && search) searchInput.value = search;

  const query = new URLSearchParams();
  if (category) query.set('category', category);
  if (search) query.set('search', search);

  const grid = document.getElementById('shop-grid');
  if (grid) grid.innerHTML = loadingHTML();

  try {
    const products = await api.get(`/products?${query.toString()}`);
    renderProductGrid('shop-grid', products);
  } catch (err) {
    showToast(err.message);
  }
}

document.addEventListener('DOMContentLoaded', loadShop);
