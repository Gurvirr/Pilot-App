const { ipcRenderer } = require('electron');

let ttsPanelVisible = false;

// Initialize TTS controls
async function initializeTTS() {
    try {
        setupEventListeners();
        console.log('ElevenLabs TTS controls initialized');
    } catch (error) {
        console.error('Error initializing TTS controls:', error);
    }
}

// Set up event listeners
function setupEventListeners() {
    // Stability slider
    const stabilitySlider = document.getElementById('tts-stability');
    const stabilityValue = document.getElementById('stability-value');
    
    stabilitySlider.addEventListener('input', (e) => {
        const stability = parseFloat(e.target.value);
        stabilityValue.textContent = stability.toFixed(1);
        updateVoiceSettings();
    });
    
    // Similarity slider
    const similaritySlider = document.getElementById('tts-similarity');
    const similarityValue = document.getElementById('similarity-value');
    
    similaritySlider.addEventListener('input', (e) => {
        const similarity = parseFloat(e.target.value);
        similarityValue.textContent = similarity.toFixed(1);
        updateVoiceSettings();
    });
    
    // Style slider
    const styleSlider = document.getElementById('tts-style');
    const styleValue = document.getElementById('style-value');
    
    styleSlider.addEventListener('input', (e) => {
        const style = parseFloat(e.target.value);
        styleValue.textContent = style.toFixed(1);
        updateVoiceSettings();
    });
}

// Update voice settings
function updateVoiceSettings() {
    const stability = parseFloat(document.getElementById('tts-stability').value);
    const similarity = parseFloat(document.getElementById('tts-similarity').value);
    const style = parseFloat(document.getElementById('tts-style').value);
    
    const settings = {
        stability: stability,
        similarity_boost: similarity,
        style: style,
        use_speaker_boost: true
    };
    
    ipcRenderer.invoke('tts-set-voice-settings', settings);
}

// Toggle TTS panel visibility
function toggleTTSPanel() {
    const panel = document.getElementById('tts-panel');
    ttsPanelVisible = !ttsPanelVisible;
    
    if (ttsPanelVisible) {
        panel.classList.add('visible');
        setTimeout(() => {
            document.getElementById('tts-text').focus();
        }, 100);
    } else {
        panel.classList.remove('visible');
    }
}

// Speak text
async function speakText() {
    const text = document.getElementById('tts-text').value.trim();
    if (!text) {
        updateStatus('Please enter text to speak', 'error');
        return;
    }
    
    updateStatus('Generating speech...', 'speaking');
    
    try {
        const result = await ipcRenderer.invoke('tts-speak', text);
        
        if (result.success) {
            updateStatus('Finished speaking', 'success');
        } else {
            updateStatus(`Error: ${result.error}`, 'error');
        }
    } catch (error) {
        updateStatus(`Error: ${error.message}`, 'error');
    }
}

// Stop speaking
async function stopSpeaking() {
    try {
        await ipcRenderer.invoke('tts-stop');
        updateStatus('Stopped speaking', 'stopped');
    } catch (error) {
        updateStatus(`Error stopping: ${error.message}`, 'error');
    }
}

// Update status indicator
function updateStatus(message, type) {
    const statusText = document.getElementById('status-text');
    const statusIndicator = document.getElementById('status-indicator');
    
    statusText.textContent = message;
    statusIndicator.className = `status-indicator ${type}`;
}

// Check speaking status periodically
setInterval(async () => {
    const isSpeaking = await ipcRenderer.invoke('tts-get-status');
    const speakBtn = document.getElementById('speak-btn');
    const stopBtn = document.getElementById('stop-btn');
    
    if (isSpeaking) {
        speakBtn.disabled = true;
        stopBtn.disabled = false;
    } else {
        speakBtn.disabled = false;
        stopBtn.disabled = true;
    }
}, 100);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeTTS); 