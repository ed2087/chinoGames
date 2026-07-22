/* ============================================
   COUNTING-BOX.JS - Food Items Grid
   Purpose: Manages the counting box with food items
   ============================================ */

class CountingBox {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.items = [];
        this.currentCount = 0;
        this.totalItems = 0;
        this.isCountingComplete = false;
        
        // Generate all food items
        this.allFoodItems = this.generateAllFoodItems();
        
        // Callbacks
        this.onItemCounted = null;
        this.onCountingComplete = null;
    }
    
    /* ============================================
       INITIALIZATION
       ============================================ */
    
    generateAllFoodItems() {
        const allFood = [];
        for (let i = 1; i <= 30; i++) {
            allFood.push(`food${i}.png`);
        }
        return allFood;
    }
    
    loadRound(number) {
        this.currentCount = 0;
        this.totalItems = number;
        this.isCountingComplete = false;
        
        // Pick random food item for this round
        const foodItem = this.allFoodItems[Math.floor(Math.random() * this.allFoodItems.length)];
        
        // Clear container
        this.container.innerHTML = '';
        this.items = [];
        
        // Create food items
        for (let i = 0; i < number; i++) {
            const item = this.createFoodItem(foodItem, i);
            this.container.appendChild(item);
            this.items.push(item);
        }
        
        console.log(`📦 Created ${number} items`);
    }
    
    createFoodItem(foodImage, index) {
        const item = document.createElement('div');
        item.className = 'food-item';
        item.dataset.index = index;
        item.dataset.counted = 'false';
        
        const img = document.createElement('img');
        img.src = `../../assets/food/${foodImage}`;
        img.alt = 'Food item';
        img.draggable = false;
        
        item.appendChild(img);
        
        // Add click listener
        item.addEventListener('click', () => this.handleItemClick(item, index));
        
        return item;
    }
    
    /* ============================================
       COUNTING LOGIC
       ============================================ */
    
    handleItemClick(item, index) {
        // Prevent clicking already counted items
        if (item.dataset.counted === 'true') {
            return;
        }
        
        // Prevent skipping items (must count in order)
        if (parseInt(item.dataset.index) !== this.currentCount) {
            // Flash the correct item to count next
            const correctItem = this.items[this.currentCount];
            correctItem.classList.add('pulse-hint');
            setTimeout(() => {
                correctItem.classList.remove('pulse-hint');
            }, 500);
            return;
        }
        
        // Count this item
        this.currentCount++;
        item.dataset.counted = 'true';
        
        // Add visual feedback
        item.classList.add('counted', 'counting');
        setTimeout(() => {
            item.classList.remove('counting');
        }, 500);
        
        // Add count number badge
        const countBadge = document.createElement('div');
        countBadge.className = 'count-number';
        countBadge.textContent = this.currentCount;
        item.appendChild(countBadge);
        
        console.log(`✅ Counted: ${this.currentCount}/${this.totalItems}`);
        
        // Callback for voice
        if (this.onItemCounted) {
            this.onItemCounted(this.currentCount, this.currentCount === this.totalItems);
        }
        
        // Check if counting complete
        if (this.currentCount === this.totalItems) {
            this.completeRound();
        }
    }
    
    completeRound() {
        this.isCountingComplete = true;
        
        console.log('🎉 Counting complete!');
        
        // Make all items pulse together
        setTimeout(() => {
            this.items.forEach(item => {
                item.classList.add('pulse-all');
            });
            
            // Pulse the box border
            this.container.classList.add('pulse-border');
            
        }, 500);
        
        // Callback
        if (this.onCountingComplete) {
            this.onCountingComplete(this.totalItems);
        }
    }
    
    /* ============================================
       RESET & UTILITIES
       ============================================ */
    
    reset() {
        this.items.forEach(item => {
            item.classList.remove('counted', 'counting', 'pulse-all');
            item.dataset.counted = 'false';
            
            // Remove count badges
            const badge = item.querySelector('.count-number');
            if (badge) badge.remove();
            
            // Reset opacity
            const img = item.querySelector('img');
            if (img) img.style.opacity = '0.3';
        });
        
        this.container.classList.remove('pulse-border');
        this.currentCount = 0;
        this.isCountingComplete = false;
    }
    
    autoCount() {
        // Auto-count for replay
        this.reset();
        
        let delay = 0;
        for (let i = 0; i < this.totalItems; i++) {
            setTimeout(() => {
                this.items[i].click();
            }, delay);
            delay += 600; // 600ms between each count
        }
    }
}
