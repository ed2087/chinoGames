// ==========================================
// TURRETS - 3 Different Weapon Types
// ==========================================

class Turret {
    constructor(x, y, game) {
        this.x = x;
        this.y = y;
        this.game = game;
        this.cooldown = 0;
        this.maxCooldown = 3000;
        this.range = 300; // Radar range
        this.killZone = 150; // Distance from bottom before "last chance" shot
        this.target = null;
    }
    
    update(deltaTime) {
        this.cooldown = Math.max(0, this.cooldown - deltaTime);
        
        // Find target
        if (this.cooldown === 0) {
            this.findTarget();
            if (this.target) {
                this.fire();
            }
        }
    }
    
    findTarget() {
        this.target = null;
        let highestPriority = -1;
        
        for (const shape of this.game.shapes) {
            // Only target correct shapes
            if (shape.shapeType === this.game.targetShape && 
                shape.color === this.game.targetColor) {
                
                const dist = Math.hypot(shape.x - this.x, shape.y - this.y);
                
                // Check if in range
                if (dist < this.range) {
                    // Priority system: shapes closer to bottom (about to escape) get priority
                    const distanceFromBottom = this.game.height - shape.y;
                    
                    // HIGH PRIORITY: Shape is in kill zone (about to escape)
                    if (distanceFromBottom < this.killZone) {
                        const priority = 1000 - distanceFromBottom; // Higher priority = closer to bottom
                        
                        if (priority > highestPriority) {
                            highestPriority = priority;
                            this.target = shape;
                        }
                    }
                    // NORMAL PRIORITY: Just find closest in range
                    else if (highestPriority < 0) {
                        if (dist < this.range) {
                            this.target = shape;
                        }
                    }
                }
            }
        }
    }
    
    fire() {
        // Override in subclasses
    }
    
    drawBase(ctx) {
        // Draw radar range (faint circle)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw kill zone indicator (red zone at bottom)
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.2)';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);
        const killZoneY = this.game.height - this.killZone;
        ctx.beginPath();
        ctx.moveTo(0, killZoneY);
        ctx.lineTo(this.game.width, killZoneY);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Turret base
        ctx.fillStyle = '#2C3E50';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 30, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#34495E';
        ctx.lineWidth = 4;
        ctx.stroke();
    }
}

// ==========================================
// LIGHTNING TURRET
// ==========================================
class LightningTurret extends Turret {
    constructor(x, y, game) {
        super(x, y, game);
        this.maxCooldown = 3000;
        this.range = 300;
        this.color = '#9B59B6';
        this.lightningBolts = [];
    }
    
    fire() {
        if (!this.target) return;
        
        this.cooldown = this.maxCooldown;
        
        // Create lightning bolt
        this.lightningBolts.push({
            x: this.x,
            y: this.y,
            targetX: this.target.x,
            targetY: this.target.y,
            life: 200,
            segments: this.generateLightningPath(this.x, this.y, this.target.x, this.target.y)
        });
        
        // Damage target
        this.game.destroyShape(this.target, true);
        
        // Chain to nearby shapes (bonus!)
        this.chainLightning(this.target);
    }
    
    generateLightningPath(x1, y1, x2, y2) {
        const segments = [];
        const numSegments = 8;
        
        for (let i = 0; i <= numSegments; i++) {
            const t = i / numSegments;
            const x = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 30;
            const y = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 30;
            segments.push({ x, y });
        }
        
        return segments;
    }
    
    chainLightning(fromShape) {
        // Find one nearby correct shape to chain to
        for (const shape of this.game.shapes) {
            if (shape === fromShape) continue;
            
            if (shape.shapeType === this.game.targetShape && 
                shape.color === this.game.targetColor) {
                
                const dist = Math.hypot(shape.x - fromShape.x, shape.y - fromShape.y);
                if (dist < 150) {
                    // Chain lightning effect
                    this.lightningBolts.push({
                        x: fromShape.x,
                        y: fromShape.y,
                        targetX: shape.x,
                        targetY: shape.y,
                        life: 150,
                        segments: this.generateLightningPath(fromShape.x, fromShape.y, shape.x, shape.y)
                    });
                    
                    this.game.destroyShape(shape, true);
                    break;
                }
            }
        }
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        // Update lightning bolts
        for (let i = this.lightningBolts.length - 1; i >= 0; i--) {
            this.lightningBolts[i].life -= deltaTime;
            if (this.lightningBolts[i].life <= 0) {
                this.lightningBolts.splice(i, 1);
            }
        }
    }
    
    draw(ctx) {
        this.drawBase(ctx);
        
        // Draw lightning symbol
        ctx.fillStyle = this.color;
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚡', this.x, this.y);
        
        // Draw lightning bolts
        for (const bolt of this.lightningBolts) {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 4;
            ctx.shadowBlur = 20;
            ctx.shadowColor = this.color;
            
            ctx.beginPath();
            for (let i = 0; i < bolt.segments.length - 1; i++) {
                ctx.moveTo(bolt.segments[i].x, bolt.segments[i].y);
                ctx.lineTo(bolt.segments[i + 1].x, bolt.segments[i + 1].y);
            }
            ctx.stroke();
            
            ctx.shadowBlur = 0;
        }
        
        // Draw cooldown indicator
        this.drawCooldown(ctx);
    }
    
    drawCooldown(ctx) {
        const cooldownPercent = 1 - (this.cooldown / this.maxCooldown);
        
        ctx.fillStyle = 'rgba(155, 89, 182, 0.3)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 35, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * cooldownPercent);
        ctx.lineTo(this.x, this.y);
        ctx.fill();
    }
}

// ==========================================
// LASER TURRET
// ==========================================
class LaserTurret extends Turret {
    constructor(x, y, game) {
        super(x, y, game);
        this.maxCooldown = 4000;
        this.range = 350;
        this.color = '#E74C3C';
        this.charging = false;
        this.firing = false;
        this.fireTime = 0;
        this.maxFireTime = 1000;
        this.angle = -Math.PI / 2;
    }
    
    fire() {
        if (!this.target) return;
        
        this.charging = true;
        this.cooldown = this.maxCooldown;
        
        // Calculate angle to target
        this.angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
        
        setTimeout(() => {
            this.charging = false;
            this.firing = true;
            this.fireTime = this.maxFireTime;
        }, 300);
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        if (this.firing) {
            this.fireTime -= deltaTime;
            
            // Damage shapes in laser path
            const laserEnd = {
                x: this.x + Math.cos(this.angle) * 1000,
                y: this.y + Math.sin(this.angle) * 1000
            };
            
            for (let i = this.game.shapes.length - 1; i >= 0; i--) {
                const shape = this.game.shapes[i];
                
                // Check if shape is in laser path
                const distToLine = this.pointToLineDistance(
                    shape.x, shape.y,
                    this.x, this.y,
                    laserEnd.x, laserEnd.y
                );
                
                if (distToLine < shape.size + 10) {
                    const isCorrect = shape.shapeType === this.game.targetShape && 
                                     shape.color === this.game.targetColor;
                    this.game.destroyShape(shape, isCorrect);
                }
            }
            
            if (this.fireTime <= 0) {
                this.firing = false;
            }
        }
    }
    
    pointToLineDistance(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0) param = dot / lenSq;
        
        let xx, yy;
        
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    draw(ctx) {
        this.drawBase(ctx);
        
        // Draw laser symbol
        ctx.fillStyle = this.color;
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔴', this.x, this.y);
        
        // Draw charging effect
        if (this.charging) {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 3;
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.color;
            
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.arc(this.x, this.y, 40 + i * 10, 0, Math.PI * 2);
                ctx.stroke();
            }
            
            ctx.shadowBlur = 0;
        }
        
        // Draw laser beam
        if (this.firing) {
            const endX = this.x + Math.cos(this.angle) * 1000;
            const endY = this.y + Math.sin(this.angle) * 1000;
            
            // Outer glow
            ctx.strokeStyle = 'rgba(231, 76, 60, 0.3)';
            ctx.lineWidth = 20;
            ctx.shadowBlur = 30;
            ctx.shadowColor = this.color;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            
            // Inner beam
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 8;
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            
            // Core
            ctx.strokeStyle = '#FFF';
            ctx.lineWidth = 3;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            
            ctx.shadowBlur = 0;
        }
        
        // Draw cooldown indicator
        this.drawCooldown(ctx);
    }
    
    drawCooldown(ctx) {
        const cooldownPercent = 1 - (this.cooldown / this.maxCooldown);
        
        ctx.fillStyle = 'rgba(231, 76, 60, 0.3)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 35, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * cooldownPercent);
        ctx.lineTo(this.x, this.y);
        ctx.fill();
    }
}

// ==========================================
// PROJECTILE TURRET
// ==========================================
class ProjectileTurret extends Turret {
    constructor(x, y, game) {
        super(x, y, game);
        this.maxCooldown = 2500;
        this.range = 300;
        this.color = '#27AE60';
        this.projectiles = [];
    }
    
    fire() {
        if (!this.target) return;
        
        this.cooldown = this.maxCooldown;
        
        // Fire projectile
        const angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
        
        this.projectiles.push({
            x: this.x,
            y: this.y,
            vx: Math.cos(angle) * 8,
            vy: Math.sin(angle) * 8,
            size: 8,
            life: 2000,
            trail: []
        });
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            
            // Add to trail
            proj.trail.push({ x: proj.x, y: proj.y });
            if (proj.trail.length > 10) proj.trail.shift();
            
            // Move
            proj.x += proj.vx;
            proj.y += proj.vy;
            proj.life -= deltaTime;
            
            // Check collision with shapes
            for (let j = this.game.shapes.length - 1; j >= 0; j--) {
                const shape = this.game.shapes[j];
                const dist = Math.hypot(proj.x - shape.x, proj.y - shape.y);
                
                if (dist < shape.size + proj.size) {
                    const isCorrect = shape.shapeType === this.game.targetShape && 
                                     shape.color === this.game.targetColor;
                    this.game.destroyShape(shape, isCorrect);
                    this.projectiles.splice(i, 1);
                    break;
                }
            }
            
            // Remove if expired
            if (proj.life <= 0 || proj.y < 0) {
                this.projectiles.splice(i, 1);
            }
        }
    }
    
    draw(ctx) {
        this.drawBase(ctx);
        
        // Draw projectile symbol
        ctx.fillStyle = this.color;
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💚', this.x, this.y);
        
        // Draw projectiles
        for (const proj of this.projectiles) {
            // Trail
            ctx.strokeStyle = 'rgba(39, 174, 96, 0.5)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            for (let i = 0; i < proj.trail.length - 1; i++) {
                ctx.moveTo(proj.trail[i].x, proj.trail[i].y);
                ctx.lineTo(proj.trail[i + 1].x, proj.trail[i + 1].y);
            }
            ctx.stroke();
            
            // Projectile
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.color;
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, proj.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        
        // Draw cooldown indicator
        this.drawCooldown(ctx);
    }
    
    drawCooldown(ctx) {
        const cooldownPercent = 1 - (this.cooldown / this.maxCooldown);
        
        ctx.fillStyle = 'rgba(39, 174, 96, 0.3)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 35, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * cooldownPercent);
        ctx.lineTo(this.x, this.y);
        ctx.fill();
    }
}