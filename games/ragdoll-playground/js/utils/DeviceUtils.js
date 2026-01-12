// ==========================================
// DEVICE-SPECIFIC OPTIMIZATIONS & DETECTION
// ==========================================

class DeviceUtils {
    
    constructor() {
        this.device = this.detectDevice();
        this.performance = this.detectPerformance();
        this.capabilities = this.detectCapabilities();
        
        console.log('📱 Device detected:', this.device);
        console.log('⚡ Performance level:', this.performance.level);
    }
    
    // ==========================================
    // DEVICE DETECTION
    // ==========================================
    
    detectDevice() {
        const userAgent = navigator.userAgent.toLowerCase();
        const platform = navigator.platform?.toLowerCase() || '';
        
        const device = {
            // Basic device types
            isIOS: /iphone|ipad|ipod/.test(userAgent),
            isAndroid: /android/.test(userAgent),
            isMobile: /mobile/.test(userAgent),
            isTablet: /tablet|ipad/.test(userAgent) || 
                     (this.isAndroid && !/mobile/.test(userAgent)),
            isDesktop: !(/mobile|tablet|ipad/.test(userAgent)),
            
            // Specific device detection
            isIPhone: /iphone/.test(userAgent),
            isIPad: /ipad/.test(userAgent) || 
                   (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /macintosh/.test(userAgent)),
            isIPadPro: false, // Will be calculated below
            
            // Browser detection
            browser: this.getBrowserType(userAgent),
            
            // Screen properties
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            pixelRatio: window.devicePixelRatio || 1,
            
            // Touch capabilities
            hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
            maxTouchPoints: navigator.maxTouchPoints || 1,
            
            // Other capabilities
            hasAccelerometer: 'DeviceMotionEvent' in window,
            hasOrientation: 'DeviceOrientationEvent' in window,
            isStandalone: window.navigator.standalone || 
                         window.matchMedia('(display-mode: standalone)').matches,
            
            // Memory and processing hints
            hardwareConcurrency: navigator.hardwareConcurrency || 2,
            deviceMemory: navigator.deviceMemory || 4
        };
        
        // Detect iPad Pro specifically
        if (device.isIPad) {
            const screenSize = Math.max(device.screenWidth, device.screenHeight);
            device.isIPadPro = screenSize >= 1024; // 11" and 12.9" iPad Pro
        }
        
        // Set optimal physics settings based on device
        device.shouldUseFullscreen = device.isMobile || device.isTablet;
        
        return device;
    }
    
    getBrowserType(userAgent) {
        if (userAgent.includes('chrome')) return 'chrome';
        if (userAgent.includes('firefox')) return 'firefox';
        if (userAgent.includes('safari')) return 'safari';
        if (userAgent.includes('edge')) return 'edge';
        if (userAgent.includes('opera')) return 'opera';
        return 'unknown';
    }
    
    // ==========================================
    // PERFORMANCE DETECTION
    // ==========================================
    
    detectPerformance() {
        const device = this.device;
        let performanceScore = 100; // Start with perfect score
        
        // Device type penalties
        if (device.isMobile && !device.isIPad) performanceScore -= 30;
        if (device.isAndroid && device.deviceMemory < 4) performanceScore -= 20;
        
        // Screen size considerations
        const totalPixels = device.screenWidth * device.screenHeight * device.pixelRatio;
        if (totalPixels > 2000000) performanceScore -= 15; // High resolution displays
        
        // Hardware considerations
        if (device.hardwareConcurrency < 4) performanceScore -= 20;
        if (device.deviceMemory < 4) performanceScore -= 25;
        
        // Browser optimizations
        if (device.browser === 'chrome') performanceScore += 10;
        if (device.browser === 'safari' && device.isIOS) performanceScore += 5;
        
        // Determine performance level
        let level;
        if (performanceScore >= 80) level = 'high';
        else if (performanceScore >= 60) level = 'medium';
        else level = 'low';
        
        return {
            score: Math.max(0, Math.min(100, performanceScore)),
            level: level,
            
            // Recommended settings based on performance
            maxBodies: level === 'high' ? 50 : level === 'medium' ? 30 : 15,
            maxParticles: level === 'high' ? 200 : level === 'medium' ? 100 : 50,
            physicsUpdateRate: level === 'high' ? 60 : level === 'medium' ? 45 : 30,
            particleLifetime: level === 'high' ? 3.0 : level === 'medium' ? 2.0 : 1.5,
            enableComplexEffects: level !== 'low',
            enableMotionBlur: level === 'high',
            shadowQuality: level === 'high' ? 'high' : 'medium'
        };
    }
    
    // ==========================================
    // CAPABILITY DETECTION
    // ==========================================
    
    detectCapabilities() {
        return {
            // Graphics capabilities
            canvas2D: !!document.createElement('canvas').getContext('2d'),
            webGL: !!document.createElement('canvas').getContext('webgl'),
            
            // Audio capabilities
            webAudio: 'AudioContext' in window || 'webkitAudioContext' in window,
            speechSynthesis: 'speechSynthesis' in window,
            
            // Input capabilities
            pointerEvents: 'PointerEvent' in window,
            touchEvents: 'TouchEvent' in window,
            
            // Storage capabilities
            localStorage: typeof Storage !== 'undefined',
            sessionStorage: typeof sessionStorage !== 'undefined',
            
            // Network capabilities
            online: navigator.onLine,
            
            // Sensor capabilities
            accelerometer: 'DeviceMotionEvent' in window,
            gyroscope: 'DeviceOrientationEvent' in window,
            
            // Performance APIs
            performanceAPI: 'performance' in window,
            requestAnimationFrame: 'requestAnimationFrame' in window
        };
    }
    
    // ==========================================
    // OPTIMIZATION METHODS
    // ==========================================
    
    /**
     * Get optimal physics settings for current device
     */
    getPhysicsSettings() {
        const perf = this.performance;
        
        return {
            // Engine settings
            engineOptions: {
                enableSleeping: perf.level !== 'high',
                positionIterations: perf.level === 'high' ? 6 : 4,
                velocityIterations: perf.level === 'high' ? 4 : 2,
                constraintIterations: perf.level === 'high' ? 2 : 1
            },
            
            // World settings
            worldOptions: {
                gravity: { x: 0, y: 0.8 },
                bounds: {
                    min: { x: -100, y: -100 },
                    max: { x: window.innerWidth + 100, y: window.innerHeight + 100 }
                }
            },
            
            // Render settings
            renderOptions: {
                pixelRatio: Math.min(this.device.pixelRatio, perf.level === 'high' ? 2 : 1),
                antialias: perf.level !== 'low',
                showDebug: false,
                showStats: false
            }
        };
    }
    
    /**
     * Get optimal touch settings
     */
    getTouchSettings() {
        return {
            // Touch area sizes
            minTouchRadius: this.device.isTablet ? 30 : this.device.isMobile ? 25 : 20,
            maxTouchRadius: this.device.isTablet ? 60 : this.device.isMobile ? 45 : 40,
            
            // Touch sensitivity
            dragSensitivity: this.device.isIPad ? 0.8 : this.device.isMobile ? 1.2 : 1.0,
            tapThreshold: this.device.hasTouch ? 10 : 5,
            
            // Multi-touch settings
            enableMultiTouch: this.device.maxTouchPoints > 1,
            maxSimultaneousTouch: Math.min(this.device.maxTouchPoints, 3),
            
            // Gesture settings
            enablePinchZoom: this.device.isTablet,
            enableRotation: false, // Keep simple for kids
            
            // Feedback settings
            hapticFeedback: this.device.hasTouch && 'vibrate' in navigator,
            audioFeedback: true,
            visualFeedback: true
        };
    }
    
    /**
     * Get optimal rendering settings
     */
    getRenderSettings() {
        const perf = this.performance;
        
        return {
            // Canvas settings
            resolution: {
                width: Math.min(window.innerWidth, perf.level === 'high' ? 2048 : 1536),
                height: Math.min(window.innerHeight, perf.level === 'high' ? 2048 : 1536)
            },
            
            // Effect settings
            particleCount: perf.maxParticles,
            shadowQuality: perf.shadowQuality,
            motionBlur: perf.enableMotionBlur,
            
            // Update rates
            targetFPS: perf.physicsUpdateRate,
            adaptiveFPS: perf.level !== 'high',
            
            // Visual quality
            lineWidth: this.device.pixelRatio > 1 ? 2 : 1,
            borderRadius: true,
            gradients: perf.level !== 'low',
            animations: true
        };
    }
    
    // ==========================================
    // UTILITY METHODS
    // ==========================================
    
    /**
     * Check if device should use reduced motion
     */
    shouldReduceMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    
    /**
     * Get safe area insets for notched devices
     */
    getSafeAreaInsets() {
        const style = getComputedStyle(document.documentElement);
        
        return {
            top: parseInt(style.getPropertyValue('env(safe-area-inset-top)')) || 0,
            right: parseInt(style.getPropertyValue('env(safe-area-inset-right)')) || 0,
            bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)')) || 0,
            left: parseInt(style.getPropertyValue('env(safe-area-inset-left)')) || 0
        };
    }
    
    /**
     * Monitor performance and adjust settings dynamically
     */
    createPerformanceMonitor() {
        if (!this.capabilities.performanceAPI) return null;
        
        let frameCount = 0;
        let lastTime = performance.now();
        let averageFPS = 60;
        
        const monitor = {
            currentFPS: 60,
            averageFPS: 60,
            isLowPerformance: false,
            
            update: () => {
                frameCount++;
                const currentTime = performance.now();
                const deltaTime = currentTime - lastTime;
                
                if (deltaTime >= 1000) { // Update every second
                    monitor.currentFPS = Math.round((frameCount * 1000) / deltaTime);
                    averageFPS = (averageFPS * 0.9) + (monitor.currentFPS * 0.1);
                    monitor.averageFPS = Math.round(averageFPS);
                    
                    // Detect performance issues
                    monitor.isLowPerformance = monitor.averageFPS < 30;
                    
                    frameCount = 0;
                    lastTime = currentTime;
                }
            },
            
            shouldReduceQuality: () => monitor.averageFPS < 25,
            shouldIncreaseQuality: () => monitor.averageFPS > 55
        };
        
        return monitor;
    }

    logDeviceInfo() {
        console.log('📱 Device Information:');
        console.log(`- Type: ${this.getDeviceTypeString()}`);
        console.log(`- Performance: ${this.performance.level}`);
        console.log(`- Touch: ${this.device.hasTouch ? 'Yes' : 'No'}`);
        console.log(`- Pixel Ratio: ${this.device.pixelRatio}x`);
        console.log(`- Screen: ${this.device.screenWidth}x${this.device.screenHeight}`);
        console.log(`- Browser: ${this.device.browser}`);
    }

    getDeviceTypeString() {
        if (this.device.isDesktop) return 'Desktop';
        if (this.device.isTablet) return 'Tablet';
        if (this.device.isMobile) return 'Mobile';
        return 'Unknown';
    }
    
    /**
     * Log device info for debugging
     */
    logDeviceInfo() {
        console.group('📱 Device Information');
        console.log('Device Type:', this.device.isDesktop ? 'Desktop' : 
                    this.device.isTablet ? 'Tablet' : 'Mobile');
        console.log('Operating System:', this.device.isIOS ? 'iOS' : 
                    this.device.isAndroid ? 'Android' : 'Other');
        console.log('Browser:', this.device.browser);
        console.log('Screen:', `${this.device.screenWidth}x${this.device.screenHeight} (${this.device.pixelRatio}x)`);
        console.log('Performance Level:', this.performance.level);
        console.log('Hardware Concurrency:', this.device.hardwareConcurrency);
        console.log('Device Memory:', this.device.deviceMemory, 'GB');
        console.log('Max Touch Points:', this.device.maxTouchPoints);
        console.groupEnd();
    }
}

// Create global instance
window.DeviceUtils = new DeviceUtils();

if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.DeviceUtils.logDeviceInfo();  // ✅ call on the instance
}


console.log('📱 DeviceUtils loaded - Device optimization ready');