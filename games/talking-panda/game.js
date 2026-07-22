/* ============================================
   GAME.JS - Main Game Controller
   Talking Panda
   ============================================ */

class TalkingPandaGame {
    constructor() {
        // Components
        this.pandaAnimator = null;
        this.voiceRecorder = null;
        this.audioSystem = null;
        
        // Game state
        this.pokeCount = 0;
        this.pokeResetTimer = null;
        this.isSleeping = false;
        
        // DOM elements
        this.homeBtn = document.getElementById('homeBtn');
        this.micBtn = document.getElementById('micBtn');
        this.feedBtn = document.getElementById('feedBtn');
        this.petBtn = document.getElementById('petBtn');
        this.sleepBtn = document.getElementById('sleepBtn');
        this.pokeBtn = document.getElementById('pokeBtn');
        this.recordingIndicator = document.getElementById('recordingIndicator');
        this.playingIndicator = document.getElementById('playingIndicator');
        this.micPermissionModal = document.getElementById('micPermissionModal');
        this.allowMicBtn = document.getElementById('allowMicBtn');
        this.denyMicBtn = document.getElementById('denyMicBtn');
        
        this.init();
    }
    
    /* ============================================
       INITIALIZATION
       ============================================ */
    
    async init() {
        console.log('🐼 Initializing Talking Panda...');
        
        try {
            // Wait for audio system
            await this.waitForAudioSystem();
            
            if (this.audioSystem) {
                console.log('✅ Audio system ready');
            }
            
            // Initialize panda animator
            this.pandaAnimator = new PandaAnimator('pandaCanvas');
            console.log('✅ Panda animator initialized');
            
            // Load sprites
            await this.pandaAnimator.loadSprites();
            
            // Start animation loop
            this.pandaAnimator.startAnimationLoop();
            
            // Start with idle blinking
            this.pandaAnimator.playAnimation('IdleBlinking', true);
            
            // Initialize voice recorder
            this.voiceRecorder = new VoiceRecorder();
            this.setupVoiceRecorderCallbacks();
            console.log('✅ Voice recorder initialized');
            
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
    
    /* ============================================
       EVENT LISTENERS
       ============================================ */
    
    setupEventListeners() {
        console.log('🎯 Setting up event listeners...');
        
        // Home button
        this.homeBtn.addEventListener('click', () => {
            window.location.href = '../../index.html';
        });
        
        // Microphone button
        this.micBtn.addEventListener('click', () => {
            this.handleMicClick();
        });
        
        // Feed button
        this.feedBtn.addEventListener('click', () => {
            this.handleFeed();
        });
        
        // Pet button
        this.petBtn.addEventListener('click', () => {
            this.handlePet();
        });
        
        // Sleep button
        this.sleepBtn.addEventListener('click', () => {
            this.handleSleep();
        });
        
        // Poke button
        this.pokeBtn.addEventListener('click', () => {
            this.handlePoke();
        });
        
        // Permission modal buttons
        this.allowMicBtn.addEventListener('click', () => {
            this.handleAllowMic();
        });
        
        this.denyMicBtn.addEventListener('click', () => {
            this.handleDenyMic();
        });
    }
    
    setupVoiceRecorderCallbacks() {
        // Recording start
        this.voiceRecorder.onRecordingStart = () => {
            this.recordingIndicator.classList.remove('hidden');
            this.micBtn.classList.add('recording');
            this.pandaAnimator.doTalkingAnimation(true);
        };
        
        // Recording stop
        this.voiceRecorder.onRecordingStop = () => {
            this.recordingIndicator.classList.add('hidden');
            this.micBtn.classList.remove('recording');
            
            // Auto-play recording
            setTimeout(() => {
                this.voiceRecorder.playRecording();
            }, 300);
        };
        
        // Playback start
        this.voiceRecorder.onPlaybackStart = () => {
            this.playingIndicator.classList.remove('hidden');
            this.pandaAnimator.doTalkingAnimation(true);
        };
        
        // Playback end
        this.voiceRecorder.onPlaybackEnd = () => {
            this.playingIndicator.classList.add('hidden');
            this.pandaAnimator.playAnimation('Happy', false, () => {
                this.pandaAnimator.playAnimation('IdleBlinking', true);
            });
        };
        
        // Permission granted
        this.voiceRecorder.onPermissionGranted = () => {
            this.micPermissionModal.classList.add('hidden');
        };
        
        // Permission denied
        this.voiceRecorder.onPermissionDenied = () => {
            this.micPermissionModal.classList.add('hidden');
            if (this.audioSystem) {
                this.audioSystem.speak("Microphone not available", {
                    pitch: 1.2,
                    rate: 0.8
                });
            }
        };
    }
    
    /* ============================================
       BUTTON HANDLERS
       ============================================ */
    
    handleMicClick() {
        if (this.voiceRecorder.isRecording) {
            // Stop recording
            this.voiceRecorder.stopRecording();
        } else {
            // Start recording
            if (!this.voiceRecorder.hasPermission) {
                // Show permission modal
                this.micPermissionModal.classList.remove('hidden');
            } else {
                this.voiceRecorder.startRecording();
            }
        }
    }
    
    handleAllowMic() {
        this.voiceRecorder.requestPermission().then(granted => {
            if (granted) {
                this.voiceRecorder.startRecording();
            }
        });
    }
    
    handleDenyMic() {
        this.micPermissionModal.classList.add('hidden');
    }
    
    handleFeed() {
        console.log('🍎 Feed button clicked');
        
        if (this.isSleeping) {
            this.wakeUp();
        }
        
        // Play feed animation
        this.pandaAnimator.doFeedSequence();
        
        // Play eating sound
        if (this.audioSystem) {
            setTimeout(() => {
                this.playSound('eat');
            }, 500);
            
            // Burp sound at end
            setTimeout(() => {
                this.playSound('burp');
            }, 2500);
        }
        
        // Show random food animation (optional - can add food sprite flying to mouth)
    }
    
    handlePet() {
        console.log('👋 Pet button clicked');
        
        if (this.isSleeping) {
            this.wakeUp();
        }
        
        // Play pet animation
        this.pandaAnimator.doPetSequence();
        
        // Play purr sound
        if (this.audioSystem) {
            setTimeout(() => {
                this.playSound('purr');
            }, 300);
        }
    }
    
    handleSleep() {
        console.log('💤 Sleep button clicked');
        
        if (this.isSleeping) {
            // Wake up
            this.wakeUp();
        } else {
            // Go to sleep
            this.isSleeping = true;
            this.pandaAnimator.doSleepSequence();
            
            // Play yawn sound
            if (this.audioSystem) {
                this.playSound('yawn');
            }
        }
    }
    
    handlePoke() {
        console.log('👊 Poke button clicked');
        
        if (this.isSleeping) {
            this.wakeUp();
            return;
        }
        
        // Increment poke count
        this.pokeCount++;
        
        console.log(`Poke count: ${this.pokeCount}`);
        
        // Play poke animation based on count
        this.pandaAnimator.doPokeSequence(this.pokeCount);
        
        // Play sound based on count
        if (this.audioSystem) {
            if (this.pokeCount === 1) {
                this.playSound('huh');
            } else if (this.pokeCount <= 3) {
                this.playSound('stop');
            } else {
                this.playSound('ouch');
            }
        }
        
        // Reset poke count after 5 seconds
        if (this.pokeResetTimer) {
            clearTimeout(this.pokeResetTimer);
        }
        
        this.pokeResetTimer = setTimeout(() => {
            this.pokeCount = 0;
            console.log('Poke count reset');
        }, 5000);
    }
    
    wakeUp() {
        console.log('👀 Waking up panda...');
        this.isSleeping = false;
        this.pandaAnimator.playAnimation('IdleBlinking', true);
        
        if (this.audioSystem) {
            this.playSound('wakeup');
        }
    }
    
    /* ============================================
       SOUND EFFECTS
       ============================================ */
    
    playSound(type) {
        if (!this.audioSystem) return;
        
        const sounds = {
            'eat': 'Yum yum yum!',
            'burp': 'Burp!',
            'purr': 'Purrr...',
            'yawn': 'Yaaaawn...',
            'huh': 'Huh?',
            'stop': 'Stop it!',
            'ouch': 'Ouch!',
            'wakeup': 'Hmm?'
        };
        
        const text = sounds[type] || '';
        
        if (text) {
            this.audioSystem.speak(text, {
                pitch: 1.3,
                rate: 0.8
            });
        }
    }
    
    /* ============================================
       CLEANUP
       ============================================ */
    
    destroy() {
        if (this.voiceRecorder) {
            this.voiceRecorder.destroy();
        }
        
        if (this.pokeResetTimer) {
            clearTimeout(this.pokeResetTimer);
        }
        
        console.log('🧹 Game destroyed');
    }
}

/* ============================================
   START GAME WHEN DOM READY
   ============================================ */

window.addEventListener('DOMContentLoaded', () => {
    console.log('🐼 DOM Ready - Initializing game...');
    window.game = new TalkingPandaGame();
});