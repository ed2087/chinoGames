// ==========================================
// MAIN RENDERER - CANVAS DRAWING ENGINE
// Renders ragdolls, physics bodies, and game world
// ==========================================

class Renderer {
    
    constructor(canvas, physicsEngine = null, particleSystem = null) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.physics = physicsEngine;
        this.particles = particleSystem;
        this.mathUtils = window.MathUtils;
        this.deviceUtils = window.DeviceUtils;
        
        // Performance-based configuration
        const perfLevel = this.deviceUtils.performance.level;
        const renderSettings = this.deviceUtils.getRenderSettings();
        
        this.config = {
            // Quality settings
            antialiasing: perfLevel !== 'low',
            shadows: renderSettings.shadowQuality !== 'none',
            gradients: renderSettings.gradients,
            smoothing: perfLevel === 'high',
            
            // Performance settings
            targetFPS: renderSettings.targetFPS,
            adaptiveFPS: renderSettings.adaptiveFPS,
            pixelRatio: Math.min(window.devicePixelRatio || 1, perfLevel === 'high' ? 2 : 1),
            
            // Visual settings
            backgroundColor: '#87CEEB', // Sky blue
            floorColor: '#90EE90',      // Light green
            showDebugInfo: false,
            showConstraints: false,
            showBounds: false,
            showVelocity: false,
            
            // Ragdoll rendering
            ragdollStyle: 'detailed', // 'simple', 'detailed', 'cartoon'
            bodyOutlines: true,
            jointVisibility: false,
            facialFeatures: true,
            
            // Effects
            motionBlur: perfLevel === 'high',
            screenShake: { x: 0, y: 0, intensity: 0 },
            zoom: 1.0,
            panOffset: { x: 0, y: 0 }
        };
        
        // Rendering state
        this.frameCount = 0;
        this.lastFrameTime = Date.now();
        this.deltaTime = 16.67; // ~60fps
        this.fps = 60;
        
        // Visual enhancement features
        this.backgroundElements = [];
        this.foregroundEffects = [];
        
        // Animation helpers
        this.animationClock = 0;
        
        // Canvas setup
        this.setupCanvas();
        
        console.log('🎨 Renderer initialized');
        console.log(`📐 Canvas: ${this.canvas.width}x${this.canvas.height} (${this.config.pixelRatio}x)`);
        console.log(`🖼️ Quality: ${perfLevel}, Anti-aliasing: ${this.config.antialiasing}`);
    }
    
    // ==========================================
    // CANVAS SETUP
    // ==========================================
    
    setupCanvas() {
        // Set up high DPI rendering
        const rect = this.canvas.getBoundingClientRect();
        const dpr = this.config.pixelRatio;
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        this.ctx.scale(dpr, dpr);
        
        // Set rendering options
        this.ctx.imageSmoothingEnabled = this.config.antialiasing;
        this.ctx.imageSmoothingQuality = this.config.smoothing ? 'high' : 'medium';
        
        // Set up coordinate system (0,0 at top-left)
        this.setupCoordinateSystem();
        
        console.log(`📏 Canvas scaled for ${dpr}x DPI`);
    }
    
    setupCoordinateSystem() {
        // Apply pan and zoom transformations
        this.ctx.setTransform(
            this.config.zoom, 0, 0, this.config.zoom,
            this.config.panOffset.x,
            this.config.panOffset.y
        );
    }
    
    // ==========================================
    // MAIN RENDER LOOP
    // ==========================================
    
    render(deltaTime = 16.67) {
        this.updateFrameStats(deltaTime);
        
        // Clear canvas
        this.clearCanvas();
        
        // Apply screen shake
        this.applyScreenShake();
        
        // Render background
        this.renderBackground();
        
        // Render physics bodies
        if (this.physics) {
            this.renderPhysicsBodies();
        }
        
        // Render particles
        if (this.particles) {
            this.particles.render(this.ctx);
        }
        
        // Render debug info
        if (this.config.showDebugInfo) {
            this.renderDebugOverlay();
        }
        
        // Update animation clock
        this.animationClock += deltaTime / 1000;
        
        this.frameCount++;
    }
    
    updateFrameStats(deltaTime) {
        this.deltaTime = deltaTime;
        
        // Calculate FPS
        const now = Date.now();
        const timeSinceLastFrame = now - this.lastFrameTime;
        this.fps = 1000 / timeSinceLastFrame;
        this.lastFrameTime = now;
        
        // Adaptive quality adjustment
        if (this.config.adaptiveFPS && this.frameCount % 60 === 0) {
            if (this.fps < 45 && this.config.antialiasing) {
                this.config.antialiasing = false;
                this.ctx.imageSmoothingEnabled = false;
                console.log('📉 Reduced rendering quality for performance');
            } else if (this.fps > 55 && !this.config.antialiasing) {
                this.config.antialiasing = true;
                this.ctx.imageSmoothingEnabled = true;
                console.log('📈 Increased rendering quality');
            }
        }
    }
    
clearCanvas() {
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
}

/**
 * Clear the canvas (exposed method for external control) renderParticles
 */
clear() {
    this.clearCanvas();
}

/**
 * Render a complete ragdoll
 */
renderRagdoll(ragdoll) {
    if (!ragdoll || !ragdoll.bodies) return;
    
    // Render all body parts
    for (const [partName, body] of Object.entries(ragdoll.bodies)) {
        if (body) {
            this.renderBody(body);
        }
    }
    
    // Render joints if debug mode is enabled
    if (this.config.showConstraints && ragdoll.constraints) {
        for (const [constraintName, constraint] of Object.entries(ragdoll.constraints)) {
            if (constraint) {
                this.renderConstraint(constraint);
            }
        }
    }
}

/**
 * Render particle system (exposed method for external control)
 */
renderParticles(particleSystem) {
    if (particleSystem && particleSystem.render) {
        particleSystem.render(this.ctx);
    }
}
    
    applyScreenShake() {
        const shake = this.config.screenShake;
        if (shake.intensity > 0) {
            const offsetX = (Math.random() - 0.5) * shake.intensity * shake.x;
            const offsetY = (Math.random() - 0.5) * shake.intensity * shake.y;
            
            this.ctx.translate(offsetX, offsetY);
            
            // Decay shake renderRagdoll
            shake.intensity *= 0.9;
            if (shake.intensity < 0.1) {
                shake.intensity = 0;
            }
        }
    }
    
    // ==========================================
    // BACKGROUND RENDERING
    // ==========================================
    
    renderBackground() {
        this.ctx.save();
        
        // Sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB'); // Sky blue
        gradient.addColorStop(0.7, '#E0F6FF'); // Lighter blue
        gradient.addColorStop(1, this.config.floorColor); // Ground
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Add some clouds (simple decorative elements)
        this.renderClouds();
        
        // Ground line
        this.renderGround();
        
        this.ctx.restore();
    }
    
    renderClouds() {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        
        // Animated clouds
        const cloudOffset = this.animationClock * 10; // Slow movement
        
        const clouds = [
            { x: 100 + cloudOffset % (this.canvas.width + 200), y: 80, size: 40 },
            { x: 300 + (cloudOffset * 0.7) % (this.canvas.width + 200), y: 120, size: 60 },
            { x: 500 + (cloudOffset * 0.5) % (this.canvas.width + 200), y: 100, size: 35 },
        ];
        
        for (const cloud of clouds) {
            this.drawCloud(cloud.x - 200, cloud.y, cloud.size);
        }
        
        this.ctx.restore();
    }
    
    drawCloud(x, y, size) {
        this.ctx.save();
        this.ctx.translate(x, y);
        
        // Simple cloud made of overlapping circles
        const circles = [
            { x: -size * 0.5, y: 0, r: size * 0.5 },
            { x: 0, y: -size * 0.3, r: size * 0.4 },
            { x: size * 0.5, y: 0, r: size * 0.6 },
            { x: size * 0.8, y: size * 0.2, r: size * 0.3 },
            { x: -size * 0.3, y: size * 0.3, r: size * 0.4 }
        ];
        
        for (const circle of circles) {
            this.ctx.beginPath();
            this.ctx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
    
    renderGround() {
        // Simple ground line at bottom of screen
        const groundY = this.canvas.height - 50;
        
        this.ctx.save();
        this.ctx.strokeStyle = '#228B22'; // Forest green
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([]);
        
        this.ctx.beginPath();
        this.ctx.moveTo(0, groundY);
        this.ctx.lineTo(this.canvas.width, groundY);
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    // ==========================================
    // PHYSICS BODY RENDERING
    // ==========================================
    
    renderPhysicsBodies() {
        if (!this.physics || !this.physics.bodies) return;
        
        // Render all bodies
        for (const [bodyId, bodyData] of this.physics.bodies) {
            const body = bodyData.body;
            this.renderBody(body);
        }
        
        // Render constraints if enabled
        if (this.config.showConstraints && this.physics.constraints) {
            for (const [constraintId, constraintData] of this.physics.constraints) {
                const constraint = constraintData.constraint;
                this.renderConstraint(constraint);
            }
        }
    }
    
    renderBody(body) {
        if (!body) return;
        
        this.ctx.save();
        
        // Move to body position and rotate
        this.ctx.translate(body.position.x, body.position.y);
        this.ctx.rotate(body.angle);
        
        // Render shadow if enabled
        if (this.config.shadows) {
            this.renderBodyShadow(body);
        }
        
        // Render based on body type and ragdoll data
        if (body.gameData?.isRagdollPart) {
            this.renderRagdollPart(body);
        } else {
            this.renderGenericBody(body);
        }
        
        // Render debug information
        if (this.config.showBounds) {
            this.renderBodyBounds(body);
        }
        
        if (this.config.showVelocity) {
            this.renderVelocityVector(body);
        }
        
        this.ctx.restore();
    }
    
    renderRagdollPart(body) {
        const partName = body.gameData.partName;
        const ragdollType = body.gameData.ragdollType || 'Human';
        
        // Get color from body data or use default
        const color = body.render?.fillStyle || '#FDBCB4';
        const borderColor = body.render?.strokeStyle || this.darkenColor(color, 20);
        
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = borderColor;
        this.ctx.lineWidth = 2;
        
        // Render based on body part
        switch (partName) {
            case 'head':
                this.renderHead(body, ragdollType);
                break;
            case 'torso':
                this.renderTorso(body, ragdollType);
                break;
            case 'upperArm':
            case 'lowerArm':
                this.renderArm(body, ragdollType);
                break;
            case 'hand':
                this.renderHand(body, ragdollType);
                break;
            case 'upperLeg':
            case 'lowerLeg':
                this.renderLeg(body, ragdollType);
                break;
            case 'foot':
                this.renderFoot(body, ragdollType);
                break;
            default:
                this.renderGenericBody(body);
        }
    }
    
    renderHead(body, ragdollType) {
        const bounds = body.bounds;
        const width = bounds.max.x - bounds.min.x;
        const height = bounds.max.y - bounds.min.y;
        const radius = Math.max(width, height) / 2;
        
        // Head shape (circle)
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        if (this.config.bodyOutlines) {
            this.ctx.stroke();
        }
        
        // Facial features
        if (this.config.facialFeatures && body.gameData?.facialFeatures) {
            this.renderFacialFeatures(body, ragdollType, radius);
        }
    }
    
    renderFacialFeatures(body, ragdollType, headRadius) {
        this.ctx.save();
        
        const scale = headRadius / 20; // Base scale
        
        // Eyes
        this.ctx.fillStyle = '#000000';
        const eyeSize = 3 * scale;
        const eyeOffsetX = 6 * scale;
        const eyeOffsetY = -4 * scale;
        
        // Left eye
        this.ctx.beginPath();
        this.ctx.arc(-eyeOffsetX, eyeOffsetY, eyeSize, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Right eye
        this.ctx.beginPath();
        this.ctx.arc(eyeOffsetX, eyeOffsetY, eyeSize, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Mouth
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2 * scale;
        this.ctx.lineCap = 'round';
        
        const mouthY = 8 * scale;
        const mouthWidth = 8 * scale;
        
        if (ragdollType === 'Frog') {
            // Wide frog mouth
            this.ctx.beginPath();
            this.ctx.arc(0, mouthY, mouthWidth, 0, Math.PI);
            this.ctx.stroke();
        } else {
            // Regular smile
            this.ctx.beginPath();
            this.ctx.arc(0, mouthY - 2 * scale, mouthWidth * 0.8, 0.2, Math.PI - 0.2);
            this.ctx.stroke();
        }
        
        // Special features for different types
        if (ragdollType === 'Robot') {
            // Robot antenna
            this.ctx.strokeStyle = '#666666';
            this.ctx.lineWidth = 2 * scale;
            this.ctx.beginPath();
            this.ctx.moveTo(0, -headRadius);
            this.ctx.lineTo(0, -headRadius - 10 * scale);
            this.ctx.stroke();
            
            // Antenna tip
            this.ctx.fillStyle = '#FF0000';
            this.ctx.beginPath();
            this.ctx.arc(0, -headRadius - 10 * scale, 2 * scale, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
    
    renderTorso(body, ragdollType) {
        const bounds = body.bounds;
        const width = bounds.max.x - bounds.min.x;
        const height = bounds.max.y - bounds.min.y;
        
        // Torso shape (rounded rectangle)
        this.ctx.beginPath();
        this.roundedRect(-width/2, -height/2, width, height, Math.min(width, height) * 0.2);
        this.ctx.fill();
        
        if (this.config.bodyOutlines) {
            this.ctx.stroke();
        }
        
        // Add simple detail based on type
        if (ragdollType === 'Robot') {
            // Robot chest panel
            this.ctx.save();
            this.ctx.fillStyle = '#555555';
            this.ctx.fillRect(-width * 0.3, -height * 0.2, width * 0.6, height * 0.4);
            
            // Control lights
            this.ctx.fillStyle = '#00FF00';
            this.ctx.beginPath();
            this.ctx.arc(-width * 0.1, 0, 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = '#FF0000';
            this.ctx.beginPath();
            this.ctx.arc(width * 0.1, 0, 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
        }
    }
    
    renderArm(body, ragdollType) {
        const bounds = body.bounds;
        const width = bounds.max.x - bounds.min.x;
        const height = bounds.max.y - bounds.min.y;
        
        // Arm shape (rounded rectangle)
        this.ctx.beginPath();
        this.roundedRect(-width/2, -height/2, width, height, width * 0.4);
        this.ctx.fill();
        
        if (this.config.bodyOutlines) {
            this.ctx.stroke();
        }
    }
    
    renderHand(body, ragdollType) {
        const bounds = body.bounds;
        const radius = Math.max(bounds.max.x - bounds.min.x, bounds.max.y - bounds.min.y) / 2;
        
        // Hand shape (circle)
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        if (this.config.bodyOutlines) {
            this.ctx.stroke();
        }
    }
    
    renderLeg(body, ragdollType) {
        const bounds = body.bounds;
        const width = bounds.max.x - bounds.min.x;
        const height = bounds.max.y - bounds.min.y;
        
        // Leg shape (rounded rectangle)
        this.ctx.beginPath();
        this.roundedRect(-width/2, -height/2, width, height, width * 0.4);
        this.ctx.fill();
        
        if (this.config.bodyOutlines) {
            this.ctx.stroke();
        }
    }
    
    renderFoot(body, ragdollType) {
        const bounds = body.bounds;
        const width = bounds.max.x - bounds.min.x;
        const height = bounds.max.y - bounds.min.y;
        
        // Foot shape (oval/rounded rectangle)
        this.ctx.beginPath();
        this.roundedRect(-width/2, -height/2, width, height, height * 0.4);
        this.ctx.fill();
        
        if (this.config.bodyOutlines) {
            this.ctx.stroke();
        }
    }
    
    renderGenericBody(body) {
        const bounds = body.bounds;
        const width = bounds.max.x - bounds.min.x;
        const height = bounds.max.y - bounds.min.y;
        
        // Use body render properties if available
        const color = body.render?.fillStyle || '#8ecae6';
        const borderColor = body.render?.strokeStyle || '#219ebc';
        
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = borderColor;
        this.ctx.lineWidth = 2;
        
        // Render based on shape (circle or rectangle)
        if (body.circleRadius) {
            // Circle
            this.ctx.beginPath();
            this.ctx.arc(0, 0, body.circleRadius, 0, Math.PI * 2);
            this.ctx.fill();
            
            if (this.config.bodyOutlines) {
                this.ctx.stroke();
            }
        } else {
            // Rectangle
            this.ctx.beginPath();
            this.roundedRect(-width/2, -height/2, width, height, 4);
            this.ctx.fill();
            
            if (this.config.bodyOutlines) {
                this.ctx.stroke();
            }
        }
    }
    
    renderBodyShadow(body) {
        this.ctx.save();
        
        // Simple drop shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.translate(3, 3); // Shadow offset
        
        const bounds = body.bounds;
        const width = bounds.max.x - bounds.min.x;
        const height = bounds.max.y - bounds.min.y;
        
        if (body.circleRadius) {
            this.ctx.beginPath();
            this.ctx.arc(0, 0, body.circleRadius, 0, Math.PI * 2);
            this.ctx.fill();
        } else {
            this.ctx.beginPath();
            this.roundedRect(-width/2, -height/2, width, height, 4);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
    
    renderConstraint(constraint) {
        if (!constraint.render?.visible) return;
        
        const bodyA = constraint.bodyA;
        const bodyB = constraint.bodyB;
        
        if (!bodyB) return; // Skip mouse constraints
        
        this.ctx.save();
        
        this.ctx.strokeStyle = constraint.render.strokeStyle || '#666666';
        this.ctx.lineWidth = constraint.render.lineWidth || 2;
        
        if (constraint.render.lineDash) {
            this.ctx.setLineDash(constraint.render.lineDash);
        }
        
        // Calculate world positions of attachment points
        const pointA = bodyA ? 
            this.mathUtils.vectorAdd(bodyA.position, constraint.pointA) : 
            constraint.pointA;
        const pointB = this.mathUtils.vectorAdd(bodyB.position, constraint.pointB);
        
        // Draw constraint line
        this.ctx.beginPath();
        this.ctx.moveTo(pointA.x, pointA.y);
        this.ctx.lineTo(pointB.x, pointB.y);
        this.ctx.stroke();
        
        // Draw attachment points
        if (constraint.render.anchors !== false) {
            this.ctx.fillStyle = this.ctx.strokeStyle;
            
            this.ctx.beginPath();
            this.ctx.arc(pointA.x, pointA.y, 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.beginPath();
            this.ctx.arc(pointB.x, pointB.y, 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
    
    renderBodyBounds(body) {
        this.ctx.save();
        this.ctx.strokeStyle = '#FF0000';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([2, 2]);
        
        const bounds = body.bounds;
        const width = bounds.max.x - bounds.min.x;
        const height = bounds.max.y - bounds.min.y;
        
        this.ctx.strokeRect(-width/2, -height/2, width, height);
        
        this.ctx.restore();
    }
    
    renderVelocityVector(body) {
        const velocity = body.velocity;
        const speed = this.mathUtils.vectorMagnitude(velocity);
        
        if (speed < 0.5) return; // Don't show very slow velocities
        
        this.ctx.save();
        this.ctx.strokeStyle = '#00FF00';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([]);
        
        const scale = 5; // Scale factor for visibility
        const endX = velocity.x * scale;
        const endY = velocity.y * scale;
        
        // Velocity line
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
        
        // Arrow head
        const angle = Math.atan2(endY, endX);
        const headLength = 8;
        const headAngle = Math.PI / 6;
        
        this.ctx.beginPath();
        this.ctx.moveTo(endX, endY);
        this.ctx.lineTo(
            endX - headLength * Math.cos(angle - headAngle),
            endY - headLength * Math.sin(angle - headAngle)
        );
        this.ctx.moveTo(endX, endY);
        this.ctx.lineTo(
            endX - headLength * Math.cos(angle + headAngle),
            endY - headLength * Math.sin(angle + headAngle)
        );
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    // ==========================================
    // DEBUG OVERLAY
    // ==========================================
    
    renderDebugOverlay() {
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
        
        // Debug background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 200, 120);
        
        // Debug text
        this.ctx.fillStyle = '#00FF00';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'left';
        
        const debugInfo = [
            `FPS: ${this.fps.toFixed(1)}`,
            `Frame: ${this.frameCount}`,
            `Bodies: ${this.physics?.bodies?.size || 0}`,
            `Particles: ${this.particles?.particleCount || 0}`,
            `Zoom: ${(this.config.zoom * 100).toFixed(0)}%`,
            `DPR: ${this.config.pixelRatio}x`,
            `Quality: ${this.deviceUtils.performance.level}`,
        ];
        
        debugInfo.forEach((line, index) => {
            this.ctx.fillText(line, 15, 30 + index * 15);
        });
        
        this.ctx.restore();
    }
    
    // ==========================================
    // UTILITY METHODS
    // ==========================================
    
    roundedRect(x, y, width, height, radius) {
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
    }
    
    darkenColor(color, percent) {
        // Simple color darkening
        if (color.startsWith('#')) {
            const num = parseInt(color.replace('#', ''), 16);
            const amt = Math.round(2.55 * percent);
            const R = (num >> 16) - amt;
            const G = (num >> 8 & 0x00FF) - amt;
            const B = (num & 0x0000FF) - amt;
            
            return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
                (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
                (B < 255 ? B < 1 ? 0 : B : 255))
                .toString(16).slice(1);
        }
        return color;
    }
    
    // ==========================================
    // CAMERA CONTROLS
    // ==========================================
    
    setZoom(zoom) {
        this.config.zoom = Math.max(0.1, Math.min(3.0, zoom));
        this.setupCoordinateSystem();
    }
    
    setPan(x, y) {
        this.config.panOffset.x = x;
        this.config.panOffset.y = y;
        this.setupCoordinateSystem();
    }
    
    addScreenShake(intensity, directionX = 1, directionY = 1) {
        this.config.screenShake.intensity = Math.max(
            this.config.screenShake.intensity,
            intensity
        );
        this.config.screenShake.x = directionX;
        this.config.screenShake.y = directionY;
    }
    
    // ==========================================
    // SETTINGS & CONFIGURATION
    // ==========================================
    
    toggleDebugInfo() {
        this.config.showDebugInfo = !this.config.showDebugInfo;
    }
    
    toggleConstraints() {
        this.config.showConstraints = !this.config.showConstraints;
    }
    
    setRagdollStyle(style) {
        this.config.ragdollStyle = style;
    }
    
    adjustQuality(level) {
        switch (level) {
            case 'low':
                this.config.antialiasing = false;
                this.config.shadows = false;
                this.config.gradients = false;
                this.config.motionBlur = false;
                break;
                
case 'medium':
                this.config.antialiasing = true;
                this.config.shadows = false;
                this.config.gradients = true;
                this.config.motionBlur = false;
                break;
                
            case 'high':
                this.config.antialiasing = true;
                this.config.shadows = true;
                this.config.gradients = true;
                this.config.motionBlur = true;
                break;
        }
        
        // Update canvas settings
        this.ctx.imageSmoothingEnabled = this.config.antialiasing;
        
        console.log(`🎨 Renderer quality set to ${level}`);
    }
    
    // ==========================================
    // RESIZE HANDLING
    // ==========================================
    
    resize(width, height) {
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
        
        const dpr = this.config.pixelRatio;
        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        
        this.ctx.scale(dpr, dpr);
        this.ctx.imageSmoothingEnabled = this.config.antialiasing;
        
        // Update config
        this.config.floorY = height - 50;
        
        this.setupCoordinateSystem();
        
        console.log(`📐 Renderer resized to ${width}x${height}`);
    }
    
    // ==========================================
    // STATISTICS & DEBUG
    // ==========================================
    
    getStats() {
        return {
            fps: this.fps,
            frameCount: this.frameCount,
            deltaTime: this.deltaTime,
            
            canvas: {
                width: this.canvas.width,
                height: this.canvas.height,
                pixelRatio: this.config.pixelRatio
            },
            
            quality: {
                level: this.deviceUtils.performance.level,
                antialiasing: this.config.antialiasing,
                shadows: this.config.shadows,
                gradients: this.config.gradients,
                motionBlur: this.config.motionBlur
            },
            
            camera: {
                zoom: this.config.zoom,
                pan: this.config.panOffset,
                shake: this.config.screenShake
            }
        };
    }
    
    getDebugInfo() {
        const stats = this.getStats();
        
        return {
            ...stats,
            
            performance: {
                avgFrameTime: this.deltaTime,
                adaptiveFPS: this.config.adaptiveFPS,
                targetFPS: this.config.targetFPS
            },
            
            rendering: {
                bodiesRendered: this.physics?.bodies?.size || 0,
                constraintsRendered: this.physics?.constraints?.size || 0,
                particlesRendered: this.particles?.particleCount || 0,
                debugMode: this.config.showDebugInfo
            }
        };
    }
    
    // ==========================================
    // CLEANUP
    // ==========================================
    
    destroy() {
        console.log('🗑️ Destroying Renderer...');
        
        this.canvas = null;
        this.ctx = null;
        this.physics = null;
        this.particles = null;
        
        console.log('✅ Renderer destroyed');
    }
    
}

// Make available globally clearCanvas
window.Renderer = Renderer;



console.log('🎨 Renderer loaded - Advanced canvas rendering with ragdoll support ready');