let bannerCarouselTimer = null;
let bannerCarouselIndex = 0;

async function loadBannerCarousel() {
  const section = document.querySelector('.banner-carousel-section');
  if (!section) return;

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

  const track = document.getElementById('banner-track');
  const dots = document.getElementById('banner-dots');

  track.innerHTML = banners
    .map((b, i) => {
      const img = `<img src="${b.image}" alt="Promotional banner" loading="${i === 0 ? 'eager' : 'lazy'}" />`;
      return `
      <div class="banner-carousel-slide${i === 0 ? ' active' : ''}">
        ${b.link ? `<a href="${escapeHTML(b.link)}">${img}</a>` : img}
      </div>
    `;
    })
    .join('');

  dots.innerHTML =
    banners.length > 1
      ? banners
          .map((_, i) => `<span class="banner-carousel-dot${i === 0 ? ' active' : ''}" onclick="goToBannerSlide(${i})"></span>`)
          .join('')
      : '';

  bannerCarouselIndex = 0;
  if (banners.length > 1) startBannerAutoplay(banners.length);
}

function goToBannerSlide(index) {
  const slides = document.querySelectorAll('.banner-carousel-slide');
  const dots = document.querySelectorAll('.banner-carousel-dot');
  if (!slides.length) return;
  slides[bannerCarouselIndex].classList.remove('active');
  if (dots[bannerCarouselIndex]) dots[bannerCarouselIndex].classList.remove('active');
  bannerCarouselIndex = index;
  slides[bannerCarouselIndex].classList.add('active');
  if (dots[bannerCarouselIndex]) dots[bannerCarouselIndex].classList.add('active');
}

function startBannerAutoplay(count) {
  clearInterval(bannerCarouselTimer);
  bannerCarouselTimer = setInterval(() => {
    goToBannerSlide((bannerCarouselIndex + 1) % count);
  }, 1500);
}

document.addEventListener('DOMContentLoaded', loadBannerCarousel);
