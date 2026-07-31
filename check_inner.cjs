const fs = require('fs');
const content = fs.readFileSync('src/components/GameBoard.jsx', 'utf8');

const startIndex = content.indexOf('<div className="game-board" style={{ height: \'100%\', overflow: \'auto\' }}>');
const endIndex = content.indexOf('{arrows.map(arrow => (');

const innerContent = content.substring(startIndex + 76, endIndex);
let open = 0;
let close = 0;
const tags = innerContent.match(/<\/?\w+[^>]*>/g) || [];
for (let tag of tags) {
  if (tag.startsWith('</div')) close++;
  else if (tag.startsWith('<div') && !tag.endsWith('/>')) open++;
}
console.log(`Open divs: ${open}`);
console.log(`Close divs: ${close}`);
