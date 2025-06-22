window.addEventListener('DOMContentLoaded', () => {
    const canvases = [
        { id: 'canvas-tl', color: '#8be6ff', speed: 0.05, amplitude: 25, frequency: 0.04 },
        { id: 'canvas-tr', color: '#ff6e6e', speed: 0.03, amplitude: 35, frequency: 0.03 },
        { id: 'canvas-bl', color: '#75ff6e', speed: 0.06, amplitude: 15, frequency: 0.06 },
        { id: 'canvas-br', color: '#f0ff6e', speed: 0.04, amplitude: 20, frequency: 0.02 }
    ];

    canvases.forEach(setupCanvas);
    
    // Setup the center audio visualizer ring
    setupAudioVisualizer({ id: 'canvas-center' });
    
    // Add P key functionality for audio visualizer via IPC
    let isVisualizerFocused = false;
    const centerVisualizer = document.querySelector('.center-visualizer');
    
    // Listen for IPC message from main process
    if (window.require) {
        const { ipcRenderer } = window.require('electron');
        ipcRenderer.on('toggle-visualizer-focus', () => {
            isVisualizerFocused = !isVisualizerFocused;
            centerVisualizer.classList.toggle('focused', isVisualizerFocused);
            

            
            // Trigger another resize after transition completes to ensure proper sizing
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 550); // Slightly before transition ends
        });
    }
});

// Circular Ring of Bars + Rotating Audio Spikes
function setupAudioVisualizer(canvasInfo) {
    const canvas = document.getElementById(canvasInfo.id);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let audioContext, analyser, dataArray, bufferLength;
    let isAudioInitialized = false;
    let frame = 0;
    
    // Smoothed audio data for easing
    let smoothedAudioData = new Array(64).fill(0);
    let targetAudioData = new Array(64).fill(0);

    // Auto-initialize microphone
    async function initAudio() {
        try {
            console.log('Auto-initializing microphone...');
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
            console.log('🎵 Chill random distribution with smooth easing ready!');
        } catch (err) {
            console.log('Microphone access denied, neon blue sine bars');
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

    function drawCircularBarRing() {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Calculate safe dimensions to prevent clipping - make it smaller
        const maxSize = Math.min(width, height);
        const baseRadius = maxSize * 0.2; // Reduced from 0.25
        
        // Calculate maximum safe bar length to prevent clipping at edges
        // The furthest a bar can extend is to the edge of the canvas
        const maxSafeDistance = (maxSize / 2) - 10; // 10px padding from edge
        const maxSafeBarLength = maxSafeDistance - baseRadius;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Number of bars around the circle
        const numBars = 64;
        
        // Reset target data
        targetAudioData.fill(0);
        
        // Minimum noise level - always have some activity
        const minimumNoiseLevel = 0.2;
        
        if (isAudioInitialized && analyser && audioContext.state === 'running') {
            analyser.getByteFrequencyData(dataArray);
            
            // Get overall audio energy
            let totalEnergy = 0;
            let activeFrequencies = [];
            
            // Find the strongest frequencies
            for (let i = 0; i < bufferLength; i++) {
                totalEnergy += dataArray[i];
                if (dataArray[i] > 50) { // Threshold for active frequencies
                    activeFrequencies.push({
                        index: i,
                        value: dataArray[i]
                    });
                }
            }
            
            // Sort by strength and take top frequencies
            activeFrequencies.sort((a, b) => b.value - a.value);
            const topFrequencies = activeFrequencies.slice(0, Math.min(6, activeFrequencies.length)); // Reduced from 8 to 6
            
            // Slowly and randomly distribute these frequencies to different bars
            topFrequencies.forEach((freq, index) => {
                // Create fewer positions for more chill effect
                const numPositions = Math.min(2, Math.floor(freq.value / 100) + 1); // Reduced and higher threshold
                
                for (let j = 0; j < numPositions; j++) {
                    // Much slower random changes - use slower frame rate for seed
                    const slowFrame = Math.floor(frame / 30); // Change positions every 30 frames (~0.5 seconds)
                    const seed = freq.index + slowFrame * 0.5 + j * 23; // Slower seed changes
                    const randomBarIndex = Math.floor((Math.sin(seed) * 0.5 + 0.5) * numBars);
                    
                    // Blend the frequency strength into multiple bars
                    const strength = (freq.value / 255) * Math.pow(0.7, j); // More diminishing
                    targetAudioData[randomBarIndex] = Math.max(targetAudioData[randomBarIndex], strength);
                    
                    // Enhanced neighboring bar effect - affect more neighbors with gradual falloff
                    for (let k = 1; k <= 4; k++) { // Affect 4 neighbors on each side
                        const falloff = Math.pow(0.6, k); // Gradual falloff
                        const neighbor1 = (randomBarIndex + k) % numBars;
                        const neighbor2 = (randomBarIndex - k + numBars) % numBars;
                        targetAudioData[neighbor1] = Math.max(targetAudioData[neighbor1], strength * falloff);
                        targetAudioData[neighbor2] = Math.max(targetAudioData[neighbor2], strength * falloff);
                    }
                }
            });
            
            // Add some base energy distribution to all bars
            const baseEnergy = (totalEnergy / bufferLength / 255) * 0.15; // Reduced base energy
            for (let i = 0; i < numBars; i++) {
                targetAudioData[i] = Math.max(targetAudioData[i], baseEnergy);
                
                // Much subtler time-based variation
                const timeVariation = Math.sin(frame * 0.02 + i * 0.2) * 0.05; // Slower and smaller
                targetAudioData[i] = Math.max(0, targetAudioData[i] + timeVariation);
            }
        }
        
        // Apply minimum noise level to all bars - ensures always visible
        for (let i = 0; i < numBars; i++) {
            targetAudioData[i] = Math.max(targetAudioData[i], minimumNoiseLevel);
        }
        
        // Smooth easing towards target values
        for (let i = 0; i < numBars; i++) {
            const diff = targetAudioData[i] - smoothedAudioData[i];
            
            // Fast ease-in, medium ease-out
            let easeSpeed;
            if (diff > 0) {
                // Easing up (reacting to new sound) - fast
                easeSpeed = 0.25; // Fast for responsiveness
            } else {
                // Easing down (fading out) - medium speed
                easeSpeed = 0.08; // Faster than before but still gradual
            }
            
            smoothedAudioData[i] += diff * easeSpeed;
            
            // Prevent tiny values from lingering
            if (Math.abs(diff) < 0.01) {
                smoothedAudioData[i] = targetAudioData[i];
            }
        }

        // Calculate overall audio intensity from smoothed data
        const totalAudioIntensity = smoothedAudioData.reduce((sum, val) => sum + val, 0) / smoothedAudioData.length;

        // Draw each bar with neon blue glow
        for (let i = 0; i < numBars; i++) {
            const angle = (i / numBars) * Math.PI * 2;
            
            // Smaller sine wave amplitude for subtler base animation
            const sineWave1 = Math.sin(frame * 0.04 + angle * 8) * 1.5; // Reduced from 3 to 1.5
            const sineWave2 = Math.sin(frame * 0.03 + angle * 12) * 1; // Reduced from 2 to 1
            const baseSineOffset = sineWave1 + sineWave2;
            
            // Use the smoothed audio data for gradual changes
            const audioAmplitude = smoothedAudioData[i] * maxSafeBarLength;
            
            // Combine base sine with audio and clamp to safe length
            const rawBarLength = Math.max(8, baseSineOffset + audioAmplitude); // Increased minimum from 5 to 8
            const totalBarLength = Math.min(rawBarLength, maxSafeBarLength);
            
            // Calculate bar positions
            const innerRadius = baseRadius + baseSineOffset;
            const outerRadius = innerRadius + totalBarLength;
            
            const innerX = centerX + Math.cos(angle) * innerRadius;
            const innerY = centerY + Math.sin(angle) * innerRadius;
            const outerX = centerX + Math.cos(angle) * outerRadius;
            const outerY = centerY + Math.sin(angle) * outerRadius;
            
            // Neon blue color scheme with variation
            const intensity = smoothedAudioData[i];
            const baseBlue = 180;
            const hueVariation = Math.sin(i * 0.1 + frame * 0.01) * 20; // Slower color changes
            const hue = baseBlue + hueVariation;
            const saturation = 90 + intensity * 10;
            const lightness = 40 + intensity * 50;
            
            // Draw the main bar with neon blue
            ctx.beginPath();
            ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.9)`;
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            
            // Moderate neon glow effect
            ctx.shadowColor = `hsla(${hue}, ${saturation}%, ${lightness + 30}%, 1)`;
            ctx.shadowBlur = 12 + intensity * 15;
            
            ctx.moveTo(innerX, innerY);
            ctx.lineTo(outerX, outerY);
            ctx.stroke();
            
            // Add bright inner core for higher-intensity bars
            if (intensity > 0.3) {
                ctx.beginPath();
                ctx.strokeStyle = `hsla(${hue}, 100%, ${Math.min(lightness + 50, 95)}%, 0.8)`;
                ctx.lineWidth = 3;
                ctx.shadowBlur = 20 + intensity * 10;
                ctx.shadowColor = `hsla(${hue}, 100%, 90%, 0.9)`;
                
                const coreLength = totalBarLength * 0.7;
                const coreOuterRadius = innerRadius + coreLength;
                const coreOuterX = centerX + Math.cos(angle) * coreOuterRadius;
                const coreOuterY = centerY + Math.sin(angle) * coreOuterRadius;
                
                ctx.moveTo(innerX, innerY);
                ctx.lineTo(coreOuterX, coreOuterY);
                ctx.stroke();
            }
            
            // Add ultra-bright tip for very high intensity
            if (intensity > 0.6) {
                ctx.beginPath();
                ctx.strokeStyle = `hsla(${hue}, 100%, 95%, 1)`;
                ctx.lineWidth = 2;
                ctx.shadowBlur = 25;
                ctx.shadowColor = `hsla(${hue}, 100%, 95%, 1)`;
                
                const tipLength = totalBarLength * 0.3;
                const tipStartRadius = outerRadius - tipLength;
                const tipStartX = centerX + Math.cos(angle) * tipStartRadius;
                const tipStartY = centerY + Math.sin(angle) * tipStartRadius;
                
                ctx.moveTo(tipStartX, tipStartY);
                ctx.lineTo(outerX, outerY);
                ctx.stroke();
            }
        }
        
        // Reset shadow
        ctx.shadowBlur = 0;

        // Draw center circle with neon blue glow (bigger)
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius - 5, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(190, 90%, ${50 + totalAudioIntensity * 40}%, ${0.3 + totalAudioIntensity * 0.5})`;
        ctx.lineWidth = 3;
        ctx.shadowColor = 'hsla(190, 90%, 70%, 0.8)';
        ctx.shadowBlur = 8 + totalAudioIntensity * 12;
        ctx.stroke();

        // Reset shadow
        ctx.shadowBlur = 0;

        // No debug text - clean visualizer only

        frame++;
    }

    function animate() {
        drawCircularBarRing();
        requestAnimationFrame(animate);
    }

    // Initialize everything
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    animate();
    
    // Auto-start microphone
    setTimeout(initAudio, 1000);
}

// Original wave animation for corners
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