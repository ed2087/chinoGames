// ==========================================
// PROCEDURAL PARTICLE EFFECTS SYSTEM
// ==========================================

class ParticleGenerator {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.maxParticles = 200;
        this.animationId = null;
        this.isRunning = false;
    }
    
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.animate();
        }
    }
    
    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
    
    animate() {
        this.update();
        this.render();
        
        if (this.isRunning) {
            this.animationId = requestAnimationFrame(() => this.animate());
        }
    }
    
    update() {
        // Update all particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.update();
            
            // Remove dead particles
            if (particle.isDead()) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    render() {
        // Particles render themselves
        for (const particle of this.particles) {
            particle.render(this.ctx);
        }
    }
    
    // Trail sparkles as child draws
    createTrailSparkles(x, y, pressure = 0.5) {
        const count = Math.floor(pressure * 3) + 1;
        
        for (let i = 0; i < count; i++) {
            this.addParticle(new TrailSparkle(x, y, pressure));
        }
    }
    
    // Success explosion when path completed
    createSuccessExplosion(x, y) {
        const particleCount = 20;
        
        for (let i = 0; i < particleCount; i++) {
            this.addParticle(new SuccessParticle(x, y));
        }
        
        // Add some special celebration effects
        for (let i = 0; i < 5; i++) {
            this.addParticle(new CelebrationStar(x, y));
        }
    }
    
    // Path validation feedback
    createValidationSparkle(x, y) {
        this.addParticle(new ValidationSparkle(x, y));
    }
    
    // Environmental effects
    createFloatingBubbles(count = 5) {
        for (let i = 0; i < count; i++) {
            const x = Math.random() * this.canvas.width;
            const y = this.canvas.height + 50;
            this.addParticle(new FloatingBubble(x, y));
        }
    }
    
    createFallingLeaves(count = 3) {
        for (let i = 0; i < count; i++) {
            const x = Math.random() * this.canvas.width;
            const y = -50;
            this.addParticle(new FallingLeaf(x, y));
        }
    }
    
    addParticle(particle) {
        if (this.particles.length < this.maxParticles) {
            this.particles.push(particle);
        }
    }
    
    clear() {
        this.particles = [];
    }
}

// ==========================================
// PARTICLE CLASSES
// ==========================================

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.life = 1.0;
        this.maxLife = 1.0;
        this.age = 0;
    }
    
    update() {
        this.age++;
        this.life = Math.max(0, this.life - 0.02);
    }
    
    isDead() {
        return this.life <= 0;
    }
    
    render(ctx) {
        // Override in subclasses
    }
    
    getAlpha() {
        return this.life / this.maxLife;
    }
}

class TrailSparkle extends Particle {
    constructor(x, y, pressure) {
        super(x, y);
        this.pressure = pressure;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.size = 2 + pressure * 3;
        this.color = this.generateColor();
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
    }
    
    generateColor() {
        const colors = [
            '#FFD700', // Gold
            '#FF69B4', // Hot pink
            '#00BFFF', // Deep sky blue
            '#32CD32', // Lime green
            '#FF6347'  // Tomato
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    update() {
        super.update();
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.95; // Friction
        this.vy *= 0.95;
        this.rotation += this.rotationSpeed;
        this.size *= 0.98; // Shrink over time
    }
    
    render(ctx) {
        ctx.save();
        ctx.globalAlpha = this.getAlpha();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Draw star shape
        ctx.fillStyle = this.color;
        ctx.beginPath();
        
        const spikes = 4;
        const outerRadius = this.size;
        const innerRadius = this.size * 0.5;
        
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i / (spikes * 2)) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

class SuccessParticle extends Particle {
    constructor(x, y) {
        super(x, y);
        const angle = Math.random() * Math.PI * 2;
        const speed = 3 + Math.random() * 4;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed - 2; // Slight upward bias
        this.gravity = 0.1;
        this.size = 3 + Math.random() * 4;
        this.color = this.generateRainbowColor();
        this.life = 1.5;
        this.maxLife = 1.5;
    }
    
    generateRainbowColor() {
        const hue = Math.random() * 360;
        return `hsl(${hue}, 80%, 60%)`;
    }
    
    update() {
        super.update();
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.vx *= 0.99;
    }
    
    render(ctx) {
        ctx.save();
        ctx.globalAlpha = this.getAlpha();
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class CelebrationStar extends Particle {
    constructor(x, y) {
        super(x, y);
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 3;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed - 3;
        this.gravity = 0.05;
        this.size = 5 + Math.random() * 5;
        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.3;
        this.life = 2.0;
        this.maxLife = 2.0;
    }
    
    update() {
        super.update();
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.rotation += this.rotationSpeed;
        this.vx *= 0.98;
    }
    
    render(ctx) {
        ctx.save();
        ctx.globalAlpha = this.getAlpha();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Draw larger star
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        const spikes = 5;
        const outerRadius = this.size;
        const innerRadius = this.size * 0.4;
        
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
}

class ValidationSparkle extends Particle {
    constructor(x, y) {
        super(x, y);
        this.size = 4;
        this.maxSize = 8;
        this.growing = true;
        this.life = 1.0;
        this.maxLife = 1.0;
    }
    
    update() {
        super.update();
        
        if (this.growing) {
            this.size += 0.5;
            if (this.size >= this.maxSize) {
                this.growing = false;
            }
        } else {
            this.size -= 0.3;
        }
    }
    
    render(ctx) {
        ctx.save();
        ctx.globalAlpha = this.getAlpha();
        ctx.fillStyle = '#00FF00';
        ctx.strokeStyle = '#00AA00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
}

class FloatingBubble extends Particle {
    constructor(x, y) {
        super(x, y);
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = -0.5 - Math.random() * 1.5;
        this.size = 5 + Math.random() * 15;
        this.life = 3.0;
        this.maxLife = 3.0;
        this.wobble = 0;
        this.wobbleSpeed = 0.05 + Math.random() * 0.05;
    }
    
    update() {
        super.update();
        this.wobble += this.wobbleSpeed;
        this.x += this.vx + Math.sin(this.wobble) * 0.5;
        this.y += this.vy;
        
        // Remove if off screen
        if (this.y < -50) {
            this.life = 0;
        }
    }
    
    render(ctx) {
        ctx.save();
        ctx.globalAlpha = this.getAlpha() * 0.6;
        
        // Bubble body
        ctx.fillStyle = 'rgba(173, 216, 230, 0.3)';
        ctx.strokeStyle = 'rgba(173, 216, 230, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Bubble highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(this.x - this.size * 0.3, this.y - this.size * 0.3, this.size * 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

class FallingLeaf extends Particle {
    constructor(x, y) {
        super(x, y);
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = 1 + Math.random() * 2;
        this.size = 3 + Math.random() * 4;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.1;
        this.sway = 0;
        this.swaySpeed = 0.02 + Math.random() * 0.03;
        this.life = 5.0;
        this.maxLife = 5.0;
        this.color = this.generateLeafColor();
    }
    
    generateLeafColor() {
        const colors = ['#228B22', '#32CD32', '#90EE90', '#7CFC00'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    update() {
        super.update();
        this.sway += this.swaySpeed;
        this.x += this.vx + Math.sin(this.sway) * 1.5;
        this.y += this.vy;
        this.rotation += this.rotationSpeed;
        
        // Remove if off screen
        if (this.y > window.innerHeight + 50) {
            this.life = 0;
        }
    }
    
    render(ctx) {
        ctx.save();
        ctx.globalAlpha = this.getAlpha();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Simple leaf shape
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size, this.size * 1.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Leaf vein
        ctx.strokeStyle = '#006400';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -this.size * 1.5);
        ctx.lineTo(0, this.size * 1.5);
        ctx.stroke();
        
        ctx.restore();
    }
}