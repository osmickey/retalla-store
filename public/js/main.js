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

async function loadRecentlyViewedSection() {
  const section = document.getElementById('recently-viewed-section');
  if (!section) return;
  const ids = recentlyViewed.getIds();
  if (!ids.length) {
    section.style.display = 'none';
    return;
  }
  try {
    const products = await api.get(`/products?ids=${ids.join(',')}`);
    const ordered = ids.map((id) => products.find((p) => p._id === id)).filter(Boolean);
    if (!ordered.length) {
      section.style.display = 'none';
      return;
    }
    section.style.display = '';
    renderProductGrid('recent-shelf', ordered);
  } catch (err) {
    section.style.display = 'none';
  }
}

async function loadLiveVideoSection() {
  const section = document.getElementById('live-video-section');
  if (!section) return;
  try {
    const products = await api.get('/products?liveVideo=true&limit=6');
    if (!products.length) {
      section.style.display = 'none';
      return;
    }
    section.style.display = '';
    const grid = document.getElementById('live-video-grid');
    grid.innerHTML = products.map(videoCardHTML).join('');
    renderIcons(grid);
    grid.querySelectorAll('video').forEach((v) => v.play().catch(() => {}));
  } catch (err) {
    section.style.display = 'none';
  }
}

function videoCardHTML(p) {
  const discount = p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
  return `
    <div class="video-card">
      <div class="video-thumb">
        <span class="live-badge"><span class="pulse-dot"></span> LIVE</span>
        <video src="${p.videoUrl}" poster="${p.image}" autoplay muted loop playsinline preload="metadata" onclick="this.controls = true;"></video>
      </div>
      <div class="video-info">
        <h3>${escapeHTML(p.name)}</h3>
        <div class="price-row">
          <span class="price">Rs. ${p.price.toFixed(2)}</span>
          ${p.mrp > p.price ? `<span class="mrp">Rs. ${p.mrp.toFixed(2)}</span><span class="discount">${discount}% off</span>` : ''}
        </div>
        <a href="/product.html?id=${p._id}" class="btn btn-primary btn-sm add-btn">Shop Now</a>
      </div>
    </div>
  `;
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
  initCategoryRail();
}

function scrollCategoryRail(direction) {
  const rail = document.getElementById('category-tiles');
  if (!rail) return;
  const tile = rail.querySelector('.category-tile');
  const gap = parseFloat(getComputedStyle(rail).columnGap) || 0;
  const step = tile ? (tile.getBoundingClientRect().width + gap) * 3 : rail.clientWidth * 0.8;
  rail.scrollBy({ left: step * direction, behavior: 'smooth' });
  // Don't rely solely on the scroll event — it isn't guaranteed to fire for
  // programmatic smooth scrolling, which would leave the arrows out of sync.
  setTimeout(updateCategoryArrows, 450);
}

function updateCategoryArrows() {
  const rail = document.getElementById('category-tiles');
  const prev = document.getElementById('cat-nav-prev');
  const next = document.getElementById('cat-nav-next');
  if (!rail || !prev || !next) return;
  const maxScroll = rail.scrollWidth - rail.clientWidth;
  prev.disabled = rail.scrollLeft <= 2;
  next.disabled = rail.scrollLeft >= maxScroll - 2;
}

function initCategoryRail() {
  const rail = document.getElementById('category-tiles');
  if (!rail || rail.dataset.railReady) return;
  rail.dataset.railReady = 'true';

  // A hidden scrollbar leaves a plain mouse with no way to slide, so wire up drag.
  let dragging = false;
  let startX = 0;
  let startScroll = 0;
  let moved = 0;

  rail.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse') return;
    dragging = true;
    moved = 0;
    startX = e.clientX;
    startScroll = rail.scrollLeft;
    rail.classList.add('dragging');
  });

  document.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const delta = e.clientX - startX;
    moved = Math.abs(delta);
    rail.scrollLeft = startScroll - delta;
  });

  document.addEventListener('pointerup', () => {
    if (!dragging) return;
    dragging = false;
    rail.classList.remove('dragging');
    updateCategoryArrows();
  });

  // Suppress the click that follows a real drag so it doesn't open a category.
  rail.addEventListener('click', (e) => {
    if (moved > 6) {
      e.preventDefault();
      e.stopPropagation();
      moved = 0;
    }
  }, true);

  rail.addEventListener('scroll', updateCategoryArrows);
  window.addEventListener('resize', updateCategoryArrows);

  // Tile widths aren't final on the first pass (icons are injected just before), so
  // recompute whenever the rail actually resizes instead of measuring once too early.
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(updateCategoryArrows).observe(rail);
  }
  setTimeout(updateCategoryArrows, 250);
  updateCategoryArrows();
}

function renderCategoryNav() {
  document.querySelectorAll('.category-nav-list').forEach((el) => {
    el.innerHTML = CATEGORIES.map(
      (cat) => `<a href="/shop.html?category=${encodeURIComponent(cat)}">${cat}</a>`
    ).join('');
  });
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
  loadRecentlyViewedSection();
  loadLiveVideoSection();
  startShoppingQuotes();
});
