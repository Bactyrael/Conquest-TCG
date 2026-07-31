const fs = require('fs');
let content = fs.readFileSync('src/components/GameBoard.jsx', 'utf8');

content = content.replace(
  /<div className="game-container".*?>/,
  '<div className="game-container" style={{ display: \'flex\', flex: 1, margin: \'-2rem\', height: \'calc(100% + 4rem)\', overflow: \'hidden\' }}>'
);
fs.writeFileSync('src/components/GameBoard.jsx', content);
