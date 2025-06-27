const { MediaController, MediaEvents } = require('node-media-controller');

class MediaService {
    constructor() {
        this.mediaController = MediaController;
        this.currentTrack = null;
        this.init();
    }

    init() {
        console.log('Initializing Media Service...');

        if (!this.mediaController) {
            console.error('Failed to load MediaController object.');
            return;
        }

        this.mediaController.on(MediaEvents.PLAYING, (track) => {
            this.handleMediaChange(track);
        });
        
        this.mediaController.on(MediaEvents.PAUSED, () => {
            this.handleMediaStop();
        });

        console.log('Media Service initialized and listening for events.');
    }

    handleMediaChange(track) {
        console.log('[Media Service] Raw track data received:', track);

        // The 'artwork' property can be a complex object. Let's simplify.
        // For now, we will ignore it to avoid issues with sending complex data.
        const newTrack = {
            title: track.title,
            artist: track.artist,
            album: track.album,
        };

        if (JSON.stringify(this.currentTrack) !== JSON.stringify(newTrack)) {
            this.currentTrack = newTrack;
            console.log('[Media Service] Media Changed:', this.currentTrack);
            this.broadcastUpdate();
        } else {
            console.log('[Media Service] Received media update, but track data is the same. Ignoring.');
        }
    }

    handleMediaStop() {
        console.log('[Media Service] Media stop event detected.');
        if (this.currentTrack !== null) {
            this.currentTrack = null;
            console.log('[Media Service] Media Stopped.');
            this.broadcastUpdate();
        }
    }

    broadcastUpdate() {
        // Use the global mainWindow from Electron's main process
        if (!global.mainWindow) {
            console.error('Main window not available for media updates.');
            return;
        }

        const payload = {
            type: 'media_update', // Keep this for frontend logic
            data: this.currentTrack
        };

        // Send the update to the renderer process
        global.mainWindow.webContents.send('media-update', payload.data);
    }
}

module.exports = MediaService; 