let bannerAutoTimer = null;
let bannerPaused = false;
let bannerScrollDebounce = null;

async function loadBannerCarousel() {
  const section = document.querySelector('.banner-carousel-section');
  const carousel = document.getElementById('banner-carousel');
  const dotsEl = document.getElementById('banner-dots');
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
      const img = `<img src="${b.image}" alt="Promotional banner" loading="${i === 0 ? 'eager' : 'lazy'}" draggable="false" />`;
      return `<div class="banner-carousel-slide">${b.link ? `<a href="${escapeHTML(b.link)}" draggable="false">${img}</a>` : img}</div>`;
    })
    .join('');

  if (dotsEl) {
    dotsEl.innerHTML =
      banners.length > 1
        ? banners
            .map((_, i) => `<span class="banner-carousel-dot${i === 0 ? ' active' : ''}" onclick="scrollToBannerSlide(${i})"></span>`)
            .join('')
        : '';
  }

  if (banners.length > 1) {
    wireBannerCarouselInteraction(carousel);
    startBannerAutoplay(carousel);
  }
}

function getBannerSlideStep(carousel) {
  const slide = carousel.querySelector('.banner-carousel-slide');
  if (!slide) return 0;
  const gap = parseFloat(getComputedStyle(carousel).columnGap) || 0;
  return slide.getBoundingClientRect().width + gap;
}

function setActiveBannerDot(index) {
  document.querySelectorAll('.banner-carousel-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === index);
  });
}

function scrollToBannerSlide(index) {
  const carousel = document.getElementById('banner-carousel');
  if (!carousel) return;
  const step = getBannerSlideStep(carousel);
  carousel.scrollTo({ left: step * index, behavior: 'smooth' });
  setActiveBannerDot(index);
}

function wireBannerCarouselInteraction(carousel) {
  let dragging = false;
  let startX = 0;
  let startScroll = 0;

  const pause = () => {
    bannerPaused = true;
    clearInterval(bannerAutoTimer);
  };
  const resume = () => {
    bannerPaused = false;
    startBannerAutoplay(carousel);
  };

  // Touch devices already scroll natively on drag; only mouse needs manual drag-to-scroll,
  // since a hidden scrollbar means a plain mouse has no other way to slide the carousel.
  carousel.addEventListener('pointerdown', (e) => {
    pause();
    if (e.pointerType === 'mouse') {
      dragging = true;
      startX = e.clientX;
      startScroll = carousel.scrollLeft;
      carousel.classList.add('dragging');
      e.preventDefault();
    }
  });

  document.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    carousel.scrollLeft = startScroll - (e.clientX - startX);
  });

  document.addEventListener('pointerup', () => {
    if (dragging) {
      dragging = false;
      carousel.classList.remove('dragging');
      const step = getBannerSlideStep(carousel);
      if (step) {
        const nearest = Math.round(carousel.scrollLeft / step);
        carousel.scrollTo({ left: nearest * step, behavior: 'smooth' });
        setActiveBannerDot(nearest);
      }
    }
    resume();
  });

  carousel.addEventListener('touchstart', pause, { passive: true });
  document.addEventListener('touchend', resume);

  // Fallback for native touch swipes, where nothing above sets the index directly.
  carousel.addEventListener('scroll', () => {
    clearTimeout(bannerScrollDebounce);
    bannerScrollDebounce = setTimeout(() => {
      const step = getBannerSlideStep(carousel);
      if (step) setActiveBannerDot(Math.round(carousel.scrollLeft / step));
    }, 80);
  });
}

function startBannerAutoplay(carousel) {
  clearInterval(bannerAutoTimer);
  if (bannerPaused) return;
  bannerAutoTimer = setInterval(() => {
    const step = getBannerSlideStep(carousel);
    if (!step) return;
    const currentIndex = Math.round(carousel.scrollLeft / step);
    const atEnd = carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 4;
    scrollToBannerSlide(atEnd ? 0 : currentIndex + 1);
  }, 2000);
}

document.addEventListener('DOMContentLoaded', loadBannerCarousel);
