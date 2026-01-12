// ==========================================
// MATTER.JS PHYSICS INTEGRATION
// ==========================================

class PhysicsEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.canvasWidth = canvas.width;
        this.canvasHeight = canvas.height;
        
        // Create Matter.js engine with mobile-optimized settings
        this.engine = Matter.Engine.create();
        this.world = this.engine.world;
        
        // Mobile performance optimizations
        this.engine.world.gravity.y = 0.8; // Slightly stronger gravity for mobile
        this.engine.positionIterations = 6; // Reduced from default 8
        this.engine.velocityIterations = 4; // Reduced from default 8
        this.engine.constraintIterations = 2; // Reduced from default 2
        
        // Create boundaries
        this.createBoundaries();
        
        // Track bodies for cleanup checkBoundaries
        this.bodies = [];
        this.bodiesToRemove = [];
        
        console.log('Physics engine initialized with Matter.js');
    }
    
createBoundaries() {
    const thickness = 50;
    
    // Ground
    this.ground = Matter.Bodies.rectangle(
        this.canvasWidth / 2, 
        this.canvasHeight - thickness / 2, 
        this.canvasWidth, 
        thickness, 
        { 
            isStatic: true,
            label: 'ground',
            render: { fillStyle: '#8B4513' }
        }
    );
    
    // Remove or move side walls further out - they should only prevent infinite falling
    this.leftWall = Matter.Bodies.rectangle(
        -thickness * 2, // Move further left
        this.canvasHeight / 2, 
        thickness, 
        this.canvasHeight, 
        { 
            isStatic: true,
            label: 'leftWall',
            render: { visible: false }
        }
    );
    
    this.rightWall = Matter.Bodies.rectangle(
        this.canvasWidth + thickness * 2, // Move further right
        this.canvasHeight / 2, 
        thickness, 
        this.canvasHeight, 
        { 
            isStatic: true,
            label: 'rightWall',
            render: { visible: false }
        }
    );
    
    // Add boundaries to world
    Matter.World.add(this.world, [this.ground, this.leftWall, this.rightWall]);
}
    
    createShape(shapeType, x, y, options = {}) {
        let body;
        const defaultOptions = {
            frictionAir: 0.01,
            friction: 0.7,
            frictionStatic: 0.5,
            restitution: 0.3,
            density: 0.001,
            label: shapeType,
            ...options
        };
        
        switch (shapeType) {
            case 'square':
                body = Matter.Bodies.rectangle(x, y, 50, 50, defaultOptions);
                break;
                
            case 'rectangle':
                body = Matter.Bodies.rectangle(x, y, 80, 40, defaultOptions);
                break;
                
            case 'triangle':
                // Create triangle using vertices
                const triangleVertices = [
                    { x: 0, y: -25 },
                    { x: -25, y: 25 },
                    { x: 25, y: 25 }
                ];
                body = Matter.Bodies.fromVertices(x, y, triangleVertices, defaultOptions);
                break;
                
            case 'circle':
                body = Matter.Bodies.circle(x, y, 25, defaultOptions);
                break;
                
            case 'star':
                // Create star using vertices
                const starVertices = this.createStarVertices(25);
                body = Matter.Bodies.fromVertices(x, y, starVertices, defaultOptions);
                break;
                
            default:
                console.warn('Unknown shape type:', shapeType);
                return null;
        }
        
        if (body) {
            // Add custom properties
            body.shapeType = shapeType;
            body.createdAt = Date.now();
            body.isUserShape = true;
            body.color = this.getShapeColor(shapeType);
            
            // Add to world and tracking
            Matter.World.add(this.world, body);
            this.bodies.push(body);
            
            console.log(`Created ${shapeType} at (${x}, ${y})`);
        }
        
        return body;
    }
    
    createStarVertices(radius) {
        const spikes = 5;
        const outerRadius = radius;
        const innerRadius = radius * 0.4;
        const vertices = [];
        
        for (let i = 0; i < spikes * 2; i++) {
            const angle = (i * Math.PI) / spikes - Math.PI / 2;
            const r = i % 2 === 0 ? outerRadius : innerRadius;
            vertices.push({
                x: Math.cos(angle) * r,
                y: Math.sin(angle) * r
            });
        }
        
        return vertices;
    }
    
    getShapeColor(shapeType) {
        const colors = {
            square: '#FF6B6B',
            rectangle: '#4ECDC4',
            triangle: '#A8E6CF',
            circle: '#FFD93D',
            star: '#B983FF'
        };
        return colors[shapeType] || '#999999';
    }
    
    update() {
        // Update physics
        Matter.Engine.update(this.engine, 16.67); // ~60fps
        
        // Check for out-of-bounds bodies
        this.checkBoundaries();
        
        // Remove marked bodies
        this.removeMarkedBodies();
        
        // Enforce shape limit
        this.enforceShapeLimit();
    }
    
checkBoundaries() {
    const dangerZone = 100; // Increased from 50 to give more room
    
    for (let body of this.bodies) {
        if (!body.isUserShape) continue;
        
        const pos = body.position;
        const shouldRemove = 
            pos.x < -dangerZone || 
            pos.x > this.canvasWidth + dangerZone ||
            pos.y > this.canvasHeight + dangerZone; // Only remove if way off bottom
        
        if (shouldRemove) {
            this.markForRemoval(body, 'boundary');
        }
    }
}
    
    markForRemoval(body, reason = 'unknown') {
        if (this.bodiesToRemove.includes(body)) return;
        
        body.removalReason = reason;
        this.bodiesToRemove.push(body);
        
        // Trigger particle explosion
        if (window.gameInstance && window.gameInstance.particles) {
            window.gameInstance.particles.createExplosion(
                body.position.x,
                body.position.y,
                body.color,
                15
            );
        }
        
        console.log(`Marked ${body.shapeType} for removal: ${reason}`);
    }
    
    removeMarkedBodies() {
        for (let body of this.bodiesToRemove) {
            Matter.World.remove(this.world, body);
            
            const index = this.bodies.indexOf(body);
            if (index > -1) {
                this.bodies.splice(index, 1);
            }
        }
        
        this.bodiesToRemove = [];
    }
    
    enforceShapeLimit(maxShapes = 30) {
        if (this.bodies.length <= maxShapes) return;
        
        // Sort by creation time (oldest first)
        const userBodies = this.bodies
            .filter(body => body.isUserShape)
            .sort((a, b) => a.createdAt - b.createdAt);
        
        // Remove oldest bodies
        const toRemove = userBodies.slice(0, userBodies.length - maxShapes);
        for (let body of toRemove) {
            this.markForRemoval(body, 'limit');
        }
    }
    
    getBodyAt(x, y) {
        // Convert screen coordinates to physics coordinates
        const bodies = Matter.Query.point(this.bodies, { x, y });
        
        // Return the topmost user-created body
        for (let body of bodies.reverse()) {
            if (body.isUserShape) {
                return body;
            }
        }
        
        return null;
    }
    
    applyForce(body, force) {
        if (!body) return;
        
        Matter.Body.applyForce(body, body.position, force);
    }
    
    setPosition(body, x, y) {
        if (!body) return;
        
        Matter.Body.setPosition(body, { x, y });
    }
    
    setStatic(body, isStatic) {
        if (!body) return;
        
        Matter.Body.setStatic(body, isStatic);
    }
    
    clear() {
        // Remove all user-created bodies
        const userBodies = this.bodies.filter(body => body.isUserShape);
        for (let body of userBodies) {
            this.markForRemoval(body, 'clear');
        }
        
        this.removeMarkedBodies();
        console.log('Physics world cleared');
    }
    
    resize(width, height) {
        this.canvasWidth = width;
        this.canvasHeight = height;
        
        // Update boundaries
        Matter.World.remove(this.world, [this.ground, this.leftWall, this.rightWall]);
        this.createBoundaries();
        
        console.log(`Physics world resized to ${width}x${height}`);
    }
    
    // Collision detection utilities createBoundaries
    onCollisionStart(callback) {
        Matter.Events.on(this.engine, 'collisionStart', callback);
    }
    
    onCollisionEnd(callback) {
        Matter.Events.on(this.engine, 'collisionEnd', callback);
    }
}

window.PhysicsEngine = PhysicsEngine;