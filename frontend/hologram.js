class IronManHologram {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.hologram = null;
        this.animationId = null;
        this.loader = null;
        this.init();
    }

    init() {
        // Create scene with transparent background
        this.scene = new THREE.Scene();
        this.scene.background = null; // Make background transparent

        // Create camera with adjusted angle - ZOOMED IN MORE
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        // Move camera closer for more zoom
        this.camera.position.set(0, 1, 4); // Z: 4 instead of 6 (more zoom)
        this.camera.lookAt(0, 0, 0); // Look at center

        // Create renderer with alpha
        const container = document.getElementById('hologram-canvas');
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true,
            preserveDrawingBuffer: false
        });
        this.renderer.setSize(400, 400);
        this.renderer.setClearColor(0x000000, 0); // Transparent background
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        container.appendChild(this.renderer.domElement);

        // Initialize GLTF loader
        this.loader = new THREE.GLTFLoader();
        
        // Load the Iron Man model
        this.loadIronManModel();
        
        // Start animation
        this.animate();
    }

    loadIronManModel() {
        // Fix the path to match your actual file
        this.loader.load(
            'models/scene.gltf', // This will automatically load scene.bin too
            (gltf) => {
                this.hologram = gltf.scene;
                
                // Apply hologram effect to the model
                this.applyHologramEffect(this.hologram);
                
                // Scale and position the model
                this.hologram.scale.set(2.3, 2.3, 2.3);
                
                // IMPORTANT: Set position AFTER adding to scene
                this.scene.add(this.hologram);
                
                // Position model more to the right (less negative X)
                this.hologram.position.set(-1.1, -2.1, 0); // More to the right (-1.8 instead of -2.5)
                
                // Add minimal lighting (no aura)
                this.setupLighting();
                
                console.log('Iron Man model loaded successfully!');
                console.log('Model position:', this.hologram.position);
            },
            (progress) => {
                console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
            },
            (error) => {
                console.error('Error loading model:', error);
                console.log('Model failed to load, showing empty hologram');
            }
        );
    }

    applyHologramEffect(object) {
        // Apply hologram effect to all materials in the model
        object.traverse((child) => {
            if (child.isMesh) {
                // Create more holographic material with fewer lines
                const hologramMaterial = new THREE.MeshBasicMaterial({
                    color: 0x00aaff,
                    transparent: true,
                    opacity: 0.4, // More transparent
                    wireframe: true,
                    wireframeLinewidth: 1 // Thinner lines
                });
                
                // Apply the hologram material
                child.material = hologramMaterial;
            }
        });
    }

    setupLighting() {
        // Minimal lighting - no colored lights for aura effect
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(ambientLight);
        
        // Simple directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(0, 1, 1);
        this.scene.add(directionalLight);
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());

        // Rotate the hologram - ONLY Y-axis (left and right) - NO BOBBING
        if (this.hologram) {
            this.hologram.rotation.y += 0.01; // Only Y-axis rotation
            
            // Keep position completely fixed
            this.hologram.position.x = -1.1; // More to the right
            this.hologram.position.y = -2.1; // More down
            this.hologram.position.z = 0;    // Fixed Z position
        }

        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.renderer) {
            this.renderer.dispose();
        }
    }
}

// Initialize hologram when page loads
window.addEventListener('DOMContentLoaded', () => {
    window.ironManHologram = new IronManHologram();
}); 