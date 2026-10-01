import re

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'<button className="tool-btn" onClick=\{handleAddCard\} title="New Card">[^<]+</button>', r'<button className="tool-btn" onClick={handleAddCard} title="New Card">➕</button>', content)
content = re.sub(r'<button className="tool-btn" onClick=\{handleSave\} title="Save Cards">[^<]+</button>', r'<button className="tool-btn" onClick={handleSave} title="Save Cards">💾</button>', content)
content = re.sub(r'<button className="tool-btn" onClick=\{handleExportCard\} title="Export Card Image">[^<]+</button>', r'<button className="tool-btn" onClick={handleExportCard} title="Export Card Image">🖼️</button>', content)
content = re.sub(r'<button className="tool-btn" onClick=\{handleDeleteCard\} title="Delete Card" style=\{\{ color: \'red\' \}\}>[^<]+</button>', r'<button className="tool-btn" onClick={handleDeleteCard} title="Delete Card" style={{ color: \'red\' }}>🗑️</button>', content)

content = re.sub(r"return sortConfig\.direction === 'asc' \? '[^']+' : '[^']+';", r"return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';", content)

with open('src/App.jsx', 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)
