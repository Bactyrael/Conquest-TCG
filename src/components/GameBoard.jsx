import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './GameBoard.css';
import Card from './Card';
import cardDatabase from '../data/cardDatabase.json';

export default function GameBoard() {
  const [savedDecks, setSavedDecks] = useState({});
  const [heroCard, setHeroCard] = useState(null);
  const [zoomedCard, setZoomedCard] = useState(null);
  const [viewingZone, setViewingZone] = useState(null);
  
  // Phase Tracking
  const [currentPhase, setCurrentPhase] = useState('upkeep');
  const [activePlayer, setActivePlayer] = useState('player'); // 'player' or 'opponent'
  const [turnNumber, setTurnNumber] = useState(1);
  const [mulliganState, setMulliganState] = useState({ active: false, count: 7 });

  // Automation: Reaction Timer & Dice
  const [reactionTimer, setReactionTimer] = useState({
    active: false,
    message: '',
    timeRemaining: 0,
    maxTime: 50, // 5 seconds (50 ticks)
    shouldRollDice: false,
    targetId: null,
    actionType: null,
    diceParams: null
  });
  const [diceRoll, setDiceRoll] = useState(null);

  useEffect(() => {
    if (!reactionTimer.active) return;
    if (reactionTimer.timeRemaining <= 0) {
      setReactionTimer(prev => ({ ...prev, active: false }));
      if (reactionTimer.shouldRollDice) {
         console.log("Timer expired, rolling dice with params:", reactionTimer.diceParams);
         if (reactionTimer.diceParams) {
           rollDice(reactionTimer.diceParams.count, reactionTimer.diceParams.faces, reactionTimer.diceParams.modifierStat);
         } else {
           rollDice(1, 20, null);
         }
      }
      return;
    }
    const interval = setInterval(() => {
      setReactionTimer(prev => ({ ...prev, timeRemaining: prev.timeRemaining - 1 }));
    }, 100);
    return () => clearInterval(interval);
  }, [reactionTimer.active, reactionTimer.timeRemaining]);

// Parse Attack Logic
  const parseAttackLogic = (card) => {
    let count = 1, faces = 20, statRaw = null;
    if (!card) return { count, faces, modifierStat: statRaw };

    if (card.type === 'Hero' && card.subtype) {
      const match = card.subtype.match(/(\d+)d(\d+)\s*\+\s*([a-zA-Z]+)/i);
      if (match) {
        count = parseInt(match[1], 10);
        faces = parseInt(match[2], 10);
        statRaw = match[3];
      }
    } else if (card.rulesText) {
      const match = card.rulesText.match(/(\d+)d(\d+)\s+plus\s+your\s+([a-zA-Z]+)/i);
      if (match) {
        count = parseInt(match[1], 10);
        faces = parseInt(match[2], 10);
        statRaw = match[3];
      }
    }
    
    let modifierStat = null;
    if (statRaw) {
       const s = statRaw.toLowerCase();
       if (s.startsWith('str')) modifierStat = 'Strength';
       else if (s.startsWith('dex')) modifierStat = 'Dexterity';
       else if (s.startsWith('con')) modifierStat = 'Constitution';
       else if (s.startsWith('int')) modifierStat = 'Intelligence';
       else if (s.startsWith('wis')) modifierStat = 'Wisdom';
       else if (s.startsWith('luc') || s.startsWith('lck')) modifierStat = 'Luck';
    }

    return { count, faces, modifierStat };
  };

// Calculate Dynamic Stats
  const getStat = (statFull) => {
    let val = 0;
    const locs = activePlayer === 'player' ? playerLocations : opponentLocations;
    [...locs, ...timeline].forEach(card => {
      if (card.rulesText) {
        const statListRegex = /([-+])(\d+)((?:\s*(?:and|,)?\s*(?:Strength|Dexterity|Constitution|Intelligence|Wisdom|Luck))+)/gi;
        const matches = [...card.rulesText.matchAll(statListRegex)];
        for (const match of matches) {
          const sign = match[1] === '-' ? -1 : 1;
          const amount = parseInt(match[2], 10);
          const affectedStatsText = match[3];
          if (new RegExp(`\\b${statFull}\\b`, 'i').test(affectedStatsText)) {
            val += sign * amount;
          }
        }
      }
    });
    return val;
  };

  const rollDice = (count = 1, max = 20, modifierStat = null) => {
    console.log("rollDice called!", count, max, modifierStat);
    let modValue = 0;
    try {
      modValue = modifierStat ? getStat(modifierStat) : 0;
      console.log("modValue calculated:", modValue);
      setDiceRoll({ active: true, results: Array(count).fill(1), max, modifierStat, modValue, final: false, totalDamage: 0 });
    } catch(err) {
      console.error("Error in rollDice init:", err);
    }
    
    let ticks = 0;
    const rollAnim = setInterval(() => {
      setDiceRoll(prev => ({ 
         ...prev, 
         results: Array(count).fill(0).map(() => Math.floor(Math.random() * max) + 1) 
      }));
      ticks++;
      if (ticks > 15) {
        clearInterval(rollAnim);
        const finalResults = Array(count).fill(0).map(() => Math.floor(Math.random() * max) + 1);
        const sum = finalResults.reduce((a, b) => a + b, 0);
        const finalTotal = sum + modValue;
        
        setDiceRoll({ active: true, results: finalResults, max, modifierStat, modValue, final: true, totalDamage: finalTotal });
        
        // HP Reduction Logic
        if (reactionTimer.actionType === 'attack' || reactionTimer.actionType === 'card-play') {
          if (reactionTimer.targetId === 'opponent-hero') {
             setOpponentHp(prev => prev - finalTotal);
          } else if (reactionTimer.targetId === 'player-hero') {
             setPlayerHp(prev => prev - finalTotal);
          } else {
             if (activePlayer === 'player') setOpponentHp(prev => prev - finalTotal);
             else setPlayerHp(prev => prev - finalTotal);
          }
        }
        
        setTimeout(() => setDiceRoll(null), 4000);
      }
    }, 80);
  };

  const triggerReactionTimer = (cardName, shouldRollDice = false, targetId = null, actionType = 'card-play', diceParams = null) => {
    console.log("triggerReactionTimer", cardName, shouldRollDice, targetId, actionType, diceParams);
    setReactionTimer({
      active: true,
      message: `Waiting for Reactions to: ${cardName}...`,
      timeRemaining: 50,
      maxTime: 50,
      shouldRollDice,
      targetId,
      actionType,
      diceParams,
    });
  };
  
  const phases = [
    { id: 'upkeep', label: 'Upkeep', icon: '⚙️' },
    { id: 'draw', label: 'Draw', icon: '🎴' },
    { id: 'action', label: 'Action', icon: '⚡' },
    { id: 'combat', label: 'Combat', icon: '⚔️' },
    { id: 'end', label: 'End', icon: '🏁' }
  ];

  // Local Game State
  const [archive, setArchive] = useState([]);
  const [hand, setHand] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [dungeon, setDungeon] = useState([]);
  const [voidZone, setVoidZone] = useState([]);
  
  // New Location/Attachments Zone State
  const [playerLocations, setPlayerLocations] = useState([]);

  // Opponent Local Game State
  const [opponentArchive, setOpponentArchive] = useState([]);
  const [opponentHand, setOpponentHand] = useState([]);
  const [opponentTimeline, setOpponentTimeline] = useState([]);
  const [opponentDungeon, setOpponentDungeon] = useState([]);
  const [opponentVoidZone, setOpponentVoidZone] = useState([]);
  const [opponentLocations, setOpponentLocations] = useState([]);
  const [opponentHeroCard, setOpponentHeroCard] = useState(null);
  
  const [playerHp, setPlayerHp] = useState(20);
  const [opponentHp, setOpponentHp] = useState(20);

  // Targeting System State
  const [targetingState, setTargetingState] = useState({
    active: false,
    sourceCard: null,
    sourceZone: null,
    targetZone: null,
    actionType: null // 'attack' or 'card-play'
  });

  // Context Menu State
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    targetType: null,
    targetData: null
  });

  // Archive View Modal State
  const [archiveView, setArchiveView] = useState({
    visible: false,
    mode: 'all', // 'all' or 'topX'
    count: 0
  });

  // Close context menu on global click
  useEffect(() => {
    const handleClick = () => {
      if (contextMenu.visible) {
        setContextMenu(prev => ({ ...prev, visible: false }));
      }
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [contextMenu.visible]);

  useEffect(() => {
    const loaded = localStorage.getItem('conquest-tcg-decks');
    if (loaded) {
      setSavedDecks(JSON.parse(loaded));
    }
  }, []);

  const loadDeck = (e) => {
    const deckName = e.target.value;
    if (!deckName) return;
    
    let rawDeck = savedDecks[deckName] || [];
    
    // Sync with fresh database to grab updated image URLs
    let freshDeck = rawDeck.map(c => {
      const dbCard = cardDatabase.find(dbC => dbC.name === c.name);
      return { ...(dbCard || c), uid: Math.random().toString() };
    });
    
    // Find Hero
    const hero = freshDeck.find(c => c.type === 'Hero') || null;
    setHeroCard(hero);
    
    // The rest is the archive
    let remainingDeck = freshDeck.filter(c => c.type !== 'Hero');
    remainingDeck.sort(() => Math.random() - 0.5); // Shuffle
    
    setArchive(remainingDeck);
    setHand([]);
    setTimeline([]);
    setDungeon([]);
    setVoidZone([]);
    setPlayerLocations([]);
    setCurrentPhase('upkeep');
    setTurnNumber(1);
    setMulliganState({ active: false, count: 7 });
  };

  const loadOpponentDeck = (e) => {
    const deckName = e.target.value;
    if (!deckName) return;
    
    let rawDeck = savedDecks[deckName] || [];
    let freshDeck = rawDeck.map(c => {
      const dbCard = cardDatabase.find(dbC => dbC.name === c.name);
      return { ...(dbCard || c), uid: Math.random().toString() };
    });
    
    const hero = freshDeck.find(c => c.type === 'Hero') || null;
    setOpponentHeroCard(hero);
    
    let remainingDeck = freshDeck.filter(c => c.type !== 'Hero');
    remainingDeck.sort(() => Math.random() - 0.5);
    
    // Draw 7 cards for opponent
    const initialHand = remainingDeck.splice(-7);
    
    setOpponentArchive(remainingDeck);
    setOpponentHand(initialHand);
    setOpponentTimeline([]);
    setOpponentDungeon([]);
    setOpponentVoidZone([]);
    setOpponentLocations([]);
    setOpponentHp(20);
  };

  const handleHeroAttack = (player) => {
    setTargetingState({
      active: true,
      sourceCard: player === 'player' ? heroCard : opponentHeroCard,
      sourceZone: player === 'player' ? 'player-hero' : 'opponent-hero',
      targetZone: null,
      actionType: 'attack'
    });
  };

  const handleTargetClick = (targetId) => {
    if (!targetingState.active) return;
    
    const card = targetingState.sourceCard;
    const diceParams = parseAttackLogic(card);
    
    // Resolve Targeting
    if (targetingState.actionType === 'attack') {
      const heroName = card ? card.name : 'Hero';
      triggerReactionTimer(heroName + ' Attack', true, targetId, 'attack', diceParams);
    } else if (targetingState.actionType === 'card-play') {
      const shouldRoll = card.rulesText && card.rulesText.toLowerCase().includes('roll');
      
      // Officially play the card
      if (targetingState.targetZone === 'timeline') {
        setTimeline(prev => [...prev, card]);
      } else if (targetingState.targetZone === 'locations') {
        setPlayerLocations(prev => [...prev, card]);
      } else if (targetingState.targetZone === 'opponent-locations') {
        setOpponentLocations(prev => [...prev, card]);
      }
      
      triggerReactionTimer(card.name, shouldRoll, targetId, 'card-play', diceParams);
    }
    
    setTargetingState({ active: false, sourceCard: null, sourceZone: null, targetZone: null, actionType: null });
  };

  const handleKeep = () => {
    setMulliganState({ active: false, count: 7 });
  };

  const handleMulligan = () => {
    if (mulliganState.count <= 1) return;
    const newCount = mulliganState.count - 1;
    
    setArchive(prev => {
       const newArchive = [...hand, ...prev]; // Send hand to bottom (index 0)
       const newHand = newArchive.splice(-newCount); // Draw from top
       setHand(newHand);
       return newArchive;
    });
    setMulliganState({ active: true, count: newCount });
  };

  // Game Actions
  const drawCard = () => {
    if (archive.length === 0) return;
    if (hand.length >= 7) {
      alert("Hand is full! (Max 7)");
      return;
    }
    const newArchive = [...archive];
    const card = newArchive.pop();
    setArchive(newArchive);
    setHand([...hand, card]);
  };

  const playCard = (uid) => {
    const card = hand.find(c => c.uid === uid);
    if (!card) return;
    setHand(hand.filter(c => c.uid !== uid));
    setTimeline([...timeline, card]);
    const shouldRoll = card.rulesText && card.rulesText.toLowerCase().includes('roll');
    triggerReactionTimer(card.name, shouldRoll);
  };

  const resolveToDungeon = (uid) => {
    const card = timeline.find(c => c.uid === uid);
    if (!card) return;
    setTimeline(timeline.filter(c => c.uid !== uid));
    setDungeon([...dungeon, card]);
  };

  const resolveToVoid = (uid) => {
    const card = timeline.find(c => c.uid === uid);
    if (!card) return;
    setTimeline(timeline.filter(c => c.uid !== uid));
    setVoidZone([...voidZone, card]);
  };
  
  const playToLocation = (uid) => {
    const card = timeline.find(c => c.uid === uid);
    if (!card) return;
    setTimeline(timeline.filter(c => c.uid !== uid));
    setPlayerLocations([...playerLocations, card]);
  };

  // Context Menu Logic
  const handleContextMenu = (e, targetType, targetData) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      targetType,
      targetData
    });
  };

  const updateCardState = (uid, source, updates) => {
    if (source === 'timeline') {
      setTimeline(prev => prev.map(c => c.uid === uid ? { ...c, ...updates } : c));
    } else if (source === 'locations') {
      setPlayerLocations(prev => prev.map(c => c.uid === uid ? { ...c, ...updates } : c));
    } else if (source === 'hero') {
      setHeroCard(prev => prev && prev.uid === uid ? { ...prev, ...updates } : prev);
    }
  };

  const actionToggleTap = (card, source) => {
    updateCardState(card.uid, source, { isTapped: !card.isTapped });
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const actionAddCounter = (card, source) => {
    updateCardState(card.uid, source, { counters: (card.counters || 0) + 1 });
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const actionRemoveCounter = (card, source) => {
    updateCardState(card.uid, source, { counters: Math.max(0, (card.counters || 0) - 1) });
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  // Context Menu Actions
  const actionShuffleArchive = () => {
    setArchive(prev => [...prev].sort(() => Math.random() - 0.5));
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const actionMillToDungeon = () => {
    if (archive.length === 0) return;
    const newArchive = [...archive];
    const topCard = newArchive.pop();
    setArchive(newArchive);
    setDungeon(prev => [...prev, topCard]);
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const actionSendToVoid = (card, source) => {
    if (source === 'timeline') setTimeline(prev => prev.filter(c => c.uid !== card.uid));
    if (source === 'locations') setPlayerLocations(prev => prev.filter(c => c.uid !== card.uid));
    setVoidZone(prev => [...prev, card]);
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const actionSendToDungeon = (card, source) => {
    if (source === 'timeline') setTimeline(prev => prev.filter(c => c.uid !== card.uid));
    if (source === 'locations') setPlayerLocations(prev => prev.filter(c => c.uid !== card.uid));
    setDungeon(prev => [...prev, card]);
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const actionSendToBottom = (card, source) => {
    if (source === 'timeline') setTimeline(prev => prev.filter(c => c.uid !== card.uid));
    if (source === 'locations') setPlayerLocations(prev => prev.filter(c => c.uid !== card.uid));
    setArchive(prev => [card, ...prev]); // Unshift adds to bottom (index 0 is bottom in this implementation because drawCard uses pop)
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const actionReturnToHand = (card, source) => {
    if (source === 'timeline') setTimeline(prev => prev.filter(c => c.uid !== card.uid));
    if (source === 'locations') setPlayerLocations(prev => prev.filter(c => c.uid !== card.uid));
    setHand(prev => [...prev, card]);
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const actionRetrieveToHand = (card, source) => {
    if (source === 'void') setVoidZone(prev => prev.filter(c => c.uid !== card.uid));
    if (source === 'dungeon') setDungeon(prev => prev.filter(c => c.uid !== card.uid));
    setHand(prev => [...prev, card]);
    setContextMenu(prev => ({ ...prev, visible: false }));
    if (viewingZone === source && (source === 'void' ? voidZone : dungeon).length <= 1) {
       setViewingZone(null); // Close modal if last card retrieved
    }
  };

  const actionRetrieveToTimeline = (card, source) => {
    if (source === 'void') setVoidZone(prev => prev.filter(c => c.uid !== card.uid));
    if (source === 'dungeon') setDungeon(prev => prev.filter(c => c.uid !== card.uid));
    setTimeline(prev => [...prev, card]);
    setContextMenu(prev => ({ ...prev, visible: false }));
    if (viewingZone === source && (source === 'void' ? voidZone : dungeon).length <= 1) {
       setViewingZone(null);
    }
  };

  const actionArchiveMoveToTop = (card) => {
    setArchive(prev => [...prev.filter(c => c.uid !== card.uid), card]);
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const actionArchiveMoveToBottom = (card) => {
    setArchive(prev => [card, ...prev.filter(c => c.uid !== card.uid)]);
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const actionArchiveToHand = (card) => {
    setArchive(prev => prev.filter(c => c.uid !== card.uid));
    setHand(prev => [...prev, card]);
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const actionArchiveToDungeon = (card) => {
    setArchive(prev => prev.filter(c => c.uid !== card.uid));
    setDungeon(prev => [...prev, card]);
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const actionArchiveToVoid = (card) => {
    setArchive(prev => prev.filter(c => c.uid !== card.uid));
    setVoidZone(prev => [...prev, card]);
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const actionRevealCard = (card) => {
    alert(`Revealed: ${card.name}`);
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  // Drag and Drop Logic
  const handleDragStart = (e, uid, sourceZone) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ uid, sourceZone }));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  
  
  const canPlayCard = (card) => {
    // Phase restrictions
    if (card.type !== 'Reaction' && currentPhase !== 'action') return false;
    
    // Requirements check
    if (card.requirements) {
      if ((card.requirements.str || 0) > getStat('Strength')) return false;
      if ((card.requirements.dex || 0) > getStat('Dexterity')) return false;
      if ((card.requirements.con || 0) > getStat('Constitution')) return false;
      if ((card.requirements.int || 0) > getStat('Intelligence')) return false;
      if ((card.requirements.wis || 0) > getStat('Wisdom')) return false;
      if ((card.requirements.luc || 0) > getStat('Luck')) return false;
    }
    return true;
  };

  const handleDrop = (e, targetZone) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;

    let parsed;
    try { parsed = JSON.parse(data); } catch (err) { return; }

    const { uid, sourceZone } = parsed;
    if (sourceZone === targetZone) return; // Ignore drops in the same zone

    let cardToMove = null;

    // 1. Remove from source
    if (sourceZone === 'hand') {
      cardToMove = hand.find(c => c.uid === uid);
      if (cardToMove) setHand(prev => prev.filter(c => c.uid !== uid));
    } else if (sourceZone === 'opponent-hand') {
      cardToMove = opponentHand.find(c => c.uid === uid);
      if (cardToMove) setOpponentHand(prev => prev.filter(c => c.uid !== uid));
    } else if (sourceZone === 'timeline') {
      cardToMove = timeline.find(c => c.uid === uid);
      if (cardToMove) setTimeline(prev => prev.filter(c => c.uid !== uid));
    } else if (sourceZone === 'locations') {
      cardToMove = playerLocations.find(c => c.uid === uid);
      if (cardToMove) setPlayerLocations(prev => prev.filter(c => c.uid !== uid));
    }

    if (!cardToMove) return;

    const shouldRoll = cardToMove.rulesText && cardToMove.rulesText.toLowerCase().includes('roll');

    // Strict Enforcement for playing cards to the board
    if ((sourceZone === 'hand' || sourceZone === 'opponent-hand') && (targetZone === 'timeline' || targetZone === 'locations' || targetZone === 'opponent-locations')) {
      if (!canPlayCard(cardToMove)) {
        alert("Cannot play this card: Requirements not met or wrong phase.");
        return;
      }
    }

    // 2. Add to target or Intercept
    if (cardToMove.rulesText && cardToMove.rulesText.toLowerCase().includes('target') && (targetZone === 'timeline' || targetZone === 'locations' || targetZone === 'opponent-locations')) {
       setTargetingState({
          active: true,
          sourceCard: cardToMove,
          sourceZone: sourceZone,
          targetZone: targetZone,
          actionType: 'card-play'
       });
       return;
    }

    if (targetZone === 'timeline') {
      setTimeline(prev => [...prev, cardToMove]);
      if (sourceZone === 'hand' || sourceZone === 'opponent-hand') triggerReactionTimer(cardToMove.name, shouldRoll, null, 'card-play', parseAttackLogic(cardToMove));
    } else if (targetZone === 'dungeon') {
      setDungeon(prev => [...prev, cardToMove]);
    } else if (targetZone === 'void') {
      setVoidZone(prev => [...prev, cardToMove]);
    } else if (targetZone === 'locations') {
      setPlayerLocations(prev => [...prev, cardToMove]);
      if (sourceZone === 'hand') triggerReactionTimer(cardToMove.name, shouldRoll, null, 'card-play', parseAttackLogic(cardToMove));
    } else if (targetZone === 'opponent-locations') {
      setOpponentLocations(prev => [...prev, cardToMove]);
      if (sourceZone === 'opponent-hand') triggerReactionTimer(cardToMove.name, shouldRoll, null, 'card-play', parseAttackLogic(cardToMove));
    }
  };

  // Derived state for grouped locations
  const groupedLocations = [];
  playerLocations.forEach((loc) => {
    let placed = false;
    for (let group of groupedLocations) {
      if (group[0].name === loc.name && group.length < 3) {
        group.push(loc);
        placed = true;
        break;
      }
    }
    if (!placed) {
      groupedLocations.push([loc]);
    }
  });

  const handlePhaseAdvance = () => {
    const currentIndex = phases.findIndex(p => p.id === currentPhase);
    let nextPhaseId;
    if (currentIndex === phases.length - 1) {
      // Passing from End phase -> Change active player and go to upkeep
      setActivePlayer(prev => prev === 'player' ? 'opponent' : 'player');
      nextPhaseId = phases[0].id;
      if (activePlayer === 'opponent') setTurnNumber(prev => prev + 1);
    } else {
      nextPhaseId = phases[currentIndex + 1].id;
    }

    setCurrentPhase(nextPhaseId);

    // Automation: Auto Draw
    if (nextPhaseId === 'draw' && activePlayer === 'player') {
      if (turnNumber === 1) {
        setArchive(prev => {
          const newArchive = [...prev];
          const initialHand = newArchive.splice(-7);
          setHand(initialHand);
          return newArchive;
        });
        setMulliganState({ active: true, count: 7 });
      } else {
        setArchive(prev => {
          if (prev.length > 0) {
             setHand(h => [...h, prev[prev.length - 1]]);
             return prev.slice(0, -1);
          }
          return prev;
        });
      }
    }
  };

  return (
    <div className="game-board">
      
      {/* PHASE BAR */}
      <div className="phase-bar">
        <div className="turn-counter">
          Turn {turnNumber}
        </div>
        <button className="phase-btn pass-btn" onClick={handlePhaseAdvance}>
          🔄 Pass
        </button>
        <div className="phase-list">
          {phases.map(phase => (
            <div 
              key={phase.id} 
              className={`phase-item ${currentPhase === phase.id ? 'active' : ''}`}
              onClick={() => setCurrentPhase(phase.id)}
            >
              <span className="phase-icon">{phase.icon}</span>
              <span className="phase-label">{phase.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="game-board-content">
        {/* OPPONENT AREA */}
      <div className={`player-area opponent-area ${activePlayer === 'opponent' ? 'active-turn' : ''}`}>
        
        {/* Opponent Hand (Top) */}
        <div className="player-hand-container opponent-hand-container">
          <div className="player-hand">
            {opponentHand.map((card, i) => (
               <div className="hand-card-wrapper" key={i} draggable={activePlayer === 'opponent'} onDragStart={(e) => handleDragStart(e, card.uid, 'opponent-hand')}>
                 {activePlayer === 'opponent' ? (
                   <Card data={card} />
                 ) : (
                   <img src="/cards/backs/000_back.png" alt="Card Back" style={{width: '100%', height: '100%', borderRadius: '12px'}} />
                 )}
               </div>
            ))}
          </div>
        </div>

        <div className="player-area-main-row">
          
          <div className="battlefield-core">
            <div className="stat-tracker-vertical">
              <div className="tracker-box str">STR: 0</div>
              <div className="tracker-box dex">DEX: 0</div>
              <div className="tracker-box con">CON: 0</div>
              <div className="tracker-box int">INT: 0</div>
              <div className="tracker-box wis">WIS: 0</div>
              <div className="tracker-box luc">LUC: 0</div>
            </div>
            
            <div className="hero-zone">
              <div className="hero-card-wrapper" style={{position: 'relative'}}>
                 {opponentHeroCard ? (
                   <>
                     <Card data={opponentHeroCard} />
                     {currentPhase === 'combat' && activePlayer === 'opponent' && !targetingState.active && (
                        <button className="attack-btn" onClick={(e) => { e.stopPropagation(); handleHeroAttack('opponent'); }}>⚔️ Attack</button>
                     )}
                     {targetingState.active && targetingState.sourceZone !== 'opponent-hero' && (
                        <div className="target-overlay" onClick={() => handleTargetClick('opponent-hero')}>🎯 Target</div>
                     )}
                   </>
                 ) : (
                   <div className="mini-hero" style={{border: '2px dashed #444'}}>
                      <div style={{color: '#555', textAlign: 'center', padding: '20px'}}>Opponent Hero</div>
                   </div>
                 )}
              </div>
            </div>
            
            <div className="player-stats-vertical">
              <div className="stat-box hp">HP: {opponentHp}</div>
              <div className="stat-box def">DEF: 0</div>
              <div className="stat-box res">RES: 0</div>
            </div>

            <div className="location-zone" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'opponent-locations')}>
              {opponentLocations.length === 0 && <div className="location-slot empty">Location</div>}
              {opponentLocations.map(loc => (
                 <div key={loc.uid} className="location-slot active">
                   <Card data={loc} />
                 </div>
              ))}
            </div>
          </div>

          <div className="deck-zones">
             <div className="zone-slot archive">
               <img src="/cards/backs/000_back.png" alt="Opponent Deck" className="deck-back-image" />
               <div className="archive-count">{opponentArchive.length}</div>
             </div>
             <div className="zone-slot dungeon">Dungeon</div>
             <div className="zone-slot void">Void</div>
          </div>
        </div>
      </div>

      {/* TIMELINE AREA (Middle) */}
      <div className="timeline-area">
         {(!heroCard || !opponentHeroCard) && (
           <div style={{position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
              <h2 style={{color: '#fff', textShadow: '2px 2px 4px #000'}}>Load a Deck to Begin</h2>
              {Object.keys(savedDecks).length > 0 ? (
                <div style={{display: 'flex', gap: '1rem', marginTop: '10px'}}>
                  <select onChange={loadDeck} className="editor-select" value="" style={{padding: '10px', fontSize: '1.2rem'}}>
                    <option value="" disabled>Select Deck...</option>
                    {Object.keys(savedDecks).map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                  <select onChange={loadOpponentDeck} className="editor-select" value="" style={{padding: '10px', fontSize: '1.2rem', borderColor: '#ff4500'}}>
                    <option value="" disabled>Select Opponent...</option>
                    {Object.keys(savedDecks).map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <p style={{color: '#aaa'}}>No decks saved. Build one in the Deck Builder!</p>
              )}
           </div>
         )}
         
         <div className="timeline-track"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'timeline')}
         >
            {timeline.length === 0 && heroCard && <span>Timeline / Active Cards (Drag or click hand to play)</span>}
            <AnimatePresence mode="popLayout">
              {timeline.map((card) => (
                <motion.div 
                  className={`timeline-card-wrapper ${card.isTapped ? 'tapped' : ''}`}
                  key={card.uid}
                  draggable
                  onDragStart={(e) => handleDragStart(e, card.uid, 'timeline')}
                  onContextMenu={(e) => handleContextMenu(e, 'card_timeline', card)}
                  onDoubleClick={() => actionToggleTap(card, 'timeline')}
                  initial={{ opacity: 0, scale: 0.5, y: 50 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0, y: -50 }}
                  layout
                >
                  {card.counters > 0 && <div className="card-counter-badge">{card.counters}</div>}
                  <Card data={card} />
                  <button className="board-zoom-btn" onClick={(e) => { e.stopPropagation(); setZoomedCard(card); }}>🔍</button>
                </motion.div>
              ))}
            </AnimatePresence>
         </div>
      </div>

      {/* PLAYER AREA */}
      <div className={`player-area ${activePlayer === 'player' ? 'active-turn' : ''}`}>
        <div className="player-area-main-row">
          
          <div className="battlefield-core">
            <div className="stat-tracker-vertical">
              <div className="tracker-box str">STR: {getStat('Strength')}</div>
              <div className="tracker-box dex">DEX: {getStat('Dexterity')}</div>
              <div className="tracker-box con">CON: {getStat('Constitution')}</div>
              <div className="tracker-box int">INT: {getStat('Intelligence')}</div>
              <div className="tracker-box wis">WIS: {getStat('Wisdom')}</div>
              <div className="tracker-box luc">LUC: {getStat('Luck')}</div>
            </div>
            
            <div className="hero-zone">
              <div className="hero-card-wrapper" onContextMenu={(e) => heroCard && handleContextMenu(e, 'card_hero', heroCard)} style={{position: 'relative'}}>
                 {heroCard ? (
                   <>
                     <Card data={heroCard} />
                     {heroCard.counters > 0 && <div className="card-counter-badge">{heroCard.counters}</div>}
                     <button className="board-zoom-btn" onClick={(e) => { e.stopPropagation(); setZoomedCard(heroCard); }}>🔍</button>
                     {currentPhase === 'combat' && activePlayer === 'player' && !targetingState.active && (
                        <button className="attack-btn" onClick={(e) => { e.stopPropagation(); handleHeroAttack('player'); }}>⚔️ Attack</button>
                     )}
                     {targetingState.active && targetingState.sourceZone !== 'player-hero' && (
                        <div className="target-overlay" onClick={() => handleTargetClick('player-hero')}>🎯 Target</div>
                     )}
                   </>
                 ) : (
                   <div className="mini-hero">
                      <div>Hero</div>
                   </div>
                 )}
              </div>
            </div>
            
            <div className="player-stats-vertical">
              <div className="stat-box hp">HP: {playerHp}</div>
              <div className="stat-box def">DEF: 0</div>
              <div className="stat-box res">RES: 0</div>
            </div>

            <div className="location-zone"
                 onDragOver={handleDragOver}
                 onDrop={(e) => handleDrop(e, 'locations')}
            >
              {playerLocations.length === 0 && <div className="location-slot empty">Location</div>}
              {groupedLocations.map((group, groupIndex) => (
                <div key={groupIndex} className="location-stack" style={{ position: 'relative', width: `${100 + (group.length - 1) * 20}px`, height: `${140 + (group.length - 1) * 20}px` }}>
                  {group.map((loc, i) => (
                    <div className={`location-slot active ${loc.isTapped ? 'tapped' : ''}`} key={loc.uid}
                         style={{ position: i === 0 ? 'relative' : 'absolute', top: i * 20, left: i * 20, zIndex: i }}
                         draggable
                         onDragStart={(e) => handleDragStart(e, loc.uid, 'locations')}
                         onContextMenu={(e) => handleContextMenu(e, 'card_location', loc)}
                         onDoubleClick={() => actionToggleTap(loc, 'locations')}
                    >
                       {loc.counters > 0 && <div className="card-counter-badge">{loc.counters}</div>}
                       <Card data={loc} />
                       <button className="board-zoom-btn" onClick={(e) => { e.stopPropagation(); setZoomedCard(loc); }}>🔍</button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="deck-zones">
             <div className="zone-slot void interactive"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'void')}
                  onClick={() => setViewingZone('void')}
             >Void ({voidZone.length})</div>
             <div className="zone-slot dungeon interactive"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'dungeon')}
                  onClick={() => setViewingZone('dungeon')}
             >Dungeon ({dungeon.length})</div>
             <div 
               className="zone-slot archive interactive" 
               onClick={drawCard}
               onContextMenu={(e) => handleContextMenu(e, 'archive', null)}
               title="Click to Draw, Right-Click for Options"
             >
               <img src="/cards/backs/000_back.png" alt="Player Deck" className="deck-back-image" />
               <div className="archive-count">{archive.length}</div>
             </div>
          </div>
        </div>

      </div>

      {/* PLAYER HAND */}
      <div className="player-hand-container">
        <div className="player-hand">
          <AnimatePresence mode="popLayout">
            {hand.map((card) => {
              const playable = canPlayCard(card);
              return (
               <motion.div 
                 className={`hand-card-wrapper ${!playable ? 'unplayable' : ''}`} 
                 key={card.uid} 
                 draggable={playable}
                 onDragStart={(e) => { if(playable) handleDragStart(e, card.uid, 'hand'); }}
                 onClick={() => { if(playable) playCard(card.uid); else alert('Cannot play this card right now.'); }}
                 title={playable ? "Click or Drag to Play" : "Requirements not met or wrong phase"}
                 initial={{ y: 100, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 exit={{ y: -100, opacity: 0 }}
                 layout
               >
                 <Card data={card} />
                 <button className="board-zoom-btn" onClick={(e) => { e.stopPropagation(); setZoomedCard(card); }}>🔍</button>
               </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>


      {/* Zoom Modal */}
      {zoomedCard && (
        <div className="zoom-modal-backdrop" onClick={() => setZoomedCard(null)}>
          <div className="zoom-modal-content" onClick={e => e.stopPropagation()}>
            <div className="zoom-modal-card-container">
              <Card data={zoomedCard} />
            </div>
            <button className="zoom-close-btn" onClick={() => setZoomedCard(null)}>Close</button>
          </div>
        </div>
      )}

      {/* Zone View Modal */}
      {viewingZone && (
        <div className="zoom-modal-backdrop" onClick={() => setViewingZone(null)} style={{zIndex: 900}}>
          <div className="zone-view-content" onClick={e => e.stopPropagation()}>
            <h2 style={{color: 'white', marginTop: 0, textTransform: 'capitalize'}}>{viewingZone}</h2>
            <div className="zone-view-grid">
              {(viewingZone === 'dungeon' ? dungeon : voidZone).map(card => (
                <div key={card.uid} className="zone-view-card-wrapper"
                     onContextMenu={(e) => handleContextMenu(e, viewingZone === 'dungeon' ? 'card_dungeon' : 'card_void', card)}
                >
                  <Card data={card} />
                  <button className="board-zoom-btn" onClick={(e) => { e.stopPropagation(); setZoomedCard(card); }}>🔍</button>
                </div>
              ))}
              {(viewingZone === 'dungeon' ? dungeon : voidZone).length === 0 && (
                <p style={{color: '#aaa', padding: '2rem'}}>Empty</p>
              )}
            </div>
            <button className="zoom-close-btn" onClick={() => setViewingZone(null)}>Close</button>
          </div>
        </div>
      )}

      {/* Archive View Modal */}
      {archiveView.visible && (
        <div className="zoom-modal-backdrop" onClick={() => setArchiveView({visible: false, mode: 'all', count: 0})} style={{zIndex: 900}}>
          <div className="zone-view-content" onClick={e => e.stopPropagation()}>
            <h2 style={{color: 'white', marginTop: 0}}>
              {archiveView.mode === 'all' ? 'Archive Library' : `Top ${archiveView.count} Cards`}
            </h2>
            <div className="zone-view-grid">
              {/* Deck top is end of array; we want to show top-down so we slice from end and reverse */}
              {archive.slice(archiveView.mode === 'all' ? 0 : Math.max(0, archive.length - archiveView.count)).reverse().map(card => (
                <div key={card.uid} className="zone-view-card-wrapper"
                     onContextMenu={(e) => handleContextMenu(e, 'card_archive', card)}>
                  <Card data={card} />
                  <button className="board-zoom-btn" onClick={(e) => { e.stopPropagation(); setZoomedCard(card); }}>🔍</button>
                </div>
              ))}
              {archive.length === 0 && <p style={{color: '#aaa', padding: '2rem'}}>Archive is empty</p>}
            </div>
            <button className="zoom-close-btn" onClick={() => setArchiveView({visible: false, mode: 'all', count: 0})}>Close</button>
          </div>
        </div>
      )}

      {/* Modals and Overlays */}

      {/* Targeting Message Overlay */}
      {targetingState.active && (
         <div style={{
            position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
            zIndex: 3000, pointerEvents: 'none', background: 'rgba(0,0,0,0.8)',
            padding: '20px 40px', borderRadius: '12px', border: '2px solid #ff4500',
            color: '#fff', fontSize: '2rem', textShadow: '0 0 10px #ff4500'
         }}>
           Select a Target
         </div>
      )}

      {/* Mulligan Overlay */}
      {mulliganState.active && (
        <div className="reaction-overlay" style={{ borderColor: '#00d2ff', boxShadow: '0 0 20px rgba(0, 210, 255, 0.3)' }}>
          <div className="reaction-box">
            <h3 style={{ color: '#00d2ff' }}>Starting Hand</h3>
            <p style={{ color: '#ccc', margin: '0 0 1rem 0' }}>You drew {mulliganState.count} cards. Would you like to Keep or Mulligan?</p>
            <div className="reaction-actions">
               <button onClick={handleKeep} style={{ borderColor: '#00ff88', color: '#00ff88' }}>Keep Hand</button>
               <button 
                  onClick={handleMulligan} 
                  disabled={mulliganState.count <= 1}
                  style={{ borderColor: '#ff4500', color: '#ff4500', opacity: mulliganState.count <= 1 ? 0.5 : 1, cursor: mulliganState.count <= 1 ? 'not-allowed' : 'pointer' }}
               >
                 Mulligan (Draw {mulliganState.count - 1})
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Reaction Timer Overlay */}
      {reactionTimer.active && (
        <div className="reaction-overlay">
          <div className="reaction-box">
            <h3>{reactionTimer.message}</h3>
            <div className="reaction-progress-bar">
              <div 
                className="reaction-progress-fill" 
                style={{ width: `${(reactionTimer.timeRemaining / reactionTimer.maxTime) * 100}%` }}
              ></div>
            </div>
            <div className="reaction-actions">
               <button onClick={() => setReactionTimer(prev => ({...prev, timeRemaining: 0}))}>Pass (Resolve)</button>
               <button onClick={() => setReactionTimer(prev => ({...prev, timeRemaining: 100}))}>Pause Timer</button>
            </div>
          </div>
        </div>
      )}

      {/* Dice Roller Overlay */}
      <AnimatePresence>
        {diceRoll && diceRoll.active && (
          <motion.div 
            className="dice-roller-overlay"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
          >
            <div className={`dice-container ${diceRoll.final ? 'final' : ''}`} style={{flexDirection: 'column', padding: '30px', background: 'rgba(0,0,0,0.85)', border: '4px solid #ffaa00', borderRadius: '16px'}}>
              <h2 style={{color: '#ffaa00', textShadow: '0 0 10px #ffaa00', marginBottom: '10px', marginTop: 0}}>Attack Resolution</h2>
              <div style={{display: 'flex', gap: '15px', marginBottom: '15px'}}>
                {diceRoll.results.map((res, i) => (
                  <div key={i} style={{
                    width: '80px', height: '80px', background: '#333', border: '3px solid #666', borderRadius: '12px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    boxShadow: diceRoll.final ? '0 0 20px #ffaa00' : 'none',
                    transition: 'box-shadow 0.3s'
                  }}>
                    <div style={{fontSize: '12px', color: '#aaa'}}>D{diceRoll.max}</div>
                    <div style={{fontSize: '36px', color: '#fff', fontWeight: 'bold'}}>{res}</div>
                  </div>
                ))}
              </div>
              {diceRoll.modifierStat && (
                <div style={{fontSize: '24px', color: '#ddd', marginBottom: '15px'}}>
                  + {diceRoll.modValue} <span style={{fontSize: '16px', color: '#aaa'}}>({diceRoll.modifierStat})</span>
                </div>
              )}
              {diceRoll.final && (
                <div style={{fontSize: '48px', color: '#ff4500', fontWeight: 'bold', textShadow: '0 0 20px #ff4500'}}>
                  {diceRoll.totalDamage} DAMAGE!
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Context Menu Overlay */}
      {contextMenu.visible && (
        <div 
          className="context-menu" 
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.targetType === 'archive' && (
            <>
              <div className="context-menu-item" onClick={actionShuffleArchive}>Shuffle Archive</div>
              <div className="context-menu-item" onClick={actionMillToDungeon}>Mill to Dungeon</div>
              <div className="context-menu-item" onClick={() => { setArchiveView({visible: true, mode: 'all', count: 0}); setContextMenu(prev=>({...prev, visible: false})); }}>View Library</div>
              <div className="context-menu-item" onClick={() => { 
                const count = parseInt(prompt("Look at top how many cards?", "3"), 10) || 3;
                setArchiveView({visible: true, mode: 'topX', count}); 
                setContextMenu(prev=>({...prev, visible: false})); 
              }}>Look at Top X...</div>
            </>
          )}
          
          {(contextMenu.targetType === 'card_timeline' || contextMenu.targetType === 'card_location' || contextMenu.targetType === 'card_hero') && (
            <>
              <div className="context-menu-item" onClick={() => actionToggleTap(contextMenu.targetData, contextMenu.targetType.replace('card_', ''))}>Tap / Untap</div>
              <div className="context-menu-item" onClick={() => actionAddCounter(contextMenu.targetData, contextMenu.targetType.replace('card_', ''))}>Add Counter</div>
              <div className="context-menu-item" onClick={() => actionRemoveCounter(contextMenu.targetData, contextMenu.targetType.replace('card_', ''))}>Remove Counter</div>
              {contextMenu.targetType !== 'card_hero' && (
                <>
                  <div style={{borderTop: '1px solid #444', margin: '0.25rem 0'}}></div>
                  <div className="context-menu-item" onClick={() => actionReturnToHand(contextMenu.targetData, contextMenu.targetType === 'card_timeline' ? 'timeline' : 'locations')}>Return to Hand</div>
                  <div className="context-menu-item" onClick={() => actionSendToDungeon(contextMenu.targetData, contextMenu.targetType === 'card_timeline' ? 'timeline' : 'locations')}>Send to Dungeon</div>
                  <div className="context-menu-item" onClick={() => actionSendToVoid(contextMenu.targetData, contextMenu.targetType === 'card_timeline' ? 'timeline' : 'locations')}>Send to Void</div>
                  <div className="context-menu-item" onClick={() => actionSendToBottom(contextMenu.targetData, contextMenu.targetType === 'card_timeline' ? 'timeline' : 'locations')}>Send to Bottom of Archive</div>
                </>
              )}
            </>
          )}
          
          {(contextMenu.targetType === 'card_dungeon' || contextMenu.targetType === 'card_void') && (
            <>
              <div className="context-menu-item" onClick={() => actionRetrieveToHand(contextMenu.targetData, contextMenu.targetType === 'card_dungeon' ? 'dungeon' : 'void')}>Retrieve to Hand</div>
              <div className="context-menu-item" onClick={() => actionRetrieveToTimeline(contextMenu.targetData, contextMenu.targetType === 'card_dungeon' ? 'dungeon' : 'void')}>Retrieve to Timeline</div>
            </>
          )}

          {contextMenu.targetType === 'card_archive' && (
            <>
              <div className="context-menu-item" onClick={() => actionRevealCard(contextMenu.targetData)}>Reveal</div>
              <div style={{borderTop: '1px solid #444', margin: '0.25rem 0'}}></div>
              <div className="context-menu-item" onClick={() => actionArchiveToHand(contextMenu.targetData)}>Send to Hand</div>
              <div className="context-menu-item" onClick={() => actionArchiveToDungeon(contextMenu.targetData)}>Send to Dungeon</div>
              <div className="context-menu-item" onClick={() => actionArchiveToVoid(contextMenu.targetData)}>Send to Void</div>
              <div style={{borderTop: '1px solid #444', margin: '0.25rem 0'}}></div>
              <div className="context-menu-item" onClick={() => actionArchiveMoveToTop(contextMenu.targetData)}>Move to Top</div>
              <div className="context-menu-item" onClick={() => actionArchiveMoveToBottom(contextMenu.targetData)}>Move to Bottom</div>
            </>
          )}
        </div>
      )}

    </div>
    </div>
  );
}
