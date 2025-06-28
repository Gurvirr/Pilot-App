const { ipcMain } = require('electron');
const fs = require('fs').promises;
const path = require('path');
const { io } = require('socket.io-client');

class AudioService {
    constructor() {
        this.socket = null;
        this.audioContext = null;
        this.currentAudio = null;
        this.isPlaying = false;
        this.tempDir = null;
        
        this.init();
    }

    async init() {
        console.log('🎵 Initializing Audio Service...');
        
        try {
            // Create temp directory for audio files
            this.tempDir = path.join(require('os').tmpdir(), 'jarvis-audio');
            await fs.mkdir(this.tempDir, { recursive: true });
            
            // Connect to Python WebSocket server
            this.connectToPythonServer();
            
            // Set up IPC handlers for audio control
            this.setupIPCHandlers();
            
            console.log('✅ Audio Service initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Audio Service:', error);
        }
    }

    connectToPythonServer() {
        try {
            console.log('🔗 Connecting to Python WebSocket server...');
            
            this.socket = io('http://localhost:5000');
            
            this.socket.on('connect', () => {
                console.log('✅ Connected to Python WebSocket server');
            });
            
            this.socket.on('disconnect', () => {
                console.log('❌ Disconnected from Python WebSocket server');
            });
            
            this.socket.on('tts_audio', (data) => {
                this.handleTTSAudio(data);
            });
            
            this.socket.on('connect_error', (error) => {
                console.error('❌ Failed to connect to Python server:', error);
            });
            
        } catch (error) {
            console.error('❌ Error connecting to Python server:', error);
        }
    }

    async handleTTSAudio(data) {
        console.log('🎵 Received TTS audio data:', data.type);
        
        switch (data.type) {
            case 'audio_data':
                await this.playAudioData(data);
                break;
                
            case 'stop_audio':
                this.stopAudio();
                break;
                
            default:
                console.log('⚠️ Unknown TTS audio type:', data.type);
        }
    }

    async playAudioData(data) {
        try {
            // Stop any currently playing audio
            if (this.isPlaying) {
                this.stopAudio();
            }
            
            console.log('🎵 Playing TTS audio...');
            
            // Decode base64 audio data
            const audioBuffer = Buffer.from(data.audio, 'base64');
            
            // Save to temporary file
            const audioFile = path.join(this.tempDir, `tts-${Date.now()}.mp3`);
            await fs.writeFile(audioFile, audioBuffer);
            
            // Play audio using HTML5 Audio API through renderer process
            if (global.mainWindow) {
                global.mainWindow.webContents.send('play-tts-audio', {
                    filePath: audioFile,
                    text: data.text || ''
                });
                
                this.isPlaying = true;
                this.currentAudio = audioFile;
                
                console.log('✅ Audio playback started');
            } else {
                console.error('❌ Main window not available for audio playback');
            }
            
        } catch (error) {
            console.error('❌ Error playing audio:', error);
        }
    }

    stopAudio() {
        try {
            if (this.isPlaying && global.mainWindow) {
                global.mainWindow.webContents.send('stop-tts-audio');
                this.isPlaying = false;
                this.currentAudio = null;
                console.log('⏹️ Audio playback stopped');
            }
        } catch (error) {
            console.error('❌ Error stopping audio:', error);
        }
    }

    setupIPCHandlers() {
        // Handle audio completion from renderer
        ipcMain.handle('tts-audio-complete', async () => {
            console.log('✅ TTS audio playback completed');
            this.isPlaying = false;
            this.currentAudio = null;
            
            // Clean up temp file
            if (this.currentAudio) {
                try {
                    await fs.unlink(this.currentAudio);
                    console.log('🗑️ Cleaned up audio file');
                } catch (error) {
                    console.error('❌ Error cleaning up audio file:', error);
                }
            }
        });
        
        // Handle audio error from renderer
        ipcMain.handle('tts-audio-error', async (event, error) => {
            console.error('❌ TTS audio playback error:', error);
            this.isPlaying = false;
            this.currentAudio = null;
        });
    }

    cleanup() {
        try {
            if (this.socket) {
                this.socket.disconnect();
            }
            
            if (this.isPlaying) {
                this.stopAudio();
            }
            
            console.log('🧹 Audio Service cleaned up');
        } catch (error) {
            console.error('❌ Error cleaning up Audio Service:', error);
        }
    }
}

module.exports = AudioService; 