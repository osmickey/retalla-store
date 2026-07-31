let heroImage = '';

async function loadHero() {
  try {
    const hero = await adminApi.get('/hero');
    document.getElementById('h-badge').value = hero.badge || '';
    document.getElementById('h-title').value = hero.title || '';
    document.getElementById('h-highlight').value = hero.highlight || '';
    document.getElementById('h-subtitle').value = hero.subtitle || '';
    document.getElementById('h-cta-text').value = hero.ctaText || '';
    document.getElementById('h-cta-link').value = hero.ctaLink || '';
    document.getElementById('h-sec-text').value = hero.secondaryText || '';
    document.getElementById('h-sec-link').value = hero.secondaryLink || '';
    document.getElementById('h-active').checked = hero.active !== false;
    heroImage = hero.image || '';
    renderHeroImagePreview();
  } catch (err) {
    if (err.message !== 'Session expired') showHeroMessage(err.message);
  }
}

function showHeroMessage(message, type = 'error') {
  const el = document.getElementById('hero-message');
  el.textContent = message;
  el.className = `form-message ${type}`;
  el.style.display = 'block';
}

function renderHeroImagePreview() {
  const preview = document.getElementById('hero-image-preview');
  const removeBtn = document.getElementById('hero-remove-image');
  if (heroImage) {
    preview.innerHTML = `<img src="${heroImage}" alt="" />`;
    removeBtn.style.display = '';
  } else {
    preview.textContent = 'No image';
    removeBtn.style.display = 'none';
  }
}

async function handleHeroFileChange(e) {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    heroImage = await resizeImageFile(file, 1200, 0.82);
    renderHeroImagePreview();
  } catch (err) {
    alert(err.message);
  }
}

function removeHeroImage() {
  heroImage = '';
  renderHeroImagePreview();
}

async function saveHero(e) {
  e.preventDefault();
  const btn = document.getElementById('hero-submit-btn');
  btn.disabled = true;

  const payload = {
    badge: document.getElementById('h-badge').value.trim(),
    title: document.getElementById('h-title').value.trim(),
    highlight: document.getElementById('h-highlight').value.trim(),
    subtitle: document.getElementById('h-subtitle').value.trim(),
    ctaText: document.getElementById('h-cta-text').value.trim(),
    ctaLink: document.getElementById('h-cta-link').value.trim(),
    secondaryText: document.getElementById('h-sec-text').value.trim(),
    secondaryLink: document.getElementById('h-sec-link').value.trim(),
    image: heroImage,
    active: document.getElementById('h-active').checked,
  };

  try {
    await adminApi.put('/hero', payload);
    showAdminToast('Hero banner saved');
    document.getElementById('hero-message').style.display = 'none';
  } catch (err) {
    showHeroMessage(err.message);
  } finally {
    btn.disabled = false;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!adminAuth.requireAdmin()) return;
  loadHero();
  document.getElementById('hero-file-input').addEventListener('change', handleHeroFileChange);
});
