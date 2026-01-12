// ==========================================
// ANIMAL ENGINE - Reusable Animal Building System
// Handles animal rendering, shape validation, and game mechanics
// ==========================================

class AnimalEngine {
constructor(canvas, audioSystem = null) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.audio = audioSystem || window.audioSystem;
    
    // Game state
    this.currentAnimal = null;
    this.placedShapes = new Map();
    this.completedShapes = new Set();
    
    // Scaling variables
    this.currentScale = null;
    this.currentOffset = null;
    
    // Visual settings
    this.config = {
        outlineOpacity: 0.8,
        outlineWidth: 4,
        snapDistance: 40,
        completionThreshold: 0.9,
        
        // Animation settings
        snapAnimationDuration: 300,
        explosionParticles: 20,
        fireworksCount: 15
    };
    
    // Handle audio interruptions gracefully
    if (this.audio && window.speechSynthesis) {
        const originalSpeak = this.audio.speak;
        this.audio.speak = function(text, options = {}) {
            try {
                // Cancel any ongoing speech to prevent interruption errors
                window.speechSynthesis.cancel();
                
                // Wait a bit before speaking new text
                setTimeout(() => {
                    if (originalSpeak) {
                        originalSpeak.call(this, text, options);
                    }
                }, 100);
            } catch (error) {
                console.warn('🔇 Speech synthesis not available:', error);
            }
        }.bind(this.audio);
    }
    
    console.log('🏗️ AnimalEngine initialized');
}
    
    // ==========================================
    // ANIMAL MANAGEMENT  drawAnimalOutline
    // ==========================================
    
    setCurrentAnimal(animalId) {
        const animalData = AnimalData.getAnimal(animalId);
        if (!animalData) {
            console.error(`Animal not found: ${animalId}`);
            return false;
        }
        
        this.currentAnimal = animalData;
        this.placedShapes.clear();
        this.completedShapes.clear();
        
        // Reset scaling variables
        this.currentScale = null;
        this.currentOffset = null;
        
        // Play animal introduction sound
        if (this.audio?.isInitialized) {
            setTimeout(() => {
                this.audio.speak(animalData.sounds.animalSound);
            }, 500);
        }
        
        console.log(`🦋 Set current animal: ${animalData.name}`);
        return true;
    }
    
    getCurrentAnimal() {
        return this.currentAnimal;
    }
    
    // ==========================================
    // SHAPE MANAGEMENT
    // ==========================================
    
    getRequiredShapes() {
        if (!this.currentAnimal) return [];
        
        // Always return all basic shapes for unlimited use
        return [
            { type: 'circle', count: 'unlimited', placed: 0 },
            { type: 'oval', count: 'unlimited', placed: 0 },
            { type: 'triangle', count: 'unlimited', placed: 0 },
            { type: 'rectangle', count: 'unlimited', placed: 0 },
            { type: 'diamond', count: 'unlimited', placed: 0 }
        ];
    }
    
    attemptPlaceShape(shapeType, x, y) {
        if (!this.currentAnimal) return null;
        
        // Convert canvas coordinates to animal coordinates if scaling is set
        let animalX = x;
        let animalY = y;
        
        if (this.currentScale && this.currentOffset) {
            animalX = (x - this.currentOffset.x) / this.currentScale;
            animalY = (y - this.currentOffset.y) / this.currentScale;
        }
        
        // Find the closest unplaced target shape
        let closestMatch = null;
        let closestDistance = Infinity;
        
        this.currentAnimal.shapes.forEach(targetShape => {
            if (targetShape.type === shapeType && !this.completedShapes.has(targetShape.id)) {
                const distance = Math.sqrt(
                    Math.pow(targetShape.targetPosition.x - animalX, 2) + 
                    Math.pow(targetShape.targetPosition.y - animalY, 2)
                );
                
                if (distance < targetShape.snapRadius && distance < closestDistance) {
                    closestMatch = targetShape;
                    closestDistance = distance;
                }
            }
        });
        
        if (closestMatch) {
            // Success! Shape snaps to position
            this.placeShape(closestMatch, x, y);
            return {
                success: true,
                shape: closestMatch,
                snapPosition: this.getScreenPosition(closestMatch.targetPosition)
            };
        } else {
            // Wrong placement - trigger explosion
            this.triggerExplosion(x, y);
            return {
                success: false,
                position: { x, y }
            };
        }
    }
    
    getScreenPosition(animalPosition) {
        if (!this.currentScale || !this.currentOffset) {
            return animalPosition;
        }
        
        return {
            x: (animalPosition.x * this.currentScale) + this.currentOffset.x,
            y: (animalPosition.y * this.currentScale) + this.currentOffset.y
        };
    }
    
    placeShape(shapeData, fromX, fromY) {
        this.placedShapes.set(shapeData.id, {
            ...shapeData,
            placed: true,
            placedAt: Date.now()
        });
        
        this.completedShapes.add(shapeData.id);
        
        // Play success sound
        if (this.audio?.isInitialized) {
            this.audio.playSoundEffect('success');
            
            // Sometimes say encouraging words
            if (Math.random() < 0.3) {
                setTimeout(() => {
                    this.audio.speak(this.currentAnimal.sounds.shapeSuccess);
                }, 200);
            }
        }
        
        // Check if animal is complete
        setTimeout(() => {
            this.checkCompletion();
        }, 100);
        
        console.log(`✅ Placed shape: ${shapeData.id}`);
    }
    
    checkCompletion() {
        if (!this.currentAnimal) return false;
        
        const totalShapes = this.currentAnimal.shapes.length;
        const placedCount = this.completedShapes.size;
        const progress = placedCount / totalShapes;
        
        // Dispatch progress event
        document.dispatchEvent(new CustomEvent('animalProgress', {
            detail: {
                animal: this.currentAnimal.name,
                progress: progress,
                placedCount: placedCount,
                totalShapes: totalShapes
            }
        }));
        
        if (progress >= this.config.completionThreshold) {
            this.completeAnimal();
            return true;
        }
        
        return false;
    }
    
    completeAnimal() {
        if (!this.currentAnimal) return;
        
        console.log(`🎉 Animal completed: ${this.currentAnimal.name}`);
        
        // Trigger fireworks
        this.triggerFireworks();
        
        // Play completion audio
        if (this.audio?.isInitialized) {
            setTimeout(() => {
                this.audio.speakCelebration();
            }, 500);
            
            setTimeout(() => {
                this.audio.speak(this.currentAnimal.sounds.completionPhrase);
            }, 1500);
        }
        
        // Dispatch completion event
        document.dispatchEvent(new CustomEvent('animalComplete', {
            detail: {
                animal: this.currentAnimal.name,
                emoji: this.currentAnimal.emoji
            }
        }));
    }
    
    // ==========================================
    // RENDERING
    // ==========================================
    
render() {
    if (!this.currentAnimal) return;
    
    this.ctx.save();
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Calculate scaling once per render drawShape
    this.calculateScaling();
    
    // STEP 1: Draw placed shapes first (bottom layer)
    this.drawPlacedShapes();
    
    // STEP 2: Draw ALL remaining outlines OVER the placed shapes (top layer)
    this.drawAnimalOutline();
    
    this.ctx.restore();
}
    
    calculateScaling() {
        const canvas = this.canvas;
        const animalCanvas = this.currentAnimal.canvas;
        
        // Calculate scale to fit animal in canvas while maintaining aspect ratio
        const scaleX = (canvas.width * 0.8) / animalCanvas.width;
        const scaleY = (canvas.height * 0.8) / animalCanvas.height;
        const scale = Math.min(scaleX, scaleY);
        
        // Calculate offset to center scaled animal
        const scaledWidth = animalCanvas.width * scale;
        const scaledHeight = animalCanvas.height * scale;
        const offsetX = (canvas.width - scaledWidth) / 2;
        const offsetY = (canvas.height - scaledHeight) / 2;
        
        this.currentScale = scale;
        this.currentOffset = { x: offsetX, y: offsetY };
    }
    
drawAnimalOutline() {
    if (!this.currentScale || !this.currentOffset) return;
    
    this.ctx.save();
    
    // Sort shapes by z-index to draw outlines in correct order
    const sortedShapes = [...this.currentAnimal.shapes].sort((a, b) => a.zIndex - b.zIndex);
    
    // Draw ALL unplaced shapes' outlines, regardless of what's already placed
    sortedShapes.forEach(shape => {
        if (!this.completedShapes.has(shape.id)) {
            // Set outline style - make it very visible
            this.ctx.globalAlpha = 0.9;  // More visible
            this.ctx.strokeStyle = '#2c3e50';  // Darker color
            this.ctx.lineWidth = 5;  // Thicker line
            this.ctx.setLineDash([10, 5]); // Clear dashes
            this.ctx.fillStyle = 'rgba(44, 62, 80, 0.15)'; // Light fill for visibility
            
            this.drawShape(shape, true);
        }
    });
    
    this.ctx.restore();
}
    
    drawPlacedShapes() {
        if (!this.currentScale || !this.currentOffset) return;
        
        // Sort by z-index for proper layering render
        const sortedShapes = Array.from(this.placedShapes.values())
            .sort((a, b) => a.zIndex - b.zIndex);
        
        sortedShapes.forEach(shape => {
            this.drawShape(shape, false);
        });
    }
    
drawShape(shapeData, outlineOnly = false) {
    const pos = {
        x: (shapeData.targetPosition.x * this.currentScale) + this.currentOffset.x,
        y: (shapeData.targetPosition.y * this.currentScale) + this.currentOffset.y
    };
    
    this.ctx.save();
    this.ctx.translate(pos.x, pos.y);
    this.ctx.scale(this.currentScale, this.currentScale);
    
    if (shapeData.rotation) {
        this.ctx.rotate((shapeData.rotation * Math.PI) / 180);
    }
    
    if (!outlineOnly) {
        // Regular filled shape 
        this.ctx.fillStyle = shapeData.finalColor;
        this.ctx.strokeStyle = shapeData.strokeColor;
        this.ctx.lineWidth = shapeData.strokeWidth;
        this.ctx.setLineDash([]);
        this.ctx.globalAlpha = 1;
    } else {
        // Different bright colors for different shape types
        const outlineColors = {
            'circle': '#e74c3c',      // Bright Red
            'oval': '#3498db',        // Bright Blue  
            'triangle': '#f39c12',    // Bright Orange
            'rectangle': '#27ae60',   // Bright Green
            'diamond': '#9b59b6'      // Bright Purple
        };
        
        const color = outlineColors[shapeData.type] || '#e74c3c';
        
        // Light fill with shape color
        this.ctx.fillStyle = color + '25'; // 25 = ~15% opacity
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 6; // Extra thick for visibility
        this.ctx.setLineDash([12, 6]); // Clear, big dashes
        this.ctx.globalAlpha = 0.95;
        
        // Add a glowing effect
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
    }
    
    this.ctx.beginPath();
    const size = shapeData.size;
    
    switch (shapeData.type) {
        case 'circle':
            this.ctx.arc(0, 0, size.radius, 0, Math.PI * 2);
            break;
            
        case 'oval':
            this.ctx.save();
            this.ctx.scale(size.width / size.height, 1);
            this.ctx.arc(0, 0, size.height / 2, 0, Math.PI * 2);
            this.ctx.restore();
            break;
            
        case 'triangle':
            this.ctx.moveTo(0, -size.height / 2);
            this.ctx.lineTo(-size.width / 2, size.height / 2);
            this.ctx.lineTo(size.width / 2, size.height / 2);
            this.ctx.closePath();
            break;
            
        case 'rectangle':
            this.ctx.rect(-size.width / 2, -size.height / 2, size.width, size.height);
            break;
            
        case 'diamond':
            this.ctx.moveTo(0, -size.height / 2);
            this.ctx.lineTo(size.width / 2, 0);
            this.ctx.lineTo(0, size.height / 2);
            this.ctx.lineTo(-size.width / 2, 0);
            this.ctx.closePath();
            break;
    }
    
    if (outlineOnly) {
        this.ctx.fill(); // Light colored fill
        this.ctx.stroke(); // Bright colored outline
        
        // Reset shadow for next shape
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
    } else {
        this.ctx.fill();
        this.ctx.stroke();
    }
    
    this.ctx.restore();
}
    
    // ==========================================
    // VISUAL EFFECTS
    // ==========================================
    
    triggerExplosion(x, y) {
        const container = document.getElementById('explosionContainer');
        if (!container) return;
        
        // Play explosion sound
        if (this.audio?.isInitialized) {
            this.audio.playSoundEffect('pop');
            
            // Sometimes say encouragement
            if (Math.random() < 0.4) {
                setTimeout(() => {
                    this.audio.speakEncouragement();
                }, 300);
            }
        }
        
        // Create explosion particles
        for (let i = 0; i < this.config.explosionParticles; i++) {
            const particle = document.createElement('div');
            particle.className = 'explosion-particle';
            
            const angle = (i / this.config.explosionParticles) * Math.PI * 2;
            const distance = Math.random() * 80 + 40;
            const endX = x + Math.cos(angle) * distance;
            const endY = y + Math.sin(angle) * distance;
            
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.background = `hsl(${Math.random() * 60 + 15}, 80%, 60%)`;
            
            container.appendChild(particle);
            
            // Animate particle
            particle.animate([
                { 
                    transform: 'translate(0, 0) scale(1)',
                    opacity: 1
                },
                { 
                    transform: `translate(${endX - x}px, ${endY - y}px) scale(0)`,
                    opacity: 0
                }
            ], {
                duration: 600,
                easing: 'ease-out'
            }).onfinish = () => {
                particle.remove();
            };
        }
        
        console.log('💥 Explosion triggered');
    }
    
    triggerFireworks() {
        const container = document.getElementById('fireworksContainer');
        if (!container) return;
        
        // Multiple firework bursts
        for (let burst = 0; burst < 3; burst++) {
            setTimeout(() => {
                this.createFireworkBurst(container);
            }, burst * 400);
        }
        
        console.log('🎆 Fireworks triggered');
    }
    
    createFireworkBurst(container) {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
        
        for (let i = 0; i < this.config.fireworksCount; i++) {
            const firework = document.createElement('div');
            firework.className = 'firework';
            
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * window.innerHeight * 0.5 + 100;
            
            firework.style.left = x + 'px';
            firework.style.top = y + 'px';
            firework.style.background = colors[Math.floor(Math.random() * colors.length)];
            
            const size = Math.random() * 8 + 4;
            firework.style.width = size + 'px';
            firework.style.height = size + 'px';
            
            container.appendChild(firework);
            
            // Remove after animation
            setTimeout(() => {
                if (firework.parentNode) {
                    firework.remove();
                }
            }, 1000);
        }
    }
    
    // ==========================================
    // UTILITIES
    // ==========================================
    
    reset() {
        this.placedShapes.clear();
        this.completedShapes.clear();
        this.currentScale = null;
        this.currentOffset = null;
        console.log('🔄 AnimalEngine reset');
    }
    
    getProgress() {
        if (!this.currentAnimal) return 0;
        return this.completedShapes.size / this.currentAnimal.shapes.length;
    }
    
    getStats() {
        return {
            currentAnimal: this.currentAnimal?.name || 'None',
            totalShapes: this.currentAnimal?.shapes.length || 0,
            placedShapes: this.completedShapes.size,
            progress: this.getProgress(),
            requiredShapes: this.getRequiredShapes()
        };
    }
    
    // ==========================================
    // CLEANUP
    // ==========================================
    
    destroy() {
        this.placedShapes.clear();
        this.completedShapes.clear();
        this.currentAnimal = null;
        this.currentScale = null;
        this.currentOffset = null;
        console.log('🗑️ AnimalEngine destroyed');
    }
}

// Make available globally
window.AnimalEngine = AnimalEngine;

console.log('🏗️ AnimalEngine loaded - Animal building system ready');