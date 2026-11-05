// Track a single reading line across every section, including very tall sections.
export function activationLine(viewportHeight, anchorOffset = 0) {
  return Math.max(anchorOffset + 1, Math.min(160, Math.max(96, viewportHeight * .18)));
}

export function activeSectionAt(positions, { scrollY, viewportHeight, documentHeight, offset = 140 }) {
  if (!positions.length) return null;
  if (scrollY > 0 && scrollY + viewportHeight >= documentHeight - 3) return positions.at(-1).id;
  let active = positions[0].id;
  for (const section of positions) {
    if (section.top > scrollY + offset) break;
    active = section.id;
  }
  return active;
}

export function initSectionNavigation() {
  const sections = [...document.querySelectorAll('.content > .section[id]')];
  const links = [...document.querySelectorAll('.contents nav a')];
  if (!sections.length || !links.length) return;
  let frame = 0;
  let pending = null;
  let settleTimer = 0;

  function mark(id) {
    links.forEach(link => {
      const active = link.hash === `#${id}`;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  function update() {
    frame = 0;
    if (pending) { mark(pending); return; }
    // Reading positions on the frame keeps expanded details, fonts and iframe
    // layout changes in sync without stale cached offsets or intersection ratios.
    const positions = sections.map(section => ({ id: section.id, top: section.getBoundingClientRect().top + window.scrollY }));
    const scrollPadding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    const margin = Math.max(...sections.map(section => parseFloat(getComputedStyle(section).scrollMarginTop) || 0));
    mark(activeSectionAt(positions, {
      scrollY: window.scrollY,
      viewportHeight: window.innerHeight,
      documentHeight: document.documentElement.scrollHeight,
      offset: activationLine(window.innerHeight, scrollPadding + margin),
    }));
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  function release() { pending = null; clearTimeout(settleTimer); schedule(); }
  function onScroll() {
    schedule();
    if (pending) { clearTimeout(settleTimer); settleTimer = setTimeout(release, 160); }
  }
  function targetSection(hash) {
    try {
      const target = document.getElementById(decodeURIComponent(hash.slice(1)));
      return target?.matches('.content > .section[id]') ? target : target?.closest('.content > .section[id]');
    } catch { return null; }
  }
  // Keep the destination highlighted while native smooth scrolling passes
  // intermediate sections; normal tracking resumes when scrolling settles.
  document.addEventListener('click', event => {
    const anchor = event.target.closest('a[href^="#"]');
    if (!anchor || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const section = targetSection(anchor.hash);
    if (!section) return;
    pending = section.id;
    mark(pending);
    clearTimeout(settleTimer);
    settleTimer = setTimeout(release, 1400);
  });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('scrollend', release);
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('hashchange', schedule);
  window.addEventListener('load', schedule, { once: true });
  window.addEventListener('wheel', release, { passive: true });
  window.addEventListener('touchstart', release, { passive: true });
  window.addEventListener('keydown', event => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) release();
  });
  if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(document.querySelector('.content'));
  document.fonts?.ready.then(schedule);
  schedule();
}
