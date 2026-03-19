const nameFilter = document.getElementById('nameFilter');
const dateFilter = document.getElementById('dateFilter');
const sortButton = document.getElementById('sortButton');
const refreshButton = document.getElementById('refreshButton');
const linkList = document.getElementById('linkList');
const listItems = Array.from(linkList.getElementsByTagName('li'));

let sortOrder = 'desc'; // 'desc' for newest to oldest, 'asc' for oldest to newest

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

        if (nameMatch && dateMatch) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}

function sortLinks() {
    listItems.sort((a, b) => {
        const dateA = new Date(a.getAttribute('data-date'));
        const dateB = new Date(b.getAttribute('data-date'));

        if (sortOrder === 'desc') {
            return dateB - dateA;
        } else {
            return dateA - dateB;
        }
    });

    // Re-append sorted items to the list
    listItems.forEach(item => linkList.appendChild(item));
}

function toggleSort() {
    sortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    updateButtonText();
    sortLinks();
}

async function triggerRefresh() {
    refreshButton.textContent = 'Running...';
    refreshButton.disabled = true;

    try {
        const res = await fetch('/refresh', { method: 'POST' });
        const data = await res.json();
        if (data.ok) {
            // Script ran successfully — reload the page to pick up new launcher.html
            location.reload();
        } else {
            alert('Script failed:\n' + data.error);
            refreshButton.textContent = 'Refresh';
            refreshButton.disabled = false;
        }
    } catch (err) {
        alert('Could not reach server. Is server.js running?\n\n' + err.message);
        refreshButton.textContent = 'Refresh';
        refreshButton.disabled = false;
    }
}

// Initial setup
sortLinks();
updateButtonText();

nameFilter.addEventListener('keyup', filterLinks);
dateFilter.addEventListener('change', filterLinks);
sortButton.addEventListener('click', toggleSort);
refreshButton.addEventListener('click', triggerRefresh);

// Add info button listeners
document.querySelectorAll('.info-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        const infoBox = e.target.nextElementSibling;
        infoBox.style.display = infoBox.style.display === 'block' ? 'none' : 'block';
    });
});
// ── Tab switching ────────────────────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
        if (btn.dataset.tab === 'database') loadDbTree();
    });
});

// ── Database tab ─────────────────────────────────────────────────────────────
async function runSQL(query) {
    const res = await fetch('/mysql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
    });
    return res.json();
}

function tsvToTable(tsv) {
    const lines = tsv.trim().split('\n');
    if (!lines.length || !lines[0]) return '<em>No rows returned.</em>';
    const headers = lines[0].split('\t');
    const rows = lines.slice(1).map(l => l.split('\t'));
    const th = headers.map(h => `<th>${h}</th>`).join('');
    const trs = rows.map(r => '<tr>' + r.map(c => `<td>${c}</td>`).join('') + '</tr>').join('');
    return `<table class="db-table"><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table>`;
}

document.getElementById('runQuery').addEventListener('click', async () => {
    const btn = document.getElementById('runQuery');
    const query = document.getElementById('sqlInput').value.trim();
    const resultsEl = document.getElementById('queryResults');
    if (!query) return;
    btn.textContent = 'Running...';
    btn.disabled = true;
    resultsEl.innerHTML = '';
    try {
        const data = await runSQL(query);
        if (data.ok) {
            resultsEl.innerHTML = data.output ? tsvToTable(data.output) : '<em>Query OK, no output.</em>';
        } else {
            resultsEl.innerHTML = `<pre class="db-error">${data.error}</pre>`;
        }
    } catch (e) {
        resultsEl.innerHTML = `<pre class="db-error">Could not reach server.\n${e.message}</pre>`;
    }
    btn.textContent = 'Run';
    btn.disabled = false;
});

async function loadDbTree() {
    const treeEl = document.getElementById('dbTree');
    treeEl.innerHTML = '<em>Loading...</em>';
    try {
        const data = await runSQL('SHOW DATABASES');
        if (!data.ok) { treeEl.innerHTML = `<pre class="db-error">${data.error}</pre>`; return; }
        const dbs = data.output.trim().split('\n').slice(1); // skip header
        treeEl.innerHTML = '';
        for (const db of dbs) {
            const dbName = db.trim();
            const section = document.createElement('div');
            section.className = 'db-section';
            const heading = document.createElement('div');
            heading.className = 'db-heading';
            heading.textContent = '▶ ' + dbName;
            const tableList = document.createElement('ul');
            tableList.className = 'db-table-list';
            tableList.style.display = 'none';
            heading.addEventListener('click', async () => {
                if (tableList.style.display === 'none') {
                    tableList.innerHTML = '<li><em>Loading...</em></li>';
                    tableList.style.display = '';
                    heading.textContent = '▼ ' + dbName;
                    const td = await runSQL(`SHOW TABLES IN \`${dbName}\``);
                    if (td.ok && td.output) {
                        const tables = td.output.trim().split('\n').slice(1);
                        tableList.innerHTML = tables.map(t => `<li>${t.trim()}</li>`).join('');
                    } else {
                        tableList.innerHTML = '<li><em>No tables.</em></li>';
                    }
                } else {
                    tableList.style.display = 'none';
                    heading.textContent = '▶ ' + dbName;
                }
            });
            section.appendChild(heading);
            section.appendChild(tableList);
            treeEl.appendChild(section);
        }
    } catch (e) {
        treeEl.innerHTML = `<pre class="db-error">Could not reach server.\n${e.message}</pre>`;
    }
}