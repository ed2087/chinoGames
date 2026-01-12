/* ============================================
   UTILS.JS - Helper Classes
   Purpose: Vector2D, Random, Color utilities
   ============================================ */

/* ============================================
   VECTOR 2D
   ============================================ */

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

/* ============================================
   RANDOM UTILITIES
   ============================================ */

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
}

/* ============================================
   COLOR UTILITIES
   ============================================ */

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
    
    static fromHex(hex) {
        // Remove # if present
        hex = hex.replace('#', '');
        
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
        return new Color(r, g, b);
    }
}