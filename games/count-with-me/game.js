/* ============================================
   GAME.JS - Main Game Controller
   Count With Me - Number Recognition Game
   ============================================ */

class CountWithMeGame {
    constructor() {
        // Game state
        this.currentNumber = 1;
        this.score = 0;
        this.round = 1;
        this.isPlaying = false;
        this.isCounting = false;
        
        // Number range
        this.minNumber = 1;
        this.maxNumber = 10;
        this.currentMaxNumber = 5; // Start with 1-5
        
        // Sequential number tracking
        this.numberSequence = [];
        this.sequenceIndex = 0;
        this.hasCompletedSequence = false;
        
        // Components
        this.countingBox = null;
        this.audioSystem = null;
        
        // DOM elements
        this.bigNumber = document.getElementById('bigNumber');
        this.numberLabel = document.getElementById('numberLabel');
        this.numberDisplay = document.getElementById('numberDisplay');
        this.instruction = document.getElementById('instruction');
        this.scoreValue = document.getElementById('scoreValue');
        this.celebrationOverlay = document.getElementById('celebrationOverlay');
        this.celebrationNumber = document.getElementById('celebrationNumber');
        this.nextRoundBtn = document.getElementById('nextRoundBtn');
        this.loadingScreen = document.getElementById('loadingScreen');
        this.homeBtn = document.getElementById('homeBtn');
        
        this.init();
    }
    
    /* ============================================
       INITIALIZATION
       ============================================ */
    
    async init() {
        console.log('🎮 Initializing Count With Me Game...');
        
        try {
            // Wait for audio system
            console.log('⏳ Waiting for audio system...');
            await this.waitForAudioSystem();
            
            if (this.audioSystem) {
                console.log('✅ Audio system ready');
            } else {
                console.warn('⚠️ Audio system not available - continuing without audio');
            }
            
            // Initialize counting box
            console.log('📦 Creating counting box...');
            this.countingBox = new CountingBox('countingBox');
            console.log('✅ Counting box initialized');
            
            // Set up counting box callbacks
            this.setupCallbacks();
            
            // Set up UI event listeners
            this.setupEventListeners();
            
            // Hide loading screen and start
            console.log('🎬 Starting game...');
            setTimeout(() => {
                this.loadingScreen.classList.add('hidden');
                this.startGame();
            }, 1000);
            
            console.log('✅ Game Ready!');
            
        } catch (error) {
            console.error('❌ Game initialization failed:', error);
            this.loadingScreen.classList.add('hidden');
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
        
        // When item is counted
        this.countingBox.onItemCounted = (count, isLast) => {
            this.onItemCounted(count, isLast);
        };
        
        // When counting is complete
        this.countingBox.onCountingComplete = (total) => {
            this.onCountingComplete(total);
        };
    }
    
    setupEventListeners() {
        console.log('🎯 Setting up event listeners...');
        
        // Next round button
        this.nextRoundBtn.addEventListener('click', () => {
            this.nextRound();
        });
        
        // Home button
        this.homeBtn.addEventListener('click', () => {
            window.location.href = '../../index.html';
        });
        
        // Click number to hear it
        this.numberDisplay.addEventListener('click', () => {
            if (this.audioSystem && !this.isCounting) {
                this.audioSystem.speakNumber(this.currentNumber);
                this.numberDisplay.classList.add('pulse');
                setTimeout(() => {
                    this.numberDisplay.classList.remove('pulse');
                }, 800);
            }
        });
    }
    
    /* ============================================
       GAME FLOW
       ============================================ */
    
    startGame() {
        console.log('🎮 Starting game...');
        
        this.isPlaying = true;
        this.score = 0;
        this.round = 1;
        this.currentMaxNumber = 11;
        
        // Initialize number sequence (1-5 to start)
        this.initializeSequence();
        
        this.updateScore();
        this.startRound();
    }
    
    initializeSequence() {
        // Create sequential array [1, 2, 3, 4, 5]
        this.numberSequence = [];
        for (let i = this.minNumber; i <= this.currentMaxNumber; i++) {
            this.numberSequence.push(i);
        }
        this.sequenceIndex = 0;
        this.hasCompletedSequence = false;
        
        console.log(`📋 Number sequence: ${this.numberSequence.join(', ')}`);
    }
    
    startRound() {
        console.log(`🎯 Round ${this.round}`);
        
        this.isCounting = false;
        
        // Get next number from sequence
        this.currentNumber = this.getNextNumber();
        console.log(`🎲 Number: ${this.currentNumber}`);
        
        // Update number display
        this.bigNumber.textContent = this.currentNumber;
        this.celebrationNumber.textContent = this.currentNumber;
        
        // Update label
        const numberWords = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN'];
        this.numberLabel.textContent = `This is ${numberWords[this.currentNumber]}`;
        
        // Load counting box
        this.countingBox.loadRound(this.currentNumber);
        
        // Reset instruction
        this.instruction.textContent = 'Tap each item to count!';
        
        // Speak introduction (with delays to prevent interruption)
        setTimeout(() => {
            if (this.audioSystem) {
                // Just say the number
                this.audioSystem.speakNumber(this.currentNumber);
                
                // Then after a pause, say "Let's count!"
                setTimeout(() => {
                    this.audioSystem.speak(`Let's count!`, {
                        pitch: 1.2,
                        rate: 0.8
                    });
                }, 1500);
            }
        }, 500);
    }
    
    getNextNumber() {
        // If we've completed the sequence, shuffle and repeat
        if (this.sequenceIndex >= this.numberSequence.length) {
            this.hasCompletedSequence = true;
            
            // Check if we should unlock 6-10
            if (!this.hasCompletedSequence && this.currentMaxNumber < this.maxNumber) {
                this.currentMaxNumber = this.maxNumber;
                console.log('🎉 Unlocked numbers 6-10!');
                this.initializeSequence();
            } else {
                // Shuffle the sequence for variety
                this.shuffleSequence();
            }
            
            this.sequenceIndex = 0;
        }
        
        const number = this.numberSequence[this.sequenceIndex];
        this.sequenceIndex++;
        
        return number;
    }
    
    shuffleSequence() {
        // Fisher-Yates shuffle
        for (let i = this.numberSequence.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.numberSequence[i], this.numberSequence[j]] = [this.numberSequence[j], this.numberSequence[i]];
        }
        console.log(`🔀 Shuffled sequence: ${this.numberSequence.join(', ')}`);
    }
    
    /* ============================================
       COUNTING CALLBACKS
       ============================================ */
    
    onItemCounted(count, isLast) {
        console.log(`🔢 Counted: ${count}`);
        
        this.isCounting = true;
        
        // Speak the count
        if (this.audioSystem) {
            this.audioSystem.speakNumber(count);
        }
        
        // Update instruction
        if (!isLast) {
            this.instruction.textContent = `Keep counting! (${count}/${this.currentNumber})`;
        }
    }
    
    onCountingComplete(total) {
        console.log('✅ Counting complete!');
        
        this.isCounting = false;
        
        // Wait before teaching moment
        setTimeout(() => {
            this.teachingMoment(total);
        }, 800);
    }
    
    teachingMoment(total) {
        if (!this.audioSystem) {
            // No audio - just show celebration
            setTimeout(() => {
                this.showCelebration();
            }, 1000);
            return;
        }
        
        const numberWord = this.getNumberWord(total);
        
        // Step 1: "You counted SIX!"
        this.audioSystem.speak(`You counted ${numberWord}!`, {
            pitch: 1.3,
            rate: 0.8
        });
        
        // Step 2: Pulse the number display
        setTimeout(() => {
            this.numberDisplay.classList.add('pulse');
            setTimeout(() => {
                this.numberDisplay.classList.remove('pulse');
            }, 800);
            
            // "And THIS is SIX!"
            this.audioSystem.speak(`And THIS is ${numberWord}!`, {
                pitch: 1.4,
                rate: 0.75
            });
        }, 2000);
        
        // Step 3: Final reinforcement
        setTimeout(() => {
            this.audioSystem.speak(`${numberWord}!`, {
                pitch: 1.5,
                rate: 0.7
            });
            
            // Show celebration
            setTimeout(() => {
                this.showCelebration();
            }, 1500);
            
        }, 4000);
    }
    
    getNumberWord(num) {
        const words = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN'];
        return words[num] || num.toString();
    }
    
    /* ============================================
       UI UPDATES
       ============================================ */
    
    showCelebration() {
        // Add score
        this.score += this.currentNumber * 10;
        this.updateScore();
        
        // Show overlay
        this.celebrationOverlay.classList.remove('hidden');
        
        // Speak celebration
        if (this.audioSystem) {
            this.audioSystem.speakCelebration();
        }
        
        // Create confetti
        this.createConfetti();
    }
    
    hideCelebration() {
        this.celebrationOverlay.classList.add('hidden');
    }
    
    updateScore() {
        this.scoreValue.textContent = this.score;
    }
    
    nextRound() {
        this.hideCelebration();
        this.round++;
        
        // Check if we should unlock 6-10 after completing 1-5 twice
        if (this.round > 10 && this.currentMaxNumber < this.maxNumber && this.hasCompletedSequence) {
            this.currentMaxNumber = this.maxNumber;
            console.log('🎉 Unlocked numbers 6-10!');
            this.initializeSequence();
        }
        
        setTimeout(() => {
            this.startRound();
        }, 500);
    }
    
    /* ============================================
       CONFETTI EFFECT
       ============================================ */
    
    createConfetti() {
        const colors = ['#FFD93D', '#FF90BC', '#A8E6CF', '#FFB830', '#7ED321', '#4A90E2'];
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
    window.game = new CountWithMeGame();
});