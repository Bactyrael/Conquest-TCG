import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../src/data/cardDatabase.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const tsvData = `Copies	Nickname	card_background	Portrait	Title	Artist Credit	Set & Rarity	Artist Logo	Keyword	Cost / Type	Str Req	Dex Req	Con Req	Int Req	Wis Req	Lck Req
1			"Battle Cry.jpg,59,50,100"	Battle Cry	Place Holder Art			"A target gains disadvantage on attacks until the beginning of your next turn.
/

/
""By the strength of Corporis, may weak hearts tremble and yield in the presence of true warriors."""	Bonus Action - Ability	3					
1			Hunters Mark.jpg	Hunter's Mark	Place Holder Art			"A target loses 1d6 defense until the end of the turn.  (This effect cannot reduce defense below 0.)
/

/
“Every being that stirs in the realm carries a tale of enchantment and intrigue, weaving timeless legends of adventure and transformation with each step it takes.” — Talpit, the Ranger"	Bonus Action - Ability						5
1			Inspire.jpg	Inspire	Place Holder Art			"A target gains an Inspiration Die less than or equal to their highest modifier. (e.g., if you have a Luck modifier of five, you would gain a 1d4 Inspiration Die.)
/

/
“Only in times where failure is a possibility does the quest for wisdom through mistakes become a necessity.” — Koreghar, the Prosperous"	Bonus Action - Ability						3
1			Instruction.jpg	Instruction	Place Holder Art			"Search your Archive for an Ability card, reveal it, then shuffle your Archive and place that card on top."	Bonus Action - Ability		3				
1			Luck of the Draw.jpg	Luck of the Draw	Place Holder Art			"Independently roll a 1d4, 1d6, 1d8, 1d10, 1d12, and 1d20. For each Die that critically hits, gain +1 to critical range until the end of your turn, and apply that critical range to the next die rolled. Draw a card for each die that results in a critical hit.
/

/
“When all is lost, having nothing to lose opens the door to endless possibilities.”"	Bonus Action - Ability						6
1			Taunt.jpg	Misdirection	Place Holder Art			"Until the beginning of your next turn, all Heroes must attack each combat if able."	Bonus Action - Ability	3					
1			Surge.jpg	Surge	Place Holder Art			A target gains one additional Action until the end of their next turn.	Bonus Action - Ability		4				
1			Amplify Magic.png	Amplify Magic	Place Holder Art			"Increase the total number of dice rolled on a target’s next Act card by 1. (Adds an additional die to the roll. e.g., if you roll 1d4, it becomes 2d4.)
/

/
“True potential emerges when one looks beyond the confines of reality.” — Dragon Emperor Galilecies"	Bonus Action - Boon				5		
1			Aria of Accuracy.jpg	Aria of Accuracy	Place Holder Art			Spend an Inspiration Die to grant another target +1 damage on their next attack. If the attack results in a critical hit they may roll the Inspiration Die and add its value as extra damage.	Bonus Action - Boon		2		3		
1			Bark Skin.jpg	Bark Skin	Place Holder Art			"A target gains 4 defense until the end of their next turn. (Each point of defense reduces each instance of Physical damage you take.)
/

/
""By Gramen’s sacred roots, I entwine myself in nature’s embrace, wrapping my form in sturdy armor of bark and vine."""	Bonus Action - Boon			3		2	
1			Beast Bond.jpg	Beast Bond	Place Holder Art			"A target cannot attack you and gains advantage on attacks until the end of their next turn.
/

/
“My foes are merely friends who have yet to realize it.” — Grove Tender Iosis"	Bonus Action - Boon			2		2	
1			Divine Favor.jpg	Divine Favor	Place Holder Art			"Until the end of their next turn, a target deals an additional 1d4 in Holy damage with their attacks. (Divine Favor cannot critically hit.)
/

/
“Power is not a burden but a gift, bestowed to uplift those in need.” — Venia, the Aspect of Charity"	Bonus Action - Boon			4			
1			Ensorcell.jpg	Ensorcell	Place Holder Art			"Until the end of their next turn, a target deals an additional 1d4 in Magic damage with their attacks. (Ensorcell cannot critically hit.)
/

/
“Drawing power from the mundane is an easy feat for those who can wield the arcane.” — Patheldar, the Meek"	Bonus Action - Boon				4		
1			Gambit.jpg	Gambit	Place Holder Art			"Until the end of their next turn, a target draws a card for each attack or Act card they perform that results in a critical hit.
/

/
“Fortune is the favorable outcome that arises when careful strategy meets a timely opportunity.” — Mothang, the Long-Sleeved"	Bonus Action - Boon						2
1			Hymn of Deterrance.jpg	Hymn of Deterrance	Place Holder Art			"Grant another target +2 defense and resilience until the end of their next turn. If they took damage during the duration of this effect, gain a 1d4 Inspiration Die."	Bonus Action - Boon			2	2		
1			Invisibility.jpg	Invisibility	Place Holder Art			A target gains invisibility until the end of their next turn. It ends if they use an Act card. (Act cards targeting an invisible unit have disadvantage.)	Bonus Action - Boon				3		
1			Fog Cloud.jpg	Mass Invisibility	Place Holder Art			"All targets gain invisibility until the beginning of your next turn. It ends if they use an Act card. (Act cards targeting an invisible unit have disadvantage.)
/

/
“By Inludo’s deception, shroud the realm in mystic fog, cloaking the world in shadow and mirth.”"	Bonus Action - Boon				5		
1			Pass Without Trace.jpg	Pass Without Trace	Place Holder Art			All targets gain stealth until your next turn. Stealth ends if they attack. (Attacks against stealthed targets have disadvantage.)	Bonus Action - Boon		5				
1			See Red.jpg	See Red	Place Holder Art			"Until the beginning of your next turn, attacks a target makes and receives have advantage.
/

/
“In the frenzy, all strikes grow ferocious, and every blow finds its mark.” — Dormund Greis"	Bonus Action - Boon	2					
1			Song of Favor.jpg	Song of Favor	Place Holder Art			"Grant a target a 1d4 Inspiration Die until the end of their next turn. If another Hero uses that Die, you gain a 1d4 Inspiration Die."	Bonus Action - Boon						4
1			Splash the Pot.jpg	Splash the Pot	Place Holder Art			"Until the end of their next turn, a target’s attacks and Act cards gain +2 critical range. (Critical range reduces the dice roll required to achieve a critical hit.)"	Bonus Action - Boon						3
1			Stealth.jpg	Stealth	Place Holder Art			A target gains stealth until your next turn. Stealth ends if they attack. (Attacks against stealthed targets have disadvantage.)	Bonus Action - Boon		3				
1			Blight.jpg	Blight	Place Holder Art			"A target must succeed a (DC 8 plus half the performer’s Wisdom, rounded down) Constitution saving throw or become blighted (Vulnerable to Divine damage types “Dark, Holy, Magic, and Nature”)."	Bonus Action - Curse			2		3	
1			Blind.jpg	Blind	Place Holder Art			"A target must succeed a (DC 8 plus half the performer’s Luck, rounded down) Intelligence saving throw or become blinded (Cannot use Reactions on attacks)."	Bonus Action - Curse				2		3
1			Buffet.jpg	Buffet	Place Holder Art			"A target must succeed a (DC 8 plus half the performer’s Dexterity, rounded down) Intelligence saving throw or become buffeted (Non-Physical damage sources roll with advantage against you)."	Bonus Action - Curse		3		2		
1			Burn.jpg	Burn	Place Holder Art			"A target must succeed a (DC 8 plus half the performer’s Strength, rounded down) Intelligence saving throw or become burned (Vulnerable to Elemental damage types: Air, Earth, Fire, Ice, Lightning, Thunder, and Water)."	Bonus Action - Curse	3			2		
1			Charm.jpg	Charm	Place Holder Art			"A target must succeed a (DC 8 plus half the performer’s Constitution, rounded down) Constitution saving throw or become charmed (Roll with disadvantage on Act cards)."	Bonus Action - Curse			5			
1			Chill.jpg	Chill	Place Holder Art			"A target must succeed a (DC 8 plus half the performer’s Wisdom, rounded down) Strength saving throw or become chilled (Can only perform one Act card per turn)."	Bonus Action - Curse	3				2	
1			Confuse.jpg	Confuse	Place Holder Art			"A target must succeed a (DC 8 plus half the performer’s Intelligence, rounded down) Intelligence saving throw or become confused (Saving throws and contests have their difficulty class increased by 2)."	Bonus Action - Curse				5		
1			Deafen.jpg	Deafen	Place Holder Art			"A target must succeed a (DC 8 plus half the performer’s Luck, rounded down) Wisdom saving throw or become deafened (Cannot use Reactions on Act cards)."	Bonus Action - Curse					2	3
1			Drench.jpg	Drench	Place Holder Art			"A target must succeed a (DC 8 plus half the performer’s Dexterity, rounded down) Wisdom saving throw or become drenched (All damage dealt is reduced by 2)."	Bonus Action - Curse		3			2	
1			Castigation.jpg	Fright	Place Holder Art			"A target must succeed a (DC 8 plus half the performer’s Wisdom, rounded down) Wisdom saving throw or become frightened (Roll with disadvantage on attacks)."	Bonus Action - Curse					5	
1			Bleed.jpg	Rupture	Place Holder Art			"A target must succeed a (DC 8 plus half the performer’s Dexterity, rounded down) Dexterity saving throw or become ruptured (Vulnerable to Physical damage types “Bludgeoning, Piercing, and Slashing”)."	Bonus Action - Curse		5				
1			Sever.jpg	Sever	Place Holder Art			"A target must succeed a (DC 8 plus half the performer’s Luck, rounded down) Luck saving throw or become severed (Lose and cannot gain resistance to Physical damage types “Bludgeoning, Piercing, and Slashing”)."	Bonus Action - Curse						5
1			Sunder.jpg	Sunder	Place Holder Art			"A target must succeed a (DC 8 plus half the performer’s Constitution, rounded down) Intelligence saving throw or become sundered (Lose and cannot gain resistance to Elemental damage types “Air, Earth, Fire, Ice, Lightning, Thunder, and Water”)."	Bonus Action - Curse			3	2		
1			Curse.jpg	Torment				"A target must succeed a (DC 8 plus half the performer’s Wisdom, rounded down) Wisdom saving throw or become tormented (Lose and cannot gain resistance to Divine damage types. “Dark, Holy, Magic, and Nature”)."	Bonus Action - Curse					5	
1			Wound.jpg	Wound	Place Holder Art			"A target must succeed a (DC 8 plus half the performer’s Strength, rounded down) Strength saving throw or become wounded (Physical damage sources roll with advantage against you “Bludgeoning, Piercing, and Slashing”.)"	Bonus Action - Curse	5					
1			Ascertain.jpg	Ascertain	Place Holder Art			"Ascertain a number of cards equal to your Wisdom. (e.g., Look at the top “x” cards of your Archive, then place any number of them on the bottom of your Archive and the rest on top in any order.)
/

/
“Only the wise should dare to manipulate fate, lest you find yourself contemplating eternity.” — Fraus, of the Fae Court"	Bonus Action - Spell					2	
1			"Augury.jpg,12,50,100"	Augury	Place Holder Art			"Search your Archive for a Curse card, reveal it, then shuffle your Archive and place that card on top."	Bonus Action - Spell					3	
1			"Conveyance.jpg,3,50,100"	Conveyance	Place Holder Art			"Draw two cards from the top of your Archive.
/

/
“The college of Straness teaches many things, but plundering the future is not among them.” — Oaken, the Sage Scroll"	Bonus Action - Spell				4		
1			Early Withdrawl.jpg	Early Withdrawl	Place Holder Art			"Draw a card for every three Wisdom you have.
/

/
“How can you long for something, never knowing what it might have been?” — Miluina, Aspect of Greed"	Bonus Action - Spell					3	
1			Earthen Bounty.jpg	Earthen Bounty	Place Holder Art			"Search your Archive for a common Location card, reveal it, and put it into your hand. Then, shuffle your Archive.
/

/
“From the ruins of the old, the earth breathes anew—fertile, untamed, and waiting to be claimed.” — Antorius, Thunder of the Mountain"	Bonus Action - Spell			2	2		
1			Faerie Fire.jpg	Faerie Fire	Place Holder Art			"A target loses 1d6 resilience until the end of the turn. (This effect cannot reduce Resilience below 0.)
/

/
“The greatest delights come from the most preposterous things.” — Stropha, of the Fae Count"	Bonus Action - Spell				5		
1			Forethought.jpg	Forethought	Place Holder Art			"Ascertain three cards. (Look at the top three cards of your Archive, then place any number of them on the bottom of your Archive and the rest on top in any order.)
/

/
“Victory is decided long before the battle begins.”— Freysa"	Bonus Action - Spell				3		
1			Guidance.jpg	Guidance	Place Holder Art			"Search your Archive for a Boon card, reveal it, then shuffle your Archive and place that card on top."	Bonus Action - Spell			3			
1			Juxtaposition.jpg	Juxtaposition	Place Holder Art			"For every two points of Intelligence you possess, draw one card, then discard one card for every two cards drawn this way.
/

/
“In the dance of intellect, each spark of insight draws forth new visions, yet with each revelation, we must relinquish the old.” — Lesuvius, the Mentalist"	Bonus Action - Spell				2		
1			Teleportation.jpg	Teleportation	Place Holder Art			"Search your Archive for a common Location card and put it onto the battlefield. As an additional cost, shuffle a Location card into your Archive."	Bonus Action - Spell				3		
1			Tutelage.jpg	Tutelage	Place Holder Art			"Search your Archive for a Spell card, reveal it, then shuffle your Archive and place that card on top."	Bonus Action - Spell				3		
1			"Verdant Pathfinding.jpg,36,50,100"	Verdant Pathfinding	Place Holder Art			"Search your Archive for a common Location card, reveal it, and put it onto the battlefield. Then, shuffle your Archive.
/

/
“With patience and toil, the wilds yield to our vision, and a new haven is born.” — Grove Tender Iosis"	Bonus Action - Spell			2		2	`;

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
  let type = 'Bonus Action';
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
    console.log("Injected data for Bonus Action: " + title);
  } else {
    console.log("Could not find card matching title: " + title);
  }
}

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log("Successfully injected data into " + injectedCount + " Bonus Action cards!");
