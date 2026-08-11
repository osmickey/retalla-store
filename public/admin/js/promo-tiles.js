const MAX_PROMO_TILES = 8;
let allTiles = [];
// Which tile an upload replaces; null means "create a new tile".
let pendingUploadTileId = null;

async function loadTiles() {
  const grid = document.getElementById('tile-grid');
  grid.innerHTML = `<div class="loading">Loading...</div>`;
  try {
    allTiles = await adminApi.get('/promo-tiles?all=true');
    renderTileGrid();
  } catch (err) {
    if (err.message !== 'Session expired') grid.innerHTML = `<div class="empty-state">${err.message}</div>`;
  }
}

function showTileAddMessage(message, type = 'error') {
  const el = document.getElementById('tile-add-message');
  el.textContent = message;
  el.className = `form-message ${type}`;
  el.style.display = message ? 'block' : 'none';
}

function atTileLimit() {
  return allTiles.length >= MAX_PROMO_TILES;
}

function renderTileGrid() {
  const grid = document.getElementById('tile-grid');
  document.getElementById('tile-count').textContent = allTiles.length;

  let html = allTiles
    .map(
      (t, i) => `
    <div class="banner-admin-card">
      <div class="banner-admin-thumb promo-tile-admin-thumb" style="background:${t.bgColor || '#f3f2fb'}">
        <img src="${t.image}" alt="" />
        <span class="banner-admin-pos">${i + 1}</span>
        ${!t.active ? '<div class="banner-admin-inactive">Inactive</div>' : ''}
      </div>
      <div class="banner-admin-body">
        <button type="button" class="btn btn-outline btn-sm banner-replace-btn" onclick="triggerTilePicker('${t._id}')">
          <span data-icon="edit" data-icon-size="14"></span> Replace image
        </button>
        <div class="field">
          <label>Heading <span class="field-optional">(bold text on the tile)</span></label>
          <input type="text" id="tile-heading-${t._id}" value="${t.heading || ''}" placeholder="Up to 40% off" maxlength="40" />
        </div>
        <div class="field">
          <label>Badge <span class="field-optional">(optional small tag, e.g. Flash Deals)</span></label>
          <input type="text" id="tile-badge-${t._id}" value="${t.badge || ''}" placeholder="Flash Deals" maxlength="20" />
        </div>
        <div class="field">
          <label>Link <span class="field-optional">(where tapping the tile goes)</span></label>
          <input type="text" id="tile-link-${t._id}" value="${t.link || ''}" placeholder="/shop.html?category=Men" />
        </div>
        <div class="tile-color-row">
          <input type="color" id="tile-color-${t._id}" value="${t.bgColor || '#fdf1d6'}" onchange="previewTileColor('${t._id}')" />
          <span>Background colour</span>
        </div>
        <label class="checkbox-row"><input type="checkbox" id="tile-active-${t._id}" ${t.active ? 'checked' : ''} /> Active</label>
        <div class="banner-admin-actions">
          <button type="button" class="btn btn-outline btn-sm" onclick="moveTile('${t._id}', -1)" ${i === 0 ? 'disabled' : ''} title="Move earlier">‹</button>
          <button type="button" class="btn btn-outline btn-sm" onclick="moveTile('${t._id}', 1)" ${i === allTiles.length - 1 ? 'disabled' : ''} title="Move later">›</button>
          <button type="button" class="btn btn-primary btn-sm" onclick="saveTileEntry('${t._id}')">Save</button>
          <button type="button" class="btn btn-danger btn-sm" onclick="deleteTileEntry('${t._id}')"><span data-icon="trash" data-icon-size="13"></span></button>
        </div>
      </div>
    </div>
  `
    )
    .join('');

  if (!atTileLimit()) {
    html += `
      <div class="banner-admin-card add" onclick="triggerTilePicker()" title="Upload a deal tile image">
        <span data-icon="plus" data-icon-size="30"></span>
        <span>Upload tile image</span>
        <small>JPG, PNG or WEBP</small>
      </div>
    `;
  }

  grid.innerHTML = html || '';
  if (typeof renderIcons === 'function') renderIcons(grid);

  showTileAddMessage(
    atTileLimit() ? `You already have ${MAX_PROMO_TILES} deal tiles. Delete one to add another.` : ''
  );
}

function previewTileColor(id) {
  const color = document.getElementById(`tile-color-${id}`).value;
  const thumb = document.getElementById(`tile-color-${id}`).closest('.banner-admin-card').querySelector('.promo-tile-admin-thumb');
  thumb.style.background = color;
}

function triggerTilePicker(tileId) {
  if (!tileId && atTileLimit()) return;
  pendingUploadTileId = tileId || null;
  document.getElementById('tile-file-input').click();
}

async function handleTileFileChange(e) {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;

  const targetId = pendingUploadTileId;
  pendingUploadTileId = null;
  showTileAddMessage('');

  try {
    const dataUrl = await resizeImageFile(file, 900, 0.85);
    if (targetId) {
      await adminApi.put(`/promo-tiles/${targetId}`, { image: dataUrl });
      showAdminToast('Tile image replaced');
    } else {
      await adminApi.post('/promo-tiles', { image: dataUrl, heading: 'New deal', link: '', active: true });
      showAdminToast('Deal tile added — set its heading below');
    }
    loadTiles();
  } catch (err) {
    showTileAddMessage(err.message);
  }
}

async function saveTileEntry(id) {
  const heading = document.getElementById(`tile-heading-${id}`).value.trim();
  const badge = document.getElementById(`tile-badge-${id}`).value.trim();
  const link = document.getElementById(`tile-link-${id}`).value.trim();
  const bgColor = document.getElementById(`tile-color-${id}`).value;
  const active = document.getElementById(`tile-active-${id}`).checked;

  if (!heading) {
    alert('Give this tile a heading first.');
    return;
  }

  try {
    await adminApi.put(`/promo-tiles/${id}`, { heading, badge, link, bgColor, active });
    showAdminToast('Deal tile saved');
    loadTiles();
  } catch (err) {
    alert(err.message);
  }
}

async function moveTile(id, direction) {
  const index = allTiles.findIndex((t) => t._id === id);
  const target = index + direction;
  if (target < 0 || target >= allTiles.length) return;
  const a = allTiles[index];
  const b = allTiles[target];
  try {
    await Promise.all([
      adminApi.put(`/promo-tiles/${a._id}`, { order: b.order }),
      adminApi.put(`/promo-tiles/${b._id}`, { order: a.order }),
    ]);
    loadTiles();
  } catch (err) {
    alert(err.message);
  }
}

async function deleteTileEntry(id) {
  if (!confirm('Delete this deal tile?')) return;
  try {
    await adminApi.del(`/promo-tiles/${id}`);
    showAdminToast('Deal tile deleted');
    loadTiles();
  } catch (err) {
    alert(err.message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!adminAuth.requireAdmin()) return;
  loadTiles();
  document.getElementById('tile-file-input').addEventListener('change', handleTileFileChange);
});
