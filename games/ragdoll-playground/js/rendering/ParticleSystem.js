// ==========================================
// PARTICLE SYSTEM - VISUAL EFFECTS ENGINE
// Creates explosions, sparks, confetti, and other visual effects
// ==========================================

class ParticleSystem {
    
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.mathUtils = window.MathUtils;
        this.deviceUtils = window.DeviceUtils;
        
        // Performance-based configuration
        const perfLevel = this.deviceUtils.performance.level;
        const maxParticles = this.deviceUtils.performance.maxParticles;
        
        this.config = {
            // Performance settings
            maxParticles: maxParticles,
            maxEmitters: perfLevel === 'high' ? 10 : perfLevel === 'medium' ? 6 : 4,
            updateRate: perfLevel === 'high' ? 60 : perfLevel === 'medium' ? 45 : 30,
            
            // Quality settings
            enableTrails: perfLevel !== 'low',
            enableGlow: perfLevel === 'high',
            enableComplexShapes: perfLevel === 'high',
            particleTextures: perfLevel !== 'low',
            
            // Visual settings
            globalAlpha: 0.9,
            blendMode: 'normal', // 'normal', 'multiply', 'screen', 'overlay'
            antialiasing: perfLevel !== 'low',
            
            // Physics settings
            gravity: 0.3,
            airResistance: 0.98,
            bounceFloor: true,
            floorY: canvas.height,
            
            ...options
        };
        
        // Particle pools for performance
        this.particlePool = [];
        this.activeParticles = [];
        this.emitters = [];
        
        // Effect presets
        this.presets = this.createEffectPresets();
        
        // Performance monitoring
        this.lastUpdate = Date.now();
        this.particleCount = 0;
        this.effectCount = 0;
        
        // Visual enhancement features
        this.backgroundEffects = [];
        this.screenEffects = [];
        
        console.log('✨ ParticleSystem initialized');
        console.log(`🎭 Max particles: ${this.config.maxParticles}, Quality: ${perfLevel}`);
    }
    
    // ==========================================
    // PARTICLE CLASS
    // ==========================================
    
    createParticle() {
        return {
            // Position and movement
            x: 0, y: 0,
            vx: 0, vy: 0,
            ax: 0, ay: 0,
            
            // Visual properties
            size: 1,
            rotation: 0,
            rotationSpeed: 0,
            color: '#ffffff',
            alpha: 1,
            
            // Lifecycle
            life: 1.0,
            maxLife: 1.0,
            age: 0,
            
            // Behavior
            type: 'circle',
            gravity: this.config.gravity,
            drag: this.config.airResistance,
            bounce: 0.3,
            
            // Special effects
            trail: [],
            glow: false,
            flicker: false,
            pulse: false,
            
            // Animation
            scaleStart: 1,
            scaleEnd: 1,
            alphaStart: 1,
            alphaEnd: 0,
            
            // Metadata
            emitterId: null,
            userData: {}
        };
    }
    
    getParticle() {
        // Reuse particles from pool for performance
        if (this.particlePool.length > 0) {
            return this.particlePool.pop();
        }
        return this.createParticle();
    }
    
    releaseParticle(particle) {
        // Reset particle and return to pool
        Object.assign(particle, this.createParticle());
        this.particlePool.push(particle);
    }
    
    // ==========================================
    // EFFECT PRESETS
    // ==========================================
    
    createEffectPresets() {
        return {
            // Explosion effects
            explosion: {
                particleCount: this.config.maxParticles > 100 ? 50 : 25,
                spread: Math.PI * 2,
                speed: { min: 2, max: 8 },
                size: { min: 2, max: 8 },
                life: { min: 0.5, max: 2.0 },
                colors: ['#ff6b35', '#f7931e', '#ffd700', '#ff4757', '#ff3838'],
                gravity: 0.2,
                drag: 0.95,
                type: 'circle',
                glow: true
            },
            
            sparkles: {
                particleCount: this.config.maxParticles > 100 ? 30 : 15,
                spread: Math.PI * 2,
                speed: { min: 1, max: 4 },
                size: { min: 1, max: 4 },
                life: { min: 1.0, max: 3.0 },
                colors: ['#ffd700', '#ffed4e', '#ffffff', '#f1c40f', '#f39c12'],
                gravity: -0.1, // Float upward
                drag: 0.98,
                type: 'star',
                flicker: true,
                pulse: true
            },
            
            confetti: {
                particleCount: this.config.maxParticles > 100 ? 40 : 20,
                spread: Math.PI / 3,
                speed: { min: 3, max: 12 },
                size: { min: 3, max: 6 },
                life: { min: 2.0, max: 4.0 },
                colors: ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'],
                gravity: 0.4,
                drag: 0.95,
                type: 'rectangle',
                rotation: true
            },
            
            hearts: {
                particleCount: this.config.maxParticles > 50 ? 20 : 10,
                spread: Math.PI / 4,
                speed: { min: 1, max: 3 },
                size: { min: 4, max: 8 },
                life: { min: 2.0, max: 4.0 },
                colors: ['#ff69b4', '#ff1493', '#dc143c', '#b22222'],
                gravity: -0.05,
                drag: 0.99,
                type: 'heart',
                pulse: true
            },
            
            smoke: {
                particleCount: this.config.maxParticles > 100 ? 25 : 12,
                spread: Math.PI / 6,
                speed: { min: 0.5, max: 2 },
                size: { min: 8, max: 20 },
                life: { min: 3.0, max: 6.0 },
                colors: ['#95a5a6', '#bdc3c7', '#ecf0f1', '#d5dbdb'],
                gravity: -0.02,
                drag: 0.99,
                type: 'circle',
                alphaStart: 0.6,
                alphaEnd: 0
            },
            
            magic: {
                particleCount: this.config.maxParticles > 100 ? 35 : 18,
                spread: Math.PI * 2,
                speed: { min: 1, max: 5 },
                size: { min: 2, max: 6 },
                life: { min: 1.5, max: 3.5 },
                colors: ['#8e44ad', '#9b59b6', '#3498db', '#2980b9', '#1abc9c'],
                gravity: 0.05,
                drag: 0.97,
                type: 'star',
                glow: true,
                flicker: true,
                trail: true
            },
            
            ragdollBreak: {
                particleCount: this.config.maxParticles > 100 ? 30 : 15,
                spread: Math.PI,
                speed: { min: 2, max: 6 },
                size: { min: 1, max: 4 },
                life: { min: 0.8, max: 2.0 },
                colors: ['#e74c3c', '#c0392b', '#f39c12', '#d35400'],
                gravity: 0.3,
                drag: 0.96,
                type: 'circle',
                flicker: true
            }
        };
    }
    
    // ==========================================
    // PARTICLE EMISSION
    // ==========================================
    
    /**
     * Create explosion effect
     */
    createExplosion(x, y, options = {}) {
        const preset = { ...this.presets.explosion, ...options };
        return this.emit(x, y, preset);
    }
    
    /**
     * Create sparkle effect
     */
    createSparkles(x, y, options = {}) {
        const preset = { ...this.presets.sparkles, ...options };
        return this.emit(x, y, preset);
    }
    
    /**
     * Create confetti effect
     */
    createConfetti(x, y, options = {}) {
        const preset = { ...this.presets.confetti, ...options };
        return this.emit(x, y, preset);
    }
    
    /**
     * Create heart effect
     */
    createHearts(x, y, options = {}) {
        const preset = { ...this.presets.hearts, ...options };
        return this.emit(x, y, preset);
    }
    
    /**
     * Create ragdoll break effect
     */
    createRagdollBreak(x, y, options = {}) {
        const preset = { ...this.presets.ragdollBreak, ...options };
        return this.emit(x, y, preset);
    }
    
    /**
     * Generic particle emitter
     */
    emit(x, y, options = {}) {
        // Check particle limit
        if (this.activeParticles.length >= this.config.maxParticles) {
            // Remove oldest particles to make room
            const removeCount = Math.min(10, this.activeParticles.length - this.config.maxParticles + (options.particleCount || 10));
            for (let i = 0; i < removeCount; i++) {
                const oldParticle = this.activeParticles.shift();
                this.releaseParticle(oldParticle);
            }
        }
        
        const particleCount = options.particleCount || 10;
        const emitterId = Date.now() + Math.random();
        const createdParticles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const particle = this.createParticleFromOptions(x, y, options, emitterId);
            this.activeParticles.push(particle);
            createdParticles.push(particle);
        }
        
        // Track effect for analytics
        this.effectCount++;
        
        return {
            emitterId: emitterId,
            particles: createdParticles,
            particleCount: particleCount
        };
    }
    
    createParticleFromOptions(x, y, options, emitterId) {
        const particle = this.getParticle();
        
        // Position
        particle.x = x + (Math.random() - 0.5) * (options.spawnRadius || 0);
        particle.y = y + (Math.random() - 0.5) * (options.spawnRadius || 0);
        
        // Velocity
        const angle = (Math.random() - 0.5) * (options.spread || Math.PI * 2);
        const speed = this.mathUtils.randomFloat(
            options.speed?.min || 1,
            options.speed?.max || 3
        );
        
        particle.vx = Math.cos(angle) * speed;
        particle.vy = Math.sin(angle) * speed;
        
        // Add directional bias if specified
        if (options.direction) {
            particle.vx += options.direction.x || 0;
            particle.vy += options.direction.y || 0;
        }
        
        // Size
        particle.size = this.mathUtils.randomFloat(
            options.size?.min || 2,
            options.size?.max || 4
        );
        particle.scaleStart = options.scaleStart || 1;
        particle.scaleEnd = options.scaleEnd || 1;
        
        // Color
        if (options.colors && options.colors.length > 0) {
            particle.color = this.mathUtils.randomChoice(options.colors);
        } else {
            particle.color = options.color || '#ffffff';
        }
        
        // Alpha
        particle.alpha = options.alphaStart || 1;
        particle.alphaStart = options.alphaStart || 1;
        particle.alphaEnd = options.alphaEnd || 0;
        
        // Life
        particle.life = 1.0;
        particle.maxLife = this.mathUtils.randomFloat(
            options.life?.min || 1,
            options.life?.max || 2
        );
        particle.age = 0;
        
        // Physics
        particle.gravity = options.gravity || this.config.gravity;
        particle.drag = options.drag || this.config.airResistance;
        particle.bounce = options.bounce || 0.3;
        
        // Visual type
        particle.type = options.type || 'circle';
        
        // Rotation
        if (options.rotation) {
            particle.rotation = Math.random() * Math.PI * 2;
            particle.rotationSpeed = (Math.random() - 0.5) * 0.2;
        }
        
        // Special effects
        particle.glow = options.glow || false;
        particle.flicker = options.flicker || false;
        particle.pulse = options.pulse || false;
        
        // Trail
        if (options.trail && this.config.enableTrails) {
            particle.trail = [];
        }
        
        particle.emitterId = emitterId;
        
        return particle;
    }
    
    // ==========================================
    // PARTICLE UPDATE
    // ==========================================
    
    update(deltaTime) {
        const dt = deltaTime / 1000; // Convert to seconds
        
        // Update all active particles
        for (let i = this.activeParticles.length - 1; i >= 0; i--) {
            const particle = this.activeParticles[i];
            
            if (this.updateParticle(particle, dt)) {
                // Particle is still alive
                continue;
            } else {
                // Particle died - remove and recycle
                this.activeParticles.splice(i, 1);
                this.releaseParticle(particle);
            }
        }
        
        // Update emitters
        this.updateEmitters(dt);
        
        // Update screen effects
        this.updateScreenEffects(dt);
        
        // Update particle count for monitoring
        this.particleCount = this.activeParticles.length;
    }
    
    updateParticle(particle, deltaTime) {
        // Age the particle
        particle.age += deltaTime;
        particle.life = 1.0 - (particle.age / particle.maxLife);
        
        // Check if particle should die
        if (particle.life <= 0) {
            return false;
        }
        
        // Update position
        particle.x += particle.vx * deltaTime * 60; // Normalize for 60fps
        particle.y += particle.vy * deltaTime * 60;
        
        // Apply physics
        particle.vy += particle.gravity * deltaTime * 60;
        particle.vx *= particle.drag;
        particle.vy *= particle.drag;
        
        // Floor collision
        if (this.config.bounceFloor && particle.y >= this.config.floorY - particle.size) {
            particle.y = this.config.floorY - particle.size;
            particle.vy *= -particle.bounce;
            particle.vx *= 0.8; // Friction
        }
        
        // Wall bouncing
        if (particle.x <= particle.size) {
            particle.x = particle.size;
            particle.vx *= -particle.bounce;
        } else if (particle.x >= this.canvas.width - particle.size) {
            particle.x = this.canvas.width - particle.size;
            particle.vx *= -particle.bounce;
        }
        
        // Update rotation
        particle.rotation += particle.rotationSpeed * deltaTime * 60;
        
        // Update scale
        const lifeProgress = 1 - particle.life;
        particle.size = this.mathUtils.lerp(
            particle.scaleStart * (particle.size / particle.scaleStart || 1),
            particle.scaleEnd * (particle.size / particle.scaleStart || 1),
            lifeProgress
        );
        
        // Update alpha
        particle.alpha = this.mathUtils.lerp(
            particle.alphaStart,
            particle.alphaEnd,
            lifeProgress
        );
        
        // Update trail
        if (particle.trail && particle.trail.length >= 0) {
            particle.trail.push({ x: particle.x, y: particle.y, alpha: particle.alpha });
            if (particle.trail.length > 10) {
                particle.trail.shift();
            }
        }
        
        // Special effect updates
        if (particle.flicker) {
            particle.alpha *= 0.8 + Math.random() * 0.4;
        }
        
        if (particle.pulse) {
            const pulseScale = 0.9 + Math.sin(particle.age * 8) * 0.1;
            particle.size *= pulseScale;
        }
        
        return true; // Particle is still alive
    }
    
    updateEmitters(deltaTime) {
        // Update continuous emitters (if any)
        for (let i = this.emitters.length - 1; i >= 0; i--) {
            const emitter = this.emitters[i];
            emitter.age += deltaTime;
            
            if (emitter.age >= emitter.duration) {
                this.emitters.splice(i, 1);
                continue;
            }
            
            // Emit particles based on emission rate
            emitter.emissionTimer += deltaTime;
            const emissionInterval = 1 / emitter.emissionRate;
            
            if (emitter.emissionTimer >= emissionInterval) {
                this.emit(emitter.x, emitter.y, emitter.options);
                emitter.emissionTimer = 0;
            }
        }
    }
    
    updateScreenEffects(deltaTime) {
        // Update screen-wide effects (screen shakes, fades, etc.)
        for (let i = this.screenEffects.length - 1; i >= 0; i--) {
            const effect = this.screenEffects[i];
            effect.age += deltaTime;
            
            if (effect.age >= effect.duration) {
                this.screenEffects.splice(i, 1);
            }
        }
    }
    
    // ==========================================
    // PARTICLE RENDERING
    // ==========================================
    
    render(ctx = this.ctx) {
        if (!ctx || this.activeParticles.length === 0) return;
        
        ctx.save();
        
        // Set global alpha
        ctx.globalAlpha = this.config.globalAlpha;
        
        // Set blend mode
        ctx.globalCompositeOperation = this.config.blendMode;
        
        // Render all particles
        for (const particle of this.activeParticles) {
            this.renderParticle(ctx, particle);
        }
        
        // Render screen effects
        this.renderScreenEffects(ctx);
        
        ctx.restore();
    }
    
    renderParticle(ctx, particle) {
        if (particle.alpha <= 0.01) return; // Skip nearly transparent particles
        
        ctx.save();
        
        // Set particle alpha
        ctx.globalAlpha = particle.alpha * this.config.globalAlpha;
        
        // Move to particle position
        ctx.translate(particle.x, particle.y);
        
        // Rotate if needed
        if (particle.rotation !== 0) {
            ctx.rotate(particle.rotation);
        }
        
        // Render trail first
        if (particle.trail && particle.trail.length > 1) {
            this.renderTrail(ctx, particle.trail);
        }
        
        // Render glow effect
        if (particle.glow && this.config.enableGlow) {
            this.renderGlow(ctx, particle);
        }
        
        // Set particle color
        ctx.fillStyle = particle.color;
        ctx.strokeStyle = particle.color;
        
        // Render based on particle type
        switch (particle.type) {
            case 'circle':
                this.renderCircle(ctx, particle);
                break;
                
            case 'rectangle':
                this.renderRectangle(ctx, particle);
                break;
                
            case 'star':
                this.renderStar(ctx, particle);
                break;
                
            case 'heart':
                this.renderHeart(ctx, particle);
                break;
                
            case 'triangle':
                this.renderTriangle(ctx, particle);
                break;
                
            default:
                this.renderCircle(ctx, particle);
        }
        
        ctx.restore();
    }
    
    renderCircle(ctx, particle) {
        ctx.beginPath();
        ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    renderRectangle(ctx, particle) {
        const size = particle.size;
        ctx.fillRect(-size / 2, -size / 2, size, size);
    }
    
    renderStar(ctx, particle) {
        const size = particle.size;
        const spikes = 5;
        const outerRadius = size;
        const innerRadius = size * 0.5;
        
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const angle = (i / (spikes * 2)) * Math.PI * 2;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
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
    }
    
    renderHeart(ctx, particle) {
        const size = particle.size;
        const x = 0;
        const y = 0;
        
        ctx.beginPath();
        ctx.moveTo(x, y + size / 4);
        ctx.quadraticCurveTo(x - size / 2, y - size / 2, x - size / 4, y);
        ctx.quadraticCurveTo(x, y + size / 4, x + size / 4, y);
        ctx.quadraticCurveTo(x + size / 2, y - size / 2, x, y + size / 4);
        ctx.fill();
    }
    
    renderTriangle(ctx, particle) {
        const size = particle.size;
        
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(-size, size);
        ctx.lineTo(size, size);
        ctx.closePath();
        ctx.fill();
    }
    
    renderTrail(ctx, trail) {
        if (trail.length < 2) return;
        
        ctx.save();
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(trail[0].x, trail[0].y);
        
        for (let i = 1; i < trail.length; i++) {
            const point = trail[i];
            ctx.globalAlpha = point.alpha * (i / trail.length) * 0.5;
            ctx.lineTo(point.x, point.y);
        }
        
        ctx.stroke();
        ctx.restore();
    }
    
    renderGlow(ctx, particle) {
        ctx.save();
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = particle.size * 2;
        ctx.globalAlpha *= 0.8;
        
        ctx.beginPath();
        ctx.arc(0, 0, particle.size * 1.2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    renderScreenEffects(ctx) {
        for (const effect of this.screenEffects) {
            switch (effect.type) {
                case 'flash':
                    this.renderScreenFlash(ctx, effect);
                    break;
                case 'fade':
                    this.renderScreenFade(ctx, effect);
                    break;
            }
        }
    }
    
    renderScreenFlash(ctx, effect) {
        const progress = effect.age / effect.duration;
        const alpha = (1 - progress) * effect.intensity;
        
        ctx.save();
        ctx.fillStyle = effect.color || '#ffffff';
        ctx.globalAlpha = alpha;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.restore();
    }
    
    renderScreenFade(ctx, effect) {
        const progress = effect.age / effect.duration;
        let alpha;
        
        if (effect.fadeIn) {
            alpha = progress * effect.intensity;
        } else {
            alpha = (1 - progress) * effect.intensity;
        }
        
        ctx.save();
        ctx.fillStyle = effect.color || '#000000';
        ctx.globalAlpha = alpha;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.restore();
    }
    
    // ==========================================
    // CONTINUOUS EMITTERS
    // ==========================================
    
    createEmitter(x, y, options = {}) {
        const emitter = {
            x: x,
            y: y,
            age: 0,
            duration: options.duration || 5, // seconds
            emissionRate: options.emissionRate || 10, // particles per second
            emissionTimer: 0,
            options: options,
            id: Date.now() + Math.random()
        };
        
        this.emitters.push(emitter);
        return emitter.id;
    }
    
    removeEmitter(emitterId) {
        this.emitters = this.emitters.filter(emitter => emitter.id !== emitterId);
    }
    
    moveEmitter(emitterId, x, y) {
        const emitter = this.emitters.find(e => e.id === emitterId);
        if (emitter) {
            emitter.x = x;
            emitter.y = y;
        }
    }
    
    // ==========================================
    // SCREEN EFFECTS
    // ==========================================
    
    addScreenFlash(color = '#ffffff', intensity = 0.5, duration = 0.2) {
        this.screenEffects.push({
            type: 'flash',
            color: color,
            intensity: intensity,
            duration: duration,
            age: 0
        });
    }
    
    addScreenFade(color = '#000000', intensity = 1.0, duration = 1.0, fadeIn = false) {
        this.screenEffects.push({
            type: 'fade',
            color: color,
            intensity: intensity,
            duration: duration,
            fadeIn: fadeIn,
            age: 0
        });
    }
    
    // ==========================================
    // UTILITY METHODS
    // ==========================================
    
    /**
     * Clear all particles and effects
     */
    clear() {
        // Return all active particles to pool
        for (const particle of this.activeParticles) {
            this.releaseParticle(particle);
        }
        
        this.activeParticles = [];
        this.emitters = [];
        this.screenEffects = [];
        this.particleCount = 0;
        
        console.log('✨ Particle system cleared');
    }
    
    /**
     * Get particle system statistics
     */
    getStats() {
        return {
            activeParticles: this.activeParticles.length,
            pooledParticles: this.particlePool.length,
            activeEmitters: this.emitters.length,
            screenEffects: this.screenEffects.length,
            maxParticles: this.config.maxParticles,
            effectCount: this.effectCount,
            
            performance: {
                level: this.deviceUtils.performance.level,
                trails: this.config.enableTrails,
                glow: this.config.enableGlow,
                textures: this.config.particleTextures
            }
        };
    }
    
    /**
     * Adjust quality based on performance
     */
    adjustQuality(newLevel) {
        switch (newLevel) {
            case 'low':
                this.config.enableTrails = false;
                this.config.enableGlow = false;
                this.config.particleTextures = false;
                this.config.maxParticles = Math.min(this.config.maxParticles, 50);
                break;
                
            case 'medium':
                this.config.enableTrails = true;
                this.config.enableGlow = false;
                this.config.particleTextures = false;
                this.config.maxParticles = Math.min(this.config.maxParticles, 100);
                break;
                
            case 'high':
                this.config.enableTrails = true;
                this.config.enableGlow = true;
                this.config.particleTextures = true;
                this.config.maxParticles = Math.min(this.config.maxParticles, 200);
                break;
        }
        
        console.log(`✨ Particle quality adjusted to ${newLevel}`);
    }
    
    /**
     * Get debug information
     */
    getDebugInfo() {
        const stats = this.getStats();
        
        return {
            ...stats,
            memoryUsage: {
                activeParticles: this.activeParticles.length,
                poolSize: this.particlePool.length,
                totalAllocated: this.activeParticles.length + this.particlePool.length
            },
            
            performance: {
                ...stats.performance,
                updateRate: this.config.updateRate,
                lastUpdate: this.lastUpdate,
                frameTime: Date.now() - this.lastUpdate
            }
        };
    }
    
    /**
     * Clean shutdown
     */
    destroy() {
        console.log('🗑️ Destroying ParticleSystem...');
        
        this.clear();
        this.particlePool = [];
        this.presets = null;
        this.canvas = null;
this.ctx = null;
        
        console.log('✅ ParticleSystem destroyed');
    }
}

// Make available globally
window.ParticleSystem = ParticleSystem;

console.log('✨ ParticleSystem loaded - Advanced particle effects and visual magic ready');