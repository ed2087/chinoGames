// // ==========================================
// // ENHANCED SHAPE STACK TOWER GAME
// // ==========================================

// class ShapeStackGame {
//     constructor() {
//         this.canvas = document.getElementById('gameCanvas');
//         this.ctx = this.canvas.getContext('2d');
        
//         // Game state
//         this.level = 1;
//         this.shapes = [];
//         this.targetHeight = 300;
//         this.canvasWidth = 0;
//         this.canvasHeight = 0;
//         this.groundLevel = 0;
//         this.gameRunning = true;
//         this.levelCompleted = false;
        
//         // Physics settings - optimized for stable stacking
//         this.gravity = 0.15;        
//         this.friction = 0.95;       
//         this.bounce = 0.2;          
//         this.rollFriction = 0.99;   
        
//         // Spawning positions
//         this.nextSpawnX = 100;
//         this.spawnSpacing = 80;
        
//         // Touch/drag state
//         this.isDragging = false;
//         this.dragShape = null;
//         this.dragOffset = { x: 0, y: 0 };
//         this.dragStartTime = 0;
        
//         // Animation state
//         this.celebrating = false;
//         this.celebrationTimer = 0;
        
//         // Stability timer properties
//         this.stabilityTimer = 0;
//         this.stabilityRequired = 5; // 5 seconds
//         this.countdownActive = false;
//         this.countdownStartTime = 0;
        
//         // Level configurations
//         this.levelConfig = {
//             1: { shapes: ['square'], targetHeight: 120 },
//             2: { shapes: ['square'], targetHeight: 180 },
//             3: { shapes: ['square', 'rectangle'], targetHeight: 160 },
//             4: { shapes: ['square', 'rectangle'], targetHeight: 220 },
//             5: { shapes: ['square', 'rectangle', 'triangle'], targetHeight: 200 },
//             6: { shapes: ['square', 'rectangle', 'triangle', 'circle'], targetHeight: 260 },
//             7: { shapes: ['square', 'rectangle', 'triangle', 'circle'], targetHeight: 300 },
//             8: { shapes: ['square', 'rectangle', 'triangle', 'circle', 'star'], targetHeight: 340 }
//         };
        
//         this.init();
//     }
    
//     init() {
//         this.setupCanvas();
//         this.setupEventListeners();
//         this.setupLevel();
//         this.createCountdownDisplay();
//         this.gameLoop();
        
//         // Wait for audio permission before welcome message
//         document.addEventListener('audioEnabled', () => {
//             setTimeout(() => {
//                 this.speakText("Welcome to Shape Stack Tower! Tap shapes to add them, then drag to build your tower. Keep it stable for 5 seconds to win!");
//             }, 1000);
//         });
        
//         console.log('Enhanced Shape Stack Tower initialized!');
//     }
    
//     createCountdownDisplay() {
//         // Create countdown overlay element
//         const countdownDiv = document.createElement('div');
//         countdownDiv.id = 'countdownOverlay';
//         countdownDiv.style.cssText = `
//             position: absolute;
//             top: 50%;
//             left: 50%;
//             transform: translate(-50%, -50%);
//             background: rgba(0, 0, 0, 0.8);
//             color: white;
//             font-size: 4rem;
//             font-weight: bold;
//             padding: 20px 40px;
//             border-radius: 20px;
//             text-align: center;
//             z-index: 1000;
//             display: none;
//             border: 4px solid #FFD700;
//             box-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
//         `;
//         this.canvas.parentElement.style.position = 'relative';
//         this.canvas.parentElement.appendChild(countdownDiv);
//     }
    
//     setupCanvas() {
//         const container = this.canvas.parentElement;
//         const rect = container.getBoundingClientRect();
        
//         this.canvasWidth = rect.width;
//         this.canvasHeight = rect.height;
        
//         // Set canvas size
//         this.canvas.width = this.canvasWidth;
//         this.canvas.height = this.canvasHeight;
        
//         // High DPI support
//         const dpr = window.devicePixelRatio || 1;
//         this.canvas.width *= dpr;
//         this.canvas.height *= dpr;
//         this.canvas.style.width = this.canvasWidth + 'px';
//         this.canvas.style.height = this.canvasHeight+ 'px';
//         this.ctx.scale(dpr, dpr);
        
//         // Set ground level
//         this.groundLevel = this.canvasHeight - 90;
        
//         window.addEventListener('resize', () => {
//             setTimeout(() => this.setupCanvas(), 100);
//         });
//     }
    
//     setupEventListeners() {
//         // Canvas events for shape dragging
//         this.canvas.addEventListener('mousedown', this.handlePointerStart.bind(this));
//         this.canvas.addEventListener('mousemove', this.handlePointerMove.bind(this));
//         this.canvas.addEventListener('mouseup', this.handlePointerEnd.bind(this));
        
//         this.canvas.addEventListener('touchstart', this.handlePointerStart.bind(this));
//         this.canvas.addEventListener('touchmove', this.handlePointerMove.bind(this));
//         this.canvas.addEventListener('touchend', this.handlePointerEnd.bind(this));
        
//         // Shape palette click events
//         const palette = document.getElementById('shapePalette');
//         palette.addEventListener('click', (e) => {
//             if (e.target.classList.contains('shape-btn')) {
//                 const shapeType = e.target.dataset.shape;
//                 this.addShape(shapeType);
                
//                 // Visual feedback
//                 e.target.classList.add('spawning');
//                 setTimeout(() => {
//                     e.target.classList.remove('spawning');
//                 }, 300);
                
//                 // Audio feedback
//                 this.playSoundEffect('pop');
//                 this.speakShapeName(shapeType);
//             }
//         });
        
//         // UI buttons
//         document.getElementById('resetBtn').addEventListener('click', this.resetTower.bind(this));
        
//         // Prevent context menu
//         this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
//     }
    
//     setupLevel() {
//         const config = this.levelConfig[this.level] || this.levelConfig[8];
        
//         // Update UI
//         document.getElementById('levelNumber').textContent = this.level;
        
//         // Calculate target height from bottom
//         const targetHeightFromBottom = config.targetHeight;
//         this.targetHeight = this.groundLevel - targetHeightFromBottom;
        
//         // Update target line position
//         const targetLine = document.getElementById('targetLine');
//         targetLine.style.top = this.targetHeight + 'px';
        
//         // Reset spawn position
//         this.nextSpawnX = 100;
        
//         // Create shape palette
//         this.createShapePalette(config.shapes);
        
//         // Reset game state
//         this.shapes = [];
//         this.levelCompleted = false;
//         this.gameRunning = true;
//         this.celebrating = false;
//         this.resetStabilityTimer();
        
//         console.log(`Level ${this.level} setup. Target at ${targetHeightFromBottom}px from ground`);
//     }
    
//     createShapePalette(availableShapes) {
//         const palette = document.getElementById('shapePalette');
//         palette.innerHTML = '';
        
//         const shapeEmojis = {
//             square: '⬜',
//             rectangle: '▬', 
//             triangle: '🔺',
//             circle: '🟡',
//             star: '⭐'
//         };
        
//         availableShapes.forEach(shapeType => {
//             const btn = document.createElement('button');
//             btn.className = `shape-btn ${shapeType}`;
//             btn.dataset.shape = shapeType;
//             btn.textContent = shapeEmojis[shapeType] || '⬜';
//             btn.setAttribute('type', 'button');
//             palette.appendChild(btn);
//         });
//     }
    
//     addShape(type) {
//         const colors = {
//             square: '#FF6B6B',
//             rectangle: '#4ECDC4', 
//             triangle: '#A8E6CF',
//             circle: '#FFD93D',
//             star: '#B983FF'
//         };
        
//         // Spawn shape at varied positions
//         const shapeWidth = type === 'rectangle' ? 80 : 50;
//         const shapeHeight = type === 'rectangle' ? 40 : 50;
        
//         // Calculate spawn position with some randomness
//         let spawnX = this.nextSpawnX;
        
//         // Keep shapes on screen
//         if (spawnX + shapeWidth/2 > this.canvasWidth - 50) {
//             spawnX = 100; // Reset to left side
//             this.nextSpawnX = 100;
//         }
        
//         const shape = {
//             type: type,
//             x: spawnX,
//             y: this.groundLevel - shapeHeight/2,
//             width: shapeWidth,
//             height: shapeHeight,
//             vx: 0,
//             vy: 0,
//             rotation: 0,
//             rotationSpeed: 0,
//             color: colors[type],
//             isDynamic: false, // Static until moved
//             id: Date.now() + Math.random(),
//             isSettling: false,
//             settleTimer: 0,
//             animationState: 'idle'
//         };
        
//         // Special properties for circles
//         if (type === 'circle') {
//             shape.radius = 25;
//             shape.width = 50;
//             shape.height = 50;
//             shape.y = this.groundLevel - shape.radius;
//             shape.canRoll = true;
//         }
        
//         // Update next spawn position
//         this.nextSpawnX += this.spawnSpacing;
        
//         this.shapes.push(shape);
//         console.log(`Shape spawned: ${type} at (${shape.x}, ${shape.y})`);
        
//         // Reset stability timer when adding new shapes
//         this.resetStabilityTimer();
//     }
    
//     handlePointerStart(e) {
//         e.preventDefault();
        
//         const pos = this.getEventPos(e);
//         const hitShape = this.getShapeAtPoint(pos.x, pos.y);
        
//         if (hitShape) {
//             this.isDragging = true;
//             this.dragShape = hitShape;
//             this.dragStartTime = Date.now();
//             this.dragOffset = {
//                 x: pos.x - hitShape.x,
//                 y: pos.y - hitShape.y
//             };
            
//             hitShape.isDynamic = false; // Stop physics while dragging
//             hitShape.animationState = 'dragging';
            
//             // Reset stability timer when dragging
//             this.resetStabilityTimer();
            
//             this.playSoundEffect('pickup');
//         }
//     }
    
//     handlePointerMove(e) {
//         if (!this.isDragging || !this.dragShape) return;
        
//         e.preventDefault();
//         const pos = this.getEventPos(e);
        
//         // Update shape position
//         this.dragShape.x = pos.x - this.dragOffset.x;
//         this.dragShape.y = pos.y - this.dragOffset.y;
        
//         // Keep shape in bounds
//         this.dragShape.x = Math.max(this.dragShape.width/2, 
//                                    Math.min(this.canvasWidth - this.dragShape.width/2, this.dragShape.x));
//         this.dragShape.y = Math.max(this.dragShape.height/2, this.dragShape.y);
//     }
    
//     handlePointerEnd(e) {
//         if (this.isDragging && this.dragShape) {
//             const dragDuration = Date.now() - this.dragStartTime;
//             const pos = this.getEventPos(e);
            
//             // Enable physics
//             this.dragShape.isDynamic = true;
//             this.dragShape.animationState = 'settling';
//             this.dragShape.settleTimer = 60; // Frames to settle
            
//             // Add some velocity based on drag speed (if moved quickly)
//             if (dragDuration < 200) {
//                 const deltaX = (pos.x - this.dragOffset.x) - this.dragShape.x;
//                 const deltaY = (pos.y - this.dragOffset.y) - this.dragShape.y;
//                 this.dragShape.vx = deltaX * 0.1;
//                 this.dragShape.vy = deltaY * 0.1;
//             }
            
//             // Check for tower collision - knock down if hit hard
//             this.checkTowerCollision(this.dragShape);
            
//             this.playSoundEffect('drop');
//             this.isDragging = false;
//             this.dragShape = null;
//         }
//     }
    
//     checkTowerCollision(movingShape) {
//         this.shapes.forEach(staticShape => {
//             if (staticShape === movingShape || staticShape.isDynamic) return;
            
//             const dx = Math.abs(movingShape.x - staticShape.x);
//             const dy = Math.abs(movingShape.y - staticShape.y);
//             const distance = Math.sqrt(dx * dx + dy * dy);
            
//             // If shapes are close and moving shape has velocity, knock down tower
//             if (distance < 70 && (Math.abs(movingShape.vx) > 3 || Math.abs(movingShape.vy) > 3)) {
//                 this.knockDownTower(staticShape);
//             }
//         });
//     }
    
//     knockDownTower(hitShape) {
//         // Find all shapes that could be affected
//         const affectedShapes = this.shapes.filter(shape => {
//             const distance = Math.sqrt(
//                 Math.pow(shape.x - hitShape.x, 2) + 
//                 Math.pow(shape.y - hitShape.y, 2)
//             );
//             return distance < 150; // Radius of destruction
//         });
        
//         // Knock them down with physics
//         affectedShapes.forEach(shape => {
//             shape.isDynamic = true;
//             shape.animationState = 'falling';
            
//             // Add random velocities
//             shape.vx = (Math.random() - 0.5) * 8;
//             shape.vy = -Math.random() * 4 - 2;
//             shape.rotationSpeed = (Math.random() - 0.5) * 0.3;
//         });
        
//         // Reset stability timer
//         this.resetStabilityTimer();
        
//         this.playSoundEffect('crash');
//         this.speakText("Oops! Tower fell down! Try building it again!");
//     }
    
//     getEventPos(e) {
//         const rect = this.canvas.getBoundingClientRect();
        
//         let clientX, clientY;
//         if (e.touches && e.touches[0]) {
//             clientX = e.touches[0].clientX;
//             clientY = e.touches[0].clientY;
//         } else {
//             clientX = e.clientX;
//             clientY = e.clientY;
//         }
        
//         return {
//             x: clientX - rect.left,
//             y: clientY - rect.top
//         };
//     }
    
//     getShapeAtPoint(x, y) {
//         for (let i = this.shapes.length - 1; i >= 0; i--) {
//             const shape = this.shapes[i];
            
//             if (shape.type === 'circle') {
//                 const dx = x - shape.x;
//                 const dy = y - shape.y;
//                 if (Math.sqrt(dx * dx + dy * dy) <= shape.radius) {
//                     return shape;
//                 }
//             } else {
//                 if (x >= shape.x - shape.width/2 && 
//                     x <= shape.x + shape.width/2 &&
//                     y >= shape.y - shape.height/2 && 
//                     y <= shape.y + shape.height/2) {
//                     return shape;
//                 }
//             }
//         }
//         return null;
//     }
    
//     gameLoop() {
//         this.update();
//         this.render();
//         requestAnimationFrame(() => this.gameLoop());
//     }
    
//     update() {
//         if (!this.gameRunning) return;
        
//         // Update physics for dynamic shapes
//         this.shapes.forEach(shape => {
//             if (!shape.isDynamic) return;
            
//             // Apply gravity
//             shape.vy += this.gravity;
            
//             // Apply rotation
//             shape.rotation += shape.rotationSpeed;
            
//             // Apply velocity
//             shape.x += shape.vx;
//             shape.y += shape.vy;
            
//             // Ground collision - improved for better stacking
//             const groundY = this.groundLevel - shape.height/2;
//             if (shape.y + shape.height/2 > this.groundLevel) {
//                 shape.y = groundY;
//                 shape.vy *= -this.bounce;
//                 shape.vx *= this.friction;
                
//                 // Special rolling for circles
//                 if (shape.type === 'circle' && Math.abs(shape.vx) > 0.5) {
//                     shape.rotationSpeed = shape.vx * 0.02;
//                     shape.vx *= this.rollFriction;
//                 } else {
//                     shape.rotationSpeed *= 0.95;
//                 }
                
//                 // Stop tiny bounces and settle shapes - improved thresholds
//                 if (Math.abs(shape.vy) < 0.5) {  // Increased threshold
//                     shape.vy = 0;
//                     if (Math.abs(shape.vx) < 0.3) {  // Lower threshold for stopping
//                         shape.vx = 0;
//                         shape.rotationSpeed = 0;
//                         shape.isDynamic = false; // Make static once settled
//                         shape.animationState = 'idle';
//                     }
//                 }
                
//                 // Reset stability timer on bounces
//                 this.resetStabilityTimer();
//             }
            
//             // Wall collisions
//             if (shape.x - shape.width/2 < 0) {
//                 shape.x = shape.width/2;
//                 shape.vx *= -this.bounce;
//                 this.resetStabilityTimer();
//             } else if (shape.x + shape.width/2 > this.canvasWidth) {
//                 shape.x = this.canvasWidth - shape.width/2;
//                 shape.vx *= -this.bounce;
//                 this.resetStabilityTimer();
//             }
            
//             // Settle timer
//             if (shape.settleTimer > 0) {
//                 shape.settleTimer--;
//                 if (shape.settleTimer === 0) {
//                     shape.animationState = 'idle';
//                 }
//             }
//         });
        
//         // Improved collision detection between shapes
//         this.handleShapeCollisions();
        
//         // Check if target height reached with countdown timer
//         if (!this.levelCompleted) {
//             this.checkTargetReached();
//         }
        
//         // Update countdown timer
//         this.updateCountdownTimer();
        
//         // Update celebration effects
//         if (this.celebrating) {
//             this.updateCelebrationEffects();
//         }
        
//         // Update progress bar
//         this.updateProgress();
//     }
    
//     handleShapeCollisions() {
//         for (let i = 0; i < this.shapes.length; i++) {
//             for (let j = i + 1; j < this.shapes.length; j++) {
//                 const shapeA = this.shapes[i];
//                 const shapeB = this.shapes[j];
                
//                 // Only check collisions if at least one shape is moving
//                 if (!shapeA.isDynamic && !shapeB.isDynamic) continue;
                
//                 if (this.checkShapeCollision(shapeA, shapeB)) {
//                     this.resolveShapeCollision(shapeA, shapeB);
//                     // Reset timer on collisions
//                     this.resetStabilityTimer();
//                 }
//             }
//         }
//     }
    
//     checkShapeCollision(a, b) {
//         const dx = Math.abs(a.x - b.x);
//         const dy = Math.abs(a.y - b.y);
        
//         const minDistanceX = (a.width + b.width) / 2;
//         const minDistanceY = (a.height + b.height) / 2;
        
//         return dx < minDistanceX && dy < minDistanceY;
//     }
    
//     resolveShapeCollision(a, b) {
//         const dx = a.x - b.x;
//         const dy = a.y - b.y;
//         const distance = Math.sqrt(dx * dx + dy * dy);
        
//         if (distance === 0) return;
        
//         const normalX = dx / distance;
//         const normalY = dy / distance;
        
//         // Calculate overlap more precisely
//         const overlapX = (a.width + b.width) / 2 - Math.abs(dx);
//         const overlapY = (a.height + b.height) / 2 - Math.abs(dy);
        
//         // Only separate if there's actual overlap
//         if (overlapX > 0 && overlapY > 0) {
//             // Separate along the axis with least overlap (most efficient)
//             if (overlapX < overlapY) {
//                 // Separate horizontally
//                 const separateX = overlapX / 2 + 1;
//                 if (a.isDynamic) a.x += normalX > 0 ? separateX : -separateX;
//                 if (b.isDynamic) b.x += normalX > 0 ? -separateX : separateX;
                
//                 // Reduce horizontal velocity
//                 if (a.isDynamic) a.vx *= 0.5;
//                 if (b.isDynamic) b.vx *= 0.5;
//             } else {
//                 // Separate vertically - this is key for stacking
//                 const separateY = overlapY / 2 + 1;
                
//                 // If shape A is above shape B, stack it properly
//                 if (a.y < b.y) {
//                     if (a.isDynamic) {
//                         a.y = b.y - (a.height + b.height) / 2;
//                         a.vy = Math.min(0, a.vy * -0.3); // Small bounce or stop
                        
//                         // If velocity is small, make it static (settled)
//                         if (Math.abs(a.vy) < 1 && Math.abs(a.vx) < 1) {
//                             a.isDynamic = false;
//                             a.vy = 0;
//                             a.vx *= 0.8;
//                         }
//                     }
//                 } else {
//                     if (b.isDynamic) {
//                         b.y = a.y - (a.height + b.height) / 2;
//                         b.vy = Math.min(0, b.vy * -0.3);
                        
//                         if (Math.abs(b.vy) < 1 && Math.abs(b.vx) < 1) {
//                             b.isDynamic = false;
//                             b.vy = 0;
//                             b.vx *= 0.8;
//                         }
//                     }
//                 }
//             }
//         }
//     }
    
//     // Modified target checking with countdown timer isTowerStable
// checkTargetReached() {
//     if (this.shapes.length < 2) {
//         console.log("Not enough shapes:", this.shapes.length);
//         return;
//     }
    
//     if (this.isDragging) {
//         console.log("Currently dragging, skipping check");
//         return;
//     }
    
//     const shapesAtTarget = this.shapes.filter(shape => {
//         const shapeTop = shape.y - shape.height/2;
//         return shapeTop <= this.targetHeight + 10;
//     });
    
//     console.log("Shapes at target:", shapesAtTarget.length);
//     console.log("Target height:", this.targetHeight);
    
//     if (shapesAtTarget.length === 0) {
//         this.resetStabilityTimer();
//         return;
//     }
    
//     const hasValidStructure = this.hasValidTowerStructure();
//     const isStable = this.isTowerStable();
    
//     console.log("Valid structure:", hasValidStructure);
//     console.log("Is stable:", isStable);
//     console.log("Moving shapes:", this.shapes.filter(s => s.isDynamic));
    
//     if (hasValidStructure && isStable) {
//         console.log("Starting countdown!");
//         if (!this.countdownActive) {
//             this.startCountdown();
//         }
//     } else {
//         this.resetStabilityTimer();
//     }
// }
    
//     // Check if tower structure is valid
// hasValidTowerStructure() {
//     if (this.shapes.length < 2) return false;
    
//     const shapesAtTarget = this.shapes.filter(shape => {
//         const shapeTop = shape.y - shape.height/2;
//         return shapeTop <= this.targetHeight + 10;
//     });
    
//     console.log("Shapes at target for structure check:", shapesAtTarget.length);
    
//     // Simplified: if we have shapes at target, that's good enough for now
//     return shapesAtTarget.length > 0;
// }
    
//     // Check if a shape has a path to the ground through connected shapes
//     isShapeConnectedToGround(shape, visited) {
//         if (visited.has(shape.id)) return false;
//         visited.add(shape.id);
        
//         // Check if this shape is on the ground
//         const distanceToGround = this.groundLevel - (shape.y + shape.height/2);
//         if (Math.abs(distanceToGround) < 15) {
//             return true;
//         }
        
//         // Check if this shape is supported by another shape
//         for (let otherShape of this.shapes) {
//             if (otherShape === shape) continue;
            
//             const verticalDistance = shape.y - otherShape.y;
//             const expectedDistance = (shape.height + otherShape.height) / 2;
            
//             const isSupporting = Math.abs(verticalDistance - expectedDistance) < 20;
//             const horizontalOverlap = Math.abs(shape.x - otherShape.x) < (shape.width + otherShape.width) / 2;
            
//             if (isSupporting && horizontalOverlap) {
//                 if (this.isShapeConnectedToGround(otherShape, visited)) {
//                     return true;
//                 }
//             }
//         }
        
//         return false;
//     }
    
//     // Check if tower is stable (no moving shapes)
// isTowerStable() {
//     // Simplified stability check - just check if no shapes are moving fast
//     const movingShapes = this.shapes.filter(shape => {
//         return shape.isDynamic && (Math.abs(shape.vx) > 0.1 || Math.abs(shape.vy) > 0.1);
//     });
    
//     console.log("Moving shapes count:", movingShapes.length);
//     return movingShapes.length === 0;
// }
    
//     // Start the countdown timer hasValidTowerStructure
//     startCountdown() {
//         this.countdownActive = true;
//         this.countdownStartTime = Date.now();
        
//         const countdownElement = document.getElementById('countdownOverlay');
//         countdownElement.style.display = 'block';
        
//         this.speakText("Great! Keep it stable!");
//         this.playSoundEffect('countdown_start');
//     }
    
//     // Reset the countdown timer
//     resetStabilityTimer() {
//         this.countdownActive = false;
//         this.countdownStartTime = 0;
        
//         const countdownElement = document.getElementById('countdownOverlay');
//         if (countdownElement) {
//             countdownElement.style.display = 'none';
//         }
//     }
    
//     // Update countdown timer
//     updateCountdownTimer() {
//         if (!this.countdownActive) return;
        
//         const elapsed = (Date.now() - this.countdownStartTime) / 1000;
//         const remaining = Math.max(0, this.stabilityRequired - elapsed);
//         const countdown = Math.ceil(remaining);
        
//         const countdownElement = document.getElementById('countdownOverlay');
//         if (countdownElement) {
//             if (countdown > 0) {
//                 countdownElement.textContent = countdown;
//                 countdownElement.style.color = countdown <= 2 ? '#FF4757' : '#FFD700';
//                 countdownElement.style.fontSize = countdown <= 2 ? '5rem' : '4rem';
//             } else {
//                 // Countdown finished - win!
//                 this.levelCompleted = true;
//                 this.resetStabilityTimer();
//                 this.levelComplete();
//             }
//         }
        
//         // Play tick sound
//         if (countdown !== this.lastCountdown && countdown > 0 && countdown <= 5) {
//             this.playSoundEffect('tick');
//             this.lastCountdown = countdown;
//         }
//     }
    
//     getHighestPoint() {
//         if (this.shapes.length === 0) return this.canvasHeight;
//         return Math.min(...this.shapes.map(shape => shape.y - shape.height/2));
//     }
    
//     updateProgress() {
//         const currentHeight = this.groundLevel - this.getHighestPoint();
//         const targetHeightPixels = this.groundLevel - this.targetHeight;
//         const progress = Math.max(0, Math.min(100, (currentHeight / targetHeightPixels) * 100));
        
//         document.getElementById('progressFill').style.width = progress + '%';
//     }
    
//     levelComplete() {
//         console.log('Level completed!');
//         this.celebrating = true;
//         this.celebrationTimer = 180;
        
//         document.getElementById('targetLine').classList.add('celebrating');
//         this.createCelebrationEffects();
        
//         this.playSoundEffect('success');
        
//         setTimeout(() => {
//             if (window.audioSystem?.isInitialized) {
//                 window.audioSystem.speakCelebration();
//             } else {
//                 this.speakText("Amazing! You built a stable tower! What fantastic engineering!");
//             }
//         }, 500);
        
//         setTimeout(() => {
//             this.nextLevel();
//         }, 4000);
//     }
    
//     createCelebrationEffects() {
//         const targetLine = document.getElementById('targetLine');
//         const overlay = document.getElementById('celebrationOverlay');
        
//         this.createLightningEffects();
//         this.createFireParticles();
        
//         for (let i = 0; i < 20; i++) {
//             setTimeout(() => {
//                 this.createCelebrationParticle();
//             }, i * 100);
//         }
//     }
    
//     createLightningEffects() {
//         const lightningContainer = document.querySelector('.lightning-effects');
        
//         for (let i = 0; i < 8; i++) {
//             setTimeout(() => {
//                 const lightning = document.createElement('div');
//                 lightning.className = 'lightning';
//                 lightning.style.left = Math.random() * 100 + '%';
//                 lightning.style.top = '0px';
//                 lightningContainer.appendChild(lightning);
                
//                 setTimeout(() => {
//                     lightning.remove();
//                 }, 100);
//             }, i * 50);
//         }
//     }
    
//     createFireParticles() {
//         const fireContainer = document.querySelector('.fire-particles');
        
//         for (let i = 0; i < 15; i++) {
//             setTimeout(() => {
//                 const particle = document.createElement('div');
//                 particle.className = 'fire-particle';
//                 particle.style.left = Math.random() * 100 + '%';
//                 particle.style.backgroundColor = ['#FF6B6B', '#FFA500', '#FFD700'][Math.floor(Math.random() * 3)];
//                 fireContainer.appendChild(particle);
                
//                 setTimeout(() => {
//                     particle.remove();
//                 }, 1000);
//             }, i * 80);
//         }
//     }
    
// createCelebrationParticle() {
//         const overlay = document.getElementById('celebrationOverlay');
//         const particle = document.createElement('div');
//         particle.className = 'celebration-particle';
        
//         particle.style.left = Math.random() * this.canvasWidth + 'px';
//         particle.style.top = this.targetHeight + 'px';
//         particle.style.backgroundColor = ['#FFD700', '#FF6B6B', '#4ECDC4', '#A8E6CF', '#B983FF'][Math.floor(Math.random() * 5)];
        
//         const angle = Math.random() * Math.PI * 2;
//         const distance = 100 + Math.random() * 100;
//         particle.style.setProperty('--moveX', Math.cos(angle) * distance + 'px');
//         particle.style.setProperty('--moveY', Math.sin(angle) * distance + 'px');
        
//         overlay.appendChild(particle);
        
//         setTimeout(() => {
//             particle.remove();
//         }, 2000);
//     }
    
//     updateCelebrationEffects() {
//         this.celebrationTimer--;
        
//         if (this.celebrationTimer <= 0) {
//             this.celebrating = false;
//             document.getElementById('targetLine').classList.remove('celebrating');
//         }
//     }
    
//     nextLevel() {
//         this.level++;
        
//         if (!this.levelConfig[this.level]) {
//             this.levelConfig[this.level] = {
//                 shapes: ['square', 'rectangle', 'triangle', 'circle', 'star'],
//                 targetHeight: Math.min(400, 340 + (this.level - 8) * 25)
//             };
//         }
        
//         this.setupLevel();
//         this.playSoundEffect('levelup');
        
//         setTimeout(() => {
//             this.speakText(`Level ${this.level}! Build an even taller stable tower!`);
//         }, 800);
//     }
    
//     resetTower() {
//         this.shapes = [];
//         this.isDragging = false;
//         this.dragShape = null;
//         this.levelCompleted = false;
//         this.celebrating = false;
//         this.nextSpawnX = 100;
//         this.resetStabilityTimer();
        
//         document.getElementById('targetLine').classList.remove('celebrating');
//         document.getElementById('celebrationOverlay').innerHTML = '';
        
//         this.playSoundEffect('reset');
//         this.speakText("Tower reset! Build a stable tower and keep it steady for 5 seconds!");
//     }
    
//     render() {
//         this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        
//         this.drawAnimatedBackground();
//         this.drawGround();
//         this.drawTargetGuide();
        
//         this.shapes.forEach(shape => {
//             this.drawAnimatedShape(shape);
//         });
        
//         if (this.isDragging && this.dragShape) {
//             this.drawDragEffects();
//         }
//     }
    
//     drawAnimatedBackground() {
//         const time = Date.now() * 0.001;
//         const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvasHeight);
        
//         const skyBlue = `hsl(${200 + Math.sin(time) * 10}, 70%, 80%)`;
//         const grassGreen = `hsl(${120 + Math.cos(time * 0.7) * 10}, 60%, 70%)`;
        
//         gradient.addColorStop(0, skyBlue);
//         gradient.addColorStop(1, grassGreen);
//         this.ctx.fillStyle = gradient;
//         this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
//         this.drawClouds(time);
//     }
    
//     drawClouds(time) {
//         this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        
//         for (let i = 0; i < 3; i++) {
//             const x = (time * 20 + i * 300) % (this.canvasWidth + 200) - 100;
//             const y = 50 + i * 30;
//             const size = 40 + i * 10;
            
//             this.ctx.beginPath();
//             this.ctx.arc(x, y, size, 0, Math.PI * 2);
//             this.ctx.arc(x + size * 0.8, y, size * 0.8, 0, Math.PI * 2);
//             this.ctx.arc(x + size * 1.5, y, size * 0.6, 0, Math.PI * 2);
//             this.ctx.fill();
//         }
//     }
    
//     drawGround() {
//         this.ctx.fillStyle = '#8B4513';
//         this.ctx.fillRect(0, this.groundLevel, this.canvasWidth, this.canvasHeight - this.groundLevel);
        
//         const time = Date.now() * 0.002;
//         this.ctx.fillStyle = '#228B22';
        
//         for (let i = 0; i < this.canvasWidth; i += 15) {
//             const grassHeight = 8 + Math.sin(time + i * 0.1) * 3;
//             this.ctx.fillRect(i, this.groundLevel - grassHeight, 10, grassHeight);
//         }
//     }
    
//     drawTargetGuide() {
//         const time = Date.now() * 0.005;
//         this.ctx.strokeStyle = `hsla(${45 + Math.sin(time) * 20}, 100%, 60%, 0.8)`;
//         this.ctx.lineWidth = 3;
//         this.ctx.setLineDash([10, 10]);
//         this.ctx.lineDashOffset = time * 20;
        
//         this.ctx.beginPath();
//         this.ctx.moveTo(0, this.targetHeight);
//         this.ctx.lineTo(this.canvasWidth, this.targetHeight);
//         this.ctx.stroke();
//         this.ctx.setLineDash([]);
//     }
    
//     drawAnimatedShape(shape) {
//         this.ctx.save();
//         this.ctx.translate(shape.x, shape.y);
        
//         if (shape.animationState === 'dragging') {
//             const wiggle = Math.sin(Date.now() * 0.02) * 2;
//             this.ctx.translate(wiggle, 0);
//             this.ctx.rotate(shape.rotation + Math.sin(Date.now() * 0.01) * 0.1);
//         } else if (shape.animationState === 'falling') {
//             this.ctx.rotate(shape.rotation);
//         } else if (shape.animationState === 'settling') {
//             const settle = Math.sin(Date.now() * 0.05) * (shape.settleTimer / 60);
//             this.ctx.translate(0, settle);
//             this.ctx.rotate(shape.rotation);
//         } else {
//             this.ctx.rotate(shape.rotation);
//         }
        
//         this.ctx.fillStyle = shape.color;
//         this.ctx.strokeStyle = '#333';
//         this.ctx.lineWidth = 3;
        
//         const shadowIntensity = shape.animationState === 'dragging' ? 0.6 : 0.3;
//         this.ctx.shadowColor = `rgba(0, 0, 0, ${shadowIntensity})`;
//         this.ctx.shadowBlur = shape.animationState === 'dragging' ? 15 : 8;
//         this.ctx.shadowOffsetX = shape.animationState === 'dragging' ? 5 : 3;
//         this.ctx.shadowOffsetY = shape.animationState === 'dragging' ? 5 : 3;
        
//         if (this.celebrating && shape.y - shape.height/2 <= this.targetHeight + 10) {
//             this.ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
//             this.ctx.shadowBlur = 20;
//         }
        
//         switch (shape.type) {
//             case 'square':
//             case 'rectangle':
//                 this.ctx.fillRect(-shape.width/2, -shape.height/2, shape.width, shape.height);
//                 this.ctx.strokeRect(-shape.width/2, -shape.height/2, shape.width, shape.height);
                
//                 this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
//                 this.ctx.fillRect(-shape.width/2, -shape.height/2, shape.width/3, shape.height/3);
//                 break;
                
//             case 'circle':
//                 this.ctx.beginPath();
//                 this.ctx.arc(0, 0, shape.radius, 0, Math.PI * 2);
//                 this.ctx.fill();
//                 this.ctx.stroke();
                
//                 this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
//                 this.ctx.beginPath();
//                 this.ctx.arc(-shape.radius/3, -shape.radius/3, shape.radius/2, 0, Math.PI * 2);
//                 this.ctx.fill();
//                 break;
                
//             case 'triangle':
//                 this.ctx.beginPath();
//                 this.ctx.moveTo(0, -shape.height/2);
//                 this.ctx.lineTo(-shape.width/2, shape.height/2);
//                 this.ctx.lineTo(shape.width/2, shape.height/2);
//                 this.ctx.closePath();
//                 this.ctx.fill();
//                 this.ctx.stroke();
                
//                 this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
//                 this.ctx.beginPath();
//                 this.ctx.moveTo(0, -shape.height/4);
//                 this.ctx.lineTo(-shape.width/4, shape.height/4);
//                 this.ctx.lineTo(shape.width/4, shape.height/4);
//                 this.ctx.closePath();
//                 this.ctx.fill();
//                 break;
                
//             case 'star':
//                 this.drawAnimatedStar(0, 0, 25);
//                 break;
//         }
        
//         this.ctx.restore();
//     }
    
//     drawAnimatedStar(x, y, radius) {
//         const spikes = 5;
//         const outerRadius = radius;
//         const innerRadius = radius * 0.4;
//         const time = Date.now() * 0.001;
        
//         const pulseRadius = outerRadius * (1 + Math.sin(time * 3) * 0.1);
        
//         this.ctx.beginPath();
//         for (let i = 0; i < spikes * 2; i++) {
//             const angle = (i * Math.PI) / spikes;
//             const r = i % 2 === 0 ? pulseRadius : innerRadius;
//             const pointX = x + Math.cos(angle - Math.PI/2) * r;
//             const pointY = y + Math.sin(angle - Math.PI/2) * r;
            
//             if (i === 0) {
//                 this.ctx.moveTo(pointX, pointY);
//             } else {
//                 this.ctx.lineTo(pointX, pointY);
//             }
//         }
//         this.ctx.closePath();
//         this.ctx.fill();
//         this.ctx.stroke();
        
//         this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
//         this.ctx.beginPath();
//         this.ctx.arc(x, y, 5, 0, Math.PI * 2);
//         this.ctx.fill();
//     }
    
//     drawDragEffects() {
//         this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
//         this.ctx.lineWidth = 2;
//         this.ctx.setLineDash([5, 5]);
        
//         this.ctx.beginPath();
//         this.ctx.arc(this.dragShape.x, this.dragShape.y, this.dragShape.width/2 + 10, 0, Math.PI * 2);
//         this.ctx.stroke();
//         this.ctx.setLineDash([]);
        
//         this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
//         this.ctx.fillRect(
//             this.dragShape.x - this.dragShape.width/2, 
//             this.groundLevel - 5,
//             this.dragShape.width, 
//             10
//         );
//     }
    
//     playSoundEffect(type) {
//         if (!window.audioSystem?.audioContext) return;
        
//         try {
//             const audioCtx = window.audioSystem.audioContext;
//             const oscillator = audioCtx.createOscillator();
//             const gainNode = audioCtx.createGain();
            
//             oscillator.connect(gainNode);
//             gainNode.connect(audioCtx.destination);
            
//             switch (type) {
//                 case 'pop':
//                     oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
//                     oscillator.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.1);
//                     gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
//                     gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
//                     break;
//                 case 'pickup':
//                     oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
//                     oscillator.frequency.linearRampToValueAtTime(800, audioCtx.currentTime + 0.05);
//                     gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
//                     gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
//                     break;
//                 case 'drop':
//                     oscillator.frequency.setValueAtTime(300, audioCtx.currentTime);
//                     gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
//                     gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
//                     oscillator.type = 'square';
//                     break;
//                 case 'tick':
//                     oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
//                     gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
//                     gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
//                     break;
//                 case 'countdown_start':
//                     oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
//                     oscillator.frequency.linearRampToValueAtTime(800, audioCtx.currentTime + 0.2);
//                     gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
//                     gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
//                     break;
//                 case 'crash':
//                     for (let i = 0; i < 5; i++) {
//                         setTimeout(() => {
//                             const crashOsc = audioCtx.createOscillator();
//                             const crashGain = audioCtx.createGain();
//                             crashOsc.connect(crashGain);
//                             crashGain.connect(audioCtx.destination);
//                             crashOsc.frequency.setValueAtTime(200 + Math.random() * 400, audioCtx.currentTime);
//                             crashGain.gain.setValueAtTime(0.1, audioCtx.currentTime);
//                             crashGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
//                             crashOsc.type = 'sawtooth';
//                             crashOsc.start();
//                             crashOsc.stop(audioCtx.currentTime + 0.3);
//                         }, i * 20);
//                     }
//                     return;
//                 case 'success':
//                     this.playChord([523, 659, 784, 1047], 1.0);
//                     return;
//                 case 'levelup':
//                     this.playArpeggio([523, 659, 784, 1047, 1319], 0.25);
//                     return;
//                 case 'reset':
//                     oscillator.frequency.setValueAtTime(200, audioCtx.currentTime);
//                     gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
//                     gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
//                     break;
//             }
            
//             oscillator.start(audioCtx.currentTime);
//             oscillator.stop(audioCtx.currentTime + 0.5);
            
//         } catch (error) {
//             console.warn('Sound effect failed:', error);
//         }
//     }
    
//     playChord(frequencies, duration) {
//         frequencies.forEach((freq, index) => {
//             setTimeout(() => {
//                 const oscillator = window.audioSystem.audioContext.createOscillator();
//                 const gainNode = window.audioSystem.audioContext.createGain();
                
//                 oscillator.connect(gainNode);
//                 gainNode.connect(window.audioSystem.audioContext.destination);
                
//                 oscillator.frequency.setValueAtTime(freq, window.audioSystem.audioContext.currentTime);
//                 gainNode.gain.setValueAtTime(0.08, window.audioSystem.audioContext.currentTime);
//                 gainNode.gain.exponentialRampToValueAtTime(0.01, window.audioSystem.audioContext.currentTime + duration);
                
//                 oscillator.start();
//                 oscillator.stop(window.audioSystem.audioContext.currentTime + duration);
//             }, index * 150);
//         });
//     }
    
//     playArpeggio(frequencies, noteLength) {
//         frequencies.forEach((freq, index) => {
//             setTimeout(() => {
//                 const oscillator = window.audioSystem.audioContext.createOscillator();
//                 const gainNode = window.audioSystem.audioContext.createGain();
                
//                 oscillator.connect(gainNode);
//                 gainNode.connect(window.audioSystem.audioContext.destination);
                
//                 oscillator.frequency.setValueAtTime(freq, window.audioSystem.audioContext.currentTime);
//                 gainNode.gain.setValueAtTime(0.12, window.audioSystem.audioContext.currentTime);
//                 gainNode.gain.exponentialRampToValueAtTime(0.01, window.audioSystem.audioContext.currentTime + noteLength);
                
//                 oscillator.start();
//                 oscillator.stop(window.audioSystem.audioContext.currentTime + noteLength);
//             }, index * noteLength * 1000);
//         });
//     }
    
//     speakText(text) {
//         if (window.audioSystem?.isInitialized) {
//             window.audioSystem.speak(text);
//         } else if ('speechSynthesis' in window) {
//             const utterance = new SpeechSynthesisUtterance(text);
//             utterance.rate = 0.8;
//             utterance.pitch = 1.3;
//             speechSynthesis.speak(utterance);
//         }
//     }
    
//     speakShapeName(shapeName) {
//         if (window.audioSystem?.isInitialized) {
//             window.audioSystem.speakShape(shapeName);
//         } else {
//             const shapeNames = {
//                 square: 'Square block!',
//                 rectangle: 'Rectangle block!',
//                 triangle: 'Triangle block!',
//                 circle: 'Round ball!',
//                 star: 'Star block!'
//             };
//             this.speakText(shapeNames[shapeName] || shapeName);
//         }
//     }
// }

// // Initialize the game checkTargetReached
// document.addEventListener('DOMContentLoaded', () => {
//     window.shapeStackGame = new ShapeStackGame();
// });




// ==========================================
// MOBILE-OPTIMIZED SHAPE STACK TOWER GAME
// ==========================================

class ShapeStackGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Detect device performance level
        this.isLowPerformance = this.detectLowPerformance();
        
        // Game state
        this.level = 1;
        this.shapes = [];
        this.targetHeight = 300;
        this.canvasWidth = 0;
        this.canvasHeight = 0;
        this.groundLevel = 0;
        this.gameRunning = true;
        this.levelCompleted = false;
        
        // Performance-adjusted physics
        this.gravity = this.isLowPerformance ? 0.1 : 0.15;
        this.friction = 0.95;
        this.bounce = 0.2;
        this.rollFriction = 0.99;
        
        // Spawning positions
        this.nextSpawnX = 100;
        this.spawnSpacing = 80;
        
        // Touch/drag state
        this.isDragging = false;
        this.dragShape = null;
        this.dragOffset = { x: 0, y: 0 };
        this.dragStartTime = 0;
        
        // Animation state
        this.celebrating = false;
        this.celebrationTimer = 0;
        
        // Stability timer properties
        this.stabilityTimer = 0;
        this.stabilityRequired = 3; // Reduced from 5 seconds
        this.countdownActive = false;
        this.countdownStartTime = 0;
        
        // Performance optimization
        this.frameSkip = this.isLowPerformance ? 2 : 1; // Skip frames on low-end devices
        this.frameCount = 0;
        
        // Level configurations
        this.levelConfig = {
            1: { shapes: ['square'], targetHeight: 120 },
            2: { shapes: ['square'], targetHeight: 180 },
            3: { shapes: ['square', 'rectangle'], targetHeight: 160 },
            4: { shapes: ['square', 'rectangle'], targetHeight: 220 },
            5: { shapes: ['square', 'rectangle', 'triangle'], targetHeight: 200 },
            6: { shapes: ['square', 'rectangle', 'triangle', 'circle'], targetHeight: 260 },
            7: { shapes: ['square', 'rectangle', 'triangle', 'circle'], targetHeight: 300 },
            8: { shapes: ['square', 'rectangle', 'triangle', 'circle', 'star'], targetHeight: 340 }
        };
        
        this.init();
    }
    
    detectLowPerformance() {
        // Check if device is likely low-performance
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isOldMobile = /Android [1-4]|iPhone OS [1-9]_|CPU OS [1-9]_/i.test(navigator.userAgent);
        const hasLowMemory = navigator.deviceMemory && navigator.deviceMemory < 4;
        
        return isMobile || isOldMobile || hasLowMemory;
    }
    
    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.setupLevel();
        this.createCountdownDisplay();
        this.gameLoop();
        
        document.addEventListener('audioEnabled', () => {
            setTimeout(() => {
                this.speakText("Welcome to Shape Stack Tower! Stack blocks and keep them steady for 3 seconds to win!");
            }, 1000);
        });
        
        console.log(`Shape Stack Tower initialized - Performance mode: ${this.isLowPerformance ? 'Low' : 'High'}`);
    }
    
    createCountdownDisplay() {
        const countdownDiv = document.createElement('div');
        countdownDiv.id = 'countdownOverlay';
        countdownDiv.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: #FFD700;
            font-size: ${this.isLowPerformance ? '3rem' : '4rem'};
            font-weight: bold;
            padding: 20px 40px;
            border-radius: 20px;
            text-align: center;
            z-index: 1000;
            display: none;
            border: 3px solid #FFD700;
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
            font-family: Arial, sans-serif;
        `;
        this.canvas.parentElement.appendChild(countdownDiv);
    }
    
    setupCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        this.canvasWidth = rect.width;
        this.canvasHeight = rect.height;
        
        // Reduced resolution for mobile
        const pixelRatio = this.isLowPerformance ? 1 : Math.min(window.devicePixelRatio || 1, 2);
        
        this.canvas.width = this.canvasWidth * pixelRatio;
        this.canvas.height = this.canvasHeight * pixelRatio;
        this.canvas.style.width = this.canvasWidth + 'px';
        this.canvas.style.height = this.canvasHeight + 'px';
        this.ctx.scale(pixelRatio, pixelRatio);
        
        // Optimize canvas settings
        this.ctx.imageSmoothingEnabled = !this.isLowPerformance;
        
        this.groundLevel = this.canvasHeight - 30;
        
        window.addEventListener('resize', () => {
            setTimeout(() => this.setupCanvas(), 100);
        });
    }
    
    setupEventListeners() {
        // Simplified event handling for mobile
        this.canvas.addEventListener('touchstart', this.handlePointerStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this.handlePointerMove.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.handlePointerEnd.bind(this), { passive: false });
        
        // Desktop support
        this.canvas.addEventListener('mousedown', this.handlePointerStart.bind(this));
        this.canvas.addEventListener('mousemove', this.handlePointerMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handlePointerEnd.bind(this));
        
        const palette = document.getElementById('shapePalette');
        palette.addEventListener('click', (e) => {
            if (e.target.classList.contains('shape-btn')) {
                const shapeType = e.target.dataset.shape;
                this.addShape(shapeType);
                
                e.target.classList.add('spawning');
                setTimeout(() => e.target.classList.remove('spawning'), 300);
                
                this.playSoundEffect('pop');
                this.speakShapeName(shapeType);
            }
        });
        
        document.getElementById('resetBtn').addEventListener('click', this.resetTower.bind(this));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    setupLevel() {
        const config = this.levelConfig[this.level] || this.levelConfig[8];
        
        document.getElementById('levelNumber').textContent = this.level;
        
        const targetHeightFromBottom = config.targetHeight;
        this.targetHeight = this.groundLevel - targetHeightFromBottom;
        
        const targetLine = document.getElementById('targetLine');
        targetLine.style.top = this.targetHeight + 'px';
        
        this.nextSpawnX = 100;
        this.createShapePalette(config.shapes);
        
        this.shapes = [];
        this.levelCompleted = false;
        this.gameRunning = true;
        this.celebrating = false;
        this.resetStabilityTimer();
        
        console.log(`Level ${this.level} setup`);
    }
    
    createShapePalette(availableShapes) {
        const palette = document.getElementById('shapePalette');
        palette.innerHTML = '';
        
        const shapeEmojis = {
            square: '⬜',
            rectangle: '▬', 
            triangle: '🔺',
            circle: '🟡',
            star: '⭐'
        };
        
        availableShapes.forEach(shapeType => {
            const btn = document.createElement('button');
            btn.className = `shape-btn ${shapeType}`;
            btn.dataset.shape = shapeType;
            btn.textContent = shapeEmojis[shapeType] || '⬜';
            btn.setAttribute('type', 'button');
            palette.appendChild(btn);
        });
    }
    
    addShape(type) {
        // Limit total shapes on low-performance devices
        if (this.isLowPerformance && this.shapes.length >= 8) {
            this.speakText("Too many blocks! Try building with fewer blocks.");
            return;
        }
        
        const colors = {
            square: '#FF6B6B',
            rectangle: '#4ECDC4', 
            triangle: '#A8E6CF',
            circle: '#FFD93D',
            star: '#B983FF'
        };
        
        const shapeWidth = type === 'rectangle' ? 80 : 50;
        const shapeHeight = type === 'rectangle' ? 40 : 50;
        
        let spawnX = this.nextSpawnX;
        
        if (spawnX + shapeWidth/2 > this.canvasWidth - 50) {
            spawnX = 100;
            this.nextSpawnX = 100;
        }
        
        const shape = {
            type: type,
            x: spawnX,
            y: this.groundLevel - shapeHeight/2,
            width: shapeWidth,
            height: shapeHeight,
            vx: 0,
            vy: 0,
            rotation: 0,
            rotationSpeed: 0,
            color: colors[type],
            isDynamic: false,
            id: Date.now() + Math.random(),
            animationState: 'idle'
        };
        
        if (type === 'circle') {
            shape.radius = 25;
            shape.width = 50;
            shape.height = 50;
            shape.y = this.groundLevel - shape.radius;
        }
        
        this.nextSpawnX += this.spawnSpacing;
        this.shapes.push(shape);
        this.resetStabilityTimer();
    }
    
    handlePointerStart(e) {
        e.preventDefault();
        
        const pos = this.getEventPos(e);
        const hitShape = this.getShapeAtPoint(pos.x, pos.y);
        
        if (hitShape) {
            this.isDragging = true;
            this.dragShape = hitShape;
            this.dragStartTime = Date.now();
            this.dragOffset = {
                x: pos.x - hitShape.x,
                y: pos.y - hitShape.y
            };
            
            hitShape.isDynamic = false;
            hitShape.animationState = 'dragging';
            this.resetStabilityTimer();
            this.playSoundEffect('pickup');
        }
    }
    
    handlePointerMove(e) {
        if (!this.isDragging || !this.dragShape) return;
        
        e.preventDefault();
        const pos = this.getEventPos(e);
        
        this.dragShape.x = pos.x - this.dragOffset.x;
        this.dragShape.y = pos.y - this.dragOffset.y;
        
        this.dragShape.x = Math.max(this.dragShape.width/2, 
                                   Math.min(this.canvasWidth - this.dragShape.width/2, this.dragShape.x));
        this.dragShape.y = Math.max(this.dragShape.height/2, this.dragShape.y);
    }
    
    handlePointerEnd(e) {
        if (this.isDragging && this.dragShape) {
            this.dragShape.isDynamic = true;
            this.dragShape.animationState = 'settling';
            
            this.playSoundEffect('drop');
            this.isDragging = false;
            this.dragShape = null;
        }
    }
    
    getEventPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        
        let clientX, clientY;
        if (e.touches && e.touches[0]) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }
    
    getShapeAtPoint(x, y) {
        for (let i = this.shapes.length - 1; i >= 0; i--) {
            const shape = this.shapes[i];
            
            if (shape.type === 'circle') {
                const dx = x - shape.x;
                const dy = y - shape.y;
                if (Math.sqrt(dx * dx + dy * dy) <= shape.radius) {
                    return shape;
                }
            } else {
                if (x >= shape.x - shape.width/2 && 
                    x <= shape.x + shape.width/2 &&
                    y >= shape.y - shape.height/2 && 
                    y <= shape.y + shape.height/2) {
                    return shape;
                }
            }
        }
        return null;
    }
    
    gameLoop() {
        this.frameCount++;
        
        // Skip frames on low-performance devices
        if (this.frameCount % this.frameSkip === 0) {
            this.update();
            this.render();
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        if (!this.gameRunning) return;
        
        // Simplified physics update
        this.shapes.forEach(shape => {
            if (!shape.isDynamic) return;
            
            shape.vy += this.gravity;
            shape.rotation += shape.rotationSpeed;
            shape.x += shape.vx;
            shape.y += shape.vy;
            
            // Ground collision
            const groundY = this.groundLevel - shape.height/2;
            if (shape.y + shape.height/2 > this.groundLevel) {
                shape.y = groundY;
                shape.vy *= -this.bounce;
                shape.vx *= this.friction;
                shape.rotationSpeed *= 0.95;
                
                // Settle faster on mobile
                if (Math.abs(shape.vy) < 0.8) {
                    shape.vy = 0;
                    if (Math.abs(shape.vx) < 0.5) {
                        shape.vx = 0;
                        shape.rotationSpeed = 0;
                        shape.isDynamic = false;
                        shape.animationState = 'idle';
                    }
                }
            }
            
            // Wall collisions
            if (shape.x - shape.width/2 < 0) {
                shape.x = shape.width/2;
                shape.vx *= -this.bounce;
            } else if (shape.x + shape.width/2 > this.canvasWidth) {
                shape.x = this.canvasWidth - shape.width/2;
                shape.vx *= -this.bounce;
            }
        });
        
        // Simplified collision detection (only check nearby shapes)
        this.handleShapeCollisions();
        
        if (!this.levelCompleted) {
            this.checkTargetReached();
        }
        
        this.updateCountdownTimer();
        this.updateProgress();
    }
    
    handleShapeCollisions() {
        // Optimized collision detection - only check active shapes
        const dynamicShapes = this.shapes.filter(s => s.isDynamic);
        
        for (let i = 0; i < dynamicShapes.length; i++) {
            for (let j = 0; j < this.shapes.length; j++) {
                const shapeA = dynamicShapes[i];
                const shapeB = this.shapes[j];
                
                if (shapeA === shapeB) continue;
                
                if (this.checkShapeCollision(shapeA, shapeB)) {
                    this.resolveShapeCollision(shapeA, shapeB);
                }
            }
        }
    }
    
    checkShapeCollision(a, b) {
        const dx = Math.abs(a.x - b.x);
        const dy = Math.abs(a.y - b.y);
        
        const minDistanceX = (a.width + b.width) / 2;
        const minDistanceY = (a.height + b.height) / 2;
        
        return dx < minDistanceX && dy < minDistanceY;
    }
    
    resolveShapeCollision(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) return;
        
        const overlapX = (a.width + b.width) / 2 - Math.abs(dx);
        const overlapY = (a.height + b.height) / 2 - Math.abs(dy);
        
        if (overlapX > 0 && overlapY > 0) {
            if (overlapX < overlapY) {
                // Horizontal separation
                const separateX = overlapX / 2 + 1;
                if (a.isDynamic) a.x += dx > 0 ? separateX : -separateX;
                if (b.isDynamic) b.x += dx > 0 ? -separateX : separateX;
                
                if (a.isDynamic) a.vx *= 0.5;
                if (b.isDynamic) b.vx *= 0.5;
            } else {
                // Vertical separation - key for stacking
                if (a.y < b.y && a.isDynamic) {
                    a.y = b.y - (a.height + b.height) / 2;
                    a.vy = Math.min(0, a.vy * -0.3);
                    
                    if (Math.abs(a.vy) < 1 && Math.abs(a.vx) < 1) {
                        a.isDynamic = false;
                        a.vy = 0;
                        a.vx *= 0.8;
                    }
                } else if (b.y < a.y && b.isDynamic) {
                    b.y = a.y - (a.height + b.height) / 2;
                    b.vy = Math.min(0, b.vy * -0.3);
                    
                    if (Math.abs(b.vy) < 1 && Math.abs(b.vx) < 1) {
                        b.isDynamic = false;
                        b.vy = 0;
                        b.vx *= 0.8;
                    }
                }
            }
        }
    }
    
    // Simplified win conditions
    checkTargetReached() {
        if (this.shapes.length < 2) return;
        if (this.isDragging) return;
        
        const shapesAtTarget = this.shapes.filter(shape => {
            const shapeTop = shape.y - shape.height/2;
            return shapeTop <= this.targetHeight + 15; // More tolerance
        });
        
        if (shapesAtTarget.length === 0) {
            this.resetStabilityTimer();
            return;
        }
        
        // Simplified checks
        if (this.isStable() && this.hasStackedShapes()) {
            if (!this.countdownActive) {
                this.startCountdown();
            }
        } else {
            this.resetStabilityTimer();
        }
    }
    
    isStable() {
        const movingShapes = this.shapes.filter(shape => {
            return shape.isDynamic && (Math.abs(shape.vx) > 0.2 || Math.abs(shape.vy) > 0.2);
        });
        return movingShapes.length === 0;
    }
    
    hasStackedShapes() {
        // Simple check: are there shapes at different heights?
        const heights = this.shapes.map(s => s.y);
        const minHeight = Math.min(...heights);
        const maxHeight = Math.max(...heights);
        return (maxHeight - minHeight) > 40; // Some vertical separation
    }
    
    startCountdown() {
        this.countdownActive = true;
        this.countdownStartTime = Date.now();
        
        const countdownElement = document.getElementById('countdownOverlay');
        countdownElement.style.display = 'block';
        
        this.speakText("Keep it steady!");
        this.playSoundEffect('countdown_start');
    }
    
    resetStabilityTimer() {
        this.countdownActive = false;
        this.countdownStartTime = 0;
        
        const countdownElement = document.getElementById('countdownOverlay');
        if (countdownElement) {
            countdownElement.style.display = 'none';
        }
    }
    
    updateCountdownTimer() {
        if (!this.countdownActive) return;
        
        const elapsed = (Date.now() - this.countdownStartTime) / 1000;
        const remaining = Math.max(0, this.stabilityRequired - elapsed);
        const countdown = Math.ceil(remaining);
        
        const countdownElement = document.getElementById('countdownOverlay');
        if (countdownElement) {
            if (countdown > 0) {
                countdownElement.textContent = countdown;
                countdownElement.style.color = countdown <= 1 ? '#FF4757' : '#FFD700';
            } else {
                this.levelCompleted = true;
                this.resetStabilityTimer();
                this.levelComplete();
            }
        }
        
        if (countdown !== this.lastCountdown && countdown > 0) {
            this.playSoundEffect('tick');
            this.lastCountdown = countdown;
        }
    }
    
    levelComplete() {
        this.celebrating = true;
        this.celebrationTimer = 120;
        
        document.getElementById('targetLine').classList.add('celebrating');
        
        this.playSoundEffect('success');
        
        setTimeout(() => {
            if (window.audioSystem?.isInitialized) {
                window.audioSystem.speakCelebration();
            } else {
                this.speakText("Amazing! You built a stable tower!");
            }
        }, 500);
        
        setTimeout(() => {
            this.nextLevel();
        }, 3000);
    }
    
    nextLevel() {
        this.level++;
        
        if (!this.levelConfig[this.level]) {
            this.levelConfig[this.level] = {
                shapes: ['square', 'rectangle', 'triangle', 'circle', 'star'],
                targetHeight: Math.min(400, 340 + (this.level - 8) * 25)
            };
        }
        
        this.setupLevel();
        this.playSoundEffect('levelup');
        
        setTimeout(() => {
            this.speakText(`Level ${this.level}! Build an even taller tower!`);
        }, 800);
    }
    
    resetTower() {
        this.shapes = [];
        this.isDragging = false;
        this.dragShape = null;
        this.levelCompleted = false;
        this.celebrating = false;
        this.nextSpawnX = 100;
        this.resetStabilityTimer();
        
        document.getElementById('targetLine').classList.remove('celebrating');
        
        this.playSoundEffect('reset');
        this.speakText("Tower reset! Stack blocks and keep them steady!");
    }
    
    updateProgress() {
        const currentHeight = this.groundLevel - this.getHighestPoint();
        const targetHeightPixels = this.groundLevel - this.targetHeight;
        const progress = Math.max(0, Math.min(100, (currentHeight / targetHeightPixels) * 100));
        
        document.getElementById('progressFill').style.width = progress + '%';
    }
    
    getHighestPoint() {
        if (this.shapes.length === 0) return this.canvasHeight;
        return Math.min(...this.shapes.map(shape => shape.y - shape.height/2));
    }
    
    render() {
        // Skip complex rendering on low-performance devices
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // Simplified background
        if (!this.isLowPerformance) {
            this.drawAnimatedBackground();
        } else {
            // Simple gradient background
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvasHeight);
            gradient.addColorStop(0, '#87CEEB');
            gradient.addColorStop(1, '#98FB98');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        }
        
        this.drawGround();
        this.drawTargetGuide();
        
        // Draw shapes with reduced effects on mobile
        this.shapes.forEach(shape => {
            this.drawShape(shape);
        });
        
        if (this.isDragging && this.dragShape) {
            this.drawDragEffects();
        }
    }
    
    drawAnimatedBackground() {
        const time = Date.now() * 0.001;
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvasHeight);
        
        const skyBlue = `hsl(${200 + Math.sin(time) * 5}, 70%, 80%)`;
        const grassGreen = `hsl(${120 + Math.cos(time * 0.7) * 5}, 60%, 70%)`;
        
        gradient.addColorStop(0, skyBlue);
        gradient.addColorStop(1, grassGreen);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    }
    
    drawGround() {
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(0, this.groundLevel, this.canvasWidth, this.canvasHeight - this.groundLevel);
        
        // Simplified grass
        this.ctx.fillStyle = '#228B22';
        for (let i = 0; i < this.canvasWidth; i += 20) {
            this.ctx.fillRect(i, this.groundLevel - 5, 15, 5);
        }
    }
    
    drawTargetGuide() {
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([8, 8]);
        
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.targetHeight);
        this.ctx.lineTo(this.canvasWidth, this.targetHeight);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
    
    drawShape(shape) {
        this.ctx.save();
        this.ctx.translate(shape.x, shape.y);
        this.ctx.rotate(shape.rotation);
        
        this.ctx.fillStyle = shape.color;
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        
        // Reduced shadow effects for performance
        if (!this.isLowPerformance && shape.animationState === 'dragging') {
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            this.ctx.shadowBlur = 8;
            this.ctx.shadowOffsetX = 3;
            this.ctx.shadowOffsetY = 3;
        }
        
        switch (shape.type) {
            case 'square':
            case 'rectangle':
                this.ctx.fillRect(-shape.width/2, -shape.height/2, shape.width, shape.height);
                this.ctx.strokeRect(-shape.width/2, -shape.height/2, shape.width, shape.height);
                break;
                
            case 'circle':
                this.ctx.beginPath();
                this.ctx.arc(0, 0, shape.radius, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
                break;
                
            case 'triangle':
                this.ctx.beginPath();
                this.ctx.moveTo(0, -shape.height/2);
                this.ctx.lineTo(-shape.width/2, shape.height/2);
                this.ctx.lineTo(shape.width/2, shape.height/2);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();
                break;
                
            case 'star':
                this.drawStar(0, 0, 25);
                break;
        }
        
        this.ctx.restore();
    }
    
    drawStar(x, y, radius) {
        const spikes = 5;
        this.ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const angle = (i * Math.PI) / spikes;
            const r = i % 2 === 0 ? radius : radius * 0.4;
            const pointX = x + Math.cos(angle - Math.PI/2) * r;
            const pointY = y + Math.sin(angle - Math.PI/2) * r;
            
            if (i === 0) {
                this.ctx.moveTo(pointX, pointY);
            } else {
                this.ctx.lineTo(pointX, pointY);
            }
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
    }
    
    drawDragEffects() {
        this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(this.dragShape.x, this.dragShape.y, this.dragShape.width/2 + 8, 0, Math.PI * 2);
        this.ctx.stroke();
    }
    
// Simplified sound effects
    playSoundEffect(type) {
        if (!window.audioSystem?.audioContext) return;
        
        try {
            const audioCtx = window.audioSystem.audioContext;
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            // Simplified sound generation for better performance
            switch (type) {
                case 'pop':
                    oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
                    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
                    break;
                case 'pickup':
                    oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
                    gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
                    break;
                case 'drop':
                    oscillator.frequency.setValueAtTime(300, audioCtx.currentTime);
                    gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
                    break;
                case 'tick':
                    oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
                    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
                    break;
                case 'countdown_start':
                    oscillator.frequency.setValueAtTime(500, audioCtx.currentTime);
                    gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
                    break;
                case 'success':
                    // Simple success chord
                    for (let i = 0; i < 3; i++) {
                        setTimeout(() => {
                            const osc = audioCtx.createOscillator();
                            const gain = audioCtx.createGain();
                            osc.connect(gain);
                            gain.connect(audioCtx.destination);
                            osc.frequency.setValueAtTime([523, 659, 784][i], audioCtx.currentTime);
                            gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
                            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
                            osc.start();
                            osc.stop(audioCtx.currentTime + 0.5);
                        }, i * 100);
                    }
                    return;
                case 'levelup':
                    oscillator.frequency.setValueAtTime(523, audioCtx.currentTime);
                    oscillator.frequency.linearRampToValueAtTime(1047, audioCtx.currentTime + 0.2);
                    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
                    break;
                case 'reset':
                    oscillator.frequency.setValueAtTime(200, audioCtx.currentTime);
                    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
                    break;
            }
            
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.3);
            
        } catch (error) {
            console.warn('Sound effect failed:', error);
        }
    }
    
    speakText(text) {
        if (window.audioSystem?.isInitialized) {
            window.audioSystem.speak(text);
        } else if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.8;
            utterance.pitch = 1.3;
            speechSynthesis.speak(utterance);
        }
    }
    
    speakShapeName(shapeName) {
        if (window.audioSystem?.isInitialized) {
            window.audioSystem.speakShape(shapeName);
        } else {
            const shapeNames = {
                square: 'Square block!',
                rectangle: 'Rectangle block!',
                triangle: 'Triangle block!',
                circle: 'Round ball!',
                star: 'Star block!'
            };
            this.speakText(shapeNames[shapeName] || shapeName);
        }
    }
}

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
    window.shapeStackGame = new ShapeStackGame();
});