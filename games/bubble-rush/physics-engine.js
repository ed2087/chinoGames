/* ============================================
   PHYSICS-ENGINE.JS - Matter.js Wrapper
   Purpose: Manages physics simulation for bubbles
   ============================================ */

class PhysicsEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.engine = null;
        this.world = null;
        this.render = null;
        this.runner = null;
        
        // Physics bodies
        this.bubbles = [];
        this.centerBox = null;
        this.walls = [];
        
        // Canvas dimensions
        this.width = 0;
        this.height = 0;
        
        this.init();
    }
    
    /* ============================================
       INITIALIZATION
       ============================================ */
    
    init() {
        console.log('⚙️ Initializing physics engine...');
        
        // Get canvas dimensions
        this.updateDimensions();
        
        // Create Matter.js engine
        this.engine = Matter.Engine.create();
        this.world = this.engine.world;
        
        // Configure gravity
        this.engine.gravity.y = 0.5; // Gentle gravity
        
        // Create renderer
        this.render = Matter.Render.create({
            canvas: this.canvas,
            engine: this.engine,
            options: {
                width: this.width,
                height: this.height,
                wireframes: false,
                background: 'transparent'
            }
        });
        
        // Create walls
        this.createWalls();
        
        // Create center box (physical obstacle)
        this.createCenterBox();
        
        // Start renderer
        Matter.Render.run(this.render);
        
        // Create runner
        this.runner = Matter.Runner.create();
        Matter.Runner.run(this.runner, this.engine);
        
        console.log('✅ Physics engine ready');
    }
    
    updateDimensions() {
        this.width = this.canvas.clientWidth;
        this.height = this.canvas.clientHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }
    
    /* ============================================
       WORLD SETUP
       ============================================ */
    
    createWalls() {
        const wallThickness = 50;
        
        // Bottom wall
        const bottom = Matter.Bodies.rectangle(
            this.width / 2,
            this.height + wallThickness / 2,
            this.width,
            wallThickness,
            {
                isStatic: true,
                render: { fillStyle: 'transparent' }
            }
        );
        
        // Left wall
        const left = Matter.Bodies.rectangle(
            -wallThickness / 2,
            this.height / 2,
            wallThickness,
            this.height,
            {
                isStatic: true,
                render: { fillStyle: 'transparent' }
            }
        );
        
        // Right wall
        const right = Matter.Bodies.rectangle(
            this.width + wallThickness / 2,
            this.height / 2,
            wallThickness,
            this.height,
            {
                isStatic: true,
                render: { fillStyle: 'transparent' }
            }
        );
        
        this.walls = [bottom, left, right];
        Matter.World.add(this.world, this.walls);
        
        console.log('🧱 Walls created');
    }
    
    createCenterBox() {
        const boxSize = 180; // Match CSS
        
        this.centerBox = Matter.Bodies.rectangle(
            this.width / 2,
            this.height / 2,
            boxSize,
            boxSize,
            {
                isStatic: true,
                chamfer: { radius: 24 }, // Rounded corners
                render: {
                    fillStyle: 'transparent', // Invisible (CSS handles visual)
                    strokeStyle: 'transparent',
                    lineWidth: 0
                },
                label: 'centerBox'
            }
        );
        
        Matter.World.add(this.world, this.centerBox);
        
        console.log('📦 Center box created');
    }
    
    /* ============================================
       BUBBLE MANAGEMENT
       ============================================ */
    
    createBubble(x, y, radius, number, color) {
        const bubble = Matter.Bodies.circle(x, y, radius, {
            restitution: 0.6, // Bounciness
            friction: 0.1,
            frictionAir: 0.01,
            density: 0.001,
            render: {
                fillStyle: color,
                strokeStyle: 'white',
                lineWidth: 3
            },
            label: 'bubble',
            customData: {
                number: number,
                color: color,
                isPopped: false
            }
        });
        
        Matter.World.add(this.world, bubble);
        this.bubbles.push(bubble);
        
        return bubble;
    }
    
    removeBubble(bubble) {
        // Remove from world
        Matter.World.remove(this.world, bubble);
        
        // Remove from tracking array
        const index = this.bubbles.indexOf(bubble);
        if (index > -1) {
            this.bubbles.splice(index, 1);
        }
    }
    
    popBubble(bubble, explosionForce = 5) {
        if (!bubble || bubble.customData.isPopped) return;
        
        bubble.customData.isPopped = true;
        
        // Create explosion effect - push nearby bubbles away
        const nearbyBubbles = this.getBubblesNear(bubble.position, 100);
        
        nearbyBubbles.forEach(nearbyBubble => {
            if (nearbyBubble === bubble) return;
            
            // Calculate direction from popped bubble to nearby bubble
            const dx = nearbyBubble.position.x - bubble.position.x;
            const dy = nearbyBubble.position.y - bubble.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                // Normalize and apply force
                const force = {
                    x: (dx / distance) * explosionForce,
                    y: (dy / distance) * explosionForce
                };
                
                Matter.Body.applyForce(nearbyBubble, nearbyBubble.position, force);
            }
        });
        
        // Remove bubble
        this.removeBubble(bubble);
    }
    
    getBubblesNear(position, radius) {
        return this.bubbles.filter(bubble => {
            const dx = bubble.position.x - position.x;
            const dy = bubble.position.y - position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= radius;
        });
    }
    
    /* ============================================
       COLLISION DETECTION
       ============================================ */
    
    getBubbleAtPoint(x, y) {
        const point = { x, y };
        
        // Check in reverse order (top bubbles first)
        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const bubble = this.bubbles[i];
            
            if (Matter.Bounds.contains(bubble.bounds, point)) {
                // More precise circle check
                const dx = bubble.position.x - x;
                const dy = bubble.position.y - y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= bubble.circleRadius) {
                    return bubble;
                }
            }
        }
        
        return null;
    }
    
    /* ============================================
       UTILITIES
       ============================================ */
    
    clearAllBubbles() {
        this.bubbles.forEach(bubble => {
            Matter.World.remove(this.world, bubble);
        });
        this.bubbles = [];
    }
    
    getBubbleCount() {
        return this.bubbles.length;
    }
    
    pause() {
        Matter.Runner.stop(this.runner);
    }
    
    resume() {
        Matter.Runner.run(this.runner, this.engine);
    }
    
    /* ============================================
       CLEANUP
       ============================================ */
    
    destroy() {
        if (this.runner) {
            Matter.Runner.stop(this.runner);
        }
        
        if (this.render) {
            Matter.Render.stop(this.render);
        }
        
        if (this.engine) {
            Matter.Engine.clear(this.engine);
        }
        
        console.log('🧹 Physics engine destroyed');
    }
}