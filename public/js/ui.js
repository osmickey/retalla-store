function loadingHTML() {
  return `<div class="dot-loader"><span></span><span></span><span></span></div>`;
}

function starRowHTML(rating, size) {
  const rounded = Math.round(rating);
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html += `<span class="star-ico ${i <= rounded ? 'filled' : 'muted'}">${iconSVG('star', size || 14)}</span>`;
  }
  return `<span class="star-row">${html}</span>`;
}

function productCardHTML(p) {
  const outOfStock = p.stock <= 0;
  const discount = p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
  return `
    <a class="product-card reveal" href="/product.html?id=${p._id}">
      <div class="thumb">
        ${p.isBestSeller ? '<span class="badge">BESTSELLER</span>' : ''}
        <img src="${p.image}" alt="${escapeHTML(p.name)}" loading="lazy" />
        ${outOfStock ? '<div class="badge-outofstock">Out of Stock</div>' : ''}
      </div>
      <div class="product-info">
        <span class="cat">${p.category}</span>
        <h3>${escapeHTML(p.name)}</h3>
        <div class="rating-row">
          ${starRowHTML(p.rating, 12)}
          <span class="rating-pill">${p.rating.toFixed(1)}</span>
          <span>(${p.numReviews})</span>
        </div>
        <div class="price-row">
          <span class="price">Rs. ${p.price.toFixed(2)}</span>
          ${p.mrp > p.price ? `<span class="mrp">Rs. ${p.mrp.toFixed(2)}</span><span class="discount">${discount}% off</span>` : ''}
        </div>
        ${p.freeDelivery ? '<span class="free-delivery">Free Delivery</span>' : ''}
        <button class="btn btn-primary btn-sm add-btn" ${outOfStock ? 'disabled' : ''} onclick="event.preventDefault(); quickAdd('${p._id}')">
          ${outOfStock ? 'Unavailable' : 'Add to Cart'}
        </button>
      </div>
    </a>
  `;
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function quickAdd(productId) {
  try {
    const product = await api.get(`/products/${productId}`);
    cart.add(product, 1);
    showToast(`${product.name} added to cart`);
  } catch (err) {
    showToast(err.message);
  }
}

function renderProductGrid(containerId, products) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!products.length) {
    el.innerHTML = `<div class="empty-state"><div class="icon-circle" data-icon="search" data-icon-size="26"></div><p>No products found.</p></div>`;
    renderIcons(el);
    return;
  }
  el.innerHTML = products.map(productCardHTML).join('');
  staggerChildren(el, '.product-card', 50);
}
