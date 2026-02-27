/* ================================================================
   GAIA — Storage Module
   All data stored in localStorage, keyed by KEYS map
   ================================================================ */

const KEYS = {
  site:       'gaia_site',
  client:     'gaia_client',
  design:     'gaia_design',
  materials:  'gaia_materials',
  structural: 'gaia_structural',
  cost:       'gaia_cost',
  feedback:   'gaia_feedback',
  completed:  'gaia_completed',
  scores:     'gaia_scores',
};

function save(key, data) {
  try {
    localStorage.setItem(KEYS[key], JSON.stringify(data));
  } catch(e) { console.warn('GAIA save error', e); }
}

function load(key) {
  try {
    const raw = localStorage.getItem(KEYS[key]);
    return raw ? JSON.parse(raw) : null;
  } catch(e) { return null; }
}

function markDone(pageId) {
  const done = load('completed') || [];
  if (!done.includes(pageId)) {
    done.push(pageId);
    save('completed', done);
  }
}

function isDone(pageId) {
  const done = load('completed') || [];
  return done.includes(pageId);
}

function resetAll() {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k));
}

function getAllProjectData() {
  return {
    site:       load('site')       || {},
    client:     load('client')     || {},
    design:     load('design')     || {},
    materials:  load('materials')  || {},
    structural: load('structural') || {},
    cost:       load('cost')       || {},
  };
}
