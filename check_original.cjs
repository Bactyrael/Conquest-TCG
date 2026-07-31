const fs = require('fs');
const content = fs.readFileSync('temp_gameboard.jsx', 'utf16le'); // IT IS UTF16!
const lines = content.split('\n');
let divBalance = 0;
for (let i = 1285; i < lines.length; i++) {
  const line = lines[i];
  const tags = line.match(/<\/?\w+[^>]*>/g) || [];
  for (let tag of tags) {
    if (tag.startsWith('</')) {
      if (tag.startsWith('</div')) divBalance--;
    } else {
      if (!tag.endsWith('/>') && tag.startsWith('<div')) divBalance++;
    }
  }
}
console.log(`Original file final div balance: ${divBalance}`);
