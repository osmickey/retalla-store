async function loadHome() {
  try {
    const [bestSellers, featured] = await Promise.all([
      api.get('/products?bestseller=true&limit=8'),
      api.get('/products?featured=true&limit=8'),
    ]);
    renderProductGrid('best-sellers-grid', bestSellers);
    renderProductGrid('featured-grid', featured);
  } catch (err) {
    showToast(err.message);
  }
}

function renderCategoryTiles() {
  const el = document.getElementById('category-tiles');
  if (!el) return;
  el.innerHTML = CATEGORIES.map(
    (cat) => `
      <a class="category-tile" href="/shop.html?category=${encodeURIComponent(cat)}">
        <div class="icon">${CATEGORY_ICONS[cat]}</div>
        ${cat}
      </a>
    `
  ).join('');
}

function renderCategoryNav() {
  document.querySelectorAll('.category-nav-list').forEach((el) => {
    el.innerHTML = CATEGORIES.map(
      (cat) => `<a href="/shop.html?category=${encodeURIComponent(cat)}">${cat}</a>`
    ).join('');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderCategoryTiles();
  renderCategoryNav();
  loadHome();
});
