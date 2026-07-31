const fs = require('fs');
let content = fs.readFileSync('src/components/GameBoard.jsx', 'utf8');

const matchmakingScreen = `
  if (multiplayerStatus !== 'connected') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '2rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Conquest TCG</h1>
        {multiplayerStatus === 'disconnected' ? (
           <button onClick={connectToQueue} style={{ padding: '15px 30px', fontSize: '1.5rem', background: '#4CAF50', border: 'none', color: 'white', borderRadius: '5px', cursor: 'pointer', transition: 'background 0.2s', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }} onMouseOver={(e) => e.target.style.background = '#45a049'} onMouseOut={(e) => e.target.style.background = '#4CAF50'}>Find Match</button>
        ) : (
           <div style={{ fontSize: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
             <div style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.3)', borderRadius: '50%', borderTopColor: '#4CAF50', animation: 'spin 1s ease-in-out infinite' }} />
             <span style={{ color: '#aaa' }}>Searching for opponent...</span>
             <style>
               {\`@keyframes spin { to { transform: rotate(360deg); } }\`}
             </style>
           </div>
        )}
      </div>
    );
  }

  return (
`;

content = content.replace("  return (", matchmakingScreen);

// Remove the MULTIPLAYER BAR from the game board
content = content.replace(
  /\{\/\* MULTIPLAYER BAR \*\/\}[\s\S]*?\{\/\* PHASE BAR \*\/\}/,
  "{/* PHASE BAR */}"
);

fs.writeFileSync('src/components/GameBoard.jsx', content);
