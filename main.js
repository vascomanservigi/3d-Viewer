class ARViewer {
    constructor() {
        this.video = document.getElementById('webcam');
        this.canvas = document.getElementById('ar-canvas');
        this.startBtn = document.getElementById('startBtn');
        this.addObjectBtn = document.getElementById('addObjectBtn');
        this.objectSelect = document.getElementById('objectSelect');
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.objects = [];
        this.isWebcamActive = false;
        
        this.init();
        this.setupEventListeners();
    }
    
    init() {
        this.scene = new THREE.Scene();
        
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        this.camera.position.z = 5;
        
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const pointLight = new THREE.PointLight(0x667eea, 1, 100);
        pointLight.position.set(5, 5, 5);
        this.scene.add(pointLight);
        
        const pointLight2 = new THREE.PointLight(0x764ba2, 1, 100);
        pointLight2.position.set(-5, -5, 5);
        this.scene.add(pointLight2);
        
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enableZoom = true;
        this.controls.enablePan = false;
        
        window.addEventListener('resize', () => this.onWindowResize());
        
        this.animate();
    }
    
    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.startWebcam());
        this.addObjectBtn.addEventListener('click', () => this.addARObject());
    }
    
    async startWebcam() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });
            
            this.video.srcObject = stream;
            this.isWebcamActive = true;
            
            this.startBtn.textContent = 'Webcam Attiva';
            this.startBtn.disabled = true;
            this.addObjectBtn.disabled = false;
            
            this.createWelcomeObject();
            
        } catch (error) {
            console.error('Errore accesso webcam:', error);
            alert('Impossibile accedere alla webcam. Controlla i permessi.');
        }
    }
    
    createWelcomeObject() {
        const geometry = new THREE.IcosahedronGeometry(0.5, 0);
        const material = new THREE.MeshPhongMaterial({
            color: 0x667eea,
            emissive: 0x667eea,
            emissiveIntensity: 0.3,
            wireframe: false,
            flatShading: true
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, 0, -2);
        mesh.userData.rotationSpeed = { x: 0.01, y: 0.02 };
        
        this.scene.add(mesh);
        this.objects.push(mesh);
    }
    
    addARObject() {
        const objectType = this.objectSelect.value;
        let geometry, material, mesh;
        
        switch(objectType) {
            case 'robot':
                mesh = this.createRobot();
                break;
            case 'cube':
                geometry = new THREE.BoxGeometry(1, 1, 1);
                material = new THREE.MeshPhongMaterial({
                    color: 0x00ff88,
                    emissive: 0x00ff88,
                    emissiveIntensity: 0.2
                });
                mesh = new THREE.Mesh(geometry, material);
                break;
            case 'sphere':
                geometry = new THREE.SphereGeometry(0.5, 32, 32);
                material = new THREE.MeshPhongMaterial({
                    color: 0xff6b6b,
                    emissive: 0xff6b6b,
                    emissiveIntensity: 0.3,
                    transparent: true,
                    opacity: 0.8
                });
                mesh = new THREE.Mesh(geometry, material);
                break;
            case 'torus':
                geometry = new THREE.TorusKnotGeometry(0.4, 0.1, 100, 16);
                material = new THREE.MeshPhongMaterial({
                    color: 0xffd93d,
                    emissive: 0xffd93d,
                    emissiveIntensity: 0.2,
                    metalness: 0.8
                });
                mesh = new THREE.Mesh(geometry, material);
                break;
            case 'crystal':
                geometry = new THREE.OctahedronGeometry(0.6, 0);
                material = new THREE.MeshPhongMaterial({
                    color: 0x6bcbff,
                    emissive: 0x6bcbff,
                    emissiveIntensity: 0.5,
                    transparent: true,
                    opacity: 0.85,
                    flatShading: true
                });
                mesh = new THREE.Mesh(geometry, material);
                break;
        }
        
        const randomX = (Math.random() - 0.5) * 4;
        const randomY = (Math.random() - 0.5) * 3;
        const randomZ = -2 - Math.random() * 3;
        
        mesh.position.set(randomX, randomY, randomZ);
        mesh.userData.rotationSpeed = { 
            x: (Math.random() - 0.5) * 0.02, 
            y: (Math.random() - 0.5) * 0.02 
        };
        
        this.scene.add(mesh);
        this.objects.push(mesh);
        
        this.createSpawnParticles(mesh.position);
    }
    
    createRobot() {
        const group = new THREE.Group();
        
        const bodyGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.3);
        const bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x4ecdc4,
            emissive: 0x4ecdc4,
            emissiveIntensity: 0.2
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        group.add(body);
        
        const headGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.3);
        const headMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xff6b6b,
            emissive: 0xff6b6b,
            emissiveIntensity: 0.3
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 0.6;
        group.add(head);
        
        const eyeGeometry = new THREE.SphereGeometry(0.06, 16, 16);
        const eyeMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x00ff00,
            emissive: 0x00ff00,
            emissiveIntensity: 1
        });
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.1, 0.65, 0.15);
        group.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.1, 0.65, 0.15);
        group.add(rightEye);
        
        const legGeometry = new THREE.BoxGeometry(0.15, 0.5, 0.15);
        const legMaterial = new THREE.MeshPhongMaterial({ color: 0x667eea });
        
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.2, -0.65, 0);
        group.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.2, -0.65, 0);
        group.add(rightLeg);
        
        const armGeometry = new THREE.BoxGeometry(0.12, 0.4, 0.12);
        const leftArm = new THREE.Mesh(armGeometry, legMaterial);
        leftArm.position.set(-0.4, 0, 0);
        group.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, legMaterial);
        rightArm.position.set(0.4, 0, 0);
        group.add(rightArm);
        
        group.userData.rotationSpeed = { x: 0.005, y: 0.02 };
        
        return group;
    }
    
    createSpawnParticles(position) {
        const particleCount = 20;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const geometry = new THREE.SphereGeometry(0.02, 8, 8);
            const material = new THREE.MeshBasicMaterial({
                color: 0x667eea,
                transparent: true,
                opacity: 1
            });
            const particle = new THREE.Mesh(geometry, material);
            
            particle.position.copy(position);
            particle.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1
            );
            particle.userData.life = 1;
            
            this.scene.add(particle);
            particles.push(particle);
        }
        
        const animateParticles = () => {
            let allDead = true;
            
            particles.forEach(p => {
                if (p.userData.life > 0) {
                    allDead = false;
                    p.position.add(p.userData.velocity);
                    p.userData.life -= 0.02;
                    p.material.opacity = p.userData.life;
                }
            });
            
            if (!allDead) {
                requestAnimationFrame(animateParticles);
            } else {
                particles.forEach(p => {
                    this.scene.remove(p);
                    p.geometry.dispose();
                    p.material.dispose();
                });
            }
        };
        
        animateParticles();
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.objects.forEach(obj => {
            if (obj.userData.rotationSpeed) {
                obj.rotation.x += obj.userData.rotationSpeed.x;
                obj.rotation.y += obj.userData.rotationSpeed.y;
            }
        });
        
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ARViewer();
});
