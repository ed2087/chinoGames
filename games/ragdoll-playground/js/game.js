// ==========================================
// MAIN GAME CONTROLLER - RAGDOLL PLAYGROUND
// Orchestrates all systems and manages the complete game experience
// ==========================================

class RagdollPlaygroundGame {
    
    constructor(canvasId = 'gameCanvas') {
        // Get canvas element
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas element with ID '${canvasId}' not found`);
        }
        
// Core utilities
        this.mathUtils = window.MathUtils;
        this.deviceUtils = window.DeviceUtils;
        
        // Game configuration
        this.config = {
            // Physics settings
            gravity: { x: 0, y: 1 },
            worldBounds: { 
                width: this.canvas.clientWidth, 
                height: this.canvas.clientHeight 
            },
            
            // Ragdoll settings
            maxRagdolls: 5,
            spawnCooldown: 500, // ms between spawns
            defaultRagdollType: 'human',
            
            // Interaction settings
            grabRadius: 50,
            throwMultiplier: 0.8,
            minThrowSpeed: 50,
            maxThrowSpeed: 1000,
            
            // Visual settings
            showUI: true,
            showDebugInfo: false,
            particleEffects: true,
            screenEffects: true,
            
            // Audio settings
            enableAudio: true,
            welcomeMessage: true,
            contextualAudio: true,
            
            // Performance settings
            targetFPS: 60,
            adaptiveQuality: true,
            
            // Educational settings
            showPhysicsInfo: false,
            enableLearningMode: true
        };
        
        // Game state
        this.isInitialized = false;
        this.isRunning = false;
        this.isPaused = false;
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.deltaTime = 16.67;
        this.fps = 60;
        
        // Core systems (initialized in init())
        this.physics = null;
        this.particleSystem = null;
        this.renderer = null;
        this.uiRenderer = null;
        this.gameAudio = null;
        
        // Game objects
        this.ragdolls = new Map(); // ragdollId -> ragdoll instance
        this.ragdollIdCounter = 0;
        this.activeGrab = null;
        this.lastSpawnTime = 0;
        
        // Input handling
        this.inputState = {
            isGrabbing: false,
            grabStart: null,
            grabCurrent: null,
            grabTarget: null,
            lastTouchTime: 0,
            touchCount: 0
        };
        
        // Game statistics
        this.stats = {
            totalRagdolls: 0,
            totalThrows: 0,
            totalCollisions: 0,
            totalBreaks: 0,
            playTime: 0,
            interactionCount: 0,
            maxRagdolls: 0,
            currentRagdollType: 'human'
        };
        
        // UI elements
        this.uiElements = new Map();
        
        console.log('🎮 RagdollPlaygroundGame created');
    }
    
    // ==========================================
    // INITIALIZATION
    // ==========================================
    
async init() {
    console.log('⚡ Initializing Ragdoll Playground...');
    
    try {
        // Initialize core systems
        await this.initializePhysics();
        await this.initializeRendering();
        await this.initializeAudio();
        await this.initializeUI();
        
        // Set up input handling
        this.setupInputHandling();
         
        // Set up canvas hideLoadingScreen
        this.setupCanvas();
        
        // Create initial game elements
        this.createInitialState();
        
        // Start game loop
        this.startGameLoop();
        
        this.isInitialized = true;
        this.isRunning = true;
        
        // Hide loading screen
        this.hideLoadingScreen();
        
        // Welcome message
        if (this.config.welcomeMessage && this.gameAudio) {
            setTimeout(() => {
                this.gameAudio.playVoice('gameStart');
                this.gameAudio.startMusic('playful');
            }, 1000);
        }
        
        console.log('✅ Ragdoll Playground initialized successfully');
        return true;
        
    } catch (error) {
        console.error('❌ Failed to initialize game:', error);
        return false;
    }
}

/**
 * Hide the loading screen startGrab
 */
hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.classList.add('hidden');
        
        // Remove from DOM after fade completes
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500); // Match the CSS transition duration
        
        console.log('🎯 Loading screen hidden');
    }
}
    
    async initializePhysics() {
        if (!window.PhysicsEngine) {
            throw new Error('PhysicsEngine not available');
        }
        
        this.physics = new window.PhysicsEngine({
            gravity: this.config.gravity,
            bounds: this.config.worldBounds,
            enableSleep: true,
            collisionDetection: true
        });
        
        await this.physics.init();
        
        // Set up physics event listeners
        this.physics.on('collision', (event) => this.onPhysicsCollision(event));
        this.physics.on('constraintBroken', (event) => this.onConstraintBroken(event));
        
        console.log('⚙️ Physics engine initialized');
    }
    
    async initializeRendering() {
        // Initialize particle system
        if (window.ParticleSystem) {
            this.particleSystem = new window.ParticleSystem(this.canvas, {
                maxParticles: this.deviceUtils.performance.level === 'high' ? 500 : 200
            });
        }
        
        // Initialize main renderer
        if (window.Renderer) {
            this.renderer = new window.Renderer(
                this.canvas, 
                this.physics, 
                this.particleSystem
            );
        }
        
        // Initialize UI renderer
        if (window.UIRenderer) {
            this.uiRenderer = new window.UIRenderer(this.canvas);
            this.uiRenderer.adaptForDevice();
        }
        
        console.log('🎨 Rendering systems initialized');
    }
    
    async initializeAudio() {
        if (this.config.enableAudio && window.GameAudio) {
            this.gameAudio = new window.GameAudio();
        }
        
        console.log(`🔊 Audio system ${this.gameAudio ? 'initialized' : 'disabled'}`);
    }
    
    async initializeUI() {
        if (!this.uiRenderer) return;
        
        // Create UI elements
        this.createUI();
        
        console.log('🖼️ UI initialized');
    }
    
    // ==========================================
    // UI CREATION
    // ==========================================
    
    createUI() {
        // Character type indicator
        this.uiRenderer.createCharacterIndicator(
            this.config.defaultRagdollType,
            { x: 20, y: 20 }
        );
        
        // Ragdoll counter
        this.uiRenderer.createRagdollCounter(
            0, 
            { x: 20, y: 120 }
        );
        
        // Performance indicator (hidden by default)
        this.uiRenderer.createPerformanceIndicator(
            { x: 20, y: 200 }
        );
        
        // Instructions overlay (auto-hide after 8 seconds)
        const instructions = [
            "Welcome to Ragdoll Playground!",
            "",
            "• Touch and drag ragdolls around",
            "• Throw them by swiping fast",
            "• Try different character types",
            "• Watch the physics in action!"
        ].join('\n');
        
        this.uiRenderer.createInstructionOverlay(instructions, 8000);
        
        // Create character selection buttons
        this.createCharacterButtons();
        
        console.log('🖼️ UI elements created');
    }
    
    createCharacterButtons() {
        const ragdollTypes = window.RagdollTypes.getAvailableTypes();
        const buttonWidth = 60;
        const buttonHeight = 60;
        const spacing = 10;
        const startX = this.canvas.width - (ragdollTypes.length * (buttonWidth + spacing));
        const y = 20;
        
        ragdollTypes.forEach((type, index) => {
            const button = {
                type: 'characterButton',
                id: `char_${type.key}`,
                x: startX + (index * (buttonWidth + spacing)),
                y: y,
                width: buttonWidth,
                height: buttonHeight,
                characterType: type.key,
                icon: type.icon,
                name: type.name,
                isActive: type.key === this.config.defaultRagdollType,
                backgroundColor: type.key === this.config.defaultRagdollType ? '#4ECDC4' : '#CCCCCC',
                borderColor: '#333333',
                textColor: '#FFFFFF',
                canBeClicked: true
            };
            
            this.uiRenderer.addElement(button.id, button);
        });
    }
    
    // ==========================================
    // CANVAS & INPUT SETUP
    // ==========================================
    
    setupCanvas() {
        // Set up proper canvas sizing
        this.resizeCanvas();
        
        // Handle resize events
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });
        
        // Prevent context menu on canvas
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    
resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = this.deviceUtils.device.pixelRatio || 1;
    
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    
    // Update world bounds
    this.config.worldBounds = {
        width: rect.width,
        height: rect.height
    };
    
    // Update physics world bounds using the existing resize method
    if (this.physics) {
        this.physics.resize(rect.width, rect.height);
    }
    
    // Update renderers
    if (this.renderer) {
        this.renderer.resize(rect.width, rect.height);
    }
    
    if (this.uiRenderer) {
        this.uiRenderer.resize(rect.width, rect.height);
    }
    
    console.log(`📏 Canvas resized to ${rect.width}x${rect.height}`);
}
    
setupInputHandling() {
    console.log('🎮 Setting up input handling...');
    
    // Touch events
    this.canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.handleTouchStart(e);
    }, { passive: false });
    
    this.canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        this.handleTouchMove(e);
    }, { passive: false });
    
    this.canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.handleTouchEnd(e);
    }, { passive: false });
    
    // Mouse events for desktop
    this.canvas.addEventListener('mousedown', (e) => {
        this.handleMouseDown(e);
    });
    
    this.canvas.addEventListener('mousemove', (e) => {
        this.handleMouseMove(e);
    });
    
    this.canvas.addEventListener('mouseup', (e) => {
        this.handleMouseUp(e);
    });
    
    // UI button events
    this.setupUIEventHandlers();
    
    console.log('🎮 Input handling set up');
}

handleTouchStart(event) {
    const touch = event.touches[0];
    if (!touch) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    this.startGrab(x, y);
}

handleTouchMove(event) {
    const touch = event.touches[0];
    if (!touch || !this.inputState.isGrabbing) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    this.updateGrab(x, y);
}

handleTouchEnd(event) {
    this.endGrab();
}

findGrabTarget(x, y) {
    // Find the closest ragdoll part within grab radius handleMouseDown
    let closest = null;
    let closestDistance = this.config.grabRadius;
    
    this.ragdolls.forEach((ragdoll) => {
        if (ragdoll.parts) {
            ragdoll.parts.forEach((part) => {
                const distance = Math.sqrt(
                    Math.pow(part.position.x - x, 2) + 
                    Math.pow(part.position.y - y, 2)
                );
                
                if (distance < closestDistance) {
                    closest = part;
                    closestDistance = distance;
                }
            });
        }
    });
    
    this.inputState.grabTarget = closest;
    
    if (closest && this.gameAudio) {
        this.gameAudio.playSFX('grab');
    }
}

updateDrag(x, y) {
    if (!this.inputState.grabTarget) return;
    
    // Apply force to move the grabbed part toward cursor/finger
    const target = this.inputState.grabTarget;
    const force = {
        x: (x - target.position.x) * 0.1,
        y: (y - target.position.y) * 0.1
    };
    
    // Apply force through physics engine
    if (this.physics && target.body) {
        this.physics.applyForce(target.body, force);
    }
}

releaseDrag() {
    if (!this.inputState.grabTarget || !this.inputState.grabStart) return;
    
    const dx = this.inputState.grabCurrent.x - this.inputState.grabStart.x;
    const dy = this.inputState.grabCurrent.y - this.inputState.grabStart.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > this.config.minThrowSpeed) {
        // Apply throw force
        const throwForce = {
            x: dx * this.config.throwMultiplier * 0.01,
            y: dy * this.config.throwMultiplier * 0.01
        };
        
        // Cap maximum throw speed ragdollGame 
        const speed = Math.sqrt(throwForce.x * throwForce.x + throwForce.y * throwForce.y);
        if (speed > this.config.maxThrowSpeed * 0.01) {
            const scale = (this.config.maxThrowSpeed * 0.01) / speed;
            throwForce.x *= scale;
            throwForce.y *= scale;
        }
        
        if (this.physics && this.inputState.grabTarget.body) {
            this.physics.applyForce(this.inputState.grabTarget.body, throwForce);
        }
        
        this.stats.totalThrows++;
        
        if (this.gameAudio) {
            this.gameAudio.playSFX('throw');
        }
    }
}
    
handleMouseDown(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    this.startGrab(x, y);
}

handleMouseMove(event) {
    if (!this.inputState.isGrabbing) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    this.updateGrab(x, y);
}

handleMouseUp(event) {
    this.endGrab();
}
    //startGrab
    getTouchPoint(touch) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top,
            id: touch.identifier
        };
    }
    
    getMousePoint(event) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
            id: 'mouse'
        };
    }
    
    handlePointerStart(point) {
        this.inputState.lastTouchTime = Date.now();
        this.inputState.touchCount++;
        this.stats.interactionCount++;
        
        // Check for UI interaction first
        if (this.handleUIInteraction(point)) {
            return;
        }
        
        // Check for ragdoll grab
        this.attemptRagdollGrab(point);
    }
    
    handlePointerMove(point) {
        if (this.inputState.isGrabbing && this.activeGrab) {
            this.updateGrab(point);
        }
    }
    
    handlePointerEnd(point) {
        if (this.inputState.isGrabbing && this.activeGrab) {
            this.releaseGrab(point);
        }
        
        this.inputState.isGrabbing = false;
        this.activeGrab = null;
    }
    
    handleKeyDown(event) {
        switch (event.code) {
            case 'Space':
                event.preventDefault();
                this.spawnRagdoll();
                break;
                
            case 'KeyR':
                this.resetGame();
                break;
                
            case 'KeyD':
                this.toggleDebugMode();
                break;
                
            case 'KeyP':
                this.togglePause();
                break;
                
            case 'Digit1':
            case 'Digit2':
            case 'Digit3':
            case 'Digit4':
            case 'Digit5':
                const typeIndex = parseInt(event.key) - 1;
                const types = window.RagdollTypes.getAvailableTypes();
                if (types[typeIndex]) {
                    this.setRagdollType(types[typeIndex].key);
                }
                break;
        }
    }
    
    // ==========================================
    // UI INTERACTION
    // ==========================================
    
    handleUIInteraction(point) {
        if (!this.uiRenderer) return false;
        
        const hit = this.uiRenderer.hitTest(point.x, point.y);
        if (!hit) return false;
        
        const element = hit.element;
        
        switch (element.type) {
            case 'characterButton':
                this.selectCharacterType(element.characterType);
                return true;
                
            default:
                return false;
        }
    }
    
    selectCharacterType(characterType) {
        if (characterType === this.stats.currentRagdollType) return;
        
        // Update current type
        this.stats.currentRagdollType = characterType;
        
        // Update UI buttons
        const ragdollTypes = window.RagdollTypes.getAvailableTypes();
        ragdollTypes.forEach(type => {
            const buttonId = `char_${type.key}`;
            const isActive = type.key === characterType;
            
            this.uiRenderer.updateElement(buttonId, {
                isActive: isActive,
                backgroundColor: isActive ? '#4ECDC4' : '#CCCCCC'
            });
        });
        
        // Update character indicator
        this.uiRenderer.updateCharacterIndicator(characterType, 1);
        
        // Play feedback
        if (this.gameAudio) {
            this.gameAudio.playVoice('characterSpawn', this.stats.currentRagdollType.toLowerCase());
        }
        
        console.log(`🎭 Character type changed to: ${characterType}`);
    }
    
    // ==========================================
    // RAGDOLL MANAGEMENT updateGrab
    // ==========================================
    
spawnRagdoll(type = 'human', position = null) {
    if (this.ragdolls.size >= this.config.maxRagdolls) {
        console.log('Maximum ragdolls reached');
        return null;
    }
    
    if (!position) {
        position = {
            x: Math.random() * (this.config.worldBounds.width - 200) + 100,
            y: Math.random() * 100 + 50
        };
    }
    
    // Create ragdoll using correct method signature
    if (this.physics && window.RagdollBuilder) {
        const ragdollBuilder = new window.RagdollBuilder(this.physics);
        const ragdoll = ragdollBuilder.createRagdoll(
            type,
            position.x,
            position.y,
            {} // options
        );
        
        if (ragdoll) {
            this.ragdolls.set(ragdoll.id, ragdoll);
            this.stats.totalRagdolls++;
            this.updateRagdollCounter();
            console.log(`🎭 Spawned ${type} ragdoll at (${position.x.toFixed(0)}, ${position.y.toFixed(0)})`);
            
            if (this.gameAudio) {
                this.gameAudio.playInteractionSound('grab');
            }
        }
        
        return ragdoll;
    }
    
    return null;
}

changeRagdollType() {
    const types = ['human', 'teddy', 'frog', 'robot', 'alien'];
    const currentIndex = types.indexOf(this.stats.currentRagdollType);
    const nextIndex = (currentIndex + 1) % types.length;
    this.stats.currentRagdollType = types[nextIndex];
    
    // Update UI
    this.updateCharacterInfo();
    
    if (this.gameAudio) {
        this.gameAudio.playVoice('characterSpawn', this.stats.currentRagdollType.toLowerCase());
    }
    
    console.log(`🎭 Changed ragdoll type to: ${this.stats.currentRagdollType}`);
}

explodeAll() {
    this.ragdolls.forEach((ragdoll) => {
        if (ragdoll.parts && this.physics) {
            ragdoll.parts.forEach((part) => {
                if (part.body) {
                    const force = {
                        x: (Math.random() - 0.5) * 0.1,
                        y: (Math.random() - 0.5) * 0.1
                    };
                    this.physics.applyForce(part.body, force);
                }
            });
        }
    });
    
    if (this.gameAudio) {
        this.gameAudio.onExplosion({ intensity: 1.0 });
    }
    
    console.log('💥 Exploded all ragdolls');
}

resetScene() {
    // Clear all onPhysicsCollision
    this.ragdolls.forEach((ragdoll, id) => {
        this.destroyRagdoll(id);
    });
    
    this.ragdolls.clear();
    
    // Reset physics world
    if (this.physics) {
        this.physics.clear();
        this.physics.createWorldBoundaries(this.config.worldBounds);
    }
    
    // Reset UI
    this.updateRagdollCounter();
    
    if (this.gameAudio) {
        this.gameAudio.playVoice('gameStart');
    }
    
    console.log('🔄 Scene reset');
}

destroyRagdoll(ragdollId) {
    const ragdoll = this.ragdolls.get(ragdollId);
    if (!ragdoll) return false;
    
    // Remove from physics world
    if (window.RagdollBuilder) {
        window.RagdollBuilder.destroyRagdoll(ragdollId, this.physics);
    }
    
    // Remove from game
    this.ragdolls.delete(ragdollId);
    
    // Update UI
    this.updateRagdollCounter();
    
    return true;
}

updateRagdollCounter() {
    const countElement = document.getElementById('ragdollCount');
    if (countElement) {
        countElement.textContent = this.ragdolls.size.toString();
    }
}

updateCharacterInfo() {
    const iconElement = document.getElementById('typeIcon');
    const nameElement = document.getElementById('typeName');
    
    if (iconElement && nameElement) {
        const typeInfo = this.getTypeInfo(this.stats.currentRagdollType);
        iconElement.textContent = typeInfo.icon;
        nameElement.textContent = typeInfo.displayName;
    }
}

getTypeInfo(type) {
    const types = {
        human: { icon: '🧑', displayName: 'Human' },
        teddy: { icon: '🧸', displayName: 'Teddy Bear' },
        frog: { icon: '🐸', displayName: 'Frog' },
        robot: { icon: '🤖', displayName: 'Robot' },
        alien: { icon: '👽', displayName: 'Alien' }
    };
    
    return types[type] || types.human;
}

// Physics event handlers (add these) destroyRagdoll
onPhysicsCollision(event) {
    this.stats.totalCollisions++;
    
    if (this.gameAudio && Math.random() < 0.1) {
        this.gameAudio.playImpactSound(event.force || 15, 'default');
    }
    
    if (this.particleSystem && this.config.particleEffects) {
        this.particleSystem.createCollisionEffect(event.position, event.force);
    }
}
//onPhysicsCollision
onConstraintBroken(event) {
    this.stats.totalBreaks++;
    
    if (this.gameAudio) {
        this.gameAudio.playImpactSound(20, 'metallic');
    }
    
    if (this.particleSystem) {
        this.particleSystem.createBreakEffect(event.position);
    }
}

/**
 * Hide the loading screen
 */
hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.classList.add('hidden');
        
        // Remove from DOM after fade completes
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500); // Match the CSS transition duration
        
        console.log('🎯 Loading screen hidden');
    }
}
    
destroyRagdoll(ragdollId) {
    const ragdoll = this.ragdolls.get(ragdollId);
    if (!ragdoll) return false;
    
    // Call the ragdoll's own remove method
    if (ragdoll.remove) {
        ragdoll.remove();
    } else {
        // Fallback: manually remove bodies and constraints
        if (ragdoll.bodies) {
            for (const body of Object.values(ragdoll.bodies)) {
                if (this.physics && body) {
                    this.physics.removeBody(body);
                }
            }
        }
        
        if (ragdoll.constraints) {
            for (const constraint of Object.values(ragdoll.constraints)) {
                if (this.physics && constraint) {
                    this.physics.removeConstraint(constraint);
                }
            }
        }
    }
    
    // Remove from game
    this.ragdolls.delete(ragdollId);
    
    // Update UI
    this.updateRagdollCounter();
    
    return true;
}
    
    updateRagdollCounter() {
        if (this.uiRenderer) {
            this.uiRenderer.updateRagdollCounter(this.ragdolls.size, this.config.maxRagdolls);
        }
    }
    
    // ==========================================
    // GRAB SYSTEM
    // ==========================================
    
    attemptRagdollGrab(point) {
        // Find closest ragdoll body part within grab radius
        let closestPart = null;
        let closestDistance = this.config.grabRadius;
        
        for (const ragdoll of this.ragdolls.values()) {
            for (const [partName, bodyPart] of ragdoll.bodyParts) {
                if (!bodyPart.physicsBody) continue;
                
                const distance = this.mathUtils.distance(
                    point, 
                    bodyPart.physicsBody.position
                );
                
                if (distance < closestDistance && bodyPart.config.canBeGrabbed) {
                    closestPart = bodyPart;
                    closestDistance = distance;
                }
            }
        }
        
        if (closestPart) {
            this.startGrab(closestPart, point);
            return true;
        }
        
        return false;
    }
    
startGrab(x, y) {
    this.inputState.isGrabbing = true;
    this.inputState.grabStart = { x, y };
    this.inputState.grabCurrent = { x, y };
    this.inputState.lastTouchTime = performance.now();
    
    // Try to grab existing ragdoll first findNearbyRagdollPart
    const grabbedPart = this.findNearbyRagdollPart(x, y);
    if (grabbedPart) {
        this.grabRagdollPart(grabbedPart);
        this.stats.interactionCount++;
        return;
    }
    
    // Only spawn new ragdoll if nothing to grab
    this.spawnRagdoll(this.stats.currentRagdollType, { x, y });
    this.stats.interactionCount++;
}

/**
 * Find ragdoll parts near the given position
 */
findNearbyRagdollPart(x, y) {
    let closestPart = null;
    let closestDistance = this.config.grabRadius;
    
    for (const ragdoll of this.ragdolls.values()) {
        if (!ragdoll.bodies) continue;
        
        for (const [partName, body] of Object.entries(ragdoll.bodies)) {
            if (!body || !body.position) continue;
            
            const distance = Math.sqrt(
                Math.pow(body.position.x - x, 2) + 
                Math.pow(body.position.y - y, 2)
            );
            
            if (distance < closestDistance) {
                closestPart = { body, partName, ragdoll };
                closestDistance = distance;
            }
        }
    }
    
    return closestPart;
}

/**
 * Grab a ragdoll part
 */
grabRagdollPart(ragdollPart) {
    this.inputState.isGrabbing = true;
    this.inputState.grabTarget = ragdollPart;
    
    // Create mouse constraint for physics interaction
    if (this.physics && ragdollPart.body) {
        // This would need the physics engine to support mouse constraints
        console.log(`Grabbed ${ragdollPart.partName} from ${ragdollPart.ragdoll.type}`);
    }
}

updateGrab(x, y) {
    this.inputState.grabCurrent = { x, y };
    // Update any grabbed objects here
}

endGrab() {
    this.inputState.isGrabbing = false;
    this.inputState.grabStart = null;
    this.inputState.grabCurrent = null;
    this.inputState.grabTarget = null;
}

setupUIEventHandlers() {
    // Set up button click handlers
    const changeTypeBtn = document.getElementById('changeTypeBtn');
    const spawnBtn = document.getElementById('spawnBtn');
    const explodeBtn = document.getElementById('explodeBtn');
    const resetBtn = document.getElementById('resetBtn');
    
    if (changeTypeBtn) {
        changeTypeBtn.addEventListener('click', () => this.changeRagdollType());
    }
    
    if (spawnBtn) {
        spawnBtn.addEventListener('click', () => this.spawnRagdoll());
    }
    
    if (explodeBtn) {
        explodeBtn.addEventListener('click', () => this.explodeAll());
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', () => this.resetScene());
    }
}

    //spawnRagdoll
    releaseGrab(point) {
        if (!this.activeGrab || !this.inputState.grabTarget) return;
        
        const grabDuration = Date.now() - this.inputState.lastTouchTime;
        
        // Calculate release velocity
        const releaseVelocity = {
            x: (point.x - this.inputState.grabStart.x) / grabDuration * 1000,
            y: (point.y - this.inputState.grabStart.y) / grabDuration * 1000
        };
        
        const releaseSpeed = this.mathUtils.vectorMagnitude(releaseVelocity);
        const clampedSpeed = this.mathUtils.clamp(
            releaseSpeed, 
            0, 
            this.config.maxThrowSpeed
        );
        
        // Apply throw force if speed is sufficient
        if (clampedSpeed > this.config.minThrowSpeed) {
            const throwForce = this.mathUtils.vectorScale(
                this.mathUtils.vectorNormalize(releaseVelocity),
                clampedSpeed * this.config.throwMultiplier
            );
            
            this.physics.applyForce(
                this.inputState.grabTarget.physicsBody,
                throwForce
            );
            
            this.stats.totalThrows++;
            
            // Handle throw effects
            this.onRagdollThrown({
                bodyPart: this.inputState.grabTarget,
                releaseSpeed: clampedSpeed,
                direction: releaseVelocity,
                duration: grabDuration
            });
        }
        
        // Handle release on body part
        this.inputState.grabTarget.onRelease({
            position: point,
            speed: clampedSpeed,
            direction: releaseVelocity,
            duration: grabDuration
        });
        
        // Remove grab constraint
        this.physics.removeMouseConstraint(this.activeGrab);
        
        console.log(`👋 Released ${this.inputState.grabTarget.partName} with speed ${clampedSpeed.toFixed(1)}`);
    }
    
    // ==========================================
    // EVENT HANDLERS
    // ==========================================
    
    onRagdollSpawned(ragdoll, ragdollType) {
        // Visual effects
        if (this.particleSystem) {
            this.particleSystem.createEffect('sparkles', ragdoll.getPosition(), {
                intensity: 0.6,
                duration: 1000,
                color: '#FFD700'
            });
        }
        
        // Audio feedback
        if (this.gameAudio) {
            this.gameAudio.onRagdollSpawned(ragdollType);
        }
        
        // Check for milestones
        if (this.stats.totalRagdolls === 1) {
            this.onGameMilestone('firstRagdoll');
        } else if (this.ragdolls.size >= 3) {
            this.gameAudio?.onMultipleRagdolls(this.ragdolls.size);
        }
    }
    
    onRagdollGrabbed(bodyPart, point) {
        // Visual feedback
        if (this.particleSystem) {
            this.particleSystem.createEffect('sparkles', point, {
                intensity: 0.3,
                duration: 300,
                color: '#4ECDC4'
            });
        }
        
        // Audio feedback
        if (this.gameAudio) {
            this.gameAudio.playInteractionSound('grab');
        }
    }
    
    onRagdollThrown(throwData) {
        const { bodyPart, releaseSpeed, direction } = throwData;
        
        // Visual effects
        if (this.particleSystem && releaseSpeed > 200) {
            this.particleSystem.createEffect('motion', bodyPart.physicsBody.position, {
                intensity: Math.min(releaseSpeed / 500, 1),
                duration: 800,
                direction: direction
            });
        }
        
        // Audio feedback
        if (this.gameAudio) {
            this.gameAudio.onRagdollThrown(throwData);
        }
        
        // Screen shake for powerful throws
        if (releaseSpeed > 400 && this.renderer) {
            this.renderer.addScreenShake(Math.min(releaseSpeed / 1000, 1));
        }
        
        // Check for milestones destroyRagdoll
        if (this.stats.totalThrows === 1) {
            this.onGameMilestone('firstThrow');
        }
    }
    
onPhysicsCollision(event) {
    this.stats.totalCollisions++;
    
    if (this.gameAudio && Math.random() < 0.1) { // 10% chance
        this.gameAudio.playImpactSound(event.force || 15, 'default');
    }
    
    // Create particle effects
    if (this.particleSystem && this.config.particleEffects) {
        this.particleSystem.createCollisionEffect(event.position, event.force);
    }
}

onConstraintBroken(event) {
    this.stats.totalBreaks++;
    
    if (this.gameAudio) {
        this.gameAudio.playImpactSound(20, 'metallic');
    }
    
    // Create dramatic effect
    if (this.particleSystem) {
        this.particleSystem.createBreakEffect(event.position);
    }
}
    
    onGameMilestone(milestone) {
        console.log(`🏆 Game milestone: ${milestone}`);
        
        if (this.gameAudio) {
            this.gameAudio.onGameMilestone(milestone);
        }
        
        // Visual celebration if (this.gameAudio)
        if (this.particleSystem) {
            this.particleSystem.createEffect('celebration', {
                x: this.config.worldBounds.width / 2,
                y: this.config.worldBounds.height / 2
            }, {
                intensity: 1.0,
                duration: 2000
            });
        }
    }
    
    // ==========================================
    // GAME LOOP
    // ==========================================
    
// Add this method to your RagdollPlaygroundGame class

// ==========================================
// GAME LOOP
// ==========================================

startGameLoop() {
    if (this.gameLoop) {
        console.warn('Game loop already running');
        return;
    }
    
    console.log('🔄 Starting game loop...');
    
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    
    const loop = (timestamp) => {
        if (!this.isRunning || this.isPaused) {
            this.gameLoop = null;
            return;
        }
        
        // Calculate delta time
        const deltaTime = timestamp - this.lastFrameTime;
        this.deltaTime = Math.min(deltaTime, 33.33); // Cap at 30fps minimum
        this.lastFrameTime = timestamp;
        
        // Update FPS counter
        this.frameCount++;
        if (this.frameCount % 60 === 0) {
            this.fps = Math.round(1000 / (deltaTime || 16.67));
        }
        
        // Update game systems
        this.update(this.deltaTime);
        
        // Render frame
        this.render();
        
        // Continue loop
        this.gameLoop = requestAnimationFrame(loop);
    };
    
    // Start the loop
    this.gameLoop = requestAnimationFrame(loop);
    
    console.log('✅ Game loop started');
}

update(deltaTime) {
    // Update physics
    if (this.physics) {
        this.physics.update(deltaTime);
    }
    
    // Update particle system
    if (this.particleSystem) {
        this.particleSystem.update(deltaTime);
    }
    
    // Update ragdolls
    this.ragdolls.forEach((ragdoll, id) => {
        if (ragdoll.update) {
            ragdoll.update(deltaTime);
        }
    });
    
    // Update UI animations
    if (this.uiRenderer) {
        this.uiRenderer.update(deltaTime);
    }
    
    // Update statistics
    this.stats.playTime += deltaTime;
}

render() {
    if (!this.renderer) return;
    
    // Clear canvas
    this.renderer.clear();
    
    // Render background
    this.renderer.renderBackground();
    
    // Render physics world (if debug mode)
    if (this.config.showDebugInfo && this.physics) {
        this.renderer.renderPhysicsDebug(this.physics);
    }
    
    // Render ragdolls
    this.ragdolls.forEach((ragdoll) => {
        this.renderer.renderRagdoll(ragdoll);
    });
    
    // Render particle effects
    if (this.particleSystem) {
        this.renderer.renderParticles(this.particleSystem);
    }
    
    // Render UI overlay
    if (this.uiRenderer && this.config.showUI) {
        this.uiRenderer.render();
    }
    
    // Render debug info
    if (this.config.showDebugInfo) {
        this.renderDebugInfo();
    }
}

renderDebugInfo() {
    if (this.uiRenderer) {
        this.uiRenderer.renderDebugOverlay({
            fps: this.fps,
            deltaTime: this.deltaTime.toFixed(2),
            ragdolls: this.ragdolls.size,
            bodies: this.physics?.bodies?.size || 0,
            particles: this.particleSystem?.particleCount || 0
        });
    }
}
//setupInputHandling
pause() {
    if (!this.isRunning) return false;
    
    this.isPaused = true;
    console.log('⏸️ Game paused');
    
    return true;
}

resume() {
    if (!this.isRunning || !this.isPaused) return false;
    
    this.isPaused = false;
    this.lastFrameTime = performance.now(); // Reset timing
    
    // Restart game loop
    this.startGameLoop();
    
    console.log('▶️ Game resumed');
    
    return true;
}

stop() {
    this.isRunning = false;
    this.isPaused = false;
    this.gameLoop = null;
    
    console.log('⏹️ Game stopped');
    
    return true;
}
    
    cleanupDestroyedRagdolls() {
        const ragdollsToRemove = [];
        
        for (const [ragdollId, ragdoll] of this.ragdolls) {
            // Check if ragdoll has fallen off screen or is inactive
            const position = ragdoll.getPosition();
            const bounds = this.config.worldBounds;
            
            if (position.y > bounds.height + 200 || // Fallen off bottom
                position.x < -200 || position.x > bounds.width + 200) { // Off sides
                ragdollsToRemove.push(ragdollId);
            }
        }
        
        // Remove off-screen ragdolls handleTouchStart
        for (const ragdollId of ragdollsToRemove) {
            this.destroyRagdoll(ragdollId);
            console.log(`🗑️ Auto-removed off-screen ragdoll ${ragdollId}`);
        }
    }
    
    // ==========================================
    // GAME CONTROLS handleTouchStart
    // ==========================================
    
    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.showMessage('Game Paused');
            console.log('⏸️ Game paused');
        } else {
            this.showMessage('Game Resumed');
            console.log('▶️ Game resumed');
        }
        
        return this.isPaused;
    }
    
    resetGame() {
        console.log('🔄 Resetting game...');
        
        // Clear all ragdolls
        const ragdollIds = Array.from(this.ragdolls.keys());
        for (const ragdollId of ragdollIds) {
            this.destroyRagdoll(ragdollId);
        }
        
        // Reset physics world
        if (this.physics) {
            this.physics.reset();
        }
        
        // Clear particles
        if (this.particleSystem) {
            this.particleSystem.clear();
        }
        
        // Reset statistics
        this.stats = {
            totalRagdolls: 0,
            totalThrows: 0,
            totalCollisions: 0,
            totalBreaks: 0,
            playTime: 0,
            interactionCount: 0,
            maxRagdolls: 0,
            currentRagdollType: this.stats.currentRagdollType // Keep current type
        };
        
        // Reset counters
        this.ragdollIdCounter = 0;
        this.lastSpawnTime = 0;
        
        // Update UI
        this.updateRagdollCounter();
        
        // Show message
        this.showMessage('Game Reset!');
        
        // Play audio feedback
        if (this.gameAudio) {
            this.gameAudio.playInteractionSound('grab');
            this.gameAudio.queueVoice('gameStart', null, 1000);
        }
        
        console.log('✅ Game reset complete');
    }
    
    setRagdollType(typeName) {
        const availableTypes = window.RagdollTypes.getAvailableTypes();
        const typeExists = availableTypes.some(type => type.key === typeName);
        
        if (!typeExists) {
            console.warn(`Unknown ragdoll type: ${typeName}`);
            return false;
        }
        
        this.stats.currentRagdollType = typeName;
        this.selectCharacterType(typeName);
        
        console.log(`🎭 Ragdoll type set to: ${typeName}`);
        return true;
    }
    
    toggleDebugMode() {
        this.config.showDebugInfo = !this.config.showDebugInfo;
        
        if (this.renderer) {
            this.renderer.toggleDebugInfo();
        }
        
        if (this.uiRenderer) {
            const perfIndicator = this.uiRenderer.getElement('performanceIndicator');
            if (perfIndicator) {
                this.uiRenderer.togglePerformanceIndicator();
            }
        }
        
        console.log(`🔍 Debug mode: ${this.config.showDebugInfo ? 'ON' : 'OFF'}`);
        return this.config.showDebugInfo;
    }
    
    // ==========================================
    // UTILITY METHODS
    // ==========================================
    
    showMessage(message, duration = 3000, type = 'info') {
        console.log(`💬 Message: ${message}`);
        
        if (this.uiRenderer) {
            this.uiRenderer.showNotification(message, type, duration);
        }
        
        if (this.gameAudio && type === 'info') {
            // Don't speak every message to avoid spam
            if (Math.random() < 0.3) {
                this.gameAudio.queueVoice('encouragement', null, 500);
            }
        }
    }
    
    createInitialState() {
        // Create ground/boundaries in physics world
        if (this.physics) {
            this.physics.createWorldBoundaries(this.config.worldBounds);
        }
        
        console.log('🌍 Initial game state created');
    }
    
    // ==========================================
    // STATISTICS & INFO
    // ==========================================
    
    getGameStats() {
        return {
            ...this.stats,
            
            // Current state
            activeRagdolls: this.ragdolls.size,
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            currentFPS: this.fps,
            frameCount: this.frameCount,
            
            // Session info
            sessionTime: this.stats.playTime,
            interactionRate: this.stats.interactionCount / (this.stats.playTime / 60000), // per minute
            
            // Physics stats
            physicsStats: this.physics?.getStats() || {},
            
            // Audio stats
            audioStats: this.gameAudio?.getStats() || {},
            
            // Rendering stats
            renderStats: {
                particles: this.particleSystem?.particleCount || 0,
                fps: this.fps,
                deltaTime: this.deltaTime
            }
        };
    }
    
    getDebugInfo() {
        return {
            gameStats: this.getGameStats(),
            
            config: this.config,
            
            systems: {
                physics: {
                    available: !!this.physics,
                    initialized: this.physics?.isInitialized || false,
                    bodies: this.physics?.bodies?.size || 0,
                    constraints: this.physics?.constraints?.size || 0
                },
                
                rendering: {
                    renderer: !!this.renderer,
                    uiRenderer: !!this.uiRenderer,
                    particles: !!this.particleSystem,
                    particleCount: this.particleSystem?.particleCount || 0
                },
                
                audio: {
                    available: !!this.gameAudio,
                    enabled: this.config.enableAudio,
                    musicPlaying: this.gameAudio?.currentMusic || 'none',
                    voicesQueued: this.gameAudio?.voiceQueue?.length || 0
                }
            },
            
            ragdolls: Array.from(this.ragdolls.entries()).map(([id, ragdoll]) => ({
                id: id,
                type: ragdoll.ragdollType,
                position: ragdoll.getPosition(),
                bodyParts: ragdoll.bodyParts.size,
                isActive: ragdoll.isActive
            })),
            
            input: {
                ...this.inputState,
                activeGrab: !!this.activeGrab
            },
            
            performance: {
                fps: this.fps,
                frameCount: this.frameCount,
                deltaTime: this.deltaTime,
                deviceLevel: this.deviceUtils.performance.level,
                adaptiveQuality: this.config.adaptiveQuality
            }
        };
    }
    
    // ==========================================
    // SAVE & LOAD (Future Feature)
    // ==========================================
    
    exportGameState() {
        const gameState = {
            version: '1.0',
            timestamp: Date.now(),
            stats: this.stats,
            config: {
                currentRagdollType: this.stats.currentRagdollType,
                maxRagdolls: this.config.maxRagdolls,
                enableAudio: this.config.enableAudio
            },
            ragdolls: Array.from(this.ragdolls.entries()).map(([id, ragdoll]) => ({
                id: id,
                type: ragdoll.ragdollType,
                position: ragdoll.getPosition()
            }))
        };
        
        return JSON.stringify(gameState, null, 2);
    }
    
    importGameState(gameStateJson) {
        try {
            const gameState = JSON.parse(gameStateJson);
            
            // Reset current game
            this.resetGame();
            
            // Restore settings
            this.stats = { ...this.stats, ...gameState.stats };
            this.setRagdollType(gameState.config.currentRagdollType);
            
            // Restore ragdolls
            for (const ragdollData of gameState.ragdolls) {
                this.spawnRagdoll(ragdollData.type, ragdollData.position);
            }
            
            console.log('📥 Game state imported successfully');
            this.showMessage('Game state restored!');
            
            return true;
            
        } catch (error) {
            console.error('Failed to import game state:', error);
            this.showMessage('Failed to restore game state', 3000, 'error');
            return false;
        }
    }
    
    // ==========================================
    // EVENT SYSTEM
    // ==========================================
    
    on(eventName, callback) {
        if (!this.eventListeners) {
            this.eventListeners = new Map();
        }
        
        if (!this.eventListeners.has(eventName)) {
            this.eventListeners.set(eventName, []);
        }
        
        this.eventListeners.get(eventName).push(callback);
    }
    
    emit(eventName, data) {
        if (!this.eventListeners?.has(eventName)) return;
        
        const listeners = this.eventListeners.get(eventName);
        for (const callback of listeners) {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event listener for ${eventName}:`, error);
            }
        }
    }
    
    // ==========================================
    // CLEANUP & SHUTDOWN
    // ==========================================
    
    destroy() {
        console.log('🗑️ Destroying RagdollPlaygroundGame...');
        
        // Stop game loop
        this.isRunning = false;
        
        // Destroy all ragdolls
        const ragdollIds = Array.from(this.ragdolls.keys());
        for (const ragdollId of ragdollIds) {
            this.destroyRagdoll(ragdollId);
        }
        
        // Destroy systems
        if (this.physics) {
            this.physics.destroy();
            this.physics = null;
        }
        
        if (this.particleSystem) {
            this.particleSystem.destroy();
            this.particleSystem = null;
        }
        
        if (this.renderer) {
            this.renderer.destroy();
            this.renderer = null;
        }
        
        if (this.uiRenderer) {
            this.uiRenderer.destroy();
            this.uiRenderer = null;
        }
        
        if (this.gameAudio) {
            this.gameAudio.destroy();
            this.gameAudio = null;
        }
        
        // Clear references
        this.canvas = null;
        this.ragdolls.clear();
        this.activeGrab = null;
        
        console.log('✅ RagdollPlaygroundGame destroyed');
    }
}

// ==========================================
// GLOBAL INITIALIZATION
// ==========================================

// Auto-initialize game when DOM is ready and audio permission is granted
// ==========================================
// GLOBAL INITIALIZATION
// ==========================================

// Auto-initialize game when DOM is ready and audio permission is granted
let ragdollGame = null;
let initializationAttempted = false;  // Add this flag

function initializeRagdollGame() {
    if (ragdollGame || initializationAttempted) {
        console.warn('Game already initialized or initialization in progress');
        return ragdollGame;
    }
    
    initializationAttempted = true;  // Set flag immediately
    
    try {
        ragdollGame = new RagdollPlaygroundGame('gameCanvas');
        
        // Initialize after audio permission - but only once
        const audioEnabledHandler = async () => {
            // Remove the event listener immediately to prevent multiple calls
            document.removeEventListener('audioEnabled', audioEnabledHandler);
            
            const success = await ragdollGame.init();
            
            if (success) {
                console.log('🎮 Ragdoll Playground ready to play!');
                
                // Make game available globally for debugging
                window.ragdollGame = ragdollGame;
                
                // Dispatch game ready event
                document.dispatchEvent(new CustomEvent('gameReady', { 
                    detail: { game: ragdollGame } 
                }));
            } else {
                console.error('Failed to initialize game');
                // Reset flags so user can try again
                ragdollGame = null;
                initializationAttempted = false;
            }
        };
        
        document.addEventListener('audioEnabled', audioEnabledHandler);
        
        return ragdollGame;
        
    } catch (error) {
        console.error('Failed to create game:', error);
        initializationAttempted = false;  // Reset on error
        return null;
    }
}

// Initialize when DOM is ready startGameLoop
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeRagdollGame);
} else {
    initializeRagdollGame();
}

// Make classes available globally spawnRagdoll
window.RagdollPlaygroundGame = RagdollPlaygroundGame;

console.log('🎮 RagdollPlaygroundGame loaded - Complete ragdoll playground ready');