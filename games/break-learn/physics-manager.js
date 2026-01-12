class PhysicsManager {
    constructor() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0);
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.solver.iterations = 10;
        
        // Contact material for realistic collisions
        this.world.defaultContactMaterial.friction = 0.4;
        this.world.defaultContactMaterial.restitution = 0.3;
        
        // Ground
        this.createGround();
        
        // Walls (invisible boundaries)
        this.createWalls();
    }
    
    createGround() {
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({ mass: 0 });
        groundBody.addShape(groundShape);
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        groundBody.position.set(0, -5, 0);
        this.world.add(groundBody);
        
        return groundBody;
    }
    
    createWalls() {
        const wallMaterial = new CANNON.Material('wall');
        wallMaterial.friction = 0.3;
        wallMaterial.restitution = 0.2;
        
        // Side walls
        const wallShape = new CANNON.Box(new CANNON.Vec3(0.5, 10, 10));
        
        // Left wall
        const leftWall = new CANNON.Body({ mass: 0, material: wallMaterial });
        leftWall.addShape(wallShape);
        leftWall.position.set(-8, 0, 0);
        this.world.add(leftWall);
        
        // Right wall
        const rightWall = new CANNON.Body({ mass: 0, material: wallMaterial });
        rightWall.addShape(wallShape);
        rightWall.position.set(8, 0, 0);
        this.world.add(rightWall);
        
        // Back wall
        const backWallShape = new CANNON.Box(new CANNON.Vec3(10, 10, 0.5));
        const backWall = new CANNON.Body({ mass: 0, material: wallMaterial });
        backWall.addShape(backWallShape);
        backWall.position.set(0, 0, -8);
        this.world.add(backWall);
    }
    
    createContactMaterial(material1, material2, options = {}) {
        const contactMaterial = new CANNON.ContactMaterial(material1, material2, {
            friction: options.friction || 0.4,
            restitution: options.restitution || 0.3,
            contactEquationStiffness: options.stiffness || 1e8,
            contactEquationRelaxation: options.relaxation || 3
        });
        
        this.world.addContactMaterial(contactMaterial);
        return contactMaterial;
    }
    
    step(deltaTime) {
        this.world.step(deltaTime);
    }
    
    addBody(body) {
        this.world.add(body);
    }
    
    removeBody(body) {
        this.world.remove(body);
    }
}