const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);

function observeReveals(root) {
  (root || document).querySelectorAll('.reveal:not(.in-view)').forEach((el) => revealObserver.observe(el));
}

function staggerChildren(container, selector, delayStep = 60) {
  if (!container) return;
  container.querySelectorAll(selector).forEach((el, i) => {
    el.classList.add('reveal');
    el.style.transitionDelay = `${Math.min(i, 8) * delayStep}ms`;
  });
  observeReveals(container);
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.section, .perk-card, .testimonial-card').forEach((el) => el.classList.add('reveal'));
  observeReveals();
});
