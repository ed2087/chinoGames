class ObjectFactory {
    constructor(scene, physicsManager, materialManager) {
        this.scene = scene;
        this.physicsManager = physicsManager;
        this.materialManager = materialManager;
        
        // Font loader for text
        this.fontLoader = new THREE.FontLoader();
        this.font = null;
        this.loadFont();
        
        // Learning content categories
        this.shapes = ['cube', 'sphere', 'cylinder', 'cone'];
        this.numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
        this.letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
    }
    
    loadFont() {
        // Load a font for 3D text
        this.fontLoader.load(
            'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
            (font) => {
                this.font = font;
                console.log('Font loaded successfully');
            },
            undefined,
            (error) => {
                console.warn('Font loading failed, using fallback method:', error);
            }
        );
    }
    
    createShape(shapeName, material, size = 2) {
        const materialProps = this.materialManager.getMaterialProperties(material);
        const threeMaterial = this.materialManager.getThreeMaterial(material);
        const physicsMaterial = this.materialManager.getPhysicsMaterial(material);
        
        let geometry, shape, mesh, body;
        
        switch (shapeName) {
            case 'cube':
            case 'square':
                geometry = new THREE.BoxGeometry(size, size, size);
                shape = new CANNON.Box(new CANNON.Vec3(size/2, size/2, size/2));
                break;
                
            case 'sphere':
            case 'circle':
                geometry = new THREE.SphereGeometry(size/2, 16, 12);
                shape = new CANNON.Sphere(size/2);
                break;
                
            case 'cylinder':
                geometry = new THREE.CylinderGeometry(size/2, size/2, size, 12);
                // Use Box approximation for cylinder in v0.6.2
                shape = new CANNON.Box(new CANNON.Vec3(size/2, size/2, size/2));
                break;
                
            case 'cone':
            case 'triangle':
                geometry = new THREE.ConeGeometry(size/2, size, 8);
                // Use Box approximation for cone in v0.6.2
                shape = new CANNON.Box(new CANNON.Vec3(size/2, size/2, size/2));
                break;
                
            default:
                geometry = new THREE.BoxGeometry(size, size, size);
                shape = new CANNON.Box(new CANNON.Vec3(size/2, size/2, size/2));
        }
        
        // Create Three.js mesh
        mesh = new THREE.Mesh(geometry, threeMaterial.clone());
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Create Cannon.js body
        const mass = this.calculateMass(materialProps.density, size);
        body = new CANNON.Body({
            mass: mass,
            material: physicsMaterial
        });
        body.addShape(shape);
        
        // Position at spawn point
        const spawnHeight = 8;
        body.position.set(
            (Math.random() - 0.5) * 2,
            spawnHeight,
            (Math.random() - 0.5) * 2
        );
        
        // Add some initial rotation for dynamic behavior
        body.angularVelocity.set(
            (Math.random() - 0.5) * 3,
            (Math.random() - 0.5) * 3,
            (Math.random() - 0.5) * 3
        );
        
        this.scene.add(mesh);
        this.physicsManager.addBody(body);
        
        return {
            mesh,
            body,
            material: material,
            hitPoints: materialProps.hitPoints,
            maxHitPoints: materialProps.hitPoints,
            type: 'shape',
            name: shapeName,
            size: size
        };
    }
    
    createNumberObject(number, material, size = 2.5) {
        if (this.font) {
            return this.create3DText(number.toString(), material, size, 'number');
        } else {
            return this.createTexturedBox(number.toString(), material, size, 'number');
        }
    }
    
    createLetterObject(letter, material, size = 2.5) {
        if (this.font) {
            return this.create3DText(letter, material, size, 'letter');
        } else {
            return this.createTexturedBox(letter, material, size, 'letter');
        }
    }
    
    create3DText(text, material, size, type) {
        const materialProps = this.materialManager.getMaterialProperties(material);
        const threeMaterial = this.materialManager.getThreeMaterial(material);
        const physicsMaterial = this.materialManager.getPhysicsMaterial(material);
        
        // Create 3D text geometry
        const textGeometry = new THREE.TextGeometry(text, {
            font: this.font,
            size: size * 0.6,
            height: size * 0.3,
            curveSegments: 8,
            bevelEnabled: true,
            bevelThickness: size * 0.05,
            bevelSize: size * 0.02,
            bevelOffset: 0,
            bevelSegments: 3
        });
        
        // Center the geometry
        textGeometry.computeBoundingBox();
        const centerOffsetX = -0.5 * (textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x);
        const centerOffsetY = -0.5 * (textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y);
        const centerOffsetZ = -0.5 * (textGeometry.boundingBox.max.z - textGeometry.boundingBox.min.z);
        textGeometry.translate(centerOffsetX, centerOffsetY, centerOffsetZ);
        
        const mesh = new THREE.Mesh(textGeometry, threeMaterial.clone());
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Create physics body as a box approximation
        const boundingBox = textGeometry.boundingBox;
        const width = boundingBox.max.x - boundingBox.min.x;
        const height = boundingBox.max.y - boundingBox.min.y;
        const depth = boundingBox.max.z - boundingBox.min.z;
        
        const shape = new CANNON.Box(new CANNON.Vec3(width/2, height/2, depth/2));
        const mass = this.calculateMass(materialProps.density, Math.max(width, height, depth));
        
        const body = new CANNON.Body({
            mass: mass,
            material: physicsMaterial
        });
        body.addShape(shape);
        
        // Spawn position
        body.position.set(
            (Math.random() - 0.5) * 2,
            8,
            (Math.random() - 0.5) * 2
        );
        
        body.angularVelocity.set(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        );
        
        this.scene.add(mesh);
        this.physicsManager.addBody(body);
        
        return {
            mesh,
            body,
            material: material,
            hitPoints: materialProps.hitPoints,
            maxHitPoints: materialProps.hitPoints,
            type: type,
            name: text,
            size: size
        };
    }
    
    createTexturedBox(text, material, size, type) {
        const materialProps = this.materialManager.getMaterialProperties(material);
        const threeMaterial = this.materialManager.getThreeMaterial(material);
        const physicsMaterial = this.materialManager.getPhysicsMaterial(material);
        
        // Create canvas texture with text
        const canvas = document.createElement('canvas');
        const canvasSize = 512;
        canvas.width = canvasSize;
        canvas.height = canvasSize;
        const context = canvas.getContext('2d');
        
        // Background
        const materialColor = this.materialManager.getMaterialProperties(material).color;
        context.fillStyle = `#${materialColor.toString(16).padStart(6, '0')}`;
        context.fillRect(0, 0, canvasSize, canvasSize);
        
        // Text
        context.fillStyle = '#ffffff';
        context.strokeStyle = '#000000';
        context.lineWidth = 8;
        context.font = `bold ${canvasSize * 0.6}px Arial`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // Draw text outline and fill
        context.strokeText(text, canvasSize/2, canvasSize/2);
        context.fillText(text, canvasSize/2, canvasSize/2);
        
        // Create texture
        const texture = new THREE.CanvasTexture(canvas);
        texture.generateMipmaps = false;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        
        // Create material with texture
        const texturedMaterial = threeMaterial.clone();
        texturedMaterial.map = texture;
        
        const geometry = new THREE.BoxGeometry(size, size, size);
        const mesh = new THREE.Mesh(geometry, texturedMaterial);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Physics body
        const shape = new CANNON.Box(new CANNON.Vec3(size/2, size/2, size/2));
        const mass = this.calculateMass(materialProps.density, size);
        
        const body = new CANNON.Body({
            mass: mass,
            material: physicsMaterial
        });
        body.addShape(shape);
        
        body.position.set(
            (Math.random() - 0.5) * 2,
            8,
            (Math.random() - 0.5) * 2
        );
        
        body.angularVelocity.set(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        );
        
        this.scene.add(mesh);
        this.physicsManager.addBody(body);
        
        return {
            mesh,
            body,
            material: material,
            hitPoints: materialProps.hitPoints,
            maxHitPoints: materialProps.hitPoints,
            type: type,
            name: text,
            size: size
        };
    }
    
    createFragments(originalObject, impactPoint, numFragments = 12) {
        const fragments = [];
        const originalPos = originalObject.mesh.position.clone();
        const materialProps = this.materialManager.getMaterialProperties(originalObject.material);
        const fragmentMaterial = this.materialManager.createFragmentMaterial(originalObject.material);
        const physicsMaterial = this.materialManager.getPhysicsMaterial(originalObject.material);
        
        for (let i = 0; i < numFragments; i++) {
            const fragmentSize = 0.2 + Math.random() * 0.4;
            
            // Create various fragment shapes for realism
            const fragmentTypes = ['box', 'tetrahedron', 'irregular'];
            const fragmentType = fragmentTypes[Math.floor(Math.random() * fragmentTypes.length)];
            
            let geometry, shape;
            
            switch (fragmentType) {
                case 'box':
                    const width = fragmentSize * (0.5 + Math.random());
                    const height = fragmentSize * (0.5 + Math.random());
                    const depth = fragmentSize * (0.5 + Math.random());
                    geometry = new THREE.BoxGeometry(width, height, depth);
                    shape = new CANNON.Box(new CANNON.Vec3(width/2, height/2, depth/2));
                    break;
                    
                case 'tetrahedron':
                    geometry = new THREE.TetrahedronGeometry(fragmentSize);
                    shape = new CANNON.Sphere(fragmentSize * 0.6);
                    break;
                    
                case 'irregular':
                default:
                    geometry = new THREE.OctahedronGeometry(fragmentSize);
                    shape = new CANNON.Sphere(fragmentSize * 0.7);
                    break;
            }
            
            const mesh = new THREE.Mesh(geometry, fragmentMaterial.clone());
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            
            // Position fragment near original object with some randomness
            const spreadRadius = originalObject.size;
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * spreadRadius;
            
            mesh.position.set(
                originalPos.x + Math.cos(angle) * distance + (Math.random() - 0.5),
                originalPos.y + (Math.random() - 0.5) * 2,
                originalPos.z + Math.sin(angle) * distance + (Math.random() - 0.5)
            );
            
            // Create physics body
            const mass = this.calculateMass(materialProps.density, fragmentSize) * 0.1;
            const body = new CANNON.Body({
                mass: mass,
                material: physicsMaterial
            });
            body.addShape(shape);
            body.position.copy(mesh.position);
            
            // Apply explosive force away from impact point
            const forceDirection = new CANNON.Vec3(
                mesh.position.x - impactPoint.x,
                mesh.position.y - impactPoint.y + 2,
                mesh.position.z - impactPoint.z
            );
            
            // Normalize and add some randomness
            if (forceDirection.length() < 0.1) {
                forceDirection.set(
                    (Math.random() - 0.5) * 2,
                    Math.random() + 1,
                    (Math.random() - 0.5) * 2
                );
            }
            forceDirection.normalize();
            
            const explosiveForce = materialProps.breakForce * (0.3 + Math.random() * 0.7);
            const velocity = forceDirection.scale(explosiveForce / 2000);
            body.velocity.copy(velocity);
            
            // Random angular velocity for spinning fragments
            body.angularVelocity.set(
                (Math.random() - 0.5) * 15,
                (Math.random() - 0.5) * 15,
                (Math.random() - 0.5) * 15
            );
            
            this.scene.add(mesh);
            this.physicsManager.addBody(body);
            
            fragments.push({
                mesh,
                body,
                life: 8.0 + Math.random() * 4.0,
                maxLife: 12.0,
                material: originalObject.material
            });
        }
        
        return fragments;
    }
    
    createRandomObject(material, size) {
        const objectTypes = ['shape', 'number', 'letter'];
        const type = objectTypes[Math.floor(Math.random() * objectTypes.length)];
        
        switch (type) {
            case 'shape':
                const shape = this.shapes[Math.floor(Math.random() * this.shapes.length)];
                return this.createShape(shape, material, size);
                
            case 'number':
                const number = this.numbers[Math.floor(Math.random() * this.numbers.length)];
                return this.createNumberObject(number, material, size);
                
            case 'letter':
                const letter = this.letters[Math.floor(Math.random() * this.letters.length)];
                return this.createLetterObject(letter, material, size);
        }
    }
    
    calculateMass(density, size) {
        // Calculate mass based on volume and density
        const volume = size * size * size;
        return (density * volume) / 10000; // Scale down for game physics
    }
    
    removeObject(gameObject) {
        if (gameObject.mesh) {
            this.scene.remove(gameObject.mesh);
        }
        if (gameObject.body) {
            this.physicsManager.removeBody(gameObject.body);
        }
    }
    
    getAvailableShapes() {
        return [...this.shapes];
    }
    
    getAvailableNumbers() {
        return [...this.numbers];
    }
    
    getAvailableLetters() {
        return [...this.letters];
    }
}