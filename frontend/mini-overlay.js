// Mini Overlay Component for Top Right
class MiniOverlay {
    constructor() {
        this.messages = [];
        this.maxMessages = 10; // Keep only the last 10 messages for mini view
        this.container = null;
        this.ring = null;
        this.messageLog = null;
        this.isVisible = true; // Start with mini overlay visible
        this.state = 'idle'; // idle, active, processing
        
        this.init();
    }
    
    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.create());
        } else {
            this.create();
        }
    }
    
    create() {
        // Create mini overlay container
        this.container = document.createElement('div');
        this.container.className = 'mini-overlay';
        this.container.id = 'mini-overlay';
        
        // Create the small ring (similar to center visualizer but smaller)
        this.ring = document.createElement('div');
        this.ring.className = 'mini-ring';
        this.ring.innerHTML = '<canvas id="mini-ring-canvas"></canvas>';
        
        // Create mini message log
        this.messageLog = document.createElement('div');
        this.messageLog.className = 'mini-message-log';
        this.messageLog.innerHTML = `
            <div class="mini-log-header">Terminal</div>
            <div class="mini-log-content" id="mini-log-content">
                <div class="mini-message">System ready</div>
            </div>
        `;
        
        // Assemble the overlay
        this.container.appendChild(this.ring);
        this.container.appendChild(this.messageLog);
        
        // Add to document
        document.body.appendChild(this.container);
        
        // Initialize mini ring animation
        this.initMiniRing();
        
        // Add styles
        this.addStyles();
        
        console.log('Mini overlay created');
    }
    
    initMiniRing() {
        const canvas = document.getElementById('mini-ring-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let frame = 0;
        let audioContext, analyser, dataArray, bufferLength;
        let isAudioInitialized = false;
        let audioLevel = 0;

        // Set canvas size
        const resizeCanvas = () => {
            const size = 60; // Small ring size
            canvas.width = size;
            canvas.height = size;
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Microphone setup
        const initAudio = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                analyser = audioContext.createAnalyser();
                analyser.fftSize = 128;
                bufferLength = analyser.frequencyBinCount;
                dataArray = new Uint8Array(bufferLength);
                const source = audioContext.createMediaStreamSource(stream);
                source.connect(analyser);
                isAudioInitialized = true;
            } catch (e) {
                isAudioInitialized = false;
            }
        };
        initAudio();

        // Animation loop
        const animate = () => {
            frame += 0.05;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const baseRadius = 20;
            let dynamicRadius = baseRadius;

            // Get audio level
            if (isAudioInitialized && analyser) {
                analyser.getByteTimeDomainData(dataArray);
                // Calculate RMS (root mean square) for volume
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                    let v = (dataArray[i] - 128) / 128;
                    sum += v * v;
                }
                audioLevel = Math.sqrt(sum / bufferLength);
                // Animate radius based on audio level
                dynamicRadius += audioLevel * 18; // scale up for visibility
            } else {
                // fallback idle animation
                dynamicRadius += Math.sin(frame) * 2;
            }

            // Draw animated ring
            ctx.save();
            ctx.strokeStyle = this.getRingColor();
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.arc(centerX, centerY, dynamicRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();

            requestAnimationFrame(animate);
        };
        animate();
    }
    
    getRingColor() {
        switch (this.state) {
            case 'active':
                return '#00ff88'; // Green when active
            case 'processing':
                return '#ff6b00'; // Orange when processing
            case 'idle':
            default:
                return '#00aaff'; // Blue when idle
        }
    }
    
    addStyles() {
        const styles = `
            <style>
                .mini-overlay {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 1000;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    pointer-events: none;
                    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
                    transition: opacity 0.3s ease-in-out;
                }
                
                .mini-overlay.hidden {
                    opacity: 0;
                    pointer-events: none;
                }
                
                .mini-ring {
                    width: 60px;
                    height: 60px;
                    margin-bottom: 8px;
                    border-radius: 50%;
                    background: rgba(10, 10, 10, 0.8);
                    border: 1px solid rgba(0, 170, 255, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease-in-out;
                }
                
                .mini-ring.active {
                    border-color: rgba(0, 255, 136, 0.8);
                    box-shadow: 0 0 15px rgba(0, 255, 136, 0.3);
                    transform: scale(1.1);
                }
                
                .mini-ring.processing {
                    border-color: rgba(255, 107, 0, 0.8);
                    box-shadow: 0 0 15px rgba(255, 107, 0, 0.3);
                }
                
                #mini-ring-canvas {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                }
                  .mini-message-log {
                    background: rgba(10, 10, 10, 0.9);
                    border: 1px solid rgba(0, 170, 255, 0.3);
                    border-radius: 4px;
                    width: 200px; /* Reduced from 240px to make it smaller */
                    max-height: 150px; /* Was 200px */
                    font-size: 10px;
                    color: #00aaff;
                    overflow: hidden;
                    backdrop-filter: blur(10px);
                    transition: all 0.3s ease-in-out;
                }
                
                .mini-log-header {
                    padding: 6px 10px;
                    background: rgba(0, 170, 255, 0.1);
                    border-bottom: 1px solid rgba(0, 170, 255, 0.2);
                    font-weight: bold;
                    font-size: 11px;
                    text-align: center;
                }
                
                .mini-log-content {
                    padding: 6px;
                    max-height: 110px; /* Was 160px */
                    overflow-y: auto;
                    overflow-x: hidden;
                }
                
                .mini-log-content::-webkit-scrollbar {
                    width: 3px;
                }
                
                .mini-log-content::-webkit-scrollbar-track {
                    background: rgba(0, 170, 255, 0.1);
                }
                
                .mini-log-content::-webkit-scrollbar-thumb {
                    background: rgba(0, 170, 255, 0.3);
                    border-radius: 2px;
                }
                
                .mini-message {
                    margin-bottom: 4px;
                    padding: 3px 6px;
                    border-radius: 2px;
                    background: rgba(255, 255, 255, 0.02);
                    font-size: 9px;
                    line-height: 1.2;
                    word-wrap: break-word;
                    border-left: 2px solid rgba(0, 170, 255, 0.3);
                    animation: miniMessageAppear 0.2s ease-in;
                }

                @keyframes miniMessageAppear {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .mini-message.user {
                    border-left-color: #00ff88;
                    color: #ffffff;
                }
                
                .mini-message.pilot {
                    border-left-color: #ff6b00;
                    color: #ffcc99;
                }
                
                .mini-message.system {
                    border-left-color: #00aaff;
                    color: #99ddff;
                }
                
                .mini-message.error {
                    border-left-color: #ff4444;
                    color: #ffcccc;
                    background: rgba(255, 68, 68, 0.1);
                }
                
                .mini-message.active {
                    border-left-color: #ffff00;
                    color: #ffffcc;
                    background: rgba(255, 255, 0, 0.1);
                }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', styles);
    }
    
    show() {
        this.container.classList.remove('hidden');
        this.isVisible = true;
    }
    
    hide() {
        this.container.classList.add('hidden');
        this.isVisible = false;
    }
    
    toggle() {
        this.isVisible ? this.hide() : this.show();
    }
    
    setState(newState) {
        this.state = newState;
        this.updateRingVisual();
    }
    
    updateRingVisual() {
        this.ring.className = `mini-ring ${this.state}`;
    }
    
    addMessage(data) {
        const messageText = this.formatMessage(data);
        const messageClass = this.getMessageClass(data.type, data.source);
        
        // Add to messages array
        this.messages.push({
            text: messageText,
            class: messageClass,
            timestamp: Date.now()
        });
        
        // Keep only recent messages
        if (this.messages.length > this.maxMessages) {
            this.messages = this.messages.slice(-this.maxMessages);
        }
        
        // Render message
        this.renderMessage(messageText, messageClass);
        
        // Update state based on message type
        if (data.type === 'active') {
            this.setState('active');
        } else if (data.type === 'hidden') {
            this.setState('idle');
        } else if (data.type === 'message' || data.type === 'pilot_response') {
            this.setState('processing');
        }
    }
    
    formatMessage(data) {
        const time = new Date().toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });
        
        let prefix = '';
        switch (data.type) {
            case 'message':
                prefix = 'USER: ';
                break;
            case 'pilot_response':
                prefix = 'PILOT: ';
                break;
            case 'active':
                prefix = 'ACTIVE ';
                break;
            case 'hidden':
                prefix = 'DONE ';
                break;
            case 'error':
                prefix = 'ERROR ';
                break;
            default:
                prefix = 'SYS ';
        }
        
        const text = data.text || data.message || '';
        return `${time} ${prefix}${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`;
    }
    
    getMessageClass(type, source) {
        if (type === 'error') return 'error';
        if (type === 'active') return 'active';
        if (type === 'message') return 'user';
        if (type === 'pilot_response') return 'pilot';
        return 'system';
    }
    
    renderMessage(messageText, messageClass) {
        const content = document.getElementById('mini-log-content');
        if (!content) return;
        
        const messageEl = document.createElement('div');
        messageEl.className = `mini-message ${messageClass}`;
        messageEl.textContent = messageText;
        
        content.appendChild(messageEl);
        this.scrollToBottom();
    }
    
    scrollToBottom() {
        const content = document.getElementById('mini-log-content');
        if (content) {
            content.scrollTop = content.scrollHeight;
        }
    }
    
    clear() {
        this.messages = [];
        const content = document.getElementById('mini-log-content');
        if (content) {
            content.innerHTML = '<div class="mini-message">Log cleared</div>';
        }
    }
}

// Initialize when the script loads
window.miniOverlay = new MiniOverlay();
