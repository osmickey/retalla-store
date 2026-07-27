let currentProduct = null;

function getProductId() {
  return new URLSearchParams(window.location.search).get('id');
}

function setMainImage(src) {
  const img = document.getElementById('pd-main-image');
  if (img) img.src = src;
  document.querySelectorAll('.pd-thumbs img').forEach((t) => {
    t.classList.toggle('active', t.src === src);
  });
}

async function loadProduct() {
  const id = getProductId();
  const wrap = document.getElementById('product-detail-wrap');
  if (!id) {
    wrap.innerHTML = '<div class="empty-state">Product not found.</div>';
    return;
  }

  try {
    const p = await api.get(`/products/${id}`);
    currentProduct = p;
    document.title = `${p.name} — Retalla`;

    const images = [p.image, ...(p.images || [])];
    const discount = p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
    const outOfStock = p.stock <= 0;

    wrap.innerHTML = `
      <div class="pd-gallery">
        <div class="main-image"><img id="pd-main-image" src="${p.image}" alt="${escapeHTML(p.name)}" /></div>
        <div class="pd-thumbs">
          ${images
            .map((src, i) => `<img src="${src}" class="${i === 0 ? 'active' : ''}" onclick="setMainImage('${src}')" />`)
            .join('')}
        </div>
      </div>
      <div class="pd-info">
        <span class="cat">${p.category}</span>
        <h1>${escapeHTML(p.name)}</h1>
        <div class="rating-row">
          ${starRowHTML(p.rating, 16)}
          <span class="rating-pill">${p.rating.toFixed(1)}</span>
          <span>(${p.numReviews} reviews)</span>
          ${p.isBestSeller ? '<span class="badge" style="position:static;">BESTSELLER</span>' : ''}
        </div>
        <div class="price-row">
          <span class="price">Rs. ${p.price.toFixed(2)}</span>
          ${p.mrp > p.price ? `<span class="mrp">Rs. ${p.mrp.toFixed(2)}</span><span class="discount">${discount}% off</span>` : ''}
        </div>
        <div class="pd-meta">
          <div class="item"><strong>${outOfStock ? 'Out of stock' : `${p.stock} in stock`}</strong>Availability</div>
          <div class="item"><strong>${p.freeDelivery ? 'Free' : 'Paid'}</strong>Delivery</div>
          <div class="item"><strong>7 Days</strong>Easy Return</div>
        </div>
        <div class="qty-stepper">
          <button onclick="stepQty(-1)">−</button>
          <input id="pd-qty" type="number" value="1" min="1" max="${p.stock}" />
          <button onclick="stepQty(1)">+</button>
        </div>
        <div class="pd-actions">
          <button class="btn btn-primary" ${outOfStock ? 'disabled' : ''} onclick="addToCartFromDetail()">Add to Cart</button>
          <button class="btn btn-accent" ${outOfStock ? 'disabled' : ''} onclick="buyNow()">Buy Now</button>
        </div>
        <p class="pd-description">${escapeHTML(p.description || '')}</p>
      </div>
    `;

    loadRelatedProducts(p);
  } catch (err) {
    wrap.innerHTML = `<div class="empty-state">${err.message}</div>`;
  }
}

async function loadRelatedProducts(product) {
  const section = document.getElementById('related-section');
  if (!section) return;
  try {
    const results = await api.get(`/products?category=${encodeURIComponent(product.category)}&limit=9`);
    const related = results.filter((p) => p._id !== product._id).slice(0, 4);
    if (!related.length) {
      section.style.display = 'none';
      return;
    }
    section.style.display = '';
    renderProductGrid('related-grid', related);
  } catch (err) {
    section.style.display = 'none';
  }
}

function stepQty(delta) {
  const input = document.getElementById('pd-qty');
  const max = Number(input.max) || 99;
  let val = Number(input.value) + delta;
  val = Math.min(max, Math.max(1, val));
  input.value = val;
}

function addToCartFromDetail() {
  const qty = Number(document.getElementById('pd-qty').value) || 1;
  cart.add(currentProduct, qty);
  showToast(`${currentProduct.name} added to cart`);
}

function buyNow() {
  const qty = Number(document.getElementById('pd-qty').value) || 1;
  cart.add(currentProduct, qty);
  window.location.href = '/cart.html';
}

document.addEventListener('DOMContentLoaded', loadProduct);
