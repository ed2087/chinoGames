// Game loop and canvas management

class Engine {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.isRunning = false;
        this.isPaused = false;
        this.lastTime = 0;
        this.performance = new Performance();
        this.camera = new Camera();
        
        this.updateCallback = null;
        this.renderCallback = null;
        
        this.setupCanvas();
        this.setupEventListeners();
    }
    
    setupCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'planet-canvas';
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.zIndex = '1';
        this.canvas.style.touchAction = 'none';
        
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = true;
        
        document.body.appendChild(this.canvas);
        this.handleResize();
    }
    
    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
        
        // Touch events
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
        
        // Keyboard events
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
    }
    
    handleResize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.camera.setViewport(this.canvas.width, this.canvas.height);
    }
    
    start(updateCallback, renderCallback) {
        this.updateCallback = updateCallback;
        this.renderCallback = renderCallback;
        this.isRunning = true;
        this.isPaused = false;
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    pause() {
        this.isPaused = true;
    }
    
    resume() {
        this.isPaused = false;
        this.lastTime = performance.now();
    }
    
    stop() {
        this.isRunning = false;
    }
    
    gameLoop() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        this.performance.update();
        
        if (!this.isPaused) {
            // Update
            if (this.updateCallback) {
                this.updateCallback(deltaTime);
            }
            this.camera.update(deltaTime);
        }
        
        // Render
        this.ctx.save();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply camera transform
        this.camera.apply(this.ctx);
        
        if (this.renderCallback) {
            this.renderCallback(this.ctx);
        }
        
        this.ctx.restore();
        
        // Render UI elements that don't move with camera
        this.renderUI();
        
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    renderUI() {
        // FPS counter
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.font = '12px monospace';
        this.ctx.fillText(`FPS: ${this.performance.fps}`, 10, 20);
        
        // Pause indicator
        if (this.isPaused) {
            this.ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
            this.ctx.font = '16px monospace';
            this.ctx.fillText('PAUSED', 10, 50);
        }
    }
    
    // Input handling
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const worldPos = this.camera.screenToWorld(
            e.clientX - rect.left,
            e.clientY - rect.top
        );
        
        this.dispatchEvent('mousedown', {
            screen: { x: e.clientX - rect.left, y: e.clientY - rect.top },
            world: worldPos,
            button: e.button
        });
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const worldPos = this.camera.screenToWorld(
            e.clientX - rect.left,
            e.clientY - rect.top
        );
        
        this.dispatchEvent('mousemove', {
            screen: { x: e.clientX - rect.left, y: e.clientY - rect.top },
            world: worldPos
        });
    }
    
    handleMouseUp(e) {
        const rect = this.canvas.getBoundingClientRect();
        const worldPos = this.camera.screenToWorld(
            e.clientX - rect.left,
            e.clientY - rect.top
        );
        
        this.dispatchEvent('mouseup', {
            screen: { x: e.clientX - rect.left, y: e.clientY - rect.top },
            world: worldPos,
            button: e.button
        });
    }
    
    handleWheel(e) {
        e.preventDefault();
        this.camera.adjustZoom(e.deltaY > 0 ? 0.9 : 1.1);
    }
    
    handleTouchStart(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const touches = Array.from(e.touches).map(touch => ({
            screen: { x: touch.clientX - rect.left, y: touch.clientY - rect.top },
            world: this.camera.screenToWorld(touch.clientX - rect.left, touch.clientY - rect.top),
            id: touch.identifier
        }));
        
        this.dispatchEvent('touchstart', { touches });
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const touches = Array.from(e.touches).map(touch => ({
            screen: { x: touch.clientX - rect.left, y: touch.clientY - rect.top },
            world: this.camera.screenToWorld(touch.clientX - rect.left, touch.clientY - rect.top),
            id: touch.identifier
        }));
        
        this.dispatchEvent('touchmove', { touches });
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        this.dispatchEvent('touchend', {});
    }
    
    handleKeyDown(e) {
        this.dispatchEvent('keydown', { key: e.key, code: e.code });
    }
    
    handleKeyUp(e) {
        this.dispatchEvent('keyup', { key: e.key, code: e.code });
    }
    
    dispatchEvent(type, data) {
        const event = new CustomEvent(`engine-${type}`, { detail: data });
        document.dispatchEvent(event);
    }
}

class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.zoomLevel = 1;
        this.targetZoom = 1;
        this.viewportWidth = 0;
        this.viewportHeight = 0;
        this.isDragging = false;
        this.lastMousePos = { x: 0, y: 0 };
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.addEventListener('engine-mousedown', (e) => {
            if (e.detail.button === 1) { // Middle mouse button
                this.isDragging = true;
                this.lastMousePos = e.detail.screen;
            }
        });
        
        document.addEventListener('engine-mousemove', (e) => {
            if (this.isDragging) {
                const dx = e.detail.screen.x - this.lastMousePos.x;
                const dy = e.detail.screen.y - this.lastMousePos.y;
                this.x -= dx / this.zoomLevel;
                this.y -= dy / this.zoomLevel;
                this.lastMousePos = e.detail.screen;
            }
        });
        
        document.addEventListener('engine-mouseup', (e) => {
            if (e.detail.button === 1) {
                this.isDragging = false;
            }
        });
        
        // Touch panning
        let lastTouchDistance = null;
        let lastTouchCenter = null;
        
        document.addEventListener('engine-touchstart', (e) => {
            const touches = e.detail.touches;
            if (touches.length === 2) {
                lastTouchDistance = this.getTouchDistance(touches);
                lastTouchCenter = this.getTouchCenter(touches);
            } else if (touches.length === 1) {
                this.isDragging = true;
                this.lastMousePos = touches[0].screen;
            }
        });
        
        document.addEventListener('engine-touchmove', (e) => {
            const touches = e.detail.touches;
            if (touches.length === 2 && lastTouchDistance && lastTouchCenter) {
                // Pinch to zoom
                const distance = this.getTouchDistance(touches);
                const center = this.getTouchCenter(touches);
                const zoomFactor = distance / lastTouchDistance;
                this.zoomLevel *= zoomFactor;
                this.zoomLevel = Math.max(0.1, Math.min(5, this.zoomLevel));
                
                // Pan based on center movement
                const dx = center.x - lastTouchCenter.x;
                const dy = center.y - lastTouchCenter.y;
                this.x -= dx / this.zoomLevel;
                this.y -= dy / this.zoomLevel;
                
                lastTouchDistance = distance;
                lastTouchCenter = center;
            } else if (touches.length === 1 && this.isDragging) {
                const dx = touches[0].screen.x - this.lastMousePos.x;
                const dy = touches[0].screen.y - this.lastMousePos.y;
                this.x -= dx / this.zoomLevel;
                this.y -= dy / this.zoomLevel;
                this.lastMousePos = touches[0].screen;
            }
        });
        
        document.addEventListener('engine-touchend', () => {
            this.isDragging = false;
            lastTouchDistance = null;
            lastTouchCenter = null;
        });
    }
    
    getTouchDistance(touches) {
        const dx = touches[0].screen.x - touches[1].screen.x;
        const dy = touches[0].screen.y - touches[1].screen.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    getTouchCenter(touches) {
        return {
            x: (touches[0].screen.x + touches[1].screen.x) / 2,
            y: (touches[0].screen.y + touches[1].screen.y) / 2
        };
    }
    
    setViewport(width, height) {
        this.viewportWidth = width;
        this.viewportHeight = height;
    }
    
    update(deltaTime) {
        // Smooth zoom
        this.zoomLevel += (this.targetZoom - this.zoomLevel) * deltaTime * 5;
    }
    
    adjustZoom(factor) {
        this.targetZoom *= factor;
        this.targetZoom = Math.max(0.1, Math.min(5, this.targetZoom));
    }
    
    apply(ctx) {
        ctx.translate(this.viewportWidth / 2, this.viewportHeight / 2);
        ctx.scale(this.zoomLevel, this.zoomLevel);
        ctx.translate(-this.x, -this.y);
    }
    
    screenToWorld(screenX, screenY) {
        const worldX = (screenX - this.viewportWidth / 2) / this.zoomLevel + this.x;
        const worldY = (screenY - this.viewportHeight / 2) / this.zoomLevel + this.y;
        return new Vector2D(worldX, worldY);
    }
    
    worldToScreen(worldX, worldY) {
        const screenX = (worldX - this.x) * this.zoomLevel + this.viewportWidth / 2;
        const screenY = (worldY - this.y) * this.zoomLevel + this.viewportHeight / 2;
        return new Vector2D(screenX, screenY);
    }
}