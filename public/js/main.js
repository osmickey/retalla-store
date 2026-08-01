async function loadHome() {
  try {
    // Bestsellers get their own shelf now, so "Just For You" sticks to featured
    // picks only — otherwise the same products would show up twice on the page.
    const featured = await api.get('/products?featured=true&limit=8');
    renderProductGrid('trending-grid', featured);
  } catch (err) {
    showToast(err.message);
  }
}

async function loadBestSellingSection() {
  const section = document.getElementById('bestseller-section');
  if (!section) return;
  try {
    const products = await api.get('/products?bestseller=true&limit=8');
    if (!products.length) {
      section.style.display = 'none';
      return;
    }
    section.style.display = '';
    renderProductGrid('bestseller-shelf', products);
    initSlidableRail({
      rail: document.getElementById('bestseller-shelf'),
      prevBtn: document.getElementById('bestseller-nav-prev'),
      nextBtn: document.getElementById('bestseller-nav-next'),
      itemSelector: '.product-card',
      visibleCount: 5,
    });
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
  initSlidableRail({
    rail: el,
    prevBtn: document.getElementById('cat-nav-prev'),
    nextBtn: document.getElementById('cat-nav-next'),
    itemSelector: '.category-tile',
    visibleCount: 3,
  });
}

// Shared drag-to-scroll + prev/next-arrow behaviour for any horizontal shelf
// (categories, best sellers, ...). A hidden scrollbar leaves a plain mouse with
// no way to slide, so pointer events do the dragging; the arrows step by a
// page's worth of cards and disable themselves at each end.
function initSlidableRail({ rail, prevBtn, nextBtn, itemSelector, visibleCount }) {
  if (!rail || rail.dataset.railReady) return;
  rail.dataset.railReady = 'true';

  function updateArrows() {
    if (!prevBtn || !nextBtn) return;
    const maxScroll = rail.scrollWidth - rail.clientWidth;
    prevBtn.disabled = rail.scrollLeft <= 2;
    nextBtn.disabled = rail.scrollLeft >= maxScroll - 2;
  }

  function scrollByPage(direction) {
    const item = rail.querySelector(itemSelector);
    const gap = parseFloat(getComputedStyle(rail).columnGap) || 0;
    const step = item ? (item.getBoundingClientRect().width + gap) * visibleCount : rail.clientWidth * 0.8;
    rail.scrollBy({ left: step * direction, behavior: 'smooth' });
    // Don't rely solely on the scroll event — it isn't guaranteed to fire for
    // programmatic smooth scrolling, which would leave the arrows out of sync.
    setTimeout(updateArrows, 450);
  }

  if (prevBtn) prevBtn.addEventListener('click', () => scrollByPage(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => scrollByPage(1));

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
    updateArrows();
  });

  // Suppress the click that follows a real drag so it doesn't open the card/category.
  rail.addEventListener('click', (e) => {
    if (moved > 6) {
      e.preventDefault();
      e.stopPropagation();
      moved = 0;
    }
  }, true);

  rail.addEventListener('scroll', updateArrows);
  window.addEventListener('resize', updateArrows);

  // Item widths aren't final on the first pass (icons/images load just after), so
  // recompute whenever the rail actually resizes instead of measuring once too early.
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(updateArrows).observe(rail);
  }
  setTimeout(updateArrows, 250);
  updateArrows();
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
  loadBestSellingSection();
  loadLiveVideoSection();
  startShoppingQuotes();
});
