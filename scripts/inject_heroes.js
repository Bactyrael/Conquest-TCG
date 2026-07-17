import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../src/data/cardDatabase.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const tsvData = `Copies	Title	Portrait	Keyword	Attack Dice	Artist Credit	Set & Rarity	Nickname	card_background	Artist Logo
1	Stug	"Barbarian Set.jpg,57,50,100"	"**Rage →** Until the beginning of your next turn, your attacks deal +2 damage. If you have advantage, it instead deals +4.\n/\n\nWhile enraged, attacker's have advantage against you."	Attack: 1d8 + Str (Blunt)	Place Holder Art				
1	Naeris	"Bard Set.jpg,45,0,100"	"**Bardic Inspiration →** Gain an Inspiration Die equal to or less than one of your stats. \n/\n\n/\nGain +1 defense and resilience until the end of your turn, for every step of that Inspiration Die (e.g., +1 for a 1d4, +2 for a 1d6, etc.)."	Attack: 1d6 + Lck (Thunder)	Place Holder Art				
1	Aelastrion	"Cleric Set.jpg,60,50,100"	"**Channel Divinity →** You may use your Con in place of any other stat when meeting the total stat requirement of the next Boon you perform this round.\n/\n\n/\nWhenever you perform a Boon card, restore 1 Hit Point to the target for each point of Constitution required to perform that card."	Attack: 1d6 + Con (Holy)	Place Holder Art				
1	Kaeliss	"Conjurer Set.png,50,15,100"	"**Aetheric →** If the next Spell you perform this round has a total stat requirement higher than the number of Elemental Counters you control, gain an Elemental Counter.\n/\n\nSpells require 1 less of any stat for each Elemental Counter you control."	Attack: 1d4 + Int (Fire)	Place Holder Art				
1	Ilyndra	Druid Set.jpg	"**Wild Resurgence →** Mill a card, you may perform an Act card from the Dungeon. The Act card you choose moves to the Void after being performed. (The Act card moves to the Void even if it cannot be performed.)"	Attack: 1d6 + Wis (Nature)	Place Holder Art				
1	Naev	"Fighter Set.jpg,55,50,100"	"**Master at Arms →** Until the beginning of your next turn, your attack rolls can't be lower than half their maximum value (e.g., a 1 on a d4 becomes a 2). \n/\n\n/\nOn a critical hit, deal +2 additional damage."	Attack: 1d8 + Dex (Slashing)	Place Holder Art				
1	Arachrion	Necromancer Set.png	"**Burial Rite → **Discard up to three cards. Then, you may Void an Act card from the Dungeon to perform it, reducing its stat requirements by one for each card discarded. (It moves to the Void even if it couldn’t be performed.)"	Attack: 1d8 + Wis (Dark)	Place Holder Art				
1	Yuanai	Monk Set.jpg	"**Martial Arts → **Gain an Inspiration Die equal to or less than your Dex. \n/\n\n/\nGain critical range by +1 for each step of that Inspiration Die (e.g., +1 for a 1d4, +2 for a 1d6, etc.)"	Attack: 2d4 + Dex (Blunt)	Place Holder Art				
1	Marius	"Paladin Set.jpg,50,24,178"	"**Radiant Strikes →** Until the start of your next turn, your damage rolls are Holy and deal +1 damage for every 2 Constitution you have."	Attack: 1d8 + Con (Holy)	Place Holder Art				
1	Avery	Pirate Set.png	"**No Prey, No Pay → **If you damage a Hero this round, you may void the top card of their Archive. If it’s an Act card, attach it to your Hero. You may use your Luck in place of any other stat when meeting the total stat requirement of attached cards."	Attack: 1d4 + Lck (Piercing)	Place Holder Art				
1	Viona	Ranger Set.jpg	"**Deft Explorer → **Look at the top card of your Archive. If it is a Location card, you may draw it.\n/\n\n/\nAfter playing a Location card, your next attack or Act card has advantage until the end of your turn."	Attack: 1d8 + Lck (Piercing)	Place Holder Art				
1	Faela	Sorcerer Set.jpg	"**Font of Magic** → Gain an Inspiration Die equal to or less than your Int. \n/\n\n/\nIf you already have an Inspiration Die, you may increase its size by 1 step (e.g., 1d4 to 1d6, max 1d20)."	Attack: 1d6 + Int (Magic)	Place Holder Art				
1	Leif	"Rogue Set.jpg,50,5,100"	"**Sneak Attack** → Gain stealth until the beginning of next turn. Stealth ends if you attack. (Attacks against a stealthed target have disadvantage.)\n\nYour critical hit range is increased by 2 while attacking from stealth (e.g., 18–20)."	Attack: 2d4 + Lck (Piercing)	Place Holder Art				
1	Malakar	Warlock Set.jpg	"**Eldritch Invocation → **Void a card from your hand, then draw a card from the top of your Archive. If the voided card was an Act card, you may instead draw two cards.\n/\n\n/\nWhenever you void a card, you may deal 1 Dark damage to any target. If the voided card was an Act card, deal 2 Dark damage instead."	Attack: 1d4 + Wis (Dark)	Place Holder Art				
1	Sebelda	Witch Set.jpeg	"**Malignance → **You may use your Wisdom in place of any other stat when meeting the total stat requirement of the next Curse you perform this round.\n/\n\n/\nWhenever you perform a Curse, deal Dark damage to each cursed target equal to half the card’s total stat requirement (rounded down)."	Attack: 1d6 + Wis (Dark)	Place Holder Art				
1	Sundrian	"Wizard Set.jpg,46,40,174"	"**Spell Mastery → **Attach an Act card from your hand to Sundrian. You may perform attached Act cards. Attached Act cards move to the Void when performed.\n/\n\n/\nAct cards performed from anywhere other than your hand require two less of a chosen stat."	Attack: 1d8 + Int (Magic)	Place Holder Art`;

// Very basic TSV parser that respects quotes
function parseTSV(tsv) {
  const lines = tsv.trim().split('\n');
  const headers = lines[0].split('\t');
  const results = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    
    const row = {};
    let inQuote = false;
    let currentCell = '';
    let colIndex = 0;
    
    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      
      if (char === '"') {
        inQuote = !inQuote;
      } else if (char === '\t' && !inQuote) {
        row[headers[colIndex]] = currentCell.replace(/^"|"$/g, '').replace(/""/g, '"');
        currentCell = '';
        colIndex++;
      } else {
        currentCell += char;
      }
    }
    row[headers[colIndex]] = currentCell.replace(/^"|"$/g, '').replace(/""/g, '"');
    results.push(row);
  }
  return results;
}

const tableData = parseTSV(tsvData);
let injectedCount = 0;

for (const row of tableData) {
  const title = row['Title'];
  if (!title) continue;
  const keywordStr = row['Keyword'] ? row['Keyword'].replace(/\n\/\n/g, '\n').replace(/\n\//g, '\n') : '';
  const attackDice = row['Attack Dice'];
  
  // Find card in DB
  const card = db.find(c => c.name.toLowerCase() === title.toLowerCase());
  if (card) {
    const combinedRules = attackDice + "\n\n" + keywordStr;
    card.rulesText = combinedRules;
    card.type = 'Hero';
    injectedCount++;
    console.log("Injected data for Hero: " + title);
  } else {
    console.log("Could not find card matching title: " + title);
  }
}

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log("Successfully injected data into " + injectedCount + " Hero cards!");
