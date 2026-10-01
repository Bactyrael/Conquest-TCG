import re

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

find_str = """    if (sortConfig.key === 'type') {
      aVal = \ \.toLowerCase();
      bVal = \ \.toLowerCase();
    } else if (sortConfig.key === 'id' || sortConfig.key === 'cost') {"""

replace_str = """    if (sortConfig.key === 'type') {
      aVal = f"{a.get('type', '')} {a.get('subtype', '')}".lower() # Note: This is JS so we use JS syntax
      // Actually we are writing JS code to App.jsx:
      aVal = `${a.type || ''} ${a.subtype || ''}`.toLowerCase();
      bVal = `${b.type || ''} ${b.subtype || ''}`.toLowerCase();
    } else if (sortConfig.key === 'id' || sortConfig.key === 'cost') {"""

content = content.replace(find_str, """    if (sortConfig.key === 'type') {
      aVal = (`${a.type || ''} ${a.subtype || ''}`).toLowerCase();
      bVal = (`${b.type || ''} ${b.subtype || ''}`).toLowerCase();
    } else if (sortConfig.key === 'id' || sortConfig.key === 'cost') {""")

with open('src/App.jsx', 'w', encoding='utf-8', newline='') as f:
    f.write(content)
