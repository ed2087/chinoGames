// ==========================================
// SHAPE BLASTER ACADEMY - Main Game Controller
// ==========================================

class ShapeBlasterGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Resize canvas
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Game state this.targetCount = Math.min(30 + this.level * 2, 50);
        this.gameStarted = false;
        this.roundActive = false;
        this.level = 1;
        this.score = 0;
        this.targetShape = null;
        this.targetColor = null;
        this.destroyedCount = 0;
        this.targetCount = 20 + Math.floor(Math.random() * 21); // Random 20-40
        
        // Game objects completeRound
        this.particles = [];
        this.shapes = [];
        this.missiles = [];
        this.turrets = [];
        
        // Timing
        this.lastTime = 0;
        this.spawnTimer = 0;
        this.spawnDelay = 1500; // ms between spawns
        
        // Shape/Color definitions
        this.shapeTypes = [
            { name: 'Circle', draw: this.drawCircle, speech: 'circle' },
            { name: 'Square', draw: this.drawSquare, speech: 'square' },
            { name: 'Triangle', draw: this.drawTriangle, speech: 'triangle' },
            { name: 'Star', draw: this.drawStar, speech: 'star' },
            { name: 'Heart', draw: this.drawHeart, speech: 'heart' }
        ];
        
        this.colors = [
            { name: 'Red', hex: '#FF4757', speech: 'red' },
            { name: 'Blue', hex: '#3742FA', speech: 'blue' },
            { name: 'Yellow', hex: '#FFC312', speech: 'yellow' },
            { name: 'Green', hex: '#06D6A0', speech: 'green' },
            { name: 'Orange', hex: '#FF6B35', speech: 'orange' },
            { name: 'Purple', hex: '#A55EEA', speech: 'purple' },
            { name: 'Pink', hex: '#FF69B4', speech: 'pink' }
        ];
        
        this.init();
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }
    
    init() {
        // Start button
        document.getElementById('startButton').addEventListener('click', () => {
            this.startGame();
        });
        
        // Click to shoot missiles
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleClick(touch);
        }, { passive: false });
        
        // Initialize UI controller
        this.ui = new UIController(this);
        
        // Start animation loop
        this.animate();
    }
    
    startGame() {
        // Hide start screen
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('gameUI').style.display = 'block';
        
        this.gameStarted = true;
        
        // Create turrets
        const turretY = this.height - 100;
        const spacing = this.width / 4;
        
        this.turrets = [
            new LightningTurret(spacing, turretY, this),
            new LaserTurret(spacing * 2, turretY, this),
            new ProjectileTurret(spacing * 3, turretY, this)
        ];
        
        // Start first round
        setTimeout(() => {
            this.startRound();
        }, 500);
    }
    
    startRound() {
        // Choose random target
        this.targetShape = this.shapeTypes[Math.floor(Math.random() * this.shapeTypes.length)];
        this.targetColor = this.colors[Math.floor(Math.random() * this.colors.length)];
        this.destroyedCount = 0;
        
        // Show popup
        this.ui.showTargetPopup(this.targetShape, this.targetColor, () => {
            this.roundActive = true;
            this.spawnTimer = 0;
            this.speak(`Find the ${this.targetColor.speech} ${this.targetShape.speech}!`);
        });
    }
    
    handleClick(e) {
        if (!this.roundActive) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX || e.pageX) - rect.left;
        const y = (e.clientY || e.pageY) - rect.top;
        
        // Check if clicked on a shape
        for (let i = this.shapes.length - 1; i >= 0; i--) {
            const shape = this.shapes[i];
            const dist = Math.hypot(x - shape.x, y - shape.y);
            
            if (dist < shape.size) {
                // Launch homing missile
                this.missiles.push(new HomingMissile(x, y, shape, this));
                this.playSound('missile');
                break;
            }
        }
    }
    
    update(deltaTime) {
        if (!this.gameStarted) return;
        
        // Update turrets
        this.turrets.forEach(turret => turret.update(deltaTime));
        
        // Spawn shapes
        if (this.roundActive) {
            this.spawnTimer += deltaTime;
            
            if (this.spawnTimer > this.spawnDelay) {
                this.spawnShape();
                this.spawnTimer = 0;
            }
        }
        
        // Update shapes
        for (let i = this.shapes.length - 1; i >= 0; i--) {
            const shape = this.shapes[i];
            shape.update(deltaTime);
            
            // Remove if off screen
            if (shape.y > this.height + 100) {
                this.shapes.splice(i, 1);
            }
        }
        
        // Update missiles
        for (let i = this.missiles.length - 1; i >= 0; i--) {
            const missile = this.missiles[i];
            missile.update(deltaTime);
            
            if (missile.dead) {
                this.missiles.splice(i, 1);
            }
        }
        
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.update(deltaTime);
            
            if (particle.dead) {
                this.particles.splice(i, 1);
            }
        }
        
        // Check for round completion
        if (this.roundActive && this.destroyedCount >= this.targetCount) {
            this.completeRound();
        }
    }
    
spawnShape() {
    // Mix of correct and wrong shapes
    let shape, color;
    
    if (Math.random() < 0.75) {
        // 75% chance correct target (MORE ACTION!)
        shape = this.targetShape;
        color = this.targetColor;
    } else {
        // 25% chance wrong shape/color (some distractions)
        shape = this.shapeTypes[Math.floor(Math.random() * this.shapeTypes.length)];
        color = this.colors[Math.floor(Math.random() * this.colors.length)];
    }
    
    const x = 100 + Math.random() * (this.width - 200);
    const y = -50;
    
    this.shapes.push(new FallingShape(x, y, shape, color, this));
}
    
destroyShape(shape, isCorrect) {
    // Remove shape
    const index = this.shapes.indexOf(shape);
    if (index > -1) {
        this.shapes.splice(index, 1);
    }
    
    // Create explosion
    this.createExplosion(shape.x, shape.y, shape.color.hex, isCorrect ? 30 : 15);
    
    if (isCorrect) {
        this.destroyedCount++;
        this.score += 10;
        this.ui.updateScore(this.score);
        this.ui.updateProgress(this.destroyedCount, this.targetCount);
        this.playSound('hit');
        
        // Only speak every 10 hits instead of EVERY hit
        if (this.destroyedCount % 10 === 0) {
            this.speak('Great job!');
        }
    } else {
        this.playSound('wrong');
    }
    
    // Screen shake on correct hit
    if (isCorrect) {
        this.screenShake();
    }
}
    
    createExplosion(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }
    
    screenShake() {
        const intensity = 10;
        this.canvas.style.transform = `translate(${Math.random() * intensity - intensity/2}px, ${Math.random() * intensity - intensity/2}px)`;
        
        setTimeout(() => {
            this.canvas.style.transform = 'translate(0, 0)';
        }, 50);
    }
    
    completeRound() {
        this.roundActive = false;
        this.level++;
        
        this.ui.updateLevel(this.level);
        this.speak('Great job! Level complete!');
        this.playSound('levelup');
        
        // Clear remaining shapes spawnShape
        this.shapes = [];
        
        // Next round after delay
        setTimeout(() => {
            this.targetCount = 20 + Math.floor(Math.random() * 21); // Random 20-40
            this.spawnDelay = Math.max(800, 1500 - this.level * 50); // Faster spawning
            this.startRound();
        }, 3000);
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#0a0e27';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw stars background
        this.drawStars();
        
        // Draw turrets
        this.turrets.forEach(turret => turret.draw(this.ctx));
        
        // Draw shapes
        this.shapes.forEach(shape => shape.draw(this.ctx));
        
        // Draw missiles
        this.missiles.forEach(missile => missile.draw(this.ctx));
        
        // Draw particles
        this.particles.forEach(particle => particle.draw(this.ctx));
    }
    
    drawStars() {
        // Simple star field
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        const time = Date.now() * 0.0001;
        
        for (let i = 0; i < 50; i++) {
            const x = (i * 127) % this.width;
            const y = (i * 211 + time * 20) % this.height;
            this.ctx.fillRect(x, y, 2, 2);
        }
    }
    
    animate(currentTime = 0) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.draw();
        
        requestAnimationFrame((t) => this.animate(t));
    }
    
    // Shape drawing functions
    drawCircle(ctx, x, y, size, color) {
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.stroke();
    }
    
    drawSquare(ctx, x, y, size, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x - size, y - size, size * 2, size * 2);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.strokeRect(x - size, y - size, size * 2, size * 2);
    }
    
    drawTriangle(ctx, x, y, size, color) {
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size, y + size);
        ctx.lineTo(x - size, y + size);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.stroke();
    }
    
    drawStar(ctx, x, y, size, color) {
        const spikes = 5;
        const outerRadius = size;
        const innerRadius = size * 0.5;
        
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / spikes - Math.PI / 2;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.stroke();
    }
    
    drawHeart(ctx, x, y, size, color) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(size / 40, size / 40);
        
        ctx.beginPath();
        ctx.moveTo(0, 10);
        ctx.bezierCurveTo(0, 0, -20, -10, -20, -20);
        ctx.bezierCurveTo(-20, -30, -10, -35, 0, -25);
        ctx.bezierCurveTo(10, -35, 20, -30, 20, -20);
        ctx.bezierCurveTo(20, -10, 0, 0, 0, 10);
        ctx.closePath();
        
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.restore();
    }
    
    // Audio
    speak(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1.3;
            speechSynthesis.speak(utterance);
        }
    }
    
    playSound(type) {
        // Basic sound effects using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        switch(type) {
            case 'hit':
                oscillator.frequency.value = 800;
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.2);
                break;
            case 'wrong':
                oscillator.frequency.value = 200;
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.3);
                break;
            case 'missile':
                oscillator.frequency.value = 1200;
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.1);
                break;
            case 'levelup':
                oscillator.frequency.value = 523;
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.5);
                break;
        }
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    window.game = new ShapeBlasterGame();
});