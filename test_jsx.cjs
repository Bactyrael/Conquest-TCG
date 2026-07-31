const fs = require('fs');
const esbuild = require('esbuild');

async function run() {
  const code = fs.readFileSync('src/components/GameBoard.jsx', 'utf8');
  try {
    await esbuild.transform(code, { loader: 'jsx' });
    console.log("Success!");
  } catch(e) {
    console.log(e.message);
  }
}
run();
