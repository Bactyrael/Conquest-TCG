const fs = require('fs');
const content = fs.readFileSync('temp_gameboard.jsx', 'utf16le');
const lines = content.split('\n');
const startIndex = lines.findIndex(l => l.includes('<div className="game-board">'));
const endIndex = lines.findIndex(l => l.includes('{arrows.map(arrow => ('));

let divBalance = 0;
for (let i = startIndex; i < endIndex; i++) {
  const line = lines[i];
  const tags = line.match(/<\/?\w+[^>]*>/g) || [];
  for (let tag of tags) {
    if (tag.startsWith('</div')) divBalance--;
    else if (tag.startsWith('<div') && !tag.endsWith('/>')) divBalance++;
  }
}
console.log(`Div balance from game-board to arrows.map: ${divBalance}`);
