import re

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

find_str = '''  const sortedCards = [...filteredCards].sort((a, b) => {
    let aVal = a[sortConfig.key] || '';
    let bVal = b[sortConfig.key] || '';

    if (sortConfig.key === 'id' || sortConfig.key === 'cost') {
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
    return 0;
  });'''

replace_str = '''  const sortedCards = [...filteredCards].sort((a, b) => {
    let aVal = a[sortConfig.key] || '';
    let bVal = b[sortConfig.key] || '';

    if (sortConfig.key === 'type') {
      aVal = \\ \\.toLowerCase();
      bVal = \\ \\.toLowerCase();
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
    
    return (parseInt(a.id, 10) || 0) - (parseInt(b.id, 10) || 0);
  });'''

content = content.replace(find_str, replace_str)

with open('src/App.jsx', 'w', encoding='utf-8', newline='') as f:
    f.write(content)
