import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import Xarrow, { Xwrapper } from 'react-xarrows';
import './GameBoard.css';
import Card from './Card';
import cardDatabase from '../data/cardDatabase.json';

const EconomyTracker = ({ economy }) => (
   <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
      <div style={{ padding: '2px 8px', borderRadius: '4px', background: economy.action > 0 ? '#4caf50' : '#555', color: 'white', fontSize: '0.7rem', fontWeight: 'bold' }}>ACT</div>
      <div style={{ padding: '2px 8px', borderRadius: '4px', background: economy.bonusAction > 0 ? '#2196f3' : '#555', color: 'white', fontSize: '0.7rem', fontWeight: 'bold' }}>BON</div>
      <div style={{ padding: '2px 8px', borderRadius: '4px', background: economy.reaction > 0 ? '#ff9800' : '#555', color: 'white', fontSize: '0.7rem', fontWeight: 'bold' }}>RXN</div>
   </div>
);

export default function GameBoard() {
  const [savedDecks, setSavedDecks] = useState({});
  const [heroCard, setHeroCard] = useState(null);
  const [annotationModal, setAnnotationModal] = useState({ active: false, cardUid: null, source: null, text: '' });
  const [zoomedCard, setZoomedCard] = useState(null);
  const [viewingZone, setViewingZone] = useState(null);
  
  // Phase Tracking
  const [currentPhase, setCurrentPhase] = useState('upkeep');
  const [activePlayer, setActivePlayer] = useState('player'); // 'player' or 'opponent'
  const [turnNumber, setTurnNumber] = useState(1);
  const [locationsPlayedThisTurn, setLocationsPlayedThisTurn] = useState(0);
  const [discardState, setDiscardState] = useState({ active: false, count: 0 });

  // Multiplayer State
  const [socket, setSocket] = useState(null);
  const [multiplayerRole, setMultiplayerRole] = useState(null); // 'player1' or 'player2'
  const [multiplayerRoom, setMultiplayerRoom] = useState(null);
  const [multiplayerStatus, setMultiplayerStatus] = useState('disconnected'); // 'disconnected', 'waiting', 'connected'
  const isOpponentConnected = multiplayerStatus === 'connected';
  const preventNextSync = useRef(false);
  const [opponentPhasePassTrigger, setOpponentPhasePassTrigger] = useState(0);


  // Automation: Reaction Timer & Dice

// Calculate Dynamic Stats
  const getStat = (statFull, owner = activePlayer) => {
    let val = 0;
    const locs = owner === 'player' ? playerLocations : opponentLocations;
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

  const rollDice = (count = 1, max = 20, modifierStat = null, options = {}) => {
    console.log("rollDice called!", count, max, modifierStat, options);
    
    const isDuel = !!options.duelParams;
    const defCount = isDuel ? options.duelParams.defender.count : 0;
    const defMax = isDuel ? options.duelParams.defender.faces : 0;
    const defModStat = isDuel ? options.duelParams.defender.modifierStat : null;
    const defDisadvantage = isDuel ? options.duelParams.defender.disadvantage : false;
    const defAdvantage = isDuel ? options.duelParams.defender.advantage : false;

    let modValue = 0;
    let defModValue = 0;
    try {
      modValue = modifierStat ? getStat(modifierStat) : (options.rawModifier || 0);
      if (isDuel && defModStat) defModValue = getStat(defModStat);
      
      setDiceRoll({ 
         active: true, 
         results: Array(count).fill(1), 
         results2: (options.disadvantage || options.advantage) ? Array(count).fill(1) : null, 
         max, modifierStat, modValue, final: false, totalDamage: 0, disadvantage: options.disadvantage,
         duel: isDuel,
         duelResults: isDuel ? Array(defCount).fill(1) : null,
         duelResults2: (isDuel && (defDisadvantage || defAdvantage)) ? Array(defCount).fill(1) : null,
         duelMax: defMax,
         duelModifierStat: defModStat,
         duelModValue: defModValue,
         duelTotalDamage: 0
      });
    } catch(err) {
      console.error("Error in rollDice init:", err);
    }
    
    let ticks = 0;
    const rollAnim = setInterval(() => {
      setDiceRoll(prev => ({ 
         ...prev, 
         results: Array(count).fill(0).map(() => Math.floor(Math.random() * max) + 1),
         results2: (options.disadvantage || options.advantage) ? Array(count).fill(0).map(() => Math.floor(Math.random() * max) + 1) : null,
         duelResults: isDuel ? Array(defCount).fill(0).map(() => Math.floor(Math.random() * defMax) + 1) : null,
         duelResults2: (isDuel && (defDisadvantage || defAdvantage)) ? Array(defCount).fill(0).map(() => Math.floor(Math.random() * defMax) + 1) : null
      }));
      ticks++;
      if (ticks > 15) {
        clearInterval(rollAnim);
        const finalResults = Array(count).fill(0).map(() => Math.floor(Math.random() * max) + 1);
        const finalResults2 = (options.disadvantage || options.advantage) ? Array(count).fill(0).map(() => Math.floor(Math.random() * max) + 1) : null;
        
        let chosenResults = finalResults;
        let droppedResults = null;
        if (options.disadvantage || options.advantage) {
           const sum1 = finalResults.reduce((a,b) => a+b, 0);
           const sum2 = finalResults2.reduce((a,b) => a+b, 0);
           if (options.disadvantage) {
              if (sum1 <= sum2) { chosenResults = finalResults; droppedResults = finalResults2; }
              else { chosenResults = finalResults2; droppedResults = finalResults; }
           } else {
              if (sum1 >= sum2) { chosenResults = finalResults; droppedResults = finalResults2; }
              else { chosenResults = finalResults2; droppedResults = finalResults; }
           }
        }

        const sum = chosenResults.reduce((a, b) => a + b, 0);
        let finalDamage = sum + modValue;
        if (finalDamage < 0) finalDamage = 0;
        
        let defChosenResults = null;
        let defDroppedResults = null;
        let defFinalDamage = 0;
        
        if (isDuel) {
           const defFinalResults = Array(defCount).fill(0).map(() => Math.floor(Math.random() * defMax) + 1);
           const defFinalResults2 = (defDisadvantage || defAdvantage) ? Array(defCount).fill(0).map(() => Math.floor(Math.random() * defMax) + 1) : null;
           
           defChosenResults = defFinalResults;
           if (defDisadvantage || defAdvantage) {
               const sum1 = defFinalResults.reduce((a,b) => a+b, 0);
               const sum2 = defFinalResults2.reduce((a,b) => a+b, 0);
               if (defDisadvantage) {
                   if (sum1 <= sum2) { defChosenResults = defFinalResults; defDroppedResults = defFinalResults2; }
                   else { defChosenResults = defFinalResults2; defDroppedResults = defFinalResults; }
               } else {
                   if (sum1 >= sum2) { defChosenResults = defFinalResults; defDroppedResults = defFinalResults2; }
                   else { defChosenResults = defFinalResults2; defDroppedResults = defFinalResults; }
               }
           }
           const defSum = defChosenResults.reduce((a,b) => a+b, 0);
           defFinalDamage = defSum + defModValue;
           if (defFinalDamage < 0) defFinalDamage = 0;
        }

        setDiceRoll(prev => ({ 
           ...prev, 
           results: chosenResults, results2: droppedResults, final: true, totalDamage: finalDamage,
           duelResults: defChosenResults, duelResults2: defDroppedResults, duelTotalDamage: defFinalDamage
        }));
        
        // Removed HP Reduction Logic for sandbox manual HP controls
        
        setTimeout(() => setDiceRoll(null), 4000);
      }
    }, 80);
  };

  
  const phases = [
    { id: 'upkeep', label: 'Upkeep', icon: '⚙️' },
    { id: 'draw', label: 'Draw', icon: '🎴' },
    { id: 'act', label: 'Act', icon: '⚡' },
    { id: 'combat', label: 'Combat', icon: '⚔️' },
    { id: 'end', label: 'End', icon: '🏁' }
  ];

  // Local Game State
  const [diceModal, setDiceModal] = useState({ active: false, count: 1, faces: 20, modifier: 0, advantage: false, disadvantage: false });
  const [archive, setArchive] = useState([]);
  const [drawHistory, setDrawHistory] = useState([]);
  const [archiveModifiers, setArchiveModifiers] = useState({ alwaysRevealTop: false, alwaysLookAtTop: false });
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
  const [playerAttacksThisTurn, setPlayerAttacksThisTurn] = useState(0);
  const [opponentAttacksThisTurn, setOpponentAttacksThisTurn] = useState(0);
  
  const [playerEconomy, setPlayerEconomy] = useState({ action: 1, bonusAction: 1, reaction: 1 });
  const [opponentEconomy, setOpponentEconomy] = useState({ action: 1, bonusAction: 1, reaction: 1 });

  const [diceRoll, setDiceRoll] = useState(null);
  const [arrows, setArrows] = useState([]);

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
       if (data.archiveSize !== undefined) setOpponentArchive(new Array(data.archiveSize).fill({ faceDown: true }));
       if (data.handSize !== undefined) setOpponentHand(new Array(data.handSize).fill({ faceDown: true }));
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
       setOpponentPhasePassTrigger(prev => prev + 1);
    });

    return () => newSocket.close();
  }, []);


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

  const connectToQueue = () => {
    if (socket) {
      socket.emit('join_queue');
    }
  };

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
    
    let endDomId = targetId;
    if (targetId !== 'opponent-hero' && targetId !== 'player-hero') {
        endDomId = "card-" + targetId;
    }

    if (targetingState.actionType === 'draw-arrow') {
      setArrows(prev => [...prev, {
         id: Date.now() + Math.random(),
         startDomId: targetingState.sourceDomId,
         endDomId: endDomId,
         color: 'red'
      }]);
      setTargetingState({ active: false, sourceCard: null, actionType: null, sourceZone: null });
      return;
    }

    const card = targetingState.sourceCard;
    const diceParams = parseAttackLogic(card);
    
    if (targetingState.actionType === 'attack') {
       
       
       // Cancel out if both are true
       if (diceParams.advantage && diceParams.disadvantage) {
          diceParams.advantage = false;
          diceParams.disadvantage = false;
       }
    } else if (targetingState.actionType === 'attach') {
       const sourceCard = targetingState.sourceCard;
       
       if (targetingState.sourceZone === 'hand') {
           setHand(prev => prev.filter(c => c.uid !== sourceCard.uid));
       }
       
       const updateAttached = (cards) => cards.map(c => 
          c.uid === targetId ? { ...c, attachedCards: [...(c.attachedCards || []), sourceCard] } : c
       );
       
       // targetId can be a zone like 'player-hero', or a uid
       if (targetId === 'player-hero') {
           setHeroCard(prev => prev ? { ...prev, attachedCards: [...(prev.attachedCards || []), sourceCard] } : prev);
       } else {
           // We'll optimistically update both arrays since uid is unique
           setTimeline(updateAttached);
           setPlayerLocations(updateAttached);
       }
       setTargetingState({ active: false, sourceCard: null, sourceZone: null, targetZone: null, actionType: null });
       return;
    }
    // Resolve Targeting
    if (targetingState.actionType === 'attack') {
      if (targetingState.sourceZone === 'player-hero') {
         setPlayerAttacksThisTurn(prev => prev + 1);
         if (playerEconomy.action > 0) setPlayerEconomy(prev => ({ ...prev, action: prev.action - 1 }));
      }
      else if (targetingState.sourceZone === 'opponent-hero') {
         setOpponentAttacksThisTurn(prev => prev + 1);
         if (opponentEconomy.action > 0) setOpponentEconomy(prev => ({ ...prev, action: prev.action - 1 }));
      }

      const heroName = card ? card.name : 'Hero';
    } else if (targetingState.actionType === 'card-play') {
      const shouldRoll = card.rulesText && (card.rulesText.toLowerCase().includes('roll') || /\d+d\d+/i.test(card.rulesText));
      
      // Remove from hand and consume economy
      if (targetingState.sourceZone === 'hand') {
         setHand(prev => prev.filter(c => c.uid !== card.uid));
         consumeEconomy(card, 'player');
      } else if (targetingState.sourceZone === 'opponent-hand') {
         setOpponentHand(prev => prev.filter(c => c.uid !== card.uid));
         consumeEconomy(card, 'opponent');
      }

      // Officially play the card
      if (targetingState.targetZone === 'timeline') {
        setTimeline(prev => [...prev, card]);
      } else if (targetingState.targetZone === 'locations') {
        setPlayerLocations(prev => [...prev, card]);
      } else if (targetingState.targetZone === 'opponent-locations') {
        setOpponentLocations(prev => [...prev, card]);
      }
      
      // Removed buggy hardcoded Battle Cry block - moved to data-driven JSON engine
      
      let duelParams = null;
      if (card.name === 'Duel') {
         const p1 = parseAttackLogic(activePlayer === 'player' ? heroCard : opponentHeroCard);
         const p2 = parseAttackLogic(activePlayer === 'player' ? opponentHeroCard : heroCard);
           
         
         
         if (p1.advantage && p1.disadvantage) { p1.advantage = false; p1.disadvantage = false; }
         if (p2.advantage && p2.disadvantage) { p2.advantage = false; p2.disadvantage = false; }
         
         duelParams = { attacker: p1, defender: p2 };
      }

    }
    
    setTargetingState({ active: false, sourceCard: null, sourceZone: null, targetZone: null, actionType: null });
  };

  const handleTargetLocationClick = (loc) => {
    if (!targetingState.active || targetingState.actionType !== 'bounce-location') return;
    
    const card = targetingState.sourceCard;
    
    if (activePlayer === 'player') {
       // Remove targeted location and return to hand
       setPlayerLocations(prev => prev.filter(c => c.uid !== loc.uid));
       setHand(prev => [...prev, loc]);
       // Place the new location
       setPlayerLocations(prev => [...prev, card]);
       setLocationsPlayedThisTurn(prev => prev + 1);
    } else {
       // Remove targeted location and return to hand
       setOpponentLocations(prev => prev.filter(c => c.uid !== loc.uid));
       setOpponentHand(prev => [...prev, loc]);
       // Place the new location
       setOpponentLocations(prev => [...prev, card]);
       setLocationsPlayedThisTurn(prev => prev + 1);
    }
    
    setTargetingState({ active: false, sourceCard: null, sourceZone: null, targetZone: null, actionType: null });
  };

  const handleKeep = () => {};
  const handleMulligan = () => {};

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
  const consumeEconomy = (card, owner) => {
    if (card.type === 'Action') {
       if (owner === 'player') setPlayerEconomy(prev => ({ ...prev, action: prev.action - 1 }));
       else setOpponentEconomy(prev => ({ ...prev, action: prev.action - 1 }));
    } else if (card.type === 'Bonus Action') {
       if (owner === 'player') setPlayerEconomy(prev => ({ ...prev, bonusAction: prev.bonusAction - 1 }));
       else setOpponentEconomy(prev => ({ ...prev, bonusAction: prev.bonusAction - 1 }));
    } else if (card.type === 'Reaction') {
       if (owner === 'player') setPlayerEconomy(prev => ({ ...prev, reaction: prev.reaction - 1 }));
       else setOpponentEconomy(prev => ({ ...prev, reaction: prev.reaction - 1 }));
    }
  };

  const playCard = (uid) => {
    // Handle discarding
    if (discardState.active) {
       if (activePlayer === 'player') {
          const cardIndex = hand.findIndex(c => c.uid === uid);
          if (cardIndex !== -1) {
             const card = hand[cardIndex];
             setHand(hand.filter(c => c.uid !== uid));
             setDungeon([...dungeon, card]);
             
             setDiscardState(prev => ({ active: prev.count - 1 > 0, count: prev.count - 1 }));
          }
       } else if (activePlayer === 'opponent') {
          const oppCardIndex = opponentHand.findIndex(c => c.uid === uid);
          if (oppCardIndex !== -1) {
             const card = opponentHand[oppCardIndex];
             setOpponentHand(opponentHand.filter(c => c.uid !== uid));
             setOpponentDungeon([...opponentDungeon, card]);
             
             setDiscardState(prev => ({ active: prev.count - 1 > 0, count: prev.count - 1 }));
          }
       }
       return;
    }

    const card = hand.find(c => c.uid === uid);
    if (!card) return;
    
    const targetZone = card.type === 'Location' ? 'locations' : 'timeline';

    if (card.rulesText && card.rulesText.toLowerCase().includes('return another location') && targetZone === 'locations') {
       setTargetingState({
          active: true,
          sourceCard: card,
          sourceZone: 'hand',
          targetZone: targetZone,
          actionType: 'bounce-location'
       });
       return;
    }

    if (card.rulesText && card.rulesText.toLowerCase().includes('target')) {
       setTargetingState({
          active: true,
          sourceCard: card,
          sourceZone: 'hand',
          targetZone: targetZone,
          actionType: 'card-play'
       });
       return;
    }

    setHand(hand.filter(c => c.uid !== uid));
    if (targetZone === 'locations') {
       setPlayerLocations([...playerLocations, card]);
       setLocationsPlayedThisTurn(prev => prev + 1);
    } else {
       setTimeline([...timeline, card]);
       consumeEconomy(card, 'player');
    }
    
    const shouldRoll = card.rulesText && (card.rulesText.toLowerCase().includes('roll') || /\d+d\d+/i.test(card.rulesText));
    if (card.type !== 'Location') {
     }
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
    e.stopPropagation();

    const menuWidth = 220;
    let menuHeight = 250;
    if (targetType === 'archive') menuHeight = 400;
    if (targetType === 'card_hand') menuHeight = 450;
    
    let x = e.clientX;
    let y = e.clientY;
    
    if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 10;
    if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight - 10;

    setContextMenu({
      visible: true,
      x,
      y,
      targetType,
      targetData
    });
  };

  const updateCardState = (uid, source, updates) => {
    if (source === 'timeline') {
      setTimeline(prev => prev.map(c => c.uid === uid ? { ...c, ...updates } : c));
    } else if (source === 'locations' || source === 'location') {
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
  const actionDrawCard = () => {
    if (archive.length === 0) return;
    const newArchive = [...archive];
    const drawn = newArchive.pop();
    setArchive(newArchive);
    setHand(prev => [...prev, drawn]);
    setDrawHistory(prev => [...prev, drawn.uid]);
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const actionDrawCards = () => {
    setContextMenu(prev => ({ ...prev, visible: false }));
    const countStr = prompt("How many cards to draw?", "1");
    if (!countStr) return;
    const count = parseInt(countStr, 10);
    if (isNaN(count) || count <= 0) return;

    const newArchive = [...archive];
    const drawnCards = newArchive.splice(-count);
    setArchive(newArchive);
    setHand(h => [...h, ...drawnCards]);
    setDrawHistory(dh => [...dh, ...drawnCards.map(c => c.uid)]);
  };

  const actionUndoDraw = () => {
    if (drawHistory.length === 0) {
        setContextMenu(prev => ({ ...prev, visible: false }));
        return;
    }
    const lastDrawnUid = drawHistory[drawHistory.length - 1];
    
    const cardToReturn = hand.find(c => c.uid === lastDrawnUid);
    if (cardToReturn) {
        setDrawHistory(prev => prev.slice(0, -1));
        setArchive(prev => [...prev, cardToReturn]);
        setHand(prev => prev.filter(c => c.uid !== lastDrawnUid));
    }
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

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

  const executeCardEffects = (card, specificTargetId = null) => {
     if (!card.effects || !Array.isArray(card.effects)) return;
     
     const caster = activePlayer;
     const target = specificTargetId || (caster === 'player' ? 'opponent-hero' : 'player-hero');

     card.effects.forEach(eff => {
        if (eff.type === 'draw') {
           const amount = eff.amount || 1;
           if (caster === 'player') {
              setArchive(prev => {
                 const newArchive = [...prev];
                 const drawn = newArchive.splice(0, amount);
                 setHand(h => [...h, ...drawn]);
                 return newArchive;
              });
           } else {
              setOpponentArchive(prev => {
                 const newArchive = [...prev];
                 const drawn = newArchive.splice(0, amount);
                 setOpponentHand(h => [...h, ...drawn]);
                 return newArchive;
              });
           }
        } else if (eff.type === 'apply_condition') {
           let applyTo = eff.target; // "caster" or "selected"
           if (applyTo === 'selected') {
              if (target === 'player-hero') {
              } else {
              }
           } else if (applyTo === 'caster') {
              if (caster === 'player') {
              } else {
              }
           }
        }
     });
  };

  const actionResolveCard = (card, source, targetId = null) => {
    if (source === 'timeline') setTimeline(prev => prev.filter(c => c.uid !== card.uid));
    if (source === 'locations') setPlayerLocations(prev => prev.filter(c => c.uid !== card.uid));
    
    executeCardEffects(card, targetId);

    if (card.rulesText && card.rulesText.toLowerCase().includes('moves to the void after play')) {
       setVoidZone(prev => [...prev, card]);
    } else {
       setDungeon(prev => [...prev, card]);
    }
    
    // Apply Onslaught
    if (card.rulesText && card.rulesText.toLowerCase().includes('may attack twice')) {
       if (activePlayer === 'player') {
       } else {
       }
    }
    
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

  const actionDrawArrow = (card, zoneType) => {
    let sourceDomId = "card-" + card.uid;
    if (zoneType === 'card_hero') {
        sourceDomId = card === opponentHeroCard ? 'opponent-hero' : 'player-hero';
    }
    setTargetingState({
        active: true,
        actionType: 'draw-arrow',
        sourceCard: card,
        sourceDomId: sourceDomId
    });
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const actionClearArrows = () => {
    setArrows([]);
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const actionPlayCardFromHand = (card, faceDown = false) => {
    const cardToPlay = faceDown ? { ...card, faceDown: true } : card;
    consumeEconomy(card, 'player');
    setHand(prev => prev.filter(c => c.uid !== card.uid));
    
    if (card.type === 'Hero') {
       setHeroCard(cardToPlay);
    } else if (card.type === 'Location') {
       setPlayerLocations(prev => [...prev, cardToPlay]);
       setLocationsPlayedThisTurn(prev => prev + 1);
    } else {
       setTimeline(prev => [...prev, cardToPlay]);
    }
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const actionRevealCard = (card) => {
     setHand(prev => prev.map(c => c.uid === card.uid ? { ...c, isRevealed: !c.isRevealed } : c));
     setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const actionMoveHandToTop = (card) => {
     setHand(prev => prev.filter(c => c.uid !== card.uid));
     setArchive(prev => [...prev, card]);
     setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const actionMoveHandToBottom = (card) => {
     setHand(prev => prev.filter(c => c.uid !== card.uid));
     setArchive(prev => [card, ...prev]);
     setContextMenu(prev => ({ ...prev, visible: false }));
  };
  
  const actionMoveHandToX = (card) => {
     const xStr = prompt("Insert at what index from the top? (1 = top)", "2");
     if (!xStr) return;
     let x = parseInt(xStr, 10);
     if (isNaN(x) || x < 1) x = 1;
     
     setHand(prev => prev.filter(c => c.uid !== card.uid));
     setArchive(prev => {
         const newArchive = [...prev];
         const indexFromBottom = newArchive.length - (x - 1);
         newArchive.splice(Math.max(0, indexFromBottom), 0, card);
         return newArchive;
     });
     setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const actionMoveToZone = (card, zone) => {
     setHand(prev => prev.filter(c => c.uid !== card.uid));
     if (zone === 'timeline') setTimeline(prev => [...prev, card]);
     if (zone === 'dungeon') setDungeon(prev => [...prev, card]);
     if (zone === 'void') setVoidZone(prev => [...prev, card]);
     setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const actionAttachCard = (card) => {
     setTargetingState({ active: true, sourceCard: card, sourceZone: 'hand', targetZone: null, actionType: 'attach' });
     setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const actionDetachCard = (attachedCard, parentUid, sourceZone, destZone) => {
    const removeAttached = (cards) => cards.map(c => 
       c.uid === parentUid ? { ...c, attachedCards: (c.attachedCards || []).filter(a => a.uid !== attachedCard.uid) } : c
    );
    
    if (sourceZone === 'hero') {
       if (heroCard && heroCard.uid === parentUid) {
           setHeroCard(prev => ({ ...prev, attachedCards: (prev.attachedCards || []).filter(a => a.uid !== attachedCard.uid) }));
       } else if (opponentHeroCard && opponentHeroCard.uid === parentUid) {
           setOpponentHeroCard(prev => ({ ...prev, attachedCards: (prev.attachedCards || []).filter(a => a.uid !== attachedCard.uid) }));
       }
    } else {
       setTimeline(removeAttached);
       setPlayerLocations(removeAttached);
    }
    
    if (destZone === 'hand') setHand(prev => [...prev, attachedCard]);
    if (destZone === 'dungeon') setDungeon(prev => [...prev, attachedCard]);
    if (destZone === 'void') setVoid(prev => [...prev, attachedCard]);
    if (destZone === 'timeline') setTimeline(prev => [...prev, attachedCard]);
    
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

  const actionRevealArchiveCard = (card) => {
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

  
  
  const canPlayCard = (card, owner = 'player') => {
    
    // Action Economy restrictions
    const economy = owner === 'player' ? playerEconomy : opponentEconomy;
    if (card.type === 'Action' && economy.action <= 0) return false;
    if (card.type === 'Bonus Action' && economy.bonusAction <= 0) return false;
    if (card.type === 'Reaction' && economy.reaction <= 0) return false;
    
    // Location restrictions
    if (card.type === 'Location') {
      let maxLocations = 1;
      // In the future, we can scan active cards for effects that increase maxLocations
      if (locationsPlayedThisTurn >= maxLocations) {
        return false;
      }
      
      if (card.rulesText && card.rulesText.toLowerCase().includes('return another location')) {
        const activeLocations = activePlayer === 'player' ? playerLocations : opponentLocations;
        if (activeLocations.length === 0) {
           return false; // Cannot play if you have no location to bounce
        }
      }
    }
    
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

    const shouldRoll = cardToMove.rulesText && (cardToMove.rulesText.toLowerCase().includes('roll') || /\d+d\d+/i.test(cardToMove.rulesText));

    // Strict Enforcement for playing cards to the board
    if ((sourceZone === 'hand' || sourceZone === 'opponent-hand') && (targetZone === 'timeline' || targetZone === 'locations' || targetZone === 'opponent-locations')) {
      const owner = sourceZone === 'hand' ? 'player' : 'opponent';
    }

    // 2. Add to target or Intercept
    if (cardToMove.rulesText && cardToMove.rulesText.toLowerCase().includes('return another location') && targetZone === 'locations') {
       setTargetingState({
          active: true,
          sourceCard: cardToMove,
          sourceZone: sourceZone,
          targetZone: targetZone,
          actionType: 'bounce-location'
       });
       return;
    }

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
      if (sourceZone === 'hand' || sourceZone === 'opponent-hand') {
         consumeEconomy(cardToMove, sourceZone === 'hand' ? 'player' : 'opponent');
         }
    } else if (targetZone === 'dungeon') {
      setDungeon(prev => [...prev, cardToMove]);
    } else if (targetZone === 'void') {
      setVoidZone(prev => [...prev, cardToMove]);
    } else if (targetZone === 'locations') {
      setPlayerLocations(prev => [...prev, cardToMove]);
      if (cardToMove.type === 'Location' && sourceZone === 'hand') setLocationsPlayedThisTurn(prev => prev + 1);
    } else if (targetZone === 'opponent-locations') {
      setOpponentLocations(prev => [...prev, cardToMove]);
      if (cardToMove.type === 'Location' && sourceZone === 'opponent-hand') setLocationsPlayedThisTurn(prev => prev + 1);
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

  useEffect(() => {
    if (opponentPhasePassTrigger > 0) {
      preventNextSync.current = true;
      handlePhaseAdvance(true);
      setTimeout(() => preventNextSync.current = false, 50);
    }
  }, [opponentPhasePassTrigger]);

  const handlePhaseAdvance = (fromSocket = false) => {
    if (socket && multiplayerStatus === 'connected' && !fromSocket) socket.emit('pass_phase');
    setArrows([]);
    if (discardState.active) {
      alert(`You must discard ${discardState.count} more card(s) before advancing!`);
      return;
    }

    const currentIndex = phases.findIndex(p => p.id === currentPhase);
    
    if (currentIndex === phases.length - 1) {
      // Check hand size limit before passing turn
      const activeHand = activePlayer === 'player' ? hand : opponentHand;
      if (activeHand.length > 7) {
         setDiscardState({ active: true, count: activeHand.length - 7 });
         return; // Pause passing until resolved
      }
    }

    let nextPhaseId;
    if (currentIndex === phases.length - 1) {
      // Passing from End phase -> Change active player and go to upkeep
      const nextActivePlayer = activePlayer === 'player' ? 'opponent' : 'player';
      const nextTurnNumber = activePlayer === 'opponent' ? turnNumber + 1 : turnNumber;
      
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
      if (activePlayer === 'opponent') setTurnNumber(nextTurnNumber);
      
      
    } else {
      nextPhaseId = phases[currentIndex + 1].id;
    }

    setCurrentPhase(nextPhaseId);
  };

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
                  <select onChange={loadDeck} className="editor-select" value={heroCard ? "loaded" : ""} style={{padding: '10px', fontSize: '1.2rem', backgroundColor: '#333', color: '#fff', border: '1px solid #555', borderRadius: '4px'}}>
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
               {`@keyframes spin { to { transform: rotate(360deg); } }`}
             </style>
           </div>
        )}
      </div>
    );
  }

  return (
    <Xwrapper>
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
               <div className="hand-card-wrapper" key={i} draggable={activePlayer === 'opponent'} onDragStart={(e) => handleDragStart(e, card.uid, 'opponent-hand')} onClick={() => discardState.active && activePlayer === 'opponent' ? playCard(card.uid) : null}>
                 {activePlayer === 'opponent' ? (
                   <Card data={card} />
                 ) : (
                   <img src="/cards/backs/000_back.png" alt="Card Back" style={{width: '100%', height: '100%', borderRadius: '12px'}} />
                 )}
               </div>
            ))}
          </div>
        </div>

        <div className="player-area-main-row" onContextMenu={(e) => handleContextMenu(e, 'battlefield', null)}>
          
          <div className="battlefield-core">
            <div className="stat-tracker-vertical">
              <div className="tracker-box str">STR: {getStat('Strength', 'opponent')}</div>
              <div className="tracker-box dex">DEX: {getStat('Dexterity', 'opponent')}</div>
              <div className="tracker-box con">CON: {getStat('Constitution', 'opponent')}</div>
              <div className="tracker-box int">INT: {getStat('Intelligence', 'opponent')}</div>
              <div className="tracker-box wis">WIS: {getStat('Wisdom', 'opponent')}</div>
              <div className="tracker-box luc">LUC: {getStat('Luck', 'opponent')}</div>
            </div>
            
            <div className="hero-zone">
              <div id="opponent-hero" className={`hero-card-wrapper ${opponentHeroCard?.isTapped ? 'tapped' : ''}`} style={{position: 'relative'}}>
                 {opponentHeroCard ? (
                   <>
                     <Card data={opponentHeroCard} />
                     {opponentHeroCard.annotations && (
                       <div className="hero-annotations-container">
                         {opponentHeroCard.annotations.split('\n').filter(line => line.trim() !== '').map((line, idx) => (
                           <div key={idx} className="hero-annotation-badge">{line}</div>
                         ))}
                       </div>
                     )}
                     {opponentHeroCard.attachedCards && opponentHeroCard.attachedCards.map((attached, attachIdx) => (
                         <div key={attached.uid} id={`card-${attached.uid}`} className="attached-card-wrapper" onContextMenu={(e) => { e.stopPropagation(); handleContextMenu(e, 'card_attached', { card: attached, parentUid: opponentHeroCard.uid, zone: 'hero' }) }} style={{ position: 'absolute', top: (attachIdx + 1) * -35, left: 0, zIndex: -(attachIdx + 1), width: '100%', height: '100%' }}>
                             <Card data={attached} />
                         </div>
                     ))}
                     {currentPhase === 'combat' && activePlayer === 'opponent' && !targetingState.active && opponentAttacksThisTurn < 1 && opponentEconomy.action > 0 && (
                        <div className="target-overlay" onClick={() => handleTargetClick('opponent-hero', 'hero')}>⚔️ Attack</div>
                     )}
                     {targetingState.active && targetingState.actionType !== 'bounce-location' && targetingState.sourceZone !== 'opponent-hero' && (
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
              <div className="stat-box hp">
                HP: {opponentHp}
                <div style={{display:'flex', gap:'5px', marginTop:'5px', justifyContent: 'center'}}>
                   <button onClick={() => setOpponentHp(p => p - 1)} style={{width:'30px'}}>-</button>
                   <button onClick={() => setOpponentHp(p => p + 1)} style={{width:'30px'}}>+</button>
                </div>
              </div>
              <EconomyTracker economy={opponentEconomy} />
            </div>

            <div className="location-zone" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'opponent-locations')}>
              {opponentLocations.length === 0 && <div className="location-slot empty">Location</div>}
              {opponentLocations.map(loc => (
                 <div key={loc.uid} id={`card-${loc.uid}`} className="location-slot active">
                   <Card data={loc} />
                   {targetingState.active && targetingState.actionType === 'bounce-location' && activePlayer === 'opponent' && (
                     <div className="target-overlay bounce-overlay" onClick={() => handleTargetLocationClick(loc)}>Target</div>
                   )}
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
         <div className="timeline-track"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'timeline')}
         >
            {timeline.length === 0 && heroCard && <span>Timeline / Active Cards (Drag or click hand to play)</span>}
            <AnimatePresence mode="popLayout">
              {timeline.map((card) => (
                <motion.div 
                  id={`card-${card.uid}`} className={`timeline-card-wrapper ${card.isTapped ? 'tapped' : ''}`}
                  key={card.uid}
                  draggable
                  onDragStart={(e) => handleDragStart(e, card.uid, 'timeline')}
                  onContextMenu={(e) => handleContextMenu(e, 'card_timeline', card)}
                  onClick={() => handleTargetClick(card.uid, 'timeline')}
                  onDoubleClick={() => actionToggleTap(card, 'timeline')}
                  initial={{ opacity: 0, scale: 0.5, y: 50 }}
                  animate={{ opacity: 1, scale: 1, y: 0, rotate: card.isTapped ? 90 : 0 }}
                  exit={{ opacity: 0, scale: 0, y: -50 }}
                  layout
                >
                  {card.counters > 0 && <div className="card-counter-badge">{card.counters}</div>}
                  <Card data={card} />
                  {card.attachedCards && card.attachedCards.map((attached, attachIdx) => (
                      <div key={attached.uid} id={`card-${attached.uid}`} className="attached-card-wrapper" onContextMenu={(e) => { e.stopPropagation(); handleContextMenu(e, 'card_attached', { card: attached, parentUid: card.uid, zone: 'timeline' }) }} style={{ position: 'absolute', top: (attachIdx + 1) * -35, left: 0, zIndex: -(attachIdx + 1), width: '100%', height: '100%' }}>
                          <Card data={attached} />
                      </div>
                  ))}
                  <button className="board-zoom-btn" onClick={(e) => { e.stopPropagation(); setZoomedCard(card); }}>🔍</button>
                </motion.div>
              ))}
            </AnimatePresence>
         </div>
      </div>

      {/* PLAYER AREA */}
      <div className={`player-area ${activePlayer === 'player' ? 'active-turn' : ''}`}>
        <div className="player-area-main-row" onContextMenu={(e) => handleContextMenu(e, 'battlefield', null)}>
          
          <div className="battlefield-core">
            <div className="stat-tracker-vertical">
              <div className="tracker-box str">STR: {getStat('Strength', 'player')}</div>
              <div className="tracker-box dex">DEX: {getStat('Dexterity', 'player')}</div>
              <div className="tracker-box con">CON: {getStat('Constitution', 'player')}</div>
              <div className="tracker-box int">INT: {getStat('Intelligence', 'player')}</div>
              <div className="tracker-box wis">WIS: {getStat('Wisdom', 'player')}</div>
              <div className="tracker-box luc">LUC: {getStat('Luck', 'player')}</div>
            </div>
            
            <div className="hero-zone">
              <div id="player-hero" className={`hero-card-wrapper ${heroCard?.isTapped ? 'tapped' : ''}`} onContextMenu={(e) => heroCard && handleContextMenu(e, 'card_hero', heroCard)} style={{position: 'relative'}}>
                 {heroCard ? (
                   <>
                     <Card data={heroCard} />
                     {heroCard.annotations && (
                       <div className="hero-annotations-container">
                         {heroCard.annotations.split('\n').filter(line => line.trim() !== '').map((line, idx) => (
                           <div key={idx} className="hero-annotation-badge">{line}</div>
                         ))}
                       </div>
                     )}
                     {heroCard.attachedCards && heroCard.attachedCards.map((attached, attachIdx) => (
                         <div key={attached.uid} id={`card-${attached.uid}`} className="attached-card-wrapper" onContextMenu={(e) => { e.stopPropagation(); handleContextMenu(e, 'card_attached', { card: attached, parentUid: heroCard.uid, zone: 'hero' }) }} style={{ position: 'absolute', top: (attachIdx + 1) * -35, left: 0, zIndex: -(attachIdx + 1), width: '100%', height: '100%' }}>
                             <Card data={attached} />
                         </div>
                     ))}
                     {heroCard.counters > 0 && <div className="card-counter-badge">{heroCard.counters}</div>}
                     <button className="board-zoom-btn" onClick={(e) => { e.stopPropagation(); setZoomedCard(heroCard); }}>🔍</button>
                     {currentPhase === 'combat' && activePlayer === 'player' && !targetingState.active && playerAttacksThisTurn < 1 && playerEconomy.action > 0 && (
                        <div className="target-overlay" onClick={() => handleTargetClick('player-hero', 'hero')}>⚔️ Attack</div>
                     )}
                     {targetingState.active && targetingState.actionType !== 'bounce-location' && targetingState.sourceZone !== 'player-hero' && (
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
              <div className="stat-box hp">
                HP: {playerHp}
                <div style={{display:'flex', gap:'5px', marginTop:'5px', justifyContent: 'center'}}>
                   <button onClick={() => setPlayerHp(p => p - 1)} style={{width:'30px'}}>-</button>
                   <button onClick={() => setPlayerHp(p => p + 1)} style={{width:'30px'}}>+</button>
                </div>
              </div>
              <EconomyTracker economy={playerEconomy} />
            </div>

            <div className="location-zone"
                 onDragOver={handleDragOver}
                 onDrop={(e) => handleDrop(e, 'locations')}
            >
              {playerLocations.length === 0 && <div className="location-slot empty">Location</div>}
              {groupedLocations.map((group, groupIndex) => (
                <div key={groupIndex} className="location-stack" style={{ position: 'relative', width: `${100 + (group.length - 1) * 20}px`, height: `${140 + (group.length - 1) * 20}px` }}>
                  {group.map((loc, i) => (
                    <div id={`card-${loc.uid}`} className={`location-slot active ${loc.isTapped ? 'tapped' : ''}`} key={loc.uid}
                         style={{ position: i === 0 ? 'relative' : 'absolute', top: i * 20, left: i * 20, zIndex: i }}
                         draggable
                         onDragStart={(e) => handleDragStart(e, loc.uid, 'locations')}
                         onContextMenu={(e) => handleContextMenu(e, 'card_location', loc)}
                         onClick={() => handleTargetClick(loc.uid, 'locations')}
                         onDoubleClick={() => actionToggleTap(loc, 'locations')}
                    >
                       {loc.counters > 0 && <div className="card-counter-badge">{loc.counters}</div>}
                       <Card data={loc} />
                       {loc.attachedCards && loc.attachedCards.map((attached, attachIdx) => (
                           <div key={attached.uid} id={`card-${attached.uid}`} className="attached-card-wrapper" onContextMenu={(e) => { e.stopPropagation(); handleContextMenu(e, 'card_attached', { card: attached, parentUid: loc.uid, zone: 'locations' }) }} style={{ position: 'absolute', top: (attachIdx + 1) * -35, left: 0, zIndex: -(attachIdx + 1), width: '100%', height: '100%' }}>
                               <Card data={attached} />
                           </div>
                       ))}
                       <button className="board-zoom-btn" onClick={(e) => { e.stopPropagation(); setZoomedCard(loc); }}>🔍</button>
                       {targetingState.active && targetingState.actionType === 'bounce-location' && activePlayer === 'player' && (
                         <div className="target-overlay bounce-overlay" onClick={() => handleTargetLocationClick(loc)}>Target</div>
                       )}
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
               onContextMenu={(e) => handleContextMenu(e, 'archive', null)}
               onDoubleClick={actionDrawCard}
               title="Right-Click for Options"
               style={{ position: 'relative' }}
             >
               <img src="/cards/backs/000_back.png" alt="Player Deck" className="deck-back-image" />
               <div className="archive-count">{archive.length}</div>
               
               {(archiveModifiers.alwaysRevealTop || archiveModifiers.alwaysLookAtTop) && archive.length > 0 && (
                 <div style={{
                     position: 'absolute', top: -30, left: 10, right: -10, zIndex: 10,
                     transform: 'rotate(5deg) scale(0.9)',
                     pointerEvents: 'none',
                     boxShadow: '0 5px 15px rgba(0,0,0,0.5)',
                     border: archiveModifiers.alwaysLookAtTop ? '2px dashed #0ff' : '2px solid #ff0'
                 }}>
                    <Card data={archive[archive.length - 1]} />
                    <div style={{
                       position: 'absolute', bottom: -20, left: 0, right: 0, textAlign: 'center',
                       background: 'rgba(0,0,0,0.8)', color: archiveModifiers.alwaysLookAtTop ? '#0ff' : '#ff0',
                       fontSize: '0.8rem', padding: '2px', borderRadius: '4px'
                    }}>
                       {archiveModifiers.alwaysLookAtTop ? 'Peeking' : 'Revealed'}
                    </div>
                 </div>
               )}
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
                 draggable={true}
                 onDragStart={(e) => handleDragStart(e, card.uid, 'hand')}
                 onContextMenu={(e) => handleContextMenu(e, 'card_hand', card)}
                 onClick={() => { 
                   if (discardState.active && activePlayer === 'player') playCard(card.uid);
                   else playCard(card.uid); 
                 }}
                 title="Click or Drag to Play"
                 initial={{ y: 100, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 exit={{ y: -100, opacity: 0 }}
                 layout
               >
                 <Card data={card} />
                 {card.isRevealed && (
                    <div style={{
                       position: 'absolute', top: -15, left: '50%', transform: 'translateX(-50%)',
                       background: 'rgba(255,255,0,0.9)', color: 'black',
                       fontSize: '0.8rem', padding: '2px 8px', borderRadius: '4px',
                       fontWeight: 'bold', zIndex: 10, boxShadow: '0 0 5px rgba(0,0,0,0.5)', whiteSpace: 'nowrap'
                    }}>
                       Revealed
                    </div>
                 )}
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

      {/* Annotation Modal */}
      {annotationModal.active && (
        <div className="zoom-modal-backdrop" onClick={() => setAnnotationModal({ active: false, cardUid: null, source: null, text: '' })}>
          <div className="zoom-modal-content" style={{padding: '2rem', background: '#e3e3e3', color: '#000', borderRadius: '4px', border: '1px solid #999', width: '350px'}} onClick={e => e.stopPropagation()}>
            <h3 style={{marginTop: 0, fontSize: '0.9rem', fontWeight: 'normal'}}>Please enter the new annotation:</h3>
            <textarea 
              value={annotationModal.text}
              onChange={e => setAnnotationModal(prev => ({ ...prev, text: e.target.value }))}
              style={{width: '100%', height: '120px', resize: 'none', padding: '8px', border: '1px solid #ccc', background: '#fff', color: '#000', outline: 'none'}}
            />
            <div style={{display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem'}}>
              <button 
                onClick={() => {
                  updateCardState(annotationModal.cardUid, annotationModal.source, { annotations: annotationModal.text });
                  setAnnotationModal({ active: false, cardUid: null, source: null, text: '' });
                }}
                style={{padding: '4px 16px', background: '#fff', border: '1px solid #0078d7', borderRadius: '4px', cursor: 'pointer', color: '#000'}}
              >
                OK
              </button>
              <button 
                onClick={() => setAnnotationModal({ active: false, cardUid: null, source: null, text: '' })}
                style={{padding: '4px 16px', background: '#fff', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', color: '#000'}}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dice Config Modal */}
      {diceModal.active && (
        <div className="zoom-modal-backdrop" onClick={() => setDiceModal(prev => ({ ...prev, active: false }))}>
          <div className="zoom-modal-content" style={{padding: '2rem', background: '#222', borderRadius: '12px', border: '1px solid #555'}} onClick={e => e.stopPropagation()}>
            <h2 style={{marginTop: 0}}>🎲 Roll Dice</h2>
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', color: '#ccc'}}>
              <div>
                 <label>Count:</label>
                 <input type="number" min="1" max="10" value={diceModal.count} onChange={e => setDiceModal(prev => ({ ...prev, count: parseInt(e.target.value)||1 }))} style={{marginLeft: '10px', background: '#333', color: '#fff', border: 'none', padding: '5px', borderRadius: '4px'}}/>
              </div>
              <div>
                 <label>Faces:</label>
                 <select value={diceModal.faces} onChange={e => setDiceModal(prev => ({ ...prev, faces: parseInt(e.target.value) }))} style={{marginLeft: '10px', background: '#333', color: '#fff', border: 'none', padding: '5px', borderRadius: '4px'}}>
                    <option value="4">d4</option>
                    <option value="6">d6</option>
                    <option value="8">d8</option>
                    <option value="10">d10</option>
                    <option value="12">d12</option>
                    <option value="20">d20</option>
                    <option value="100">d100</option>
                 </select>
              </div>
              <div>
                 <label>Modifier (+/-):</label>
                 <input type="number" value={diceModal.modifier} onChange={e => setDiceModal(prev => ({ ...prev, modifier: parseInt(e.target.value)||0 }))} style={{marginLeft: '10px', background: '#333', color: '#fff', border: 'none', padding: '5px', borderRadius: '4px'}}/>
              </div>
              <div style={{display:'flex', gap:'15px', marginTop: '10px'}}>
                 <label><input type="checkbox" checked={diceModal.advantage} onChange={e => setDiceModal(prev => ({ ...prev, advantage: e.target.checked, disadvantage: false }))} /> Advantage</label>
                 <label><input type="checkbox" checked={diceModal.disadvantage} onChange={e => setDiceModal(prev => ({ ...prev, disadvantage: e.target.checked, advantage: false }))} /> Disadvantage</label>
              </div>
              <div style={{display: 'flex', gap: '10px', marginTop: '1rem'}}>
                <button className="primary-btn" onClick={() => {
                   setDiceModal(prev => ({ ...prev, active: false }));
                   rollDice(diceModal.count, diceModal.faces, null, { 
                       disadvantage: diceModal.disadvantage, 
                       advantage: diceModal.advantage,
                       rawModifier: diceModal.modifier 
                   });
                }}>Roll!</button>
                <button className="secondary-btn" onClick={() => setDiceModal(prev => ({ ...prev, active: false }))}>Cancel</button>
              </div>
            </div>
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
              {archiveView.mode === 'all' ? 'Archive Library' : (archiveView.mode === 'topX' ? `Top ${archiveView.count} Cards` : `Bottom ${archiveView.count} Cards`)}
            </h2>
            <div className="zone-view-grid">
              {/* Deck top is end of array; we want to show top-down so we slice from end and reverse */}
              {(archiveView.mode === 'all' ? archive.slice().reverse() : (archiveView.mode === 'topX' ? archive.slice(Math.max(0, archive.length - archiveView.count)).reverse() : archive.slice(0, archiveView.count).reverse())).map(card => (
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
      
      {/* Game Over Overlay */}
      {(playerHp === 0 || opponentHp === 0) && (
         <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 5000, background: 'rgba(0,0,0,0.95)', display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center', color: '#fff'
         }}>
            <h1 style={{ fontSize: '6rem', margin: 0, color: playerHp === 0 ? '#ff4500' : '#ffd700', textShadow: '0 0 20px rgba(255,255,255,0.3)' }}>
               {playerHp === 0 ? 'DEFEAT' : 'VICTORY'}
            </h1>
            <p style={{ fontSize: '2rem', marginTop: '20px', color: '#aaa' }}>
               {playerHp === 0 ? 'Your hero has fallen.' : 'You have vanquished your opponent!'}
            </p>
            <button onClick={() => window.location.reload()} style={{ marginTop: '40px', padding: '15px 40px', fontSize: '1.5rem', background: '#222', color: '#fff', border: '2px solid #555', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
               Play Again
            </button>
         </div>
      )}

      {/* Mulligan Overlay */}
      {/* Mulligan Overlay Removed */}

      {/* Discard Overlay */}
      {discardState.active && (
         <div style={{
            position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%, -50%)',
            zIndex: 3000, pointerEvents: 'none', background: 'rgba(0,0,0,0.8)',
            padding: '20px 40px', borderRadius: '12px', border: '2px solid #e0c800',
            color: '#e0c800', fontSize: '2rem', textShadow: '0 0 10px #e0c800'
         }}>
            Discard {discardState.count} Card(s) to the Dungeon! ({activePlayer === 'player' ? 'Your Hand' : "Opponent's Hand"})
         </div>
      )}

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
              <div style={{display: 'flex', gap: '40px', alignItems: 'flex-start'}}>
                 
                 {/* Attacker Roll */}
                 <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                    {diceRoll.duel && <h3 style={{color: '#ddd', marginTop: 0}}>Attacker</h3>}
                    <div style={{display: 'flex', gap: '30px', marginBottom: '15px', justifyContent: 'center'}}>
                      <div style={{display: 'flex', gap: '15px', flexDirection: 'column', alignItems: 'center'}}>
                         {diceRoll.final && diceRoll.results2 && <div style={{color: '#ffaa00', fontWeight: 'bold'}}>Chosen Roll</div>}
                         <div style={{display: 'flex', gap: '15px'}}>
                           {diceRoll.results.map((res, i) => (
                             <div key={`res1-${i}`} style={{
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
                      </div>
                      {diceRoll.results2 && (
                         <div style={{display: 'flex', gap: '15px', flexDirection: 'column', alignItems: 'center', opacity: diceRoll.final ? 0.5 : 1}}>
                            {diceRoll.final && <div style={{color: '#888', fontStyle: 'italic'}}>Dropped Roll</div>}
                            <div style={{display: 'flex', gap: '15px'}}>
                              {diceRoll.results2.map((res, i) => (
                                <div key={`res2-${i}`} style={{
                                  width: '80px', height: '80px', background: '#222', border: '3px solid #444', borderRadius: '12px',
                                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                                }}>
                                  <div style={{fontSize: '12px', color: '#888'}}>D{diceRoll.max}</div>
                                  <div style={{fontSize: '36px', color: '#aaa', fontWeight: 'bold'}}>{res}</div>
                                </div>
                              ))}
                            </div>
                         </div>
                      )}
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
                 
                 {/* Defender Roll (Duel) */}
                 {diceRoll.duel && (
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', borderLeft: '2px solid #555', paddingLeft: '40px'}}>
                       <h3 style={{color: '#ddd', marginTop: 0}}>Defender</h3>
                       <div style={{display: 'flex', gap: '30px', marginBottom: '15px', justifyContent: 'center'}}>
                         <div style={{display: 'flex', gap: '15px', flexDirection: 'column', alignItems: 'center'}}>
                            {diceRoll.final && diceRoll.duelResults2 && <div style={{color: '#ffaa00', fontWeight: 'bold'}}>Chosen Roll</div>}
                            <div style={{display: 'flex', gap: '15px'}}>
                              {(diceRoll.duelResults || []).map((res, i) => (
                                <div key={`def-res1-${i}`} style={{
                                  width: '80px', height: '80px', background: '#333', border: '3px solid #666', borderRadius: '12px',
                                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                  boxShadow: diceRoll.final ? '0 0 20px #ffaa00' : 'none',
                                  transition: 'box-shadow 0.3s'
                                }}>
                                  <div style={{fontSize: '12px', color: '#aaa'}}>D{diceRoll.duelMax}</div>
                                  <div style={{fontSize: '36px', color: '#fff', fontWeight: 'bold'}}>{res}</div>
                                </div>
                              ))}
                            </div>
                         </div>
                         {diceRoll.duelResults2 && (
                            <div style={{display: 'flex', gap: '15px', flexDirection: 'column', alignItems: 'center', opacity: diceRoll.final ? 0.5 : 1}}>
                               {diceRoll.final && <div style={{color: '#888', fontStyle: 'italic'}}>Dropped Roll</div>}
                               <div style={{display: 'flex', gap: '15px'}}>
                                 {(diceRoll.duelResults2 || []).map((res, i) => (
                                   <div key={`def-res2-${i}`} style={{
                                     width: '80px', height: '80px', background: '#222', border: '3px solid #444', borderRadius: '12px',
                                     display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                                   }}>
                                     <div style={{fontSize: '12px', color: '#888'}}>D{diceRoll.duelMax}</div>
                                     <div style={{fontSize: '36px', color: '#aaa', fontWeight: 'bold'}}>{res}</div>
                                   </div>
                                 ))}
                               </div>
                            </div>
                         )}
                       </div>
                       {diceRoll.duelModifierStat && (
                         <div style={{fontSize: '24px', color: '#ddd', marginBottom: '15px'}}>
                           + {diceRoll.duelModValue} <span style={{fontSize: '16px', color: '#aaa'}}>({diceRoll.duelModifierStat})</span>
                         </div>
                       )}
                       {diceRoll.final && (
                         <div style={{fontSize: '48px', color: '#ff4500', fontWeight: 'bold', textShadow: '0 0 20px #ff4500'}}>
                           {diceRoll.duelTotalDamage} DAMAGE!
                         </div>
                       )}
                    </div>
                 )}
                 
              </div>
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
          <div className="context-menu-header">{contextMenu.targetType.replace('card_', '').toUpperCase()}</div>
              
          {contextMenu.targetType === 'battlefield' && (
             <div className="context-menu-item" onClick={() => {
                 setContextMenu(prev => ({ ...prev, visible: false }));
                 setDiceModal(prev => ({ ...prev, active: true }));
             }}>🎲 Roll Dice</div>
          )}

          {contextMenu.targetType === 'archive' && (
            <>
              <div className="context-menu-item" onClick={actionDrawCard}>Draw card</div>
              <div className="context-menu-item" onClick={actionDrawCards}>Draw cards...</div>
              <div className="context-menu-item" onClick={actionUndoDraw}>Undo last draw</div>
              
              <div style={{borderTop: '1px solid #444', margin: '0.25rem 0'}}></div>
              
              <div className="context-menu-item" onClick={actionShuffleArchive}>Shuffle</div>
              
              <div style={{borderTop: '1px solid #444', margin: '0.25rem 0'}}></div>

              <div className="context-menu-item" onClick={() => { setArchiveView({visible: true, mode: 'all', count: 0}); setContextMenu(prev=>({...prev, visible: false})); }}>View library</div>
              <div className="context-menu-item" onClick={() => { 
                const count = parseInt(prompt("View top how many cards?", "3"), 10) || 3;
                setArchiveView({visible: true, mode: 'topX', count}); 
                setContextMenu(prev=>({...prev, visible: false})); 
              }}>View top cards of library...</div>
              <div className="context-menu-item" onClick={() => { 
                const count = parseInt(prompt("View bottom how many cards?", "3"), 10) || 3;
                setArchiveView({visible: true, mode: 'bottomX', count}); 
                setContextMenu(prev=>({...prev, visible: false})); 
              }}>View bottom cards of library...</div>

              <div style={{borderTop: '1px solid #444', margin: '0.25rem 0'}}></div>

              <div className="context-menu-item" onClick={() => {
                 setArchiveModifiers(prev => ({ ...prev, alwaysRevealTop: !prev.alwaysRevealTop, alwaysLookAtTop: false }));
                 setContextMenu(prev=>({...prev, visible: false})); 
              }}>
                 {archiveModifiers.alwaysRevealTop ? 'Stop revealing top card' : 'Always reveal top card'}
              </div>
              
              <div className="context-menu-item" onClick={() => {
                 setArchiveModifiers(prev => ({ ...prev, alwaysLookAtTop: !prev.alwaysLookAtTop, alwaysRevealTop: false }));
                 setContextMenu(prev=>({...prev, visible: false})); 
              }}>
                 {archiveModifiers.alwaysLookAtTop ? 'Stop looking at top card' : 'Always look at top card'}
              </div>
            </>
          )}
          
          {(contextMenu.targetType === 'card_timeline' || contextMenu.targetType === 'card_location' || contextMenu.targetType === 'card_hero') && (
            <>
              <div className="context-menu-item" onClick={() => actionDrawArrow(contextMenu.targetData, contextMenu.targetType)}>Draw Arrow...</div>
              <div className="context-menu-item" onClick={() => actionToggleTap(contextMenu.targetData, contextMenu.targetType.replace('card_', ''))}>Engage / Disengage</div>
              <div className="context-menu-item" onClick={() => actionAddCounter(contextMenu.targetData, contextMenu.targetType.replace('card_', ''))}>Add Counter</div>
              <div className="context-menu-item" onClick={() => actionRemoveCounter(contextMenu.targetData, contextMenu.targetType.replace('card_', ''))}>Remove Counter</div>
              {contextMenu.targetType !== 'card_hero' && (
                <>
                  <div style={{borderTop: '1px solid #444', margin: '0.25rem 0'}}></div>
                  <div className="context-menu-item" onClick={() => actionReturnToHand(contextMenu.targetData, contextMenu.targetType === 'card_timeline' ? 'timeline' : 'locations')}>Return to Hand</div>
                  <div className="context-menu-item" onClick={() => actionResolveCard(contextMenu.targetData, contextMenu.targetType === 'card_timeline' ? 'timeline' : 'locations')}>
                    {contextMenu.targetType === 'card_timeline' ? 'Resolve Card' : 'Send to Dungeon'}
                  </div>
                  <div className="context-menu-item" onClick={() => actionSendToBottom(contextMenu.targetData, contextMenu.targetType === 'card_timeline' ? 'timeline' : 'locations')}>Send to Bottom of Archive</div>
                </>
              )}
              {contextMenu.targetType === 'card_hero' && (
                <>
                  <div style={{borderTop: '1px solid #444', margin: '0.25rem 0'}}></div>
                  <div className="context-menu-item" onClick={() => {
                    setAnnotationModal({ active: true, cardUid: contextMenu.targetData.uid, source: 'hero', text: contextMenu.targetData.annotations || '' });
                    setContextMenu(prev => ({...prev, visible: false}));
                  }}>Set Annotations...</div>
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
              <div className="context-menu-item" onClick={() => actionRevealArchiveCard(contextMenu.targetData)}>Reveal</div>
              <div style={{borderTop: '1px solid #444', margin: '0.25rem 0'}}></div>
              <div className="context-menu-item" onClick={() => actionArchiveToHand(contextMenu.targetData)}>Send to Hand</div>
              <div className="context-menu-item" onClick={() => actionArchiveToDungeon(contextMenu.targetData)}>Send to Dungeon</div>
              <div className="context-menu-item" onClick={() => actionArchiveToVoid(contextMenu.targetData)}>Send to Void</div>
              <div style={{borderTop: '1px solid #444', margin: '0.25rem 0'}}></div>
              <div className="context-menu-item" onClick={() => actionArchiveMoveToTop(contextMenu.targetData)}>Move to Top</div>
              <div className="context-menu-item" onClick={() => actionArchiveMoveToBottom(contextMenu.targetData)}>Move to Bottom</div>
            </>
          )}

          {contextMenu.targetType === 'card_hand' && (
            <>
              <div className="context-menu-item" onClick={() => actionPlayCardFromHand(contextMenu.targetData, false)}>Play</div>
              <div className="context-menu-item" onClick={() => actionPlayCardFromHand(contextMenu.targetData, true)}>Play Face Down</div>
              <div className="context-menu-item" onClick={() => actionRevealCard(contextMenu.targetData)}>{contextMenu.targetData.isRevealed ? 'Hide' : 'Reveal'}</div>
              
              <div style={{borderTop: '1px solid #444', margin: '0.25rem 0'}}></div>

              <div className="context-menu-item" onClick={() => actionMoveHandToTop(contextMenu.targetData)}>Move to Top of library</div>
              <div className="context-menu-item" onClick={() => actionMoveHandToX(contextMenu.targetData)}>Move to X cards from top of library...</div>
              <div className="context-menu-item" onClick={() => actionMoveHandToBottom(contextMenu.targetData)}>Move to Bottom of library</div>
              
              <div style={{borderTop: '1px solid #444', margin: '0.25rem 0'}}></div>

              <div className="context-menu-item" onClick={() => actionMoveToZone(contextMenu.targetData, 'timeline')}>Move to Table</div>
              
              <div className="context-menu-item has-submenu">
                <span>Discard</span> <span>▶</span>
                <div className="context-menu-submenu">
                  <div className="context-menu-item" onClick={(e) => { e.stopPropagation(); actionMoveToZone(contextMenu.targetData, 'dungeon'); }}>Dungeon</div>
                  <div className="context-menu-item" onClick={(e) => { e.stopPropagation(); actionMoveToZone(contextMenu.targetData, 'void'); }}>Void</div>
                </div>
              </div>

              <div style={{borderTop: '1px solid #444', margin: '0.25rem 0'}}></div>
              
              <div className="context-menu-item" onClick={() => actionAttachCard(contextMenu.targetData)}>Attach to card...</div>
            </>
          )}

          {contextMenu.targetType === 'card_attached' && (
            <>
              <div className="context-menu-item" onClick={() => actionDrawArrow(contextMenu.targetData.card, contextMenu.targetType)}>Draw Arrow...</div>
              <div className="context-menu-item" onClick={() => actionDetachCard(contextMenu.targetData.card, contextMenu.targetData.parentUid, contextMenu.targetData.zone, 'timeline')}>Detach (Move to Table)</div>
              <div className="context-menu-item" onClick={() => actionDetachCard(contextMenu.targetData.card, contextMenu.targetData.parentUid, contextMenu.targetData.zone, 'hand')}>Return to Hand</div>
              
              <div className="context-menu-item has-submenu">
                <span>Discard</span> <span>▶</span>
                <div className="context-menu-submenu">
                  <div className="context-menu-item" onClick={(e) => { e.stopPropagation(); actionDetachCard(contextMenu.targetData.card, contextMenu.targetData.parentUid, contextMenu.targetData.zone, 'dungeon'); }}>Dungeon</div>
                  <div className="context-menu-item" onClick={(e) => { e.stopPropagation(); actionDetachCard(contextMenu.targetData.card, contextMenu.targetData.parentUid, contextMenu.targetData.zone, 'void'); }}>Void</div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

    </div>
    {arrows.map(arrow => (
        <Xarrow key={arrow.id} start={arrow.startDomId} end={arrow.endDomId} color={arrow.color} strokeWidth={4} headSize={6} passProps={{style: {pointerEvents: 'none'}}} />
    ))}
    </div>
    </Xwrapper>
  );
}











