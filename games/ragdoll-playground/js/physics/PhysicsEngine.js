// ==========================================
// PHYSICS ENGINE - MATTER.JS WRAPPER
// Advanced physics system optimized for ragdoll playground
// ==========================================

class PhysicsEngine {
    
    constructor(canvasElement, options = {}) {
        this.canvas = canvasElement;
        this.deviceUtils = window.DeviceUtils;
        this.mathUtils = window.MathUtils;
        
        // Get device-optimized settings
        const deviceSettings = this.deviceUtils.getPhysicsSettings();
        
        // Configuration with smart defaults
        this.config = {
            // Engine settings
            gravity: options.gravity || deviceSettings.worldOptions.gravity,
            enableSleeping: options.enableSleeping ?? deviceSettings.engineOptions.enableSleeping,
            
            // Solver iterations (affects accuracy vs performance)
            positionIterations: options.positionIterations || deviceSettings.engineOptions.positionIterations,
            velocityIterations: options.velocityIterations || deviceSettings.engineOptions.velocityIterations,
            constraintIterations: options.constraintIterations || deviceSettings.engineOptions.constraintIterations,
            
            // World bounds
            worldBounds: options.worldBounds || {
                min: { x: -200, y: -200 },
                max: { x: this.canvas.width + 200, y: this.canvas.height + 200 }
            },
            
            // Performance settings
            maxBodies: options.maxBodies || this.deviceUtils.performance.maxBodies,
            bodyCleanupThreshold: options.bodyCleanupThreshold || 100,
            
            // Physics constants for ragdolls
            jointStiffness: options.jointStiffness || 0.7,
            jointDamping: options.jointDamping || 0.1,
            bodyFriction: options.bodyFriction || 0.3,
            bodyRestitution: options.bodyRestitution || 0.4,
            
            // Kid-friendly physics
            maxVelocity: options.maxVelocity || 50,
            forceMultiplier: options.forceMultiplier || 0.8,
            gentleMode: options.gentleMode ?? true,
            
            ...options
        };
        
        // State management
        this.isInitialized = false;
        this.isRunning = false;
        this.engine = null;
        this.world = null;
        this.bodies = new Map(); // Track all bodies with metadata
        this.constraints = new Map(); // Track all constraints
        this.walls = []; // Boundary walls
        
        // Performance monitoring
        this.performanceMonitor = this.deviceUtils.createPerformanceMonitor();
        this.lastOptimizationTime = 0;
        this.optimizationInterval = 2000; // Check every 2 seconds
        
        // Event system
        this.eventListeners = new Map();
        
        this.init();
    }
    
    // ==========================================
    // INITIALIZATION
    // ==========================================
    
    async init() {
        console.log('⚡ Initializing Physics Engine...');
        
        try {
            // Wait for Matter.js to be available
            if (typeof Matter === 'undefined') {
                console.warn('⏳ Waiting for Matter.js to load...');
                await this.waitForMatter();
            }
            
            this.createEngine();
            this.createWorld();
            this.createBounds();
            this.setupCollisionDetection();
            this.setupPerformanceOptimization();
            
            this.isInitialized = true;
            console.log('✅ Physics Engine initialized successfully');
            console.log(`🎯 Performance level: ${this.deviceUtils.performance.level}`);
            console.log(`⚙️ Max bodies: ${this.config.maxBodies}`);
            
            return true;
        } catch (error) {
            console.error('❌ Physics Engine initialization failed:', error);
            return false;
        }
    }
    
    async waitForMatter(timeout = 5000) {
        const start = Date.now();
        
        while (typeof Matter === 'undefined') {
            if (Date.now() - start > timeout) {
                throw new Error('Matter.js failed to load within timeout');
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    
    createEngine() {
        // Create Matter.js engine with optimized settings
        this.engine = Matter.Engine.create({
            enableSleeping: this.config.enableSleeping,
            positionIterations: this.config.positionIterations,
            velocityIterations: this.config.velocityIterations,
            constraintIterations: this.config.constraintIterations,
            
            // Timing settings
            timing: {
                timeScale: 1.0,
                timestamp: 0
            }
        });
        
        // Set gravity
        this.engine.world.gravity.x = this.config.gravity.x;
        this.engine.world.gravity.y = this.config.gravity.y;
        
        // Store world reference
        this.world = this.engine.world;
        
        console.log('🏗️ Matter.js engine created');
    }
    
    createWorld() {
        // Configure world settings
        this.world.bounds = this.config.worldBounds;
        
        // Set up world events
        Matter.Events.on(this.engine, 'beforeUpdate', () => {
            this.beforeUpdate();
        });
        
        Matter.Events.on(this.engine, 'afterUpdate', () => {
            this.afterUpdate();
        });
        
        console.log('🌍 Physics world configured');
    }
    
    createBounds() {
        // Create invisible walls around the canvas
        const thickness = 50;
        const { width, height } = this.canvas;
        
        const wallOptions = {
            isStatic: true,
            render: { visible: false },
            label: 'wall',
            friction: 0.3,
            restitution: 0.6
        };
        
        // Create walls: top, bottom, left, right
        this.walls = [
            // Top wall (above screen to catch flying objects)
            Matter.Bodies.rectangle(width / 2, -thickness / 2, width + thickness * 2, thickness, wallOptions),
            
            // Bottom wall
            Matter.Bodies.rectangle(width / 2, height + thickness / 2, width + thickness * 2, thickness, wallOptions),
            
            // Left wall
            Matter.Bodies.rectangle(-thickness / 2, height / 2, thickness, height + thickness * 2, wallOptions),
            
            // Right wall
            Matter.Bodies.rectangle(width + thickness / 2, height / 2, thickness, height + thickness * 2, wallOptions)
        ];
        
        // Add walls to world
        Matter.World.add(this.world, this.walls);
        
        console.log('🧱 World boundaries created');
    }
    
    setupCollisionDetection() {
        // Listen for collision events
        Matter.Events.on(this.engine, 'collisionStart', (event) => {
            this.handleCollisionStart(event);
        });
        
        Matter.Events.on(this.engine, 'collisionActive', (event) => {
            this.handleCollisionActive(event);
        });
        
        Matter.Events.on(this.engine, 'collisionEnd', (event) => {
            this.handleCollisionEnd(event);
        });
        
        console.log('💥 Collision detection setup complete');
    }
    
    setupPerformanceOptimization() {
        // Automatic body cleanup
        setInterval(() => {
            this.cleanupOutOfBoundsBodies();
            this.optimizePerformance();
        }, this.optimizationInterval);
        
        // Adaptive quality adjustment
        if (this.performanceMonitor) {
            setInterval(() => {
                this.adjustQualityForPerformance();
            }, 1000);
        }
        
        console.log('🚀 Performance optimization active');
    }
    
    // ==========================================
    // BODY CREATION & MANAGEMENT
    // ==========================================
    
    /**
     * Create a physics body with enhanced properties
     */
    createBody(type, x, y, options = {}) {
        let body;
        
        // Enhanced default options
        const defaultOptions = {
            friction: this.config.bodyFriction,
            restitution: this.config.bodyRestitution,
            density: 0.001,
            frictionAir: 0.01,
            
            // Ragdoll-specific properties
            label: options.label || 'body',
            render: {
                fillStyle: options.color || '#8ecae6',
                strokeStyle: options.borderColor || '#219ebc',
                lineWidth: 2,
                ...options.render
            },
            
            // Custom properties for our game
            gameData: {
                type: type,
                createdAt: Date.now(),
                isRagdollPart: options.isRagdollPart || false,
                ragdollId: options.ragdollId || null,
                partName: options.partName || null,
                canBeGrabbed: options.canBeGrabbed !== false,
                maxVelocity: options.maxVelocity || this.config.maxVelocity,
                ...options.gameData
            },
            
            ...options
        };
        
        // Create body based on type
        switch (type) {
            case 'rectangle':
                body = Matter.Bodies.rectangle(x, y, options.width || 50, options.height || 30, defaultOptions);
                break;
                
            case 'circle':
                body = Matter.Bodies.circle(x, y, options.radius || 25, defaultOptions);
                break;
                
            case 'polygon':
                body = Matter.Bodies.polygon(x, y, options.sides || 6, options.radius || 25, defaultOptions);
                break;
                
            default:
                console.warn(`Unknown body type: ${type}`);
                body = Matter.Bodies.rectangle(x, y, 50, 30, defaultOptions);
        }
        
        // Store body with metadata
        this.bodies.set(body.id, {
            body: body,
            type: type,
            createdAt: Date.now(),
            lastUpdate: Date.now(),
            isActive: true,
            metadata: defaultOptions.gameData
        });
        
        // Add to world
        Matter.World.add(this.world, body);
        
        // Emit creation event
        this.emit('bodyCreated', { body, type, options });
        
        return body;
    }
    
    /**
     * Create a constraint (joint) with enhanced properties
     */
    createConstraint(bodyA, bodyB, options = {}) {
        const defaultOptions = {
            stiffness: options.stiffness || this.config.jointStiffness,
            damping: options.damping || this.config.jointDamping,
            
            // Visual properties
            render: {
                visible: options.showConstraints || false,
                type: 'line',
                anchors: false,
                lineWidth: 2,
                strokeStyle: '#666',
                ...options.render
            },
            
            // Joint limits for realistic movement
            length: options.length || this.mathUtils.distance(bodyA.position, bodyB.position),
            
            // Custom properties
            gameData: {
                type: options.type || 'joint',
                canBreak: options.canBreak || false,
                breakForce: options.breakForce || Infinity,
                isRagdollJoint: options.isRagdollJoint || false,
                ragdollId: options.ragdollId || null,
                jointName: options.jointName || null,
                ...options.gameData
            },
            
            ...options
        };
        
        // Create constraint
        const constraint = Matter.Constraint.create({
            bodyA: bodyA,
            bodyB: bodyB,
            pointA: options.pointA || { x: 0, y: 0 },
            pointB: options.pointB || { x: 0, y: 0 },
            ...defaultOptions
        });
        
        // Store constraint with metadata
        this.constraints.set(constraint.id, {
            constraint: constraint,
            createdAt: Date.now(),
            isActive: true,
            metadata: defaultOptions.gameData
        });
        
        // Add to world
        Matter.World.add(this.world, constraint);
        
        // Emit creation event
        this.emit('constraintCreated', { constraint, bodyA, bodyB, options });
        
        return constraint;
    }
    
    // ==========================================
    // FORCE & INTERACTION METHODS
    // ==========================================
    
    /**
     * Apply force to a body with kid-friendly limits
     */
    applyForce(body, force, point = null) {
        if (!body || !force) return;
        
        // Apply force multiplier and limits
        const limitedForce = {
            x: this.mathUtils.clamp(force.x * this.config.forceMultiplier, -5, 5),
            y: this.mathUtils.clamp(force.y * this.config.forceMultiplier, -5, 5)
        };
        
        // Apply at body center if no point specified
        const applicationPoint = point || body.position;
        
        Matter.Body.applyForce(body, applicationPoint, limitedForce);
        
        // Update last interaction time
        const bodyData = this.bodies.get(body.id);
        if (bodyData) {
            bodyData.lastUpdate = Date.now();
        }
        
        // Emit force application event
        this.emit('forceApplied', { body, force: limitedForce, point: applicationPoint });
    }
    
    /**
     * Apply impulse (instant velocity change)
     */
    applyImpulse(body, impulse, point = null) {
        if (!body || !impulse) return;
        
        // Convert impulse to force (F = ma, impulse = m * Δv)
        const force = {
            x: impulse.x * body.mass,
            y: impulse.y * body.mass
        };
        
        this.applyForce(body, force, point);
        
        this.emit('impulseApplied', { body, impulse, point });
    }
    
    /**
     * Set velocity with limits
     */
    setVelocity(body, velocity) {
        if (!body || !velocity) return;
        
        const maxVel = body.gameData?.maxVelocity || this.config.maxVelocity;
        
        const limitedVelocity = {
            x: this.mathUtils.clamp(velocity.x, -maxVel, maxVel),
            y: this.mathUtils.clamp(velocity.y, -maxVel, maxVel)
        };
        
        Matter.Body.setVelocity(body, limitedVelocity);
        
        this.emit('velocitySet', { body, velocity: limitedVelocity });
    }
    
    /**
     * Throw a body in a direction with realistic physics
     */
    throwBody(body, direction, strength = 1.0) {
        if (!body || !direction) return;
        
        // Normalize direction and apply strength
        const normalizedDir = this.mathUtils.vectorNormalize(direction);
        const throwForce = this.mathUtils.vectorMultiply(normalizedDir, strength * 3);
        
        // Add some randomness for more natural movement
        throwForce.x += this.mathUtils.randomFloat(-0.5, 0.5);
        throwForce.y += this.mathUtils.randomFloat(-0.3, 0.1);
        
        this.applyForce(body, throwForce);
        
        // Wake up the body if it was sleeping
        Matter.Sleeping.set(body, false);
        
        this.emit('bodyThrown', { body, direction: normalizedDir, strength });
    }
    
    // ==========================================
    // COLLISION HANDLING
    // ==========================================
    
    handleCollisionStart(event) {
        const pairs = event.pairs;
        
        for (const pair of pairs) {
            const { bodyA, bodyB } = pair;
            
            // Calculate impact force
            const relativeVelocity = this.mathUtils.vectorSubtract(bodyB.velocity, bodyA.velocity);
            const impactSpeed = this.mathUtils.vectorMagnitude(relativeVelocity);
            
            // Emit collision events based on impact
            if (impactSpeed > 10) {
                this.emit('strongCollision', { bodyA, bodyB, impactSpeed, pair });
                
                // Play sound effect for strong collisions
                this.handleCollisionAudio(bodyA, bodyB, impactSpeed);
            } else if (impactSpeed > 3) {
                this.emit('mediumCollision', { bodyA, bodyB, impactSpeed, pair });
            }
            
            // Check for ragdoll part collisions
            if (bodyA.gameData?.isRagdollPart || bodyB.gameData?.isRagdollPart) {
                this.emit('ragdollCollision', { bodyA, bodyB, impactSpeed, pair });
            }
        }
    }
    
    handleCollisionActive(event) {
        // Handle ongoing collisions if needed
        const pairs = event.pairs;
        
        for (const pair of pairs) {
            // Update friction based on ongoing contact
            this.updateContactFriction(pair);
        }
    }
    
    handleCollisionEnd(event) {
        // Handle collision end events
        const pairs = event.pairs;
        
        for (const pair of pairs) {
            this.emit('collisionEnd', { pair });
        }
    }
    
    handleCollisionAudio(bodyA, bodyB, impactSpeed) {
        // Audio feedback based on body types and impact
        if (window.audioSystem?.isInitialized) {
            if (impactSpeed > 20) {
                window.audioSystem.playSoundEffect('pop');
            } else if (impactSpeed > 10) {
                window.audioSystem.playSoundEffect('success');
            }
        }
    }
    
    updateContactFriction(pair) {
        // Adjust friction based on materials and contact time
        const { bodyA, bodyB } = pair;
        
        // Example: Increase friction for ragdoll parts touching ground
        if (bodyA.label === 'wall' || bodyB.label === 'wall') {
            // Slightly increase friction when touching walls/ground
            pair.friction = Math.min(pair.friction + 0.01, 1.0);
        }
    }
    
    // ==========================================
    // UPDATE & SIMULATION
    // ==========================================
    
    /**
     * Update physics simulation
     */
    update(deltaTime = 16.67) { // Default to ~60fps
        if (!this.isInitialized || !this.isRunning) return;
        
        // Update performance monitor
        if (this.performanceMonitor) {
            this.performanceMonitor.update();
        }
        
        // Convert deltaTime from milliseconds to seconds for Matter.js
        const delta = Math.min(deltaTime, 33.33); // Cap at 30fps minimum
        
        // Update physics engine
        Matter.Engine.update(this.engine, delta);
        
        // Limit velocities to prevent chaos
        this.limitVelocities();
        
        // Clean up if needed
        if (Date.now() - this.lastOptimizationTime > this.optimizationInterval) {
            this.optimizePerformance();
            this.lastOptimizationTime = Date.now();
        }
    }
    
    beforeUpdate() {
        // Called before each physics update
        // Perfect place for pre-simulation logic
        
        this.emit('beforePhysicsUpdate');
    }
    
    afterUpdate() {
        // Called after each physics update
        // Perfect place for post-simulation logic
        
        this.emit('afterPhysicsUpdate');
    }
    
    limitVelocities() {
        // Prevent bodies from moving too fast
        for (const [bodyId, bodyData] of this.bodies) {
            const body = bodyData.body;
            const maxVel = body.gameData?.maxVelocity || this.config.maxVelocity;
            
            const velocity = body.velocity;
            const speed = this.mathUtils.vectorMagnitude(velocity);
            
            if (speed > maxVel) {
                const normalizedVel = this.mathUtils.vectorNormalize(velocity);
                const limitedVel = this.mathUtils.vectorMultiply(normalizedVel, maxVel);
                Matter.Body.setVelocity(body, limitedVel);
            }
        }
    }
    
    // ==========================================
    // PERFORMANCE OPTIMIZATION
    // ==========================================
    
    optimizePerformance() {
        // Clean up old bodies
        this.cleanupOutOfBoundsBodies();
        
        // Sleep inactive bodies
        this.sleepInactiveBodies();
        
        // Adjust quality if needed
        if (this.performanceMonitor?.shouldReduceQuality()) {
            this.reduceQuality();
        } else if (this.performanceMonitor?.shouldIncreaseQuality()) {
            this.increaseQuality();
        }
    }
    
    cleanupOutOfBoundsBodies() {
        const bounds = this.world.bounds;
        const bodiesToRemove = [];
        
        for (const [bodyId, bodyData] of this.bodies) {
            const body = bodyData.body;
            const pos = body.position;
            
            // Check if body is way out of bounds
            if (pos.x < bounds.min.x - 100 || pos.x > bounds.max.x + 100 ||
                pos.y < bounds.min.y - 100 || pos.y > bounds.max.y + 500) {
                
                // Don't remove ragdoll parts - they might come back
                if (!body.gameData?.isRagdollPart) {
                    bodiesToRemove.push(body);
                }
            }
        }
        
        // Remove out-of-bounds bodies
        for (const body of bodiesToRemove) {
            this.removeBody(body);
        }
        
        if (bodiesToRemove.length > 0) {
            console.log(`🧹 Cleaned up ${bodiesToRemove.length} out-of-bounds bodies`);
        }
    }
    
    sleepInactiveBodies() {
        const sleepThreshold = 5000; // 5 seconds of inactivity
        const now = Date.now();
        
        for (const [bodyId, bodyData] of this.bodies) {
            const body = bodyData.body;
            
            // Don't sleep ragdoll parts or recently active bodies
            if (body.gameData?.isRagdollPart || (now - bodyData.lastUpdate) < sleepThreshold) {
                continue;
            }
            
            // Check if body is nearly motionless
            const speed = this.mathUtils.vectorMagnitude(body.velocity);
            const angularSpeed = Math.abs(body.angularVelocity);
            
            if (speed < 0.1 && angularSpeed < 0.01) {
                Matter.Sleeping.set(body, true);
            }
        }
    }
    
    reduceQuality() {
        // Reduce physics quality for better performance
        this.engine.positionIterations = Math.max(2, this.engine.positionIterations - 1);
        this.engine.velocityIterations = Math.max(1, this.engine.velocityIterations - 1);
        
        console.log('📉 Reduced physics quality for performance');
    }
    
increaseQuality() {
    // Increase physics quality when performance allows
    const maxPos = this.deviceUtils.performance.level === 'high' ? 6 : 4;
    const maxVel = this.deviceUtils.performance.level === 'high' ? 4 : 2;
    
    const currentPos = this.engine.positionIterations;
    const currentVel = this.engine.velocityIterations;
    
    // Only increase if we haven't reached the maximum
    if (currentPos < maxPos) {
        this.engine.positionIterations = Math.min(maxPos, currentPos + 1);
    }
    if (currentVel < maxVel) {
        this.engine.velocityIterations = Math.min(maxVel, currentVel + 1);
    }
    
    // Only log if we actually increased something
    if (currentPos < maxPos || currentVel < maxVel) {
        console.log('📈 Increased physics quality');
    }
}
    
adjustQualityForPerformance() {
    if (!this.performanceMonitor) return;
    
    // Throttle quality adjustments
    const now = Date.now();
    if (now - (this.lastQualityAdjustment || 0) < 5000) return; // Only adjust every 5 seconds
    
    const fps = this.performanceMonitor.averageFPS;
    
    if (fps < 25) {
        this.reduceQuality();
        this.lastQualityAdjustment = now;
    } else if (fps > 55) {
        this.increaseQuality();
        this.lastQualityAdjustment = now;
    }
}
    
    // ==========================================
    // BODY MANAGEMENT adjustQualityForPerformance
    // ==========================================
    
    /**
     * Remove a body from the world
     */
    removeBody(body) {
        if (!body) return false;
        
        try {
            // Remove from world
            Matter.World.remove(this.world, body);
            
            // Clean up from our tracking
            this.bodies.delete(body.id);
            
            // Emit removal event
            this.emit('bodyRemoved', { body });
            
            return true;
        } catch (error) {
            console.warn('Failed to remove body:', error);
            return false;
        }
    }
    
    /**
     * Remove a constraint from the world
     */
    removeConstraint(constraint) {
        if (!constraint) return false;
        
        try {
            // Remove from world
            Matter.World.remove(this.world, constraint);
            
            // Clean up from our tracking
            this.constraints.delete(constraint.id);
            
            // Emit removal event
            this.emit('constraintRemoved', { constraint });
            
            return true;
        } catch (error) {
            console.warn('Failed to remove constraint:', error);
            return false;
        }
    }
    
    /**
     * Get body by ID
     */
    getBody(bodyId) {
        const bodyData = this.bodies.get(bodyId);
        return bodyData ? bodyData.body : null;
    }
    
    /**
     * Get all bodies of a specific type
     */
    getBodiesByType(type) {
        const bodies = [];
        
        for (const [bodyId, bodyData] of this.bodies) {
            if (bodyData.type === type) {
                bodies.push(bodyData.body);
            }
        }
        
        return bodies;
    }
    
    /**
     * Get bodies within a radius of a point
     */
    getBodiesInRadius(point, radius) {
        const bodies = [];
        const radiusSquared = radius * radius;
        
        for (const [bodyId, bodyData] of this.bodies) {
            const body = bodyData.body;
            const distanceSquared = this.mathUtils.distanceSquared(point, body.position);
            
            if (distanceSquared <= radiusSquared) {
                bodies.push(body);
            }
        }
        
        return bodies;
    }
    
    /**
     * Get body at point (for mouse/touch interaction)
     */
    getBodyAtPoint(point, radius = 30) {
        const bodies = this.getBodiesInRadius(point, radius);
        
        // Sort by distance and return closest
        if (bodies.length > 0) {
            bodies.sort((a, b) => {
                const distA = this.mathUtils.distanceSquared(point, a.position);
                const distB = this.mathUtils.distanceSquared(point, b.position);
                return distA - distB;
            });
            
            return bodies[0];
        }
        
        return null;
    }
    
    // ==========================================
    // CONTROL METHODS
    // ==========================================
    
    /**
     * Start physics simulation
     */
    start() {
        if (!this.isInitialized) {
            console.warn('⚠️ Cannot start - Physics engine not initialized');
            return false;
        }
        
        this.isRunning = true;
        console.log('▶️ Physics simulation started');
        
        this.emit('simulationStarted');
        return true;
    }
    
    /**
     * Stop physics simulation
     */
    stop() {
        this.isRunning = false;
        console.log('⏸️ Physics simulation stopped');
        
        this.emit('simulationStopped');
    }
    
    /**
     * Reset the entire physics world
     */
    reset() {
        console.log('🔄 Resetting physics world...');
        
        // Clear all bodies (except walls)
        Matter.World.clear(this.world, false);
        this.bodies.clear();
        this.constraints.clear();
        
        // Recreate walls
        this.createBounds();
        
        // Reset performance monitor
        if (this.performanceMonitor) {
            this.performanceMonitor.currentFPS = 60;
            this.performanceMonitor.averageFPS = 60;
        }
        
        this.emit('worldReset');
        console.log('✅ Physics world reset complete');
    }
    
    /**
     * Update canvas size (handle window resize)
     */
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        
        // Update world bounds
        this.config.worldBounds = {
            min: { x: -200, y: -200 },
            max: { x: width + 200, y: height + 200 }
        };
        
        this.world.bounds = this.config.worldBounds;
        
        // Recreate boundary walls
        Matter.World.remove(this.world, this.walls);
        this.createBounds();
        
        this.emit('worldResized', { width, height });
        console.log(`📐 Physics world resized to ${width}x${height}`);
    }
    
    // ==========================================
    // EVENT SYSTEM
    // ==========================================
    
    /**
     * Add event listener
     */
    on(eventName, callback) {
        if (!this.eventListeners.has(eventName)) {
            this.eventListeners.set(eventName, []);
        }
        
        this.eventListeners.get(eventName).push(callback);
    }
    
    /**
     * Remove event listener
     */
    off(eventName, callback) {
        if (this.eventListeners.has(eventName)) {
            const listeners = this.eventListeners.get(eventName);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }
    
    /**
     * Emit event to all listeners
     */
    emit(eventName, data = {}) {
        if (this.eventListeners.has(eventName)) {
            const listeners = this.eventListeners.get(eventName);
            for (const callback of listeners) {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${eventName}:`, error);
                }
            }
        }
    }
    
    // ==========================================
    // DEBUG & UTILITY METHODS
    // ==========================================
    
    /**
     * Get performance statistics
     */
    getStats() {
        return {
            isRunning: this.isRunning,
            bodyCount: this.bodies.size,
            constraintCount: this.constraints.size,
            
            performance: this.performanceMonitor ? {
                currentFPS: this.performanceMonitor.currentFPS,
                averageFPS: this.performanceMonitor.averageFPS,
isLowPerformance: this.performanceMonitor.isLowPerformance
            } : null,
            
            engine: {
                positionIterations: this.engine.positionIterations,
                velocityIterations: this.engine.velocityIterations,
                constraintIterations: this.engine.constraintIterations,
                enableSleeping: this.engine.enableSleeping
            },
            
            world: {
                gravity: this.world.gravity,
                bounds: this.world.bounds
            },
            
            config: this.config
        };
    }
    
    /**
     * Get debug information as formatted string
     */
    getDebugInfo() {
        const stats = this.getStats();
        
        return {
            fps: stats.performance?.currentFPS || 0,
            bodies: stats.bodyCount,
            constraints: stats.constraintCount,
            performance: stats.performance?.isLowPerformance ? 'LOW' : 'GOOD',
            gravity: `${stats.world.gravity.x.toFixed(2)}, ${stats.world.gravity.y.toFixed(2)}`,
            iterations: `P:${stats.engine.positionIterations} V:${stats.engine.velocityIterations}`
        };
    }
    
    /**
     * Enable debug rendering
     */
    enableDebug() {
        // Show constraint connections
        for (const [constraintId, constraintData] of this.constraints) {
            const constraint = constraintData.constraint;
            constraint.render.visible = true;
        }
        
        console.log('🐛 Debug rendering enabled');
    }
    
    /**
     * Disable debug rendering
     */
    disableDebug() {
        // Hide constraint connections
        for (const [constraintId, constraintData] of this.constraints) {
            const constraint = constraintData.constraint;
            constraint.render.visible = false;
        }
        
        console.log('🐛 Debug rendering disabled');
    }
    
    /**
     * Log current world state
     */
    logWorldState() {
        console.group('🌍 Physics World State');
        console.log('Bodies:', this.bodies.size);
        console.log('Constraints:', this.constraints.size);
        console.log('Is Running:', this.isRunning);
        console.log('Performance:', this.performanceMonitor?.averageFPS || 'N/A', 'fps');
        console.log('Engine Iterations:', {
            position: this.engine.positionIterations,
            velocity: this.engine.velocityIterations,
            constraint: this.engine.constraintIterations
        });
        console.groupEnd();
    }
    
    // ==========================================
    // ADVANCED PHYSICS METHODS
    // ==========================================
    
    /**
     * Create explosion at point
     */
    explodeAtPoint(point, radius = 100, force = 0.1) {
        const bodiesInRange = this.getBodiesInRadius(point, radius);
        
        for (const body of bodiesInRange) {
            // Don't explode walls
            if (body.isStatic) continue;
            
            // Calculate direction from explosion center
            const direction = this.mathUtils.vectorSubtract(body.position, point);
            const distance = this.mathUtils.vectorMagnitude(direction);
            
            // Avoid division by zero
            if (distance === 0) continue;
            
            // Calculate force based on distance (closer = stronger)
            const normalizedDirection = this.mathUtils.vectorNormalize(direction);
            const falloff = Math.max(0, (radius - distance) / radius);
            const explosionForce = this.mathUtils.vectorMultiply(normalizedDirection, force * falloff);
            
            this.applyForce(body, explosionForce);
            
            // Wake up the body
            Matter.Sleeping.set(body, false);
        }
        
        this.emit('explosionCreated', { point, radius, force, affectedBodies: bodiesInRange });
        
        console.log(`💥 Explosion at (${point.x.toFixed(1)}, ${point.y.toFixed(1)}) affected ${bodiesInRange.length} bodies`);
    }
    
    /**
     * Create earthquake effect
     */
    createEarthquake(duration = 2000, intensity = 0.5) {
        const startTime = Date.now();
        let earthquakeActive = true;
        
        const shakeInterval = setInterval(() => {
            if (!earthquakeActive || Date.now() - startTime > duration) {
                clearInterval(shakeInterval);
                earthquakeActive = false;
                this.emit('earthquakeEnd');
                return;
            }
            
            // Apply random forces to all bodies
            for (const [bodyId, bodyData] of this.bodies) {
                const body = bodyData.body;
                
                if (body.isStatic) continue;
                
                const randomForce = {
                    x: this.mathUtils.randomFloat(-intensity, intensity),
                    y: this.mathUtils.randomFloat(-intensity * 0.3, intensity * 0.1) // Mostly horizontal
                };
                
                this.applyForce(body, randomForce);
                Matter.Sleeping.set(body, false);
            }
        }, 50); // Shake every 50ms
        
        this.emit('earthquakeStart', { duration, intensity });
        console.log(`🌍 Earthquake started - Duration: ${duration}ms, Intensity: ${intensity}`);
    }

/**
 * Update world bounds (called when canvas resizes)
 */
updateWorldBounds(bounds) {
    // Update canvas dimensions for createBounds method
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    
    // Update world bounds configuration
    this.config.worldBounds = {
        min: { x: -200, y: -200 },
        max: { x: bounds.width + 200, y: bounds.height + 200 }
    };
    
    this.world.bounds = this.config.worldBounds;
    
    // Recreate boundary walls with new dimensions
    if (this.walls && this.walls.length > 0) {
        Matter.World.remove(this.world, this.walls);
    }
    
    this.createBounds();
    
    this.emit('worldBoundsUpdated', { bounds });
    console.log(`🌍 World bounds updated to ${bounds.width}x${bounds.height}`);
}
    
/**
 * Clear all bodies and constraints (alias for reset)
 */
clear() {
    this.reset();
}

/**
 * Create world boundaries (alias for createBounds)
 */
createWorldBoundaries(bounds) {
    // Update bounds if provided
    if (bounds) {
        this.config.worldBounds = {
            min: { x: -200, y: -200 },
            max: { x: bounds.width + 200, y: bounds.height + 200 }
        };
        this.world.bounds = this.config.worldBounds;
    }
    
    // Create/recreate boundaries
    this.createBounds();
    
    console.log('🧱 World boundaries created/updated');
}

/**
 * Update world bounds (called when canvas resizes)
 */
updateWorldBounds(bounds) {
    // Update canvas dimensions for createBounds method
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    
    // Update world bounds configuration
    this.config.worldBounds = {
        min: { x: -200, y: -200 },
        max: { x: bounds.width + 200, y: bounds.height + 200 }
    };
    
    this.world.bounds = this.config.worldBounds;
    
    // Recreate boundary walls with new dimensions increaseQuality
    if (this.walls && this.walls.length > 0) {
        Matter.World.remove(this.world, this.walls);
    }
    
    this.createBounds();
    
    this.emit('worldBoundsUpdated', { bounds });
    console.log(`🌍 World bounds updated to ${bounds.width}x${bounds.height}`);
}

    /**
     * Apply gravity field effect resizeCanvas
     */
    applyGravityField(center, radius, strength, duration = 1000) {
        const startTime = Date.now();
        let fieldActive = true;
        
        const fieldInterval = setInterval(() => {
            if (!fieldActive || Date.now() - startTime > duration) {
                clearInterval(fieldInterval);
                fieldActive = false;
                this.emit('gravityFieldEnd');
                return;
            }
            
            const bodiesInRange = this.getBodiesInRadius(center, radius);
            
            for (const body of bodiesInRange) {
                if (body.isStatic) continue;
                
                // Calculate gravitational force
                const direction = this.mathUtils.vectorSubtract(center, body.position);
                const distance = Math.max(10, this.mathUtils.vectorMagnitude(direction)); // Prevent division by zero
                
                const normalizedDirection = this.mathUtils.vectorNormalize(direction);
                const falloff = Math.max(0, (radius - distance) / radius);
                const gravityForce = this.mathUtils.vectorMultiply(normalizedDirection, strength * falloff);
                
                this.applyForce(body, gravityForce);
            }
        }, 16); // ~60fps
        
        this.emit('gravityFieldStart', { center, radius, strength, duration });
        console.log(`🌌 Gravity field created at (${center.x.toFixed(1)}, ${center.y.toFixed(1)})`);
    }
    
    /**
     * Freeze all bodies temporarily
     */
    freezeWorld(duration = 1000) {
        const frozenBodies = [];
        
        // Store velocities and freeze all bodies
        for (const [bodyId, bodyData] of this.bodies) {
            const body = bodyData.body;
            
            if (body.isStatic) continue;
            
            frozenBodies.push({
                body: body,
                velocity: { x: body.velocity.x, y: body.velocity.y },
                angularVelocity: body.angularVelocity
            });
            
            // Freeze body
            Matter.Body.setVelocity(body, { x: 0, y: 0 });
            Matter.Body.setAngularVelocity(body, 0);
            body.frictionAir = 1.0; // Maximum air friction
        }
        
        // Restore after duration
        setTimeout(() => {
            for (const frozenBody of frozenBodies) {
                if (this.bodies.has(frozenBody.body.id)) {
                    frozenBody.body.frictionAir = 0.01; // Reset friction
                    // Optionally restore velocity
                    // Matter.Body.setVelocity(frozenBody.body, frozenBody.velocity);
                }
            }
            
            this.emit('worldUnfrozen');
        }, duration);
        
        this.emit('worldFrozen', { duration, affectedBodies: frozenBodies.length });
        console.log(`❄️ World frozen for ${duration}ms - ${frozenBodies.length} bodies affected`);
    }
    
    /**
     * Create wind effect
     */
    createWind(direction, strength = 0.02, duration = 5000) {
        const normalizedDirection = this.mathUtils.vectorNormalize(direction);
        const windForce = this.mathUtils.vectorMultiply(normalizedDirection, strength);
        
        const startTime = Date.now();
        let windActive = true;
        
        const windInterval = setInterval(() => {
            if (!windActive || Date.now() - startTime > duration) {
                clearInterval(windInterval);
                windActive = false;
                this.emit('windEnd');
                return;
            }
            
            // Apply wind to all non-static bodies
            for (const [bodyId, bodyData] of this.bodies) {
                const body = bodyData.body;
                
                if (body.isStatic) continue;
                
                // Add some turbulence
                const turbulentWind = {
                    x: windForce.x + this.mathUtils.randomFloat(-strength * 0.3, strength * 0.3),
                    y: windForce.y + this.mathUtils.randomFloat(-strength * 0.2, strength * 0.2)
                };
                
                this.applyForce(body, turbulentWind);
            }
        }, 33); // ~30fps for wind
        
        this.emit('windStart', { direction: normalizedDirection, strength, duration });
        console.log(`💨 Wind started - Direction: (${normalizedDirection.x.toFixed(2)}, ${normalizedDirection.y.toFixed(2)}), Strength: ${strength}`);
    }
    
    // ==========================================
    // DESTRUCTION & CLEANUP
    // ==========================================
    
    /**
     * Clean shutdown of physics engine
     */
    destroy() {
        console.log('🗑️ Destroying Physics Engine...');
        
        // Stop simulation
        this.stop();
        
        // Clear all event listeners
        this.eventListeners.clear();
        
        // Remove all bodies and constraints
        Matter.World.clear(this.world, false);
        this.bodies.clear();
        this.constraints.clear();
        
        // Clean up Matter.js events
        Matter.Events.off(this.engine, 'beforeUpdate');
        Matter.Events.off(this.engine, 'afterUpdate');
        Matter.Events.off(this.engine, 'collisionStart');
        Matter.Events.off(this.engine, 'collisionActive');
        Matter.Events.off(this.engine, 'collisionEnd');
        
        // Mark as destroyed
        this.isInitialized = false;
        this.engine = null;
        this.world = null;
        
        console.log('✅ Physics Engine destroyed');
    }
}

// Make available globally
window.PhysicsEngine = PhysicsEngine;

console.log('⚡ PhysicsEngine loaded - Advanced physics simulation ready');