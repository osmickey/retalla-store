const ADMIN_CATEGORIES = [
  'Home Items', 'Women Western', 'Lingerie', 'Men', 'Kids & Toys',
  'Home & Kitchen', 'Beauty & Health', 'Jewellery', 'Bags & Foot',
];
const MAX_IMAGES = 9;

let allProducts = [];
let editingProductId = null;
let productImages = [];

function populateCategorySelect() {
  const sel = document.getElementById('p-category');
  sel.innerHTML = ADMIN_CATEGORIES.map((c) => `<option value="${c}">${c}</option>`).join('');
  const filterSel = document.getElementById('filter-category');
  filterSel.innerHTML = `<option value="">All Categories</option>` + sel.innerHTML;
}

async function loadProducts() {
  const tbody = document.getElementById('products-body');
  tbody.innerHTML = `<tr><td colspan="8" class="loading">Loading products...</td></tr>`;
  try {
    allProducts = await adminApi.get('/products');
    renderProductsTable();
  } catch (err) {
    if (err.message !== 'Session expired') tbody.innerHTML = `<tr><td colspan="8" class="empty-state">${err.message}</td></tr>`;
  }
}

function renderProductsTable() {
  const tbody = document.getElementById('products-body');
  const categoryFilter = document.getElementById('filter-category').value;
  const search = document.getElementById('filter-search').value.trim().toLowerCase();

  let rows = allProducts;
  if (categoryFilter) rows = rows.filter((p) => p.category === categoryFilter);
  if (search) {
    rows = rows.filter(
      (p) => p.name.toLowerCase().includes(search) || (p.sku || '').toLowerCase().includes(search)
    );
  }

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-state">No products found.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows
    .map(
      (p) => `
      <tr>
        <td><img class="table-thumb" src="${p.image}" alt="" /></td>
        <td>${escapeHtml(p.name)}</td>
        <td>${p.sku ? `<code class="sku-code">${escapeHtml(p.sku)}</code>` : '<span class="sku-missing">—</span>'}</td>
        <td>${p.category}</td>
        <td>Rs. ${p.price.toFixed(2)}</td>
        <td>${p.stock}</td>
        <td>${p.isBestSeller ? '⭐ ' : ''}${p.isFeatured ? '✨' : ''}</td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="openEditModal('${p._id}')"><span data-icon="edit" data-icon-size="14"></span> Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteProduct('${p._id}')"><span data-icon="trash" data-icon-size="14"></span> Delete</button>
        </td>
      </tr>
    `
    )
    .join('');
  if (typeof renderIcons === 'function') renderIcons(tbody);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ===== Image slots ===== */

function renderImageSlots() {
  const wrap = document.getElementById('image-slots');
  let html = '';
  for (let i = 0; i < MAX_IMAGES; i++) {
    if (i < productImages.length) {
      html += `
        <div class="image-slot filled">
          ${i === 0 ? '<span class="slot-badge">MAIN</span>' : ''}
          <img src="${productImages[i]}" alt="Image ${i + 1}" />
          <button type="button" class="slot-remove" onclick="removeImage(${i})" title="Remove"><span data-icon="close" data-icon-size="12"></span></button>
          ${i > 0 ? `<button type="button" class="slot-move left" onclick="moveImage(${i}, -1)" title="Move left">‹</button>` : ''}
          ${i < productImages.length - 1 ? `<button type="button" class="slot-move right" onclick="moveImage(${i}, 1)" title="Move right">›</button>` : ''}
        </div>`;
    } else if (i === productImages.length) {
      html += `
        <div class="image-slot add" onclick="triggerImagePicker()" title="Add image">
          <span data-icon="plus" data-icon-size="24"></span>
        </div>`;
    } else {
      html += `<div class="image-slot disabled"></div>`;
    }
  }
  wrap.innerHTML = html;
  if (typeof renderIcons === 'function') renderIcons(wrap);
}

function triggerImagePicker() {
  if (productImages.length >= MAX_IMAGES) return;
  document.getElementById('image-file-input').click();
}

function resizeImageFile(file, maxDim, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round(height * (maxDim / width));
            width = maxDim;
          } else {
            width = Math.round(width * (maxDim / height));
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Could not read image file'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Could not read image file'));
    reader.readAsDataURL(file);
  });
}

async function handleImageFileChange(e) {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    const dataUrl = await resizeImageFile(file, 1000, 0.82);
    productImages.push(dataUrl);
    renderImageSlots();
  } catch (err) {
    alert(err.message);
  }
}

function removeImage(index) {
  productImages.splice(index, 1);
  renderImageSlots();
}

function moveImage(index, direction) {
  const target = index + direction;
  if (target < 0 || target >= productImages.length) return;
  [productImages[index], productImages[target]] = [productImages[target], productImages[index]];
  renderImageSlots();
}

/* ===== Add / Edit modal ===== */

function toggleDeliveryChargeField() {
  const free = document.getElementById('p-free-delivery').checked;
  document.getElementById('delivery-charge-field').style.display = free ? 'none' : 'block';
}

function updateVideoPreview() {
  const url = document.getElementById('p-video-url').value.trim();
  const preview = document.getElementById('p-video-preview');
  if (url) {
    preview.src = url;
    preview.style.display = 'block';
  } else {
    preview.removeAttribute('src');
    preview.style.display = 'none';
  }
}

function openAddModal() {
  editingProductId = null;
  productImages = [];
  document.getElementById('modal-title').textContent = 'Add Product';
  document.getElementById('product-form').reset();
  document.getElementById('product-modal-message').style.display = 'none';
  renderImageSlots();
  updateVideoPreview();
  toggleDeliveryChargeField();
  document.getElementById('product-modal').style.display = 'flex';
}

function openEditModal(id) {
  const p = allProducts.find((x) => x._id === id);
  if (!p) return;
  editingProductId = id;
  productImages = [p.image, ...(p.images || [])].filter(Boolean).slice(0, MAX_IMAGES);
  document.getElementById('modal-title').textContent = 'Edit Product';
  document.getElementById('p-name').value = p.name;
  document.getElementById('p-description').value = p.description || '';
  document.getElementById('p-brand').value = p.brand || '';
  document.getElementById('p-sku').value = p.sku || '';
  document.getElementById('p-category').value = p.category;
  document.getElementById('p-price').value = p.price;
  document.getElementById('p-mrp').value = p.mrp;
  document.getElementById('p-stock').value = p.stock;
  document.getElementById('p-featured').checked = p.isFeatured;
  document.getElementById('p-bestseller').checked = p.isBestSeller;
  document.getElementById('p-free-delivery').checked = p.freeDelivery;
  document.getElementById('p-delivery-charge').value = p.deliveryCharge || 0;
  document.getElementById('p-returnable').checked = p.isReturnable;
  document.getElementById('p-cod').checked = p.codAvailable;
  document.getElementById('p-video-url').value = p.videoUrl || '';
  document.getElementById('p-live-video').checked = p.isLiveVideo;
  document.getElementById('product-modal-message').style.display = 'none';
  renderImageSlots();
  updateVideoPreview();
  toggleDeliveryChargeField();
  document.getElementById('product-modal').style.display = 'flex';
}

function closeProductModal() {
  document.getElementById('product-modal').style.display = 'none';
}

async function submitProductForm(e) {
  e.preventDefault();
  const btn = document.getElementById('product-submit-btn');
  const msg = document.getElementById('product-modal-message');

  if (!productImages.length) {
    msg.textContent = 'Add at least one product image.';
    msg.style.display = 'block';
    return;
  }

  const videoUrl = document.getElementById('p-video-url').value.trim();
  const isLiveVideo = document.getElementById('p-live-video').checked;
  if (isLiveVideo && !videoUrl) {
    msg.textContent = 'Add a video URL to feature this product in "Retalla Live".';
    msg.style.display = 'block';
    return;
  }

  btn.disabled = true;

  const payload = {
    name: document.getElementById('p-name').value.trim(),
    description: document.getElementById('p-description').value.trim(),
    brand: document.getElementById('p-brand').value.trim(),
    sku: document.getElementById('p-sku').value.trim(),
    category: document.getElementById('p-category').value,
    image: productImages[0],
    images: productImages.slice(1),
    price: Number(document.getElementById('p-price').value),
    mrp: Number(document.getElementById('p-mrp').value),
    stock: Number(document.getElementById('p-stock').value),
    freeDelivery: document.getElementById('p-free-delivery').checked,
    deliveryCharge: Number(document.getElementById('p-delivery-charge').value) || 0,
    isReturnable: document.getElementById('p-returnable').checked,
    codAvailable: document.getElementById('p-cod').checked,
    isFeatured: document.getElementById('p-featured').checked,
    isBestSeller: document.getElementById('p-bestseller').checked,
    videoUrl,
    isLiveVideo,
  };

  try {
    if (editingProductId) {
      await adminApi.put(`/products/${editingProductId}`, payload);
    } else {
      await adminApi.post('/products', payload);
    }
    closeProductModal();
    loadProducts();
  } catch (err) {
    msg.textContent = err.message;
    msg.style.display = 'block';
  } finally {
    btn.disabled = false;
  }
}

async function deleteProduct(id) {
  if (!confirm('Delete this product? This cannot be undone.')) return;
  try {
    await adminApi.del(`/products/${id}`);
    loadProducts();
  } catch (err) {
    alert(err.message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!adminAuth.requireAdmin()) return;
  populateCategorySelect();
  loadProducts();
  document.getElementById('filter-category').addEventListener('change', renderProductsTable);
  document.getElementById('filter-search').addEventListener('input', renderProductsTable);
  document.getElementById('image-file-input').addEventListener('change', handleImageFileChange);
});
