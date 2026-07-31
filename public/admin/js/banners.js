const MAX_BANNERS = 6;
let allBanners = [];
// Which banner an upload is destined for: null means "add a new one".
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

function syncAddControls() {
  const urlInput = document.getElementById('banner-url-input');
  const addBtn = document.getElementById('add-from-url-btn');
  const uploadBtn = document.getElementById('upload-banner-btn');
  const full = atBannerLimit();

  urlInput.disabled = full;
  addBtn.disabled = full;
  uploadBtn.disabled = full;

  // Say why the controls are off rather than silently hiding them.
  if (full) {
    showBannerAddMessage(`You already have ${MAX_BANNERS} banners. Delete one below to add another.`);
  } else {
    showBannerAddMessage('');
  }
}

// Confirms the URL actually resolves to an image before we save it, which catches
// the common mistake of pasting a web page link instead of a direct image link.
function loadImageUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timer = setTimeout(() => reject(new Error('timeout')), 12000);
    img.onload = () => { clearTimeout(timer); resolve(url); };
    img.onerror = () => { clearTimeout(timer); reject(new Error('failed')); };
    img.src = url;
  });
}

function renderBannerGrid() {
  const grid = document.getElementById('banner-grid');
  document.getElementById('banner-count').textContent = allBanners.length;

  if (!allBanners.length) {
    grid.innerHTML = `<div class="empty-state">No banners yet. Add one above to start the home page carousel.</div>`;
    syncAddControls();
    return;
  }

  grid.innerHTML = allBanners
    .map(
      (b, i) => `
    <div class="banner-admin-card">
      <div class="banner-admin-thumb">
        <img src="${b.image}" alt="" />
        ${!b.active ? '<div class="banner-admin-inactive">Inactive</div>' : ''}
      </div>
      <div class="banner-admin-body">
        <div class="field">
          <label>Replace image <span class="field-optional">(paste a direct image URL)</span></label>
          <div class="banner-replace-row">
            <input type="url" id="banner-image-${b._id}" placeholder="https://example.com/banner.jpg" />
            <button type="button" class="btn btn-outline btn-sm" onclick="replaceBannerImage('${b._id}')">Apply</button>
          </div>
          <button type="button" class="pv-change" onclick="triggerBannerPicker('${b._id}')">or upload from device</button>
        </div>
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

  if (typeof renderIcons === 'function') renderIcons(grid);
  syncAddControls();
}

async function addBannerFromUrl() {
  const input = document.getElementById('banner-url-input');
  const url = input.value.trim();
  const btn = document.getElementById('add-from-url-btn');

  if (!url) {
    showBannerAddMessage('Paste an image URL first, or use "Upload from device".');
    return;
  }

  btn.disabled = true;
  const originalText = btn.textContent;
  btn.textContent = 'Checking image...';

  try {
    await loadImageUrl(url);
  } catch (err) {
    btn.disabled = false;
    btn.textContent = originalText;
    showBannerAddMessage("That link didn't load as an image. Make sure it's a direct image URL ending in .jpg, .png or .webp.");
    return;
  }

  try {
    await adminApi.post('/banners', { image: url, link: '', active: true });
    input.value = '';
    showAdminToast('Banner added');
    loadBanners();
  } catch (err) {
    showBannerAddMessage(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

async function replaceBannerImage(id) {
  const input = document.getElementById(`banner-image-${id}`);
  const url = input.value.trim();
  if (!url) {
    alert('Paste an image URL first, or use "or upload from device".');
    return;
  }
  try {
    await loadImageUrl(url);
  } catch (err) {
    alert("That link didn't load as an image. Make sure it's a direct image URL ending in .jpg, .png or .webp.");
    return;
  }
  try {
    await adminApi.put(`/banners/${id}`, { image: url });
    showAdminToast('Banner image updated');
    loadBanners();
  } catch (err) {
    alert(err.message);
  }
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

  try {
    const dataUrl = await resizeImageFile(file, 1600, 0.82);
    if (targetId) {
      await adminApi.put(`/banners/${targetId}`, { image: dataUrl });
      showAdminToast('Banner image updated');
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
