const os = require('os');
const si = require('systeminformation');

class SystemMonitor {
    constructor() {
        this.cpuUsage = 0;
        this.memoryUsage = 0;
        this.networkUsage = { rx: 0, tx: 0 };
        this.lastNetworkStats = null;
        this.updateInterval = null;
    }

    async getSystemInfo() {
        try {
            // Get CPU usage using systeminformation (more accurate)
            const cpuLoad = await si.currentLoad();
            this.cpuUsage = Math.round(cpuLoad.currentLoad);

            // Get memory usage
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const usedMem = totalMem - freeMem;
            
            this.memoryUsage = {
                used: Math.round(usedMem / 1024 / 1024 / 1024 * 10) / 10, // GB
                total: Math.round(totalMem / 1024 / 1024 / 1024 * 10) / 10, // GB
                percentage: Math.round((usedMem / totalMem) * 100)
            };

            // Get network usage
            const networkStats = await si.networkStats();
            if (this.lastNetworkStats && networkStats.length > 0) {
                const timeDiff = 2000; // 2 seconds (our update interval)
                const rxDiff = networkStats[0].rx_bytes - this.lastNetworkStats[0].rx_bytes;
                const txDiff = networkStats[0].tx_bytes - this.lastNetworkStats[0].tx_bytes;
                
                this.networkUsage = {
                    rx: Math.round((rxDiff / timeDiff) * 1000) / 1000, // MB/s
                    tx: Math.round((txDiff / timeDiff) * 1000) / 1000  // MB/s
                };
            }
            this.lastNetworkStats = networkStats;

            return {
                cpu: this.cpuUsage,
                memory: this.memoryUsage,
                network: this.networkUsage
            };
        } catch (error) {
            console.error('Error getting system info:', error);
            return {
                cpu: 0,
                memory: { used: 0, total: 0, percentage: 0 },
                network: { rx: 0, tx: 0 }
            };
        }
    }

    startMonitoring() {
        this.updateInterval = setInterval(async () => {
            const info = await this.getSystemInfo();
            // Emit to frontend if needed
            if (global.mainWindow) {
                global.mainWindow.webContents.send('system-info-update', info);
            }
        }, 2000); // Update every 2 seconds
    }

    stopMonitoring() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

module.exports = SystemMonitor; 