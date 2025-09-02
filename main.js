// Habitboard - weekly toggle grid, tabs, localStorage persistence, PWA-friendly

(function () {
  const STORAGE_KEY = 'habitboard:v2';
  const LEGACY_KEY = 'habitboard:v1';
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const weeksEl = document.getElementById('weeks');
  const tabsEl = document.getElementById('tabs');
  const addTabBtn = document.getElementById('add-tab');
  const jumpBtn = document.getElementById('jump-today');

  // Root structure
  // { tabs:[{id,name,createdAt}], activeId, data:{ [id]: { [YYYY-MM-DD]: bool } } }
  let root = migrateAndLoad();
  let currentMonday = startOfISOWeek(new Date());
  let oldestMonday = null; // oldest (earliest) week currently rendered
  let currentRowRef = null; // DOM ref to the current week row

  // ---- State persistence ----
  function loadRoot() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }
  function saveRoot() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(root)); } catch (_) {}
  }
  function migrateAndLoad() {
    const v2 = loadRoot();
    if (v2) return v2;
    // Try legacy v1
    let legacy = null;
    try {
      const raw = localStorage.getItem(LEGACY_KEY);
      legacy = raw ? JSON.parse(raw) : null;
    } catch (_) {}
    const id = genId();
    const tabs = [{ id, name: 'Default', createdAt: Date.now() }];
    const data = {};
    data[id] = (legacy && typeof legacy === 'object') ? legacy : {};
    const v2root = { tabs, activeId: id, data };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(v2root)); } catch (_) {}
    return v2root;
  }
  function genId() { return 't' + Math.random().toString(36).slice(2, 8); }
  function activeData() {
    const id = root.activeId;
    if (!root.data[id]) root.data[id] = {};
    return root.data[id];
  }

  // ---- Date helpers (ISO-8601, weeks start Monday) ----
  function startOfISOWeek(date) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = (d.getDay() + 6) % 7; // 0 = Monday
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function addDays(date, delta) {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    return d;
  }

  function addWeeks(date, delta) {
    return addDays(date, delta * 7);
  }

  function ymd(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Returns ISO week number and ISO week-year
  function getISOWeekYear(date) {
    const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = tmp.getUTCDay() || 7; // Mon=1..Sun=7
    tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
    const isoYear = tmp.getUTCFullYear();
    const yearStart = new Date(Date.UTC(isoYear, 0, 1));
    const weekNo = Math.ceil((((tmp - yearStart) / 86400000) + 1) / 7);
    return { week: weekNo, year: isoYear };
  }

  function weekLabel(monday) {
    const { week, year } = getISOWeekYear(monday);
    return `${year} · W${String(week).padStart(2, '0')}`;
  }

  // ---- Rendering ----
  function renderWeekRow(monday, options = {}) {
    const row = document.createElement('div');
    row.className = 'row';

    const label = document.createElement('div');
    label.className = 'week-label';
    label.textContent = weekLabel(monday);
    row.appendChild(label);

    for (let i = 0; i < 7; i++) {
      const date = addDays(monday, i);
      const key = ymd(date);
      const btn = document.createElement('button');
      btn.className = 'day-btn';
      btn.type = 'button';
      btn.dataset.date = key;
      btn.setAttribute('aria-label', `${DAYS[i]} ${key}`);
      const on = !!activeData()[key];
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.classList.toggle('on', on);
      btn.textContent = date.getDate(); // day of month for quick glance
      btn.addEventListener('click', () => {
        const cur = !!activeData()[key];
        activeData()[key] = !cur;
        btn.classList.toggle('on', !cur);
        btn.setAttribute('aria-pressed', !cur ? 'true' : 'false');
        saveRoot();
      });
      row.appendChild(btn);
    }

    if (options.markCurrent) {
      currentRowRef = row;
    }

    return row;
  }

  function appendOlderWeeks(fromMonday, count) {
    // fromMonday should be the oldest currently shown; we append older (earlier) ones
    let start = fromMonday;
    for (let i = 1; i <= count; i++) {
      const weekStart = addWeeks(start, -i);
      weeksEl.appendChild(renderWeekRow(weekStart));
      oldestMonday = weekStart;
    }
  }

  function renderTabs() {
    tabsEl.innerHTML = '';
    root.tabs.forEach(tab => {
      const b = document.createElement('button');
      b.className = 'tab' + (tab.id === root.activeId ? ' active' : '');
      b.type = 'button';
      b.role = 'tab';
      b.dataset.id = tab.id;
      b.textContent = tab.name || 'Untitled';
      b.title = 'Double-click to rename';
      b.addEventListener('click', () => {
        if (root.activeId !== tab.id) {
          root.activeId = tab.id;
          saveRoot();
          renderAll();
        }
      });
      b.addEventListener('dblclick', () => renameTab(tab.id));
      b.addEventListener('contextmenu', (e) => { e.preventDefault(); renameTab(tab.id); });
      tabsEl.appendChild(b);
    });
  }

  function addTab() {
    const name = prompt('New tab name', 'New Habit');
    if (name === null) return;
    const id = genId();
    root.tabs.push({ id, name: name.trim() || 'Untitled', createdAt: Date.now() });
    root.data[id] = {};
    root.activeId = id;
    saveRoot();
    renderAll();
  }

  function renameTab(id) {
    const tab = root.tabs.find(t => t.id === id);
    if (!tab) return;
    const name = prompt('Rename tab', tab.name || 'Untitled');
    if (name === null) return;
    tab.name = name.trim() || 'Untitled';
    saveRoot();
    renderTabs();
  }

  function renderAll() {
    // Tabs
    renderTabs();
    // Weeks
    // Initial: show current week at the top. Older weeks load as you scroll down.
    weeksEl.innerHTML = '';
    weeksEl.appendChild(renderWeekRow(currentMonday, { markCurrent: true }));
    oldestMonday = currentMonday;

    // Preload a few older weeks for context
    appendOlderWeeks(oldestMonday, 10);
  }

  // Rehydrate state on visibility change in case of multi-tab modifications
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      root = migrateAndLoad();
      // Refresh classes/aria for visible buttons quickly
      weeksEl.querySelectorAll('.day-btn').forEach(btn => {
        const key = btn.dataset.date;
        const on = !!activeData()[key];
        btn.classList.toggle('on', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      renderTabs();
    }
  });

  // Kick off
  // Bind UI events once
  weeksEl.addEventListener('scroll', () => {
    const threshold = 200; // px from bottom
    if (weeksEl.scrollTop + weeksEl.clientHeight >= weeksEl.scrollHeight - threshold) {
      appendOlderWeeks(oldestMonday, 12);
    }
  });
  jumpBtn.addEventListener('click', () => {
    weeksEl.scrollTo({ top: 0, behavior: 'smooth' });
  });
  addTabBtn.addEventListener('click', addTab);

  renderAll();
})();
