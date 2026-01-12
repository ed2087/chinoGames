// ==========================================
// BODY PART - INDIVIDUAL RAGDOLL LIMB LOGIC
// Handles individual body part behavior, properties, and interactions
// ==========================================

class BodyPart {
    
    constructor(partName, config, ragdollId, physicsEngine) {
        this.partName = partName;
        this.ragdollId = ragdollId;
        this.physics = physicsEngine;
        this.mathUtils = window.MathUtils;
        this.deviceUtils = window.DeviceUtils;
        
        // Part configuration
        this.config = {
            // Physical properties
            width: config.w || 20,
            height: config.h || 30,
            mass: config.mass || 1.0,
            density: config.density || 0.001,
            
            // Material properties
            friction: config.friction || 0.4,
            restitution: config.restitution || 0.3,
            frictionAir: config.frictionAir || 0.02,
            
            // Visual properties
            color: config.color || '#FDBCB4',
            borderColor: config.borderColor || this.darkenColor(config.color || '#FDBCB4', 20),
            
            // Behavioral properties
            canBeGrabbed: config.canBeGrabbed !== false,
            isBreakable: config.isBreakable !== false,
            maxStress: config.maxStress || 15.0,
            maxVelocity: config.maxVelocity || 30,
            
            // Special properties
            shape: config.shape || this.getDefaultShape(partName),
            attachmentPoints: config.attachmentPoints || this.getDefaultAttachments(partName),
            specialFeatures: config.specialFeatures || {},
            
            ...config
        };
        
        // State tracking
        this.isActive = true;
        this.health = 100;
        this.stress = 0;
        this.temperature = 0; // For visual effects
        this.lastInteraction = Date.now();
        this.interactionCount = 0;
        
        // Physics body reference (will be set when created)
        this.physicsBody = null;
        
        // Connected parts
        this.connectedParts = new Map(); // partName -> connection info
        this.joints = new Map(); // jointName -> constraint reference
        
        // Visual effects
        this.visualEffects = [];
        this.particles = [];
        
        // Audio properties
        this.soundProfile = this.createSoundProfile(partName);
        
        // Damage and wear system
        this.damagePoints = [];
        this.wearLevel = 0;
        
        console.log(`🦴 BodyPart created: ${partName} for ragdoll ${ragdollId}`);
    }
    
    // ==========================================
    // INITIALIZATION
    // ==========================================
    
    /**
     * Get default shape for body part
     */
    getDefaultShape(partName) {
        const shapeMap = {
            'head': 'circle',
            'hand': 'circle',
            'foot': 'oval',
            'torso': 'roundedRect',
            'upperArm': 'roundedRect',
            'lowerArm': 'roundedRect',
            'upperLeg': 'roundedRect',
            'lowerLeg': 'roundedRect'
        };
        
        return shapeMap[partName] || 'roundedRect';
    }
    
    /**
     * Get default attachment points for connections
     */
    getDefaultAttachments(partName) {
        const attachmentMap = {
            'head': {
                'neck': { x: 0, y: 0.5, strength: 0.8 }
            },
            'torso': {
                'neck': { x: 0, y: -0.5, strength: 0.8 },
                'shoulderL': { x: -0.4, y: -0.3, strength: 0.7 },
                'shoulderR': { x: 0.4, y: -0.3, strength: 0.7 },
                'hipL': { x: -0.3, y: 0.4, strength: 0.8 },
                'hipR': { x: 0.3, y: 0.4, strength: 0.8 }
            },
            'upperArm': {
                'shoulder': { x: 0, y: -0.4, strength: 0.7 },
                'elbow': { x: 0, y: 0.5, strength: 0.6 }
            },
            'lowerArm': {
                'elbow': { x: 0, y: -0.5, strength: 0.6 },
                'wrist': { x: 0, y: 0.5, strength: 0.5 }
            },
            'hand': {
                'wrist': { x: 0, y: -0.3, strength: 0.5 }
            },
            'upperLeg': {
                'hip': { x: 0, y: -0.4, strength: 0.8 },
                'knee': { x: 0, y: 0.5, strength: 0.7 }
            },
            'lowerLeg': {
                'knee': { x: 0, y: -0.5, strength: 0.7 },
                'ankle': { x: 0, y: 0.5, strength: 0.6 }
            },
            'foot': {
                'ankle': { x: -0.2, y: 0, strength: 0.6 }
            }
        };
        
        return attachmentMap[partName] || {};
    }
    
    /**
     * Create sound profile for body part
     */
    createSoundProfile(partName) {
        const profiles = {
            'head': {
                hitSounds: ['Ouch!', 'Ow!', 'My head!'],
                grabSounds: ['Hey!', 'Watch the hair!', 'Careful!'],
                breakSounds: ['Oh no!', 'That hurt!'],
                materials: 'organic',
                pitchVariation: 0.2
            },
            'torso': {
                hitSounds: ['Oof!', 'That knocked the wind out!', 'Right in the chest!'],
                grabSounds: ['Got me!', 'Hold on tight!'],
                breakSounds: ['I\'m falling apart!'],
                materials: 'organic',
                pitchVariation: 0.1
            },
            'hand': {
                hitSounds: ['Slap!', 'High five!', 'Clap!'],
                grabSounds: ['Shake hands!', 'Got a grip!'],
                breakSounds: ['Lost my grip!'],
                materials: 'soft',
                pitchVariation: 0.3
            },
            'foot': {
                hitSounds: ['Stomp!', 'Step!', 'Kick!'],
                grabSounds: ['Tickles!', 'Watch the toes!'],
                breakSounds: ['Can\'t stand up!'],
                materials: 'firm',
                pitchVariation: 0.2
            }
        };
        
        return profiles[partName] || profiles['torso'];
    }
    
    // ==========================================
    // PHYSICS BODY MANAGEMENT
    // ==========================================
    
    /**
     * Set physics body reference
     */
    setPhysicsBody(body) {
        this.physicsBody = body;
        
        // Add reference back to this BodyPart
        if (body.gameData) {
            body.gameData.bodyPart = this;
        }
        
        // Set up collision callbacks
        this.setupPhysicsCallbacks();
        
        return true;
    }
    
    setupPhysicsCallbacks() {
        if (!this.physicsBody) return;
        
        // Listen for physics events
        if (this.physics) {
            this.physics.on('collision', (event) => {
                this.handleCollision(event);
            });
            
            this.physics.on('forceApplied', (event) => {
                if (event.body === this.physicsBody) {
                    this.handleForceApplication(event);
                }
            });
        }
    }
    
    // ==========================================
    // CONNECTION MANAGEMENT
    // ==========================================
    
    /**
     * Connect to another body part
     */
    connectTo(otherPart, jointName, connectionConfig = {}) {
        if (!otherPart || !this.physicsBody || !otherPart.physicsBody) {
            console.warn(`Cannot connect ${this.partName} to ${otherPart?.partName}: missing physics bodies`);
            return null;
        }
        
        // Get attachment points
        const myAttachment = this.config.attachmentPoints[jointName];
        const theirAttachment = otherPart.config.attachmentPoints[jointName];
        
        if (!myAttachment || !theirAttachment) {
            console.warn(`Missing attachment points for joint: ${jointName}`);
            return null;
        }
        
        // Create physics constraint
        const constraint = this.physics.createConstraint(
            this.physicsBody,
            otherPart.physicsBody,
            {
                pointA: this.attachmentPointToWorld(myAttachment),
                pointB: otherPart.attachmentPointToWorld(theirAttachment),
                stiffness: Math.min(myAttachment.strength, theirAttachment.strength),
                damping: connectionConfig.damping || 0.1,
                
                // Joint metadata
                isRagdollJoint: true,
                ragdollId: this.ragdollId,
                jointName: jointName,
                bodyPartA: this.partName,
                bodyPartB: otherPart.partName,
                maxStress: connectionConfig.maxStress || this.config.maxStress,
                canBreak: connectionConfig.canBreak !== false,
                
                ...connectionConfig
            }
        );
        
        if (!constraint) return null;
        
        // Store connection information
        const connectionInfo = {
            otherPart: otherPart,
            joint: constraint,
            jointName: jointName,
            strength: Math.min(myAttachment.strength, theirAttachment.strength),
            stress: 0,
            createdAt: Date.now(),
            isActive: true
        };
        
        this.connectedParts.set(otherPart.partName, connectionInfo);
        this.joints.set(jointName, constraint);
        
        // Set up reverse connection
        const reverseConnection = {
            otherPart: this,
            joint: constraint,
            jointName: jointName,
            strength: connectionInfo.strength,
            stress: 0,
            createdAt: Date.now(),
            isActive: true
        };
        
        otherPart.connectedParts.set(this.partName, reverseConnection);
        otherPart.joints.set(jointName, constraint);
        
        console.log(`🔗 Connected ${this.partName} to ${otherPart.partName} via ${jointName}`);
        return constraint;
    }
    
    /**
     * Disconnect from another body part
     */
    disconnectFrom(otherPartName, reason = 'manual') {
        const connection = this.connectedParts.get(otherPartName);
        if (!connection) return false;
        
        // Remove physics constraint
        if (connection.joint && this.physics) {
            this.physics.removeConstraint(connection.joint);
        }
        
        // Clean up connections
        this.connectedParts.delete(otherPartName);
        this.joints.delete(connection.jointName);
        
        // Clean up reverse connection
        if (connection.otherPart) {
            connection.otherPart.connectedParts.delete(this.partName);
            connection.otherPart.joints.delete(connection.jointName);
        }
        
        // Trigger disconnect effects
        this.onDisconnect(connection, reason);
        
        console.log(`💔 Disconnected ${this.partName} from ${otherPartName} (${reason})`);
        return true;
    }
    
    attachmentPointToWorld(attachment) {
        // Convert relative attachment point to world offset
        return {
            x: attachment.x * this.config.width,
            y: attachment.y * this.config.height
        };
    }
    
    // ==========================================
    // INTERACTION HANDLING
    // ==========================================
    
    /**
     * Handle being grabbed
     */
    onGrab(grabData) {
        this.lastInteraction = Date.now();
        this.interactionCount++;
        
        // Update temperature (visual feedback)
        this.temperature = Math.min(this.temperature + 0.3, 1.0);
        
        // Play grab sound
        this.playSound('grab');
        
        // Create grab effect
        this.createGrabEffect(grabData.position);
        
        // Emit grab event
        this.emit('grabbed', { bodyPart: this, grabData: grabData });
        
        console.log(`✋ ${this.partName} grabbed`);
    }
    
    /**
     * Handle being released
     */
    onRelease(releaseData) {
        const grabDuration = Date.now() - this.lastInteraction;
        
        // Play release sound based on release speed
        if (releaseData.speed > 100) {
            this.playSound('throw');
        } else {
            this.playSound('release');
        }
        
        // Create release effects
        if (releaseData.speed > 50) {
            this.createMotionEffect(releaseData.direction, releaseData.speed);
        }
        
        // Cool down temperature
        this.temperature = Math.max(this.temperature - 0.1, 0);
        
        this.emit('released', { bodyPart: this, releaseData: releaseData, duration: grabDuration });
        
        console.log(`👋 ${this.partName} released with speed ${releaseData.speed.toFixed(1)}`);
    }
    
    /**
     * Handle collision with other objects
     */
    handleCollision(event) {
        const { bodyA, bodyB, impactSpeed } = event;
        
        // Check if this part is involved in the collision
        const isInvolved = (bodyA === this.physicsBody || bodyB === this.physicsBody);
        if (!isInvolved) return;
        
        const otherBody = bodyA === this.physicsBody ? bodyB : bodyA;
        
        // Update stress based on impact
        this.stress = Math.min(this.stress + impactSpeed * 0.1, this.config.maxStress);
        
        // Damage system
        if (impactSpeed > 10) {
            this.addDamage(impactSpeed * 0.05);
        }
        
        // Play collision sound
        if (impactSpeed > 5) {
            this.playSound('hit', { intensity: Math.min(impactSpeed / 20, 1) });
        }
        
        // Create collision effects
        if (impactSpeed > 15) {
            this.createCollisionEffect(event.contactPoint, impactSpeed);
        }
        
        // Check for joint stress
        this.checkJointStress();
        
        this.emit('collision', { bodyPart: this, otherBody: otherBody, impactSpeed: impactSpeed });
    }
    
    /**
     * Handle force application
     */
    handleForceApplication(event) {
        const forceStrength = this.mathUtils.vectorMagnitude(event.force);
        
        // Update stress
        this.stress = Math.min(this.stress + forceStrength * 0.2, this.config.maxStress);
        
        // Check for overstress
        if (this.stress > this.config.maxStress * 0.8) {
            this.createStressEffect();
        }
        
        // Temperature increase from force
        this.temperature = Math.min(this.temperature + forceStrength * 0.05, 1.0);
        
        this.emit('forceApplied', { bodyPart: this, force: event.force, strength: forceStrength });
    }
    
    // ==========================================
    // DAMAGE & STRESS SYSTEM
    // ==========================================
    
    /**
     * Add damage to body part
     */
    addDamage(amount, type = 'impact') {
        this.health = Math.max(0, this.health - amount);
        this.wearLevel = Math.min(this.wearLevel + amount * 0.5, 100);
        
        // Add damage point for visual representation
        this.damagePoints.push({
            type: type,
            severity: amount,
            position: this.getRandomSurfacePoint(),
            createdAt: Date.now(),
            age: 0
        });
        
        // Limit damage points for performance
        if (this.damagePoints.length > 10) {
            this.damagePoints = this.damagePoints.slice(-10);
        }
        
        // Check if part should break
        if (this.health <= 0 && this.config.isBreakable) {
            this.breakPart('damage');
        }
        
        this.emit('damaged', { bodyPart: this, amount: amount, type: type, health: this.health });
    }
    
    /**
     * Check stress on all joints
     */
    checkJointStress() {
        for (const [partName, connection] of this.connectedParts) {
            if (!connection.isActive) continue;
            
            // Calculate current stress on joint
            const constraint = connection.joint;
            if (!constraint) continue;
            
            // Estimate stress from constraint extension
            const bodyA = constraint.bodyA;
            const bodyB = constraint.bodyB;
            
            if (bodyA && bodyB) {
                const currentDistance = this.mathUtils.distance(bodyA.position, bodyB.position);
                const restLength = constraint.length || 50;
                const extension = Math.abs(currentDistance - restLength);
                
                connection.stress = extension / restLength;
                
                // Check if joint should break
                if (connection.stress > 1.5 && connection.joint.gameData?.canBreak) {
                    this.breakJoint(connection, 'stress');
                }
            }
        }
    }
    
    /**
     * Break a joint connection
     */
    breakJoint(connection, reason = 'force') {
        if (!connection.isActive) return false;
        
        const jointName = connection.jointName;
        const otherPartName = connection.otherPart.partName;
        
        // Create break effects
        this.createJointBreakEffect(connection);
        
        // Play break sound
        this.playSound('break');
        
        // Disconnect the parts
        this.disconnectFrom(otherPartName, reason);
        
        this.emit('jointBroken', { 
            bodyPart: this, 
            jointName: jointName, 
            otherPart: otherPartName, 
            reason: reason 
        });
        
        return true;
    }
    
    /**
     * Break the entire body part
     */
    breakPart(reason = 'damage') {
        if (!this.isActive) return false;
        
        this.isActive = false;
        
        // Disconnect all joints
        const connections = Array.from(this.connectedParts.keys());
        for (const partName of connections) {
            this.disconnectFrom(partName, 'partBreak');
        }
        
        // Create dramatic break effect
        this.createBreakEffect();
        
        // Play break sound
        this.playSound('break', { intensity: 1.0 });
        
        // Remove from physics world after a delay
        setTimeout(() => {
            if (this.physicsBody && this.physics) {
                this.physics.removeBody(this.physicsBody);
            }
        }, 2000);
        
        this.emit('partBroken', { bodyPart: this, reason: reason });
        
        console.log(`💥 ${this.partName} broke due to ${reason}`);
        return true;
    }
    
    // ==========================================
    // VISUAL EFFECTS
    // ==========================================
    
    createGrabEffect(position) {
        if (!window.ParticleSystem) return;
        
        // Create small sparkle effect
        this.addVisualEffect({
            type: 'sparkles',
            position: position,
            duration: 500,
            intensity: 0.3
        });
    }
    
    createMotionEffect(direction, speed) {
        if (!window.ParticleSystem) return;
        
        const intensity = Math.min(speed / 200, 1);
        
        this.addVisualEffect({
            type: 'motion',
            direction: direction,
            intensity: intensity,
            duration: 1000
        });
    }
    
    createCollisionEffect(position, impactSpeed) {
        if (!window.ParticleSystem) return;
        
        const intensity = Math.min(impactSpeed / 30, 1);
        
        if (intensity > 0.7) {
            // Strong collision - sparks
            this.addVisualEffect({
                type: 'sparks',
                position: position,
                intensity: intensity,
                duration: 800
            });
        } else {
            // Mild collision - dust
            this.addVisualEffect({
                type: 'dust',
                position: position,
                intensity: intensity * 0.5,
                duration: 500
            });
        }
    }
    
    createStressEffect() {
        // Visual indication of stress (red glow, shaking)
        this.addVisualEffect({
            type: 'stress',
            intensity: this.stress / this.config.maxStress,
            duration: 1000
        });
    }
    
    createJointBreakEffect(connection) {
        if (!window.ParticleSystem) return;
        
        // Calculate joint position
        const jointPos = this.getJointWorldPosition(connection);
        
        this.addVisualEffect({
            type: 'jointBreak',
            position: jointPos,
            intensity: 0.8,
            duration: 1500
        });
    }
    
    createBreakEffect() {
        if (!window.ParticleSystem || !this.physicsBody) return;
        
        const position = this.physicsBody.position;
        
        // Dramatic explosion effect
        this.addVisualEffect({
            type: 'explosion',
            position: position,
            intensity: 1.0,
            duration: 2000
        });
    }
    
    addVisualEffect(effect) {
        effect.id = Date.now() + Math.random();
        effect.createdAt = Date.now();
        effect.age = 0;
        
        this.visualEffects.push(effect);
        
        // Auto-remove after duration
        setTimeout(() => {
            this.removeVisualEffect(effect.id);
        }, effect.duration);
        
        return effect.id;
    }
    
    removeVisualEffect(effectId) {
        const index = this.visualEffects.findIndex(e => e.id === effectId);
        if (index > -1) {
            this.visualEffects.splice(index, 1);
        }
    }
    
    // ==========================================
    // AUDIO SYSTEM
    // ==========================================
    
    playSound(soundType, options = {}) {
        if (!window.audioSystem?.isInitialized) return;
        
        const profile = this.soundProfile;
        const sounds = profile[soundType + 'Sounds'];
        
        if (!sounds || sounds.length === 0) return;
        
        const message = this.mathUtils.randomChoice(sounds);
        const pitch = 1.0 + (Math.random() - 0.5) * profile.pitchVariation;
        
        // Adjust based on options
        if (options.intensity) {
            const volume = Math.min(0.5 + options.intensity * 0.5, 1.0);
            window.audioSystem.speak(message, { 
                pitch: pitch,
                volume: volume,
                rate: 0.8 + options.intensity * 0.4
            });
        } else {
            window.audioSystem.speak(message, { pitch: pitch });
        }
        
        // Play sound effect if appropriate
        if (soundType === 'break' || (soundType === 'hit' && options.intensity > 0.7)) {
            window.audioSystem.playSoundEffect('pop');
        }
    }
    
    // ==========================================
    // UTILITY METHODS
    // ==========================================
    
    /**
     * Get random point on body part surface
     */
    getRandomSurfacePoint() {
        const halfWidth = this.config.width / 2;
        const halfHeight = this.config.height / 2;
        
        return {
            x: this.mathUtils.randomFloat(-halfWidth, halfWidth),
            y: this.mathUtils.randomFloat(-halfHeight, halfHeight)
        };
    }
    
    /**
     * Get world position of joint
     */
    getJointWorldPosition(connection) {
        if (!connection.joint || !this.physicsBody) {
            return { x: 0, y: 0 };
        }
        
        const constraint = connection.joint;
        const bodyA = constraint.bodyA;
        const bodyB = constraint.bodyB;
        
        if (bodyA && bodyB) {
            return {
                x: (bodyA.position.x + bodyB.position.x) / 2,
                y: (bodyA.position.y + bodyB.position.y) / 2
            };
        }
        
        return this.physicsBody.position;
    }
    
    /**
     * Darken color for border
     */
    darkenColor(color, percent) {
        if (!color.startsWith('#')) return color;
        
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }
    
    // ==========================================
    // UPDATE & MAINTENANCE
    // ==========================================
    
    /**
     * Update body part state
     */
    update(deltaTime) {
        if (!this.isActive) return;
        
        const dt = deltaTime / 1000;
        
        // Cool down temperature
        if (this.temperature > 0) {
            this.temperature = Math.max(0, this.temperature - dt * 0.5);
        }
        
        // Reduce stress over time
        if (this.stress > 0) {
            this.stress = Math.max(0, this.stress - dt * 2);
        }
        
        // Update damage points
        for (const damage of this.damagePoints) {
            damage.age += dt;
        }
        
        // Remove old damage points
        this.damagePoints = this.damagePoints.filter(d => d.age < 10); // 10 second lifetime
        
        // Update visual effects
        this.updateVisualEffects(dt);
        
        // Slow healing if not under stress
        if (this.stress < this.config.maxStress * 0.3 && this.health < 100) {
            this.health = Math.min(100, this.health + dt * 2);
        }
    }
    
    updateVisualEffects(deltaTime) {
        for (const effect of this.visualEffects) {
            effect.age += deltaTime;
        }
        
        // Remove expired effects
        const now = Date.now();
        this.visualEffects = this.visualEffects.filter(effect => {
            return (now - effect.createdAt) < effect.duration;
        });
    }
    
    // ==========================================
    // EVENTS & CALLBACKS
    // ==========================================
    
    onDisconnect(connection, reason) {
        // Handle disconnection effects
        this.createJointBreakEffect(connection);
        
        // Play disconnect sound
        this.playSound('break');
        
        // Reduce overall stability
        this.stress = Math.min(this.stress + 2, this.config.maxStress);
    }
    
    emit(eventName, data) {
        // Simple event emission (could be extended with proper event system)
        if (this.physics) {
            this.physics.emit(`bodyPart:${eventName}`, data);
        }
    }
    
    // ==========================================
    // QUERIES & GETTERS
    // ==========================================
    
    /**
     * Check if body part is connected to another
     */
    isConnectedTo(partName) {
        return this.connectedParts.has(partName);
    }
    
    /**
     * Get connection to another part
     */
    getConnectionTo(partName) {
        return this.connectedParts.get(partName);
    }
    
    /**
     * Get all connected parts
     */
    getConnectedParts() {
        return Array.from(this.connectedParts.values()).map(conn => conn.otherPart);
    }
    
    /**
     * Get body part state
     */
    getState() {
        return {
            partName: this.partName,
            ragdollId: this.ragdollId,
            isActive: this.isActive,
            health: this.health,
            stress: this.stress,
            temperature: this.temperature,
            connections: this.connectedParts.size,
            interactionCount: this.interactionCount,
            lastInteraction: this.lastInteraction,
            damagePoints: this.damagePoints.length,
            wearLevel: this.wearLevel
        };
    }
    
    /**
     * Get debug information
     */
    getDebugInfo() {
        return {
            ...this.getState(),
            
            config: this.config,
            physicsBody: {
                hasBody: !!this.physicsBody,
                position: this.physicsBody?.position,
                velocity: this.physicsBody?.velocity,
                angle: this.physicsBody?.angle
            },
            
            connections: Array.from(this.connectedParts.entries()).map(([name, conn]) => ({
                partName: name,
                jointName: conn.jointName,
                strength: conn.strength,
                stress: conn.stress,
                isActive: conn.isActive
            })),
            
            visualEffects: this.visualEffects.length,
            soundProfile: this.soundProfile
        };
    }
    
    // ==========================================
    // CLEANUP
    // ==========================================
    
    /**
     * Clean shutdown
     */
    destroy() {
        console.log(`🗑️ Destroying BodyPart: ${this.partName}`);
        
        // Disconnect all joints
        const connections = Array.from(this.connectedParts.keys());
        for (const partName of connections) {
            this.disconnectFrom(partName, 'destroy');
        }
        
        // Clear references
        this.physicsBody = null;
        this.physics = null;
        this.connectedParts.clear();
        this.joints.clear();
        this.visualEffects = [];
        this.damagePoints = [];
        
this.isActive = false;
        
        console.log(`✅ BodyPart ${this.partName} destroyed`);
    }
}

// Make available globally
window.BodyPart = BodyPart;

console.log('🦴 BodyPart loaded - Individual ragdoll limb logic ready');