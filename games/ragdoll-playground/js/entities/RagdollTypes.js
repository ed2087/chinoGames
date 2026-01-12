// ==========================================
// RAGDOLL TYPES - CHARACTER DEFINITIONS
// Defines all ragdoll character types with their unique properties
// ==========================================

class RagdollTypes {
    
    constructor() {
        this.mathUtils = window.MathUtils;
        this.deviceUtils = window.DeviceUtils;
        
        // Initialize all ragdoll type definitions
        this.types = this.createTypeDefinitions();
        
        // Device-specific scaling
        this.deviceScale = this.getDeviceScale();
        
        console.log('🎭 RagdollTypes initialized');
        console.log(`📋 Available types: ${Object.keys(this.types).join(', ')}`);
    }
    
    // ==========================================
    // TYPE DEFINITIONS
    // ==========================================
    
    createTypeDefinitions() {
        return {
            // ==========================================
            // HUMAN - Realistic proportions
            // ==========================================
            human: {
                name: 'Human',
                displayName: 'Human',
                icon: '👤',
                description: 'Realistic human proportions with balanced movement',
                category: 'realistic',
                
                // Visual properties
                colors: {
                    skin: '#FDBCB4',
                    clothing: '#4ECDC4',
                    hair: '#8B4513',
                    accent: '#45B7D1'
                },
                
                // Physical scale
                scale: 1.0,
                mass: 1.0,
                
                // Body parts configuration
                parts: {
                    head: {
                        w: 35, h: 35,
                        mass: 0.8,
                        color: '#FDBCB4',
                        density: 0.0008,
                        friction: 0.4,
                        restitution: 0.2,
                        shape: 'circle',
                        specialFeatures: {
                            hasEyes: true,
                            hasMouth: true,
                            eyeStyle: 'normal',
                            mouthStyle: 'smile'
                        },
                        attachmentPoints: {
                            neck: { x: 0, y: 0.5, strength: 0.9 }
                        },
                        soundProfile: 'expressive'
                    },
                    
                    torso: {
                        w: 45, h: 70,
                        mass: 2.2,
                        color: '#4ECDC4',
                        density: 0.001,
                        friction: 0.5,
                        restitution: 0.3,
                        shape: 'roundedRect',
                        attachmentPoints: {
                            neck: { x: 0, y: -0.5, strength: 0.9 },
                            shoulderL: { x: -0.4, y: -0.3, strength: 0.8 },
                            shoulderR: { x: 0.4, y: -0.3, strength: 0.8 },
                            hipL: { x: -0.25, y: 0.4, strength: 0.9 },
                            hipR: { x: 0.25, y: 0.4, strength: 0.9 }
                        },
                        soundProfile: 'deep'
                    },
                    
                    upperArm: {
                        w: 12, h: 40,
                        mass: 0.6,
                        color: '#45B7D1',
                        density: 0.0009,
                        friction: 0.4,
                        restitution: 0.4,
                        attachmentPoints: {
                            shoulder: { x: 0, y: -0.45, strength: 0.8 },
                            elbow: { x: 0, y: 0.5, strength: 0.7 }
                        }
                    },
                    
                    lowerArm: {
                        w: 10, h: 35,
                        mass: 0.4,
                        color: '#96CEB4',
                        density: 0.0008,
                        friction: 0.4,
                        restitution: 0.4,
                        attachmentPoints: {
                            elbow: { x: 0, y: -0.5, strength: 0.7 },
                            wrist: { x: 0, y: 0.5, strength: 0.6 }
                        }
                    },
                    
                    hand: {
                        w: 8, h: 15,
                        mass: 0.2,
                        color: '#FDBCB4',
                        density: 0.0007,
                        friction: 0.6,
                        restitution: 0.1,
                        shape: 'circle',
                        attachmentPoints: {
                            wrist: { x: 0, y: -0.3, strength: 0.6 }
                        },
                        specialFeatures: {
                            canGrip: true,
                            flexibility: 'high'
                        }
                    },
                    
                    upperLeg: {
                        w: 15, h: 45,
                        mass: 0.9,
                        color: '#F38BA8',
                        density: 0.001,
                        friction: 0.4,
                        restitution: 0.4,
                        attachmentPoints: {
                            hip: { x: 0, y: -0.4, strength: 0.9 },
                            knee: { x: 0, y: 0.5, strength: 0.8 }
                        }
                    },
                    
                    lowerLeg: {
                        w: 12, h: 40,
                        mass: 0.7,
                        color: '#DDA0DD',
                        density: 0.0009,
                        friction: 0.4,
                        restitution: 0.5,
                        attachmentPoints: {
                            knee: { x: 0, y: -0.5, strength: 0.8 },
                            ankle: { x: 0, y: 0.5, strength: 0.7 }
                        }
                    },
                    
                    foot: {
                        w: 20, h: 8,
                        mass: 0.3,
                        color: '#8B4513',
                        density: 0.0008,
                        friction: 0.8,
                        restitution: 0.1,
                        shape: 'oval',
                        attachmentPoints: {
                            ankle: { x: -0.2, y: 0, strength: 0.7 }
                        },
                        specialFeatures: {
                            grip: 'moderate'
                        }
                    }
                },
                
                // Joint configuration
                joints: {
                    neck: { stiffness: 0.8, damping: 0.1, range: Math.PI / 3 },
                    shoulder: { stiffness: 0.6, damping: 0.1, range: Math.PI * 0.8 },
                    elbow: { stiffness: 0.7, damping: 0.05, range: Math.PI * 0.7 },
                    wrist: { stiffness: 0.5, damping: 0.1, range: Math.PI / 2 },
                    hip: { stiffness: 0.8, damping: 0.1, range: Math.PI * 0.6 },
                    knee: { stiffness: 0.7, damping: 0.05, range: Math.PI * 0.8 },
                    ankle: { stiffness: 0.6, damping: 0.1, range: Math.PI / 4 }
                },
                
                // Behavioral properties
                behavior: {
                    personality: 'balanced',
                    mobility: 'normal',
                    durability: 'normal',
                    flexibility: 'normal'
                },
                
                // Audio properties
                voice: {
                    pitch: 1.2,
                    rate: 0.8,
                    expressions: ['Hello!', 'Wow!', 'That tickles!', 'Whee!', 'Amazing!']
                }
            },
            
            // ==========================================
            // TEDDY BEAR - Cute and cuddly
            // ==========================================
            teddy: {
                name: 'Teddy Bear',
                displayName: 'Teddy Bear',
                icon: '🧸',
                description: 'Cuddly teddy bear with stubby limbs and bouncy movement',
                category: 'cute',
                
                colors: {
                    fur: '#D2691E',
                    belly: '#F4A460',
                    accent: '#8B4513',
                    details: '#654321'
                },
                
                scale: 0.9,
                mass: 0.8, // Lighter and fluffier
                
                parts: {
                    head: {
                        w: 45, h: 45,
                        mass: 0.7,
                        color: '#D2691E',
                        density: 0.0006,
                        friction: 0.6,
                        restitution: 0.5,
                        shape: 'circle',
                        specialFeatures: {
                            hasEars: true,
                            earStyle: 'round',
                            hasEyes: true,
                            eyeStyle: 'button',
                            hasMouth: true,
                            mouthStyle: 'stitched',
                            texture: 'fuzzy'
                        },
                        attachmentPoints: {
                            neck: { x: 0, y: 0.4, strength: 0.9 }
                        },
                        soundProfile: 'cute'
                    },
                    
                    torso: {
                        w: 55, h: 60,
                        mass: 1.8,
                        color: '#CD853F',
                        density: 0.0007,
                        friction: 0.6,
                        restitution: 0.6,
                        shape: 'roundedRect',
                        specialFeatures: {
                            hasBelly: true,
                            bellyColor: '#F4A460',
                            texture: 'soft'
                        },
                        attachmentPoints: {
                            neck: { x: 0, y: -0.45, strength: 0.9 },
                            shoulderL: { x: -0.45, y: -0.25, strength: 0.7 },
                            shoulderR: { x: 0.45, y: -0.25, strength: 0.7 },
                            hipL: { x: -0.3, y: 0.45, strength: 0.8 },
                            hipR: { x: 0.3, y: 0.45, strength: 0.8 }
                        }
                    },
                    
                    upperArm: {
                        w: 18, h: 30,
                        mass: 0.4,
                        color: '#DEB887',
                        density: 0.0006,
                        friction: 0.5,
                        restitution: 0.7,
                        specialFeatures: {
                            texture: 'plush',
                            squishiness: 'high'
                        },
                        attachmentPoints: {
                            shoulder: { x: 0, y: -0.4, strength: 0.7 },
                            elbow: { x: 0, y: 0.5, strength: 0.6 }
                        }
                    },
                    
                    lowerArm: {
                        w: 15, h: 25,
                        mass: 0.3,
                        color: '#F4A460',
                        density: 0.0005,
                        friction: 0.5,
                        restitution: 0.7,
                        attachmentPoints: {
                            elbow: { x: 0, y: -0.5, strength: 0.6 },
                            wrist: { x: 0, y: 0.5, strength: 0.5 }
                        }
                    },
                    
                    hand: {
                        w: 12, h: 12,
                        mass: 0.2,
                        color: '#8B4513',
                        density: 0.0005,
                        friction: 0.7,
                        restitution: 0.4,
                        shape: 'circle',
                        specialFeatures: {
                            isPaw: true,
                            pawPads: true
                        },
                        attachmentPoints: {
                            wrist: { x: 0, y: -0.2, strength: 0.5 }
                        }
                    },
                    
                    upperLeg: {
                        w: 20, h: 35,
                        mass: 0.6,
                        color: '#D2B48C',
                        density: 0.0007,
                        friction: 0.5,
                        restitution: 0.7,
                        attachmentPoints: {
                            hip: { x: 0, y: -0.4, strength: 0.8 },
                            knee: { x: 0, y: 0.5, strength: 0.6 }
                        }
                    },
                    
                    lowerLeg: {
                        w: 18, h: 30,
                        mass: 0.5,
                        color: '#DEB887',
                        density: 0.0006,
                        friction: 0.5,
                        restitution: 0.7,
                        attachmentPoints: {
                            knee: { x: 0, y: -0.5, strength: 0.6 },
                            ankle: { x: 0, y: 0.5, strength: 0.5 }
                        }
                    },
                    
                    foot: {
                        w: 15, h: 12,
                        mass: 0.3,
                        color: '#8B4513',
                        density: 0.0006,
                        friction: 0.8,
                        restitution: 0.3,
                        shape: 'oval',
                        specialFeatures: {
                            isPaw: true,
                            pawPads: true,
                            claws: false
                        },
                        attachmentPoints: {
                            ankle: { x: -0.1, y: 0, strength: 0.5 }
                        }
                    }
                },
                
                joints: {
                    neck: { stiffness: 0.9, damping: 0.15, range: Math.PI / 4 },
                    shoulder: { stiffness: 0.7, damping: 0.15, range: Math.PI * 0.6 },
                    elbow: { stiffness: 0.8, damping: 0.1, range: Math.PI / 2 },
                    wrist: { stiffness: 0.6, damping: 0.15, range: Math.PI / 3 },
                    hip: { stiffness: 0.8, damping: 0.15, range: Math.PI * 0.5 },
                    knee: { stiffness: 0.7, damping: 0.1, range: Math.PI / 2 },
                    ankle: { stiffness: 0.7, damping: 0.15, range: Math.PI / 6 }
                },
                
                behavior: {
                    personality: 'cuddly',
                    mobility: 'bouncy',
                    durability: 'soft',
                    flexibility: 'high'
                },
                
                voice: {
                    pitch: 1.5,
                    rate: 0.7,
                    expressions: ['Squeak!', 'Cuddle time!', 'So soft!', 'Bouncy!', 'Hug me!']
                }
            },
            
            // ==========================================
            // FROG - Bouncy with powerful legs
            // ==========================================
            frog: {
                name: 'Frog',
                displayName: 'Frog',
                icon: '🐸',
                description: 'Bouncy frog with powerful legs and webbed feet',
                category: 'animal',
                
                colors: {
                    skin: '#90EE90',
                    belly: '#98FB98',
                    legs: '#32CD32',
                    accent: '#228B22'
                },
                
                scale: 0.8,
                mass: 0.9,
                
                parts: {
                    head: {
                        w: 40, h: 30,
                        mass: 0.6,
                        color: '#90EE90',
                        density: 0.0007,
                        friction: 0.3,
                        restitution: 0.6,
                        shape: 'oval',
                        specialFeatures: {
                            hasEyes: true,
                            eyeStyle: 'bulging',
                            eyePosition: 'top',
                            hasMouth: true,
                            mouthStyle: 'wide',
                            tongue: 'extendable'
                        },
                        attachmentPoints: {
                            neck: { x: 0, y: 0.6, strength: 0.8 }
                        },
                        soundProfile: 'croaky'
                    },
                    
                    torso: {
                        w: 50, h: 40,
                        mass: 1.2,
                        color: '#32CD32',
                        density: 0.0008,
                        friction: 0.4,
                        restitution: 0.5,
                        shape: 'oval',
                        specialFeatures: {
                            hasBelly: true,
                            bellyColor: '#98FB98',
                            expandable: true
                        },
                        attachmentPoints: {
                            neck: { x: 0, y: -0.6, strength: 0.8 },
                            shoulderL: { x: -0.5, y: -0.2, strength: 0.6 },
                            shoulderR: { x: 0.5, y: -0.2, strength: 0.6 },
                            hipL: { x: -0.4, y: 0.5, strength: 0.9 },
                            hipR: { x: 0.4, y: 0.5, strength: 0.9 }
                        }
                    },
                    
                    upperArm: {
                        w: 10, h: 25,
                        mass: 0.3,
                        color: '#9ACD32',
                        density: 0.0006,
                        friction: 0.3,
                        restitution: 0.7,
                        attachmentPoints: {
                            shoulder: { x: 0, y: -0.4, strength: 0.6 },
                            elbow: { x: 0, y: 0.5, strength: 0.5 }
                        }
                    },
                    
                    lowerArm: {
                        w: 8, h: 20,
                        mass: 0.2,
                        color: '#98FB98',
                        density: 0.0005,
                        friction: 0.3,
                        restitution: 0.7,
                        attachmentPoints: {
                            elbow: { x: 0, y: -0.5, strength: 0.5 },
                            wrist: { x: 0, y: 0.5, strength: 0.4 }
                        }
                    },
                    
                    hand: {
                        w: 12, h: 8,
                        mass: 0.15,
                        color: '#90EE90',
                        density: 0.0004,
                        friction: 0.5,
                        restitution: 0.4,
                        shape: 'oval',
                        specialFeatures: {
                            hasWebbing: true,
                            sticky: true,
                            canCling: true
                        },
                        attachmentPoints: {
                            wrist: { x: 0, y: -0.2, strength: 0.4 }
                        }
                    },
                    
                    upperLeg: {
                        w: 18, h: 55, // Powerful frog legs!
                        mass: 1.1,
                        color: '#228B22',
                        density: 0.001,
                        friction: 0.4,
                        restitution: 0.8,
                        specialFeatures: {
                            springy: true,
                            powerful: true,
                            jumpForce: 2.0
                        },
                        attachmentPoints: {
                            hip: { x: 0, y: -0.3, strength: 0.9 },
                            knee: { x: 0, y: 0.5, strength: 0.8 }
                        }
                    },
                    
                    lowerLeg: {
                        w: 15, h: 50,
                        mass: 0.9,
                        color: '#32CD32',
                        density: 0.0009,
                        friction: 0.4,
                        restitution: 0.9,
                        specialFeatures: {
                            springy: true,
                            extendable: true
                        },
                        attachmentPoints: {
                            knee: { x: 0, y: -0.5, strength: 0.8 },
                            ankle: { x: 0, y: 0.5, strength: 0.7 }
                        }
                    },
                    
                    foot: {
                        w: 25, h: 10, // Large webbed feet
                        mass: 0.4,
                        color: '#006400',
                        density: 0.0007,
                        friction: 0.9,
                        restitution: 0.2,
                        shape: 'oval',
                        specialFeatures: {
                            hasWebbing: true,
                            large: true,
                            waterResistant: true
                        },
                        attachmentPoints: {
                            ankle: { x: -0.3, y: 0, strength: 0.7 }
                        }
                    }
                },
                
                joints: {
                    neck: { stiffness: 0.7, damping: 0.1, range: Math.PI / 2 },
                    shoulder: { stiffness: 0.5, damping: 0.1, range: Math.PI },
                    elbow: { stiffness: 0.6, damping: 0.05, range: Math.PI * 0.9 },
                    wrist: { stiffness: 0.4, damping: 0.1, range: Math.PI / 2 },
                    hip: { stiffness: 0.9, damping: 0.05, range: Math.PI },
                    knee: { stiffness: 0.8, damping: 0.05, range: Math.PI },
                    ankle: { stiffness: 0.7, damping: 0.1, range: Math.PI / 3 }
                },
                
                behavior: {
                    personality: 'bouncy',
                    mobility: 'jumping',
                    durability: 'resilient',
                    flexibility: 'very_high',
                    waterLover: true
                },
                
                voice: {
                    pitch: 0.9,
                    rate: 1.0,
                    expressions: ['Ribbit!', 'Hop hop!', 'Splash!', 'Bouncy!', 'Jump time!']
                }
            },
            
            // ==========================================
            // ROBOT - Mechanical and rigid
            // ==========================================
            robot: {
                name: 'Robot',
                displayName: 'Robot',
                icon: '🤖',
                description: 'Mechanical robot with rigid joints and metallic sounds',
                category: 'mechanical',
                
                colors: {
                    metal: '#C0C0C0',
                    dark: '#708090',
                    lights: '#00FF00',
                    accent: '#FF6B6B'
                },
                
                scale: 1.1,
                mass: 1.5, // Heavier metal construction
                
                parts: {
                    head: {
                        w: 30, h: 30,
                        mass: 0.9,
                        color: '#C0C0C0',
                        density: 0.0012,
                        friction: 0.2,
                        restitution: 0.1,
                        shape: 'rectangle',
                        specialFeatures: {
                            hasAntenna: true,
                            antennaLight: '#FF0000',
                            hasEyes: true,
                            eyeStyle: 'LED',
                            eyeColor: '#00FF00',
                            hasMouth: true,
                            mouthStyle: 'speaker',
                            material: 'metal'
                        },
                        attachmentPoints: {
                            neck: { x: 0, y: 0.5, strength: 1.0 }
                        },
                        soundProfile: 'robotic'
                    },
                    
                    torso: {
                        w: 40, h: 65,
                        mass: 2.5,
                        color: '#708090',
                        density: 0.0015,
                        friction: 0.3,
                        restitution: 0.2,
                        shape: 'rectangle',
                        specialFeatures: {
                            hasPanel: true,
                            panelLights: ['#00FF00', '#FF0000'],
                            material: 'metal',
                            hasVents: true
                        },
                        attachmentPoints: {
                            neck: { x: 0, y: -0.5, strength: 1.0 },
                            shoulderL: { x: -0.45, y: -0.35, strength: 0.9 },
                            shoulderR: { x: 0.45, y: -0.35, strength: 0.9 },
                            hipL: { x: -0.25, y: 0.45, strength: 1.0 },
                            hipR: { x: 0.25, y: 0.45, strength: 1.0 }
                        }
                    },
                    
                    upperArm: {
                        w: 10, h: 38,
                        mass: 0.7,
                        color: '#A9A9A9',
                        density: 0.0012,
                        friction: 0.2,
                        restitution: 0.3,
                        specialFeatures: {
                            hasJoints: true,
                            material: 'metal'
                        },
                        attachmentPoints: {
                            shoulder: { x: 0, y: -0.45, strength: 0.9 },
                            elbow: { x: 0, y: 0.5, strength: 0.8 }
                        }
                    },
                    
                    lowerArm: {
                        w: 9, h: 32,
                        mass: 0.5,
                        color: '#DCDCDC',
                        density: 0.0011,
                        friction: 0.2,
                        restitution: 0.3,
                        attachmentPoints: {
                            elbow: { x: 0, y: -0.5, strength: 0.8 },
                            wrist: { x: 0, y: 0.5, strength: 0.7 }
                        }
                    },
                    
                    hand: {
                        w: 10, h: 10,
                        mass: 0.3,
                        color: '#FF6B6B',
                        density: 0.0010,
                        friction: 0.4,
                        restitution: 0.2,
                        shape: 'rectangle',
                        specialFeatures: {
                            isClaw: true,
                            hasFingers: true,
                            fingerCount: 3,
                            magnetic: true
                        },
                        attachmentPoints: {
                            wrist: { x: 0, y: -0.3, strength: 0.7 }
                        }
                    },
                    
                    upperLeg: {
                        w: 12, h: 42,
                        mass: 1.0,
                        color: '#696969',
                        density: 0.0013,
                        friction: 0.3,
                        restitution: 0.3,
                        attachmentPoints: {
                            hip: { x: 0, y: -0.4, strength: 1.0 },
                            knee: { x: 0, y: 0.5, strength: 0.9 }
                        }
                    },
                    
                    lowerLeg: {
                        w: 11, h: 38,
                        mass: 0.8,
                        color: '#A9A9A9',
                        density: 0.0012,
                        friction: 0.3,
                        restitution: 0.4,
                        specialFeatures: {
                            hasSpring: true
                        },
                        attachmentPoints: {
                            knee: { x: 0, y: -0.5, strength: 0.9 },
                            ankle: { x: 0, y: 0.5, strength: 0.8 }
                        }
                    },
                    
                    foot: {
                        w: 18, h: 10,
                        mass: 0.4,
                        color: '#2F4F4F',
                        density: 0.0011,
                        friction: 1.0,
                        restitution: 0.1,
                        shape: 'rectangle',
                        specialFeatures: {
                            hasThrusters: true,
                            magnetic: true,
                            heavy: true
                        },
                        attachmentPoints: {
                            ankle: { x: -0.2, y: 0, strength: 0.8 }
                        }
                    }
                },
                
                joints: {
                    neck: { stiffness: 0.95, damping: 0.2, range: Math.PI / 4 },
                    shoulder: { stiffness: 0.9, damping: 0.2, range: Math.PI * 0.75 },
                    elbow: { stiffness: 0.95, damping: 0.15, range: Math.PI * 0.6 },
                    wrist: { stiffness: 0.8, damping: 0.2, range: Math.PI / 3 },
                    hip: { stiffness: 0.9, damping: 0.2, range: Math.PI * 0.5 },
                    knee: { stiffness: 0.95, damping: 0.15, range: Math.PI * 0.7 },
                    ankle: { stiffness: 0.8, damping: 0.2, range: Math.PI / 6 }
                },
                
behavior: {
                    personality: 'logical',
                    mobility: 'mechanical',
                    durability: 'high',
                    flexibility: 'low',
                    precise: true,
                    computational: true
                },
                
                voice: {
                    pitch: 0.8,
                    rate: 0.9,
                    expressions: ['BEEP BOOP!', 'CALCULATING...', 'SYSTEM ERROR!', 'PROCESSING...', 'ROBOT ONLINE!'],
                    robotic: true
                }
            },
            
            // ==========================================
            // ALIEN - Otherworldly with elongated limbs
            // ==========================================
            alien: {
                name: 'Alien',
                displayName: 'Alien',
                icon: '👽',
                description: 'Otherworldly being with elongated limbs and mysterious powers',
                category: 'supernatural',
                
                colors: {
                    skin: '#E0E0E0',
                    body: '#98FB98',
                    limbs: '#90EE90',
                    eyes: '#00FFFF'
                },
                
                scale: 1.2,
                mass: 0.7, // Lighter, more ethereal
                
                parts: {
                    head: {
                        w: 50, h: 40, // Large alien head
                        mass: 0.5,
                        color: '#E0E0E0',
                        density: 0.0005,
                        friction: 0.2,
                        restitution: 0.4,
                        shape: 'oval',
                        specialFeatures: {
                            hasEyes: true,
                            eyeStyle: 'large',
                            eyeColor: '#00FFFF',
                            eyeGlow: true,
                            hasMouth: false,
                            telepathic: true,
                            brainVisible: true
                        },
                        attachmentPoints: {
                            neck: { x: 0, y: 0.6, strength: 0.7 }
                        },
                        soundProfile: 'telepathic'
                    },
                    
                    torso: {
                        w: 35, h: 75, // Tall, thin torso
                        mass: 1.5,
                        color: '#98FB98',
                        density: 0.0006,
                        friction: 0.3,
                        restitution: 0.5,
                        shape: 'oval',
                        specialFeatures: {
                            translucent: true,
                            glows: true,
                            ethereal: true
                        },
                        attachmentPoints: {
                            neck: { x: 0, y: -0.6, strength: 0.7 },
                            shoulderL: { x: -0.4, y: -0.4, strength: 0.5 },
                            shoulderR: { x: 0.4, y: -0.4, strength: 0.5 },
                            hipL: { x: -0.2, y: 0.5, strength: 0.6 },
                            hipR: { x: 0.2, y: 0.5, strength: 0.6 }
                        }
                    },
                    
                    upperArm: {
                        w: 8, h: 50, // Very long, thin arms
                        mass: 0.3,
                        color: '#90EE90',
                        density: 0.0004,
                        friction: 0.2,
                        restitution: 0.6,
                        specialFeatures: {
                            elongated: true,
                            flexible: true
                        },
                        attachmentPoints: {
                            shoulder: { x: 0, y: -0.45, strength: 0.5 },
                            elbow: { x: 0, y: 0.5, strength: 0.4 }
                        }
                    },
                    
                    lowerArm: {
                        w: 7, h: 45,
                        mass: 0.25,
                        color: '#98FB98',
                        density: 0.0003,
                        friction: 0.2,
                        restitution: 0.6,
                        specialFeatures: {
                            elongated: true,
                            bendy: true
                        },
                        attachmentPoints: {
                            elbow: { x: 0, y: -0.5, strength: 0.4 },
                            wrist: { x: 0, y: 0.5, strength: 0.3 }
                        }
                    },
                    
                    hand: {
                        w: 15, h: 12, // Large alien hands
                        mass: 0.15,
                        color: '#E0E0E0',
                        density: 0.0003,
                        friction: 0.3,
                        restitution: 0.3,
                        shape: 'oval',
                        specialFeatures: {
                            hasFingers: true,
                            fingerCount: 4,
                            long: true,
                            telekinetic: true
                        },
                        attachmentPoints: {
                            wrist: { x: 0, y: -0.2, strength: 0.3 }
                        }
                    },
                    
                    upperLeg: {
                        w: 10, h: 55, // Long, thin legs
                        mass: 0.5,
                        color: '#90EE90',
                        density: 0.0005,
                        friction: 0.3,
                        restitution: 0.7,
                        specialFeatures: {
                            elongated: true,
                            graceful: true
                        },
                        attachmentPoints: {
                            hip: { x: 0, y: -0.4, strength: 0.6 },
                            knee: { x: 0, y: 0.5, strength: 0.5 }
                        }
                    },
                    
                    lowerLeg: {
                        w: 9, h: 50,
                        mass: 0.4,
                        color: '#98FB98',
                        density: 0.0004,
                        friction: 0.3,
                        restitution: 0.7,
                        attachmentPoints: {
                            knee: { x: 0, y: -0.5, strength: 0.5 },
                            ankle: { x: 0, y: 0.5, strength: 0.4 }
                        }
                    },
                    
                    foot: {
                        w: 20, h: 12, // Large, unusual feet
                        mass: 0.2,
                        color: '#E0E0E0',
                        density: 0.0003,
                        friction: 0.6,
                        restitution: 0.4,
                        shape: 'oval',
                        specialFeatures: {
                            unusual: true,
                            hovering: true,
                            antigrav: true
                        },
                        attachmentPoints: {
                            ankle: { x: -0.2, y: 0, strength: 0.4 }
                        }
                    }
                },
                
                joints: {
                    neck: { stiffness: 0.6, damping: 0.08, range: Math.PI / 2 },
                    shoulder: { stiffness: 0.4, damping: 0.08, range: Math.PI * 1.2 },
                    elbow: { stiffness: 0.5, damping: 0.05, range: Math.PI },
                    wrist: { stiffness: 0.3, damping: 0.08, range: Math.PI * 0.8 },
                    hip: { stiffness: 0.5, damping: 0.08, range: Math.PI },
                    knee: { stiffness: 0.4, damping: 0.05, range: Math.PI * 1.1 },
                    ankle: { stiffness: 0.4, damping: 0.08, range: Math.PI / 2 }
                },
                
                behavior: {
                    personality: 'mysterious',
                    mobility: 'floating',
                    durability: 'ethereal',
                    flexibility: 'extreme',
                    telepathic: true,
                    otherworldly: true
                },
                
                voice: {
                    pitch: 1.8,
                    rate: 0.6,
                    expressions: ['Greetings, earthling!', 'From another world!', 'Mysterious!', 'Telepathic message!', 'Peace and cosmos!'],
                    ethereal: true
                }
            }
        };
    }
    
    // ==========================================
    // DEVICE SCALING
    // ==========================================
    
    getDeviceScale() {
        if (this.deviceUtils.device.isTablet) return 1.1;
        if (this.deviceUtils.device.isMobile) return 0.9;
        return 1.0;
    }
    
    // ==========================================
    // TYPE MANAGEMENT
    // ==========================================
    
    /**
     * Get all available ragdoll types
     */
    getAvailableTypes() {
        return Object.keys(this.types).map(key => ({
            key: key,
            name: this.types[key].name,
            displayName: this.types[key].displayName,
            icon: this.types[key].icon,
            description: this.types[key].description,
            category: this.types[key].category
        }));
    }
    
    /**
     * Get specific ragdoll type
     */
    getType(typeName) {
        const type = this.types[typeName.toLowerCase()];
        if (!type) {
            console.warn(`Unknown ragdoll type: ${typeName}`);
            return null;
        }
        
        // Apply device scaling
        return this.scaleTypeForDevice(type);
    }
    
    /**
     * Get random ragdoll type
     */
    getRandomType() {
        const typeKeys = Object.keys(this.types);
        const randomKey = this.mathUtils.randomChoice(typeKeys);
        return this.getType(randomKey);
    }
    
    /**
     * Get types by category
     */
    getTypesByCategory(category) {
        return Object.keys(this.types)
            .filter(key => this.types[key].category === category)
            .map(key => this.getType(key));
    }
    
    // ==========================================
    // SCALING & OPTIMIZATION
    // ==========================================
    
    scaleTypeForDevice(type) {
        const scaledType = JSON.parse(JSON.stringify(type)); // Deep clone
        const totalScale = type.scale * this.deviceScale;
        
        // Scale all body parts
        for (const partName in scaledType.parts) {
            const part = scaledType.parts[partName];
            
            // Scale dimensions
            part.w *= totalScale;
            part.h *= totalScale;
            
            // Scale mass (volume scales cubically, but we use square for gameplay)
            part.mass *= totalScale * totalScale;
            
            // Adjust density to maintain reasonable physics
            if (part.density) {
                part.density *= (1 / totalScale);
            }
        }
        
        return scaledType;
    }
    
    /**
     * Create optimized type for device performance
     */
    getOptimizedType(typeName, performanceLevel = 'auto') {
        let type = this.getType(typeName);
        if (!type) return null;
        
        if (performanceLevel === 'auto') {
            performanceLevel = this.deviceUtils.performance.level;
        }
        
        // Optimize based on performance level
        switch (performanceLevel) {
            case 'low':
                type = this.optimizeTypeForLowPerformance(type);
                break;
                
            case 'medium':
                type = this.optimizeTypeForMediumPerformance(type);
                break;
                
            case 'high':
                // Use full quality
                break;
        }
        
        return type;
    }
    
    optimizeTypeForLowPerformance(type) {
        const optimized = JSON.parse(JSON.stringify(type)); // Deep clone
        
        // Simplify visual features
        for (const partName in optimized.parts) {
            const part = optimized.parts[partName];
            
            // Reduce special features
            if (part.specialFeatures) {
                const essential = ['shape', 'material'];
                part.specialFeatures = Object.fromEntries(
                    Object.entries(part.specialFeatures)
                        .filter(([key]) => essential.includes(key))
                );
            }
            
            // Simplify attachment points
            if (part.attachmentPoints) {
                // Keep only essential attachments
                const essential = Object.keys(part.attachmentPoints).slice(0, 2);
                part.attachmentPoints = Object.fromEntries(
                    essential.map(key => [key, part.attachmentPoints[key]])
                );
            }
        }
        
        // Reduce joint complexity
        for (const jointName in optimized.joints) {
            const joint = optimized.joints[jointName];
            joint.stiffness = Math.max(0.5, joint.stiffness - 0.2);
            joint.damping = Math.min(0.3, joint.damping + 0.1);
        }
        
        return optimized;
    }
    
    optimizeTypeForMediumPerformance(type) {
        const optimized = JSON.parse(JSON.stringify(type)); // Deep clone
        
        // Moderate simplification
        for (const partName in optimized.parts) {
            const part = optimized.parts[partName];
            
            // Keep most special features but simplify complex ones
            if (part.specialFeatures) {
                const complex = ['telepathic', 'antigrav', 'telekinetic', 'hovering'];
                complex.forEach(feature => {
                    if (part.specialFeatures[feature]) {
                        delete part.specialFeatures[feature];
                    }
                });
            }
        }
        
        return optimized;
    }
    
    // ==========================================
    // COMPARISON & UTILITIES
    // ==========================================
    
    /**
     * Compare two ragdoll types
     */
    compareTypes(typeA, typeB) {
        const a = this.getType(typeA);
        const b = this.getType(typeB);
        
        if (!a || !b) return null;
        
        return {
            size: {
                a: this.calculateTypeSize(a),
                b: this.calculateTypeSize(b)
            },
            mass: {
                a: this.calculateTypeMass(a),
                b: this.calculateTypeMass(b)
            },
            flexibility: {
                a: this.calculateFlexibility(a),
                b: this.calculateFlexibility(b)
            },
            durability: {
                a: this.calculateDurability(a),
                b: this.calculateDurability(b)
            }
        };
    }
    
    calculateTypeSize(type) {
        let totalSize = 0;
        for (const partName in type.parts) {
            const part = type.parts[partName];
            totalSize += part.w * part.h;
        }
        return totalSize;
    }
    
    calculateTypeMass(type) {
        let totalMass = 0;
        for (const partName in type.parts) {
            totalMass += type.parts[partName].mass;
        }
        return totalMass;
    }
    
    calculateFlexibility(type) {
        let totalFlexibility = 0;
        let jointCount = 0;
        
        for (const jointName in type.joints) {
            const joint = type.joints[jointName];
            totalFlexibility += (1 - joint.stiffness) * joint.range;
            jointCount++;
        }
        
        return jointCount > 0 ? totalFlexibility / jointCount : 0;
    }
    
    calculateDurability(type) {
        let totalDurability = 0;
        let partCount = 0;
        
        for (const partName in type.parts) {
            const part = type.parts[partName];
            const durability = (part.mass * 100) + (part.friction * 50) + ((1 - part.restitution) * 25);
            totalDurability += durability;
            partCount++;
        }
        
        return partCount > 0 ? totalDurability / partCount : 0;
    }
    
    // ==========================================
    // VALIDATION
    // ==========================================
    
    /**
     * Validate ragdoll type definition
     */
    validateType(type) {
        const errors = [];
        const warnings = [];
        
        // Check required fields
        const required = ['name', 'displayName', 'icon', 'parts', 'joints'];
        for (const field of required) {
            if (!type[field]) {
                errors.push(`Missing required field: ${field}`);
            }
        }
        
        // Validate parts
        if (type.parts) {
            const essentialParts = ['head', 'torso'];
            for (const essential of essentialParts) {
                if (!type.parts[essential]) {
                    errors.push(`Missing essential body part: ${essential}`);
                }
            }
            
            // Check part properties
            for (const partName in type.parts) {
                const part = type.parts[partName];
                
                if (!part.w || !part.h || !part.mass) {
                    errors.push(`Part ${partName} missing required dimensions or mass`);
                }
                
                if (part.mass <= 0) {
                    errors.push(`Part ${partName} has invalid mass: ${part.mass}`);
                }
                
                if (!part.color || !part.color.startsWith('#')) {
                    warnings.push(`Part ${partName} missing or invalid color`);
                }
            }
        }
        
        // Validate joints
        if (type.joints) {
            for (const jointName in type.joints) {
                const joint = type.joints[jointName];
                
                if (joint.stiffness < 0 || joint.stiffness > 1) {
                    warnings.push(`Joint ${jointName} stiffness out of range: ${joint.stiffness}`);
                }
                
                if (joint.damping < 0 || joint.damping > 1) {
                    warnings.push(`Joint ${jointName} damping out of range: ${joint.damping}`);
                }
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors,
            warnings: warnings
        };
    }
    
    /**
     * Get type statistics
     */
    getTypeStats(typeName) {
        const type = this.getType(typeName);
        if (!type) return null;
        
        return {
            name: type.name,
            category: type.category,
            partCount: Object.keys(type.parts).length,
            jointCount: Object.keys(type.joints).length,
            totalSize: this.calculateTypeSize(type),
            totalMass: this.calculateTypeMass(type),
            flexibility: this.calculateFlexibility(type),
            durability: this.calculateDurability(type),
            complexity: this.calculateComplexity(type),
            validation: this.validateType(type)
        };
    }
    
    calculateComplexity(type) {
        let complexity = 0;
        
        // Part complexity
        complexity += Object.keys(type.parts).length * 10;
        
        // Joint complexity
        complexity += Object.keys(type.joints).length * 15;
        
        // Special features complexity
        for (const partName in type.parts) {
            const part = type.parts[partName];
            if (part.specialFeatures) {
                complexity += Object.keys(part.specialFeatures).length * 5;
            }
        }
        
        return complexity;
    }
    
    // ==========================================
    // DEBUG & UTILITIES
    // ==========================================
    
    /**
     * Get debug information
     */
    getDebugInfo() {
        const typeStats = {};
        
        for (const typeName in this.types) {
            typeStats[typeName] = this.getTypeStats(typeName);
        }
        
        return {
            totalTypes: Object.keys(this.types).length,
            deviceScale: this.deviceScale,
            categories: [...new Set(Object.values(this.types).map(t => t.category))],
            typeStats: typeStats,
            
            performance: {
                level: this.deviceUtils.performance.level,
                optimizationActive: this.deviceUtils.performance.level !== 'high'
            }
        };
    }
    
    /**
     * Export type definition (for modding/customization)
     */
    exportType(typeName) {
        const type = this.types[typeName.toLowerCase()];
        if (!type) return null;
        
        return JSON.stringify(type, null, 2);
    }
    
    /**
     * Import custom type definition
     */
    importType(typeName, typeDefinition) {
        try {
            let type;
            
            if (typeof typeDefinition === 'string') {
                type = JSON.parse(typeDefinition);
            } else {
                type = typeDefinition;
            }
            
            // Validate the type
            const validation = this.validateType(type);
            if (!validation.isValid) {
                console.error('Invalid type definition:', validation.errors);
                return false;
            }
            
            // Add to types
            this.types[typeName.toLowerCase()] = type;
            
            console.log(`📥 Imported custom ragdoll type: ${typeName}`);
            if (validation.warnings.length > 0) {
                console.warn('Type warnings:', validation.warnings);
            }
            
            return true;
            
        } catch (error) {
            console.error('Failed to import type:', error);
            return false;
        }
    }
    
    /**
     * List all available types with details
     */
    listTypes() {
        return Object.keys(this.types).map(key => {
            const type = this.types[key];
            return {
                key: key,
                name: type.name,
                displayName: type.displayName,
                icon: type.icon,
                description: type.description,
                category: type.category,
                stats: this.getTypeStats(key)
            };
        });
    }
}

// Create singleton instance
window.RagdollTypes = new RagdollTypes();

console.log('🎭 RagdollTypes loaded - Character definitions and type management ready');