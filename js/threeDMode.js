// Complete replacement for threeDMode.js - Standalone implementation
// This version works independently of the existing app structure

const ThreeDMode = (function() {
    // Private variables
    let canvas, renderer, scene, camera;
    let isInitialized = false;
    let isActive = false;
    let animationId = null;
    let objects = [];
    let currentColor = '#FF0000';
    let currentShape = 'cube';
    
    console.warn("🎮 NEW 3D MODE: Loading standalone implementation");
    
    // Initialize everything when the script loads
    function init() {
        // Get our canvas
        canvas = document.getElementById('three-d-canvas');
        if (!canvas) {
            console.error("🎮 NEW 3D MODE: Canvas not found!");
            return false;
        }
        
        console.warn("🎮 NEW 3D MODE: Found canvas, initializing...");
        
        // Create scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xFFFFFF);
        
        // Create camera with fixed aspect ratio initially
        camera = new THREE.PerspectiveCamera(70, 1, 0.1, 1000);
        camera.position.set(0, 0, 5);
        
        // Add lights
        const light = new THREE.DirectionalLight(0xFFFFFF, 1);
        light.position.set(1, 1, 1);
        scene.add(light);
        
        const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.4);
        scene.add(ambientLight);
        
        // Create renderer with basic size
        try {
            renderer = new THREE.WebGLRenderer({
                canvas: canvas,
                antialias: true
            });
            renderer.setSize(300, 300); // Will be resized on activation
        } catch (e) {
            console.error("🎮 NEW 3D MODE: Failed to create WebGL renderer:", e);
            
            // Try with a simpler renderer
            try {
                renderer = new THREE.CanvasRenderer({
                    canvas: canvas
                });
                renderer.setSize(300, 300);
            } catch (e2) {
                console.error("🎮 NEW 3D MODE: Both renderers failed:", e2);
                return false;
            }
        }
        
        // Set up event listeners for the toolbar buttons
        setupEventListeners();
        
        // Create a test cube to verify rendering
        createTestObject();
        
        // Force a render
        renderer.render(scene, camera);
        
        console.warn("🎮 NEW 3D MODE: Initialization complete!");
        isInitialized = true;
        return true;
    }
    
    // Create a test object
    function createTestObject() {
        // Add a red cube to the center
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);
        objects.push(cube);
        
        console.warn("🎮 NEW 3D MODE: Test object created");
    }
    
    // Set up event listeners
    function setupEventListeners() {
        // Add click handler to canvas
        canvas.addEventListener('click', handleCanvasClick);
        
        // Add handlers for toolbar buttons
        const shapeButtons = document.querySelectorAll('#three-d-mode .tool-button[data-shape]');
        shapeButtons.forEach(button => {
            button.addEventListener('click', handleShapeClick);
        });
        
        const colorButtons = document.querySelectorAll('#three-d-mode .tool-button[data-tool="color"]');
        colorButtons.forEach(button => {
            button.addEventListener('click', handleColorClick);
        });
        
        const clearButton = document.querySelector('#three-d-mode .tool-button[data-tool="clear"]');
        if (clearButton) {
            clearButton.addEventListener('click', clearScene);
        }
        
        console.warn("🎮 NEW 3D MODE: Event listeners set up");
    }
    
    // Handle shape button clicks
    function handleShapeClick(e) {
        currentShape = e.currentTarget.getAttribute('data-shape');
        console.warn("🎮 NEW 3D MODE: Shape selected:", currentShape);
        
        // Highlight active button
        document.querySelectorAll('#three-d-mode .tool-button[data-shape]').forEach(btn => {
            btn.classList.remove('active');
        });
        e.currentTarget.classList.add('active');
    }
    
    // Handle color button clicks
    function handleColorClick(e) {
        currentColor = e.currentTarget.getAttribute('data-color');
        console.warn("🎮 NEW 3D MODE: Color selected:", currentColor);
        
        // Highlight active button
        document.querySelectorAll('#three-d-mode .tool-button[data-tool="color"]').forEach(btn => {
            btn.classList.remove('active');
        });
        e.currentTarget.classList.add('active');
    }
    
    // Handle canvas clicks
    function handleCanvasClick(e) {
        // Force activate if not already
        if (!isActive) {
            console.warn("🎮 NEW 3D MODE: Force activating on click");
            activateMode();
        }
        
        console.warn("🎮 NEW 3D MODE: Canvas clicked");
        
        // Get click position relative to canvas
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Convert to normalized device coordinates (-1 to +1)
        const normalizedX = (x / canvas.width) * 2 - 1;
        const normalizedY = -(y / canvas.height) * 2 + 1;
        
        // Create object at this position
        createObject(normalizedX * 3, normalizedY * 2, 0);
    }
    
    // Create a new 3D object
    function createObject(x, y, z) {
        let geometry;
        
        // Create geometry based on shape
        switch (currentShape) {
            case 'cube':
                geometry = new THREE.BoxGeometry(1, 1, 1);
                break;
            case 'sphere':
                geometry = new THREE.SphereGeometry(0.5, 16, 16);
                break;
            case 'cone':
                geometry = new THREE.ConeGeometry(0.5, 1, 16);
                break;
            case 'cylinder':
                geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 16);
                break;
            default:
                geometry = new THREE.BoxGeometry(1, 1, 1);
        }
        
        // Use MeshBasicMaterial for guaranteed visibility
        const material = new THREE.MeshBasicMaterial({
            color: currentColor
        });
        
        // Create the mesh
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        
        // Add to scene and objects array
        scene.add(mesh);
        objects.push(mesh);
        
        console.warn("🎮 NEW 3D MODE: Object created:", currentShape, "at", x, y, z);
        
        // Force a render
        renderer.render(scene, camera);
    }
    
    // Clear all objects from scene
    function clearScene() {
        console.warn("🎮 NEW 3D MODE: Clearing scene");
        
        // Remove all objects
        while (objects.length > 0) {
            const obj = objects.pop();
            scene.remove(obj);
        }
        
        // Force a render
        renderer.render(scene, camera);
    }
    
    // Resize renderer
    function resizeRenderer() {
        if (!renderer || !camera) return;
        
        // Get parent container size
        const container = document.getElementById('three-d-mode');
        if (!container) return;
        
        const toolbarHeight = document.querySelector('#three-d-mode .toolbar')?.offsetHeight || 100;
        
        // Calculate dimensions
        const width = Math.max(300, container.clientWidth);
        const height = Math.max(300, container.clientHeight - toolbarHeight);
        
        // Update renderer size
        renderer.setSize(width, height);
        
        // Update camera aspect ratio
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        
        // Force a render
        renderer.render(scene, camera);
        
        console.warn("🎮 NEW 3D MODE: Renderer resized to", width, "x", height);
    }
    
    // Animation loop
    function animate() {
        // Request next frame
        animationId = requestAnimationFrame(animate);
        
        // Rotate all objects
        objects.forEach(obj => {
            obj.rotation.x += 0.01;
            obj.rotation.y += 0.01;
        });
        
        // Render scene
        renderer.render(scene, camera);
    }
    
    // Activate the 3D mode
    function activateMode() {
        console.warn("🎮 NEW 3D MODE: Activating");
        
        // Initialize if not already done
        if (!isInitialized) {
            init();
        }
        
        // Mark as active
        isActive = true;
        
        // Resize renderer to fit current container
        resizeRenderer();
        
        // Start animation loop
        if (!animationId) {
            animate();
        }
        
        // Create an initial object if the scene is empty
        if (objects.length === 0) {
            createObject(0, 0, 0);
        }
        
        console.warn("🎮 NEW 3D MODE: Activated successfully");
    }
    
    // Deactivate the 3D mode
    function deactivateMode() {
        console.warn("🎮 NEW 3D MODE: Deactivating");
        
        // Stop animation loop
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        
        isActive = false;
    }
    
    // Public API
    return {
        initialize: function() {
            init();
            return this;
        },
        
        activate: function() {
            activateMode();
        },
        
        deactivate: function() {
            deactivateMode();
        },
        
        handleResize: function() {
            resizeRenderer();
        },
        
        // For debugging - manually trigger functions
        _debug: {
            forceActivate: activateMode,
            forceRender: function() {
                if (renderer && scene && camera) {
                    renderer.render(scene, camera);
                }
            },
            createTestObject: createTestObject
        }
    };
})();

// Initialize immediately
document.addEventListener('DOMContentLoaded', function() {
    // Add 3D mode activation to the button directly
    const threeDButton = document.getElementById('3d-mode-btn');
    if (threeDButton) {
        threeDButton.addEventListener('click', function() {
            console.warn("🎮 NEW 3D MODE: Button clicked, forcing activation");
            
            // Force mode to be visible
            const modes = ['dashboard', 'paint-mode', 'gallery-mode', 'three-d-mode', 'magic-mode'];
            modes.forEach(m => {
                document.getElementById(m).classList.add('hidden');
            });
            document.getElementById('three-d-mode').classList.remove('hidden');
            
            // Force activate
            setTimeout(function() {
                ThreeDMode._debug.forceActivate();
            }, 100);
        });
    }
});