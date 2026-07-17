import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../src/data/cardDatabase.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const tsvData = `Copies	Nickname	card_background	Portrait	Title	Artist Credit	Set & Rarity	Artist Logo	Keyword	Location Type
1			Strength Stat Card.jpg	Arena of Strength	Place Holder Art			"Gain +1 Strength.
/

/
""The roar of the crowd fuels both ambition and might."""	Location - Common
1			Dexterity Stat Card.jpg	Stream of Dexterity	Place Holder Art			"Gain +1 Dexterity.
/

/
""The stream teaches those who listen to move swiftly, like water over stone."""	Location - Common
1			Constitution Stat Card.jpg	Fortress of Constitution	Place Holder Art			"Gain +1 Constitution.
/

/
""The stones of the fortress may crack, but they never fall."""	Location - Common
1			Intelligence Stat Card.jpg	Library of Intelligence	Place Holder Art			"Gain +1 Intelligence.
/

/
""These grand repositories of knowledge have stood the test of time."""	Location - Common
1			Wisdom Stat Card.jpg	Cavern of Wisdom	Place Holder Art			"Gain +1 Wisdom.
/

/
""Ancient wisdom reverberates through the ages, speaking to those who listen."""	Location - Common
1			Luck Stat Card.jpg	Treasure of Luck	Place Holder Art			"Gain +1 Luck.
/

/
""Gold and riches can change fortunes in an instant."""	Location - Common
1			Archive of Enlightenment.jpg	Athenaeum of Acumen	Place Holder Art			"When Athenaeum of Acumen enters the battlefield, return another Location card you control to its owner’s hand.
/
Gain +1 Intelligence and Wisdom."	Location - Uncommon
1			Cartographers Post.jpg	Cartographer's Post	Place Holder Art			"**→** Sacrifice this Location card, search your Archive for a common Location card, put it onto the battlefield, then shuffle."	Location - Uncommon
1			Citadel of Resilience.jpg	Citadel of Resilience	Place Holder Art			"When Citadel of Resilience enters the battlefield, return another Location card you control to its owner’s hand.
/
Gain +1 Constitution and Intelligence."	Location - Uncommon
1			Coliseum of Willpower.jpg	Coliseum of Willpower	Place Holder Art			"When Coliseum of Willpower enters the battlefield, return another Location card you control to its owner’s hand.
/
Gain +1 Dexterity and Constitution."	Location - Uncommon
1			Crossroads of Chance.jpg	Crossroads of Chance	Place Holder Art			"When Crossroads of Chance enters the battlefield, return another Location card you control to its owner’s hand.
/
Gain +1 Dexterity and Luck."	Location - Uncommon
1			Forge of Endurance.jpg	Forge of Endurance	Place Holder Art			"When Forge of Endurance enters the battlefield, return another Location card you control to its owner’s hand.
/
Gain +1 Strength and Constitution."	Location - Uncommon
1			Garden of Insight.jpg	Garden of Insight	Place Holder Art			"When Garden of Insight enters the battlefield, return another Location card you control to its owner’s hand.
/
Gain +1 Constitution and Wisdom."	Location - Uncommon
1			Hall of Strategy.jpg	Hall of Strategy	Place Holder Art			"When Hall of Strategy enters the battlefield, return another Location card you control to its owner’s hand. 
/
Gain +1 Strength and Intelligence."	Location - Uncommon
1			Labyrinth of Serendipity.jpg	Labyrinth of Serendipity	Place Holder Art			"When Labyrinth of Serendipity enters the battlefield, return another Location card you control to its owner’s hand.
/
Gain +1 Intelligence and Luck."	Location - Uncommon
1			Pit of Fortune.jpg	Pit of Fortune	Place Holder Art			"When Pit of Fortune enters the battlefield, return another Location card you control to its owner’s hand. 
/
Gain +1 Strength and Luck."	Location - Uncommon
1			Sanctum of Valor.jpg	Sanctum of Valor	Place Holder Art			"When Sanctum of Valor enters the battlefield, return another Location card you control to its owner’s hand. 
/
Gain +1 Strength and Wisdom."	Location - Uncommon
1			Shrine of Finesse.jpg	Shrine of Finesse	Place Holder Art			"When Shrine of Finesse enters the battlefield, return another Location card you control to its owner’s hand.
/
Gain +1 Dexterity and Wisdom."	Location - Uncommon
1			Temple of Destiny.jpg	Temple of Destiny	Place Holder Art			"When Temple of Destiny enters the battlefield, return another Location card you control to its owner’s hand.
/
Gain +1 Wisdom and Luck."	Location - Uncommon
1			Tower of Ingenuity.jpg	Tower of Ingenuity	Place Holder Art			"When Tower of Ingenuity enters the battlefield, return another Location card you control to its owner’s hand.
/
Gain +1 Dexterity and Intelligence."	Location - Uncommon
1			Training Grounds.jpg	Training Grounds	Place Holder Art			"When Training Grounds enters the battlefield, return another Location card you control to its owner’s hand.
/
Gain +1 Strength and Dexterity."	Location - Uncommon
1			Vault of Providence.jpg	Vault of Providence	Place Holder Art			"When Vault of Providence enters the battlefield, return another Location card you control to its owner’s hand.
/
Gain +1 Constitution and Luck."	Location - Uncommon`;

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

  const headers = results[0];
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

const tableData = parseTSV(tsvData);
let injectedCount = 0;

for (const row of tableData) {
  const title = row['Title'];
  if (!title) continue;
  
  let rulesText = '';
  let flavorText = '';
  
  const keyword = row['Keyword'];
  if (keyword) {
    // User noted: "in the last batch the text in quotations was the flavor text"
    // Since TSV escaped "" inside quotes, parseTSV already converted "" to "
    // So the flavor text looks like: "The roar of the crowd..."
    
    // We can use a regex to extract text surrounded by quotes
    const quoteMatch = keyword.match(/"([^"]+)"$/);
    
    if (quoteMatch) {
      flavorText = quoteMatch[1].trim();
      rulesText = keyword.substring(0, quoteMatch.index).trim().replace(/\n\/\n\n\/\n/g, '\n').replace(/\n\/\n/g, '\n').replace(/\n\//g, '\n').trim();
    } else {
      rulesText = keyword.trim().replace(/\n\/\n\n\/\n/g, '\n').replace(/\n\/\n/g, '\n').replace(/\n\//g, '\n');
    }
  }

  const locType = row['Location Type'];
  let subtype = '';
  let rarity = 'None';
  
  if (locType) {
    if (locType.includes('Common')) rarity = 'Common';
    if (locType.includes('Uncommon')) rarity = 'Uncommon';
  }

  const card = db.find(c => c.name.toLowerCase() === title.toLowerCase());
  if (card) {
    card.rulesText = rulesText;
    card.flavorText = flavorText;
    card.type = 'Location';
    card.rarity = rarity;
    injectedCount++;
    console.log("Injected data for Location: " + title);
  } else {
    console.log("Could not find card matching title: " + title);
  }
}

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log("Successfully injected data into " + injectedCount + " Location cards!");
