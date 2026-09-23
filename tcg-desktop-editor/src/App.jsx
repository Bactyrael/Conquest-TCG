import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import './App.css';

const parseRichTextHTML = (text) => {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\[USE\]/gi, '<img src="/icons/use.jpg" style="width:1.2em;height:1.2em;vertical-align:-0.2em;border-radius:50%;margin:0 2px;box-shadow:0 0 2px black;" />')
    .replace(/\[MANA\]/gi, '<img src="/icons/mana.jpg" style="width:1.2em;height:1.2em;vertical-align:-0.2em;border-radius:50%;margin:0 2px;box-shadow:0 0 2px black;" />')
    .replace(/\[STAMINA\]/gi, '<img src="/icons/stamina.jpg" style="width:1.2em;height:1.2em;vertical-align:-0.2em;border-radius:50%;margin:0 2px;box-shadow:0 0 2px black;" />')
    .replace(/\[GENERIC\]/gi, '<img src="/icons/generic.jpg" style="width:1.2em;height:1.2em;vertical-align:-0.2em;border-radius:50%;margin:0 2px;box-shadow:0 0 2px black;" />')
    .replace(/\[ACTION\]/gi, '<img src="/icons/action.svg" style="width:1.2em;height:1.2em;vertical-align:-0.2em;margin:0 2px;" />')
    .replace(/\[BONUS(?: ACTION)?\]/gi, '<img src="/icons/bonus.svg" style="width:1.2em;height:1.2em;vertical-align:-0.2em;margin:0 2px;" />')
    .replace(/\[REACTION\]/gi, '<img src="/icons/reaction.svg" style="width:1.2em;height:1.2em;vertical-align:-0.2em;margin:0 2px;" />')
    .replace(/\n/g, '<br/>');
};

const RichTextTextarea = ({ value, onChange, className, placeholder, style, forcedSize }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={className} style={{ ...style, position: 'relative' }}>
      <textarea 
        placeholder={placeholder} 
        value={value} 
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%', 
          height: '100%', 
          resize: 'none', 
          background: 'transparent',
          color: 'inherit',
          fontFamily: 'inherit',
          lineHeight: 'inherit',
          border: 'none',
          outline: 'none',
          padding: 0,
          margin: 0,
          zIndex: 2,
          opacity: isFocused ? 1 : 0,
          fontSize: forcedSize ? `${forcedSize}px` : undefined
        }}
      />
      <div 
        style={{
          width: '100%',
          pointerEvents: 'none',
          zIndex: 1,
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          fontSize: forcedSize ? `${forcedSize}px` : undefined,
          color: (value ? 'inherit' : 'rgba(255,255,255,0.5)'),
          opacity: isFocused ? 0 : 1
        }}
        dangerouslySetInnerHTML={{ __html: parseRichTextHTML(value || placeholder || '') }}
      />
    </div>
  );
};

const UnifiedTextMeasurer = ({ activeCard, setActiveCard }) => {
  const boxRef = useRef(null);
  const [optimalSize, setOptimalSize] = useState(20);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;

    // 1. Temporarily hide contents so the flexbox shrinks to its true bounded height
    const originalDisplays = Array.from(box.children).map(c => c.style.display);
    Array.from(box.children).forEach(c => c.style.display = 'none');
    const trueAvailableHeight = box.clientHeight;
    Array.from(box.children).forEach((c, i) => c.style.display = originalDisplays[i]);

    const computed = window.getComputedStyle(box);
    const measureBox = document.createElement('div');
    measureBox.style.width = `${box.clientWidth}px`;
    measureBox.style.padding = computed.padding;
    measureBox.style.boxSizing = computed.boxSizing;
    measureBox.style.display = 'flex';
    measureBox.style.flexDirection = 'column';
    measureBox.style.gap = '4px';
    measureBox.style.position = 'absolute';
    measureBox.style.visibility = 'hidden';

    const rulesWrap = document.createElement('div');
    rulesWrap.style.whiteSpace = 'pre-wrap';
    rulesWrap.style.wordWrap = 'break-word';
    rulesWrap.style.lineHeight = '1.15';
    rulesWrap.style.padding = '2px';
    rulesWrap.style.border = '1px solid transparent';
    rulesWrap.innerHTML = parseRichTextHTML(activeCard?.rulesText || 'Card rules...');
    
    const flavorWrap = document.createElement('div');
    flavorWrap.style.whiteSpace = 'pre-wrap';
    flavorWrap.style.wordWrap = 'break-word';
    flavorWrap.style.fontStyle = 'italic';
    flavorWrap.style.lineHeight = '1.15';
    flavorWrap.style.padding = '2px';
    flavorWrap.style.border = '1px solid transparent';
    flavorWrap.innerHTML = parseRichTextHTML(activeCard?.flavorText || 'Flavor text...');

    measureBox.appendChild(rulesWrap);
    if (activeCard?.flavorText) {
      const hr = document.createElement('hr');
      hr.style.margin = '4px 10%';
      hr.style.border = 'none';
      hr.style.borderTop = '1px solid rgba(255, 255, 255, 0.3)';
      measureBox.appendChild(hr);
      measureBox.appendChild(flavorWrap);
    }
    document.body.appendChild(measureBox);

    let currentSize = 20;
    rulesWrap.style.fontSize = `${currentSize}px`;
    flavorWrap.style.fontSize = `${currentSize}px`;

    while (measureBox.scrollHeight > trueAvailableHeight && currentSize > 8) {
      currentSize -= 0.5;
      rulesWrap.style.fontSize = `${currentSize}px`;
      flavorWrap.style.fontSize = `${currentSize}px`;
    }

    document.body.removeChild(measureBox);
    setOptimalSize(currentSize);
  }, [activeCard?.rulesText, activeCard?.flavorText]);

  return (
    <div className="card-text-box" ref={boxRef} style={{ gap: '4px' }}>
      <RichTextTextarea 
        className="editable-field card-rules" 
        placeholder="Card rules..."
        value={activeCard?.rulesText || ''}
        onChange={(e) => setActiveCard({...activeCard, rulesText: e.target.value})}
        style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
        forcedSize={optimalSize}
      />
      {activeCard?.flavorText && (
        <>
          <hr className="text-divider" style={{ margin: '4px 10%' }} />
          <RichTextTextarea 
            className="editable-field card-flavor" 
            placeholder="Flavor text..."
            value={activeCard?.flavorText || ''}
            onChange={(e) => setActiveCard({...activeCard, flavorText: e.target.value})}
            style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
            forcedSize={optimalSize}
          />
        </>
      )}
    </div>
  );
};

const CostField = ({ cost, onChange }) => {
  const [isFocused, setIsFocused] = useState(false);

  const renderDisplay = () => {
    if (!cost || cost === '0') return null;
    const match = cost.match(/^(\d+)\s*(Mana|Stamina|Generic)$/i);
    if (match) {
      const amount = match[1];
      const type = match[2].toLowerCase();
      return (
        <div className="cost-display" style={{ display: 'flex', gap: '4px', alignItems: 'center', justifyContent: 'flex-end' }}>
          <span className="cost-amount">{amount}</span>
          <img src={`/icons/${type}.jpg`} className="cost-icon" alt={type} />
        </div>
      );
    }
    return <span className="cost-amount">{cost}</span>;
  };

  return (
    <div className="card-cost" style={{ position: 'relative', width: '90px', zIndex: 10 }}>
      <input 
        className="editable-field" 
        style={{ 
          width: '100%', 
          textAlign: 'right',
          opacity: isFocused ? 1 : 0,
          position: 'relative',
          zIndex: 2,
          padding: '4px',
          background: 'transparent',
          border: 'none',
          color: '#fff',
          fontWeight: 'bold'
        }}
        value={cost || ''}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="Cost"
      />
      {!isFocused && (
        <div style={{ position: 'absolute', top: 0, right: 0, width: '100%', height: '100%', pointerEvents: 'none', padding: '4px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', zIndex: 1 }}>
          {renderDisplay()}
        </div>
      )}
    </div>
  );
};

function App() {
  const [cards, setCards] = useState([]);
  const [activeCard, setActiveCard] = useState(null);
  const [images, setImages] = useState([]);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [copiedCard, setCopiedCard] = useState(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });

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

  const [notification, setNotification] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (activeCard) {
      setCards(prev => prev.map(c => c.id === activeCard.id ? activeCard : c));
      // Auto-scroll the list to the selected card so newly created cards are visible
      setTimeout(() => {
        const selectedRow = document.querySelector('.card-table tr.selected');
        if (selectedRow) {
          selectedRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 50);
    }
  }, [activeCard]);

  const handleSave = async () => {
    try {
      const res = await fetch('http://localhost:3002/api/save-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cards)
      });
      if (res.ok) {
        setNotification('Saved successfully!');
        setTimeout(() => setNotification(''), 3000);
      }
    } catch (e) {
      console.error(e);
      setNotification('Failed to save');
      setTimeout(() => setNotification(''), 3000);
    }
  };

  const handleExportCard = async () => {
    if (!activeCard) return;
    const element = document.querySelector('.card-frame');
    if (!element) return;
    
    try {
      setNotification('Exporting...');
      const canvas = await html2canvas(element, { 
        useCORS: true, 
        scale: 2, 
        backgroundColor: null,
        onclone: (clonedDoc) => {
          const frame = clonedDoc.querySelector('.card-frame');
          // Hide all textareas (the rich text div is underneath them)
          const textareas = frame.querySelectorAll('textarea');
          textareas.forEach(ta => ta.style.display = 'none');
          
          // Replace inputs with perfect-rendering divs and remove dashed borders on text boxes
          const fields = frame.querySelectorAll('.editable-field');
          fields.forEach(f => {
            if (f.classList.contains('card-rules') || f.classList.contains('card-flavor')) {
              f.style.border = 'none';
            }
            if (f.tagName.toLowerCase() === 'input') {
              const div = clonedDoc.createElement('div');
              div.className = f.className;
              div.style.cssText = f.style.cssText; // preserve inline styles like opacity: 0
              div.innerText = f.value || f.placeholder || '';
              f.parentNode.replaceChild(div, f);
            }
          });
        }
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${activeCard.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
      setNotification('Exported!');
      setTimeout(() => setNotification(''), 3000);
    } catch (e) {
      console.error("Export failed", e);
      setNotification('Export failed');
      setTimeout(() => setNotification(''), 3000);
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

  const handleCopyCard = () => {
    if (activeCard) {
      setCopiedCard({ ...activeCard });
    }
  };

  const handlePasteCard = () => {
    if (!copiedCard) return;
    let nextId = "000";
    if (cards.length > 0) {
      const maxId = Math.max(...cards.map(c => parseInt(c.id, 10) || 0));
      nextId = (maxId + 1).toString().padStart(3, '0');
    }
    const newCard = { ...copiedCard, id: nextId, name: copiedCard.name + ' (Copy)' };
    setCards(prev => [...prev, newCard]);
    setActiveCard(newCard);
  };

  const filteredCards = cards.filter(c => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(term)) ||
      (c.rulesText && c.rulesText.toLowerCase().includes(term)) ||
      (c.flavorText && c.flavorText.toLowerCase().includes(term)) ||
      (c.type && c.type.toLowerCase().includes(term)) ||
      (c.subtype && c.subtype.toLowerCase().includes(term)) ||
      (c.cost && c.cost.toLowerCase().includes(term))
    );
  });

  return (
    <div className="mse-container" onClick={() => setContextMenu(prev => ({ ...prev, visible: false }))}>
      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-section">
            <button className="tool-btn" onClick={handleAddCard} title="New Card">➕</button>
            <button className="tool-btn" onClick={handleSave} title="Save Cards">💾</button>
            <button className="tool-btn" onClick={handleExportCard} title="Export Card Image">📷</button>
            <button className="tool-btn" onClick={handleDeleteCard} title="Delete Card" style={{ color: 'red' }}>🗑️</button>
          {notification && <span style={{ color: 'lime', marginLeft: '10px', fontSize: '12px', fontWeight: 'bold' }}>{notification}</span>}
        </div>
        <div className="toolbar-section">
          <button className="tool-btn"><b>B</b></button>
          <button className="tool-btn"><i>I</i></button>
        </div>
        <div className="toolbar-section">
          <input 
            type="text" 
            placeholder="Search for cards..." 
            className="search-bar" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Main Content Split */}
      <div className="main-content">
        
        {/* Left Side: Card Preview & Edit */}
        <div className="left-pane">
          <div className="tabs">
            <div className="tab active">Cards</div>
          </div>
          
          <div className="card-editor-area">
            {/* Mock Card Preview */}
            {activeCard ? (
              <div className="card-preview">
                <div className="card-frame">
                  <div className="card-top-half">
                    <div className="card-top-bar">
                      <input 
                        className="editable-field card-name" 
                        value={activeCard?.name || ''}
                        onChange={(e) => setActiveCard({...activeCard, name: e.target.value})}
                      />
                      {activeCard?.type !== 'Hero' && activeCard?.type !== 'Resource' && (
                        <CostField 
                          cost={activeCard?.cost || ''}
                          onChange={(newCost) => setActiveCard({...activeCard, cost: newCost})}
                        />
                      )}
                    </div>
                    
                    <div className="card-art-placeholder" onClick={() => setIsImageModalOpen(true)}>
                      {getCardImage(activeCard) ? (
                        <img src={`http://localhost:3002/cards/generated/${getCardImage(activeCard)}?t=${Date.now()}`} alt="art" />
                      ) : (
                        'Double-click to set image'
                      )}
                    </div>

                    <div className="editable-field card-type" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                        <select 
                          className="type-select"
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
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
                        <span style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}>
                          {activeCard?.type || 'Type'}
                        </span>
                      </div>
                      
                      {activeCard?.type !== 'Hero' && activeCard?.type !== 'Resource' && <span>—</span>}
                      
                      {activeCard?.type !== 'Hero' && activeCard?.type !== 'Resource' && (
                        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                          <select 
                            className="type-select"
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
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
                                <option value="Ring">Ring</option>
                              </>
                            )}
                            {activeCard?.type === 'Item' && (
                              <>
                                <option value="Consumable">Consumable</option>
                                <option value="Trinket">Trinket</option>
                              </>
                            )}
                          </select>
                          <span style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}>
                            {activeCard?.subtype || 'None'}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                      <img 
                        src={`/icons/rarity-${(activeCard?.rarity || 'common').toLowerCase()}.svg`} 
                        alt="Rarity" 
                        style={{ width: '16px', height: '16px', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))' }} 
                      />
                    </div>

                  </div>
                  <UnifiedTextMeasurer activeCard={activeCard} setActiveCard={setActiveCard} />
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
            
            {activeCard && (
              <div className="card-settings" style={{ padding: '10px 20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <label style={{ fontWeight: 'bold' }}>Rarity:</label>
                <select 
                  value={activeCard.rarity || 'Common'} 
                  onChange={(e) => setActiveCard({...activeCard, rarity: e.target.value})}
                  style={{ padding: '4px', background: '#333', color: '#fff', border: '1px solid #555' }}
                >
                  <option value="Common">Common</option>
                  <option value="Magic">Magic</option>
                  <option value="Rare">Rare</option>
                  <option value="Legendary">Legendary</option>
                </select>
              </div>
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
        <div 
          className="right-pane" 
          style={{ overflowY: 'auto' }}
          onContextMenu={(e) => {
            e.preventDefault();
            const menuHeight = 180;
            const menuWidth = 160;
            const x = e.pageX + menuWidth > window.innerWidth ? window.innerWidth - menuWidth - 10 : e.pageX;
            const y = e.pageY + menuHeight > window.innerHeight ? window.innerHeight - menuHeight - 10 : e.pageY;
            setContextMenu({ visible: true, x, y });
          }}
        >
          <table className="card-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Resource Cost</th>
                <th>Type</th>
                <th>Rarity</th>
                <th>#</th>
              </tr>
            </thead>
              <tbody>
                {filteredCards.map((c, i) => (
                  <tr 
                    key={c.id || i} 
                    className={activeCard && activeCard.id === c.id ? 'selected' : ''}
                    onClick={() => setActiveCard(c)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveCard(c);
                      const menuHeight = 180;
                      const menuWidth = 160;
                      const x = e.pageX + menuWidth > window.innerWidth ? window.innerWidth - menuWidth - 10 : e.pageX;
                      const y = e.pageY + menuHeight > window.innerHeight ? window.innerHeight - menuHeight - 10 : e.pageY;
                      setContextMenu({ visible: true, x, y });
                    }}
                  >
                    <td>{c.name}</td>
                    <td>{c.cost}</td>
                    <td>{c.type} {c.subtype ? `— ${c.subtype}` : ''}</td>
                    <td className={`rarity-${(c.rarity || 'common').toLowerCase()}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <img src={`/icons/rarity-${(c.rarity || 'common').toLowerCase()}.svg`} style={{ width: '12px', height: '12px' }} />
                      {c.rarity || 'Common'}
                    </td>
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

      {/* Image Selection Modal */}
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

      {/* Context Menu */}
      {contextMenu.visible && (
        <div className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x }}>
          <div className={`context-menu-item ${!activeCard ? 'disabled' : ''}`} onClick={handleCopyCard}>Copy Card</div>
          <div className={`context-menu-item ${!copiedCard ? 'disabled' : ''}`} onClick={handlePasteCard}>Paste Card</div>
          <div className="context-menu-divider"></div>
          <div className="context-menu-item" onClick={handleAddCard}>New Card</div>
          <div className={`context-menu-item ${!activeCard ? 'disabled' : ''}`} onClick={handleDeleteCard} style={{color: '#ff4444'}}>Delete Card</div>
        </div>
      )}
    </div>
  );
}

export default App;
