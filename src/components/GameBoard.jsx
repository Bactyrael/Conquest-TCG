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

  // Drag and Drop Logic
  const handleDragStart = (e, uid, sourceZone) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ uid, sourceZone }));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
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
    } else if (sourceZone === 'timeline') {
      cardToMove = timeline.find(c => c.uid === uid);
      if (cardToMove) setTimeline(prev => prev.filter(c => c.uid !== uid));
    } else if (sourceZone === 'locations') {
      cardToMove = playerLocations.find(c => c.uid === uid);
      if (cardToMove) setPlayerLocations(prev => prev.filter(c => c.uid !== uid));
    }

    if (!cardToMove) return;

    // 2. Add to target
    if (targetZone === 'timeline') {
      setTimeline(prev => [...prev, cardToMove]);
    } else if (targetZone === 'dungeon') {
      setDungeon(prev => [...prev, cardToMove]);
    } else if (targetZone === 'void') {
      setVoidZone(prev => [...prev, cardToMove]);
    } else if (targetZone === 'locations') {
      setPlayerLocations(prev => [...prev, cardToMove]);
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

  // Calculate Dynamic Stats
  const getStat = (statFull) => {
    let val = 0;
    // Check both locations and timeline for stat bonuses (like 'Gain +1 Strength' or '+2 Dexterity')
    [...playerLocations, ...timeline].forEach(card => {
      if (card.rulesText) {
        const regex = new RegExp(`([-+])?(\\d+)\\s*${statFull}`, 'i');
        const match = card.rulesText.match(regex);
        if (match) {
          const sign = match[1] === '-' ? -1 : 1;
          val += sign * parseInt(match[2], 10);
        }
      }
    });
    return val;
  };

  return (
    <div className="game-board">
      
      {/* PHASE BAR */}
      <div className="phase-bar">
        <button className="phase-btn pass-btn" onClick={() => {
          const currentIndex = phases.findIndex(p => p.id === currentPhase);
          if (currentIndex === phases.length - 1) {
            // Passing from End phase -> Change active player and go to upkeep
            setActivePlayer(prev => prev === 'player' ? 'opponent' : 'player');
            setCurrentPhase(phases[0].id);
          } else {
            setCurrentPhase(phases[currentIndex + 1].id);
          }
        }}>
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
              <div className="hero-card-wrapper">
                 <div className="mini-hero" style={{border: '2px dashed #444'}}>
                    <div style={{color: '#555', textAlign: 'center', padding: '20px'}}>Opponent Hero</div>
                 </div>
              </div>
            </div>
            
            <div className="player-stats-vertical">
              <div className="stat-box hp">HP: 20</div>
              <div className="stat-box def">DEF: 2</div>
              <div className="stat-box res">RES: 1</div>
            </div>

            <div className="location-zone">
              <div className="location-slot empty">Location</div>
            </div>
          </div>

          <div className="deck-zones">
             <div className="zone-slot archive">
               <img src="/cards/backs/000_back.png" alt="Opponent Deck" className="deck-back-image" />
               <div className="archive-count">60</div>
             </div>
             <div className="zone-slot dungeon">Dungeon</div>
             <div className="zone-slot void">Void</div>
          </div>
        </div>
      </div>

      {/* TIMELINE AREA (Middle) */}
      <div className="timeline-area">
         {!heroCard && (
           <div style={{position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
              <h2 style={{color: '#fff', textShadow: '2px 2px 4px #000'}}>Load a Deck to Begin</h2>
              {Object.keys(savedDecks).length > 0 ? (
                <select onChange={loadDeck} className="editor-select" value="" style={{padding: '10px', fontSize: '1.2rem', marginTop: '10px'}}>
                  <option value="" disabled>Select Deck...</option>
                  {Object.keys(savedDecks).map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
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
              <div className="hero-card-wrapper">
                  <div className={`mini-hero ${heroCard?.isTapped ? 'tapped' : ''}`}
                       onDoubleClick={() => heroCard && actionToggleTap(heroCard, 'hero')}
                       onContextMenu={(e) => heroCard && handleContextMenu(e, 'card_hero', heroCard)}
                  >
                    {heroCard ? (
                      <>
                        {heroCard.counters > 0 && <div className="card-counter-badge">{heroCard.counters}</div>}
                        <Card data={heroCard} />
                        <button className="board-zoom-btn" onClick={(e) => { e.stopPropagation(); setZoomedCard(heroCard); }}>🔍</button>
                      </>
                    ) : (
                      <div style={{color: '#555', textAlign: 'center', padding: '20px'}}>No Hero</div>
                    )}
                 </div>
              </div>
            </div>
            
            <div className="player-stats-vertical">
              <div className="stat-box hp">HP: 20</div>
              <div className="stat-box def">DEF: 3</div>
              <div className="stat-box res">RES: 4</div>
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
            {hand.map((card) => (
               <motion.div 
                 className="hand-card-wrapper" 
                 key={card.uid} 
                 draggable
                 onDragStart={(e) => handleDragStart(e, card.uid, 'hand')}
                 onClick={() => playCard(card.uid)}
                 title="Click to Play to Timeline"
                 initial={{ y: 100, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 exit={{ y: -100, opacity: 0 }}
                 layout
               >
                 <Card data={card} />
                 <button className="board-zoom-btn" onClick={(e) => { e.stopPropagation(); setZoomedCard(card); }}>🔍</button>
               </motion.div>
            ))}
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
                <div key={card.uid} className="zone-view-card-wrapper">
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
      </div>
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
        </div>
      )}

    </div>
  );
}
