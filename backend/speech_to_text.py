import sys
import queue
import sounddevice as sd
import vosk
import json


def speech_to_text_loop():
    q = queue.Queue()


    def callback(indata, frames, time, status):
        if status:
            print(status, file=sys.stderr)
        q.put(bytes(indata))

    """Main loop for speech-to-text processing. Returns recognized text after 'jarvis' trigger."""
    model = vosk.Model("model")
    samplerate = 16000
    trigger_word = "jarvis"

    with sd.RawInputStream(samplerate=samplerate, blocksize=512, dtype='int16',
                            channels=1, callback=callback):
        rec = vosk.KaldiRecognizer(model, samplerate)
        print("Start speaking... say 'jarvis' to activate")

        while True:
            data = q.get()
            if rec.AcceptWaveform(data):
                result = rec.Result()
                text = json.loads(result).get("text", "")
                print(f"Recognized: {text}") # this needs to have the socket connection
                
                if trigger_word in text.lower():
                    # Find position of trigger word and output from there
                    start_index = text.lower().index(trigger_word)
                    command = text[start_index:]
                    
                    # We only want to return if there's a command after "jarvis"
                    if len(command.strip()) > len(trigger_word):
                        return command
            else:
                # You can handle partial results here if you want (optional)
                pass
        