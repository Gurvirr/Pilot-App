import torch
import numpy as np
import sounddevice as sd
from faster_whisper import WhisperModel
import queue

def speech_to_text_loop():
    """
    Real-time speech to text loop using faster-whisper and Silero VAD.
    """
    # --- Configuration ---
    MODEL_SIZE = "tiny.en"  # or "small.en", "base.en", "medium.en", "large-v2", etc.
    DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
    COMPUTE_TYPE = "float16" if torch.cuda.is_available() else "int8"
    SAMPLERATE = 16000
    CHANNELS = 1
    BLOCKSIZE = 512
    DTYPE = 'int16'
    TRIGGER_WORD = "pilot"
    VAD_MIN_SILENCE_DURATION_MS = 500 # ms of silence to mark end of speech
    VAD_THRESHOLD = 0.5 # VAD confidence threshold
    
    # --- Model Loading ---
    print("Loading models...")
    whisper_model = WhisperModel(MODEL_SIZE, device=DEVICE, compute_type=COMPUTE_TYPE)
    
    try:
        vad_model, utils = torch.hub.load(repo_or_dir='snakers4/silero-vad',
                                          model='silero_vad',
                                          force_reload=False)
        VADIterator = utils[3]
    except Exception as e:
        print(f"Error loading Silero VAD model: {e}")
        print("Please ensure you have a working internet connection for the first run.")
        return

    print("Models loaded.")

    # --- Audio Input Stream ---
    audio_queue = queue.Queue()

    def callback(indata, frames, time, status):
        if status:
            print(status)
        audio_queue.put(bytes(indata))

    stream = sd.RawInputStream(
        samplerate=SAMPLERATE,
        blocksize=BLOCKSIZE,
        dtype=DTYPE,
        channels=CHANNELS,
        callback=callback
    )

    vad_iterator = VADIterator(vad_model, threshold=VAD_THRESHOLD, min_silence_duration_ms=VAD_MIN_SILENCE_DURATION_MS)

    # --- Processing Loop ---
    with stream:
        print(f"Start speaking... say '{TRIGGER_WORD}' to activate")
        
        while True:
            speech_chunks = []
            is_speaking = False
            
            print("Listening for speech...")
            while True: # Inner loop for speech detection
                audio_chunk_bytes = audio_queue.get()
                audio_chunk_int16 = np.frombuffer(audio_chunk_bytes, dtype=np.int16)
                audio_chunk_float32 = audio_chunk_int16.astype(np.float32) / 32768.0

                speech_dict = vad_iterator(audio_chunk_float32, return_seconds=True)

                if speech_dict:
                    if "start" in speech_dict:
                        if not is_speaking:
                            print("Speech started...")
                            is_speaking = True
                        speech_chunks.append(audio_chunk_float32)

                    if "end" in speech_dict and is_speaking:
                        print("Speech ended. Transcribing...")
                        is_speaking = False
                        
                        full_speech = np.concatenate(speech_chunks)
                        speech_chunks = []

                        segments, info = whisper_model.transcribe(
                            full_speech,
                            language="en",
                            beam_size=5, # 1 for fastest
                            condition_on_previous_text=True
                        )
                        
                        text = "".join(segment.text for segment in segments)
                        
                        print(f"Recognized: {text}")

                        if TRIGGER_WORD in text.lower():
                            start_index = text.lower().find(TRIGGER_WORD)
                            command = text[start_index:]
                            
                            if len(command.strip()) > len(TRIGGER_WORD):
                                vad_iterator.reset_states()
                                print(f"Command found: {command}")
                                return command
                        
                        vad_iterator.reset_states()
                        print("Listening for speech again...")
                        break # break inner loop to reset and listen again
                else:
                    # Keep collecting if speech started but not ended
                    if is_speaking:
                        speech_chunks.append(audio_chunk_float32)

# For testing if run directly
if __name__ == '__main__':
    command = speech_to_text_loop()
    print(f"Returned command: {command}")
        