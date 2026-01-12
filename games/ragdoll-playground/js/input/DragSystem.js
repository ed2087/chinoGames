// ==========================================
// DRAG SYSTEM - ADVANCED PHYSICS-BASED DRAGGING
// Handles smooth, realistic dragging of ragdoll parts with visual feedback
// ==========================================

class DragSystem {
    
    constructor(physicsEngine, forceSystem = null) {
        this.physics = physicsEngine;
        this.forces = forceSystem;
        this.mathUtils = window.MathUtils;
        this.deviceUtils = window.DeviceUtils;
        
        // Get device-optimized touch settings
        const touchSettings = this.deviceUtils.getTouchSettings();
        
        // Drag configuration
        this.config = {
            // Touch/grab settings
            grabRadius: touchSettings.minTouchRadius,
            maxGrabRadius: touchSettings.maxTouchRadius,
            grabSensitivity: touchSettings.dragSensitivity,
            
            // Physics settings
            dragStiffness: 0.8,
            dragDamping: 0.05,
            maxDragDistance: this.deviceUtils.device.isTablet ? 200 : 150,
            
            // Visual feedback
            showDragLines: true,
            showGrabIndicators: true,
            highlightGrabbable: true,
            
            // Performance settings
            maxSimultaneousDrags: touchSettings.maxSimultaneousTouch,
            updateRate: this.deviceUtils.device.isDesktop ? 60 : 30,
            
            // Kid-friendly settings
            gentleDragging: true,
            preventExtremeDrag: true,
            audioFeedback: true,
            
            // Advanced features
            magneticGrab: true,
            predictiveGrab: true,
            smoothRelease: true
        };
        
        // State tracking
        this.activeDrags = new Map(); // pointer ID -> drag data
        this.dragConstraints = new Map(); // body ID -> constraint
        this.grabCandidates = new Map(); // pointer ID -> potential grab bodies
        this.dragHistory = []; // For analytics
        
        // Visual elements
        this.dragIndicators = [];
        this.grabHighlights = [];
        
        // Performance monitoring
        this.lastUpdate = Date.now();
        this.updateInterval = 1000 / this.config.updateRate;
        
        // Audio cooldowns
        this.lastGrabSound = 0;
        this.lastDragSound = 0;
        this.soundCooldown = 200;
        
        console.log('✋ DragSystem initialized');
        console.log(`🎯 Max simultaneous drags: ${this.config.maxSimultaneousDrags}`);
    }
    
    // ==========================================
    // DRAG LIFECYCLE
    // ==========================================
    
    /**
     * Start drag operation
     */
    startDrag(pointerId, position, options = {}) {
        // Check if we can start a new drag
        if (this.activeDrags.size >= this.config.maxSimultaneousDrags) {
            console.log('🚫 Maximum simultaneous drags reached');
            return null;
        }
        
        if (this.activeDrags.has(pointerId)) {
            console.warn(`Pointer ${pointerId} already dragging`);
            return null;
        }
        
        // Find best body to grab
        const grabResult = this.findGrabTarget(position, options);
        if (!grabResult.body) {
            console.log('👻 No grabbable body found at position');
            return null;
        }
        
        const { body, grabPoint, distance } = grabResult;
        
        // Check if body is already being dragged
        if (this.isDragging(body)) {
            console.log('🤏 Body already being dragged');
            return null;
        }
        
        // Create drag constraint
        const constraint = this.createDragConstraint(body, position, grabPoint, options);
        if (!constraint) {
            console.error('Failed to create drag constraint');
            return null;
        }
        
        // Create drag data
        const dragData = {
            pointerId: pointerId,
            body: body,
            constraint: constraint,
            
            // Position tracking
            startPosition: { ...position },
            currentPosition: { ...position },
            lastPosition: { ...position },
            grabPoint: grabPoint,
            
            // Timing
            startTime: Date.now(),
            lastUpdateTime: Date.now(),
            
            // Movement tracking
            velocityHistory: [],
            dragDistance: 0,
            maxDragDistance: distance,
            
            // Visual elements
            grabIndicator: this.createGrabIndicator(body, grabPoint),
            dragTrail: [],
            
            // State
            isActive: true,
            dragIntensity: 0,
            
            // Options
            options: { ...options }
        };
        
        // Store drag data
        this.activeDrags.set(pointerId, dragData);
        this.dragConstraints.set(body.id, constraint);
        
        // Wake up the body
        if (typeof Matter !== 'undefined') {
            Matter.Sleeping.set(body, false);
        }
        
        // Audio feedback
        this.playGrabAudio(body);
        
        // Haptic feedback
        this.triggerHapticFeedback('grab');
        
        // Visual feedback
        this.createGrabEffect(position, body);
        
        // Record drag start
        this.recordDragEvent('start', dragData);
        
        // Emit event
        this.physics.emit('dragStarted', {
            pointerId: pointerId,
            body: body,
            position: position,
            grabPoint: grabPoint
        });
        
        console.log(`✋ Started dragging ${body.gameData?.partName || 'body'} with pointer ${pointerId}`);
        return dragData;
    }
    
    /**
     * Update drag position
     */
    updateDrag(pointerId, newPosition) {
        const dragData = this.activeDrags.get(pointerId);
        if (!dragData || !dragData.isActive) {
            return false;
        }
        
        const now = Date.now();
        const deltaTime = now - dragData.lastUpdateTime;
        
        // Throttle updates for performance
        if (deltaTime < this.updateInterval) {
            return true; // Skip update but don't fail
        }
        
        // Calculate movement
        const movement = this.mathUtils.vectorSubtract(newPosition, dragData.currentPosition);
        const movementDistance = this.mathUtils.vectorMagnitude(movement);
        
        // Update positions
        dragData.lastPosition = { ...dragData.currentPosition };
        dragData.currentPosition = { ...newPosition };
        dragData.dragDistance += movementDistance;
        dragData.lastUpdateTime = now;
        
        // Apply drag constraints (prevent extreme dragging)
        const constrainedPosition = this.constrainDragPosition(dragData, newPosition);
        
        // Update physics constraint
        this.updateDragConstraint(dragData, constrainedPosition);
        
        // Update velocity tracking
        this.updateVelocityTracking(dragData, deltaTime);
        
        // Update drag intensity (for visual/audio feedback)
        this.updateDragIntensity(dragData, movementDistance, deltaTime);
        
        // Visual updates
        this.updateDragVisuals(dragData);
        
        // Audio feedback for fast dragging
        this.checkDragAudio(dragData);
        
        // Record movement
        if (movementDistance > 5) { // Only record significant movements
            this.recordDragEvent('move', dragData, { movement: movementDistance });
        }
        
        // Emit update event
        this.physics.emit('dragUpdated', {
            pointerId: pointerId,
            body: dragData.body,
            position: constrainedPosition,
            movement: movementDistance,
            intensity: dragData.dragIntensity
        });
        
        return true;
    }
    
    /**
     * End drag operation
     */
    endDrag(pointerId, options = {}) {
        const dragData = this.activeDrags.get(pointerId);
        if (!dragData) {
            console.warn(`No active drag found for pointer ${pointerId}`);
            return false;
        }
        
        const endTime = Date.now();
        const dragDuration = endTime - dragData.startTime;
        
        // Calculate release velocity
        const releaseVelocity = this.calculateReleaseVelocity(dragData);
        const releaseSpeed = this.mathUtils.vectorMagnitude(releaseVelocity);
        
        // Apply release force if significant
        let appliedRelease = false;
        if (releaseSpeed > 20 && this.config.smoothRelease) {
            appliedRelease = this.applyReleaseForce(dragData, releaseVelocity);
        }
        
        // Remove physics constraint
        this.removeDragConstraint(dragData);
        
        // Clean up visual elements
        this.cleanupDragVisuals(dragData);
        
        // Audio feedback
        this.playReleaseAudio(dragData, releaseSpeed);
        
        // Haptic feedback
        if (releaseSpeed > 100) {
            this.triggerHapticFeedback('release');
        }
        
        // Record drag end
        this.recordDragEvent('end', dragData, {
            duration: dragDuration,
            totalDistance: dragData.dragDistance,
            releaseSpeed: releaseSpeed,
            releaseApplied: appliedRelease
        });
        
        // Store in history before cleanup
        this.addToHistory(dragData, releaseSpeed);
        
        // Remove from active drags
        this.activeDrags.delete(pointerId);
        this.dragConstraints.delete(dragData.body.id);
        
        // Mark as inactive
        dragData.isActive = false;
        
        // Emit end event
        this.physics.emit('dragEnded', {
            pointerId: pointerId,
            body: dragData.body,
            duration: dragDuration,
            totalDistance: dragData.dragDistance,
            releaseVelocity: releaseVelocity,
            releaseSpeed: releaseSpeed
        });
        
        console.log(`👋 Ended drag - Duration: ${dragDuration}ms, Distance: ${dragData.dragDistance.toFixed(1)}px, Release: ${releaseSpeed.toFixed(1)}`);
        return true;
    }
    
    /**
     * Cancel drag operation (emergency cleanup)
     */
    cancelDrag(pointerId) {
        const dragData = this.activeDrags.get(pointerId);
        if (!dragData) return false;
        
        // Remove constraint without applying release force
        this.removeDragConstraint(dragData);
        this.cleanupDragVisuals(dragData);
        
        // Clean up state
        this.activeDrags.delete(pointerId);
        this.dragConstraints.delete(dragData.body.id);
        
        this.physics.emit('dragCancelled', { pointerId, body: dragData.body });
        
        console.log(`❌ Cancelled drag for pointer ${pointerId}`);
        return true;
    }
    
    // ==========================================
    // GRAB TARGET DETECTION
    // ==========================================
    
    /**
     * Find the best body to grab at position
     */
    findGrabTarget(position, options = {}) {
        const searchRadius = options.grabRadius || this.config.grabRadius;
        const maxRadius = this.config.maxGrabRadius;
        
        // Get potential bodies in range
        const nearbyBodies = this.physics.getBodiesInRadius(position, maxRadius);
        
        // Filter grabbable bodies
        const grabbableBodies = nearbyBodies.filter(body => 
            this.isBodyGrabbable(body) && !this.isDragging(body)
        );
        
        if (grabbableBodies.length === 0) {
            return { body: null, grabPoint: null, distance: Infinity };
        }
        
        // Find best grab target using scoring system
        let bestBody = null;
        let bestScore = -Infinity;
        let bestGrabPoint = null;
        let bestDistance = Infinity;
        
        for (const body of grabbableBodies) {
            const result = this.scoreGrabTarget(body, position, options);
            
            if (result.score > bestScore) {
                bestScore = result.score;
                bestBody = body;
                bestGrabPoint = result.grabPoint;
                bestDistance = result.distance;
            }
        }
        
        return {
            body: bestBody,
            grabPoint: bestGrabPoint,
            distance: bestDistance,
            score: bestScore
        };
    }
    
    /**
     * Score a potential grab target
     */
    scoreGrabTarget(body, position, options = {}) {
        let score = 0;
        
        // Calculate distance to body center
        const centerDistance = this.mathUtils.distance(position, body.position);
        const bodyBounds = body.bounds;
        const bodyWidth = bodyBounds.max.x - bodyBounds.min.x;
        const bodyHeight = bodyBounds.max.y - bodyBounds.min.y;
        const bodySize = Math.max(bodyWidth, bodyHeight);
        
        // Distance scoring (closer is better)
        const maxDistance = this.config.maxGrabRadius;
        const distanceScore = Math.max(0, (maxDistance - centerDistance) / maxDistance) * 100;
        score += distanceScore;
        
        // Size scoring (bigger targets are easier to grab)
        const sizeScore = Math.min(bodySize / 50, 1) * 20;
        score += sizeScore;
        
        // Body type preferences
        const partName = body.gameData?.partName;
        if (partName) {
            switch (partName) {
                case 'head':
                    score += 25; // Heads are good grab points
                    break;
                case 'torso':
                    score += 30; // Torso is best grab point
                    break;
                case 'hand':
                case 'foot':
                    score += 15; // Extremities are fun to grab
                    break;
                case 'upperArm':
                case 'upperLeg':
                    score += 20; // Good leverage points
                    break;
            }
        }
        
        // Ragdoll part bonus
        if (body.gameData?.isRagdollPart) {
            score += 10;
        }
        
        // Static body penalty
        if (body.isStatic) {
            score -= 50;
        }
        
        // Already moving penalty (harder to grab moving objects)
        const speed = this.mathUtils.vectorMagnitude(body.velocity);
        if (speed > 5) {
            score -= speed * 2;
        }
        
        // Magnetic grab bonus (if enabled)
        if (this.config.magneticGrab && centerDistance < this.config.grabRadius * 1.5) {
            score += 15;
        }
        
        // Calculate best grab point on body
        const grabPoint = this.calculateGrabPoint(body, position);
        
        return {
            score: score,
            distance: centerDistance,
            grabPoint: grabPoint,
            bodySize: bodySize
        };
    }
    
    /**
     * Calculate optimal grab point on body
     */
    calculateGrabPoint(body, touchPosition) {
        // For simple shapes, grab at center
        if (body.gameData?.partName === 'head' || 
            body.gameData?.partName === 'hand' || 
            body.gameData?.partName === 'foot') {
            return { x: 0, y: 0 }; // Body center
        }
        
        // For elongated parts, grab closer to touch position
        const bodyToTouch = this.mathUtils.vectorSubtract(touchPosition, body.position);
        const bodyBounds = body.bounds;
        const bodyWidth = bodyBounds.max.x - bodyBounds.min.x;
        const bodyHeight = bodyBounds.max.y - bodyBounds.min.y;
        
        // Constrain grab point to body bounds
        const maxX = bodyWidth * 0.4;
        const maxY = bodyHeight * 0.4;
        
        return {
            x: this.mathUtils.clamp(bodyToTouch.x, -maxX, maxX),
            y: this.mathUtils.clamp(bodyToTouch.y, -maxY, maxY)
        };
    }
    
    /**
     * Check if body can be grabbed
     */
    isBodyGrabbable(body) {
        if (!body || body.isStatic) return false;
        
        // Check body metadata
        const gameData = body.gameData;
        if (gameData && gameData.canBeGrabbed === false) return false;
        
        // Ragdoll parts are always grabbable
        if (gameData && gameData.isRagdollPart) return true;
        
        // Default to grabbable
        return true;
    }
    
    // ==========================================
    // CONSTRAINT MANAGEMENT
    // ==========================================
    
    /**
     * Create physics constraint for dragging
     */
    createDragConstraint(body, mousePosition, grabPoint, options = {}) {
        try {
            const constraint = this.physics.createConstraint(
                null, // No bodyA (mouse constraint)
                body,
                {
                    pointA: mousePosition,
                    pointB: grabPoint,
                    
                    // Physics properties
                    stiffness: options.stiffness || this.config.dragStiffness,
                    damping: options.damping || this.config.dragDamping,
                    length: 0, // No rest length for direct dragging
                    
                    // Visual properties
                    render: {
                        visible: this.config.showDragLines,
                        type: 'line',
                        strokeStyle: '#3498db',
                        lineWidth: 3,
                        lineDash: [5, 5]
                    },
                    
                    // Metadata
                    gameData: {
                        type: 'drag',
                        isDragConstraint: true,
                        createdAt: Date.now(),
                        maxDistance: this.config.maxDragDistance
                    }
                }
            );
            
            return constraint;
        } catch (error) {
            console.error('Failed to create drag constraint:', error);
            return null;
        }
    }
    
    /**
     * Update drag constraint position
     */
    updateDragConstraint(dragData, newPosition) {
        if (!dragData.constraint) return false;
        
        try {
            // Update constraint anchor point
            dragData.constraint.pointA = { ...newPosition };
            
            // Update visual line color based on drag intensity
            if (dragData.constraint.render && this.config.showDragLines) {
                const intensity = Math.min(dragData.dragIntensity, 1);
                const hue = this.mathUtils.lerp(200, 0, intensity); // Blue to red
                dragData.constraint.render.strokeStyle = `hsl(${hue}, 70%, 50%)`;
                dragData.constraint.render.lineWidth = 2 + intensity * 2;
            }
            
            return true;
        } catch (error) {
            console.error('Failed to update drag constraint:', error);
            return false;
        }
    }
    
    /**
     * Remove drag constraint
     */
    removeDragConstraint(dragData) {
        if (!dragData.constraint) return false;
        
        try {
            this.physics.removeConstraint(dragData.constraint);
            dragData.constraint = null;
            return true;
        } catch (error) {
            console.error('Failed to remove drag constraint:', error);
            return false;
        }
    }
    
    // ==========================================
    // DRAG CONSTRAINTS & PHYSICS
    // ==========================================
    
    /**
     * Constrain drag position to prevent extreme dragging
     */
    constrainDragPosition(dragData, requestedPosition) {
        if (!this.config.preventExtremeDrag) {
            return requestedPosition;
        }
        
        const startPos = dragData.startPosition;
        const maxDistance = this.config.maxDragDistance;
        
        // Calculate distance from start
        const dragVector = this.mathUtils.vectorSubtract(requestedPosition, startPos);
        const dragDistance = this.mathUtils.vectorMagnitude(dragVector);
        
        // Constrain if too far
        if (dragDistance > maxDistance) {
            const normalizedDirection = this.mathUtils.vectorNormalize(dragVector);
            const constrainedVector = this.mathUtils.vectorMultiply(normalizedDirection, maxDistance);
            return this.mathUtils.vectorAdd(startPos, constrainedVector);
        }
        
        return requestedPosition;
    }
    
    /**
     * Update velocity tracking for smooth release
     */
    updateVelocityTracking(dragData, deltaTime) {
        const timeDelta = deltaTime / 1000; // Convert to seconds
        if (timeDelta <= 0) return;
        
        // Calculate current velocity
        const positionDelta = this.mathUtils.vectorSubtract(
            dragData.currentPosition, 
            dragData.lastPosition
        );
        const velocity = this.mathUtils.vectorMultiply(positionDelta, 1 / timeDelta);
        
        // Add to velocity history
        dragData.velocityHistory.push({
            velocity: velocity,
            timestamp: Date.now()
        });
        
        // Keep only recent history (last 200ms)
        const cutoffTime = Date.now() - 200;
        dragData.velocityHistory = dragData.velocityHistory.filter(
            entry => entry.timestamp > cutoffTime
        );
    }
    
    /**
     * Calculate release velocity from drag history
     */
    calculateReleaseVelocity(dragData) {
        if (dragData.velocityHistory.length < 2) {
            return { x: 0, y: 0 };
        }
        
        // Use recent velocity data for smooth release
        const recentHistory = dragData.velocityHistory.slice(-3);
        let totalVelocity = { x: 0, y: 0 };
        let totalWeight = 0;
        
        // Weighted average of recent velocities (more recent = higher weight)
        for (let i = 0; i < recentHistory.length; i++) {
            const weight = i + 1; // Linear weighting
            const velocity = recentHistory[i].velocity;
            
            totalVelocity.x += velocity.x * weight;
            totalVelocity.y += velocity.y * weight;
            totalWeight += weight;
        }
        
        if (totalWeight === 0) return { x: 0, y: 0 };
        
        const averageVelocity = {
            x: totalVelocity.x / totalWeight,
            y: totalVelocity.y / totalWeight
        };
        
        // Apply device-specific scaling
        const deviceScale = this.deviceUtils.device.isTablet ? 0.7 : 0.9;
        return this.mathUtils.vectorMultiply(averageVelocity, deviceScale);
    }
    
    /**
     * Apply release force to body
     */
    applyReleaseForce(dragData, releaseVelocity) {
        try {
            const body = dragData.body;
            const speed = this.mathUtils.vectorMagnitude(releaseVelocity);
            
            // Convert velocity to force
            const forceMagnitude = Math.min(speed * 0.001, 3); // Cap force
            const forceDirection = this.mathUtils.vectorNormalize(releaseVelocity);
            const force = this.mathUtils.vectorMultiply(forceDirection, forceMagnitude);
            
            // Apply force through physics system
            if (this.forces) {
                return this.forces.throwBody(
                    body,
                    dragData.startPosition,
                    dragData.currentPosition,
                    Date.now() - dragData.startTime,
                    { velocity: releaseVelocity }
                );
            } else {
                // Fallback: direct physics force application
                this.physics.applyForce(body, force);
                return true;
            }
        } catch (error) {
            console.error('Failed to apply release force:', error);
            return false;
        }
    }
    
    // ==========================================
    // VISUAL FEEDBACK SYSTEM
    // ==========================================
    
    /**
     * Create grab indicator visual element
     */
    createGrabIndicator(body, grabPoint) {
        const indicator = {
            body: body,
            grabPoint: grabPoint,
            position: { ...body.position },
            radius: 15,
            life: 1.0,
            createdAt: Date.now(),
            type: 'grab',
            pulsePhase: 0
        };
        
        this.dragIndicators.push(indicator);
        return indicator;
    }
    
    /**
     * Update drag visuals
     */
    updateDragVisuals(dragData) {
        // Update grab indicator
        if (dragData.grabIndicator) {
            dragData.grabIndicator.position = { ...dragData.body.position };
            dragData.grabIndicator.pulsePhase += 0.2;
        }
        
        // Add to drag trail
        if (dragData.dragTrail.length === 0 || 
            this.mathUtils.distance(
                dragData.currentPosition, 
                dragData.dragTrail[dragData.dragTrail.length - 1]
            ) > 10) {
            
            dragData.dragTrail.push({
                position: { ...dragData.currentPosition },
                timestamp: Date.now(),
                intensity: dragData.dragIntensity
            });
            
            // Limit trail length
            if (dragData.dragTrail.length > 20) {
                dragData.dragTrail.shift();
            }
        }
    }
    
    /**
     * Create grab effect
     */
    createGrabEffect(position, body) {
        // Create ripple effect
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const ripple = {
                    position: { ...position },
                    radius: 0,
                    maxRadius: 30 + i * 10,
                    life: 1.0,
                    maxLife: 0.5 + i * 0.1,
                    createdAt: Date.now(),
                    type: 'ripple',
                    opacity: 0.6 - i * 0.15
                };
                
                this.dragIndicators.push(ripple);
            }, i * 50);
        }
        
        // Create highlight around body
        const highlight = {
            body: body,
            radius: 0,
            maxRadius: Math.max(body.bounds.max.x - body.bounds.min.x, 
                               body.bounds.max.y - body.bounds.min.y) * 0.7,
            life: 1.0,
            maxLife: 0.8,
            createdAt: Date.now(),
            type: 'highlight',
            pulseSpeed: 4
        };
        
        this.dragIndicators.push(highlight);
    }
    
    /**
     * Clean up drag visuals
     */
    cleanupDragVisuals(dragData) {
        // Mark grab indicator for removal
        if (dragData.grabIndicator) {
            dragData.grabIndicator.life = 0;
        }
        
        // Clear drag trail
        dragData.dragTrail = [];
    }
    
    /**
     * Update visual elements
     */
    updateVisuals(deltaTime) {
        const dt = deltaTime / 1000;
        
        // Update drag indicators
        this.dragIndicators = this.dragIndicators.filter(indicator => {
            indicator.life -= dt / (indicator.maxLife || 1);
            
            switch (indicator.type) {
                case 'grab':
                    // Pulsing grab indicator
                    indicator.radius = 15 + Math.sin(indicator.pulsePhase) * 5;
                    break;
                    
                case 'ripple':
                    // Expanding ripple
                    const progress = 1 - indicator.life;
                    indicator.radius = indicator.maxRadius * this.mathUtils.easeOutBounce(progress);
                    break;
                    
                case 'highlight':
                    // Pulsing highlight
                    const pulse = Math.sin(Date.now() * 0.01 * indicator.pulseSpeed) * 0.5 + 0.5;
                    indicator.radius = indicator.maxRadius * (0.8 + pulse * 0.2);
                    break;
            }
            
            return indicator.life > 0;
        });
    }
    
    /**
     * Render visual elements to canvas
     */
    renderVisuals(ctx) {
        if (!ctx) return;
        
        ctx.save();
        
        // Render drag indicators
        for (const indicator of this.dragIndicators) {
            this.renderDragIndicator(ctx, indicator);
        }
        
        // Render drag trails
        for (const dragData of this.activeDrags.values()) {
            this.renderDragTrail(ctx, dragData);
        }
        
        ctx.restore();
    }
    
    renderDragIndicator(ctx, indicator) {
        const alpha = indicator.life;
        ctx.globalAlpha = alpha;
        
        let position;
        if (indicator.body) {
            position = indicator.body.position;
        } else {
            position = indicator.position;
        }
        
        switch (indicator.type) {
            case 'grab':
                // Pulsing grab circle
                ctx.strokeStyle = '#3498db';
                ctx.lineWidth = 2;
                ctx.setLineDash([3, 3]);
                
                ctx.beginPath();
                ctx.arc(position.x, position.y, indicator.radius, 0, Math.PI * 2);
                ctx.stroke();
                
                // Center dot
                ctx.fillStyle = '#3498db';
                ctx.beginPath();
                ctx.arc(position.x, position.y, 2, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'ripple':
                // Expanding ripple
                ctx.globalAlpha = alpha * (indicator.opacity || 1);
                ctx.strokeStyle = '#2ecc71';
                ctx.lineWidth = 2;
                ctx.setLineDash([]);
                
                ctx.beginPath();
                ctx.arc(position.x, position.y, indicator.radius, 0, Math.PI * 2);
                ctx.stroke();
                break;
                
            case 'highlight':
                // Body highlight
                ctx.globalAlpha = alpha * 0.3;
                ctx.strokeStyle = '#f39c12';
                ctx.lineWidth = 3;
                ctx.setLineDash([8, 4]);
                
                ctx.beginPath();
                ctx.arc(position.x, position.y, indicator.radius, 0, Math.PI * 2);
                ctx.stroke();
                break;
        }
    }
    
    renderDragTrail(ctx, dragData) {
        const trail = dragData.dragTrail;
        if (trail.length < 2) return;
        
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(trail[0].position.x, trail[0].position.y);

        for (let i = 1; i < trail.length; i++) {
            const point = trail[i];
            const alpha = i / trail.length; // Fade trail
            
            ctx.globalAlpha = alpha * 0.6;
            ctx.lineTo(point.position.x, point.position.y);
        }
        
        ctx.stroke();
    }
    
    // ==========================================
    // DRAG INTENSITY & FEEDBACK
    // ==========================================
    
    /**
     * Update drag intensity for feedback systems
     */
    updateDragIntensity(dragData, movementDistance, deltaTime) {
        const timeDelta = deltaTime / 1000;
        if (timeDelta <= 0) return;
        
        // Calculate movement speed
        const speed = movementDistance / timeDelta;
        
        // Update intensity (0 = calm, 1 = intense)
        const targetIntensity = Math.min(speed / 200, 1); // Normalize to 0-1
        
        // Smooth intensity changes
        const smoothing = 0.1;
        dragData.dragIntensity = this.mathUtils.lerp(
            dragData.dragIntensity, 
            targetIntensity, 
            smoothing
        );
    }
    
    /**
     * Check if drag audio feedback should play
     */
    checkDragAudio(dragData) {
        const now = Date.now();
        if (now - this.lastDragSound < this.soundCooldown) return;
        
        // Play audio for high intensity dragging
        if (dragData.dragIntensity > 0.7 && this.config.audioFeedback) {
            this.playDragAudio(dragData);
            this.lastDragSound = now;
        }
    }
    
    /**
     * Trigger haptic feedback
     */
    triggerHapticFeedback(type) {
        if (!navigator.vibrate || !this.deviceUtils.device.hasTouch) return;
        
        switch (type) {
            case 'grab':
                navigator.vibrate(50); // Short pulse
                break;
            case 'release':
                navigator.vibrate([30, 10, 30]); // Double pulse
                break;
            case 'intense':
                navigator.vibrate(20); // Quick feedback
                break;
        }
    }
    
    // ==========================================
    // AUDIO FEEDBACK
    // ==========================================
    
    playGrabAudio(body) {
        const now = Date.now();
        if (now - this.lastGrabSound < this.soundCooldown) return;
        if (!this.config.audioFeedback || !window.audioSystem?.isInitialized) return;
        
        const partName = body.gameData?.partName || 'object';
        const grabMessages = [
            `Got the ${partName}!`,
            `Grabbing the ${partName}!`,
            `Holding on tight!`
        ];
        
        const message = this.mathUtils.randomChoice(grabMessages);
        window.audioSystem.speak(message);
        
        this.lastGrabSound = now;
    }
    
    playDragAudio(dragData) {
        if (!window.audioSystem?.isInitialized) return;
        
        const speedMessages = [
            'Whee! So fast!',
            'Flying around!',
            'Zoom zoom!'
        ];
        
        const message = this.mathUtils.randomChoice(speedMessages);
        window.audioSystem.speak(message);
        window.audioSystem.playSoundEffect('pop');
    }
    
    playReleaseAudio(dragData, releaseSpeed) {
        if (!this.config.audioFeedback || !window.audioSystem?.isInitialized) return;
        
        const partName = dragData.body.gameData?.partName || 'object';
        
        if (releaseSpeed > 100) {
            const throwMessages = [
                `Flying ${partName}!`,
                `There it goes!`,
                `What a throw!`
            ];
            window.audioSystem.speak(this.mathUtils.randomChoice(throwMessages));
            window.audioSystem.playSoundEffect('success');
        } else {
            const gentleMessages = [
                `Nice placement!`,
                `Perfect!`,
                `There we go!`
            ];
            window.audioSystem.speak(this.mathUtils.randomChoice(gentleMessages));
        }
    }
    
    // ==========================================
    // STATE QUERIES
    // ==========================================
    
    /**
     * Check if any drags are active
     */
    hasActiveDrags() {
        return this.activeDrags.size > 0;
    }
    
    /**
     * Check if specific body is being dragged
     */
    isDragging(body) {
        return this.dragConstraints.has(body.id);
    }
    
    /**
     * Get drag data for pointer
     */
    getDragData(pointerId) {
        return this.activeDrags.get(pointerId);
    }
    
    /**
     * Get all active drag data
     */
    getAllActiveDrags() {
        return Array.from(this.activeDrags.values());
    }
    
    /**
     * Get dragged bodies
     */
    getDraggedBodies() {
        return Array.from(this.activeDrags.values()).map(dragData => dragData.body);
    }
    
    /**
     * Find drag data by body
     */
    findDragByBody(body) {
        for (const dragData of this.activeDrags.values()) {
            if (dragData.body === body) {
                return dragData;
            }
        }
        return null;
    }
    
    // ==========================================
    // ANALYTICS & HISTORY
    // ==========================================
    
    /**
     * Record drag event for analytics
     */
    recordDragEvent(eventType, dragData, extraData = {}) {
        const event = {
            type: eventType,
            timestamp: Date.now(),
            pointerId: dragData.pointerId,
            bodyId: dragData.body.id,
            bodyType: dragData.body.gameData?.partName || 'unknown',
            ragdollId: dragData.body.gameData?.ragdollId,
            ...extraData
        };
        
        // Emit for external analytics
        this.physics.emit('dragAnalytics', event);
    }
    
    /**
     * Add completed drag to history
     */
    addToHistory(dragData, releaseSpeed) {
        const historyEntry = {
            duration: Date.now() - dragData.startTime,
            distance: dragData.dragDistance,
            releaseSpeed: releaseSpeed,
            bodyType: dragData.body.gameData?.partName || 'unknown',
            maxIntensity: Math.max(...(dragData.velocityHistory.map(v => 
                this.mathUtils.vectorMagnitude(v.velocity)) || [0])),
            timestamp: Date.now()
        };
        
        this.dragHistory.push(historyEntry);
        
        // Keep history manageable
        if (this.dragHistory.length > 50) {
            this.dragHistory = this.dragHistory.slice(-50);
        }
    }
    
    /**
     * Get drag statistics
     */
    getDragStats() {
        if (this.dragHistory.length === 0) return null;
        
        const recent = this.dragHistory.slice(-10);
        
        return {
            totalDrags: this.dragHistory.length,
            activeDrags: this.activeDrags.size,
            
            averageDuration: recent.reduce((sum, drag) => sum + drag.duration, 0) / recent.length,
            averageDistance: recent.reduce((sum, drag) => sum + drag.distance, 0) / recent.length,
            averageReleaseSpeed: recent.reduce((sum, drag) => sum + drag.releaseSpeed, 0) / recent.length,
            
            mostDraggedBodyType: this.getMostDraggedBodyType(),
            dragStyle: this.analyzeDragStyle(recent)
        };
    }
    
    getMostDraggedBodyType() {
        const typeCounts = {};
        
        for (const drag of this.dragHistory) {
            const type = drag.bodyType;
            typeCounts[type] = (typeCounts[type] || 0) + 1;
        }
        
        return Object.keys(typeCounts).reduce((a, b) => 
            typeCounts[a] > typeCounts[b] ? a : b, 'none');
    }
    
    analyzeDragStyle(recentDrags) {
        if (recentDrags.length < 3) return 'exploring';
        
        const avgDuration = recentDrags.reduce((sum, drag) => sum + drag.duration, 0) / recentDrags.length;
        const avgSpeed = recentDrags.reduce((sum, drag) => sum + drag.releaseSpeed, 0) / recentDrags.length;
        const avgDistance = recentDrags.reduce((sum, drag) => sum + drag.distance, 0) / recentDrags.length;
        
        if (avgSpeed > 150) return 'thrower';
        if (avgDuration > 3000) return 'careful';
        if (avgDistance > 200) return 'explorer';
        if (avgDuration < 1000 && avgSpeed > 50) return 'quick';
        
        return 'balanced';
    }
    
    // ==========================================
    // CLEANUP & UTILITIES
    // ==========================================
    
    /**
     * Cancel all active drags
     */
    cancelAllDrags() {
        const pointerIds = Array.from(this.activeDrags.keys());
        
        for (const pointerId of pointerIds) {
            this.cancelDrag(pointerId);
        }
        
        console.log(`❌ Cancelled ${pointerIds.length} active drags`);
    }
    
    /**
     * Clean up expired visual elements
     */
    cleanupExpiredVisuals() {
        const before = this.dragIndicators.length;
        this.dragIndicators = this.dragIndicators.filter(indicator => indicator.life > 0);
        const cleaned = before - this.dragIndicators.length;
        
        if (cleaned > 0) {
            console.log(`🧹 Cleaned up ${cleaned} expired drag visuals`);
        }
    }
    
    /**
     * Reset drag system
     */
    reset() {
        this.cancelAllDrags();
        this.dragHistory = [];
        this.dragIndicators = [];
        this.grabHighlights = [];
        
        console.log('🔄 DragSystem reset');
    }
    
    /**
     * Update drag system (called each frame)
     */
    update(deltaTime) {
        // Update visuals
        this.updateVisuals(deltaTime);
        
        // Clean up expired elements
        this.cleanupExpiredVisuals();
        
        // Check for stuck drags (emergency cleanup)
        const now = Date.now();
        const stuckDrags = [];
        
        for (const [pointerId, dragData] of this.activeDrags) {
            const age = now - dragData.startTime;
            if (age > 30000) { // 30 seconds = stuck
                stuckDrags.push(pointerId);
            }
        }
        
        for (const pointerId of stuckDrags) {
            console.warn(`⚠️ Cleaning up stuck drag: ${pointerId}`);
            this.cancelDrag(pointerId);
        }
    }
    
    /**
     * Get debug information
     */
    getDebugInfo() {
        return {
            activeDrags: this.activeDrags.size,
            maxDrags: this.config.maxSimultaneousDrags,
            dragConstraints: this.dragConstraints.size,
            visualElements: this.dragIndicators.length,
            dragHistory: this.dragHistory.length,
            
            // Current drag details
            currentDrags: Array.from(this.activeDrags.entries()).map(([pointerId, dragData]) => ({
                pointerId: pointerId,
                bodyType: dragData.body.gameData?.partName || 'unknown',
                duration: Date.now() - dragData.startTime,
                distance: dragData.dragDistance,
                intensity: dragData.dragIntensity
            }))
        };
    }
    
    /**
     * Clean shutdown
     */
    destroy() {
        console.log('🗑️ Destroying DragSystem...');
        
        this.cancelAllDrags();
        this.dragHistory = [];
        this.dragIndicators = [];
        this.grabHighlights = [];
        
        this.physics = null;
        this.forces = null;
        
        console.log('✅ DragSystem destroyed');
    }
}

// Make available globally
window.DragSystem = DragSystem;

console.log('✋ DragSystem loaded - Advanced physics-based dragging ready');