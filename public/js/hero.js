// Shown on desktop only (CSS hides .hero below the mobile breakpoint).
const HERO_DEFAULTS = {
  badge: 'Mega Sale — Up to 50% Off',
  title: 'Smart Picks for',
  highlight: 'Everyday Living',
  subtitle:
    'Handpicked kitchen, fashion, beauty and home essentials — trusted by thousands of happy shoppers across India.',
  ctaText: 'Shop Now',
  ctaLink: '/shop.html',
  secondaryText: 'Explore Deals',
  secondaryLink: '/shop.html?category=Home%20%26%20Kitchen',
  image: '',
  active: true,
};

async function loadHero() {
  const section = document.getElementById('hero-section');
  const inner = document.getElementById('hero-inner');
  if (!section || !inner) return;

  let hero = {};
  try {
    hero = await api.get('/hero');
  } catch (err) {
    hero = {};
  }

  // An unset/empty hero falls back to the defaults so the page never ships blank.
  const h = { ...HERO_DEFAULTS, ...Object.fromEntries(Object.entries(hero || {}).filter(([, v]) => v !== '' && v != null)) };

  if (h.active === false) {
    section.classList.remove('hero--ready');
    return;
  }

  inner.innerHTML = `
    <div class="hero-copy">
      ${h.badge ? `<span class="hero-badge"><span class="pulse-dot"></span>${escapeHTML(h.badge)}</span>` : ''}
      <h1>${escapeHTML(h.title)}${h.highlight ? ` <span class="hero-highlight">${escapeHTML(h.highlight)}</span>` : ''}</h1>
      ${h.subtitle ? `<p>${escapeHTML(h.subtitle)}</p>` : ''}
      <div class="hero-actions">
        ${h.ctaText ? `<a href="${escapeHTML(h.ctaLink || '/shop.html')}" class="btn btn-accent hero-cta">${escapeHTML(h.ctaText)} <span aria-hidden="true">→</span></a>` : ''}
        ${h.secondaryText ? `<a href="${escapeHTML(h.secondaryLink || '/shop.html')}" class="btn btn-hero-outline">${escapeHTML(h.secondaryText)}</a>` : ''}
      </div>
      <div class="hero-trust">
        <span><span data-icon="check" data-icon-size="15"></span> Free shipping</span>
        <span><span data-icon="check" data-icon-size="15"></span> 7-day returns</span>
        <span><span data-icon="check" data-icon-size="15"></span> Cash on delivery</span>
      </div>
    </div>
    <div class="hero-visual">
      ${
        h.image
          ? `<div class="hero-art"><img src="${escapeHTML(h.image)}" alt="" /></div>`
          : `<div class="hero-art hero-art-fallback">
               <span class="hero-tile hero-tile-main" data-icon="bag" data-icon-size="64"></span>
               <span class="hero-tile hero-tile-a" data-icon="kitchen" data-icon-size="24"></span>
               <span class="hero-tile hero-tile-b" data-icon="sparkle" data-icon-size="22"></span>
               <span class="hero-tile hero-tile-c" data-icon="gem" data-icon-size="20"></span>
             </div>`
      }
    </div>
  `;

  renderIcons(inner);
  section.classList.add('hero--ready');
}

document.addEventListener('DOMContentLoaded', loadHero);
