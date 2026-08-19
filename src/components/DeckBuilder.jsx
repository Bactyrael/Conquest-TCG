import React, { useState, useEffect } from 'react';
import { getBackendUrl } from '../utils/api';
import './DeckBuilder.css';

import Card from './Card';

export default function DeckBuilder() {
  const [db, setDb] = useState([]);
  const [deck, setDeck] = useState([]);
  const [deckName, setDeckName] = useState('My Deck');
  const [savedDecks, setSavedDecks] = useState({});
  const [zoomedCard, setZoomedCard] = useState(null);
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statFilters, setStatFilters] = useState({
    str: false, dex: false, con: false, int: false, wis: false, luc: false
  });

  const toggleStat = (stat) => {
    setStatFilters(prev => ({...prev, [stat]: !prev[stat]}));
  };

  useEffect(() => {
    fetch(getBackendUrl() + '/api/cards')
      .then(res => res.json())
      .then(data => setDb(data))
      .catch(err => console.error('Failed to load card db:', err));
    const fetchDecks = async () => {
      try {
        const token = localStorage.getItem('tcg-token');
        if (!token) return;
        
        const res = await fetch(`${getBackendUrl()}/api/decks`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 401 || res.status === 403) { alert('Session expired.'); localStorage.removeItem('tcg-token'); window.location.reload(); return; }
                        if (res.ok) {
          const data = await res.json();
          setSavedDecks(data);
        }
      } catch (e) {
        console.error('Failed to load decks from server', e);
      }
    };
    fetchDecks();
  }, []);

  const handleLoadDeck = (e) => {
    const name = e.target.value;
    if (!name) return;
    
    const rawDeckNames = savedDecks[name] || [];
    const freshDeck = rawDeckNames.map(cardName => {
        const actualName = typeof cardName === 'string' ? cardName : cardName.name;
        const dbCard = db.find(dbC => dbC.name === actualName);
        if (!dbCard) return null;
        return { ...dbCard, uid: Math.random().toString() };
      }).filter(c => c !== null);

    setDeck(freshDeck);
    setDeckName(name);
  };

  const handleSaveDeck = async () => {
    if (deck.length !== 61) {
      alert("A deck must contain exactly 61 cards (1 Hero and 60 other cards) to be saved.");
      return;
    }
    const heroCount = deck.filter(c => c.type === 'Hero').length;
    if (heroCount !== 1) {
      alert("A deck must contain exactly 1 Hero card.");
      return;
    }
    if (!deckName.trim()) {
      alert("Please enter a deck name.");
      return;
    }

    try {
      const token = localStorage.getItem('tcg-token');
      if (!token) {
        alert('You must be logged in to save decks.');
        return;
      }

      const cardNames = deck.map(c => c.name);

      const res = await fetch(`${getBackendUrl()}/api/decks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ deck_name: deckName, cards: cardNames })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save deck');
      }

      const updatedDecks = { ...savedDecks, [deckName]: cardNames };
      setSavedDecks(updatedDecks);
      alert(`Deck "${deckName}" saved!`);
    } catch (e) {
      alert(e.message);
    }
  };
  const addToDeck = (card) => {
    if (deck.length >= 61) {
      alert("Maximum deck size reached (61 cards).");
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
    const matchesName = c.name?.toLowerCase().includes(filter.toLowerCase()) || (c.rawText || c.rulesText || '')?.toLowerCase().includes(filter.toLowerCase()) || (c.flavorText || '')?.toLowerCase().includes(filter.toLowerCase());
    
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
      const statNames = {
        str: 'strength',
        dex: 'dexterity',
        con: 'constitution',
        int: 'intelligence',
        wis: 'wisdom',
        luc: 'luck'
      };
      
      matchesStats = activeStats.some(stat => {
        const hasReq = c.requirements && c.requirements[stat] > 0;
        const textMatch = (c.rawText || c.rulesText || '')?.toLowerCase().includes(statNames[stat]) || (c.flavorText || '')?.toLowerCase().includes(statNames[stat]);
        const titleMatch = c.name?.toLowerCase().includes(statNames[stat]);
        return hasReq || textMatch || titleMatch;
      });
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
               <Card data={card} />
               <div className="catalog-card-overlay">
                 <div style={{fontSize: '0.9rem', color: '#fff'}}>Click to Add</div>
                 <button 
                   className="zoom-btn"
                   onClick={(e) => {
                     e.stopPropagation();
                     setZoomedCard(card);
                   }}
                 >
                   🔍
                 </button>
               </div>
             </div>
          ))}
        </div>
      </div>

      <div className="deck-panel">
        <div style={{display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px'}}>
          <h2>Your Deck ({deck.length}/61)</h2>
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
           <button className="remove-btn" style={{padding: '0.8rem', background: '#d32f2f', color: '#fff'}} 
              onClick={async () => { 
                if(window.confirm('Delete this deck?')) {
                  if (savedDecks[deckName]) {
                    try {
                      const res = await fetch(`${getBackendUrl()}/api/decks/${encodeURIComponent(deckName)}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('tcg-token')}` }
                      });
                      if (res.ok) {
                        const newSaved = {...savedDecks};
                        delete newSaved[deckName];
                        setSavedDecks(newSaved);
                        setDeck([]);
                        alert('Deck deleted.');
                      } else {
                        const data = await res.json();
                        alert(data.error || 'Failed to delete');
                      }
                    } catch(e) {
                      alert('Error deleting deck');
                    }
                  } else {
                    setDeck([]);
                  }
                }
              }}>Clear / Delete</button>
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

    </div>
  );
}
