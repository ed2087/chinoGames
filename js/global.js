// ==========================================
// GLOBAL FULLSCREEN & MOBILE UTILITIES
// ==========================================

// This script is loaded from different depths (the hub uses "js/global.js",
// game pages use "../../js/global.js"), and hardcoding "/icons/..." breaks
// the moment the site is hosted at a subpath (e.g. GitHub Pages project
// sites like username.github.io/repo-name/). Deriving the base path from
// wherever this very script was actually loaded from works at any depth
// and at any hosting root.
const SITE_BASE_PATH = (function resolveSiteBasePath() {
    const scriptEl = document.currentScript || Array.from(document.getElementsByTagName('script'))
        .find(s => s.src && s.src.indexOf('js/global.js') !== -1);
    if (scriptEl && scriptEl.src) {
        return scriptEl.src.replace(/js\/global\.js.*$/, '');
    }
    return '/';
})();

class GlobalUtils {
    constructor() {
        this.isFullscreen = false;
        this.orientation = 'unknown';
        this.isInitialized = false;
        this.device = {};
        this.audioEnabled = false;
        this.fullscreenAttempts = 0;
        this.maxFullscreenAttempts = 3;
        
        // Wait for DOM to be ready before initializing
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }
    
    init() {
        this.detectDevice();
        this.setupFullscreen();
        this.preventZoomAndScroll();
        this.handleOrientationChanges();
        this.setupViewportMeta();
        this.hideAddressBar();
        
        // Smart audio permission handling with localStorage
        setTimeout(() => {
            this.handleAudioPermission();
        }, 500);
        
        this.isInitialized = true;
        console.log('Global utilities initialized');
    }
    
    // ==========================================
    // DEVICE DETECTION
    // ==========================================
    
    detectDevice() {
        const userAgent = navigator.userAgent.toLowerCase();
        
        this.device = {
            isIOS: /iphone|ipad|ipod/.test(userAgent),
            isAndroid: /android/.test(userAgent),
            isMobile: /mobile/.test(userAgent),
            isTablet: /tablet|ipad/.test(userAgent),
            isDesktop: !(/mobile|tablet|ipad/.test(userAgent)),
            isStandalone: window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches,
            browser: this.getBrowserType(),
            version: 0,
            isPadPro: false
        };
        
        // Detect iPad Pro specifically
        if (this.device.isIOS && this.device.isTablet) {
            const screenWidth = Math.max(screen.width, screen.height);
            this.device.isPadPro = screenWidth >= 1024;
        }
        
        this.device.version = this.getOSVersion();
        
        // Smart fullscreen policy
        this.device.shouldUseFullscreen = this.device.isMobile || this.device.isTablet;
        
        // Only add classes if document.body exists
        if (document.body) {
            document.body.classList.add(
                this.device.isIOS ? 'ios' : 
                this.device.isAndroid ? 'android' : 'desktop'
            );
            
            if (this.device.isStandalone) {
                document.body.classList.add('standalone');
            }
            
            if (this.device.isPadPro) {
                document.body.classList.add('ipad-pro');
            }
        }
        
        console.log('Device detected:', this.device);
    }
    
    getBrowserType() {
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes('chrome')) return 'chrome';
        if (userAgent.includes('firefox')) return 'firefox';
        if (userAgent.includes('safari')) return 'safari';
        if (userAgent.includes('edge')) return 'edge';
        return 'unknown';
    }
    
    getOSVersion() {
        const userAgent = navigator.userAgent;
        
        if (!this.device) return 0;
        
        if (this.device.isIOS) {
            const match = userAgent.match(/OS (\d+)_(\d+)/);
            return match ? parseFloat(`${match[1]}.${match[2]}`) : 0;
        }
        if (this.device.isAndroid) {
            const match = userAgent.match(/Android (\d+\.?\d*)/);
            return match ? parseFloat(match[1]) : 0;
        }
        return 0;
    }
    
    // ==========================================
    // SMART AUDIO PERMISSION HANDLING
    // ==========================================
    
    handleAudioPermission() {
        // Check if we already have permission stored
        const hasPermission = localStorage.getItem('audioPermissionGranted') === 'true';
        const isFirstVisit = localStorage.getItem('firstVisit') !== 'false';
        
        if (hasPermission && !isFirstVisit) {
            // Silent audio activation for returning users
            this.enableAudioSilently();
            return;
        }
        
        // Show popup only for first-time users
        if (isFirstVisit) {
            this.createAudioPermissionPopup();
        } else {
            // For returning users without stored permission, wait for first interaction
            this.setupFirstInteractionCapture();
        }
    }
    
    async enableAudioSilently() {
        try {
            // Set up one-time user interaction capture
            const enableOnInteraction = async () => {
                try {
                    if (window.audioSystem?.audioContext?.state === 'suspended') {
                        await window.audioSystem.audioContext.resume();
                    }
                    
                    // Try fullscreen only for mobile devices
                    if (this.device.shouldUseFullscreen) {
                        this.enterFullscreen();
                    }
                    
                    this.audioEnabled = true;
                    document.dispatchEvent(new CustomEvent('audioEnabled'));
                    console.log('Audio enabled silently');
                } catch (error) {
                    console.warn('Silent audio enable failed:', error);
                }
                
                // Remove listeners after first use
                document.removeEventListener('touchstart', enableOnInteraction);
                document.removeEventListener('click', enableOnInteraction);
            };
            
            // Capture first user interaction
            document.addEventListener('touchstart', enableOnInteraction, { once: true });
            document.addEventListener('click', enableOnInteraction, { once: true });
            
        } catch (error) {
            console.warn('Silent audio setup failed:', error);
        }
    }
    
    setupFirstInteractionCapture() {
        const enableOnFirstTouch = async () => {
            try {
                if (window.audioSystem?.audioContext?.state === 'suspended') {
                    await window.audioSystem.audioContext.resume();
                }
                
                if (this.device.shouldUseFullscreen) {
                    this.enterFullscreen();
                }
                
                // Store permission for future visits
                localStorage.setItem('audioPermissionGranted', 'true');
                localStorage.setItem('firstVisit', 'false');
                
                this.audioEnabled = true;
                document.dispatchEvent(new CustomEvent('audioEnabled'));
                console.log('Audio enabled on first interaction');
            } catch (error) {
                console.warn('First interaction audio enable failed:', error);
            }
        };
        
        document.addEventListener('touchstart', enableOnFirstTouch, { once: true });
        document.addEventListener('click', enableOnFirstTouch, { once: true });
    }
    
    // ==========================================
    // FULLSCREEN MANAGEMENT (MOBILE ONLY)
    // ==========================================
    
    setupFullscreen() {
        // Only set up fullscreen for mobile devices
        if (!this.device.shouldUseFullscreen) {
            console.log('Skipping fullscreen setup - desktop device detected');
            return;
        }
        
        console.log('Setting up fullscreen for mobile devices');
        
        // Set up event listeners for fullscreen changes
        document.addEventListener('fullscreenchange', this.onFullscreenChange.bind(this));
        document.addEventListener('webkitfullscreenchange', this.onFullscreenChange.bind(this));
        document.addEventListener('mozfullscreenchange', this.onFullscreenChange.bind(this));
        document.addEventListener('MSFullscreenChange', this.onFullscreenChange.bind(this));
        
        // iOS Safari specific handling
        if (this.device.isIOS && this.device.browser === 'safari') {
            this.setupIOSFullscreen();
        }
    }
    
    enterFullscreen() {
        // Only attempt on mobile devices
        if (!this.device.shouldUseFullscreen) {
            console.log('Fullscreen skipped - desktop device');
            return;
        }
        
        if (this.isInFullscreen()) return;
        
        const element = document.documentElement;
        
        console.log('Attempting fullscreen for mobile device...');
        
        try {
            if (element.requestFullscreen) {
                element.requestFullscreen({ navigationUI: "hide" })
                    .then(() => {
                        console.log('Standard fullscreen activated');
                    })
                    .catch((error) => {
                        console.warn('Standard fullscreen failed:', error);
                        this.tryAlternativeFullscreen(element);
                    });
            } else if (element.webkitRequestFullscreen) {
                element.webkitRequestFullscreen();
                console.log('Webkit fullscreen activated');
            } else if (element.mozRequestFullScreen) {
                element.mozRequestFullScreen();
                console.log('Mozilla fullscreen activated');
            } else if (element.msRequestFullscreen) {
                element.msRequestFullscreen();
                console.log('MS fullscreen activated');
            } else {
                console.warn('No fullscreen API available');
                this.tryAlternativeFullscreen(element);
            }
            
        } catch (error) {
            console.warn('Fullscreen request failed:', error);
            this.tryAlternativeFullscreen(element);
        }
    }
    
    tryAlternativeFullscreen(element) {
        try {
            if (element.webkitEnterFullscreen) {
                element.webkitEnterFullscreen();
            } else if (element.webkitRequestFullScreen) {
                element.webkitRequestFullScreen();
            }
        } catch (error) {
            console.warn('Alternative fullscreen methods failed:', error);
        }
    }
    
    setupIOSFullscreen() {
        const hideIOSBars = () => {
            setTimeout(() => {
                window.scrollTo(0, 1);
                this.hideAddressBar();
            }, 100);
        };
        
        window.addEventListener('orientationchange', () => {
            setTimeout(hideIOSBars, 500);
        });
        
        window.addEventListener('focus', hideIOSBars);
        
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                hideIOSBars();
            }
        });
        
        hideIOSBars();
    }
    
    exitFullscreen() {
        try {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        } catch (error) {
            console.warn('Exit fullscreen failed:', error);
        }
    }
    
    isInFullscreen() {
        return !!(
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement ||
            (this.device && this.device.isStandalone) ||
            (this.device.isIOS && window.innerHeight > window.screen.height * 0.8)
        );
    }
    
    onFullscreenChange() {
        this.isFullscreen = this.isInFullscreen();
        
        if (document.body) {
            if (this.isFullscreen) {
                document.body.classList.add('fullscreen');
                console.log('Entered fullscreen mode');
            } else {
                document.body.classList.remove('fullscreen');
                console.log('Exited fullscreen mode');
            }
        }
    }
    
    // ==========================================
    // FIRST-TIME USER POPUP (ONLY)
    // ==========================================
    
    createAudioPermissionPopup() {
        if (document.getElementById('audioPermissionPopup')) return;
        
        const popup = document.createElement('div');
        popup.id = 'audioPermissionPopup';
        popup.innerHTML = `
            <div class="popup-overlay">
                <div class="popup-content">
                    <div class="popup-icon">🎮</div>
                    <h2>Welcome to Chino's Games!</h2>
                    <p>Tap to start playing with sound and voice!</p>
                    <button class="start-button">Let's Play!</button>
                </div>
            </div>
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            #audioPermissionPopup {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            .popup-overlay {
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                backdrop-filter: blur(10px);
            }
            
            .popup-content {
                background: white;
                border-radius: 20px;
                padding: 40px;
                text-align: center;
                max-width: 400px;
                margin: 20px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                animation: popupSlideIn 0.4s ease-out;
            }
            
            @keyframes popupSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(30px) scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
            
            .popup-icon {
                font-size: 4rem;
                margin-bottom: 20px;
            }
            
            .popup-content h2 {
                font-size: 2rem;
                color: #333;
                margin: 0 0 15px 0;
                font-weight: 700;
            }
            
            .popup-content p {
                font-size: 1.2rem;
                color: #666;
                margin: 0 0 30px 0;
                line-height: 1.4;
            }
            
            .start-button {
                background: linear-gradient(135deg, #4CAF50, #45a049);
                color: white;
                border: none;
                border-radius: 50px;
                padding: 18px 40px;
                font-size: 1.3rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
                min-width: 200px;
                -webkit-tap-highlight-color: transparent;
            }
            
            .start-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
            }
            
            .start-button:active {
                transform: translateY(0);
                background: linear-gradient(135deg, #45a049, #4CAF50);
            }
            
            @media (max-width: 480px) {
                .popup-content {
                    padding: 30px 20px;
                    margin: 10px;
                }
                
                .popup-content h2 {
                    font-size: 1.8rem;
                }
                
                .popup-content p {
                    font-size: 1.1rem;
                }
                
                .start-button {
                    padding: 16px 32px;
                    font-size: 1.2rem;
                }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(popup);
        
        popup.querySelector('.start-button').addEventListener('click', () => {
            this.enableAudioAndStartGame(popup);
        });
        
        popup.querySelector('.popup-overlay').addEventListener('click', (e) => {
            if (e.target === popup.querySelector('.popup-overlay')) {
                this.enableAudioAndStartGame(popup);
            }
        });
    }
    
    async enableAudioAndStartGame(popup) {
        try {
            // Store permission for future visits
            localStorage.setItem('audioPermissionGranted', 'true');
            localStorage.setItem('firstVisit', 'false');
            
            // Enable fullscreen only for mobile
            if (this.device.shouldUseFullscreen) {
                this.enterFullscreen();
            }
            
            // Resume audio context
            if (window.audioSystem?.audioContext?.state === 'suspended') {
                await window.audioSystem.audioContext.resume();
            }
            
            // Test audio
            if (window.audioSystem?.isInitialized) {
                setTimeout(() => {
                    window.audioSystem.speak('Ready to play!');
                }, 100);
            }
            
            this.audioEnabled = true;
            
            // Remove popup with animation
            popup.style.opacity = '0';
            popup.style.transition = 'opacity 0.3s ease';
            popup.style.transform = 'scale(0.9)';
            
            setTimeout(() => {
                popup.remove();
                document.dispatchEvent(new CustomEvent('audioEnabled'));
                console.log('First-time setup complete');
            }, 300);
            
        } catch (error) {
            console.error('Failed to enable audio:', error);
            popup.remove();
            document.dispatchEvent(new CustomEvent('audioEnabled'));
        }
    }
    
    // ==========================================
    // VIEWPORT & ZOOM PREVENTION
    // ==========================================
    
    setupViewportMeta() {
        let viewport = document.querySelector('meta[name="viewport"]');
        
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }
        
        viewport.content = [
            'width=device-width',
            'initial-scale=1.0',
            'maximum-scale=1.0',
            'minimum-scale=1.0',
            'user-scalable=no',
            'viewport-fit=cover',
            'shrink-to-fit=no'
        ].join(', ');
        
        this.setupPWAMeta();
    }
    
    setupPWAMeta() {
        const metaTags = [
            { name: 'apple-mobile-web-app-capable', content: 'yes' },
            { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
            { name: 'mobile-web-app-capable', content: 'yes' },
            { name: 'apple-touch-fullscreen', content: 'yes' },
            { name: 'theme-color', content: '#4A90E2' }
        ];
        
        metaTags.forEach(({ name, content }) => {
            let meta = document.querySelector(`meta[name="${name}"]`);
            if (!meta) {
                meta = document.createElement('meta');
                meta.name = name;
                document.head.appendChild(meta);
            }
            meta.content = content;
        });
    }
    
    preventZoomAndScroll() {
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });
        
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, { passive: false });
        
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
        
        document.addEventListener('selectstart', (e) => {
            e.preventDefault();
        });
        
        document.addEventListener('dragstart', (e) => {
            e.preventDefault();
        });
        
        if (document.body) {
            Object.assign(document.body.style, {
                overscrollBehavior: 'none',
                touchAction: 'manipulation',
                userSelect: 'none',
                webkitUserSelect: 'none',
                webkitTouchCallout: 'none'
            });
            
            // Only apply overflow hidden on mobile
            if (this.device.shouldUseFullscreen) {
                document.body.style.overflowY = 'hidden';
            }
        }
        
        console.log('Zoom and scroll prevention activated');
    }
    
    handleOrientationChanges() {
        const updateOrientation = () => {
            const orientation = screen.orientation?.type || 
                              (window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
            
            this.orientation = orientation;
            
            if (document.body) {
                document.body.className = document.body.className.replace(/orientation-\w+/g, '');
                document.body.classList.add(`orientation-${orientation.includes('portrait') ? 'portrait' : 'landscape'}`);
            }
            
            if (this.device.shouldUseFullscreen) {
                setTimeout(() => {
                    this.hideAddressBar();
                }, 500);
            }
            
            console.log('Orientation changed to:', orientation);
        };
        
        window.addEventListener('orientationchange', updateOrientation);
        window.addEventListener('resize', updateOrientation);
        updateOrientation();
    }
    
    hideAddressBar() {
        if (this.device && (this.device.isMobile || this.device.isTablet)) {
            const hideBar = () => {
                window.scrollTo(0, 1);
                const vh = window.innerHeight * 0.01;
                document.documentElement.style.setProperty('--vh', `${vh}px`);
            };
            
            setTimeout(hideBar, 0);
            setTimeout(hideBar, 100);
            
            if (this.device.isIOS) {
                setTimeout(() => {
                    if (window.pageYOffset === 0) {
                        window.scrollTo(0, 1);
                    }
                }, 1000);
            }
        }
    }
    
    // ==========================================
    // UTILITY METHODS
    // ==========================================
    
    lockOrientation(orientation = 'portrait') {
        if (this.device.shouldUseFullscreen && screen.orientation?.lock) {
            screen.orientation.lock(orientation).catch((error) => {
                console.log('Orientation lock failed:', error);
            });
        }
    }
    
    vibrate(pattern = [100]) {
        if (navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    }
    
    wakeLock() {
        if ('wakeLock' in navigator && this.device.shouldUseFullscreen) {
            navigator.wakeLock.request('screen').then((wakeLock) => {
                console.log('Screen wake lock activated');
                return wakeLock;
            }).catch((error) => {
                console.log('Wake lock failed:', error);
            });
        }
    }
    
    makeAppLike() {
        const style = document.createElement('style');
        style.textContent = `
            * { 
                -webkit-overflow-scrolling: touch;
                -webkit-tap-highlight-color: transparent;
            }
            *::-webkit-scrollbar { display: none; }
            
            ${this.device.shouldUseFullscreen ? `
                html, body { 
                    overflow: hidden; 
                    position: fixed; 
                    height: 100vh; 
                    width: 100vw;
                }
            ` : ''}
            
            .game-main, .app-container {
                height: calc(var(--vh, 1vh) * 100);
            }
        `;
        document.head.appendChild(style);
        
        if (this.device.shouldUseFullscreen) {
            this.wakeLock();
            this.lockOrientation('portrait');
        }
        
        console.log('App-like behavior activated');
    }

    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;

            const banner = document.createElement('div');
            banner.id = 'installBanner';
            banner.innerHTML = `
                <div class="banner-content">
                    <img src="${SITE_BASE_PATH}icons/icon-192.png" alt="Chino's Games" class="banner-icon">
                    <p>Install <strong>Chino's Games</strong> for fullscreen fun!</p>
                    <button id="installBtn">Install</button>
                    <button id="dismissBtn">Later</button>
                </div>
            `;
            document.body.appendChild(banner);

            document.getElementById('installBtn').addEventListener('click', async () => {
                banner.remove();
                this.deferredPrompt.prompt();
                const choice = await this.deferredPrompt.userChoice;
                console.log('Install choice:', choice);
                this.deferredPrompt = null;
            });

            document.getElementById('dismissBtn').addEventListener('click', () => {
                banner.remove();
            });
        });
    }

    // Method to clear stored permissions (for testing)
    clearStoredPermissions() {
        localStorage.removeItem('audioPermissionGranted');
        localStorage.removeItem('firstVisit');
        console.log('Stored permissions cleared');
    }
}

// ==========================================
// CSS VARIABLES FOR VIEWPORT
// ==========================================

function updateViewportHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

window.addEventListener('resize', updateViewportHeight);
window.addEventListener('orientationchange', () => {
    setTimeout(updateViewportHeight, 500);
});

// ==========================================
// INITIALIZATION
// ==========================================

let globalUtils;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        globalUtils = new GlobalUtils();
        window.globalUtils = globalUtils;
        
        setTimeout(() => {
            globalUtils.makeAppLike();
            updateViewportHeight();
        }, 100);
    });
} else {
    globalUtils = new GlobalUtils();
    window.globalUtils = globalUtils;
    
    setTimeout(() => {
        globalUtils.makeAppLike();
        updateViewportHeight();
    }, 100);
}

// ==========================================
// PWA SERVICE WORKER REGISTRATION
// ==========================================
// Only register service worker from the main hub (not from game pages)
if ('serviceWorker' in navigator && (window.location.pathname === '/' || window.location.pathname.endsWith('index.html'))) {
    navigator.serviceWorker.register(SITE_BASE_PATH + 'sw.js')
        .then(() => console.log('Service Worker registered'))
        .catch(err => console.error('Service Worker registration failed:', err));
}

console.log('Global utilities loaded');

// ==========================================
// CUSTOM CURSOR SYSTEM - BIG CAT PAW
// ==========================================

class CustomCursor {
    constructor() {
        this.cursorElement = null;
        this.isActive = false;
        this.currentX = 0;
        this.currentY = 0;
        this.targetX = 0;
        this.targetY = 0;
        
        // Available cursor images
        this.cursors = {
            default: '/assets/CatPawCursors-2.0/png files/Black1-Cat-Paw-PNG.png',
            hover: '/assets/CatPawCursors-2.0/png files/White-Cat-Paw-PNG.png',
            click: '/assets/CatPawCursors-2.0/png files/Tabby-Cat-Paw-PNG.png'
        };
        
        this.init();
    }
    
init() {
    // Only enable on devices with mouse (not touch-only)
    if (this.isTouchDevice()) {
        console.log('Touch device detected - skipping custom cursor');
        return;
    }
    
    console.log('🐾 Initializing custom cursor...');
    
    // Initialize positions to center of screen
    this.currentX = window.innerWidth / 2;
    this.currentY = window.innerHeight / 2;
    this.targetX = this.currentX;
    this.targetY = this.currentY;
    
    // Create cursor element
    this.createCursorElement();
    
    // Hide default cursor
    this.hideDefaultCursor();
    
    // Set up event listeners
    this.setupEventListeners();
    
    this.isActive = true;
    
    // Start animation loop AFTER everything is set up
    requestAnimationFrame(() => this.animate());
    
    console.log('✅ Custom cursor active');
}
    
    isTouchDevice() {
        return (
            ('ontouchstart' in window) ||
            (navigator.maxTouchPoints > 0) ||
            (navigator.msMaxTouchPoints > 0)
        );
    }
    
    createCursorElement() {
        this.cursorElement = document.createElement('div');
        this.cursorElement.id = 'customCursor';
        this.cursorElement.className = 'custom-cursor';
        
        // Create cursor image
        const img = document.createElement('img');
        img.src = this.cursors.default;
        img.alt = 'cursor';
        img.draggable = false;
        
        this.cursorElement.appendChild(img);
        document.body.appendChild(this.cursorElement);
        
        // Add cursor styles
        this.addCursorStyles();
    }
    
addCursorStyles() {
    const style = document.createElement('style');
    style.id = 'customCursorStyles';
    style.textContent = `
        .custom-cursor {
            position: fixed;
            top: 0;
            left: 0;
            pointer-events: none;
            z-index: 999999;
            width: 48px;
            height: 48px;
            transform: translate(-50%, -50%);
            will-change: left, top;
        }
        
        .custom-cursor img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        }
        
        .custom-cursor.hover {
            width: 56px;
            height: 56px;
        }
        
        .custom-cursor.click {
            width: 40px;
            height: 40px;
        }
        
        /* Hide default cursor globally */
        * {
            cursor: none !important;
        }
    `;
    
    document.head.appendChild(style);
}
    
    hideDefaultCursor() {
        document.body.style.cursor = 'none';
    }
    
    setupEventListeners() {
        // Track mouse movement
        document.addEventListener('mousemove', (e) => {
            this.targetX = e.clientX;
            this.targetY = e.clientY;
        });
        
        // Hover effects on interactive elements
        document.addEventListener('mouseover', (e) => {
            if (this.isInteractiveElement(e.target)) {
                this.setHoverState();
            }
        });
        
        document.addEventListener('mouseout', (e) => {
            if (this.isInteractiveElement(e.target)) {
                this.setDefaultState();
            }
        });
        
        // Click effect
        document.addEventListener('mousedown', () => {
            this.setClickState();
        });
        
        document.addEventListener('mouseup', () => {
            this.setDefaultState();
        });
    }
    
    isInteractiveElement(element) {
        const interactiveTags = ['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT'];
        const interactiveClasses = ['clickable', 'btn', 'game-card', 'food-item'];
        
        return (
            interactiveTags.includes(element.tagName) ||
            interactiveClasses.some(cls => element.classList.contains(cls)) ||
            element.onclick !== null ||
            window.getComputedStyle(element).cursor === 'pointer'
        );
    }
    
    setDefaultState() {
        if (!this.cursorElement) return;
        
        this.cursorElement.className = 'custom-cursor';
        const img = this.cursorElement.querySelector('img');
        if (img) img.src = this.cursors.default;
    }
    
    setHoverState() {
        if (!this.cursorElement) return;
        
        this.cursorElement.className = 'custom-cursor hover';
        const img = this.cursorElement.querySelector('img');
        if (img) img.src = this.cursors.hover;
    }
    
    setClickState() {
        if (!this.cursorElement) return;
        
        this.cursorElement.className = 'custom-cursor click';
        const img = this.cursorElement.querySelector('img');
        if (img) img.src = this.cursors.click;
    }
    
animate() {
    if (!this.isActive || !this.cursorElement) return;
    
    // Smooth follow with easing
    const ease = 0.2;
    this.currentX += (this.targetX - this.currentX) * ease;
    this.currentY += (this.targetY - this.currentY) * ease;
    
    // Update cursor position
    this.cursorElement.style.left = `${this.currentX}px`;
    this.cursorElement.style.top = `${this.currentY}px`;
    
    // Continue animation loop
    requestAnimationFrame(() => this.animate());
}
    
    destroy() {
        if (this.cursorElement) {
            this.cursorElement.remove();
        }
        
        const style = document.getElementById('customCursorStyles');
        if (style) {
            style.remove();
        }
        
        document.body.style.cursor = '';
        this.isActive = false;
        
        console.log('Custom cursor destroyed');
    }
}

// Initialize custom cursor after page loads
let customCursor;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        customCursor = new CustomCursor();
        window.customCursor = customCursor;
    });
} else {
    customCursor = new CustomCursor();
    window.customCursor = customCursor;
}

console.log('Custom cursor system loaded');