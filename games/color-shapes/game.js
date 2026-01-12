class ColoringGame {
    constructor() {
        this.canvas = document.getElementById('coloringCanvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        this.shapeLabel = document.querySelector('.shape-label');
        
        // Game state
        this.selectedColor = null;
        this.currentShapeIndex = 0;
        this.isDrawing = false;
        this.brushSize = 25;
        this.isRandomMode = false;
        this.isTransitioning = false;
        this.targetColoredPixels = 0;
        this.progressCheckCount = 0;
        
        // Performance optimization
        this.lastDrawTime = 0;
        this.drawThrottle = 16;
        
        // Touch/mouse tracking
        this.lastX = 0;
        this.lastY = 0;
        
        // Colors and shapes
        this.colors = [
            { name: 'Red', hex: '#FF0000' },
            { name: 'Blue', hex: '#0000FF' },
            { name: 'Yellow', hex: '#FFFF00' },
            { name: 'Green', hex: '#00AA00' },
            { name: 'Orange', hex: '#FFA500' },
            { name: 'Purple', hex: '#800080' },
            { name: 'Pink', hex: '#FFC0CB' },
            { name: 'Brown', hex: '#8B4513' },
            { name: 'Black', hex: '#000000' },
            { name: 'White', hex: '#FFFFFF' },
            { name: 'Gray', hex: '#808080' }
        ];
        
        this.shapes = [
            'Circle', 'Square', 'Triangle', 'Rectangle', 'Oval',
            'Star', 'Heart', 'Diamond', 'Pentagon', 'Hexagon'
        ];
        
        this.init();
    }
    
    init() {
        this.forceFullScreen();
        this.setupCanvas();
        this.createColorPalette();
        this.loadProgress();
        this.setupEventListeners();
        this.resetAndDrawShape();
        this.createCustomCursor();
        
        // Wait for audio permission before welcome message
        document.addEventListener('audioEnabled', () => {
            setTimeout(() => {
                this.speakText("Welcome to Color the Shapes! Choose a color and start coloring!");
            }, 1000);
        });
    }
    
    forceFullScreen() {
        document.addEventListener('touchmove', (e) => {
            if (e.scale !== 1) { e.preventDefault(); }
        }, { passive: false });
        
        document.body.style.overscrollBehavior = 'none';
        
        window.addEventListener('load', () => {
            setTimeout(() => {
                window.scrollTo(0, 1);
            }, 0);
        });
        
        if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('portrait').catch(() => {});
        }
    }
    
    setupCanvas() {
        const container = this.canvas.parentElement;
        const maxWidth = Math.min(window.innerWidth - 40, 450);
        const maxHeight = Math.min(window.innerHeight * 0.5, 450);
        const size = Math.min(maxWidth, maxHeight);
        
        this.canvas.width = size;
        this.canvas.height = size;
        this.canvas.style.width = size + 'px';
        this.canvas.style.height = size + 'px';
        
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.globalCompositeOperation = 'source-over';
        
        this.brushSize = Math.max(size / 18, 20);
    }
    
    resetAndDrawShape() {
        this.clearCanvas();
        this.drawShapeOutline();
        this.updateShapeLabel();
        this.calculateTargetPixels();
        this.progressCheckCount = 0;
    }
    
    calculateTargetPixels() {
        const canvasSize = this.canvas.width;
        this.targetColoredPixels = Math.floor(canvasSize * 8);
        console.log(`Shape: ${this.shapes[this.currentShapeIndex]}, Target pixels: ${this.targetColoredPixels}`);
    }
    
    createColorPalette() {
        const palette = document.querySelector('.color-palette');
        palette.innerHTML = '';
        
        this.colors.forEach((color, index) => {
            const colorBtn = document.createElement('div');
            colorBtn.className = 'color-btn';
            colorBtn.style.backgroundColor = color.hex;
            colorBtn.dataset.colorIndex = index;
            
            if (color.name === 'White') {
                colorBtn.style.border = '3px solid #ddd';
            }
            
            palette.appendChild(colorBtn);
        });
    }
    
    createCustomCursor() {
        if (this.cursor) {
            this.cursor.remove();
        }
        
        this.cursor = document.createElement('div');
        this.cursor.className = 'brush-cursor';
        document.body.appendChild(this.cursor);
        this.updateCursorSize();
    }
    
    updateCursorSize() {
        if (this.cursor) {
            const size = this.brushSize;
            this.cursor.style.width = size + 'px';
            this.cursor.style.height = size + 'px';
            this.cursor.style.marginLeft = -size/2 + 'px';
            this.cursor.style.marginTop = -size/2 + 'px';
            
            if (this.selectedColor !== null) {
                this.cursor.style.backgroundColor = this.colors[this.selectedColor].hex;
                this.cursor.style.opacity = '0.6';
            } else {
                this.cursor.style.backgroundColor = 'transparent';
                this.cursor.style.opacity = '1';
            }
        }
    }
    
    setupEventListeners() {
        // Color selection
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('color-btn') && !this.isTransitioning) {
                this.selectColor(parseInt(e.target.dataset.colorIndex));
            }
        });
        
        // Drawing events - Mouse
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.throttledDraw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));
        
        // Drawing events - Touch
        this.canvas.addEventListener('touchstart', this.startDrawing.bind(this));
        this.canvas.addEventListener('touchmove', this.throttledDraw.bind(this));
        this.canvas.addEventListener('touchend', this.stopDrawing.bind(this));
        this.canvas.addEventListener('touchcancel', this.stopDrawing.bind(this));
        
        // Cursor tracking
        document.addEventListener('mousemove', this.updateCursor.bind(this));
        this.canvas.addEventListener('mouseenter', () => {
            if (this.cursor) this.cursor.style.display = 'block';
        });
        this.canvas.addEventListener('mouseleave', () => {
            if (this.cursor) this.cursor.style.display = 'none';
        });
        
        // Shape name clicking
        this.shapeLabel.addEventListener('click', () => {
            if (!this.isTransitioning) {
                this.speakShapeName();
            }
        });
        
        // Clear button
        document.getElementById('clearBtn').addEventListener('click', () => {
            if (!this.isTransitioning) {
                this.resetAndDrawShape();
                this.speakText("Canvas cleared! Start coloring again!");
            }
        });
        
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
        
        window.addEventListener('resize', () => {
            if (!this.isTransitioning) {
                setTimeout(() => {
                    this.setupCanvas();
                    this.resetAndDrawShape();
                }, 100);
            }
        });
        
        document.addEventListener('touchmove', (e) => {
            if (e.target === this.canvas) {
                e.preventDefault();
            }
        }, { passive: false });
    }
    
    throttledDraw(e) {
        const now = Date.now();
        if (now - this.lastDrawTime >= this.drawThrottle) {
            this.draw(e);
            this.lastDrawTime = now;
        }
    }
    
    updateCursor(e) {
        if (this.cursor && !this.isTransitioning) {
            this.cursor.style.left = e.clientX + 'px';
            this.cursor.style.top = e.clientY + 'px';
        }
    }
    
    getEventPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        let x, y;
        
        if (e.touches && e.touches[0]) {
            x = (e.touches[0].clientX - rect.left) * scaleX;
            y = (e.touches[0].clientY - rect.top) * scaleY;
        } else {
            x = (e.clientX - rect.left) * scaleX;
            y = (e.clientY - rect.top) * scaleY;
        }
        
        return { x, y };
    }
    
    // UPDATED METHOD: Enhanced drawing start with audio feedback
    startDrawing(e) {
        e.preventDefault();
        
        if (this.selectedColor === null || this.isTransitioning) {
            if (!this.isTransitioning) {
                // Use new audio system for instruction
                if (window.audioSystem && window.audioSystem.isInitialized) {
                    window.audioSystem.speak("Choose a color first!");
                } else {
                    this.speakShapeName();
                }
            }
            return;
        }
        
        // Play drawing sound effect
        if (window.audioSystem && window.audioSystem.isInitialized) {
            window.audioSystem.playSoundEffect('pop');
        }
        
        this.isDrawing = true;
        const pos = this.getEventPos(e);
        this.lastX = pos.x;
        this.lastY = pos.y;
        
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.strokeStyle = this.colors[this.selectedColor].hex;
        this.ctx.fillStyle = this.colors[this.selectedColor].hex;
        this.ctx.lineWidth = this.brushSize;
        
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, this.brushSize / 2, 0, 2 * Math.PI);
        this.ctx.fill();
    }
    
    draw(e) {
        e.preventDefault();
        
        if (!this.isDrawing || this.selectedColor === null || this.isTransitioning) return;
        
        const pos = this.getEventPos(e);
        
        this.ctx.strokeStyle = this.colors[this.selectedColor].hex;
        this.ctx.lineWidth = this.brushSize;
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
        
        this.lastX = pos.x;
        this.lastY = pos.y;
    }
    
    stopDrawing(e) {
        if (!this.isDrawing || this.isTransitioning) return;
        
        this.isDrawing = false;
        
        this.progressCheckCount++;
        if (this.progressCheckCount >= 3) {
            setTimeout(() => this.checkColoringProgress(), 100);
        }
    }
    
    checkColoringProgress() {
        if (this.isTransitioning || this.targetColoredPixels === 0) return;
        
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        let coloredPixels = 0;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
            
            if (a === 0) continue;
            if (r === 250 && g === 250 && b === 250) continue;
            if (r >= 90 && r <= 120 && g >= 90 && g <= 120 && b >= 90 && b <= 120) continue;
            
            coloredPixels++;
        }
        
        const coloringPercentage = (coloredPixels / this.targetColoredPixels) * 100;
        console.log(`Coloring progress: ${coloringPercentage.toFixed(1)}% (${coloredPixels}/${this.targetColoredPixels})`);
        
        if (coloringPercentage >= 40 && this.progressCheckCount >= 5) {
            this.triggerAutoAdvance();
        }
    }
    
    // UPDATED METHOD: Enhanced celebration with audio system
    triggerAutoAdvance() {
        if (this.isTransitioning) return;
        
        this.isTransitioning = true;
        
        // Use new audio system for celebration
        if (window.audioSystem && window.audioSystem.isInitialized) {
            window.audioSystem.speakCelebration();
            window.audioSystem.playSoundEffect('celebration');
        }
        
        this.triggerCelebration();
        
        setTimeout(() => {
            this.nextShape();
        }, 1500);
    }
    
    // UPDATED METHOD: Enhanced color selection with audio system
    selectColor(colorIndex) {
        if (this.isTransitioning) return;
        
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        const colorBtn = document.querySelector(`[data-color-index="${colorIndex}"]`);
        colorBtn.classList.add('selected');
        
        this.selectedColor = colorIndex;
        this.updateCursorSize();
        
        // Use new audio system for color announcement
        if (window.audioSystem && window.audioSystem.isInitialized) {
            window.audioSystem.speakColor(this.colors[colorIndex].name);
            window.audioSystem.playSoundEffect('chime');
        } else {
            this.speakText(this.colors[colorIndex].name);
        }
        
        colorBtn.style.transform = 'scale(1.2)';
        setTimeout(() => {
            colorBtn.style.transform = '';
        }, 200);
    }
    
    clearCanvas() {
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
    }
    
    drawShapeOutline() {
        this.ctx.fillStyle = '#fafafa';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([8, 4]);
        this.ctx.globalCompositeOperation = 'source-over';
        
        this.drawShape(this.ctx, false);
        
        this.ctx.setLineDash([]);
    }
    
    drawShape(ctx, filled = false) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const size = Math.min(this.canvas.width, this.canvas.height) * 0.32;
        
        const shapeName = this.shapes[this.currentShapeIndex];
        
        ctx.beginPath();
        
        switch (shapeName) {
            case 'Circle':
                ctx.arc(centerX, centerY, size, 0, 2 * Math.PI);
                break;
                
            case 'Square':
                ctx.rect(centerX - size, centerY - size, size * 2, size * 2);
                break;
                
            case 'Triangle':
                ctx.moveTo(centerX, centerY - size);
                ctx.lineTo(centerX - size, centerY + size);
                ctx.lineTo(centerX + size, centerY + size);
                ctx.closePath();
                break;
                
            case 'Rectangle':
                ctx.rect(centerX - size * 1.3, centerY - size * 0.8, size * 2.6, size * 1.6);
                break;
                
            case 'Oval':
                ctx.ellipse(centerX, centerY, size * 1.3, size * 0.8, 0, 0, 2 * Math.PI);
                break;
                
            case 'Star':
                this.drawStarPath(ctx, centerX, centerY, 5, size, size * 0.5);
                break;
                
            case 'Heart':
                this.drawHeartPath(ctx, centerX, centerY, size);
                break;
                
            case 'Diamond':
                ctx.moveTo(centerX, centerY - size);
                ctx.lineTo(centerX + size, centerY);
                ctx.lineTo(centerX, centerY + size);
                ctx.lineTo(centerX - size, centerY);
                ctx.closePath();
                break;
                
            case 'Pentagon':
                this.drawPolygonPath(ctx, centerX, centerY, 5, size);
                break;
                
            case 'Hexagon':
                this.drawPolygonPath(ctx, centerX, centerY, 6, size);
                break;
        }
        
        if (filled) {
            ctx.fill();
        } else {
            ctx.stroke();
        }
    }
    
    drawStarPath(ctx, centerX, centerY, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        const step = Math.PI / spikes;
        
        ctx.moveTo(centerX, centerY - outerRadius);
        
        for (let i = 0; i < spikes; i++) {
            let x = centerX + Math.cos(rot) * outerRadius;
            let y = centerY + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;
            
            x = centerX + Math.cos(rot) * innerRadius;
            y = centerY + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        
        ctx.lineTo(centerX, centerY - outerRadius);
        ctx.closePath();
    }
    
    drawHeartPath(ctx, centerX, centerY, size) {
        const topCurveHeight = size * 0.5;
        
        ctx.moveTo(centerX, centerY + size * 0.4);
        ctx.bezierCurveTo(centerX, centerY - topCurveHeight, centerX - size, centerY - topCurveHeight, centerX - size, centerY);
        ctx.bezierCurveTo(centerX - size, centerY + topCurveHeight, centerX, centerY + topCurveHeight, centerX, centerY + size);
        ctx.bezierCurveTo(centerX, centerY + topCurveHeight, centerX + size, centerY + topCurveHeight, centerX + size, centerY);
        ctx.bezierCurveTo(centerX + size, centerY - topCurveHeight, centerX, centerY - topCurveHeight, centerX, centerY + size * 0.4);
        ctx.closePath();
    }
    
    drawPolygonPath(ctx, centerX, centerY, sides, radius) {
        const angle = (2 * Math.PI) / sides;
        
        ctx.moveTo(centerX + radius * Math.cos(0), centerY + radius * Math.sin(0));
        
        for (let i = 1; i < sides; i++) {
            ctx.lineTo(
                centerX + radius * Math.cos(i * angle),
                centerY + radius * Math.sin(i * angle)
            );
        }
        
        ctx.closePath();
    }
    
    // UPDATED METHOD: Enhanced celebration with audio effects
    triggerCelebration() {
        // Play celebration sound
        if (window.audioSystem && window.audioSystem.isInitialized) {
            window.audioSystem.playSoundEffect('sparkle');
        }
        
        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                this.createCelebrationParticle();
            }, i * 80);
        }
        
        this.createShapeExplosion();
    }
    
    createShapeExplosion() {
        const shapeName = this.shapes[this.currentShapeIndex];
        const emoji = this.getShapeEmoji(shapeName);
        
        for (let i = 0; i < 10; i++) {
            const particle = document.createElement('div');
            particle.className = 'celebration-particle';
            particle.textContent = emoji;
            particle.style.fontSize = '40px';
            
            const angle = (i / 10) * 2 * Math.PI;
            const distance = 150 + Math.random() * 100;
            const startX = window.innerWidth / 2;
            const startY = window.innerHeight / 2;
            const endX = startX + Math.cos(angle) * distance;
            const endY = startY + Math.sin(angle) * distance;
            
            particle.style.left = startX + 'px';
            particle.style.top = startY + 'px';
            particle.style.transform = `translate(-50%, -50%)`;
            
            document.body.appendChild(particle);
            
            setTimeout(() => {
                particle.style.transition = 'all 1.2s ease-out';
                particle.style.left = endX + 'px';
                particle.style.top = endY + 'px';
                particle.style.opacity = '0';
                particle.style.transform = `translate(-50%, -50%) scale(2) rotate(720deg)`;
            }, 50);
            
            setTimeout(() => {
                particle.remove();
            }, 1300);
        }
    }
    
    createCelebrationParticle() {
        const particle = document.createElement('div');
        particle.className = 'celebration-particle';
        particle.textContent = ['🎉', '⭐', '✨', '🌟', '💫'][Math.floor(Math.random() * 5)];
        
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;
        
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        
        document.body.appendChild(particle);
        
        setTimeout(() => {
            particle.remove();
        }, 2500);
    }
    
    getShapeEmoji(shapeName) {
        const emojiMap = {
            'Circle': '⭕',
            'Square': '⬜',
            'Triangle': '🔺',
            'Rectangle': '⬜',
            'Oval': '⭕',
            'Star': '⭐',
            'Heart': '❤️',
            'Diamond': '💎',
            'Pentagon': '⬟',
            'Hexagon': '⬢'
        };
        
        return emojiMap[shapeName] || '✨';
    }
    
    // UPDATED METHOD: Enhanced shape transition with audio
    nextShape() {
        this.saveProgress();
        
        // Clear selection
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        this.selectedColor = null;
        this.updateCursorSize();
        
        // Determine next shape
        if (this.isRandomMode) {
            this.currentShapeIndex = Math.floor(Math.random() * this.shapes.length);
        } else {
            this.currentShapeIndex++;
            
            if (this.currentShapeIndex >= this.shapes.length) {
                this.isRandomMode = true;
                this.currentShapeIndex = 0;
                localStorage.setItem('colorShapesRandomUnlocked', 'true');
                
                setTimeout(() => {
                    if (window.audioSystem && window.audioSystem.isInitialized) {
                        window.audioSystem.speak('Amazing! You completed all shapes! Now enjoy random practice mode!');
                    } else {
                        alert('🎉 Amazing! You completed all shapes! Now enjoy random practice mode!');
                    }
                }, 300);
            }
        }
        
        this.animateShapeTransition();
    }
    
    animateShapeTransition() {
        const container = document.querySelector('.canvas-container');
        
        // Fade out
        container.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        container.style.opacity = '0';
        container.style.transform = 'scale(0.8)';
        
        setTimeout(() => {
            this.resetAndDrawShape();
            
            // Fade in
            container.style.opacity = '1';
            container.style.transform = 'scale(1)';
            
            setTimeout(() => {
                this.speakShapeName();
                this.isTransitioning = false;
            }, 200);
            
        }, 400);
    }
    
    updateShapeLabel() {
        this.shapeLabel.textContent = this.shapes[this.currentShapeIndex];
    }
    
    // UPDATED METHOD: Enhanced speech with audio system
    speakText(text) {
        if (window.audioSystem && window.audioSystem.isInitialized) {
            window.audioSystem.speak(text);
        } else {
            // Fallback to basic speech
            if ('speechSynthesis' in window) {
                speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = 0.8;
                utterance.pitch = 1.2;
                utterance.volume = 0.8;
                speechSynthesis.speak(utterance);
            }
        }
    }
    
    speakShapeName() {
        if (window.audioSystem && window.audioSystem.isInitialized) {
            window.audioSystem.speakShape(this.shapes[this.currentShapeIndex]);
        } else {
            this.speakText(this.shapes[this.currentShapeIndex]);
        }
    }
    
    loadProgress() {
        const randomUnlocked = localStorage.getItem('colorShapesRandomUnlocked') === 'true';
        if (randomUnlocked) {
            this.isRandomMode = true;
            this.currentShapeIndex = Math.floor(Math.random() * this.shapes.length);
        }
    }
    
    saveProgress() {
        if (this.isRandomMode) {
            localStorage.setItem('colorShapesRandomUnlocked', 'true');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ColoringGame();
});