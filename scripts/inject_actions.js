import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../src/data/cardDatabase.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const tsvData = `Copies	Nickname	card_background	Portrait	Title	Artist Credit	Set & Rarity	Artist Logo	Keyword	Cost / Type	Str Req	Dex Req	Con Req	Int Req	Wis Req	Lck Req
1			Blade Dance.png	Blade Dance	Place Holder Art			Deal 1d10 plus your Dexterity modifier in Slashing damage to a target.	Action - Ability		5				
1			Duel.jpg	Duel	Place Holder Art			"You and a target each deal weapon damage plus modifier to each other.
/

/
“In a war of attrition the victor is one who does not battle.” — General Baelkhan"	Action - Ability 	4					
1			Giant Stomp.png	Giant Stomp	Place Holder Art			Deal 1d12 plus your Strength modifier in Blunt damage to a target.	Action - Ability	6					
1			"Onslaught.png,87,50,100"	Onslaught	Place Holder Art			"During your next attack this turn, you may attack twice.
/

/
“In chaos there is also opportunity.” — Stug"	Action - Ability	6					
1			BnB/Untitled folder/Slice and Dice.jpg	Slice and Dice	Place Holder Art			"Deal 1d8 plus your Dexterity modifier in Slashing damage to a target.
/

/
“I have no desire to mar my blade; I will end you with the utmost efficiency.” — Shadow Chuson"	Action - Ability		4				
1			BnB/Untitled folder/Stab and Jab.jpg	Stab and Jab	Place Holder Art			"Deal 2d4 plus your Luck modifier in Piercing damage to a target.
/

/
“The dead don’t desire revenge.” — Merkil, the Slayer"	Action - Ability						4
1			BnB/Untitled folder/Titanic Volley.png	Titanic Volley	Place Holder Art			Deal 3d4 plus your Luck modifier in Slashing damage to a target.	Action - Ability						6
1			BnB/Untitled folder/War Cry.jpg	Warcry	Place Holder Art			"Deal 1d8 plus your Strength modifier in Blunt damage to a target.
/

/
""By Corporis’ roaring presence, unleash a wave of destruction that shatters the will of all who hear it."""	Action - Ability	4					
1			BnB/Untitled folder/Acid Splash.png	Acid Splash	Place Holder Art			Deal 1d6 plus your Constitution modifier in Nature damage.	Action - Spell			2		1	
1			BnB/Untitled folder/Boom.jpg	Boom	Place Holder Art			"Deal 2d4 plus your Luck modifier in Thunder damage to a target.
/

/
""By the roar of Fragor’s mighty voice, the skies shatter and strike with thunderous wrath."""	Action - Spell					1	3
1			BnB/Untitled folder/Chain Lightning.jpg	Chain Lightning	Place Holder Art			Deal 3d4 plus your Luck modifier in Lightning damage to a target.	Action - Spell				2		4
1			BnB/Untitled folder/Cone of Cold.png	Cone of Cold	Place Holder Art			Deal 1d10 plus your Strength modifier in Ice damage to a target.	Action - Spell	3				2	
1			BnB/Untitled folder/Entangle.jpg	Entangle	Place Holder Art			"Deal 1d10 plus your Constitution modifier in Nature damage to a target.
/

/
""By the will of Gramen, earth rise and nature grasp ensnare all who tread upon it."""	Action - Spell			3		2	
1			BnB/Untitled folder/Fire Ball.png	Fire Ball	Place Holder Art			"Deal 1d8 plus your Strength modifier in Fire damage to a target.
/

/
""By the burning will of Caeles, fire be both my forge and fury."""	Action - Spell	3			1		
1			BnB/Untitled folder/Fissure.png	Fissure	Place Holder Art			Deal 1d12 plus your Constitution modifier in Earth damage to a target.	Action - Spell			4	2		
1			BnB/Untitled folder/Geyser.png	Geyser	Place Holder Art			Deal 1d12 plus your Dexterity modifier in Water damage to a target.	Action - Spell		4			2	
1			BnB/Untitled folder/Gust.jpg	Gust	Place Holder Art			"Deal 1d6 plus your Dexterity modifier in Air damage to a target.
/

/
""By Volucris’ breath, the winds stir and sweep all before me with boundless force."""	Action - Spell		2		1		
1			BnB/Untitled folder/Heal.jpg	Heal	Place Holder Art			"Restore 1d4 plus your Constitution modifier in Hit Points to a target.
/

/
""By Spirabilis’ gentle touch, may light mend wounds and restore life’s sacred essence."""	Action - Spell			5			
1			BnB/Untitled folder/Holy Bolt.jpg	Holy Bolt	Place Holder Art			"Deal 1d4 plus your Constitution modifier in Holy damage to a target.
/

/
""By the radiant grace of Spirabilis, let pure light pierce the darkness and smite with divine fury."""	Action - Spell			2			
1			BnB/Untitled folder/Ice Bolt.jpg	Ice Bolt	Place Holder Art			"Deal 1d8 plus your Strength modifier in Ice damage to a target.
/

/
""By the chilling breath of Gelus, let frost pierce air and strike with icy precision."""	Action - Spell	3				1	
1			BnB/Untitled folder/Lightning Bolt.png	Lightning Bolt	Place Holder Art			"Deal 2d4 plus your Luck modifier in Lightning damage to a target.
/

/
""By Fulmen’s crackling fury, unleash judgment and strike with lightning’s swift wrath."""	Action - Spell				1		3
1			BnB/Untitled folder/Magic Bolt.jpg	Magic Bolt	Place Holder Art			"Deal 1d8 plus your Intelligence modifier in Magic damage to a target.
/

/
""By Inludo’s hand, let arcane fury fly!"""	Action - Spell				4		
1			BnB/Untitled folder/Magic Missile.jpg	Magic Missile	Place Holder Art			"Deal 1d10 plus your Intelligence modifier in Magic damage to a target.
/

/
""By Inludo’s arcane will, ethereal forces take flight and strike true with mystic barrage."""	Action - Spell				5		
1			BnB/Untitled folder/Meteor Shower.jpg	Meteor Shower	Place Holder Art			Deal 1d12 plus your Strength modifier in Fire damage to a target.	Action - Spell	4			2		
1			"BnB/Untitled folder/Quake.jpg,50,100,300"	Quake	Place Holder Art			"Deal 1d6 plus your Constitution modifier in Earth damage to a target.
/

/
""By Mamel’s unshakable strength, ground tremble and fracture under the weight of unquestionable might."""	Action - Spell			2	1		
1			BnB/Untitled folder/Radiance.png	Radiance	Place Holder Art			Deal 2d4 plus your Constitution modifier in Holy damage to a target.	Action - Spell			4			
1			BnB/Untitled folder/Rejuvenate.jpg	Rejuvenate	Place Holder Art			"Restore 1d4 plus your Wisdom modifier in Hit Points to a target.
/

/
""By Gramen’s nurturing embrace, vitality of nature flow and restore life’s essence anew."""	Action - Spell			2		4	
1			BnB/Untitled folder/Restoration.jpg	Restoration	Place Holder Art			"Remove a target Curse, then restore 4 Hit Points."	Action - Spell			4			
1			BnB/Untitled folder/Squall.png	Squall	Place Holder Art			Deal 1d10 plus your Dexterity modifier in Air damage to a target.	Action - Spell		3		2		
1			BnB/Untitled folder/Terror.png	Terror	Place Holder Art			"Deal 1d6 plus your Wisdom modifier in Dark damage to a target.
/

/
""By Mortuus’ chilling shadow, dread seep into the hearts of the living and paralyze their very souls."""	Action - Spell					3	
1			BnB/Untitled folder/Thunderclap.png	Thunderclap	Place Holder Art			Deal 3d4 plus your Luck modifier in Thunder damage to a target.	Action - Spell					2	4
1			BnB/Untitled folder/Voidstorm.png	Voidstorm	Place Holder Art			Deal 1d10 plus your Wisdom modifier in Dark damage to a target.	Action - Spell					5	
1			BnB/Untitled folder/Water Ball.jpg	Water Ball	Place Holder Art			"Deal 1d6 plus your Dexterity modifier in Water damage to a target.
/

/
""By Squama’s turbulent will, raging waters converge and crash down upon my foes with merciless force."""	Action - Spell		2			1	`;

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
  let type = 'Action';
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
    console.log("Injected data for Action: " + title);
  } else {
    console.log("Could not find card matching title: " + title);
  }
}

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log("Successfully injected data into " + injectedCount + " Action cards!");
