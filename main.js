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

  // Helper function to get month name
  function getMonthName(date) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[date.getMonth()];
  }

  // Helper function to get month key for comparison
  function getMonthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  // Helper function to determine if month is odd/even for coloring
  function getMonthColorClass(date) {
    const monthNum = date.getFullYear() * 12 + date.getMonth();
    return monthNum % 2 === 0 ? 'month-even' : 'month-odd';
  }

  // ---- Rendering ----
  function renderWeekRow(monday, options = {}) {
    const row = document.createElement('div');
    row.className = 'row';
    
    // Add month-based coloring
    const monthColorClass = getMonthColorClass(monday);
    row.classList.add(monthColorClass);

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

  // Function to create month label element
  function createMonthLabel(date) {
    const monthLabel = document.createElement('div');
    monthLabel.className = 'month-label';
    monthLabel.textContent = `${getMonthName(date)} ${date.getFullYear()}`;
    return monthLabel;
  }

  function appendOlderWeeks(fromMonday, count) {
    // fromMonday should be the oldest currently shown; we prepend even older (earlier) ones at the top
    let start = fromMonday;
    let currentMonth = getMonthKey(start);
    
    for (let i = 1; i <= count; i++) {
      const weekStart = addWeeks(start, -i);
      const weekMonth = getMonthKey(weekStart);
      
      // Check if we've entered a new month and add month label at the top
      if (weekMonth !== currentMonth) {
        const monthLabel = document.createElement('div');
        monthLabel.className = 'month-label';
        monthLabel.textContent = getMonthName(weekStart) + ' ' + weekStart.getFullYear();
        weeksEl.insertBefore(monthLabel, weeksEl.firstChild);
        currentMonth = weekMonth;
      }
      
      // Insert week at the top
      weeksEl.insertBefore(renderWeekRow(weekStart), weeksEl.firstChild);
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
    // New approach: show older weeks at top, current week at bottom (calendar-like)
    weeksEl.innerHTML = '';
    
    // Build weeks in reverse chronological order
    // Start with some older weeks
    const numOlderWeeks = 10;
    const weekElements = [];
    
    // Create older weeks first (they'll be at the top)
    for (let i = numOlderWeeks; i >= 1; i--) {
      const weekStart = addWeeks(currentMonday, -i);
      
      // Check if we need a month label
      const prevWeekStart = addWeeks(currentMonday, -(i-1));
      const currentMonth = getMonthKey(weekStart);
      const nextMonth = getMonthKey(prevWeekStart);
      
      if (currentMonth !== nextMonth) {
        const monthLabel = document.createElement('div');
        monthLabel.className = 'month-label';
        monthLabel.textContent = getMonthName(weekStart) + ' ' + weekStart.getFullYear();
        weeksEl.appendChild(monthLabel);
      }
      
      weeksEl.appendChild(renderWeekRow(weekStart));
      oldestMonday = weekStart;
    }
    
    // Add month label for current month if needed
    const currentMonth = getMonthKey(currentMonday);
    const lastOlderWeek = addWeeks(currentMonday, -1);
    const lastMonth = getMonthKey(lastOlderWeek);
    
    if (currentMonth !== lastMonth) {
      const monthLabel = document.createElement('div');
      monthLabel.className = 'month-label';
      monthLabel.textContent = getMonthName(currentMonday) + ' ' + currentMonday.getFullYear();
      weeksEl.appendChild(monthLabel);
    }
    
    // Add current week at the bottom
    weeksEl.appendChild(renderWeekRow(currentMonday, { markCurrent: true }));
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
    const threshold = 200; // px from top
    if (weeksEl.scrollTop <= threshold) {
      appendOlderWeeks(oldestMonday, 12);
    }
  });
  jumpBtn.addEventListener('click', () => {
    weeksEl.scrollTo({ top: weeksEl.scrollHeight, behavior: 'smooth' });
  });
  addTabBtn.addEventListener('click', addTab);

  renderAll();
})();
