// frontend/media-player.js
class MediaPlayer {
    constructor() {
        this.container = document.querySelector('.corner-box.bottom-left');
        this.currentTrack = null;
        
        if (this.container) {
            this.init();
        } else {
            console.error('Media Player: Bottom-left container not found!');
        }
    }

    init() {
        // Clear the existing canvas
        const canvas = this.container.querySelector('#canvas-bl');
        if (canvas) {
            canvas.remove();
        }

        // Create the player UI
        this.createPlayerUI();
        
        // Listen for updates from the backend
        const { ipcRenderer } = require('electron');
        ipcRenderer.on('media-update', (event, track) => {
            this.update(track);
        });

        console.log('Media Player initialized.');
    }

    createPlayerUI() {
        this.container.innerHTML = `
            <div class="media-player-header">
                <span class="media-title">🎧 Media Player</span>
            </div>
            <div class="media-player-content">
                <div class="media-artwork">
                    <div class="no-artwork-icon">🎵</div>
                </div>
                <div class="media-info">
                    <div class="media-track-title">Not Playing</div>
                    <div class="media-track-artist">...</div>
                </div>
            </div>
        `;
        this.addStyles();
    }

    update(track) {
        this.currentTrack = track;
        const titleEl = this.container.querySelector('.media-track-title');
        const artistEl = this.container.querySelector('.media-track-artist');

        if (track) {
            titleEl.textContent = track.title || 'Unknown Title';
            artistEl.textContent = track.artist || 'Unknown Artist';
        } else {
            titleEl.textContent = 'Not Playing';
            artistEl.textContent = '...';
        }
    }
    
    addStyles() {
        const styles = `
            <style>
                .corner-box.bottom-left {
                    display: flex;
                    flex-direction: column;
                }
                .media-player-header {
                    height: 30px;
                    background-color: rgba(0, 170, 255, 0.1);
                    border-bottom: 1px solid rgba(0, 170, 255, 0.3);
                    border-radius: 4px 4px 0 0;
                    z-index: 1;
                    display: flex;
                    align-items: center;
                    padding: 0 12px;
                }
                .media-title {
                    color: #00aaff;
                    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
                    font-size: 11px;
                    font-weight: bold;
                }
                .media-player-content {
                    display: flex;
                    align-items: center;
                    padding: 15px;
                    flex-grow: 1;
                }
                .media-artwork {
                    width: 80px;
                    height: 80px;
                    background-color: rgba(0, 0, 0, 0.2);
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 15px;
                }
                .no-artwork-icon {
                    font-size: 40px;
                    color: rgba(255, 255, 255, 0.2);
                }
                .media-info {
                    display: flex;
                    flex-direction: column;
                }
                .media-track-title {
                    font-size: 14px;
                    font-weight: bold;
                    color: #ffffff;
                }
                .media-track-artist {
                    font-size: 12px;
                    color: #00aaff;
                }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', styles);
    }
}

// Initialize when the DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    new MediaPlayer();
}); 