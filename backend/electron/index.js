const { app, BrowserWindow, screen, globalShortcut, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const SystemMonitor = require('./system-monitor');
const MediaService = require('./media-service');

console.log('🎬 Starting Jarvis Electron App...');
console.log(`📅 Date: ${new Date().toISOString()}`);
console.log(`🖥️  Platform: ${process.platform}`);
console.log(`⚡ Electron version: ${process.versions.electron}`);
console.log(`🟢 Node version: ${process.versions.node}`);

let mainWindow;
let systemMonitor;
let mediaService;

function createWindow () {
  console.log('🚀 Creating Electron window...');
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  console.log(`📐 Screen dimensions: ${width}x${height}`);

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

  console.log('🌐 Loading frontend HTML...');
  console.log('🌐 Loading frontend HTML...');
  win.loadFile(path.join(__dirname, '../../frontend/index.html'));
  
  // Make global for system monitor and media service
  global.mainWindow = win;
    // Start system monitoring
  console.log('📊 Starting system monitoring...');
  try {
    systemMonitor = new SystemMonitor();
    systemMonitor.startMonitoring();
    console.log('✅ System monitoring started successfully');
  } catch (error) {
    console.error('❌ Failed to start system monitoring:', error);
  }

  // Start media service
  console.log('🎵 Starting media service...');
  try {
    mediaService = new MediaService();
    console.log('✅ Media service started successfully');
  } catch (error) {
    console.error('❌ Failed to start media service:', error);
  }

  // Start with the window visible (for mini overlay)
  console.log('👁️  Showing window for mini overlay...');
  win.show();
  // Register the global shortcut
  console.log('⌨️  Registering global shortcuts...');
  try {    const toggleSuccess = globalShortcut.register('/', () => {
      console.log('🎬 Slash key pressed - toggling view');
      // Send message to frontend to toggle between mini and full view
      win.webContents.send('toggle-view-mode');
    });

    if (toggleSuccess) {
      console.log('✅ Toggle shortcut (/) registered successfully');
    } else {
      console.error('❌ Failed to register toggle shortcut (/)');
    }

    // Register P key for audio visualizer toggle
    const visualizerSuccess = globalShortcut.register('=', () => {
      if (win.isVisible()) {
        console.log('🎵 Toggling audio visualizer focus (= key pressed)');
        // Send message to frontend to toggle visualizer focus
        win.webContents.send('toggle-visualizer-focus');
      } else {
        console.log('⚠️  Audio visualizer toggle ignored - window not visible');
      }
    });

    if (visualizerSuccess) {
      console.log('✅ Visualizer shortcut (=) registered successfully');
    } else {
      console.error('❌ Failed to register visualizer shortcut (=)');
    }
  } catch (error) {
    console.error('❌ Error registering shortcuts:', error);
  }
  // Set window to ignore mouse events (except for specific areas)
  console.log('🖱️  Setting window to ignore mouse events...');
  win.setIgnoreMouseEvents(true, { forward: true });

  // Add event listeners for debugging
  win.webContents.on('did-finish-load', () => {
    console.log('✅ Frontend loaded successfully');
  });

  win.webContents.on('crashed', () => {
    console.error('💥 Window content crashed!');
  });

  win.on('closed', () => {
    console.log('❌ Window closed');
  });

  win.on('show', () => {
    console.log('👁️  Window shown');
  });

  win.on('hide', () => {
    console.log('👻 Window hidden');
  });

  console.log('✨ Window creation complete');
  return win;
}

// IPC handler for controlling mouse events
ipcMain.handle('set-mouse-events', async (event, enabled, region = null) => {
  console.log(`🖱️ Setting mouse events: ${enabled ? 'enabled' : 'disabled'}`, region ? `for region: ${JSON.stringify(region)}` : '');
  
  try {
    if (enabled && region) {
      // Enable mouse events for specific region
      global.mainWindow.setIgnoreMouseEvents(false);
      console.log('✅ Mouse events enabled for specific region');
    } else if (enabled) {
      // Enable mouse events for entire window
      global.mainWindow.setIgnoreMouseEvents(false);
      console.log('✅ Mouse events enabled for entire window');
    } else {
      // Disable mouse events (transparent mode)
      global.mainWindow.setIgnoreMouseEvents(true, { forward: true });
      console.log('✅ Mouse events disabled (transparent mode)');
    }
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to set mouse events:', error);
    return { success: false, error: error.message };
  }
});

// IPC handler for opening media files
ipcMain.handle('open-media-file', async (event, filePath) => {
  console.log(`🎬 IPC request to open file: ${filePath}`);
  
  try {
    const { shell } = require('electron');
    const result = await shell.openPath(filePath);
    
    if (result === '') {
      console.log(`✅ Successfully opened file: ${filePath}`);
      return { success: true };
    } else {
      console.log(`⚠️ Shell returned: ${result}`);
      // Try showing in folder instead
      shell.showItemInFolder(filePath);
      console.log(`📁 Showed file in folder: ${filePath}`);
      return { success: true, method: 'folder' };
    }
  } catch (error) {
    console.error(`❌ Failed to open file: ${filePath}`, error);
    return { success: false, error: error.message };
  }
});

// IPC handler for getting media files
ipcMain.handle('get-media-files', async () => {
  console.log('📁 Getting media files from captures directories...');
  
  const mediaFiles = [];
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
  const videoExtensions = ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.m4v'];
  
  try {
    // Check Screenshots directory
    const screenshotsPath = path.join(__dirname, '../python/captures/screenshots');
    try {
      const screenshotFiles = await fs.readdir(screenshotsPath);
      for (const file of screenshotFiles) {
        const filePath = path.join(screenshotsPath, file);
        const ext = path.extname(file).toLowerCase();
        
        if (imageExtensions.includes(ext)) {
          mediaFiles.push({
            name: file,
            path: path.resolve(filePath),
            type: 'image'
          });
        } else if (videoExtensions.includes(ext)) {
          mediaFiles.push({
            name: file,
            path: path.resolve(filePath),
            type: 'video'
          });
        }
      }
      console.log(`📷 Found ${screenshotFiles.length} files in Screenshots`);
    } catch (error) {
      console.log('📁 Screenshots directory not accessible:', error.message);
    }
    
    // Check Videos directory
    const videosPath = path.join(__dirname, '../python/captures/videos');
    try {
      const videoFiles = await fs.readdir(videosPath);
      for (const file of videoFiles) {
        const filePath = path.join(videosPath, file);
        const ext = path.extname(file).toLowerCase();
        
        if (videoExtensions.includes(ext)) {
          mediaFiles.push({
            name: file,
            path: path.resolve(filePath),
            type: 'video'
          });
        } else if (imageExtensions.includes(ext)) {
          mediaFiles.push({
            name: file,
            path: path.resolve(filePath),
            type: 'image'
          });
        }
      }
      console.log(`🎥 Found ${videoFiles.length} files in Videos`);
    } catch (error) {
      console.log('📁 Videos directory not accessible:', error.message);
    }
    
    console.log(`📁 Total media files found: ${mediaFiles.length}`);
    return mediaFiles;
    
  } catch (error) {
    console.error('❌ Error getting media files:', error);
    return [];
  }
});

app.whenReady().then(() => {
  console.log('🎯 Electron app ready, creating main window...');
  mainWindow = createWindow();
  console.log('🏠 Main window created and stored');
});

app.on('window-all-closed', () => {
  console.log('🚪 All windows closed');
  if (process.platform !== 'darwin') {
    console.log('🛑 Quitting app (non-macOS)');
    app.quit();
  }
  if (systemMonitor) {
    console.log('📊 Stopping system monitoring...');
    systemMonitor.stopMonitoring();
  }
});

app.on('activate', () => {
  console.log('🔄 App activated');
  if (BrowserWindow.getAllWindows().length === 0) {
    console.log('🏗️  No windows found, creating new one...');
    createWindow();
  }
});

app.on('will-quit', () => {
  console.log('👋 App will quit, unregistering shortcuts...');
  // Unregister all shortcuts.
  globalShortcut.unregisterAll();
  console.log('⌨️  All shortcuts unregistered');
});