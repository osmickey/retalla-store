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
        <span class="cat">${p.category}${p.brand ? ` · ${escapeHTML(p.brand)}` : ''}</span>
        <h1>${escapeHTML(p.name)}</h1>
        ${p.sku ? `<div class="pd-sku">SKU: ${escapeHTML(p.sku)}</div>` : ''}
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
          <div class="item"><strong>${p.isReturnable ? '7 Days' : 'Non-Returnable'}</strong>${p.isReturnable ? 'Easy Return' : 'Final Sale'}</div>
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
        ${p.videoUrl ? `
        <div class="pd-video">
          <h3 class="pd-video-title">Product Video</h3>
          <video src="${p.videoUrl}" poster="${p.image}" controls muted playsinline preload="metadata"></video>
        </div>` : ''}
      </div>
    `;

    recentlyViewed.record(p._id);
    loadReviews(p._id);
    loadReviewForm(p._id);
    loadRelatedProducts(p);
  } catch (err) {
    wrap.innerHTML = `<div class="empty-state">${err.message}</div>`;
  }
}

/* ===== Reviews ===== */

let selectedReviewRating = 0;

async function loadReviews(productId) {
  const summaryEl = document.getElementById('review-summary-wrap');
  const listEl = document.getElementById('review-list-wrap');
  listEl.innerHTML = loadingHTML();
  try {
    const reviews = await api.get(`/products/${productId}/reviews`);
    renderReviewSummary(summaryEl, reviews);
    renderReviewList(listEl, reviews);
  } catch (err) {
    listEl.innerHTML = `<div class="empty-state">${err.message}</div>`;
  }
}

function renderReviewSummary(el, reviews) {
  if (!reviews.length) {
    el.innerHTML = '';
    return;
  }
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  el.innerHTML = `
    <div class="review-summary">
      <div class="review-summary-score">${avg.toFixed(1)}</div>
      <div>
        ${starRowHTML(avg, 18)}
        <div class="review-summary-count">${reviews.length} review${reviews.length === 1 ? '' : 's'}</div>
      </div>
    </div>
  `;
}

function renderReviewList(el, reviews) {
  if (!reviews.length) {
    el.innerHTML = `<div class="empty-state"><p>No reviews yet — be the first to review this product!</p></div>`;
    return;
  }
  el.innerHTML = `<div class="review-list">${reviews.map(reviewCardHTML).join('')}</div>`;
}

function reviewCardHTML(r) {
  const name = r.user?.name || 'Anonymous';
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return `
    <div class="review-card">
      <div class="review-card-head">
        <span class="avatar">${initials}</span>
        <div class="review-card-who">
          <strong>${escapeHTML(name)}</strong>
          <span class="review-date">${new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
        ${starRowHTML(r.rating, 14)}
      </div>
      <p class="review-comment">${escapeHTML(r.comment)}</p>
    </div>
  `;
}

async function loadReviewForm(productId) {
  const wrap = document.getElementById('review-form-wrap');
  if (!auth.isLoggedIn()) {
    wrap.innerHTML = `
      <div class="review-gate">
        <span class="icon-circle" data-icon="user" data-icon-size="20"></span>
        <p>Please <a href="/login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}">login</a> to write a review.</p>
      </div>`;
    renderIcons(wrap);
    return;
  }
  try {
    const eligibility = await api.get(`/products/${productId}/reviews/eligibility`);
    if (eligibility.canReview) {
      renderReviewForm(wrap);
    } else if (eligibility.reason === 'already_reviewed') {
      wrap.innerHTML = `
        <div class="review-gate success">
          <span class="icon-circle" data-icon="check" data-icon-size="20"></span>
          <p>You've already reviewed this product. Thanks for your feedback!</p>
        </div>`;
      renderIcons(wrap);
    } else {
      wrap.innerHTML = `
        <div class="review-gate">
          <span class="icon-circle" data-icon="box" data-icon-size="20"></span>
          <p>Only customers who've purchased this product can write a review.</p>
        </div>`;
      renderIcons(wrap);
    }
  } catch (err) {
    wrap.innerHTML = '';
  }
}

function renderReviewForm(wrap) {
  selectedReviewRating = 0;
  wrap.innerHTML = `
    <div class="review-form-card">
      <h3>Write a Review</h3>
      <div class="star-input" id="review-star-input">
        ${[1, 2, 3, 4, 5]
          .map((i) => `<button type="button" class="star-btn" data-value="${i}" onclick="setReviewRating(${i})"><span data-icon="star" data-icon-size="26"></span></button>`)
          .join('')}
      </div>
      <div id="review-form-message" class="form-message error" style="display:none;"></div>
      <textarea id="review-comment" rows="3" class="review-textarea" placeholder="Share your experience with this product..."></textarea>
      <button class="btn btn-primary" id="review-submit-btn" onclick="submitReview()">Submit Review</button>
    </div>
  `;
  renderIcons(wrap);
}

function setReviewRating(value) {
  selectedReviewRating = value;
  document.querySelectorAll('#review-star-input .star-btn').forEach((btn) => {
    btn.classList.toggle('active', Number(btn.dataset.value) <= value);
  });
}

async function submitReview() {
  const msg = document.getElementById('review-form-message');
  const btn = document.getElementById('review-submit-btn');
  const comment = document.getElementById('review-comment').value.trim();
  msg.style.display = 'none';

  if (!selectedReviewRating) {
    msg.textContent = 'Please select a star rating.';
    msg.style.display = 'block';
    return;
  }
  if (!comment) {
    msg.textContent = 'Please write a comment.';
    msg.style.display = 'block';
    return;
  }

  btn.disabled = true;
  try {
    await api.post(`/products/${currentProduct._id}/reviews`, { rating: selectedReviewRating, comment });
    showToast('Review submitted — thank you!');
    loadReviews(currentProduct._id);
    loadReviewForm(currentProduct._id);
  } catch (err) {
    msg.textContent = err.message;
    msg.style.display = 'block';
    btn.disabled = false;
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
