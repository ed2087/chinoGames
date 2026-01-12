// ==========================================
// FALLING SHAPES
// ==========================================

class FallingShape {
    constructor(x, y, shapeType, color, game) {
        this.x = x;
        this.y = y;
        this.shapeType = shapeType;
        this.color = color;
        this.game = game;
        this.size = 40;
        this.speed = 0.08 + Math.random() * 0.05;
        this.wobble = Math.random() * Math.PI * 2;
        this.wobbleSpeed = 0.02;
        // NO rotation variables at all
    }
    
    update(deltaTime) {
        // Fall down
        this.y += this.speed * deltaTime;
        
        // Wobble side to side
        this.wobble += this.wobbleSpeed * deltaTime;
        this.x += Math.sin(this.wobble) * 0.5;
        
        // NO rotation update
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        // NO ctx.rotate() call
        
        // Draw the shape using the game's drawing functions
        this.shapeType.draw.call(this.game, ctx, 0, 0, this.size, this.color.hex);
        
        ctx.restore();
        
        // Glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color.hex;
        ctx.globalAlpha = 0.3;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        // NO ctx.rotate() here either
        this.shapeType.draw.call(this.game, ctx, 0, 0, this.size + 5, this.color.hex);
        ctx.restore();
        
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }
}