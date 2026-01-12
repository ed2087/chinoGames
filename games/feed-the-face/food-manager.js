/* ============================================
   FOOD-MANAGER.JS - Food Shelf & Drag/Drop
   Purpose: Manages food items, dragging, and feeding
   ============================================ */

class FoodManager {
    constructor(shelfId, dropZoneId, plateItemsId) {
        this.shelf = document.getElementById(shelfId);
        this.dropZone = document.getElementById(dropZoneId);
        this.plateItems = document.getElementById(plateItemsId);
        
        // Food database (using your 700+ food assets)
        // Generate all food items dynamically
        this.allFoodItems = this.generateAllFoodItems();
        
        // Current round food
        this.currentFood = null;
        this.availableFood = [];
        
        // Drag state
        this.isDragging = false;
        this.draggedElement = null;
        this.dragClone = null;
        this.touchIdentifier = null;
        
        // Fed items
        this.fedItems = [];
        
        // Callbacks
        this.onFoodFed = null;
        this.onFoodDragStart = null;
        this.onFoodDragMove = null;
        this.onFoodDragEnd = null;
    }
    
    /* ============================================
       INITIALIZATION
       ============================================ */
    
    generateAllFoodItems() {
        // Generate list of all food items (food1.png through food50.png)
        const allFood = [];
        for (let i = 1; i <= 50; i++) {
            allFood.push(`food${i}.png`);
        }
        return allFood;
    }
    
    loadFoodForRound() {
        // Pick one random food item for this round
        this.currentFood = this.allFoodItems[Math.floor(Math.random() * this.allFoodItems.length)];
        
        // Create shelf with 12-15 unique items
        this.availableFood = [];
        const numItems = 15;
        
        // Add the correct food multiple times (5-7 times)
        const correctFoodCount = 5 + Math.floor(Math.random() * 3);
        for (let i = 0; i < correctFoodCount; i++) {
            this.availableFood.push(this.currentFood);
        }
        
        // Fill rest with random DIFFERENT foods (no repeats)
        const usedFood = new Set([this.currentFood]);
        
        while (this.availableFood.length < numItems) {
            const randomFood = this.allFoodItems[Math.floor(Math.random() * this.allFoodItems.length)];
            
            // Only add if not already used
            if (!usedFood.has(randomFood)) {
                this.availableFood.push(randomFood);
                usedFood.add(randomFood);
            }
        }
        
        // Shuffle so correct food is mixed in
        this.shuffleArray(this.availableFood);
        
        this.renderFoodShelf();
        
        console.log(`🎯 Correct food: ${this.currentFood}`);
        console.log(`🍪 Shelf has ${this.availableFood.length} items (${correctFoodCount} correct)`);
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    /* ============================================
       RENDERING
       ============================================ */
    
    renderFoodShelf() {
        this.shelf.innerHTML = '';
        
        this.availableFood.forEach((foodImage, index) => {
            const foodItem = this.createFoodItem(foodImage, index);
            this.shelf.appendChild(foodItem);
        });
    }
    
    createFoodItem(foodImage, index) {
        const item = document.createElement('div');
        item.className = 'food-item';
        item.dataset.foodImage = foodImage;
        item.dataset.index = index;
        
        const img = document.createElement('img');
        img.src = `../../assets/food/${foodImage}`;
        img.alt = 'Food item';
        img.draggable = false;
        
        item.appendChild(img);
        
        // Add event listeners
        this.addDragListeners(item);
        
        return item;
    }
    
    /* ============================================
       DRAG & DROP - TOUCH SUPPORT
       ============================================ */
    
    addDragListeners(element) {
        // Touch events (primary for tablets)
        element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        
        // Mouse events (fallback for desktop testing)
        element.addEventListener('mousedown', this.handleMouseDown.bind(this));
        element.addEventListener('mousemove', this.handleMouseMove.bind(this));
        element.addEventListener('mouseup', this.handleMouseUp.bind(this));
    }
    
    /* ============================================
       TOUCH HANDLERS
       ============================================ */
    
    handleTouchStart(e) {
        e.preventDefault();
        
        if (this.isDragging) return;
        
        const touch = e.touches[0];
        const element = e.currentTarget;
        
        this.startDrag(element, touch.clientX, touch.clientY);
        this.touchIdentifier = touch.identifier;
        
        // Callback for face tracking
        if (this.onFoodDragStart) {
            this.onFoodDragStart(touch.clientX, touch.clientY);
        }
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        
        if (!this.isDragging) return;
        
        const touch = Array.from(e.touches).find(t => t.identifier === this.touchIdentifier);
        if (!touch) return;
        
        this.updateDrag(touch.clientX, touch.clientY);
        
        // Callback for face tracking
        if (this.onFoodDragMove) {
            this.onFoodDragMove(touch.clientX, touch.clientY);
        }
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        
        if (!this.isDragging) return;
        
        const touch = Array.from(e.changedTouches).find(t => t.identifier === this.touchIdentifier);
        if (!touch) return;
        
        this.endDrag(touch.clientX, touch.clientY);
        this.touchIdentifier = null;
        
        // Callback
        if (this.onFoodDragEnd) {
            this.onFoodDragEnd();
        }
    }
    
    /* ============================================
       MOUSE HANDLERS (Desktop Testing)
       ============================================ */
    
    handleMouseDown(e) {
        if (this.isDragging) return;
        
        const element = e.currentTarget;
        this.startDrag(element, e.clientX, e.clientY);
        
        // Add global listeners
        document.addEventListener('mousemove', this.boundMouseMove);
        document.addEventListener('mouseup', this.boundMouseUp);
        
        if (this.onFoodDragStart) {
            this.onFoodDragStart(e.clientX, e.clientY);
        }
    }
    
    handleMouseMove(e) {
        if (!this.isDragging) return;
        
        this.updateDrag(e.clientX, e.clientY);
        
        if (this.onFoodDragMove) {
            this.onFoodDragMove(e.clientX, e.clientY);
        }
    }
    
    handleMouseUp(e) {
        if (!this.isDragging) return;
        
        this.endDrag(e.clientX, e.clientY);
        
        // Remove global listeners
        document.removeEventListener('mousemove', this.boundMouseMove);
        document.removeEventListener('mouseup', this.boundMouseUp);
        
        if (this.onFoodDragEnd) {
            this.onFoodDragEnd();
        }
    }
    
    // Bind mouse handlers for global listeners
    boundMouseMove = this.handleMouseMove.bind(this);
    boundMouseUp = this.handleMouseUp.bind(this);
    
    /* ============================================
       DRAG MECHANICS
       ============================================ */
    
    startDrag(element, x, y) {
        this.isDragging = true;
        this.draggedElement = element;
        
        // Create visual clone
        this.dragClone = element.cloneNode(true);
        this.dragClone.style.position = 'fixed';
        this.dragClone.style.zIndex = '10000';
        this.dragClone.style.pointerEvents = 'none';
        this.dragClone.style.transform = 'scale(1.2) rotate(5deg)';
        this.dragClone.style.transition = 'none';
        
        const rect = element.getBoundingClientRect();
        this.dragClone.style.width = rect.width + 'px';
        this.dragClone.style.height = rect.height + 'px';
        this.dragClone.style.left = (x - rect.width / 2) + 'px';
        this.dragClone.style.top = (y - rect.height / 2) + 'px';
        
        document.body.appendChild(this.dragClone);
        
        // Hide original
        element.style.opacity = '0.3';
        element.classList.add('dragging');
    }
    
    updateDrag(x, y) {
        if (!this.dragClone) return;
        
        const rect = this.dragClone.getBoundingClientRect();
        this.dragClone.style.left = (x - rect.width / 2) + 'px';
        this.dragClone.style.top = (y - rect.height / 2) + 'px';
        
        // Check if over drop zone
        this.checkDropZoneCollision(x, y);
    }
    
    endDrag(x, y) {
        // Check if dropped on face or drop zone
        const droppedOnTarget = this.checkDropZoneCollision(x, y);
        
        if (droppedOnTarget) {
            // Successfully fed
            this.feedFood(this.draggedElement.dataset.foodImage);
        }
        
        // Cleanup
        if (this.dragClone) {
            this.dragClone.remove();
            this.dragClone = null;
        }
        
        if (this.draggedElement) {
            this.draggedElement.style.opacity = '1';
            this.draggedElement.classList.remove('dragging');
            this.draggedElement = null;
        }
        
        this.isDragging = false;
    }
    
    checkDropZoneCollision(x, y) {
        const dropRect = this.dropZone.getBoundingClientRect();
        
        const isOverDropZone = (
            x >= dropRect.left &&
            x <= dropRect.right &&
            y >= dropRect.top &&
            y <= dropRect.bottom
        );
        
        // Visual feedback
        if (isOverDropZone) {
            this.dropZone.style.background = 'rgba(126, 211, 33, 0.2)';
            this.dropZone.style.transform = 'scale(1.02)';
        } else {
            this.dropZone.style.background = 'var(--drop-zone-bg)';
            this.dropZone.style.transform = 'scale(1)';
        }
        
        return isOverDropZone;
    }
    
    /* ============================================
       FEEDING LOGIC
       ============================================ */
    
    feedFood(foodImage) {
        // Add to fed items
        this.fedItems.push(foodImage);
        
        // Create plate item
        const plateItem = document.createElement('div');
        plateItem.className = 'plate-item';
        
        const img = document.createElement('img');
        img.src = `../../assets/food/${foodImage}`;
        img.alt = 'Fed food';
        
        plateItem.appendChild(img);
        this.plateItems.appendChild(plateItem);
        
        // Callback
        if (this.onFoodFed) {
            this.onFoodFed(foodImage, this.fedItems.length);
        }
        
        // Reset drop zone visual
        this.dropZone.style.background = 'var(--drop-zone-bg)';
        this.dropZone.style.transform = 'scale(1)';
    }
    
    /* ============================================
       RESET & CLEAR
       ============================================ */
    
    reset() {
        this.fedItems = [];
        this.plateItems.innerHTML = '';
        this.loadFoodForRound();
    }
    
    clearPlate() {
        this.fedItems = [];
        this.plateItems.innerHTML = '';
    }
    
    /* ============================================
       GETTERS
       ============================================ */
    
    getFedCount() {
        return this.fedItems.length;
    }
    
    getCurrentFood() {
        return this.currentFood;
    }
    
    getFedItems() {
        return this.fedItems;
    }
}