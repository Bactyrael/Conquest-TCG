const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const dbPath = path.resolve(__dirname, '..', 'src', 'data', 'cardDatabase.json');
const imagesDir = path.resolve(__dirname, '..', 'public', 'cards', 'generated');

// Serve static images directly from the backend
app.use('/cards/generated', express.static(imagesDir));

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

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Desktop Editor Backend Server running on http://localhost:${PORT}`);
});
