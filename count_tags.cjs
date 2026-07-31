const fs = require('fs');
const content = fs.readFileSync('src/components/GameBoard.jsx', 'utf8');

// A simple stack-based tag counter for JSX
const lines = content.split('\n');
let stack = [];
let insideJSX = false;

for (let i = 1285; i < 2075; i++) {
  const line = lines[i];
  
  // Very rough regex for opening tags (excluding self-closing)
  const openTags = line.match(/<[a-zA-Z][^>]*(?<!\/)>/g) || [];
  // Exclude <br>, <hr>, <img...> which might not have />
  const validOpen = openTags.filter(t => !t.match(/<(img|br|hr|input|meta|link)/i));
  
  const closeTags = line.match(/<\/[a-zA-Z][^>]*>/g) || [];
  
  validOpen.forEach(t => stack.push(t));
  closeTags.forEach(t => stack.pop());
}

console.log("Tags remaining on stack at line 2075:");
console.log(stack.length);
