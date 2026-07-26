async function loadHome() {
  try {
    const [bestSellers, featured] = await Promise.all([
      api.get('/products?bestseller=true&limit=8'),
      api.get('/products?featured=true&limit=8'),
    ]);
    const seen = new Set();
    const trending = [...bestSellers, ...featured].filter((p) => {
      if (seen.has(p._id)) return false;
      seen.add(p._id);
      return true;
    });
    renderProductGrid('trending-grid', trending.slice(0, 8));
  } catch (err) {
    showToast(err.message);
  }
}

function renderCategoryTiles() {
  const el = document.getElementById('category-tiles');
  if (!el) return;
  el.innerHTML = CATEGORIES.map((cat) => {
    const [c1, c2] = CATEGORY_COLORS[cat] || ['#4f46e5', '#7c3aed'];
    return `
      <a class="category-tile reveal" href="/shop.html?category=${encodeURIComponent(cat)}" style="--cat-c1:${c1};--cat-c2:${c2};">
        <div class="icon-circle" data-icon="${CATEGORY_ICONS[cat]}" data-icon-size="26"></div>
        ${cat}
      </a>
    `;
  }).join('');
  renderIcons(el);
  staggerChildren(el, '.category-tile', 40);
}

function renderCategoryNav() {
  document.querySelectorAll('.category-nav-list').forEach((el) => {
    el.innerHTML = CATEGORIES.map(
      (cat) => `<a href="/shop.html?category=${encodeURIComponent(cat)}">${cat}</a>`
    ).join('');
  });
}

function startCycleWords() {
  const el = document.querySelector('.cycle-word');
  if (!el) return;
  const words = ['Gadgets', 'Fashion', 'Beauty', 'Home Decor', 'Jewellery'];
  let i = 0;
  setInterval(() => {
    el.classList.add('swap');
    setTimeout(() => {
      i = (i + 1) % words.length;
      el.textContent = words[i];
      el.classList.remove('swap');
    }, 300);
  }, 2200);
}

function startShoppingQuotes() {
  const el = document.getElementById('shopping-quote');
  if (!el) return;
  const quotes = [
    "Great style shouldn't cost a fortune.",
    'Shop today, glow tomorrow.',
    'Where quality meets everyday prices.',
    'Small cart, big smiles.',
    'Your happiness, delivered to your door.',
  ];
  let i = 0;
  setInterval(() => {
    el.classList.add('swap');
    setTimeout(() => {
      i = (i + 1) % quotes.length;
      el.textContent = quotes[i];
      el.classList.remove('swap');
    }, 350);
  }, 3500);
}

document.addEventListener('DOMContentLoaded', () => {
  renderCategoryTiles();
  renderCategoryNav();
  loadHome();
  startCycleWords();
  startShoppingQuotes();
});
