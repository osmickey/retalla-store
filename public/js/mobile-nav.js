function initMobileNav() {
  const hamburger = document.getElementById('hamburger-btn');
  const drawer = document.getElementById('mobile-drawer');
  const searchToggle = document.getElementById('search-toggle-btn');
  const searchForm = document.querySelector('.navbar .search-form');

  if (hamburger && drawer) {
    const drawerCats = drawer.querySelector('.drawer-categories');
    if (drawerCats && typeof CATEGORIES !== 'undefined') {
      drawerCats.innerHTML = CATEGORIES.map(
        (cat) => `<a href="/shop.html?category=${encodeURIComponent(cat)}">${cat}</a>`
      ).join('');
    }

    hamburger.addEventListener('click', () => {
      const isOpen = drawer.classList.toggle('open');
      hamburger.classList.toggle('open', isOpen);
      if (isOpen && searchForm) {
        searchForm.classList.remove('open');
        if (searchToggle) searchToggle.classList.remove('open');
      }
    });
  }

  if (searchToggle && searchForm) {
    searchToggle.addEventListener('click', () => {
      const isOpen = searchForm.classList.toggle('open');
      searchToggle.classList.toggle('open', isOpen);
      if (isOpen) {
        if (drawer) drawer.classList.remove('open');
        if (hamburger) hamburger.classList.remove('open');
        const input = searchForm.querySelector('input');
        if (input) input.focus();
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', initMobileNav);
