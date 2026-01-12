// ==========================================
// PARTICLE SYSTEM FOR CONFETTI EFFECTS
// ==========================================

class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.maxParticles = 50;
        this.particlePool = [];
        
        // Pre-create particle pool for performance
        for (let i = 0; i < this.maxParticles; i++) {
            this.particlePool.push(this.createParticle());
        }
        
        console.log('Particle system initialized');
    }
    
    createParticle() {
        return {
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            size: 0,
            color: '#FF0000',
            life: 0,
            maxLife: 0,
            rotation: 0,
            rotationSpeed: 0,
            active: false,
            gravity: 0.3,
            friction: 0.98
        };
    }
    
    createExplosion(x, y, color, count = 12) {
        // Play explosion sound
        this.playExplosionSound();
        
        // Create burst of particles
        for (let i = 0; i < count; i++) {
            const particle = this.getParticle();
            if (!particle) break;
            
            // Random explosion direction
            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
            const speed = 3 + Math.random() * 4;
            
            particle.x = x;
            particle.y = y;
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed - Math.random() * 2; // Upward bias
            particle.size = 4 + Math.random() * 4;
            particle.color = this.getParticleColor(color);
            particle.life = 0;
            particle.maxLife = 0.6 + Math.random() * 0.4; // 0.6-1.0 seconds
            particle.rotation = Math.random() * Math.PI * 2;
            particle.rotationSpeed = (Math.random() - 0.5) * 0.2;
            particle.active = true;
            
            this.particles.push(particle);
        }
        
        console.log(`Created explosion with ${count} particles at (${x}, ${y})`);
    }
    
    getParticleColor(baseColor) {
        // Create color variations
        const colors = [
            baseColor,
            this.adjustBrightness(baseColor, 0.3),
            this.adjustBrightness(baseColor, -0.2)
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    adjustBrightness(hex, factor) {
        // Simple brightness adjustment
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        
        const newR = Math.max(0, Math.min(255, r + factor * 255));
        const newG = Math.max(0, Math.min(255, g + factor * 255));
        const newB = Math.max(0, Math.min(255, b + factor * 255));
        
        return `#${Math.round(newR).toString(16).padStart(2, '0')}${Math.round(newG).toString(16).padStart(2, '0')}${Math.round(newB).toString(16).padStart(2, '0')}`;
    }
    
    getParticle() {
        // Try to reuse a particle from the pool
        for (let particle of this.particlePool) {
            if (!particle.active) {
                return particle;
            }
        }
        
        // If pool is full, remove oldest active particle
        if (this.particles.length > 0) {
            const oldParticle = this.particles.shift();
            oldParticle.active = false;
            return oldParticle;
        }
        
        return null;
    }
    
    update(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Update physics
            particle.vy += particle.gravity * deltaTime;
            particle.vx *= particle.friction;
            particle.vy *= particle.friction;
            
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.rotation += particle.rotationSpeed;
            
            // Update life
            particle.life += deltaTime;
            
            // Remove dead particles
            if (particle.life >= particle.maxLife) {
                particle.active = false;
                this.particles.splice(i, 1);
            }
        }
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (let particle of this.particles) {
            const lifeRatio = particle.life / particle.maxLife;
            const alpha = 1 - lifeRatio; // Fade out over time
            
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.translate(particle.x, particle.y);
            this.ctx.rotate(particle.rotation);
            
            // Draw confetti piece
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(-particle.size/2, -particle.size/2, particle.size, particle.size);
            
            this.ctx.restore();
        }
    }
    
    playExplosionSound() {
        if (!window.audioSystem?.audioContext) return;
        
        try {
            const audioCtx = window.audioSystem.audioContext;
            
            // Create a "poof" sound
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    const oscillator = audioCtx.createOscillator();
                    const gainNode = audioCtx.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioCtx.destination);
                    
                    oscillator.frequency.setValueAtTime(200 + Math.random() * 300, audioCtx.currentTime);
                    oscillator.type = 'square';
                    
                    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
                    
                    oscillator.start();
                    oscillator.stop(audioCtx.currentTime + 0.1);
                }, i * 30);
            }
        } catch (error) {
            console.warn('Particle explosion sound failed:', error);
        }
    }
    
    clear() {
        this.particles.forEach(particle => particle.active = false);
        this.particles = [];
    }
}

window.ParticleSystem = ParticleSystem;