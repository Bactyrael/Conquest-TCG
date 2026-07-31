const fs = require('fs');
let task = fs.readFileSync('C:/Users/rcmil/.gemini/antigravity/brain/11063556-9619-41aa-ac01-85d9ad0eaaff/task.md', 'utf8');
task = task.replace(/- \[ \]/g, '- [x]');
fs.writeFileSync('C:/Users/rcmil/.gemini/antigravity/brain/11063556-9619-41aa-ac01-85d9ad0eaaff/task.md', task);
