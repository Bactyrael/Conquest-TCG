const fs = require('fs');
const content = fs.readFileSync('src/components/GameBoard.jsx', 'utf8');
const sidebarIndex = content.indexOf('{/* RIGHT SIDEBAR */}');
const sidebarContent = content.substring(sidebarIndex);

let openDivs = (sidebarContent.match(/<div/g) || []).length;
let closeDivs = (sidebarContent.match(/<\/div>/g) || []).length;
console.log(`Right sidebar open divs: ${openDivs}`);
console.log(`Right sidebar close divs: ${closeDivs}`);
