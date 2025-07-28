// Planet, resources, environment

class World {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.resources = [];
        this.environment = new Environment(width, height);
        this.quadTree = new QuadTree({x: -width/2, y: -height/2, width, height});
        this.time = 0;
        
        this.resourceGrowthTimer = 0;
        this.resourceGrowthInterval = 2; // seconds
    }
    
    update(deltaTime) {
        this.time += deltaTime;
        this.environment.update(deltaTime);
        
        // Update resources
        this.resources.forEach(resource => resource.update(deltaTime));
        
        // Remove consumed resources
        this.resources = this.resources.filter(resource => !resource.consumed);
        
        // Grow new resources periodically
        this.resourceGrowthTimer += deltaTime;
        if (this.resourceGrowthTimer >= this.resourceGrowthInterval) {
            this.addRandomResource();
            this.resourceGrowthTimer = 0;
        }
        
        // Update spatial partitioning
        this.updateQuadTree();
    }
    
    updateQuadTree() {
        this.quadTree.clear();
        this.resources.forEach(resource => {
            this.quadTree.insert({
                x: resource.position.x - resource.size,
                y: resource.position.y - resource.size,
                width: resource.size * 2,
                height: resource.size * 2,
                object: resource
            });
        });
    }
    
    render(ctx) {
        this.environment.render(ctx);
        this.resources.forEach(resource => resource.render(ctx));
    }
    
    addRandomResource() {
        const position = new Vector2D(
            Random.float(-this.width/2, this.width/2),
            Random.float(-this.height/2, this.height/2)
        );
        
        const resourceType = Random.choice(['food', 'water', 'mineral']);
        this.addResource(resourceType, position);
    }
    
    addResource(type, position, amount = null) {
        const resource = new Resource(type, position, amount);
        this.resources.push(resource);
        return resource;
    }
    
    getResourcesNear(position, radius) {
        const bounds = {
            x: position.x - radius,
            y: position.y - radius,
            width: radius * 2,
            height: radius * 2
        };
        
        const nearby = this.quadTree.retrieve(bounds);
        return nearby.filter(item => {
            const dist = position.distance(item.object.position);
            return dist <= radius;
        }).map(item => item.object);
    }
    
    getClosestResource(position, type = null) {
        let closest = null;
        let closestDistance = Infinity;
        
        this.resources.forEach(resource => {
            if (type && resource.type !== type) return;
            if (resource.consumed) return;
            
            const distance = position.distance(resource.position);
            if (distance < closestDistance) {
                closest = resource;
                closestDistance = distance;
            }
        });
        
        return closest;
    }
}

class Resource {
    constructor(type, position, amount = null) {
        this.type = type; // 'food', 'water', 'mineral'
        this.position = position.clone();
        this.amount = amount || Random.float(50, 200);
        this.maxAmount = this.amount;
        this.size = Math.sqrt(this.amount) * 0.5;
        this.color = this.getColorForType();
        this.consumed = false;
        this.growthRate = Random.float(10, 30); // amount per second
        this.pulsePhase = Random.float(0, Math.PI * 2);
    }
    
    getColorForType() {
        switch (this.type) {
            case 'food': return new Color(100, 200, 100);
            case 'water': return new Color(100, 150, 255);
            case 'mineral': return new Color(150, 150, 150);
            default: return new Color(255, 255, 255);
        }
    }
    
    update(deltaTime) {
        // Slowly regenerate
        if (this.amount < this.maxAmount) {
            this.amount += this.growthRate * deltaTime;
            this.amount = Math.min(this.amount, this.maxAmount);
            this.size = Math.sqrt(this.amount) * 0.5;
        }
        
        this.pulsePhase += deltaTime * 2;
    }
    
    consume(amount) {
        const consumed = Math.min(amount, this.amount);
        this.amount -= consumed;
        this.size = Math.sqrt(this.amount) * 0.5;
        
        if (this.amount <= 0) {
            this.consumed = true;
        }
        
        return consumed;
    }
    
    render(ctx) {
        if (this.consumed) return;
        
        const pulse = 1 + Math.sin(this.pulsePhase) * 0.1;
        const renderSize = this.size * pulse;
        
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        
        // Glow effect
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, renderSize * 2);
        gradient.addColorStop(0, this.color.toString());
        gradient.addColorStop(0.5, new Color(this.color.r, this.color.g, this.color.b, 0.5).toString());
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, renderSize * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Core
        ctx.fillStyle = this.color.toString();
        ctx.beginPath();
        ctx.arc(0, 0, renderSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

class Environment {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.temperature = 20; // Celsius
        this.humidity = 0.5;
        this.windDirection = Random.float(0, Math.PI * 2);
        this.windSpeed = 5;
        this.time = 0;
        
        // Generate terrain
        this.generateTerrain();
    }
    
    generateTerrain() {
        this.terrainData = [];
        const resolution = 50;
        
        for (let x = 0; x < resolution; x++) {
            this.terrainData[x] = [];
            for (let y = 0; y < resolution; y++) {
                // Simple noise for terrain height
                const height = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 50;
                this.terrainData[x][y] = {
                    height: height,
                    fertility: Random.float(0.3, 1.0),
                    temperature: this.temperature + height * 0.1
                };
            }
        }
    }
    
    update(deltaTime) {
        this.time += deltaTime;
        
        // Weather changes
        this.temperature += Math.sin(this.time * 0.1) * 0.1;
        this.windDirection += Random.float(-0.1, 0.1);
        this.windSpeed += Random.float(-1, 1);
        this.windSpeed = Math.max(0, Math.min(20, this.windSpeed));
    }
    
    render(ctx) {
        // Render simple grid background
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
        ctx.lineWidth = 1;
        
        const gridSize = 100;
        const startX = Math.floor(-this.width/2 / gridSize) * gridSize;
        const startY = Math.floor(-this.height/2 / gridSize) * gridSize;
        
        for (let x = startX; x < this.width/2; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, -this.height/2);
            ctx.lineTo(x, this.height/2);
            ctx.stroke();
        }
        
        for (let y = startY; y < this.height/2; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(-this.width/2, y);
            ctx.lineTo(this.width/2, y);
            ctx.stroke();
        }
    }
    
    getTerrainAt(x, y) {
        const resolution = this.terrainData.length;
        const tx = Math.floor(((x + this.width/2) / this.width) * resolution);
        const ty = Math.floor(((y + this.height/2) / this.height) * resolution);
        
        if (tx >= 0 && tx < resolution && ty >= 0 && ty < resolution) {
            return this.terrainData[tx][ty];
        }
        
        return { height: 0, fertility: 0.5, temperature: this.temperature };
    }
}