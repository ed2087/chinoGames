// ==========================================
// CANVAS-DRAWN ANIMALS FOR PATH HOME GAME
// ==========================================

class CanvasAnimal {
    constructor(x, y, size = 1.0) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.walkCycle = 0;
        this.isWalking = false;
        this.walkSpeed = 0.05;
        this.homeReached = false;
        this.scale = size;
    }
    
    startWalking() {
        this.isWalking = true;
        this.walkCycle = 0;
    }
    
    stopWalking() {
        this.isWalking = false;
        this.walkCycle = 0;
    }
    
    update() {
        if (this.isWalking) {
            this.walkCycle += this.walkSpeed;
            if (this.walkCycle > 1) this.walkCycle = 0;
        }
    }
    
    moveTo(x, y) {
        this.x = x;
        this.y = y;
    }
}

class CanvasPenguin extends CanvasAnimal {
    constructor(x, y, size = 1.0) {
        super(x, y, size);
        this.name = 'penguin';
        this.homeType = 'igloo';
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);
        
        // Body bobbing animation
        const bodyBob = this.isWalking ? Math.sin(this.walkCycle * Math.PI * 4) * 2 : 0;
        ctx.translate(0, bodyBob);
        
        // Body (main blue oval)
        ctx.fillStyle = '#4A90E2';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(0, 0, 25, 35, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Belly (white oval)
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.ellipse(0, 5, 15, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Wings (animated based on walk cycle)
        const wingFlap = this.isWalking ? Math.sin(this.walkCycle * Math.PI * 8) * 5 : 0;
        this.drawWing(ctx, -22, -5 + wingFlap);
        this.drawWing(ctx, 22, -5 - wingFlap);
        
        // Head
        ctx.fillStyle = '#4A90E2';
        ctx.beginPath();
        ctx.ellipse(0, -25, 18, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Eyes
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.ellipse(-8, -28, 6, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(8, -28, 6, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Pupils
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.ellipse(-8, -28, 3, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(8, -28, 3, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Beak
        ctx.fillStyle = '#FF8C00';
        ctx.beginPath();
        ctx.ellipse(0, -22, 4, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Feet (animated for walking)
        const footOffset = this.isWalking ? Math.sin(this.walkCycle * Math.PI * 4) * 8 : 0;
        this.drawFoot(ctx, -10, 30, footOffset);
        this.drawFoot(ctx, 10, 30, -footOffset);
        
        ctx.restore();
    }
    
    drawWing(ctx, x, y) {
        ctx.fillStyle = '#4A90E2';
        ctx.beginPath();
        ctx.ellipse(x, y, 8, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
    
    drawFoot(ctx, x, y, offset = 0) {
        ctx.save();
        ctx.translate(x, y + offset);
        
        ctx.fillStyle = '#FF8C00';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        
        // Foot base
        ctx.beginPath();
        ctx.ellipse(0, 0, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Toes
        for (let i = -1; i <= 1; i++) {
            ctx.beginPath();
            ctx.ellipse(i * 4, 3, 2, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

class CanvasTeddy extends CanvasAnimal {
    constructor(x, y, size = 1.0) {
        super(x, y, size);
        this.name = 'teddy';
        this.homeType = 'house';
        this.walkSpeed = 0.03; // Slower than penguin
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);
        
        // Body sway animation
        const sway = this.isWalking ? Math.sin(this.walkCycle * Math.PI * 2) * 3 : 0;
        ctx.translate(sway, 0);
        
        // Body (brown oval)
        ctx.fillStyle = '#8B4513';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(0, 0, 22, 30, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Belly (lighter brown)
        ctx.fillStyle = '#CD853F';
        ctx.beginPath();
        ctx.ellipse(0, 3, 14, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Arms (animated)
        const armSwing = this.isWalking ? Math.sin(this.walkCycle * Math.PI * 4) * 10 : 0;
        this.drawArm(ctx, -20, -8, armSwing);
        this.drawArm(ctx, 20, -8, -armSwing);
        
        // Head
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(0, -22, 16, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Ears
        ctx.beginPath();
        ctx.ellipse(-12, -32, 6, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(12, -32, 6, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Eyes
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.ellipse(-6, -25, 2, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(6, -25, 2, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Nose
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.ellipse(0, -20, 2, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Legs (animated for walking)
        const legOffset = this.isWalking ? Math.sin(this.walkCycle * Math.PI * 4) * 6 : 0;
        this.drawLeg(ctx, -8, 25, legOffset);
        this.drawLeg(ctx, 8, 25, -legOffset);
        
        ctx.restore();
    }
    
    drawArm(ctx, x, y, rotation) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation * Math.PI / 180);
        
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(0, 8, 6, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
    }
    
    drawLeg(ctx, x, y, offset) {
        ctx.save();
        ctx.translate(x, y + offset);
        
        ctx.fillStyle = '#8B4513';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.ellipse(0, 0, 5, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
    }
}

class CanvasDucky extends CanvasAnimal {
    constructor(x, y, size = 1.0) {
        super(x, y, size);
        this.name = 'ducky';
        this.homeType = 'pond';
        this.walkSpeed = 0.08; // Fastest walker
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);
        
        // Bouncy walk animation
        const bounce = this.isWalking ? Math.abs(Math.sin(this.walkCycle * Math.PI * 6)) * 8 : 0;
        ctx.translate(0, -bounce);
        
        // Body (yellow oval)
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(0, 0, 20, 25, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Wings (flapping)
        const wingFlap = this.isWalking ? Math.sin(this.walkCycle * Math.PI * 12) * 8 : 0;
        this.drawWing(ctx, -18, -3 + wingFlap);
        this.drawWing(ctx, 18, -3 - wingFlap);
        
        // Head
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.ellipse(0, -20, 14, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Eyes
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.ellipse(-5, -23, 2, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(5, -23, 2, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Beak
        ctx.fillStyle = '#FF8C00';
        ctx.beginPath();
        ctx.ellipse(0, -18, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Feet (paddling motion)
        const paddleOffset = this.isWalking ? Math.sin(this.walkCycle * Math.PI * 6) * 6 : 0;
        this.drawFoot(ctx, -8, 22, paddleOffset);
        this.drawFoot(ctx, 8, 22, -paddleOffset);
        
        ctx.restore();
    }
    
    drawWing(ctx, x, y) {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.ellipse(x, y, 6, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
    
    drawFoot(ctx, x, y, offset) {
        ctx.save();
        ctx.translate(x, y + offset);
        
        ctx.fillStyle = '#FF8C00';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        
        // Webbed foot
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
    }
}

// Animal factory function createAnimal 
function createAnimal(type, x, y, size = 1.0) {
    console.log('createAnimal called:', type, x, y, size);
    
    switch (type?.toLowerCase()) {
        case 'penguin':
            return new CanvasPenguin(x, y, size);
        case 'teddy':
            return new CanvasTeddy(x, y, size);
        case 'ducky':
            return new CanvasDucky(x, y, size);
        default:
            console.warn('Unknown animal type:', type, '- defaulting to penguin');
            return new CanvasPenguin(x, y, size);
    }
}


// Make sure createAnimal is globally available
if (typeof window !== 'undefined') {
    window.createAnimal = createAnimal;
    window.CanvasPenguin = CanvasPenguin;
    window.CanvasTeddy = CanvasTeddy;
    window.CanvasDucky = CanvasDucky;
}

console.log('Canvas animals loaded, createAnimal available:', typeof window.createAnimal);