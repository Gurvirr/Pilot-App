const { app, BrowserWindow, screen, globalShortcut, ipcMain } = require('electron');
const path = require('path');
const SystemMonitor = require('./system-monitor');

let mainWindow;
let systemMonitor;

function createWindow () {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  const win = new BrowserWindow({
    width,
    height,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    clickThrough: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile('frontend/index.html');
  
  // Make global for system monitor
  global.mainWindow = win;
  
  // Start system monitoring
  systemMonitor = new SystemMonitor();
  systemMonitor.startMonitoring();

  // Start with the window hidden
  win.hide();

  // Register the global shortcut
  globalShortcut.register('/', () => {
    if (win.isVisible()) {
      win.hide();
    } else {
      win.show();
    }
  });

  // Set window to ignore mouse events (except for specific areas)
  win.setIgnoreMouseEvents(true, { forward: true });

  return win;
}

app.whenReady().then(() => {
  mainWindow = createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
  if (systemMonitor) {
    systemMonitor.stopMonitoring();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('will-quit', () => {
  // Unregister all shortcuts.
  globalShortcut.unregisterAll();
}); 