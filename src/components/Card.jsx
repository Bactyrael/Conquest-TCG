import React from 'react';
import './Card.css';

export default function Card({ data }) {
  if (!data) return null;

  // Formatting Requirements
  const reqs = data.requirements || {};
  const activeReqs = [];
  if (reqs.str > 0) activeReqs.push({ stat: 'STR', val: reqs.str, cls: 'str' });
  if (reqs.dex > 0) activeReqs.push({ stat: 'DEX', val: reqs.dex, cls: 'dex' });
  if (reqs.con > 0) activeReqs.push({ stat: 'CON', val: reqs.con, cls: 'con' });
  if (reqs.int > 0) activeReqs.push({ stat: 'INT', val: reqs.int, cls: 'int' });
  if (reqs.wis > 0) activeReqs.push({ stat: 'WIS', val: reqs.wis, cls: 'wis' });
  if (reqs.luc > 0) activeReqs.push({ stat: 'LUC', val: reqs.luc, cls: 'luc' });

  // Formatting Type Line
  const typeLine = data.subtype ? `${data.type} - ${data.subtype}` : data.type;

  return (
    <div className="tcg-card">
      <img src={data.imageUrl || data.artUrl} alt={data.name || 'Card'} className="full-card-image" />
      
      <div className="card-overlay">
        
        {/* Header */}
        <div className="card-header">
          <div className="card-title">{data.name || 'Unknown'}</div>
          {activeReqs.length > 0 && (
            <div className="card-reqs">
              {activeReqs.map(req => (
                <div key={req.stat} className={`req-badge ${req.cls}`}>
                  {req.val}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Type Line */}
        <div className="card-type-line">
          <span>{typeLine}</span>
          {data.rarity && (
            <span className={`rarity-indicator rarity-${data.rarity.toLowerCase().replace(/[^a-z]/g, '')}`}>
              {data.rarity.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Text Box */}
        <div className="card-text-box">
          <div className="card-rules">{data.rulesText || ''}</div>
          {data.flavorText && (
            <div className="card-flavor">{data.flavorText}</div>
          )}
        </div>

        {/* Footer */}
        <div className="card-footer">
          <div className="card-artist">{data.artist ? `Illus. ${data.artist}` : 'No Artist'}</div>
          
          {/* Stats for Heroes/Units */}
          {data.type === 'Hero' && data.stats && (
            <div className="card-stats">
              <div className="stat-badge hp">{data.stats.hp}</div>
              <div className="stat-badge def">{data.stats.def}</div>
              <div className="stat-badge res">{data.stats.res}</div>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
