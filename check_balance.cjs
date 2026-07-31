const fs = require('fs');
const content = fs.readFileSync('src/components/GameBoard.jsx', 'utf8');

const lines = content.split('\n');
let divBalance = 0;
for (let i = 1285; i < lines.length; i++) {
  const line = lines[i];
  
  // Extract all tag names
  const tags = line.match(/<\/?\w+[^>]*>/g) || [];
  
  for (let tag of tags) {
    if (tag.startsWith('</')) {
      if (tag.startsWith('</div')) divBalance--;
    } else {
      if (!tag.endsWith('/>') && tag.startsWith('<div')) divBalance++;
    }
  }
  
  if (divBalance < 0) {
     console.log(`Div balance went negative at line ${i + 1}`);
     break;
  }
}
console.log(`Final div balance: ${divBalance}`);
