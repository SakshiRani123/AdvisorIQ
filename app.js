// Optimized SVG Icons (Instant render without lucide querySelector DOM freeze)
const ICONS = {
  globe: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`,
  mail: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
  phone: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  linkedin: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>`,
  externalLink: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>`
};

// Application State
let advisors = [];
let filteredAdvisors = [];
let currentPage = 1;
let pageSize = 25; // number or 'all'
let currentSort = { column: 'name', direction: 'asc' };
let viewMode = 'table'; // 'table' or 'cards'

// Chart Instances
let stateChartInstance = null;
let tierChartInstance = null;
let contactChartInstance = null;

// Initialize when DOM and Data are ready
document.addEventListener('DOMContentLoaded', () => {
  if (typeof ADVISORS_DATA !== 'undefined') {
    advisors = ADVISORS_DATA;
    initDashboard();
  } else {
    console.error('ADVISORS_DATA not found. Make sure advisors_data.js is loaded.');
  }
});

function initDashboard() {
  populateFilterDropdowns();
  bindEvents();
  applyFilters();
  initLucide();
}

function initLucide() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Populate Dynamic Filter Dropdowns with Unique Sorted Values
function populateFilterDropdowns() {
  // States
  const states = [...new Set(advisors.map(a => a.state).filter(Boolean))].sort();
  populateSelect('filterState', states);

  // Cities
  const cities = [...new Set(advisors.map(a => a.city).filter(Boolean))].sort();
  populateSelect('filterCity', cities);

  // Account Minimum
  const minAccounts = [...new Set(advisors.map(a => a.account_minimum).filter(Boolean))].sort();
  populateSelect('filterAccountMin', minAccounts);

  // Typical Account Size
  const typSizes = [...new Set(advisors.map(a => a.typical_account_size).filter(Boolean))].sort();
  populateSelect('filterTypicalAccount', typSizes);

  // Client Base
  const clientBases = [...new Set(advisors.map(a => a.client_base).filter(Boolean))].sort();
  populateSelect('filterClientBase', clientBases);

  // Top Teams / Firms (Pick top 60 with most advisors)
  const firmCounts = {};
  advisors.forEach(a => {
    if (a.team) {
      firmCounts[a.team] = (firmCounts[a.team] || 0) + 1;
    }
  });
  const topFirms = Object.keys(firmCounts)
    .sort((a, b) => firmCounts[b] - firmCounts[a])
    .slice(0, 60);
  populateSelect('filterFirm', topFirms);
}

function populateSelect(elementId, values) {
  const el = document.getElementById(elementId);
  if (!el) return;
  values.forEach(val => {
    const opt = document.createElement('option');
    opt.value = val;
    opt.textContent = val;
    el.appendChild(opt);
  });
}

// Smart Presets (Top Header Shortcuts)
function applyPreset(presetType) {
  resetAllFilters(false);

  // Update preset button active styling
  const presetIds = ['presetAll', 'presetReady', 'presetMega', 'presetPlanning'];
  presetIds.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.className = 'px-2.5 py-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition';
  });

  if (presetType === 'all') {
    document.getElementById('presetAll').className = 'px-2.5 py-1 rounded-lg text-white bg-blue-600 font-semibold shadow-sm transition';
    // Set table pagination to ALL rows
    pageSize = 'all';
    const pageSelect = document.getElementById('pageSizeSelect');
    if (pageSelect) pageSelect.value = 'all';
  } else if (presetType === 'ready') {
    document.getElementById('presetReady').className = 'px-2.5 py-1 rounded-lg text-white bg-blue-600 font-semibold shadow-sm transition';
    document.getElementById('filterEmail').value = 'yes';
    document.getElementById('filterPhone').value = 'yes';
  } else if (presetType === 'mega') {
    document.getElementById('presetMega').className = 'px-2.5 py-1 rounded-lg text-white bg-blue-600 font-semibold shadow-sm transition';
    document.getElementById('filterTier').value = 'Mega-Cap ($10B+)';
  } else if (presetType === 'planning') {
    document.getElementById('presetPlanning').className = 'px-2.5 py-1 rounded-lg text-white bg-blue-600 font-semibold shadow-sm transition';
    document.getElementById('filterFinPlanning').value = 'Yes';
  }

  currentPage = 1;
  applyFilters();
}

// Event Bindings
function bindEvents() {
  // Search with debounce
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  
  let debounceTimer;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    if (e.target.value.trim().length > 0) {
      clearSearchBtn.classList.remove('hidden');
    } else {
      clearSearchBtn.classList.add('hidden');
    }
    debounceTimer = setTimeout(() => {
      currentPage = 1;
      applyFilters();
    }, 250);
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.classList.add('hidden');
    currentPage = 1;
    applyFilters();
  });

  // Filter change listeners
  const filterIds = [
    'filterState', 'filterCity', 'filterAccountMin', 'filterTypicalAccount',
    'filterFinPlanning', 'filterWebsite', 'filterEmail', 'filterTier',
    'filterClientBase', 'filterPhone', 'filterLinkedin', 'filterFirm'
  ];

  filterIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', () => {
        currentPage = 1;
        applyFilters();
      });
    }
  });

  // Page size selector with "All" support
  document.getElementById('pageSizeSelect').addEventListener('change', (e) => {
    const val = e.target.value;
    if (val === 'all') {
      pageSize = 'all';
    } else {
      pageSize = parseInt(val, 10);
    }
    currentPage = 1;
    renderListing();
    renderPagination();
  });

  // Reset buttons
  document.getElementById('resetFiltersBtn').addEventListener('click', () => resetAllFilters(true));
  document.getElementById('clearAllFiltersLink').addEventListener('click', () => resetAllFilters(true));

  // Export CSV
  document.getElementById('exportCsvBtn').addEventListener('click', exportFilteredToCSV);

  // Modal close
  document.getElementById('closeModalBtn').addEventListener('click', closeModal);
  document.getElementById('detailModal').addEventListener('click', (e) => {
    if (e.target.id === 'detailModal') closeModal();
  });

  // View Switcher (Table vs Cards)
  const viewTableBtn = document.getElementById('viewTableBtn');
  const viewCardsBtn = document.getElementById('viewCardsBtn');
  const tableViewWrapper = document.getElementById('tableViewWrapper');
  const cardsViewWrapper = document.getElementById('cardsViewWrapper');

  viewTableBtn.addEventListener('click', () => {
    viewMode = 'table';
    viewTableBtn.className = 'px-2.5 py-1 text-xs rounded-md bg-blue-600 text-white font-medium shadow transition';
    viewCardsBtn.className = 'px-2.5 py-1 text-xs rounded-md text-slate-400 hover:text-white transition';
    tableViewWrapper.classList.remove('hidden');
    cardsViewWrapper.classList.add('hidden');
    renderListing();
  });

  viewCardsBtn.addEventListener('click', () => {
    viewMode = 'cards';
    viewCardsBtn.className = 'px-2.5 py-1 text-xs rounded-md bg-blue-600 text-white font-medium shadow transition';
    viewTableBtn.className = 'px-2.5 py-1 text-xs rounded-md text-slate-400 hover:text-white transition';
    tableViewWrapper.classList.add('hidden');
    cardsViewWrapper.classList.remove('hidden');
    renderListing();
  });
}

// Reset All Filters
function resetAllFilters(reFilter = true) {
  document.getElementById('searchInput').value = '';
  document.getElementById('clearSearchBtn').classList.add('hidden');
  
  const filterIds = [
    'filterState', 'filterCity', 'filterAccountMin', 'filterTypicalAccount',
    'filterFinPlanning', 'filterWebsite', 'filterEmail', 'filterTier',
    'filterClientBase', 'filterPhone', 'filterLinkedin', 'filterFirm'
  ];

  filterIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  if (reFilter) {
    currentPage = 1;
    applyFilters();
  }
}

// Core Filter Engine
function applyFilters() {
  const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
  const fState = document.getElementById('filterState').value;
  const fCity = document.getElementById('filterCity').value;
  const fAccountMin = document.getElementById('filterAccountMin').value;
  const fTypAccount = document.getElementById('filterTypicalAccount').value;
  const fFinPlan = document.getElementById('filterFinPlanning').value;
  const fWebsite = document.getElementById('filterWebsite').value;
  const fEmail = document.getElementById('filterEmail').value;
  const fTier = document.getElementById('filterTier').value;
  const fClientBase = document.getElementById('filterClientBase').value;
  const fPhone = document.getElementById('filterPhone').value;
  const fLinkedin = document.getElementById('filterLinkedin').value;
  const fFirm = document.getElementById('filterFirm').value;

  // Active filters badge counter
  let activeCount = 0;
  if (searchTerm) activeCount++;
  [fState, fCity, fAccountMin, fTypAccount, fFinPlan, fWebsite, fEmail, fTier, fClientBase, fPhone, fLinkedin, fFirm].forEach(v => {
    if (v) activeCount++;
  });

  const activeFilterBadge = document.getElementById('activeFilterBadge');
  const clearAllFiltersLink = document.getElementById('clearAllFiltersLink');
  if (activeCount > 0) {
    activeFilterBadge.textContent = `${activeCount} active filter${activeCount > 1 ? 's' : ''}`;
    activeFilterBadge.classList.remove('hidden');
    clearAllFiltersLink.classList.remove('hidden');
  } else {
    activeFilterBadge.classList.add('hidden');
    clearAllFiltersLink.classList.add('hidden');
  }

  // Filter evaluation
  filteredAdvisors = advisors.filter(item => {
    // Search keyword across multiple fields
    if (searchTerm) {
      const match = 
        (item.name && item.name.toLowerCase().includes(searchTerm)) ||
        (item.team && item.team.toLowerCase().includes(searchTerm)) ||
        (item.city && item.city.toLowerCase().includes(searchTerm)) ||
        (item.state && item.state.toLowerCase().includes(searchTerm)) ||
        (item.address && item.address.toLowerCase().includes(searchTerm)) ||
        (item.title && item.title.toLowerCase().includes(searchTerm)) ||
        (item.email && item.email.toLowerCase().includes(searchTerm));
      if (!match) return false;
    }

    if (fState && item.state !== fState) return false;
    if (fCity && item.city !== fCity) return false;
    if (fAccountMin && item.account_minimum !== fAccountMin) return false;
    if (fTypAccount && item.typical_account_size !== fTypAccount) return false;
    if (fFinPlan && item.financial_planning.toLowerCase() !== fFinPlan.toLowerCase()) return false;
    
    if (fWebsite === 'yes' && item.has_website !== 1) return false;
    if (fWebsite === 'no' && item.has_website === 1) return false;

    if (fEmail === 'yes' && item.has_email !== 1) return false;
    if (fEmail === 'no' && item.has_email === 1) return false;

    if (fTier && item.tier !== fTier) return false;
    if (fClientBase && item.client_base !== fClientBase) return false;

    if (fPhone === 'yes' && (!item.phone || item.phone.length < 5)) return false;
    if (fPhone === 'no' && item.phone && item.phone.length >= 5) return false;

    if (fLinkedin === 'yes' && (!item.linkedin || item.linkedin.length < 5)) return false;
    if (fLinkedin === 'no' && item.linkedin && item.linkedin.length >= 5) return false;

    if (fFirm && item.team !== fFirm) return false;

    return true;
  });

  // Sorting
  sortData();

  // Update Dynamic Metrics
  updateKPIs();

  // Update Visual Charts
  updateCharts();

  // Render Table/Cards & Pagination
  renderListing();
  renderPagination();
}

// Dynamic KPI Calculation
function updateKPIs() {
  const total = advisors.length;
  const filtered = filteredAdvisors.length;
  
  // Unique States
  const uniqueStates = new Set(filteredAdvisors.map(a => a.state).filter(Boolean));
  // Unique Cities
  const uniqueCities = new Set(filteredAdvisors.map(a => a.city).filter(Boolean));
  // Unique ZIPs
  const uniqueZips = new Set(filteredAdvisors.map(a => a.zip).filter(Boolean));
  // With Website
  const withWebsite = filteredAdvisors.filter(a => a.has_website === 1).length;
  // With Email
  const withEmail = filteredAdvisors.filter(a => a.has_email === 1).length;

  document.getElementById('kpiTotal').textContent = total.toLocaleString();
  document.getElementById('kpiFiltered').textContent = filtered.toLocaleString();
  
  const pct = total > 0 ? ((filtered / total) * 100).toFixed(1) : 0;
  document.getElementById('kpiFilteredPct').textContent = `${pct}% of total dataset`;

  document.getElementById('kpiStates').textContent = uniqueStates.size.toLocaleString();
  document.getElementById('kpiCities').textContent = uniqueCities.size.toLocaleString();
  document.getElementById('kpiZips').textContent = uniqueZips.size.toLocaleString();

  document.getElementById('kpiWebsites').textContent = withWebsite.toLocaleString();
  const webPct = filtered > 0 ? ((withWebsite / filtered) * 100).toFixed(1) : 0;
  document.getElementById('kpiWebsitesPct').textContent = `${webPct}% coverage`;

  document.getElementById('kpiEmails').textContent = withEmail.toLocaleString();
  const emailPct = filtered > 0 ? ((withEmail / filtered) * 100).toFixed(1) : 0;
  document.getElementById('kpiEmailsPct').textContent = `${emailPct}% coverage`;
}

// Sorting logic
function handleSort(column) {
  if (currentSort.column === column) {
    currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
  } else {
    currentSort.column = column;
    currentSort.direction = 'asc';
  }
  sortData();
  renderListing();
}

function sortData() {
  const col = currentSort.column;
  const dir = currentSort.direction === 'asc' ? 1 : -1;

  filteredAdvisors.sort((a, b) => {
    let valA = a[col];
    let valB = b[col];

    if (typeof valA === 'number' && typeof valB === 'number') {
      return (valA - valB) * dir;
    }

    valA = (valA || '').toString().toLowerCase();
    valB = (valB || '').toString().toLowerCase();

    if (valA < valB) return -1 * dir;
    if (valA > valB) return 1 * dir;
    return 0;
  });
}

// Render Detailed Listing (Table or Card View)
function renderListing() {
  const tbody = document.getElementById('advisorTableBody');
  const cardsContainer = document.getElementById('cardsViewWrapper');
  const emptyState = document.getElementById('emptyState');
  const tableViewWrapper = document.getElementById('tableViewWrapper');

  if (filteredAdvisors.length === 0) {
    emptyState.classList.remove('hidden');
    tableViewWrapper.classList.add('hidden');
    cardsContainer.classList.add('hidden');
    updateCounterDisplays(0, 0, 0);
    return;
  }

  emptyState.classList.add('hidden');
  if (viewMode === 'table') {
    tableViewWrapper.classList.remove('hidden');
    cardsContainer.classList.add('hidden');
  } else {
    tableViewWrapper.classList.add('hidden');
    cardsContainer.classList.remove('hidden');
  }

  // Calculate slice range for "all" or specific page size
  let startIdx = 0;
  let endIdx = filteredAdvisors.length;
  let pageItems = [];

  if (pageSize === 'all') {
    startIdx = 0;
    endIdx = filteredAdvisors.length;
    pageItems = filteredAdvisors;
  } else {
    startIdx = (currentPage - 1) * pageSize;
    endIdx = Math.min(startIdx + pageSize, filteredAdvisors.length);
    pageItems = filteredAdvisors.slice(startIdx, endIdx);
  }

  updateCounterDisplays(filteredAdvisors.length > 0 ? startIdx + 1 : 0, endIdx, filteredAdvisors.length);

  // Table Mode Render
  let tableHtml = '';
  pageItems.forEach(adv => {
    const stateBadge = adv.state 
      ? `<span class="inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-800 text-blue-300 border border-slate-700">${escapeHtml(adv.state)}</span>`
      : `<span class="text-slate-600">-</span>`;
    
    const cityText = adv.city ? escapeHtml(adv.city) : 'Unknown';

    // Tier badge
    let tierColor = 'bg-slate-800 text-slate-400 border-slate-700';
    if (adv.tier === 'Mega-Cap ($10B+)') tierColor = 'bg-amber-500/10 text-amber-300 border-amber-500/30';
    else if (adv.tier === 'Tier-1 ($2B-$10B)') tierColor = 'bg-blue-500/10 text-blue-300 border-blue-500/30';
    else if (adv.tier === 'Mid-Market ($500M-$2B)') tierColor = 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';

    // Lead Score Progress
    let scoreColor = 'text-slate-400';
    let scoreBg = 'bg-slate-700';
    if (adv.lead_score >= 80) { scoreColor = 'text-emerald-400'; scoreBg = 'bg-emerald-500'; }
    else if (adv.lead_score >= 60) { scoreColor = 'text-blue-400'; scoreBg = 'bg-blue-500'; }
    else if (adv.lead_score >= 40) { scoreColor = 'text-amber-400'; scoreBg = 'bg-amber-500'; }

    const webBadge = adv.has_website
      ? `<a href="${adv.website.startsWith('http') ? adv.website : 'https://' + adv.website}" target="_blank" rel="noopener" class="text-emerald-400 hover:text-emerald-300 p-1 rounded hover:bg-emerald-500/10 transition" title="Website: ${escapeHtml(adv.website)}">
          ${ICONS.globe}
        </a>`
      : `<span class="text-slate-600 p-1 opacity-30">${ICONS.globe}</span>`;

    const emailBadge = adv.has_email
      ? `<a href="mailto:${adv.email}" class="text-cyan-400 hover:text-cyan-300 p-1 rounded hover:bg-cyan-500/10 transition" title="Email: ${escapeHtml(adv.email)}">
          ${ICONS.mail}
        </a>`
      : `<span class="text-slate-600 p-1 opacity-30">${ICONS.mail}</span>`;

    const phoneBadge = adv.phone
      ? `<a href="tel:${adv.phone}" class="text-amber-400 hover:text-amber-300 p-1 rounded hover:bg-amber-500/10 transition" title="Call: ${escapeHtml(adv.phone)}">
          ${ICONS.phone}
        </a>`
      : `<span class="text-slate-600 p-1 opacity-30">${ICONS.phone}</span>`;

    const linkedinBadge = adv.linkedin
      ? `<a href="${adv.linkedin.startsWith('http') ? adv.linkedin : 'https://' + adv.linkedin}" target="_blank" rel="noopener" class="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-blue-500/10 transition" title="LinkedIn Profile">
          ${ICONS.linkedin}
        </a>`
      : `<span class="text-slate-600 p-1 opacity-30">${ICONS.linkedin}</span>`;

    tableHtml += `
      <tr class="hover:bg-slate-800/40 transition border-b border-slate-800/40">
        <td class="py-2.5 px-4">
          <div class="font-semibold text-slate-100 flex items-center space-x-1.5">
            <span>${escapeHtml(adv.name || 'Unnamed')}</span>
            ${adv.profile_link ? `<a href="${adv.profile_link}" target="_blank" rel="noopener" class="text-slate-500 hover:text-blue-400" title="Barron's Original Profile">${ICONS.externalLink}</a>` : ''}
          </div>
          <div class="text-[11px] text-slate-400 line-clamp-1">${escapeHtml(adv.title || '-')}</div>
        </td>
        <td class="py-2.5 px-4">
          <div class="font-medium text-slate-300 line-clamp-1 max-w-[210px]" title="${escapeHtml(adv.team)}">
            ${escapeHtml(adv.team || '-')}
          </div>
        </td>
        <td class="py-2.5 px-4">
          <div class="flex items-center space-x-1.5">
            ${stateBadge}
            <span class="text-slate-300 truncate max-w-[120px]" title="${cityText}">${cityText}</span>
          </div>
        </td>
        <td class="py-2.5 px-4">
          <div class="font-mono font-bold text-slate-200">${escapeHtml(adv.team_assets || 'N/A')}</div>
          <span class="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-semibold border ${tierColor}">
            ${escapeHtml(adv.tier)}
          </span>
        </td>
        <td class="py-2.5 px-4 font-mono font-medium text-slate-300">
          ${escapeHtml(adv.account_minimum || '-')}
        </td>
        <td class="py-2.5 px-4">
          <div class="flex items-center space-x-2">
            <div class="w-12 bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div class="${scoreBg} h-1.5 rounded-full" style="width: ${adv.lead_score}%"></div>
            </div>
            <span class="font-mono font-bold text-[10px] ${scoreColor}">${adv.lead_score}</span>
          </div>
        </td>
        <td class="py-2.5 px-4">
          <div class="flex items-center justify-center space-x-1">
            ${webBadge}
            ${emailBadge}
            ${phoneBadge}
            ${linkedinBadge}
          </div>
        </td>
        <td class="py-2.5 px-4 text-right">
          <button onclick="openModal(${adv.id})" class="px-2.5 py-1 text-[11px] font-semibold text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-600 rounded-lg border border-blue-500/20 hover:border-transparent transition shadow-sm">
            View
          </button>
        </td>
      </tr>
    `;
  });
  tbody.innerHTML = tableHtml;

  // Card Mode Render
  let cardsHtml = '';
  pageItems.forEach(adv => {
    cardsHtml += `
      <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 hover:border-slate-700 transition shadow-lg flex flex-col justify-between">
        <div>
          <div class="flex items-start justify-between gap-1 mb-1.5">
            <div>
              <h4 class="font-bold text-slate-100 text-xs">${escapeHtml(adv.name)}</h4>
              <p class="text-[11px] text-slate-400 line-clamp-1">${escapeHtml(adv.title || '-')}</p>
            </div>
            <span class="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-800 text-blue-400 border border-slate-700">
              ${escapeHtml(adv.state || 'N/A')}
            </span>
          </div>
          
          <div class="text-[11px] text-slate-300 mb-2 line-clamp-1" title="${escapeHtml(adv.team)}">
            <span class="text-slate-500">Firm:</span> ${escapeHtml(adv.team || '-')}
          </div>

          <div class="grid grid-cols-2 gap-1.5 text-[10px] bg-slate-950/70 p-2 rounded-lg border border-slate-800/80 mb-2 font-mono">
            <div><span class="text-slate-500">AUM:</span> <span class="text-emerald-400 font-bold">${escapeHtml(adv.team_assets || '-')}</span></div>
            <div><span class="text-slate-500">Min:</span> <span class="text-slate-200">${escapeHtml(adv.account_minimum || '-')}</span></div>
            <div><span class="text-slate-500">City:</span> <span class="text-slate-200 truncate">${escapeHtml(adv.city || '-')}</span></div>
            <div><span class="text-slate-500">Lead Score:</span> <span class="text-amber-400 font-bold">${adv.lead_score}</span></div>
          </div>
        </div>

        <div class="flex items-center justify-between pt-2 border-t border-slate-800 mt-1">
          <div class="flex items-center space-x-1.5">
            ${adv.has_website ? `<a href="${adv.website}" target="_blank" class="text-emerald-400 hover:text-emerald-300">${ICONS.globe}</a>` : ''}
            ${adv.has_email ? `<a href="mailto:${adv.email}" class="text-cyan-400 hover:text-cyan-300">${ICONS.mail}</a>` : ''}
            ${adv.phone ? `<a href="tel:${adv.phone}" class="text-amber-400 hover:text-amber-300">${ICONS.phone}</a>` : ''}
          </div>
          <button onclick="openModal(${adv.id})" class="text-[11px] text-blue-400 hover:text-blue-300 font-semibold">
            Details &rarr;
          </button>
        </div>
      </div>
    `;
  });
  cardsContainer.innerHTML = cardsHtml;
}

function updateCounterDisplays(start, end, total) {
  document.getElementById('showingStart').textContent = start.toLocaleString();
  document.getElementById('showingEnd').textContent = end.toLocaleString();
  document.getElementById('showingTotal').textContent = total.toLocaleString();
}

// Pagination Controls
function renderPagination() {
  const container = document.getElementById('paginationControls');
  const allNotice = document.getElementById('allModeNotice');

  if (pageSize === 'all') {
    document.getElementById('currentPageNum').textContent = '1';
    document.getElementById('totalPagesNum').textContent = '1';
    allNotice.classList.remove('hidden');
    container.innerHTML = `
      <span class="text-xs text-emerald-400 font-medium">✓ All ${filteredAdvisors.length.toLocaleString()} rows visible simultaneously.</span>
    `;
    return;
  }

  allNotice.classList.add('hidden');
  const totalPages = Math.ceil(filteredAdvisors.length / pageSize) || 1;
  document.getElementById('currentPageNum').textContent = currentPage;
  document.getElementById('totalPagesNum').textContent = totalPages;

  let html = '';

  // Prev Button
  html += `
    <button 
      onclick="goToPage(${currentPage - 1})" 
      ${currentPage === 1 ? 'disabled class="px-2.5 py-1 text-xs rounded-lg bg-slate-800/40 text-slate-600 cursor-not-allowed"' : 'class="px-2.5 py-1 text-xs rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition"'}
    >
      &larr; Prev
    </button>
  `;

  // Dynamic window of page buttons
  const maxButtons = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);
  if (endPage - startPage + 1 < maxButtons) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  if (startPage > 1) {
    html += `<button onclick="goToPage(1)" class="px-2.5 py-1 text-xs rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition">1</button>`;
    if (startPage > 2) {
      html += `<span class="text-xs text-slate-600 px-1">...</span>`;
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    const isActive = i === currentPage;
    html += `
      <button 
        onclick="goToPage(${i})" 
        class="px-2.5 py-1 text-xs rounded-lg font-medium transition ${isActive ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'}"
      >
        ${i}
      </button>
    `;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      html += `<span class="text-xs text-slate-600 px-1">...</span>`;
    }
    html += `<button onclick="goToPage(${totalPages})" class="px-2.5 py-1 text-xs rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition">${totalPages}</button>`;
  }

  // Next Button
  html += `
    <button 
      onclick="goToPage(${currentPage + 1})" 
      ${currentPage === totalPages ? 'disabled class="px-2.5 py-1 text-xs rounded-lg bg-slate-800/40 text-slate-600 cursor-not-allowed"' : 'class="px-2.5 py-1 text-xs rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition"'}
    >
      Next &rarr;
    </button>
  `;

  container.innerHTML = html;
}

function goToPage(page) {
  if (pageSize === 'all') return;
  const totalPages = Math.ceil(filteredAdvisors.length / pageSize) || 1;
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderListing();
  renderPagination();
}

// Modal View
function openModal(id) {
  const adv = advisors.find(a => a.id === id);
  if (!adv) return;

  document.getElementById('modalName').textContent = adv.name || 'Advisor Details';
  document.getElementById('modalTitle').textContent = adv.title ? `${adv.title} • ${adv.team || 'Independent'}` : (adv.team || '');

  const body = document.getElementById('modalBody');
  body.innerHTML = `
    <!-- Top Highlights -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono">
      <div>
        <div class="text-[10px] text-slate-500 uppercase tracking-wider">Team Assets</div>
        <div class="text-sm font-bold text-emerald-400 mt-0.5">${escapeHtml(adv.team_assets || 'Not disclosed')}</div>
      </div>
      <div>
        <div class="text-[10px] text-slate-500 uppercase tracking-wider">Account Min</div>
        <div class="text-sm font-bold text-slate-200 mt-0.5">${escapeHtml(adv.account_minimum || 'Not specified')}</div>
      </div>
      <div>
        <div class="text-[10px] text-slate-500 uppercase tracking-wider">Typ Account Size</div>
        <div class="text-sm font-bold text-slate-200 mt-0.5">${escapeHtml(adv.typical_account_size || 'Not specified')}</div>
      </div>
      <div>
        <div class="text-[10px] text-slate-500 uppercase tracking-wider">Lead Readiness</div>
        <div class="text-sm font-bold text-amber-400 mt-0.5">${adv.lead_score}/100</div>
      </div>
    </div>

    <!-- Contact & Digital Presence Section -->
    <div class="space-y-2">
      <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400">Direct Contact & Channels</h4>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div class="p-3 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center space-x-3">
          <div class="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">${ICONS.globe}</div>
          <div class="overflow-hidden">
            <div class="text-[10px] text-slate-500">Website</div>
            ${adv.website ? `<a href="${adv.website.startsWith('http') ? adv.website : 'https://' + adv.website}" target="_blank" rel="noopener" class="text-blue-400 hover:underline truncate block">${escapeHtml(adv.website)}</a>` : '<span class="text-slate-600">None</span>'}
          </div>
        </div>

        <div class="p-3 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center space-x-3">
          <div class="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">${ICONS.mail}</div>
          <div class="overflow-hidden">
            <div class="text-[10px] text-slate-500">Direct Email</div>
            ${adv.email ? `<a href="mailto:${adv.email}" class="text-blue-400 hover:underline truncate block">${escapeHtml(adv.email)}</a>` : '<span class="text-slate-600">None</span>'}
          </div>
        </div>

        <div class="p-3 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center space-x-3">
          <div class="p-2 rounded-lg bg-amber-500/10 text-amber-400">${ICONS.phone}</div>
          <div class="overflow-hidden">
            <div class="text-[10px] text-slate-500">Phone</div>
            ${adv.phone ? `<a href="tel:${adv.phone}" class="text-slate-200 hover:underline truncate block">${escapeHtml(adv.phone)}</a>` : '<span class="text-slate-600">None</span>'}
          </div>
        </div>

        <div class="p-3 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center space-x-3">
          <div class="p-2 rounded-lg bg-blue-500/10 text-blue-400">${ICONS.linkedin}</div>
          <div class="overflow-hidden">
            <div class="text-[10px] text-slate-500">LinkedIn</div>
            ${adv.linkedin ? `<a href="${adv.linkedin.startsWith('http') ? adv.linkedin : 'https://' + adv.linkedin}" target="_blank" rel="noopener" class="text-blue-400 hover:underline truncate block">View Profile</a>` : '<span class="text-slate-600">None</span>'}
          </div>
        </div>
      </div>
    </div>

    <!-- Location & Office -->
    <div class="space-y-2">
      <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400">Office Location & Geography</h4>
      <div class="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
        <div class="flex items-center space-x-2 text-slate-200 mb-1">
          <span class="text-pink-400 font-bold">📍</span>
          <span class="font-medium">${escapeHtml(adv.address || 'Address not provided')}</span>
        </div>
        <div class="text-[11px] text-slate-400 pl-6 flex space-x-4">
          <span>City: <b class="text-slate-200">${escapeHtml(adv.city || '-')}</b></span>
          <span>State: <b class="text-slate-200">${escapeHtml(adv.state || '-')}</b></span>
          <span>ZIP: <b class="text-slate-200">${escapeHtml(adv.zip || '-')}</b></span>
        </div>
      </div>
    </div>

    <!-- Practice Metrics -->
    <div class="space-y-2">
      <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400">Practice Experience & Metrics</h4>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center font-mono">
        <div class="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
          <div class="text-[10px] text-slate-500">Team Size</div>
          <div class="text-xs font-bold text-slate-200 mt-1">${escapeHtml(adv.team_size || '-')}</div>
        </div>
        <div class="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
          <div class="text-[10px] text-slate-500">Households</div>
          <div class="text-xs font-bold text-slate-200 mt-1">${escapeHtml(adv.client_households || '-')}</div>
        </div>
        <div class="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
          <div class="text-[10px] text-slate-500">Total Exp</div>
          <div class="text-xs font-bold text-slate-200 mt-1">${escapeHtml(adv.years_exp || '-')} yrs</div>
        </div>
        <div class="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
          <div class="text-[10px] text-slate-500">At Firm</div>
          <div class="text-xs font-bold text-slate-200 mt-1">${escapeHtml(adv.years_firm || '-')} yrs</div>
        </div>
      </div>
    </div>

    ${adv.about ? `
      <!-- About Firm -->
      <div class="space-y-2">
        <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400">About Practice</h4>
        <div class="p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-slate-300 leading-relaxed text-[11px] max-h-36 overflow-y-auto">
          ${escapeHtml(adv.about)}
        </div>
      </div>
    ` : ''}

    ${adv.profile_link ? `
      <div class="pt-2 text-right">
        <a href="${adv.profile_link}" target="_blank" rel="noopener" class="inline-flex items-center space-x-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold underline">
          <span>Open Original Barron's Advisor Directory Record</span>
          ${ICONS.externalLink}
        </a>
      </div>
    ` : ''}
  `;

  const modal = document.getElementById('detailModal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeModal() {
  const modal = document.getElementById('detailModal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

// Chart.js Visualizations
function updateCharts() {
  // 1. Top States Chart (Bar)
  const stateCounts = {};
  filteredAdvisors.forEach(a => {
    if (a.state) {
      stateCounts[a.state] = (stateCounts[a.state] || 0) + 1;
    }
  });

  const topStates = Object.entries(stateCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const stateLabels = topStates.map(item => item[0]);
  const stateValues = topStates.map(item => item[1]);

  const ctxState = document.getElementById('stateChart').getContext('2d');
  if (stateChartInstance) stateChartInstance.destroy();

  stateChartInstance = new Chart(ctxState, {
    type: 'bar',
    data: {
      labels: stateLabels,
      datasets: [{
        label: 'Advisors',
        data: stateValues,
        backgroundColor: 'rgba(59, 130, 246, 0.75)',
        hoverBackgroundColor: 'rgba(96, 165, 250, 0.95)',
        borderColor: '#3b82f6',
        borderWidth: 1,
        borderRadius: 5,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f172a',
          titleColor: '#f8fafc',
          bodyColor: '#cbd5e1',
          borderColor: '#334155',
          borderWidth: 1,
          padding: 8
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#94a3b8', font: { size: 10 } }
        },
        y: {
          grid: { color: 'rgba(51, 65, 85, 0.35)' },
          ticks: { color: '#94a3b8', font: { size: 10 } }
        }
      }
    }
  });

  // 2. AUM Tiers Chart (Doughnut)
  const tierCounts = {
    'Mega-Cap ($10B+)': 0,
    'Tier-1 ($2B-$10B)': 0,
    'Mid-Market ($500M-$2B)': 0,
    'Boutique (<$500M)': 0,
    'Emerging': 0
  };

  filteredAdvisors.forEach(a => {
    tierCounts[a.tier] = (tierCounts[a.tier] || 0) + 1;
  });

  const tierLabels = Object.keys(tierCounts).filter(k => tierCounts[k] > 0);
  const tierValues = tierLabels.map(k => tierCounts[k]);

  const ctxTier = document.getElementById('tierChart').getContext('2d');
  if (tierChartInstance) tierChartInstance.destroy();

  tierChartInstance = new Chart(ctxTier, {
    type: 'doughnut',
    data: {
      labels: tierLabels,
      datasets: [{
        data: tierValues,
        backgroundColor: [
          '#f59e0b',
          '#3b82f6',
          '#06b6d4',
          '#8b5cf6',
          '#64748b'
        ],
        borderWidth: 2,
        borderColor: '#0f172a'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { color: '#cbd5e1', boxWidth: 10, font: { size: 9 } }
        },
        tooltip: {
          backgroundColor: '#0f172a',
          borderColor: '#334155',
          borderWidth: 1
        }
      },
      cutout: '66%'
    }
  });

  // 3. Digital Presence & Contactability (Horizontal Bar)
  const total = filteredAdvisors.length || 1;
  const withWeb = filteredAdvisors.filter(a => a.has_website === 1).length;
  const withEmail = filteredAdvisors.filter(a => a.has_email === 1).length;
  const withPhone = filteredAdvisors.filter(a => a.phone && a.phone.length > 5).length;
  const withLinkedin = filteredAdvisors.filter(a => a.linkedin && a.linkedin.length > 5).length;

  const ctxContact = document.getElementById('contactChart').getContext('2d');
  if (contactChartInstance) contactChartInstance.destroy();

  contactChartInstance = new Chart(ctxContact, {
    type: 'bar',
    data: {
      labels: ['Website', 'Email', 'Phone', 'LinkedIn'],
      datasets: [{
        label: 'Available',
        data: [withWeb, withEmail, withPhone, withLinkedin],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(6, 182, 212, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(59, 130, 246, 0.8)'
        ],
        borderRadius: 5
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const val = ctx.parsed.x;
              const p = ((val / total) * 100).toFixed(1);
              return `${val} firms (${p}%)`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(51, 65, 85, 0.35)' },
          ticks: { color: '#94a3b8', font: { size: 10 } }
        },
        y: {
          grid: { display: false },
          ticks: { color: '#cbd5e1', font: { size: 10 } }
        }
      }
    }
  });
}

// Export Filtered Dataset to CSV
function exportFilteredToCSV() {
  if (filteredAdvisors.length === 0) {
    alert('No data to export based on current filters.');
    return;
  }

  const headers = [
    'Name', 'Title', 'Team_Firm', 'City', 'State', 'ZIP', 'Address',
    'Email', 'Phone', 'Company_Website', 'Team_Assets', 'Tier', 'Lead_Score',
    'Account_Minimum', 'Typical_Account_Size', 'Typical_Net_Worth', 'Financial_Planning',
    'LinkedIn', 'Profile_Link'
  ];

  const rows = filteredAdvisors.map(a => [
    csvSafe(a.name),
    csvSafe(a.title),
    csvSafe(a.team),
    csvSafe(a.city),
    csvSafe(a.state),
    csvSafe(a.zip),
    csvSafe(a.address),
    csvSafe(a.email),
    csvSafe(a.phone),
    csvSafe(a.website),
    csvSafe(a.team_assets),
    csvSafe(a.tier),
    csvSafe(a.lead_score),
    csvSafe(a.account_minimum),
    csvSafe(a.typical_account_size),
    csvSafe(a.typical_net_worth),
    csvSafe(a.financial_planning),
    csvSafe(a.linkedin),
    csvSafe(a.profile_link)
  ]);

  const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `barrons_filtered_advisors_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function csvSafe(str) {
  if (str === null || str === undefined) return '""';
  const val = String(str).replace(/"/g, '""');
  return `"${val}"`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
