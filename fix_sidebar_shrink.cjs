const fs = require('fs');
let content = fs.readFileSync('src/components/GameBoard.jsx', 'utf8');

// 1. Add minWidth: 0 to game-board-area
content = content.replace(
  /<div className="game-board-area" style=\{\{ flex: '1', position: 'relative', overflow: 'hidden' \}\}>/,
  '<div className="game-board-area" style={{ flex: \'1\', position: \'relative\', overflow: \'hidden\', minWidth: 0 }}>'
);

// 2. Add flexShrink: 0 to right-sidebar
content = content.replace(
  /<div className="right-sidebar" style=\{\{ width: '350px', backgroundColor: '#111', borderLeft: '2px solid #333', display: 'flex', flexDirection: 'column', color: '#fff', fontFamily: 'Inter, sans-serif', zIndex: 50 \}\}>/,
  '<div className="right-sidebar" style={{ width: \'350px\', flexShrink: 0, backgroundColor: \'#111\', borderLeft: \'2px solid #333\', display: \'flex\', flexDirection: \'column\', color: \'#fff\', fontFamily: \'Inter, sans-serif\', zIndex: 50 }}>'
);

fs.writeFileSync('src/components/GameBoard.jsx', content);
