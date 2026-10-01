import re

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

findImg = """                        {getCardImage(activeCard) ? (
                          <img 
src={`http://localhost:3002/cards/generated/${getCardImage(activeCard)}?t=${Date.now()}`} alt="art" />
                        ) : ("""

replaceImg = """                        {getCardImage(activeCard) ? (
                          <img 
                            src={`http://localhost:3002/cards/generated/${getCardImage(activeCard)}?t=${Date.now()}`} 
                            alt="art" 
                            style={{
                              objectFit: 'cover',
                              objectPosition: `${activeCard.artX ?? 50}% ${activeCard.artY ?? 50}%`,
                              transform: `scale(${(activeCard.artZoom ?? 100) / 100})`
                            }}
                          />
                        ) : ("""

content = content.replace(findImg, replaceImg)

findSettings = """              {activeCard && (
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
              )}"""

replaceSettings = """              {activeCard && (
                <div className="card-settings" style={{ padding: '10px 20px', display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'flex-start' }}>
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
                  </div>
                </div>
              )}"""

content = content.replace(findSettings, replaceSettings)

with open('src/App.jsx', 'w', encoding='utf-8', newline='') as f:
    f.write(content)
