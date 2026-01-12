/* ============================================
   BUBBLE-MANAGER.JS - Bubble Spawning & Management
   Purpose: Spawns bubbles, handles popping logic
   ============================================ */

class BubbleManager {
    constructor(physicsEngine, canvasWidth, canvasHeight) {
        this.physics = physicsEngine;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        
        // Spawning config
        this.spawnInterval = null;
        this.isSpawning = false;
        this.spawnRate = 500; // Spawn every 1 second
        
        // Bubble config
        this.bubbleRadius = 50;
        this.maxBubbles = 300; // Don't spawn more than this
        
        // Number colors
        this.numberColors = {
            1: '#FF6B6B',   // Red
            2: '#FFA500',   // Orange
            3: '#FFD93D',   // Yellow
            4: '#4CAF50',   // Green
            5: '#2196F3',   // Blue
            6: '#9C27B0',   // Purple
            7: '#E91E63',   // Pink
            8: '#795548',   // Brown
            9: '#00BCD4',   // Cyan
            10: '#607D8B'   // Gray
        };
        
        // Callbacks
        this.onBubblePopped = null;
        this.onWrongBubblePopped = null;
    }
    
    /* ============================================
       SPAWNING CONTROL
       ============================================ */
    
    startSpawning() {
        console.log('🎈 Starting bubble spawning...');
        this.isSpawning = true;
        
        // Spawn initial bubbles
        this.spawnInitialBatch();
        
        // Set up continuous spawning
        this.spawnInterval = setInterval(() => {
            if (this.physics.getBubbleCount() < this.maxBubbles) {
                this.spawnRandomBubble();
            }
        }, this.spawnRate);
    }
    
    stopSpawning() {
        console.log('⏹️ Stopping bubble spawning...');
        this.isSpawning = false;
        
        if (this.spawnInterval) {
            clearInterval(this.spawnInterval);
            this.spawnInterval = null;
        }
    }
    
    spawnInitialBatch() {
        // Spawn 10 bubbles at start
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                this.spawnRandomBubble();
            }, i * 200);
        }
    }
    
    /* ============================================
       BUBBLE CREATION
       ============================================ */
    
    spawnRandomBubble() {
        // Random position along top edge
        const x = Math.random() * (this.canvasWidth - 100) + 50;
        const y = -this.bubbleRadius; // Start above canvas
        
        // Random number 1-10
        const number = Math.floor(Math.random() * 10) + 1;
        
        // Get color for this number
        const color = this.numberColors[number];
        
        // Create bubble in physics engine
        const bubble = this.physics.createBubble(x, y, this.bubbleRadius, number, color);
        
        console.log(`✨ Spawned bubble: ${number} at (${x}, ${y})`);
        
        return bubble;
    }
    
    spawnBubbleWithNumber(number) {
        // Spawn a specific number (for balancing)
        const x = Math.random() * (this.canvasWidth - 100) + 50;
        const y = -this.bubbleRadius;
        const color = this.numberColors[number];
        
        return this.physics.createBubble(x, y, this.bubbleRadius, number, color);
    }
    
    /* ============================================
       BUBBLE INTERACTION
       ============================================ */
    
    handleBubbleClick(x, y, targetNumber) {
        // Get bubble at click position
        const bubble = this.physics.getBubbleAtPoint(x, y);
        
        if (!bubble) {
            console.log('❌ No bubble clicked');
            return null;
        }
        
        const bubbleNumber = bubble.customData.number;
        const isCorrect = bubbleNumber === targetNumber;
        
        console.log(`🎯 Clicked bubble ${bubbleNumber}, target is ${targetNumber}`);
        
        if (isCorrect) {
            // Correct bubble!
            this.popBubbleCorrect(bubble);
            
            if (this.onBubblePopped) {
                this.onBubblePopped(bubbleNumber, bubble.position);
            }
            
            return { correct: true, number: bubbleNumber, position: bubble.position };
        } else {
            // Wrong bubble!
            this.shakeBubble(bubble);
            
            if (this.onWrongBubblePopped) {
                this.onWrongBubblePopped(bubbleNumber, targetNumber, bubble.position);
            }
            
            return { correct: false, number: bubbleNumber, position: bubble.position };
        }
    }
    
    popBubbleCorrect(bubble) {
        // Create explosion effect and remove bubble
        this.physics.popBubble(bubble, 5);
        
        console.log(`💥 Popped bubble ${bubble.customData.number}`);
    }
    
    shakeBubble(bubble) {
        // Apply random force to shake the bubble
        const force = {
            x: (Math.random() - 0.5) * 0.3,
            y: -0.2
        };
        
        Matter.Body.applyForce(bubble, bubble.position, force);
        
        console.log(`🔴 Wrong bubble ${bubble.customData.number}`);
    }
    
    /* ============================================
       RENDERING (Custom Canvas Drawing)
       ============================================ */
    
    drawBubbles(ctx) {
        const bubbles = this.physics.bubbles;
        
        bubbles.forEach(bubble => {
            if (bubble.customData.isPopped) return;
            
            const pos = bubble.position;
            const radius = bubble.circleRadius;
            const number = bubble.customData.number;
            const color = bubble.customData.color;
            
            // Draw bubble circle
            ctx.save();
            
            // Gradient fill
            const gradient = ctx.createRadialGradient(
                pos.x - radius * 0.3, pos.y - radius * 0.3, 0,
                pos.x, pos.y, radius
            );
            gradient.addColorStop(0, this.lightenColor(color, 40));
            gradient.addColorStop(1, color);
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
            ctx.fill();
            
            // White border
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Shine effect
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(pos.x - radius * 0.3, pos.y - radius * 0.3, radius * 0.4, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw number
            ctx.fillStyle = 'white';
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.lineWidth = 4;
            ctx.strokeText(number, pos.x, pos.y);
            ctx.fillText(number, pos.x, pos.y);
            
            ctx.restore();
        });
    }
    
    lightenColor(color, percent) {
        // Lighten a hex color by percentage
        const num = parseInt(color.replace("#",""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 +
            (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255))
            .toString(16).slice(1);
    }
    
    /* ============================================
       UTILITIES
       ============================================ */
    
    clearAllBubbles() {
        this.physics.clearAllBubbles();
    }
    
    getBubbleCount() {
        return this.physics.getBubbleCount();
    }
    
    adjustSpawnRate(rate) {
        this.spawnRate = rate;
        
        // Restart spawning with new rate
        if (this.isSpawning) {
            this.stopSpawning();
            this.startSpawning();
        }
    }
    
    /* ============================================
       CLEANUP
       ============================================ */
    
    destroy() {
        this.stopSpawning();
        this.clearAllBubbles();
        console.log('🧹 Bubble manager destroyed');
    }
}