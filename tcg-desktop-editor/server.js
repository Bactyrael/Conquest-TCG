const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const dbPath = path.resolve(__dirname, '..', 'src', 'data', 'cardDatabase.json');
const imagesDir = path.resolve(__dirname, '..', 'public', 'cards', 'generated');

// Serve static icons & public assets from editor public directory
app.use(express.static(path.resolve(__dirname, 'public')));
// Serve static images directly from the backend
app.use('/cards/generated', express.static(imagesDir));
// Serve built frontend assets
app.use(express.static(path.resolve(__dirname, 'dist')));

app.get('/api/images', (req, res) => {
  try {
    if (!fs.existsSync(imagesDir)) {
      return res.json({ success: true, images: [] });
    }
    const files = fs.readdirSync(imagesDir);
    const images = files.filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
    res.json({ success: true, images });
  } catch (error) {
    console.error('Failed to read images:', error);
    res.status(500).json({ error: 'Failed to read images directory' });
  }
});

app.get('/api/cards', (req, res) => {
  try {
    if (!fs.existsSync(dbPath)) {
      return res.json({ success: true, cards: [] });
    }
    const data = fs.readFileSync(dbPath, 'utf8');
    const cards = JSON.parse(data);
    res.json({ success: true, cards });
  } catch (error) {
    console.error('Failed to read database:', error);
    res.status(500).json({ error: 'Failed to read database' });
  }
});

app.post('/api/save-cards', (req, res) => {
  try {
    const updatedCards = req.body;
    if (!Array.isArray(updatedCards)) {
      return res.status(400).json({ error: 'Expected an array of cards' });
    }
    
    fs.writeFileSync(dbPath, JSON.stringify(updatedCards, null, 2), 'utf8');
    console.log(`Saved ${updatedCards.length} cards to database.`);
    res.json({ success: true, message: 'Cards saved successfully' });
  } catch (error) {
    console.error('Failed to save cards:', error);
    res.status(500).json({ error: 'Failed to save database' });
  }
});

// Endpoint to generate & download all card images in a single zip
app.get('/api/export-all-images', (req, res) => {
  try {
    const { execSync } = require('child_process');
    const zipPath = path.resolve(__dirname, '..', 'public', 'cards', 'all_card_images.zip');
    const zipScript = path.resolve(__dirname, 'zip_images.py');
    
    fs.writeFileSync(zipScript, `
import os, zipfile
img_dir = r"${imagesDir.replace(/\\/g, '\\\\')}"
zip_out = r"${zipPath.replace(/\\/g, '\\\\')}"
files = [f for f in os.listdir(img_dir) if f.endswith(('.jpg', '.png'))]
with zipfile.ZipFile(zip_out, 'w', zipfile.ZIP_DEFLATED) as z:
    for f in files:
        z.write(os.path.join(img_dir, f), arcname=f)
print(f"Zipped {len(files)} images")
`);
    execSync(`python "${zipScript}"`, { stdio: 'inherit' });
    
    if (fs.existsSync(zipPath)) {
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="beasts_and_bounties_all_card_images.zip"');
      const filestream = fs.createReadStream(zipPath);
      filestream.pipe(res);
    } else {
      res.status(500).json({ error: 'Failed to generate zip file' });
    }
  } catch (err) {
    console.error('Failed to export all images:', err);
    res.status(500).json({ error: 'Failed to export images' });
  }
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Desktop Editor Backend Server running on http://localhost:${PORT}`);
});

