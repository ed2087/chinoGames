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
        this.currentMaterial = 'pokeball';
        this.fragments = [];
        this.isDestroying = false;
        this.hitCount = 0;

        // The Pokemon inside the current ball is fetched as soon as the
        // ball spawns, so it's ready the instant the ball cracks open.
        this.pendingPokemonPromise = null;
        this.activeReveals = [];
        
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

        console.log('🎮 Break & Learn 3D initialized!');
    }
    
setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x8ED1FC); // Open sky

    // Fog matches the sky so the grass field fades naturally at the horizon
    this.scene.fog = new THREE.Fog(0x8ED1FC, 20, 65);

    this.createGroundMesh();
}

createGroundMesh() {
    const groundGeometry = new THREE.PlaneGeometry(90, 90);
    const groundMaterial = new THREE.MeshStandardMaterial({
        map: this.createGrassTexture(),
        roughness: 0.95,
        metalness: 0
    });

    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -5; // matches the invisible physics ground plane
    ground.receiveShadow = true;
    this.scene.add(ground);
}

createGrassTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#5FA83B';
    ctx.fillRect(0, 0, 256, 256);

    // Scatter short blade-like strokes for a natural, textured field look
    for (let i = 0; i < 900; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        ctx.strokeStyle = Math.random() > 0.5 ? '#4C8A2C' : '#72C24E';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (Math.random() - 0.5) * 4, y - 4 - Math.random() * 4);
        ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(18, 18);
    return texture;
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
    // Soft sky-tinted ambient light for an outdoor field feel
    const ambientLight = new THREE.AmbientLight(0xE8F4FF, 0.65);
    this.scene.add(ambientLight);

    // Main directional light - warm like sunlight
    const directionalLight = new THREE.DirectionalLight(0xFFF4D6, 1.2);
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
            this.playHitBounceAnimation(this.currentObject.mesh);
        }
    }

    // Squash-and-stretch "boop" reaction played on every hit that doesn't
    // break the ball. Only touches mesh.scale, so it never fights with the
    // physics-driven position/rotation sync in syncPhysicsBodies().
    playHitBounceAnimation(mesh) {
        if (!mesh) return;

        const duration = 320;
        const startTime = performance.now();
        const squashX = 1.35, squashY = 0.65, squashZ = 1.35;

        const easeOutElastic = (t) => {
            const c4 = (2 * Math.PI) / 3;
            return t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -8 * t) * Math.sin((t * 8 - 0.75) * c4) + 1;
        };

        const animate = () => {
            // Bail out if this ball has since been destroyed or swapped
            if (!this.currentObject || this.currentObject.mesh !== mesh) return;

            const elapsed = performance.now() - startTime;
            const t = Math.min(1, elapsed / duration);
            const ease = easeOutElastic(t);

            mesh.scale.set(
                squashX + (1 - squashX) * ease,
                squashY + (1 - squashY) * ease,
                squashZ + (1 - squashZ) * ease
            );

            if (t < 1) {
                requestAnimationFrame(animate);
            } else {
                mesh.scale.set(1, 1, 1);
            }
        };

        animate();
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
            this.generatePokeballSound();
        }
    }

    generatePokeballSound() {
        if (!window.audioSystem?.audioContext) return;

        const audioContext = window.audioSystem.audioContext;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // A springy plastic "boink" rather than a break sound
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(500, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(700, audioContext.currentTime + 0.06);
        oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.15);

        gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);
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

        // Pop out the Pokemon that was inside
        this.revealPokemon(impactPoint);

        // Remove original object
        this.scene.remove(this.currentObject.mesh);
        this.physicsManager.removeBody(this.currentObject.body);
        this.currentObject = null;

        // Clean up fragments after delay - long enough that the Pokemon
        // reveal (sprite + cry + full name/type sentence) always finishes
        // before the next ball shows up and its announcement cuts it off.
        setTimeout(() => {
            this.cleanupFragments();
            this.createNewObject();
            this.isDestroying = false;
        }, 5800);
    }

    // Loads the Pokemon that was pre-fetched when this ball spawned, and
    // pops it into the scene as a billboard sprite (always faces the
    // camera) with a little bounce-in animation.
    async revealPokemon(position) {
        let pokemon = null;
        try {
            pokemon = await this.pendingPokemonPromise;
        } catch (err) {
            console.warn('Pokemon reveal failed:', err);
        }

        if (!pokemon) {
            if (window.audioSystem?.isInitialized) {
                setTimeout(() => window.audioSystem.speak('The Poke Ball popped open!'), 300);
            }
            return;
        }

        const loader = new THREE.TextureLoader();
        loader.setCrossOrigin('anonymous');
        loader.load(pokemon.spriteUrl, (texture) => {
            const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
            const sprite = new THREE.Sprite(spriteMaterial);
            sprite.position.set(position.x, position.y + 1, position.z);
            sprite.scale.set(0.01, 0.01, 0.01);
            this.scene.add(sprite);
            this.activeReveals.push(sprite);

            // The actual Pokemon cry, right as it pops into view
            this.playPokemonCry(pokemon.cryUrl);

            // Master Ball catches are shiny - give them a holographic sparkle
            if (pokemon.shiny) {
                this.playHolographicSparkle(position);
            }

            const targetScale = 5.2;
            const startTime = performance.now();
            const duration = 700;

            const easeOutBack = (t) => {
                const c1 = 1.70158;
                const c3 = c1 + 1;
                return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
            };

            const bounce = () => {
                const elapsed = performance.now() - startTime;
                const t = Math.min(1, elapsed / duration);
                const scale = Math.max(0, targetScale * easeOutBack(t));
                sprite.scale.set(scale, scale, scale);
                sprite.position.y = position.y + 1 + Math.sin(t * Math.PI) * 1.0;

                if (t < 1) {
                    requestAnimationFrame(bounce);
                }
            };
            bounce();

            // Hold the Pokemon on screen long enough to actually look at it
            // and hear the full announcement, then fade out
            setTimeout(() => {
                const fadeStart = performance.now();
                const fadeDuration = 800;
                const fade = () => {
                    const elapsed = performance.now() - fadeStart;
                    const t = Math.min(1, elapsed / fadeDuration);
                    spriteMaterial.opacity = 1 - t;
                    if (t < 1) {
                        requestAnimationFrame(fade);
                    } else {
                        this.scene.remove(sprite);
                        this.activeReveals = this.activeReveals.filter(s => s !== sprite);
                    }
                };
                fade();
            }, 4700);
        });

        if (window.audioSystem?.isInitialized) {
            const name = pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1);
            const typeText = pokemon.types && pokemon.types.length
                ? ` It's a ${pokemon.types.join(' and ')} type!`
                : '';
            // Wait a beat so the cry gets to play out before the voice speaks
            setTimeout(() => {
                window.audioSystem.speak(`It's ${name}! ${typeText}`);
            }, 900);
        }
    }

    playPokemonCry(cryUrl) {
        if (!cryUrl) return;
        try {
            const audio = new Audio(cryUrl);
            audio.volume = 0.8;
            audio.play().catch(err => console.warn('Pokemon cry playback blocked:', err));
        } catch (err) {
            console.warn('Pokemon cry failed:', err);
        }
    }

    // Master Ball catches come out shiny - twinkling rainbow bursts around
    // the reveal give it a "holographic card" feel.
    playHolographicSparkle(position) {
        const emitBurst = () => {
            for (let i = 0; i < 14; i++) {
                const angle = Math.random() * Math.PI * 2;
                const radius = 1.5 + Math.random() * 1.8;
                this.particleSystem.emitParticle({
                    position: new THREE.Vector3(
                        position.x + Math.cos(angle) * radius,
                        position.y + 1 + (Math.random() - 0.2) * 2.5,
                        position.z + Math.sin(angle) * radius
                    ),
                    velocity: new THREE.Vector3(
                        (Math.random() - 0.5) * 2,
                        Math.random() * 2 + 1,
                        (Math.random() - 0.5) * 2
                    ),
                    color: this.rainbowColor(Math.random()),
                    size: 3 + Math.random() * 3,
                    lifetime: 1.4 + Math.random()
                });
            }
        };

        emitBurst();
        let bursts = 1;
        const interval = setInterval(() => {
            emitBurst();
            bursts++;
            if (bursts >= 5) clearInterval(interval);
        }, 500);
    }

    rainbowColor(hue) {
        const i = Math.floor(hue * 6);
        const f = hue * 6 - i;
        switch (i % 6) {
            case 0: return [1, f, 0];
            case 1: return [1 - f, 1, 0];
            case 2: return [0, 1, f];
            case 3: return [0, 1 - f, 1];
            case 4: return [f, 0, 1];
            default: return [1, 0, 1 - f];
        }
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
    
    createNewObject() {
        // Clean up existing object
        if (this.currentObject) {
            this.scene.remove(this.currentObject.mesh);
            this.physicsManager.removeBody(this.currentObject.body);
        }

        this.cleanupFragments();
        this.hitCount = 0;

        // Always a Poke Ball now - no more cubes/numbers/letters
        this.currentObject = this.objectFactory.createPokeball(this.currentMaterial, 4.6);

        // Start fetching the Pokemon inside right away, so it's ready
        // the instant the ball cracks open. Each ball type draws from its
        // own tier: Poke Ball = common, Great Ball = starters/favorites,
        // Ultra Ball = strong evolved Pokemon, Master Ball = legendary.
        this.pendingPokemonPromise = PokemonSource.fetchRandomForTier(this.currentMaterial).catch(err => {
            console.warn('Pokemon prefetch failed:', err);
            return null;
        });

        // Update UI text only - no voice line here, it got repetitive
        // every single round. The Pokemon reveal announcement is the
        // moment worth speaking out loud.
        const materialProps = this.materialManager.getMaterialProperties(this.currentMaterial);
        document.getElementById('objectLabel').textContent =
            `Crack open the ${materialProps.label}! (${this.currentObject.hitPoints}/${materialProps.hitPoints} hits left)`;
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
            const materialProps = this.materialManager.getMaterialProperties(this.currentMaterial);
            const remaining = this.currentObject.hitPoints;
            const max = this.currentObject.maxHitPoints;
            document.getElementById('objectLabel').textContent =
                `Crack open the ${materialProps.label}! (${remaining}/${max} hits left)`;
        }
    }
}

// Initialize the game  setupScene
document.addEventListener('DOMContentLoaded', () => {
    window.breakLearnGame3D = new BreakLearnGame3D();
});