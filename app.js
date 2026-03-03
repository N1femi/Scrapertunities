/* ============================================================
   SCRAPERTUNITIES — app.js
   Search, filter, sort, and UI interactivity (no dependencies)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ── Element references ──────────────────────────────────────
  const searchInput    = document.getElementById('search-input');
  const searchClear    = document.getElementById('search-clear');
  const typeSelect     = document.getElementById('filter-type');
  const locSelect      = document.getElementById('filter-location');
  const deadlineSelect = document.getElementById('filter-deadline');
  const sortSelect     = document.getElementById('sort-by');
  const resetBtn       = document.getElementById('filter-reset');
  const emptyResetBtn  = document.getElementById('empty-reset');
  const resultsCount   = document.getElementById('results-count');
  const activePills    = document.getElementById('active-filters');
  const emptyState     = document.getElementById('empty-state');
  const listings       = document.querySelector('.listings');

  const statTotal       = document.getElementById('stat-total');
  const statInternships = document.getElementById('stat-internships');
  const statScholarships= document.getElementById('stat-scholarships');

  const navToggle  = document.querySelector('.nav-toggle');
  const navLinks   = document.querySelector('.nav-links');

  // All cards — NodeList converted to array for sorting
  let cards = Array.from(document.querySelectorAll('.card'));

  // ── Urgent deadline highlighting ────────────────────────────
  const URGENT_DAYS = 14;
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  cards.forEach(card => {
    const deadline = new Date(card.dataset.deadline);
    const msLeft = deadline - now;
    const daysLeft = msLeft / (1000 * 60 * 60 * 24);
    if (daysLeft >= 0 && daysLeft <= URGENT_DAYS) {
      const deadlineEl = card.querySelector('.card-deadline');
      if (deadlineEl) deadlineEl.classList.add('urgent');
    }
  });

  // ── Stats bar ────────────────────────────────────────────────
  function updateStats() {
    const visibleCards = cards.filter(c => !c.hidden);
    const internships  = visibleCards.filter(c => c.dataset.type === 'internship');
    const scholarships = visibleCards.filter(c => c.dataset.type === 'scholarship');

    statTotal.textContent       = visibleCards.length;
    statInternships.textContent = internships.length;
    statScholarships.textContent= scholarships.length;
  }

  // ── Results count ────────────────────────────────────────────
  function updateResultsCount() {
    const visible = cards.filter(c => !c.hidden).length;
    resultsCount.textContent = visible;
  }

  // ── Empty state ──────────────────────────────────────────────
  function updateEmptyState() {
    const visible = cards.filter(c => !c.hidden).length;
    emptyState.hidden   = visible > 0;
    listings.style.display = visible === 0 ? 'none' : '';
  }

  // ── Active filter pills ──────────────────────────────────────
  const FILTER_LABELS = {
    type:     { id: 'filter-type',     label: val => val === 'all' ? null : (val === 'internship' ? 'Internship' : 'Scholarship') },
    location: { id: 'filter-location', label: val => val === 'all' ? null : ({ remote: 'Remote', onsite: 'On-site', hybrid: 'Hybrid' }[val] || val) },
    deadline: { id: 'filter-deadline', label: val => val === 'all' ? null : `Next ${val} days` },
  };

  function updatePills() {
    activePills.innerHTML = '';
    Object.entries(FILTER_LABELS).forEach(([key, { id, label }]) => {
      const el = document.getElementById(id);
      const text = label(el.value);
      if (!text) return;

      const pill = document.createElement('button');
      pill.className = 'filter-pill';
      pill.setAttribute('aria-label', `Remove ${text} filter`);
      pill.innerHTML = `${text} <span aria-hidden="true">×</span>`;
      pill.addEventListener('click', () => {
        el.value = 'all';
        applyFilters();
      });
      activePills.appendChild(pill);
    });
  }

  // ── Core filter function ─────────────────────────────────────
  function applyFilters() {
    const q         = searchInput.value.trim().toLowerCase();
    const type      = typeSelect.value;
    const loc       = locSelect.value;
    const daysRaw   = deadlineSelect.value;
    const maxDays   = daysRaw === 'all' ? Infinity : parseInt(daysRaw);
    const today     = new Date();
    today.setHours(0, 0, 0, 0);

    cards.forEach(card => {
      const title      = (card.dataset.title || '').toLowerCase();
      const deadline   = new Date(card.dataset.deadline);
      const daysLeft   = (deadline - today) / (1000 * 60 * 60 * 24);

      const matchSearch   = !q || title.includes(q);
      const matchType     = type === 'all' || card.dataset.type === type;
      const matchLoc      = loc  === 'all' || card.dataset.location === loc;
      const matchDeadline = daysLeft <= maxDays;

      card.hidden = !(matchSearch && matchType && matchLoc && matchDeadline);
    });

    applySort();
    updateResultsCount();
    updateEmptyState();
    updateStats();
    updatePills();
  }

  // ── Sort function ────────────────────────────────────────────
  function applySort() {
    const sort = sortSelect.value;

    const sorted = [...cards].sort((a, b) => {
      switch (sort) {
        case 'deadline-asc':
          return new Date(a.dataset.deadline) - new Date(b.dataset.deadline);
        case 'deadline-desc':
          return new Date(b.dataset.deadline) - new Date(a.dataset.deadline);
        case 'added-desc':
          return new Date(b.dataset.added) - new Date(a.dataset.added);
        case 'alpha-asc': {
          const ta = (a.dataset.title || '').toLowerCase();
          const tb = (b.dataset.title || '').toLowerCase();
          return ta < tb ? -1 : ta > tb ? 1 : 0;
        }
        default:
          return 0;
      }
    });

    sorted.forEach(card => listings.appendChild(card));
    cards = sorted;
  }

  // ── Reset ────────────────────────────────────────────────────
  function resetFilters() {
    searchInput.value    = '';
    typeSelect.value     = 'all';
    locSelect.value      = 'all';
    deadlineSelect.value = 'all';
    sortSelect.value     = 'deadline-asc';
    searchClear.hidden   = true;
    applyFilters();
  }

  // ── Event listeners ──────────────────────────────────────────
  searchInput.addEventListener('input', () => {
    searchClear.hidden = searchInput.value.length === 0;
    applyFilters();
  });

  searchClear.addEventListener('click', () => {
    searchInput.value  = '';
    searchClear.hidden = true;
    searchInput.focus();
    applyFilters();
  });

  typeSelect.addEventListener('change', applyFilters);
  locSelect.addEventListener('change', applyFilters);
  deadlineSelect.addEventListener('change', applyFilters);
  sortSelect.addEventListener('change', applyFilters);

  resetBtn.addEventListener('click', resetFilters);
  emptyResetBtn.addEventListener('click', resetFilters);

  // ── Mobile nav toggle ─────────────────────────────────────────
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('nav-open');
      navToggle.setAttribute('aria-expanded', isOpen);
    });

    // Close nav when a link is clicked
    navLinks.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('nav-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ── Initial render ────────────────────────────────────────────
  applyFilters();
});
