// magicMode.js - Special effects and magical brushes

const MagicMode = (function() {
    // Private variables
    let canvas, ctx;
    let isDrawing = false;
    let lastX = 0, lastY = 0;
    let currentMagic = 'rainbow'; // Define this at the top of the module
    let isActive = false;
    
    // Rainbow brush variables
    let hue = 0;
    
    // Store touches for multi-touch
    let activePointers = {};
    
    // Get color based on current magic effect
    function getColor() {
        switch(currentMagic) {
            case 'rainbow':
                hue = (hue + 5) % 360;
                return `hsl(${hue}, 100%, 50%)`;
            case 'fire':
                return `hsl(${20 + Math.random() * 20}, 100%, 50%)`;
            case 'galaxy':
                return `hsl(${250 + Math.random() * 30}, 80%, 70%)`;
            case 'liquid':
                return `hsl(${190 + Math.random() * 30}, 80%, 60%)`;
            case 'splatter':
                return `hsl(${Math.random() * 360}, 70%, 50%)`;
            case 'mirror':
                return `hsl(${(hue + 10) % 360}, 80%, 60%)`;
            case 'wiggly':
                return `hsl(${120 + Math.random() * 60}, 70%, 50%)`;
            case 'surprise':
                return `hsl(${Math.random() * 360}, 80%, 60%)`;
            default:
                return `hsl(${Math.random() * 360}, 80%, 50%)`;
        }
    }
    
    // Initialize canvas and context
    function initCanvas() {
        canvas = document.getElementById('magic-canvas');
        if (!canvas) {
            console.error('Magic canvas not found');
            return;
        }
        
        ctx = canvas.getContext('2d');
        
        // Set initial canvas size
        resizeCanvas();
        
        // Clear canvas to white background
        clearCanvas();
        
        console.log('Magic canvas initialized:', canvas.width, 'x', canvas.height);
    }
    
    // Set up event listeners
    function setupEventListeners() {
        if (!canvas) {
            console.error('Cannot setup event listeners - magic canvas not initialized');
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
        
        // Magic effect buttons
        const magicButtons = document.querySelectorAll('#magic-mode .tool-button[data-magic]');
        magicButtons.forEach(button => {
            button.addEventListener('click', handleMagicClick);
        });
        
        // Tool buttons (clear, save, home)
        const toolButtons = document.querySelectorAll('#magic-mode .tool-button[data-tool]');
        toolButtons.forEach(button => {
            button.addEventListener('click', handleToolClick);
        });
        
        console.log('Magic mode event listeners set up');
    }
    
    // Handle pointer down event
    function handlePointerDown(e) {
        if (!isActive || !ctx) return;
        
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
            
            // Initial dot for each magic effect
            switch(currentMagic) {
                case 'rainbow':
                    drawRainbowDot(x, y);
                    break;
                case 'mirror':
                    drawMirrorDot(x, y);
                    break;
                case 'splatter':
                    drawSplatter(x, y);
                    break;
                case 'wiggly':
                    drawWigglyDot(x, y);
                    break;
                case 'liquid':
                    drawLiquidDot(x, y);
                    break;
                case 'fire':
                    drawFireDot(x, y);
                    break;
                case 'galaxy':
                    drawGalaxyDot(x, y);
                    break;
                case 'surprise':
                    // Pick a random effect other than surprise
                    const effects = ['rainbow', 'mirror', 'splatter', 'wiggly', 'liquid', 'fire', 'galaxy'];
                    const randomEffect = effects[Math.floor(Math.random() * effects.length)];
                    // Call that effect's function
                    if (randomEffect === 'rainbow') drawRainbowDot(x, y);
                    else if (randomEffect === 'mirror') drawMirrorDot(x, y);
                    else if (randomEffect === 'splatter') drawSplatter(x, y);
                    else if (randomEffect === 'wiggly') drawWigglyDot(x, y);
                    else if (randomEffect === 'liquid') drawLiquidDot(x, y);
                    else if (randomEffect === 'fire') drawFireDot(x, y);
                    else if (randomEffect === 'galaxy') drawGalaxyDot(x, y);
                    break;
                default:
                    drawRainbowDot(x, y);
            }
        }
        
        console.log('Magic pointer down:', x, y, 'effect:', currentMagic);
    }
    
    // Handle pointer move event
    function handlePointerMove(e) {
        if (!isActive || !isDrawing || !ctx) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Update this pointer
        const prevPoint = activePointers[e.pointerId] || { x: lastX, y: lastY };
        activePointers[e.pointerId] = { x, y };
        
        // Draw based on current magic effect
        switch(currentMagic) {
            case 'rainbow':
                drawRainbowLine(prevPoint.x, prevPoint.y, x, y);
                break;
            case 'mirror':
                drawMirrorLine(prevPoint.x, prevPoint.y, x, y);
                break;
            case 'splatter':
                drawSplatter(x, y);
                break;
            case 'wiggly':
                drawWigglyLine(prevPoint.x, prevPoint.y, x, y);
                break;
            case 'liquid':
                drawLiquidLine(prevPoint.x, prevPoint.y, x, y);
                break;
            case 'fire':
                drawFireLine(prevPoint.x, prevPoint.y, x, y);
                break;
            case 'galaxy':
                drawGalaxyLine(prevPoint.x, prevPoint.y, x, y);
                break;
            case 'surprise':
                // Pick a random effect other than surprise
                const effects = ['rainbow', 'mirror', 'splatter', 'wiggly', 'liquid', 'fire', 'galaxy'];
                const randomEffect = effects[Math.floor(Math.random() * effects.length)];
                // Call that effect's function
                if (randomEffect === 'rainbow') drawRainbowLine(prevPoint.x, prevPoint.y, x, y);
                else if (randomEffect === 'mirror') drawMirrorLine(prevPoint.x, prevPoint.y, x, y);
                else if (randomEffect === 'splatter') drawSplatter(x, y);
                else if (randomEffect === 'wiggly') drawWigglyLine(prevPoint.x, prevPoint.y, x, y);
                else if (randomEffect === 'liquid') drawLiquidLine(prevPoint.x, prevPoint.y, x, y);
                else if (randomEffect === 'fire') drawFireLine(prevPoint.x, prevPoint.y, x, y);
                else if (randomEffect === 'galaxy') drawGalaxyLine(prevPoint.x, prevPoint.y, x, y);
                break;
            default:
                drawRainbowLine(prevPoint.x, prevPoint.y, x, y);
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
    
    // Magic effect implementations
    
    // Rainbow brush
    function drawRainbowDot(x, y) {
        const size = 15;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = getColor();
        ctx.fill();
    }
    
    function drawRainbowLine(fromX, fromY, toX, toY) {
        // Increase hue change rate for more colorful effect
        hue = (hue + 10) % 360;
        const color = `hsl(${hue}, 100%, 50%)`;
        
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.lineWidth = 15;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = color;
        ctx.stroke();
    }
    
    // Mirror brush
    function drawMirrorDot(x, y) {
        const centerX = canvas.width / 2;
        const mirrorX = centerX + (centerX - x);
        
        // Draw at original position
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fillStyle = getColor();
        ctx.fill();
        
        // Draw at mirrored position
        ctx.beginPath();
        ctx.arc(mirrorX, y, 10, 0, Math.PI * 2);
        ctx.fillStyle = getColor();
        ctx.fill();
    }
    
    function drawMirrorLine(fromX, fromY, toX, toY) {
        const centerX = canvas.width / 2;
        const mirrorFromX = centerX + (centerX - fromX);
        const mirrorToX = centerX + (centerX - toX);
        
        const color = getColor();
        
        // Draw at original position
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = color;
        ctx.stroke();
        
        // Draw at mirrored position
        ctx.beginPath();
        ctx.moveTo(mirrorFromX, fromY);
        ctx.lineTo(mirrorToX, toY);
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = color;
        ctx.stroke();
    }
    
    // Splatter brush
    function drawSplatter(x, y) {
        const color = getColor();
        const numSplatters = 12 + Math.floor(Math.random() * 8); // 12-20 splatters
        
        for (let i = 0; i < numSplatters; i++) {
            const splatX = x + (Math.random() - 0.5) * 60;
            const splatY = y + (Math.random() - 0.5) * 60;
            const radius = 2 + Math.random() * 8;
            
            ctx.beginPath();
            ctx.arc(splatX, splatY, radius, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
        }
    }
    
    // Wiggly brush
    function drawWigglyDot(x, y) {
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fillStyle = getColor();
        ctx.fill();
    }
    
    function drawWigglyLine(fromX, fromY, toX, toY) {
        const dx = toX - fromX;
        const dy = toY - fromY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Only draw if there's some distance to cover
        if (distance < 5) return;
        
        const steps = Math.floor(distance / 5); // One wiggle every ~5 pixels
        const color = getColor();
        
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        
        for (let i = 1; i <= steps; i++) {
            // Calculate base point along the line
            const ratio = i / steps;
            const baseX = fromX + dx * ratio;
            const baseY = fromY + dy * ratio;
            
            // Calculate perpendicular direction
            const perpX = -dy / distance;
            const perpY = dx / distance;
            
            // Add wiggle perpendicular to line direction
            const amplitude = 10;
            const wiggle = Math.sin(i * 0.5) * amplitude;
            
            // Calculate final point
            const pointX = baseX + perpX * wiggle;
            const pointY = baseY + perpY * wiggle;
            
            // Add point to path
            ctx.lineTo(pointX, pointY);
        }
        
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = color;
        ctx.stroke();
    }
    
    // Liquid brush
    function drawLiquidDot(x, y) {
        const size = 25;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        
        // Create gradient for water-like effect
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
        gradient.addColorStop(0, 'rgba(0, 150, 255, 0.8)');
        gradient.addColorStop(0.7, 'rgba(0, 100, 255, 0.5)');
        gradient.addColorStop(1, 'rgba(0, 50, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fill();
    }
    
    function drawLiquidLine(fromX, fromY, toX, toY) {
        // Draw liquid dots along the path
        const dx = toX - fromX;
        const dy = toY - fromY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.max(1, Math.floor(distance / 10));
        
        for (let i = 0; i <= steps; i++) {
            const x = fromX + (dx * i / steps);
            const y = fromY + (dy * i / steps);
            const size = 10 + Math.random() * 15;
            
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            
            // Create gradient for water-like effect
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
            gradient.addColorStop(0, 'rgba(0, 150, 255, 0.8)');
            gradient.addColorStop(0.7, 'rgba(0, 100, 255, 0.5)');
            gradient.addColorStop(1, 'rgba(0, 50, 255, 0)');
            
            ctx.fillStyle = gradient;
            ctx.fill();
        }
    }
    
    // Fire trail
    function drawFireDot(x, y) {
        const size = 20;
        
        // Create gradient for fire-like effect
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
        gradient.addColorStop(0, 'rgba(255, 255, 100, 1)');
        gradient.addColorStop(0.3, 'rgba(255, 150, 50, 0.9)');
        gradient.addColorStop(0.6, 'rgba(255, 50, 0, 0.7)');
        gradient.addColorStop(1, 'rgba(100, 0, 0, 0)');
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
    }
    
    function drawFireLine(fromX, fromY, toX, toY) {
        const dx = toX - fromX;
        const dy = toY - fromY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.max(1, Math.floor(distance / 5));
        
        for (let i = 0; i <= steps; i++) {
            const x = fromX + (dx * i / steps);
            const y = fromY + (dy * i / steps);
            const size = 10 + Math.random() * 15;
            
            // Create gradient for fire-like effect
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
            gradient.addColorStop(0, 'rgba(255, 255, 100, 1)');
            gradient.addColorStop(0.3, 'rgba(255, 150, 50, 0.9)');
            gradient.addColorStop(0.6, 'rgba(255, 50, 0, 0.7)');
            gradient.addColorStop(1, 'rgba(100, 0, 0, 0)');
            
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Add some embers
            if (Math.random() < 0.3) {
                const emberX = x + (Math.random() - 0.5) * 30;
                const emberY = y + (Math.random() - 0.5) * 30;
                const emberSize = 1 + Math.random() * 3;
                
                ctx.beginPath();
                ctx.arc(emberX, emberY, emberSize, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 255, 100, 0.8)';
                ctx.fill();
            }
        }
    }
    
    // Galaxy effect
    function drawGalaxyDot(x, y) {
        const size = 25;
        
        // Draw glow
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
        gradient.addColorStop(0, 'rgba(180, 100, 255, 0.9)');
        gradient.addColorStop(0.5, 'rgba(100, 50, 200, 0.6)');
        gradient.addColorStop(1, 'rgba(50, 0, 150, 0)');
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Add stars
        for (let i = 0; i < 10; i++) {
            const starX = x + (Math.random() - 0.5) * size * 2;
            const starY = y + (Math.random() - 0.5) * size * 2;
            const starSize = 1 + Math.random() * 2;
            
            ctx.beginPath();
            ctx.arc(starX, starY, starSize, 0, Math.PI * 2);
            ctx.fillStyle = 'white';
            ctx.fill();
        }
    }
    
    function drawGalaxyLine(fromX, fromY, toX, toY) {
        const dx = toX - fromX;
        const dy = toY - fromY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.max(1, Math.floor(distance / 10));
        
        for (let i = 0; i <= steps; i++) {
            const x = fromX + (dx * i / steps);
            const y = fromY + (dy * i / steps);
            const size = 15 + Math.random() * 10;
            
            // Draw nebula effect
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
            gradient.addColorStop(0, 'rgba(180, 100, 255, 0.7)');
            gradient.addColorStop(0.5, 'rgba(100, 50, 200, 0.5)');
            gradient.addColorStop(1, 'rgba(50, 0, 150, 0)');
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Add stars
            for (let j = 0; j < 5; j++) {
                const starX = x + (Math.random() - 0.5) * size * 2;
                const starY = y + (Math.random() - 0.5) * size * 2;
                const starSize = 1 + Math.random() * 2;
                
                ctx.beginPath();
                ctx.arc(starX, starY, starSize, 0, Math.PI * 2);
                ctx.fillStyle = 'white';
                ctx.fill();
            }
        }
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
        const toolbarHeight = document.querySelector('#magic-mode .toolbar')?.offsetHeight || 100;
        
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
        
        console.log('Magic canvas resized to:', canvas.width, 'x', canvas.height);
    }
    
    // Handle magic effect button clicks
    function handleMagicClick(e) {
        const button = e.currentTarget;
        currentMagic = button.getAttribute('data-magic');
        
        console.log('Magic effect changed to:', currentMagic);
        
        // Highlight active button
        document.querySelectorAll('#magic-mode .tool-button[data-magic]').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');
    }
    
    // Handle tool button clicks
    function handleToolClick(e) {
        const button = e.currentTarget;
        const tool = button.getAttribute('data-tool');
        
        console.log('Tool clicked:', tool);
        
        // Handle different tools
        switch (tool) {
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
            Storage.savePainting(imageData, thumbnailData, 'magic');
            
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
        document.getElementById('magic-mode').appendChild(feedback);
        
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
            console.log('Magic mode initialized');
            return this;
        },
        
        activate: function() {
            isActive = true;
            
            // Make sure canvas is sized correctly when mode becomes active
            resizeCanvas();
            
            // Set default selected magic tool
            const defaultMagicBtn = document.querySelector('#magic-mode .tool-button[data-magic="rainbow"]');
            if (defaultMagicBtn) {
                defaultMagicBtn.classList.add('active');
                currentMagic = 'rainbow';
            }
            
            // Reset hue for rainbow effect
            hue = 0;
            
            console.log('Magic mode activated with effect:', currentMagic);
        },
        
        deactivate: function() {
            isActive = false;
            console.log('Magic mode deactivated');
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