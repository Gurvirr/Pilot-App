// Message Log Display for Bottom Right Window
class MessageLogger {
    constructor() {
        this.messages = [];
        this.maxMessages = 50; // Keep only the last 50 messages
        this.container = null;
        this.isInitialized = false;
        
        this.init();
    }
    
    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupContainer());
        } else {
            this.setupContainer();
        }
    }
    
    setupContainer() {
        // Find the bottom-right canvas and replace it with our message log
        const bottomRightBox = document.querySelector('.corner-box.bottom-right');
        if (!bottomRightBox) {
            console.error('Bottom right corner box not found');
            return;
        }
        
        // Remove the existing canvas
        const existingCanvas = bottomRightBox.querySelector('#canvas-br');
        if (existingCanvas) {
            existingCanvas.remove();
        }
        
        // Create message log container
        this.container = document.createElement('div');
        this.container.className = 'message-log';
        this.container.innerHTML = `
            <div class="message-log-header">
                <span class="log-title">📡 Pilot Terminal</span>
                <span class="log-count">0</span>
            </div>
            <div class="message-log-content" id="message-log-content">
                <div class="message-item system">
                    <span class="message-time">${this.formatTime(new Date())}</span>
                    <span class="message-source">SYSTEM</span>
                    <span class="message-text">Message log initialized</span>
                </div>
            </div>
        `;
        
        bottomRightBox.appendChild(this.container);
        this.isInitialized = true;
        
        // Add styles
        this.addStyles();
        
        console.log('Message logger initialized');
    }
    
    addStyles() {
        const styles = `
            <style>
                .message-log {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
                    font-size: 10px;
                    color: #00aaff;
                    overflow: hidden;
                }
                
                .message-log-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 12px;
                    background-color: rgba(0, 170, 255, 0.1);
                    border-bottom: 1px solid rgba(0, 170, 255, 0.3);
                    font-weight: bold;
                    font-size: 11px;
                }
                
                .log-title {
                    color: #00aaff;
                }
                
                .log-count {
                    background-color: rgba(0, 170, 255, 0.2);
                    padding: 2px 6px;
                    border-radius: 10px;
                    font-size: 9px;
                }
                
                .message-log-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 4px;
                    scroll-behavior: smooth;
                }
                
                .message-log-content::-webkit-scrollbar {
                    width: 4px;
                }
                
                .message-log-content::-webkit-scrollbar-track {
                    background: rgba(0, 170, 255, 0.1);
                }
                
                .message-log-content::-webkit-scrollbar-thumb {
                    background: rgba(0, 170, 255, 0.3);
                    border-radius: 2px;
                }
                
                .message-item {
                    display: flex;
                    flex-direction: column;
                    margin-bottom: 6px;
                    padding: 4px 6px;
                    border-radius: 3px;
                    background-color: rgba(255, 255, 255, 0.02);
                    border-left: 2px solid;
                    font-size: 9px;
                    line-height: 1.3;
                    word-wrap: break-word;
                    animation: messageAppear 0.3s ease-in;
                }
                
                @keyframes messageAppear {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .message-item.user {
                    border-left-color: #00ff88;
                }
                
                .message-item.pilot {
                    border-left-color: #ff6b00;
                }
                
                .message-item.system {
                    border-left-color: #00aaff;
                }
                
                .message-item.error {
                    border-left-color: #ff4444;
                    background-color: rgba(255, 68, 68, 0.1);
                }
                
                .message-item.active {
                    border-left-color: #ffff00;
                    background-color: rgba(255, 255, 0, 0.1);
                }
                
                .message-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2px;
                }
                
                .message-time {
                    color: rgba(255, 255, 255, 0.5);
                    font-size: 8px;
                }
                
                .message-source {
                    font-weight: bold;
                    font-size: 8px;
                    padding: 1px 4px;
                    border-radius: 2px;
                    background-color: rgba(0, 170, 255, 0.2);
                }
                
                .message-source.user { background-color: rgba(0, 255, 136, 0.2); }
                .message-source.pilot { background-color: rgba(255, 107, 0, 0.2); }
                .message-source.system { background-color: rgba(0, 170, 255, 0.2); }
                .message-source.error { background-color: rgba(255, 68, 68, 0.2); }
                
                .message-text {
                    color: #ffffff;
                    margin-top: 2px;
                    word-break: break-word;
                }
                
                .message-intent {
                    font-size: 8px;
                    color: rgba(255, 255, 255, 0.6);
                    font-style: italic;
                    margin-top: 1px;
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }
    
    addMessage(data) {
        if (!this.isInitialized) {
            console.warn('Message logger not initialized yet');
            return;
        }
        
        const message = {
            id: Date.now() + Math.random(),
            timestamp: data.timestamp || Date.now() / 1000,
            type: data.type || 'info',
            text: data.text || '',
            source: data.source || this.getSourceFromType(data.type),
            intent: data.intent || null,
            ...data
        };
        
        this.messages.push(message);
        
        // Keep only the last maxMessages
        if (this.messages.length > this.maxMessages) {
            this.messages = this.messages.slice(-this.maxMessages);
        }
        
        this.renderMessage(message);
        this.updateCount();
        this.scrollToBottom();
    }
    
    getSourceFromType(type) {
        const typeMap = {
            'message': 'USER',
            'pilot_response': 'PILOT',
            'action_start': 'SYSTEM',
            'action_result': 'SYSTEM',
            'active': 'PILOT',
            'hidden': 'SYSTEM',
            'error': 'ERROR',
            'connected': 'SYSTEM'
        };
        
        return typeMap[type] || 'UNKNOWN';
    }
    
    getMessageClass(type, source) {
        if (type === 'error') return 'error';
        if (type === 'active') return 'active';
        if (source === 'user' || source === 'USER') return 'user';
        if (source === 'pilot' || source === 'PILOT') return 'pilot';
        return 'system';
    }
    
    renderMessage(message) {
        const content = document.getElementById('message-log-content');
        if (!content) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = `message-item ${this.getMessageClass(message.type, message.source)}`;
        
        messageElement.innerHTML = `
            <div class="message-header">
                <span class="message-time">${this.formatTime(new Date(message.timestamp * 1000))}</span>
                <span class="message-source ${message.source.toLowerCase()}">${message.source}</span>
            </div>
            <div class="message-text">${this.escapeHtml(message.text)}</div>
            ${message.intent ? `<div class="message-intent">Intent: ${message.intent}</div>` : ''}
        `;
        
        content.appendChild(messageElement);
    }
    
    updateCount() {
        const countElement = document.querySelector('.log-count');
        if (countElement) {
            countElement.textContent = this.messages.length;
        }
    }
    
    scrollToBottom() {
        const content = document.getElementById('message-log-content');
        if (content) {
            content.scrollTop = content.scrollHeight;
        }
    }
    
    formatTime(date) {
        return date.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    clear() {
        this.messages = [];
        const content = document.getElementById('message-log-content');
        if (content) {
            content.innerHTML = `
                <div class="message-item system">
                    <span class="message-time">${this.formatTime(new Date())}</span>
                    <span class="message-source">SYSTEM</span>
                    <span class="message-text">Message log cleared</span>
                </div>
            `;
        }
        this.updateCount();
    }
}

// Create global message logger instance
let messageLogger = null;

// Initialize when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        messageLogger = new MessageLogger();
        window.messageLogger = messageLogger; // Make it globally accessible
    }, 500);
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MessageLogger;
}
