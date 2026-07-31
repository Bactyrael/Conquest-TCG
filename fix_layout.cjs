const fs = require('fs');
let content = fs.readFileSync('src/components/GameBoard.jsx', 'utf8');

// Replace the game-container style
content = content.replace(
  /<div className="game-container" style=\{\{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' \}\}>/,
  '<div className="game-container" style={{ display: \'flex\', flex: 1, margin: \'-2rem\', width: \'calc(100% + 4rem)\', height: \'calc(100% + 4rem)\', overflow: \'hidden\' }}>'
);

// Also remove `margin: -2rem;` from .game-board in GameBoard.css
let cssContent = fs.readFileSync('src/components/GameBoard.css', 'utf8');
cssContent = cssContent.replace(/\s*margin:\s*-2rem;\s*\/\* Offset the 2rem padding from App\.css \*\//, '');
cssContent = cssContent.replace(/\s*height:\s*calc\(100vh - 66px\);\s*\/\* Viewport minus header \*\//, '');

fs.writeFileSync('src/components/GameBoard.jsx', content);
fs.writeFileSync('src/components/GameBoard.css', cssContent);
