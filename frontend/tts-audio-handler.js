// TTS Audio Handler for Electron frontend
class TTSAudioHandler {
    constructor() {
        this.currentAudio = null;
        this.isPlaying = false;
        
        this.init();
    }
    
    init() {
        console.log('🎵 Initializing TTS Audio Handler...');
        
        // Listen for IPC messages from main process
        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            
            // Handle play audio command
            ipcRenderer.on('play-tts-audio', (event, data) => {
                this.playAudio(data);
            });
            
            // Handle stop audio command
            ipcRenderer.on('stop-tts-audio', (event) => {
                this.stopAudio();
            });
            
            console.log('✅ TTS Audio Handler initialized with IPC listeners');
        } else {
            console.log('⚠️ Electron IPC not available, TTS Audio Handler disabled');
        }
    }
    
    async playAudio(data) {
        try {
            // Stop any currently playing audio
            if (this.isPlaying) {
                this.stopAudio();
            }
            
            console.log('🎵 Playing TTS audio:', data.filePath);
            
            // Create audio element
            const audio = new Audio();
            audio.src = `file://${data.filePath}`;
            
            // Set up event listeners
            audio.onloadstart = () => {
                console.log('🎵 Audio loading started');
            };
            
            audio.oncanplay = () => {
                console.log('🎵 Audio can play');
            };
            
            audio.onplay = () => {
                console.log('🎵 Audio playback started');
                this.isPlaying = true;
                this.currentAudio = audio;
                
                // Removed TTS indicator - no popup
                // this.showTTSIndicator(data.text);
            };
            
            audio.onended = () => {
                console.log('🎵 Audio playback ended');
                this.isPlaying = false;
                this.currentAudio = null;
                
                // Removed TTS indicator - no popup
                // this.hideTTSIndicator();
                
                // Notify main process that audio is complete
                if (window.require) {
                    const { ipcRenderer } = window.require('electron');
                    ipcRenderer.invoke('tts-audio-complete');
                }
            };
            
            audio.onerror = (error) => {
                console.error('❌ Audio playback error:', error);
                this.isPlaying = false;
                this.currentAudio = null;
                
                // Removed TTS indicator - no popup
                // this.hideTTSIndicator();
                
                // Notify main process of error
                if (window.require) {
                    const { ipcRenderer } = window.require('electron');
                    ipcRenderer.invoke('tts-audio-error', error.message);
                }
            };
            
            // Start playback
            await audio.play();
            
        } catch (error) {
            console.error('❌ Error playing TTS audio:', error);
            this.isPlaying = false;
            this.currentAudio = null;
            
            // Removed TTS indicator - no popup
            // this.hideTTSIndicator();
        }
    }
    
    stopAudio() {
        try {
            if (this.currentAudio && this.isPlaying) {
                this.currentAudio.pause();
                this.currentAudio.currentTime = 0;
                this.isPlaying = false;
                this.currentAudio = null;
                
                // Removed TTS indicator - no popup
                // this.hideTTSIndicator();
                
                console.log('⏹️ TTS audio stopped');
            }
        } catch (error) {
            console.error('❌ Error stopping TTS audio:', error);
        }
    }
    
    // Removed showTTSIndicator and hideTTSIndicator methods since they're no longer needed
    
    isCurrentlyPlaying() {
        return this.isPlaying;
    }
}

// Initialize TTS Audio Handler when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.ttsAudioHandler = new TTSAudioHandler();
    });
} else {
    window.ttsAudioHandler = new TTSAudioHandler();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TTSAudioHandler;
} 