class SystemInfoDisplay {
    constructor() {
        this.container = document.querySelector('.top-left');
        this.init();
    }

    init() {
        // Clear the container and create system info display
        this.container.innerHTML = '';
        
        // Create system info elements
        this.createSystemInfoElements();
        
        // Listen for system info updates
        const { ipcRenderer } = require('electron');
        ipcRenderer.on('system-info-update', (event, data) => {
            this.updateDisplay(data);
        });
    }

    createSystemInfoElements() {
        // Create container for system info
        const infoContainer = document.createElement('div');
        infoContainer.className = 'system-info-container';
        infoContainer.style.cssText = `
            padding: 20px;
            color: #00aaff;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
            font-size: 14px;
            line-height: 1.6;
            background: transparent;
        `;

        // Create info elements
        this.cpuElement = document.createElement('div');
        this.cpuElement.innerHTML = 'CPU: <span id="cpu-usage">--</span>%';
        
        this.memoryElement = document.createElement('div');
        this.memoryElement.innerHTML = 'Memory: <span id="memory-usage">--</span>';

        this.networkElement = document.createElement('div');
        this.networkElement.innerHTML = 'Network: <span id="network-usage">--</span>';

        // Add elements to container
        infoContainer.appendChild(this.cpuElement);
        infoContainer.appendChild(this.memoryElement);
        infoContainer.appendChild(this.networkElement);

        // Add to the corner box
        this.container.appendChild(infoContainer);
    }

    updateDisplay(data) {
        // Update CPU
        const cpuSpan = document.getElementById('cpu-usage');
        if (cpuSpan) {
            cpuSpan.textContent = data.cpu;
            // Color coding based on usage
            if (data.cpu > 80) {
                cpuSpan.style.color = '#ff4444';
            } else if (data.cpu > 60) {
                cpuSpan.style.color = '#ffaa00';
            } else {
                cpuSpan.style.color = '#00aaff';
            }
        }

        // Update Memory
        const memorySpan = document.getElementById('memory-usage');
        if (memorySpan) {
            memorySpan.textContent = `${data.memory.used}GB/${data.memory.total}GB (${data.memory.percentage}%)`;
            // Color coding based on usage
            if (data.memory.percentage > 80) {
                memorySpan.style.color = '#ff4444';
            } else if (data.memory.percentage > 60) {
                memorySpan.style.color = '#ffaa00';
            } else {
                memorySpan.style.color = '#00aaff';
            }
        }

        // Update Network
        const networkSpan = document.getElementById('network-usage');
        if (networkSpan) {
            const rx = data.network.rx.toFixed(2);
            const tx = data.network.tx.toFixed(2);
            networkSpan.textContent = `↓${rx}MB/s ↑${tx}MB/s`;
            networkSpan.style.color = '#00aaff';
        }
    }
}

// Initialize when page loads
window.addEventListener('DOMContentLoaded', () => {
    window.systemInfoDisplay = new SystemInfoDisplay();
}); 