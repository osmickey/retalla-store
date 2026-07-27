const ICON_PATHS = {
  user: '<circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c1.5-4 5-5.5 7.5-5.5s6 1.5 7.5 5.5"/>',
  cart: '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2.5 3h2.4l2.1 11.2a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L21 7H6"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.3-4.3"/>',
  'return': '<path d="M4 10h11a5 5 0 0 1 0 10h-2"/><path d="M8 5 4 10l4 5"/>',
  wallet: '<rect x="2.5" y="6" width="19" height="13" rx="2"/><path d="M2.5 10h19"/><circle cx="17" cy="14" r="1.1" fill="currentColor" stroke="none"/>',
  truck: '<path d="M2.5 7h11v9h-11z"/><path d="M13.5 10.5H17l3.5 3v2.5h-3.5"/><circle cx="7" cy="18.5" r="1.6"/><circle cx="17" cy="18.5" r="1.6"/>',
  tag: '<path d="M12.6 3H4a1 1 0 0 0-1 1v8.6a1 1 0 0 0 .3.7l9.4 9.4a1 1 0 0 0 1.4 0l8-8a1 1 0 0 0 0-1.4l-9.4-9.4a1 1 0 0 0-.1-.1z"/><circle cx="8" cy="8" r="1.3" fill="currentColor" stroke="none"/>',
  bag: '<path d="M6 8h12l-1 12H7z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  heart: '<path d="M12 20s-7-4.4-9.3-9A5 5 0 0 1 12 6a5 5 0 0 1 9.3 5c-2.3 4.6-9.3 9-9.3 9z"/>',
  home: '<path d="M3 11 12 4l9 7"/><path d="M5 10v9h14v-9"/><path d="M9.5 19v-5h5v5"/>',
  dress: '<path d="M9 3h6l1 3-2 2 2 3-2 10H8L6 11l2-3-2-2z"/>',
  shirt: '<path d="M8 4 4 7l2 3 2-1v11h8V9l2 1 2-3-4-3-2 2h-4z"/>',
  toy: '<rect x="4" y="10" width="7" height="7" rx="1"/><rect x="13" y="10" width="7" height="7" rx="1"/><rect x="8.5" y="4" width="7" height="7" rx="1"/>',
  kitchen: '<path d="M4 13h16"/><path d="M5 13a7 7 0 0 1 14 0"/><path d="M6 13l1.5 7h9L18 13"/>',
  sparkle: '<path d="M12 3c2 4-4 6-4 10a4 4 0 0 0 8 0c0-4-6-6-4-10z"/>',
  gem: '<path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M9 3l3 6-3 12M15 3l-3 6 3 12"/>',
  shoe: '<path d="M3 15c0-3 2-4 4-4l3-4h3l2 3 5 1.5c1.4.4 2 1.3 2 2.5v2H3z"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/>',
  box: '<path d="M3 8l9-4 9 4-9 4-9-4z"/><path d="M3 8v8l9 4 9-4V8"/><path d="M12 12v8"/>',
  receipt: '<path d="M6 2h12v20l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5-2 1.5z"/><path d="M8.5 7h7M8.5 11h7M8.5 15h4"/>',
  dashboard: '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="5" rx="1.5"/><rect x="13" y="10" width="8" height="11" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
  revenue: '<circle cx="12" cy="12" r="9"/><path d="M9 9.3a2 2 0 0 1 3-1.6 2 2 0 0 1 0 3.3A2 2 0 0 0 12 14.3a2 2 0 0 0 3-1.6"/><path d="M12 6.5v11"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3z"/><path d="M13.5 6.5l3 3"/>',
  trash: '<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/>',
  close: '<path d="M5 5l14 14M19 5 5 19"/>',
  star: '<path d="M12 2 14.9 8.5 22 9.3 16.5 14 18 21 12 17.5 6 21 7.5 14 2 9.3 9.1 8.5Z" fill="currentColor" stroke="none"/>',
};

function iconSVG(name, size) {
  const inner = ICON_PATHS[name] || '';
  const s = size || 22;
  return `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}

function renderIcons(root) {
  (root || document).querySelectorAll('[data-icon]').forEach((el) => {
    const name = el.getAttribute('data-icon');
    const size = el.getAttribute('data-icon-size');
    el.innerHTML = iconSVG(name, size ? Number(size) : undefined);
  });
}

document.addEventListener('DOMContentLoaded', () => renderIcons());
