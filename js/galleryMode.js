// galleryMode.js - Gallery mode to view saved paintings

const GalleryMode = (function() {
    // Private variables
    let galleryContainer;
    let longPressTimer = null;
    let longPressThreshold = 800; // ms
    let isActive = false;
    
    // Initialize gallery
    function initGallery() {
        galleryContainer = document.getElementById('gallery-container');
        if (!galleryContainer) {
            console.error('Gallery container not found');
            return;
        }
        
        console.log('Gallery container initialized');
    }
    
    // Set up event listeners
    function setupEventListeners() {
        if (!galleryContainer) {
            console.error('Cannot setup gallery event listeners - container not initialized');
            return;
        }
        
        // Handle thumbnail clicks
        galleryContainer.addEventListener('click', handleThumbnailClick);
        
        // Handle long press for deletion
        galleryContainer.addEventListener('pointerdown', handlePointerDown);
        galleryContainer.addEventListener('pointerup', handlePointerUp);
        galleryContainer.addEventListener('pointercancel', handlePointerUp);
        galleryContainer.addEventListener('pointerleave', handlePointerUp);
        
        console.log('Gallery event listeners set up');
    }
    
    // Load all paintings into gallery
    function loadGallery() {
        if (!galleryContainer || !isActive) return;
        
        // Clear the gallery first
        galleryContainer.innerHTML = '';
        
        try {
            // Get all paintings from storage
            const paintings = Storage.getAllPaintings();
            
            // Sort by date (newest first)
            paintings.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            console.log('Loading gallery with', paintings.length, 'paintings');
            
            // Create thumbnail for each painting
            paintings.forEach((painting) => {
                const thumbnail = document.createElement('div');
                thumbnail.className = 'thumbnail';
                thumbnail.setAttribute('data-id', painting.id);
                
                const img = document.createElement('img');
                img.src = painting.thumbnail;
                img.alt = 'Saved painting';
                
                thumbnail.appendChild(img);
                galleryContainer.appendChild(thumbnail);
            });
            
            // If no paintings, show a message
            if (paintings.length === 0) {
                const emptyMsg = document.createElement('div');
                emptyMsg.className = 'empty-gallery-message';
                emptyMsg.style.width = '100%';
                emptyMsg.style.textAlign = 'center';
                emptyMsg.style.marginTop = '30px';
                emptyMsg.style.fontSize = '80px';
                emptyMsg.textContent = '🖼️';
                galleryContainer.appendChild(emptyMsg);
            }
        } catch (error) {
            console.error('Error loading gallery:', error);
            
            // Show error message
            const errorMsg = document.createElement('div');
            errorMsg.className = 'error-message';
            errorMsg.style.width = '100%';
            errorMsg.style.textAlign = 'center';
            errorMsg.style.marginTop = '30px';
            errorMsg.style.fontSize = '80px';
            errorMsg.textContent = '⚠️';
            galleryContainer.appendChild(errorMsg);
        }
    }
    
    // Handle thumbnail click
    function handleThumbnailClick(e) {
        if (!isActive) return;
        
        // Skip if we're in delete mode (long press)
        if (longPressTimer) return;
        
        const thumbnail = e.target.closest('.thumbnail');
        if (!thumbnail) return;
        
        const paintingId = thumbnail.getAttribute('data-id');
        
        try {
            const painting = Storage.getPainting(paintingId);
            
            if (painting) {
                console.log('Opening painting', paintingId);
                
                // Determine which mode to open in
                switch(painting.mode) {
                    case 'paint':
                        PaintMode.loadPainting(painting);
                        App.switchToMode('paint-mode');
                        break;
                    case 'magic':
                        MagicMode.loadPainting(painting);
                        App.switchToMode('magic-mode');
                        break;
                    default:
                        PaintMode.loadPainting(painting);
                        App.switchToMode('paint-mode');
                }
            } else {
                console.error('Painting not found:', paintingId);
            }
        } catch (error) {
            console.error('Error loading painting:', error);
        }
    }
    
    // Handle pointer down (for long press detection)
    function handlePointerDown(e) {
        if (!isActive) return;
        
        const thumbnail = e.target.closest('.thumbnail');
        if (!thumbnail) return;
        
        // Start long press timer
        clearTimeout(longPressTimer);
        longPressTimer = setTimeout(() => {
            // Show delete confirmation
            showDeleteConfirmation(thumbnail);
        }, longPressThreshold);
    }
    
    // Handle pointer up (cancel long press)
    function handlePointerUp() {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }
    
    // Show delete confirmation overlay
    function showDeleteConfirmation(thumbnail) {
        if (!isActive) return;
        
        const paintingId = thumbnail.getAttribute('data-id');
        
        // First, give visual feedback that we're in delete mode
        thumbnail.classList.add('delete-mode');
        
        // Create delete confirmation overlay
        const overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.zIndex = '1000';
        
        // Show the thumbnail image large
        const img = document.createElement('img');
        img.src = thumbnail.querySelector('img').src;
        img.style.width = '50%';
        img.style.height = 'auto';
        img.style.borderRadius = '20px';
        img.style.border = '10px solid #ffae00';
        img.style.marginBottom = '40px';
        
        // Create delete button
        const deleteButton = document.createElement('button');
        deleteButton.textContent = '🗑️';
        deleteButton.style.width = '120px';
        deleteButton.style.height = '120px';
        deleteButton.style.fontSize = '60px';
        deleteButton.style.borderRadius = '60px';
        deleteButton.style.backgroundColor = '#ff5e5e';
        deleteButton.style.border = '6px solid #ffae00';
        deleteButton.style.marginRight = '20px';
        
        // Create cancel button
        const cancelButton = document.createElement('button');
        cancelButton.textContent = '❌';
        cancelButton.style.width = '120px';
        cancelButton.style.height = '120px';
        cancelButton.style.fontSize = '60px';
        cancelButton.style.borderRadius = '60px';
        cancelButton.style.backgroundColor = '#47a7ff';
        cancelButton.style.border = '6px solid #ffae00';
        cancelButton.style.marginLeft = '20px';
        
        // Create button container
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'center';
        buttonContainer.appendChild(deleteButton);
        buttonContainer.appendChild(cancelButton);
        
        // Add elements to overlay
        overlay.appendChild(img);
        overlay.appendChild(buttonContainer);
        
        // Add overlay to gallery mode
        document.getElementById('gallery-mode').appendChild(overlay);
        
        // Handle button clicks
        deleteButton.addEventListener('click', () => {
            try {
                Storage.deletePainting(paintingId);
                console.log('Painting deleted:', paintingId);
            } catch (error) {
                console.error('Error deleting painting:', error);
            }
            
            overlay.remove();
            loadGallery(); // Reload gallery
        });
        
        cancelButton.addEventListener('click', () => {
            overlay.remove();
            thumbnail.classList.remove('delete-mode');
        });
        
        // Reset long press timer
        longPressTimer = null;
    }
    
    // Public API
    return {
        initialize: function() {
            initGallery();
            setupEventListeners();
            console.log('Gallery mode initialized');
            return this;
        },
        
        activate: function() {
            isActive = true;
            loadGallery();
            console.log('Gallery mode activated');
        },
        
        deactivate: function() {
            isActive = false;
            console.log('Gallery mode deactivated');
        }
    };
})();