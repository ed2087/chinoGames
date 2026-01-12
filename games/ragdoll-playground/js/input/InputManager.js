// ==========================================
// INPUT MANAGER - UNIFIED INPUT HANDLING
// Handles mouse, touch, and keyboard input with device-specific optimizations
// ==========================================

class InputManager {
    
    constructor(canvas, dragSystem = null, physicsEngine = null) {
        this.canvas = canvas;
        this.dragSystem = dragSystem;
        this.physics = physicsEngine;
        this.mathUtils = window.MathUtils;
        this.deviceUtils = window.DeviceUtils;
        
        // Get device-optimized settings
        const touchSettings = this.deviceUtils.getTouchSettings();
        
        // Input configuration
        this.config = {
            // Touch/mouse settings
            tapThreshold: touchSettings.tapThreshold,
            longPressThreshold: 800, // ms for long press
            doubleTapThreshold: 300, // ms between taps
            swipeThreshold: 50, // pixels for swipe detection
            
            // Multi-touch settings
            enableMultiTouch: touchSettings.enableMultiTouch,
            maxTouchPoints: touchSettings.maxSimultaneousTouch,
            enablePinchZoom: false, // Disabled for ragdoll playground
            enableRotation: false, // Keep simple for kids
            
            // Gesture settings
            enableSwipeGestures: true,
            enableLongPress: true,
            enableDoubleTap: true,
            
            // Performance settings
            inputThrottling: this.deviceUtils.device.isDesktop ? false : true,
            throttleInterval: 16, // ~60fps
            
            // Visual feedback
            showTouchIndicators: true,
            touchIndicatorDuration: 500,
            
            // Accessibility
            largeTargets: this.deviceUtils.device.isTablet,
            highContrast: false
        };
        
        // Input state tracking
        this.pointers = new Map(); // pointerId -> pointer data
        this.touches = new Map(); // touch ID -> touch data
        this.mouse = {
            isDown: false,
            position: { x: 0, y: 0 },
            lastPosition: { x: 0, y: 0 },
            button: -1,
            dragStartPosition: null,
            dragStartTime: 0
        };
        
        // Gesture detection
        this.gestures = {
            taps: [],
            longPresses: new Map(),
            swipes: new Map(),
            multiTouchGestures: new Map()
        };
        
        // Event listeners storage for cleanup
        this.eventListeners = [];
        
        // Visual feedback elements
        this.touchIndicators = [];
        
        // Performance throttling
        this.lastInputTime = 0;
        this.inputQueue = [];
        
        // Canvas bounds caching
        this.canvasBounds = null;
        this.boundsUpdateTime = 0;
        
        this.init();
    }
    
    // ==========================================
    // INITIALIZATION
    // ==========================================
    
    init() {
        console.log('🎮 Initializing InputManager...');
        
        // Update canvas bounds
        this.updateCanvasBounds();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Set up resize handling
        this.setupResizeHandling();
        
        // Initialize visual feedback
        this.initVisualFeedback();
        
        console.log('✅ InputManager initialized');
        console.log(`📱 Multi-touch enabled: ${this.config.enableMultiTouch}`);
        console.log(`🎯 Max touch points: ${this.config.maxTouchPoints}`);
    }
    
    setupEventListeners() {
        // Mouse events
        this.addEventListeners('mouse');
        
        // Touch events
        if (this.deviceUtils.capabilities.touchEvents) {
            this.addEventListeners('touch');
        }
        
        // Pointer events (if available and preferred)
        if (this.deviceUtils.capabilities.pointerEvents && this.config.enableMultiTouch) {
            this.addEventListeners('pointer');
        }
        
        // Keyboard events
        this.addEventListeners('keyboard');
        
        // Prevent context menu and other browser defaults
        this.preventDefaults();
    }
    
    addEventListeners(type) {
        const events = this.getEventsByType(type);
        
        for (const [eventName, handler] of events) {
            const boundHandler = handler.bind(this);
            
            // Add with proper options
            const options = this.getEventOptions(eventName);
            this.canvas.addEventListener(eventName, boundHandler, options);
            
            // Store for cleanup
            this.eventListeners.push({ 
                element: this.canvas, 
                event: eventName, 
                handler: boundHandler, 
                options 
            });
        }
    }
    
    getEventsByType(type) {
        const eventMaps = {
            mouse: [
                ['mousedown', this.handleMouseDown],
                ['mousemove', this.handleMouseMove],
                ['mouseup', this.handleMouseUp],
                ['wheel', this.handleWheel],
                ['contextmenu', this.handleContextMenu]
            ],
            
            touch: [
                ['touchstart', this.handleTouchStart],
                ['touchmove', this.handleTouchMove],
                ['touchend', this.handleTouchEnd],
                ['touchcancel', this.handleTouchCancel]
            ],
            
            pointer: [
                ['pointerdown', this.handlePointerDown],
                ['pointermove', this.handlePointerMove],
                ['pointerup', this.handlePointerUp],
                ['pointercancel', this.handlePointerCancel]
            ],
            
            keyboard: [
                ['keydown', this.handleKeyDown],
                ['keyup', this.handleKeyUp]
            ]
        };
        
        return eventMaps[type] || [];
    }
    
    getEventOptions(eventName) {
        // Use passive listeners for performance where possible
        const passiveEvents = ['touchstart', 'touchmove', 'wheel'];
        const nonPassiveEvents = ['touchstart', 'touchmove']; // Override for prevention
        
        if (nonPassiveEvents.includes(eventName)) {
            return { passive: false }; // Need to prevent default
        }
        
        if (passiveEvents.includes(eventName)) {
            return { passive: true }; // Performance optimization
        }
        
        return false; // Default behavior
    }
    
    preventDefaults() {
        // Prevent context menu on long press
        const preventContext = (e) => {
            e.preventDefault();
            return false;
        };
        
        this.canvas.addEventListener('contextmenu', preventContext);
        this.eventListeners.push({ 
            element: this.canvas, 
            event: 'contextmenu', 
            handler: preventContext 
        });
        
        // Prevent drag on images
        this.canvas.addEventListener('dragstart', (e) => e.preventDefault());
        
        // Prevent selection
        this.canvas.style.userSelect = 'none';
        this.canvas.style.webkitUserSelect = 'none';
        this.canvas.style.webkitTouchCallout = 'none';
    }
    
    setupResizeHandling() {
        const handleResize = () => {
            this.updateCanvasBounds();
        };
        
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', () => {
            setTimeout(handleResize, 100); // Delay for orientation change
        });
        
        this.eventListeners.push({ 
            element: window, 
            event: 'resize', 
            handler: handleResize 
        });
    }
    
    initVisualFeedback() {
        // Set up visual feedback system
        this.touchIndicators = [];
        
        // Create style for touch indicators if needed
        if (this.config.showTouchIndicators && !document.getElementById('touchIndicatorStyle')) {
            const style = document.createElement('style');
            style.id = 'touchIndicatorStyle';
            style.textContent = `
                .touch-indicator {
                    position: absolute;
                    pointer-events: none;
                    border: 2px solid #3498db;
                    border-radius: 50%;
                    background: rgba(52, 152, 219, 0.1);
                    transform: translate(-50%, -50%);
                    animation: touchPulse 0.5s ease-out;
                }
                
                @keyframes touchPulse {
                    0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
                    100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // ==========================================
    // COORDINATE CONVERSION
    // ==========================================
    
    updateCanvasBounds() {
        this.canvasBounds = this.canvas.getBoundingClientRect();
        this.boundsUpdateTime = Date.now();
    }
    
    screenToCanvas(screenX, screenY) {
        // Update bounds if stale (1 second)
        if (Date.now() - this.boundsUpdateTime > 1000) {
            this.updateCanvasBounds();
        }
        
        return {
            x: (screenX - this.canvasBounds.left) * (this.canvas.width / this.canvasBounds.width),
            y: (screenY - this.canvasBounds.top) * (this.canvas.height / this.canvasBounds.height)
        };
    }
    
    canvasToScreen(canvasX, canvasY) {
        if (Date.now() - this.boundsUpdateTime > 1000) {
            this.updateCanvasBounds();
        }
        
        return {
            x: (canvasX * this.canvasBounds.width / this.canvas.width) + this.canvasBounds.left,
            y: (canvasY * this.canvasBounds.height / this.canvas.height) + this.canvasBounds.top
        };
    }
    
    // ==========================================
    // MOUSE EVENT HANDLERS
    // ==========================================
    
    handleMouseDown(event) {
        if (this.shouldThrottleInput()) return;
        
        const position = this.screenToCanvas(event.clientX, event.clientY);
        
        this.mouse.isDown = true;
        this.mouse.position = position;
        this.mouse.lastPosition = position;
        this.mouse.button = event.button;
        this.mouse.dragStartPosition = position;
        this.mouse.dragStartTime = Date.now();
        
        // Create pointer data for unified handling
        const pointerData = {
            pointerId: 'mouse',
            position: position,
            startPosition: position,
            startTime: Date.now(),
            type: 'mouse',
            button: event.button
        };
        
        this.pointers.set('mouse', pointerData);
        
        // Start drag if drag system available
        if (this.dragSystem && event.button === 0) { // Left button only
            this.dragSystem.startDrag('mouse', position);
        }
        
        // Visual feedback
        this.createTouchIndicator(position, 'mouse');
        
        // Emit event
        this.emitInputEvent('pointerDown', {
            pointerId: 'mouse',
            position: position,
            button: event.button,
            originalEvent: event
        });
        
        // Prevent default for left button
        if (event.button === 0) {
            event.preventDefault();
        }
    }
    
    handleMouseMove(event) {
        const position = this.screenToCanvas(event.clientX, event.clientY);
        
        this.mouse.lastPosition = this.mouse.position;
        this.mouse.position = position;
        
        // Update pointer data
        if (this.pointers.has('mouse')) {
            this.pointers.get('mouse').position = position;
        }
        
        // Handle dragging
        if (this.mouse.isDown && this.dragSystem) {
            this.dragSystem.updateDrag('mouse', position);
        }
        
        // Emit move event
        this.emitInputEvent('pointerMove', {
            pointerId: 'mouse',
            position: position,
            isDown: this.mouse.isDown,
            originalEvent: event
        });
    }
    
    handleMouseUp(event) {
        if (!this.mouse.isDown) return;
        
        const position = this.screenToCanvas(event.clientX, event.clientY);
        const endTime = Date.now();
        const duration = endTime - this.mouse.dragStartTime;
        
        this.mouse.isDown = false;
        
        // Handle drag end
        if (this.dragSystem) {
            this.dragSystem.endDrag('mouse');
        }
        
        // Handle tap/click
        const distance = this.mathUtils.distance(this.mouse.dragStartPosition, position);
        if (distance < this.config.tapThreshold && duration < 500) {
            this.handleTap('mouse', position, duration);
        }
        
        // Clean up pointer
        this.pointers.delete('mouse');
        
        // Emit event
        this.emitInputEvent('pointerUp', {
            pointerId: 'mouse',
            position: position,
            duration: duration,
            distance: distance,
            originalEvent: event
        });
    }
    
    handleWheel(event) {
        const position = this.screenToCanvas(event.clientX, event.clientY);
        
        // Emit wheel event
        this.emitInputEvent('wheel', {
            position: position,
            deltaX: event.deltaX,
            deltaY: event.deltaY,
            deltaZ: event.deltaZ,
            originalEvent: event
        });
        
        // Prevent page scrolling
        event.preventDefault();
    }
    
    handleContextMenu(event) {
        event.preventDefault();
        return false;
    }
    
    // ==========================================
    // TOUCH EVENT HANDLERS
    // ==========================================
    
    handleTouchStart(event) {
        if (this.shouldThrottleInput()) return;
        
        event.preventDefault(); // Prevent scrolling/zooming
        
        const touches = event.changedTouches;
        
        for (let i = 0; i < touches.length; i++) {
            const touch = touches[i];
            const position = this.screenToCanvas(touch.clientX, touch.clientY);
            const touchId = touch.identifier;
            
            // Check max touch points
            if (this.touches.size >= this.config.maxTouchPoints) {
                console.log('🚫 Maximum touch points reached');
                continue;
            }
            
            // Create touch data
            const touchData = {
                touchId: touchId,
                pointerId: `touch-${touchId}`,
                position: position,
                startPosition: position,
                startTime: Date.now(),
                type: 'touch',
                force: touch.force || 1.0,
                radiusX: touch.radiusX || 10,
                radiusY: touch.radiusY || 10
            };
            
            this.touches.set(touchId, touchData);
            this.pointers.set(touchData.pointerId, touchData);
            
            // Start drag
            if (this.dragSystem) {
                this.dragSystem.startDrag(touchData.pointerId, position, {
                    touchRadius: Math.max(touchData.radiusX, touchData.radiusY)
                });
            }
            
            // Visual feedback
            this.createTouchIndicator(position, 'touch', {
                radius: Math.max(touchData.radiusX, touchData.radiusY)
            });
            
            // Start long press detection
            this.startLongPressDetection(touchData);
            
            // Emit event
            this.emitInputEvent('pointerDown', {
                pointerId: touchData.pointerId,
                position: position,
                touchId: touchId,
                force: touchData.force,
                originalEvent: event
            });
        }
        
        // Check for multi-touch gestures
        if (this.touches.size > 1 && this.config.enableMultiTouch) {
            this.startMultiTouchGesture(event);
        }
    }
    
    handleTouchMove(event) {
        event.preventDefault();
        
        const touches = event.changedTouches;
        
        for (let i = 0; i < touches.length; i++) {
            const touch = touches[i];
            const touchId = touch.identifier;
            const touchData = this.touches.get(touchId);
            
            if (!touchData) continue;
            
            const position = this.screenToCanvas(touch.clientX, touch.clientY);
            
            // Update touch data
            touchData.lastPosition = touchData.position;
            touchData.position = position;
            touchData.force = touch.force || 1.0;
            
            // Update pointer data
            if (this.pointers.has(touchData.pointerId)) {
                this.pointers.get(touchData.pointerId).position = position;
            }
            
            // Update drag
            if (this.dragSystem) {
                this.dragSystem.updateDrag(touchData.pointerId, position);
            }
            
            // Cancel long press if moved too far
            const moveDistance = this.mathUtils.distance(touchData.startPosition, position);
            if (moveDistance > this.config.tapThreshold) {
                this.cancelLongPress(touchData);
            }
            
            // Emit event
            this.emitInputEvent('pointerMove', {
                pointerId: touchData.pointerId,
                position: position,
                touchId: touchId,
                force: touchData.force,
                originalEvent: event
            });
        }
        
        // Update multi-touch gestures
        if (this.touches.size > 1) {
            this.updateMultiTouchGesture(event);
        }
    }
    
    handleTouchEnd(event) {
        event.preventDefault();
        
        const touches = event.changedTouches;
        
        for (let i = 0; i < touches.length; i++) {
            const touch = touches[i];
            const touchId = touch.identifier;
            const touchData = this.touches.get(touchId);
            
            if (!touchData) continue;
            
            const position = this.screenToCanvas(touch.clientX, touch.clientY);
            const endTime = Date.now();
            const duration = endTime - touchData.startTime;
            const distance = this.mathUtils.distance(touchData.startPosition, position);
            
            // Handle drag end
            if (this.dragSystem) {
                this.dragSystem.endDrag(touchData.pointerId);
            }
            
            // Handle tap
// Handle tap
            if (distance < this.config.tapThreshold && duration < 800) {
                this.handleTap(touchData.pointerId, position, duration);
            } else if (distance > this.config.swipeThreshold && this.config.enableSwipeGestures) {
                // Handle swipe
                this.handleSwipe(touchData, position, duration);
            }
            
            // Cancel long press
            this.cancelLongPress(touchData);
            
            // Clean up
            this.touches.delete(touchId);
            this.pointers.delete(touchData.pointerId);
            
            // Emit event
            this.emitInputEvent('pointerUp', {
                pointerId: touchData.pointerId,
                position: position,
                touchId: touchId,
                duration: duration,
                distance: distance,
                originalEvent: event
            });
        }
        
        // End multi-touch gestures
        if (this.touches.size <= 1) {
            this.endMultiTouchGesture(event);
        }
    }
    
    handleTouchCancel(event) {
        event.preventDefault();
        
        const touches = event.changedTouches;
        
        for (let i = 0; i < touches.length; i++) {
            const touch = touches[i];
            const touchId = touch.identifier;
            const touchData = this.touches.get(touchId);
            
            if (!touchData) continue;
            
            // Cancel drag
            if (this.dragSystem) {
                this.dragSystem.cancelDrag(touchData.pointerId);
            }
            
            // Cancel long press
            this.cancelLongPress(touchData);
            
            // Clean up
            this.touches.delete(touchId);
            this.pointers.delete(touchData.pointerId);
            
            // Emit event
            this.emitInputEvent('pointerCancel', {
                pointerId: touchData.pointerId,
                touchId: touchId,
                originalEvent: event
            });
        }
        
        // Cancel multi-touch gestures
        this.cancelMultiTouchGestures();
    }
    
    // ==========================================
    // POINTER EVENT HANDLERS (UNIFIED)
    // ==========================================
    
    handlePointerDown(event) {
        if (this.shouldThrottleInput()) return;
        
        const position = this.screenToCanvas(event.clientX, event.clientY);
        const pointerId = event.pointerId;
        
        // Create unified pointer data
        const pointerData = {
            pointerId: pointerId,
            position: position,
            startPosition: position,
            startTime: Date.now(),
            type: event.pointerType, // 'mouse', 'touch', 'pen'
            pressure: event.pressure || 0.5,
            width: event.width || 10,
            height: event.height || 10,
            button: event.button
        };
        
        this.pointers.set(pointerId, pointerData);
        
        // Start drag
        if (this.dragSystem) {
            this.dragSystem.startDrag(pointerId, position, {
                pressure: pointerData.pressure,
                pointerType: event.pointerType
            });
        }
        
        // Visual feedback
        this.createTouchIndicator(position, event.pointerType, {
            pressure: pointerData.pressure
        });
        
        // Start long press for non-mouse pointers
        if (event.pointerType !== 'mouse') {
            this.startLongPressDetection(pointerData);
        }
        
        // Emit event
        this.emitInputEvent('pointerDown', {
            pointerId: pointerId,
            position: position,
            pointerType: event.pointerType,
            pressure: pointerData.pressure,
            originalEvent: event
        });
        
        event.preventDefault();
    }
    
    handlePointerMove(event) {
        const pointerId = event.pointerId;
        const pointerData = this.pointers.get(pointerId);
        
        if (!pointerData) return;
        
        const position = this.screenToCanvas(event.clientX, event.clientY);
        
        // Update pointer data
        pointerData.lastPosition = pointerData.position;
        pointerData.position = position;
        pointerData.pressure = event.pressure || 0.5;
        
        // Update drag
        if (this.dragSystem) {
            this.dragSystem.updateDrag(pointerId, position);
        }
        
        // Cancel long press if moved
        const moveDistance = this.mathUtils.distance(pointerData.startPosition, position);
        if (moveDistance > this.config.tapThreshold) {
            this.cancelLongPress(pointerData);
        }
        
        // Emit event
        this.emitInputEvent('pointerMove', {
            pointerId: pointerId,
            position: position,
            pointerType: event.pointerType,
            pressure: pointerData.pressure,
            originalEvent: event
        });
    }
    
    handlePointerUp(event) {
        const pointerId = event.pointerId;
        const pointerData = this.pointers.get(pointerId);
        
        if (!pointerData) return;
        
        const position = this.screenToCanvas(event.clientX, event.clientY);
        const endTime = Date.now();
        const duration = endTime - pointerData.startTime;
        const distance = this.mathUtils.distance(pointerData.startPosition, position);
        
        // Handle drag end
        if (this.dragSystem) {
            this.dragSystem.endDrag(pointerId);
        }
        
        // Handle tap
        if (distance < this.config.tapThreshold && duration < 800) {
            this.handleTap(pointerId, position, duration);
        }
        
        // Cancel long press
        this.cancelLongPress(pointerData);
        
        // Clean up
        this.pointers.delete(pointerId);
        
        // Emit event
        this.emitInputEvent('pointerUp', {
            pointerId: pointerId,
            position: position,
            pointerType: event.pointerType,
            duration: duration,
            distance: distance,
            originalEvent: event
        });
    }
    
    handlePointerCancel(event) {
        const pointerId = event.pointerId;
        const pointerData = this.pointers.get(pointerId);
        
        if (!pointerData) return;
        
        // Cancel drag
        if (this.dragSystem) {
            this.dragSystem.cancelDrag(pointerId);
        }
        
        // Cancel long press
        this.cancelLongPress(pointerData);
        
        // Clean up
        this.pointers.delete(pointerId);
        
        // Emit event
        this.emitInputEvent('pointerCancel', {
            pointerId: pointerId,
            originalEvent: event
        });
    }
    
    // ==========================================
    // KEYBOARD EVENT HANDLERS
    // ==========================================
    
    handleKeyDown(event) {
        // Emit keyboard event
        this.emitInputEvent('keyDown', {
            key: event.key,
            code: event.code,
            altKey: event.altKey,
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey,
            shiftKey: event.shiftKey,
            originalEvent: event
        });
        
        // Handle special keys
        switch (event.code) {
            case 'Space':
                // Space bar actions
                this.emitInputEvent('spacePressed', { originalEvent: event });
                event.preventDefault();
                break;
                
            case 'Escape':
                // Cancel all drags
                if (this.dragSystem) {
                    this.dragSystem.cancelAllDrags();
                }
                this.emitInputEvent('escapePressed', { originalEvent: event });
                break;
                
            case 'KeyR':
                // Reset shortcut
                if (event.ctrlKey || event.metaKey) {
                    this.emitInputEvent('resetRequested', { originalEvent: event });
                    event.preventDefault();
                }
                break;
        }
    }
    
    handleKeyUp(event) {
        this.emitInputEvent('keyUp', {
            key: event.key,
            code: event.code,
            originalEvent: event
        });
    }
    
    // ==========================================
    // GESTURE DETECTION
    // ==========================================
    
    /**
     * Handle tap/click gestures
     */
    handleTap(pointerId, position, duration) {
        const now = Date.now();
        
        // Add to tap history
        this.gestures.taps.push({
            pointerId: pointerId,
            position: position,
            timestamp: now,
            duration: duration
        });
        
        // Clean old taps
        this.gestures.taps = this.gestures.taps.filter(
            tap => now - tap.timestamp < this.config.doubleTapThreshold * 2
        );
        
        // Check for double tap
        if (this.config.enableDoubleTap && this.gestures.taps.length >= 2) {
            const lastTap = this.gestures.taps[this.gestures.taps.length - 1];
            const prevTap = this.gestures.taps[this.gestures.taps.length - 2];
            
            const timeDiff = lastTap.timestamp - prevTap.timestamp;
            const distance = this.mathUtils.distance(lastTap.position, prevTap.position);
            
            if (timeDiff < this.config.doubleTapThreshold && distance < this.config.tapThreshold) {
                this.emitInputEvent('doubleTap', {
                    pointerId: pointerId,
                    position: position,
                    timeBetween: timeDiff
                });
                
                // Clear taps to prevent triple tap
                this.gestures.taps = [];
                return;
            }
        }
        
        // Single tap
        this.emitInputEvent('tap', {
            pointerId: pointerId,
            position: position,
            duration: duration
        });
    }
    
    /**
     * Start long press detection
     */
    startLongPressDetection(pointerData) {
        if (!this.config.enableLongPress) return;
        
        const timeoutId = setTimeout(() => {
            // Check if pointer is still down and hasn't moved much
            const currentPointer = this.pointers.get(pointerData.pointerId);
            if (currentPointer) {
                const distance = this.mathUtils.distance(
                    pointerData.startPosition, 
                    currentPointer.position
                );
                
                if (distance < this.config.tapThreshold) {
                    this.emitInputEvent('longPress', {
                        pointerId: pointerData.pointerId,
                        position: currentPointer.position,
                        duration: Date.now() - pointerData.startTime
                    });
                }
            }
            
            this.gestures.longPresses.delete(pointerData.pointerId);
        }, this.config.longPressThreshold);
        
        this.gestures.longPresses.set(pointerData.pointerId, timeoutId);
    }
    
    /**
     * Cancel long press detection
     */
    cancelLongPress(pointerData) {
        const timeoutId = this.gestures.longPresses.get(pointerData.pointerId);
        if (timeoutId) {
            clearTimeout(timeoutId);
            this.gestures.longPresses.delete(pointerData.pointerId);
        }
    }
    
    /**
     * Handle swipe gesture
     */
    handleSwipe(touchData, endPosition, duration) {
        const startPos = touchData.startPosition;
        const swipeVector = this.mathUtils.vectorSubtract(endPosition, startPos);
        const distance = this.mathUtils.vectorMagnitude(swipeVector);
        const direction = this.mathUtils.vectorNormalize(swipeVector);
        
        // Calculate swipe direction
        let swipeDirection = 'unknown';
        const angle = Math.atan2(direction.y, direction.x);
        const degrees = (angle * 180 / Math.PI + 360) % 360;
        
        if (degrees >= 315 || degrees < 45) swipeDirection = 'right';
        else if (degrees >= 45 && degrees < 135) swipeDirection = 'down';
        else if (degrees >= 135 && degrees < 225) swipeDirection = 'left';
        else if (degrees >= 225 && degrees < 315) swipeDirection = 'up';
        
        // Calculate swipe speed
        const speed = distance / (duration / 1000); // pixels per second
        
        this.emitInputEvent('swipe', {
            pointerId: touchData.pointerId,
            startPosition: startPos,
            endPosition: endPosition,
            direction: swipeDirection,
            distance: distance,
            speed: speed,
            duration: duration,
            angle: degrees
        });
    }
    
    // ==========================================
    // MULTI-TOUCH GESTURES
    // ==========================================
    
    startMultiTouchGesture(event) {
        if (!this.config.enableMultiTouch) return;
        
        const touches = Array.from(this.touches.values());
        if (touches.length < 2) return;
        
        // Calculate initial gesture data
        const gestureData = this.calculateMultiTouchData(touches);
        
        this.gestures.multiTouchGestures.set('current', {
            startData: gestureData,
            currentData: gestureData,
            startTime: Date.now(),
            type: 'unknown'
        });
        
        this.emitInputEvent('multiTouchStart', {
            touchCount: touches.length,
            center: gestureData.center,
            distance: gestureData.distance
        });
    }
    
    updateMultiTouchGesture(event) {
        const gestureData = this.gestures.multiTouchGestures.get('current');
        if (!gestureData) return;
        
        const touches = Array.from(this.touches.values());
        if (touches.length < 2) return;
        
        const newData = this.calculateMultiTouchData(touches);
        gestureData.currentData = newData;
        
        // Detect gesture type
        const scaleChange = newData.distance / gestureData.startData.distance;
        const centerMovement = this.mathUtils.distance(
            gestureData.startData.center, 
            newData.center
        );
        
        if (Math.abs(scaleChange - 1) > 0.1 && this.config.enablePinchZoom) {
            // Pinch/zoom gesture
            gestureData.type = scaleChange > 1 ? 'pinch-out' : 'pinch-in';
            
            this.emitInputEvent('pinch', {
                scale: scaleChange,
                center: newData.center,
                distance: newData.distance
            });
        } else if (centerMovement > 20) {
            // Pan gesture
            gestureData.type = 'pan';
            
            this.emitInputEvent('multiTouchPan', {
                center: newData.center,
                movement: this.mathUtils.vectorSubtract(
                    newData.center, 
                    gestureData.startData.center
                )
            });
        }
    }
    
    endMultiTouchGesture(event) {
        const gestureData = this.gestures.multiTouchGestures.get('current');
        if (!gestureData) return;
        
        const duration = Date.now() - gestureData.startTime;
        
        this.emitInputEvent('multiTouchEnd', {
            type: gestureData.type,
            duration: duration,
            finalCenter: gestureData.currentData.center
        });
        
        this.gestures.multiTouchGestures.delete('current');
    }
    
    cancelMultiTouchGestures() {
        this.gestures.multiTouchGestures.clear();
        
        this.emitInputEvent('multiTouchCancel', {});
    }
    
    calculateMultiTouchData(touches) {
        if (touches.length < 2) return null;
        
        // Calculate center point
        let centerX = 0, centerY = 0;
        for (const touch of touches) {
            centerX += touch.position.x;
            centerY += touch.position.y;
        }
        
        const center = {
            x: centerX / touches.length,
            y: centerY / touches.length
        };
        
        // Calculate average distance from center
        let totalDistance = 0;
        for (const touch of touches) {
            totalDistance += this.mathUtils.distance(touch.position, center);
        }
        
        return {
            center: center,
            distance: totalDistance / touches.length,
            touchCount: touches.length
        };
    }
    
    // ==========================================
    // VISUAL FEEDBACK
    // ==========================================
    
    createTouchIndicator(position, type, options = {}) {
        if (!this.config.showTouchIndicators) return;
        
        const screenPos = this.canvasToScreen(position.x, position.y);
        
        const indicator = document.createElement('div');
        indicator.className = 'touch-indicator';
        
        // Style based on input type and options
        const radius = options.radius || (type === 'touch' ? 25 : 15);
        const opacity = Math.min((options.pressure || 0.5) + 0.3, 1);
        
        indicator.style.left = screenPos.x + 'px';
        indicator.style.top = screenPos.y + 'px';
        indicator.style.width = (radius * 2) + 'px';
        indicator.style.height = (radius * 2) + 'px';
        indicator.style.opacity = opacity;
        
        // Color based on type
        const colors = {
            mouse: '#3498db',
            touch: '#2ecc71',
            pen: '#e74c3c'
        };
        
        indicator.style.borderColor = colors[type] || '#3498db';
        
        document.body.appendChild(indicator);
        
        // Auto-remove after animation
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        }, this.config.touchIndicatorDuration);
    }
    
    // ==========================================
    // PERFORMANCE & THROTTLING
    // ==========================================
    
    shouldThrottleInput() {
        if (!this.config.inputThrottling) return false;
        
        const now = Date.now();
        if (now - this.lastInputTime < this.throttleInterval) {
            return true;
        }
        
        this.lastInputTime = now;
        return false;
    }
    
    // ==========================================
    // EVENT EMISSION
    // ==========================================
    
    emitInputEvent(eventName, data) {
        // Emit to physics engine if available
        if (this.physics) {
            this.physics.emit(`input:${eventName}`, data);
        }
        
        // Emit generic input event
        const event = new CustomEvent(`ragdoll:input:${eventName}`, {
            detail: data,
            bubbles: true
        });
        
        this.canvas.dispatchEvent(event);
        
        // Debug logging (only in development)
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            if (['pointerMove', 'mousemove'].includes(eventName)) {
                // Don't spam move events in console
                return;
            }
            console.log(`🎮 Input: ${eventName}`, data);
        }
    }
    
    // ==========================================
    // INPUT STATE QUERIES
    // ==========================================
    
    /**
     * Check if any pointers are currently down
     */
    hasActivePointers() {
        return this.pointers.size > 0 || this.mouse.isDown;
    }
    
    /**
     * Get all active pointer positions
     */
    getActivePointers() {
        return Array.from(this.pointers.values());
    }
    
    /**
     * Get pointer by ID
     */
    getPointer(pointerId) {
        return this.pointers.get(pointerId);
    }
    
    /**
     * Check if multi-touch is active
     */
    isMultiTouch() {
        return this.pointers.size > 1 || this.touches.size > 1;
    }
    
    /**
     * Get touch count
     */
    getTouchCount() {
        return this.touches.size;
    }
    
    /**
     * Get mouse state
     */
    getMouseState() {
        return { ...this.mouse };
    }
    
    // ==========================================
    // ACCESSIBILITY FEATURES
    // ==========================================
    
    enableHighContrast() {
        this.config.highContrast = true;
        this.config.showTouchIndicators = true;
        
        // Update visual feedback for better visibility
        const style = document.getElementById('touchIndicatorStyle');
        if (style) {
            style.textContent += `
                .touch-indicator {
                    border-width: 4px !important;
                    background: rgba(255, 255, 255, 0.3) !important;
                }
            `;
        }
    }
    
    enableLargeTargets() {
        this.config.largeTargets = true;
        this.config.tapThreshold *= 1.5;
        this.config.maxTouchPoints = Math.min(this.config.maxTouchPoints, 2); // Reduce complexity
    }
    
    // ==========================================
    // DEBUGGING & ANALYTICS
    // ==========================================
    
    getInputStats() {
        return {
            activePointers: this.pointers.size,
            activeTouches: this.touches.size,
            mouseDown: this.mouse.isDown,
            longPresses: this.gestures.longPresses.size,
            recentTaps: this.gestures.taps.length,
            multiTouchActive: this.gestures.multiTouchGestures.has('current'),
            
            // Performance
            throttling: this.config.inputThrottling,
            lastInputTime: this.lastInputTime,
            
            // Capabilities
            touchSupport: this.deviceUtils.capabilities.touchEvents,
            pointerSupport: this.deviceUtils.capabilities.pointerEvents,
            maxTouchPoints: this.config.maxTouchPoints
        };
    }
    
    getDebugInfo() {
        const stats = this.getInputStats();
        
        return {
            ...stats,
            canvasBounds: this.canvasBounds,
            boundsAge: Date.now() - this.boundsUpdateTime,
            
            // Current pointers detail
            pointerDetails: Array.from(this.pointers.entries()).map(([id, data]) => ({
                id: id,
                type: data.type,
                position: data.position,
                age: Date.now() - data.startTime
            }))
        };
    }
    
    // ==========================================
    // CLEANUP & UTILITIES
    // ==========================================
    
    /**
     * Update input system (called each frame)
     */
    update(deltaTime) {
        // Update drag system visuals if connected
        if (this.dragSystem) {
            this.dragSystem.update(deltaTime);
        }
        
        // Clean up old gesture data
        this.cleanupGestures();
        
        // Update touch indicators (if we were managing them manually)
        this.updateTouchIndicators(deltaTime);
    }
    
    cleanupGestures() {
        const now = Date.now();
        
        // Clean old taps
        this.gestures.taps = this.gestures.taps.filter(
            tap => now - tap.timestamp < this.config.doubleTapThreshold * 3
        );
        
        // Clean stuck long presses
        for (const [pointerId, timeoutId] of this.gestures.longPresses) {
            if (!this.pointers.has(pointerId)) {
                clearTimeout(timeoutId);
                this.gestures.longPresses.delete(pointerId);
            }
        }
    }
    
    updateTouchIndicators(deltaTime) {
        // Touch indicators are handled by CSS animations
        // This could be used for custom indicator management
    }
    
    /**
     * Reset input system state
     */
    reset() {
        // Cancel all active interactions
        if (this.dragSystem) {
            this.dragSystem.cancelAllDrags();
        }
        
        // Clear all gesture states
        this.pointers.clear();
        this.touches.clear();
        this.mouse.isDown = false;
        
        // Clear gesture detection
        this.gestures.taps = [];
        for (const timeoutId of this.gestures.longPresses.values()) {
            clearTimeout(timeoutId);
        }
        this.gestures.longPresses.clear();
        this.gestures.multiTouchGestures.clear();
        
        console.log('🔄 InputManager reset');
    }
    
    /**
     * Clean shutdown
     */
    destroy() {
        console.log('🗑️ Destroying InputManager...');
        
        this.reset();
        
        // Remove all event listeners
        for (const listener of this.eventListeners) {
            listener.element.removeEventListener(
                listener.event, 
                listener.handler, 
                listener.options
            );
        }
        
        this.eventListeners = [];
        
        // Clean up references
        this.canvas = null;
        this.dragSystem = null;
        this.physics = null;
        
        console.log('✅ InputManager destroyed');
    }
}

// Make available globally
window.InputManager = InputManager;

console.log('🎮 InputManager loaded - Unified input handling with multi-touch support ready');