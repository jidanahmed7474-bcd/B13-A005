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
    } catch (e) {
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

// ===== TABS =====
function switchTab(tab) {
    currentTab = tab;
    ['all', 'open', 'closed'].forEach(t => {
        document.getElementById(`tab-${t}`).classList.toggle('active', t === tab);
    });
    if (searchQuery) {
        doSearch();
    } else {
        renderIssues(filterIssues());
    }
}

function updateCounts(data) {
    document.getElementById('tab-info-title').textContent = `${data.length} Issues`;
}

// ===== RENDER =====
function renderIssues(list) {
    hideSpinner();
    updateCounts(list);
    const grid = document.getElementById('issues-grid');
    const empty = document.getElementById('empty-state');

    if (!list || list.length === 0) {
        grid.style.display = 'none';
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';
    grid.style.display = 'grid';
    grid.innerHTML = list.map((issue, i) => cardHTML(issue, i)).join('');
}

function cardHTML(issue, i) {
    const delay = Math.min(i * 30, 300);
    const labelsHTML = (issue.labels || []).map(l => {
        let cls = 'label-good';
        if (l === 'bug') cls = 'label-bug';
        else if (l === 'enhancement') cls = 'label-enhancement';
        else if (l === 'documentation') cls = 'label-documentation';
        else if (l.includes('help')) cls = 'label-help';
        return `<span class="label-tag ${cls}">${l}</span>`;
    }).join('');

    const date = new Date(issue.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const statusIcon = issue.status === 'open' ? '🟢' : '🟣';

    return `
      <div class="issue-card" onclick="openModal(${issue.id})" style="animation-delay:${delay}ms">
        <div class="card-top-border ${issue.status}"></div>
        <div class="card-body">
          <div class="card-title">${issue.title}</div>
          <div class="card-desc">${issue.description}</div>
          <div class="card-meta">
            <div class="meta-row">
              <span class="meta-label">Status</span>
              <span class="card-status ${issue.status}">${statusIcon} ${issue.status}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Priority</span>
              <span class="card-priority priority-${issue.priority}">${issue.priority}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Author</span>
              <span class="meta-value">${issue.author}</span>
            </div>
            ${issue.assignee ? `<div class="meta-row"><span class="meta-label">Assignee</span><span class="meta-value">${issue.assignee}</span></div>` : ''}
          </div>
          <div class="card-labels">${labelsHTML}</div>
        </div>
        <div class="card-footer">
          <span class="card-author">@${issue.author}</span>
          <span class="card-date">${date}</span>
        </div>
      </div>
    `;
}

// ===== MODAL =====
async function openModal(id) {
    document.getElementById('modal-overlay').classList.add('open');
    document.getElementById('modal-title').textContent = 'Loading...';
    document.getElementById('modal-desc').textContent = '';
    document.getElementById('modal-grid').innerHTML = '';
    document.getElementById('modal-labels').innerHTML = '';

    try {
        const json = await apiFetch(`/issue/${id}`);
        const issue = json.data;
        populateModal(issue);
    } catch (e) {
        const issue = allIssues.find(i => i.id === id);
        if (issue) populateModal(issue);
    }
}

function populateModal(issue) {
    document.getElementById('modal-title').textContent = issue.title;
    document.getElementById('modal-id').textContent = `#${issue.id} · opened on ${new Date(issue.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
    document.getElementById('modal-desc').textContent = issue.description;

    const fields = [
        { label: 'Author', value: '@' + issue.author },
        { label: 'Assignee', value: issue.assignee ? '@' + issue.assignee : 'Unassigned' },
        { label: 'Priority', value: issue.priority.toUpperCase() },
        { label: 'Created', value: new Date(issue.createdAt).toLocaleDateString() },
        { label: 'Updated', value: new Date(issue.updatedAt).toLocaleDateString() },
    ];

    document.getElementById('modal-grid').innerHTML = fields.map(f => `
      <div class="modal-field">
        <span class="modal-field-label">${f.label}</span>
        <span class="modal-field-value">${f.value}</span>
      </div>
    `).join('');

    const labelsHTML = (issue.labels || []).map(l => {
        let cls = 'label-good';
        if (l === 'bug') cls = 'label-bug';
        else if (l === 'enhancement') cls = 'label-enhancement';
        else if (l === 'documentation') cls = 'label-documentation';
        else if (l.includes('help')) cls = 'label-help';
        return `<span class="label-tag ${cls}">${l}</span>`;
    }).join('');

    document.getElementById('modal-labels').innerHTML = labelsHTML;
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('open');
}
function closeModalOutside(e) {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ===== HELPERS =====
function showSpinner() {
    document.getElementById('spinner-wrap').style.display = 'flex';
    document.getElementById('issues-grid').style.display = 'none';
    document.getElementById('empty-state').style.display = 'none';
}
function hideSpinner() {
    document.getElementById('spinner-wrap').style.display = 'none';
}
function showEmpty() {
    document.getElementById('empty-state').style.display = 'block';
}