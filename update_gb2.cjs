const fs = require('fs');
let content = fs.readFileSync('src/components/GameBoard.jsx', 'utf8');

const broadcastEffect = `
  useEffect(() => {
    if (!socket || multiplayerStatus !== 'connected' || preventNextSync.current) return;
    
    // Broadcast state to opponent
    socket.emit('sync_state', {
      timeline: timeline,
      locations: playerLocations,
      hero: heroCard,
      archiveSize: archive.length,
      handSize: hand.length,
      dungeon: dungeon,
      voidZone: voidZone,
      hp: playerHp,
      economy: playerEconomy,
      arrows: arrows.filter(a => a.color !== 'blue') // only send my arrows
    });
  }, [timeline, playerLocations, heroCard, archive.length, hand.length, dungeon, voidZone, playerHp, playerEconomy, arrows, multiplayerStatus, socket]);
`;

content = content.replace(
  "  const connectToQueue = () => {",
  broadcastEffect + "\n  const connectToQueue = () => {"
);

// We need to broadcast pass_phase inside handlePhaseAdvance
content = content.replace(
  "const handlePhaseAdvance = () => {",
  "const handlePhaseAdvance = (fromSocket = false) => {\n    if (socket && multiplayerStatus === 'connected' && !fromSocket) socket.emit('pass_phase');"
);

// We need to handle the pass_phase socket event correctly now
content = content.replace(
  "    newSocket.on('pass_phase', () => {\n       preventNextSync.current = true;\n       // Handle phase passing from opponent\n       // We will call a function or just update phase state\n       // Actually let's just trigger the advance logic without broadcasting\n       // For now, let's set a state that triggers phase advance\n    });",
  "    newSocket.on('pass_phase', () => {\n       preventNextSync.current = true;\n       handlePhaseAdvance(true);\n       setTimeout(() => preventNextSync.current = false, 50);\n    });"
);

// Add the UI for connect queue
const uiReplacement = `
      {/* MULTIPLAYER BAR */}
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000, background: '#222', padding: '10px', borderRadius: '5px', color: '#fff', display: 'flex', gap: '10px', alignItems: 'center' }}>
         {multiplayerStatus === 'disconnected' && <button onClick={connectToQueue} style={{ padding: '5px 10px', background: '#4CAF50', border: 'none', color: 'white', borderRadius: '3px', cursor: 'pointer' }}>Find Match</button>}
         {multiplayerStatus === 'waiting' && <span>Waiting for opponent...</span>}
         {multiplayerStatus === 'connected' && <span style={{ color: '#4CAF50' }}>Connected to {multiplayerRoom} ({multiplayerRole})</span>}
      </div>

      {/* PHASE BAR */}
`;
content = content.replace("      {/* PHASE BAR */}", uiReplacement);

fs.writeFileSync('src/components/GameBoard.jsx', content);
