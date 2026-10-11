const { app, BrowserWindow, Menu, ipcMain, screen } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV !== 'production';

// Ensure the local backend server (port 3002) is always running
try {
  require('./server.js');
} catch (e) {
  // Server might already be running
}

ipcMain.on('toggle-deck-builder-size', (event, isOpen) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return;
  const isMaximized = win.isMaximized();
  if (isMaximized) return; // If already maximized, window uses full screen

  const [currentWidth, currentHeight] = win.getSize();
  const [currentX, currentY] = win.getPosition();
  const delta = 300;
  const display = screen.getDisplayMatching(win.getBounds());
  const maxAvailableWidth = display.workArea.width;

  if (isOpen) {
    const newWidth = Math.min(currentWidth + delta, maxAvailableWidth);
    // If expanding pushes window off-screen on the right, shift it left
    let newX = currentX;
    if (newX + newWidth > display.workArea.x + maxAvailableWidth) {
      newX = Math.max(display.workArea.x, display.workArea.x + maxAvailableWidth - newWidth);
    }
    win.setBounds({ x: newX, y: currentY, width: newWidth, height: currentHeight });
  } else {
    const newWidth = Math.max(currentWidth - delta, 1050);
    win.setSize(newWidth, currentHeight);
  }
});

function createWindow() {
  const iconPath = process.platform === 'win32'
    ? path.join(__dirname, 'build', 'icon.ico')
    : path.join(__dirname, 'build', 'icon.png');

  const win = new BrowserWindow({
    width: 1420,
    height: 850,
    minWidth: 1050,
    minHeight: 650,
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
