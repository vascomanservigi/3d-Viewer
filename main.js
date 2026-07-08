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
        this.faceDetectionInterval = null;
        this.santaHats = [];
        this.detectedFaces = [];
        this.modelsLoaded = false;
        
        this.init();
        this.setupEventListeners();
    }
    
    async init() {
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
        
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);
        
        const pointLight = new THREE.PointLight(0xff0000, 0.5, 100);
        pointLight.position.set(0, 10, 5);
        this.scene.add(pointLight);
        
        const pointLight2 = new THREE.PointLight(0x00ff00, 0.5, 100);
        pointLight2.position.set(-5, 5, 5);
        this.scene.add(pointLight2);
        
        window.addEventListener('resize', () => this.onWindowResize());
        
        this.animate();
    }
    
    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.startWebcam());
        this.addObjectBtn.addEventListener('click', () => this.addARObject());
    }
    
    async loadFaceDetectionModels() {
        try {
            const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model';
            
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
            ]);
            
            this.modelsLoaded = true;
            console.log('Modelli face detection caricati!');
        } catch (error) {
            console.error('Errore caricamento modelli:', error);
        }
    }
    
    async startWebcam() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            
            this.video.srcObject = stream;
            this.isWebcamActive = true;
            
            this.startBtn.textContent = 'Webcam Attiva';
            this.startBtn.disabled = true;
            this.addObjectBtn.disabled = false;
            
            await this.loadFaceDetectionModels();
            
            if (this.modelsLoaded) {
                this.startFaceDetection();
            }
            
        } catch (error) {
            console.error('Errore accesso webcam:', error);
            alert('Impossibile accedere alla webcam. Controlla i permessi.');
        }
    }
    
    startFaceDetection() {
        const detectionCanvas = document.createElement('canvas');
        detectionCanvas.style.position = 'absolute';
        detectionCanvas.style.top = '0';
        detectionCanvas.style.left = '0';
        detectionCanvas.style.visibility = 'hidden';
        document.body.appendChild(detectionCanvas);
        
        this.faceDetectionInterval = setInterval(async () => {
            if (!this.video.paused && !this.video.ended) {
                detectionCanvas.width = this.video.videoWidth;
                detectionCanvas.height = this.video.videoHeight;
                const ctx = detectionCanvas.getContext('2d');
                ctx.drawImage(this.video, 0, 0);
                
                const detections = await faceapi.detectAllFaces(
                    this.video,
                    new faceapi.TinyFaceDetectorOptions()
                ).withFaceLandmarks();
                
                this.detectedFaces = detections;
                
                this.santaHats.forEach(hat => this.scene.remove(hat));
                this.santaHats = [];
                
                detections.forEach((detection, index) => {
                    const landmarks = detection.landmarks;
                    const leftEye = landmarks.getLeftEye();
                    const rightEye = landmarks.getRightEye();
                    
                    const eyeColor = this.analyzeEyeColor(ctx, detectionCanvas, leftEye, rightEye);
                    const hairColor = this.analyzeHairColor(ctx, detectionCanvas, detection);
                    
                    const isBlonde = this.isBlondeHair(hairColor);
                    const isBlueEyes = this.isBlueEyes(eyeColor);
                    
                    if (isBlonde && isBlueEyes) {
                        this.createSantaHatOnFace(detection);
                        console.log('🎯 Rilevato: Biondo + Occhi Azzurri! Cappello aggiunto!');
                    }
                });
            }
        }, 500);
    }
    
    analyzeEyeColor(ctx, canvas, leftEye, rightEye) {
        const allEyePoints = [...leftEye, ...rightEye];
        let totalR = 0, totalG = 0, totalB = 0, count = 0;
        
        allEyePoints.forEach(point => {
            const x = Math.floor(point.x);
            const y = Math.floor(point.y);
            
            for (let dx = -3; dx <= 3; dx++) {
                for (let dy = -3; dy <= 3; dy++) {
                    const px = x + dx;
                    const py = y + dy;
                    if (px >= 0 && px < canvas.width && py >= 0 && py < canvas.height) {
                        const pixel = ctx.getImageData(px, py, 1, 1).data;
                        totalR += pixel[0];
                        totalG += pixel[1];
                        totalB += pixel[2];
                        count++;
                    }
                }
            }
        });
        
        return count > 0 ? { r: totalR/count, g: totalG/count, b: totalB/count } : { r: 0, g: 0, b: 0 };
    }
    
    analyzeHairColor(ctx, canvas, detection) {
        const box = detection.detection.box;
        const foreheadY = box.y + box.height * 0.1;
        const foreheadX = box.x + box.width / 2;
        
        let totalR = 0, totalG = 0, totalB = 0, count = 0;
        
        for (let dy = -30; dy <= -10; dy++) {
            for (let dx = -30; dx <= 30; dx++) {
                const px = Math.floor(foreheadX + dx);
                const py = Math.floor(foreheadY + dy);
                
                if (px >= 0 && px < canvas.width && py >= 0 && py < canvas.height) {
                    const pixel = ctx.getImageData(px, py, 1, 1).data;
                    totalR += pixel[0];
                    totalG += pixel[1];
                    totalB += pixel[2];
                    count++;
                }
            }
        }
        
        return count > 0 ? { r: totalR/count, g: totalG/count, b: totalB/count } : { r: 0, g: 0, b: 0 };
    }
    
    isBlondeHair(color) {
        const brightness = (color.r + color.g + color.b) / 3;
        const isYellowish = color.r > 180 && color.g > 150 && color.b < 150;
        const isLightBrown = brightness > 120 && color.r > color.b && color.g > color.b;
        
        return isYellowish || isLightBrown;
    }
    
    isBlueEyes(color) {
        const isBlue = color.b > color.r && color.b > color.g && color.b > 80;
        const isLightBlue = color.b > 100 && color.r < 150 && color.g < 150;
        const isBlueGray = color.b > 90 && Math.abs(color.r - color.g) < 30;
        
        return isBlue || isLightBlue || isBlueGray;
    }
    
    createSantaHatOnFace(detection) {
        const box = detection.detection.box;
        const videoWidth = this.video.videoWidth;
        const videoHeight = this.video.videoHeight;
        
        const x = (box.x + box.width / 2 - videoWidth / 2) / videoWidth * 10;
        const y = -(box.y - videoHeight / 2) / videoHeight * 8;
        const scale = box.width / videoWidth * 5;
        
        const hat = this.createSantaHat(scale * 0.5);
        hat.position.set(-x, y + 1, -3);
        
        this.scene.add(hat);
        this.santaHats.push(hat);
    }
    
    createSantaHat(scale = 1) {
        const group = new THREE.Group();
        
        const coneGeometry = new THREE.ConeGeometry(0.4 * scale, 1 * scale, 32);
        const coneMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xff0000,
            emissive: 0x330000,
            emissiveIntensity: 0.3
        });
        const cone = new THREE.Mesh(coneGeometry, coneMaterial);
        cone.position.y = 0.5 * scale;
        group.add(cone);
        
        const brimGeometry = new THREE.CylinderGeometry(0.5 * scale, 0.5 * scale, 0.15 * scale, 32);
        const brimMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xffffff,
            emissive: 0x333333,
            emissiveIntensity: 0.2
        });
        const brim = new THREE.Mesh(brimGeometry, brimMaterial);
        group.add(brim);
        
        const pomponGeometry = new THREE.SphereGeometry(0.15 * scale, 16, 16);
        const pomponMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xffffff,
            emissive: 0x333333,
            emissiveIntensity: 0.3
        });
        const pompon = new THREE.Mesh(pomponGeometry, pomponMaterial);
        pompon.position.y = 1.1 * scale;
        pompon.position.x = 0.15 * scale;
        group.add(pompon);
        
        group.rotation.z = -0.2;
        
        return group;
    }
    
    addARObject() {
        const objectType = this.objectSelect.value;
        let mesh;
        
        switch(objectType) {
            case 'robot':
                mesh = this.createRobot();
                break;
            case 'cube':
                const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
                const cubeMaterial = new THREE.MeshPhongMaterial({
                    color: 0x00ff88,
                    emissive: 0x00ff88,
                    emissiveIntensity: 0.2
                });
                mesh = new THREE.Mesh(cubeGeometry, cubeMaterial);
                break;
            case 'sphere':
                const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
                const sphereMaterial = new THREE.MeshPhongMaterial({
                    color: 0xff6b6b,
                    emissive: 0xff6b6b,
                    emissiveIntensity: 0.3,
                    transparent: true,
                    opacity: 0.8
                });
                mesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
                break;
            case 'torus':
                const torusGeometry = new THREE.TorusKnotGeometry(0.4, 0.1, 100, 16);
                const torusMaterial = new THREE.MeshPhongMaterial({
                    color: 0xffd93d,
                    emissive: 0xffd93d,
                    emissiveIntensity: 0.2
                });
                mesh = new THREE.Mesh(torusGeometry, torusMaterial);
                break;
            case 'crystal':
                const crystalGeometry = new THREE.OctahedronGeometry(0.6, 0);
                const crystalMaterial = new THREE.MeshPhongMaterial({
                    color: 0x6bcbff,
                    emissive: 0x6bcbff,
                    emissiveIntensity: 0.5,
                    transparent: true,
                    opacity: 0.85,
                    flatShading: true
                });
                mesh = new THREE.Mesh(crystalGeometry, crystalMaterial);
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
        
        group.userData.rotationSpeed = { x: 0.005, y: 0.02 };
        
        return group;
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.objects.forEach(obj => {
            if (obj.userData.rotationSpeed) {
                obj.rotation.x += obj.userData.rotationSpeed.x;
                obj.rotation.y += obj.userData.rotationSpeed.y;
            }
        });
        
        this.santaHats.forEach(hat => {
            hat.rotation.y += 0.01;
        });
        
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
