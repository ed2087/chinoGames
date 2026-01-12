// ==========================================
// NUMBER SMASH GAME CONFIGURATION
// ==========================================

const CONFIG = {
    // GAME SETTINGS
    game: {
        startNumber: 1,
        endNumber: 10,
        particlesPerNumber: 1200,    // Particles to form each number
        numberSize: 300,            // Size of the number display
        destructionRadius: 40,      // Touch/click destruction radius
    },
    
    // PHYSICS SETTINGS
    physics: {
        gravity: 0.3,
        bounce: 0.7,
        friction: 0.98,
        windResistance: 0.999,
        floorLevel: 0.9,            // Floor at 90% of screen height
    },
    
    // PARTICLE SETTINGS
    particles: {
        minSize: 3,
        maxSize: 8,
        destroyForce: 15,           // Force when particles are destroyed
        formationSpeed: 3,          // Speed particles move into number formation
        explosionParticles: 50,     // Extra particles on destruction
    },
    
    // VISUAL EFFECTS
    effects: {
        entranceAnimation: true,
        exitAnimation: true,
        celebrationOnComplete: true,
        screenShake: true,
        colorfulExplosions: true,
    },
    
    // VOICE SETTINGS
    voice: {
        enabled: true,
        rate: 0.7,
        pitch: 1.2,
        volume: 1.0,
        sayOnAppear: true,
        sayOnDestroy: true,
    },
    
    // COLORS FOR NUMBERS (rainbow progression)
    numberColors: [
        '#FF4757', '#FF6B35', '#FFC312', '#06D6A0', '#3742FA',
        '#A55EEA', '#FF3F7F', '#2C2C2C', '#8B4513', '#6C757D'
    ],
    
    // DEBUG
    debug: {
        enabled: true,
        showHitboxes: false,
        logDestruction: true,
    }
};

// ==========================================
// MAIN GAME CLASS
// ==========================================

class NumberSmashGame {
    constructor() {
        this.canvas = document.getElementById('numberCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.currentNumber = CONFIG.game.startNumber;
        this.gameComplete = false;
        this.numberParticles = [];
        this.fallingParticles = [];
        this.isForming = false;
        this.isDestroying = false;
        this.numberFormed = false;
        
        // Touch/mouse state
        this.isPointerDown = false;
        this.pointerX = 0;
        this.pointerY = 0;
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.updateProgressDisplay();
        
        if (CONFIG.debug.enabled) {
            console.log('🔢 Number Smash Game initialized!');
        }
        
        // Wait for audio permission before starting
        document.addEventListener('audioEnabled', () => {
            setTimeout(() => {
                this.startNextNumber();
            }, 1000);
        });
        
        // Start game loop
        this.gameLoop();
    }
    
    setupCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        // High DPI support
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width *= dpr;
        this.canvas.height *= dpr;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        this.ctx.scale(dpr, dpr);
        
        // Store actual canvas dimensions
        this.canvasWidth = rect.width;
        this.canvasHeight = rect.height;
        
        window.addEventListener('resize', () => {
            this.setupCanvas();
        });
    }
    
    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => {
            this.handlePointerStart(e.clientX, e.clientY);
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isPointerDown) {
                this.handlePointerMove(e.clientX, e.clientY);
            }
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.handlePointerEnd();
        });
        
        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handlePointerStart(touch.clientX, touch.clientY);
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (e.touches[0]) {
                const touch = e.touches[0];
                this.handlePointerMove(touch.clientX, touch.clientY);
            }
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handlePointerEnd();
        });
        
        // Prevent context menu
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    
    handlePointerStart(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        this.pointerX = clientX - rect.left;
        this.pointerY = clientY - rect.top;
        this.isPointerDown = true;
        
        if (this.numberFormed && !this.isDestroying) {
            this.destroyParticlesAtPoint(this.pointerX, this.pointerY);
        }
    }
    
    handlePointerMove(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        this.pointerX = clientX - rect.left;
        this.pointerY = clientY - rect.top;
        
        if (this.numberFormed && !this.isDestroying) {
            this.destroyParticlesAtPoint(this.pointerX, this.pointerY);
        }
    }
    
    handlePointerEnd() {
        this.isPointerDown = false;
    }
    
    // UPDATED METHOD: Better number formation announcement
    startNextNumber() {
        if (this.currentNumber > CONFIG.game.endNumber) {
            this.gameComplete = true;
            this.celebrateCompletion();
            return;
        }
        
        this.updateCurrentNumberDisplay(`Number ${this.currentNumber}!`);
        this.updateProgressDisplay();
        
        // Enhanced audio feedback for number appearance
        if (window.audioSystem && window.audioSystem.isInitialized) {
            // Play sparkle sound when number appears
            window.audioSystem.playSoundEffect('sparkle');
            
            // Speak the number with enthusiasm
            setTimeout(() => {
                window.audioSystem.speakNumber(this.currentNumber);
            }, 800); // Wait for particles to start forming
            
            // Give instruction after number is spoken
            setTimeout(() => {
                window.audioSystem.speak('Tap to smash it!');
            }, 2500);
        } else {
            // Fallback
            if (CONFIG.voice.enabled && CONFIG.voice.sayOnAppear) {
                this.speakNumber(this.currentNumber);
            }
        }
        
        // Clear previous particles
        this.numberParticles = [];
        this.fallingParticles = [];
        this.isForming = true;
        this.isDestroying = false;
        this.numberFormed = false;
        
        // Create entrance animation
        this.createNumberFormation();
        
        if (CONFIG.debug.enabled) {
            console.log(`🔢 Starting number ${this.currentNumber}`);
        }
    }
    
    createNumberFormation() {
        const numberString = this.currentNumber.toString();
        const color = CONFIG.numberColors[(this.currentNumber - 1) % CONFIG.numberColors.length];
        
        // Get number shape points
        const shapePoints = this.getNumberShapePoints(numberString);
        
        // Use actual shape points count instead of fixed particle count
        const particleCount = shapePoints.length;
        
        // Create particles for entrance animation
        for (let i = 0; i < particleCount; i++) {
            const targetPoint = shapePoints[i];
            
            // Start particles from random positions around the screen edges
            const side = Math.floor(Math.random() * 4);
            let startX, startY;
            
            switch (side) {
                case 0: // Top
                    startX = Math.random() * this.canvasWidth;
                    startY = -20;
                    break;
                case 1: // Right
                    startX = this.canvasWidth + 20;
                    startY = Math.random() * this.canvasHeight;
                    break;
                case 2: // Bottom
                    startX = Math.random() * this.canvasWidth;
                    startY = this.canvasHeight + 20;
                    break;
                case 3: // Left
                    startX = -20;
                    startY = Math.random() * this.canvasHeight;
                    break;
            }
            
            this.numberParticles.push({
                x: startX,
                y: startY,
                targetX: targetPoint.x,
                targetY: targetPoint.y,
                vx: 0,
                vy: 0,
                size: CONFIG.particles.minSize + Math.random() * (CONFIG.particles.maxSize - CONFIG.particles.minSize),
                color: color,
                life: 1.0,
                forming: true,
                inPlace: false,
                hue: Math.random() * 360,
            });
        }
        
        if (CONFIG.debug.enabled) {
            console.log(`Created ${particleCount} particles for number ${numberString}`);
        }
    }
    
    getNumberShapePoints(numberString) {
        const points = [];
        const centerX = this.canvasWidth / 2;
        const centerY = this.canvasHeight / 2;
        const numberWidth = CONFIG.game.numberSize;
        const numberHeight = CONFIG.game.numberSize;
        
        // Create a temporary canvas to draw the number and sample points
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = numberWidth * 2;
        tempCanvas.height = numberHeight * 2;
        
        // Draw the number with thick font for better particle coverage
        tempCtx.fillStyle = '#FFFFFF';
        tempCtx.font = `bold ${numberHeight}px Arial`;
        tempCtx.textAlign = 'center';
        tempCtx.textBaseline = 'middle';
        tempCtx.fillText(numberString, numberWidth, numberHeight);
        
        // Sample points from the drawn number with consistent density
        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imageData.data;
        
        // Sample at consistent density regardless of number complexity
        const sampleStep = 3; // Smaller step = more particles
        
        for (let y = 0; y < tempCanvas.height; y += sampleStep) {
            for (let x = 0; x < tempCanvas.width; x += sampleStep) {
                const index = (y * tempCanvas.width + x) * 4;
                if (data[index + 3] > 128) { // Alpha > 128
                    points.push({
                        x: centerX + (x - numberWidth),
                        y: centerY + (y - numberHeight)
                    });
                }
            }
        }
        
        if (CONFIG.debug.enabled) {
            console.log(`Number ${numberString}: ${points.length} particles needed`);
        }
        
        return points.length > 0 ? points : [{ x: centerX, y: centerY }];
    }
    
    // UPDATED METHOD: Add sound effects to destruction
    destroyParticlesAtPoint(x, y) {
        let destroyedCount = 0;
        
        this.numberParticles.forEach((particle, index) => {
            if (!particle.inPlace) return;
            
            const dx = particle.x - x;
            const dy = particle.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < CONFIG.game.destructionRadius) {
                // Convert to falling particle
                const angle = Math.atan2(dy, dx);
                const force = CONFIG.particles.destroyForce;
                
                this.fallingParticles.push({
                    x: particle.x,
                    y: particle.y,
                    vx: Math.cos(angle) * force + (Math.random() - 0.5) * 10,
                    vy: Math.sin(angle) * force - Math.random() * 5,
                    size: particle.size,
                    color: particle.color,
                    life: 1.0,
                    decay: 0.02,
                    bounces: 0,
                });
                
                // Remove from number particles
                this.numberParticles.splice(index, 1);
                destroyedCount++;
            }
        });
        
        if (destroyedCount > 0) {
            // Play pop sound for destruction
            if (window.audioSystem && window.audioSystem.isInitialized) {
                window.audioSystem.playSoundEffect('pop');
            }
            
            this.createExplosionEffect(x, y, destroyedCount);
            
            if (CONFIG.debug.logDestruction) {
                console.log(`💥 Destroyed ${destroyedCount} particles`);
            }
        }
        
        // Check if number is completely destroyed
        if (this.numberParticles.length === 0 && this.numberFormed) {
            this.onNumberDestroyed();
        }
    }
    
    createExplosionEffect(x, y, intensity) {
        const particleCount = Math.min(CONFIG.particles.explosionParticles, intensity * 5);
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = Math.random() * 15 + 5;
            
            this.fallingParticles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - Math.random() * 5,
                size: Math.random() * 4 + 2,
                color: CONFIG.numberColors[Math.floor(Math.random() * CONFIG.numberColors.length)],
                life: 1.0,
                decay: 0.03,
                bounces: 0,
                sparkle: true,
            });
        }
        
        // Screen shake effect
        if (CONFIG.effects.screenShake) {
            this.addScreenShake(intensity);
        }
    }
    
    addScreenShake(intensity) {
        const duration = 200;
        const strength = Math.min(intensity * 2, 10);
        const startTime = Date.now();
        
        const shake = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed < duration) {
                const progress = elapsed / duration;
                const currentStrength = strength * (1 - progress);
                
                const offsetX = (Math.random() - 0.5) * currentStrength;
                const offsetY = (Math.random() - 0.5) * currentStrength;
                
                this.canvas.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
                
                requestAnimationFrame(shake);
            } else {
                this.canvas.style.transform = '';
            }
        };
        
        shake();
    }
    
    // NEW METHOD: Enhanced number destruction feedback
    onNumberDestroyed() {
        this.isDestroying = true;
        this.numberFormed = false;
        
        // Use new audio system for better feedback
        if (window.audioSystem && window.audioSystem.isInitialized) {
            // Play destruction sound effect
            window.audioSystem.playSoundEffect('success');
            
            // Speak celebration for destroying the number
            setTimeout(() => {
                window.audioSystem.speakCelebration();
            }, 500);
            
            // Encourage continued play
            setTimeout(() => {
                if (this.currentNumber < CONFIG.game.endNumber) {
                    window.audioSystem.speak(`Great job! Let's try the next number!`);
                }
            }, 2000);
        } else {
            // Fallback
            if (CONFIG.voice.enabled && CONFIG.voice.sayOnDestroy) {
                this.speakText(`${this.currentNumber} destroyed! Great job!`);
            }
        }
        
        // Mark progress
        this.markNumberComplete();
        
        // Move to next number after delay
        setTimeout(() => {
            this.currentNumber++;
            this.startNextNumber();
        }, 3000); // Slightly longer delay for audio feedback
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    // UPDATED METHOD: Better formation completion feedback
    update() {
        // Update number formation particles
        if (this.isForming) {
            let allInPlace = true;
            
            this.numberParticles.forEach(particle => {
                if (!particle.inPlace) {
                    // Move towards target position
                    const dx = particle.targetX - particle.x;
                    const dy = particle.targetY - particle.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance > 5) {
                        const speed = CONFIG.particles.formationSpeed;
                        particle.vx = (dx / distance) * speed;
                        particle.vy = (dy / distance) * speed;
                        particle.x += particle.vx;
                        particle.y += particle.vy;
                        allInPlace = false;
                    } else {
                        particle.inPlace = true;
                        particle.vx = 0;
                        particle.vy = 0;
                    }
                }
            });
            
            if (allInPlace) {
                this.isForming = false;
                this.numberFormed = true;
                this.updateCurrentNumberDisplay(`Tap to destroy ${this.currentNumber}!`);
                
                // Play chime when number is fully formed
                if (window.audioSystem && window.audioSystem.isInitialized) {
                    window.audioSystem.playSoundEffect('chime');
                }
            }
        }
        
        // Update falling particles physics
        this.fallingParticles.forEach((particle, index) => {
            // Apply physics
            particle.vy += CONFIG.physics.gravity;
            particle.vx *= CONFIG.physics.friction;
            particle.vy *= CONFIG.physics.windResistance;
            
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Floor collision
            const floorY = this.canvasHeight * CONFIG.physics.floorLevel;
            if (particle.y + particle.size > floorY) {
                particle.y = floorY - particle.size;
                particle.vy *= -CONFIG.physics.bounce;
                particle.vx *= 0.8; // Friction on bounce
                particle.bounces++;
                
                // Stop small bounces
                if (Math.abs(particle.vy) < 1) {
                    particle.vy = 0;
                }
            }
            
            // Wall collisions
            if (particle.x - particle.size < 0 || particle.x + particle.size > this.canvasWidth) {
                particle.vx *= -CONFIG.physics.bounce;
                particle.x = Math.max(particle.size, Math.min(this.canvasWidth - particle.size, particle.x));
            }
            
            // Decay
            particle.life -= particle.decay;
            if (particle.life <= 0) {
                this.fallingParticles.splice(index, 1);
            }
        });
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // Draw floor line
        const floorY = this.canvasHeight * CONFIG.physics.floorLevel;
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(0, floorY);
        this.ctx.lineTo(this.canvasWidth, floorY);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // Draw number formation particles
        this.numberParticles.forEach(particle => {
            this.drawParticle(particle);
        });
        
        // Draw falling particles
        this.fallingParticles.forEach(particle => {
            this.drawParticle(particle);
        });
        
        // Draw destruction area if pointer is down
        if (this.isPointerDown && this.numberFormed && CONFIG.debug.showHitboxes) {
            this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(this.pointerX, this.pointerY, CONFIG.game.destructionRadius, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }
    
    drawParticle(particle) {
        this.ctx.globalAlpha = particle.life;
        this.ctx.fillStyle = particle.color;
        
        // Add glow effect
        if (particle.sparkle) {
            this.ctx.shadowColor = particle.color;
            this.ctx.shadowBlur = particle.size * 2;
        }
        
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
        this.ctx.globalAlpha = 1;
    }
    
    // UI Updates
    updateCurrentNumberDisplay(text) {
        document.querySelector('.current-number').textContent = text;
    }
    
    updateProgressDisplay() {
        const dots = document.querySelectorAll('.dot');
        dots.forEach((dot, index) => {
            dot.classList.remove('completed', 'current');
            if (index < this.currentNumber - 1) {
                dot.classList.add('completed');
            } else if (index === this.currentNumber - 1) {
                dot.classList.add('current');
            }
        });
    }
    
    markNumberComplete() {
        const dots = document.querySelectorAll('.dot');
        if (dots[this.currentNumber - 1]) {
            dots[this.currentNumber - 1].classList.remove('current');
            dots[this.currentNumber - 1].classList.add('completed');
        }
    }
    
    // NEW METHOD: Enhanced celebration with audio system
    celebrateCompletion() {
        this.updateCurrentNumberDisplay('🎉 All Numbers Complete! 🎉');
        
        // Use new audio system for celebration
        if (window.audioSystem && window.audioSystem.isInitialized) {
            window.audioSystem.speakCelebration();
            window.audioSystem.playSoundEffect('celebration');
            
            // Add extra celebration phrase
            setTimeout(() => {
                window.audioSystem.speak('You counted all the numbers! You are amazing at counting!');
            }, 2000);
        } else {
            // Fallback
            if (CONFIG.voice.enabled) {
                this.speakText('Congratulations! You destroyed all the numbers! Great counting!');
            }
        }
        
        // Create massive celebration effect
        for (let i = 0; i < 200; i++) {
            setTimeout(() => {
                const x = Math.random() * this.canvasWidth;
                const y = Math.random() * this.canvasHeight * 0.3;
                this.createExplosionEffect(x, y, 10);
            }, i * 50);
        }
        
        if (CONFIG.debug.enabled) {
            console.log('🎉 Game completed!');
        }
        
        // Redirect to main hub after celebration
        setTimeout(() => {
            window.location.href = '../../index.html';
        }, 15000);
    }
    
    // ==========================================
    // UPDATED AUDIO METHODS
    // ==========================================
    
    speakNumber(number) {
        // Use the new audio system if available
        if (window.audioSystem && window.audioSystem.isInitialized) {
            window.audioSystem.speakNumber(number);
        } else {
            // Fallback to old method
            const numberWords = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
            this.speakText(numberWords[number] || number.toString());
        }
    }
    
    speakText(text) {
        // Use the new audio system if available
        if (window.audioSystem && window.audioSystem.isInitialized) {
            window.audioSystem.speak(text);
        } else {
            // Fallback to old method
            if ('speechSynthesis' in window && CONFIG.voice.enabled) {
                speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = CONFIG.voice.rate;
                utterance.pitch = CONFIG.voice.pitch;
                utterance.volume = CONFIG.voice.volume;
                speechSynthesis.speak(utterance);
            }
        }
    }
}

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
    window.numberSmashGame = new NumberSmashGame();
});