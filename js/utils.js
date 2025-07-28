// Math, random, helper functions 
// Math, random, helper functions

class Vector2D {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    
    add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }
    
    subtract(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }
    
    multiply(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }
    
    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    
    normalize() {
        const mag = this.magnitude();
        if (mag > 0) {
            this.x /= mag;
            this.y /= mag;
        }
        return this;
    }
    
    distance(v) {
        return Math.sqrt((this.x - v.x) ** 2 + (this.y - v.y) ** 2);
    }
    
    clone() {
        return new Vector2D(this.x, this.y);
    }
}

class Random {
    static float(min = 0, max = 1) {
        return Math.random() * (max - min) + min;
    }
    
    static int(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    static choice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    
    static gaussian(mean = 0, std = 1) {
        // Box-Muller transform
        let u1 = Math.random();
        let u2 = Math.random();
        let z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        return z0 * std + mean;
    }
    
    static mutate(value, mutationRate = 0.1, mutationStrength = 0.1) {
        if (Math.random() < mutationRate) {
            return value + Random.gaussian(0, mutationStrength);
        }
        return value;
    }
}

class Color {
    constructor(r = 255, g = 255, b = 255, a = 1) {
        this.r = Math.max(0, Math.min(255, r));
        this.g = Math.max(0, Math.min(255, g));
        this.b = Math.max(0, Math.min(255, b));
        this.a = Math.max(0, Math.min(1, a));
    }
    
    toString() {
        return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
    }
    
    static lerp(color1, color2, t) {
        return new Color(
            color1.r + (color2.r - color1.r) * t,
            color1.g + (color2.g - color1.g) * t,
            color1.b + (color2.b - color1.b) * t,
            color1.a + (color2.a - color1.a) * t
        );
    }
    
    static random() {
        return new Color(
            Random.int(0, 255),
            Random.int(0, 255),
            Random.int(0, 255)
        );
    }
}

// Performance monitoring
class Performance {
    constructor() {
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 0;
        this.deltaTime = 0;
    }
    
    update() {
        const now = performance.now();
        this.deltaTime = (now - this.lastTime) / 1000;
        this.lastTime = now;
        this.frameCount++;
        
        if (this.frameCount % 60 === 0) {
            this.fps = Math.round(1 / this.deltaTime);
        }
    }
}

// Spatial partitioning for efficient collision detection
class QuadTree {
    constructor(bounds, maxObjects = 10, maxLevels = 5, level = 0) {
        this.bounds = bounds;
        this.maxObjects = maxObjects;
        this.maxLevels = maxLevels;
        this.level = level;
        this.objects = [];
        this.nodes = [];
    }
    
    clear() {
        this.objects = [];
        this.nodes.forEach(node => node.clear());
        this.nodes = [];
    }
    
    split() {
        const subWidth = this.bounds.width / 2;
        const subHeight = this.bounds.height / 2;
        const x = this.bounds.x;
        const y = this.bounds.y;
        
        this.nodes[0] = new QuadTree({x: x + subWidth, y: y, width: subWidth, height: subHeight}, this.maxObjects, this.maxLevels, this.level + 1);
        this.nodes[1] = new QuadTree({x: x, y: y, width: subWidth, height: subHeight}, this.maxObjects, this.maxLevels, this.level + 1);
        this.nodes[2] = new QuadTree({x: x, y: y + subHeight, width: subWidth, height: subHeight}, this.maxObjects, this.maxLevels, this.level + 1);
        this.nodes[3] = new QuadTree({x: x + subWidth, y: y + subHeight, width: subWidth, height: subHeight}, this.maxObjects, this.maxLevels, this.level + 1);
    }
    
    getIndex(obj) {
        let index = -1;
        const verticalMidpoint = this.bounds.x + (this.bounds.width / 2);
        const horizontalMidpoint = this.bounds.y + (this.bounds.height / 2);
        
        const topQuadrant = (obj.y < horizontalMidpoint && obj.y + obj.height < horizontalMidpoint);
        const bottomQuadrant = (obj.y > horizontalMidpoint);
        
        if (obj.x < verticalMidpoint && obj.x + obj.width < verticalMidpoint) {
            if (topQuadrant) index = 1;
            else if (bottomQuadrant) index = 2;
        } else if (obj.x > verticalMidpoint) {
            if (topQuadrant) index = 0;
            else if (bottomQuadrant) index = 3;
        }
        
        return index;
    }
    
    insert(obj) {
        if (this.nodes.length > 0) {
            const index = this.getIndex(obj);
            if (index !== -1) {
                this.nodes[index].insert(obj);
                return;
            }
        }
        
        this.objects.push(obj);
        
        if (this.objects.length > this.maxObjects && this.level < this.maxLevels) {
            if (this.nodes.length === 0) {
                this.split();
            }
            
            let i = 0;
            while (i < this.objects.length) {
                const index = this.getIndex(this.objects[i]);
                if (index !== -1) {
                    this.nodes[index].insert(this.objects.splice(i, 1)[0]);
                } else {
                    i++;
                }
            }
        }
    }
    
    retrieve(obj) {
        const returnObjects = this.objects.slice();
        
        if (this.nodes.length > 0) {
            const index = this.getIndex(obj);
            if (index !== -1) {
                returnObjects.push(...this.nodes[index].retrieve(obj));
            }
        }
        
        return returnObjects;
    }
}