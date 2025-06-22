const { app, BrowserWindow, screen, globalShortcut } = require('electron');
const path = require('path');

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

  win.loadFile(path.join(__dirname, '../frontend/index.html'));

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

app.on('will-quit', () => {
  // Unregister all shortcuts.
  globalShortcut.unregisterAll();
}); 