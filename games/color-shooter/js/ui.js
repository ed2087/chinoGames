// ==========================================
// UI CONTROLLER
// ==========================================

class UIController {
    constructor(game) {
        this.game = game;
        this.popup = document.getElementById('targetPopup');
        this.popupTitle = document.getElementById('popupTitle');
        this.popupShape = document.getElementById('popupShape');
        this.popupButton = document.getElementById('popupButton');
        
        this.scoreElement = document.getElementById('score');
        this.levelElement = document.getElementById('level');
        this.progressText = document.getElementById('progressText');
        this.progressFill = document.getElementById('progressFill');
    }
    
    showTargetPopup(shapeType, color, onStart) {
        this.popup.classList.remove('hidden');
        
        // Set title
        this.popupTitle.textContent = `FIND THE ${color.name.toUpperCase()} ${shapeType.name.toUpperCase()}S!`;
        this.popupTitle.style.color = color.hex;
        
        // Draw shape preview
        this.drawShapePreview(shapeType, color);
        
        // Button click handler
        this.popupButton.onclick = () => {
            this.hidePopup();
            if (onStart) onStart();
        };
        
        // Show with animation
        setTimeout(() => {
            this.popup.classList.add('active');
        }, 100);
    }
    
    drawShapePreview(shapeType, color) {
        const canvas = document.createElement('canvas');
        canvas.width = 150;
        canvas.height = 150;
        const ctx = canvas.getContext('2d');
        
        // Draw the shape
        shapeType.draw.call(this.game, ctx, 75, 75, 50, color.hex);
        
        // Set as popup content
        this.popupShape.innerHTML = '';
        this.popupShape.appendChild(canvas);
    }
    
    hidePopup() {
        this.popup.classList.remove('active');
        setTimeout(() => {
            this.popup.classList.add('hidden');
        }, 300);
    }
    
    updateScore(score) {
        this.scoreElement.textContent = score;
        
        // Animate score update
        this.scoreElement.style.transform = 'scale(1.5)';
        setTimeout(() => {
            this.scoreElement.style.transform = 'scale(1)';
        }, 200);
    }
    
    updateLevel(level) {
        this.levelElement.textContent = level;
        
        // Animate level update
        this.levelElement.style.transform = 'scale(1.5)';
        setTimeout(() => {
            this.levelElement.style.transform = 'scale(1)';
        }, 200);
    }
    
    updateProgress(current, total) {
        this.progressText.textContent = `Targets: ${current}/${total}`;
        const percent = (current / total) * 100;
        this.progressFill.style.width = percent + '%';
        
        // Pulse animation
        this.progressFill.style.transform = 'scaleY(1.2)';
        setTimeout(() => {
            this.progressFill.style.transform = 'scaleY(1)';
        }, 100);
    }
}