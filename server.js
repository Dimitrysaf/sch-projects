const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 3000;
const ROOT = __dirname;

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
    // CORS headers (for local dev)
    res.setHeader('Access-Control-Allow-Origin', '*');

    // MySQL endpoint — runs a query via mariadb CLI
    if (req.method === 'POST' && req.url === '/mysql') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            let query;
            try { query = JSON.parse(body).query; } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ ok: false, error: 'Invalid JSON' }));
            }
            const socket = path.join(ROOT, '.mysql/mysql.sock');
            const cmd = `mariadb --no-defaults --socket=${socket} --batch -e ${JSON.stringify(query)}`;
            exec(cmd, (err, stdout, stderr) => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: !err, output: stdout, error: stderr || (err && err.message) }));
            });
        });
        return;
    }

    // Refresh endpoint — runs generate_launcher.sh
    if (req.method === 'POST' && req.url === '/refresh') {
        exec('bash generate_launcher.sh', { cwd: ROOT }, (err, stdout, stderr) => {
            if (err) {
                console.error('Script error:', stderr);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: false, error: stderr }));
            } else {
                console.log('Launcher regenerated.');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: true }));
            }
        });
        return;
    }

    // Static file serving
    let urlPath = req.url.split('?')[0];
    if (urlPath === '/') urlPath = '/launcher.html';

    const filePath = path.join(ROOT, urlPath);

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not found');
            return;
        }
        const ext = path.extname(filePath).toLowerCase();
        const mime = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': mime });
        res.end(data);
    });
});

server.listen(PORT, () => {
    console.log(`Launcher server running at http://localhost:${PORT}`);
});