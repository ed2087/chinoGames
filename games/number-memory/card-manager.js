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
        this.totalPairs = 0;
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
    
    // `items` can be plain numbers (classic mode) or Pokemon objects
    // {id, name, spriteUrl} (Pokemon mode) - both render and match correctly.
    createCards(items) {
        console.log(`🃏 Creating cards for:`, items);

        // Clear existing cards
        this.clearCards();

        // Create pairs (2 of each item)
        const cardItems = [...items, ...items];
        this.totalPairs = items.length;

        // Shuffle
        this.shuffleArray(cardItems);

        // Create card elements
        cardItems.forEach((item, index) => {
            const card = this.createCardElement(item, index);
            this.container.appendChild(card);
            this.cards.push(card);
        });

        console.log('✅ Cards created and shuffled');
    }

    createCardElement(item, index) {
        const card = document.createElement('div');
        card.className = 'card';

        const isPokemon = item !== null && typeof item === 'object';
        const key = isPokemon ? item.id : item;

        card.dataset.key = key;
        card.dataset.index = index;
        if (isPokemon) {
            card.dataset.name = item.name;
            if (item.cryUrl) card.dataset.cryUrl = item.cryUrl;
        }

        const faceContent = isPokemon
            ? `<img src="${item.spriteUrl}" alt="${item.name}" class="card-pokemon-img" draggable="false">`
            : `<div class="card-number">${item}</div>`;

        card.innerHTML = `
            <div class="card-inner">
                <div class="card-back">
                    <div class="card-back-content"></div>
                </div>
                <div class="card-face card-face-color-${index % 6}">
                    ${faceContent}
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

        const key = card.dataset.key;
        const name = card.dataset.name || null;
        const cryUrl = card.dataset.cryUrl || null;
        console.log(`🔄 Flipped card: ${name || key}`);

        if (this.onCardFlipped) {
            this.onCardFlipped(key, name, cryUrl);
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
        const key1 = card1.dataset.key;
        const key2 = card2.dataset.key;

        console.log(`🎯 Checking: ${key1} vs ${key2}`);

        if (key1 === key2) {
            // Match!
            this.handleMatch(card1, card2, key1, card1.dataset.name || null, card1.dataset.cryUrl || null);
        } else {
            // No match
            this.handleMismatch(card1, card2, key1, key2);
        }
    }

    handleMatch(card1, card2, key, name, cryUrl) {
        console.log(`✅ Match found: ${name || key}`);

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
                this.onMatch(key, this.matchedPairs, name, cryUrl);
            }

            // Check if all matched
            if (this.matchedPairs === this.totalPairs) {
                setTimeout(() => {
                    if (this.onAllMatched) {
                        this.onAllMatched();
                    }
                }, 500);
            }

        }, 500);
    }

    handleMismatch(card1, card2, key1, key2) {
        console.log(`❌ No match: ${key1} vs ${key2}`);

        // Shake cards
        card1.classList.add('wrong');
        card2.classList.add('wrong');

        setTimeout(() => {
            card1.classList.remove('wrong');
            card2.classList.remove('wrong');
        }, 500);

        // Callback
        if (this.onMismatch) {
            this.onMismatch(key1, key2);
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
        this.totalPairs = 0;
        this.isChecking = false;
    }
    
    reset() {
        this.clearCards();
    }
    
    getMatchedCount() {
        return this.matchedPairs;
    }
}