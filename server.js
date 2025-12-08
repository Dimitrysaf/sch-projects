import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';

const app = express();
const port = 3000;

app.use(cors());

app.get('/api/folders', (req, res) => {
  const rootPath = './';
  fs.readdir(rootPath, { withFileTypes: true }, (err, files) => {
    if (err) {
      res.status(500).send('Error reading directory');
      return;
    }
    const folders = files
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
      .filter(name => /^\d{2}\.\d{2}\.\d{4}$/.test(name))
      .sort((a, b) => {
        const [dayA, monthA, yearA] = a.split('.').map(Number);
        const [dayB, monthB, yearB] = b.split('.').map(Number);
        return new Date(yearA, monthA - 1, dayA) - new Date(yearB, monthB - 1, dayB);
      })
      .map(name => name.replace(/\./g, '/'));
    res.json(folders);
  });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
