import os
import tempfile
import subprocess
import platform
import threading
import time
import requests
import io
import base64
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class TTSService:
    def __init__(self):
        self.api_key = os.getenv('ELEVENLABS_API_KEY')
        self._is_speaking = False
        self.current_audio_file = None
        
        # Your current voice settings
        self.voice_id = 'ErXwobaYiN019PkySvjV'  # Antoni
        self.base_url = 'https://api.elevenlabs.io/v1'
        
        # WebSocket reference (will be set by server)
        self.socketio = None
        
        if not self.api_key:
            raise ValueError("ELEVENLABS_API_KEY not found in environment variables")
    
    def set_socketio(self, socketio):
        """Set the WebSocket reference for audio streaming"""
        self.socketio = socketio
    
    def initialize(self):
        """Initialize the TTS service"""
        try:
            print("TTS Service initialized successfully")
            print("Using Electron for audio playback via WebSocket")
            return True
        except Exception as e:
            print(f"Failed to initialize TTS service: {e}")
            return False
    
    def speak(self, text: str) -> bool:
        """
        Speak text using TTS and stream audio to Electron
        
        Args:
            text (str): Text to speak
        
        Returns:
            bool: True if successful, False otherwise
        """
        if not text or not text.strip():
            print("No text provided for TTS")
            return False
        
        try:
            # Stop any current speech
            if self._is_speaking:
                self.stop()
            
            self._is_speaking = True
            
            print(f"Generating speech for: '{text[:50]}{'...' if len(text) > 50 else ''}'")
            
            # Prepare the request
            url = f"{self.base_url}/text-to-speech/{self.voice_id}"
            headers = {
                'xi-api-key': self.api_key,
                'Content-Type': 'application/json'
            }
            data = {
                'text': text,
                'model_id': 'eleven_monolingual_v1',
                'voice_settings': {
                    'stability': 0.5,
                    'similarity_boost': 0.75,
                    'style': 0.0,
                    'use_speaker_boost': True
                }
            }
            
            # Make the API request
            response = requests.post(url, headers=headers, json=data)
            response.raise_for_status()
            
            # Stream audio to Electron via WebSocket
            self._stream_audio_to_electron(response.content, text)
            
            return True
            
        except Exception as e:
            print(f"Error in TTS speak: {e}")
            self._is_speaking = False
            return False
    
    def _stream_audio_to_electron(self, audio_data: bytes, text: str):
        """Stream audio data to Electron via WebSocket"""
        try:
            # Convert audio data to base64 for WebSocket transmission
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')
            
            # Send audio data to Electron
            if self.socketio:
                self.socketio.emit('tts_audio', {
                    'type': 'audio_data',
                    'audio': audio_base64,
                    'text': text,
                    'format': 'mp3'
                })
                print("Audio data sent to Electron for playback")
                
                # Wait for audio to finish (we'll get a completion event from Electron)
                # For now, we'll estimate based on text length
                estimated_duration = len(text.split()) * 0.5  # Rough estimate: 0.5 seconds per word
                time.sleep(estimated_duration)
                
                self._is_speaking = False
                print("Audio playback completed")
            else:
                print("WebSocket not available, falling back to system player")
                self._play_audio_system(audio_data)
            
        except Exception as e:
            print(f"Error streaming audio to Electron: {e}")
            self._is_speaking = False
    
    def _play_audio_system(self, audio_data: bytes):
        """Play audio using system player (fallback)"""
        try:
            # Save to temporary file
            temp_dir = Path(tempfile.gettempdir()) / "scout-tts"
            temp_dir.mkdir(exist_ok=True)
            
            audio_file = temp_dir / "speech.mp3"
            
            # Save the audio
            with open(audio_file, 'wb') as f:
                f.write(audio_data)
            
            self.current_audio_file = audio_file
            
            # Play the audio
            system = platform.system().lower()
            
            if system == "windows":
                subprocess.Popen(['start', '', str(audio_file)], shell=True)
            elif system == "darwin":  # macOS
                subprocess.Popen(['afplay', str(audio_file)])
            elif system == "linux":
                subprocess.Popen(['xdg-open', str(audio_file)])
            else:
                print(f"Unsupported operating system: {system}")
                return
            
            print(f"Playing audio: {audio_file}")
            
            # Clean up file after a delay
            def cleanup():
                time.sleep(10)  # Wait 10 seconds
                try:
                    if audio_file.exists():
                        audio_file.unlink()
                        print(f"Cleaned up: {audio_file}")
                except Exception as e:
                    print(f"Could not clean up audio file: {e}")
            
            cleanup_thread = threading.Thread(target=cleanup)
            cleanup_thread.daemon = True
            cleanup_thread.start()
            
        except Exception as e:
            print(f"Error playing audio: {e}")
    
    def stop(self) -> bool:
        """Stop current TTS"""
        try:
            self._is_speaking = False
            
            # Send stop signal to Electron
            if self.socketio:
                self.socketio.emit('tts_audio', {
                    'type': 'stop_audio'
                })
            
            # Clean up current audio file
            if self.current_audio_file and self.current_audio_file.exists():
                try:
                    self.current_audio_file.unlink()
                    print(f"Stopped and cleaned up: {self.current_audio_file}")
                except Exception as e:
                    print(f"Could not clean up audio file: {e}")
            
            self.current_audio_file = None
            return True
            
        except Exception as e:
            print(f"Error stopping TTS: {e}")
            return False
    
    def is_speaking(self) -> bool:
        """Check if currently speaking"""
        return self._is_speaking

# Create global instance
tts = TTSService() 