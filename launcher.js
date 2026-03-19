const nameFilter = document.getElementById('nameFilter');
const dateFilter = document.getElementById('dateFilter');
const sortButton = document.getElementById('sortButton');
const refreshButton = document.getElementById('refreshButton');
const linkList = document.getElementById('linkList');
const listItems = Array.from(linkList.getElementsByTagName('li'));

let sortOrder = 'desc';

function updateButtonText() {
    sortButton.textContent = sortOrder === 'desc' ? 'Newest' : 'Oldest';
}

function filterLinks() {
    const nameValue = nameFilter.value.toLowerCase();
    const dateValue = dateFilter.value;
    listItems.forEach(item => {
        const name = item.getAttribute('data-name').toLowerCase();
        const date = item.getAttribute('data-date');
        const nameMatch = name.includes(nameValue);
        const dateMatch = !dateValue || date === dateValue;
        item.style.display = (nameMatch && dateMatch) ? '' : 'none';
    });
}

function sortLinks() {
    listItems.sort((a, b) => {
        const dateA = new Date(a.getAttribute('data-date'));
        const dateB = new Date(b.getAttribute('data-date'));
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
    listItems.forEach(item => linkList.appendChild(item));
}

function toggleSort() {
    sortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    updateButtonText();
    sortLinks();
}

async function triggerRefresh() {
    const rb2 = document.getElementById('refreshButton2');
    refreshButton.textContent = 'Running...';
    refreshButton.disabled = true;
    if (rb2) { rb2.textContent = 'Running...'; rb2.disabled = true; }
    try {
        const res = await fetch('/refresh', { method: 'POST' });
        const data = await res.json();
        if (data.ok) {
            location.reload();
        } else {
            alert('Script failed:\n' + data.error);
            refreshButton.textContent = 'Refresh';
            refreshButton.disabled = false;
            if (rb2) { rb2.textContent = ' Refresh'; rb2.disabled = false; }
        }
    } catch (err) {
        alert('Could not reach server. Is server.js running?\n\n' + err.message);
        refreshButton.textContent = 'Refresh';
        refreshButton.disabled = false;
        if (rb2) { rb2.textContent = ' Refresh'; rb2.disabled = false; }
    }
}

sortLinks();
updateButtonText();

nameFilter.addEventListener('keyup', filterLinks);
dateFilter.addEventListener('change', filterLinks);
sortButton.addEventListener('click', toggleSort);
refreshButton.addEventListener('click', triggerRefresh);
document.getElementById('refreshButton2').addEventListener('click', triggerRefresh);

document.querySelectorAll('.info-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        const infoBox = e.target.nextElementSibling;
        infoBox.style.display = infoBox.style.display === 'block' ? 'none' : 'block';
    });
});

// ── Tab switching ─────────────────────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
        if (btn.dataset.tab === 'database') {
            editor.refresh();
            loadDbSelector();
        }
    });
});

// ── CodeMirror editor ─────────────────────────────────────────────────────────
const editor = CodeMirror.fromTextArea(document.getElementById('sqlInput'), {
    mode: 'text/x-sql',
    theme: 'monokai',
    lineNumbers: true,
    matchBrackets: true,
    autoCloseBrackets: true,
    indentWithTabs: false,
    tabSize: 2,
    extraKeys: {
        'Ctrl-Enter': () => document.getElementById('runQuery').click(),
        'Cmd-Enter': () => document.getElementById('runQuery').click(),
        'Ctrl-/': cm => cm.execCommand('toggleComment'),
    },
});
editor.setSize('100%', '120px');

// ── Database tab ──────────────────────────────────────────────────────────────
async function runSQL(query) {
    const res = await fetch('/mysql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
    });
    return res.json();
}

function renderResults(data) {
    if (!data.ok) return `<pre class="db-error">${data.error}</pre>`;
    if (data.fields) {
        if (!data.rows || data.rows.length === 0) return '<em>No rows returned.</em>';
        const th = data.fields.map(f => `<th>${f}</th>`).join('');
        const trs = data.rows.map(r =>
            '<tr>' + data.fields.map(f => `<td>${r[f] ?? 'NULL'}</td>`).join('') + '</tr>'
        ).join('');
        return `<table class="db-table"><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table>`;
    }
    return `<em>OK — ${data.affectedRows ?? 0} row(s) affected. ${data.info || ''}</em>`;
}

async function loadDbSelector() {
    const select = document.getElementById('dbSelect');
    const statusEl = document.getElementById('dbStatus');
    try {
        const res = await fetch('/mysql/databases');
        const data = await res.json();
        if (!data.ok) { statusEl.textContent = data.error; return; }
        select.innerHTML = '<option value="">— select —</option>';
        data.databases.forEach(db => {
            const opt = document.createElement('option');
            opt.value = db;
            opt.textContent = db;
            if (db === data.current) opt.selected = true;
            select.appendChild(opt);
        });
        if (data.current) {
            statusEl.textContent = '● ' + data.current;
            loadDbTree();
        } else {
            document.getElementById('dbTree').innerHTML = '<em>Select a database above to see its tables.</em>';
        }
    } catch (e) {
        statusEl.textContent = 'Could not connect to server.';
    }
}

document.getElementById('dbSelect').addEventListener('change', async function () {
    const database = this.value;
    const statusEl = document.getElementById('dbStatus');
    if (!database) return;
    statusEl.textContent = 'Switching...';
    try {
        const res = await fetch('/mysql/use', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ database })
        });
        const data = await res.json();
        if (data.ok) {
            statusEl.textContent = '● ' + database;
            loadDbTree();
        } else {
            statusEl.textContent = 'Error: ' + data.error;
        }
    } catch (e) {
        statusEl.textContent = 'Server error.';
    }
});

document.getElementById('runQuery').addEventListener('click', async () => {
    const btn = document.getElementById('runQuery');
    const query = editor.getValue().trim();
    const resultsEl = document.getElementById('queryResults');
    if (!query) return;
    btn.textContent = 'Running...';
    btn.disabled = true;
    resultsEl.innerHTML = '';
    try {
        const data = await runSQL(query);
        resultsEl.innerHTML = renderResults(data);
        // Refresh tree if schema may have changed
        if (/CREATE|DROP|ALTER|RENAME/i.test(query)) loadDbTree();
    } catch (e) {
        resultsEl.innerHTML = `<pre class="db-error">Could not reach server.\n${e.message}</pre>`;
    }
    btn.textContent = 'Run';
    btn.disabled = false;
});

async function loadDbTree() {
    const treeEl = document.getElementById('dbTree');
    treeEl.innerHTML = '<em>Loading tables...</em>';
    try {
        const res = await fetch('/mysql/tables');
        const data = await res.json();
        if (!data.ok) {
            treeEl.innerHTML = data.error === 'No database selected.'
                ? '<em>Select a database above to see its tables.</em>'
                : `<pre class="db-error">${data.error}</pre>`;
            return;
        }
        if (data.tables.length === 0) {
            treeEl.innerHTML = `<div class="db-tree-header">${data.database}</div><em>No tables yet.</em>`;
            return;
        }
        treeEl.innerHTML = `<div class="db-tree-header">${data.database}</div>`;
        const ul = document.createElement('ul');
        ul.className = 'db-table-list';
        data.tables.forEach(t => {
            const li = document.createElement('li');
            li.textContent = t;
            li.title = 'Click to preview';
            li.addEventListener('click', () => {
                editor.setValue('SELECT * FROM `' + t + '` LIMIT 100;');
                editor.focus();
            });
            ul.appendChild(li);
        });
        treeEl.appendChild(ul);
    } catch (e) {
        treeEl.innerHTML = `<pre class="db-error">Could not reach server.\n${e.message}</pre>`;
    }
}

// ── Cheat sheet modal ─────────────────────────────────────────────────────────
const cheatOverlay = document.getElementById('cheatOverlay');

document.getElementById('cheatBtn').addEventListener('click', () => {
    cheatOverlay.classList.add('open');
});

document.getElementById('closeCheat').addEventListener('click', () => {
    cheatOverlay.classList.remove('open');
});

cheatOverlay.addEventListener('click', (e) => {
    if (e.target === cheatOverlay) cheatOverlay.classList.remove('open');
});

document.querySelectorAll('.cheat-cmd').forEach(el => {
    el.addEventListener('click', () => {
        editor.setValue(el.textContent);
        editor.focus();
        cheatOverlay.classList.remove('open');
    });
});