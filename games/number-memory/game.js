/* ============================================
   GAME.JS - Main Game Controller
   Number Memory Match
   ============================================ */

class NumberMemoryGame {
    constructor() {
        // Game state
        this.round = 1;
        this.score = 0;
        this.isPlaying = false;
        
        // Number sets for progression
        this.numberSets = [
            [1, 2, 3],      // Round 1
            [4, 5, 6],      // Round 2
            [7, 8, 9],      // Round 3
            [1, 5, 10],     // Round 4
            [2, 6, 8],      // Round 5
            [3, 7, 9],      // Round 6
            // After round 6, pick random 3 numbers
        ];
        
        // Components
        this.cardManager = null;
        this.audioSystem = null;
        
        // DOM elements
        this.startOverlay = document.getElementById('startOverlay');
        this.winOverlay = document.getElementById('winOverlay');
        this.startBtn = document.getElementById('startBtn');
        this.nextRoundBtn = document.getElementById('nextRoundBtn');
        this.homeBtn = document.getElementById('homeBtn');
        this.pairsValue = document.getElementById('pairsValue');
        this.scoreValue = document.getElementById('scoreValue');
        this.finalScore = document.getElementById('finalScore');
        
        this.init();
    }
    
    /* ============================================
       INITIALIZATION
       ============================================ */
    
    async init() {
        console.log('🎮 Initializing Number Memory Game...');
        
        try {
            // Wait for audio system
            await this.waitForAudioSystem();
            
            if (this.audioSystem) {
                console.log('✅ Audio system ready');
            } else {
                console.warn('⚠️ Audio system not available');
            }
            
            // Initialize card manager
            this.cardManager = new CardManager('cardGrid');
            console.log('✅ Card manager initialized');
            
            // Set up callbacks
            this.setupCallbacks();
            
            // Set up event listeners
            this.setupEventListeners();
            
            console.log('✅ Game Ready!');
            
        } catch (error) {
            console.error('❌ Game initialization failed:', error);
        }
    }
    
    async waitForAudioSystem() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 50;
            
            const checkAudio = () => {
                attempts++;
                
                if (window.audioSystem && window.audioSystem.isInitialized) {
                    this.audioSystem = window.audioSystem;
                    resolve();
                } else if (attempts >= maxAttempts) {
                    this.audioSystem = null;
                    resolve();
                } else {
                    setTimeout(checkAudio, 100);
                }
            };
            
            checkAudio();
        });
    }
    
    setupCallbacks() {
        console.log('🔗 Setting up callbacks...');
        
        // Card manager callbacks
        this.cardManager.onCardFlipped = (number) => {
            this.onCardFlipped(number);
        };
        
        this.cardManager.onMatch = (number, matchedCount) => {
            this.onMatch(number, matchedCount);
        };
        
        this.cardManager.onMismatch = (number1, number2) => {
            this.onMismatch(number1, number2);
        };
        
        this.cardManager.onAllMatched = () => {
            this.onAllMatched();
        };
    }
    
    setupEventListeners() {
        console.log('🎯 Setting up event listeners...');
        
        // Start button
        this.startBtn.addEventListener('click', () => {
            this.startGame();
        });
        
        // Next round button
        this.nextRoundBtn.addEventListener('click', () => {
            this.nextRound();
        });
        
        // Home button
        this.homeBtn.addEventListener('click', () => {
            window.location.href = '../../index.html';
        });
    }
    
    /* ============================================
       GAME FLOW
       ============================================ */
    
    startGame() {
        console.log('🎮 Starting game...');
        
        // Hide start overlay
        this.startOverlay.classList.add('hidden');
        
        // Reset state
        this.round = 1;
        this.score = 0;
        this.isPlaying = true;
        
        // Update UI
        this.updateScore();
        this.updatePairs(0);
        
        // Start round
        this.startRound();
    }
    
    startRound() {
        console.log(`🎯 Round ${this.round}`);
        
        // Get numbers for this round
        const numbers = this.getNumbersForRound();
        
        console.log(`📋 Numbers: ${numbers.join(', ')}`);
        
        // Create cards
        this.cardManager.createCards(numbers);
        
        // Speak intro
        if (this.audioSystem) {
            setTimeout(() => {
                this.audioSystem.speak('Find the matching pairs!', {
                    pitch: 1.3,
                    rate: 0.8
                });
            }, 500);
        }
    }
    
    getNumbersForRound() {
        // Use predefined sets for first 6 rounds
        if (this.round <= this.numberSets.length) {
            return this.numberSets[this.round - 1];
        }
        
        // After round 6, pick random 3 numbers from 1-10
        const available = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const selected = [];
        
        for (let i = 0; i < 3; i++) {
            const randomIndex = Math.floor(Math.random() * available.length);
            selected.push(available[randomIndex]);
            available.splice(randomIndex, 1);
        }
        
        return selected.sort((a, b) => a - b);
    }
    
    /* ============================================
       CARD CALLBACKS
       ============================================ */
    
    onCardFlipped(number) {
        console.log(`🔄 Card flipped: ${number}`);
        
        // Speak number
        if (this.audioSystem) {
            this.audioSystem.speakNumber(number);
        }
    }
    
    onMatch(number, matchedCount) {
        console.log(`✅ Match! Number: ${number}, Total: ${matchedCount}/3`);
        
        // Update UI
        this.updatePairs(matchedCount);
        
        // Add score
        this.score += 100;
        this.updateScore();
        
        // Speak celebration
        if (this.audioSystem) {
            const numberWord = this.getNumberWord(number);
            
            setTimeout(() => {
                this.audioSystem.speak(`Great! You found TWO ${numberWord}s!`, {
                    pitch: 1.3,
                    rate: 0.8
                });
            }, 600);
        }
    }
    
    onMismatch(number1, number2) {
        console.log(`❌ Mismatch: ${number1} vs ${number2}`);
        
        // Speak feedback
        if (this.audioSystem) {
            setTimeout(() => {
                this.audioSystem.speak('Try again!', {
                    pitch: 1.1,
                    rate: 0.8
                });
            }, 600);
        }
    }
    
    onAllMatched() {
        console.log('🎉 All pairs matched!');
        
        this.isPlaying = false;
        
        // Bonus points for completing round
        this.score += 200;
        this.updateScore();
        
        // Show win overlay
        setTimeout(() => {
            this.showWinScreen();
        }, 800);
    }
    
    /* ============================================
       UI UPDATES
       ============================================ */
    
    updatePairs(count) {
        this.pairsValue.textContent = `${count}/3`;
    }
    
    updateScore() {
        this.scoreValue.textContent = this.score;
    }
    
    showWinScreen() {
        this.finalScore.textContent = this.score;
        this.winOverlay.classList.remove('hidden');
        
        // Speak celebration
        if (this.audioSystem) {
            setTimeout(() => {
                this.audioSystem.speak('You matched all the pairs! Amazing!', {
                    pitch: 1.4,
                    rate: 0.8
                });
            }, 300);
        }
        
        // Confetti
        this.createConfetti();
    }
    
    nextRound() {
        console.log('➡️ Next round...');
        
        // Hide win overlay
        this.winOverlay.classList.add('hidden');
        
        // Increment round
        this.round++;
        
        // Reset pairs display
        this.updatePairs(0);
        
        // Start new round
        this.isPlaying = true;
        this.startRound();
    }
    
    /* ============================================
       UTILITIES
       ============================================ */
    
    getNumberWord(num) {
        const words = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN'];
        return words[num] || num.toString();
    }
    
    /* ============================================
       CONFETTI EFFECT
       ============================================ */
    
    createConfetti() {
        const colors = ['#FF6B6B', '#FFA500', '#FFD93D', '#4CAF50', '#2196F3', '#9C27B0'];
        const confettiCount = 50;
        
        for (let i = 0; i < confettiCount; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.style.position = 'fixed';
                confetti.style.width = '10px';
                confetti.style.height = '10px';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.left = Math.random() * window.innerWidth + 'px';
                confetti.style.top = '-20px';
                confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
                confetti.style.pointerEvents = 'none';
                confetti.style.zIndex = '10001';
                
                document.body.appendChild(confetti);
                
                const duration = 2000 + Math.random() * 1000;
                const rotation = Math.random() * 360;
                const xMovement = (Math.random() - 0.5) * 200;
                
                confetti.animate([
                    {
                        transform: 'translateY(0) translateX(0) rotate(0deg)',
                        opacity: 1
                    },
                    {
                        transform: `translateY(${window.innerHeight}px) translateX(${xMovement}px) rotate(${rotation}deg)`,
                        opacity: 0
                    }
                ], {
                    duration: duration,
                    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                });
                
                setTimeout(() => {
                    confetti.remove();
                }, duration);
                
            }, i * 30);
        }
    }
}

/* ============================================
   START GAME WHEN DOM READY
   ============================================ */

window.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 DOM Ready - Initializing game...');
    window.game = new NumberMemoryGame();
});