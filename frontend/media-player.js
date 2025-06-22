// frontend/media-player.js
class MediaPlayer {
    constructor() {
        this.container = document.querySelector('.corner-box.bottom-left');
        this.currentTrack = null;
        this.isChecking = false;
        
        if (this.container) {
            this.init();
        } else {
            console.error('Media Player: Bottom-left container not found!');
        }
    }    init() {
        // Clear the existing canvas
        const canvas = this.container.querySelector('#canvas-bl');
        if (canvas) {
            canvas.remove();
        }

        // Create the player UI
        this.createPlayerUI();
        
        // Start checking for media session updates
        this.startMediaSessionCheck();
        
        // Listen for WebSocket media updates if available
        this.setupWebSocketListener();

        console.log('Media Player initialized.');
    }    setupWebSocketListener() {
        // In Electron, we can use ipcRenderer for system media detection
        if (typeof require !== 'undefined') {
            try {
                const { ipcRenderer } = require('electron');
                
                // Listen for media updates from main process
                ipcRenderer.on('media-update', (event, mediaData) => {
                    console.log('Received system media update:', mediaData);
                    this.update(mediaData);
                });
                
                // Request current media info from main process
                ipcRenderer.send('request-media-info');
                
                // Listen for media info response
                ipcRenderer.on('media-info-response', (event, mediaData) => {
                    if (mediaData) {
                        this.update(mediaData);
                    }
                });
                
                console.log('Electron IPC media listeners set up');
            } catch (error) {
                console.log('Electron IPC not available, falling back to web detection:', error);
                this.setupWebFallback();
            }
        } else {
            console.log('Not in Electron environment, using web detection');
            this.setupWebFallback();
        }
    }

    setupWebFallback() {
        // Fallback for non-Electron environments
        if (window.socket) {
            window.socket.on('media_update', (data) => {
                console.log('Received WebSocket media update:', data);
                this.update(data);
            });
            
            window.socket.on('media_info_response', (data) => {
                if (data && data.title) {
                    this.update(data);
                }
            });
        }
    }    startMediaSessionCheck() {
        // In Electron, prioritize system-level detection
        if (typeof require !== 'undefined') {
            try {
                const { ipcRenderer } = require('electron');
                
                // Request media info every 3 seconds from main process
                setInterval(() => {
                    ipcRenderer.send('request-media-info');
                }, 3000);
                
                // Also request immediately
                ipcRenderer.send('request-media-info');
                
                console.log('Using Electron system media detection');
                return;
            } catch (error) {
                console.log('Electron not available, falling back to web detection');
            }
        }
        
        // Fallback to web detection methods
        this.detectWebMedia();
        setInterval(() => {
            this.detectWebMedia();
        }, 3000);
    }

    async detectWebMedia() {
        if (this.isChecking) return;
        this.isChecking = true;

        try {
            // Check for media session metadata first (most reliable for web)
            const sessionInfo = this.checkMediaSession();
            if (sessionInfo) {
                this.update(sessionInfo);
                return;
            }
            
            // Check for browser audio elements
            const hasAudio = await this.checkBrowserAudio();
            if (hasAudio) {
                this.update(hasAudio);
                return;
            }
            
            // Check document title patterns
            const titleInfo = this.checkDocumentTitle();
            if (titleInfo) {
                this.update(titleInfo);
                return;
            }
            
            // No media detected
            this.update(null);
            
        } catch (error) {
            console.log('Web media detection error:', error);
            this.showSystemMediaPrompt();
        } finally {
            this.isChecking = false;
        }
    }    async checkBrowserAudio() {
        // Check if any audio/video elements are playing
        const mediaElements = document.querySelectorAll('audio, video');
        
        for (let element of mediaElements) {
            if (!element.paused && element.currentTime > 0 && element.readyState >= 2) {
                // Get more detailed info from the element
                const src = element.src || element.currentSrc || '';
                const title = element.title || element.getAttribute('data-title') || 
                             src.split('/').pop().split('.')[0] || 'Browser Media';
                
                return {
                    title: title,
                    artist: 'Web Player',
                    album: `Duration: ${Math.floor(element.duration / 60)}:${Math.floor(element.duration % 60).toString().padStart(2, '0')}`,
                    artwork: null
                };
            }
        }
        
        return null;
    }

    checkDocumentTitle() {
        // Some media players update the document title
        const title = document.title;
        
        // Common patterns for media players
        const musicPatterns = [
            /(.+) - (.+) \| (.+)/,  // "Artist - Song | Player"
            /(.+) - (.+)/,          // "Artist - Song"
            /♪ (.+)/,               // "♪ Song"
            /🎵 (.+)/,              // "🎵 Song"
            /Now Playing: (.+)/,    // "Now Playing: Song"
        ];
        
        for (let pattern of musicPatterns) {
            const match = title.match(pattern);
            if (match) {
                return {
                    title: match[2] || match[1] || 'Unknown',
                    artist: match[1] || 'Unknown Artist',
                    album: match[3] || '',
                    artwork: null
                };
            }
        }
        
        return null;
    }

    checkMediaSession() {
        // Check Media Session API
        if ('mediaSession' in navigator && navigator.mediaSession.metadata) {
            const metadata = navigator.mediaSession.metadata;
            return {
                title: metadata.title || 'Unknown Title',
                artist: metadata.artist || 'Unknown Artist',
                album: metadata.album || '',
                artwork: metadata.artwork?.[0]?.src || null
            };
        }
        return null;
    }

    async checkWebSocketMedia() {
        // Try to get media info from WebSocket connection if available
        try {
            if (window.socket && window.socket.connected) {
                // Request current media info from backend
                return new Promise((resolve) => {
                    window.socket.emit('get_media_info');
                    window.socket.once('media_info_response', (data) => {
                        resolve(data);
                    });
                    
                    // Timeout after 1 second
                    setTimeout(() => resolve(null), 1000);
                });
            }
        } catch (error) {
            console.log('WebSocket media check failed:', error);
        }
        return null;
    }    showSystemMediaPrompt() {
        this.update({
            title: 'Waiting for Media...',
            artist: 'System detection enabled',
            album: 'Play music to see info here',
            artwork: null
        });
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
    }    update(track) {
        this.currentTrack = track;
        const titleEl = this.container.querySelector('.media-track-title');
        const artistEl = this.container.querySelector('.media-track-artist');
        const artworkEl = this.container.querySelector('.media-artwork');

        if (track) {
            titleEl.textContent = track.title || 'Unknown Title';
            artistEl.textContent = track.artist || 'Unknown Artist';
            
            // Update artwork if available
            if (track.artwork) {
                artworkEl.innerHTML = `<img src="${track.artwork}" alt="Album Art" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">`;
            } else {
                artworkEl.innerHTML = '<div class="no-artwork-icon">🎵</div>';
            }
        } else {
            titleEl.textContent = 'Not Playing';
            artistEl.textContent = '...';
            artworkEl.innerHTML = '<div class="no-artwork-icon">🎵</div>';
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