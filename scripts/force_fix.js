import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../src/data/cardDatabase.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

let fixed = 0;
for (let c of db) {
  const t = c.rawText.toLowerCase();
  if (t.includes('koreghar') || t.includes('inspiration die')) {
     c.type = 'Bonus Action';
     fixed++;
  }
  if (t.includes('remove the target') || t.includes('contest against')) {
     if (t.includes('intelligence')) {
         c.type = 'Reaction';
         fixed++;
     }
  }
}

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log(`Fixed ${fixed} cards manually.`);
