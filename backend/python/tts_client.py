from tts_service import tts

def speak(text: str) -> bool:
    """
    Simple TTS function - easy to use from anywhere
    
    Args:
        text (str): Text to speak
    
    Returns:
        bool: True if successful
    """
    return tts.speak(text)

def stop() -> bool:
    """Stop current TTS"""
    return tts.stop()

def is_speaking() -> bool:
    """Check if currently speaking"""
    return tts.is_speaking()

# Initialize TTS when module is imported
try:
    tts.initialize()
    print("TTS Client initialized successfully")
except Exception as e:
    print(f"Failed to initialize TTS Client: {e}") 