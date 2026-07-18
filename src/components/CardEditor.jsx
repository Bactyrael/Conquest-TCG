import React, { useState, useEffect } from 'react';
import cardDatabase from '../data/cardDatabase.json';
import './CardEditor.css';

export default function CardEditor() {
  const [cards, setCards] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Deep clone to avoid mutating the imported module
    setCards(JSON.parse(JSON.stringify(cardDatabase)));
  }, []);

  const handleUpdateCard = (id, field, value) => {
    setCards(prevCards => 
      prevCards.map(c => c.id === id ? { ...c, [field]: value } : c)
    );
  };

  const handleUpdateRequirement = (id, reqField, value) => {
    setCards(prevCards => 
      prevCards.map(c => {
        if (c.id === id) {
          const updatedReqs = { ...(c.requirements || {}), [reqField]: Number(value) };
          return { ...c, requirements: updatedReqs };
        }
        return c;
      })
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch('http://localhost:3001/api/save-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cards),
      });
      
      if (response.ok) {
        setMessage('Successfully saved to database!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Error saving to database.');
      }
    } catch (err) {
      console.error(err);
      setMessage('Failed to connect to backend server.');
    } finally {
      setSaving(false);
    }
  };

  const uniqueTypes = ['Hero', 'Action', 'Bonus Action', 'Reaction', 'Location', 'Duel', 'Onslaught', 'Unknown'];
  const uniqueRarities = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic', 'None'];
  const uniqueSubtypes = ['Ability', 'Spell', 'Curse', 'Boon'];

  return (
    <div className="editor-container">
      <div className="editor-header">
        <div>
          <h2>Card Database Editor</h2>
          <p>Quickly map card names and fix OCR mistakes.</p>
        </div>
        <div className="editor-actions">
           {message && <span className="save-message">{message}</span>}
           <button 
             className="save-btn" 
             onClick={handleSave}
             disabled={saving}
           >
             {saving ? 'Saving...' : 'Save All Changes'}
           </button>
        </div>
      </div>
      
      <div className="editor-grid">
        {cards.map(card => (
          <div key={card.id} className="editor-card-row">
            <div className="editor-card-image">
               <img src={card.artUrl || card.imageUrl} alt={card.name} />
            </div>
            
            <div className="editor-card-form">
               <div className="form-group">
                 <label>Name (ID: {card.id})</label>
                 <input 
                   type="text" 
                   value={card.name} 
                   onChange={(e) => handleUpdateCard(card.id, 'name', e.target.value)}
                   className="editor-input"
                 />
               </div>
               
               <div className="form-group-row">
                 <div className="form-group" style={{flex: 1}}>
                   <label>Type</label>
                   <select 
                     value={card.type || ''} 
                     onChange={(e) => handleUpdateCard(card.id, 'type', e.target.value)}
                     className="editor-select"
                   >
                     {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
                   </select>
                 </div>
                 
                 <div className="form-group" style={{flex: 1}}>
                   <label>{card.type === 'Hero' ? 'Attack:' : 'Subtype'}</label>
                   {['Action', 'Bonus Action', 'Reaction'].includes(card.type) ? (
                     <select
                       value={card.subtype || ''}
                       onChange={(e) => handleUpdateCard(card.id, 'subtype', e.target.value)}
                       className="editor-select"
                     >
                       <option value="">None</option>
                       {uniqueSubtypes.map(s => <option key={s} value={s}>{s}</option>)}
                     </select>
                   ) : (
                     <input 
                       type="text" 
                       value={card.subtype || ''} 
                       onChange={(e) => handleUpdateCard(card.id, 'subtype', e.target.value)}
                       className="editor-input"
                     />
                   )}
                 </div>
                 
                 <div className="form-group" style={{flex: 1}}>
                   <label>Rarity</label>
                   <select 
                     value={card.rarity || 'None'} 
                     onChange={(e) => handleUpdateCard(card.id, 'rarity', e.target.value)}
                     className="editor-select"
                   >
                     {uniqueRarities.map(r => <option key={r} value={r}>{r}</option>)}
                   </select>
                 </div>
               </div>
               
               <div className="form-group-row">
                 {['str', 'dex', 'con', 'int', 'wis', 'luc'].map(stat => (
                   <div className="form-group" key={stat} style={{flex: 1, textAlign: 'center'}}>
                     <label style={{fontSize: '0.7rem', color: '#888'}}>{stat.toUpperCase()}</label>
                     <input 
                       type="number" 
                       min="0"
                       value={card.requirements?.[stat] || 0} 
                       onChange={(e) => handleUpdateRequirement(card.id, stat, e.target.value)}
                       className="editor-input"
                       style={{textAlign: 'center', padding: '0.2rem'}}
                     />
                   </div>
                 ))}
               </div>
               
               <div className="form-row">
                 <div className="form-group" style={{flex: 1}}>
                   <label>Artist Credit</label>
                   <input 
                     type="text" 
                     value={card.artist || ''} 
                     onChange={(e) => handleUpdateCard(card.id, 'artist', e.target.value)}
                     className="editor-input"
                     placeholder="Artist name"
                   />
                 </div>
               </div>
               
               <div className="form-group">
                 <label>Rules Text</label>
                 <textarea 
                   value={card.rulesText || ''}
                   onChange={(e) => handleUpdateCard(card.id, 'rulesText', e.target.value)}
                   className="editor-textarea"
                   placeholder="Enter mechanical rules text..."
                 />
               </div>
               
               <div className="form-group">
                 <label>Flavor Text</label>
                 <textarea 
                   value={card.flavorText || ''}
                   onChange={(e) => handleUpdateCard(card.id, 'flavorText', e.target.value)}
                   className="editor-textarea"
                   style={{minHeight: '50px'}}
                   placeholder="Enter flavor text..."
                 />
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
