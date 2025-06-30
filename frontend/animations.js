window.addEventListener('DOMContentLoaded', () => {
    const canvases = [
        { id: 'canvas-tl', color: '#8be6ff', speed: 0.05, amplitude: 25, frequency: 0.04 },
        { id: 'canvas-bl', color: '#75ff6e', speed: 0.06, amplitude: 15, frequency: 0.06 },
        { id: 'canvas-br', color: '#f0ff6e', speed: 0.04, amplitude: 20, frequency: 0.02 }
    ];

    canvases.forEach(setupCanvas);
    
    // Setup circular wave audio visualizer for top-right corner
    setupCircularWaveVisualizer({ id: 'canvas-tr' });
});

// Circular Wave Audio Visualizer for top-right corner
function setupCircularWaveVisualizer(canvasInfo) {
    const canvas = document.getElementById(canvasInfo.id);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let audioContext, analyser, dataArray, bufferLength;
    let isAudioInitialized = false;
    let frame = 0;
    
    // Smoothed audio data for easing
    let smoothedAudioData = new Array(128).fill(0);
    let targetAudioData = new Array(128).fill(0);

    // Auto-initialize microphone
    async function initAudio() {
        try {
            console.log('Auto-initializing microphone for circular wave...');
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: { 
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                } 
            });
            
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(stream);
            
            // Balanced sensitivity settings
            analyser.fftSize = 512;
            analyser.smoothingTimeConstant = 0.3;
            analyser.minDecibels = -85;
            analyser.maxDecibels = -25;
            
            bufferLength = analyser.frequencyBinCount;
            dataArray = new Uint8Array(bufferLength);
            
            source.connect(analyser);
            isAudioInitialized = true;
            console.log('🎵 Circular wave audio visualizer ready for top-right!');
        } catch (err) {
            console.log('Microphone access denied, using fallback animation');
            isAudioInitialized = false;
        }
    }

    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
    }

    // Function to get current Pilot state color
    function getPilotStateColor() {
        if (document.body.classList.contains('pilot-processing')) {
            return {
                hue: 30, // Orange
                saturation: 100,
                baseLightness: 50,
                glowColor: 'hsla(30, 100%, 70%, 0.8)'
            };
        } else if (document.body.classList.contains('pilot-active')) {
            return {
                hue: 120, // Green
                saturation: 100,
                baseLightness: 50,
                glowColor: 'hsla(120, 100%, 70%, 0.8)'
            };
        } else {
            return {
                hue: 190, // Blue (default)
                saturation: 100,
                baseLightness: 50,
                glowColor: 'hsla(190, 100%, 70%, 0.8)'
            };
        }
    }

    function drawCircularWave() {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Calculate safe dimensions for top-right corner
        const maxSize = Math.min(width, height);
        const baseRadius = maxSize * 0.12; // Smaller base radius for corner
        const maxWaveAmplitude = maxSize * 0.2; // Smaller max amplitude for corner
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Number of points around the circle
        const numPoints = 128;
        
        // Reset target data
        targetAudioData.fill(0);
        
        // Minimum noise level
        const minimumNoiseLevel = 0.1;
        
        if (isAudioInitialized && analyser && audioContext.state === 'running') {
            analyser.getByteFrequencyData(dataArray);
            
            // Get overall audio energy
            let totalEnergy = 0;
            let activeFrequencies = [];
            
            // Find the strongest frequencies
            for (let i = 0; i < bufferLength; i++) {
                totalEnergy += dataArray[i];
                if (dataArray[i] > 50) {
                    activeFrequencies.push({
                        index: i,
                        value: dataArray[i]
                    });
                }
            }
            
            // Sort by strength and take top frequencies
            activeFrequencies.sort((a, b) => b.value - a.value);
            const topFrequencies = activeFrequencies.slice(0, Math.min(8, activeFrequencies.length));
            
            // Distribute frequencies to create wave patterns
            topFrequencies.forEach((freq, index) => {
                const numPositions = Math.min(3, Math.floor(freq.value / 80) + 1);
                
                for (let j = 0; j < numPositions; j++) {
                    const slowFrame = Math.floor(frame / 20);
                    const seed = freq.index + slowFrame * 0.3 + j * 17;
                    const randomPointIndex = Math.floor((Math.sin(seed) * 0.5 + 0.5) * numPoints);
                    
                    const strength = (freq.value / 255) * Math.pow(0.8, j);
                    targetAudioData[randomPointIndex] = Math.max(targetAudioData[randomPointIndex], strength);
                    
                    // Create wave-like distribution to neighboring points
                    for (let k = 1; k <= 6; k++) {
                        const falloff = Math.cos((k / 6) * Math.PI) * 0.5 + 0.5; // Cosine falloff for wave effect
                        const neighbor1 = (randomPointIndex + k) % numPoints;
                        const neighbor2 = (randomPointIndex - k + numPoints) % numPoints;
                        targetAudioData[neighbor1] = Math.max(targetAudioData[neighbor1], strength * falloff);
                        targetAudioData[neighbor2] = Math.max(targetAudioData[neighbor2], strength * falloff);
                    }
                }
            });
            
            // Add base energy distribution
            const baseEnergy = (totalEnergy / bufferLength / 255) * 0.1;
            for (let i = 0; i < numPoints; i++) {
                targetAudioData[i] = Math.max(targetAudioData[i], baseEnergy);
                
                // Subtle time-based variation
                const timeVariation = Math.sin(frame * 0.01 + i * 0.1) * 0.03;
                targetAudioData[i] = Math.max(0, targetAudioData[i] + timeVariation);
            }
        }
        
        // Apply minimum noise level
        for (let i = 0; i < numPoints; i++) {
            targetAudioData[i] = Math.max(targetAudioData[i], minimumNoiseLevel);
        }
        
        // Smooth easing towards target values
        for (let i = 0; i < numPoints; i++) {
            const diff = targetAudioData[i] - smoothedAudioData[i];
            
            let easeSpeed;
            if (diff > 0) {
                easeSpeed = 0.2; // Fast for responsiveness
            } else {
                easeSpeed = 0.05; // Slower for smooth decay
            }
            
            smoothedAudioData[i] += diff * easeSpeed;
            
            if (Math.abs(diff) < 0.01) {
                smoothedAudioData[i] = targetAudioData[i];
            }
        }

        // Calculate overall audio intensity
        const totalAudioIntensity = smoothedAudioData.reduce((sum, val) => sum + val, 0) / smoothedAudioData.length;

        // Get current Pilot state color
        const stateColor = getPilotStateColor();

        // Draw the circular wave
        ctx.beginPath();
        
        for (let i = 0; i <= numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            
            // Base sine wave animation
            const sineWave1 = Math.sin(frame * 0.03 + angle * 6) * 2;
            const sineWave2 = Math.sin(frame * 0.02 + angle * 4) * 1.5;
            const baseSineOffset = sineWave1 + sineWave2;
            
            // Audio-reactive wave amplitude
            const audioIndex = i % numPoints;
            const waveAmplitude = smoothedAudioData[audioIndex] * maxWaveAmplitude;
            
            // Combine base animation with audio
            const totalAmplitude = Math.max(5, baseSineOffset + waveAmplitude);
            const radius = baseRadius + totalAmplitude;
            
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        // Close the path
        ctx.closePath();
        
        // Create gradient for the wave (transparent center) with state-based colors
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxSize / 2);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)'); // Transparent center
        gradient.addColorStop(0.3, `hsla(${stateColor.hue}, ${stateColor.saturation}%, ${stateColor.baseLightness + totalAudioIntensity * 30}%, ${0.6 + totalAudioIntensity * 0.3})`);
        gradient.addColorStop(0.7, `hsla(${stateColor.hue}, ${stateColor.saturation}%, ${stateColor.baseLightness + totalAudioIntensity * 20}%, ${0.4 + totalAudioIntensity * 0.2})`);
        gradient.addColorStop(1, `hsla(${stateColor.hue}, ${stateColor.saturation}%, ${stateColor.baseLightness + totalAudioIntensity * 10}%, ${0.2 + totalAudioIntensity * 0.1})`);
        
        // Draw the wave with glow effect
        ctx.fillStyle = gradient;
        ctx.shadowColor = stateColor.glowColor;
        ctx.shadowBlur = 15 + totalAudioIntensity * 20;
        ctx.fill();
        
        // Draw wave outline with state-based color
        ctx.strokeStyle = `hsla(${stateColor.hue}, ${stateColor.saturation}%, ${stateColor.baseLightness + totalAudioIntensity * 25}%, ${0.9 + totalAudioIntensity * 0.1})`;
        ctx.lineWidth = 2 + totalAudioIntensity * 3;
        ctx.shadowBlur = 8 + totalAudioIntensity * 15;
        ctx.stroke();
        
        // Reset shadow
        ctx.shadowBlur = 0;

        // No center circle - completely transparent center

        frame++;
    }

    function animate() {
        drawCircularWave();
        requestAnimationFrame(animate);
    }

    // Initialize everything
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    animate();
    
    // Auto-start microphone
    setTimeout(initAudio, 1000);
}

// Original wave animation for other corners
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

        // Original simple sine wave for other corners
        drawSingleSineWave(ctx, width, height, frame, canvasInfo);

        requestAnimationFrame(animate);
    }

    function drawSingleSineWave(ctx, width, height, frame, canvasInfo) {
        // Original single sine wave for other corners
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
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    animate();
}