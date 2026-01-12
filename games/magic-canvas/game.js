// ==========================================
// MAGIC CANVAS GAME FOR 3-YEAR-OLDS
// ==========================================

class MagicCanvas {
    constructor() {
        this.canvas = document.getElementById('magicCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.sparklesContainer = document.getElementById('sparkles');
        
        // Game state
        this.isDrawing = false;
        this.currentTool = 'brush';
        this.currentColor = '#FF3B3B';
        this.currentNumber = '1';
        this.brushSize = 20;
        
        // Position tracking
        this.lastX = 0;
        this.lastY = 0;
        
        // Performance & spam prevention
        this.lastDrawTime = 0;
        this.drawThrottle = 16; // 60fps max
        this.lastToolChange = 0;
        this.toolChangeThrottle = 300; // Prevent rapid tool switching
        
        // Rainbow brush state
        this.rainbowHue = 0;
        
        // Shape placement mode
        this.isPlacingShape = false;
        this.pendingShape = null;
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.preventZoomAndScroll();
        
        console.log('🎨 Magic Canvas initialized!');
        
        // Welcome message
        setTimeout(() => {
            this.speakText("Welcome to Magic Canvas! Choose your tools and start creating!");
        }, 1000);
    }
    
    setupCanvas() {
        // Set canvas to fill container
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        // Set canvas size
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        // High DPI support
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width *= dpr;
        this.canvas.height *= dpr;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        this.ctx.scale(dpr, dpr);
        
        // Store actual dimensions
        this.canvasWidth = rect.width;
        this.canvasHeight = rect.height;
        
        // Set up canvas properties
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.imageSmoothingEnabled = true;
        
        // Clear to white background
        this.clearCanvas();
        
        window.addEventListener('resize', () => {
            setTimeout(() => this.setupCanvas(), 100);
        });
    }
    
    setupEventListeners() {
        // Tool selection
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleToolClick(btn);
            });
        });
        
        // Color selection
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleColorClick(btn);
            });
        });
        
        // Clear button
        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clearCanvas();
            this.createSparkleEffect(this.canvasWidth / 2, this.canvasHeight / 2);
            this.speakText("Canvas cleared! Ready to create something new!");
        });
        
        // Canvas drawing events
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.throttledDraw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));
        
        // Touch events
        this.canvas.addEventListener('touchstart', this.startDrawing.bind(this));
        this.canvas.addEventListener('touchmove', this.throttledDraw.bind(this));
        this.canvas.addEventListener('touchend', this.stopDrawing.bind(this));
        this.canvas.addEventListener('touchcancel', this.stopDrawing.bind(this));
        
        // Prevent context menu
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    
    preventZoomAndScroll() {
        // Prevent zoom
        document.addEventListener('touchmove', (e) => {
            if (e.scale !== 1) { e.preventDefault(); }
        }, { passive: false });
        
        // Prevent pull-to-refresh
        document.body.style.overscrollBehavior = 'none';
        
        // Prevent canvas scrolling
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
    }
    
    // SPAM-PROOF TOOL HANDLING
    handleToolClick(btn) {
        const currentTime = Date.now();
        
        // Throttle tool changes to prevent spam
        if (currentTime - this.lastToolChange < this.toolChangeThrottle) {
            return;
        }
        
        this.lastToolChange = currentTime;
        
        const tool = btn.dataset.tool;
        const voice = btn.dataset.voice;
        const number = btn.dataset.number;
        
        // Update tool selection UI
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Set current tool
        this.currentTool = tool;
        
        if (number) {
            this.currentNumber = number;
        }
        
        // Audio feedback
        this.speakText(voice);
        
        // Visual feedback
        this.animateButton(btn);
        
        // Tool-specific setup
        this.setupToolCursor();
        
        console.log(`🛠️ Tool changed to: ${tool}`);
    }
    
    handleColorClick(btn) {
        const color = btn.dataset.color;
        const voice = btn.dataset.voice;
        
        // Update color selection UI
        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        this.currentColor = color;
        
        // Enhanced audio feedback
        if (window.audioSystem && window.audioSystem.isInitialized) {
            window.audioSystem.speakColor(voice.replace('!', ''));
            window.audioSystem.playSoundEffect('chime');
        } else {
            this.speakText(voice);
        }
        
        // Visual feedback
        this.animateButton(btn);
        
        console.log(`🎨 Color changed to: ${color}`);
    }
    
    animateButton(btn) {
        btn.style.transform = 'scale(1.2)';
        setTimeout(() => {
            btn.style.transform = '';
        }, 200);
    }
    
    setupToolCursor() {
        switch (this.currentTool) {
            case 'eraser':
                this.canvas.style.cursor = 'grab';
                break;
            case 'circle':
            case 'square':
            case 'triangle':
            case 'star':
            case 'number':
                this.canvas.style.cursor = 'crosshair';
                break;
            default:
                this.canvas.style.cursor = 'crosshair';
        }
    }
    
    // DRAWING EVENT HANDLERS
    startDrawing(e) {
        e.preventDefault();
        
        const pos = this.getEventPos(e);
        this.lastX = pos.x;
        this.lastY = pos.y;
        
        // Handle different tools
        if (this.isShapeTool() || this.currentTool === 'number') {
            this.placeShape(pos.x, pos.y);
            return;
        }
        
        this.isDrawing = true;
        
        // Create sparkle effect
        this.createSparkleEffect(pos.x, pos.y);
        
        // Play drawing sound
        if (window.audioSystem && window.audioSystem.isInitialized) {
            window.audioSystem.playSoundEffect('pop');
        }
        
        // Start drawing
        this.draw(e);
    }
    
    throttledDraw(e) {
        if (!this.isDrawing) return;
        
        const now = Date.now();
        if (now - this.lastDrawTime >= this.drawThrottle) {
            this.draw(e);
            this.lastDrawTime = now;
        }
    }
    
    draw(e) {
        if (!this.isDrawing) return;
        
        const pos = this.getEventPos(e);
        
        switch (this.currentTool) {
            case 'brush':
                this.drawBrush(pos.x, pos.y);
                break;
            case 'rainbow':
                this.drawRainbow(pos.x, pos.y);
                break;
            case 'sparkle':
                this.drawSparkle(pos.x, pos.y);
                break;
            case 'eraser':
                this.drawEraser(pos.x, pos.y);
                break;
        }
        
        this.lastX = pos.x;
        this.lastY = pos.y;
    }
    
    stopDrawing(e) {
        if (!this.isDrawing) return;
        
        this.isDrawing = false;
        
        // Create final sparkle effect
        const pos = this.getEventPos(e);
        if (pos) {
            this.createSparkleEffect(pos.x, pos.y);
        }
    }
    
    getEventPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        
        let clientX, clientY;
        
        if (e.touches && e.touches[0]) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }
    
    // DRAWING TOOLS
    drawBrush(x, y) {
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.lineWidth = this.brushSize;
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
    }
    
    drawRainbow(x, y) {
        this.ctx.globalCompositeOperation = 'source-over';
        
        // Create rainbow effect
        this.rainbowHue += 5;
        if (this.rainbowHue > 360) this.rainbowHue = 0;
        
        this.ctx.strokeStyle = `hsl(${this.rainbowHue}, 80%, 60%)`;
        this.ctx.lineWidth = this.brushSize;
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
        
        // Add sparkle trail
        if (Math.random() < 0.3) {
            this.createSparkleEffect(x, y);
        }
    }
    
    drawSparkle(x, y) {
        this.ctx.globalCompositeOperation = 'source-over';
        
        // Draw with current color
        this.ctx.fillStyle = this.currentColor;
        
        // Create sparkle pattern
        for (let i = 0; i < 3; i++) {
            const offsetX = (Math.random() - 0.5) * this.brushSize;
            const offsetY = (Math.random() - 0.5) * this.brushSize;
            
            this.ctx.beginPath();
            this.ctx.arc(x + offsetX, y + offsetY, Math.random() * 8 + 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Visual sparkle effect
        this.createSparkleEffect(x, y);
    }
    
    drawEraser(x, y) {
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.lineWidth = this.brushSize * 1.5;
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
    }
    
    // SHAPE PLACEMENT
    isShapeTool() {
        return ['circle', 'square', 'triangle', 'star'].includes(this.currentTool);
    }
    
    placeShape(x, y) {
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.fillStyle = this.currentColor;
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.lineWidth = 3;
        
        const size = 40;
        
        switch (this.currentTool) {
            case 'circle':
                this.drawCircle(x, y, size);
                break;
            case 'square':
                this.drawSquare(x, y, size);
                break;
            case 'triangle':
                this.drawTriangle(x, y, size);
                break;
            case 'star':
                this.drawStar(x, y, size);
                break;
            case 'number':
                this.drawNumber(x, y, this.currentNumber);
                break;
        }
        
        // Create celebration effect
        this.createSparkleEffect(x, y);
        
        // Play success sound
        if (window.audioSystem && window.audioSystem.isInitialized) {
            window.audioSystem.playSoundEffect('success');
        }
    }
    
    drawCircle(x, y, size) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
    }
    
    drawSquare(x, y, size) {
        this.ctx.fillRect(x - size / 2, y - size / 2, size, size);
        this.ctx.strokeRect(x - size / 2, y - size / 2, size, size);
    }
    
    drawTriangle(x, y, size) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - size / 2);
        this.ctx.lineTo(x - size / 2, y + size / 2);
        this.ctx.lineTo(x + size / 2, y + size / 2);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
    }
    
    drawStar(x, y, size) {
        const spikes = 5;
        const outerRadius = size / 2;
        const innerRadius = outerRadius * 0.4;
        
        this.ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / spikes;
            const pointX = x + Math.cos(angle - Math.PI / 2) * radius;
            const pointY = y + Math.sin(angle - Math.PI / 2) * radius;
            
            if (i === 0) {
                this.ctx.moveTo(pointX, pointY);
            } else {
                this.ctx.lineTo(pointX, pointY);
            }
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
    }
    
    drawNumber(x, y, number) {
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = this.currentColor;
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        
        this.ctx.fillText(number, x, y);
        this.ctx.strokeText(number, x, y);
        
        // Speak the number
        if (window.audioSystem && window.audioSystem.isInitialized) {
            window.audioSystem.speakNumber(parseInt(number));
        }
    }
    
    // VISUAL EFFECTS
    createSparkleEffect(x, y) {
        const sparkles = ['✨', '⭐', '🌟', '💫', '🎵'];
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.textContent = sparkles[Math.floor(Math.random() * sparkles.length)];
        sparkle.style.left = x + 'px';
        sparkle.style.top = y + 'px';
        
        this.sparklesContainer.appendChild(sparkle);
        
        // Remove after animation
        setTimeout(() => {
            if (sparkle.parentNode) {
                sparkle.parentNode.removeChild(sparkle);
            }
        }, 2000);
    }
    
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // Set white background
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    }
    
    // AUDIO METHODS
    speakText(text) {
        if (window.audioSystem && window.audioSystem.isInitialized) {
            window.audioSystem.speak(text);
        } else {
            // Fallback speech
            if ('speechSynthesis' in window) {
                speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = 0.8;
                utterance.pitch = 1.3;
                utterance.volume = 0.8;
                speechSynthesis.speak(utterance);
            }
        }
    }
}

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
    window.magicCanvas = new MagicCanvas();
});