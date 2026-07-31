const fs = require('fs');
let content = fs.readFileSync('src/components/GameBoard.jsx', 'utf8');

content = content.replace(
  "const preventNextSync = useRef(false);",
  "const preventNextSync = useRef(false);\n  const [opponentPhasePassTrigger, setOpponentPhasePassTrigger] = useState(0);"
);

content = content.replace(
  "    newSocket.on('pass_phase', () => {\n       preventNextSync.current = true;\n       handlePhaseAdvance(true);\n       setTimeout(() => preventNextSync.current = false, 50);\n    });",
  "    newSocket.on('pass_phase', () => {\n       setOpponentPhasePassTrigger(prev => prev + 1);\n    });"
);

content = content.replace(
  "  const handlePhaseAdvance = (fromSocket = false) => {",
  "  useEffect(() => {\n    if (opponentPhasePassTrigger > 0) {\n      preventNextSync.current = true;\n      handlePhaseAdvance(true);\n      setTimeout(() => preventNextSync.current = false, 50);\n    }\n  }, [opponentPhasePassTrigger]);\n\n  const handlePhaseAdvance = (fromSocket = false) => {"
);

fs.writeFileSync('src/components/GameBoard.jsx', content);
