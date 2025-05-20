// paintMode.js - Canvas painting functionality

const PaintMode = (function() {
    // Private variables
    let canvas, ctx;
    let isDrawing = false;
    let lastX = 0, lastY = 0;
    let isActive = false;
    
    // Drawing settings
    let currentColor = '#FF0000';
    let currentSize = 'medium';
    let currentBrush = 'basic';
    let brushSizes = {
        small: 10,
        medium: 20,
        large: 35
    };
    
    // Store touches for multi-touch
    let activePointers = {};
    
    // Initialize canvas and context
    function initCanvas() {
        canvas = document.getElementById('paint-canvas');
        if (!canvas) {
            console.error('Paint canvas not found');
            return;
        }
        
        ctx = canvas.getContext('2d');
        
        // Set initial canvas size
        resizeCanvas();
        
        // Clear canvas to white background
        clearCanvas();
        
        console.log('Paint canvas initialized:', canvas.width, 'x', canvas.height);
    }
    
    // Set up event listeners for canvas
    function setupEventListeners() {
        if (!canvas) {
            console.error('Cannot setup event listeners - canvas not initialized');
            return;
        }
        
        // Touch events
        canvas.addEventListener('pointerdown', handlePointerDown);
        canvas.addEventListener('pointermove', handlePointerMove);
        canvas.addEventListener('pointerup', handlePointerUp);
        canvas.addEventListener('pointercancel', handlePointerUp);
        canvas.addEventListener('pointerleave', handlePointerUp);
        
        // Prevent scrolling while drawing
        canvas.addEventListener('touchstart', function(e) {
            e.preventDefault();
        }, { passive: false });
        
        // Tool buttons
        const toolButtons = document.querySelectorAll('#paint-mode .tool-button');
        toolButtons.forEach(button => {
            button.addEventListener('click', handleToolClick);
        });
        
        console.log('Paint mode event listeners set up');
    }
    
    // Handle pointer down event
    function handlePointerDown(e) {
        if (!isActive) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Store this pointer
        activePointers[e.pointerId] = { x, y };
        
        // Start drawing
        if (!isDrawing) {
            isDrawing = true;
            lastX = x;
            lastY = y;
        }
        
        // For basic brush, draw a dot at start point
        if (currentBrush === 'basic') {
            ctx.beginPath();
            ctx.arc(x, y, brushSizes[currentSize] / 2, 0, Math.PI * 2);
            ctx.fillStyle = currentColor;
            ctx.fill();
        } else if (currentBrush === 'eraser') {
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, brushSizes[currentSize] * 1.5, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
            ctx.restore();
        }
        
        console.log('Paint pointer down:', x, y, 'color:', currentColor, 'brush:', currentBrush);
    }
    
    // Handle pointer move event
    function handlePointerMove(e) {
        if (!isActive || !isDrawing) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Update this pointer
        const prevPoint = activePointers[e.pointerId] || { x: lastX, y: lastY };
        activePointers[e.pointerId] = { x, y };
        
        // Draw based on current brush
        if (currentBrush === 'basic') {
            drawLine(prevPoint.x, prevPoint.y, x, y);
        } else if (currentBrush === 'eraser') {
            eraseAt(prevPoint.x, prevPoint.y, x, y);
        }
        
        lastX = x;
        lastY = y;
    }
    
    // Handle pointer up event
    function handlePointerUp(e) {
        if (!isActive) return;
        
        // Remove this pointer
        delete activePointers[e.pointerId];
        
        // If no more active pointers, stop drawing
        if (Object.keys(activePointers).length === 0) {
            isDrawing = false;
        }
    }
    
    // Draw a line between two points
    function drawLine(fromX, fromY, toX, toY) {
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.lineWidth = brushSizes[currentSize];
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = currentColor;
        ctx.stroke();
    }
    
    // Erase at a position
    function eraseAt(fromX, fromY, toX, toY) {
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        drawLine(fromX, fromY, toX, toY);
        ctx.restore();
    }
    
    // Clear canvas to white
    function clearCanvas() {
        if (!ctx) return;
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Resize canvas to fit container
    function resizeCanvas() {
        if (!canvas || !canvas.parentElement) return;
        
        // Get parent container dimensions
        const container = canvas.parentElement;
        const toolbarHeight = document.querySelector('.toolbar')?.offsetHeight || 100;
        
        // Get current dimensions before resizing
        const oldWidth = canvas.width;
        const oldHeight = canvas.height;
        
        // Save current canvas content if canvas has content
        let tempCanvas = null;
        if (oldWidth > 0 && oldHeight > 0 && ctx) {
            tempCanvas = document.createElement('canvas');
            tempCanvas.width = oldWidth;
            tempCanvas.height = oldHeight;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(canvas, 0, 0);
        }
        
        // Set new canvas dimensions
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight - toolbarHeight;
        
        // Restore content if we had previous content
        if (tempCanvas && tempCanvas.width > 0 && tempCanvas.height > 0 && ctx) {
            ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 
                          0, 0, canvas.width, canvas.height);
        } else {
            clearCanvas(); // Just clear if there was no previous content
        }
        
        console.log('Canvas resized to:', canvas.width, 'x', canvas.height);
    }
    
    // Handle tool button clicks
    function handleToolClick(e) {
        const button = e.currentTarget;
        const tool = button.getAttribute('data-tool');
        
        console.log('Tool clicked:', tool);
        
        // Highlight active button
        if (tool === 'color' || tool === 'size' || tool === 'brush') {
            // Remove highlight from other buttons in same category
            document.querySelectorAll(`[data-tool="${tool}"]`).forEach(btn => {
                btn.classList.remove('active');
            });
            button.classList.add('active');
        }
        
        // Handle different tools
        switch (tool) {
            case 'color':
                currentColor = button.getAttribute('data-color');
                console.log('Color changed to:', currentColor);
                break;
            case 'size':
                currentSize = button.getAttribute('data-size');
                console.log('Size changed to:', currentSize);
                break;
            case 'brush':
                currentBrush = button.getAttribute('data-brush');
                console.log('Brush changed to:', currentBrush);
                break;
            case 'clear':
                clearCanvas();
                console.log('Canvas cleared');
                break;
            case 'save':
                savePainting();
                console.log('Painting saved');
                break;
        }
    }
    
    // Save current painting
    function savePainting() {
        if (!canvas) return;
        
        // Get image data from canvas
        const imageData = canvas.toDataURL('image/png');
        
        // Generate thumbnail
        Storage.generateThumbnail(canvas).then(thumbnailData => {
            // Save to storage
            Storage.savePainting(imageData, thumbnailData, 'paint');
            
            // Visual feedback for save
            showSaveFeedback();
        });
    }
    
    // Show visual feedback when saving
    function showSaveFeedback() {
        // Create a temporary element for feedback
        const feedback = document.createElement('div');
        feedback.style.position = 'absolute';
        feedback.style.top = '50%';
        feedback.style.left = '50%';
        feedback.style.transform = 'translate(-50%, -50%)';
        feedback.style.background = 'rgba(255, 255, 255, 0.8)';
        feedback.style.padding = '30px';
        feedback.style.borderRadius = '20px';
        feedback.style.fontSize = '70px';
        feedback.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.3)';
        feedback.style.zIndex = '1000';
        feedback.textContent = '💾';
        
        // Add to container and remove after delay
        document.getElementById('paint-mode').appendChild(feedback);
        
        // Animate
        feedback.animate([
            { transform: 'translate(-50%, -50%) scale(0.5)', opacity: 0 },
            { transform: 'translate(-50%, -50%) scale(1.2)', opacity: 1 },
            { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
            { transform: 'translate(-50%, -50%) scale(1.1)', opacity: 0 }
        ], {
            duration: 1500,
            easing: 'ease-in-out'
        }).addEventListener('finish', () => {
            feedback.remove();
        });
    }
    
    // Load existing painting
    function loadPainting(painting) {
        if (!ctx) return;
        
        // Clear canvas first
        clearCanvas();
        
        // Create an image from the data URL
        const img = new Image();
        img.onload = function() {
            // Draw the loaded image onto the canvas
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = painting.image;
    }
    
    // Public API
    return {
        initialize: function() {
            initCanvas();
            setupEventListeners();
            console.log('Paint mode initialized');
            return this;
        },
        
        activate: function() {
            isActive = true;
            
            // Make sure canvas is sized correctly when mode becomes active
            resizeCanvas();
            
            // Set default selected tools
            document.querySelector('#paint-mode [data-tool="color"][data-color="#FF0000"]')?.classList.add('active');
            document.querySelector('#paint-mode [data-tool="size"][data-size="medium"]')?.classList.add('active');
            document.querySelector('#paint-mode [data-tool="brush"][data-brush="basic"]')?.classList.add('active');
            
            console.log('Paint mode activated');
        },
        
        deactivate: function() {
            isActive = false;
            console.log('Paint mode deactivated');
        },
        
        handleResize: function() {
            resizeCanvas();
        },
        
        loadPainting: function(painting) {
            loadPainting(painting);
        },
        
        getCurrentCanvas: function() {
            return canvas;
        }
    };
})();