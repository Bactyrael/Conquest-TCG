import re

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

findStr = """            {activeCard && (
                          {activeTab === 'card' && activeCard && ("""

replaceStr = """            {activeTab === 'card' && activeCard && ("""

content = content.replace(findStr, replaceStr)

findStr2 = """              </div>
            )}

            {activeTab === 'notes' && activeCard && ("""

replaceStr2 = """              </div>
            )}

            {activeTab === 'notes' && activeCard && ("""

# Actually let's just do a clean targeted replace of the bad wrapper
content = re.sub(r'\{activeCard && \(\s*\{activeTab === \'card\'', r'{activeTab === \'card\'', content)

# But wait, the original `)` for `{activeCard && (` is still at the bottom?
# Let's check where the closing parenthesis is.
