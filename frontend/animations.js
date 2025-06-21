window.addEventListener('DOMContentLoaded', () => {
    const canvases = [
        { id: 'canvas-tl', color: '#8be6ff', speed: 0.05, amplitude: 25, frequency: 0.04 },
        { id: 'canvas-tr', color: '#ff6e6e', speed: 0.03, amplitude: 35, frequency: 0.03 },
        { id: 'canvas-bl', color: '#75ff6e', speed: 0.06, amplitude: 15, frequency: 0.06 },
        { id: 'canvas-br', color: '#f0ff6e', speed: 0.04, amplitude: 20, frequency: 0.02 }
    ];

    canvases.forEach(setupCanvas);
});

function setupCanvas(canvasInfo) {
    const canvas = document.getElementById(canvasInfo.id);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let frame = 0;

    function resizeCanvas() {
        // Set actual canvas size to match CSS-scaled size
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
    }

    function animate() {
        frame++;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Set line style
        ctx.lineWidth = 2;
        ctx.strokeStyle = canvasInfo.color;
        ctx.shadowColor = canvasInfo.color;
        ctx.shadowBlur = 10;
        
        ctx.beginPath();
        for (let x = 0; x < width; x++) {
            const angle = frame * canvasInfo.speed + x * canvasInfo.frequency;
            const y = height / 2 + Math.sin(angle) * canvasInfo.amplitude * Math.sin(frame * 0.01);
            ctx.lineTo(x, y);
        }
        ctx.stroke();

        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    animate();
} 