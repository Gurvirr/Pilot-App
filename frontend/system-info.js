class SystemInfoDisplay {
    constructor() {
        this.container = document.querySelector('.top-left');
        this.maxDataPoints = 50; // Number of points to show in graph
        
        // Initialize data arrays with zeros for a flat line start
        this.cpuData = new Array(this.maxDataPoints).fill(0);
        this.memoryData = new Array(this.maxDataPoints).fill(0);
        this.networkData = new Array(this.maxDataPoints).fill(0);
        
        this.init();
    }

    init() {
        // Clear the container and create system info display
        this.container.innerHTML = '';
        
        // Create system info elements with graphs
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
            width: 100%;
            height: 60%; /* Adjusted height for three rows */
            padding: 10px;
            color: #00aaff;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
            font-size: 12px;
            background: transparent;
            display: flex;
            flex-direction: column;
            justify-content: space-between; /* Distribute space between items */
        `;

        // --- Network Graph Container (Top) ---
        const networkContainer = document.createElement('div');
        networkContainer.style.cssText = `
            width: 80%; /* 20% less length */
            height: 32%; /* Approx 1/3 of the height */
            position: relative;
        `;
        
        const networkLabel = document.createElement('div');
        networkLabel.id = 'network-label';
        networkLabel.textContent = 'Network: --MB/s';
        networkLabel.style.cssText = `
            position: absolute;
            top: 5px;
            left: 5px;
            z-index: 10;
            color: #00aaff;
            font-size: 11px;
        `;
        
        const networkCanvas = document.createElement('canvas');
        networkCanvas.id = 'network-graph';
        networkCanvas.style.cssText = `
            width: 100%;
            height: 100%;
            border-radius: 4px;
        `;
        
        networkContainer.appendChild(networkLabel);
        networkContainer.appendChild(networkCanvas);

        // --- CPU Graph Container (Middle) ---
        const cpuContainer = document.createElement('div');
        cpuContainer.style.cssText = `
            width: 60%; /* 40% less length */
            height: 32%; /* Approx 1/3 of the height */
            position: relative;
        `;
        
        const cpuLabel = document.createElement('div');
        cpuLabel.id = 'cpu-label';
        cpuLabel.textContent = 'CPU: --%';
        cpuLabel.style.cssText = `
            position: absolute;
            top: 5px;
            left: 5px;
            z-index: 10;
            color: #ff4444;
            font-size: 11px;
        `;
        
        const cpuCanvas = document.createElement('canvas');
        cpuCanvas.id = 'cpu-graph';
        cpuCanvas.style.cssText = `
            width: 100%;
            height: 100%;
            border-radius: 4px;
        `;
        
        cpuContainer.appendChild(cpuLabel);
        cpuContainer.appendChild(cpuCanvas);

        // --- Memory Graph Container (Bottom) ---
        const memoryContainer = document.createElement('div');
        memoryContainer.style.cssText = `
            width: 50%; /* 50% less length */
            height: 32%; /* Approx 1/3 of the height */
            position: relative;
        `;
        
        const memoryLabel = document.createElement('div');
        memoryLabel.id = 'memory-label';
        memoryLabel.textContent = 'Memory: --%';
        memoryLabel.style.cssText = `
            position: absolute;
            top: 5px;
            left: 5px;
            z-index: 10;
            color: #00ff00;
            font-size: 11px;
        `;
        
        const memoryCanvas = document.createElement('canvas');
        memoryCanvas.id = 'memory-graph';
        memoryCanvas.style.cssText = `
            width: 100%;
            height: 100%;
            border-radius: 4px;
        `;
        
        memoryContainer.appendChild(memoryLabel);
        memoryContainer.appendChild(memoryCanvas);

        // Add all elements in the new order
        infoContainer.appendChild(networkContainer);
        infoContainer.appendChild(cpuContainer);
        infoContainer.appendChild(memoryContainer);
        this.container.appendChild(infoContainer);

        // Initialize canvases
        this.initCanvases();
    }

    initCanvases() {
        // Initialize CPU canvas
        this.cpuCanvas = document.getElementById('cpu-graph');
        this.cpuCtx = this.cpuCanvas.getContext('2d');
        this.resizeCanvas(this.cpuCanvas);

        // Initialize Memory canvas
        this.memoryCanvas = document.getElementById('memory-graph');
        this.memoryCtx = this.memoryCanvas.getContext('2d');
        this.resizeCanvas(this.memoryCanvas);

        // Initialize Network canvas
        this.networkCanvas = document.getElementById('network-graph');
        this.networkCtx = this.networkCanvas.getContext('2d');
        this.resizeCanvas(this.networkCanvas);

        // Start animation loop
        this.animate();
    }

    resizeCanvas(canvas) {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
    }

    drawLineGraph(ctx, data, color, maxValue = 100) {
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        if (data.length < 2) return;
        
        // Draw line only (no fill)
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Fix: Use maxDataPoints for consistent scaling
        const stepX = width / (this.maxDataPoints - 1);
        
        data.forEach((value, index) => {
            // Consistent x position
            const x = index * stepX;
            const y = height - (value / maxValue) * height;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        // Add glow effect
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    updateDisplay(data) {
        // Remove the oldest data point
        this.cpuData.shift();
        this.memoryData.shift();
        this.networkData.shift();

        // Add the new data point
        this.cpuData.push(data.cpu);
        this.memoryData.push(data.memory.percentage);
        this.networkData.push(data.network.rx + data.network.tx); // Combined network usage

        // Update labels with current values
        const cpuLabel = document.getElementById('cpu-label');
        if (cpuLabel) {
            cpuLabel.textContent = `CPU: ${data.cpu}%`;
            // Keep CPU label red
            cpuLabel.style.color = '#ff4444';
        }

        const memoryLabel = document.getElementById('memory-label');
        if (memoryLabel) {
            memoryLabel.textContent = `Memory: ${data.memory.percentage}%`;
            // Keep Memory label green
            memoryLabel.style.color = '#00ff00';
        }

        const networkLabel = document.getElementById('network-label');
        if (networkLabel) {
            const totalNetwork = (data.network.rx + data.network.tx).toFixed(2);
            networkLabel.textContent = `Network: ${totalNetwork}MB/s`;
            networkLabel.style.color = '#00aaff';
        }
    }

    animate() {
        // Draw CPU graph with red color
        this.drawLineGraph(this.cpuCtx, this.cpuData, '#ff4444', 100);
        
        // Draw Memory graph with green color
        this.drawLineGraph(this.memoryCtx, this.memoryData, '#00ff00', 100);
        
        // Draw Network graph with blue color
        const maxNetwork = Math.max(...this.networkData, 1);
        this.drawLineGraph(this.networkCtx, this.networkData, '#00aaff', maxNetwork);
        
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize when page loads
window.addEventListener('DOMContentLoaded', () => {
    window.systemInfoDisplay = new SystemInfoDisplay();
}); 