const MAX_BANNERS = 6;
let allBanners = [];
// Which banner an upload replaces; null means "create a new banner".
let pendingUploadBannerId = null;

async function loadBanners() {
  const grid = document.getElementById('banner-grid');
  grid.innerHTML = `<div class="loading">Loading...</div>`;
  try {
    allBanners = await adminApi.get('/banners?all=true');
    renderBannerGrid();
  } catch (err) {
    if (err.message !== 'Session expired') grid.innerHTML = `<div class="empty-state">${err.message}</div>`;
  }
}

function showBannerAddMessage(message, type = 'error') {
  const el = document.getElementById('banner-add-message');
  el.textContent = message;
  el.className = `form-message ${type}`;
  el.style.display = message ? 'block' : 'none';
}

function atBannerLimit() {
  return allBanners.length >= MAX_BANNERS;
}

function renderBannerGrid() {
  const grid = document.getElementById('banner-grid');
  document.getElementById('banner-count').textContent = allBanners.length;

  let html = allBanners
    .map(
      (b, i) => `
    <div class="banner-admin-card">
      <div class="banner-admin-thumb">
        <img src="${b.image}" alt="" />
        <span class="banner-admin-pos">${i + 1}</span>
        ${!b.active ? '<div class="banner-admin-inactive">Inactive</div>' : ''}
      </div>
      <div class="banner-admin-body">
        <button type="button" class="btn btn-outline btn-sm banner-replace-btn" onclick="triggerBannerPicker('${b._id}')">
          <span data-icon="edit" data-icon-size="14"></span> Replace image
        </button>
        <div class="field">
          <label>Click-through link <span class="field-optional">(where tapping the banner goes)</span></label>
          <input type="url" id="banner-link-${b._id}" value="${b.link || ''}" placeholder="/shop.html" />
        </div>
        <label class="checkbox-row"><input type="checkbox" id="banner-active-${b._id}" ${b.active ? 'checked' : ''} /> Active</label>
        <div class="banner-admin-actions">
          <button type="button" class="btn btn-outline btn-sm" onclick="moveBanner('${b._id}', -1)" ${i === 0 ? 'disabled' : ''} title="Move earlier">‹</button>
          <button type="button" class="btn btn-outline btn-sm" onclick="moveBanner('${b._id}', 1)" ${i === allBanners.length - 1 ? 'disabled' : ''} title="Move later">›</button>
          <button type="button" class="btn btn-primary btn-sm" onclick="saveBannerEntry('${b._id}')">Save</button>
          <button type="button" class="btn btn-danger btn-sm" onclick="deleteBannerEntry('${b._id}')"><span data-icon="trash" data-icon-size="13"></span></button>
        </div>
      </div>
    </div>
  `
    )
    .join('');

  if (!atBannerLimit()) {
    html += `
      <div class="banner-admin-card add" onclick="triggerBannerPicker()" title="Upload a banner image">
        <span data-icon="plus" data-icon-size="30"></span>
        <span>Upload banner image</span>
        <small>JPG, PNG or WEBP</small>
      </div>
    `;
  }

  grid.innerHTML = html || '';
  if (typeof renderIcons === 'function') renderIcons(grid);

  // Say why the add tile is gone rather than leaving it a mystery.
  showBannerAddMessage(
    atBannerLimit() ? `You already have ${MAX_BANNERS} banners. Delete one to add another.` : ''
  );
}

function triggerBannerPicker(bannerId) {
  if (!bannerId && atBannerLimit()) return;
  pendingUploadBannerId = bannerId || null;
  document.getElementById('banner-file-input').click();
}

async function handleBannerFileChange(e) {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;

  const targetId = pendingUploadBannerId;
  pendingUploadBannerId = null;
  showBannerAddMessage('');

  try {
    const dataUrl = await resizeImageFile(file, 1600, 0.82);
    if (targetId) {
      await adminApi.put(`/banners/${targetId}`, { image: dataUrl });
      showAdminToast('Banner image replaced');
    } else {
      await adminApi.post('/banners', { image: dataUrl, link: '', active: true });
      showAdminToast('Banner added');
    }
    loadBanners();
  } catch (err) {
    showBannerAddMessage(err.message);
  }
}

async function saveBannerEntry(id) {
  const link = document.getElementById(`banner-link-${id}`).value.trim();
  const active = document.getElementById(`banner-active-${id}`).checked;
  try {
    await adminApi.put(`/banners/${id}`, { link, active });
    showAdminToast('Banner saved');
    loadBanners();
  } catch (err) {
    alert(err.message);
  }
}

async function moveBanner(id, direction) {
  const index = allBanners.findIndex((b) => b._id === id);
  const target = index + direction;
  if (target < 0 || target >= allBanners.length) return;
  const a = allBanners[index];
  const b = allBanners[target];
  try {
    await Promise.all([
      adminApi.put(`/banners/${a._id}`, { order: b.order }),
      adminApi.put(`/banners/${b._id}`, { order: a.order }),
    ]);
    loadBanners();
  } catch (err) {
    alert(err.message);
  }
}

async function deleteBannerEntry(id) {
  if (!confirm('Delete this banner?')) return;
  try {
    await adminApi.del(`/banners/${id}`);
    showAdminToast('Banner deleted');
    loadBanners();
  } catch (err) {
    alert(err.message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!adminAuth.requireAdmin()) return;
  loadBanners();
  document.getElementById('banner-file-input').addEventListener('change', handleBannerFileChange);
});
