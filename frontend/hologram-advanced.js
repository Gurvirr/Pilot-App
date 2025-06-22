class IronManHologram {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.hologram = null;
        this.animationId = null;
        this.init();
    }

    init() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        this.camera.position.z = 5;

        const container = document.getElementById('hologram-canvas');
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true 
        });
        this.renderer.setSize(400, 400);
        this.renderer.setClearColor(0x000000, 0);
        container.appendChild(this.renderer.domElement);

        this.createDetailedHelmet();
        this.animate();
    }

    createDetailedHelmet() {
        // Create helmet group
        this.hologram = new THREE.Group();

        // Main helmet body
        const helmetGeometry = new THREE.SphereGeometry(1, 32, 32);
        const helmetMaterial = new THREE.MeshBasicMaterial({
            color: 0x008cff,
            transparent: true,
            opacity: 0.3,
            wireframe: true
        });
        const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
        this.hologram.add(helmet);

        // Face plate (more detailed)
        const faceGeometry = new THREE.SphereGeometry(0.8, 16, 16);
        const faceMaterial = new THREE.MeshBasicMaterial({
            color: 0x00aaff,
            transparent: true,
            opacity: 0.5,
            wireframe: true
        });
        const face = new THREE.Mesh(faceGeometry, faceMaterial);
        face.position.z = 0.3;
        this.hologram.add(face);

        // Eye slits
        this.createEyeSlits();
        
        // Arc reactor effect
        this.createArcReactor();

        this.scene.add(this.hologram);
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0x008cff, 0.5);
        this.scene.add(ambientLight);
        
        const pointLight = new THREE.PointLight(0x008cff, 1, 100);
        pointLight.position.set(0, 0, 2);
        this.scene.add(pointLight);
    }

    createEyeSlits() {
        const eyeGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.1);
        const eyeMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.8
        });

        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.3, 0.1, 0.8);
        this.hologram.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.3, 0.1, 0.8);
        this.hologram.add(rightEye);
    }

    createArcReactor() {
        const reactorGeometry = new THREE.RingGeometry(0.2, 0.3, 16);
        const reactorMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });

        const reactor = new THREE.Mesh(reactorGeometry, reactorMaterial);
        reactor.position.z = -0.8;
        this.hologram.add(reactor);
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());

        if (this.hologram) {
            this.hologram.rotation.y += 0.01;
            this.hologram.rotation.x += 0.005;
            
            const time = Date.now() * 0.001;
            this.hologram.position.y = Math.sin(time) * 0.1;
        }

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

window.addEventListener('DOMContentLoaded', () => {
    window.ironManHologram = new IronManHologram();
}); 