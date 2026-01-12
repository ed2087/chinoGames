/* ============================================
   FACE.JS - Animated Smiley Face Generator
   Purpose: Canvas-based face with expressions
   ============================================ */

class Face {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Face properties
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.radius = Math.min(this.canvas.width, this.canvas.height) * 0.4;
        
        // Expression state
        this.currentExpression = 'happy';
        this.isAnimating = false;
        
        // Eye properties
        this.eyeLeftX = this.centerX - this.radius * 0.3;
        this.eyeRightX = this.centerX + this.radius * 0.3;
        this.eyeY = this.centerY - this.radius * 0.15;
        this.eyeRadius = this.radius * 0.12;
        
        // Pupil tracking
        this.pupilLeftX = this.eyeLeftX;
        this.pupilLeftY = this.eyeY;
        this.pupilRightX = this.eyeRightX;
        this.pupilRightY = this.eyeY;
        this.pupilRadius = this.eyeRadius * 0.5;
        
        // Mouth properties
        this.mouthY = this.centerY + this.radius * 0.2;
        this.mouthWidth = this.radius * 0.6;
        this.mouthHeight = this.radius * 0.3;
        this.mouthOpenness = 0; // 0 = closed, 1 = wide open
        
        // Cheeks
        this.cheekRadius = this.radius * 0.15;
        this.cheekAlpha = 0;
        
        // Animation
        this.breathePhase = 0;
        this.blinkTimer = 0;
        this.isBlinking = false;
        this.blinkPhase = 0;
        
        // Colors
        this.faceColor = '#FFD93D';
        this.eyeColor = '#333333';
        this.mouthColor = '#333333';
        this.cheekColor = 'rgba(255, 144, 188, 0.6)';
        
        this.startAnimation();
    }
    
    resize() {
        const container = this.canvas.parentElement;
        const size = Math.min(container.clientWidth, container.clientHeight);
        this.canvas.width = size;
        this.canvas.height = size;
        
        // Recalculate positions
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.radius = Math.min(this.canvas.width, this.canvas.height) * 0.4;
        
        this.eyeLeftX = this.centerX - this.radius * 0.3;
        this.eyeRightX = this.centerX + this.radius * 0.3;
        this.eyeY = this.centerY - this.radius * 0.15;
        this.eyeRadius = this.radius * 0.12;
        
        this.pupilRadius = this.eyeRadius * 0.5;
        
        this.mouthY = this.centerY + this.radius * 0.2;
        this.mouthWidth = this.radius * 0.6;
        this.mouthHeight = this.radius * 0.3;
        
        this.cheekRadius = this.radius * 0.15;
    }
    
    /* ============================================
       DRAWING METHODS
       ============================================ */
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply breathing animation
        const breatheScale = 1 + Math.sin(this.breathePhase) * 0.02;
        this.ctx.save();
        this.ctx.translate(this.centerX, this.centerY);
        this.ctx.scale(breatheScale, breatheScale);
        this.ctx.translate(-this.centerX, -this.centerY);
        
        // Draw face circle
        this.drawFaceCircle();
        
        // Draw cheeks (if blushing)
        if (this.cheekAlpha > 0) {
            this.drawCheeks();
        }
        
        // Draw eyes
        this.drawEyes();
        
        // Draw mouth based on expression
        this.drawMouth();
        
        this.ctx.restore();
    }
    
    drawFaceCircle() {
        // Shadow
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 10;
        
        // Face
        this.ctx.fillStyle = this.faceColor;
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Remove shadow for other elements
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        
        // Shine/highlight
        const gradient = this.ctx.createRadialGradient(
            this.centerX - this.radius * 0.3,
            this.centerY - this.radius * 0.3,
            0,
            this.centerX,
            this.centerY,
            this.radius
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.radius, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawEyes() {
        const blinkAmount = this.isBlinking ? Math.sin(this.blinkPhase) : 0;
        const eyeHeight = this.eyeRadius * 2 * (1 - blinkAmount);
        
        // Left eye white
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.ellipse(this.eyeLeftX, this.eyeY, this.eyeRadius, eyeHeight / 2, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Right eye white
        this.ctx.beginPath();
        this.ctx.ellipse(this.eyeRightX, this.eyeY, this.eyeRadius, eyeHeight / 2, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        if (!this.isBlinking || blinkAmount < 0.9) {
            // Left pupil
            this.ctx.fillStyle = this.eyeColor;
            this.ctx.beginPath();
            this.ctx.arc(this.pupilLeftX, this.pupilLeftY, this.pupilRadius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Right pupil
            this.ctx.beginPath();
            this.ctx.arc(this.pupilRightX, this.pupilRightY, this.pupilRadius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Shine in pupils
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            this.ctx.beginPath();
            this.ctx.arc(this.pupilLeftX - this.pupilRadius * 0.3, this.pupilLeftY - this.pupilRadius * 0.3, this.pupilRadius * 0.3, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.beginPath();
            this.ctx.arc(this.pupilRightX - this.pupilRadius * 0.3, this.pupilRightY - this.pupilRadius * 0.3, this.pupilRadius * 0.3, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawMouth() {
        this.ctx.strokeStyle = this.mouthColor;
        this.ctx.lineWidth = this.radius * 0.08;
        this.ctx.lineCap = 'round';
        
        switch (this.currentExpression) {
            case 'happy':
                this.drawHappyMouth();
                break;
            case 'excited':
                this.drawExcitedMouth();
                break;
            case 'eating':
                this.drawEatingMouth();
                break;
            case 'thinking':
                this.drawThinkingMouth();
                break;
            case 'confused':
                this.drawConfusedMouth();
                break;
            case 'sad':
                this.drawSadMouth();
                break;
            case 'celebrating':
                this.drawCelebratingMouth();
                break;
            default:
                this.drawHappyMouth();
        }
    }
    
    drawHappyMouth() {
        // Smile arc
        this.ctx.beginPath();
        this.ctx.arc(
            this.centerX,
            this.mouthY - this.mouthHeight * 0.3,
            this.mouthWidth / 2,
            0.2,
            Math.PI - 0.2
        );
        this.ctx.stroke();
    }
    
    drawExcitedMouth() {
        // Big open smile
        this.ctx.fillStyle = this.mouthColor;
        this.ctx.beginPath();
        this.ctx.ellipse(
            this.centerX,
            this.mouthY,
            this.mouthWidth / 2.5,
            this.mouthHeight / 2,
            0,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        
        // Teeth
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(
            this.centerX - this.mouthWidth / 4,
            this.mouthY - this.mouthHeight / 3,
            this.mouthWidth / 2,
            this.mouthHeight / 6
        );
    }
    
    drawEatingMouth() {
        // Wide open circular mouth
        this.ctx.fillStyle = this.mouthColor;
        this.ctx.beginPath();
        this.ctx.arc(
            this.centerX,
            this.mouthY,
            this.mouthWidth / 3 * (0.5 + this.mouthOpenness * 0.5),
            0,
            Math.PI * 2
        );
        this.ctx.fill();
    }
    
    drawThinkingMouth() {
        // Small neutral line
        this.ctx.beginPath();
        this.ctx.moveTo(this.centerX - this.mouthWidth / 4, this.mouthY);
        this.ctx.lineTo(this.centerX + this.mouthWidth / 4, this.mouthY);
        this.ctx.stroke();
    }
    
    drawConfusedMouth() {
        // Wavy line
        this.ctx.beginPath();
        this.ctx.moveTo(this.centerX - this.mouthWidth / 3, this.mouthY);
        this.ctx.quadraticCurveTo(
            this.centerX - this.mouthWidth / 6,
            this.mouthY + this.mouthHeight / 4,
            this.centerX,
            this.mouthY
        );
        this.ctx.quadraticCurveTo(
            this.centerX + this.mouthWidth / 6,
            this.mouthY - this.mouthHeight / 4,
            this.centerX + this.mouthWidth / 3,
            this.mouthY
        );
        this.ctx.stroke();
    }
    
    drawSadMouth() {
        // Frown arc
        this.ctx.beginPath();
        this.ctx.arc(
            this.centerX,
            this.mouthY + this.mouthHeight * 0.8,
            this.mouthWidth / 2,
            Math.PI + 0.2,
            -0.2
        );
        this.ctx.stroke();
    }
    
    drawCelebratingMouth() {
        // Huge smile with tongue
        this.ctx.fillStyle = this.mouthColor;
        this.ctx.beginPath();
        this.ctx.arc(
            this.centerX,
            this.mouthY - this.mouthHeight * 0.2,
            this.mouthWidth / 2,
            0.1,
            Math.PI - 0.1
        );
        this.ctx.fill();
        
        // Tongue
        this.ctx.fillStyle = '#FF6B9D';
        this.ctx.beginPath();
        this.ctx.ellipse(
            this.centerX,
            this.mouthY + this.mouthHeight / 3,
            this.mouthWidth / 4,
            this.mouthHeight / 4,
            0,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
    }
    
    drawCheeks() {
        this.ctx.fillStyle = this.cheekColor.replace('0.6', this.cheekAlpha);
        
        // Left cheek
        this.ctx.beginPath();
        this.ctx.arc(
            this.centerX - this.radius * 0.6,
            this.centerY + this.radius * 0.1,
            this.cheekRadius,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        
        // Right cheek
        this.ctx.beginPath();
        this.ctx.arc(
            this.centerX + this.radius * 0.6,
            this.centerY + this.radius * 0.1,
            this.cheekRadius,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
    }
    
    /* ============================================
       ANIMATION LOOP
       ============================================ */
    
    startAnimation() {
        const animate = () => {
            // Update breathing
            this.breathePhase += 0.02;
            
            // Random blinking
            this.blinkTimer++;
            if (this.blinkTimer > 180 && Math.random() < 0.02) {
                this.startBlink();
            }
            
            if (this.isBlinking) {
                this.blinkPhase += 0.3;
                if (this.blinkPhase >= Math.PI) {
                    this.isBlinking = false;
                    this.blinkPhase = 0;
                    this.blinkTimer = 0;
                }
            }
            
            // Smooth pupil movement
            this.pupilLeftX += (this.eyeLeftX - this.pupilLeftX) * 0.1;
            this.pupilLeftY += (this.eyeY - this.pupilLeftY) * 0.1;
            this.pupilRightX += (this.eyeRightX - this.pupilRightX) * 0.1;
            this.pupilRightY += (this.eyeY - this.pupilRightY) * 0.1;
            
            // Draw
            this.draw();
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    startBlink() {
        this.isBlinking = true;
        this.blinkPhase = 0;
    }
    
    /* ============================================
       EXPRESSION CONTROLS
       ============================================ */
    
    setExpression(expression) {
        this.currentExpression = expression;
        
        // Set cheek blush for happy expressions
        if (expression === 'happy' || expression === 'excited' || expression === 'celebrating') {
            this.cheekAlpha = 0.6;
        } else {
            this.cheekAlpha = 0;
        }
    }
    
    lookAt(x, y) {
        // Convert screen coordinates to canvas coordinates
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = ((x - rect.left) / rect.width) * this.canvas.width;
        const canvasY = ((y - rect.top) / rect.height) * this.canvas.height;
        
        // Calculate angle to target
        const dx = canvasX - this.centerX;
        const dy = canvasY - this.centerY;
        const angle = Math.atan2(dy, dx);
        const distance = Math.min(Math.sqrt(dx * dx + dy * dy), this.eyeRadius * 0.4);
        
        // Move pupils
        const pupilDistance = Math.min(distance * 0.1, this.eyeRadius * 0.4);
        
        this.pupilLeftX = this.eyeLeftX + Math.cos(angle) * pupilDistance;
        this.pupilLeftY = this.eyeY + Math.sin(angle) * pupilDistance;
        this.pupilRightX = this.eyeRightX + Math.cos(angle) * pupilDistance;
        this.pupilRightY = this.eyeY + Math.sin(angle) * pupilDistance;
    }
    
    resetLook() {
        // Reset pupils to center
        this.pupilLeftX = this.eyeLeftX;
        this.pupilLeftY = this.eyeY;
        this.pupilRightX = this.eyeRightX;
        this.pupilRightY = this.eyeY;
    }
    
    /* ============================================
       EATING ANIMATION
       ============================================ */
    
    playEatingAnimation(callback) {
        this.setExpression('eating');
        
        let frame = 0;
        const maxFrames = 30;
        
        const animate = () => {
            frame++;
            
            // Chomp motion
            this.mouthOpenness = Math.sin((frame / maxFrames) * Math.PI);
            
            if (frame < maxFrames) {
                requestAnimationFrame(animate);
            } else {
                this.mouthOpenness = 0;
                this.setExpression('happy');
                if (callback) callback();
            }
        };
        
        animate();
    }
    
    /* ============================================
       CELEBRATION ANIMATION
       ============================================ */
    
    playCelebrationAnimation() {
        this.setExpression('celebrating');
        
        let rotation = 0;
        let scale = 1;
        let frame = 0;
        const maxFrames = 60;
        
        const animate = () => {
            frame++;
            
            rotation = Math.sin((frame / maxFrames) * Math.PI * 4) * 0.2;
            scale = 1 + Math.sin((frame / maxFrames) * Math.PI * 2) * 0.1;
            
            // Apply transforms
            this.ctx.save();
            this.ctx.translate(this.centerX, this.centerY);
            this.ctx.rotate(rotation);
            this.ctx.scale(scale, scale);
            this.ctx.translate(-this.centerX, -this.centerY);
            
            this.draw();
            
            this.ctx.restore();
            
            if (frame < maxFrames) {
                requestAnimationFrame(animate);
            } else {
                this.setExpression('happy');
            }
        };
        
        animate();
    }
}