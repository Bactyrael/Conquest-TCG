import React, { useState, useEffect } from 'react';
import './DeckBuilder.css';
import cardDatabase from '../data/cardDatabase.json';

export default function DeckBuilder() {
  const [db, setDb] = useState([]);
  const [deck, setDeck] = useState([]);
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  useEffect(() => {
    // Load the OCR generated database
    setDb(cardDatabase);
  }, []);

  const addToDeck = (card) => {
    if (deck.length >= 60) return;
    setDeck([...deck, card]);
  };

  const removeFromDeck = (uid) => {
    setDeck(deck.filter(c => c.uid !== uid));
  };

  const filteredDb = db.filter(c => {
    const matchesName = c.name?.toLowerCase().includes(filter.toLowerCase()) || c.rawText?.toLowerCase().includes(filter.toLowerCase());
    
    let matchesType = false;
    if (typeFilter === 'All') matchesType = true;
    else if (typeFilter === 'Act') {
      matchesType = c.type?.includes('Action') || c.type?.includes('Reaction');
    } else if (typeFilter === 'Action') {
      matchesType = c.type?.startsWith('Action') || c.type === 'Action';
    } else if (typeFilter === 'Bonus Action') {
      matchesType = c.type?.startsWith('Bonus Action');
    } else if (typeFilter === 'Reaction') {
      matchesType = c.type?.startsWith('Reaction');
    } else if (typeFilter === 'Location') {
      matchesType = c.type?.includes('Location');
    } else {
      matchesType = c.type === typeFilter;
    }
    
    return matchesName && matchesType;
  });

  const uniqueTypes = ['All', 'Hero', 'Act', 'Action', 'Bonus Action', 'Reaction', 'Location'];

  return (
    <div className="deck-builder-container">
      <div className="catalog-panel">
        <div className="catalog-header">
           <h2>Card Catalog</h2>
           <div className="catalog-filters">
             <select 
               value={typeFilter} 
               onChange={(e) => setTypeFilter(e.target.value)}
               className="type-select"
             >
               {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
             </select>
             <input 
               type="text" 
               placeholder="Search text..." 
               value={filter}
               onChange={(e) => setFilter(e.target.value)}
               className="search-input"
             />
           </div>
        </div>
        
        <div className="catalog-grid">
          {filteredDb.map((card, i) => (
             <div className="catalog-card-wrapper" key={card.id || i} onClick={() => addToDeck({...card, uid: Math.random().toString()})}>
               <img src={card.artUrl || card.imageUrl} alt={card.name} />
               <div className="catalog-card-overlay">
                 <div>{card.type}</div>
                 <div style={{fontSize: '0.7rem', color: '#aaa'}}>Click to Add</div>
               </div>
             </div>
          ))}
        </div>
      </div>

      <div className="deck-panel">
        <h2>Your Deck ({deck.length}/60)</h2>
        <div className="deck-list">
          {deck.map((card) => (
            <div className="deck-list-item" key={card.uid} onClick={() => removeFromDeck(card.uid)}>
              <span className="deck-item-name">{card.name}</span>
              <button className="remove-btn">x</button>
            </div>
          ))}
        </div>
        <div className="deck-actions">
           <button className="save-deck-btn">Save Deck</button>
        </div>
      </div>
    </div>
  );
}
