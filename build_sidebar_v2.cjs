const fs = require('fs');
let content = fs.readFileSync('src/components/GameBoard.jsx', 'utf8');

// 1. Add new states
const newStates = `
  const [playerName, setPlayerName] = useState('');
  const [opponentName, setOpponentName] = useState('Opponent');
  const [chatLog, setChatLog] = useState([]);
  const [chatInput, setChatInput] = useState('');

  const logEvent = (text) => {
    const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const msg = { sender: 'System', text, timestamp, type: 'system' };
    setChatLog(prev => [...prev, msg]);
    if (socket && multiplayerStatus === 'connected') {
      socket.emit('game_event', msg);
    }
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const msg = { sender: playerName || 'Player', text: chatInput, timestamp, type: 'chat' };
    setChatLog(prev => [...prev, msg]);
    if (socket && multiplayerStatus === 'connected') {
      socket.emit('chat_message', msg);
    }
    setChatInput('');
  };
`;
content = content.replace(
  "  const [multiplayerStatus, setMultiplayerStatus] = useState('disconnected'); // 'disconnected', 'waiting', 'connected'",
  "  const [multiplayerStatus, setMultiplayerStatus] = useState('disconnected'); // 'disconnected', 'waiting', 'connected'\n" + newStates
);

// 2. Update connectToQueue to pass playerName
content = content.replace(
  "socket.emit('join_queue');",
  "socket.emit('join_queue', { playerName: playerName || 'Player 1' });"
);

// 3. Update match_found to capture opponentName
content = content.replace(
  "setMultiplayerRoom(data.room);",
  "setMultiplayerRoom(data.room);\n      setOpponentName(data.opponentName || 'Player 2');\n      setChatLog(prev => [...prev, { type: 'system', text: `Match started against ${data.opponentName || 'Player 2'}!`, timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) }]);"
);

// 4. Update opponent_disconnected
content = content.replace(
  "alert(`Opponent disconnected!`);",
  "alert(`Opponent disconnected!`);\n      setChatLog(prev => [...prev, { type: 'system', text: `Opponent disconnected.`, timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) }]);"
);

// 5. Listeners for chat_message and game_event
content = content.replace(
  "newSocket.on('pass_phase', () => {",
  `newSocket.on('chat_message', (msg) => { setChatLog(prev => [...prev, msg]); });\n    newSocket.on('game_event', (msg) => { setChatLog(prev => [...prev, msg]); });\n\n    newSocket.on('pass_phase', () => {`
);

// 6. Lobby UI for player name
content = content.replace(
  "<h1 style={{ fontSize: '3rem', marginBottom: '2rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Conquest TCG</h1>",
  `<h1 style={{ fontSize: '3rem', marginBottom: '2rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Conquest TCG</h1>\n        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '20px', alignItems: 'center' }}>\n           <label>Display Name</label>\n           <input type="text" value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="Player 1" style={{ padding: '10px', fontSize: '1.2rem', borderRadius: '4px', border: '1px solid #555', background: '#333', color: '#fff', textAlign: 'center' }} />\n        </div>`
);

// 7. Inject logEvent into key functions (Phase Advance)
content = content.replace(
  "const handlePhaseAdvance = (fromSocket = false) => {",
  "const handlePhaseAdvance = (fromSocket = false) => {\n    if (!fromSocket) logEvent(`${playerName || 'Player'} passed the phase.`);"
);

// 8. Replace return wrapper and Zoom Modal
const layoutStart = `  return (
    <Xwrapper>
      <div className="game-container" style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
        <div className="game-board-area" style={{ flex: '1', position: 'relative', overflow: 'hidden' }}>
          <div className="game-board" style={{ height: '100%', overflow: 'auto' }}>`;

content = content.replace(/ {2}return \(\s*<Xwrapper>\s*<div className="game-board">/, layoutStart);

const layoutEnd = `          </div>
          {arrows.map(arrow => (
              <Xarrow key={arrow.id} start={arrow.startDomId} end={arrow.endDomId} color={arrow.color} strokeWidth={4} headSize={6} passProps={{style: {pointerEvents: 'none'}}} />
          ))}
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="right-sidebar" style={{ width: '350px', backgroundColor: '#111', borderLeft: '2px solid #333', display: 'flex', flexDirection: 'column', color: '#fff', fontFamily: 'Inter, sans-serif', zIndex: 50 }}>
            {/* Card Info Section */}
            <div className="sidebar-section card-info-section" style={{ height: '500px', flexShrink: 0, borderBottom: '1px solid #333', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px', overflow: 'hidden' }}>
               {zoomedCard ? (
                 <div style={{ transform: 'scale(1.1)', transformOrigin: 'top center', width: '100%', height: '100%', display: 'flex', justifyContent: 'center' }}>
                    <Card data={zoomedCard} />
                 </div>
               ) : (
                 <span style={{ color: '#666' }}>No card selected</span>
               )}
            </div>
            
            {/* Player List Section */}
            <div className="sidebar-section player-list-section" style={{ flex: '0 0 100px', borderBottom: '1px solid #333', padding: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
               <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #444', paddingBottom: '5px' }}>Players</h4>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#4CAF50' }}></div>
                  <span>{playerName || 'Player 1'} (You)</span>
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: isOpponentConnected ? '#f44336' : '#666' }}></div>
                  <span style={{ color: isOpponentConnected ? '#fff' : '#666' }}>
                     {isOpponentConnected ? opponentName : 'Waiting...'}
                  </span>
               </div>
            </div>

            {/* Chat Log Section */}
            <div className="sidebar-section chat-section" style={{ flex: '1', display: 'flex', flexDirection: 'column', backgroundColor: '#1a1a1a', minHeight: '0' }}>
               <h4 style={{ margin: 0, padding: '10px', borderBottom: '1px solid #333', background: '#222' }}>Messages</h4>
               <div className="chat-log" style={{ flex: '1', overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {chatLog.map((msg, idx) => (
                    <div key={idx} style={{ fontSize: '0.9rem', color: msg.type === 'system' ? '#8bc34a' : '#fff', wordBreak: 'break-word' }}>
                       <span style={{ color: '#888', fontSize: '0.8rem', marginRight: '5px' }}>[{msg.timestamp}]</span>
                       {msg.type === 'chat' && <strong style={{ color: msg.sender === (playerName || 'Player 1') ? '#4CAF50' : '#f44336' }}>{msg.sender}: </strong>}
                       <span>{msg.text}</span>
                    </div>
                  ))}
               </div>
               <div className="chat-input" style={{ display: 'flex', borderTop: '1px solid #333' }}>
                  <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} style={{ flex: '1', padding: '10px', background: '#222', border: 'none', color: '#fff', outline: 'none' }} placeholder="Say..." />
               </div>
            </div>
        </div>
      </div>
    </Xwrapper>
`;

// Remove the old zoom modal
content = content.replace(/\{\/\* Zoom Modal \*\/\}[\s\S]*?\{\/\* Annotation Modal \*\/\}/, "{/* Annotation Modal */}");

// Safely replace the end of the file
const originalEnd = `    </div>
    {arrows.map(arrow => (
        <Xarrow key={arrow.id} start={arrow.startDomId} end={arrow.endDomId} color={arrow.color} strokeWidth={4} headSize={6} passProps={{style: {pointerEvents: 'none'}}} />
    ))}
    </div>
    </Xwrapper>`;

content = content.replace(originalEnd, layoutEnd);

fs.writeFileSync('src/components/GameBoard.jsx', content);
