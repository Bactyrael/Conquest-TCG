const fs = require('fs');
const db = JSON.parse(fs.readFileSync('./src/data/cardDatabase.json', 'utf8'));

console.log("Looking for Inspire or Counter Spell...");

db.forEach(c => {
  const text = c.rawText.toLowerCase();
  
  if (text.includes('koreghar') || text.includes('highest modifier') || text.includes('inspiration die')) {
    console.log(`Found Inspire: ${c.id}, currently type: ${c.type}`);
  }
  
  if (text.includes('remove the target') || text.includes('intelligence') || text.includes('contest against')) {
    console.log(`Found Counter Spell: ${c.id}, currently type: ${c.type}`);
  }
});
