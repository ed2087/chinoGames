/* ============================================
   GAME.JS - Main Game Controller
   Bubble Rush - Pop the Numbers!
   ============================================ */

class BubbleRushGame {
    constructor() {
        // Game state
        this.isPlaying = false;
        this.isPaused = false;
        this.currentTargetNumber = 5;
        
        // Components
        this.physicsEngine = null;
        this.bubbleManager = null;
        this.scoringSystem = null;
        this.audioSystem = null;
        
        // Canvas
        this.canvas = null;
        this.ctx = null;
        this.animationFrame = null;
        
        // DOM elements
        this.startOverlay = document.getElementById('startOverlay');
        this.winOverlay = document.getElementById('winOverlay');
        this.gameOverOverlay = document.getElementById('gameOverOverlay');
        this.startBtn = document.getElementById('startBtn');
        this.playAgainWinBtn = document.getElementById('playAgainWinBtn');
        this.playAgainLoseBtn = document.getElementById('playAgainLoseBtn');
        this.homeBtn = document.getElementById('homeBtn');
        
        // UI elements
        this.scoreValue = document.getElementById('scoreValue');
        this.lifeBarFill = document.getElementById('lifeBarFill');
        this.targetNumber = document.getElementById('targetNumber');
        this.centerNumberText = document.getElementById('centerNumberText');
        this.comboDisplay = document.getElementById('comboDisplay');
        this.comboValue = document.getElementById('comboValue');
        this.floatingTextContainer = document.getElementById('floatingTextContainer');
        
        // Target number sequence
        this.numberSequence = [];
        this.sequenceIndex = 0;
        
        this.init();
    }
    
    /* ============================================
       INITIALIZATION
       ============================================ */
    
    async init() {
        console.log('🎮 Initializing Bubble Rush...');
        
        try {
            // Wait for audio system
            await this.waitForAudioSystem();
            
            if (this.audioSystem) {
                console.log('✅ Audio system ready');
            } else {
                console.warn('⚠️ Audio system not available');
            }
            
            // Get canvas
            this.canvas = document.getElementById('gameCanvas');
            this.ctx = this.canvas.getContext('2d');
            
            // Initialize physics engine
            this.physicsEngine = new PhysicsEngine('gameCanvas');
            console.log('✅ Physics engine initialized');
            
            // Initialize bubble manager
            this.bubbleManager = new BubbleManager(
                this.physicsEngine,
                this.canvas.width,
                this.canvas.height
            );
            console.log('✅ Bubble manager initialized');
            
            // Initialize scoring system
            this.scoringSystem = new ScoringSystem();
            console.log('✅ Scoring system initialized');
            
            // Set up callbacks
            this.setupCallbacks();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Start render loop
            this.startRenderLoop();
            
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
        
        // Bubble manager callbacks
        this.bubbleManager.onBubblePopped = (number, position) => {
            this.onCorrectBubblePopped(number, position);
        };
        
        this.bubbleManager.onWrongBubblePopped = (clickedNumber, targetNumber, position) => {
            this.onWrongBubblePopped(clickedNumber, targetNumber, position);
        };
        
        // Scoring system callbacks
        this.scoringSystem.onScoreChange = (score) => {
            this.scoreValue.textContent = score.toLocaleString();
        };
        
        this.scoringSystem.onLifeChange = (life) => {
            this.updateLifeBar(life);
        };
        
        this.scoringSystem.onComboChange = (combo, multiplier) => {
            this.updateCombo(combo, multiplier);
        };
        
        this.scoringSystem.onGoalReached = () => {
            this.winGame();
        };
        
        this.scoringSystem.onLifeZero = () => {
            this.loseGame();
        };
    }
    
    setupEventListeners() {
        console.log('🎯 Setting up event listeners...');
        
        // Start button
        this.startBtn.addEventListener('click', () => {
            this.startGame();
        });
        
        // Play again buttons
        this.playAgainWinBtn.addEventListener('click', () => {
            this.resetGame();
        });
        
        this.playAgainLoseBtn.addEventListener('click', () => {
            this.resetGame();
        });
        
        // Home button
        this.homeBtn.addEventListener('click', () => {
            window.location.href = '../../index.html';
        });
        
        // Canvas click
        this.canvas.addEventListener('click', (e) => {
            this.handleCanvasClick(e);
        });
        
        // Touch support
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            this.handleBubbleClick(x, y);
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
        this.isPlaying = true;
        this.isPaused = false;
        
        // Initialize number sequence
        this.initializeNumberSequence();
        this.setNextTargetNumber();
        
        // Start systems
        this.scoringSystem.startGame();
        this.bubbleManager.startSpawning();
        
        // Speak intro
        if (this.audioSystem) {
            setTimeout(() => {
                this.audioSystem.speak(`Pop all the ${this.getNumberWord(this.currentTargetNumber)}s!`, {
                    pitch: 1.3,
                    rate: 0.8
                });
            }, 500);
        }
    }
    
    initializeNumberSequence() {
        // Start with 1-5
        this.numberSequence = [1, 2, 3, 4, 5];
        this.shuffleArray(this.numberSequence);
        this.sequenceIndex = 0;
        console.log(`📋 Number sequence: ${this.numberSequence.join(', ')}`);
    }
    
    setNextTargetNumber() {
        // Get next number from sequence
        if (this.sequenceIndex >= this.numberSequence.length) {
            // Refill sequence
            this.numberSequence = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            this.shuffleArray(this.numberSequence);
            this.sequenceIndex = 0;
            console.log(`🔀 Shuffled sequence: ${this.numberSequence.join(', ')}`);
        }
        
        this.currentTargetNumber = this.numberSequence[this.sequenceIndex];
        this.sequenceIndex++;
        
        // Update UI
        this.targetNumber.textContent = this.currentTargetNumber;
        this.centerNumberText.textContent = this.currentTargetNumber;
        
        console.log(`🎯 New target: ${this.currentTargetNumber}`);
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    /* ============================================
       BUBBLE INTERACTION
       ============================================ */
    
    handleCanvasClick(e) {
        if (!this.isPlaying || this.isPaused) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.handleBubbleClick(x, y);
    }
    
    handleBubbleClick(x, y) {
        // Scale coordinates to match physics world
        const scaleX = this.canvas.width / this.canvas.clientWidth;
        const scaleY = this.canvas.height / this.canvas.clientHeight;
        const worldX = x * scaleX;
        const worldY = y * scaleY;
        
        // Handle click in bubble manager
        this.bubbleManager.handleBubbleClick(worldX, worldY, this.currentTargetNumber);
    }
    
    onCorrectBubblePopped(number, position) {
        console.log(`✅ Correct bubble popped: ${number}`);
        
        // Add score
        const result = this.scoringSystem.addCorrectPop();
        
        // Show floating text
        this.showFloatingText(`+${result.points}`, position.x, position.y, 'correct');
        
        // Check for bonus
        if (result.bonus) {
            const bonus = this.scoringSystem.getBonusAmount();
            setTimeout(() => {
                this.showFloatingText(`BONUS +${bonus}!`, position.x, position.y - 50, 'bonus');
            }, 200);
        }
        
        // Speak feedback
        if (this.audioSystem) {
            const numberWord = this.getNumberWord(number);
            
            if (result.combo >= 5) {
                const message = this.scoringSystem.getComboMessage();
                this.audioSystem.speak(`${numberWord}! ${message}!`, {
                    pitch: 1.3 + (result.combo * 0.02),
                    rate: 0.8
                });
            } else {
                this.audioSystem.speakNumber(number);
            }
        }
        
        // Change target after every 5 correct pops
        if (this.scoringSystem.correctPops % 5 === 0) {
            setTimeout(() => {
                this.setNextTargetNumber();
                
                if (this.audioSystem) {
                    this.audioSystem.speak(`Now pop the ${this.getNumberWord(this.currentTargetNumber)}s!`, {
                        pitch: 1.2,
                        rate: 0.8
                    });
                }
            }, 1000);
        }
    }
    
    onWrongBubblePopped(clickedNumber, targetNumber, position) {
        console.log(`❌ Wrong bubble: ${clickedNumber} (wanted ${targetNumber})`);
        
        // Lose points and life
        const result = this.scoringSystem.addWrongPop();
        
        // Show floating text
        this.showFloatingText(`-${result.penalty}`, position.x, position.y, 'wrong');
        
        // Speak feedback
        if (this.audioSystem) {
            this.audioSystem.speak('Oops! Try again!', {
                pitch: 1.0,
                rate: 0.8
            });
        }
    }
    
    /* ============================================
       UI UPDATES
       ============================================ */
    
    updateLifeBar(life) {
        this.lifeBarFill.style.width = `${life}%`;
        
        // Change color based on life
        this.lifeBarFill.classList.remove('warning', 'danger');
        
        if (life <= 25) {
            this.lifeBarFill.classList.add('danger');
        } else if (life <= 50) {
            this.lifeBarFill.classList.add('warning');
        }
    }
    
    updateCombo(combo, multiplier) {
        if (combo > 0) {
            this.comboValue.textContent = `x${multiplier}`;
            this.comboDisplay.classList.add('active');
            
            setTimeout(() => {
                this.comboDisplay.classList.remove('active');
            }, 300);
        } else {
            this.comboValue.textContent = 'x1';
        }
    }
    
    showFloatingText(text, x, y, type) {
        const floatingText = document.createElement('div');
        floatingText.className = `floating-text ${type}`;
        floatingText.textContent = text;
        
        // Position relative to canvas
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.clientWidth / this.canvas.width;
        const scaleY = this.canvas.clientHeight / this.canvas.height;
        
        floatingText.style.left = (rect.left + x * scaleX) + 'px';
        floatingText.style.top = (rect.top + y * scaleY) + 'px';
        
        this.floatingTextContainer.appendChild(floatingText);
        
        // Remove after animation
        setTimeout(() => {
            floatingText.remove();
        }, 1000);
    }
    
    /* ============================================
       GAME END
       ============================================ */
    
    winGame() {
        console.log('🎉 WIN!');
        
        this.isPlaying = false;
        this.bubbleManager.stopSpawning();
        this.scoringSystem.endGame();
        
        // Get stats
        const stats = this.scoringSystem.getStats();
        
        // Update UI
        document.getElementById('finalWinScore').textContent = stats.score.toLocaleString();
        document.getElementById('finalWinTime').textContent = stats.playTimeFormatted;
        document.getElementById('finalWinAccuracy').textContent = stats.accuracy + '%';
        
        // Show overlay
        setTimeout(() => {
            this.winOverlay.classList.remove('hidden');
        }, 500);
        
        // Speak celebration
        if (this.audioSystem) {
            setTimeout(() => {
                this.audioSystem.speak(`You win! You scored ${stats.score} points! Amazing!`, {
                    pitch: 1.4,
                    rate: 0.8
                });
            }, 800);
        }
        
        // Confetti
        this.createConfetti();
    }
    
    loseGame() {
        console.log('💔 Game Over');
        
        this.isPlaying = false;
        this.bubbleManager.stopSpawning();
        this.scoringSystem.endGame();
        
        // Get stats
        const stats = this.scoringSystem.getStats();
        
        // Update UI
        document.getElementById('finalLoseScore').textContent = stats.score.toLocaleString();
        
        // Show overlay
        setTimeout(() => {
            this.gameOverOverlay.classList.remove('hidden');
        }, 500);
        
        // Speak
        if (this.audioSystem) {
            setTimeout(() => {
                this.audioSystem.speak(`Game over! You scored ${stats.score} points. Try again!`, {
                    pitch: 1.1,
                    rate: 0.8
                });
            }, 800);
        }
    }
    
    resetGame() {
        console.log('🔄 Resetting game...');
        
        // Hide overlays
        this.winOverlay.classList.add('hidden');
        this.gameOverOverlay.classList.add('hidden');
        
        // Clear bubbles
        this.bubbleManager.clearAllBubbles();
        
        // Start new game
        this.startGame();
    }
    
    /* ============================================
       RENDER LOOP
       ============================================ */
    
    startRenderLoop() {
        const render = () => {
            // Clear canvas
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Draw bubbles with custom rendering
            this.bubbleManager.drawBubbles(this.ctx);
            
            // Continue loop
            this.animationFrame = requestAnimationFrame(render);
        };
        
        render();
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
        const confettiCount = 100;
        
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
                
            }, i * 20);
        }
    }
    
    /* ============================================
       CLEANUP
       ============================================ */
    
    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        if (this.bubbleManager) {
            this.bubbleManager.destroy();
        }
        
        if (this.scoringSystem) {
            this.scoringSystem.destroy();
        }
        
        if (this.physicsEngine) {
            this.physicsEngine.destroy();
        }
        
        console.log('🧹 Game destroyed');
    }
}

/* ============================================
   START GAME WHEN DOM READY
   ============================================ */

window.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 DOM Ready - Initializing game...');
    window.game = new BubbleRushGame();
});