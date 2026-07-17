import React, { useState, useEffect } from 'react';
import './DeckBuilder.css';
import cardDatabase from '../data/cardDatabase.json';

export default function DeckBuilder() {
  const [db, setDb] = useState([]);
  const [deck, setDeck] = useState([]);
  const [deckName, setDeckName] = useState('My Deck');
  const [savedDecks, setSavedDecks] = useState({});
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statFilters, setStatFilters] = useState({
    str: false, dex: false, con: false, int: false, wis: false, luc: false
  });

  const toggleStat = (stat) => {
    setStatFilters(prev => ({...prev, [stat]: !prev[stat]}));
  };

  useEffect(() => {
    setDb(cardDatabase);
    const loaded = localStorage.getItem('conquest-tcg-decks');
    if (loaded) {
      setSavedDecks(JSON.parse(loaded));
    }
  }, []);

  const handleSaveDeck = () => {
    if (deck.length === 0) {
      alert("Cannot save an empty deck.");
      return;
    }
    if (!deckName.trim()) {
      alert("Please enter a deck name.");
      return;
    }
    const updatedDecks = { ...savedDecks, [deckName]: deck };
    setSavedDecks(updatedDecks);
    localStorage.setItem('conquest-tcg-decks', JSON.stringify(updatedDecks));
    alert(`Deck "${deckName}" saved!`);
  };

  const handleLoadDeck = (e) => {
    const name = e.target.value;
    if (!name) return;
    setDeck(savedDecks[name]);
    setDeckName(name);
  };

  const addToDeck = (card) => {
    if (deck.length >= 60) {
      alert("Maximum deck size reached (60 cards).");
      return;
    }
    
    if (card.type === 'Hero') {
      const heroCount = deck.filter(c => c.type === 'Hero').length;
      if (heroCount >= 1) {
        alert("You can only have 1 Hero card per deck.");
        return;
      }
    }
    
    const isCommonLocation = card.type === 'Location' && card.rarity === 'Common';
    
    if (card.type !== 'Hero' && !isCommonLocation) {
      const copyCount = deck.filter(c => c.name === card.name).length;
      if (copyCount >= 4) {
        alert("You can only have a maximum of 4 copies of any specific card (excluding Common Locations).");
        return;
      }
    }

    setDeck([...deck, card]);
  };

  const removeFromDeck = (name) => {
    const index = deck.findIndex(c => c.name === name);
    if (index !== -1) {
      const newDeck = [...deck];
      newDeck.splice(index, 1);
      setDeck(newDeck);
    }
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
    
    let matchesStats = true;
    const activeStats = Object.keys(statFilters).filter(s => statFilters[s]);
    if (activeStats.length > 0) {
      if (!c.requirements) {
        matchesStats = false;
      } else {
        matchesStats = activeStats.some(stat => c.requirements[stat] > 0);
      }
    }
    
    return matchesName && matchesType && matchesStats;
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
           <div className="stat-filters" style={{display: 'flex', gap: '5px', marginTop: '10px', justifyContent: 'center'}}>
             {Object.keys(statFilters).map(stat => (
               <button 
                 key={stat}
                 onClick={() => toggleStat(stat)}
                 style={{
                   padding: '5px 10px',
                   borderRadius: '4px',
                   border: '1px solid #555',
                   background: statFilters[stat] ? '#4CAF50' : '#222',
                   color: '#fff',
                   cursor: 'pointer',
                   textTransform: 'uppercase',
                   fontSize: '0.8rem',
                   fontWeight: 'bold'
                 }}
               >
                 {stat}
               </button>
             ))}
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
        <div style={{display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px'}}>
          <h2>Your Deck ({deck.length}/60)</h2>
          <div style={{display: 'flex', gap: '10px'}}>
            <input 
              type="text" 
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              className="editor-input"
              style={{flex: 1}}
              placeholder="Deck Name"
            />
            {Object.keys(savedDecks).length > 0 && (
              <select onChange={handleLoadDeck} className="editor-select" style={{width: '120px'}} value="">
                <option value="" disabled>Load Deck...</option>
                {Object.keys(savedDecks).map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            )}
          </div>
        </div>
        
        <div className="deck-list">
          {Object.values(deck.reduce((acc, card) => {
            if (!acc[card.name]) acc[card.name] = { card, count: 0 };
            acc[card.name].count++;
            return acc;
          }, {})).sort((a, b) => a.card.name.localeCompare(b.card.name))
           .map(({ card, count }) => (
            <div className="deck-list-item" key={card.name} onClick={() => removeFromDeck(card.name)}>
              <span className="deck-item-name">{count}x {card.name}</span>
              <button className="remove-btn">x</button>
            </div>
          ))}
        </div>
        <div className="deck-actions">
           <button className="save-deck-btn" onClick={handleSaveDeck}>Save Deck</button>
           <button className="remove-btn" style={{padding: '0.8rem', background: '#d32f2f', color: '#fff'}} onClick={() => { if(window.confirm('Clear current deck?')) setDeck([]) }}>Clear Deck</button>
        </div>
      </div>
    </div>
  );
}
