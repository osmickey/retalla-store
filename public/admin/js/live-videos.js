let allLiveVideoProducts = [];
let selectedProduct = null;

function escapeLiveHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function loadProducts() {
  allLiveVideoProducts = await adminApi.get('/products');
  renderLiveGrid();
}

function renderSearchResults(query) {
  const box = document.getElementById('video-product-results');
  const q = query.trim().toLowerCase();
  if (!q) {
    box.innerHTML = '';
    box.classList.remove('open');
    return;
  }

  const matches = allLiveVideoProducts.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 8);
  if (!matches.length) {
    box.innerHTML = `<div class="live-search-empty">No products found.</div>`;
    box.classList.add('open');
    return;
  }

  box.classList.add('open');
  box.innerHTML = matches
    .map(
      (p) => `
      <div class="live-search-item" data-id="${p._id}">
        <img src="${p.image}" alt="" />
        <div>
          <strong>${escapeLiveHtml(p.name)}</strong>
          <span>${p.category} · Rs. ${p.price.toFixed(2)}${p.isLiveVideo ? ' · Already Live' : ''}</span>
        </div>
      </div>
    `
    )
    .join('');

  box.querySelectorAll('.live-search-item').forEach((el) => {
    el.addEventListener('click', () => selectProduct(el.dataset.id));
  });
}

function selectProduct(productId) {
  const product = allLiveVideoProducts.find((p) => p._id === productId);
  if (!product) return;
  selectedProduct = product;

  document.getElementById('video-product-search').value = product.name;
  document.getElementById('video-product-results').classList.remove('open');

  const preview = document.getElementById('selected-product-preview');
  preview.style.display = 'flex';
  preview.innerHTML = `
    <img src="${product.image}" alt="" />
    <div>
      <strong>${escapeLiveHtml(product.name)}</strong>
      <span>${product.category} · Rs. ${product.price.toFixed(2)}</span>
    </div>
  `;

  const urlInput = document.getElementById('live-video-url-input');
  urlInput.disabled = false;
  urlInput.value = product.videoUrl || '';

  document.getElementById('add-to-live-btn').disabled = false;
}

async function addToLive() {
  const msg = document.getElementById('live-form-message');
  msg.style.display = 'none';

  if (!selectedProduct) return;
  const videoUrl = document.getElementById('live-video-url-input').value.trim();
  if (!videoUrl) {
    msg.textContent = 'Paste a video URL first.';
    msg.style.display = 'block';
    return;
  }

  const btn = document.getElementById('add-to-live-btn');
  btn.disabled = true;
  try {
    const updated = await adminApi.put(`/products/${selectedProduct._id}`, {
      videoUrl,
      isLiveVideo: true,
    });
    const idx = allLiveVideoProducts.findIndex((p) => p._id === updated._id);
    if (idx !== -1) allLiveVideoProducts[idx] = updated;
    resetForm();
    renderLiveGrid();
  } catch (err) {
    msg.textContent = err.message;
    msg.style.display = 'block';
    btn.disabled = false;
  }
}

async function removeFromLive(productId) {
  if (!confirm('Remove this product from Retalla Live? The video link is kept, just hidden from the home page.')) return;
  try {
    const updated = await adminApi.put(`/products/${productId}`, { isLiveVideo: false });
    const idx = allLiveVideoProducts.findIndex((p) => p._id === updated._id);
    if (idx !== -1) allLiveVideoProducts[idx] = updated;
    renderLiveGrid();
  } catch (err) {
    alert(err.message);
  }
}

function resetForm() {
  selectedProduct = null;
  document.getElementById('video-product-search').value = '';
  document.getElementById('video-product-results').innerHTML = '';
  document.getElementById('video-product-results').classList.remove('open');
  document.getElementById('selected-product-preview').style.display = 'none';
  const urlInput = document.getElementById('live-video-url-input');
  urlInput.value = '';
  urlInput.disabled = true;
  document.getElementById('add-to-live-btn').disabled = true;
}

function renderLiveGrid() {
  const grid = document.getElementById('live-products-grid');
  const liveProducts = allLiveVideoProducts.filter((p) => p.isLiveVideo && p.videoUrl);
  document.getElementById('live-count').textContent = liveProducts.length;

  if (!liveProducts.length) {
    grid.innerHTML = `<div class="empty-state">No products are live yet. Use the form above to add your first one.</div>`;
    return;
  }

  grid.innerHTML = liveProducts
    .map(
      (p) => `
      <div class="video-admin-card">
        <div class="video-admin-thumb">
          <span class="live-badge"><span class="pulse-dot"></span> LIVE</span>
          <video src="${p.videoUrl}" poster="${p.image}" controls muted playsinline preload="metadata"></video>
        </div>
        <div class="video-admin-info">
          <strong>${escapeLiveHtml(p.name)}</strong>
          <span>Rs. ${p.price.toFixed(2)}</span>
          <button class="btn btn-danger btn-sm" onclick="removeFromLive('${p._id}')">
            <span data-icon="close" data-icon-size="14"></span> Remove from Live
          </button>
        </div>
      </div>
    `
    )
    .join('');
  if (typeof renderIcons === 'function') renderIcons(grid);
}

document.addEventListener('DOMContentLoaded', () => {
  if (!adminAuth.requireAdmin()) return;
  loadProducts();

  const searchInput = document.getElementById('video-product-search');
  searchInput.addEventListener('input', (e) => {
    selectedProduct = null;
    document.getElementById('selected-product-preview').style.display = 'none';
    const urlInput = document.getElementById('live-video-url-input');
    urlInput.disabled = true;
    urlInput.value = '';
    document.getElementById('add-to-live-btn').disabled = true;
    renderSearchResults(e.target.value);
  });

  document.addEventListener('click', (e) => {
    const box = document.getElementById('video-product-results');
    if (!box.contains(e.target) && e.target !== searchInput) box.classList.remove('open');
  });
});
