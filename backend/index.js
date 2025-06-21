const { app, BrowserWindow, globalShortcut } = require('electron');
const path = require('path');

function createWindow () {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    frame: false,
    transparent: true,
    opacity: 0.7,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
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