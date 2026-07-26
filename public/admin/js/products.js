const ADMIN_CATEGORIES = [
  'Home Items', 'Women Western', 'Lingerie', 'Men', 'Kids & Toys',
  'Home & Kitchen', 'Beauty & Health', 'Jewellery', 'Bags & Foot',
];

let allProducts = [];
let editingProductId = null;

function populateCategorySelect() {
  const sel = document.getElementById('p-category');
  sel.innerHTML = ADMIN_CATEGORIES.map((c) => `<option value="${c}">${c}</option>`).join('');
  const filterSel = document.getElementById('filter-category');
  filterSel.innerHTML = `<option value="">All Categories</option>` + sel.innerHTML;
}

async function loadProducts() {
  const tbody = document.getElementById('products-body');
  tbody.innerHTML = `<tr><td colspan="7" class="loading">Loading products...</td></tr>`;
  try {
    allProducts = await adminApi.get('/products');
    renderProductsTable();
  } catch (err) {
    if (err.message !== 'Session expired') tbody.innerHTML = `<tr><td colspan="7" class="empty-state">${err.message}</td></tr>`;
  }
}

function renderProductsTable() {
  const tbody = document.getElementById('products-body');
  const categoryFilter = document.getElementById('filter-category').value;
  const search = document.getElementById('filter-search').value.trim().toLowerCase();

  let rows = allProducts;
  if (categoryFilter) rows = rows.filter((p) => p.category === categoryFilter);
  if (search) rows = rows.filter((p) => p.name.toLowerCase().includes(search));

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state">No products found.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows
    .map(
      (p) => `
      <tr>
        <td><img class="table-thumb" src="${p.image}" alt="" /></td>
        <td>${escapeHtml(p.name)}</td>
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

function openAddModal() {
  editingProductId = null;
  document.getElementById('modal-title').textContent = 'Add Product';
  document.getElementById('product-form').reset();
  document.getElementById('product-modal-message').style.display = 'none';
  document.getElementById('product-modal').style.display = 'flex';
}

function openEditModal(id) {
  const p = allProducts.find((x) => x._id === id);
  if (!p) return;
  editingProductId = id;
  document.getElementById('modal-title').textContent = 'Edit Product';
  document.getElementById('p-name').value = p.name;
  document.getElementById('p-description').value = p.description || '';
  document.getElementById('p-category').value = p.category;
  document.getElementById('p-image').value = p.image;
  document.getElementById('p-price').value = p.price;
  document.getElementById('p-mrp').value = p.mrp;
  document.getElementById('p-stock').value = p.stock;
  document.getElementById('p-featured').checked = p.isFeatured;
  document.getElementById('p-bestseller').checked = p.isBestSeller;
  document.getElementById('product-modal-message').style.display = 'none';
  document.getElementById('product-modal').style.display = 'flex';
}

function closeProductModal() {
  document.getElementById('product-modal').style.display = 'none';
}

async function submitProductForm(e) {
  e.preventDefault();
  const btn = document.getElementById('product-submit-btn');
  const msg = document.getElementById('product-modal-message');
  btn.disabled = true;

  const payload = {
    name: document.getElementById('p-name').value.trim(),
    description: document.getElementById('p-description').value.trim(),
    category: document.getElementById('p-category').value,
    image: document.getElementById('p-image').value.trim(),
    price: Number(document.getElementById('p-price').value),
    mrp: Number(document.getElementById('p-mrp').value),
    stock: Number(document.getElementById('p-stock').value),
    isFeatured: document.getElementById('p-featured').checked,
    isBestSeller: document.getElementById('p-bestseller').checked,
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
});
