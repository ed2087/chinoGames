// ==========================================
// GAME AUDIO - RAGDOLL PLAYGROUND AUDIO MANAGEMENT
// Handles game-specific audio, music, and voice interactions
// ==========================================

class GameAudio {
    
    constructor(audioSystem = null) {
        this.audioSystem = audioSystem || window.audioSystem;
        this.mathUtils = window.MathUtils;
        this.deviceUtils = window.DeviceUtils;
        
        // Audio configuration
        this.config = {
            // Volume levels
            masterVolume: 0.9,
            musicVolume: 0.3,
            sfxVolume: 0.7,
            voiceVolume: 0.9,
            
            // Audio settings
            enableMusic: true,
            enableSFX: true,
            enableVoice: true,
            enableNarration: true,
            
            // Kid-friendly settings
            maxSimultaneousVoices: 3,
            voiceCooldown: 500, // ms between voice clips
            musicFadeTime: 2000,
            
            // Ragdoll-specific
            celebrationIntensity: 0.8,
            impactThreshold: 10, // Minimum force for impact sounds
            voiceVariation: 0.3,
            
            // Performance
            audioThrottling: this.deviceUtils.device.isMobile
        };
        
        // Audio state
        this.currentMusic = null;
        this.activeSounds = new Map();
        this.voiceQueue = [];
        this.lastVoiceTime = 0;
        this.musicFading = false;
        
        // Sound pools for performance
        this.soundPools = {
            impacts: [],
            celebrations: [],
            interactions: []
        };
        
        // Game-specific audio assets
        this.audioLibrary = this.createAudioLibrary();
        this.musicTracks = this.createMusicLibrary();
        this.voiceLines = this.createVoiceLibrary();
        
        // Analytics
        this.audioStats = {
            voicesPlayed: 0,
            soundsPlayed: 0,
            celebrationCount: 0,
            musicPlayTime: 0
        };
        
        console.log('🎵 GameAudio initialized');
        console.log(
            `🔊 Audio features: Music=${this.config.enableMusic}, SFX=${this.config.enableSFX}, Voice=${this.config.enableVoice}`
        );

        // ✅ Fire the event so the game can start
        document.dispatchEvent(new Event('audioEnabled'));
    }

    
    // ==========================================
    // AUDIO LIBRARIES
    // ==========================================
    
    createAudioLibrary() {
        return {
            // Impact sounds (procedurally generated)
            impacts: {
                light: { type: 'generated', params: { freq: 200, decay: 0.3, volume: 0.4 } },
                medium: { type: 'generated', params: { freq: 150, decay: 0.5, volume: 0.6 } },
                heavy: { type: 'generated', params: { freq: 100, decay: 0.8, volume: 0.8 } },
                metallic: { type: 'generated', params: { freq: 300, decay: 0.2, volume: 0.5, metallic: true } }
            },
            
            // Celebration sounds
            celebrations: {
                cheer: { type: 'generated', params: { freq: 400, duration: 0.5, cheerful: true } },
                fanfare: { type: 'generated', params: { freq: 500, duration: 1.0, triumph: true } },
                applause: { type: 'generated', params: { noise: true, duration: 2.0, applause: true } }
            },
            
            // Interaction sounds
            interactions: {
                grab: { type: 'generated', params: { freq: 300, decay: 0.2, volume: 0.3 } },
                release: { type: 'generated', params: { freq: 250, decay: 0.4, volume: 0.4 } },
                drag: { type: 'generated', params: { freq: 200, continuous: true, volume: 0.2 } }
            },
            
            // Environmental sounds
            environment: {
                wind: { type: 'generated', params: { noise: true, lowpass: 500, volume: 0.1 } },
                bounce: { type: 'generated', params: { freq: 180, decay: 0.6, bouncy: true } }
            }
        };
    }
    
    createMusicLibrary() {
        return {
            // Background music tracks (procedurally generated or simple melodies)
            playful: {
                name: 'Playful Playground',
                tempo: 120,
                key: 'C major',
                mood: 'happy',
                instruments: ['piano', 'xylophone', 'light_percussion'],
                generated: true
            },
            
            adventure: {
                name: 'Ragdoll Adventure',
                tempo: 140,
                key: 'G major',
                mood: 'exciting',
                instruments: ['strings', 'brass', 'drums'],
                generated: true
            },
            
            calm: {
                name: 'Peaceful Play',
                tempo: 80,
                key: 'F major',
                mood: 'relaxing',
                instruments: ['soft_piano', 'flute', 'ambient'],
                generated: true
            }
        };
    }
    
    createVoiceLibrary() {
        return {
            // Game events
            gameStart: [
                "Welcome to Ragdoll Playground!",
                "Let's play with ragdolls!",
                "Time for some physics fun!",
                "Ready to play and learn?"
            ],
            
            gameInstructions: [
                "Touch and drag the ragdoll around!",
                "Try throwing the ragdoll by swiping fast!",
                "Press the buttons to change characters!",
                "See what happens when you let go!"
            ],
            
            // Character interactions
            characterSpawn: {
                human: ["Here comes a person!", "A human appears!", "Someone new to play with!"],
                teddy: ["It's a cuddly teddy bear!", "A soft friend is here!", "Teddy bear ready to play!"],
                frog: ["Ribbit! Here's a bouncy frog!", "A hopping friend appears!", "Ready to jump around!"],
                robot: ["Beep! Robot activated!", "A mechanical friend is here!", "Robot ready for fun!"],
                alien: ["Greetings from space!", "An otherworldly visitor!", "Mysterious friend appears!"]
            },
            
            // Actions and reactions
            throwing: [
                "What a throw!",
                "Flying through the air!",
                "Wheee! So fast!",
                "Look at it go!",
                "Amazing throw!"
            ],
            
            impacts: {
                light: ["Gentle bump!", "Soft landing!", "Easy does it!"],
                medium: ["Nice impact!", "Bouncy bounce!", "Good collision!"],
                heavy: ["Big crash!", "Wow, that was strong!", "What a hit!"]
            },
            
            celebrations: [
                "Fantastic job!",
                "You're amazing at this!",
                "What great playing!",
                "Keep up the fun!",
                "Wonderful physics!",
                "So creative!",
                "Brilliant moves!"
            ],
            
            encouragement: [
                "Try something new!",
                "What happens if you do this?",
                "Experiment and explore!",
                "Physics is so much fun!",
                "Every move teaches us something!",
                "You're learning so much!"
            ],
            
            // Special events
            jointBreak: [
                "Oh! Something came apart!",
                "The pieces are separating!",
                "Physics in action!",
                "Parts are moving freely now!"
            ],
            
            explosion: [
                "BOOM! What an explosion!",
                "Pieces flying everywhere!",
                "Dramatic physics!",
                "Look at all those parts!"
            ],
            
            multipleRagdolls: [
                "So many friends to play with!",
                "A whole ragdoll party!",
                "Multiple physics objects!",
                "The playground is getting busy!"
            ],
            
            // Educational moments
            physics: [
                "Gravity pulls everything down!",
                "Force makes things move!",
                "Heavy things fall faster!",
                "Bouncy materials bounce back!",
                "Friction slows things down!",
                "Energy moves from one thing to another!"
            ]
        };
    }
    
    // ==========================================
    // VOICE MANAGEMENT
    // ==========================================
    
    /**
     * Play contextual voice line
     */
    playVoice(category, subcategory = null, options = {}) {
        if (!this.config.enableVoice || !this.audioSystem?.isInitialized) return false;
        
        // Check cooldown
        const now = Date.now();
        if (now - this.lastVoiceTime < this.config.voiceCooldown) {
            return false;
        }
        
        // Get voice lines
        let voiceLines;
        if (subcategory && this.voiceLines[category]?.[subcategory]) {
            voiceLines = this.voiceLines[category][subcategory];
        } else if (this.voiceLines[category]) {
            voiceLines = Array.isArray(this.voiceLines[category]) ? 
                        this.voiceLines[category] : 
                        Object.values(this.voiceLines[category])[0];
        } else {
            console.warn(`Voice category not found: ${category}.${subcategory}`);
            return false;
        }
        
        if (!voiceLines || voiceLines.length === 0) return false;
        
        // Select random voice line
        const message = this.mathUtils.randomChoice(voiceLines);
        
        // Configure voice
        const voiceConfig = {
            pitch: 1.2 + (Math.random() - 0.5) * this.config.voiceVariation,
            rate: 0.8 + (Math.random() * 0.4),
            volume: this.config.voiceVolume,
            ...options.voiceSettings
        };
        
        // Play voice
        this.audioSystem.speak(message, voiceConfig);
        
        this.lastVoiceTime = now;
        this.audioStats.voicesPlayed++;
        
        console.log(`🗣️ Playing voice: ${category}.${subcategory} - "${message}"`);
        return true;
    }
    
    /**
     * Queue voice line for delayed playback
     */
    queueVoice(category, subcategory = null, delay = 1000, options = {}) {
        const voiceItem = {
            category: category,
            subcategory: subcategory,
            options: options,
            scheduledTime: Date.now() + delay,
            id: Math.random().toString(36).substr(2, 9)
        };
        
        this.voiceQueue.push(voiceItem);
        
        // Auto-clean queue
        setTimeout(() => {
            this.voiceQueue = this.voiceQueue.filter(item => item.id !== voiceItem.id);
        }, delay + 5000);
        
        return voiceItem.id;
    }
    
    /**
     * Process voice queue
     */
    processVoiceQueue() {
        if (this.voiceQueue.length === 0) return;
        
        const now = Date.now();
        const readyVoices = this.voiceQueue.filter(item => now >= item.scheduledTime);
        
        for (const voice of readyVoices) {
            this.playVoice(voice.category, voice.subcategory, voice.options);
            
            // Remove from queue
            const index = this.voiceQueue.indexOf(voice);
            if (index > -1) {
                this.voiceQueue.splice(index, 1);
            }
        }
    }
    
    // ==========================================
    // SOUND EFFECTS
    // ==========================================
    
    /**
     * Play impact sound based on force
     */
    playImpactSound(impactForce, materialType = 'default') {
        if (!this.config.enableSFX || impactForce < this.config.impactThreshold) return false;
        
        // Determine impact intensity
        let intensity;
        if (impactForce < 20) intensity = 'light';
        else if (impactForce < 50) intensity = 'medium';
        else intensity = 'heavy';
        
        // Play impact sound
        this.playGeneratedSound('impacts', intensity, { 
            volume: Math.min(impactForce / 100, 1.0),
            material: materialType 
        });
        
        // Play corresponding voice
        this.queueVoice('impacts', intensity, 500);
        
        this.audioStats.soundsPlayed++;
        return true;
    }
    
    /**
     * Play celebration sound and voice
     */
    playCelebration(intensity = 'normal') {
        if (!this.config.enableSFX) return false;
        
        // Play celebration sound
        this.playGeneratedSound('celebrations', 'cheer', { 
            volume: this.config.celebrationIntensity 
        });
        
        // Play celebration voice
        this.playVoice('celebrations');
        
        // Add some sparkle sounds if high intensity
        if (intensity === 'high') {
            setTimeout(() => {
                this.playGeneratedSound('celebrations', 'fanfare');
            }, 200);
        }
        
        this.audioStats.celebrationCount++;
        return true;
    }
    
    /**
     * Play interaction sound
     */
    playInteractionSound(interactionType, options = {}) {
        if (!this.config.enableSFX) return false;
        
        const soundData = this.audioLibrary.interactions[interactionType];
        if (!soundData) {
            console.warn(`Unknown interaction sound: ${interactionType}`);
            return false;
        }
        
        this.playGeneratedSound('interactions', interactionType, options);
        this.audioStats.soundsPlayed++;
        return true;
    }
    
    // ==========================================
    // PROCEDURAL SOUND GENERATION
    // ==========================================
    
    playGeneratedSound(category, soundType, options = {}) {
        if (!this.audioSystem?.audioContext) return false;
        
        const soundData = this.audioLibrary[category]?.[soundType];
        if (!soundData || soundData.type !== 'generated') return false;
        
        const params = { ...soundData.params, ...options };
        
        try {
            const audioContext = this.audioSystem.audioContext;
            
            // Create oscillator and gain
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            // Configure oscillator
            oscillator.frequency.setValueAtTime(params.freq || 440, audioContext.currentTime);
            oscillator.type = this.getOscillatorType(params);
            
            // Configure envelope
            const volume = (params.volume || 0.5) * this.config.sfxVolume;
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
            
            const duration = params.duration || params.decay || 0.3;
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            
            // Add effects based on params
            let destination = gainNode;
            
            if (params.metallic) {
                destination = this.addMetallicEffect(audioContext, destination);
            }
            
            if (params.bouncy) {
                this.addBouncyModulation(oscillator, audioContext);
            }
            
            if (params.noise) {
                return this.generateNoiseSound(audioContext, params);
            }
            
            // Connect and play
            oscillator.connect(destination);
            destination.connect(audioContext.destination);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
            
            return true;
            
        } catch (error) {
            console.warn('Error generating sound:', error);
            return false;
        }
    }
    
    getOscillatorType(params) {
        if (params.cheerful) return 'triangle';
        if (params.metallic) return 'sawtooth';
        if (params.bouncy) return 'sine';
        return 'sine';
    }
    
    addMetallicEffect(audioContext, source) {
        const filter = audioContext.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(200, audioContext.currentTime);
        filter.Q.setValueAtTime(5, audioContext.currentTime);
        
        source.connect(filter);
        return filter;
    }
    
    addBouncyModulation(oscillator, audioContext) {
        const lfo = audioContext.createOscillator();
        const lfoGain = audioContext.createGain();
        
        lfo.frequency.setValueAtTime(8, audioContext.currentTime);
        lfoGain.gain.setValueAtTime(20, audioContext.currentTime);
        
        lfo.connect(lfoGain);
        lfoGain.connect(oscillator.frequency);
        
        lfo.start(audioContext.currentTime);
        lfo.stop(audioContext.currentTime + 1);
    }
    
    generateNoiseSound(audioContext, params) {
        const bufferSize = audioContext.sampleRate * (params.duration || 1);
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Generate noise
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (params.volume || 0.5);
        }
        
        const source = audioContext.createBufferSource();
        const gainNode = audioContext.createGain();
        
        source.buffer = buffer;
        gainNode.gain.setValueAtTime(this.config.sfxVolume, audioContext.currentTime);
        
        // Add filtering for different noise types
        if (params.applause) {
            const filter = audioContext.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(1000, audioContext.currentTime);
            source.connect(filter);
            filter.connect(gainNode);
        } else {
            source.connect(gainNode);
        }
        
        gainNode.connect(audioContext.destination);
        
        source.start(audioContext.currentTime);
        
        return true;
    }
    
    // ==========================================
    // RAGDOLL-SPECIFIC AUDIO
    // ==========================================
    
    /**
     * Handle ragdoll spawn audio
     */
    onRagdollSpawned(ragdollType) {
        // Play spawn sound
        this.playGeneratedSound('interactions', 'grab', { volume: 0.6 });
        
        // Play character-specific welcome
        this.playVoice('characterSpawn', ragdollType.toLowerCase());
        
        console.log(`🎭 Ragdoll spawned audio: ${ragdollType}`);
    }
    
    /**
     * Handle ragdoll throw audio
     */
    onRagdollThrown(throwData) {
        const speed = throwData.speed || throwData.releaseSpeed || 0;
        
        if (speed > 100) {
            this.playVoice('throwing');
            this.playGeneratedSound('interactions', 'release', { 
                volume: Math.min(speed / 200, 1.0),
                pitch: 1 + (speed / 500)
            });
        }
    }
    
    /**
     * Handle joint break audio
     */
    onJointBreak(jointData) {
        // Play break sound
        this.playGeneratedSound('impacts', 'light', { 
            volume: 0.8,
            pitch: 1.5 
        });
        
        // Queue educational voice
        this.queueVoice('jointBreak', null, 800);
    }
    
    /**
     * Handle explosion audio
     */
    onExplosion(explosionData) {
        const intensity = explosionData.intensity || explosionData.force || 1.0;
        
        // Play explosion sound
        this.playGeneratedSound('impacts', 'heavy', { 
            volume: Math.min(intensity, 1.0),
            duration: 0.8 
        });
        
        // Play explosion voice
        this.playVoice('explosion');
        
        // Celebration if big explosion
        if (intensity > 0.7) {
            this.queueVoice('celebrations', null, 1500);
        }
    }
    
    /**
     * Handle multiple ragdolls
     */
    onMultipleRagdolls(count) {
        if (count >= 3) {
            this.queueVoice('multipleRagdolls', null, 1000);
        }
    }
    
    // ==========================================
    // BACKGROUND MUSIC
    // ==========================================
    
    /**
     * Start background music
     */
    startMusic(trackName = 'playful') {
        if (!this.config.enableMusic || this.currentMusic === trackName) return false;
        
        // Stop current music
        this.stopMusic();
        
        const track = this.musicTracks[trackName];
        if (!track) {
            console.warn(`Unknown music track: ${trackName}`);
            return false;
        }
        
        if (track.generated) {
            this.startGeneratedMusic(track);
        } else {
            // Handle prerecorded music if available
            console.log(`Starting music track: ${track.name}`);
        }
        
        this.currentMusic = trackName;
        console.log(`🎵 Started music: ${track.name}`);
        
        return true;
    }
    
    /**
     * Stop background music
     */
    stopMusic() {
        if (!this.currentMusic) return false;
        
        this.musicFading = true;
        
        // Fade out music
        setTimeout(() => {
            this.currentMusic = null;
            this.musicFading = false;
            console.log('🎵 Music stopped');
        }, this.config.musicFadeTime);
        
        return true;
    }
    
    startGeneratedMusic(track) {
        // Simple procedural background music
        // This is a placeholder - in a full implementation, you'd want more sophisticated music generation
        console.log(`🎶 Generating ${track.mood} music at ${track.tempo} BPM`);
        
        // Could implement simple chord progressions and melodies here
        // For now, we'll just log that music would be playing
    }
    
    // ==========================================
    // CONTEXTUAL AUDIO
    // ==========================================
    
    /**
     * Play contextual encouragement 
     */
    playEncouragement() {
        if (Math.random() < 0.3) { // 30% chance
            this.queueVoice('encouragement', null, this.mathUtils.randomFloat(2000, 5000));
        }
    }
    
    /**
     * Play educational physics comment 
     */
    playPhysicsEducation(context = null) {
        if (Math.random() < 0.2) { // 20% chance for educational moments
            this.queueVoice('physics', null, this.mathUtils.randomFloat(3000, 8000));
        }
    }
    
    /**
     * Handle game milestone
     */
    onGameMilestone(milestone) {
        switch (milestone) {
            case 'firstThrow':
                this.playVoice('throwing');
                break;
                
            case 'firstBreak':
                this.queueVoice('jointBreak', null, 500);
                break;
                
            case 'tenInteractions':
                this.playCelebration('high');
                this.queueVoice('celebrations', null, 1000);
                break;
                
            case 'allCharacters':
                this.playVoice('multipleRagdolls');
                this.playCelebration('high');
                break;
        }
    }
    
    // ==========================================
    // SETTINGS & CONTROLS
    // ==========================================
    
    /**
     * Set volume levels
     */
    setVolume(category, volume) {
        const validCategories = ['master', 'music', 'sfx', 'voice'];
        if (!validCategories.includes(category)) {
            console.warn(`Invalid volume category: ${category}`);
            return false;
        }
        
        const clampedVolume = this.mathUtils.clamp(volume, 0, 1);
        this.config[category + 'Volume'] = clampedVolume;
        
        console.log(`🔊 ${category} volume set to ${(clampedVolume * 100).toFixed(0)}%`);
        return true;
    }
    
    /**
     * Toggle audio category
     */
    toggleAudio(category) {
        const configKey = 'enable' + category.charAt(0).toUpperCase() + category.slice(1);
        
        if (this.config.hasOwnProperty(configKey)) {
            this.config[configKey] = !this.config[configKey];
            console.log(`🔊 ${category} ${this.config[configKey] ? 'enabled' : 'disabled'}`);
            
            if (category === 'music' && !this.config[configKey]) {
                this.stopMusic();
            }
            
            return this.config[configKey];
        }
        
        return false;
    }
    
    /**
     * Get current settings
     */
    getSettings() {
        return {
            volumes: {
                master: this.config.masterVolume,
                music: this.config.musicVolume,
                sfx: this.config.sfxVolume,
                voice: this.config.voiceVolume
            },
            
            enabled: {
                music: this.config.enableMusic,
                sfx: this.config.enableSFX,
                voice: this.config.enableVoice,
                narration: this.config.enableNarration
            },
            
            currentMusic: this.currentMusic,
            activeVoices: this.voiceQueue.length,
            activeSounds: this.activeSounds.size
        };
    }
    
    // ==========================================
    // UPDATE & MAINTENANCE
    // ==========================================
    
    /**
     * Update audio system
     */
    update(deltaTime) {
        // Process voice queue
        this.processVoiceQueue();
        
        // Update music playback time
        if (this.currentMusic && !this.musicFading) {
            this.audioStats.musicPlayTime += deltaTime;
        }
        
        // Clean up expired active sounds
        const now = Date.now();
        for (const [soundId, soundData] of this.activeSounds) {
            if (now - soundData.startTime > soundData.duration) {
                this.activeSounds.delete(soundId);
            }
        }
        
        // Periodic encouragement
        if (Math.random() < 0.0001) { // Very low chance per frame
            this.playEncouragement();
        }
    }
    
    /**
     * Get audio statistics
     */
    getStats() {
        return {
            ...this.audioStats,
            
            activeVoices: this.voiceQueue.length,
            activeSounds: this.activeSounds.size,
            currentMusic: this.currentMusic,
            
            performance: {
                throttling: this.config.audioThrottling,
                maxVoices: this.config.maxSimultaneousVoices,
                cooldown: this.config.voiceCooldown
            },
            
            library: {
                musicTracks: Object.keys(this.musicTracks).length,
                soundEffects: Object.keys(this.audioLibrary).reduce((sum, category) => 
                    sum + Object.keys(this.audioLibrary[category]).length, 0),
                voiceLines: this.countVoiceLines()
            }
        };
    }
    
    countVoiceLines() {
        let total = 0;
        
        const countLines = (obj) => {
            if (Array.isArray(obj)) {
                return obj.length;
            } else if (typeof obj === 'object') {
                return Object.values(obj).reduce((sum, val) => sum + countLines(val), 0);
            }
            return 0;
        };
        
        return countLines(this.voiceLines);
    }
    
    // ==========================================
    // DEBUG & UTILITIES
    // ==========================================
    
    /**
     * Test all audio systems
     */
    testAudio() {
        console.log('🧪 Testing GameAudio systems...');
        
        // Test voice
        this.playVoice('gameStart');
        
        setTimeout(() => {
            // Test sound effects
            this.playImpactSound(25, 'metal');
        }, 2000);
        
        setTimeout(() => {
            // Test celebration
            this.playCelebration('high');
        }, 4000);
        
        setTimeout(() => {
            // Test music
            this.startMusic('playful');
        }, 6000);
        
        console.log('✅ Audio test sequence started');
    }
    
    /**
     * Get debug information
     */
    getDebugInfo() {
        return {
            ...this.getStats(),
            
            config: this.config,
            
            queues: {
                voiceQueue: this.voiceQueue.length,
                activeSounds: Array.from(this.activeSounds.keys())
            },
            
            timing: {
                lastVoiceTime: this.lastVoiceTime,
                timeSinceLastVoice: Date.now() - this.lastVoiceTime,
                musicFading: this.musicFading
            },
            
            audioSystem: {
                available: !!this.audioSystem,
                initialized: this.audioSystem?.isInitialized || false,
                hasContext: !!this.audioSystem?.audioContext
            }
        };
    }
    
    // ==========================================
    // CLEANUP
    // ==========================================
    
    /**
     * Clean shutdown
     */
    destroy() {
        console.log('🗑️ Destroying GameAudio...');
        
        // Stop all audio
        this.stopMusic();
        this.voiceQueue = [];
        this.activeSounds.clear();
        
        // Clear references
        this.audioSystem = null;
        
        console.log('✅ GameAudio destroyed');
    }
}

// Make available globally
window.GameAudio = GameAudio;

console.log('🎵 GameAudio loaded - Comprehensive game audio management ready');