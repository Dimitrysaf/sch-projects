// server.js

import express from 'express';
import fs from 'node:fs/promises'; 
import path from 'node:path';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'node:url'; 

const app = express();
const PORT = 3000;

// ΥΠΟΛΟΓΙΣΜΟΣ __dirname ΓΙΑ ES MODULES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); 

const PROJECTS_ROOT = path.resolve(__dirname, 'projects'); 

// --- Middleware ---
app.use(bodyParser.json());

// CORS Configuration (Επιτρέπει ΟΛΑ τα origins για να λυθεί το πρόβλημα του proxy)
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Χειρισμός Pre-flight requests (OPTIONS)
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    
    next();
});

// --- Συνάρτηση Ασφαλείας ---
const sanitizePath = (relativePath) => {
    const fullPath = path.join(PROJECTS_ROOT, relativePath);
    
    if (!fullPath.startsWith(PROJECTS_ROOT)) {
        throw new Error('Access denied: Path outside projects directory.');
    }
    return fullPath;
};

// --- API Endpoints ---

// 1. ΛΙΣΤΑ ΑΡΧΕΙΩΝ (READ)
app.get('/api/fs/list', async (req, res) => {
    const relativePath = req.query.path || '';
    try {
        const fullPath = sanitizePath(relativePath);
        const items = await fs.readdir(fullPath);
        
        const fileData = await Promise.all(items.map(async item => {
            const itemPath = path.join(fullPath, item);
            const stats = await fs.stat(itemPath);
            const isHTML = stats.isFile() && item.endsWith('.html');
            const clientPath = path.join(relativePath, item).replace(/\\/g, '/');

            return {
                name: item,
                path: clientPath,
                isDirectory: stats.isDirectory(),
                isFile: stats.isFile(),
                isLaunchable: isHTML,
                size: stats.size,
                mtime: stats.mtime
            };
        }));

        res.json(fileData);

    } catch (error) {
        if (error.code === 'ENOENT') {
             return res.json([]); 
        }
        console.error('List Error:', error);
        res.status(500).json({ error: error.message || 'Could not list directory.' });
    }
});

// 2. ΔΙΑΒΑΣΜΑ ΠΕΡΙΕΧΟΜΕΝΟΥ ΑΡΧΕΙΟΥ (READ)
app.get('/api/fs/content', async (req, res) => {
    const relativePath = req.query.path;
    if (!relativePath) {
        return res.status(400).json({ error: 'Missing path parameter.' });
    }
    try {
        const fullPath = sanitizePath(relativePath);
        const content = await fs.readFile(fullPath, 'utf8');
        res.json({ content });
    } catch (error) {
        console.error('Read Content Error:', error);
        res.status(500).json({ error: error.message || 'Could not read file content.' });
    }
});

// 3. ΔΗΜΙΟΥΡΓΙΑ ΑΡΧΕΙΟΥ/ΦΑΚΕΛΟΥ (CREATE)
app.post('/api/fs/create', async (req, res) => {
    const { parentPath, newName, isDirectory, content } = req.body;
    if (!parentPath || !newName) {
         return res.status(400).json({ error: 'Missing path or name.' });
    }

    try {
        const itemPath = sanitizePath(path.join(parentPath, newName));

        if (isDirectory) {
            await fs.mkdir(itemPath, { recursive: true });
        } else {
            await fs.writeFile(itemPath, content || '', 'utf8');
        }
        res.status(201).json({ success: true, message: `Created ${newName}` });
    } catch (error) {
        console.error('Create Error:', error);
        res.status(500).json({ error: error.message || 'Could not create item.' });
    }
});

// 4. ΑΠΟΘΗΚΕΥΣΗ ΠΕΡΙΕΧΟΜΕΝΟΥ ΑΡΧΕΙΟΥ (UPDATE)
app.put('/api/fs/update', async (req, res) => {
    const { path: relativePath, content } = req.body;
    if (!relativePath || content === undefined) {
        return res.status(400).json({ error: 'Missing path or content.' });
    }
    try {
        const fullPath = sanitizePath(relativePath);
        await fs.writeFile(fullPath, content, 'utf8');
        res.json({ success: true, message: 'File updated successfully.' });
    } catch (error) {
        console.error('Update Error:', error);
        res.status(500).json({ error: error.message || 'Could not update file.' });
    }
});


// 5. ΔΙΑΓΡΑΦΗ ΑΡΧΕΙΟΥ/ΦΑΚΕΛΟΥ (DELETE)
app.delete('/api/fs/delete', async (req, res) => {
    const relativePath = req.body.path;
    if (!relativePath) {
        return res.status(400).json({ error: 'Missing path parameter.' });
    }
    
    try {
        const fullPath = sanitizePath(relativePath);
        const stats = await fs.stat(fullPath);

        if (stats.isDirectory()) {
            await fs.rm(fullPath, { recursive: true, force: true }); 
        } else {
            await fs.unlink(fullPath);
        }
        res.json({ success: true, message: `Deleted ${relativePath}` });
    } catch (error) {
        console.error('Delete Error:', error);
        res.status(500).json({ error: error.message || 'Could not delete item.' });
    }
});


app.listen(PORT, () => {
    console.log(`🚀 File Manager API running on http://localhost:${PORT}`);
    console.log(`Security Root: ${PROJECTS_ROOT}`);
});