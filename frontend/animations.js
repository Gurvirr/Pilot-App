window.addEventListener('DOMContentLoaded', () => {
    const canvases = [
        { id: 'canvas-tl', color: '#8be6ff', speed: 0.05, amplitude: 25, frequency: 0.04 },
        { id: 'canvas-tr', type: 'mic', color: '#00d4ff' }, // Make top-right mic reactive
        { id: 'canvas-bl', color: '#75ff6e', speed: 0.06, amplitude: 15, frequency: 0.06 },
        { id: 'canvas-br', color: '#f0ff6e', speed: 0.04, amplitude: 20, frequency: 0.02 }
    ];

    canvases.forEach(setupCanvas);
    
    // Add click handler to start audio context
    document.addEventListener('click', () => {
        console.log('👆 User clicked - attempting to start audio contexts');
    }, { once: true });
});

// Setup canvas - handles both wave and mic types
function setupCanvas(canvasInfo) {
    const canvas = document.getElementById(canvasInfo.id);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let frame = 0;

    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
    }

    if (canvasInfo.type === 'mic') {
        setupMicCanvas(canvas, ctx, canvasInfo);
    } else {
        setupWaveCanvas(canvas, ctx, canvasInfo);
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
}

// Simple mic-reactive canvas
function setupMicCanvas(canvas, ctx, canvasInfo) {
    let audioContext, analyser, dataArray;
    let isAudioInitialized = false;
    let frame = 0;
    let audioLevel = 0;
    let smoothedAudioLevel = 0;

    // Initialize microphone
    async function initAudio() {
        try {
            console.log('🎤 Requesting microphone access...');
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });
            
            console.log('🎤 Got microphone stream, setting up audio context...');
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Resume audio context if suspended
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }
            
            analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(stream);

            analyser.fftSize = 512;
            analyser.smoothingTimeConstant = 0.8;
            analyser.minDecibels = -100;
            analyser.maxDecibels = -30;
            
            dataArray = new Uint8Array(analyser.frequencyBinCount);
            source.connect(analyser);

            isAudioInitialized = true;
            console.log('✅ Mic reactive wave is now active!');
        } catch (error) {
            console.error('❌ Mic access failed:', error);
            isAudioInitialized = false;
        }
    }

    function animate() {
        frame++;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Process audio if available
        if (isAudioInitialized && analyser) {
            analyser.getByteFrequencyData(dataArray);
            
            // Calculate audio level from frequency data
            let sum = 0;
            // Focus on lower frequencies for voice detection
            for (let i = 0; i < Math.min(dataArray.length / 4, 32); i++) {
                sum += dataArray[i];
            }
            audioLevel = sum / Math.min(dataArray.length / 4, 32) / 255;
            
            // Smooth the audio level
            smoothedAudioLevel += (audioLevel - smoothedAudioLevel) * 0.1;
            
            // Debug output every 60 frames
            if (frame % 60 === 0) {
                console.log(`🎵 Audio level: ${audioLevel.toFixed(3)}, Smoothed: ${smoothedAudioLevel.toFixed(3)}`);
            }
        } else {
            // Default subtle animation when no mic
            smoothedAudioLevel = 0.05 + Math.sin(frame * 0.02) * 0.02;
        }

        // Draw audio-reactive wave
        const baseAmplitude = 10;
        const audioAmplitude = smoothedAudioLevel * 80; // Increased sensitivity
        const totalAmplitude = baseAmplitude + audioAmplitude;
        
        // Color changes with audio level
        let color = '#00d4ff'; // Default blue
        if (smoothedAudioLevel > 0.2) {
            color = '#ff4081'; // Pink for high activity
        } else if (smoothedAudioLevel > 0.05) {
            color = '#4caf50'; // Green for medium activity
        }

        // Set line style
        ctx.lineWidth = 1 + smoothedAudioLevel * 4;
        ctx.strokeStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 3 + smoothedAudioLevel * 20;
        
        // Draw the main wave
        ctx.beginPath();
        for (let x = 0; x < width; x++) {
            // Base wave with audio modulation
            const baseWave = Math.sin(frame * 0.02 + x * 0.03);
            const audioWave = Math.sin(frame * 0.04 + x * 0.02) * smoothedAudioLevel * 3;
            const y = height / 2 + (baseWave + audioWave) * totalAmplitude;
            
            if (x === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();

        // Add second wave for more complexity when there's audio
        if (smoothedAudioLevel > 0.02) {
            ctx.lineWidth = 1 + smoothedAudioLevel * 2;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            for (let x = 0; x < width; x++) {
                const wave2 = Math.sin(frame * 0.03 + x * 0.025 + Math.PI / 2);
                const audioMod = Math.sin(frame * 0.05 + x * 0.015) * smoothedAudioLevel * 2;
                const y = height / 2 + (wave2 + audioMod) * totalAmplitude * 0.6;
                
                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        // Reset shadow
        ctx.shadowBlur = 0;

        requestAnimationFrame(animate);
    }

    // Start audio immediately
    initAudio();
    animate();
}

// Original wave animation
function setupWaveCanvas(canvas, ctx, canvasInfo) {
    let frame = 0;

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

    animate();
} 