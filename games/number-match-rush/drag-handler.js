/* ============================================
   DRAG-HANDLER.JS - Handles Drag & Drop
   Purpose: Manages dragging numbers to target boxes
   ============================================ */

class DragHandler {
    constructor(centerAreaId) {
        this.centerArea = document.getElementById(centerAreaId);
        this.isDragging = false;
        this.draggedElement = null;
        this.dragClone = null;
        this.touchIdentifier = null;
        this.currentTargetBox = null;
        
        // Callbacks
        this.onCorrectMatch = null;
        this.onWrongMatch = null;
        this.onNumberPickup = null;
        
        this.setupGlobalListeners();
    }
    
    /* ============================================
       INITIALIZATION
       ============================================ */
    
    setupGlobalListeners() {
        // Global mouse move listener
        document.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                this.handleDragMove(e);
            }
        });
        
        // Global mouse/touch end listeners
        document.addEventListener('mouseup', (e) => this.handleDragEnd(e));
        document.addEventListener('touchend', (e) => this.handleDragEnd(e));
    }
    
    attachToNumber(element) {
        // Touch events
        element.addEventListener('touchstart', (e) => this.handleDragStart(e), { passive: false });
        element.addEventListener('touchmove', (e) => this.handleDragMove(e), { passive: false });
        
        // Mouse events
        element.addEventListener('mousedown', (e) => this.handleDragStart(e));
    }
    
    /* ============================================
       DRAG START
       ============================================ */
    
    handleDragStart(e) {
        e.preventDefault();
        
        if (this.isDragging) return;
        
        const element = e.currentTarget;
        const number = parseInt(element.dataset.number);
        
        // Get touch or mouse position
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        if (e.touches) {
            this.touchIdentifier = e.touches[0].identifier;
        }
        
        this.startDrag(element, clientX, clientY, number);
    }
    
    startDrag(element, x, y, number) {
        this.isDragging = true;
        this.draggedElement = element;
        
        // Callback - speak number
        if (this.onNumberPickup) {
            this.onNumberPickup(number);
        }
        
        // Create visual clone
        this.dragClone = element.cloneNode(true);
        this.dragClone.classList.add('dragging');
        this.dragClone.style.position = 'fixed';
        this.dragClone.style.zIndex = '1000';
        this.dragClone.style.pointerEvents = 'none';
        this.dragClone.style.transition = 'none';
        
        const rect = element.getBoundingClientRect();
        this.dragClone.style.width = rect.width + 'px';
        this.dragClone.style.height = rect.height + 'px';
        this.dragClone.style.left = (x - rect.width / 2) + 'px';
        this.dragClone.style.top = (y - rect.height / 2) + 'px';
        
        document.body.appendChild(this.dragClone);
        
        // Hide original
        element.style.opacity = '0.3';
        
        console.log(`🎯 Dragging number ${number}`);
    }
    
    /* ============================================
       DRAG MOVE
       ============================================ */
    
    handleDragMove(e) {
        if (!this.isDragging) return;
        
        // Get position
        let clientX, clientY;
        
        if (e.touches) {
            e.preventDefault();
            const touch = Array.from(e.touches).find(t => t.identifier === this.touchIdentifier);
            if (!touch) return;
            clientX = touch.clientX;
            clientY = touch.clientY;
        } else {
            // Mouse event
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        // Update clone position
        if (this.dragClone) {
            const rect = this.dragClone.getBoundingClientRect();
            this.dragClone.style.left = (clientX - rect.width / 2) + 'px';
            this.dragClone.style.top = (clientY - rect.height / 2) + 'px';
        }
        
        // Check if over target box
        this.checkTargetBoxCollision(clientX, clientY);
    }
    
    /* ============================================
       DRAG END
       ============================================ */
    
    handleDragEnd(e) {
        if (!this.isDragging) return;
        
        // Get final position
        let clientX, clientY;
        
        if (e.changedTouches) {
            const touch = Array.from(e.changedTouches).find(t => t.identifier === this.touchIdentifier);
            if (!touch) return;
            clientX = touch.clientX;
            clientY = touch.clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        // Check if dropped on target
        const targetBox = this.getTargetBoxAt(clientX, clientY);
        const draggedNumber = parseInt(this.draggedElement.dataset.number);
        
        if (targetBox) {
            const targetNumber = parseInt(targetBox.dataset.number);
            
            // REMOVED: && !targetBox.classList.contains('filled')
            // Now allows duplicates!
            if (draggedNumber === targetNumber) {
                // Correct match!
                this.handleCorrectMatch(targetBox, draggedNumber);
            } else {
                // Wrong match
                this.handleWrongMatch(targetBox, draggedNumber, targetNumber);
            }
        } else {
            // Dropped outside - return to original position
            this.returnToCenter();
        }
        
        // Cleanup
        this.cleanup();
    }
    
    /* ============================================
       COLLISION DETECTION
       ============================================ */
    
    checkTargetBoxCollision(x, y) {
        // Remove previous highlight
        if (this.currentTargetBox) {
            this.currentTargetBox.classList.remove('drag-over');
            this.currentTargetBox = null;
        }
        
        // Check if over any target box
        const targetBox = this.getTargetBoxAt(x, y);
        
        // REMOVED: && !targetBox.classList.contains('filled')
        // Now highlights box even if already filled
        if (targetBox) {
            targetBox.classList.add('drag-over');
            this.currentTargetBox = targetBox;
        }
    }
    
    getTargetBoxAt(x, y) {
        const targetBoxes = document.querySelectorAll('.target-box');
        
        for (const box of targetBoxes) {
            const rect = box.getBoundingClientRect();
            
            if (
                x >= rect.left &&
                x <= rect.right &&
                y >= rect.top &&
                y <= rect.bottom
            ) {
                return box;
            }
        }
        
        return null;
    }
    
    /* ============================================
       MATCH HANDLING
       ============================================ */
    
    handleCorrectMatch(targetBox, number) {
        console.log(`✅ Correct match: ${number}`);
        
        // Fill the box (allows duplicates)
        targetBox.classList.add('filled');
        targetBox.classList.remove('drag-over');
        
        // Remove dragged element
        if (this.draggedElement && this.draggedElement.parentNode) {
            this.draggedElement.remove();
        }
        
        // Callback
        if (this.onCorrectMatch) {
            this.onCorrectMatch(number, this.draggedElement);
        }
    }
    
    handleWrongMatch(targetBox, draggedNumber, targetNumber) {
        console.log(`❌ Wrong match: ${draggedNumber} → ${targetNumber}`);
        
        // Shake animation
        targetBox.classList.add('wrong-match');
        setTimeout(() => {
            targetBox.classList.remove('wrong-match', 'drag-over');
        }, 400);
        
        // Return number to center
        this.returnToCenter();
        
        // Callback
        if (this.onWrongMatch) {
            this.onWrongMatch(draggedNumber, targetNumber);
        }
    }
    
    returnToCenter() {
        // Reset original element
        if (this.draggedElement) {
            this.draggedElement.style.opacity = '1';
        }
    }
    
    /* ============================================
       CLEANUP
       ============================================ */
    
    cleanup() {
        // Remove clone
        if (this.dragClone) {
            this.dragClone.remove();
            this.dragClone = null;
        }
        
        // Remove highlight
        if (this.currentTargetBox) {
            this.currentTargetBox.classList.remove('drag-over');
            this.currentTargetBox = null;
        }
        
        // Reset state
        this.isDragging = false;
        this.draggedElement = null;
        this.touchIdentifier = null;
    }
}