const fs = require('fs');
let content = fs.readFileSync('src/components/GameBoard.jsx', 'utf8');

const startIndex = content.indexOf('  const handlePhaseAdvance = (fromSocket = false) => {');
const endIndex = content.indexOf('  if (!gameStarted) {', startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  const replacement =   const handlePhaseAdvance = (fromSocket = false) => {
    if (fromSocket) return; // Prevent loop, we handle socket in the listener directly now
    
    setArrows([]);
    if (discardState.active) {
      alert('You must discard ' + discardState.count + ' more card(s) before advancing!');
      return;
    }

    const currentIndex = phases.findIndex(p => p.id === currentPhase);
    
    if (currentIndex === phases.length - 1) {
      const activeHand = activePlayer === 'player' ? hand : opponentHand;
      if (activeHand.length > 7) {
         setDiscardState({ active: true, count: activeHand.length - 7 });
         return; 
      }
    }

    let nextPhaseId;
    let nextActivePlayer = activePlayer;
    let nextTurnNumber = turnNumber;

    if (currentIndex === phases.length - 1) {
      nextActivePlayer = activePlayer === 'player' ? 'opponent' : 'player';
      const isEndOfRound = (multiplayerRoleRef.current === 'player1' && activePlayer === 'opponent') || (multiplayerRoleRef.current === 'player2' && activePlayer === 'player');
      nextTurnNumber = isEndOfRound ? turnNumber + 1 : turnNumber;
      
      setActivePlayer(nextActivePlayer);
      setLocationsPlayedThisTurn(0);
      setPlayerAttacksThisTurn(0);
      setOpponentAttacksThisTurn(0);
      
      if (nextActivePlayer === 'player') {
         setPlayerEconomy({ action: 1, bonusAction: 1, reaction: 1 });
      } else {
         setOpponentEconomy({ action: 1, bonusAction: 1, reaction: 1 });
      }
      nextPhaseId = phases[0].id;
      if (isEndOfRound) setTurnNumber(nextTurnNumber);
    } else {
      nextPhaseId = phases[currentIndex + 1].id;
    }

    setCurrentPhase(nextPhaseId);
    
    logEvent((playerName || 'Player') + ' passed the phase.');
    if (socket && multiplayerStatus === 'connected') {
      socket.emit('pass_phase', {
        exactState: {
          phase: nextPhaseId,
          activePlayer: nextActivePlayer,
          turnNumber: nextTurnNumber
        }
      });
    }
  };

;
  
  content = content.substring(0, startIndex) + replacement + content.substring(endIndex);
  fs.writeFileSync('src/components/GameBoard.jsx', content);
  console.log('Success');
} else {
  console.log('Failed to find indices');
}
