const fs = require('fs');
const content = fs.readFileSync('temp_gameboard.jsx', 'utf8');

const startIndex = content.indexOf('<Xwrapper>');
const block = content.substring(startIndex, startIndex + 500);
console.log(block);
