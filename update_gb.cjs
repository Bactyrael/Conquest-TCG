const fs = require('fs');
let content = fs.readFileSync('src/components/GameBoard.jsx', 'utf8');

// 1. Add imports
content = content.replace(
  "import React, { useState, useEffect } from 'react';",
  "import React, { useState, useEffect, useRef } from 'react';\nimport { io } from 'socket.io-client';"
);

// 2. Add states
const stateInjection = `
  // Multiplayer State
  const [socket, setSocket] = useState(null);
  const [multiplayerRole, setMultiplayerRole] = useState(null); // 'player1' or 'player2'
  const [multiplayerRoom, setMultiplayerRoom] = useState(null);
  const [multiplayerStatus, setMultiplayerStatus] = useState('disconnected'); // 'disconnected', 'waiting', 'connected'
  const isOpponentConnected = multiplayerStatus === 'connected';
  const preventNextSync = useRef(false);
`;
content = content.replace(
  "  const [discardState, setDiscardState] = useState({ active: false, count: 0 });",
  "  const [discardState, setDiscardState] = useState({ active: false, count: 0 });\n" + stateInjection
);

// 3. Add multiplayer socket useEffect
const socketEffect = `
  // --- MULTIPLAYER SETUP ---
  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server with ID:', newSocket.id);
    });

    newSocket.on('waiting', (data) => {
      setMultiplayerStatus('waiting');
    });

    newSocket.on('match_found', (data) => {
      setMultiplayerStatus('connected');
      setMultiplayerRole(data.role);
      setMultiplayerRoom(data.room);
      console.log('Match found! Role:', data.role, 'Room:', data.room);
      if (data.role === 'player1') {
        setActivePlayer('player');
      } else {
        setActivePlayer('opponent');
      }
    });

    newSocket.on('opponent_disconnected', () => {
      setMultiplayerStatus('disconnected');
      setMultiplayerRole(null);
      setMultiplayerRoom(null);
      alert("Opponent disconnected!");
    });
    
    newSocket.on('sync_state', (data) => {
       preventNextSync.current = true;
       // Unpack data and set opponent states
       if (data.timeline) setOpponentTimeline(data.timeline);
       if (data.locations) setOpponentLocations(data.locations);
       if (data.hero) setOpponentHeroCard(data.hero);
       if (data.archiveSize !== undefined) setOpponentArchive(new Array(data.archiveSize).fill({}));
       if (data.handSize !== undefined) setOpponentHand(new Array(data.handSize).fill({}));
       if (data.dungeon) setOpponentDungeon(data.dungeon);
       if (data.voidZone) setOpponentVoidZone(data.voidZone);
       if (data.hp !== undefined) setOpponentHp(data.hp);
       if (data.economy) setOpponentEconomy(data.economy);
       if (data.arrows) setArrows(prev => {
          // Merge arrows? Or just replace opponent arrows
          return [...prev.filter(a => a.color !== 'blue'), ...data.arrows.map(a => ({...a, color: 'blue'}))];
       });
       // Wait a tick before allowing sync again
       setTimeout(() => preventNextSync.current = false, 50);
    });
    
    newSocket.on('pass_phase', () => {
       preventNextSync.current = true;
       // Handle phase passing from opponent
       // We will call a function or just update phase state
       // Actually let's just trigger the advance logic without broadcasting
       // For now, let's set a state that triggers phase advance
    });

    return () => newSocket.close();
  }, []);

  const connectToQueue = () => {
    if (socket) {
      socket.emit('join_queue');
    }
  };
`;
content = content.replace(
  "  // Close context menu on global click",
  socketEffect + "\n  // Close context menu on global click"
);

fs.writeFileSync('src/components/GameBoard.jsx', content);
