import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';

const app = express();
const port = 3000;

app.use(cors());
app.use('/projects', express.static('projects'));

app.get('/api/projects', (req, res) => {
  const projectsPath = './projects';
  fs.readdir(projectsPath, (err, files) => {
    if (err) {
      res.status(500).send('Error reading directory');
      return;
    }
    const htmlFiles = files.filter(file => file.endsWith('.html'));
    res.json(htmlFiles);
  });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
