// ==========================================
// FORCE SYSTEM - ADVANCED PHYSICS INTERACTIONS
// Handles throwing, dragging, explosions, and realistic force application
// ==========================================

class ForceSystem {
    
    constructor(physicsEngine, audioSystem = null) {
        this.physics = physicsEngine;
        this.audio = audioSystem || window.audioSystem;
        this.mathUtils = window.MathUtils;
        this.deviceUtils = window.DeviceUtils;
        
        // Force configuration optimized for kids
        this.config = {
            // Throwing forces
            throwForceMultiplier: this.deviceUtils.device.isTablet ? 0.8 : 1.0,
            maxThrowForce: 8.0,
            minThrowForce: 0.5,
            
            // Dragging forces
            dragStiffness: 0.8,
            dragDamping: 0.02,
            maxDragDistance: 150,
            
            // Explosion forces
            explosionBaseForce: 0.15,
            explosionRadius: 120,
            explosionFalloff: 0.7,
            
            // Wind and environmental forces
            windStrength: 0.025,
            gravityWellStrength: 0.1,
            
            // Feedback thresholds
            strongForceThreshold: 5.0,
            mediumForceThreshold: 2.0,
            
            // Ragdoll-specific settings
            jointBreakForce: 15.0,
            limbTearForce: 20.0,
            maxJointStress: 10.0
        };
        
        // State tracking
        this.activeForces = new Map(); // Track ongoing force applications
        this.dragConstraints = new Map(); // Track drag constraints
        this.forceHistory = []; // For analytics and feedback
        this.lastExplosionTime = 0;
        this.explosionCooldown = 500; // Prevent spam
        
        // Visual feedback system
        this.forceIndicators = [];
        this.screenEffects = [];
        
        console.log('💪 ForceSystem initialized');
    }
    
    // ==========================================
    // THROWING SYSTEM
    // ==========================================
    
    /**
     * Calculate throw force based on gesture
     */
    calculateThrowForce(startPoint, endPoint, gestureTime, velocity = null) {
        // Calculate direction and distance
        const direction = this.mathUtils.vectorSubtract(endPoint, startPoint);
        const distance = this.mathUtils.vectorMagnitude(direction);
        
        // Use provided velocity or calculate from gesture
        let throwVelocity;
        if (velocity) {
            throwVelocity = velocity;
        } else {
            // Calculate velocity from gesture (pixels per second)
            const timeInSeconds = Math.max(gestureTime, 50) / 1000; // Minimum 50ms
            throwVelocity = this.mathUtils.vectorMultiply(direction, 1 / timeInSeconds);
        }
        
        // Apply device-specific scaling
        const deviceMultiplier = this.deviceUtils.device.isTablet ? 0.6 : 
                                 this.deviceUtils.device.isMobile ? 0.8 : 1.0;
        
        // Calculate base force from velocity
        const speed = this.mathUtils.vectorMagnitude(throwVelocity);
        const normalizedDirection = distance > 0 ? this.mathUtils.vectorNormalize(direction) : { x: 0, y: 0 };
        
        // Apply force scaling with smooth curves
        const scaledSpeed = Math.pow(Math.min(speed / 1000, 1), 0.7) * this.config.maxThrowForce;
        const finalSpeed = this.mathUtils.clamp(scaledSpeed, this.config.minThrowForce, this.config.maxThrowForce);
        
        const throwForce = this.mathUtils.vectorMultiply(normalizedDirection, finalSpeed * deviceMultiplier * this.config.throwForceMultiplier);
        
        return {
            force: throwForce,
            speed: finalSpeed,
            direction: normalizedDirection,
            gestureDistance: distance,
            gestureTime: gestureTime,
            isStrong: finalSpeed > this.config.strongForceThreshold
        };
    }
    
    /**
     * Throw a body with realistic physics
     */
    throwBody(body, startPoint, endPoint, gestureTime, options = {}) {
        if (!body || !this.physics.isInitialized) return false;
        
        const throwData = this.calculateThrowForce(startPoint, endPoint, gestureTime, options.velocity);
        
        // Add some randomness for natural movement
        const randomness = options.randomness || 0.1;
        const randomOffset = {
            x: this.mathUtils.randomFloat(-randomness, randomness),
            y: this.mathUtils.randomFloat(-randomness * 0.5, randomness * 0.3)
        };
        
        const finalForce = this.mathUtils.vectorAdd(throwData.force, randomOffset);
        
        // Apply the force
        this.physics.applyForce(body, finalForce);
        
        // Wake up the body
        if (typeof Matter !== 'undefined') {
            Matter.Sleeping.set(body, false);
        }
        
        // Create visual feedback
        this.createForceIndicator(body.position, throwData.direction, throwData.speed);
        
        // Audio feedback
        this.playThrowAudio(throwData.speed, body.gameData?.partName);
        
        // Screen effects for strong throws
        if (throwData.isStrong) {
            this.createScreenShake(throwData.speed * 0.1);
        }
        
        // Track the throw
        this.recordForceApplication('throw', body, finalForce, throwData);
        
        // Emit event
        this.physics.emit('bodyThrown', {
            body: body,
            force: finalForce,
            throwData: throwData,
            startPoint: startPoint,
            endPoint: endPoint
        });
        
        console.log(`🎯 Body thrown with force: ${throwData.speed.toFixed(2)}`);
        return true;
    }
    
    /**
     * Multi-body throw (throw multiple ragdoll parts)
     */
    throwMultipleBodies(bodies, startPoint, endPoint, gestureTime, options = {}) {
        if (!bodies || bodies.length === 0) return false;
        
        const results = [];
        const throwData = this.calculateThrowForce(startPoint, endPoint, gestureTime, options.velocity);
        
        // Apply varying forces to each body for more natural effect
        bodies.forEach((body, index) => {
            const variation = 0.8 + (Math.random() * 0.4); // 80% to 120% of base force
            const delayMs = index * 20; // Slight delay between bodies
            
            setTimeout(() => {
                const variedForce = this.mathUtils.vectorMultiply(throwData.force, variation);
                const success = this.physics.applyForce(body, variedForce);
                
                if (success) {
                    Matter.Sleeping.set(body, false);
                    results.push({ body, force: variedForce, success: true });
                }
            }, delayMs);
        });
        
        // Audio feedback
        this.playMultiThrowAudio(throwData.speed, bodies.length);
        
        // Strong visual effect for multi-throws
        if (throwData.isStrong) {
            this.createExplosionEffect(startPoint, throwData.speed * 20);
        }
        
        return results;
    }
    
    // ==========================================
    // DRAGGING SYSTEM
    // ==========================================
    
    /**
     * Start dragging a body
     */
    startDrag(body, mousePosition, options = {}) {
        if (!body || !this.physics.isInitialized) return null;
        
        // Create mouse constraint for dragging
        const constraint = this.physics.createConstraint(
            null, // No bodyA (mouse constraint)
            body,
            {
                pointA: mousePosition,
                pointB: options.attachPoint || { x: 0, y: 0 },
                stiffness: options.stiffness || this.config.dragStiffness,
                damping: options.damping || this.config.dragDamping,
                length: 0,
                
                render: {
                    visible: false // Hide drag constraint visually
                },
                
                gameData: {
                    type: 'drag',
                    isDragConstraint: true,
                    dragStartTime: Date.now(),
                    maxDistance: options.maxDistance || this.config.maxDragDistance
                }
            }
        );
        
        // Store drag information
        this.dragConstraints.set(body.id, {
            constraint: constraint,
            body: body,
            startPosition: { ...body.position },
            lastPosition: { ...mousePosition },
            dragHistory: [{ position: { ...mousePosition }, time: Date.now() }],
            options: options
        });
        
        // Wake up the body
        Matter.Sleeping.set(body, false);
        
        // Audio feedback
        this.playDragStartAudio(body.gameData?.partName);
        
        // Visual feedback
        this.createDragIndicator(body.position);
        
        // Emit event
        this.physics.emit('dragStarted', { body, constraint, mousePosition });
        
        console.log(`✋ Started dragging body: ${body.gameData?.partName || 'unknown'}`);
        return constraint;
    }
    
    /**
     * Update drag position
     */
    updateDrag(body, newMousePosition) {
        const dragData = this.dragConstraints.get(body.id);
        if (!dragData) return false;
        
        // Update constraint position
        const constraint = dragData.constraint;
        constraint.pointA = newMousePosition;
        
        // Check maximum drag distance
        const dragDistance = this.mathUtils.distance(dragData.startPosition, newMousePosition);
        if (dragDistance > dragData.options.maxDistance || this.config.maxDragDistance) {
            // Limit drag distance
            const direction = this.mathUtils.vectorSubtract(newMousePosition, dragData.startPosition);
            const normalizedDirection = this.mathUtils.vectorNormalize(direction);
            const limitedPosition = this.mathUtils.vectorAdd(
                dragData.startPosition,
                this.mathUtils.vectorMultiply(normalizedDirection, this.config.maxDragDistance)
            );
            constraint.pointA = limitedPosition;
        }
        
        // Update drag history for velocity calculation
        const now = Date.now();
        dragData.dragHistory.push({ position: { ...newMousePosition }, time: now });
        
        // Keep only recent history (last 200ms)
        dragData.dragHistory = dragData.dragHistory.filter(entry => now - entry.time < 200);
        dragData.lastPosition = { ...newMousePosition };
        
        // Calculate current drag velocity
        if (dragData.dragHistory.length >= 2) {
            const recent = dragData.dragHistory[dragData.dragHistory.length - 1];
            const older = dragData.dragHistory[0];
            const timeDiff = (recent.time - older.time) / 1000; // Convert to seconds
            
            if (timeDiff > 0) {
                const dragVelocity = this.mathUtils.calculateVelocity(older.position, recent.position, timeDiff);
                const speed = this.mathUtils.vectorMagnitude(dragVelocity);
                
                // Audio feedback for fast dragging
                if (speed > 300 && now - (dragData.lastFastDragAudio || 0) > 200) {
                    this.playFastDragAudio(speed);
                    dragData.lastFastDragAudio = now;
                }
            }
        }
        
        return true;
    }
    
    /**
     * End dragging and apply release velocity
     */
    endDrag(body, options = {}) {
        const dragData = this.dragConstraints.get(body.id);
        if (!dragData) return false;
        
        // Calculate release velocity from drag history
        let releaseVelocity = { x: 0, y: 0 };
        
        if (dragData.dragHistory.length >= 2) {
            const recent = dragData.dragHistory[dragData.dragHistory.length - 1];
            const older = dragData.dragHistory[Math.max(0, dragData.dragHistory.length - 3)]; // Use slightly older point
            const timeDiff = (recent.time - older.time) / 1000;
            
            if (timeDiff > 0) {
                releaseVelocity = this.mathUtils.calculateVelocity(older.position, recent.position, timeDiff);
                
                // Apply device scaling
                const deviceScale = this.deviceUtils.device.isTablet ? 0.6 : 0.8;
                releaseVelocity = this.mathUtils.vectorMultiply(releaseVelocity, deviceScale);
                
                // Limit release velocity
                const speed = this.mathUtils.vectorMagnitude(releaseVelocity);
                if (speed > this.config.maxThrowForce * 100) {
                    const normalized = this.mathUtils.vectorNormalize(releaseVelocity);
                    releaseVelocity = this.mathUtils.vectorMultiply(normalized, this.config.maxThrowForce * 100);
                }
            }
        }
        
        // Remove drag constraint
        this.physics.removeConstraint(dragData.constraint);
        this.dragConstraints.delete(body.id);
        
        // Apply release velocity if significant
        const releaseSpeed = this.mathUtils.vectorMagnitude(releaseVelocity);
        if (releaseSpeed > 50) { // Minimum speed threshold
            const releaseForce = this.mathUtils.vectorMultiply(releaseVelocity, body.mass * 0.001);
            this.physics.applyForce(body, releaseForce);
            
            // Create release effects
            this.createForceIndicator(body.position, this.mathUtils.vectorNormalize(releaseVelocity), releaseSpeed * 0.01);
            
            // Audio feedback for release
            this.playReleaseAudio(releaseSpeed, body.gameData?.partName);
        } else {
            // Gentle release audio
            this.playDragEndAudio();
        }
        
        // Record the interaction
        this.recordForceApplication('drag', body, releaseVelocity, {
            dragDuration: Date.now() - dragData.dragStartTime,
            releaseSpeed: releaseSpeed
        });
        
        // Emit event
        this.physics.emit('dragEnded', {
            body: body,
            releaseVelocity: releaseVelocity,
            releaseSpeed: releaseSpeed,
            dragDuration: Date.now() - dragData.dragStartTime
        });
        
        console.log(`👋 Ended drag - Release speed: ${releaseSpeed.toFixed(2)}`);
        return true;
    }
    
    /**
     * Check if body is currently being dragged
     */
    isDragging(body) {
        return this.dragConstraints.has(body.id);
    }
    
    /**
     * Get all currently dragged bodies
     */
    getDraggedBodies() {
        return Array.from(this.dragConstraints.values()).map(dragData => dragData.body);
    }
    
    // ==========================================
    // EXPLOSION SYSTEM
    // ==========================================
    
    /**
     * Create explosion at point with visual and physics effects
     */
    createExplosion(center, options = {}) {
        const now = Date.now();
        
        // Prevent explosion spam
        if (now - this.lastExplosionTime < this.explosionCooldown) {
            console.log('🚫 Explosion cooldown active');
            return false;
        }
        
        const config = {
            radius: options.radius || this.config.explosionRadius,
            force: options.force || this.config.explosionBaseForce,
            falloff: options.falloff || this.config.explosionFalloff,
            affectStatic: options.affectStatic || false,
            createParticles: options.createParticles !== false,
            playAudio: options.playAudio !== false,
            screenShake: options.screenShake !== false,
            ...options
        };
        
        // Get bodies in explosion radius
        const affectedBodies = this.physics.getBodiesInRadius(center, config.radius);
        const validBodies = affectedBodies.filter(body => 
            config.affectStatic || !body.isStatic
        );
        
        // Apply explosion forces
        for (const body of validBodies) {
            const direction = this.mathUtils.vectorSubtract(body.position, center);
            const distance = Math.max(10, this.mathUtils.vectorMagnitude(direction)); // Prevent division by zero
            
            // Calculate force with falloff
            const normalizedDirection = this.mathUtils.vectorNormalize(direction);
            const falloffFactor = Math.pow(Math.max(0, (config.radius - distance) / config.radius), config.falloff);
            const explosionForce = this.mathUtils.vectorMultiply(normalizedDirection, config.force * falloffFactor);
            
            // Add some upward component for more dramatic effect
            explosionForce.y -= config.force * falloffFactor * 0.3;
            
            // Apply the force
            this.physics.applyForce(body, explosionForce);
            Matter.Sleeping.set(body, false);
        }
        
        // Visual effects
        if (config.createParticles) {
            this.createExplosionEffect(center, config.radius);
        }
        
        // Screen shake
        if (config.screenShake) {
            const shakeIntensity = Math.min(config.force * 2, 1.0);
            this.createScreenShake(shakeIntensity);
        }
        
        // Audio feedback
        if (config.playAudio) {
            this.playExplosionAudio(config.force, validBodies.length);
        }
        
        // Record explosion
        this.recordForceApplication('explosion', null, { x: config.force, y: config.force }, {
            center: center,
            radius: config.radius,
            affectedBodies: validBodies.length
        });
        
        this.lastExplosionTime = now;
        
        // Emit event
        this.physics.emit('explosionCreated', {
            center: center,
            radius: config.radius,
            force: config.force,
            affectedBodies: validBodies
        });
        
        console.log(`💥 Explosion created at (${center.x.toFixed(1)}, ${center.y.toFixed(1)}) - ${validBodies.length} bodies affected`);
        return true;
    }
    
    /**
     * Create chain explosion effect
     */
    createChainExplosion(centers, delay = 200, options = {}) {
        centers.forEach((center, index) => {
            setTimeout(() => {
                this.createExplosion(center, {
                    ...options,
                    force: (options.force || this.config.explosionBaseForce) * (0.8 + Math.random() * 0.4) // Vary force
                });
            }, index * delay);
        });
        
        console.log(`⛓️ Chain explosion started - ${centers.length} explosions over ${centers.length * delay}ms`);
    }
    
    /**
     * Explode body at its current position
     */
    explodeBody(body, options = {}) {
        if (!body) return false;
        
        const explosionCenter = { ...body.position };
        
        // Customize explosion based on body size
        const bodyBounds = body.bounds;
        const bodySize = Math.max(bodyBounds.max.x - bodyBounds.min.x, bodyBounds.max.y - bodyBounds.min.y);
        const sizedRadius = Math.max(50, bodySize * 2);
        
        const success = this.createExplosion(explosionCenter, {
            radius: sizedRadius,
            force: options.force || this.config.explosionBaseForce * 1.5,
            ...options
        });
        
        // Optionally remove the exploded body
        if (success && options.destroyBody) {
            setTimeout(() => {
                this.physics.removeBody(body);
            }, 100);
        }
        
        return success;
    }
    
    // ==========================================
    // ENVIRONMENTAL FORCES
    // ==========================================
    
    /**
     * Apply wind force to all bodies
     */
    applyWind(direction, strength, duration = 3000, options = {}) {
        const normalizedDirection = this.mathUtils.vectorNormalize(direction);
        const windForce = this.mathUtils.vectorMultiply(normalizedDirection, strength || this.config.windStrength);
        
        const startTime = Date.now();
        let windActive = true;
        
        // Create turbulence pattern
        let turbulencePhase = 0;
        
        const windInterval = setInterval(() => {
            if (!windActive || Date.now() - startTime > duration) {
                clearInterval(windInterval);
                windActive = false;
                this.physics.emit('windEnded');
                return;
            }
            
            turbulencePhase += 0.1;
            
            // Apply to all non-static bodies
            for (const [bodyId, bodyData] of this.physics.bodies) {
                const body = bodyData.body;
                if (body.isStatic) continue;
                
                // Add turbulence based on body position and time
                const turbulenceX = Math.sin(turbulencePhase + body.position.x * 0.01) * strength * 0.3;
                const turbulenceY = Math.cos(turbulencePhase + body.position.y * 0.01) * strength * 0.2;
                
                const turbulentWind = {
                    x: windForce.x + turbulenceX,
                    y: windForce.y + turbulenceY
                };
                
                this.physics.applyForce(body, turbulentWind);
            }
        }, 33); // ~30fps
        
        // Audio feedback
        this.playWindAudio(strength, duration);
        
        this.physics.emit('windStarted', { direction: normalizedDirection, strength, duration });
        console.log(`💨 Wind applied - Duration: ${duration}ms, Strength: ${strength}`);
        
        return windInterval;
    }
    
    /**
     * Create gravity well effect
     */
    createGravityWell(center, radius, strength, duration = 2000) {
        const startTime = Date.now();
        let wellActive = true;
        
        const wellInterval = setInterval(() => {
            if (!wellActive || Date.now() - startTime > duration) {
                clearInterval(wellInterval);
                wellActive = false;
                this.physics.emit('gravityWellEnded');
                return;
            }
            
            // Get bodies in range
            const bodiesInRange = this.physics.getBodiesInRadius(center, radius);
            
            for (const body of bodiesInRange) {
                if (body.isStatic) continue;
                
                const direction = this.mathUtils.vectorSubtract(center, body.position);
                const distance = Math.max(20, this.mathUtils.vectorMagnitude(direction));
                
                // Inverse square law for realistic gravity
                const normalizedDirection = this.mathUtils.vectorNormalize(direction);
                const gravityStrength = (strength || this.config.gravityWellStrength) * (radius * radius) / (distance * distance);
                const gravityForce = this.mathUtils.vectorMultiply(normalizedDirection, gravityStrength);
                
                this.physics.applyForce(body, gravityForce);
            }
        }, 16); // ~60fps
        
        // Visual effect for gravity well
        this.createGravityWellEffect(center, radius, duration);
        
        this.physics.emit('gravityWellStarted', { center, radius, strength, duration });
        console.log(`🌌 Gravity well created at (${center.x.toFixed(1)}, ${center.y.toFixed(1)})`);
        
        return wellInterval;
    }
    
    // ==========================================
    // RAGDOLL-SPECIFIC FORCES
    // ==========================================
    
    /**
     * Apply force to entire ragdoll
     */
    applyRagdollForce(ragdollBodies, force, center = null) {
        if (!ragdollBodies || ragdollBodies.length === 0) return false;
        
        // Calculate ragdoll center if not provided
        if (!center) {
            let totalMass = 0;
            let centerX = 0;
            let centerY = 0;
            
            for (const body of ragdollBodies) {
                const mass = body.mass || 1;
                centerX += body.position.x * mass;
                centerY += body.position.y * mass;
                totalMass += mass;
            }
            
            center = { x: centerX / totalMass, y: centerY / totalMass };
        }
        
        // Apply force to each body part with realistic distribution
        ragdollBodies.forEach(body => {
            // Calculate force distribution based on body part
            let forceMultiplier = 1.0;
            
            const partName = body.gameData?.partName;
            if (partName) {
                switch (partName) {
                    case 'head':
                        forceMultiplier = 0.6; // Head is lighter
                        break;
                    case 'torso':
                        forceMultiplier = 1.4; // Torso receives more force
                        break;
                    case 'arm':
                    case 'leg':
                        forceMultiplier = 0.8; // Limbs get moderate force
                        break;
                }
            }
            
            const adjustedForce = this.mathUtils.vectorMultiply(force, forceMultiplier);
            this.physics.applyForce(body, adjustedForce);
            Matter.Sleeping.set(body, false);
        });
        
        // Audio feedback
        this.playRagdollForceAudio(this.mathUtils.vectorMagnitude(force), ragdollBodies.length);
        
        return true;
    }
    
    /**
     * Check joint stress and handle breaking
     */
    checkJointStress(constraint, currentForce) {
        if (!constraint.gameData?.isRagdollJoint) return false;
        
        const forceStrength = this.mathUtils.vectorMagnitude(currentForce);
        const stressThreshold = constraint.gameData?.maxStress || this.config.maxJointStress;
        
        if (forceStrength > stressThreshold) {
            // Joint is under too much stress
            const breakChance = Math.min((forceStrength - stressThreshold) / this.config.jointBreakForce, 0.8);
            
            if (Math.random() < breakChance) {
                // Break the joint
                this.breakJoint(constraint);
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Break a ragdoll joint
     */
    breakJoint(constraint) {
        if (!constraint) return false;
        
        const jointName = constraint.gameData?.jointName || 'joint';
        
        // Remove the constraint
        this.physics.removeConstraint(constraint);
        
        // Audio feedback
        this.playJointBreakAudio(jointName);
        
        // Visual effect at joint position
        if (constraint.bodyA && constraint.bodyB) {
            const jointCenter = {
                x: (constraint.bodyA.position.x + constraint.bodyB.position.x) / 2,
                y: (constraint.bodyA.position.y + constraint.bodyB.position.y) / 2
            };
            
            this.createJointBreakEffect(jointCenter);
        }
        
        console.log(`💔 Joint broken: ${jointName}`);
        
        this.physics.emit('jointBroken', { constraint, jointName });
        return true;
    }
    
    // ==========================================
    // AUDIO FEEDBACK
    // ==========================================
    
    playThrowAudio(speed, partName) {
        if (!this.audio?.isInitialized) return;
        
        if (speed > this.config.strongForceThreshold) {
            this.audio.speak(`Wow! Strong throw!`);
            this.audio.playSoundEffect('celebration');
        } else if (speed > this.config.mediumForceThreshold) {
            this.audio.speak(`Nice throw!`);
            this.audio.playSoundEffect('success');
        }
    }
    
    playMultiThrowAudio(speed, bodyCount) {
        if (!this.audio?.isInitialized) return;
        
        if (bodyCount > 3) {
            this.audio.speak(`Amazing! All the pieces are flying!`);
        } else {
            this.audio.speak(`Multiple throws!`);
        }
        
        this.audio.playSoundEffect('celebration');
    }
    
    playDragStartAudio(partName) {
        if (!this.audio?.isInitialized) return;
        
        const messages = [
            `Grabbing the ${partName || 'piece'}!`,
            `Got it!`,
            `Let's move this around!`
        ];
        
        const message = this.mathUtils.randomChoice(messages);
        this.audio.speak(message);
    }
    
    playFastDragAudio(speed) {
        if (!this.audio?.isInitialized) return;
        
        this.audio.speak(`Wheeee!`);
        this.audio.playSoundEffect('pop');
    }
    
    playReleaseAudio(speed, partName) {
        if (!this.audio?.isInitialized) return;
        
        if (speed > 200) {
            this.audio.speak(`Flying ${partName || 'piece'}!`);
        }
    }
    
    playDragEndAudio() {
        if (!this.audio?.isInitialized) return;
        
        const messages = [`There you go!`, `Perfect!`, `Nice placement!`];
        this.audio.speak(this.mathUtils.randomChoice(messages));
    }
    
    playExplosionAudio(force, bodyCount) {
        if (!this.audio?.isInitialized) return;
        
        this.audio.speak(`BOOM! Explosion!`);
        this.audio.playSoundEffect('celebration');
        
        if (bodyCount > 5) {
            setTimeout(() => {
                this.audio.speak(`Look at everything flying around!`);
            }, 1500);
        }
    }
    
    playWindAudio(strength, duration) {
        if (!this.audio?.isInitialized) return;
        
        this.audio.speak(`Whoosh! Here comes the wind!`);
    }
    
    playRagdollForceAudio(force, bodyCount) {
        if (!this.audio?.isInitialized) return;
        
        if (force > this.config.strongForceThreshold) {
            this.audio.speak(`Powerful force on the ragdoll!`);
        }
    }

    playJointBreakAudio(jointName) {
        if (!this.audio?.isInitialized) return;
        
        const breakMessages = [
            `Oh no! The ${jointName} broke!`,
            `Snap! Something came apart!`,
            `The ${jointName} couldn't handle that force!`
        ];
        
        this.audio.speak(this.mathUtils.randomChoice(breakMessages));
        this.audio.playSoundEffect('pop');
    }
    
    // ==========================================
    // VISUAL EFFECTS
    // ==========================================
    
    /**
     * Create visual indicator for applied force
     */
    createForceIndicator(position, direction, strength) {
        const indicator = {
            position: { ...position },
            direction: this.mathUtils.vectorNormalize(direction),
            strength: Math.min(strength, 10), // Cap visual strength
            life: 1.0,
            maxLife: 0.5, // Half second duration
            createdAt: Date.now(),
            type: 'force'
        };
        
        this.forceIndicators.push(indicator);
        
        // Clean up old indicators
        this.forceIndicators = this.forceIndicators.filter(ind => ind.life > 0);
    }
    
    /**
     * Create drag indicator
     */
    createDragIndicator(position) {
        const indicator = {
            position: { ...position },
            radius: 20,
            life: 1.0,
            maxLife: 0.3,
            createdAt: Date.now(),
            type: 'drag',
            pulsePhase: 0
        };
        
        this.forceIndicators.push(indicator);
    }
    
    /**
     * Create explosion visual effect
     */
    createExplosionEffect(center, radius) {
        // Create multiple explosion rings
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const effect = {
                    center: { ...center },
                    radius: 0,
                    maxRadius: radius * (0.8 + i * 0.4),
                    life: 1.0,
                    maxLife: 0.6 + i * 0.2,
                    createdAt: Date.now(),
                    type: 'explosion',
                    ringIndex: i,
                    opacity: 0.8 - i * 0.2
                };
                
                this.screenEffects.push(effect);
            }, i * 100);
        }
    }
    
    /**
     * Create gravity well visual effect
     */
    createGravityWellEffect(center, radius, duration) {
        const effect = {
            center: { ...center },
            radius: radius,
            life: 1.0,
            maxLife: duration / 1000,
            createdAt: Date.now(),
            type: 'gravityWell',
            rotationPhase: 0,
            spiralCount: 5
        };
        
        this.screenEffects.push(effect);
    }
    
    /**
     * Create joint break visual effect
     */
    createJointBreakEffect(position) {
        // Create spark particles
        for (let i = 0; i < 8; i++) {
            const sparkDirection = this.mathUtils.randomVector(1);
            const spark = {
                position: { ...position },
                velocity: this.mathUtils.vectorMultiply(sparkDirection, this.mathUtils.randomFloat(2, 5)),
                life: 1.0,
                maxLife: this.mathUtils.randomFloat(0.3, 0.7),
                createdAt: Date.now(),
                type: 'spark',
                size: this.mathUtils.randomFloat(2, 4)
            };
            
            this.forceIndicators.push(spark);
        }
    }
    
    /**
     * Create screen shake effect
     */
    createScreenShake(intensity) {
        const canvas = this.physics.canvas;
        if (!canvas) return;
        
        // Add shake class to canvas or parent
        const container = canvas.parentElement || canvas;
        container.classList.add('screen-shake');
        
        // Apply shake intensity through CSS custom property
        container.style.setProperty('--shake-intensity', `${intensity * 5}px`);
        
        // Remove shake effect after animation
        setTimeout(() => {
            container.classList.remove('screen-shake');
            container.style.removeProperty('--shake-intensity');
        }, 500);
    }
    
    /**
     * Update all visual effects
     */
    updateVisualEffects(deltaTime) {
        const dt = deltaTime / 1000; // Convert to seconds
        
        // Update force indicators
        this.forceIndicators = this.forceIndicators.filter(indicator => {
            indicator.life -= dt / indicator.maxLife;
            
            // Update based on type
            switch (indicator.type) {
                case 'force':
                    // Move indicator along force direction
                    const movement = this.mathUtils.vectorMultiply(indicator.direction, indicator.strength * dt * 50);
                    indicator.position = this.mathUtils.vectorAdd(indicator.position, movement);
                    break;
                    
                case 'drag':
                    // Pulse effect
                    indicator.pulsePhase += dt * 8;
                    indicator.radius = 20 + Math.sin(indicator.pulsePhase) * 5;
                    break;
                    
                case 'spark':
                    // Move spark particles
                    const sparkMovement = this.mathUtils.vectorMultiply(indicator.velocity, dt);
                    indicator.position = this.mathUtils.vectorAdd(indicator.position, sparkMovement);
                    // Apply gravity to sparks
                    indicator.velocity.y += 200 * dt;
                    break;
            }
            
            return indicator.life > 0;
        });
        
        // Update screen effects
        this.screenEffects = this.screenEffects.filter(effect => {
            effect.life -= dt / effect.maxLife;
            
            switch (effect.type) {
                case 'explosion':
                    // Expand explosion ring
                    const progress = 1 - effect.life;
                    effect.radius = effect.maxRadius * this.mathUtils.easeOutBounce(progress);
                    break;
                    
                case 'gravityWell':
                    // Rotate gravity well spiral
                    effect.rotationPhase += dt * 2;
                    break;
            }
            
            return effect.life > 0;
        });
    }
    
    /**
     * Render all visual effects to canvas
     */
    renderVisualEffects(ctx) {
        if (!ctx) return;
        
        // Save context state
        ctx.save();
        
        // Render screen effects first (background)
        for (const effect of this.screenEffects) {
            this.renderScreenEffect(ctx, effect);
        }
        
        // Render force indicators (foreground)
        for (const indicator of this.forceIndicators) {
            this.renderForceIndicator(ctx, indicator);
        }
        
        // Restore context state
        ctx.restore();
    }
    
    renderScreenEffect(ctx, effect) {
        const alpha = effect.life;
        
        switch (effect.type) {
            case 'explosion':
                ctx.globalAlpha = alpha * effect.opacity;
                ctx.strokeStyle = `hsl(${30 + effect.ringIndex * 20}, 100%, 60%)`;
                ctx.lineWidth = 4 - effect.ringIndex;
                ctx.setLineDash([]);
                
                ctx.beginPath();
                ctx.arc(effect.center.x, effect.center.y, effect.radius, 0, Math.PI * 2);
                ctx.stroke();
                break;
                
            case 'gravityWell':
                ctx.globalAlpha = alpha * 0.6;
                ctx.strokeStyle = '#8e44ad';
                ctx.lineWidth = 2;
                
                // Draw spiral
                for (let i = 0; i < effect.spiralCount; i++) {
                    const spiralOffset = (i / effect.spiralCount) * Math.PI * 2;
                    ctx.beginPath();
                    
                    for (let angle = 0; angle < Math.PI * 4; angle += 0.2) {
                        const spiralRadius = (angle / (Math.PI * 4)) * effect.radius;
                        const x = effect.center.x + Math.cos(angle + effect.rotationPhase + spiralOffset) * spiralRadius;
                        const y = effect.center.y + Math.sin(angle + effect.rotationPhase + spiralOffset) * spiralRadius;
                        
                        if (angle === 0) {
                            ctx.moveTo(x, y);
                        } else {
                            ctx.lineTo(x, y);
                        }
                    }
                    
                    ctx.stroke();
                }
                break;
        }
    }
    
    renderForceIndicator(ctx, indicator) {
        const alpha = indicator.life;
        ctx.globalAlpha = alpha;
        
        switch (indicator.type) {
            case 'force':
                // Draw force arrow
                const arrowLength = indicator.strength * 10;
                const endPoint = this.mathUtils.vectorAdd(
                    indicator.position,
                    this.mathUtils.vectorMultiply(indicator.direction, arrowLength)
                );
                
                ctx.strokeStyle = '#e74c3c';
                ctx.lineWidth = 3;
                ctx.setLineDash([]);
                
                // Arrow line
                ctx.beginPath();
                ctx.moveTo(indicator.position.x, indicator.position.y);
                ctx.lineTo(endPoint.x, endPoint.y);
                ctx.stroke();
                
                // Arrow head
                const headSize = 8;
                const headAngle = Math.PI / 6;
                const arrowAngle = Math.atan2(indicator.direction.y, indicator.direction.x);
                
                ctx.beginPath();
                ctx.moveTo(endPoint.x, endPoint.y);
                ctx.lineTo(
                    endPoint.x - headSize * Math.cos(arrowAngle - headAngle),
                    endPoint.y - headSize * Math.sin(arrowAngle - headAngle)
                );
                ctx.moveTo(endPoint.x, endPoint.y);
                ctx.lineTo(
                    endPoint.x - headSize * Math.cos(arrowAngle + headAngle),
                    endPoint.y - headSize * Math.sin(arrowAngle + headAngle)
                );
                ctx.stroke();
                break;
                
            case 'drag':
                // Draw pulsing circle
                ctx.strokeStyle = '#3498db';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                
                ctx.beginPath();
                ctx.arc(indicator.position.x, indicator.position.y, indicator.radius, 0, Math.PI * 2);
                ctx.stroke();
                
                // Inner dot
                ctx.fillStyle = '#3498db';
                ctx.beginPath();
                ctx.arc(indicator.position.x, indicator.position.y, 3, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'spark':
                // Draw spark particle
                ctx.fillStyle = `hsl(${Math.random() * 60 + 20}, 100%, 70%)`; // Yellow to red
                ctx.beginPath();
                ctx.arc(indicator.position.x, indicator.position.y, indicator.size, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
    }
    
    // ==========================================
    // FORCE TRACKING & ANALYTICS
    // ==========================================
    
    /**
     * Record force application for analytics
     */
    recordForceApplication(type, body, force, metadata = {}) {
        const record = {
            type: type,
            timestamp: Date.now(),
            bodyId: body?.id,
            bodyType: body?.gameData?.partName || body?.gameData?.type,
            force: { ...force },
            forceStrength: this.mathUtils.vectorMagnitude(force),
            metadata: metadata
        };
        
        this.forceHistory.push(record);
        
        // Keep history manageable (last 100 force applications)
        if (this.forceHistory.length > 100) {
            this.forceHistory = this.forceHistory.slice(-100);
        }
        
        // Emit analytics event
        this.physics.emit('forceRecorded', record);
    }
    
    /**
     * Get force statistics
     */
    getForceStats() {
        if (this.forceHistory.length === 0) return null;
        
        const recentHistory = this.forceHistory.slice(-20); // Last 20 forces
        const throwHistory = recentHistory.filter(record => record.type === 'throw');
        const dragHistory = recentHistory.filter(record => record.type === 'drag');
        const explosionHistory = recentHistory.filter(record => record.type === 'explosion');
        
        const averageThrowForce = throwHistory.length > 0 ? 
            throwHistory.reduce((sum, record) => sum + record.forceStrength, 0) / throwHistory.length : 0;
            
        const strongThrows = throwHistory.filter(record => 
            record.forceStrength > this.config.strongForceThreshold).length;
            
        return {
            totalForces: this.forceHistory.length,
            recentForces: recentHistory.length,
            
            throws: {
                count: throwHistory.length,
                averageForce: averageThrowForce,
                strongThrows: strongThrows,
                accuracy: strongThrows / Math.max(throwHistory.length, 1)
            },
            
            drags: {
                count: dragHistory.length,
                averageDuration: dragHistory.length > 0 ? 
                    dragHistory.reduce((sum, record) => sum + (record.metadata?.dragDuration || 0), 0) / dragHistory.length : 0
            },
            
            explosions: {
                count: explosionHistory.length,
                totalBodiesAffected: explosionHistory.reduce((sum, record) => 
                    sum + (record.metadata?.affectedBodies || 0), 0)
            },
            
            mostUsedForceType: this.getMostUsedForceType(recentHistory),
            playStyle: this.analyzePlayStyle(recentHistory)
        };
    }
    
    getMostUsedForceType(history) {
        const typeCounts = {};
        
        for (const record of history) {
            typeCounts[record.type] = (typeCounts[record.type] || 0) + 1;
        }
        
        return Object.keys(typeCounts).reduce((a, b) => 
            typeCounts[a] > typeCounts[b] ? a : b, 'none');
    }
    
    analyzePlayStyle(history) {
        if (history.length < 5) return 'exploring';
        
        const throwCount = history.filter(r => r.type === 'throw').length;
        const dragCount = history.filter(r => r.type === 'drag').length;
        const explosionCount = history.filter(r => r.type === 'explosion').length;
        
        const total = history.length;
        const throwRatio = throwCount / total;
        const dragRatio = dragCount / total;
        const explosionRatio = explosionCount / total;
        
        if (explosionRatio > 0.4) return 'destructive';
        if (throwRatio > 0.6) return 'thrower';
        if (dragRatio > 0.6) return 'careful';
        if (throwRatio > 0.3 && dragRatio > 0.3) return 'balanced';
        
        return 'experimenting';
    }
    
    // ==========================================
    // CLEANUP & UTILITIES
    // ==========================================
    
    /**
     * Clean up all active forces and effects
     */
    cleanup() {
        // Remove all drag constraints
        for (const [bodyId, dragData] of this.dragConstraints) {
            this.physics.removeConstraint(dragData.constraint);
        }
        this.dragConstraints.clear();
        
        // Clear all active forces
        this.activeForces.clear();
        
        // Clear visual effects
        this.forceIndicators = [];
        this.screenEffects = [];
        
        console.log('🧹 ForceSystem cleaned up');
    }
    
    /**
     * Reset force system state
     */
    reset() {
        this.cleanup();
        this.forceHistory = [];
        this.lastExplosionTime = 0;
        
        console.log('🔄 ForceSystem reset');
    }
    
    /**
     * Get debug information
     */
    getDebugInfo() {
        return {
            activeDrags: this.dragConstraints.size,
            activeForces: this.activeForces.size,
            forceIndicators: this.forceIndicators.length,
            screenEffects: this.screenEffects.length,
            forceHistory: this.forceHistory.length,
            lastExplosion: Date.now() - this.lastExplosionTime,
            cooldownRemaining: Math.max(0, this.explosionCooldown - (Date.now() - this.lastExplosionTime))
        };
    }
    
    /**
     * Update force system (called each frame)
     */
    update(deltaTime) {
        // Update visual effects
        this.updateVisualEffects(deltaTime);
        
        // Check for constraint stress
        for (const [constraintId, constraintData] of this.physics.constraints) {
            const constraint = constraintData.constraint;
            if (constraint.gameData?.isRagdollJoint) {
                // Calculate current stress on joint
                const bodyA = constraint.bodyA;
                const bodyB = constraint.bodyB;
                
                if (bodyA && bodyB) {
                    const distance = this.mathUtils.distance(bodyA.position, bodyB.position);
                    const restLength = constraint.length || 50;
                    const extension = Math.abs(distance - restLength);
                    
                    // Check if joint is overstressed
                    if (extension > constraint.gameData?.maxExtension || 30) {
                        const currentForce = { x: extension * 0.1, y: 0 };
                        this.checkJointStress(constraint, currentForce);
                    }
                }
            }
        }
    }
}

// Make available globally
window.ForceSystem = ForceSystem;

console.log('💪 ForceSystem loaded - Advanced force application and physics interactions ready');