const fs = require('fs');
let content = fs.readFileSync('src/components/GameBoard.jsx', 'utf8');
content = content.replace(
  "      </div>\n    </Xwrapper>\n  );\n}",
  "      </div>\n      </div>\n    </Xwrapper>\n  );\n}"
);
fs.writeFileSync('src/components/GameBoard.jsx', content);
