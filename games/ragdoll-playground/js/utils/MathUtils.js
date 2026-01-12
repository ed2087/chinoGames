// ==========================================
// MATHEMATICAL UTILITIES FOR PHYSICS
// ==========================================

class MathUtils {
    
    // ==========================================
    // VECTOR OPERATIONS
    // ==========================================
    
    /**
     * Create a 2D vector
     */
    static createVector(x = 0, y = 0) {
        return { x, y };
    }
    
    /**
     * Add two vectors
     */
    static vectorAdd(a, b) {
        return {
            x: a.x + b.x,
            y: a.y + b.y
        };
    }
    
    /**
     * Subtract two vectors
     */
    static vectorSubtract(a, b) {
        return {
            x: a.x - b.x,
            y: a.y - b.y
        };
    }
    
    /**
     * Multiply vector by scalar
     */
    static vectorMultiply(vector, scalar) {
        return {
            x: vector.x * scalar,
            y: vector.y * scalar
        };
    }
    
    /**
     * Get vector magnitude (length)
     */
    static vectorMagnitude(vector) {
        return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    }
    
    /**
     * Normalize vector (make length = 1)
     */
    static vectorNormalize(vector) {
        const magnitude = this.vectorMagnitude(vector);
        if (magnitude === 0) return { x: 0, y: 0 };
        
        return {
            x: vector.x / magnitude,
            y: vector.y / magnitude
        };
    }
    
    /**
     * Get distance between two points
     */
    static distance(point1, point2) {
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Get angle between two points (in radians)
     */
    static angle(point1, point2) {
        return Math.atan2(point2.y - point1.y, point2.x - point1.x);
    }
    
    /**
     * Rotate point around center
     */
    static rotatePoint(point, center, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        const dx = point.x - center.x;
        const dy = point.y - center.y;
        
        return {
            x: center.x + (dx * cos - dy * sin),
            y: center.y + (dx * sin + dy * cos)
        };
    }
    
    // ==========================================
    // INTERPOLATION & SMOOTHING
    // ==========================================
    
    /**
     * Linear interpolation between two values
     */
    static lerp(start, end, factor) {
        return start + (end - start) * factor;
    }
    
    /**
     * Smooth interpolation (easing)
     */
    static smoothStep(edge0, edge1, x) {
        const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
        return t * t * (3 - 2 * t);
    }
    
    /**
     * Exponential smoothing for camera/movement
     */
    static exponentialSmooth(current, target, factor, deltaTime) {
        return current + (target - current) * (1 - Math.exp(-factor * deltaTime));
    }
    
    // ==========================================
    // PHYSICS HELPERS
    // ==========================================
    
    /**
     * Calculate velocity from two positions and time
     */
    static calculateVelocity(position1, position2, deltaTime) {
        if (deltaTime === 0) return { x: 0, y: 0 };
        
        return {
            x: (position2.x - position1.x) / deltaTime,
            y: (position2.y - position1.y) / deltaTime
        };
    }
    
    /**
     * Apply drag/friction to velocity
     */
    static applyDrag(velocity, dragFactor, deltaTime) {
        const drag = Math.pow(dragFactor, deltaTime);
        return {
            x: velocity.x * drag,
            y: velocity.y * drag
        };
    }
    
    /**
     * Constrain value between min and max
     */
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    
    /**
     * Map value from one range to another
     */
    static map(value, inputMin, inputMax, outputMin, outputMax) {
        return outputMin + (outputMax - outputMin) * ((value - inputMin) / (inputMax - inputMin));
    }
    
    // ==========================================
    // RANDOM UTILITIES
    // ==========================================
    
    /**
     * Random float between min and max
     */
    static randomFloat(min = 0, max = 1) {
        return min + Math.random() * (max - min);
    }
    
    /**
     * Random integer between min and max (inclusive)
     */
    static randomInt(min, max) {
        return Math.floor(this.randomFloat(min, max + 1));
    }
    
    /**
     * Random vector within radius
     */
    static randomVector(maxMagnitude = 1) {
        const angle = Math.random() * Math.PI * 2;
        const magnitude = Math.random() * maxMagnitude;
        
        return {
            x: Math.cos(angle) * magnitude,
            y: Math.sin(angle) * magnitude
        };
    }
    
    /**
     * Random point within circle
     */
    static randomPointInCircle(center, radius) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.sqrt(Math.random()) * radius; // Square root for uniform distribution
        
        return {
            x: center.x + Math.cos(angle) * distance,
            y: center.y + Math.sin(angle) * distance
        };
    }
    
    /**
     * Pick random element from array
     */
    static randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    
    // ==========================================
    // COLLISION & BOUNDS
    // ==========================================
    
    /**
     * Check if point is inside circle
     */
    static pointInCircle(point, center, radius) {
        return this.distance(point, center) <= radius;
    }
    
    /**
     * Check if point is inside rectangle
     */
    static pointInRect(point, rect) {
        return point.x >= rect.x && 
               point.x <= rect.x + rect.width &&
               point.y >= rect.y && 
               point.y <= rect.y + rect.height;
    }
    
    /**
     * Get closest point on line segment to given point
     */
    static closestPointOnLine(point, lineStart, lineEnd) {
        const line = this.vectorSubtract(lineEnd, lineStart);
        const lineLength = this.vectorMagnitude(line);
        
        if (lineLength === 0) return lineStart;
        
        const t = Math.max(0, Math.min(1, 
            this.vectorDot(this.vectorSubtract(point, lineStart), line) / (lineLength * lineLength)
        ));
        
        return this.vectorAdd(lineStart, this.vectorMultiply(line, t));
    }
    
    /**
     * Dot product of two vectors
     */
    static vectorDot(a, b) {
        return a.x * b.x + a.y * b.y;
    }
    
    // ==========================================
    // PERFORMANCE OPTIMIZATIONS
    // ==========================================
    
    /**
     * Fast square root approximation
     */
    static fastSqrt(x) {
        if (x <= 0) return 0;
        
        // Use built-in for accuracy in physics
        return Math.sqrt(x);
    }
    
    /**
     * Fast distance calculation (without square root for comparisons)
     */
    static distanceSquared(point1, point2) {
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;
        return dx * dx + dy * dy;
    }
    
    /**
     * Degrees to radians
     */
    static toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
    
    /**
     * Radians to degrees
     */
    static toDegrees(radians) {
        return radians * (180 / Math.PI);
    }
    
    // ==========================================
    // SPRING & PHYSICS CALCULATIONS
    // ==========================================
    
    /**
     * Calculate spring force
     */
    static springForce(currentLength, restLength, stiffness) {
        return (restLength - currentLength) * stiffness;
    }
    
    /**
     * Calculate damping force
     */
    static dampingForce(velocity, dampingFactor) {
        return this.vectorMultiply(velocity, -dampingFactor);
    }
    
    /**
     * Apply force to get acceleration (F = ma, so a = F/m)
     */
    static forceToAcceleration(force, mass) {
        if (mass <= 0) return { x: 0, y: 0 };
        
        return {
            x: force.x / mass,
            y: force.y / mass
        };
    }
    
    // ==========================================
    // EASING FUNCTIONS FOR ANIMATIONS
    // ==========================================
    
    static easeInOut(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
    
    static easeOutBounce(t) {
        if (t < 1 / 2.75) {
            return 7.5625 * t * t;
        } else if (t < 2 / 2.75) {
            return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
        } else if (t < 2.5 / 2.75) {
            return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
        } else {
            return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
        }
    }
    
    static easeOutElastic(t) {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : 
               Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    }
}

// Make available globally
window.MathUtils = MathUtils;

console.log('🧮 MathUtils loaded - Physics math utilities ready');