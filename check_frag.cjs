const fs = require('fs');
const content = fs.readFileSync('src/components/GameBoard.jsx', 'utf8');

const startIndex = content.indexOf('<div className="game-board" style={{ height: \'100%\', overflow: \'auto\' }}>');
const endIndex = content.indexOf('{arrows.map(arrow => (');

const innerContent = content.substring(startIndex + 76, endIndex);
const openFrag = (innerContent.match(/<>/g) || []).length;
const closeFrag = (innerContent.match(/<\/>/g) || []).length;

console.log(`Open frag: ${openFrag}, Close frag: ${closeFrag}`);
