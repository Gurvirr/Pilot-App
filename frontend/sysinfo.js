const { exec } = require('child_process');

function updateSysInfo() {
    exec('python3 ../sysinfo.py', (error, stdout, stderr) => {
        const box = document.getElementById('sysinfo-box');
        if (error) {
            console.error(`exec error: ${error}`);
            box.innerHTML = '<p style="color:red;">Error fetching system info. Is Python installed and in your PATH? Are dependencies installed?</p>';
            return;
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            box.innerHTML = '<p style="color:red;">Script Error. Check console.</p>';
            return;
        }
        try {
            const info = JSON.parse(stdout);
            let temp = info.cpu_temp_c !== null ? `${info.cpu_temp_c}°C` : 'N/A';
            box.innerHTML = `
                <p><b>CPU:</b> ${info.cpu_usage_percent}%</p>
                <p><b>RAM:</b> ${info.ram_usage_percent}% (${info.ram_used_mb}MB)</p>
                <p><b>Temp:</b> ${temp}</p>
            `;
        } catch (e) {
            console.error('Error parsing JSON:', e);
            box.innerText = 'Error parsing system info';
        }
    });
}

// Run once on load, then update every 3 seconds
window.addEventListener('DOMContentLoaded', () => {
    updateSysInfo();
    setInterval(updateSysInfo, 3000);
}); 