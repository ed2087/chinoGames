// ==========================================
// MAIN GAME CONTROLLER - SHAPE BUILDER SANDBOX
// ==========================================

class ShapeBuilderGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.particleCanvas = document.getElementById('particleCanvas');
        
        this.isInitialized = false;
        this.isRunning = false;
        this.lastTime = 0;
        
        // Game systems setupCanvases
        this.particles = null;
        this.physics = null;
        this.shapes = null;
        this.ui = null;
        
        this.init();
    }
    
    async init() {
        console.log('Initializing Shape Builder Sandbox...');
        
        try {
            // Setup canvases
            this.setupCanvases();
            
            // Initialize systems in order
            this.particles = new ParticleSystem(this.particleCanvas);
            this.physics = new PhysicsEngine(this.canvas);
            this.shapes = new ShapeManager(this.canvas, this.physics);
            this.ui = new UIController(this.shapes, this.physics, this.particles);
            
            // Set up collision events for educational feedback
            this.setupPhysicsEvents();
            
            // Make game instance globally available
            window.gameInstance = this;
            
            this.isInitialized = true;
            this.start();
            
            // Welcome message after audio system is ready
            document.addEventListener('audioEnabled', () => {
                setTimeout(() => {
                    this.speakWelcome();
                }, 1000);
            });
            
            console.log('Shape Builder Sandbox initialized successfully!');
            
        } catch (error) {
            console.error('Failed to initialize Shape Builder Sandbox:', error);
        }
    }
    
setupCanvases() {
    // Fix mobile viewport height issues
    const updateVH = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    updateVH();
    window.addEventListener('resize', updateVH);
    window.addEventListener('orientationchange', () => {
        setTimeout(updateVH, 500);
    });
    
    const container = this.canvas.parentElement;
    const rect = container.getBoundingClientRect();
    
    // Main game canvas
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    
    // Particle canvas (same size)
    this.particleCanvas.width = rect.width;
    this.particleCanvas.height = rect.height;
    this.particleCanvas.style.width = rect.width + 'px';
    this.particleCanvas.style.height = rect.height + 'px';
    
    console.log(`Canvases set to ${rect.width}x${rect.height}`);
}
    
    setupPhysicsEvents() {
        // Educational feedback on collisions
        this.physics.onCollisionStart((event) => {
            this.handleCollisions(event.pairs);
        });
    }
    
    handleCollisions(pairs) {
        for (let pair of pairs) {
            const { bodyA, bodyB } = pair;
            
            // Check for user shapes hitting the ground
            if ((bodyA.label === 'ground' && bodyB.isUserShape) ||
                (bodyB.label === 'ground' && bodyA.isUserShape)) {
                
                const shape = bodyA.isUserShape ? bodyA : bodyB;
                
                // Occasional physics education
                if (Math.random() < 0.1) { // 10% chance
                    setTimeout(() => {
                        this.speakPhysicsFact(shape);
                    }, 500);
                }
            }
            
            // Check for shape-to-shape collisions
            if (bodyA.isUserShape && bodyB.isUserShape) {
                // Play collision sound
                this.playCollisionSound();
                
                // Rare physics explanation
                if (Math.random() < 0.05) { // 5% chance
                    setTimeout(() => {
                        this.speakCollisionFact();
                    }, 300);
                }
            }
        }
    }
    
    speakWelcome() {
        if (!window.audioSystem?.isInitialized) return;
        
        const welcomeMessages = [
            "Welcome to Shape Builder! Drag shapes from the bottom to build anything you want!",
            "Time to build! Pick shapes and stack them up high!",
            "Let's create something amazing with shapes!"
        ];
        
        const message = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
        window.audioSystem.speak(message);
    }
    
    speakPhysicsFact(shape) {
        if (!window.audioSystem?.isInitialized) return;
        
        const physicsFacts = [
            "Gravity pulls everything down!",
            "Heavy things fall faster!",
            "Round shapes like to roll!",
            "Tall towers can tip over!",
            "Smooth things slide easily!",
            "The bigger the shape, the more it weighs!"
        ];
        
        const fact = physicsFacts[Math.floor(Math.random() * physicsFacts.length)];
        window.audioSystem.speak(fact);
    }
    
    speakCollisionFact() {
        if (!window.audioSystem?.isInitialized) return;
        
        const collisionFacts = [
            "When shapes bump, they push each other!",
            "Heavy shapes can knock down light ones!",
            "Things bounce when they hit!",
            "Some shapes are bouncier than others!"
        ];
        
        const fact = collisionFacts[Math.floor(Math.random() * collisionFacts.length)];
        window.audioSystem.speak(fact);
    }
    
    playCollisionSound() {
        if (!window.audioSystem?.audioContext) return;
        
        try {
            const audioCtx = window.audioSystem.audioContext;
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            oscillator.frequency.setValueAtTime(150 + Math.random() * 100, audioCtx.currentTime);
            oscillator.type = 'square';
            
            gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.1);
            
        } catch (error) {
            console.warn('Collision sound failed:', error);
        }
    }
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();
        
        console.log('Game loop started');
    }
    
    stop() {
        this.isRunning = false;
        console.log('Game loop stopped');
    }
    
    gameLoop(currentTime = performance.now()) {
        if (!this.isRunning) return;
        
        const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
        this.lastTime = currentTime;
        
        // Update systems
        this.update(deltaTime);
        this.render();
        
        // Continue loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        if (!this.isInitialized) return;
        
        // Update physics world
        this.physics.update();
        
        // Update particles
        this.particles.update(deltaTime);
    }
    
    render() {
        if (!this.isInitialized) return;
        
        // Render main game (shapes and background)
        this.shapes.render();
        
        // Render particles on separate canvas
        this.particles.render();
    }
    
    // Public API methods
    createShape(type, x, y) {
        if (!this.isInitialized) return null;
        return this.shapes.createShape(type, x, y);
    }
    
    clearAll() {
        if (!this.isInitialized) return;
        
        this.shapes.clear();
        this.particles.clear();
        
        console.log('Game cleared');
    }
    
    getShapeCount() {
        if (!this.isInitialized) return 0;
        return this.physics.bodies.filter(body => body.isUserShape).length;
    }
    
    // Cleanup for page unload
    destroy() {
        this.stop();
        
        if (this.physics) {
            this.physics.clear();
        }
        
        if (this.particles) {
            this.particles.clear();
        }
        
        console.log('Shape Builder Sandbox destroyed');
    }
}

// Initialize the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.shapeBuilderGame = new ShapeBuilderGame();
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (window.shapeBuilderGame) {
            window.shapeBuilderGame.destroy();
        }
    });
});