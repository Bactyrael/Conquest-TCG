const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV !== 'production';

// Ensure the local backend server (port 3002) is always running
try {
  require('./server.js');
} catch (e) {
  // Server might already be running
}

function createWindow() {
  const iconPath = process.platform === 'win32'
    ? path.join(__dirname, 'build', 'icon.ico')
    : path.join(__dirname, 'build', 'icon.png');

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  const template = [
    { 
      label: 'File', 
      submenu: [
        { 
          label: 'Save', 
          accelerator: 'CmdOrCtrl+S',
          click: () => { win.webContents.send('menu-action', 'save'); }
        },
        { 
          label: 'Export', 
          submenu: [
            { 
              label: 'Export Current Card...', 
              click: () => { win.webContents.send('menu-action', 'export-card'); }
            },
            { 
              label: 'Export all...', 
              accelerator: 'CmdOrCtrl+Shift+E',
              click: () => { win.webContents.send('menu-action', 'export-all'); }
            }
          ]
        },
        { type: 'separator' },
        { role: 'quit' }
      ] 
    },
    { label: 'Edit', submenu: [
        { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' }
      ]
    },
    { 
      label: 'Cards', 
      submenu: [
        { 
          label: 'New Card', 
          accelerator: 'CmdOrCtrl+N',
          click: () => { win.webContents.send('menu-action', 'new-card'); }
        },
        { 
          label: 'Copy Card', 
          accelerator: 'CmdOrCtrl+C',
          click: () => { win.webContents.send('menu-action', 'copy-card'); }
        },
        { 
          label: 'Paste Card', 
          accelerator: 'CmdOrCtrl+V',
          click: () => { win.webContents.send('menu-action', 'paste-card'); }
        },
        { type: 'separator' },
        { 
          label: 'Delete Card', 
          click: () => { win.webContents.send('menu-action', 'delete-card'); }
        }
      ] 
    },
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

  const distPath = path.join(__dirname, 'dist', 'index.html');
  // First check if Vite dev server is running on 5173 (for live development)
  const http = require('http');
  const req = http.get('http://localhost:5173', (res) => {
    win.loadURL('http://localhost:5173');
  });
  req.on('error', () => {
    // If Vite dev server is not running, load the Express web server on 3002 or fallback to dist file
    win.loadURL('http://localhost:3002').catch(() => {
      if (require('fs').existsSync(distPath)) {
        win.loadFile(distPath);
      }
    });
  });
  req.setTimeout(500, () => {
    req.abort();
    win.loadURL('http://localhost:3002').catch(() => {
      if (require('fs').existsSync(distPath)) {
        win.loadFile(distPath);
      }
    });
  });
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
