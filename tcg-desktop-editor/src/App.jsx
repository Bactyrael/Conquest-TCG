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
      .replace(/\[CONCENTRATION\]/gi, '<img src="/icons/concentration.svg" style="width:1.2em;height:1.2em;vertical-align:-0.2em;margin:0 2px;" />')
    .replace(/\[(\d+|X)\]/gi, '<span class="numeric-icon">$1</span>')
    .replace(/\{([^}]+)\}/g, '<span class="keyword-text">$1</span>')
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

const parseCostGroups = (costStr) => {
  if (!costStr) return [];
  const str = costStr.trim();
  if (!str || str === '0') return [];

  // Match: (number)? (mana|stamina|generic) with word boundary, OR (number)? [msg]
  const regex = /(\d+)?\s*(mana|stamina|generic)\b|(\d+)?\s*([msg])/gi;
  const groups = [];
  let match;
  let hasMatches = false;

  while ((match = regex.exec(str)) !== null) {
    hasMatches = true;
    let num = 1;
    let type = 'generic';

    if (match[2]) {
      // Full word matched: mana, stamina, generic
      num = match[1] ? parseInt(match[1], 10) : 1;
      const word = match[2].toLowerCase();
      if (word === 'mana') type = 'mana';
      else if (word === 'stamina') type = 'stamina';
      else type = 'generic';
    } else if (match[4]) {
      // Single letter matched: m, s, g
      num = match[3] ? parseInt(match[3], 10) : 1;
      const letter = match[4].toLowerCase();
      if (letter === 'm') type = 'mana';
      else if (letter === 's') type = 'stamina';
      else type = 'generic';
    }

    // Merge adjacent identical types
    if (groups.length > 0 && groups[groups.length - 1].type === type) {
      groups[groups.length - 1].count += num;
    } else {
      groups.push({ type, count: num });
    }
  }

  // Fallback: If pure number was entered without letters (e.g. "4"), default to generic
  if (!hasMatches && /^\d+$/.test(str)) {
    return [{ type: 'generic', count: parseInt(str, 10) }];
  }

  return groups;
};

const toRoman = (num) => {
  if (typeof num !== 'number' || isNaN(num) || num <= 0) return num;
  const lookup = [
    { value: 1000, numeral: 'M' },
    { value: 900, numeral: 'CM' },
    { value: 500, numeral: 'D' },
    { value: 400, numeral: 'CD' },
    { value: 100, numeral: 'C' },
    { value: 90, numeral: 'XC' },
    { value: 50, numeral: 'L' },
    { value: 40, numeral: 'XL' },
    { value: 10, numeral: 'X' },
    { value: 9, numeral: 'IX' },
    { value: 5, numeral: 'V' },
    { value: 4, numeral: 'IV' },
    { value: 1, numeral: 'I' }
  ];
  let roman = '';
  let n = num;
  for (const item of lookup) {
    while (n >= item.value) {
      roman += item.numeral;
      n -= item.value;
    }
  }
  return roman || num;
};

const RarityIcon = ({ rarity, style }) => {
  const r = (rarity || 'common').toLowerCase();
  
  let baseColor = '#88929b';
  let topFacetColor = '#ffffff';

  if (r === 'magic') {
    baseColor = '#3498db';
    topFacetColor = 'rgba(255,255,255,0.4)';
  } else if (r === 'rare') {
    baseColor = '#f1c40f';
    topFacetColor = 'rgba(255,255,255,0.4)';
  } else if (r === 'legendary') {
    baseColor = '#e67e22';
    topFacetColor = 'rgba(255,255,255,0.4)';
  }

  return (
    <svg 
      className="rarity-icon-svg" 
      viewBox="0 0 24 24" 
      width="16" 
      height="16" 
      style={{ 
        width: '16px', 
        height: '16px', 
        flexShrink: 0,
        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))',
        ...style 
      }}
    >
      <polygon points="12,2 22,12 12,22 2,12" fill={baseColor} stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="12,2 22,12 12,12 2,12" fill={topFacetColor} />
    </svg>
  );
};

const CostField = ({ cost, onChange }) => {
  const [isFocused, setIsFocused] = useState(false);

  const renderDisplay = () => {
    const groups = parseCostGroups(cost);
    if (groups.length === 0) return null;

    return (
      <div 
        className="cost-display" 
        style={{ 
          display: 'flex', 
          flexDirection: 'row',
          flexWrap: 'nowrap',
          gap: '6px', 
          alignItems: 'center', 
          justifyContent: 'flex-end',
          height: '100%'
        }}
      >
        {groups.map((item, idx) => (
          <div
            key={idx}
            className="cost-group"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              flexShrink: 0
            }}
          >
            <span 
              className="cost-amount"
              style={{
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: 'bold',
                fontFamily: "'Cinzel', 'Times New Roman', Georgia, serif",
                letterSpacing: '0.5px',
                lineHeight: 1,
                textShadow: '0px 0px 4px #000, 0px 1px 2px #000'
              }}
            >
              {toRoman(item.count)}
            </span>
            <img 
              src={`/icons/${item.type}.jpg`} 
              className="cost-icon" 
              style={{ 
                width: '20px', 
                height: '20px', 
                borderRadius: '50%',
                boxShadow: '0 1px 3px rgba(0,0,0,0.6)',
                display: 'block',
                flexShrink: 0
              }}
              alt={item.type} 
            />
          </div>
        ))}
      </div>
    );
  };

  const groups = parseCostGroups(cost);

  return (
    <div 
      className="card-cost" 
      style={{ 
        position: 'relative', 
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        flexShrink: 0,
        height: '24px',
        width: isFocused ? '60px' : 'auto',
        minWidth: isFocused ? '60px' : '0px',
        maxWidth: '55%',
        zIndex: 10 
      }}
    >
      <input 
        className="cost-input" 
        style={{ 
          width: isFocused ? '100%' : '1px', 
          minWidth: isFocused ? '60px' : '0px',
          textAlign: 'right',
          opacity: isFocused ? 1 : 0,
          position: isFocused ? 'relative' : 'absolute',
          right: 0,
          zIndex: 2,
          padding: isFocused ? '2px 4px' : '0',
          background: isFocused ? 'rgba(0,0,0,0.6)' : 'transparent',
          border: isFocused ? '1px dashed #aaa' : 'none',
          borderRadius: '4px',
          color: '#fff',
          fontWeight: 'bold',
          outline: 'none',
          fontSize: '13px',
          cursor: isFocused ? 'text' : 'pointer'
        }}
        value={cost || ''}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="Cost"
      />
      {!isFocused && (
        <div style={{ position: 'relative', height: '100%', pointerEvents: 'none', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', zIndex: 1 }}>
          {renderDisplay()}
        </div>
      )}
    </div>
  );
};

function App() {
  const [cards, setCards] = useState([]);
  const [activeCard, setActiveCard] = useState(null);
  const [activeTab, setActiveTab] = useState('card');
  const [imageVersion, setImageVersion] = useState(Date.now());
  const [images, setImages] = useState([]);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [copiedCard, setCopiedCard] = useState(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });

  React.useEffect(() => {
    // Fetch cards
    fetch('http://localhost:3002/api/cards', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.cards.length > 0) {
          setCards(data.cards);
          setActiveCard(data.cards[0]);
        }
      })
      .catch(err => console.error("Failed to load cards", err));

    // Fetch images
    fetch('http://localhost:3002/api/images', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setImages(data.images);
        }
      })
      .catch(err => console.error("Failed to load images", err));
  }, []);

  const refreshImages = () => {
    setImageVersion(Date.now());
    fetch('http://localhost:3002/api/images', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setImages(data.images);
        }
      })
      .catch(err => console.error("Failed to load images", err));
  };

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
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });

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
              // Copy computed style properties to ensure 1:1 match in html2canvas export
              const computed = window.getComputedStyle(f);
              div.style.cssText = f.style.cssText;
              div.style.fontStyle = computed.fontStyle;
              div.style.fontSize = computed.fontSize;
              div.style.lineHeight = computed.lineHeight;
              div.style.color = computed.color;
              div.style.letterSpacing = computed.letterSpacing;
              div.style.textShadow = computed.textShadow;
              div.style.background = 'transparent';
              div.style.border = 'none';
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
        (c.tertiaryType && c.tertiaryType.toLowerCase().includes(term)) ||
      (c.cost && c.cost.toLowerCase().includes(term))
    );
  });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const rarityTiers = { 'common': 1, 'magic': 2, 'rare': 3, 'legendary': 4 };

  const sortedCards = [...filteredCards].sort((a, b) => {
    let aVal = a[sortConfig.key] || '';
    let bVal = b[sortConfig.key] || '';

    if (sortConfig.key === 'type') {
      aVal = (`${a.type || ''} ${a.subtype || ''}`).trim().toLowerCase();
      bVal = (`${b.type || ''} ${b.subtype || ''}`).trim().toLowerCase();
    } else if (sortConfig.key === 'id' || sortConfig.key === 'cost') {
      aVal = parseInt(aVal, 10) || 0;
      bVal = parseInt(bVal, 10) || 0;
    } else if (sortConfig.key === 'rarity') {
      aVal = rarityTiers[String(aVal).toLowerCase()] || 0;
      bVal = rarityTiers[String(bVal).toLowerCase()] || 0;
    } else {
      aVal = String(aVal).toLowerCase();
      bVal = String(bVal).toLowerCase();
    }

    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    
    // Secondary fallback: Alphabetical by card name
    const nameA = String(a.name || '').toLowerCase();
    const nameB = String(b.name || '').toLowerCase();
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;

    // Tertiary fallback: Card ID
    return (parseInt(a.id, 10) || 0) - (parseInt(b.id, 10) || 0);
  });

  const renderSortArrow = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? ' \u25B2' : ' \u25BC';
  };

  return (
    <div className="mse-container" onClick={() => setContextMenu(prev => ({ ...prev, visible: false }))}>
      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-section">
            <button className="tool-btn" onClick={handleAddCard} title="New Card">{"\u2795"}</button>
            <button className="tool-btn" onClick={handleSave} title="Save Cards">{"\uD83D\uDCBE"}</button>
            <button className="tool-btn" onClick={handleExportCard} title="Export Card Image">{"\uD83D\uDDBC\uFE0F"}</button>
            <button className="tool-btn" onClick={handleDeleteCard} title="Delete Card" style={{ color: 'red' }}>{"\uD83D\uDDD1\uFE0F"}</button>
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
            <div className={`tab ${activeTab === 'card' ? 'active' : ''}`} onClick={() => setActiveTab('card')}>Card</div>
            <div className={`tab ${activeTab === 'art' ? 'active' : ''}`} onClick={() => setActiveTab('art')}>Art</div>
            <div className={`tab ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}>Notes</div>
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
                      {activeCard?.type !== 'Resource' && activeCard?.type !== 'Hero' && (
                          <CostField 
                          cost={activeCard?.cost || ''}
                          onChange={(newCost) => setActiveCard({...activeCard, cost: newCost})}
                        />
                      )}
                    </div>
                    
                    <div className="card-art-placeholder" onClick={() => setIsImageModalOpen(true)}>
                      {getCardImage(activeCard) ? (
                          <div 
                            style={{
                              width: '100%',
                              height: '100%',
                              backgroundImage: `url(http://localhost:3002/cards/generated/${getCardImage(activeCard)}?t=${imageVersion})`,
                              backgroundSize: `${activeCard.artZoom ?? 100}% auto`,
                              backgroundPosition: `${activeCard.artX ?? 50}% ${activeCard.artY ?? 50}%`,
                              backgroundRepeat: 'no-repeat'
                            }}
                          />
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
                      
                      {activeCard?.type !== 'Resource' && <span>-</span>}
                      
                      {activeCard?.type !== 'Resource' && (
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
                                  <option value="Aura">Aura</option>
                                </>
                              )}
                            {activeCard?.type === 'Equipment' && (
                              <>
                                <option value="Helm">Helm</option>
                                <option value="Amulet">Amulet</option>
                                
                                <option value="Chest">Chest</option>
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
                            {activeCard?.type === 'Hero' && (
                              <>
                                <option value="Alchemist">Alchemist</option>
                                <option value="Archon">Archon</option>
                                <option value="Berserker">Berserker</option>
                                <option value="Disciple">Disciple</option>
                                <option value="Herald">Herald</option>
                                <option value="Invoker">Invoker</option>
                                <option value="Justicar">Justicar</option>
                                <option value="Mage">Mage</option>
                                <option value="Mesmer">Mesmer</option>
                                <option value="Necromancer">Necromancer</option>
                                <option value="Occultist">Occultist</option>
                                <option value="Prowler">Prowler</option>
                                <option value="Shaman">Shaman</option>
                                <option value="Swashbuckler">Swashbuckler</option>
                                <option value="Tracker">Tracker</option>
                                <option value="Vanguard">Vanguard</option>
                                <option value="Warden">Warden</option>
                                <option value="Wyrd">Wyrd</option>
                              </>
                            )}
                          </select>
                          <span style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}>
                            {activeCard?.subtype || 'None'}
                          </span>
                        </div>
                      )}
                        {activeCard?.type !== 'Resource' && activeCard?.type !== 'Hero' && activeCard?.type !== 'Item' && activeCard?.type !== 'Equipment' && (
                          <>
                            {activeCard?.tertiaryType ? <span>-</span> : <span className="tertiary-placeholder">-</span>}
                              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                                <select 
                                  className="type-select"
                                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                                  value={activeCard?.tertiaryType || ''} 
                                  onChange={(e) => setActiveCard({...activeCard, tertiaryType: e.target.value})}
                                >
                                  <option value="">None</option>
                                    <option value="Buff">Buff</option>
                                    <option value="Debuff">Debuff</option>
                                  <option value="Concentration">Concentration</option>
                                  <option value="Channel">Channel</option>
                                </select>
                                <span className={activeCard?.tertiaryType ? "" : "tertiary-placeholder"} style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}>
                                  {activeCard?.tertiaryType || '+ Status'}
                                </span>
                              </div>
                          </>
                        )}
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                      <RarityIcon rarity={activeCard?.rarity} />
                    </div>

                  </div>
                </div>
                <UnifiedTextMeasurer activeCard={activeCard} setActiveCard={setActiveCard} />
                  <div className="card-bottom">
                    <div className="card-artist-box">
                      <svg className="artist-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m14 11 4.5-4.5a2.12 2.12 0 0 0-3-3L11 8" />
                        <path d="M9 10a4 4 0 0 0-5 5c0 1.5 1 2.5 2 3 .5.25 1 .5 1.5.5s1-.25 1.5-.5c1-.5 2-1.5 2-3a4 4 0 0 0-2-5Z" />
                      </svg>
                      <input 
                        className="editable-field card-artist-input" 
                        defaultValue="Bactyrael" 
                        title="Artist Signature"
                        placeholder="Artist"
                      />
                    </div>
                    
                    {activeCard?.type === 'Hero' && (
                      <div className="card-damage-box">
                        <svg className="dice-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m12 2 8 4.5v11L12 22l-8-4.5v-11L12 2Z" />
                          <path d="m12 2 8 15.5" />
                          <path d="M12 2 4 17.5" />
                          <path d="M4 6.5 20 12" />
                          <path d="m20 6.5-16 5.5" />
                        </svg>
                        <input 
                          className="editable-field card-damage-input" 
                          value={activeCard?.damage || ''} 
                          placeholder="e.g. 1d8 + Str"
                          title="Hero Attack / Damage Dice"
                          onChange={(e) => setActiveCard({...activeCard, damage: e.target.value})}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{padding: '20px'}}>Loading...</div>
            )}
            
            {activeTab === 'card' && activeCard && (
              <div className="card-settings" style={{ padding: '10px 20px', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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

              {activeCard?.type !== 'Resource' && activeCard?.type !== 'Hero' && (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '10px' }}>
                  <label style={{ fontWeight: 'bold', color: '#aaa', fontSize: '12px' }}>
                    Cost (M = Mana, S = Stamina, G = Generic):
                  </label>
                  <input 
                    type="text"
                    value={activeCard.cost || ''}
                    onChange={(e) => setActiveCard({...activeCard, cost: e.target.value})}
                    placeholder="e.g. MM, SSS, GG, 4 Generic"
                    style={{ width: '100%', padding: '6px 8px', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '4px', fontFamily: 'inherit', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              )}
            
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '15px' }}>
                    <label style={{ fontWeight: 'bold', color: '#aaa', fontSize: '12px' }}>Flavor Text:</label>
                    <textarea 
                      value={activeCard.flavorText || ''}
                      onChange={(e) => setActiveCard({...activeCard, flavorText: e.target.value})}
                      placeholder="Enter flavor text here..."
                      style={{ width: '100%', height: '60px', padding: '8px', background: '#222', color: '#ddd', border: '1px solid #444', borderRadius: '4px', resize: 'vertical', fontFamily: 'inherit', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              )}

            {activeTab === 'art' && activeCard && (
              <div className="card-settings" style={{ padding: '10px 20px', display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'flex-start' }}>
                <div style={{ background: '#222', padding: '10px', borderRadius: '6px', border: '1px solid #444', fontSize: '12px', width: '100%', boxSizing: 'border-box' }}>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', color: '#ddd' }}>Art Adjustments (Pan & Zoom)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 30px', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{color: '#aaa'}}>Pan X</span>
                    <input type="range" min="0" max="100" value={activeCard.artX ?? 50} onChange={(e) => setActiveCard({...activeCard, artX: parseInt(e.target.value)})} />
                    <span style={{color: '#aaa'}}>{activeCard.artX ?? 50}%</span>
                    
                    <span style={{color: '#aaa'}}>Pan Y</span>
                    <input type="range" min="0" max="100" value={activeCard.artY ?? 50} onChange={(e) => setActiveCard({...activeCard, artY: parseInt(e.target.value)})} />
                    <span style={{color: '#aaa'}}>{activeCard.artY ?? 50}%</span>
                    
                    <span style={{color: '#aaa'}}>Zoom</span>
                    <input type="range" min="100" max="300" value={activeCard.artZoom ?? 100} onChange={(e) => setActiveCard({...activeCard, artZoom: parseInt(e.target.value)})} />
                    <span style={{color: '#aaa'}}>{activeCard.artZoom ?? 100}%</span>
                  </div>
                    <button 
                      onClick={() => setActiveCard({...activeCard, artX: 50, artY: 50, artZoom: 100})}
                      style={{ marginTop: '10px', width: '100%', padding: '6px', background: '#333', color: '#ddd', border: '1px solid #555', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Reset Art
                    </button>
                </div>
              </div>
            )}

            {activeTab === 'notes' && activeCard && (
              <div className="card-notes" style={{ padding: '10px 20px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Developer Notes (Not printed):</label>
                <textarea 
                  value={activeCard.notes || ''}
                  onChange={e => setActiveCard({...activeCard, notes: e.target.value})}
                  style={{ width: '100%', height: '100px', padding: '8px', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
                ></textarea>
              </div>
            )}
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
                <th onClick={() => handleSort('name')} style={{cursor: 'pointer', userSelect: 'none'}}>Name{renderSortArrow('name')}</th>
                <th onClick={() => handleSort('cost')} style={{cursor: 'pointer', userSelect: 'none'}}>Resource Cost{renderSortArrow('cost')}</th>
                <th onClick={() => handleSort('type')} style={{cursor: 'pointer', userSelect: 'none'}}>Type{renderSortArrow('type')}</th>
                <th onClick={() => handleSort('rarity')} style={{cursor: 'pointer', userSelect: 'none'}}>Rarity{renderSortArrow('rarity')}</th>
                <th onClick={() => handleSort('id')} style={{cursor: 'pointer', userSelect: 'none'}}>#{renderSortArrow('id')}</th>
              </tr>
            </thead>
              <tbody>
                {sortedCards.map((c, i) => (
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
                    <td>{c.type} {c.subtype ? `— ${c.subtype}` : ''} {c.tertiaryType ? `- ${c.tertiaryType}` : ''}</td>
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
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px', justifyContent: 'flex-end' }}>
                <button onClick={refreshImages} style={{ padding: '8px 16px', background: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Refresh Images</button>
                <button onClick={() => setIsImageModalOpen(false)} style={{ padding: '8px 16px', cursor: 'pointer' }}>Close</button>
              </div>
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























