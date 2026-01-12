class BreakLearnGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.engine = null;
        this.world = null;
        this.currentObject = null;
        this.particles = [];
        this.debris = [];
        
        // Image textures drawBodyWithTexture
        this.textures = {
            wood: null,
            glass: null,
            metal: null,
            ice: null
        };
        this.texturesLoaded = false;
        
        // Game state
        this.currentMaterial = 'wood';
        this.currentCategory = 'shapes';
        this.currentIndex = 0;
        this.isDestroying = false;
        this.hitCount = 0;
        
        // Learning content
        this.shapes = ['square', 'circle', 'triangle', 'rectangle', 'pentagon', 'hexagon'];
        this.numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
        this.letters = ['A', 'E', 'I', 'O', 'U', 'B', 'C', 'D', 'F', 'G'];
        
        // Material properties
        this.materials = {
            wood: {
                color: '#8B4513',
                density: 0.8,
                restitution: 0.3,
                friction: 0.8,
                hitPoints: 5,
                sound: 'wood',
                effect: 'splinter'
            },
            glass: {
                color: '#87CEEB',
                density: 0.6,
                restitution: 0.1,
                friction: 0.1,
                hitPoints: 3,
                sound: 'glass',
                effect: 'shatter'
            },
            ice: {
                color: '#B0E0E6',
                density: 0.9,
                restitution: 0.2,
                friction: 0.05,
                hitPoints: 4,
                sound: 'ice',
                effect: 'melt'
            },
            metal: {
                color: '#C0C0C0',
                density: 1.5,
                restitution: 0.6,
                friction: 0.4,
                hitPoints: 8,
                sound: 'metal',
                effect: 'explode'
            }
        };
        
        this.init();
    }
    
    async init() {
        this.setupCanvas();
        this.setupPhysics();
        this.setupEventListeners();
        
        // Load textures before starting
        await this.loadTextures();
        
        this.createNewObject();
        this.startGameLoop();
        
        // Audio welcome loadTextures
        document.addEventListener('audioEnabled', () => {
            setTimeout(() => {
                if (window.audioSystem?.isInitialized) {
                    window.audioSystem.speak("Welcome to Break and Learn! Tap objects to destroy them!");
                }
            }, 1000);
        });
        
        console.log('🔨 Break & Learn initialized!');
    }
    
loadTextures() {
    return new Promise((resolve) => {
        const imagePaths = {
            wood: 'assets/wood.jpg',
            glass: 'assets/glass.jpg',
            metal: 'assets/metal.jpg',
            ice: 'assets/ice.jpg'
        };
        
        let loadedCount = 0;
        const totalTextures = 4;
        
        const checkComplete = () => {
            loadedCount++;
            if (loadedCount === totalTextures) {
                const loadedTextures = Object.values(this.textures).filter(t => t !== null).length;
                if (loadedTextures > 0) {
                    this.texturesLoaded = true;
                    console.log(`✅ Loaded ${loadedTextures} textures`);
                } else {
                    this.texturesLoaded = false;
                    console.log('ℹ️ No textures found, using solid colors');
                }
                resolve();
            }
        };
        
        // Try to load each texture
        Object.keys(imagePaths).forEach(material => {
            const img = new Image();
            
            img.onload = () => {
                this.textures[material] = img;
                console.log(`✅ Loaded ${material} texture`);
                checkComplete();
            };
            
            img.onerror = () => {
                this.textures[material] = null;
                console.log(`ℹ️ ${material} texture not found, using solid color`);
                checkComplete();
            };
            
            img.src = imagePaths[material];
        });
    });
}
    
    setupCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        // High DPI support drawSimpleBody
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width *= dpr;
        this.canvas.height *= dpr;
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        this.canvasWidth = rect.width;
        this.canvasHeight = rect.height;
        
        window.addEventListener('resize', () => {
            setTimeout(() => this.setupCanvas(), 100);
        });
    }
    
    setupPhysics() {
        // Create Matter.js engine
        this.engine = Matter.Engine.create();
        this.world = this.engine.world;
        
        // Configure physics
        this.engine.world.gravity.y = 0.8;
        
        // Create invisible walls
        const wallThickness = 50;
        const walls = [
            // Floor const size
            Matter.Bodies.rectangle(
                this.canvasWidth / 2, 
                this.canvasHeight + wallThickness / 2, 
                this.canvasWidth, 
                wallThickness, 
                { isStatic: true }
            ),
            // Left wall
            Matter.Bodies.rectangle(
                -wallThickness / 2, 
                this.canvasHeight / 2, 
                wallThickness, 
                this.canvasHeight, 
                { isStatic: true }
            ),
            // Right wall
            Matter.Bodies.rectangle(
                this.canvasWidth + wallThickness / 2, 
                this.canvasHeight / 2, 
                wallThickness, 
                this.canvasHeight, 
                { isStatic: true }
            )
        ];
        
        Matter.World.add(this.world, walls);
    }
    
    setupEventListeners() {
        // Material selection
        document.querySelectorAll('.material-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.material-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentMaterial = btn.dataset.material;
                this.createNewObject();
            });
        });
        
        // New object button
        document.getElementById('newObjectBtn').addEventListener('click', () => {
            this.createNewObject();
        });
        
        // Canvas interaction
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleCanvasClick(e.touches[0]);
        });
        
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    handleCanvasClick(e) {
        if (!this.currentObject || this.isDestroying) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Check if click is on object
        if (this.isPointInObject(x, y)) {
            this.hitObject(x, y);
        }
    }
    
    isPointInObject(x, y) {
        if (!this.currentObject) return false;
        
        const pos = this.currentObject.position;
        const bounds = this.currentObject.bounds;
        
        return x >= bounds.min.x && x <= bounds.max.x && 
               y >= bounds.min.y && y <= bounds.max.y;
    }
    
    hitObject(x, y) {
        this.hitCount++;
        const material = this.materials[this.currentMaterial];
        
        // Create impact effect
        this.createImpactEffect(x, y);
        
        // Play hit sound
        this.playHitSound();
        
        // Check if object should be destroyed
        if (this.hitCount >= material.hitPoints) {
            this.destroyObject(x, y);
        } else {
            // Show damage effect
            this.showDamageEffect();
        }
    }
    
    createImpactEffect(x, y) {
        // Create small particle burst at impact point
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const speed = 2 + Math.random() * 3;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 3,
                color: this.materials[this.currentMaterial].color,
                life: 1.0,
                decay: 0.02
            });
        }
    }
    
    playHitSound() {
        // Generate hit sound based on material
        if (window.audioSystem?.isInitialized) {
            switch (this.currentMaterial) {
                case 'wood':
                    this.generateWoodSound();
                    break;
                case 'glass':
                    this.generateGlassSound();
                    break;
                case 'ice':
                    this.generateIceSound();
                    break;
                case 'metal':
                    this.generateMetalSound();
                    break;
            }
        }
    }
    
    generateWoodSound() {
        // Create wood knock sound using Web Audio API
        if (!window.audioSystem?.audioContext) return;
        
        const audioContext = window.audioSystem.audioContext;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    }
    
    generateGlassSound() {
        if (!window.audioSystem?.audioContext) return;
        
        const audioContext = window.audioSystem.audioContext;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    }
    
    generateIceSound() {
        if (!window.audioSystem?.audioContext) return;
        
        const audioContext = window.audioSystem.audioContext;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.4);
        
        gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);
    }
    
    generateMetalSound() {
        if (!window.audioSystem?.audioContext) return;
        
        const audioContext = window.audioSystem.audioContext;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.5);
        
        gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }
    
    showDamageEffect() {
        // Visual feedback for damage
        if (this.currentObject) {
            // Flash effect
            this.currentObject.render.fillStyle = '#ffffff';
            setTimeout(() => {
                if (this.currentObject) {
                    this.currentObject.render.fillStyle = this.materials[this.currentMaterial].color;
                }
            }, 100);
        }
    }
    
    destroyObject(impactX, impactY) {
        if (!this.currentObject) return;
        
        this.isDestroying = true;
        const material = this.materials[this.currentMaterial];
        
        // Create destruction effect based on material
        switch (material.effect) {
            case 'shatter':
                this.createShatterEffect(impactX, impactY);
                break;
            case 'splinter':
                this.createSplinterEffect(impactX, impactY);
                break;
            case 'melt':
                this.createMeltEffect(impactX, impactY);
                break;
            case 'explode':
                this.createExplodeEffect(impactX, impactY);
                break;
        }
        
        // Play destruction sound
        this.playDestructionSound();
        
        // Announce destruction
        this.announceDestruction();
        
        // Remove object from physics world
        Matter.World.remove(this.world, this.currentObject);
        this.currentObject = null;
        
        // Create new object after delay
        setTimeout(() => {
            this.createNewObject();
            this.isDestroying = false;
        }, 2000);
    }
    
    createShatterEffect(impactX, impactY) {
        const pos = this.currentObject.position;
        const size = this.getObjectSize();
        
        // Create sharp angular fragments
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * size;
            const speed = 3 + Math.random() * 5;
            
            const fragment = Matter.Bodies.polygon(
                pos.x + Math.cos(angle) * distance,
                pos.y + Math.sin(angle) * distance,
                3 + Math.floor(Math.random() * 3),
                5 + Math.random() * 10,
                {
                    restitution: 0.8,
                    friction: 0.1,
                    render: { 
                        fillStyle: this.materials[this.currentMaterial].color,
                        strokeStyle: '#333',
                        lineWidth: 1
                    }
                }
            );
            
            // Apply force away from impact
            const forceAngle = Math.atan2(fragment.position.y - impactY, fragment.position.x - impactX);
            const force = { 
                x: Math.cos(forceAngle) * speed * 0.01, 
                y: Math.sin(forceAngle) * speed * 0.01 
            };
            
            Matter.Body.applyForce(fragment, fragment.position, force);
            Matter.World.add(this.world, fragment);
            
            this.debris.push({
                body: fragment,
                life: 5.0,
                decay: 0.002,
                material: this.currentMaterial
            });
        }
    }
    
    createSplinterEffect(impactX, impactY) {
        const pos = this.currentObject.position;
        const size = this.getObjectSize();
        
        // Create wood-like splinters
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            
            const fragment = Matter.Bodies.rectangle(
                pos.x + (Math.random() - 0.5) * size,
                pos.y + (Math.random() - 0.5) * size,
                3 + Math.random() * 8,
                15 + Math.random() * 20,
                {
                    restitution: 0.3,
                    friction: 0.8,
                    render: { 
                        fillStyle: this.materials[this.currentMaterial].color,
                        strokeStyle: '#333',
                        lineWidth: 1
                    }
                }
            );
            
            const forceAngle = Math.atan2(fragment.position.y - impactY, fragment.position.x - impactX);
            const force = { 
                x: Math.cos(forceAngle) * speed * 0.008, 
                y: Math.sin(forceAngle) * speed * 0.008 
            };
            
            Matter.Body.applyForce(fragment, fragment.position, force);
            Matter.World.add(this.world, fragment);
            
            this.debris.push({
                body: fragment,
                life: 4.0,
                decay: 0.003,
                material: this.currentMaterial
            });
        }
    }
    
    createMeltEffect(impactX, impactY) {
        const pos = this.currentObject.position;
        
        // Create melting particle effect
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI;
            const speed = 1 + Math.random() * 2;
            
            this.particles.push({
                x: pos.x + (Math.random() - 0.5) * 60,
                y: pos.y + (Math.random() - 0.5) * 60,
                vx: Math.cos(angle) * speed * 0.5,
                vy: Math.sin(angle) * speed + 2, // Drip downward
                size: 3 + Math.random() * 6,
                color: this.materials[this.currentMaterial].color,
                life: 3.0,
                decay: 0.005,
                drip: true
            });
        }
    }
    
    createExplodeEffect(impactX, impactY) {
        const pos = this.currentObject.position;
        
        // Create explosive particle burst
        for (let i = 0; i < 40; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 4 + Math.random() * 8;
            
            this.particles.push({
                x: pos.x,
                y: pos.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 5,
                color: ['#FF6B35', '#FFD700', '#FF1493'][Math.floor(Math.random() * 3)],
                life: 2.0,
                decay: 0.01,
                spark: true
            });
        }
        
        // Screen shake for explosion
        this.addScreenShake();
    }
    
    addScreenShake() {
        const duration = 300;
        const intensity = 3;
        const startTime = Date.now();
        
        const shake = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed < duration) {
                const progress = elapsed / duration;
                const currentIntensity = intensity * (1 - progress);
                
                const offsetX = (Math.random() - 0.5) * currentIntensity;
                const offsetY = (Math.random() - 0.5) * currentIntensity;
                
                document.body.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
                
                requestAnimationFrame(shake);
            } else {
                document.body.style.transform = '';
            }
        };
        
        shake();
    }
    
    playDestructionSound() {
        if (window.audioSystem?.isInitialized) {
            window.audioSystem.playSoundEffect('success');
        }
    }
    
    announceDestruction() {
        if (window.audioSystem?.isInitialized) {
            const material = this.currentMaterial;
            const object = this.getCurrentObjectName();
            const phrases = [
                `${object} destroyed!`,
                `The ${material} ${object} is broken!`,
                `Smashed the ${object}!`,
                `Great job breaking it!`
            ];
            
            const phrase = phrases[Math.floor(Math.random() * phrases.length)];
            setTimeout(() => {
                window.audioSystem.speak(phrase);
            }, 500);
        }
    }
    
    getObjectSize() {
        if (!this.currentObject) return 50;
        const bounds = this.currentObject.bounds;
        return Math.max(bounds.max.x - bounds.min.x, bounds.max.y - bounds.min.y);
    }
    
    getCurrentObjectName() {
        if (this.currentCategory === 'shapes') {
            return this.shapes[this.currentIndex];
        } else if (this.currentCategory === 'numbers') {
            return `number ${this.numbers[this.currentIndex]}`;
        } else {
            return `letter ${this.letters[this.currentIndex]}`;
        }
    }
    
    createNewObject() {
        // Remove existing object
        if (this.currentObject) {
            Matter.World.remove(this.world, this.currentObject);
        }
        
        // Clear debris
        this.debris.forEach(debris => {
            Matter.World.remove(this.world, debris.body);
        });
        this.debris = [];
        this.particles = [];
        
        // Reset hit count
        this.hitCount = 0;
        
        // Select random category and item
        const categories = ['shapes', 'numbers', 'letters'];
        this.currentCategory = categories[Math.floor(Math.random() * categories.length)];
        
        let items;
        switch (this.currentCategory) {
            case 'shapes':
                items = this.shapes;
                break;
            case 'numbers':
                items = this.numbers;
                break;
            case 'letters':
                items = this.letters;
                break;
        }
        
        this.currentIndex = Math.floor(Math.random() * items.length);
        const item = items[this.currentIndex];
        
        // Create object based on category
        this.currentObject = this.createObjectByType(item);
        
        // Update UI
        const material = this.currentMaterial;
        document.getElementById('objectLabel').textContent = 
            `Break the ${material} ${item}! (${this.hitCount}/${this.materials[material].hitPoints})`;
        
        // Announce new object
        if (window.audioSystem?.isInitialized) {
            setTimeout(() => {
                window.audioSystem.speak(`Break the ${material} ${item}!`);
            }, 300);
        }
    }
    
    createObjectByType(item) {
        const centerX = this.canvasWidth / 2;
        const centerY = this.canvasHeight / 3;
        const material = this.materials[this.currentMaterial];
        const size = 180 + Math.random() * 80; // BIGGER SHAPES (was 80 + 40)
        
        let body;
        
        if (this.currentCategory === 'shapes') {
            body = this.createShape(item, centerX, centerY, size, material);
        } else if (this.currentCategory === 'numbers') {
            body = this.createNumber(item, centerX, centerY, size, material);
        } else {
            body = this.createLetter(item, centerX, centerY, size, material);
        }
        
        Matter.World.add(this.world, body);
        return body;
    }
    
    createShape(shapeName, x, y, size, material) {
        const options = {
            restitution: material.restitution,
            friction: material.friction,
            density: material.density,
            render: { fillStyle: material.color }
        };
        
        switch (shapeName) {
            case 'square':
                return Matter.Bodies.rectangle(x, y, size, size, options);
            case 'circle':
                return Matter.Bodies.circle(x, y, size / 2, options);
            case 'triangle':
                return Matter.Bodies.polygon(x, y, 3, size / 2, options);
            case 'rectangle':
                return Matter.Bodies.rectangle(x, y, size * 1.5, size * 0.8, options);
            case 'pentagon':
                return Matter.Bodies.polygon(x, y, 5, size / 2, options);
            case 'hexagon':
                return Matter.Bodies.polygon(x, y, 6, size / 2, options);
            default:
                return Matter.Bodies.rectangle(x, y, size, size, options);
        }
    }
    
    createNumber(number, x, y, size, material) {
        const options = {
            restitution: material.restitution,
            friction: material.friction,
            density: material.density,
            render: { fillStyle: material.color },
            label: `number_${number}`
        };
        
        return Matter.Bodies.rectangle(x, y, size, size * 1.2, options);
    }
    
    createLetter(letter, x, y, size, material) {
        const options = {
            restitution: material.restitution,
            friction: material.friction,
            density: material.density,
            render: { fillStyle: material.color },
            label: `letter_${letter}`
        };
        
        return Matter.Bodies.rectangle(x, y, size * 0.8, size * 1.2, options);
    }
    
    startGameLoop() {
        const gameLoop = () => {
            // Update physics
            Matter.Engine.update(this.engine, 16.67); // 60 FPS
            
            // Update particles
            this.updateParticles();
            
            // Update debris
            this.updateDebris();
            
            // Render everything
            this.render();
            
            // Continue loop
            requestAnimationFrame(gameLoop);
        };
        
        requestAnimationFrame(gameLoop);
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Apply gravity
            if (particle.drip) {
                particle.vy += 0.2; // Stronger gravity for melting
            } else {
                particle.vy += 0.1;
            }
            
            // Apply air resistance
            particle.vx *= 0.98;
            particle.vy *= 0.98;
            
            // Update life
            particle.life -= particle.decay;
            
            // Remove dead particles
            if (particle.life <= 0 || particle.y > this.canvasHeight + 50) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    updateDebris() {
        for (let i = this.debris.length - 1; i >= 0; i--) {
            const debris = this.debris[i];
            
            // Update life
            debris.life -= debris.decay;
            
            // Fade out debris
            if (debris.body.render.fillStyle) {
                const alpha = Math.max(0, debris.life / 5.0);
                const color = this.materials[this.currentMaterial].color;
                debris.body.render.fillStyle = this.addAlphaToColor(color, alpha);
            }
            
            // Remove dead debris
            if (debris.life <= 0) {
                Matter.World.remove(this.world, debris.body);
                this.debris.splice(i, 1);
            }
        }
    }
    
    addAlphaToColor(hexColor, alpha) {
        // Convert hex to rgba with alpha
        const r = parseInt(hexColor.substr(1, 2), 16);
        const g = parseInt(hexColor.substr(3, 2), 16);
        const b = parseInt(hexColor.substr(5, 2), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // Render physics bodies
        const bodies = Matter.Composite.allBodies(this.world);
        
        bodies.forEach(body => {
            if (body.render.visible !== false) {
                // Check if this is debris
                const debrisItem = this.debris.find(d => d.body === body);
                if (debrisItem) {
                    this.drawDebrisWithTexture(debrisItem);
                } else {
                    this.drawBody(body);
                }
            }
        });
        
        // Render particles
        this.particles.forEach(particle => {
            this.drawParticle(particle);
        });
        
        // Update hit counter if object exists
        if (this.currentObject && !this.isDestroying) {
            const material = this.materials[this.currentMaterial];
            const remaining = material.hitPoints - this.hitCount;
            document.getElementById('objectLabel').textContent = 
                `Break the ${this.currentMaterial} ${this.getCurrentObjectName()}! (${remaining} hits left)`;
        }
    }
    
    drawBody(body) {
        const pos = body.position;
        const angle = body.angle;
        
        this.ctx.save();
        this.ctx.translate(pos.x, pos.y);
        this.ctx.rotate(angle);
        
        // Set fill color
        this.ctx.fillStyle = body.render.fillStyle || '#666';
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        
        // Draw based on body type
        if (body.parts && body.parts.length > 1) {
            // Compound body
            body.parts.forEach((part, index) => {
                if (index > 0) { // Skip parent body
                    this.drawBodyPart(part, pos);
                }
            });

            } else {
            // Simple body
            this.drawSimpleBody(body);
        }
        
        // Draw text for numbers and letters
        if (body.label && (body.label.includes('number_') || body.label.includes('letter_'))) {
            this.drawBodyText(body);
        }
        
        this.ctx.restore();
    }
    
drawSimpleBody(body) {
    const vertices = body.vertices;
    
    if (vertices.length > 0) {
        this.ctx.beginPath();
        this.ctx.moveTo(
            vertices[0].x - body.position.x,
            vertices[0].y - body.position.y
        );
        
        for (let i = 1; i < vertices.length; i++) {
            this.ctx.lineTo(
                vertices[i].x - body.position.x,
                vertices[i].y - body.position.y
            );
        }
        
        this.ctx.closePath();
        
        // Try to use texture if available, otherwise use solid color
        if (this.texturesLoaded && this.currentObject === body && this.textures[this.currentMaterial]) {
            this.drawBodyWithTexture(body);
        } else {
            this.ctx.fill();
            this.ctx.stroke();
        }
    }
}
    
drawBodyWithTexture(body) {
    const texture = this.textures[this.currentMaterial];
    
    // If no texture available, use solid color
    if (!this.texturesLoaded || !texture || !texture.complete || texture.naturalWidth === 0) {
        this.ctx.fill();
        this.ctx.stroke();
        return;
    }
    
    // Rest of texture drawing code...
    this.ctx.save();
    this.ctx.clip();
    
    const bounds = body.bounds;
    const width = bounds.max.x - bounds.min.x;
    const height = bounds.max.y - bounds.min.y;
    
    const scaleX = width / texture.width;
    const scaleY = height / texture.height;
    const scale = Math.max(scaleX, scaleY);
    
    try {
        this.ctx.drawImage(
            texture,
            -width / 2,
            -height / 2,
            texture.width * scale,
            texture.height * scale
        );
    } catch (error) {
        console.warn('Failed to draw texture, using fallback color');
        this.ctx.fillStyle = this.materials[this.currentMaterial].color;
        this.ctx.fill();
    }
    
    this.ctx.restore();
    
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 3;
    this.ctx.stroke();
}
    
    drawBodyPart(part, parentPos) {
        const vertices = part.vertices;
        
        if (vertices.length > 0) {
            this.ctx.beginPath();
            this.ctx.moveTo(
                vertices[0].x - parentPos.x,
                vertices[0].y - parentPos.y
            );
            
            for (let i = 1; i < vertices.length; i++) {
                this.ctx.lineTo(
                    vertices[i].x - parentPos.x,
                    vertices[i].y - parentPos.y
                );
            }
            
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();
        }
    }
    
    drawDebrisWithTexture(debris) {
        const body = debris.body;
        const vertices = body.vertices;
        
        if (vertices.length === 0) return;
        
        const pos = body.position;
        const angle = body.angle;
        
        this.ctx.save();
        this.ctx.translate(pos.x, pos.y);
        this.ctx.rotate(angle);
        
        // Create path
        this.ctx.beginPath();
        this.ctx.moveTo(
            vertices[0].x - pos.x,
            vertices[0].y - pos.y
        );
        
        for (let i = 1; i < vertices.length; i++) {
            this.ctx.lineTo(
                vertices[i].x - pos.x,
                vertices[i].y - pos.y
            );
        }
        this.ctx.closePath();
        
        // Apply texture if available
        const texture = this.textures[debris.material];
        if (texture && this.texturesLoaded) {
            this.ctx.save();
            this.ctx.clip();
            
            const bounds = body.bounds;
            const width = bounds.max.x - bounds.min.x;
            const height = bounds.max.y - bounds.min.y;
            
            // Scale texture to debris piece
            const scale = Math.min(width / texture.width, height / texture.height) * 2;
            
            this.ctx.drawImage(
                texture,
                -width / 2,
                -height / 2,
                texture.width * scale,
                texture.height * scale
            );
            
            this.ctx.restore();
        } else {
            this.ctx.fillStyle = body.render.fillStyle;
            this.ctx.fill();
        }
        
        // Outline
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    drawBodyText(body) {
        let text = '';
        
        if (body.label.includes('number_')) {
            text = body.label.split('_')[1];
        } else if (body.label.includes('letter_')) {
            text = body.label.split('_')[1];
        }
        
        if (text) {
            this.ctx.fillStyle = '#FFF';
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 4;
            this.ctx.font = 'bold 60px Arial'; // BIGGER TEXT (was 48px)
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            // Draw text outline
            this.ctx.strokeText(text, 0, 0);
            // Draw text fill
            this.ctx.fillText(text, 0, 0);
        }
    }
    
    drawParticle(particle) {
        const alpha = Math.max(0, Math.min(1, particle.life / 2.0));
        
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        
        // Add glow for spark particles
        if (particle.spark) {
            this.ctx.shadowColor = particle.color;
            this.ctx.shadowBlur = particle.size * 2;
        }
        
        this.ctx.fillStyle = particle.color;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
}

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
    window.breakLearnGame = new BreakLearnGame();
});