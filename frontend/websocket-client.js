// WebSocket client for Jarvis events
class JarvisWebSocket {
    constructor(url = 'http://localhost:5000') {
        // Singleton pattern - prevent multiple instances
        if (JarvisWebSocket.instance) {
            console.log('⚠️ JarvisWebSocket instance already exists, returning existing instance');
            return JarvisWebSocket.instance;
        }
        
        this.url = url;
        this.socket = null;
        this.isConnected = false;
        this.retryCount = 0;
        this.maxRetries = 5;
        this.retryDelay = 2000;
        
        // State management
        this.currentState = 'idle'; // idle, active, processing, hidden
        this.lastMessage = '';
        
        // Visual elements that will react to state changes
        this.visualElements = {
            hologram: document.querySelector('.hologram-container'),
            centerVisualizer: document.querySelector('.center-visualizer'),
            cornerBoxes: document.querySelectorAll('.corner-box')
        };
        
        // Store instance
        JarvisWebSocket.instance = this;
        
        this.connect();
    }
    
    connect() {
        try {
            // Load Socket.IO from CDN if not already loaded
            if (typeof io === 'undefined') {
                this.loadSocketIO().then(() => {
                    this.initializeConnection();
                });
            } else {
                this.initializeConnection();
            }
        } catch (error) {
            console.error('Failed to connect to WebSocket:', error);
            this.scheduleReconnect();
        }
    }
    
    loadSocketIO() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.socket.io/4.7.4/socket.io.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    initializeConnection() {
        this.socket = io(this.url);
        
        // Expose socket globally to prevent duplicate connections
        window.socket = this.socket;
        
        this.socket.on('connect', () => {
            console.log('Connected to Jarvis WebSocket');
            this.isConnected = true;
            this.retryCount = 0;
            this.updateState('idle');
            
            // Add connection message to logger
            if (window.messageLogger) {
                window.messageLogger.addMessage({
                    type: 'connected',
                    text: 'Connected to Jarvis WebSocket Server',
                    timestamp: Date.now() / 1000,
                    source: 'SYSTEM'
                });
            }
        });
        
        this.socket.on('disconnect', () => {
            console.log('Disconnected from Jarvis WebSocket');
            this.isConnected = false;
            this.scheduleReconnect();
            
            // Add disconnection message to logger
            if (window.messageLogger) {
                window.messageLogger.addMessage({
                    type: 'error',
                    text: 'Disconnected from Jarvis WebSocket Server',
                    timestamp: Date.now() / 1000,
                    source: 'SYSTEM'
                });
            }
        });
        
        this.socket.on('jarvis_event', (data) => {
            this.handleJarvisEvent(data);
        });
        
        this.socket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error);
            this.scheduleReconnect();
        });
    }    handleJarvisEvent(data) {
        console.log('Jarvis event received:', data);
        
        // Broadcast message to appropriate view using view manager
        if (window.viewManager) {
            window.viewManager.broadcastMessage(data);
        }
        // Note: Removed fallback to prevent duplicate messages
        // View manager should always be available after initialization
        
        switch (data.type) {
            case 'active':
                this.updateState('active');
                this.activateVisuals();
                break;
                
            case 'message':
                this.updateState('processing');
                this.lastMessage = data.text || '';
                this.showMessage(this.lastMessage);
                break;
                
            case 'jarvis_response':
                this.showMessage(data.text, 'jarvis');
                break;
                
            case 'action_start':
                this.updateState('processing');
                break;
                
            case 'action_result':
                this.showMessage(data.text, 'system');
                break;
                
            case 'hidden':
                this.updateState('hidden');
                this.hideVisuals();
                // Return to idle after a brief delay
                setTimeout(() => {
                    this.updateState('idle');
                }, 1000);
                break;
                
            case 'error':
                this.showMessage(data.text, 'error');
                break;
                
            case 'connected':
                console.log('WebSocket connection confirmed:', data.message);
                break;
        }
    }
    
    updateState(newState) {
        if (this.currentState !== newState) {
            console.log(`State changed: ${this.currentState} -> ${newState}`);
            this.currentState = newState;
            this.updateVisualState();
        }
    }
    
    updateVisualState() {
        // Update visual elements based on current state
        const { hologram, centerVisualizer, cornerBoxes } = this.visualElements;
        
        // Remove all state classes
        document.body.classList.remove('jarvis-idle', 'jarvis-active', 'jarvis-processing', 'jarvis-hidden');
        
        // Add current state class
        document.body.classList.add(`jarvis-${this.currentState}`);
        
        switch (this.currentState) {
            case 'active':
                if (centerVisualizer) centerVisualizer.style.opacity = '1';
                if (hologram) hologram.style.opacity = '1';
                break;
                
            case 'processing':
                if (centerVisualizer) {
                    centerVisualizer.style.opacity = '1';
                    centerVisualizer.style.transform = 'scale(1.1)';
                }
                break;
                
            case 'hidden':
                if (centerVisualizer) {
                    centerVisualizer.style.opacity = '0.3';
                    centerVisualizer.style.transform = 'scale(0.8)';
                }
                if (hologram) hologram.style.opacity = '0.5';
                break;
                
            case 'idle':
            default:
                if (centerVisualizer) {
                    centerVisualizer.style.opacity = '0.7';
                    centerVisualizer.style.transform = 'scale(1)';
                }
                if (hologram) hologram.style.opacity = '0.8';
                break;
        }
    }
    
    activateVisuals() {
        // Trigger activation animations
        const { centerVisualizer } = this.visualElements;
        if (centerVisualizer) {
            centerVisualizer.style.animation = 'pulse 0.5s ease-in-out';
            setTimeout(() => {
                centerVisualizer.style.animation = '';
            }, 500);
        }
    }
      showMessage(message, type = 'user') {
        // Display the recognized message (could be used for debugging or UI feedback)
        console.log(`Jarvis ${type}:`, message);
        
        // You could add a message display element here if desired
        // For now, we'll just update the title temporarily
        const originalTitle = document.title;
        let titlePrefix = '';
        
        switch (type) {
            case 'jarvis':
                titlePrefix = 'Jarvis: ';
                break;
            case 'system':
                titlePrefix = 'System: ';
                break;
            case 'error':
                titlePrefix = 'Error: ';
                break;
            default:
                titlePrefix = 'User: ';
        }
        
        document.title = `${titlePrefix}${message}`;
        setTimeout(() => {
            document.title = originalTitle;
        }, 3000);
    }
    
    hideVisuals() {
        // Trigger hide animations
        console.log('Jarvis action completed');
    }
    
    scheduleReconnect() {
        if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            console.log(`Scheduling reconnect attempt ${this.retryCount}/${this.maxRetries} in ${this.retryDelay}ms`);
            setTimeout(() => {
                this.connect();
            }, this.retryDelay);
            
            // Exponential backoff
            this.retryDelay = Math.min(this.retryDelay * 1.5, 10000);
        } else {
            console.error('Max reconnection attempts reached. Please refresh the page.');
        }
    }
    
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.isConnected = false;
    }
}

// Add CSS for state transitions and animations
const stateStyles = `
    <style>
        .center-visualizer {
            transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out !important;
        }
        
        .hologram-container {
            transition: opacity 0.3s ease-in-out !important;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
        }
        
        .jarvis-active .corner-box {
            border-color: rgba(0, 255, 0, 0.8) !important;
            box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
        }
        
        .jarvis-processing .corner-box {
            border-color: rgba(255, 165, 0, 0.8) !important;
            box-shadow: 0 0 10px rgba(255, 165, 0, 0.3);
        }
        
        .jarvis-hidden .corner-box {
            border-color: rgba(255, 255, 255, 0.3) !important;
            box-shadow: none;
        }
    </style>
`;

// Inject styles
document.head.insertAdjacentHTML('beforeend', stateStyles);

// Initialize WebSocket connection when DOM is ready
let jarvisWS = null;

window.addEventListener('DOMContentLoaded', () => {
    // Prevent multiple instances
    if (jarvisWS) {
        console.log('⚠️ WebSocket already initialized, skipping...');
        return;
    }
    
    // Wait a bit for other scripts to load, especially message logger
    setTimeout(() => {
        jarvisWS = new JarvisWebSocket();
        
        // Make it globally accessible for debugging
        window.jarvisWS = jarvisWS;
        
        // Add initial connection message to logger
        if (window.messageLogger) {
            window.messageLogger.addMessage({
                type: 'system',
                text: 'Attempting to connect to Jarvis WebSocket...',
                timestamp: Date.now() / 1000,
                source: 'SYSTEM'
            });
        }
    }, 1500); // Increased delay to ensure message logger is ready
    
    // Listen for view toggle events from Electron
    if (window.require) {
        const { ipcRenderer } = window.require('electron');
        
        ipcRenderer.on('toggle-view-mode', () => {
            console.log('🔄 Received view toggle event from Electron');
            if (window.viewManager) {
                window.viewManager.toggle();
            } else {
                console.warn('View manager not available');
            }
        });
    }
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (jarvisWS) {
        jarvisWS.disconnect();
    }
});
