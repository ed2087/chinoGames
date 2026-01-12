/* ============================================
   GAME.JS - Main Game Controller
   Purpose: Ties everything together
   ============================================ */

class FeedTheFaceGame {
    constructor() {
        // Game state
        this.currentNumber = 1;
        this.targetNumber = 3;
        this.score = 0;
        this.round = 1;
        this.isPlaying = false;
        
        // Number range
        this.minNumber = 1;
        this.maxNumber = 10;
        this.currentMaxNumber = 5; // Start with 1-5, unlock 6-10 later
        
        // Components
        this.face = null;
        this.foodManager = null;
        this.audioSystem = null;
        
        // DOM elements
        this.numberDisplay = document.getElementById('targetNumber');
        this.currentCount = document.getElementById('currentCount');
        this.targetCount = document.getElementById('targetCount');
        this.scoreValue = document.getElementById('scoreValue');
        this.celebrationOverlay = document.getElementById('celebrationOverlay');
        this.nextRoundBtn = document.getElementById('nextRoundBtn');
        this.loadingScreen = document.getElementById('loadingScreen');
        this.homeBtn = document.getElementById('homeBtn');
        
        this.init();
    }
    
    /* ============================================
       INITIALIZATION
       ============================================ */
    
    async init() {
        console.log('🎮 Initializing Feed The Face Game...');
        
        try {
            // Wait for audio system (with timeout fallback)
            console.log('⏳ Waiting for audio system...');
            await this.waitForAudioSystem();
            
            if (this.audioSystem) {
                console.log('✅ Audio system ready');
            } else {
                console.warn('⚠️ Audio system not available - continuing without audio');
            }
            
            // Initialize face
            console.log('😊 Creating face...');
            this.face = new Face('faceCanvas');
            console.log('✅ Face initialized');
            
            // Initialize food manager
            console.log('🍪 Creating food manager...');
            this.foodManager = new FoodManager('foodShelf', 'dropZone', 'plateItems');
            console.log('✅ Food Manager initialized');
            
            // Set up food manager callbacks
            this.setupFoodCallbacks();
            
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
            console.error('Error stack:', error.stack);
            
            // Try to start anyway
            this.loadingScreen.classList.add('hidden');
            alert('Game loaded with errors. Check console for details.');
        }
    }
    
    async waitForAudioSystem() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 50; // 5 seconds max wait
            
            const checkAudio = () => {
                attempts++;
                console.log(`🔍 Checking audio system... attempt ${attempts}`);
                
                if (window.audioSystem && window.audioSystem.isInitialized) {
                    console.log('🔊 Audio System Ready!');
                    this.audioSystem = window.audioSystem;
                    resolve();
                } else if (attempts >= maxAttempts) {
                    console.warn('⏱️ Audio system timeout - proceeding without audio');
                    this.audioSystem = null;
                    resolve();
                } else {
                    setTimeout(checkAudio, 100);
                }
            };
            
            checkAudio();
        });
    }
    
    setupFoodCallbacks() {
        console.log('🔗 Setting up food callbacks...');
        
        // When food is fed
        this.foodManager.onFoodFed = (foodImage, count) => {
            this.onFoodFed(foodImage, count);
        };
        
        // When dragging starts - face looks at food
        this.foodManager.onFoodDragStart = (x, y) => {
            this.face.lookAt(x, y);
            this.face.setExpression('excited');
        };
        
        // While dragging - face tracks food
        this.foodManager.onFoodDragMove = (x, y) => {
            this.face.lookAt(x, y);
        };
        
        // When drag ends - face resets
        this.foodManager.onFoodDragEnd = () => {
            this.face.resetLook();
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
    }
    
    /* ============================================
       GAME FLOW
       ============================================ */
    
    startGame() {
        console.log('🎮 Starting game...');
        
        this.isPlaying = true;
        this.score = 0;
        this.round = 1;
        this.currentMaxNumber = 5; // Start with 1-5
        
        this.updateScore();
        this.startRound();
    }
    
    startRound() {
        console.log(`🎯 Round ${this.round}`);
        
        // Pick random number
        this.targetNumber = this.getRandomNumber();
        console.log(`🎲 Target number: ${this.targetNumber}`);
        
        // Update UI
        this.numberDisplay.textContent = this.targetNumber;
        this.targetCount.textContent = this.targetNumber;
        this.currentCount.textContent = '0';
        
        // Reset food manager
        console.log('🍪 Loading food...');
        this.foodManager.reset();
        
        // Face says the number
        this.face.setExpression('thinking');
        
        setTimeout(() => {
            // Speak the number
            if (this.audioSystem) {
                console.log(`🔊 Speaking: ${this.targetNumber}`);
                this.audioSystem.speakNumber(this.targetNumber);
            } else {
                console.log('🔇 No audio - skipping speech');
            }
            
            // Face becomes hungry/excited
            setTimeout(() => {
                this.face.setExpression('excited');
                console.log('😊 Face ready - game started!');
            }, 500);
            
        }, 500);
    }
    
    getRandomNumber() {
        // Progressive difficulty
        let min = this.minNumber;
        let max = Math.min(this.currentMaxNumber, this.maxNumber);
        
        // Unlock 6-10 after 10 successful rounds
        if (this.round > 10 && this.currentMaxNumber < this.maxNumber) {
            this.currentMaxNumber = this.maxNumber;
            console.log('🎉 Unlocked numbers 6-10!');
        }
        
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    /* ============================================
       FOOD FEEDING
       ============================================ */
    
    onFoodFed(foodImage, count) {
        console.log(`🍪 Fed ${count}/${this.targetNumber}`);
        
        // Update counter
        this.currentCount.textContent = count;
        
        // Face eating animation
        this.face.playEatingAnimation(() => {
            // After eating
            if (this.audioSystem) {
                this.audioSystem.speakNumber(count);
                this.audioSystem.playSoundEffect('pop');
            }
        });
        
        // Check if correct amount
        if (count === this.targetNumber) {
            this.onCorrectAmount();
        } else if (count > this.targetNumber) {
            this.onTooMuch();
        }
    }
    
    onCorrectAmount() {
        console.log('✅ Correct!');
        
        // Celebration
        setTimeout(() => {
            this.face.playCelebrationAnimation();
            
            if (this.audioSystem) {
                this.audioSystem.speakCelebration();
                this.audioSystem.playSoundEffect('celebration');
            }
            
            // Add score
            this.score += this.targetNumber * 10;
            this.updateScore();
            
            // Show celebration overlay
            setTimeout(() => {
                this.showCelebration();
            }, 1000);
            
        }, 500);
    }
    
    onTooMuch() {
        console.log('❌ Too much!');
        
        // Face confused
        this.face.setExpression('confused');
        
        if (this.audioSystem) {
            // Gentle correction
            this.audioSystem.speak(`Oh no! Too much! I wanted ${this.targetNumber}!`, {
                pitch: 1.2,
                rate: 0.8
            });
        }
        
        // Reset after delay
        setTimeout(() => {
            this.foodManager.clearPlate();
            this.currentCount.textContent = '0';
            this.face.setExpression('excited');
            
            if (this.audioSystem) {
                this.audioSystem.speak(`Let's try again! Feed me ${this.targetNumber}!`, {
                    pitch: 1.3,
                    rate: 0.8
                });
            }
        }, 2500);
    }
    
    /* ============================================
       UI UPDATES
       ============================================ */
    
    showCelebration() {
        this.celebrationOverlay.classList.remove('hidden');
        
        // Create confetti effect
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
        
        // Small delay before next round
        setTimeout(() => {
            this.startRound();
        }, 500);
    }
    
    /* ============================================
       CONFETTI EFFECT
       ============================================ */
    
    createConfetti() {
        const colors = ['#FFD93D', '#FF90BC', '#A8E6CF', '#FFB830', '#7ED321'];
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
                
                // Animate falling
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
                
                // Remove after animation
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
    
    // Create game instance
    window.game = new FeedTheFaceGame();
});