// ==========================================
// 3D BALLOON COLOR LEARNING GAME
// ==========================================

class BalloonColorGame {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.currentBalloon = null;
        this.particles = [];
        this.isPopping = false;
        this.colorIndex = 0;
        
        // Color learning sequence
        this.colors = [
            { name: 'red', hex: 0xFF4757, speech: 'Red' },
            { name: 'blue', hex: 0x3742FA, speech: 'Blue' },
            { name: 'yellow', hex: 0xFFC312, speech: 'Yellow' },
            { name: 'green', hex: 0x06D6A0, speech: 'Green' },
            { name: 'orange', hex: 0xFF6B35, speech: 'Orange' },
            { name: 'purple', hex: 0xA55EEA, speech: 'Purple' },
            { name: 'pink', hex: 0xFF69B4, speech: 'Pink' },
        ];
        
        this.init();
    }
    
    async init() {
        console.log('🎈 Starting Balloon Color Game...');
        
        this.setupThreeJS();
        this.setupLights();
        this.addBackground();
        this.setupEventListeners();
        
        // Wait for audio permission
        document.addEventListener('audioEnabled', () => {
            setTimeout(() => {
                this.speak("Let's learn colors! Tap the balloons!");
                this.spawnBalloon();
            }, 1000);
        });
        
        this.animate();
        console.log('✅ Game ready!');
    }
    
    setupThreeJS() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        this.scene.fog = new THREE.Fog(0x87CEEB, 20, 50);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 2, 10);
        this.camera.lookAt(0, 2, 0);
        
        // Renderer
        const canvas = document.getElementById('gameCanvas');
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas,
            antialias: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Handle resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        // Sun (directional light)
        const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
        sunLight.position.set(10, 15, 5);
        sunLight.castShadow = true;
        sunLight.shadow.camera.left = -10;
        sunLight.shadow.camera.right = 10;
        sunLight.shadow.camera.top = 10;
        sunLight.shadow.camera.bottom = -10;
        this.scene.add(sunLight);
        
        // Spotlight for drama
        const spotlight = new THREE.SpotLight(0xffffff, 0.5);
        spotlight.position.set(0, 10, 10);
        spotlight.angle = Math.PI / 6;
        this.scene.add(spotlight);
    }
    
    addBackground() {
        // Add some fluffy clouds
        const cloudGeometry = new THREE.SphereGeometry(1, 8, 8);
        const cloudMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xffffff,
            transparent: true,
            opacity: 0.8
        });
        
        for (let i = 0; i < 8; i++) {
            const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
            cloud.position.set(
                (Math.random() - 0.5) * 30,
                8 + Math.random() * 8,
                -15 - Math.random() * 10
            );
            cloud.scale.set(
                2 + Math.random() * 2,
                0.8 + Math.random() * 0.5,
                1.5 + Math.random() * 1.5
            );
            this.scene.add(cloud);
            
            // Animate clouds
            cloud.userData.drift = (Math.random() - 0.5) * 0.01;
        }
        
        // Ground plane (optional)
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x7EC850,
            side: THREE.DoubleSide 
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -5;
        ground.receiveShadow = true;
        this.scene.add(ground);
    }
    
    setupEventListeners() {
        // Click/touch to pop balloon
        const canvas = this.renderer.domElement;
        
        canvas.addEventListener('click', (e) => {
            this.handleTap(e.clientX, e.clientY);
        });
        
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleTap(touch.clientX, touch.clientY);
        }, { passive: false });
    }
    
    handleTap(x, y) {
        if (!this.currentBalloon || this.isPopping) return;
        
        // Raycast to check if balloon was clicked
        const mouse = new THREE.Vector2(
            (x / window.innerWidth) * 2 - 1,
            -(y / window.innerHeight) * 2 + 1
        );
        
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);
        
        const intersects = raycaster.intersectObject(this.currentBalloon.balloon);
        
        if (intersects.length > 0) {
            this.popBalloon();
        }
    }
    
    spawnBalloon() {
        if (this.isPopping) return;
        
        // Get next color
        const colorData = this.colors[this.colorIndex % this.colors.length];
        this.colorIndex++;
        
        console.log(`🎈 Spawning ${colorData.name} balloon`);
        
        // Create balloon (sphere)
        const balloonGeometry = new THREE.SphereGeometry(1.5, 32, 32);
        const balloonMaterial = new THREE.MeshPhongMaterial({
            color: colorData.hex,
            shininess: 100,
            specular: 0xffffff,
            emissive: colorData.hex,
            emissiveIntensity: 0.2
        });
        
        const balloon = new THREE.Mesh(balloonGeometry, balloonMaterial);
        balloon.position.set(0, -3, 0);
        balloon.castShadow = true;
        balloon.scale.set(0.1, 0.1, 0.1); // Start small
        this.scene.add(balloon);
        
        // Create string
        const stringGeometry = new THREE.CylinderGeometry(0.02, 0.02, 2, 8);
        const stringMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
        const string = new THREE.Mesh(stringGeometry, stringMaterial);
        string.position.y = -1.5;
        balloon.add(string);
        
        // Create knot at bottom of string
        const knotGeometry = new THREE.SphereGeometry(0.08, 8, 8);
        const knot = new THREE.Mesh(knotGeometry, stringMaterial);
        knot.position.y = -2.5;
        balloon.add(knot);
        
        this.currentBalloon = {
            balloon: balloon,
            colorData: colorData,
            spawnTime: Date.now(),
            rotationSpeed: 0.3 + Math.random() * 0.3,
            floatSpeed: 0.015,
            wobble: Math.random() * Math.PI * 2,
            speechTimer: 0
        };
        
        // Initial speech
        setTimeout(() => {
            this.speakColor(colorData.speech);
        }, 800);
    }
    
    popBalloon() {
        if (!this.currentBalloon || this.isPopping) return;
        
        this.isPopping = true;
        const balloon = this.currentBalloon.balloon;
        const colorData = this.currentBalloon.colorData;
        
        console.log(`💥 Popping ${colorData.name} balloon!`);
        
        // Celebration speech
        this.speak(`Yes! ${colorData.speech}! Great job!`);
        if (window.audioSystem?.playSoundEffect) {
            window.audioSystem.playSoundEffect('pop');
        }
        
        // Create explosion particles
        this.createExplosion(balloon.position, colorData.hex);
        
        // Remove balloon
        this.scene.remove(balloon);
        this.currentBalloon = null;
        
        // Spawn next balloon after delay
        setTimeout(() => {
            this.isPopping = false;
            this.spawnBalloon();
        }, 2000);
    }
    
    createExplosion(position, color) {
        const particleCount = 50;
        
        for (let i = 0; i < particleCount; i++) {
            // Random confetti shapes
            let geometry;
            const shapeType = Math.floor(Math.random() * 3);
            
            if (shapeType === 0) {
                geometry = new THREE.BoxGeometry(0.15, 0.15, 0.02);
            } else if (shapeType === 1) {
                geometry = new THREE.SphereGeometry(0.08, 6, 6);
            } else {
                geometry = new THREE.ConeGeometry(0.08, 0.2, 4);
            }
            
            // Bright colors for confetti
            const colors = [0xFF1493, 0x00FFFF, 0xFF4500, 0xADFF2F, 0xFF69B4, 0xFFD700];
            const particleColor = colors[Math.floor(Math.random() * colors.length)];
            
            const material = new THREE.MeshLambertMaterial({ color: particleColor });
            const particle = new THREE.Mesh(geometry, material);
            
            particle.position.copy(position);
            
            // Random velocity
            const speed = 0.2 + Math.random() * 0.3;
            const angle = Math.random() * Math.PI * 2;
            const elevation = Math.random() * Math.PI;
            
            particle.userData = {
                velocity: new THREE.Vector3(
                    Math.cos(angle) * Math.sin(elevation) * speed,
                    Math.cos(elevation) * speed,
                    Math.sin(angle) * Math.sin(elevation) * speed
                ),
                rotation: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.2,
                    (Math.random() - 0.5) * 0.2,
                    (Math.random() - 0.5) * 0.2
                ),
                life: 1.0,
                gravity: -0.01
            };
            
            this.scene.add(particle);
            this.particles.push(particle);
        }
    }
    
    updateBalloon(deltaTime) {
        if (!this.currentBalloon) return;
        
        const balloon = this.currentBalloon.balloon;
        const data = this.currentBalloon;
        
        // Grow balloon
        if (balloon.scale.x < 1) {
            balloon.scale.x += 0.02;
            balloon.scale.y += 0.02;
            balloon.scale.z += 0.02;
        }
        
        // Float upward
        balloon.position.y += data.floatSpeed;
        
        // Rotate
        balloon.rotation.y += data.rotationSpeed * deltaTime;
        
        // Gentle wobble
        data.wobble += deltaTime * 2;
        balloon.position.x = Math.sin(data.wobble) * 0.3;
        
        // Repeat speech every 3 seconds
        const elapsed = (Date.now() - data.spawnTime) / 1000;
        if (elapsed > data.speechTimer + 3) {
            data.speechTimer = Math.floor(elapsed / 3) * 3;
            this.speakColor(data.colorData.speech);
        }
        
        // Remove if too high
        if (balloon.position.y > 12) {
            this.speak("Oh no! It flew away! Let's try another one!");
            this.scene.remove(balloon);
            this.currentBalloon = null;
            setTimeout(() => {
                this.spawnBalloon();
            }, 1500);
        }
    }
    
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            const data = particle.userData;
            
            // Update position
            particle.position.add(data.velocity);
            
            // Apply gravity
            data.velocity.y += data.gravity;
            
            // Rotate
            particle.rotation.x += data.rotation.x;
            particle.rotation.y += data.rotation.y;
            particle.rotation.z += data.rotation.z;
            
            // Fade out
            data.life -= 0.015;
            particle.material.opacity = data.life;
            particle.material.transparent = true;
            
            // Remove dead particles
            if (data.life <= 0 || particle.position.y < -5) {
                this.scene.remove(particle);
                this.particles.splice(i, 1);
            }
        }
    }
    
    updateClouds() {
        this.scene.children.forEach(child => {
            if (child.userData.drift !== undefined) {
                child.position.x += child.userData.drift;
                
                // Wrap around
                if (child.position.x > 20) child.position.x = -20;
                if (child.position.x < -20) child.position.x = 20;
            }
        });
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = 0.016; // ~60fps
        
        this.updateBalloon(deltaTime);
        this.updateParticles(deltaTime);
        this.updateClouds();
        
        this.renderer.render(this.scene, this.camera);
    }
    
    // Audio helpers
    speakColor(colorName) {
        if (window.audioSystem?.isInitialized) {
            window.audioSystem.speakColor(colorName);
        } else {
            this.speak(colorName);
        }
    }
    
    speak(text) {
        if (window.audioSystem?.isInitialized) {
            window.audioSystem.speak(text);
        } else if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.8;
            utterance.pitch = 1.3;
            utterance.volume = 0.9;
            speechSynthesis.speak(utterance);
        }
    }
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    window.balloonGame = new BalloonColorGame();
});

console.log('🎈 Balloon Color Game loaded!');