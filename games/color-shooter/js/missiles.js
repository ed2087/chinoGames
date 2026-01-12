// ==========================================
// HOMING MISSILES (Player Click Attack)
// ==========================================

class HomingMissile {
    constructor(x, y, target, game) {
        this.game = game;
        this.target = target;
        this.dead = false;
        
        // Start from edge of screen
        this.x = x < game.width / 2 ? -50 : game.width + 50;
        this.y = game.height + 50;
        
        this.speed = 12;
        this.size = 15;
        this.rotation = 0;
        this.trail = [];
        this.maxTrailLength = 20;
    }
    
    update(deltaTime) {
        if (this.dead) return;
        
        // Check if target still exists
        if (!this.game.shapes.includes(this.target)) {
            this.dead = true;
            return;
        }
        
        // Home in on target
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist < 5) {
            // Hit target!
            const isCorrect = this.target.shapeType === this.game.targetShape && 
                             this.target.color === this.game.targetColor;
            this.game.destroyShape(this.target, isCorrect);
            this.dead = true;
            return;
        }
        
        // Move towards target
        this.x += (dx / dist) * this.speed;
        this.y += (dy / dist) * this.speed;
        
        // Update rotation to face target
        this.rotation = Math.atan2(dy, dx);
        
        // Add to trail
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
    }
    
    draw(ctx) {
        if (this.dead) return;
        
        // Draw smoke trail
        for (let i = 0; i < this.trail.length - 1; i++) {
            const alpha = i / this.trail.length;
            const size = this.size * alpha;
            
            ctx.fillStyle = `rgba(255, 100, 50, ${alpha * 0.5})`;
            ctx.beginPath();
            ctx.arc(this.trail[i].x, this.trail[i].y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw missile body
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Missile shape
        ctx.fillStyle = '#FF6B35';
        ctx.beginPath();
        ctx.moveTo(this.size, 0);
        ctx.lineTo(-this.size, -this.size / 2);
        ctx.lineTo(-this.size / 2, 0);
        ctx.lineTo(-this.size, this.size / 2);
        ctx.closePath();
        ctx.fill();
        
        // Flame from back
        const flameLength = this.size * (1 + Math.random() * 0.5);
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.moveTo(-this.size / 2, 0);
        ctx.lineTo(-flameLength, -this.size / 3);
        ctx.lineTo(-flameLength, this.size / 3);
        ctx.closePath();
        ctx.fill();
        
        // Bright flame core
        ctx.fillStyle = '#FFFF00';
        ctx.beginPath();
        ctx.arc(-this.size / 2, 0, this.size / 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // Glow effect
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#FF6B35';
        ctx.fillStyle = '#FF6B35';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}