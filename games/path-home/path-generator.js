// ==========================================
// OBSTACLE GENERATION SYSTEM (NO PATHS)
// ==========================================

class PathGenerator {
    constructor(canvasWidth, canvasHeight) {
        this.width = canvasWidth;
        this.height = canvasHeight;
    }
    
    // Generate starting position (edge of canvas)
    generateStartPoint() {
        const margin = 80;
        const side = Math.floor(Math.random() * 4);
        
        switch (side) {
            case 0: // Top
                return { x: margin + Math.random() * (this.width - margin * 2), y: margin };
            case 1: // Right  
                return { x: this.width - margin, y: margin + Math.random() * (this.height - margin * 2) };
            case 2: // Bottom
                return { x: margin + Math.random() * (this.width - margin * 2), y: this.height - margin };
            case 3: // Left
                return { x: margin, y: margin + Math.random() * (this.height - margin * 2) };
        }
    }
    
    // Generate destination (opposite area from start)
    generateEndPoint(startPoint) {
        const margin = 100;
        const minDistance = Math.min(this.width, this.height) * 0.4;
        
        let attempts = 0;
        let endPoint;
        
        do {
            // Try to place on opposite side of canvas
            if (startPoint.x < this.width / 2) {
                // Start on left, end on right
                endPoint = {
                    x: this.width - margin - Math.random() * (this.width * 0.3),
                    y: margin + Math.random() * (this.height - margin * 2)
                };
            } else {
                // Start on right, end on left
                endPoint = {
                    x: margin + Math.random() * (this.width * 0.3),
                    y: margin + Math.random() * (this.height - margin * 2)
                };
            }
            attempts++;
        } while (this.distance(startPoint, endPoint) < minDistance && attempts < 50);
        
        return endPoint;
    }
    
    // Generate destination based on animal type
    generateDestination(animalType, endPoint) {
        const destinations = {
            penguin: { type: 'igloo', color: '#E6F3FF', size: 50 },
            teddy: { type: 'house', color: '#8B4513', size: 55 },
            ducky: { type: 'pond', color: '#87CEEB', size: 60 }
        };
        
        return {
            ...endPoint,
            ...destinations[animalType]
        };
    }
    
    drawDestination(ctx, destination) {
        ctx.save();
        ctx.translate(destination.x, destination.y);
        
        switch (destination.type) {
            case 'igloo':
                this.drawIgloo(ctx, destination.size);
                break;
            case 'house':
                this.drawHouse(ctx, destination.size);
                break;
            case 'pond':
                this.drawPond(ctx, destination.size);
                break;
        }
        
        ctx.restore();
    }
    
    drawIgloo(ctx, size) {
        // Igloo dome
        ctx.fillStyle = '#E6F3FF';
        ctx.strokeStyle = '#B0C4DE';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.8, Math.PI, 0);
        ctx.fill();
        ctx.stroke();
        
// Door
        ctx.fillStyle = '#4682B4';
        ctx.strokeStyle = '#2F4F4F';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, size * 0.2, size * 0.25, Math.PI, 0);
        ctx.fill();
        ctx.stroke();
        
        // Ice blocks texture
        ctx.strokeStyle = '#B0C4DE';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(0, 0, size * 0.8 - (i * 10), Math.PI + 0.3, -0.3);
            ctx.stroke();
        }
    }
    
    drawHouse(ctx, size) {
        const houseWidth = size * 1.2;
        const houseHeight = size * 0.8;
        
        // House base
        ctx.fillStyle = '#DEB887';
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 4;
        ctx.fillRect(-houseWidth / 2, -houseHeight / 2, houseWidth, houseHeight);
        ctx.strokeRect(-houseWidth / 2, -houseHeight / 2, houseWidth, houseHeight);
        
        // Roof
        ctx.fillStyle = '#DC143C';
        ctx.strokeStyle = '#8B0000';
        ctx.beginPath();
        ctx.moveTo(-houseWidth * 0.6, -houseHeight / 2);
        ctx.lineTo(0, -size);
        ctx.lineTo(houseWidth * 0.6, -houseHeight / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Door
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-size * 0.2, -houseHeight / 2, size * 0.4, houseHeight * 0.7);
        ctx.strokeRect(-size * 0.2, -houseHeight / 2, size * 0.4, houseHeight * 0.7);
        
        // Window
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(size * 0.3, -houseHeight * 0.2, size * 0.25, size * 0.25);
        ctx.strokeRect(size * 0.3, -houseHeight * 0.2, size * 0.25, size * 0.25);
    }
    
    drawPond(ctx, size) {
        // Main pond
        ctx.fillStyle = '#87CEEB';
        ctx.strokeStyle = '#4682B4';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(0, 0, size, size * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Water ripples
        ctx.strokeStyle = '#B0E0E6';
        ctx.lineWidth = 2;
        for (let i = 1; i <= 3; i++) {
            ctx.beginPath();
            ctx.ellipse(0, 0, size * 0.3 * i, size * 0.2 * i, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Lily pads
        ctx.fillStyle = '#90EE90';
        ctx.strokeStyle = '#006400';
        ctx.lineWidth = 2;
        for (let i = 0; i < 2; i++) {
            const angle = (i * Math.PI);
            const x = Math.cos(angle) * size * 0.4;
            const y = Math.sin(angle) * size * 0.3;
            
            ctx.beginPath();
            ctx.ellipse(x, y, size * 0.15, size * 0.1, angle, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
    }
    
    // Utility function
    distance(p1, p2) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}