from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit
import threading
import time
from speech_to_text import speech_to_text_loop
from AI.scout import scout_do
from tts_service import tts

import os
from dotenv import load_dotenv
from google import genai

app = Flask(__name__)
app.config['SECRET_KEY'] = 'scout_secret_key'
socketio = SocketIO(app, cors_allowed_origins="*")

# Global variables to track the STT loop
stt_thread = None
stt_running = False

def initialize_scout():
    """Initialize Scout AI with API key"""
    load_dotenv()
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not found in environment variables")
    
    # Initialize the client in scout module
    import AI.scout as scout_module
    scout_module.client = genai.Client(api_key=api_key)
    
    # Set WebSocket reference for TTS service
    tts.set_socketio(socketio)

def stt_worker():
    """Worker function that runs the STT loop forever"""
    global stt_running
    print("Starting STT worker thread...")
    
    while stt_running:
        try:
            # Get text from speech-to-text
            recognized_text = speech_to_text_loop()
            
            if recognized_text:
                print(f"Recognized: {recognized_text}")
                
                # Check if this contains the trigger word "scout"
                if "scout" in recognized_text.lower():
                    # Send "active" event when scout is triggered
                    socketio.emit('scout_event', {'type': 'active'})
                
                # Send "message" event for all recognized text
                socketio.emit('scout_event', {'type': 'message', 'text': recognized_text})
                
                # Feed the text into scout_do
                scout_do(recognized_text)
                
                # Send "hidden" event when action is complete
                socketio.emit('scout_event', {'type': 'hidden'})
                
        except Exception as e:
            print(f"Error in STT worker: {e}")
            time.sleep(1)  # Brief pause before retrying


@socketio.on('connect')
def handle_connect():
    print('Client connected to WebSocket')
    emit('scout_event', {'type': 'connected', 'message': 'Connected to Scout WebSocket'})

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected from WebSocket')


@app.route('/')
def home():
    return jsonify({
        "message": "Scout Flask Server is running",
        "stt_status": "running" if stt_running else "stopped"
    })

@app.route('/start_stt', methods=['POST'])
def start_stt():
    global stt_thread, stt_running
    
    if stt_running:
        return jsonify({"message": "STT is already running"}), 400
    
    try:
        # Initialize Scout AI
        initialize_scout()
        
        stt_running = True
        stt_thread = threading.Thread(target=stt_worker, daemon=True)
        stt_thread.start()
        
        return jsonify({"message": "STT started successfully"})
    
    except Exception as e:
        stt_running = False
        return jsonify({"error": str(e)}), 500

@app.route('/stop_stt', methods=['POST'])
def stop_stt():
    global stt_running
    
    if not stt_running:
        return jsonify({"message": "STT is not running"}), 400
    
    stt_running = False
    return jsonify({"message": "STT stop signal sent"})

@app.route('/status')
def status():
    return jsonify({
        "stt_running": stt_running,
        "thread_alive": stt_thread.is_alive() if stt_thread else False
    })

@app.route('/test_scout', methods=['POST'])
def test_scout():
    """Test endpoint to manually trigger scout_do with text"""
    data = request.get_json()
    if not data or 'text' not in data:
        return jsonify({"error": "Missing 'text' in request body"}), 400
    
    try:
        initialize_scout()
        scout_do(data['text'])
        return jsonify({"message": f"Scout processed: {data['text']}"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("Starting Scout Flask Server with WebSocket...")
    print("Available endpoints:")
    print("  GET  /          - Home page with status")
    print("  POST /start_stt - Start speech-to-text loop")
    print("  POST /stop_stt  - Stop speech-to-text loop")
    print("  GET  /status    - Check STT status")
    print("  POST /test_scout - Test scout_do with manual text")
    print("  WebSocket events: 'active', 'message', 'hidden'")
    
    # Auto-start STT on server startup (only if not already running)
    if not stt_running:
        try:
            initialize_scout()
            stt_running = True
            stt_thread = threading.Thread(target=stt_worker, daemon=True)
            stt_thread.start()
            print("STT auto-started successfully!")
        except Exception as e:
            print(f"Failed to auto-start STT: {e}")
    
    socketio.run(app, debug=False, host='0.0.0.0', port=5000)  # Use socketio.run instead of app.run
