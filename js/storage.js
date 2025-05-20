// storage.js - Handle local storage functionality

// Configuration
const STORAGE_KEY = 'kidPaintApp';
const MAX_PAINTINGS = 50;

// Storage module
const Storage = (function() {
    // Private variables and functions
    let paintingData = [];
    
    // Initialize storage data
    function init() {
        try {
            console.log('Initializing storage');
            const storedData = localStorage.getItem(STORAGE_KEY);
            if (storedData) {
                paintingData = JSON.parse(storedData);
                console.log(`Loaded ${paintingData.length} paintings from storage`);
            } else {
                console.log('No existing storage data found');
                paintingData = [];
            }
        } catch (error) {
            console.error('Error loading storage data:', error);
            paintingData = [];
        }
    }
    
    // Save paintings data to localStorage
    function saveData() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(paintingData));
            console.log(`Saved ${paintingData.length} paintings to storage`);
            return true;
        } catch (error) {
            console.error('Error saving to storage:', error);
            
            // If we got a quota error, try to remove the oldest painting
            if (error instanceof DOMException && error.name === 'QuotaExceededError') {
                try {
                    // Sort by date and remove oldest
                    if (paintingData.length > 0) {
                        paintingData.sort((a, b) => new Date(a.date) - new Date(b.date));
                        paintingData.shift(); // Remove oldest
                        console.log('Removed oldest painting due to storage limits');
                        return saveData(); // Try saving again
                    }
                } catch (innerError) {
                    console.error('Error handling quota exceeded:', innerError);
                }
            }
            return false;
        }
    }
    
    // Public API
    return {
        // Initialize the storage module
        initialize: function() {
            init();
            return this;
        },
        
        // Get all paintings data
        getAllPaintings: function() {
            return [...paintingData];
        },
        
        // Save a new painting
        savePainting: function(paintingDataUrl, thumbnailDataUrl, mode = 'paint') {
            // Create new painting object
            const newPainting = {
                id: Date.now().toString(),
                date: new Date().toISOString(),
                thumbnail: thumbnailDataUrl,
                image: paintingDataUrl,
                mode: mode
            };
            
            console.log('Saving new painting:', newPainting.id, 'mode:', mode);
            
            // Check if we're at the limit
            if (paintingData.length >= MAX_PAINTINGS) {
                console.log(`Maximum paintings limit reached (${MAX_PAINTINGS}). Removing oldest.`);
                // Remove oldest painting
                paintingData.sort((a, b) => new Date(a.date) - new Date(b.date));
                paintingData.shift(); // Remove oldest
            }
            
            // Add new painting
            paintingData.push(newPainting);
            saveData();
            
            return newPainting.id;
        },
        
        // Get a specific painting by ID
        getPainting: function(id) {
            const painting = paintingData.find(painting => painting.id === id) || null;
            if (painting) {
                console.log('Retrieved painting:', id);
            } else {
                console.log('Painting not found:', id);
            }
            return painting;
        },
        
        // Delete a painting by ID
        deletePainting: function(id) {
            const initialLength = paintingData.length;
            paintingData = paintingData.filter(painting => painting.id !== id);
            
            if (paintingData.length < initialLength) {
                console.log('Deleted painting:', id);
                saveData();
                return true;
            }
            console.log('Nothing to delete, painting not found:', id);
            return false;
        },
        
        // Generate thumbnail from canvas
        generateThumbnail: function(canvas, width = 120, height = 120) {
            return new Promise((resolve) => {
                try {
                    // Create temporary canvas for thumbnail
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = width;
                    tempCanvas.height = height;
                    const ctx = tempCanvas.getContext('2d');
                    
                    // Draw the main canvas content onto the thumbnail canvas
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, width, height);
                    ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, width, height);
                    
                    // Convert to data URL and resolve promise
                    const thumbnailUrl = tempCanvas.toDataURL('image/png');
                    console.log('Thumbnail generated, size:', thumbnailUrl.length);
                    resolve(thumbnailUrl);
                } catch (error) {
                    console.error('Error generating thumbnail:', error);
                    // Create a simple colored square as fallback
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = width;
                    tempCanvas.height = height;
                    const ctx = tempCanvas.getContext('2d');
                    ctx.fillStyle = '#FF5E5E';
                    ctx.fillRect(0, 0, width, height);
                    resolve(tempCanvas.toDataURL('image/png'));
                }
            });
        }
    };
})();