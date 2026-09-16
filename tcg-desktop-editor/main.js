const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV !== 'production';

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  const template = [
    { label: 'File', submenu: [{ role: 'quit' }] },
    { label: 'Edit', submenu: [
        { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' }
      ]
    },
    { label: 'Cards', submenu: [{ label: 'New Card' }] },
    { label: 'Format', submenu: [{ label: 'Style...' }] },
    { 
      label: 'Text', 
      submenu: [
        { label: 'Bold Reference: **text**', enabled: false },
        { label: 'Italic Reference: *text*', enabled: false },
        { type: 'separator' },
        { label: 'Symbol References:', enabled: false },
        { label: 'Use / Tap Symbol: [USE]', enabled: false },
        { label: 'Mana Crystal: [MANA]', enabled: false },
        { label: 'Stamina Crystal: [STAMINA]', enabled: false }
      ]
    },
    { label: 'Window', submenu: [{ role: 'minimize' }, { role: 'zoom' }, { role: 'toggledevtools' }] },
    { label: 'Help', submenu: [{ label: 'About Beasts and Bounties Editor' }] }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, 'dist/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
