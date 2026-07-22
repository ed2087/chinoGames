/* ============================================
   PANDA-ANIMATOR.JS - Sprite Animation System
   Purpose: Loads sprite sheets and animates panda
   ============================================ */

class PandaAnimator {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Canvas setup
        this.setupCanvas();
        
        // Sprite data
        this.sprites = {};
        this.currentAnimation = null;
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.frameDelay = 150; // ms per frame
        this.isPlaying = false;
        this.loop = true;
        
        // Animation queue
        this.animationQueue = [];
        
        // Sprite configurations
        this.spriteConfig = {
            'Idle': { frames: 4, file: 'PandaIdle.png' },
            'IdleBlinking': { frames: 12, file: 'PandaIdleBlinking.png' },
            'Happy': { frames: 4, file: 'Happy.png' },
            'Cry': { frames: 4, file: 'PandaCry.png' },
            'Eating': { frames: 12, file: 'PandaEating.png' },
            'Resting': { frames: 8, file: 'PandaResting.png' },
            'Sitting': { frames: 4, file: 'PandaSitting.png' },
            'Sleep': { frames: 4, file: 'PandaSleep.png' },
            'SoFull': { frames: 4, file: 'PandaSoFull.png' },
            'Talking': { frames: 6, file: 'PandaTalkingSitting.png' },
            'Thinking': { frames: 12, file: 'PandaThinking.png' },
            'Wave': { frames: 12, file: 'PandaWave.png' },
            'Yoga1': { frames: 3, file: 'PandaYoga1.png' },
            'Yoga2': { frames: 3, file: 'PandaYoga2.png' },
            'Yoga3': { frames: 3, file: 'PandaYoga3.png' }
        };
        
        // Callbacks
        this.onAnimationComplete = null;
    }
    
    /* ============================================
       CANVAS SETUP
       ============================================ */
    
    setupCanvas() {
        // Set canvas to square aspect ratio
        const size = Math.min(this.canvas.clientWidth, this.canvas.clientHeight);
        this.canvas.width = size;
        this.canvas.height = size;
        
        console.log(`🎨 Canvas setup: ${size}x${size}`);
    }
    
    /* ============================================
       SPRITE LOADING
       ============================================ */
    
    async loadSprites() {
        console.log('📦 Loading panda sprites...');
        
        const loadPromises = Object.entries(this.spriteConfig).map(([name, config]) => {
            return this.loadSpriteSheet(name, config.file, config.frames);
        });
        
        await Promise.all(loadPromises);
        
        console.log('✅ All sprites loaded');
    }
    
loadSpriteSheet(name, filename, frameCount) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            this.sprites[name] = {
                image: img,
                frameCount: frameCount,
                frameWidth: img.width / frameCount,
                frameHeight: img.height
            };
            console.log(`✅ Loaded: ${name} (${frameCount} frames)`);
            resolve();
        };
        img.onerror = () => {
            console.error(`❌ Failed to load: ${filename}`);
            reject();
        };
        img.src = `../../assets/PandaPremiumPack/${filename}`;  // ← GO UP 2 LEVELS
    });
}
    
    /* ============================================
       ANIMATION CONTROL
       ============================================ */
    
    playAnimation(name, loop = true, callback = null) {
        if (!this.sprites[name]) {
            console.error(`❌ Animation not found: ${name}`);
            return;
        }
        
        console.log(`▶️ Playing: ${name} (loop: ${loop})`);
        
        this.currentAnimation = name;
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.loop = loop;
        this.isPlaying = true;
        
        // Set callback for when animation completes
        if (callback) {
            this.onAnimationComplete = callback;
        }
    }
    
    queueAnimation(name, loop = false) {
        this.animationQueue.push({ name, loop });
        console.log(`📋 Queued: ${name}`);
    }
    
    playNextAnimation() {
        if (this.animationQueue.length > 0) {
            const next = this.animationQueue.shift();
            this.playAnimation(next.name, next.loop, () => {
                this.playNextAnimation();
            });
        } else {
            // Default back to idle blinking
            this.playAnimation('IdleBlinking', true);
        }
    }
    
    stopAnimation() {
        this.isPlaying = false;
        this.currentAnimation = null;
        console.log('⏹️ Animation stopped');
    }
    
    /* ============================================
       ANIMATION UPDATE
       ============================================ */
    
    update(deltaTime) {
        if (!this.isPlaying || !this.currentAnimation) return;
        
        this.frameTimer += deltaTime;
        
        if (this.frameTimer >= this.frameDelay) {
            this.frameTimer = 0;
            this.currentFrame++;
            
            const sprite = this.sprites[this.currentAnimation];
            
            if (this.currentFrame >= sprite.frameCount) {
                if (this.loop) {
                    this.currentFrame = 0;
                } else {
                    // Animation complete
                    this.isPlaying = false;
                    console.log(`✅ Animation complete: ${this.currentAnimation}`);
                    
                    if (this.onAnimationComplete) {
                        const callback = this.onAnimationComplete;
                        this.onAnimationComplete = null;
                        callback();
                    } else {
                        this.playNextAnimation();
                    }
                }
            }
        }
    }
    
    /* ============================================
       RENDERING
       ============================================ */
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (!this.currentAnimation || !this.sprites[this.currentAnimation]) return;
        
        const sprite = this.sprites[this.currentAnimation];
        
        // Calculate source position
        const sx = this.currentFrame * sprite.frameWidth;
        const sy = 0;
        const sw = sprite.frameWidth;
        const sh = sprite.frameHeight;
        
        // Calculate destination position (centered and scaled)
        const scale = Math.min(
            this.canvas.width / sw,
            this.canvas.height / sh
        ) * 0.8; // 80% of canvas
        
        const dw = sw * scale;
        const dh = sh * scale;
        const dx = (this.canvas.width - dw) / 2;
        const dy = (this.canvas.height - dh) / 2;
        
        // Draw sprite
        this.ctx.drawImage(
            sprite.image,
            sx, sy, sw, sh,
            dx, dy, dw, dh
        );
    }
    
    /* ============================================
       ANIMATION LOOP
       ============================================ */
    
    startAnimationLoop() {
        let lastTime = 0;
        
        const loop = (currentTime) => {
            const deltaTime = currentTime - lastTime;
            lastTime = currentTime;
            
            this.update(deltaTime);
            this.render();
            
            requestAnimationFrame(loop);
        };
        
        requestAnimationFrame(loop);
        console.log('🔄 Animation loop started');
    }
    
    /* ============================================
       PRESET ANIMATION SEQUENCES
       ============================================ */
    
    doFeedSequence() {
        console.log('🍎 Feed sequence');
        this.animationQueue = [];
        this.playAnimation('Eating', false, () => {
            this.playAnimation('SoFull', false, () => {
                this.playNextAnimation();
            });
        });
    }
    
    doPetSequence() {
        console.log('👋 Pet sequence');
        this.animationQueue = [];
        this.playAnimation('Wave', false, () => {
            this.playAnimation('Happy', false, () => {
                this.playNextAnimation();
            });
        });
    }
    
    doSleepSequence() {
        console.log('💤 Sleep sequence');
        this.animationQueue = [];
        this.playAnimation('Sitting', false, () => {
            this.playAnimation('Resting', false, () => {
                this.playAnimation('Sleep', true); // Loop sleeping
            });
        });
    }
    
    doPokeSequence(pokeCount) {
        console.log(`👊 Poke sequence (count: ${pokeCount})`);
        this.animationQueue = [];
        
        if (pokeCount === 1) {
            // First poke - thinking
            this.playAnimation('Thinking', false, () => {
                this.playNextAnimation();
            });
        } else if (pokeCount <= 3) {
            // 2-3 pokes - waving to stop
            this.playAnimation('Wave', false, () => {
                this.playNextAnimation();
            });
        } else {
            // 4+ pokes - crying
            this.playAnimation('Cry', false, () => {
                this.playNextAnimation();
            });
        }
    }
    
    doTalkingAnimation(loop = true) {
        console.log('🎤 Talking animation');
        this.playAnimation('Talking', loop);
    }
    
    /* ============================================
       UTILITIES
       ============================================ */
    
    getCurrentAnimation() {
        return this.currentAnimation;
    }
    
    isAnimationPlaying() {
        return this.isPlaying;
    }
}