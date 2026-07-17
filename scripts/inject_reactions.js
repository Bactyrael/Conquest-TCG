import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../src/data/cardDatabase.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const tsvData = `Copies	Nickname	card_background	Portrait	Title	Artist Credit	Set & Rarity	Artist Logo	Keyword	Cost / Type	Str Req	Dex Req	Con Req	Int Req	Wis Req	Lck Req
1			"Absorb Elements.jpg,50,50,166"	Absorb Elements	Place Holder Art			"A target gains resistance to a type of Elemental damage targeting them until the beginning of their next turn. (Air, Earth, Fire, Ice, Lightning, Thunder, or Water.)"	Reaction - Boon				4		
1			Ace in the Hole.jpg	Ace in the Hole	Place Holder Art			"Use your Luck modifier instead of another stat for a saving throw you make.
/

/
“Sometimes, all it takes is a sprinkle of luck and a dash of magic to turn things around.”"	Reaction - Ability						2
1			Brutal Critical.png	Brutal Critical	Place Holder Art			"Roll one additional weapon damage die when determining the extra damage for a critical hit.
/

/
“It doesn’t happen by chance and demands immense skill and combat prowess to achieve.”"	Reaction - Ability						2
1			Celerity.jpg	Celerity	Place Holder Art			Your next Act card that requires an Action can be performed at Reaction speed. (You must still use an Action as required by the Act card.)	Reaction - Ability		3				
1			Counter.jpg	Counter	Place Holder Art			"Make a contest against a (DC of 2 plus an attacker’s Strength). If successful, deal Weapon damage to the attacker."	Reaction - Ability	2					
1			Dodge.jpg	Dodge	Place Holder Art			"Make a contest against a (DC of 3 plus a target’s Dexterity). If successful, gain resistance and negate the effects of any Act card from that target."	Reaction - Ability		3				
1			No Dice.jpg	No Dice	Place Holder Art			"A target roll with advantage now has disadvantage instead. (The lower of the two rolls must be used.)
/

/
“The only truth about luck is that it dances like a fickle breeze, forever changing its course.”"	Reaction - Ability						2
1			Parry.jpg	Parry	Place Holder Art			"Make a contest against a (DC of 2 plus an attacker’s Dexterity). If successful, gain resistance to the damage and negate the effects of that attack."	Reaction - Ability		2				
1			Riposte.jpg	Riposte	Place Holder Art			Deal weapon damage to a target that has failed a contest this turn.	Reaction - Ability	2					
1			Bless.jpg	Bless	Place Holder Art			A target gains a 1d4 bonus on saving throws until the end of their next turn.	Reaction - Boon			3			
1			Heroism.jpg	Heroism	Place Holder Art			"Until the beginning of their next turn, a target gains temporary Hit Points equal to their Constitution modifier and is immune to Fright.
/

/
“Fear not, for I am by your side; be unafraid, for I shall be your guide.” — Navitas, the Aspect of Diligence"	Reaction - Boon			5			
1			Iron Skin.jpg	Iron Skin	Place Holder Art			"A target gains resistance to a type of Physical damage targeting them until the beginning of their next turn. (Bludgeoning, Piercing, or Slashing)."	Reaction - Boon	2					
1			Rallying Anthem.jpg	Rallying Anthem	Place Holder Art			"Spend an Inspiration Die to grant advantage on another target’s saving throw. If their saving throw succeeds, gain a 1d4 Inspiration Die."	Reaction - Boon	2				3	
1			Sancturary.png	Sanctuary	Place Holder Art			"Until the beginning of their next turn, attacks and Act cards against a target require a (DC 8 plus half the performer’s Constitution, rounded down) Constitution saving throw to succeed. On a failed saving throw, the attacker must target another with that attack or Act card."	Reaction - Boon			4			
1			Spiked Growth.jpg	Spiked Growth	Place Holder Art			"Until the end of their next turn, whenever a target is attacked, their attacker takes 1d8 Earth damage.
/

/
“By the will of Mamel, the earth shall rise in vengeance; let every attack against me invoke the fury of stone”"	Reaction - Boon			2	1		
1			Superstition.jpg	Superstition	Place Holder Art			"A target gains resistance to a type of Divine (Dark, Holy, Magic, or Nature) damage targeting them until the beginning of their next turn."	Reaction - Boon					4	
1			Wind Wall.jpg	Wind Wall	Place Holder Art			"Until the end of the turn, attacks made against a target have disadvantage and deal 1d4 less damage."	Reaction - Boon		2		2		
1			Abolish.jpg	Abolish	Place Holder Art			Remove a target Boon.	Reaction - Spell			2		2	
1			Counter Spell.jpg	Counter Spell	Place Holder Art			"Make a contest against a (DC of 2 plus a target’s Intelligence). If successful, remove the target Hero’s Action from the Timeline."	Reaction - Spell				4		
1			Cure.jpg	Cure	Place Holder Art			Remove a target Curse.	Reaction - Spell			3			
1			Disarming Ditty.jpg	Disarming Ditty	Place Holder Art			"Make a contest against a (DC of 2 plus an attacker’s Wisdom). On success, their attack rolls with disadvantage. You may spend an Inspiration Die to reduce their critical range by 1 for that attack."	Reaction - Spell					4	
1			Dispel.jpg	Dispel	Place Holder Art			"Remove a Boon or Curse from a target, then draw a card."	Reaction - Spell				4		
1			Dissonant Whispers.jpg	Dissonant Whispers	Place Holder Art			"Make a contest against a (DC of 2 plus a target’s Wisdom). If successful, remove the target Hero’s Reaction from the Timeline.
/

/
“Whispers coil through your mind like shadows, twisting your thoughts and unraveling your courage with every breath.”"	Reaction - Spell					4	
1			Energy Shield.jpg	Energy Shield	Place Holder Art			Reduce damage from a single source by an amount equal to your Wisdom modifier. (This damage reduction is not affected by Resistance or Vulnerability.)	Reaction - Spell					3	
1			Mass Dispel.jpg	Mass Dispel	Place Holder Art			"Remove all Boons and Curses, then draw a card for each removed this way."	Reaction - Spell				7		
1			Silence.jpg	Silence	Place Holder Art			"Make a contest against a (DC of 2 plus a target’s Constitution). If successful, remove the target Hero’s Bonus Action from the Timeline."	Reaction - Spell			4			
1			Warp.jpg	Warp	Place Holder Art			Your next Act card that requires a Bonus Action can be performed at Reaction speed. (You must still use a Bonus Action as required by the Act card.)	Reaction - Spell				4		`;

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
    const quoteMatch = keyword.match(/["“]([^"”]+)["”]$/);
    
    if (quoteMatch) {
      flavorText = quoteMatch[1].trim();
      rulesText = keyword.substring(0, quoteMatch.index).trim().replace(/\n\/\n\n\/\n/g, '\n').replace(/\n\/\n/g, '\n').replace(/\n\//g, '\n').trim();
    } else {
      rulesText = keyword.trim().replace(/\n\/\n\n\/\n/g, '\n').replace(/\n\/\n/g, '\n').replace(/\n\//g, '\n');
    }
  }

  const costType = row['Cost / Type'] || '';
  let type = 'Reaction';
  let subtype = '';
  if (costType.includes('-')) {
    const parts = costType.split('-');
    subtype = parts[1].trim();
  }
  
  const strReq = parseInt(row['Str Req'], 10) || 0;
  const dexReq = parseInt(row['Dex Req'], 10) || 0;
  const conReq = parseInt(row['Con Req'], 10) || 0;
  const intReq = parseInt(row['Int Req'], 10) || 0;
  const wisReq = parseInt(row['Wis Req'], 10) || 0;
  const lckReq = parseInt(row['Lck Req'], 10) || 0;

  const card = db.find(c => c.name.toLowerCase() === title.toLowerCase());
  if (card) {
    card.rulesText = rulesText;
    card.flavorText = flavorText;
    card.type = type;
    card.subtype = subtype;
    card.requirements = {
      str: strReq,
      dex: dexReq,
      con: conReq,
      int: intReq,
      wis: wisReq,
      luc: lckReq
    };
    injectedCount++;
    console.log("Injected data for Reaction: " + title);
  } else {
    console.log("Could not find card matching title: " + title);
  }
}

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log("Successfully injected data into " + injectedCount + " Reaction cards!");
