const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const mysql = require('mysql2');

const PORT = 3000;
const ROOT = __dirname;
const SOCKET = path.join(ROOT, '.mysql/mysql.sock');

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
};

// ── MySQL persistent connection ───────────────────────────────────────────────
let db = null;
let currentDb = null;

function connectMySQL() {
    db = mysql.createConnection({
        socketPath: SOCKET,
        user: process.env.USER || process.env.LOGNAME,
    });
    db.connect(err => {
        if (err) {
            console.error('MySQL not ready, retrying in 3s...', err.message);
            db = null;
            setTimeout(connectMySQL, 3000);
            return;
        }
        console.log('MySQL connected.');
        if (currentDb) {
            db.query('USE `' + currentDb + '`', err => {
                if (err) console.error('Could not restore DB context:', err.message);
            });
        }
    });
    db.on('error', err => {
        console.error('MySQL error:', err.code);
        if (['PROTOCOL_CONNECTION_LOST', 'ECONNRESET', 'ECONNREFUSED'].includes(err.code)) {
            db = null;
            setTimeout(connectMySQL, 2000);
        }
    });
}
connectMySQL();

function requireDb(res) {
    if (!db) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'MySQL not connected yet — try again in a moment.' }));
        return false;
    }
    return true;
}

// ── HTTP server ───────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');

    // GET /mysql/databases
    if (req.method === 'GET' && req.url === '/mysql/databases') {
        if (!requireDb(res)) return;
        db.query('SHOW DATABASES', (err, rows) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            if (err) return res.end(JSON.stringify({ ok: false, error: err.message }));
            const databases = rows.map(r => Object.values(r)[0]);
            res.end(JSON.stringify({ ok: true, databases, current: currentDb }));
        });
        return;
    }

    // POST /mysql/use
    if (req.method === 'POST' && req.url === '/mysql/use') {
        if (!requireDb(res)) return;
        let body = '';
        req.on('data', c => body += c);
        req.on('end', () => {
            let database;
            try { database = JSON.parse(body).database; } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ ok: false, error: 'Invalid JSON' }));
            }
            db.query('USE `' + database + '`', err => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                if (err) return res.end(JSON.stringify({ ok: false, error: err.message }));
                currentDb = database;
                res.end(JSON.stringify({ ok: true, database }));
            });
        });
        return;
    }

    // GET /mysql/tables
    if (req.method === 'GET' && req.url === '/mysql/tables') {
        if (!requireDb(res)) return;
        if (!currentDb) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ ok: false, error: 'No database selected.' }));
        }
        db.query('SHOW TABLES', (err, rows) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            if (err) return res.end(JSON.stringify({ ok: false, error: err.message }));
            const tables = rows.map(r => Object.values(r)[0]);
            res.end(JSON.stringify({ ok: true, tables, database: currentDb }));
        });
        return;
    }

    // POST /mysql
    if (req.method === 'POST' && req.url === '/mysql') {
        if (!requireDb(res)) return;
        let body = '';
        req.on('data', c => body += c);
        req.on('end', () => {
            let query;
            try { query = JSON.parse(body).query; } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ ok: false, error: 'Invalid JSON' }));
            }
            db.query(query, (err, results, fields) => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                if (err) return res.end(JSON.stringify({ ok: false, error: err.message }));
                if (fields) {
                    const fieldNames = fields.map(f => f.name);
                    res.end(JSON.stringify({ ok: true, fields: fieldNames, rows: results }));
                } else {
                    res.end(JSON.stringify({ ok: true, affectedRows: results.affectedRows, info: results.info || '' }));
                }
            });
        });
        return;
    }

    // POST /refresh
    if (req.method === 'POST' && req.url === '/refresh') {
        exec('bash generate_launcher.sh', { cwd: ROOT }, (err, stdout, stderr) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ ok: false, error: stderr }));
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true }));
        });
        return;
    }

    // Static files
    let urlPath = req.url.split('?')[0];
    if (urlPath === '/') urlPath = '/launcher.html';
    const filePath = path.join(ROOT, urlPath);
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            return res.end('Not found');
        }
        const ext = path.extname(filePath).toLowerCase();
        const mime = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': mime });
        res.end(data);
    });
});

server.listen(PORT, () => {
    console.log('Launcher server running at http://localhost:' + PORT);
});