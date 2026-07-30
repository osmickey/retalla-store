let bannerAutoTimer = null;
let bannerPaused = false;

async function loadBannerCarousel() {
  const section = document.querySelector('.banner-carousel-section');
  const carousel = document.getElementById('banner-carousel');
  if (!section || !carousel) return;

  let banners = [];
  try {
    banners = await api.get('/banners');
  } catch (err) {
    section.style.display = 'none';
    return;
  }

  if (!banners.length) {
    section.style.display = 'none';
    return;
  }

  carousel.innerHTML = banners
    .map((b, i) => {
      const img = `<img src="${b.image}" alt="Promotional banner" loading="${i === 0 ? 'eager' : 'lazy'}" />`;
      return `<div class="banner-carousel-slide">${b.link ? `<a href="${escapeHTML(b.link)}">${img}</a>` : img}</div>`;
    })
    .join('');

  if (banners.length > 1) {
    wireBannerCarouselInteraction(carousel);
    startBannerAutoplay(carousel);
  }
}

function wireBannerCarouselInteraction(carousel) {
  const pause = () => {
    bannerPaused = true;
    clearInterval(bannerAutoTimer);
  };
  const resume = () => {
    bannerPaused = false;
    startBannerAutoplay(carousel);
  };

  carousel.addEventListener('pointerdown', pause);
  carousel.addEventListener('touchstart', pause, { passive: true });
  document.addEventListener('pointerup', resume);
  document.addEventListener('touchend', resume);
}

function startBannerAutoplay(carousel) {
  clearInterval(bannerAutoTimer);
  if (bannerPaused) return;
  bannerAutoTimer = setInterval(() => {
    const slide = carousel.querySelector('.banner-carousel-slide');
    if (!slide) return;
    const gap = parseFloat(getComputedStyle(carousel).columnGap) || 0;
    const step = slide.getBoundingClientRect().width + gap;
    const atEnd = carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 4;
    if (atEnd) {
      carousel.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      carousel.scrollBy({ left: step, behavior: 'smooth' });
    }
  }, 2000);
}

document.addEventListener('DOMContentLoaded', loadBannerCarousel);
