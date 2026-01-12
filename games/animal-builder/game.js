// ==========================================
// ANIMAL BUILDER GAME - Two-Click System
// Select shape, then click placement location
// ==========================================

class AnimalBuilderGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.animalEngine = null;
        
        // Game state
        this.currentAnimalId = 'bird';
        this.selectedShape = null; // NEW: Currently selected shape type
        
        // UI elements
        this.elements = {
            canvas: null,
            shapePalette: null,
            animalSelector: null,
            progressDisplay: null
        };
        
        // Animation
        this.animationId = null;
        this.isInitialized = false;
        
        console.log('🎮 AnimalBuilderGame created');
    }
    
    // ==========================================
    // INITIALIZATION
    // ==========================================
    
    async init() {
        try {
            // Get DOM elements
            this.setupElements();
            
            // Initialize canvas
            this.setupCanvas();
            
            // Initialize animal engine
            this.animalEngine = new AnimalEngine(this.canvas, window.audioSystem);
            
            // Setup UI
            this.setupUI();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Set initial animal
            this.changeAnimal(this.currentAnimalId);
            
            // Start game loop
            this.startGameLoop();
            
            this.isInitialized = true;
            console.log('🎮 AnimalBuilderGame initialized successfully');
            
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize AnimalBuilderGame:', error);
            return false;
        }
    }
    
    setupElements() {
        this.elements.canvas = document.getElementById('gameCanvas');
        this.elements.shapePalette = document.getElementById('shapePalette');
        this.elements.animalSelector = document.getElementById('animalSelector');
        this.elements.progressDisplay = document.getElementById('progressDisplay');
        
        if (!this.elements.canvas) {
            throw new Error('Game canvas not found');
        }
        
        this.canvas = this.elements.canvas;
        this.ctx = this.canvas.getContext('2d');
    }
    
    setupCanvas() {
        // Set canvas size
        this.resizeCanvas();
        
        // Handle resize 
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });
        
        console.log('🖼️ Canvas setup complete');
    }
    
    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        
        // Set actual canvas size
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        // Store canvas dimensions for animal engine
        this.canvasWidth = rect.width;
        this.canvasHeight = rect.height;
        
        console.log(`📏 Canvas resized to: ${rect.width}x${rect.height}`);
    }
    
    // ==========================================
    // UI SETUP
    // ==========================================
    
    setupUI() {
        this.setupShapePalette();
        this.setupAnimalSelector();
        this.updateProgressDisplay();
    }
    
    setupShapePalette() {
        const paletteShapes = document.getElementById('paletteShapes');
        if (!paletteShapes) return;
        
        paletteShapes.innerHTML = '';
        
        // Always show all basic shapes regardless of current animal
        const allShapeTypes = ['circle', 'oval', 'triangle', 'rectangle', 'diamond'];
        
        allShapeTypes.forEach(shapeType => {
            const shapeElement = this.createPaletteShape(shapeType);
            paletteShapes.appendChild(shapeElement);
        });
        
        console.log('🎨 Shape palette setup with all shape types');
    }
    
    createPaletteShape(shapeType) {
        const shapeElement = document.createElement('div');
        shapeElement.className = 'palette-shape';
        shapeElement.dataset.shapeType = shapeType;
        
        // Add shape visual
        const canvas = document.createElement('canvas');
        canvas.width = 60;
        canvas.height = 60;
        const ctx = canvas.getContext('2d');
        
        this.drawPaletteShapePreview(ctx, shapeType);
        shapeElement.appendChild(canvas);
        
        // Add click functionality (NEW)
        this.makeClickable(shapeElement);
        
        return shapeElement;
    }
    
    drawPaletteShapePreview(ctx, shapeType) {
        ctx.save();
        
        // Use the same colors as the outlines
        const shapeColors = {
            'circle': '#e74c3c',
            'oval': '#3498db',
            'triangle': '#f39c12',
            'rectangle': '#27ae60',
            'diamond': '#9b59b6'
        };
        
        const color = shapeColors[shapeType] || '#e74c3c';
        
        ctx.fillStyle = color + '40';
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.translate(30, 30);
        
        ctx.beginPath();
        switch (shapeType) {
            case 'circle':
                ctx.arc(0, 0, 15, 0, Math.PI * 2);
                break;
            case 'oval':
                ctx.save();
                ctx.scale(1.5, 1);
                ctx.arc(0, 0, 12, 0, Math.PI * 2);
                ctx.restore();
                break;
            case 'triangle':
                ctx.moveTo(0, -12);
                ctx.lineTo(-10, 10);
                ctx.lineTo(10, 10);
                ctx.closePath();
                break;
            case 'rectangle':
                ctx.rect(-12, -9, 24, 18);
                break;
            case 'diamond':
                ctx.moveTo(0, -12);
                ctx.lineTo(9, 0);
                ctx.lineTo(0, 12);
                ctx.lineTo(-9, 0);
                ctx.closePath();
                break;
        }
        
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
    
    setupAnimalSelector() {
        const animalOptions = document.getElementById('animalOptions');
        if (!animalOptions) return;
        
        animalOptions.innerHTML = '';
        
        AnimalData.getAllAnimals().forEach(animalId => {
            const animal = AnimalData.getAnimal(animalId);
            const option = document.createElement('div');
            option.className = 'animal-option';
            option.dataset.animalId = animalId;
            option.innerHTML = `${animal.emoji} ${animal.name}`;
            
            if (animalId === this.currentAnimalId) {
                option.classList.add('active');
            }
            
            option.addEventListener('click', () => {
                this.changeAnimal(animalId);
            });
            
            animalOptions.appendChild(option);
        });
        
        console.log('🦋 Animal selector setup');
    }
    
    // ==========================================
    // NEW: TWO-CLICK SYSTEM
    // ==========================================
    
    makeClickable(element) {
        const handleClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const shapeType = element.dataset.shapeType;
            this.selectShape(shapeType);
            
            // Visual feedback
            element.style.transform = 'scale(0.9)';
            setTimeout(() => {
                element.style.transform = '';
            }, 100);
        };
        
        element.addEventListener('click', handleClick);
        element.addEventListener('touchend', handleClick);
    }
    
    selectShape(shapeType) {
        // Deselect previous shape
        const previousSelected = document.querySelector('.palette-shape.selected');
        if (previousSelected) {
            previousSelected.classList.remove('selected');
        }
        
        // Select new shape
        this.selectedShape = shapeType;
        
        // Add visual indicator
        const shapeElement = document.querySelector(`.palette-shape[data-shape-type="${shapeType}"]`);
        if (shapeElement) {
            shapeElement.classList.add('selected');
        }
        
        // Update cursor
        this.canvas.style.cursor = 'crosshair';
        
        // Audio feedback
        if (window.audioSystem?.isInitialized) {
            window.audioSystem.playSoundEffect('pop');
            
            // Speak the shape name
            setTimeout(() => {
                window.audioSystem.speakShape(shapeType);
            }, 100);
        }
        
        console.log(`✅ Selected shape: ${shapeType}`);
    }
    
    handleCanvasClick(e) {
        if (!this.selectedShape) {
            // No shape selected - give hint
            if (window.audioSystem?.isInitialized) {
                window.audioSystem.speak("Pick a shape first!");
            }
            return;
        }
        
        // Get click position
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Try to place the shape
        const result = this.animalEngine.attemptPlaceShape(
            this.selectedShape,
            x,
            y
        );
        
        if (result.success) {
            console.log(`✅ Successfully placed ${this.selectedShape}`);
            
            // Clear selection after successful placement
            this.clearSelection();
            
        } else {
            console.log(`❌ Wrong placement for ${this.selectedShape}`);
            
            // Keep shape selected so they can try again
            // Audio feedback is handled by animal engine
        }
    }
    
    clearSelection() {
        this.selectedShape = null;
        
        // Remove visual indicators
        const selected = document.querySelector('.palette-shape.selected');
        if (selected) {
            selected.classList.remove('selected');
        }
        
        // Reset cursor
        this.canvas.style.cursor = 'default';
    }
    
    // ==========================================
    // GAME LOGIC
    // ==========================================
    
    changeAnimal(animalId) {
        const success = this.animalEngine.setCurrentAnimal(animalId);
        if (!success) return;
        
        this.currentAnimalId = animalId;
        
        // Clear any selected shape when changing animals
        this.clearSelection();
        
        // Update UI
        this.setupShapePalette();
        this.updateAnimalSelector();
        this.updateProgressDisplay();
        
        console.log(`🦋 Changed to animal: ${animalId}`);
    }
    
    updateAnimalSelector() {
        const options = document.querySelectorAll('.animal-option');
        options.forEach(option => {
            option.classList.toggle('active', option.dataset.animalId === this.currentAnimalId);
        });
    }
    
    updateProgressDisplay() {
        const animal = AnimalData.getAnimal(this.currentAnimalId);
        if (!animal) return;
        
        const progressAnimal = document.getElementById('progressAnimal');
        const progressText = document.getElementById('progressText');
        const progressFill = document.getElementById('progressFill');
        
        if (progressAnimal) progressAnimal.textContent = animal.emoji;
        if (progressText) progressText.textContent = `Let's build a ${animal.name}!`;
        if (progressFill) {
            const progress = this.animalEngine.getProgress();
            progressFill.style.width = `${progress * 100}%`;
        }
    }
    
    // ==========================================
    // EVENT HANDLERS
    // ==========================================
    
    setupEventListeners() {
        // Canvas click for placement
        this.canvas.addEventListener('click', (e) => {
            this.handleCanvasClick(e);
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            const mouseEvent = new MouseEvent('click', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.handleCanvasClick(mouseEvent);
        });
        
        // Animal progress events
        document.addEventListener('animalProgress', (e) => {
            this.updateProgressDisplay();
        });
        
        // Animal completion events
        document.addEventListener('animalComplete', (e) => {
            // Clear selection on completion
            this.clearSelection();
            
            setTimeout(() => {
                this.updateProgressDisplay();
            }, 2000);
        });
        
        // Audio permission events
        document.addEventListener('audioEnabled', () => {
            setTimeout(() => {
                if (window.audioSystem?.isInitialized) {
                    window.audioSystem.speak("Welcome to Animal Builder! Pick a shape and click where it goes!");
                }
            }, 1000);
        });
        
        console.log('📡 Event listeners setup');
    }
    
    // ==========================================
    // GAME LOOP
    // ==========================================
    
    startGameLoop() {
        const gameLoop = () => {
            if (this.isInitialized) {
                this.update();
                this.render();
            }
            
            this.animationId = requestAnimationFrame(gameLoop);
        };
        
        gameLoop();
        console.log('🔄 Game loop started');
    }
    
    update() {
        // Update game logic here if needed
    }
    
    render() {
        if (!this.animalEngine) return;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render animal
        this.animalEngine.render();
        
        // Render selected shape preview at cursor (optional)
        // You can add cursor preview here if desired
    }
    
    // ==========================================
    // CLEANUP
    // ==========================================
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        if (this.animalEngine) {
            this.animalEngine.destroy();
        }
        
        this.isInitialized = false;
        console.log('🗑️ AnimalBuilderGame destroyed');
    }
}

// ==========================================
// INITIALIZATION
// ==========================================

let animalBuilderGame = null;

function initializeAnimalBuilder() {
    if (animalBuilderGame) {
        console.warn('Game already initialized');
        return animalBuilderGame;
    }
    
    try {
        animalBuilderGame = new AnimalBuilderGame();
        
        // Initialize after audio permission
        document.addEventListener('audioEnabled', async () => {
            const success = await animalBuilderGame.init();
            
            if (success) {
                console.log('🎮 Animal Builder ready to play!');
                window.animalBuilderGame = animalBuilderGame;
                
                document.dispatchEvent(new CustomEvent('gameReady', { 
                    detail: { game: animalBuilderGame } 
                }));
            } else {
                console.error('Failed to initialize Animal Builder');
            }
        });
        
        return animalBuilderGame;
        
    } catch (error) {
        console.error('Failed to create Animal Builder:', error);
        return null;
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAnimalBuilder);
} else {
    initializeAnimalBuilder();
}

console.log('🎮 Animal Builder Game loaded - Two-click system ready!');