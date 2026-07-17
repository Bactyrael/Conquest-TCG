import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const dbPath = path.resolve(__dirname, 'src', 'data', 'cardDatabase.json');

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

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Backend Server running on http://localhost:${PORT}`);
});
