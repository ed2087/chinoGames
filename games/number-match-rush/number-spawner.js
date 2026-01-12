/* ============================================
   NUMBER-SPAWNER.JS - Spawns Numbers in Center
   Purpose: Manages number spawning with collision detection
   ============================================ */

class NumberSpawner {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.activeNumbers = [];
        this.maxNumbers = 5;
        this.spawnInterval = null;
        this.isSpawning = false;
        
        // Ensure all numbers 1-10 spawn
        this.numbersToSpawn = [];
        this.initializeNumberQueue();
        
        // Spawn timing
        this.minSpawnDelay = 2000; // 2 seconds
        this.maxSpawnDelay = 3000; // 3 seconds
        
        // Collision detection
        this.minDistance = 120; // Minimum distance between numbers
        
        // Callbacks
        this.onNumberSpawned = null;
    }
    
    /* ============================================
       NUMBER QUEUE MANAGEMENT
       ============================================ */
    
    initializeNumberQueue() {
        // Create a queue with all numbers 1-10, shuffled
        this.numbersToSpawn = [];
        for (let i = 1; i <= 10; i++) {
            this.numbersToSpawn.push(i);
        }
        this.shuffleArray(this.numbersToSpawn);
        console.log(`📋 Initial number queue: ${this.numbersToSpawn.join(', ')}`);
    }
    
    getNextNumber() {
        // If queue is empty, refill with 1-10 and shuffle
        if (this.numbersToSpawn.length === 0) {
            console.log('🔄 Refilling number queue...');
            this.initializeNumberQueue();
        }
        
        // Get next number from queue
        return this.numbersToSpawn.shift();
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    /* ============================================
       SPAWNING CONTROL
       ============================================ */
    
    startSpawning() {
        console.log('🎲 Starting number spawning...');
        this.isSpawning = true;
        
        // Spawn first batch immediately
        this.spawnInitialNumbers();
        
        // Set up continuous spawning
        this.scheduleNextSpawn();
    }
    
    stopSpawning() {
        console.log('⏹️ Stopping number spawning...');
        this.isSpawning = false;
        
        if (this.spawnInterval) {
            clearTimeout(this.spawnInterval);
            this.spawnInterval = null;
        }
    }
    
    spawnInitialNumbers() {
        // Spawn 3 numbers at start
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.spawnNumber();
            }, i * 500);
        }
    }
    
    scheduleNextSpawn() {
        if (!this.isSpawning) return;
        
        const delay = Math.random() * (this.maxSpawnDelay - this.minSpawnDelay) + this.minSpawnDelay;
        
        this.spawnInterval = setTimeout(() => {
            if (this.activeNumbers.length < this.maxNumbers) {
                this.spawnNumber();
            }
            this.scheduleNextSpawn();
        }, delay);
    }
    
    /* ============================================
       NUMBER CREATION
       ============================================ */
    
    spawnNumber() {
        if (this.activeNumbers.length >= this.maxNumbers) {
            console.log('⚠️ Max numbers reached, skipping spawn');
            return;
        }
        
        // Get next number from queue (ensures all 1-10 appear)
        const number = this.getNextNumber();
        
        // Find valid position (no collision)
        const position = this.findValidPosition();
        
        if (!position) {
            console.log('⚠️ No valid position found, trying again...');
            // Put number back at end of queue
            this.numbersToSpawn.push(number);
            return;
        }
        
        // Create number element
        const numberElement = this.createNumberElement(number, position);
        
        // Add to container
        this.container.appendChild(numberElement);
        
        // Track active number
        this.activeNumbers.push({
            element: numberElement,
            number: number,
            x: position.x,
            y: position.y
        });
        
        console.log(`✅ Spawned number ${number} at (${position.x}, ${position.y})`);
        
        // Callback
        if (this.onNumberSpawned) {
            this.onNumberSpawned(number, numberElement);
        }
    }
    
    createNumberElement(number, position) {
        const element = document.createElement('div');
        element.className = 'floating-number';
        element.textContent = number;
        element.dataset.number = number;
        
        // Set position
        element.style.left = position.x + 'px';
        element.style.top = position.y + 'px';
        
        // Random animation delay for variety
        element.style.animationDelay = (Math.random() * 2) + 's';
        
        return element;
    }
    
    /* ============================================
       COLLISION DETECTION
       ============================================ */
    
    findValidPosition() {
        const containerRect = this.container.getBoundingClientRect();
        const maxAttempts = 30; // Increased attempts
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            // Random position within container (with padding)
            const padding = 80;
            const x = Math.random() * (containerRect.width - padding * 2) + padding;
            const y = Math.random() * (containerRect.height - padding * 2) + padding;
            
            // Check collision with existing numbers
            if (this.isPositionValid(x, y)) {
                return { x, y };
            }
        }
        
        return null; // No valid position found
    }
    
    isPositionValid(x, y) {
        for (const activeNumber of this.activeNumbers) {
            const distance = Math.sqrt(
                Math.pow(x - activeNumber.x, 2) + 
                Math.pow(y - activeNumber.y, 2)
            );
            
            if (distance < this.minDistance) {
                return false; // Too close to another number
            }
        }
        
        return true; // Position is valid
    }
    
    /* ============================================
       NUMBER REMOVAL
       ============================================ */
    
    removeNumber(element) {
        // Find and remove from active numbers
        const index = this.activeNumbers.findIndex(n => n.element === element);
        
        if (index !== -1) {
            this.activeNumbers.splice(index, 1);
            console.log(`🗑️ Removed number, ${this.activeNumbers.length} remaining`);
        }
        
        // Remove from DOM
        if (element && element.parentNode) {
            element.remove();
        }
    }
    
    /* ============================================
       RESET & CLEANUP
       ============================================ */
    
    reset() {
        console.log('🔄 Resetting spawner...');
        
        // Stop spawning
        this.stopSpawning();
        
        // Remove all numbers
        this.activeNumbers.forEach(n => {
            if (n.element && n.element.parentNode) {
                n.element.remove();
            }
        });
        
        this.activeNumbers = [];
        
        // Reset number queue
        this.initializeNumberQueue();
    }
    
    /* ============================================
       UTILITIES
       ============================================ */
    
    getActiveCount() {
        return this.activeNumbers.length;
    }
    
    hasNumber(number) {
        return this.activeNumbers.some(n => n.number === number);
    }
}