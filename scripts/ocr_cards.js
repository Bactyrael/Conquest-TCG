import fs from 'fs';
import path from 'path';
import Tesseract from 'tesseract.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontsDir = path.resolve(__dirname, '../public/cards/fronts');
const outputJson = path.resolve(__dirname, '../src/data/cardDatabase.json');

async function processCards() {
  if (!fs.existsSync(frontsDir)) {
    console.error("Could not find cards directory:", frontsDir);
    return;
  }
  
  const files = fs.readdirSync(frontsDir).filter(f => f.endsWith('.png'));
  const db = [];
  
  console.log(`Found ${files.length} cards to process. Starting OCR...`);
  
  const worker = await Tesseract.createWorker('eng');
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    console.log(`Processing ${i+1}/${files.length}: ${file}`);
    const filePath = path.join(frontsDir, file);
    
    try {
       const { data: { text } } = await worker.recognize(filePath);
       
       // Basic parsing strategy: grab the first line as name, maybe second as type
       const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
       const name = lines[0] || 'Unknown Card';
       const type = lines[1] || 'Unknown Type';
       
       db.push({
         id: file.replace('.png', ''),
         name: name,
         type: type,
         imageUrl: `/cards/fronts/${file}`,
         rawText: text, // Saving the raw output in case we need to refine extraction later
         requirements: { str: 0, dex: 0, con: 0, int: 0, wis: 0, luc: 0 }
       });
    } catch (e) {
       console.error(`Failed to OCR ${file}`, e);
    }
    
    // Save incrementally so we don't lose data if it crashes
    fs.writeFileSync(outputJson, JSON.stringify(db, null, 2));
  }
  
  await worker.terminate();
  console.log("OCR Complete! Database saved to cardDatabase.json");
}

processCards();
