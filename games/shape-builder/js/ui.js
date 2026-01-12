// ==========================================
// UI CONTROLLER AND INTERACTION HANDLING
// ==========================================

class UIController {
    constructor(shapeManager, physics, particles) {
        this.shapeManager = shapeManager;
        this.physics = physics;
        this.particles = particles;
        
        this.canvas = shapeManager.canvas;
        this.palette = document.getElementById('shapePalette');
        this.resetBtn = document.getElementById('resetBtn');
        
        // Drag state
        this.isDragging = false;
        this.dragBody = null;
        this.dragOffset = { x: 0, y: 0 };
        this.dragStartTime = 0;
        this.dragStartPos = { x: 0, y: 0 };
        
        // UI state finishDrag
        this.dangerZones = {
            left: document.querySelector('.danger-zone.left'),
            right: document.querySelector('.danger-zone.right')
        };
        
        this.setupEventListeners();
        console.log('UI controller initialized');
    }
    
    setupEventListeners() {
        // Canvas interaction events
        this.canvas.addEventListener('touchstart', this.handlePointerStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this.handlePointerMove.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.handlePointerEnd.bind(this), { passive: false });
        
        this.canvas.addEventListener('mousedown', this.handlePointerStart.bind(this));
        this.canvas.addEventListener('mousemove', this.handlePointerMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handlePointerEnd.bind(this));
        
        // Palette events
        this.palette.addEventListener('touchstart', this.handlePaletteStart.bind(this), { passive: false });
        this.palette.addEventListener('touchmove', this.handlePaletteMove.bind(this), { passive: false });
        this.palette.addEventListener('touchend', this.handlePaletteEnd.bind(this), { passive: false });
        
        this.palette.addEventListener('mousedown', this.handlePaletteStart.bind(this));
        this.palette.addEventListener('mousemove', this.handlePaletteMove.bind(this));
        this.palette.addEventListener('mouseup', this.handlePaletteEnd.bind(this));
        
        // Reset button
        this.resetBtn.addEventListener('click', this.handleReset.bind(this));
        
        // Prevent context menu and selection
        this.canvas.addEventListener('contextmenu', e => e.preventDefault());
        document.addEventListener('selectstart', e => e.preventDefault());
        
        // Window resize
        window.addEventListener('resize', this.handleResize.bind(this));
    }
    
    // ==========================================
    // PALETTE INTERACTION (Shape Creation)
    // ==========================================
    
    handlePaletteStart(e) {
        e.preventDefault();
        
        const target = e.target.closest('.palette-shape');
        if (!target) return;
        
        const shapeType = target.dataset.shape;
        if (!shapeType) return;
        
        // Visual feedback
        target.classList.add('dragging');
        
        // Get pointer position
        const pos = this.getEventPos(e);
        
        // Create shape at pointer position (above palette)
        const canvasRect = this.canvas.getBoundingClientRect();
        const shapeX = pos.x;
        const shapeY = Math.min(pos.y, canvasRect.height - 150); // Keep above palette
        
        // Create the shape
        const body = this.shapeManager.createShape(shapeType, shapeX, shapeY);
        
        if (body) {
            // Start dragging the new shape immediately
            this.isDragging = true;
            this.dragBody = body;
            this.dragStartTime = Date.now();
            this.dragStartPos = { x: shapeX, y: shapeY };
            this.dragOffset = { x: 0, y: 0 }; // No offset since we created it at cursor
            
            // Make it static while dragging
            this.physics.setStatic(body, true);
            
            // Play creation sound
            this.playSound('create');
            
            console.log(`Created and started dragging ${shapeType}`);
        }
    }
    
    handlePaletteMove(e) {
        if (!this.isDragging || !this.dragBody) return;
        
        e.preventDefault();
        
        const pos = this.getEventPos(e);
        const canvasRect = this.canvas.getBoundingClientRect();
        
        // Update shape position
        if (pos.x >= 0 && pos.x <= canvasRect.width && 
            pos.y >= 0 && pos.y <= canvasRect.height - 100) {
            this.physics.setPosition(this.dragBody, pos.x, pos.y);
        }
        
        // Update danger zones
        this.updateDangerZones(pos.x);
    }
    
    handlePaletteEnd(e) {
        // Clean up palette visual state
        const draggingElements = this.palette.querySelectorAll('.dragging');
        draggingElements.forEach(el => el.classList.remove('dragging'));
        
        if (this.isDragging && this.dragBody) {
            this.finishDrag(e);
        }
    }
    
    // ==========================================
    // CANVAS INTERACTION (Shape Manipulation)
    // ==========================================
    
    handlePointerStart(e) {
        if (this.isDragging) return; // Already dragging from palette
        
        e.preventDefault();
        
        const pos = this.getEventPos(e);
        const body = this.shapeManager.getShapeAt(pos.x, pos.y);
        
        if (body && body.isUserShape) {
            this.isDragging = true;
            this.dragBody = body;
            this.dragStartTime = Date.now();
            this.dragStartPos = { x: pos.x, y: pos.y };
            
            // Calculate offset from body center
            this.dragOffset = {
                x: pos.x - body.position.x,
                y: pos.y - body.position.y
            };
            
            // Make static while dragging
            this.physics.setStatic(body, true);
            
            // Play pickup sound
            this.playSound('pickup');
            
            console.log(`Started dragging existing ${body.shapeType}`);
        }
    }
    
    handlePointerMove(e) {
        if (!this.isDragging || !this.dragBody) return;
        
        e.preventDefault();
        
        const pos = this.getEventPos(e);
        
        // Update position with offset
        const newX = pos.x - this.dragOffset.x;
        const newY = pos.y - this.dragOffset.y;
        
        this.physics.setPosition(this.dragBody, newX, newY);
        
        // Update danger zones
        this.updateDangerZones(newX);
    }
    
    handlePointerEnd(e) {
        if (this.isDragging && this.dragBody) {
            this.finishDrag(e);
        }
    }
    
finishDrag(e) {
    const pos = this.getEventPos(e);
    const dragDuration = Date.now() - this.dragStartTime;
    const canvasRect = this.canvas.getBoundingClientRect();
    
    // Calculate throw velocity with better sensitivity
    let throwForce = { x: 0, y: 0 };
    
    if (dragDuration < 500) { // Increased time window for throws
        const deltaX = pos.x - this.dragStartPos.x;
        const deltaY = pos.y - this.dragStartPos.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Only apply force if there was significant movement
        if (distance > 20) {
            const forceMultiplier = 0.0003; // Increased force multiplier
            
            throwForce = {
                x: deltaX * forceMultiplier,
                y: deltaY * forceMultiplier
            };
        }
    }
    
    // Re-enable physics
    this.physics.setStatic(this.dragBody, false);
    
    // Apply throw force
    if (Math.abs(throwForce.x) > 0.001 || Math.abs(throwForce.y) > 0.001) {
        this.physics.applyForce(this.dragBody, throwForce);
        this.playSound('throw');
        console.log(`Applied throw force: ${throwForce.x}, ${throwForce.y}`);
    } else {
        this.playSound('drop');
    }
    
    // Reset drag state
    this.isDragging = false;
    this.dragBody = null;
    this.dragOffset = { x: 0, y: 0 };
    
    // Hide danger zones
    this.hideDangerZones();
    
    console.log('Finished dragging');
}
    
    // ==========================================
    // DANGER ZONE VISUAL FEEDBACK
    // ==========================================
    
    updateDangerZones(x) {
        const canvasRect = this.canvas.getBoundingClientRect();
        const dangerThreshold = 80;
        
        // Left danger zone
        if (x < dangerThreshold) {
            this.dangerZones.left.classList.add('active');
            if (x < dangerThreshold * 0.5) {
                this.dangerZones.left.classList.add('warning');
            }
        } else {
            this.dangerZones.left.classList.remove('active', 'warning');
        }
        
        // Right danger zone
        if (x > canvasRect.width - dangerThreshold) {
            this.dangerZones.right.classList.add('active');
            if (x > canvasRect.width - dangerThreshold * 0.5) {
                this.dangerZones.right.classList.add('warning');
            }
        } else {
            this.dangerZones.right.classList.remove('active', 'warning');
        }
    }
    
    hideDangerZones() {
        this.dangerZones.left.classList.remove('active', 'warning');
        this.dangerZones.right.classList.remove('active', 'warning');
    }
    
    // ==========================================
    // UTILITY METHODS
    // ==========================================
    
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
    
    handleReset() {
        // Clear all shapes
        this.shapeManager.clear();
        this.particles.clear();
        
        // Reset UI state
        this.isDragging = false;
        this.dragBody = null;
        this.hideDangerZones();
        
        // Play reset sound
        this.playSound('reset');
        
        // Voice feedback
        if (window.audioSystem?.isInitialized) {
            window.audioSystem.speak('All cleared! Ready to build something new!');
        }
        
        console.log('Game reset');
    }
    
    handleResize() {
        setTimeout(() => {
            const rect = this.canvas.getBoundingClientRect();
            
            // Update canvas size
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
            
            // Update physics boundaries
            this.physics.resize(rect.width, rect.height);
            
            console.log(`Resized to ${rect.width}x${rect.height}`);
        }, 100);
    }
    
    playSound(type) {
        if (!window.audioSystem?.audioContext) return;
        
        try {
            const audioCtx = window.audioSystem.audioContext;
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            switch (type) {
                case 'create':
                    oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
                    oscillator.frequency.linearRampToValueAtTime(800, audioCtx.currentTime + 0.1);
                    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
                    break;
                    
                case 'pickup':
                    oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
                    oscillator.frequency.linearRampToValueAtTime(600, audioCtx.currentTime + 0.05);
                    gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
                    break;
                    
                case 'drop':
                    oscillator.frequency.setValueAtTime(300, audioCtx.currentTime);
                    gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
                    oscillator.type = 'square';
                    break;
                    
                case 'throw':
                    oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.2);
                    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
                    break;
                    
                case 'reset':
                    // Descending scale
                    for (let i = 0; i < 4; i++) {
                        setTimeout(() => {
                            const osc = audioCtx.createOscillator();
                            const gain = audioCtx.createGain();
                            osc.connect(gain);
                            gain.connect(audioCtx.destination);
                            osc.frequency.setValueAtTime([400, 350, 300, 250][i], audioCtx.currentTime);
                            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
                            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
                            osc.start();
                            osc.stop(audioCtx.currentTime + 0.1);
                        }, i * 50);
                    }
                    return;
            }
            
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.3);
            
        } catch (error) {
            console.warn('UI sound failed:', error);
        }
    }
    
    // Public methods for external control
    setDragEnabled(enabled) {
        this.dragEnabled = enabled;
    }
    
    getCurrentDragBody() {
        return this.isDragging ? this.dragBody : null;
    }
}

window.UIController = UIController;