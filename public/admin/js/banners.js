const MAX_BANNERS = 6;
let allBanners = [];

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

function renderBannerGrid() {
  const grid = document.getElementById('banner-grid');
  document.getElementById('banner-count').textContent = allBanners.length;

  let html = allBanners
    .map(
      (b, i) => `
    <div class="banner-admin-card">
      <div class="banner-admin-thumb">
        <img src="${b.image}" alt="" />
        ${!b.active ? '<div class="banner-admin-inactive">Inactive</div>' : ''}
      </div>
      <div class="banner-admin-body">
        <div class="field">
          <label>Link (optional)</label>
          <input type="url" id="banner-link-${b._id}" value="${b.link || ''}" placeholder="https://... or /shop.html" />
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

  if (allBanners.length < MAX_BANNERS) {
    html += `
      <div class="banner-admin-card add" onclick="triggerBannerPicker()" title="Add a banner">
        <span data-icon="plus" data-icon-size="26"></span>
        <span>Add Banner</span>
      </div>
    `;
  }

  grid.innerHTML = html || `<div class="empty-state">No banners yet. Add up to ${MAX_BANNERS} to start the home page carousel.</div>`;
  if (typeof renderIcons === 'function') renderIcons(grid);
}

function triggerBannerPicker() {
  if (allBanners.length >= MAX_BANNERS) return;
  document.getElementById('banner-file-input').click();
}

async function handleBannerFileChange(e) {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    const dataUrl = await resizeImageFile(file, 1600, 0.82);
    await adminApi.post('/banners', { image: dataUrl, link: '', active: true });
    showAdminToast('Banner added');
    loadBanners();
  } catch (err) {
    alert(err.message);
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
