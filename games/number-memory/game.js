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
        this.cardManager.onCardFlipped = (key, name, cryUrl) => {
            this.onCardFlipped(key, name, cryUrl);
        };

        this.cardManager.onMatch = (key, matchedCount, name, cryUrl) => {
            this.onMatch(key, matchedCount, name, cryUrl);
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
    
    async startGame() {
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
        await this.startRound();
    }

    async startRound() {
        console.log(`🎯 Round ${this.round}`);

        // Clear the board immediately so nothing from the previous round
        // lingers while the next Pokemon are being fetched.
        this.cardManager.clearCards();

        const items = await this.getPokemonForRound();

        console.log('📋 Cards for this round:', items);

        // Create cards
        this.cardManager.createCards(items);

        // No round-start voice line - it just repeats every round. The
        // cry-on-flip and name-on-match sounds are the only voice cues now.
    }

    // Pokemon are the primary mode. If PokeAPI is unreachable (offline, etc.)
    // this quietly falls back to the original number cards so the game
    // still works.
    async getPokemonForRound() {
        try {
            const list = await PokemonSource.fetchRandomUnique(3);
            if (list.length === 3) return list;
            console.warn('Only got', list.length, 'Pokemon, falling back to numbers');
        } catch (err) {
            console.warn('Pokemon fetch failed, falling back to numbers:', err);
        }
        return this.getNumbersForRound();
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
    
    // A 4-year-old flips cards fast - full sentences on every tap just get
    // cut off and sound broken. Flips get a quick, non-speech cry instead;
    // speech is saved for the one moment that deserves it: a match.
    onCardFlipped(key, name, cryUrl) {
        console.log(`🔄 Card flipped: ${name || key}`);

        if (cryUrl) {
            this.playCry(cryUrl);
        } else if (this.audioSystem && !name) {
            this.audioSystem.speakNumber(parseInt(key));
        }
    }

    onMatch(key, matchedCount, name, cryUrl) {
        console.log(`✅ Match! ${name || key}, Total: ${matchedCount}/${this.cardManager.totalPairs}`);

        // Update UI
        this.updatePairs(matchedCount);

        // Add score
        this.score += 100;
        this.updateScore();

        if (cryUrl) {
            this.playCry(cryUrl);
        }

        // Say the name - short, so it's over before the next flip could cut it off
        if (this.audioSystem) {
            const label = name ? this.capitalize(name) : this.getNumberWord(parseInt(key));

            setTimeout(() => {
                this.audioSystem.speak(label, { pitch: 1.3, rate: 0.9 });
            }, 250);
        }
    }

    onMismatch(number1, number2) {
        console.log(`❌ Mismatch: ${number1} vs ${number2}`);
        // No sound here on purpose - the card shake is enough feedback,
        // and a 4-year-old tapping quickly doesn't need a voice line
        // fighting with the next flip's cry.
    }

    playCry(cryUrl) {
        try {
            const audio = new Audio(cryUrl);
            audio.volume = 0.8;
            audio.play().catch(err => console.warn('Pokemon cry playback blocked:', err));
        } catch (err) {
            console.warn('Pokemon cry failed:', err);
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
        const total = this.cardManager.totalPairs || 3;
        this.pairsValue.textContent = `${count}/${total}`;
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
    
    async nextRound() {
        console.log('➡️ Next round...');

        // Hide win overlay
        this.winOverlay.classList.add('hidden');

        // Increment round
        this.round++;

        // Reset pairs display
        this.updatePairs(0);

        // Start new round
        this.isPlaying = true;
        await this.startRound();
    }

    /* ============================================
       UTILITIES
       ============================================ */

    getNumberWord(num) {
        const words = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN'];
        return words[num] || num.toString();
    }

    capitalize(text) {
        return text.charAt(0).toUpperCase() + text.slice(1);
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