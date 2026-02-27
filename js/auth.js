/* ================================================================
   GAIA — Client-side Auth Utility
   Import after storage.js on any page that needs auth
   ================================================================ */

const AUTH_KEY   = 'gaia_token';
const USER_KEY   = 'gaia_user';

/* ── Check token presence ── */
function isLoggedIn() {
  return !!localStorage.getItem(AUTH_KEY);
}

/* ── Get cached user object ── */
function getCurrentUser() {
  const raw = localStorage.getItem(USER_KEY);
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}

/* ── Get JWT token ── */
function getToken() {
  return localStorage.getItem(AUTH_KEY);
}

/* ── Persist auth after login/register ── */
function setAuth(token, user) {
  localStorage.setItem(AUTH_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/* ── Clear auth and redirect ── */
function logout() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(USER_KEY);
  window.location.href = '../login.html';
}

/* ── Require auth — call on every protected page ── */
function requireAuth() {
  if (!isLoggedIn()) {
    localStorage.setItem('gaia_redirect', window.location.pathname);
    window.location.href = '../login.html';
    return false;
  }
  return true;
}

/* ── Role display helpers ── */
const ROLE_LABELS = {
  admin:               '👑 Admin',
  architect:           '📐 Architect',
  structural_engineer: '🧱 Structural Eng.',
  client:              '👤 Client',
  cost_consultant:     '💰 Cost Consultant',
};
function getRoleLabel(role) {
  return ROLE_LABELS[role] || role;
}

/* ── Fetch wrapper with auth header ── */
async function apiCall(endpoint, method = 'GET', data = null) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const opts = { method, headers };
  if (data) opts.body = JSON.stringify(data);
  const res = await fetch('/api' + endpoint, opts);
  if (res.status === 401) { logout(); return null; }
  return res.json();
}

/* ── Inject user chip into sidebar footer ── */
function injectUserChip() {
  const user = getCurrentUser();
  if (!user) return;
  const footer = document.querySelector('.nav-footer');
  if (!footer) return;
  const chip = document.createElement('div');
  chip.className = 'user-chip';
  chip.innerHTML = `
    <div class="user-chip-avatar">${user.name.charAt(0).toUpperCase()}</div>
    <div class="user-chip-info">
      <div class="user-chip-name">${user.name}</div>
      <div class="user-chip-role">${getRoleLabel(user.role)}</div>
    </div>
    <button class="user-chip-logout" title="Logout" onclick="logout()">⏻</button>
  `;
  footer.prepend(chip);
}

/* Auto-inject user chip after DOM ready */
document.addEventListener('DOMContentLoaded', injectUserChip);
