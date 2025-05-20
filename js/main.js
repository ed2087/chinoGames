// main.js - Main application initialization and coordination

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize app
    App.initialize();
});

// Main App Module
const App = (function() {
    // Private variables
    let currentMode = null;
    const modes = ['dashboard', 'paint-mode', 'gallery-mode', 'three-d-mode', 'magic-mode'];
    
    // DOM Elements
    let startScreen, startButton, appContainer;
    
    // Initialize all modules
    function initModules() {
        // Initialize storage first
        Storage.initialize();
        
        // Then initialize all mode modules
        PaintMode.initialize();
        GalleryMode.initialize();
        ThreeDMode.initialize();
        MagicMode.initialize();
        
        // Load dashboard content
        loadDashboard();
    }
    
    // Set up event listeners
    function setupEventListeners() {
        // Start screen button
        startButton = document.getElementById('start-button');
        startButton.addEventListener('click', handleStartClick);
        
        // Mode buttons in dashboard
        document.getElementById('new-drawing').addEventListener('click', () => switchMode('paint-mode'));
        document.getElementById('paint-mode-btn').addEventListener('click', () => switchMode('paint-mode'));
        document.getElementById('3d-mode-btn').addEventListener('click', () => switchMode('three-d-mode'));
        document.getElementById('gallery-mode-btn').addEventListener('click', () => switchMode('gallery-mode'));
        document.getElementById('magic-mode-btn').addEventListener('click', () => switchMode('magic-mode'));
        
        // Global home button handling
        document.querySelectorAll('.tool-button[data-tool="home"]').forEach(button => {
            button.addEventListener('click', () => switchMode('dashboard'));
        });
        
        // Add animation class to all buttons on touch/click
        document.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', function() {
                this.classList.add('pressed');
                setTimeout(() => this.classList.remove('pressed'), 300);
            });
        });
        
        // Dashboard thumbnail clicks
        document.getElementById('saved-thumbnails').addEventListener('click', handleThumbnailClick);
        
        // Handle orientation changes
        window.addEventListener('resize', handleResize);
    }
    
    // Handle start button click
    function handleStartClick() {
        // Request fullscreen first
        const doc = document.documentElement;
        
        if (doc.requestFullscreen) {
            doc.requestFullscreen()
                .then(() => showDashboard())
                .catch(err => {
                    console.warn('Fullscreen request failed:', err);
                    showDashboard(); // Show dashboard anyway
                });
        } else {
            // Fallback if fullscreen API not available
            showDashboard();
        }
    }
    
    // Show dashboard and hide start screen
    function showDashboard() {
        startScreen = document.getElementById('start-screen');
        startScreen.classList.add('hidden');
        switchMode('dashboard');
    }
    
    // Switch between different modes (dashboard, paint, gallery, etc.)
    function switchMode(mode) {
        // Hide all screens first
        modes.forEach(m => {
            document.getElementById(m).classList.add('hidden');
        });
        
        // Show requested mode
        document.getElementById(mode).classList.remove('hidden');
        currentMode = mode;
        
        // Run mode-specific initialization if needed
        switch(mode) {
            case 'dashboard':
                loadDashboard();
                break;
            case 'paint-mode':
                PaintMode.activate();
                break;
            case 'gallery-mode':
                GalleryMode.activate();
                break;
            case '3d-mode':
                ThreeDMode.activate();
                break;
            case 'magic-mode':
                MagicMode.activate();
                break;
        }
    }
    
    // Load dashboard content (thumbnails)
    function loadDashboard() {
        const thumbnailsContainer = document.getElementById('saved-thumbnails');
        thumbnailsContainer.innerHTML = ''; // Clear existing thumbnails
        
        // Get all paintings from storage
        const paintings = Storage.getAllPaintings();
        
        // Sort by date (newest first)
        paintings.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Generate thumbnail elements
        paintings.forEach((painting, index) => {
            const thumbnail = document.createElement('div');
            thumbnail.className = 'thumbnail';
            thumbnail.setAttribute('data-id', painting.id);
            
            // If it's the oldest and at max limit, add faded class
            if (index === paintings.length - 1 && paintings.length >= MAX_PAINTINGS) {
                thumbnail.classList.add('faded');
            }
            
            const img = document.createElement('img');
            img.src = painting.thumbnail;
            img.alt = `Painting ${index + 1}`;
            
            thumbnail.appendChild(img);
            thumbnailsContainer.appendChild(thumbnail);
        });
    }
    
    // Handle thumbnail clicks on dashboard
    function handleThumbnailClick(event) {
        // Find closest thumbnail element
        const thumbnail = event.target.closest('.thumbnail');
        if (!thumbnail) return;
        
        const paintingId = thumbnail.getAttribute('data-id');
        const painting = Storage.getPainting(paintingId);
        
        if (painting) {
            // Determine which mode to open in based on the painting mode
            switch(painting.mode) {
                case 'paint':
                    PaintMode.loadPainting(painting);
                    switchMode('paint-mode');
                    break;
                case 'magic':
                    MagicMode.loadPainting(painting);
                    switchMode('magic-mode');
                    break;
                default:
                    PaintMode.loadPainting(painting);
                    switchMode('paint-mode');
            }
        }
    }
    
    // Handle orientation/resize changes
    function handleResize() {
        // Notify active module about the resize
        switch(currentMode) {
            case 'paint-mode':
                PaintMode.handleResize();
                break;
            case '3d-mode':
                ThreeDMode.handleResize();
                break;
            case 'magic-mode':
                MagicMode.handleResize();
                break;
        }
    }
    
    // Public API
    return {
        initialize: function() {
            // Initialize all modules
            initModules();
            
            // Set up event listeners
            setupEventListeners();
            
            console.log('🎨 Kid Paint App initialized! 🎨');
        },
        
        // Get current mode
        getCurrentMode: function() {
            return currentMode;
        },
        
        // Switch to a specific mode
        switchToMode: function(mode) {
            switchMode(mode);
        }
    };
})();