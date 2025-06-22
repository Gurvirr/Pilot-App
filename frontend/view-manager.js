// View Manager for handling overlay states
class ViewManager {
    constructor() {
        this.currentView = 'full'; // Start in full view by default
        this.isInitialized = false;
        
        this.init();
    }
    
    init() {
        // Wait for all components to be loaded
        setTimeout(() => {
            this.isInitialized = true;
            this.setupInitialState();
            console.log('View manager initialized');
        }, 2000);
    }
      setupInitialState() {
        // Start with full view
        this.showFullView();
        
        // Add initial class to body
        document.body.classList.add('full-view');
        
        console.log('Initial state: full view active');
    }
    
    toggle() {
        if (!this.isInitialized) {
            console.warn('View manager not initialized yet');
            return;
        }
        
        if (this.currentView === 'mini') {
            this.showFullView();
        } else {
            this.showMiniView();
        }
        
        console.log(`Switched to ${this.currentView} view`);
    }
    
    showMiniView() {
        this.currentView = 'mini';
        
        // Show mini overlay
        if (window.miniOverlay) {
            window.miniOverlay.show();
        }
        
        // Hide full overlay elements
        this.hideFullView();
        
        // Update body class for styling
        document.body.classList.remove('full-view');
        document.body.classList.add('mini-view');
    }
    
    showFullView() {
        this.currentView = 'full';
        
        // Hide mini overlay
        if (window.miniOverlay) {
            window.miniOverlay.hide();
        }
        
        // Show full overlay elements
        this.showFullViewElements();
        
        // Update body class for styling
        document.body.classList.remove('mini-view');
        document.body.classList.add('full-view');

        // Dispatch a resize event to ensure all canvases redraw correctly
        window.dispatchEvent(new Event('resize'));
    }
    
    hideFullView() {
        // Hide the main overlay container elements
        const overlayContainer = document.querySelector('.overlay-container');
        if (overlayContainer) {
            overlayContainer.style.display = 'none';
        }
    }
    
    showFullViewElements() {
        // Show the main overlay container elements
        const overlayContainer = document.querySelector('.overlay-container');
        if (overlayContainer) {
            overlayContainer.style.display = 'block';
        }
    }
    
    // Method to send messages to both views
    broadcastMessage(data) {
        // Send to mini overlay
        if (window.miniOverlay && this.currentView === 'mini') {
            window.miniOverlay.addMessage(data);
        }
        
        // Send to full message logger
        if (window.messageLogger && this.currentView === 'full') {
            window.messageLogger.addMessage(data);
        }
        
        // Always send to both so they stay in sync
        if (window.miniOverlay) {
            window.miniOverlay.addMessage(data);
        }
        if (window.messageLogger) {
            window.messageLogger.addMessage(data);
        }
    }
    
    getCurrentView() {
        return this.currentView;
    }
    
    isMiniView() {
        return this.currentView === 'mini';
    }
    
    isFullView() {
        return this.currentView === 'full';
    }
}

// Global view manager instance
let viewManager = null;

// Initialize when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        viewManager = new ViewManager();
        window.viewManager = viewManager; // Make it globally accessible
    }, 1000);
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ViewManager;
}
