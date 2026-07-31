const fs = require('fs');
let content = fs.readFileSync('src/components/GameBoard.jsx', 'utf8');

const matchmakingScreen = `
  if (multiplayerStatus !== 'connected') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '2rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Conquest TCG</h1>
        
        {multiplayerStatus === 'disconnected' ? (
           <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
             
             {/* Deck Selection */}
             <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px'}}>
                <h3 style={{ margin: 0 }}>Select your deck:</h3>
                {Object.keys(savedDecks).length > 0 ? (
                  <select onChange={loadDeck} className="editor-select" value={heroCard ? "loaded" : ""} style={{padding: '10px', fontSize: '1.2rem'}}>
                    <option value="" disabled>Select Deck...</option>
                    {Object.keys(savedDecks).map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                    {heroCard && <option value="loaded" disabled>Deck Loaded!</option>}
                  </select>
                ) : (
                  <span style={{ color: '#ff4444' }}>No saved decks found in local storage!</span>
                )}
             </div>

             <button 
                onClick={connectToQueue} 
                disabled={!heroCard}
                style={{ 
                   padding: '15px 30px', 
                   fontSize: '1.5rem', 
                   background: heroCard ? '#4CAF50' : '#555', 
                   border: 'none', 
                   color: heroCard ? 'white' : '#888', 
                   borderRadius: '5px', 
                   cursor: heroCard ? 'pointer' : 'not-allowed', 
                   transition: 'background 0.2s', 
                   boxShadow: '0 4px 6px rgba(0,0,0,0.3)' 
                }} 
                onMouseOver={(e) => { if(heroCard) e.target.style.background = '#45a049' }} 
                onMouseOut={(e) => { if(heroCard) e.target.style.background = '#4CAF50' }}
             >
                Find Match
             </button>
             {!heroCard && <span style={{ fontSize: '0.9rem', color: '#aaa' }}>Please select a deck first.</span>}
           </div>
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

// Replace the existing matchmaking screen
content = content.replace(/if \(multiplayerStatus !== 'connected'\) \{[\s\S]*?return \(/, matchmakingScreen);

// Remove the old load deck UI from the game board to avoid double-loading and confusion
content = content.replace(
  /\{\(!heroCard \|\| !opponentHeroCard\) && \([\s\S]*?\)\}/,
  ""
);

fs.writeFileSync('src/components/GameBoard.jsx', content);
