// ==========================================
// SHAPE MANAGEMENT AND RENDERING
// ==========================================

class ShapeManager {
    constructor(canvas, physics) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.physics = physics;
        
        // Rendering settings
        this.shadowEnabled = !this.isMobileDevice();
        
        console.log('Shape manager initialized');
    }
    
    isMobileDevice() {
        return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        this.drawBackground();
        
        // Draw ground
        this.drawGround();
        
        // Draw all physics bodies
        this.drawBodies();
    }
    
    drawBackground() {
        // Animated sky gradient
        const time = Date.now() * 0.0005;
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        
        // Sky colors that shift throughout the day
        const skyHue = 200 + Math.sin(time) * 20;
        const skyColor = `hsl(${skyHue}, 70%, 80%)`;
        const groundColor = '#98FB98';
        
        gradient.addColorStop(0, skyColor);
        gradient.addColorStop(0.7, '#87CEEB');
        gradient.addColorStop(1, groundColor);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw moving clouds (performance permitting)
        if (!this.isMobileDevice()) {
            this.drawClouds(time);
        }
    }
    
    drawClouds(time) {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        
        for (let i = 0; i < 3; i++) {
            const x = (time * 30 + i * 400) % (this.canvas.width + 200) - 100;
            const y = 50 + i * 40;
            const size = 30 + i * 10;
            
            // Draw fluffy cloud
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.arc(x + size * 0.6, y, size * 0.8, 0, Math.PI * 2);
            this.ctx.arc(x + size * 1.2, y, size * 0.6, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawGround() {
        const groundY = this.canvas.height - 50;
        
        // Main ground
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(0, groundY, this.canvas.width, 50);
        
        // Grass texture
        this.ctx.fillStyle = '#228B22';
        const grassTime = Date.now() * 0.001;
        
        for (let i = 0; i < this.canvas.width; i += 15) {
            const grassHeight = 6 + Math.sin(grassTime + i * 0.05) * 2;
            this.ctx.fillRect(i, groundY - grassHeight, 12, grassHeight);
        }
    }
    
    drawBodies() {
        for (let body of this.physics.bodies) {
            if (body.label === 'ground' || body.label.includes('Wall')) continue;
            
            this.drawBody(body);
        }
    }
    
    drawBody(body) {
        const pos = body.position;
        const angle = body.angle;
        
        this.ctx.save();
        this.ctx.translate(pos.x, pos.y);
        this.ctx.rotate(angle);
        
        // Shadow effect (desktop only)
        if (this.shadowEnabled) {
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            this.ctx.shadowBlur = 8;
            this.ctx.shadowOffsetX = 3;
            this.ctx.shadowOffsetY = 3;
        }
        
        // Set colors
        this.ctx.fillStyle = body.color;
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // Draw based on shape type
        this.drawShape(body);
        
        this.ctx.restore();
    }
    
    drawShape(body) {
        switch (body.shapeType) {
            case 'square':
                this.drawRectangle(-25, -25, 50, 50);
                break;
                
            case 'rectangle':
                this.drawRectangle(-40, -20, 80, 40);
                break;
                
            case 'triangle':
                this.drawTriangle();
                break;
                
            case 'circle':
                this.drawCircle(25);
                break;
                
            case 'star':
                this.drawStar(25);
                break;
                
            default:
                this.drawFromVertices(body);
                break;
        }
    }
    
    drawRectangle(x, y, width, height) {
        this.ctx.fillRect(x, y, width, height);
        this.ctx.strokeRect(x, y, width, height);
        
        // Add highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(x, y, width * 0.3, height * 0.3);
    }
    
    drawTriangle() {
        this.ctx.beginPath();
        this.ctx.moveTo(0, -25);
        this.ctx.lineTo(-25, 25);
        this.ctx.lineTo(25, 25);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // Add highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.beginPath();
        this.ctx.moveTo(0, -15);
        this.ctx.lineTo(-15, 15);
        this.ctx.lineTo(15, 15);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    drawCircle(radius) {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Add highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(-radius * 0.3, -radius * 0.3, radius * 0.4, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawStar(radius) {
        const spikes = 5;
        const outerRadius = radius;
        const innerRadius = radius * 0.4;
        
        this.ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const angle = (i * Math.PI) / spikes - Math.PI / 2;
            const r = i % 2 === 0 ? outerRadius : innerRadius;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // Add sparkle
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 4, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawFromVertices(body) {
        // Fallback for complex shapes
        const vertices = body.vertices;
        if (!vertices || vertices.length === 0) return;
        
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
        this.ctx.fill();
        this.ctx.stroke();
    }
    
    // Utility methods
    getShapeAt(x, y) {
        return this.physics.getBodyAt(x, y);
    }
    
    createShape(type, x, y) {
        const body = this.physics.createShape(type, x, y);
        
        if (body && window.audioSystem?.isInitialized) {
            // Speak shape name and color
            const colorNames = {
                '#FF6B6B': 'red',
                '#4ECDC4': 'blue',
                '#A8E6CF': 'green',
                '#FFD93D': 'yellow',
                '#B983FF': 'purple'
            };
            
            const colorName = colorNames[body.color] || 'colorful';
            window.audioSystem.speak(`${colorName} ${type}!`);
        }
        
        return body;
    }
    
    clear() {
        this.physics.clear();
    }
}

window.ShapeManager = ShapeManager;