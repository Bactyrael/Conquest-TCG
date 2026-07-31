const fs = require('fs');
const lines = fs.readFileSync('src/components/GameBoard.jsx', 'utf8').split('\n');
for (let i = 1560; i < 1585; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
