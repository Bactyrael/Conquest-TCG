const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Need to start dev server first or hit localhost if it's running
  // Let's assume it's running on localhost:5173
  await page.goto('http://localhost:5173');
  
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.toString());
  });
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text());
  });

  // wait a bit
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
})();
