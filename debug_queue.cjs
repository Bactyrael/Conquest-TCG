const fs = require('fs');
let content = fs.readFileSync('src/components/GameBoard.jsx', 'utf8');

content = content.replace(
  "  const connectToQueue = () => {\n    if (socket) {\n      socket.emit('join_queue');\n    }\n  };",
  "  const connectToQueue = () => {\n    console.log('Find Match clicked, socket:', !!socket);\n    if (socket) {\n      socket.emit('join_queue');\n    } else {\n      alert('Not connected to multiplayer server yet. Please wait a moment.');\n    }\n  };"
);

fs.writeFileSync('src/components/GameBoard.jsx', content);
