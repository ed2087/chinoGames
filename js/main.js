// Entry point and device detection 
// Entry point and device detection

class PlanetSimulator {
    constructor() {
        this.isMobile = this.detectMobile();
        this.isInitialized = false;
        this.engine = null;
        this.world = null;
        this.ecosystem = null;
        this.godPowers = null;
        this.ui = null;
        
        this.init();
    }
    
    detectMobile() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
        return mobileRegex.test(userAgent) || window.innerWidth < 768;
    }
    
    async init() {
        try {
            console.log('Initializing Planet Simulator...');
            console.log(`Device type: ${this.isMobile ? 'Mobile' : 'Desktop'}`);
            
            // Initialize core systems
            this.engine = new Engine();
            this.world = new World(this.engine.canvas.width, this.engine.canvas.height);
            this.ecosystem = new Ecosystem(this.world);
            this.godPowers = new GodPowers(this.world, this.ecosystem);
            
            // Initialize appropriate UI
            if (this.isMobile) {
                this.ui = new MobileUI(this.engine, this.world, this.ecosystem, this.godPowers);
            } else {
                this.ui = new DesktopUI(this.engine, this.world, this.ecosystem, this.godPowers);
            }
            
            // Start the simulation
            this.engine.start(this.update.bind(this), this.render.bind(this));
            
            this.isInitialized = true;
            console.log('Planet Simulator initialized successfully!');
            
            // Populate initial world
            this.createInitialLife();
            
        } catch (error) {
            console.error('Failed to initialize Planet Simulator:', error);
        }
    }
    
    createInitialLife() {
        // Add some initial resources
        for (let i = 0; i < 50; i++) {
            this.world.addRandomResource();
        }
        
        // Add initial creatures
        for (let i = 0; i < 20; i++) {
            this.ecosystem.addRandomCreature();
        }
        
        console.log('Initial life created!');
    }
    
    update(deltaTime) {
        if (!this.isInitialized) return;
        
        this.world.update(deltaTime);
        this.ecosystem.update(deltaTime);
        this.ui.update(deltaTime);
    }
    
    render(ctx) {
        if (!this.isInitialized) return;
        
        this.world.render(ctx);
        this.ecosystem.render(ctx);
        this.ui.render(ctx);
    }
    
    // Event handlers
    handleResize() {
        if (this.engine) {
            this.engine.handleResize();
        }
        
        // Re-detect mobile if window size changes significantly
        const wasMobile = this.isMobile;
        this.isMobile = this.detectMobile();
        
        if (wasMobile !== this.isMobile && this.isInitialized) {
            // Switch UI mode
            this.ui.destroy();
            if (this.isMobile) {
                this.ui = new MobileUI(this.engine, this.world, this.ecosystem, this.godPowers);
            } else {
                this.ui = new DesktopUI(this.engine, this.world, this.ecosystem, this.godPowers);
            }
        }
    }
}

// Global app instance
let planetSimulator;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    planetSimulator = new PlanetSimulator();
    
    // Handle window resize
    window.addEventListener('resize', () => {
        planetSimulator.handleResize();
    });
    
    // Prevent context menu on mobile
    document.addEventListener('contextmenu', (e) => {
        if (planetSimulator.isMobile) {
            e.preventDefault();
        }
    });
    
    // Handle visibility change
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            planetSimulator.engine?.pause();
        } else {
            planetSimulator.engine?.resume();
        }
    });
});

// Service Worker registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}