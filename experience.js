/* Lightweight progressive motion: content stays visible without JavaScript. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const animate = (element, frames, options) => {
    if (!reduced.matches && element.animate) element.animate(frames, options);
  };
  const revealed = new WeakSet();
  const reveal = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      reveal.unobserve(entry.target);
      const siblings = [...(entry.target.parentElement?.children || [])];
      const delay = Math.min(Math.max(siblings.indexOf(entry.target), 0) * 55, 165);
      animate(entry.target, [{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 650, delay, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards' });
    }
  }, { threshold: .08, rootMargin: '0px 0px -20px 0px' });
  const refresh = () => {
    document.querySelectorAll('.section-heading, .bento-card, .product-card, .work-card, .steps article, .closing h2').forEach(element => {
      if (!revealed.has(element)) { revealed.add(element); reveal.observe(element); }
    });
  };
  refresh();
  document.addEventListener('caoba:render', refresh);
  for (const id of ['product-grid', 'works-grid']) {
    const target = document.getElementById(id);
    if (target) new MutationObserver(refresh).observe(target, { childList: true });
  }
  const header = document.querySelector('.header');
  const hero = document.querySelector('.hero');
  new IntersectionObserver(([entry]) => header.classList.toggle('is-scrolled', !entry.isIntersecting), { rootMargin: '-90px 0px 0px 0px' }).observe(hero);
  const links = [...document.querySelectorAll('.desktop-nav a, .mobile-nav a')];
  const sectionObserver = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      links.forEach(link => link.hash === `#${entry.target.id}` ? link.setAttribute('aria-current', 'location') : link.removeAttribute('aria-current'));
    }
  }, { rootMargin: '-15% 0px -65% 0px', threshold: 0 });
  ['catalogo', 'trabajos', 'estudio'].forEach(id => sectionObserver.observe(document.getElementById(id)));
  const counts = document.querySelectorAll('.count');
  counts.forEach(count => new MutationObserver(() => animate(count, [{ transform: 'scale(1)' }, { transform: 'scale(1.2)' }, { transform: 'scale(1)' }], { duration: 300, easing: 'ease-out' })).observe(count, { childList: true }));
  animate(document.querySelector('.hero-copy'), [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 750, easing: 'ease-out' });
  animate(document.querySelector('.hero-visual'), [{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 900, delay: 100, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards' });
})();
