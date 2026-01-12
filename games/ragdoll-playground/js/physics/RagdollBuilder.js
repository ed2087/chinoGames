// ==========================================
// RAGDOLL BUILDER - PROCEDURAL CHARACTER CREATION
// Creates articulated ragdoll characters with realistic physics
// ==========================================

class RagdollBuilder {
    
    constructor(physicsEngine, forceSystem = null) {
        this.physics = physicsEngine;
        this.forces = forceSystem;
        this.mathUtils = window.MathUtils;
        this.deviceUtils = window.DeviceUtils;
        
        // Ragdoll configurations for different character types
        this.ragdollTypes = {
            human: {
                name: 'Human',
                icon: '👤',
                description: 'Realistic human proportions',
                scale: 1.0,
                
                parts: {
                    head: { w: 35, h: 35, mass: 0.8, color: '#FDBCB4' },
                    torso: { w: 45, h: 70, mass: 2.2, color: '#4ECDC4' },
                    upperArm: { w: 12, h: 40, mass: 0.6, color: '#45B7D1' },
                    lowerArm: { w: 10, h: 35, mass: 0.4, color: '#96CEB4' },
                    hand: { w: 8, h: 15, mass: 0.2, color: '#FDBCB4' },
                    upperLeg: { w: 15, h: 45, mass: 0.9, color: '#F38BA8' },
                    lowerLeg: { w: 12, h: 40, mass: 0.7, color: '#DDA0DD' },
                    foot: { w: 20, h: 8, mass: 0.3, color: '#8B4513' }
                },
                
                joints: {
                    neck: { stiffness: 0.8, damping: 0.1, range: Math.PI / 3 },
                    shoulder: { stiffness: 0.6, damping: 0.1, range: Math.PI * 0.8 },
                    elbow: { stiffness: 0.7, damping: 0.05, range: Math.PI * 0.7 },
                    wrist: { stiffness: 0.5, damping: 0.1, range: Math.PI / 2 },
                    hip: { stiffness: 0.8, damping: 0.1, range: Math.PI * 0.6 },
                    knee: { stiffness: 0.7, damping: 0.05, range: Math.PI * 0.8 },
                    ankle: { stiffness: 0.6, damping: 0.1, range: Math.PI / 4 }
                }
            },
            
            teddy: {
                name: 'Teddy Bear',
                icon: '🧸',
                description: 'Cuddly teddy bear with stubby limbs',
                scale: 0.9,
                
                parts: {
                    head: { w: 45, h: 45, mass: 0.7, color: '#D2691E' },
                    torso: { w: 55, h: 60, mass: 1.8, color: '#CD853F' },
                    upperArm: { w: 18, h: 30, mass: 0.4, color: '#DEB887' },
                    lowerArm: { w: 15, h: 25, mass: 0.3, color: '#F4A460' },
                    hand: { w: 12, h: 12, mass: 0.2, color: '#8B4513' },
                    upperLeg: { w: 20, h: 35, mass: 0.6, color: '#D2B48C' },
                    lowerLeg: { w: 18, h: 30, mass: 0.5, color: '#DEB887' },
                    foot: { w: 15, h: 12, mass: 0.3, color: '#8B4513' }
                },
                
                joints: {
                    neck: { stiffness: 0.9, damping: 0.15, range: Math.PI / 4 },
                    shoulder: { stiffness: 0.7, damping: 0.15, range: Math.PI * 0.6 },
                    elbow: { stiffness: 0.8, damping: 0.1, range: Math.PI / 2 },
                    wrist: { stiffness: 0.6, damping: 0.15, range: Math.PI / 3 },
                    hip: { stiffness: 0.8, damping: 0.15, range: Math.PI * 0.5 },
                    knee: { stiffness: 0.7, damping: 0.1, range: Math.PI / 2 },
                    ankle: { stiffness: 0.7, damping: 0.15, range: Math.PI / 6 }
                }
            },
            
            frog: {
                name: 'Frog',
                icon: '🐸',
                description: 'Bouncy frog with powerful legs',
                scale: 0.8,
                
                parts: {
                    head: { w: 40, h: 30, mass: 0.6, color: '#90EE90' },
                    torso: { w: 50, h: 40, mass: 1.2, color: '#32CD32' },
                    upperArm: { w: 10, h: 25, mass: 0.3, color: '#9ACD32' },
                    lowerArm: { w: 8, h: 20, mass: 0.2, color: '#98FB98' },
                    hand: { w: 12, h: 8, mass: 0.15, color: '#90EE90' },
                    upperLeg: { w: 18, h: 55, mass: 1.1, color: '#228B22' },
                    lowerLeg: { w: 15, h: 50, mass: 0.9, color: '#32CD32' },
                    foot: { w: 25, h: 10, mass: 0.4, color: '#006400' }
                },
                
                joints: {
                    neck: { stiffness: 0.7, damping: 0.1, range: Math.PI / 2 },
                    shoulder: { stiffness: 0.5, damping: 0.1, range: Math.PI },
                    elbow: { stiffness: 0.6, damping: 0.05, range: Math.PI * 0.9 },
                    wrist: { stiffness: 0.4, damping: 0.1, range: Math.PI / 2 },
                    hip: { stiffness: 0.9, damping: 0.05, range: Math.PI },
                    knee: { stiffness: 0.8, damping: 0.05, range: Math.PI },
                    ankle: { stiffness: 0.7, damping: 0.1, range: Math.PI / 3 }
                }
            },
            
            robot: {
                name: 'Robot',
                icon: '🤖',
                description: 'Mechanical robot with rigid joints',
                scale: 1.1,
                
                parts: {
                    head: { w: 30, h: 30, mass: 0.9, color: '#C0C0C0' },
                    torso: { w: 40, h: 65, mass: 2.5, color: '#708090' },
                    upperArm: { w: 10, h: 38, mass: 0.7, color: '#A9A9A9' },
                    lowerArm: { w: 9, h: 32, mass: 0.5, color: '#DCDCDC' },
                    hand: { w: 10, h: 10, mass: 0.3, color: '#FF6B6B' },
                    upperLeg: { w: 12, h: 42, mass: 1.0, color: '#696969' },
                    lowerLeg: { w: 11, h: 38, mass: 0.8, color: '#A9A9A9' },
                    foot: { w: 18, h: 10, mass: 0.4, color: '#2F4F4F' }
                },
                
                joints: {
                    neck: { stiffness: 0.95, damping: 0.2, range: Math.PI / 4 },
                    shoulder: { stiffness: 0.9, damping: 0.2, range: Math.PI * 0.75 },
                    elbow: { stiffness: 0.95, damping: 0.15, range: Math.PI * 0.6 },
                    wrist: { stiffness: 0.8, damping: 0.2, range: Math.PI / 3 },
                    hip: { stiffness: 0.9, damping: 0.2, range: Math.PI * 0.5 },
                    knee: { stiffness: 0.95, damping: 0.15, range: Math.PI * 0.7 },
                    ankle: { stiffness: 0.8, damping: 0.2, range: Math.PI / 6 }
                }
            },
            
            alien: {
                name: 'Alien',
                icon: '👽',
                description: 'Otherworldly being with elongated limbs',
                scale: 1.2,
                
                parts: {
                    head: { w: 50, h: 40, mass: 0.5, color: '#E0E0E0' },
                    torso: { w: 35, h: 75, mass: 1.5, color: '#98FB98' },
                    upperArm: { w: 8, h: 50, mass: 0.3, color: '#90EE90' },
                    lowerArm: { w: 7, h: 45, mass: 0.25, color: '#98FB98' },
                    hand: { w: 15, h: 12, mass: 0.15, color: '#E0E0E0' },
                    upperLeg: { w: 10, h: 55, mass: 0.5, color: '#90EE90' },
                    lowerLeg: { w: 9, h: 50, mass: 0.4, color: '#98FB98' },
                    foot: { w: 20, h: 12, mass: 0.2, color: '#E0E0E0' }
                },
                
                joints: {
                    neck: { stiffness: 0.6, damping: 0.08, range: Math.PI / 2 },
                    shoulder: { stiffness: 0.4, damping: 0.08, range: Math.PI * 1.2 },
                    elbow: { stiffness: 0.5, damping: 0.05, range: Math.PI },
                    wrist: { stiffness: 0.3, damping: 0.08, range: Math.PI * 0.8 },
                    hip: { stiffness: 0.5, damping: 0.08, range: Math.PI },
                    knee: { stiffness: 0.4, damping: 0.05, range: Math.PI * 1.1 },
                    ankle: { stiffness: 0.4, damping: 0.08, range: Math.PI / 2 }
                }
            }
        };
        
        // Active ragdolls tracking
        this.activeRagdolls = new Map();
        this.nextRagdollId = 1;
        
        // Device-specific optimizations
        this.maxRagdolls = this.deviceUtils.performance.level === 'high' ? 5 : 
                          this.deviceUtils.performance.level === 'medium' ? 3 : 2;
        
        console.log('🎭 RagdollBuilder initialized');
        console.log(`📋 Available types: ${Object.keys(this.ragdollTypes).join(', ')}`);
    }
    
    // ==========================================
    // RAGDOLL CREATION
    // ==========================================
    
    /**
     * Create a complete ragdoll at specified position
     */
    createRagdoll(type, x, y, options = {}) {
        if (!this.ragdollTypes[type]) {
            console.warn(`Unknown ragdoll type: ${type}`);
            return null;
        }
        
        // Check ragdoll limit
        if (this.activeRagdolls.size >= this.maxRagdolls && !options.force) {
            console.warn(`Ragdoll limit reached (${this.maxRagdolls})`);
            return null;
        }
        
const config = this.ragdollTypes[type];
        const ragdollId = this.nextRagdollId++;
        
        // Apply device-specific scaling
        const deviceScale = this.deviceUtils.device.isTablet ? 1.1 : 
                           this.deviceUtils.device.isMobile ? 0.9 : 1.0;
        const finalScale = config.scale * deviceScale * (options.scale || 1.0);
        
        console.log(`🎭 Creating ${config.name} ragdoll at (${x.toFixed(1)}, ${y.toFixed(1)})`);
        
        try {
            // Create body parts
            const bodies = this.createRagdollBodies(config, x, y, finalScale, ragdollId, options);
            
            // Create joints between body parts
            const constraints = this.createRagdollJoints(config, bodies, ragdollId, options);
            
            // Create ragdoll object
            const ragdoll = {
                id: ragdollId,
                type: type,
                config: config,
                scale: finalScale,
                position: { x, y },
                bodies: bodies,
                constraints: constraints,
                createdAt: Date.now(),
                isActive: true,
                
                // Ragdoll methods
                getCenter: () => this.getRagdollCenter(ragdoll),
                applyForce: (force, point) => this.applyRagdollForce(ragdoll, force, point),
                explode: (options) => this.explodeRagdoll(ragdoll, options),
                remove: () => this.removeRagdoll(ragdoll),
                
                // State tracking
                lastInteraction: Date.now(),
                totalInteractions: 0
            };
            
            // Store ragdoll
            this.activeRagdolls.set(ragdollId, ragdoll);
            
            // Emit creation event
            this.physics.emit('ragdollCreated', { ragdoll, type, position: { x, y } });
            
            console.log(`✅ ${config.name} ragdoll created successfully (ID: ${ragdollId})`);
            return ragdoll;
            
        } catch (error) {
            console.error(`❌ Failed to create ${type} ragdoll:`, error);
            return null;
        }
    }
    
    /**
     * Create all body parts for a ragdoll
     */
    createRagdollBodies(config, centerX, centerY, scale, ragdollId, options) {
        const bodies = {};
        const parts = config.parts;
        
        // Calculate positions relative to center
        const positions = this.calculateBodyPositions(config, centerX, centerY, scale);
        
        // Create each body part
        for (const [partName, partConfig] of Object.entries(parts)) {
            const position = positions[partName];
            const scaledWidth = partConfig.w * scale;
            const scaledHeight = partConfig.h * scale;
            const scaledMass = partConfig.mass * scale * scale; // Mass scales with area
            
            // Determine body shape
            const bodyShape = this.getBodyShape(partName);
            
            const body = this.physics.createBody(
                bodyShape,
                position.x,
                position.y,
                {
                    width: scaledWidth,
                    height: scaledHeight,
                    radius: bodyShape === 'circle' ? Math.max(scaledWidth, scaledHeight) / 2 : undefined,
                    
                    // Physical properties
                    mass: scaledMass,
                    friction: 0.4,
                    restitution: 0.3,
                    frictionAir: 0.02,
                    
                    // Visual properties
                    color: options.customColors?.[partName] || partConfig.color,
                    borderColor: this.darkenColor(partConfig.color, 20),
                    
                    // Ragdoll metadata
                    label: `${config.name.toLowerCase()}-${partName}`,
                    isRagdollPart: true,
                    ragdollId: ragdollId,
                    partName: partName,
                    ragdollType: config.name,
                    canBeGrabbed: true,
                    maxVelocity: options.maxVelocity || 30,
                    
                    // Special properties for certain parts
                    ...this.getPartSpecialProperties(partName, config)
                }
            );
            
            bodies[partName] = body;
        }
        
        // Add facial features for head
        if (bodies.head && options.addFace !== false) {
            this.addFacialFeatures(bodies.head, config, scale);
        }
        
        return bodies;
    }
    

/**
 * Calculate positions for each body part relative to center
 */
calculateBodyPositions(config, centerX, centerY, scale) {
    const positions = {};
    
    // Start with torso at center
    positions.torso = { x: centerX, y: centerY };
    
    // Head above torso
    const headOffset = (config.parts.torso.h + config.parts.head.h) / 2 * scale;
    positions.head = { x: centerX, y: centerY - headOffset };
    
    // Arms from shoulders
    const shoulderY = centerY - config.parts.torso.h * 0.3 * scale;
    const shoulderOffset = config.parts.torso.w * 0.6 * scale;
    
    // Upper arms - create both left and right positions for single "upperArm" part
    positions.upperArm = { x: centerX - shoulderOffset, y: shoulderY }; // Default to left
    positions.upperArmL = { x: centerX - shoulderOffset, y: shoulderY };
    positions.upperArmR = { x: centerX + shoulderOffset, y: shoulderY };
    
    // Lower arms
    const upperArmLength = config.parts.upperArm.h * scale;
    positions.lowerArm = { x: centerX - shoulderOffset, y: shoulderY + upperArmLength }; // Default to left
    positions.lowerArmL = { x: centerX - shoulderOffset, y: shoulderY + upperArmLength };
    positions.lowerArmR = { x: centerX + shoulderOffset, y: shoulderY + upperArmLength };
    
    // Hands
    const lowerArmLength = config.parts.lowerArm.h * scale;
    positions.hand = { x: centerX - shoulderOffset, y: shoulderY + upperArmLength + lowerArmLength }; // Default to left
    positions.handL = { x: centerX - shoulderOffset, y: shoulderY + upperArmLength + lowerArmLength };
    positions.handR = { x: centerX + shoulderOffset, y: shoulderY + upperArmLength + lowerArmLength };
    
    // Legs from hips
    const hipY = centerY + config.parts.torso.h * 0.4 * scale;
    const hipOffset = config.parts.torso.w * 0.3 * scale;
    
    // Upper legs
    positions.upperLeg = { x: centerX - hipOffset, y: hipY }; // Default to left
    positions.upperLegL = { x: centerX - hipOffset, y: hipY };
    positions.upperLegR = { x: centerX + hipOffset, y: hipY };
    
    // Lower legs
    const upperLegLength = config.parts.upperLeg.h * scale;
    positions.lowerLeg = { x: centerX - hipOffset, y: hipY + upperLegLength }; // Default to left
    positions.lowerLegL = { x: centerX - hipOffset, y: hipY + upperLegLength };
    positions.lowerLegR = { x: centerX + hipOffset, y: hipY + upperLegLength };
    
    // Feet
    const lowerLegLength = config.parts.lowerLeg.h * scale;
    positions.foot = { x: centerX - hipOffset, y: hipY + upperLegLength + lowerLegLength }; // Default to left
    positions.footL = { x: centerX - hipOffset, y: hipY + upperLegLength + lowerLegLength };
    positions.footR = { x: centerX + hipOffset, y: hipY + upperLegLength + lowerLegLength };
    
    return positions;
}
    

/**
 * Create joints connecting body parts renderRagdoll
 */
createRagdollJoints(config, bodies, ragdollId, options) {
    const constraints = {};
    const joints = config.joints;
    
    // Helper function to create a joint
    const createJoint = (bodyA, bodyB, jointName, attachPointA, attachPointB) => {
        if (!bodyA || !bodyB) {
            console.warn(`Cannot create ${jointName}: missing body parts`);
            return null;
        }
        
        const jointConfig = joints[jointName] || joints.neck; // Default fallback
        
        const constraint = this.physics.createConstraint(bodyA, bodyB, {
            pointA: attachPointA,
            pointB: attachPointB,
            stiffness: jointConfig.stiffness,
            damping: jointConfig.damping,
            length: this.mathUtils.distance(
                this.mathUtils.vectorAdd(bodyA.position, attachPointA),
                this.mathUtils.vectorAdd(bodyB.position, attachPointB)
            ),
            
            // Joint limits
            angularStiffness: jointConfig.stiffness * 0.1,
            
            // Visual properties
            render: {
                visible: options.showJoints || false,
                type: 'line',
                strokeStyle: '#666',
                lineWidth: 2
            },
            
            // Ragdoll metadata
            isRagdollJoint: true,
            ragdollId: ragdollId,
            jointName: jointName,
            maxStress: 15,
            maxExtension: 50,
            canBreak: options.breakableJoints !== false,
            breakForce: 25
        });
        
        return constraint;
    };
    
    // Create all joints using the actual body part names that exist
    
    // Neck (head to torso)
    constraints.neck = createJoint(
        bodies.torso, bodies.head,
        'neck',
        { x: 0, y: -config.parts.torso.h * 0.5 }, // Top of torso
        { x: 0, y: config.parts.head.h * 0.5 }    // Bottom of head
    );
    
    // Shoulders (torso to upper arms) - using base names
    constraints.shoulderL = createJoint(
        bodies.torso, bodies.upperArm,
        'shoulder',
        { x: -config.parts.torso.w * 0.4, y: -config.parts.torso.h * 0.3 }, // Left shoulder
        { x: 0, y: -config.parts.upperArm.h * 0.4 } // Top of upper arm
    );
    
    constraints.shoulderR = createJoint(
        bodies.torso, bodies.upperArm,
        'shoulder',
        { x: config.parts.torso.w * 0.4, y: -config.parts.torso.h * 0.3 }, // Right shoulder
        { x: 0, y: -config.parts.upperArm.h * 0.4 } // Top of upper arm
    );
    
    // Elbows (upper arms to lower arms)
    constraints.elbowL = createJoint(
        bodies.upperArm, bodies.lowerArm,
        'elbow',
        { x: 0, y: config.parts.upperArm.h * 0.5 }, // Bottom of upper arm
        { x: 0, y: -config.parts.lowerArm.h * 0.5 } // Top of lower arm
    );
    
    constraints.elbowR = createJoint(
        bodies.upperArm, bodies.lowerArm,
        'elbow',
        { x: 0, y: config.parts.upperArm.h * 0.5 },
        { x: 0, y: -config.parts.lowerArm.h * 0.5 }
    );
    
    // Wrists (lower arms to hands)
    constraints.wristL = createJoint(
        bodies.lowerArm, bodies.hand,
        'wrist',
        { x: 0, y: config.parts.lowerArm.h * 0.5 }, // Bottom of lower arm
        { x: 0, y: -config.parts.hand.h * 0.3 } // Top of hand
    );
    
    constraints.wristR = createJoint(
        bodies.lowerArm, bodies.hand,
        'wrist',
        { x: 0, y: config.parts.lowerArm.h * 0.5 },
        { x: 0, y: -config.parts.hand.h * 0.3 }
    );
    
    // Hips (torso to upper legs)
    constraints.hipL = createJoint(
        bodies.torso, bodies.upperLeg,
        'hip',
        { x: -config.parts.torso.w * 0.3, y: config.parts.torso.h * 0.4 }, // Left hip
        { x: 0, y: -config.parts.upperLeg.h * 0.4 } // Top of upper leg
    );
    
    constraints.hipR = createJoint(
        bodies.torso, bodies.upperLeg,
        'hip',
        { x: config.parts.torso.w * 0.3, y: config.parts.torso.h * 0.4 }, // Right hip
        { x: 0, y: -config.parts.upperLeg.h * 0.4 } // Top of upper leg
    );
    
    // Knees (upper legs to lower legs)
    constraints.kneeL = createJoint(
        bodies.upperLeg, bodies.lowerLeg,
        'knee',
        { x: 0, y: config.parts.upperLeg.h * 0.5 }, // Bottom of upper leg
        { x: 0, y: -config.parts.lowerLeg.h * 0.5 } // Top of lower leg
    );
    
    constraints.kneeR = createJoint(
        bodies.upperLeg, bodies.lowerLeg,
        'knee',
        { x: 0, y: config.parts.upperLeg.h * 0.5 },
        { x: 0, y: -config.parts.lowerLeg.h * 0.5 }
    );
    
    // Ankles (lower legs to feet)
    constraints.ankleL = createJoint(
        bodies.lowerLeg, bodies.foot,
        'ankle',
        { x: 0, y: config.parts.lowerLeg.h * 0.5 }, // Bottom of lower leg
        { x: -config.parts.foot.w * 0.2, y: 0 } // Back of foot
    );
    
    constraints.ankleR = createJoint(
        bodies.lowerLeg, bodies.foot,
        'ankle',
        { x: 0, y: config.parts.lowerLeg.h * 0.5 },
        { x: -config.parts.foot.w * 0.2, y: 0 }
    );
    
    // Filter out null constraints
    const validConstraints = {};
    for (const [name, constraint] of Object.entries(constraints)) {
        if (constraint) {
            validConstraints[name] = constraint;
        }
    }
    
    console.log(`🔗 Created ${Object.keys(validConstraints).length} joints for ragdoll`);
    return validConstraints;
}

/**
 * Render a complete ragdoll
 */
renderRagdoll(ragdoll) {
    if (!ragdoll || !ragdoll.bodies) return;
    
    // Render all body parts
    for (const [partName, body] of Object.entries(ragdoll.bodies)) {
        if (body) {
            this.renderBody(body);
        }
    }
    
    // Render joints if debug mode is enabled
    if (this.config.showConstraints && ragdoll.constraints) {
        for (const [constraintName, constraint] of Object.entries(ragdoll.constraints)) {
            if (constraint) {
                this.renderConstraint(constraint);
            }
        }
    }
}
    
    // ==========================================
    // HELPER METHODS
    // ==========================================
    
    /**
     * Get appropriate body shape for body part renderRagdoll
     */
    getBodyShape(partName) {
        const circularParts = ['head', 'hand', 'foot'];
        return circularParts.includes(partName) ? 'circle' : 'rectangle';
    }
    
    /**
     * Get special properties for specific body parts
     */
    getPartSpecialProperties(partName, config) {
        const properties = {};
        
        switch (partName) {
            case 'head':
                properties.density = 0.8; // Lighter than default
                properties.restitution = 0.2; // Less bouncy
                break;
                
            case 'torso':
                properties.density = 1.2; // Heavier core
                properties.frictionAir = 0.01; // Less air resistance
                break;
                
            case 'hand':
            case 'foot':
                properties.friction = 0.6; // More grip
                properties.restitution = 0.1; // Less bouncy
                break;
                
            case 'upperLeg':
            case 'lowerLeg':
                if (config.name === 'Frog') {
                    properties.density = 1.3; // Strong frog legs
                    properties.restitution = 0.6; // Bouncy
                }
                break;
        }
        
        return properties;
    }
    
    /**
     * Darken a color by a percentage
     */
    darkenColor(color, percent) {
        // Convert hex to RGB, darken, convert back
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255))
            .toString(16).slice(1);
    }
    
    /**
     * Add facial features to head body
     */
    addFacialFeatures(headBody, config, scale) {
        // Store facial features in body metadata for rendering
        headBody.gameData.facialFeatures = {
            hasEyes: true,
            hasMouth: true,
            eyeStyle: config.name === 'Robot' ? 'square' : 'circle',
            mouthStyle: config.name === 'Frog' ? 'wide' : 'normal',
            scale: scale
        };
    }
    
    // ==========================================
    // RAGDOLL MANAGEMENT
    // ==========================================
    
    /**
     * Get center of mass for ragdoll
     */
    getRagdollCenter(ragdoll) {
        let totalMass = 0;
        let centerX = 0;
        let centerY = 0;
        
        for (const body of Object.values(ragdoll.bodies)) {
            const mass = body.mass;
            centerX += body.position.x * mass;
            centerY += body.position.y * mass;
            totalMass += mass;
        }
        
        return {
            x: centerX / totalMass,
            y: centerY / totalMass
        };
    }
    
    /**
     * Apply force to entire ragdoll
     */
    applyRagdollForce(ragdoll, force, applicationPoint = null) {
        const center = applicationPoint || this.getRagdollCenter(ragdoll);
        const bodies = Object.values(ragdoll.bodies);
        
        if (this.forces) {
            return this.forces.applyRagdollForce(bodies, force, center);
        } else {
            // Fallback: apply force to each body part
            bodies.forEach(body => {
                this.physics.applyForce(body, force);
            });
            return true;
        }
    }
    
    /**
     * Explode ragdoll with dramatic effect
     */
    explodeRagdoll(ragdoll, options = {}) {
        const center = this.getRagdollCenter(ragdoll);
        const explosionForce = options.force || 0.2;
        const bodies = Object.values(ragdoll.bodies);
        
        // Apply explosion forces to each body part
        bodies.forEach(body => {
            const direction = this.mathUtils.vectorSubtract(body.position, center);
            const distance = Math.max(10, this.mathUtils.vectorMagnitude(direction));
            const normalizedDirection = this.mathUtils.vectorNormalize(direction);
            
            // Vary force based on body part
            let forceMultiplier = 1.0;
            const partName = body.gameData?.partName;
            
            if (partName === 'head') forceMultiplier = 0.8; // Head flies less
            if (partName === 'hand' || partName === 'foot') forceMultiplier = 1.2; // Extremities fly more
            
            const force = this.mathUtils.vectorMultiply(normalizedDirection, explosionForce * forceMultiplier);
            this.physics.applyForce(body, force);
            
            // Wake up all parts
            if (typeof Matter !== 'undefined') {
                Matter.Sleeping.set(body, false);
            }
        });
        
        // Create visual explosion effect
        if (this.forces) {
            this.forces.createExplosionEffect(center, 100);
            this.forces.createScreenShake(explosionForce);
        }
        
        // Audio feedback
        if (window.audioSystem?.isInitialized) {
            window.audioSystem.speak(`BOOM! The ${ragdoll.config.name} exploded!`);
            window.audioSystem.playSoundEffect('celebration');
        }
        
        // Update ragdoll interaction stats
        ragdoll.lastInteraction = Date.now();
        ragdoll.totalInteractions++;
        
        this.physics.emit('ragdollExploded', { ragdoll, center, force: explosionForce });
        console.log(`💥 Exploded ${ragdoll.config.name} ragdoll`);
        
        return true;
    }
    
    /**
     * Remove ragdoll completely
     */
    removeRagdoll(ragdoll) {
        if (!ragdoll || !this.activeRagdolls.has(ragdoll.id)) {
            console.warn('Cannot remove ragdoll: not found');
            return false;
        }
        
        try {
            // Remove all body parts
            for (const body of Object.values(ragdoll.bodies)) {
                this.physics.removeBody(body);
            }
            
            // Remove all constraints
            for (const constraint of Object.values(ragdoll.constraints)) {
                this.physics.removeConstraint(constraint);
            }
            
            // Remove from active ragdolls
            this.activeRagdolls.delete(ragdoll.id);
            
            // Mark as inactive
            ragdoll.isActive = false;
            
            this.physics.emit('ragdollRemoved', { ragdoll });
            console.log(`🗑️ Removed ${ragdoll.config.name} ragdoll (ID: ${ragdoll.id})`);
            
            return true;
        } catch (error) {
            console.error('Failed to remove ragdoll:', error);
            return false;
        }
    }
    
    /**
     * Get ragdoll by ID
     */
    getRagdoll(ragdollId) {
        return this.activeRagdolls.get(ragdollId);
    }
    
    /**
     * Get all active ragdolls
     */
    getAllRagdolls() {
        return Array.from(this.activeRagdolls.values());
    }
    
    /**
     * Get ragdoll containing specific body
     */
    getRagdollByBody(body) {
        const ragdollId = body.gameData?.ragdollId;
        return ragdollId ? this.activeRagdolls.get(ragdollId) : null;
    }
    
    /**
     * Clear all ragdolls
     */
    clearAllRagdolls() {
        console.log(`🧹 Clearing ${this.activeRagdolls.size} ragdolls...`);
        
        for (const ragdoll of this.activeRagdolls.values()) {
            this.removeRagdoll(ragdoll);
        }
        
        console.log('✅ All ragdolls cleared');
    }
    
    // ==========================================
    // RAGDOLL INTERACTION METHODS
    // ==========================================
    
    /**
     * Find closest grabbable body part at position
     */
    findGrabbableBodyPart(position, radius = 40) {
        let closestBody = null;
        let closestDistance = Infinity;
        
        for (const ragdoll of this.activeRagdolls.values()) {
            for (const body of Object.values(ragdoll.bodies)) {
                if (!body.gameData?.canBeGrabbed) continue;
                
                const distance = this.mathUtils.distance(position, body.position);
                if (distance <= radius && distance < closestDistance) {
                    closestDistance = distance;
                    closestBody = body;
                }
            }
        }
        
        return closestBody;
    }
    
    /**
     * Highlight grabbable body parts near position
     */
    highlightNearbyParts(position, radius = 50) {
        const nearbyParts = [];
        
        for (const ragdoll of this.activeRagdolls.values()) {
            for (const [partName, body] of Object.entries(ragdoll.bodies)) {
                const distance = this.mathUtils.distance(position, body.position);
                if (distance <= radius) {
                    nearbyParts.push({ body, partName, distance, ragdoll });
                }
            }
        }
        
        return nearbyParts.sort((a, b) => a.distance - b.distance);
    }
    
    /**
     * Make ragdoll perform action
     */
    performRagdollAction(ragdoll, action, options = {}) {
        switch (action) {
            case 'jump':
                this.makeRagdollJump(ragdoll, options);
                break;
                
            case 'dance':
                this.makeRagdollDance(ragdoll, options);
                break;
                
            case 'wave':
                this.makeRagdollWave(ragdoll, options);
                break;
                
            case 'fall':
                this.makeRagdollFall(ragdoll, options);
                break;
                
            default:
                console.warn(`Unknown ragdoll action: ${action}`);
                return false;
        }
        
        ragdoll.lastInteraction = Date.now();
        ragdoll.totalInteractions++;
        
        return true;
    }
    
    makeRagdollJump(ragdoll, options = {}) {
        const jumpForce = options.force || -0.8;
        const bodies = Object.values(ragdoll.bodies);
        
        // Apply upward force to all body parts
        bodies.forEach(body => {
            let partForce = jumpForce;
            
            // Legs provide most of the jump force
            if (body.gameData?.partName?.includes('Leg')) {
                partForce *= 1.5;
            }
            
            this.physics.applyForce(body, { x: 0, y: partForce });
        });
        
        // Audio feedback
        if (window.audioSystem?.isInitialized) {
            window.audioSystem.speak(`${ragdoll.config.name} is jumping!`);
        }
    }
    
    makeRagdollDance(ragdoll, options = {}) {
        const duration = options.duration || 2000;
        const intensity = options.intensity || 0.3;
        
        let dancePhase = 0;
        const danceInterval = setInterval(() => {
            if (Date.now() - ragdoll.lastInteraction > duration) {
                clearInterval(danceInterval);
                return;
            }
            
            dancePhase += 0.5;
            
            // Apply rhythmic forces to arms and legs
            const armForce = Math.sin(dancePhase) * intensity;
            const legForce = Math.cos(dancePhase * 1.5) * intensity;
            
            ['upperArmL', 'upperArmR', 'lowerArmL', 'lowerArmR'].forEach(partName => {
                const body = ragdoll.bodies[partName];
                if (body) {
                    this.physics.applyForce(body, { x: armForce, y: 0 });
                }
            });
            
            ['upperLegL', 'upperLegR'].forEach(partName => {
                const body = ragdoll.bodies[partName];
                if (body) {
                    this.physics.applyForce(body, { x: legForce * 0.5, y: legForce });
                }
            });
        }, 100);
        
        // Audio feedback
        if (window.audioSystem?.isInitialized) {
            window.audioSystem.speak(`Look! The ${ragdoll.config.name} is dancing!`);
        }
    }
    
    makeRagdollWave(ragdoll, options = {}) {
        const hand = ragdoll.bodies.handR || ragdoll.bodies.handL;
        if (!hand) return;
        
        const waveForce = options.force || 0.5;
        const waves = options.waves || 3;
        
        for (let i = 0; i < waves; i++) {
            setTimeout(() => {
                this.physics.applyForce(hand, { x: 0, y: -waveForce });
                
                setTimeout(() => {
                    this.physics.applyForce(hand, { x: 0, y: waveForce * 0.5 });
                }, 150);
            }, i * 400);
        }
        
        // Audio feedback
        if (window.audioSystem?.isInitialized) {
            window.audioSystem.speak(`${ragdoll.config.name} says hello!`);
        }
    }
    
    makeRagdollFall(ragdoll, options = {}) {
        const direction = options.direction || { x: this.mathUtils.randomFloat(-0.5, 0.5), y: 0 };
        const force = options.force || 0.8;
        
        // Apply force to torso to make ragdoll fall
        const torso = ragdoll.bodies.torso;
        if (torso) {
            const fallForce = this.mathUtils.vectorMultiply(direction, force);
            this.physics.applyForce(torso, fallForce);
        }
        
        // Audio feedback
        if (window.audioSystem?.isInitialized) {
            window.audioSystem.speak(`Whoops! Down goes the ${ragdoll.config.name}!`);
        }
    }
    
    // ==========================================
    // UTILITY AND DEBUG METHODS
    // ==========================================
    
    /**
     * Get ragdoll statistics
     */
    getStats() {
        const stats = {
            totalRagdolls: this.activeRagdolls.size,
            maxRagdolls: this.maxRagdolls,
            ragdollTypes: {},
            totalBodies: 0,
            totalConstraints: 0,
            oldestRagdoll: null,
            mostActiveRagdoll: null
        };
        
        let oldestTime = Date.now();
        let maxInteractions = 0;
        
        for (const ragdoll of this.activeRagdolls.values()) {
            // Count by type
            const type = ragdoll.type;
            stats.ragdollTypes[type] = (stats.ragdollTypes[type] || 0) + 1;
            
            // Count bodies and constraints
            stats.totalBodies += Object.keys(ragdoll.bodies).length;
            stats.totalConstraints += Object.keys(ragdoll.constraints).length;
            
            // Find oldest
if (ragdoll.createdAt < oldestTime) {
                oldestTime = ragdoll.createdAt;
                stats.oldestRagdoll = ragdoll;
            }
            
            // Find most active
            if (ragdoll.totalInteractions > maxInteractions) {
                maxInteractions = ragdoll.totalInteractions;
                stats.mostActiveRagdoll = ragdoll;
            }
        }
        
        return stats;
    }
    
    /**
     * Get available ragdoll types
     */
    getAvailableTypes() {
        return Object.keys(this.ragdollTypes).map(type => ({
            type: type,
            name: this.ragdollTypes[type].name,
            icon: this.ragdollTypes[type].icon,
            description: this.ragdollTypes[type].description,
            scale: this.ragdollTypes[type].scale
        }));
    }
    
    /**
     * Create random ragdoll type
     */
    createRandomRagdoll(x, y, options = {}) {
        const types = Object.keys(this.ragdollTypes);
        const randomType = this.mathUtils.randomChoice(types);
        return this.createRagdoll(randomType, x, y, options);
    }
    
    /**
     * Create multiple ragdolls in formation
     */
    createRagdollFormation(centerX, centerY, count = 3, options = {}) {
        const ragdolls = [];
        const radius = options.radius || 100;
        const types = options.types || Object.keys(this.ragdollTypes);
        
        for (let i = 0; i < count && this.activeRagdolls.size < this.maxRagdolls; i++) {
            const angle = (i / count) * Math.PI * 2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            const type = options.sameType ? types[0] : this.mathUtils.randomChoice(types);
            const ragdoll = this.createRagdoll(type, x, y, options);
            
            if (ragdoll) {
                ragdolls.push(ragdoll);
            }
        }
        
        // Audio feedback
        if (window.audioSystem?.isInitialized && ragdolls.length > 0) {
            window.audioSystem.speak(`Created ${ragdolls.length} ragdolls!`);
            if (ragdolls.length > 2) {
                window.audioSystem.speak(`It's a ragdoll party!`);
            }
        }
        
        return ragdolls;
    }
    
    /**
     * Apply physics effect to all ragdolls
     */
    applyGlobalEffect(effectType, options = {}) {
        const ragdolls = Array.from(this.activeRagdolls.values());
        if (ragdolls.length === 0) return;
        
        switch (effectType) {
            case 'explodeAll':
                ragdolls.forEach(ragdoll => {
                    this.explodeRagdoll(ragdoll, options);
                });
                break;
                
            case 'jumpAll':
                ragdolls.forEach(ragdoll => {
                    this.makeRagdollJump(ragdoll, options);
                });
                break;
                
            case 'danceParty':
                ragdolls.forEach((ragdoll, index) => {
                    setTimeout(() => {
                        this.makeRagdollDance(ragdoll, options);
                    }, index * 200); // Stagger the dancing
                });
                break;
                
            case 'freeze':
                this.freezeAllRagdolls(options.duration || 2000);
                break;
                
            case 'antigravity':
                this.applyAntigravity(options.duration || 3000);
                break;
                
            default:
                console.warn(`Unknown global effect: ${effectType}`);
                return false;
        }
        
        console.log(`🌟 Applied ${effectType} to ${ragdolls.length} ragdolls`);
        return true;
    }
    
    /**
     * Freeze all ragdolls temporarily
     */
    freezeAllRagdolls(duration = 2000) {
        const frozenBodies = [];
        
        for (const ragdoll of this.activeRagdolls.values()) {
            for (const body of Object.values(ragdoll.bodies)) {
                frozenBodies.push({
                    body: body,
                    velocity: { ...body.velocity },
                    angularVelocity: body.angularVelocity
                });
                
                // Freeze body
                if (typeof Matter !== 'undefined') {
                    Matter.Body.setVelocity(body, { x: 0, y: 0 });
                    Matter.Body.setAngularVelocity(body, 0);
                }
                body.frictionAir = 1.0;
            }
        }
        
        // Restore after duration
        setTimeout(() => {
            for (const frozenData of frozenBodies) {
                if (this.physics.bodies.has(frozenData.body.id)) {
                    frozenData.body.frictionAir = 0.02; // Reset air friction
                }
            }
            
            if (window.audioSystem?.isInitialized) {
                window.audioSystem.speak('Unfreeze! Everyone can move again!');
            }
        }, duration);
        
        if (window.audioSystem?.isInitialized) {
            window.audioSystem.speak('Time freeze! Everyone stop moving!');
        }
    }
    
    /**
     * Apply antigravity effect
     */
    applyAntigravity(duration = 3000) {
        const originalGravity = { ...this.physics.world.gravity };
        
        // Reverse gravity
        this.physics.world.gravity.y = -Math.abs(originalGravity.y);
        
        // Restore gravity after duration
        setTimeout(() => {
            this.physics.world.gravity.y = originalGravity.y;
            
            if (window.audioSystem?.isInitialized) {
                window.audioSystem.speak('Gravity is back to normal!');
            }
        }, duration);
        
        if (window.audioSystem?.isInitialized) {
            window.audioSystem.speak('Antigravity activated! Everything is floating!');
        }
    }
    
    /**
     * Enable debug mode for ragdolls
     */
    enableDebugMode() {
        // Show all joint constraints
        for (const ragdoll of this.activeRagdolls.values()) {
            for (const constraint of Object.values(ragdoll.constraints)) {
                constraint.render.visible = true;
            }
        }
        
        console.log('🐛 Ragdoll debug mode enabled - showing all joints');
    }
    
    /**
     * Disable debug mode
     */
    disableDebugMode() {
        for (const ragdoll of this.activeRagdolls.values()) {
            for (const constraint of Object.values(ragdoll.constraints)) {
                constraint.render.visible = false;
            }
        }
        
        console.log('🐛 Ragdoll debug mode disabled');
    }
    
    /**
     * Export ragdoll configuration for saving
     */
    exportRagdoll(ragdoll) {
        if (!ragdoll) return null;
        
        const center = this.getRagdollCenter(ragdoll);
        
        return {
            id: ragdoll.id,
            type: ragdoll.type,
            scale: ragdoll.scale,
            position: center,
            createdAt: ragdoll.createdAt,
            totalInteractions: ragdoll.totalInteractions,
            
            // Body positions (relative to center)
            bodyPositions: Object.fromEntries(
                Object.entries(ragdoll.bodies).map(([name, body]) => [
                    name,
                    {
                        x: body.position.x - center.x,
                        y: body.position.y - center.y,
                        angle: body.angle
                    }
                ])
            )
        };
    }
    
    /**
     * Import ragdoll from saved configuration
     */
    importRagdoll(savedRagdoll, x, y) {
        const options = {
            scale: savedRagdoll.scale,
            preservePositions: true,
            bodyPositions: savedRagdoll.bodyPositions
        };
        
        return this.createRagdoll(savedRagdoll.type, x, y, options);
    }
    
    /**
     * Clean up inactive or old ragdolls
     */
    cleanupRagdolls() {
        const now = Date.now();
        const maxAge = 300000; // 5 minutes
        const ragdollsToRemove = [];
        
        for (const ragdoll of this.activeRagdolls.values()) {
            // Check age
            if (now - ragdoll.createdAt > maxAge) {
                ragdollsToRemove.push(ragdoll);
                continue;
            }
            
            // Check if bodies are out of bounds
            const center = this.getRagdollCenter(ragdoll);
            const bounds = this.physics.world.bounds;
            
            if (center.x < bounds.min.x - 500 || center.x > bounds.max.x + 500 ||
                center.y < bounds.min.y - 200 || center.y > bounds.max.y + 1000) {
                ragdollsToRemove.push(ragdoll);
            }
        }
        
        // Remove old/out-of-bounds ragdolls
        for (const ragdoll of ragdollsToRemove) {
            console.log(`🧹 Cleaning up ${ragdoll.config.name} ragdoll (age: ${((now - ragdoll.createdAt) / 1000).toFixed(1)}s)`);
            this.removeRagdoll(ragdoll);
        }
        
        return ragdollsToRemove.length;
    }
    
    /**
     * Update ragdoll system (called each frame)
     */
    update(deltaTime) {
        // Cleanup old ragdolls occasionally
        if (Date.now() % 30000 < deltaTime) { // Every 30 seconds
            this.cleanupRagdolls();
        }
        
        // Update ragdoll states
        for (const ragdoll of this.activeRagdolls.values()) {
            // Update ragdoll center position for tracking
            ragdoll.position = this.getRagdollCenter(ragdoll);
            
            // Check for broken joints
            for (const [jointName, constraint] of Object.entries(ragdoll.constraints)) {
                if (!this.physics.constraints.has(constraint.id)) {
                    // Joint was broken - remove from ragdoll
                    delete ragdoll.constraints[jointName];
                    console.log(`💔 ${ragdoll.config.name} lost ${jointName} joint`);
                }
            }
        }
    }
    
    /**
     * Get debug information
     */
    getDebugInfo() {
        const stats = this.getStats();
        
        return {
            activeRagdolls: stats.totalRagdolls,
            maxRagdolls: this.maxRagdolls,
            totalBodies: stats.totalBodies,
            totalConstraints: stats.totalConstraints,
            ragdollTypes: stats.ragdollTypes,
            oldestRagdollAge: stats.oldestRagdoll ? 
                Math.floor((Date.now() - stats.oldestRagdoll.createdAt) / 1000) : 0,
            mostInteractions: stats.mostActiveRagdoll?.totalInteractions || 0
        };
    }
    
    /**
     * Clean shutdown
     */
    destroy() {
        console.log('🗑️ Destroying RagdollBuilder...');
        
        // Remove all ragdolls
        this.clearAllRagdolls();
        
        // Clear references
        this.activeRagdolls.clear();
        this.physics = null;
        this.forces = null;
        
        console.log('✅ RagdollBuilder destroyed');
    }
}

// Make available globally calculateBodyPositions
window.RagdollBuilder = RagdollBuilder;

console.log('🎭 RagdollBuilder loaded - Advanced ragdoll creation and management ready');