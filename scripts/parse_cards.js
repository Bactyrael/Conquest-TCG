import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../src/data/cardDatabase.json');

if (!fs.existsSync(dbPath)) {
  console.error("Database not found!");
  process.exit(1);
}

const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Regex to catch card types based on user rules
const typeRegex = /(Action - Ability|Action - Spell|Bonus Action - Ability|Bonus Action - Spell|Reaction - Ability|Reaction - Spell|Location - Common|Location - Uncommon|Duel|Onslaught)/i;

let parsedCount = 0;

for (let card of db) {
  const text = card.rawText || "";
  
  // 1. Find Type
  const typeMatch = text.match(typeRegex);
  if (typeMatch) {
    card.type = typeMatch[1];
  } else if (text.includes("Attack:")) {
    card.type = "Hero";
  } else {
    // Fallback search for partials just in case OCR missed a dash
    const lowerText = text.toLowerCase();
    
    // Explicit User Overrides for mangled OCR
    if (lowerText.includes("inspir") || lowerText.includes("luck of the draw") || lowerText.includes("ensorcell") || lowerText.includes("rupture") || lowerText.includes("30nus action") || lowerText.includes("onus action")) {
       card.type = "Bonus Action";
    } else if (lowerText.includes("counter\n") || lowerText.includes("on - ability i\nake a contest") || lowerText.includes("counter spell")) {
       card.type = "Reaction";
    }
    // Standard Fallback Check
    else if (lowerText.includes("bonus action") || lowerText.includes("bonus")) {
      card.type = "Bonus Action";
    } else if (lowerText.includes("reaction") || lowerText.includes("re action")) {
      card.type = "Reaction";
    } else if (lowerText.includes("action")) {
      card.type = "Action";
    } else if (lowerText.includes("location")) {
      card.type = "Location";
    } else {
      card.type = "Unknown";
    }
  }

  // 2. Try to clean up the Name (first line usually, but OCR is messy)
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  // We won't aggressively change the name here since OCR for stylized fonts is bad,
  // but we ensure type is perfectly captured!
  
  parsedCount++;
}

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log(`Successfully parsed types for ${parsedCount} cards!`);
