const fs = require('fs');
const content = fs.readFileSync('src/components/GameBoard.jsx', 'utf8');
const endIndex = content.indexOf('{arrows.map(arrow => (');
console.log("Before arrows:", content.substring(endIndex - 20, endIndex));
