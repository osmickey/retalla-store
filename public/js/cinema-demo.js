// Cinema scroll demo — experimental, not linked from the live site.
// The scroll/parallax math below implements a known layered-parallax technique
// (segment-based smoothstep easing driving CSS custom properties). Art assets
// are original placeholder SVGs generated for this demo, not photographs.

(function () {
  const PLACEHOLDER_IMAGES = {
    sky: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNjAwIDEwMDAiPjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0iZyIgeDE9IjAiIHkxPSIwIiB4Mj0iMCIgeTI9IjEiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiM0ZDhmYjgiLz48c3RvcCBvZmZzZXQ9IjU1JSIgc3RvcC1jb2xvcj0iIzdmYjRkNCIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI2VlY2Y5ZSIvPjwvbGluZWFyR3JhZGllbnQ+PHJhZGlhbEdyYWRpZW50IGlkPSJzIiBjeD0iNzIlIiBjeT0iMzQlIiByPSIxOCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmZmY2ZGUiIHN0b3Atb3BhY2l0eT0iMC45NSIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI2ZmZjZkZSIgc3RvcC1vcGFjaXR5PSIwIi8+PC9yYWRpYWxHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjE2MDAiIGhlaWdodD0iMTAwMCIgZmlsbD0idXJsKCNnKSIvPjxjaXJjbGUgY3g9IjExNTIiIGN5PSIzNDAiIHI9IjIyMCIgZmlsbD0idXJsKCNzKSIvPjxjaXJjbGUgY3g9IjExNTIiIGN5PSIzNDAiIHI9IjU4IiBmaWxsPSIjZmZmOWVjIi8+PC9zdmc+Cg==',
    backFour: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjAwIDkwMCI+PGRlZnM+PHJhZGlhbEdyYWRpZW50IGlkPSJnIiBjeD0iNTAlIiBjeT0iNjIlIiByPSI0NiUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmZmQ5YTAiIHN0b3Atb3BhY2l0eT0iMC45Ii8+PHN0b3Agb2Zmc2V0PSI1NSUiIHN0b3AtY29sb3I9IiNmZmI0NmIiIHN0b3Atb3BhY2l0eT0iMC40Ii8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjZmZiNDZiIiBzdG9wLW9wYWNpdHk9IjAiLz48L3JhZGlhbEdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI5MDAiIGZpbGw9Im5vbmUiLz48ZWxsaXBzZSBjeD0iNjAwIiBjeT0iNTYwIiByeD0iNTYwIiByeT0iMzYwIiBmaWxsPSJ1cmwoI2cpIi8+PC9zdmc+Cg==',
    bazaar: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNDAwIDY0MCI+PGcgZmlsbD0iIzNhMmEyMiI+PHJlY3QgeD0iMCIgeT0iNDIwIiB3aWR0aD0iMTIwIiBoZWlnaHQ9IjIyMCIvPjxyZWN0IHg9IjExMCIgeT0iMzYwIiB3aWR0aD0iMTQwIiBoZWlnaHQ9IjI4MCIvPjxyZWN0IHg9IjI0MCIgeT0iNDAwIiB3aWR0aD0iMTEwIiBoZWlnaHQ9IjI0MCIvPjxyZWN0IHg9IjkwMCIgeT0iMzgwIiB3aWR0aD0iMTMwIiBoZWlnaHQ9IjI2MCIvPjxyZWN0IHg9IjEwMjAiIHk9IjQyMCIgd2lkdGg9IjE1MCIgaGVpZ2h0PSIyMjAiLz48cmVjdCB4PSIxMTYwIiB5PSIzNjAiIHdpZHRoPSIxMjAiIGhlaWdodD0iMjgwIi8+PHJlY3QgeD0iMTI3MCIgeT0iNDEwIiB3aWR0aD0iMTMwIiBoZWlnaHQ9IjIzMCIvPjxyZWN0IHg9IjMzMCIgeT0iMzQwIiB3aWR0aD0iOTAiIGhlaWdodD0iMzAwIi8+PC9nPjxnIGZpbGw9IiM0YTM1MjkiPjxyZWN0IHg9IjU2MCIgeT0iMTgwIiB3aWR0aD0iMjYiIGhlaWdodD0iNDYwIi8+PGNpcmNsZSBjeD0iNTczIiBjeT0iMTUwIiByPSI0NiIvPjxwYXRoIGQ9Ik01MjcgMTUwIFE1NzMgNjAgNjE5IDE1MCBaIi8+PHJlY3QgeD0iNTU1IiB5PSI5NiIgd2lkdGg9IjM2IiBoZWlnaHQ9IjI0IiByeD0iNCIvPjwvZz48cmVjdCB4PSIwIiB5PSI2MDAiIHdpZHRoPSIxNDAwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjMmMyMDE5Ii8+PC9zdmc+Cg==',
    archLeft: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA5MDAgMTAwMCI+PGcgZmlsbD0iIzhhN2E2MyI+PHJlY3QgeD0iNzQwIiB5PSIwIiB3aWR0aD0iMTYwIiBoZWlnaHQ9IjEwMDAiLz48cGF0aCBkPSJNNzQwIDQ4MCBRNzQwIDIyMCA1MDAgMTkwIEw1MDAgMzQwIFE2ODAgMzYwIDY4MCA0ODAgWiIgLz48L2c+PGcgZmlsbD0iIzZkNWY0YyI+PHJlY3QgeD0iNzAwIiB5PSIwIiB3aWR0aD0iNDAiIGhlaWdodD0iMTAwMCIvPjwvZz48ZyBvcGFjaXR5PSIwLjM1IiBmaWxsPSIjZmZmIj48cmVjdCB4PSI3NjAiIHk9IjYwIiB3aWR0aD0iNiIgaGVpZ2h0PSI4ODAiLz48L2c+PC9zdmc+Cg==',
    archRight: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA5MDAgMTAwMCI+PGcgZmlsbD0iIzhhN2E2MyI+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjE2MCIgaGVpZ2h0PSIxMDAwIi8+PHBhdGggZD0iTTE2MCA0ODAgUTE2MCAyMjAgNDAwIDE5MCBMNDAwIDM0MCBRMjIwIDM2MCAyMjAgNDgwIFoiIC8+PC9nPjxnIGZpbGw9IiM2ZDVmNGMiPjxyZWN0IHg9IjE2MCIgeT0iMCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjEwMDAiLz48L2c+PGcgb3BhY2l0eT0iMC4zNSIgZmlsbD0iI2ZmZiI+PHJlY3QgeD0iMTM0IiB5PSI2MCIgd2lkdGg9IjYiIGhlaWdodD0iODgwIi8+PC9nPjwvc3ZnPgo=',
    bridge: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxODAwIDgwMCI+PGcgZmlsbD0iIzhhN2E2MyI+PHJlY3QgeD0iMCIgeT0iNTYwIiB3aWR0aD0iNDQwIiBoZWlnaHQ9IjI0MCIvPjxyZWN0IHg9IjEzNjAiIHk9IjU2MCIgd2lkdGg9IjQ0MCIgaGVpZ2h0PSIyNDAiLz48cGF0aCBkPSJNNDQwIDYyMCBROTAwIDIwMCAxMzYwIDYyMCBMMTM2MCA3MDAgUTkwMCAzMjAgNDQwIDcwMCBaIi8+PC9nPjxnIGZpbGw9IiM2ZDVmNGMiPjxyZWN0IHg9IjAiIHk9IjU2MCIgd2lkdGg9IjE4MDAiIGhlaWdodD0iMjYiLz48cmVjdCB4PSI0MTAiIHk9IjU2MCIgd2lkdGg9IjM0IiBoZWlnaHQ9IjI0MCIvPjxyZWN0IHg9IjEzNTYiIHk9IjU2MCIgd2lkdGg9IjM0IiBoZWlnaHQ9IjI0MCIvPjwvZz48ZyBmaWxsPSIjNGE0MDM0IiBvcGFjaXR5PSIwLjkiPjxyZWN0IHg9IjAiIHk9Ijc4MCIgd2lkdGg9IjE4MDAiIGhlaWdodD0iMjAiLz48L2c+PGcgZmlsbD0iIzVjOGY3NiIgb3BhY2l0eT0iMC41NSI+PHBhdGggZD0iTTQ0MCA3MDAgUTkwMCA4MDAgMTM2MCA3MDAgTDEzNjAgODAwIEw0NDAgODAwIFoiLz48L2c+PC9zdmc+Cg==',
    river: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNjAwIDEwMDAiPjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0idyIgeDE9IjAiIHkxPSIwIiB4Mj0iMCIgeTI9IjEiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiMxZjZmNWMiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMwZDNmMzYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTYwMCIgaGVpZ2h0PSIxMDAwIiBmaWxsPSJ1cmwoI3cpIi8+PGcgc3Ryb2tlPSIjYmZlNmQ0IiBzdHJva2Utd2lkdGg9IjYiIG9wYWNpdHk9IjAuMzIiIGZpbGw9Im5vbmUiPjxwYXRoIGQ9Ik0tMTAwIDIyMCBRNDAwIDE4MCA5MDAgMjQwIFQxOTAwIDIwMCIvPjxwYXRoIGQ9Ik0tMTAwIDQyMCBRNTAwIDM4MCAxMDAwIDQ0MCBUMTkwMCA0MDAiLz48cGF0aCBkPSJNLTEwMCA2NDAgUTQ1MCA2MDAgOTUwIDY2MCBUMTkwMCA2MTAiLz48cGF0aCBkPSJNLTEwMCA4NDAgUTUwMCA4MDAgMTAwMCA4NTAgVDE5MDAgODAwIi8+PC9nPjwvc3ZnPgo=',
  };

  function seedPlaceholderArt() {
    const map = [
      ['.sky-img', PLACEHOLDER_IMAGES.sky],
      ['.back-four', PLACEHOLDER_IMAGES.backFour],
      ['.back-bazaar', PLACEHOLDER_IMAGES.bazaar],
      ['.splitframe-left', PLACEHOLDER_IMAGES.archLeft],
      ['.splitframe-right', PLACEHOLDER_IMAGES.archRight],
      ['.bridge-img', PLACEHOLDER_IMAGES.bridge],
      ['.frame-two-img', PLACEHOLDER_IMAGES.river],
    ];
    map.forEach(([selector, src]) => {
      const el = document.querySelector(selector);
      if (el) el.src = src;
    });
  }

  const section = document.querySelector('.cinema-scroll');
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const track = document.querySelector('.sights-track');
  const sightsControls = document.querySelector('.sights-controls');
  const prevBtn = document.querySelector('.sight-prev');
  const nextBtn = document.querySelector('.sight-next');
  const originalCards = track ? Array.from(track.children) : [];

  let targetMouseX = 0, targetMouseY = 0, mouseX = 0, mouseY = 0;
  let targetScroll = 0, smoothScroll = 0;
  let initialized = false, rafPending = false;
  let sightCards = [];
  const originalSightCount = originalCards.length;
  let activeSight = originalSightCount;

  function clamp(v, min = 0, max = 1) { return Math.min(max, Math.max(min, v)); }
  function smoothstep(e0, e1, v) { const x = clamp((v - e0) / (e1 - e0)); return x * x * (3 - 2 * x); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function segmentInOut(s, a, b, c, d) {
    const enter = smoothstep(a, b, s), exit = smoothstep(c, d, s);
    return { enter, exit, active: enter * (1 - exit) };
  }
  function getScrollDistance() {
    if (!section) return 0;
    return clamp(-section.getBoundingClientRect().top, 0, section.offsetHeight - window.innerHeight);
  }

  function update() {
    rafPending = false;

    targetScroll = getScrollDistance();
    if (!initialized || reduceMotion.matches) {
      smoothScroll = targetScroll;
      initialized = true;
    } else {
      smoothScroll = lerp(smoothScroll, targetScroll, 0.14);
    }
    if (Math.abs(smoothScroll - targetScroll) < 0.08) smoothScroll = targetScroll;

    mouseX = lerp(mouseX, targetMouseX, 0.12);
    mouseY = lerp(mouseY, targetMouseY, 0.12);

    const frame2 = segmentInOut(smoothScroll, 560, 900, 1300, 1620);
    const frame3 = segmentInOut(smoothScroll, 1760, 2140, 2540, 2700);
    const progress = clamp(smoothScroll / 2700);
    const introExit = smoothstep(90, 650, smoothScroll);
    const sightsEnterRaw = smoothstep(2760, 3560, smoothScroll);
    const sightsEnter = Math.pow(sightsEnterRaw, 1.55);
    const sightsControlsEnter = smoothstep(3360, 3660, smoothScroll);
    const blurActive = clamp(frame2.active + frame3.active);
    const frame2Opacity = frame2.active * (1 - frame3.enter);
    const splitDrift = Math.pow(frame2.enter, 1.5);
    const panel2Opacity = frame2.active * (1 - frame2.exit);
    const panel3Opacity = frame3.active * (1 - frame3.exit);
    const backScale = 0.76 + progress * 0.2 + frame2.enter * 0.18 + frame3.enter * 0.16;
    const sharedHeroY = progress * -74;
    const sharedHeroScale = progress * 0.23;
    const sightsScreenTop = Math.min(220, Math.max(112, window.innerHeight * 0.19)) - 50;
    const sightsParentTop = window.innerHeight - (window.innerHeight - sightsScreenTop) / backScale;

    const mx = reduceMotion.matches ? 0 : mouseX;
    const my = reduceMotion.matches ? 0 : mouseY;
    root.style.setProperty('--mx', mx.toFixed(4));
    root.style.setProperty('--my', my.toFixed(4));

    root.style.setProperty('--back-opacity', (1 - frame2.active * 0.06).toString());
    root.style.setProperty('--back-x', `${mouseX * -12}px`);
    root.style.setProperty('--back-y', `${mouseY * -4}px`);
    root.style.setProperty('--back-scale', backScale.toString());
    root.style.setProperty('--four-y', `${10 + progress * 10}vh`);
    root.style.setProperty('--four-scale', (0.78 + progress * 0.16).toString());
    root.style.setProperty('--bazaar-y', `${20 - progress * 8}vh`);
    root.style.setProperty('--blur-px', `${blurActive * 14}px`);
    root.style.setProperty('--back-brightness', (1 - blurActive * 0.255).toString());
    root.style.setProperty('--bazaar-blur-px', `${frame2.active * 14}px`);
    root.style.setProperty('--bazaar-brightness', (1 - frame2.active * 0.255 - frame3.active * 0.06).toString());
    root.style.setProperty('--bazaar-saturation', (1 + frame3.active * 0.18).toString());
    root.style.setProperty('--shade-opacity', '1');
    root.style.setProperty('--shade-z', frame2.active > 0.02 ? '2' : '0');
    root.style.setProperty('--shade-top-alpha', (blurActive * 0.465).toString());
    root.style.setProperty('--shade-mid-alpha', (blurActive * 0.42).toString());
    root.style.setProperty('--shade-bottom-alpha', (blurActive * 0.51).toString());

    root.style.setProperty('--title-y', `${introExit * -210}px`);
    root.style.setProperty('--title-scale', (1 - introExit * 0.08).toString());
    root.style.setProperty('--title-opacity', (1 - introExit).toString());

    root.style.setProperty('--bridge-x', `calc(-50% + ${mouseX * 18}px)`);
    root.style.setProperty('--bridge-y', `${mouseY * 8 + sharedHeroY - frame2.exit * 760}px`);
    root.style.setProperty('--bridge-bottom', `${5 - frame2.enter * 13}vh`);
    root.style.setProperty('--bridge-width', `${67.2 + frame2.enter * 37.8}vw`);
    root.style.setProperty('--bridge-scale', (1.02 + sharedHeroScale + frame2.exit * 0.46).toString());

    root.style.setProperty('--split-left-x', `calc(-50% + ${-splitDrift * 46}vw + ${mouseX * 22}px)`);
    root.style.setProperty('--split-left-y', `${mouseY * 10 + sharedHeroY - splitDrift * 180}px`);
    root.style.setProperty('--split-left-scale', (1 + sharedHeroScale + frame2.enter * 0.74).toString());
    root.style.setProperty('--split-right-x', `calc(-50% + ${splitDrift * 46}vw + ${mouseX * 22}px)`);
    root.style.setProperty('--split-right-y', `${mouseY * 10 + sharedHeroY - splitDrift * 180}px`);
    root.style.setProperty('--split-right-scale', (1 + sharedHeroScale + frame2.enter * 0.74).toString());

    root.style.setProperty('--frame2-opacity', frame2Opacity.toString());
    root.style.setProperty('--frame2-x', `calc(-50% + ${mouseX * 10}px)`);
    root.style.setProperty('--frame2-y', `calc(-50% + ${mouseY * 8 - frame2.exit * 150}px)`);
    root.style.setProperty('--frame2-scale', (1.06 + frame2.enter * 0.08 + frame2.exit * 0.08).toString());

    root.style.setProperty('--intro-copy-y', `${introExit * 90}px`);
    root.style.setProperty('--intro-copy-opacity', (1 - introExit).toString());
    root.style.setProperty('--panel2-opacity', panel2Opacity.toString());
    root.style.setProperty('--panel2-y', `calc(-50% + ${-frame2.exit * 86 + (1 - frame2.enter) * 58}px)`);
    root.style.setProperty('--panel3-opacity', panel3Opacity.toString());
    root.style.setProperty('--panel3-y', `calc(-50% + ${-frame3.exit * 86 + (1 - frame3.enter) * 58}px)`);

    root.style.setProperty('--sights-opacity', sightsEnter.toString());
    root.style.setProperty('--sights-controls-opacity', sightsControlsEnter.toString());
    if (sightsControls) sightsControls.classList.toggle('is-ready', sightsControlsEnter > 0.98);
    root.style.setProperty('--sights-visibility', sightsEnter > 0.01 ? 'visible' : 'hidden');
    root.style.setProperty('--sights-y', '0px');
    root.style.setProperty('--sights-enter-x', `${(1 - sightsEnter) * 420}vw`);
    root.style.setProperty('--sights-scale', (1 / backScale).toString());
    root.style.setProperty('--sights-top', `${sightsParentTop}px`);
    root.style.setProperty('--sights-screen-top', `${sightsScreenTop}px`);

    if (
      Math.abs(smoothScroll - targetScroll) > 0.08 ||
      Math.abs(mouseX - targetMouseX) > 0.001 ||
      Math.abs(mouseY - targetMouseY) > 0.001
    ) {
      requestTick();
    }
  }

  function requestTick() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(update);
  }

  // ===== Infinite sights slider =====
  function updateSightSlider() {
    if (!track || !sightCards.length) return;
    const cardWidth = sightCards[0].offsetWidth;
    const gap = parseFloat(getComputedStyle(track).columnGap || '0');
    root.style.setProperty('--sights-shift', `${-(cardWidth + gap) * activeSight}px`);
    sightCards.forEach((card, i) => card.classList.toggle('is-active', i === activeSight));
  }

  function jumpSightSlider(i) {
    track.classList.add('is-jumping');
    activeSight = i;
    updateSightSlider();
    requestAnimationFrame(() => requestAnimationFrame(() => track.classList.remove('is-jumping')));
  }

  function normalizeSightSlider() {
    if (activeSight >= originalSightCount * 2) jumpSightSlider(activeSight - originalSightCount);
    else if (activeSight < originalSightCount) jumpSightSlider(activeSight + originalSightCount);
  }

  function moveSightSlider(dir) {
    activeSight += dir;
    updateSightSlider();
  }

  function selectSightCard(card) {
    const i = Number(card.dataset.sightIndex);
    if (Number.isFinite(i)) activeSight = i;
    updateSightSlider();
  }

  function setupSightSlider() {
    if (!track || !originalCards.length) return;
    track.replaceChildren();
    const allClones = [];
    for (let setIndex = 0; setIndex < 3; setIndex += 1) {
      originalCards.forEach((card, cardIndex) => {
        const clone = card.cloneNode(true);
        clone.dataset.sightIndex = String(setIndex * originalSightCount + cardIndex);
        track.appendChild(clone);
        allClones.push(clone);
      });
    }
    sightCards = allClones;
    activeSight = originalSightCount;

    sightCards.forEach((card) => {
      card.addEventListener('click', () => selectSightCard(card));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectSightCard(card);
        }
      });
    });
    track.addEventListener('transitionend', normalizeSightSlider);
    updateSightSlider();
  }

  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', () => { updateSightSlider(); requestTick(); });
  window.addEventListener('pointermove', (e) => {
    targetMouseX = e.clientX / window.innerWidth - 0.5;
    targetMouseY = e.clientY / window.innerHeight - 0.5;
    requestTick();
  }, { passive: true });
  if (prevBtn) prevBtn.addEventListener('click', () => moveSightSlider(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => moveSightSlider(1));

  window.addEventListener('load', () => {
    seedPlaceholderArt();
    setupSightSlider();
    requestTick();
  });
})();
