import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const AutoShrinkTextarea = ({ value, onChange, className, placeholder, style, onOptimalSizeChange, forcedSize }) => {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    
    // Bulletproof measuring using an off-screen div
    const style = window.getComputedStyle(el);
    const measureDiv = document.createElement('div');
    measureDiv.style.width = `${el.clientWidth}px`;
    measureDiv.style.padding = style.padding;
    measureDiv.style.fontFamily = style.fontFamily;
    measureDiv.style.lineHeight = style.lineHeight;
    measureDiv.style.wordWrap = 'break-word';
    measureDiv.style.whiteSpace = 'pre-wrap';
    measureDiv.style.position = 'absolute';
    measureDiv.style.visibility = 'hidden';
    measureDiv.innerText = el.value || el.placeholder || ' ';
    document.body.appendChild(measureDiv);
    
    let currentSize = 24; // Max font size 24px
    measureDiv.style.fontSize = `${currentSize}px`;
    
    while (measureDiv.scrollHeight > el.clientHeight && currentSize > 8) {
      currentSize -= 0.5;
      measureDiv.style.fontSize = `${currentSize}px`;
    }
    
    document.body.removeChild(measureDiv);
    
    if (onOptimalSizeChange) {
      onOptimalSizeChange(currentSize);
    }
    
    // If a forced size is provided, apply it immediately
    if (forcedSize) {
      el.style.fontSize = `${forcedSize}px`;
    }
  }, [value, style?.flex, forcedSize]);

  return (
    <textarea 
      ref={ref}
      className={className} 
      placeholder={placeholder} 
      value={value} 
      onChange={onChange}
      style={{ ...style, fontSize: forcedSize ? `${forcedSize}px` : undefined }}
    />
  );
};

const CostField = ({ cost, onChange }) => {
  const [isEditing, setIsEditing] = useState(false);

  const renderCost = (costString) => {
    if (!costString || costString.startsWith('0')) return null;
    const match = costString.match(/^(\d+)\s*(Mana|Stamina)$/i);
    if (match) {
      const amount = match[1];
      const type = match[2].toLowerCase();
      return (
        <div className="cost-display">
          <span className="cost-amount">{amount}</span>
          <img src={`/icons/${type}.jpg`} className="cost-icon" alt={type} />
        </div>
      );
    }
    return costString;
  };

  if (isEditing) {
    return (
      <input 
        className="editable-field card-cost" 
        value={cost || ''}
        onChange={e => onChange(e.target.value)}
        onBlur={() => setIsEditing(false)}
        autoFocus
      />
    );
  }

  return (
    <div 
      className="editable-field card-cost" 
      onClick={() => setIsEditing(true)}
      style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}
    >
      {renderCost(cost)}
    </div>
  );
};

function App() {
  const [cards, setCards] = useState([]);
  const [activeCard, setActiveCard] = useState(null);
  const [images, setImages] = useState([]);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [rulesSize, setRulesSize] = useState(24);
  const [flavorSize, setFlavorSize] = useState(24);
  
  const sharedFontSize = Math.min(rulesSize, flavorSize);

  React.useEffect(() => {
    // Fetch cards
    fetch('http://localhost:3002/api/cards')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.cards.length > 0) {
          setCards(data.cards);
          setActiveCard(data.cards[0]);
        }
      })
      .catch(err => console.error("Failed to load cards", err));

    // Fetch images
    fetch('http://localhost:3002/api/images')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setImages(data.images);
        }
      })
      .catch(err => console.error("Failed to load images", err));
  }, []);

  const handleSelectImage = (img) => {
    setActiveCard({...activeCard, image: img});
    setIsImageModalOpen(false);
  };

  const getCardImage = (c) => {
    if (!c) return '';
    if (c.image) return c.image;
    // Strip "BnB " prefix if exists, then slugify
    const baseName = c.name.replace(/^BnB\s+/i, '');
    const slug = baseName.toLowerCase().replace(/ /g, '_').replace(/[^a-z0-9_]/g, '');
    const matched = images.find(img => img === `${slug}.jpg` || img.startsWith(`${slug}_`));
    return matched || '';
  };

  useEffect(() => {
    if (activeCard) {
      setCards(prev => prev.map(c => c.id === activeCard.id ? activeCard : c));
    }
  }, [activeCard]);

  const handleSave = async () => {
    try {
      const res = await fetch('http://localhost:3002/api/save-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cards)
      });
      if (res.ok) alert('Cards saved successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to save cards');
    }
  };

  const handleAddCard = () => {
    let nextId = "000";
    if (cards.length > 0) {
      const maxId = Math.max(...cards.map(c => parseInt(c.id, 10) || 0));
      nextId = (maxId + 1).toString().padStart(3, '0');
    }
    const newCard = {
      id: nextId,
      name: 'New Card',
      type: 'Action',
      subtype: '',
      rarity: 'Common',
      cost: '0',
      damage: '',
      rulesText: '',
      flavorText: ''
    };
    setCards(prev => [...prev, newCard]);
    setActiveCard(newCard);
  };

  const handleDeleteCard = () => {
    if (!activeCard) return;
    if (!window.confirm(`Are you sure you want to delete ${activeCard.name}?`)) return;
    setCards(prev => {
      const newCards = prev.filter(c => c.id !== activeCard.id);
      setTimeout(() => setActiveCard(newCards.length > 0 ? newCards[0] : null), 0);
      return newCards;
    });
  };

  return (
    <div className="mse-container">
      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-section">
          <button className="tool-btn" onClick={handleAddCard} title="New Card">📄</button>
          <button className="tool-btn" onClick={handleSave} title="Save Cards">💾</button>
          <button className="tool-btn" onClick={handleDeleteCard} title="Delete Card" style={{ color: 'red' }}>🗑️</button>
        </div>
        <div className="toolbar-section">
          <button className="tool-btn"><b>B</b></button>
          <button className="tool-btn"><i>I</i></button>
        </div>
        <div className="toolbar-section">
          <input type="text" placeholder="Search for cards..." className="search-bar" />
        </div>
      </div>

      {/* Main Content Split */}
      <div className="main-content">
        
        {/* Left Side: Card Preview & Edit */}
        <div className="left-pane">
          <div className="tabs">
            <div className="tab active">Cards</div>
            <div className="tab">Style</div>
            <div className="tab">Set info</div>
            <div className="tab">Keywords</div>
            <div className="tab">Statistics</div>
          </div>
          
          <div className="card-editor-area">
            {/* Mock Card Preview */}
            {activeCard ? (
              <div className="card-preview">
                <div className="card-frame">
                  <input 
                    className="editable-field card-name" 
                    value={activeCard?.name || ''}
                    onChange={(e) => setActiveCard({...activeCard, name: e.target.value})}
                  />
                  <CostField 
                    cost={activeCard?.cost || ''}
                    onChange={(newCost) => setActiveCard({...activeCard, cost: newCost})}
                  />
                  <div className="card-art-placeholder" onClick={() => setIsImageModalOpen(true)}>
                    {getCardImage(activeCard) ? (
                      <img src={`http://localhost:3002/cards/generated/${getCardImage(activeCard)}`} alt="art" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      'Double-click to set image'
                    )}
                  </div>
                  <div className="editable-field card-type" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <select 
                      className="type-select"
                      value={activeCard?.type || ''} 
                      onChange={(e) => {
                        const newType = e.target.value;
                        const actionTypes = ['Action', 'Bonus Action', 'Reaction'];
                        const shouldClear = !(actionTypes.includes(activeCard?.type) && actionTypes.includes(newType));
                        setActiveCard({...activeCard, type: newType, ...(shouldClear ? {subtype: ''} : {})});
                      }}
                    >
                      <option value="Action">Action</option>
                      <option value="Bonus Action">Bonus Action</option>
                      <option value="Reaction">Reaction</option>
                      <option value="Hero">Hero</option>
                      <option value="Resource">Resource</option>
                      <option value="Item">Item</option>
                      <option value="Equipment">Equipment</option>
                    </select>
                    {activeCard?.type !== 'Hero' && activeCard?.type !== 'Resource' && <span>—</span>}
                    {activeCard?.type !== 'Hero' && activeCard?.type !== 'Resource' && (
                      <select 
                        className="type-select"
                        value={activeCard?.subtype || ''} 
                        onChange={(e) => setActiveCard({...activeCard, subtype: e.target.value})}
                      >
                        <option value="">None</option>
                        {['Action', 'Bonus Action', 'Reaction'].includes(activeCard?.type) && (
                          <>
                            <option value="Ability">Ability</option>
                            <option value="Spell">Spell</option>
                            <option value="Boon">Boon</option>
                            <option value="Curse">Curse</option>
                          </>
                        )}
                        {activeCard?.type === 'Equipment' && (
                          <>
                            <option value="Helm">Helm</option>
                            <option value="Amulet">Amulet</option>
                            <option value="Shoulders">Shoulders</option>
                            <option value="Cloak">Cloak</option>
                            <option value="Chest">Chest</option>
                            <option value="Wrist">Wrist</option>
                            <option value="Gloves">Gloves</option>
                            <option value="Belt">Belt</option>
                            <option value="Pants">Pants</option>
                            <option value="Boots">Boots</option>
                            <option value="Main-hand">Main-hand</option>
                            <option value="Off-hand">Off-hand</option>
                            <option value="Left Ring">Left Ring</option>
                            <option value="Right Ring">Right Ring</option>
                          </>
                        )}
                        {activeCard?.type === 'Item' && (
                          <>
                            <option value="Consumable">Consumable</option>
                            <option value="Trinket">Trinket</option>
                          </>
                        )}
                      </select>
                    )}
                  </div>
                  <div className="card-text-box">
                    <AutoShrinkTextarea 
                      className="editable-field card-rules" 
                      placeholder="Card rules..."
                      value={activeCard?.rulesText || ''}
                      onChange={(e) => setActiveCard({...activeCard, rulesText: e.target.value})}
                      style={{ flex: activeCard?.rulesText ? 2 : 0.5 }}
                      onOptimalSizeChange={setRulesSize}
                      forcedSize={sharedFontSize}
                    />
                    <AutoShrinkTextarea 
                      className="editable-field card-flavor" 
                      placeholder="Flavor text..."
                      value={activeCard?.flavorText || ''}
                      onChange={(e) => setActiveCard({...activeCard, flavorText: e.target.value})}
                      style={{ flex: activeCard?.flavorText ? 1 : 0.2 }}
                      onOptimalSizeChange={setFlavorSize}
                      forcedSize={sharedFontSize}
                    />
                  </div>
                  <div className="card-bottom">
                    <input className="editable-field card-artist" defaultValue="Bactyrael" />
                    {activeCard?.type === 'Hero' && (
                      <input 
                        className="editable-field card-damage" 
                        value={activeCard?.damage || ''} 
                        placeholder="e.g. 1d8 + Str"
                        onChange={(e) => setActiveCard({...activeCard, damage: e.target.value})}
                      />
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{padding: '20px'}}>Loading...</div>
            )}
            
            <div className="card-notes">
              <label>Developer Notes (Not printed):</label>
              <textarea 
                value={activeCard ? (activeCard.notes || '') : ''}
                onChange={e => activeCard && setActiveCard({...activeCard, notes: e.target.value})}
              ></textarea>
            </div>
          </div>
        </div>

        {/* Right Side: Sortable Card List */}
        <div className="right-pane">
          <table className="card-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Resource Cost</th>
                <th>Type</th>
                <th>P/T</th>
                <th>Rarity</th>
                <th>#</th>
              </tr>
            </thead>
            <tbody>
              {cards.map((c, i) => (
                <tr 
                  key={c.id || i} 
                  className={activeCard && activeCard.id === c.id ? 'selected' : ''}
                  onClick={() => setActiveCard(c)}
                >
                  <td>{c.name}</td>
                  <td>{c.cost}</td>
                  <td>{c.type} {c.subtype ? `— ${c.subtype}` : ''}</td>
                  <td></td>
                  <td className={`rarity-${c.rarity || 'common'}`}>{c.rarity || 'common'}</td>
                  <td>{c.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Status Bar */}
      <div className="status-bar">
        Welcome to Beasts and Bounties Set Editor
      </div>

      {isImageModalOpen && (
        <div className="modal-overlay" onClick={() => setIsImageModalOpen(false)}>
          <div className="image-modal" onClick={e => e.stopPropagation()}>
            <h3>Select Card Art</h3>
            <div className="image-grid">
              {images.map(img => (
                <div key={img} className="image-option" onClick={() => handleSelectImage(img)}>
                  <img src={`http://localhost:3002/cards/generated/${img}`} alt={img} />
                  <span>{img}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setIsImageModalOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
