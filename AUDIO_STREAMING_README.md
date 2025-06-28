# Audio Streaming Through Electron

This document describes the changes made to stream TTS (Text-to-Speech) audio through Electron instead of using pygame.

## Overview

The original system used pygame for direct audio playback in Python. This has been replaced with a WebSocket-based streaming system that sends audio data from Python to Electron for playback.

## Architecture Changes

### Before (Pygame)
```
Python TTS → pygame.mixer → System Audio
```

### After (Electron)
```
Python TTS → WebSocket → Electron → HTML5 Audio → System Audio
```

## Files Modified

### 1. `backend/python/tts_service.py`
- **Removed**: pygame dependency and imports
- **Added**: WebSocket communication for audio streaming
- **Added**: Base64 encoding for audio data transmission
- **Added**: `set_socketio()` method to configure WebSocket reference

### 2. `backend/python/server.py`
- **Added**: Import of TTS service
- **Added**: WebSocket reference setup for TTS service

### 3. `backend/electron/audio-service.js` (NEW)
- **Created**: New audio service for Electron main process
- **Features**: 
  - WebSocket client to connect to Python server
  - Audio file management and cleanup
  - IPC communication with renderer process
  - Base64 audio data decoding

### 4. `backend/electron/index.js`
- **Added**: Audio service import and initialization
- **Added**: Audio service startup in main process

### 5. `frontend/tts-audio-handler.js` (NEW)
- **Created**: Frontend audio handler for renderer process
- **Features**:
  - IPC message handling for audio playback
  - HTML5 Audio API integration
  - Visual TTS indicator
  - Audio completion notifications

### 6. `frontend/index.html`
- **Added**: TTS audio handler script inclusion

### 7. `package.json`
- **Added**: `socket.io-client` dependency for WebSocket communication

### 8. `requirements.txt`
- **Removed**: pygame dependency

## How It Works

1. **TTS Generation**: Python generates audio using ElevenLabs API
2. **Audio Encoding**: Audio data is base64 encoded for WebSocket transmission
3. **WebSocket Transmission**: Audio data is sent to Electron via WebSocket
4. **File Storage**: Electron saves audio to temporary file
5. **Renderer Playback**: Frontend receives IPC message and plays audio using HTML5 Audio API
6. **Cleanup**: Temporary files are cleaned up after playback

## Benefits

1. **No Pygame Dependency**: Eliminates pygame installation issues
2. **Better Integration**: Audio plays through the Electron application
3. **Visual Feedback**: TTS indicator shows when audio is playing
4. **Cross-Platform**: Works consistently across different operating systems
5. **Better Error Handling**: More robust error handling and fallbacks

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   pip install -r requirements.txt
   ```

2. **Start the System**:
   ```bash
   # Terminal 1: Start Python server
   python backend/python/server.py
   
   # Terminal 2: Start Electron app
   npm start
   ```

3. **Test Audio Streaming**:
   ```bash
   python test_audio_streaming.py
   ```

## Troubleshooting

### Audio Not Playing
- Check that Electron app is running
- Verify WebSocket connection in console logs
- Check browser console for audio errors
- Ensure audio files are being created in temp directory

### WebSocket Connection Issues
- Verify Python server is running on port 5000
- Check firewall settings
- Ensure no other services are using the port

### Audio Quality Issues
- Check ElevenLabs API key configuration
- Verify audio format compatibility
- Check system audio settings

## API Changes

### TTS Service Methods
- `speak(text)` - Now streams audio to Electron instead of playing directly
- `stop()` - Now sends stop signal to Electron
- `is_speaking()` - Returns current speaking status
- `set_socketio(socketio)` - New method to configure WebSocket reference

### WebSocket Events
- `tts_audio` - Audio data or stop signal from Python
- `play-tts-audio` - IPC message to renderer for audio playback
- `stop-tts-audio` - IPC message to renderer to stop audio
- `tts-audio-complete` - IPC message from renderer when audio finishes
- `tts-audio-error` - IPC message from renderer for audio errors

## Future Enhancements

1. **Streaming Audio**: Real-time audio streaming without temporary files
2. **Audio Effects**: Add audio effects and processing
3. **Multiple Voices**: Support for different TTS voices
4. **Audio Visualization**: Real-time audio visualization in the UI
5. **Audio Controls**: Volume, speed, and playback controls 