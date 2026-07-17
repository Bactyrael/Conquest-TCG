import fs from 'fs';
import path from 'path';

const RAW_DIR = 'C:\\Users\\rcmil\\OneDrive\\Desktop\\Card Raw Image';
const TEMPLATE_DIR = path.join(process.cwd(), 'public', 'cards', 'templates');
const DB_PATH = path.join(process.cwd(), 'src', 'data', 'cardDatabase.json');

const scriptFiles = [
  'inject_actions.js',
  'inject_bonus_actions.js',
  'inject_heroes.js',
  'inject_locations.js',
  'inject_reactions.js'
];

function parseTSV(tsv) {
  let results = [];
  let currentCell = '';
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < tsv.length; i++) {
    const char = tsv[i];
    const nextChar = tsv[i + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      currentCell += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === '\t' && !inQuotes) {
      row.push(currentCell);
      currentCell = '';
    } else if (char === '\n' && !inQuotes) {
      row.push(currentCell);
      results.push(row);
      row = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }
  row.push(currentCell);
  results.push(row);

  const headers = results[0].map(h => h.trim());
  const objects = [];
  for (let i = 1; i < results.length; i++) {
    if (results[i].length < 2) continue;
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = results[i][j];
    }
    objects.push(obj);
  }
  return objects;
}

function getCleanFilename(rawField) {
  if (!rawField) return null;
  let clean = rawField.split(',')[0];
  clean = clean.split('/').pop().split('\\').pop();
  return clean.trim();
}

function walkDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      walkDir(path.join(dir, file), fileList);
    } else {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

async function main() {
  if (!fs.existsSync(TEMPLATE_DIR)) {
    fs.mkdirSync(TEMPLATE_DIR, { recursive: true });
  }

  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  const cardMap = new Map();

  for (const file of scriptFiles) {
    const filePath = path.join(process.cwd(), 'scripts', file);
    if (!fs.existsSync(filePath)) continue;
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const tsvMatch = content.match(/const tsvData = `([\s\S]*?)`;/);
    if (tsvMatch && tsvMatch[1]) {
      const rows = parseTSV(tsvMatch[1]);
      for (const row of rows) {
        const title = row['Title'] || row['Title '] || row['Name'] || row['Nickname'];
        const background = row['card_background'] || row['Portrait'] || row['Image'];
        if (title && background) {
          cardMap.set(title.toLowerCase().trim(), getCleanFilename(background));
        }
      }
    }
  }

  let rawFiles = [];
  try {
    rawFiles = walkDir(RAW_DIR);
  } catch (err) {
    console.error(`Error reading raw dir: ${err.message}`);
    return;
  }

  const fileMap = new Map();
  for (const f of rawFiles) {
    fileMap.set(path.basename(f).toLowerCase(), f);
  }

  let successCount = 0;
  let missingCount = 0;

  for (const card of db) {
    let targetFilename = cardMap.get(card.name.toLowerCase().trim());
    if (targetFilename) {
      let lowerFilename = targetFilename.toLowerCase();
      // Sometimes extensions might differ (.jpg vs .png) in real life vs TSV
      // We will try exact match first
      let matchedFile = fileMap.get(lowerFilename);
      
      // If no exact match, try matching just the base name
      if (!matchedFile) {
        const baseTarget = path.parse(lowerFilename).name;
        for (const [fName, fPath] of fileMap.entries()) {
          if (path.parse(fName).name === baseTarget) {
            matchedFile = fPath;
            break;
          }
        }
      }

      if (matchedFile) {
        const ext = path.extname(matchedFile);
        const destFilename = `${card.id}${ext}`;
        const destPath = path.join(TEMPLATE_DIR, destFilename);
        
        fs.copyFileSync(matchedFile, destPath);
        card.imageUrl = `/cards/templates/${destFilename}`;
        card.originalArtFile = targetFilename; 
        successCount++;
      } else {
        console.warn(`[WARNING] Could not find physical file for: ${card.name} (Expected: ${targetFilename})`);
        missingCount++;
      }
    } else {
      console.warn(`[WARNING] No mapping found in TSV for: ${card.name}`);
      missingCount++;
    }
  }

  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  console.log(`\nMigration complete! Successfully migrated ${successCount} cards. Missing/Failed: ${missingCount}`);
}

main();
