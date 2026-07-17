import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './GameBoard.css';
import Card from './Card';
import { mockCards } from '../data/mockCards';

// Helper to generate a larger mock deck
const generateDeck = () => {
  let deck = [];
  for (let i = 0; i < 5; i++) {
    deck = [...deck, ...mockCards.filter(c => c.name !== 'Aelastion').map(c => ({ ...c, uid: Math.random().toString() }))];
  }
  return deck.sort(() => Math.random() - 0.5);
};

export default function GameBoard() {
  const heroCard = mockCards.find(c => c.name === 'Aelastion');

  // Local Game State
  const [archive, setArchive] = useState(generateDeck());
  const [hand, setHand] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [dungeon, setDungeon] = useState([]);
  const [voidZone, setVoidZone] = useState([]);
  
  // New Location/Attachments Zone State
  const [playerLocations, setPlayerLocations] = useState([]);

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

  return (
    <div className="game-board">
      
      {/* OPPONENT AREA */}
      <div className="player-area opponent-area">
        <div className="location-zone">
          <div className="location-slot empty">Location</div>
        </div>

        <div className="player-area-main-row">
          <div className="left-spacer"></div>
          
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
                 <div className="mini-hero">
                    <img src={heroCard.artUrl} alt="Opponent Hero" />
                 </div>
              </div>
            </div>
            
            <div className="player-stats-vertical">
              <div className="stat-box hp">HP: 20</div>
              <div className="stat-box def">DEF: 2</div>
              <div className="stat-box res">RES: 1</div>
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
         <div className="timeline-track">
            {timeline.length === 0 && <span>Timeline / Active Cards (Click hand to play)</span>}
            <AnimatePresence mode="popLayout">
              {timeline.map((card) => (
                <motion.div 
                  className="timeline-card-wrapper" 
                  key={card.uid}
                  initial={{ opacity: 0, scale: 0.5, y: 50 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0, y: -50 }}
                  layout
                >
                  <div className="timeline-mini-card">
                    <strong>{card.name}</strong>
                    <div className="timeline-actions">
                      <button onClick={() => resolveToDungeon(card.uid)}>To Dungeon</button>
                      <button onClick={() => resolveToVoid(card.uid)} style={{color: '#c4b5fd', borderColor: '#c4b5fd'}}>To Void</button>
                      {(card.type && card.type.includes('Location')) && (
                        <button onClick={() => playToLocation(card.uid)} style={{color: '#84cc16', borderColor: '#84cc16'}}>Set Location</button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
         </div>
      </div>

      {/* PLAYER AREA */}
      <div className="player-area">
        <div className="player-area-main-row">
          <div className="left-spacer"></div>
          
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
                 <div className="mini-hero">
                    <img src={heroCard.artUrl} alt="Player Hero" />
                 </div>
              </div>
            </div>
            
            <div className="player-stats-vertical">
              <div className="stat-box hp">HP: 20</div>
              <div className="stat-box def">DEF: 3</div>
              <div className="stat-box res">RES: 4</div>
            </div>
          </div>

          <div className="deck-zones">
             <div className="zone-slot void">Void ({voidZone.length})</div>
             <div className="zone-slot dungeon">Dungeon ({dungeon.length})</div>
             <div 
               className="zone-slot archive interactive" 
               onClick={drawCard}
               title="Click to Draw"
             >
               <img src="/cards/backs/000_back.png" alt="Player Deck" className="deck-back-image" />
               <div className="archive-count">{archive.length}</div>
             </div>
          </div>
        </div>

        <div className="location-zone">
          {playerLocations.length === 0 && <div className="location-slot empty">Location</div>}
          {playerLocations.map(loc => (
            <div className="location-slot active" key={loc.uid}>
               <img src={loc.artUrl} alt={loc.name} />
               <div className="loc-label">{loc.name}</div>
            </div>
          ))}
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
                 onClick={() => playCard(card.uid)}
                 title="Click to Play to Timeline"
                 initial={{ y: 100, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 exit={{ y: -100, opacity: 0 }}
                 layout
               >
                 <Card data={card} />
               </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}
