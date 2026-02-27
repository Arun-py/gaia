/* ================================================================
   GAIA — Navigation Component
   Inject sidebar + handle mobile toggle on every inner page
   ================================================================ */

const NAV_ITEMS = [
  { id: 'home',        icon: '🏠', label: 'Home',                 href: '../index.html',                step: null },
  { id: 'site',        icon: '🌍', label: 'Site Analysis',        href: 'site-analysis.html',           step: 1 },
  { id: 'client',      icon: '👤', label: 'Client Requirements',  href: 'client-requirements.html',     step: 2 },
  { id: 'design',      icon: '📐', label: 'Smart Design',         href: 'smart-design.html',            step: 3 },
  { id: 'materials',   icon: '🌱', label: 'Material Selection',   href: 'material-selection.html',      step: 4 },
  { id: 'structural',  icon: '🧱', label: 'Structural Safety',    href: 'structural-safety.html',       step: 5 },
  { id: 'cost',        icon: '💰', label: 'Cost Planning',        href: 'cost-planning.html',           step: 6 },
  { id: 'dashboard',   icon: '📊', label: 'Dashboard',            href: 'dashboard.html',               step: 7 },
  { id: 'feasibility', icon: '🔎', label: 'Feasibility Analysis', href: 'feasibility.html',             step: 8 },
  { id: 'feedback',    icon: '🔄', label: 'Feedback',             href: 'feedback.html',                step: 9 },
];

function buildNavItem(item, currentId, done) {
  const isActive    = item.id === currentId;
  const isCompleted = done.includes(item.id);
  let cls = 'nav-item';
  if (isActive)              cls += ' active';
  else if (isCompleted)      cls += ' done';

  const circleContent = isCompleted && !isActive
    ? '✓'
    : (item.step ?? item.icon);

  const circleEl = item.step
    ? `<span class="step-circle">${circleContent}</span>`
    : `<span class="step-circle" style="background:transparent;font-size:.9rem;">${item.icon}</span>`;

  return `<a href="${item.href}" class="${cls}">${circleEl}<span>${item.label}</span></a>`;
}

function renderNav(currentId) {
  const done = load('completed') || [];
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  sidebar.innerHTML = `
    <div class="sidebar-brand">
      <div class="logo">
        <img src="../logo.png" alt="Gaia" style="width:100%;height:100%;object-fit:cover;display:block;">
      </div>
      <div class="brand-text">
        <h3>Gaia</h3>
        <p>Smart Building Designer</p>
      </div>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-label">Design Steps</div>
      ${NAV_ITEMS.map(it => buildNavItem(it, currentId, done)).join('')}
    </nav>
    <div class="nav-footer">
      <button class="btn-reset" onclick="confirmReset()">🔄 Reset All Data</button>
    </div>
  `;
}

function confirmReset() {
  if (confirm('This will clear all your project data and restart. Continue?')) {
    resetAll();
    window.location.href = '../index.html';
  }
}

/* Mobile toggle */
document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.getElementById('hamburger');
  const overlay   = document.getElementById('sidebar-overlay');
  const sidebar   = document.getElementById('sidebar');

  function openSidebar()  { sidebar?.classList.add('open'); overlay?.classList.add('active'); }
  function closeSidebar() { sidebar?.classList.remove('open'); overlay?.classList.remove('active'); }

  hamburger?.addEventListener('click', openSidebar);
  overlay?.addEventListener('click', closeSidebar);
});
