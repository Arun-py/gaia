/* ================================================================
   GAIA — Page Transition System
   Include on every inner page. Provides:
    • Fade-in on page load
    • Fade-out before navigating away
    • navigateTo(href) helper for programmatic navigation
   ================================================================ */

(function () {
  /* Create overlay element */
  const overlay = document.createElement('div');
  overlay.id = 'page-overlay';
  overlay.style.cssText = `
    position:fixed;inset:0;
    background:#0f2942;
    z-index:9990;
    pointer-events:none;
    opacity:1;
    transition:opacity .38s cubic-bezier(.4,0,.2,1);
  `;
  document.body.appendChild(overlay);

  /* Fade IN — reveal page */
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      overlay.style.opacity = '0';
    });
  });

  /* Intercept all internal link clicks */
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('http') ||
        href.startsWith('mailto') || href.startsWith('tel') ||
        link.target === '_blank') return;

    e.preventDefault();
    navigateTo(href);
  });

  /* Public navigate helper */
  window.navigateTo = function (href) {
    overlay.style.pointerEvents = 'all';
    overlay.style.opacity = '1';
    setTimeout(() => { window.location.href = href; }, 380);
  };
})();
