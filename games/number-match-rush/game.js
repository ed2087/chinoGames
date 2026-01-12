/* ============================================
   GAME.JS - Main Game Controller
   Number Match Rush
   ============================================ */

class NumberMatchRushGame {
    constructor() {
        // Game state
        this.score = 0;
        this.timeRemaining = 60; // 60 seconds
        this.isPlaying = false;
        this.timerInterval = null;
        
        // Components
        this.spawner = null;
        this.dragHandler = null;
        this.audioSystem = null;
        
        // DOM elements
        this.timerValue = document.getElementById('timerValue');
        this.scoreValue = document.getElementById('scoreValue');
        this.gameOverOverlay = document.getElementById('gameOverOverlay');
        this.finalScore = document.getElementById('finalScore');
        this.startOverlay = document.getElementById('startOverlay');
        this.startBtn = document.getElementById('startBtn');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        this.homeBtn = document.getElementById('homeBtn');
        
        this.init();
    }
    
    /* ============================================
       INITIALIZATION
       ============================================ */
    
    async init() {
        console.log('🎮 Initializing Number Match Rush...');
        
        try {
            // Wait for audio system
            await this.waitForAudioSystem();
            
            if (this.audioSystem) {
                console.log('✅ Audio system ready');
            } else {
                console.warn('⚠️ Audio system not available');
            }
            
            // Initialize spawner
            this.spawner = new NumberSpawner('centerArea');
            console.log('✅ Spawner initialized');
            
            // Initialize drag handler
            this.dragHandler = new DragHandler('centerArea');
            console.log('✅ Drag handler initialized');
            
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
        
        // Spawner callbacks
        this.spawner.onNumberSpawned = (number, element) => {
            // Attach drag handler to the newly spawned element
            if (element) {
                this.dragHandler.attachToNumber(element);
            }
        };
        
        // Drag handler callbacks
        this.dragHandler.onNumberPickup = (number) => {
            // Speak number when picked up
            if (this.audioSystem) {
                this.audioSystem.speakNumber(number);
            }
        };
        
        this.dragHandler.onCorrectMatch = (number, element) => {
            // Correct match!
            this.onCorrectMatch(number, element);
        };
        
        this.dragHandler.onWrongMatch = (draggedNumber, targetNumber) => {
            // Wrong match
            this.onWrongMatch(draggedNumber, targetNumber);
        };
    }
    
    setupEventListeners() {
        console.log('🎯 Setting up event listeners...');
        
        // Start button
        this.startBtn.addEventListener('click', () => {
            this.startGame();
        });
        
        // Play again button
        this.playAgainBtn.addEventListener('click', () => {
            this.resetGame();
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
        this.score = 0;
        this.timeRemaining = 300;
        this.isPlaying = true;
        
        // Update UI
        this.updateScore();
        this.updateTimer();
        
        // Start spawning
        this.spawner.startSpawning();
        
        // Start timer
        this.startTimer();
        
        // Speak intro
        if (this.audioSystem) {
            setTimeout(() => {
                this.audioSystem.speak('Match the numbers! Go!', {
                    pitch: 1.3,
                    rate: 0.8
                });
            }, 500);
        }
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timeRemaining--;
            this.updateTimer();
            
            // Warning at 10 seconds
            if (this.timeRemaining === 10) {
                this.timerValue.parentElement.classList.add('warning');
                if (this.audioSystem) {
                    this.audioSystem.speak('Ten seconds left!', {
                        pitch: 1.4,
                        rate: 0.9
                    });
                }
            }
            
            // Game over
            if (this.timeRemaining <= 0) {
                this.endGame();
            }
            
        }, 1000);
    }
    
    endGame() {
        console.log('⏰ Time up! Game over.');
        
        this.isPlaying = false;
        
        // Stop timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        // Stop spawning
        this.spawner.stopSpawning();
        
        // Show game over screen
        this.showGameOver();
    }
    
    showGameOver() {
        this.finalScore.textContent = this.score;
        this.gameOverOverlay.classList.remove('hidden');
        
        // Speak final score
        if (this.audioSystem) {
            setTimeout(() => {
                this.audioSystem.speak(`Time's up! You matched ${this.score} numbers!`, {
                    pitch: 1.2,
                    rate: 0.8
                });
            }, 500);
        }
        
        // Confetti
        this.createConfetti();
    }
    
    resetGame() {
        console.log('🔄 Resetting game...');
        
        // Hide game over
        this.gameOverOverlay.classList.add('hidden');
        
        // Reset timer warning
        this.timerValue.parentElement.classList.remove('warning');
        
        // Clear all target boxes
        const targetBoxes = document.querySelectorAll('.target-box');
        targetBoxes.forEach(box => {
            box.classList.remove('filled');
        });
        
        // Reset spawner
        this.spawner.reset();
        
        // Start new game
        this.startGame();
    }
    
    /* ============================================
       MATCH CALLBACKS
       ============================================ */
    
    onCorrectMatch(number, element) {
        console.log(`✅ Correct match: ${number}`);
        
        // Add score
        this.score++;
        this.updateScore();
        
        // Remove from spawner tracking
        this.spawner.removeNumber(element);
        
        // Speak confirmation
        if (this.audioSystem) {
            const phrases = [
                `Yes! This is ${this.getNumberWord(number)}!`,
                `Correct! ${this.getNumberWord(number)}!`,
                `Perfect! That's ${this.getNumberWord(number)}!`,
                `Great job! ${this.getNumberWord(number)}!`
            ];
            
            const phrase = phrases[Math.floor(Math.random() * phrases.length)];
            
            this.audioSystem.speak(phrase, {
                pitch: 1.3,
                rate: 0.8
            });
            
            // Play ding sound
            this.playSound('correct');
        }
    }
    
    onWrongMatch(draggedNumber, targetNumber) {
        console.log(`❌ Wrong: ${draggedNumber} → ${targetNumber}`);
        
        // Speak error
        if (this.audioSystem) {
            this.audioSystem.speak('Try again!', {
                pitch: 1.0,
                rate: 0.8
            });
            
            // Play buzzer sound
            this.playSound('wrong');
        }
    }
    
    /* ============================================
       UI UPDATES
       ============================================ */
    
    updateScore() {
        this.scoreValue.textContent = this.score;
    }
    
    updateTimer() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        this.timerValue.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    /* ============================================
       SOUND EFFECTS
       ============================================ */
    
    playSound(type) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        if (type === 'correct') {
            // Ding sound
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } else if (type === 'wrong') {
            // Buzzer sound
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.3);
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        }
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
    window.game = new NumberMatchRushGame();
});