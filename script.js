 const PROXY = 'https://corsproxy.io/?url=';
  const API_BASE = PROXY + encodeURIComponent('https://phi-lab-server.vercel.app/api/v1/lab');

  async function apiFetch(path) {
    const url = PROXY + encodeURIComponent('https://phi-lab-server.vercel.app/api/v1/lab' + path);
    const res = await fetch(url);
    return res.json();
  }
  let allIssues = [];
  let currentTab = 'all';
  let searchQuery = '';


// ===== LOGIN =====
  function handleLogin() {
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('password').value.trim();
    const err = document.getElementById('login-error');
    if (u === 'admin' && p === 'admin123') {
      err.style.display = 'none';
      document.getElementById('login-page').style.display = 'none';
      document.getElementById('main-page').style.display = 'block';
      loadAllIssues();
    } else {
      err.style.display = 'block';
    }
  }

  // Allow Enter key on login
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && document.getElementById('login-page').style.display !== 'none') {
      handleLogin();
    }
  });

   // ===== API =====
  async function loadAllIssues() {
    showSpinner();
    try {
      const json = await apiFetch('/issues');
      allIssues = json.data || [];
      updateCounts(allIssues);
      renderIssues(filterIssues());
    } catch (e) {
      hideSpinner();
      showEmpty();
    }
  }

  function filterIssues() {
    let list = [...allIssues];
    if (currentTab === 'open') list = list.filter(i => i.status === 'open');
    if (currentTab === 'closed') list = list.filter(i => i.status === 'closed');
    return list;
  }

  async function doSearch() {
    const q = document.getElementById('search-input').value.trim();
    if (!q) { clearSearch(); return; }
    searchQuery = q;
    showSpinner();
    try {
      const json = await apiFetch(`/issues/search?q=${encodeURIComponent(q)}`);
      const data = json.data || [];
      document.getElementById('search-badge').classList.add('show');
      document.getElementById('search-badge-text').textContent = `Found ${data.length} result(s) for "${q}"`;
      updateCounts(data);
      renderIssues(data);
    } catch(e) {
      hideSpinner(); showEmpty();
    }
  }

  function clearSearch() {
    searchQuery = '';
    document.getElementById('search-input').value = '';
    document.getElementById('search-badge').classList.remove('show');
    updateCounts(allIssues);
    renderIssues(filterIssues());
  }
