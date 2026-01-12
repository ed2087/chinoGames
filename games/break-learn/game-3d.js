class BreakLearnGame3D {
    constructor() {
        this.container = document.getElementById('gameContainer');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.physicsManager = null;
        this.materialManager = null;
        this.objectFactory = null;
        this.particleSystem = null;
        
        // Game state
        this.currentObject = null;
        this.currentMaterial = 'wood';
        this.fragments = [];
        this.isDestroying = false;
        this.hitCount = 0;
        
        // Raycasting for mouse interaction updateCameraFollow
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // Timing
        this.clock = new THREE.Clock();
        
        this.init();
    }
    
    async init() {
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupLighting();
        this.setupPhysics();
        this.setupEventListeners();
        
        // Initialize managers
        this.materialManager = new MaterialManager();
        this.objectFactory = new ObjectFactory(this.scene, this.physicsManager, this.materialManager);
        this.particleSystem = new ParticleSystem(this.scene);
        
        // Create first object
        this.createNewObject();
        
        // Start game loop
        this.startGameLoop();
        
        // Audio welcome
        document.addEventListener('audioEnabled', () => {
            setTimeout(() => {
                if (window.audioSystem?.isInitialized) {
                    window.audioSystem.speak("Welcome to Break and Learn 3D! Tap objects to destroy them!");
                }
            }, 1000);
        });
        
        console.log('🎮 Break & Learn 3D initialized!');
    }
    
setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e); // Back to dark
    
    // Add fog for depth
    this.scene.fog = new THREE.Fog(0x1a1a2e, 10, 50);
}

    
    setupCamera() {
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 100);
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);
    }
    
    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Enable shadows
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Tone mapping for better colors
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        
        this.container.appendChild(this.renderer.domElement);
        
        // Handle resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }
    
setupLighting() {
    // Bright ambient light for backrooms feel updateCameraFollow
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
    this.scene.add(ambientLight);
    
    // Main directional light (like fluorescent lighting)
    const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1.2);
    directionalLight.position.set(10, 15, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    this.scene.add(directionalLight);
    
    // Additional fill lights for even illumination
    const fillLight1 = new THREE.DirectionalLight(0xFFFFFF, 0.4);
    fillLight1.position.set(-10, 10, -5);
    this.scene.add(fillLight1);
    
    const fillLight2 = new THREE.DirectionalLight(0xFFFFFF, 0.3);
    fillLight2.position.set(0, 10, -10);
    this.scene.add(fillLight2);
}
    
    setupPhysics() {
        this.physicsManager = new PhysicsManager();
    }
    
    setupEventListeners() {
        // Material selection
        document.querySelectorAll('.material-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.material-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentMaterial = btn.dataset.material;
                this.createNewObject();
            });
        });
        
        // New object button
        document.getElementById('newObjectBtn').addEventListener('click', () => {
            this.createNewObject();
        });
        
        // Canvas interaction
        this.renderer.domElement.addEventListener('click', (e) => this.handleClick(e));
        this.renderer.domElement.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleClick(e.touches[0]);
        });
        
        this.renderer.domElement.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    }
    
    handleClick(e) {
        if (!this.currentObject || this.isDestroying) return;
        
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.currentObject.mesh);
        
        if (intersects.length > 0) {
            const intersection = intersects[0];
            this.hitObject(intersection.point);
        }
    }
    
    handleMouseMove(e) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        
        // Highlight object on hover
        if (this.currentObject && !this.isDestroying) {
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObject(this.currentObject.mesh);
            
            if (intersects.length > 0) {
                this.renderer.domElement.style.cursor = 'pointer';
                // Add subtle glow effect
                this.currentObject.mesh.material.emissive.setHex(0x111111);
            } else {
                this.renderer.domElement.style.cursor = 'default';
                this.currentObject.mesh.material.emissive.setHex(0x000000);
            }
        }
    }
    
    hitObject(impactPoint) {
        this.hitCount++;
        const materialProps = this.materialManager.getMaterialProperties(this.currentMaterial);
        
        // Visual impact effect
        this.createImpactEffect(impactPoint);
        
        // Apply force to physics body
        const forceDirection = new CANNON.Vec3(
            impactPoint.x - this.currentObject.body.position.x,
            impactPoint.y - this.currentObject.body.position.y,
            impactPoint.z - this.currentObject.body.position.z
        );
        forceDirection.normalize();
        
        const impulseStrength = 5;
        this.currentObject.body.applyImpulse(
            forceDirection.scale(impulseStrength),
            new CANNON.Vec3(impactPoint.x, impactPoint.y, impactPoint.z)
        );
        
        // Play hit sound
        this.playHitSound();
        
        // Update hit points
        this.currentObject.hitPoints--;
        
        // Check if object should be destroyed
        if (this.currentObject.hitPoints <= 0) {
            this.destroyObject(impactPoint);
        } else {
            // Show damage effect
            this.showDamageEffect();
        }
    }
    
    createImpactEffect(impactPoint) {
        // Create small particle burst
        this.particleSystem.createExplosion(impactPoint, this.currentMaterial, 0.3);
        
        // Screen shake
        this.addScreenShake(2);
    }
    
    playHitSound() {
        // Use the existing audio system methods
        if (window.audioSystem?.isInitialized) {
            switch (this.currentMaterial) {
                case 'wood':
                    this.generateWoodSound();
                    break;
                case 'glass':
                    this.generateGlassSound();
                    break;
                case 'ice':
                    this.generateIceSound();
                    break;
                case 'metal':
                    this.generateMetalSound();
                    break;
            }
        }
    }
    
    // Copy sound generation methods from original game
    generateWoodSound() {
        if (!window.audioSystem?.audioContext) return;
        
        const audioContext = window.audioSystem.audioContext;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    }
    
    generateGlassSound() {
        if (!window.audioSystem?.audioContext) return;
        
        const audioContext = window.audioSystem.audioContext;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    }
    
    generateIceSound() {
        if (!window.audioSystem?.audioContext) return;
        
        const audioContext = window.audioSystem.audioContext;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.4);
        
        gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);
    }
    
    generateMetalSound() {
        if (!window.audioSystem?.audioContext) return;
        
        const audioContext = window.audioSystem.audioContext;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.5);
        
        gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }
    
    showDamageEffect() {
        // Flash effect
        if (this.currentObject) {
            const originalEmissive = this.currentObject.mesh.material.emissive.getHex();
            this.currentObject.mesh.material.emissive.setHex(0xffffff);
            
            setTimeout(() => {
                if (this.currentObject) {
                    this.currentObject.mesh.material.emissive.setHex(originalEmissive);
                }
            }, 100);
        }
    }
    
    destroyObject(impactPoint) {
        if (!this.currentObject) return;
        
        this.isDestroying = true;
        
        // Create massive explosion effect
        this.particleSystem.createExplosion(impactPoint, this.currentMaterial, 2.0);
        
        // Create fragments
        const fragments = this.objectFactory.createFragments(this.currentObject, impactPoint, 12);
        this.fragments.push(...fragments);
        
        // Screen shake
        this.addScreenShake(8);
        
        // Play destruction sound
        this.playDestructionSound();
        
        // Announce destruction
        this.announceDestruction();
        
        // Remove original object
        this.scene.remove(this.currentObject.mesh);
        this.physicsManager.removeBody(this.currentObject.body);
        this.currentObject = null;
        
        // Clean up fragments after delay
        setTimeout(() => {
            this.cleanupFragments();
            this.createNewObject();
            this.isDestroying = false;
        }, 3000);
    }
    
    cleanupFragments() {
        this.fragments.forEach(fragment => {
            this.scene.remove(fragment.mesh);
            this.physicsManager.removeBody(fragment.body);
        });
        this.fragments = [];
    }
    
    addScreenShake(intensity) {
        const duration = 300;
        const startTime = Date.now();
        
        const shake = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed < duration) {
                const progress = elapsed / duration;
                const currentIntensity = intensity * (1 - progress);
                
                const offsetX = (Math.random() - 0.5) * currentIntensity * 0.01;
                const offsetY = (Math.random() - 0.5) * currentIntensity * 0.01;
                
                this.camera.position.x += offsetX;
                this.camera.position.y += offsetY;
                
                requestAnimationFrame(shake);
            }
        };
        
        shake();
    }
    
    playDestructionSound() {
        if (window.audioSystem?.isInitialized) {
            window.audioSystem.playSoundEffect('success');
        }
    }
    
    announceDestruction() {
        if (window.audioSystem?.isInitialized) {
            const material = this.currentMaterial;
            const objectName = this.getCurrentObjectName();
            const phrases = [
                `${objectName} destroyed!`,
                `The ${material} ${objectName} is broken!`,
                `Smashed the ${objectName}!`,
                `Great job breaking it!`
            ];
            
            const phrase = phrases[Math.floor(Math.random() * phrases.length)];
            setTimeout(() => {
                window.audioSystem.speak(phrase);
            }, 500);
        }
    }
    
    getCurrentObjectName() {
        if (this.currentObject) {
            return this.currentObject.name;
        }
        return 'object';
    }
    
    createNewObject() {
        // Clean up existing object
        if (this.currentObject) {
            this.scene.remove(this.currentObject.mesh);
            this.physicsManager.removeBody(this.currentObject.body);
        }
        
        this.cleanupFragments();
        this.hitCount = 0;
        
        // Select random object type
        const types = ['cube', 'sphere', 'cylinder'];
        const numbers = ['1', '2', '3', '4', '5'];
        
        const useNumber = Math.random() > 0.5;
        
        if (useNumber) {
            const number = numbers[Math.floor(Math.random() * numbers.length)];
            this.currentObject = this.objectFactory.createNumberObject(number, this.currentMaterial, 5.0);
        } else {
            const shape = types[Math.floor(Math.random() * types.length)];
            this.currentObject = this.objectFactory.createShape(shape, this.currentMaterial, 5.0);
        }
        
        // Update UI
        const materialProps = this.materialManager.getMaterialProperties(this.currentMaterial);
        document.getElementById('objectLabel').textContent = 
            `Break the ${this.currentMaterial} ${this.currentObject.name}! (${this.currentObject.hitPoints}/${materialProps.hitPoints})`;
        
        // Announce new object
        if (window.audioSystem?.isInitialized) {
            setTimeout(() => {
                window.audioSystem.speak(`Break the ${this.currentMaterial} ${this.currentObject.name}!`);
            }, 300);
        }
    }
    
    handleResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
    }
    
    startGameLoop() {
        const animate = () => {
            requestAnimationFrame(animate);
            
            const deltaTime = this.clock.getDelta();
            
            // Update physics
            this.physicsManager.step(deltaTime);
            
            // Update particle system
            this.particleSystem.update(deltaTime);
            
            // Sync Three.js meshes with Cannon.js bodies
            this.syncPhysicsBodies();
            
            // Update fragment lifetimes
            this.updateFragments(deltaTime);
            
            // Update UI
            this.updateUI();
            
            // Render scene
            this.renderer.render(this.scene, this.camera);
        };
        
        animate();
    }
    
syncPhysicsBodies() {
    if (this.currentObject) {
        // Sync object position
        this.currentObject.mesh.position.copy(this.currentObject.body.position);
        this.currentObject.mesh.quaternion.copy(this.currentObject.body.quaternion);
        
        // Camera follows object smoothly
        this.updateCameraFollow();
    }
    
    // Sync fragments
    this.fragments.forEach(fragment => {
        fragment.mesh.position.copy(fragment.body.position);
        fragment.mesh.quaternion.copy(fragment.body.quaternion);
    });
}

updateCameraFollow() {
    if (!this.currentObject) return;
    
    const objectPos = this.currentObject.body.position;
    
    // Target camera position (offset from object)
    const targetCameraPos = new THREE.Vector3(
        objectPos.x,
        objectPos.y + 8,  // 8 units above
        objectPos.z + 12  // 12 units back
    );
    
    // Smooth camera movement
    const lerpFactor = 0.08;
    this.camera.position.lerp(targetCameraPos, lerpFactor);
    
    // Make camera look at the object
    const lookAtTarget = new THREE.Vector3(objectPos.x, objectPos.y, objectPos.z);
    this.camera.lookAt(lookAtTarget);
}
    
    updateFragments(deltaTime) {
        for (let i = this.fragments.length - 1; i >= 0; i--) {
            const fragment = this.fragments[i];
            fragment.life -= deltaTime;
            
            // Fade out fragments
            const alpha = Math.max(0, fragment.life / 10.0);
            fragment.mesh.material.opacity = alpha;
            
            if (fragment.life <= 0) {
                this.scene.remove(fragment.mesh);
                this.physicsManager.removeBody(fragment.body);
                this.fragments.splice(i, 1);
            }
        }
    }
    
    updateUI() {
        if (this.currentObject && !this.isDestroying) {
            const remaining = this.currentObject.hitPoints;
            const max = this.currentObject.maxHitPoints;
            document.getElementById('objectLabel').textContent = 
                `Break the ${this.currentMaterial} ${this.currentObject.name}! (${remaining}/${max} hits left)`;
        }
    }
}

// Initialize the game  setupScene
document.addEventListener('DOMContentLoaded', () => {
    window.breakLearnGame3D = new BreakLearnGame3D();
});