class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particleSystems = [];
        this.particleGeometry = new THREE.BufferGeometry();
        this.particleCount = 1000;
        
        this.initializeParticleSystem();
    }
    
    initializeParticleSystem() {
        // Create particle geometry
        const positions = new Float32Array(this.particleCount * 3);
        const velocities = new Float32Array(this.particleCount * 3);
        const colors = new Float32Array(this.particleCount * 3);
        const sizes = new Float32Array(this.particleCount);
        const lifetimes = new Float32Array(this.particleCount);
        
        this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.particleGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        this.particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        this.particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        this.particleGeometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));
        
        // Particle material
        this.particleMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0.0 },
                pointTexture: { value: this.createParticleTexture() }
            },
            vertexShader: `
                attribute float size;
                attribute float lifetime;
                attribute vec3 velocity;
                uniform float time;
                varying vec3 vColor;
                varying float vLifetime;
                
                void main() {
                    vColor = color;
                    vLifetime = lifetime;
                    
                    vec3 pos = position + velocity * time;
                    pos.y += -0.5 * 9.82 * time * time; // Gravity
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform sampler2D pointTexture;
                varying vec3 vColor;
                varying float vLifetime;
                
                void main() {
                    vec4 texColor = texture2D(pointTexture, gl_PointCoord);
                    float alpha = texColor.a * vLifetime;
                    gl_FragColor = vec4(vColor * texColor.rgb, alpha);
                }
            `,
            transparent: true,
            vertexColors: true,
            blending: THREE.AdditiveBlending
        });
        
        this.particleMesh = new THREE.Points(this.particleGeometry, this.particleMaterial);
        this.scene.add(this.particleMesh);
    }
    
    createParticleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const context = canvas.getContext('2d');
        
        const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.2, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.4, 'rgba(255,255,255,0.8)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, 64, 64);
        
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }
    
    createExplosion(position, materialType, intensity = 1.0) {
        const particleCount = Math.floor(50 * intensity);
        const colorMap = {
            pokeball: [0.93, 0.08, 0.08],
            greatball: [0.23, 0.51, 0.77],
            ultraball: [0.96, 0.77, 0.09],
            masterball: [0.56, 0.27, 0.68]
        };
        
        const baseColor = colorMap[materialType] || [1, 1, 1];
        
        for (let i = 0; i < particleCount; i++) {
            this.emitParticle({
                position: position.clone(),
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 10 * intensity,
                    Math.random() * 8 * intensity,
                    (Math.random() - 0.5) * 10 * intensity
                ),
                color: [
                    baseColor[0] + (Math.random() - 0.5) * 0.3,
                    baseColor[1] + (Math.random() - 0.5) * 0.3,
                    baseColor[2] + (Math.random() - 0.5) * 0.3
                ],
                size: 2 + Math.random() * 4,
                lifetime: 2.0 + Math.random() * 3.0
            });
        }
    }
    
    emitParticle(options) {
        // Find an unused particle slot
        const positions = this.particleGeometry.attributes.position.array;
        const velocities = this.particleGeometry.attributes.velocity.array;
        const colors = this.particleGeometry.attributes.color.array;
        const sizes = this.particleGeometry.attributes.size.array;
        const lifetimes = this.particleGeometry.attributes.lifetime.array;
        
        for (let i = 0; i < this.particleCount; i++) {
            const index = i * 3;
            
            // Check if particle is dead (lifetime <= 0)
            if (lifetimes[i] <= 0) {
                // Set particle properties
                positions[index] = options.position.x;
                positions[index + 1] = options.position.y;
                positions[index + 2] = options.position.z;
                
                velocities[index] = options.velocity.x;
                velocities[index + 1] = options.velocity.y;
                velocities[index + 2] = options.velocity.z;
                
                colors[index] = options.color[0];
                colors[index + 1] = options.color[1];
                colors[index + 2] = options.color[2];
                
                sizes[i] = options.size;
                lifetimes[i] = options.lifetime;
                
                break;
            }
        }
        
        // Mark attributes as needing update
        this.particleGeometry.attributes.position.needsUpdate = true;
        this.particleGeometry.attributes.velocity.needsUpdate = true;
        this.particleGeometry.attributes.color.needsUpdate = true;
        this.particleGeometry.attributes.size.needsUpdate = true;
        this.particleGeometry.attributes.lifetime.needsUpdate = true;
    }
    
    update(deltaTime) {
        const lifetimes = this.particleGeometry.attributes.lifetime.array;
        
        // Update particle lifetimes
        for (let i = 0; i < this.particleCount; i++) {
            if (lifetimes[i] > 0) {
                lifetimes[i] -= deltaTime;
            }
        }
        
        this.particleGeometry.attributes.lifetime.needsUpdate = true;
        this.particleMaterial.uniforms.time.value += deltaTime;
    }
}