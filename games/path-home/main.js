// ==========================================
// PATH HOME GAME - FREE FORM DRAWING
// ==========================================

class PathHomeGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.isInitialized = false;
        this.isGameRunning = false;
        
        // Core systems
        this.pathGenerator = null;
        this.drawingEngine = null;
        this.particleGenerator = null;
        this.audioSynthesizer = null;
        this.levelManager = null;
        
        // Game state
        this.currentLevel = null;
        this.currentAnimal = null;
        this.startPoint = null;
        this.endPoint = null;
        this.obstacles = [];
        this.gameStartTime = 0;
        
        // Animation
        this.animationId = null;
        this.lastFrameTime = 0;
        
        this.init();
    }
    
    async init() {
        console.log('🎮 Initializing Free-Form Path Home Game...');
        
        try {
            this.setupCanvas();
            this.initializeSystems();
            this.setupEventListeners();
            this.setupUI();
            
            // Wait for audio permission
            document.addEventListener('audioEnabled', () => {
                setTimeout(() => {
                    this.startGame();
                }, 500);
            });
            
            // Desktop fallback
            setTimeout(() => {
                if (!this.isGameRunning) {
                    console.log('🖥️ Desktop detected - starting game');
                    this.startGame();
                }
            }, 2000);
            
            this.isInitialized = true;
            console.log('✅ Free-Form Path Game Ready!');
            
        } catch (error) {
            console.error('❌ Game initialization failed:', error);
        }
    }
    
    setupCanvas() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

            // Ensure game canvas is above drawing canvas
        this.canvas.style.position = 'relative';
        this.canvas.style.zIndex = '1';
        
        this.resizeCanvas();
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.resizeCanvas(), 500);
        });
    }
    
    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        console.log(`Canvas resized: ${rect.width}x${rect.height}`);
    }
    
    initializeSystems() {
        // Initialize systems
        this.pathGenerator = new PathGenerator(
            this.canvas.clientWidth, 
            this.canvas.clientHeight
        );
        
        this.drawingEngine = new DrawingEngine(this.canvas);
        this.particleGenerator = new ParticleGenerator(this.canvas);
        this.audioSynthesizer = new AudioSynthesizer();
        this.levelManager = new LevelManager();
        
        // Connect drawing callbacks
        this.drawingEngine.onPathCompleted = (pathData) => {
            this.onPathCompleted(pathData);
        };
        
        this.drawingEngine.onPathIncomplete = (pathData) => {
            this.onPathIncomplete(pathData);
        };
        
        this.drawingEngine.onObstacleHit = (obstacle) => {
            this.onObstacleHit(obstacle);
        };
    }
    
    setupEventListeners() {
        const nextButton = document.getElementById('nextLevel');
        nextButton.addEventListener('click', () => {
            this.generateNextLevel();
        });
        
        // Keyboard shortcuts for testing
        document.addEventListener('keydown', (e) => {
            if (e.key === 'n' || e.key === 'N') {
                this.generateNextLevel();
            } else if (e.key === 'c' || e.key === 'C') {
                this.clearDrawing();
            }
        });
    }
    
    setupUI() {
        this.updateHelpText("Draw any path to help me get home!");
        this.hideNextButton();
    }
    
    startGame() {
        if (this.isGameRunning) return;
        
        console.log('🚀 Starting Free-Form Path Game');
        
        this.isGameRunning = true;
        this.gameStartTime = Date.now();
        
        this.particleGenerator.start();
        this.generateNextLevel();
        this.startGameLoop();
        
        // Welcome message
        if (window.audioSystem?.isInitialized) {
            setTimeout(() => {
                window.audioSystem.speak("Draw any path you want! Just help your friend get home!");
            }, 1000);
        }
    }
    
    generateNextLevel() {
        console.log('📋 Generating next level...');
        
        this.clearAll();
        
        // Generate new level
        this.currentLevel = this.levelManager.generateLevel();
        console.log('Level info:', this.currentLevel);
        
        // Create animal and positions
        this.createAnimalAndPositions();
        
        // Generate obstacles only (no preset path)
        this.generateObstacles();
        
        // Set up drawing engine
        this.drawingEngine.setGameElements(this.startPoint, this.endPoint, this.obstacles);
        
        // Update UI
        this.updateUI();
        this.announceLevel();
        
        this.levelManager.saveProgress();
    }
    
    createAnimalAndPositions() {
        // Generate start and end points
        this.startPoint = this.pathGenerator.generateStartPoint();
        this.endPoint = this.pathGenerator.generateEndPoint(this.startPoint);
        
        // Create animal at start
        this.currentAnimal = window.createAnimal(
            this.currentLevel.animalType, 
            this.startPoint.x, 
            this.startPoint.y, 
            1.2
        );
        
        if (!this.currentAnimal) {
            console.error('Creating fallback penguin');
            this.currentAnimal = new window.CanvasPenguin(this.startPoint.x, this.startPoint.y, 1.2);
        }
        
        console.log('Animal created at:', this.startPoint);
    }
    
    generateObstacles() {
        // Generate obstacles based on difficulty
        const numObstacles = Math.min(this.currentLevel.difficulty + 1, 6);
        this.obstacles = [];
        
        for (let i = 0; i < numObstacles; i++) {
            let obstacle;
            let attempts = 0;
            
            do {
                obstacle = {
                    x: 150 + Math.random() * (this.canvas.clientWidth - 300),
                    y: 150 + Math.random() * (this.canvas.clientHeight - 300),
                    radius: 25 + Math.random() * 35,
                    type: 'rock'
                };
                attempts++;
            } while (this.obstacleConflicts(obstacle) && attempts < 30);
            
            if (attempts < 30) {
                this.obstacles.push(obstacle);
            }
        }
        
        console.log(`Generated ${this.obstacles.length} obstacles`);
    }
    
    obstacleConflicts(obstacle) {
        const buffer = obstacle.radius + 60;
        
        // Check conflict with start/end points
        if (this.distance(obstacle, this.startPoint) < buffer || 
            this.distance(obstacle, this.endPoint) < buffer) {
            return true;
        }
        
        // Check conflict with other obstacles
        for (const existingObstacle of this.obstacles) {
            if (this.distance(obstacle, existingObstacle) < (obstacle.radius + existingObstacle.radius + 40)) {
                return true;
            }
        }
        
        return false;
    }
    
    updateUI() {
        const animalName = this.currentLevel.animalType.charAt(0).toUpperCase() + this.currentLevel.animalType.slice(1);
        const homeType = this.currentAnimal.homeType;
        
        this.updateHelpText(`Draw any path to help ${animalName} reach the ${homeType}!`);
    }
    
    announceLevel() {
        if (!window.audioSystem?.isInitialized) return;
        
        setTimeout(() => {
            const animalName = this.currentLevel.animalType;
            const homeType = this.currentAnimal.homeType;
            
            window.audioSystem.speak(`Help the ${animalName} get to the ${homeType}! Draw any path you like, just avoid the rocks!`);
        }, 1500);
    }
    
    // Game loop
    startGameLoop() {
        this.lastFrameTime = performance.now();
        this.gameLoop();
    }
    
    gameLoop() {
        if (!this.isGameRunning) return;
        
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }
    
    update(deltaTime) {
        if (this.currentAnimal) {
            this.currentAnimal.update();
        }
    }
    
render() {
    // Don't clear the entire canvas - preserve the drawing trail
    this.ctx.save();
    
    // Only clear areas that need updating (animal and effects)
    // First, clear the area around the animal
    if (this.currentAnimal) {
        this.ctx.clearRect(
            this.currentAnimal.x - 60, 
            this.currentAnimal.y - 60, 
            120, 120
        );
    }
    
    // Clear obstacle areas for redraw
    for (const obstacle of this.obstacles) {
        this.ctx.clearRect(
            obstacle.x - obstacle.radius - 10,
            obstacle.y - obstacle.radius - 10,
            (obstacle.radius + 10) * 2,
            (obstacle.radius + 10) * 2
        );
    }
    
    // Clear destination area
    if (this.endPoint) {
        this.ctx.clearRect(
            this.endPoint.x - 70,
            this.endPoint.y - 70,
            140, 140
        );
    }
    
    // Set background composite to only fill empty areas
    this.ctx.globalCompositeOperation = 'destination-over';
    this.ctx.fillStyle = '#F0F8FF';
    this.ctx.fillRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
    
    // Reset to normal drawing
    this.ctx.globalCompositeOperation = 'source-over';
    
    // Draw game elements (obstacles, destination, animal)
    this.drawObstacles();
    
    if (this.endPoint) {
        const destination = this.pathGenerator.generateDestination(
            this.currentLevel.animalType, 
            this.endPoint
        );
        this.pathGenerator.drawDestination(this.ctx, destination);
    }
    
    if (this.currentAnimal) {
        this.currentAnimal.draw(this.ctx);
    }
    
    this.ctx.restore();
}
    
    drawObstacles() {
        this.ctx.save();
        
        for (const obstacle of this.obstacles) {
            // Rock-like obstacles
            this.ctx.fillStyle = '#8B7355';
            this.ctx.strokeStyle = '#5D4E37';
            this.ctx.lineWidth = 3;
            
            this.ctx.beginPath();
            this.ctx.arc(obstacle.x, obstacle.y, obstacle.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            
            // Add texture
            this.ctx.fillStyle = '#A0956B';
            this.ctx.beginPath();
            this.ctx.arc(obstacle.x - 8, obstacle.y - 5, obstacle.radius * 0.3, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
    
    // Event handlers
    onPathCompleted(pathData) {
        console.log('🎉 Path completed!');
        
        // Start animal animation
        this.currentAnimal.startWalking();
        this.animateAnimalAlongPath(pathData);
    }
    
    onPathIncomplete(pathData) {
        console.log('📝 Path drawn but incomplete');
        
        if (window.audioSystem?.isInitialized) {
            window.audioSystem.speak("Good start! Try to reach the house!");
        }
    }
    
    onObstacleHit(obstacle) {
        console.log('💥 Hit obstacle');
        
        // Visual feedback
        this.particleGenerator.createFloatingBubbles(2);
        
        // Audio feedback
        if (window.audioSystem?.isInitialized) {
            window.audioSystem.speak("Oops! Try to go around the rocks!");
        }
        
        this.audioSynthesizer.playErrorSound();
    }
    
    animateAnimalAlongPath(pathData) {
        if (!pathData || pathData.length < 2) return;
        
        let currentIndex = 0;
        const animationSpeed = 3;
        
        const animate = () => {
            if (currentIndex >= pathData.length - 1) {
                this.onAnimalReachedHome();
                return;
            }
            
            const target = pathData[currentIndex + 1];
            const dx = target.x - this.currentAnimal.x;
            const dy = target.y - this.currentAnimal.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 8) {
                currentIndex++;
                return requestAnimationFrame(animate);
            }
            
            const moveX = (dx / distance) * animationSpeed;
            const moveY = (dy / distance) * animationSpeed;
            
            this.currentAnimal.moveTo(
                this.currentAnimal.x + moveX,
                this.currentAnimal.y + moveY
            );
            
            // Walking sounds
            if (Math.random() < 0.08) {
                this.audioSynthesizer.playWalkingSound(this.currentLevel.animalType);
            }
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    onAnimalReachedHome() {
        console.log('🏠 Animal reached home!');
        
        this.currentAnimal.stopWalking();
        
        // Celebration effects
        this.particleGenerator.createSuccessExplosion(
            this.currentAnimal.x, 
            this.currentAnimal.y
        );
        
        // Audio celebration
        if (window.audioSystem?.isInitialized) {
            window.audioSystem.speakCelebration();
            setTimeout(() => {
                this.audioSynthesizer.playAnimalHappy(this.currentLevel.animalType);
            }, 500);
        }
        
        // Level completion
        const result = this.levelManager.onPathCompleted([]);
        
        setTimeout(() => {
            this.showNextButton();
            this.updateHelpText(result.encouragement);
        }, 2000);
    }
    
    // Utility methods
clearAll() {
    // Clear game canvas completely
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Reset drawing engine: trails + path state
    if (this.drawingEngine) {
        this.drawingEngine.clearCanvas();
        this.drawingEngine.drawnPaths = [];
        this.drawingEngine.currentPath = [];
        this.drawingEngine.isDrawing = false;
    }

    // Clear particle system
    if (this.particleGenerator) {
        this.particleGenerator.clear();
    }

    // Reset animal
    this.currentAnimal = null;

    // Clear obstacles and path points
    this.obstacles = [];
    this.startPoint = null;
    this.endPoint = null;

    // Hide next button + reset help text
    this.hideNextButton();
    this.updateHelpText("Draw any path to help me get home!");
}

    
    clearDrawing() {
        // Clear only the drawing layer, keep game elements
        this.drawingEngine.clearCanvas();
    }
    
    distance(p1, p2) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    updateHelpText(text) {
        const helpElement = document.querySelector('.help-text');
        if (helpElement) {
            helpElement.textContent = text;
        }
    }
    
    showNextButton() {
        const button = document.getElementById('nextLevel');
        button.style.display = 'block';
    }
    
    hideNextButton() {
        const button = document.getElementById('nextLevel');
        button.style.display = 'none';
    }
    
    dispose() {
        this.isGameRunning = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        this.particleGenerator.stop();
        this.audioSynthesizer.dispose();
    }
}

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 DOM loaded, creating Free-Form Path Game...');
    window.pathHomeGame = new PathHomeGame();
});

// Handle page visibility clearAll
document.addEventListener('visibilitychange', () => {
    if (window.pathHomeGame) {
        if (document.hidden) {
            window.pathHomeGame.isGameRunning = false;
        } else {
            if (window.pathHomeGame.isInitialized) {
                window.pathHomeGame.isGameRunning = true;
                window.pathHomeGame.startGameLoop();
            }
        }
    }
});