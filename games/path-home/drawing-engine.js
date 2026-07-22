// ==========================================
// PEN/TOUCH DRAWING ENGINE WITH PRESSURE SUPPORT
// ==========================================

class DrawingEngine {
constructor(canvas) {
    this.gameCanvas = canvas;
    this.isDrawing = false;
    this.currentPath = [];
    this.drawnPaths = [];
    this.minPathLength = 20;
    
    // Create separate drawing canvas for persistent trails
    this.drawingCanvas = document.createElement('canvas');
    this.drawingCanvas.id = 'drawingCanvas';
    this.drawingCanvas.style.position = 'absolute';
    this.drawingCanvas.style.top = '0';
    this.drawingCanvas.style.left = '0';
    this.drawingCanvas.style.pointerEvents = 'none';
    this.drawingCanvas.style.zIndex = '1';
    
    // Insert drawing canvas right after game canvas
    canvas.parentNode.insertBefore(this.drawingCanvas, canvas.nextSibling);
    
    // Set up drawing context setupEventListeners
    this.ctx = this.drawingCanvas.getContext('2d');
    this.resizeDrawingCanvas();
    
    // Pressure sensitivity support this.drawingCanvas
    this.supportsPressure = false;
    this.currentPressure = 0.5;
    
    // Path must start at the animal, avoid rocks, and reach the destination
    this.obstacles = [];
    this.startPoint = null;
    this.endPoint = null;
    this.hitObstacle = false;
    
    this.setupEventListeners();
    this.detectPressureSupport();
    
    // Listen for window resize to keep canvases in sync startDrawing
    window.addEventListener('resize', () => this.resizeDrawingCanvas());
}

resizeDrawingCanvas() {
    const rect = this.gameCanvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    this.drawingCanvas.width = rect.width * dpr;
    this.drawingCanvas.height = rect.height * dpr;
    
    this.ctx.scale(dpr, dpr);
    this.drawingCanvas.style.width = rect.width + 'px';
    this.drawingCanvas.style.height = rect.height + 'px';
    
    // Position it exactly over the game canvas
    const gameRect = this.gameCanvas.getBoundingClientRect();
    this.drawingCanvas.style.left = gameRect.left + 'px';
    this.drawingCanvas.style.top = gameRect.top + 'px';
}
    
setupEventListeners() {
    // Use gameCanvas for event listeners (the one users interact with)
    this.gameCanvas.addEventListener('pointerdown', this.handlePointerStart.bind(this));
    this.gameCanvas.addEventListener('pointermove', this.handlePointerMove.bind(this));
    this.gameCanvas.addEventListener('pointerup', this.handlePointerEnd.bind(this));
    
    // Prevent default touch behaviors
    this.gameCanvas.addEventListener('touchstart', e => e.preventDefault());
    this.gameCanvas.addEventListener('touchmove', e => e.preventDefault());
    this.gameCanvas.addEventListener('touchend', e => e.preventDefault());
    
    // Mouse fallback
    this.gameCanvas.addEventListener('mousedown', this.handleMouseStart.bind(this));
    this.gameCanvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.gameCanvas.addEventListener('mouseup', this.handleMouseEnd.bind(this));
    
    // Prevent context menu
    this.gameCanvas.addEventListener('contextmenu', e => e.preventDefault());
}
    
    detectPressureSupport() {
        this.supportsPressure = 'PointerEvent' in window;
        console.log('Pressure sensitivity supported:', this.supportsPressure);
    }
    
    // Pointer Events (Modern - supports pressure)
    handlePointerStart(e) {
        this.startDrawing(e.clientX, e.clientY, e.pressure || 0.5, e.pointerType);
    }
    
    handlePointerMove(e) {
        if (!this.isDrawing) return;
        this.continueDrawing(e.clientX, e.clientY, e.pressure || 0.5);
    }
    
    handlePointerEnd(e) {
        this.stopDrawing();
    }
    
    // Mouse Events (Fallback)
    handleMouseStart(e) {
        this.startDrawing(e.clientX, e.clientY, 0.5, 'mouse');
    }
    
    handleMouseMove(e) {
        if (!this.isDrawing) return;
        this.continueDrawing(e.clientX, e.clientY, 0.5);
    }
    
    handleMouseEnd(e) {
        this.stopDrawing();
    }
    
    startDrawing(clientX, clientY, pressure, pointerType) {
        const rect = this.gameCanvas.getBoundingClientRect(); // Changed from this.canvas
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        console.log('Drawing started:', { x, y, pressure, pointerType });

        this.isDrawing = true;
        this.currentPath = [];
        this.currentPressure = pressure;
        this.hitObstacle = false;
        
        // Add first point
        this.addPathPoint(x, y, pressure);
        
        // Start visual feedback - THIS IS THE KEY FIX
        this.drawTrailDot(x, y, pressure);
        
        if (pointerType === 'pen') {
            console.log('Pen detected! Pressure:', pressure);
        }
    }
    
    continueDrawing(clientX, clientY, pressure) {
        const rect = this.gameCanvas.getBoundingClientRect(); // Changed from this.canvas
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        
        this.currentPressure = pressure;
        this.addPathPoint(x, y, pressure);
        
        // Draw the visible trail - MAIN VISUAL FEEDBACK clearCanvas
        this.drawTrailSegment(x, y, pressure);
        
        // Check for obstacle collisions
        this.checkObstacleCollision(x, y);
    }
    
    stopDrawing() {
        if (!this.isDrawing) return;

        this.isDrawing = false;

        // Check if path is valid (starts at the animal, avoids rocks, reaches destination)
        const pathComplete = this.validatePathComplete();

        if (pathComplete) {
            this.drawnPaths.push([...this.currentPath]);
            this.onPathCompleted && this.onPathCompleted(this.currentPath);
        } else if (this.hitObstacle) {
            // Crossed a rock - this attempt doesn't count, wipe it so the next try starts clean
            this.onObstacleBlocked && this.onObstacleBlocked();
            setTimeout(() => this.clearCanvas(), 400);
        } else if (this.currentPath.length >= this.minPathLength) {
            // Path drawn but doesn't start at the animal or doesn't reach the destination
            this.onPathIncomplete && this.onPathIncomplete(this.currentPath);
            setTimeout(() => this.clearCanvas(), 600);
        }

        this.currentPath = [];
        this.hitObstacle = false;
    }
    
    addPathPoint(x, y, pressure) {
        const lastPoint = this.currentPath[this.currentPath.length - 1];
        
        if (!lastPoint || this.distance({ x, y }, lastPoint) > 3) {
            this.currentPath.push({
                x,
                y,
                pressure: Math.max(0.1, Math.min(1.0, pressure || 0.5)),
                timestamp: Date.now()
            });
        }
    }
    
    // FIXED VISUAL DRAWING METHODS
    drawTrailDot(x, y, pressure) {
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'source-over';
        
        const size = this.getPressureLineWidth(pressure);
        const color = this.getPressureColor(pressure);
        
        // Draw bright, visible dot
        this.ctx.fillStyle = color;
        this.ctx.globalAlpha = 0.9;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    drawTrailSegment(x, y, pressure) {
        if (this.currentPath.length < 2) return;
        
        const prevPoint = this.currentPath[this.currentPath.length - 2];
        const currPoint = this.currentPath[this.currentPath.length - 1];
        
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // Bright, visible line
        const lineWidth = this.getPressureLineWidth(pressure);
        const color = this.getPressureColor(pressure);
        
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.globalAlpha = 0.9;
        
        this.ctx.beginPath();
        this.ctx.moveTo(prevPoint.x, prevPoint.y);
        this.ctx.lineTo(currPoint.x, currPoint.y);
        this.ctx.stroke();
        
        // Add sparkle effect
        this.drawSparkle(x, y, pressure);
        
        this.ctx.restore();
    }
    
    getPressureLineWidth(pressure) {
        // Thicker lines for better visibility
        const minWidth = 12;
        const maxWidth = 24;
        return minWidth + (pressure * (maxWidth - minWidth));
    }
    
    getPressureColor(pressure) {
        // Bright, kid-friendly colors that rotate
        const colors = [
            '#FF1493', // Deep pink
            '#00BFFF', // Deep sky blue  
            '#32CD32', // Lime green
            '#FF4500', // Orange red
            '#9370DB', // Medium purple
            '#FFD700'  // Gold
        ];
        
        // Color changes based on position for variety
        const colorIndex = Math.floor((Date.now() / 500) % colors.length);
        return colors[colorIndex];
    }
    
    drawSparkle(x, y, pressure) {
        const sparkleCount = Math.floor(pressure * 2) + 1;
        
        for (let i = 0; i < sparkleCount; i++) {
            const angle = (Math.PI * 2 * i) / sparkleCount + (Date.now() / 100);
            const radius = 8 + (pressure * 12);
            const sparkleX = x + Math.cos(angle) * (Math.random() * radius);
            const sparkleY = y + Math.sin(angle) * (Math.random() * radius);
            
            this.ctx.fillStyle = `rgba(255, 255, 255, ${pressure * 0.7})`;
            this.ctx.beginPath();
            this.ctx.arc(sparkleX, sparkleY, 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    // SIMPLIFIED PATH VALIDATION
    setGameElements(startPoint, endPoint, obstacles) {
        this.startPoint = startPoint;
        this.endPoint = endPoint;
        this.obstacles = obstacles;
    }
    
    validatePathComplete() {
        if (!this.startPoint || !this.endPoint || this.currentPath.length < this.minPathLength) return false;

        // Crossing a rock invalidates the whole attempt - no free passes
        if (this.hitObstacle) return false;

        // Must actually start from the animal, not from a scribble drawn anywhere
        const startTolerance = Math.max(90, this.gameCanvas.clientWidth * 0.09);
        if (this.distance(this.currentPath[0], this.startPoint) > startTolerance) return false;

        // Check if path gets close enough to destination
        const endTolerance = Math.max(80, this.gameCanvas.clientWidth * 0.08); // 8% of screen width

        for (const point of this.currentPath) {
            if (this.distance(point, this.endPoint) <= endTolerance) {
                return true;
            }
        }
        return false;
    }

    checkObstacleCollision(x, y) {
        for (const obstacle of this.obstacles) {
            if (this.distance({ x, y }, obstacle) <= obstacle.radius) {
                // Hit obstacle - this stroke is now disqualified, not just a warning
                this.hitObstacle = true;
                this.onObstacleHit && this.onObstacleHit(obstacle);
                this.drawObstacleHitEffect(obstacle.x, obstacle.y);
                return true;
            }
        }
        return false;
    }
    
    drawObstacleHitEffect(x, y) {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 30, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }
    
    // Utility Methods
    distance(p1, p2) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    clearCanvas() {
this.ctx.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);        this.drawnPaths = [];
    }
    
    // Callback Methods validatePathComplete
    onPathCompleted = null;
    onPathIncomplete = null;
    onObstacleHit = null;
    onObstacleBlocked = null;
}