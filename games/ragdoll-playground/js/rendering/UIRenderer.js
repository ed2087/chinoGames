// ==========================================
// UI RENDERER - HEADS-UP DISPLAY & OVERLAYS
// Renders game UI, controls, indicators, and overlay effects
// ==========================================

class UIRenderer {
    
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.mathUtils = window.MathUtils;
        this.deviceUtils = window.DeviceUtils;
        
        // UI configuration
        this.config = {
            // Visual settings
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            primaryColor: '#3498db',
            secondaryColor: '#2ecc71',
            warningColor: '#f39c12',
            dangerColor: '#e74c3c',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            textColor: '#ffffff',
            
            // Layout settings
            padding: 16,
            borderRadius: 8,
            shadowBlur: 10,
            
            // Animation settings
            animationSpeed: 0.3,
            fadeInDuration: 0.5,
            fadeOutDuration: 0.3,
            
            // Touch-friendly settings
            minTouchTarget: this.deviceUtils.getTouchSettings().minTouchRadius,
            largeText: this.deviceUtils.device.isTablet,
            
            ...options
        };
        
        // UI elements
        this.elements = new Map();
        this.notifications = [];
        this.tooltips = [];
        this.overlays = [];
        
        // Animation state
        this.animationClock = 0;
        this.transitionElements = new Set();
        
        // Performance
        this.updateThrottle = this.deviceUtils.device.isDesktop ? 0 : 16; // ms
        this.lastUpdate = 0;
        
        console.log('🖼️ UIRenderer initialized');
        console.log(`📱 Touch targets: ${this.config.minTouchTarget}px minimum`);
    }
    
    // ==========================================
    // UI ELEMENT MANAGEMENT
    // ==========================================
    
    /**
     * Add UI element
     */
    addElement(id, element) {
        element.id = id;
        element.visible = element.visible !== false;
        element.alpha = element.alpha || 1.0;
        element.animationState = 'idle';
        element.createdAt = Date.now();
        
        this.elements.set(id, element);
        
        return element;
    }
    
    /**
     * Remove UI element
     */
    removeElement(id, animated = true) {
        const element = this.elements.get(id);
        if (!element) return false;
        
        if (animated) {
            this.animateElement(id, { alpha: 0 }, () => {
                this.elements.delete(id);
            });
        } else {
            this.elements.delete(id);
        }
        
        return true;
    }
    
    /**
     * Update UI element
     */
    updateElement(id, updates) {
        const element = this.elements.get(id);
        if (!element) return false;
        
        Object.assign(element, updates);
        return true;
    }
    
    /**
     * Get UI element
     */
    getElement(id) {
        return this.elements.get(id);
    }
    
    /**
     * Animate UI element
     */
    animateElement(id, targetProps, onComplete = null) {
        const element = this.elements.get(id);
        if (!element) return false;
        
        element.animationState = 'animating';
        element.animationStart = Date.now();
        element.animationDuration = targetProps.duration || 300;
        element.animationProps = targetProps;
        element.animationCallback = onComplete;
        element.startProps = {};
        
        // Store starting values
        for (const prop in targetProps) {
            if (prop !== 'duration' && element.hasOwnProperty(prop)) {
                element.startProps[prop] = element[prop];
            }
        }
        
        this.transitionElements.add(id);
        return true;
    }
    
    // ==========================================
    // COMMON UI COMPONENTS
    // ==========================================
    
    /**
     * Create character type indicator
     */
    createCharacterIndicator(ragdollType, position = { x: 20, y: 20 }) {
        const ragdollTypes = {
            'human': { icon: '👤', name: 'Human', color: '#3498db' },
            'teddy': { icon: '🧸', name: 'Teddy Bear', color: '#8B4513' },
            'frog': { icon: '🐸', name: 'Frog', color: '#32CD32' },
            'robot': { icon: '🤖', name: 'Robot', color: '#708090' },
            'alien': { icon: '👽', name: 'Alien', color: '#98FB98' }
        };
        
        const typeInfo = ragdollTypes[ragdollType.toLowerCase()] || ragdollTypes.human;
        
        return this.addElement('characterIndicator', {
            type: 'characterIndicator',
            x: position.x,
            y: position.y,
            width: 200,
            height: 80,
            ragdollType: ragdollType,
            icon: typeInfo.icon,
            name: typeInfo.name,
            color: typeInfo.color,
            count: 1
        });
    }
    
    /**
     * Create ragdoll counter
     */
    createRagdollCounter(count = 0, position = { x: 20, y: 120 }) {
        return this.addElement('ragdollCounter', {
            type: 'counter',
            x: position.x,
            y: position.y,
            width: 150,
            height: 50,
            label: 'Ragdolls',
            count: count,
            maxCount: 5,
            color: this.config.secondaryColor
        });
    }
    
    /**
     * Create performance indicator
     */
    createPerformanceIndicator(position = { x: 20, y: 200 }) {
        return this.addElement('performanceIndicator', {
            type: 'performance',
            x: position.x,
            y: position.y,
            width: 120,
            height: 40,
            fps: 60,
            quality: 'high',
            visible: false // Hidden by default
        });
    }
    
    /**
     * Create instruction overlay
     */
    createInstructionOverlay(instructions, duration = 5000) {
        const overlay = {
            type: 'instructionOverlay',
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            width: Math.min(400, this.canvas.width - 40),
            height: 200,
            instructions: instructions,
            duration: duration,
            alpha: 0,
            centerX: true,
            centerY: true,
            background: true
        };
        
        this.addElement('instructionOverlay', overlay);
        
        // Animate in
        this.animateElement('instructionOverlay', { alpha: 1 }, () => {
            // Auto-hide after duration
            setTimeout(() => {
                this.animateElement('instructionOverlay', { alpha: 0 }, () => {
                    this.removeElement('instructionOverlay', false);
                });
            }, duration);
        });
        
        return overlay;
    }
    
    /**
     * Show notification
     */
    showNotification(message, type = 'info', duration = 3000) {
        const colors = {
            info: this.config.primaryColor,
            success: this.config.secondaryColor,
            warning: this.config.warningColor,
            error: this.config.dangerColor
        };
        
        const notification = {
            id: 'notification_' + Date.now(),
            message: message,
            type: type,
            color: colors[type] || colors.info,
            duration: duration,
            createdAt: Date.now(),
            alpha: 0,
            y: 60 + this.notifications.length * 60,
            slideOffset: -300,
            height: 50
        };
        
        this.notifications.push(notification);
        
        // Animate in
        notification.slideOffset = 0;
        notification.alpha = 1;
        
        // Auto-remove
        setTimeout(() => {
            this.removeNotification(notification.id);
        }, duration);
        
        return notification;
    }
    
    /**
     * Remove notification
     */
    removeNotification(notificationId) {
        const index = this.notifications.findIndex(n => n.id === notificationId);
        if (index === -1) return false;
        
        const notification = this.notifications[index];
        notification.alpha = 0;
        notification.slideOffset = -300;
        
        setTimeout(() => {
            this.notifications.splice(index, 1);
            
            // Reposition remaining notifications
            this.notifications.forEach((n, i) => {
                n.y = 60 + i * 60;
            });
        }, 300);
        
        return true;
    }
    
    /**
     * Show tooltip
     */
    showTooltip(text, position, duration = 2000) {
        const tooltip = {
            id: 'tooltip_' + Date.now(),
            text: text,
            x: position.x,
            y: position.y,
            alpha: 0,
            duration: duration,
            createdAt: Date.now()
        };
        
        this.tooltips.push(tooltip);
        
        // Animate in
        setTimeout(() => tooltip.alpha = 1, 10);
        
        // Auto-remove
        setTimeout(() => {
            this.removeTooltip(tooltip.id);
        }, duration);
        
        return tooltip;
    }
    
    /**
     * Remove tooltip
     */
    removeTooltip(tooltipId) {
        const index = this.tooltips.findIndex(t => t.id === tooltipId);
        if (index === -1) return false;
        
        this.tooltips[index].alpha = 0;
        
        setTimeout(() => {
            this.tooltips.splice(index, 1);
        }, 200);
        
        return true;
    }
    
    // ==========================================
    // UPDATE LOGIC
    // ==========================================
    
    update(deltaTime) {
        const now = Date.now();
        
        // Throttle updates on mobile
        if (now - this.lastUpdate < this.updateThrottle) {
            return;
        }
        
        this.lastUpdate = now;
        this.animationClock += deltaTime / 1000;
        
        // Update animations
        this.updateAnimations(deltaTime);
        
        // Update notifications
        this.updateNotifications(deltaTime);
        
        // Update tooltips
        this.updateTooltips(deltaTime);
    }
    
    updateAnimations(deltaTime) {
        const now = Date.now();
        const completedAnimations = [];
        
        for (const elementId of this.transitionElements) {
            const element = this.elements.get(elementId);
            if (!element || element.animationState !== 'animating') {
                completedAnimations.push(elementId);
                continue;
            }
            
            const elapsed = now - element.animationStart;
            const progress = Math.min(elapsed / element.animationDuration, 1);
            const eased = this.easeInOutCubic(progress);
            
            // Update animated properties
            for (const prop in element.animationProps) {
                if (prop === 'duration' || !element.startProps.hasOwnProperty(prop)) continue;
                
                const start = element.startProps[prop];
                const target = element.animationProps[prop];
                element[prop] = this.mathUtils.lerp(start, target, eased);
            }
            
            // Check if animation is complete
            if (progress >= 1) {
                element.animationState = 'idle';
                completedAnimations.push(elementId);
                
                // Call completion callback
                if (element.animationCallback) {
                    element.animationCallback(element);
                    element.animationCallback = null;
                }
            }
        }
        
        // Clean up completed animations
        for (const elementId of completedAnimations) {
            this.transitionElements.delete(elementId);
        }
    }
    
    updateNotifications(deltaTime) {
        const now = Date.now();
        
        for (let i = this.notifications.length - 1; i >= 0; i--) {
            const notification = this.notifications[i];
            const age = now - notification.createdAt;
            
            // Update slide animation
            if (notification.slideOffset !== 0) {
                notification.slideOffset = this.mathUtils.lerp(
                    notification.slideOffset, 0, 0.1
                );
                
                if (Math.abs(notification.slideOffset) < 1) {
                    notification.slideOffset = 0;
                }
            }
            
            // Fade out near end
            if (age > notification.duration - 500) {
                const fadeProgress = (age - (notification.duration - 500)) / 500;
                notification.alpha = Math.max(0, 1 - fadeProgress);
            }
        }
    }
    
    updateTooltips(deltaTime) {
        const now = Date.now();
        
        for (let i = this.tooltips.length - 1; i >= 0; i--) {
            const tooltip = this.tooltips[i];
            const age = now - tooltip.createdAt;
            
            // Fade in
            if (age < 200 && tooltip.alpha < 1) {
                tooltip.alpha = Math.min(1, age / 200);
            }
            
            // Fade out near end
            if (age > tooltip.duration - 300) {
                const fadeProgress = (age - (tooltip.duration - 300)) / 300;
                tooltip.alpha = Math.max(0, 1 - fadeProgress);
            }
        }
    }
    
    // ==========================================
    // RENDERING
    // ==========================================
    
    render(ctx = this.ctx) {
        if (!ctx) return;
        
        ctx.save();
        
        // Reset transform for UI rendering
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        // Render UI elements
        this.renderElements(ctx);
        
        // Render notifications
        this.renderNotifications(ctx);
        
        // Render tooltips
        this.renderTooltips(ctx);
        
        // Render overlays
        this.renderOverlays(ctx);
        
        ctx.restore();
    }
    
    renderElements(ctx) {
        for (const element of this.elements.values()) {
            if (!element.visible || element.alpha <= 0.01) continue;
            
            ctx.save();
            ctx.globalAlpha = element.alpha;
            
            switch (element.type) {
                case 'characterIndicator':
                    this.renderCharacterIndicator(ctx, element);
                    break;
                    
                case 'counter':
                    this.renderCounter(ctx, element);
                    break;
                    
                case 'performance':
                    this.renderPerformanceIndicator(ctx, element);
                    break;
                    
                case 'instructionOverlay':
                    this.renderInstructionOverlay(ctx, element);
                    break;
                    
                default:
                    this.renderGenericElement(ctx, element);
            }
            
            ctx.restore();
        }
    }
    
    renderCharacterIndicator(ctx, element) {
        const x = element.x;
        const y = element.y;
        const w = element.width;
        const h = element.height;
        
        // Background
        ctx.fillStyle = this.config.backgroundColor;
        ctx.fillRect(x, y, w, h);
        
        // Border with character color
        ctx.strokeStyle = element.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
        
        // Character icon
        ctx.font = '32px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = element.color;
        ctx.fillText(element.icon, x + 10, y + h / 2);
        
        // Character name
        ctx.font = this.config.largeText ? '16px' : '14px' + ` ${this.config.fontFamily}`;
        ctx.fillStyle = this.config.textColor;
        ctx.fillText(element.name, x + 55, y + h / 2 - 8);
        
        // Count
        if (element.count > 1) {
            ctx.font = this.config.largeText ? '12px' : '10px' + ` ${this.config.fontFamily}`;
            ctx.fillStyle = this.config.secondaryColor;
            ctx.fillText(`x${element.count}`, x + 55, y + h / 2 + 10);
        }
    }
    
    renderCounter(ctx, element) {
        const x = element.x;
        const y = element.y;
        const w = element.width;
        const h = element.height;
        
        // Background
        ctx.fillStyle = this.config.backgroundColor;
        ctx.fillRect(x, y, w, h);
        
        // Border
        ctx.strokeStyle = element.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
        
        // Label
        ctx.font = this.config.largeText ? '14px' : '12px' + ` ${this.config.fontFamily}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = this.config.textColor;
        ctx.fillText(element.label + ':', x + 10, y + h / 2 - 6);
        
        // Count
        ctx.font = this.config.largeText ? '18px' : '16px' + ` ${this.config.fontFamily}`;
        ctx.fillStyle = element.color;
        const countText = element.maxCount ? 
            `${element.count}/${element.maxCount}` : 
            element.count.toString();
        ctx.fillText(countText, x + 10, y + h / 2 + 8);
        
        // Progress bar (if maxCount specified)
        if (element.maxCount) {
            const progress = element.count / element.maxCount;
            const barWidth = w - 20;
            const barHeight = 4;
            const barY = y + h - 10;
            
            // Background bar
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(x + 10, barY, barWidth, barHeight);
            
            // Progress bar
            ctx.fillStyle = element.color;
            ctx.fillRect(x + 10, barY, barWidth * progress, barHeight);
        }
    }
    
    renderPerformanceIndicator(ctx, element) {
        const x = element.x;
        const y = element.y;
        const w = element.width;
        const h = element.height;
        
        // Background
        ctx.fillStyle = this.config.backgroundColor;
        ctx.fillRect(x, y, w, h);
        
        // FPS color coding
        let fpsColor = this.config.secondaryColor;
        if (element.fps < 30) fpsColor = this.config.dangerColor;
        else if (element.fps < 45) fpsColor = this.config.warningColor;
        
        // Border
        ctx.strokeStyle = fpsColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);
        
        // FPS text
        ctx.font = this.config.largeText ? '12px' : '10px' + ` monospace`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = fpsColor;
        ctx.fillText(`FPS: ${element.fps.toFixed(0)}`, x + 5, y + h / 2 - 6);
        
        // Quality text
        ctx.fillStyle = this.config.textColor;
        ctx.fillText(`Quality: ${element.quality}`, x + 5, y + h / 2 + 6);
    }
    
    renderInstructionOverlay(ctx, element) {
        let x = element.x;
        let y = element.y;
        const w = element.width;
        const h = element.height;
        
        // Center positioning
        if (element.centerX) x -= w / 2;
        if (element.centerY) y -= h / 2;
        
        // Background
        if (element.background) {
            // Backdrop
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Panel background
            ctx.fillStyle = this.config.backgroundColor;
            this.roundedRect(ctx, x, y, w, h, this.config.borderRadius);
            ctx.fill();
            
            // Border
            ctx.strokeStyle = this.config.primaryColor;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        // Instructions text
        ctx.font = this.config.largeText ? '16px' : '14px' + ` ${this.config.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = this.config.textColor;
        
        const lines = element.instructions.split('\n');
        const lineHeight = this.config.largeText ? 24 : 20;
        const startY = y + h / 2 - ((lines.length - 1) * lineHeight) / 2;
        
        lines.forEach((line, index) => {
            ctx.fillText(line, x + w / 2, startY + index * lineHeight);
        });
    }
    
    renderNotifications(ctx) {
        for (const notification of this.notifications) {
            if (notification.alpha <= 0.01) continue;
            
            ctx.save();
            ctx.globalAlpha = notification.alpha;
            
            const x = this.canvas.width - 320 + notification.slideOffset;
            const y = notification.y;
            const w = 300;
            const h = notification.height;
            
            // Background
            ctx.fillStyle = this.config.backgroundColor;
            this.roundedRect(ctx, x, y, w, h, this.config.borderRadius);
            ctx.fill();
            
            // Colored left border
            ctx.fillStyle = notification.color;
            ctx.fillRect(x, y, 4, h);
            
            // Message text
            ctx.font = this.config.largeText ? '14px' : '12px' + ` ${this.config.fontFamily}`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = this.config.textColor;
            ctx.fillText(notification.message, x + 15, y + h / 2);
            
            ctx.restore();
        }
    }
    
    renderTooltips(ctx) {
        for (const tooltip of this.tooltips) {
            if (tooltip.alpha <= 0.01) continue;
            
            ctx.save();
            ctx.globalAlpha = tooltip.alpha;
            
            // Measure text
            ctx.font = this.config.largeText ? '12px' : '11px' + ` ${this.config.fontFamily}`;
            const textWidth = ctx.measureText(tooltip.text).width;
            const padding = 8;
            const w = textWidth + padding * 2;
            const h = this.config.largeText ? 28 : 24;
            
            // Position tooltip (avoid screen edges)
            let x = tooltip.x - w / 2;
            let y = tooltip.y - h - 10;
            
            x = Math.max(5, Math.min(x, this.canvas.width - w - 5));
            y = Math.max(5, y);
            
            // Background
            ctx.fillStyle = this.config.backgroundColor;
            this.roundedRect(ctx, x, y, w, h, 4);
            ctx.fill();
            
            // Border
            ctx.strokeStyle = this.config.primaryColor;
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // Text
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = this.config.textColor;
            ctx.fillText(tooltip.text, x + w / 2, y + h / 2);
            
            // Arrow pointing to target
            ctx.fillStyle = this.config.backgroundColor;
            ctx.beginPath();
            ctx.moveTo(tooltip.x, tooltip.y);
            ctx.lineTo(tooltip.x - 6, y + h);
            ctx.lineTo(tooltip.x + 6, y + h);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            ctx.restore();
        }
    }
    
    renderOverlays(ctx) {
        // Render any additional overlay effects
        for (const overlay of this.overlays) {
            if (overlay.alpha <= 0.01) continue;
            
            ctx.save();
            ctx.globalAlpha = overlay.alpha;
            
            switch (overlay.type) {
                case 'screenFlash':
                    ctx.fillStyle = overlay.color || '#ffffff';
                    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                    break;
                    
                case 'vignette':
                    this.renderVignette(ctx, overlay);
                    break;
            }
            
            ctx.restore();
        }
    }
    
    renderVignette(ctx, overlay) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.max(this.canvas.width, this.canvas.height) / 2;
        
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, overlay.color || 'rgba(0, 0, 0, 0.8)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    renderGenericElement(ctx, element) {
        // Fallback renderer for custom elements
        const x = element.x || 0;
        const y = element.y || 0;
        const w = element.width || 100;
        const h = element.height || 50;
        
        ctx.fillStyle = element.backgroundColor || this.config.backgroundColor;
        ctx.fillRect(x, y, w, h);
        
        ctx.strokeStyle = element.borderColor || this.config.primaryColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);
        
        if (element.text) {
            ctx.font = '14px ' + this.config.fontFamily;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = element.textColor || this.config.textColor;
            ctx.fillText(element.text, x + w / 2, y + h / 2);
        }
    }
    
    // ==========================================
    // UTILITY METHODS
    // ==========================================
    
roundedRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
    
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    // ==========================================
    // SPECIAL EFFECTS
    // ==========================================
    
    /**
     * Add screen flash effect
     */
    addScreenFlash(color = '#ffffff', intensity = 0.8, duration = 200) {
        const flash = {
            type: 'screenFlash',
            color: color,
            alpha: intensity,
            duration: duration,
            createdAt: Date.now()
        };
        
        this.overlays.push(flash);
        
        // Auto-fade out
        setTimeout(() => {
            const index = this.overlays.indexOf(flash);
            if (index > -1) {
                flash.alpha = 0;
                setTimeout(() => {
                    this.overlays.splice(index, 1);
                }, 100);
            }
        }, duration);
        
        return flash;
    }
    
    /**
     * Add vignette effect
     */
    addVignette(color = 'rgba(0, 0, 0, 0.5)', duration = 1000) {
        const vignette = {
            type: 'vignette',
            color: color,
            alpha: 0,
            duration: duration,
            createdAt: Date.now()
        };
        
        this.overlays.push(vignette);
        
        // Fade in
        setTimeout(() => vignette.alpha = 1, 50);
        
        // Auto-remove
        setTimeout(() => {
            vignette.alpha = 0;
            setTimeout(() => {
                const index = this.overlays.indexOf(vignette);
                if (index > -1) this.overlays.splice(index, 1);
            }, 500);
        }, duration);
        
        return vignette;
    }
    
    /**
     * Show loading indicator
     */
    showLoadingIndicator(message = 'Loading...') {
        const loading = {
            type: 'loading',
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            width: 200,
            height: 100,
            message: message,
            centerX: true,
            centerY: true,
            background: true,
            alpha: 0,
            spinnerAngle: 0
        };
        
        this.addElement('loadingIndicator', loading);
        this.animateElement('loadingIndicator', { alpha: 1 });
        
        return loading;
    }
    
    /**
     * Hide loading indicator
     */
    hideLoadingIndicator() {
        this.animateElement('loadingIndicator', { alpha: 0 }, () => {
            this.removeElement('loadingIndicator', false);
        });
    }
    
    /**
     * Show game over overlay
     */
    showGameOverOverlay(score = 0, highScore = 0) {
        const gameOver = {
            type: 'gameOver',
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            width: 300,
            height: 200,
            score: score,
            highScore: highScore,
            centerX: true,
            centerY: true,
            background: true,
            alpha: 0
        };
        
        this.addElement('gameOverOverlay', gameOver);
        this.animateElement('gameOverOverlay', { alpha: 1 });
        
        return gameOver;
    }
    
    // ==========================================
    // RESPONSIVE LAYOUT
    // ==========================================
    
    /**
     * Update layout for screen size
     */
    updateLayout(width, height) {
        // Reposition elements based on new canvas size
        const characterIndicator = this.getElement('characterIndicator');
        if (characterIndicator) {
            // Keep in top-left corner
            characterIndicator.x = 20;
            characterIndicator.y = 20;
        }
        
        const ragdollCounter = this.getElement('ragdollCounter');
        if (ragdollCounter) {
            ragdollCounter.x = 20;
            ragdollCounter.y = 120;
        }
        
        const performanceIndicator = this.getElement('performanceIndicator');
        if (performanceIndicator) {
            // Keep in top-right corner
            performanceIndicator.x = width - performanceIndicator.width - 20;
            performanceIndicator.y = 20;
        }
        
        // Update notification positions
        this.notifications.forEach((notification, index) => {
            notification.y = 60 + index * 60;
        });
        
        console.log(`🖼️ UI layout updated for ${width}x${height}`);
    }
    
    /**
     * Adapt UI for device type
     */
    adaptForDevice() {
        if (this.deviceUtils.device.isMobile) {
            // Larger touch targets for mobile
            this.config.minTouchTarget = 44;
            this.config.padding = 12;
            
            // Smaller text on mobile
            this.config.largeText = false;
        } else if (this.deviceUtils.device.isTablet) {
            // Tablet optimizations
            this.config.minTouchTarget = 50;
            this.config.padding = 16;
            this.config.largeText = true;
        } else {
            // Desktop settings
            this.config.minTouchTarget = 24;
            this.config.padding = 16;
            this.config.largeText = false;
        }
        
        console.log(`🖼️ UI adapted for ${this.deviceUtils.device.isDesktop ? 'desktop' : 'mobile'} device`);
    }
    
    // ==========================================
    // INTERACTION HELPERS
    // ==========================================
    
    /**
     * Check if point hits UI element
     */
    hitTest(x, y) {
        // Convert to canvas coordinates if needed
        const canvasX = x;
        const canvasY = y;
        
        // Test UI elements
        for (const element of this.elements.values()) {
            if (!element.visible || element.alpha <= 0.01) continue;
            
            const hitArea = this.getElementHitArea(element);
            if (this.pointInRect(canvasX, canvasY, hitArea)) {
                return {
                    element: element,
                    id: element.id,
                    type: element.type,
                    hitArea: hitArea
                };
            }
        }
        
        return null;
    }
    
    getElementHitArea(element) {
        let x = element.x;
        let y = element.y;
        const w = element.width || 100;
        const h = element.height || 50;
        
        // Adjust for centering
        if (element.centerX) x -= w / 2;
        if (element.centerY) y -= h / 2;
        
        // Expand hit area for touch devices
        const padding = this.deviceUtils.device.hasTouch ? 10 : 0;
        
        return {
            x: x - padding,
            y: y - padding,
            width: w + padding * 2,
            height: h + padding * 2
        };
    }
    
    pointInRect(x, y, rect) {
        return x >= rect.x && 
               x <= rect.x + rect.width && 
               y >= rect.y && 
               y <= rect.y + rect.height;
    }
    
    // ==========================================
    // DATA UPDATES
    // ==========================================
    
    /**
     * Update character indicator
     */
    updateCharacterIndicator(ragdollType, count = 1) {
        const element = this.getElement('characterIndicator');
        if (!element) return false;
        
        const ragdollTypes = {
            'human': { icon: '👤', name: 'Human', color: '#3498db' },
            'teddy': { icon: '🧸', name: 'Teddy Bear', color: '#8B4513' },
            'frog': { icon: '🐸', name: 'Frog', color: '#32CD32' },
            'robot': { icon: '🤖', name: 'Robot', color: '#708090' },
            'alien': { icon: '👽', name: 'Alien', color: '#98FB98' }
        };
        
        const typeInfo = ragdollTypes[ragdollType.toLowerCase()] || ragdollTypes.human;
        
        this.updateElement('characterIndicator', {
            ragdollType: ragdollType,
            icon: typeInfo.icon,
            name: typeInfo.name,
            color: typeInfo.color,
            count: count
        });
        
        return true;
    }
    
    /**
     * Update ragdoll counter
     */
    updateRagdollCounter(count, maxCount = null) {
        const element = this.getElement('ragdollCounter');
        if (!element) return false;
        
        const updates = { count: count };
        if (maxCount !== null) {
            updates.maxCount = maxCount;
        }
        
        this.updateElement('ragdollCounter', updates);
        return true;
    }
    
    /**
     * Update performance indicator
     */
    updatePerformanceIndicator(fps, quality = 'auto') {
        const element = this.getElement('performanceIndicator');
        if (!element) return false;
        
        // Auto-determine quality level
        if (quality === 'auto') {
            if (fps >= 55) quality = 'high';
            else if (fps >= 30) quality = 'medium';
            else quality = 'low';
        }
        
        this.updateElement('performanceIndicator', {
            fps: fps,
            quality: quality
        });
        
        return true;
    }
    
    /**
     * Toggle performance indicator visibility
     */
    togglePerformanceIndicator() {
        const element = this.getElement('performanceIndicator');
        if (!element) return false;
        
        const newVisibility = !element.visible;
        this.updateElement('performanceIndicator', { visible: newVisibility });
        
        if (newVisibility) {
            this.animateElement('performanceIndicator', { alpha: 1 });
        } else {
            this.animateElement('performanceIndicator', { alpha: 0 });
        }
        
        return true;
    }
    
    // ==========================================
    // UTILITY METHODS
    // ==========================================
    
    /**
     * Clear all UI elements
     */
    clear() {
        this.elements.clear();
        this.notifications = [];
        this.tooltips = [];
        this.overlays = [];
        this.transitionElements.clear();
        
        console.log('🖼️ UI cleared');
    }
    
    /**
     * Get UI statistics
     */
    getStats() {
        return {
            elements: this.elements.size,
            notifications: this.notifications.length,
            tooltips: this.tooltips.length,
            overlays: this.overlays.length,
            animations: this.transitionElements.size,
            
            performance: {
                updateThrottle: this.updateThrottle,
                lastUpdate: this.lastUpdate,
                animationClock: this.animationClock
            },
            
            config: {
                largeText: this.config.largeText,
                minTouchTarget: this.config.minTouchTarget,
                deviceType: this.deviceUtils.device.isDesktop ? 'desktop' : 
                           this.deviceUtils.device.isTablet ? 'tablet' : 'mobile'
            }
        };
    }
    
    /**
     * Get debug information
     */
    getDebugInfo() {
        const stats = this.getStats();
        
        return {
            ...stats,
            
            elementDetails: Array.from(this.elements.entries()).map(([id, element]) => ({
                id: id,
                type: element.type,
                visible: element.visible,
                alpha: element.alpha,
                animationState: element.animationState,
                position: { x: element.x, y: element.y }
            })),
            
            activeAnimations: Array.from(this.transitionElements).map(id => {
                const element = this.elements.get(id);
                return {
                    id: id,
                    progress: element ? 
                        Math.min((Date.now() - element.animationStart) / element.animationDuration, 1) : 0
                };
            })
        };
    }
    
    /**
     * Resize handling
     */
    resize(width, height) {
        this.updateLayout(width, height);
    }
    
    /**
     * Clean shutdown
     */
    destroy() {
        console.log('🗑️ Destroying UIRenderer...');
        
        this.clear();
        
        this.canvas = null;
        this.ctx = null;
        
        console.log('✅ UIRenderer destroyed');
    }
}

// Make available globally
window.UIRenderer = UIRenderer;

console.log('🖼️ UIRenderer loaded - Advanced UI rendering and overlay system ready');