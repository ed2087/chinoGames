/* ============================================
   CARD-MANAGER.JS - Card Creation & Flipping
   Purpose: Manages card creation, shuffling, flipping
   ============================================ */

class CardManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.isChecking = false;
        
        // Callbacks
        this.onCardFlipped = null;
        this.onMatch = null;
        this.onMismatch = null;
        this.onAllMatched = null;
    }
    
    /* ============================================
       CARD CREATION
       ============================================ */
    
    createCards(numbers) {
        console.log(`🃏 Creating cards for numbers: ${numbers.join(', ')}`);
        
        // Clear existing cards
        this.clearCards();
        
        // Create pairs (2 of each number)
        const cardNumbers = [...numbers, ...numbers];
        
        // Shuffle
        this.shuffleArray(cardNumbers);
        
        // Create card elements
        cardNumbers.forEach((number, index) => {
            const card = this.createCardElement(number, index);
            this.container.appendChild(card);
            this.cards.push(card);
        });
        
        console.log('✅ Cards created and shuffled');
    }
    
    createCardElement(number, index) {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.number = number;
        card.dataset.index = index;
        
        card.innerHTML = `
            <div class="card-inner">
                <div class="card-back">
                    <div class="card-back-content">?</div>
                </div>
                <div class="card-face">
                    <div class="card-number">${number}</div>
                </div>
            </div>
        `;
        
        // Add click listener
        card.addEventListener('click', () => this.handleCardClick(card));
        
        return card;
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    /* ============================================
       CARD INTERACTION
       ============================================ */
    
    handleCardClick(card) {
        // Prevent clicking if:
        // - Already checking a pair
        // - Card is already flipped
        // - Card is already matched
        // - Already have 2 cards flipped
        if (
            this.isChecking ||
            card.classList.contains('flipped') ||
            card.classList.contains('matched') ||
            this.flippedCards.length >= 2
        ) {
            return;
        }
        
        // Flip the card
        this.flipCard(card);
    }
    
    flipCard(card) {
        card.classList.add('flipped');
        this.flippedCards.push(card);
        
        const number = parseInt(card.dataset.number);
        console.log(`🔄 Flipped card: ${number}`);
        
        // Callback - speak number
        if (this.onCardFlipped) {
            this.onCardFlipped(number);
        }
        
        // Check if we have 2 cards flipped
        if (this.flippedCards.length === 2) {
            this.checkForMatch();
        }
    }
    
    /* ============================================
       MATCHING LOGIC
       ============================================ */
    
    checkForMatch() {
        this.isChecking = true;
        
        const [card1, card2] = this.flippedCards;
        const number1 = parseInt(card1.dataset.number);
        const number2 = parseInt(card2.dataset.number);
        
        console.log(`🎯 Checking: ${number1} vs ${number2}`);
        
        if (number1 === number2) {
            // Match!
            this.handleMatch(card1, card2, number1);
        } else {
            // No match
            this.handleMismatch(card1, card2, number1, number2);
        }
    }
    
    handleMatch(card1, card2, number) {
        console.log(`✅ Match found: ${number}`);
        
        setTimeout(() => {
            // Mark as matched
            card1.classList.add('matched');
            card2.classList.add('matched');
            
            // Increment matched pairs
            this.matchedPairs++;
            
            // Clear flipped cards
            this.flippedCards = [];
            this.isChecking = false;
            
            // Callback
            if (this.onMatch) {
                this.onMatch(number, this.matchedPairs);
            }
            
            // Check if all matched
            if (this.matchedPairs === 3) {
                setTimeout(() => {
                    if (this.onAllMatched) {
                        this.onAllMatched();
                    }
                }, 500);
            }
            
        }, 500);
    }
    
    handleMismatch(card1, card2, number1, number2) {
        console.log(`❌ No match: ${number1} vs ${number2}`);
        
        // Shake cards
        card1.classList.add('wrong');
        card2.classList.add('wrong');
        
        setTimeout(() => {
            card1.classList.remove('wrong');
            card2.classList.remove('wrong');
        }, 500);
        
        // Callback
        if (this.onMismatch) {
            this.onMismatch(number1, number2);
        }
        
        // Flip cards back after delay
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            
            // Clear flipped cards
            this.flippedCards = [];
            this.isChecking = false;
            
        }, 1500); // Give time to remember
    }
    
    /* ============================================
       RESET & UTILITIES
       ============================================ */
    
    clearCards() {
        this.cards.forEach(card => card.remove());
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.isChecking = false;
    }
    
    reset() {
        this.clearCards();
    }
    
    getMatchedCount() {
        return this.matchedPairs;
    }
}