// ==========================================
// PARTICLE SYSTEM (Explosions)
// ==========================================

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.dead = false;
        
        // Random velocity
        const speed = 2 + Math.random() * 4;
        const angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        // Size
        this.size = 3 + Math.random() * 5;
        this.startSize = this.size;
        
        // Life
        this.life = 1.0;
        this.decay = 0.015 + Math.random() * 0.01;
        
        // Gravity
        this.gravity = 0.1;
    }
    
    update(deltaTime) {
        // Apply velocity
        this.x += this.vx;
        this.y += this.vy;
        
        // Apply gravity
        this.vy += this.gravity;
        
        // Friction
        this.vx *= 0.98;
        this.vy *= 0.98;
        
        // Decay
        this.life -= this.decay;
        this.size = this.startSize * this.life;
        
        if (this.life <= 0) {
            this.dead = true;
        }
    }
    
    draw(ctx) {
        if (this.dead) return;
        
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }
}

// ==========================================
// CONFETTI PARTICLE (For celebrations)
// ==========================================

class ConfettiParticle extends Particle {
    constructor(x, y) {
        const colors = ['#FF6B35', '#F7931E', '#FDC830', '#4ECDC4', '#44A08D', '#A55EEA', '#FF69B4'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        super(x, y, color);
        
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = -5 - Math.random() * 5;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
        this.width = 8 + Math.random() * 6;
        this.height = 4 + Math.random() * 3;
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        this.rotation += this.rotationSpeed;
    }
    
    draw(ctx) {
        if (this.dead) return;
        
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        ctx.restore();
        ctx.globalAlpha = 1;
    }
}