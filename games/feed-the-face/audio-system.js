// ==========================================
// TODDLER-FRIENDLY AUDIO SYSTEM
// ==========================================

class AudioSystem {
    constructor(options = {}) {
        // Configuration with toddler-optimized defaults
        this.config = {
            // Voice settings optimized for children
            defaultRate: 0.75,          // Slower for clarity
            defaultPitch: 1.3,          // Higher pitch = more playful
            defaultVolume: 0.9,         // Clear but not overwhelming
            
            // Child-friendly voice preferences
            preferredVoices: [
                // High-quality child voices
                'Microsoft Ana Online (Natural) - English (United States)',
                'Google UK English Female',
                'Microsoft Zira - English (United States)',
                'Samantha',
                'Karen',
                'Tessa',
                'Moira',
                'Fiona',
                'Alex',
                
                // Fallback patterns
                'female',
                'woman',
                'girl',
                'child'
            ],
            
            // Language support
            defaultLanguage: 'en-US',
            supportedLanguages: ['en-US', 'en-GB', 'en-AU', 'en-CA'],
            
            // Audio effects
            enableEffects: true,
            celebrationSounds: true,
            backgroundMusic: false,
            
            // Accessibility
            respectUserPreferences: true,
            allowInterruption: true,
            queueManagement: true,
            
            ...options
        };
        
        // State management
        this.isInitialized = false;
        this.availableVoices = [];
        this.selectedVoice = null;
        this.speechQueue = [];
        this.isPlaying = false;
        this.currentUtterance = null;
        
        // Device detection
        this.device = this.detectDevice();
        
        // Audio context for sound effects
        this.audioContext = null;
        this.soundBuffers = new Map();
        
        this.init();
    }
    
    // ==========================================
    // INITIALIZATION
    // ==========================================
    
    async init() {
        console.log('🔊 Initializing Toddler Audio System...');
        
        try {
            // Check browser support
            if (!this.checkBrowserSupport()) {
                console.warn('⚠️ Limited audio support detected');
                return false;
            }
            
            // Initialize speech synthesis
            await this.initializeSpeechSynthesis();
            
            // Initialize audio context for effects
            await this.initializeAudioContext();
            
            // Preload sound effects
            await this.preloadSoundEffects();
            
            this.isInitialized = true;
            console.log('✅ Audio System Ready!');
            console.log(`🎵 Found ${this.availableVoices.length} voices`);
            console.log(`🎯 Selected voice: ${this.selectedVoice?.name || 'Default'}`);
            
            return true;
        } catch (error) {
            console.error('❌ Audio System initialization failed:', error);
            return false;
        }
    }
    
    checkBrowserSupport() {
        const support = {
            speechSynthesis: 'speechSynthesis' in window,
            audioContext: 'AudioContext' in window || 'webkitAudioContext' in window,
            getUserMedia: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices
        };
        
        console.log('🔍 Browser Support:', support);
        return support.speechSynthesis;
    }
    
    detectDevice() {
        const userAgent = navigator.userAgent.toLowerCase();
        const device = {
            isIOS: /iphone|ipad|ipod/.test(userAgent),
            isAndroid: /android/.test(userAgent),
            isMobile: /mobile/.test(userAgent),
            isTablet: /tablet|ipad/.test(userAgent),
            isDesktop: !(/mobile|tablet|ipad/.test(userAgent)),
            browser: this.getBrowserType()
        };
        
        console.log('📱 Device detected:', device);
        return device;
    }
    
    getBrowserType() {
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes('chrome')) return 'chrome';
        if (userAgent.includes('firefox')) return 'firefox';
        if (userAgent.includes('safari')) return 'safari';
        if (userAgent.includes('edge')) return 'edge';
        return 'unknown';
    }
    
    // ==========================================
    // SPEECH SYNTHESIS SETUP
    // ==========================================
    
    async initializeSpeechSynthesis() {
        return new Promise((resolve) => {
            const loadVoices = () => {
                this.availableVoices = speechSynthesis.getVoices();
                
                if (this.availableVoices.length > 0) {
                    this.selectBestVoice();
                    resolve();
                } else {
                    // Some browsers need time to load voices
                    setTimeout(loadVoices, 100);
                }
            };
            
            // Handle voice loading across different browsers
            if (speechSynthesis.onvoiceschanged !== undefined) {
                speechSynthesis.onvoiceschanged = loadVoices;
            }
            
            loadVoices();
        });
    }
    
    selectBestVoice() {
        let bestVoice = null;
        let bestScore = -1;
        
        for (const voice of this.availableVoices) {
            let score = 0;
            
            // Prefer voices in our target language
            if (voice.lang.startsWith(this.config.defaultLanguage.substring(0, 2))) {
                score += 10;
            }
            
            // Score based on voice name preferences
            for (let i = 0; i < this.config.preferredVoices.length; i++) {
                const preference = this.config.preferredVoices[i].toLowerCase();
                const voiceName = voice.name.toLowerCase();
                
                if (voiceName.includes(preference)) {
                    score += (this.config.preferredVoices.length - i) * 2;
                    break;
                }
            }
            
            // Prefer female voices for children (research shows preference)
            if (voice.name.toLowerCase().includes('female') || 
                voice.name.toLowerCase().includes('woman') ||
                voice.name.toLowerCase().includes('girl')) {
                score += 5;
            }
            
            // Prefer local voices for better performance
            if (voice.localService) {
                score += 3;
            }
            
            // Device-specific optimizations
            if (this.device.isIOS && voice.name.includes('Enhanced')) {
                score += 8;
            }
            
            if (this.device.isAndroid && voice.name.includes('Google')) {
                score += 6;
            }
            
            if (score > bestScore) {
                bestScore = score;
                bestVoice = voice;
            }
        }
        
        this.selectedVoice = bestVoice;
        console.log(`🎯 Selected best voice: ${bestVoice?.name} (score: ${bestScore})`);
    }
    
    // ==========================================
    // AUDIO CONTEXT FOR SOUND EFFECTS
    // ==========================================
    
    async initializeAudioContext() {
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContextClass();
            
            // Resume context on user interaction for mobile devices
            if (this.audioContext.state === 'suspended') {
                const resumeContext = () => {
                    this.audioContext.resume();
                    document.removeEventListener('touchstart', resumeContext);
                    document.removeEventListener('click', resumeContext);
                };
                
                document.addEventListener('touchstart', resumeContext);
                document.addEventListener('click', resumeContext);
            }
            
            console.log('🎵 Audio Context initialized');
        } catch (error) {
            console.warn('⚠️ Audio Context not available:', error);
        }
    }
    
    async preloadSoundEffects() {
        if (!this.audioContext) return;
        
        const effects = {
            // Celebration sounds (generated programmatically)
            'success': this.generateSuccessSound(),
            'celebration': this.generateCelebrationSound(),
            'pop': this.generatePopSound(),
            'sparkle': this.generateSparkleSound(),
            'chime': this.generateChimeSound()
        };
        
        for (const [name, audioBuffer] of Object.entries(effects)) {
            if (audioBuffer) {
                this.soundBuffers.set(name, audioBuffer);
            }
        }
        
        console.log(`🎶 Preloaded ${this.soundBuffers.size} sound effects`);
    }
    
    // ==========================================
    // TEXT-TO-SPEECH MAIN FUNCTIONS
    // ==========================================
    
    /**
     * Main function to speak text with toddler-friendly settings
     * @param {string} text - Text to speak
     * @param {object} options - Voice options
     */
    speak(text, options = {}) {
        if (!this.isInitialized || !text) {
            console.warn('⚠️ Audio system not ready or no text provided');
            return false;
        }
        
        // Clean and prepare text
        const cleanText = this.prepareTextForSpeech(text);
        
        // Create utterance with toddler-optimized settings
        const utterance = new SpeechSynthesisUtterance(cleanText);
        
        // Apply voice settings
        this.configureUtterance(utterance, options);
        
        // Handle speech interruption if needed
        if (options.interrupt !== false && this.isPlaying) {
            this.stop();
        }
        
        // Queue or speak immediately
        if (options.queue && this.isPlaying) {
            this.speechQueue.push(utterance);
        } else {
            this.speakUtterance(utterance);
        }
        
        return true;
    }
    
    prepareTextForSpeech(text) {
        // Remove HTML tags
        let cleanText = text.replace(/<[^>]*>/g, '');
        
        // Add pauses for better toddler comprehension
        cleanText = cleanText.replace(/[.!?]/g, '$&... ');
        
        // Slow down number sequences
        cleanText = cleanText.replace(/\d+/g, (match) => {
            return match.split('').join('... ');
        });
        
        // Make colors more exciting
        const colorWords = {
            'red': 'bright red',
            'blue': 'beautiful blue',
            'yellow': 'sunny yellow',
            'green': 'lovely green',
            'orange': 'happy orange',
            'purple': 'pretty purple',
            'pink': 'sweet pink'
        };
        
        for (const [color, replacement] of Object.entries(colorWords)) {
            const regex = new RegExp(`\\b${color}\\b`, 'gi');
            cleanText = cleanText.replace(regex, replacement);
        }
        
        return cleanText.trim();
    }
    
    configureUtterance(utterance, options = {}) {
        // Set voice
        utterance.voice = this.selectedVoice;
        
        // Toddler-optimized speech parameters
        utterance.rate = options.rate || this.config.defaultRate;
        utterance.pitch = options.pitch || this.config.defaultPitch;
        utterance.volume = options.volume || this.config.defaultVolume;
        utterance.lang = options.language || this.config.defaultLanguage;
        
        // Device-specific adjustments
        if (this.device.isIOS) {
            utterance.rate *= 0.9; // iOS tends to be faster
        }
        
        if (this.device.isAndroid) {
            utterance.pitch *= 1.1; // Android can handle higher pitch
        }
        
        // Event handlers
        utterance.onstart = () => {
            this.isPlaying = true;
            this.currentUtterance = utterance;
            this.onSpeechStart?.(utterance);
        };
        
        utterance.onend = () => {
            this.isPlaying = false;
            this.currentUtterance = null;
            this.processQueue();
            this.onSpeechEnd?.(utterance);
        };
        
        utterance.onerror = (event) => {
            console.error('🔊 Speech error:', event);
            this.isPlaying = false;
            this.currentUtterance = null;
            this.processQueue();
            this.onSpeechError?.(event);
        };
        
        return utterance;
    }
    
    speakUtterance(utterance) {
        try {
            speechSynthesis.speak(utterance);
        } catch (error) {
            console.error('🔊 Failed to speak:', error);
        }
    }
    
    processQueue() {
        if (this.speechQueue.length > 0 && !this.isPlaying) {
            const nextUtterance = this.speechQueue.shift();
            this.speakUtterance(nextUtterance);
        }
    }
    
    // ==========================================
    // CONTROL FUNCTIONS
    // ==========================================
    
    stop() {
        speechSynthesis.cancel();
        this.speechQueue = [];
        this.isPlaying = false;
        this.currentUtterance = null;
    }
    
    pause() {
        if (speechSynthesis.speaking) {
            speechSynthesis.pause();
        }
    }
    
    resume() {
        if (speechSynthesis.paused) {
            speechSynthesis.resume();
        }
    }
    
    // ==========================================
    // PRESET VOICE FUNCTIONS FOR GAMES
    // ==========================================
    
    speakColor(colorName) {
        const colorPhrases = {
            'red': ['Red like a fire truck!', 'Bright red!', 'Red like an apple!'],
            'blue': ['Blue like the sky!', 'Beautiful blue!', 'Blue like the ocean!'],
            'yellow': ['Yellow like the sun!', 'Sunny yellow!', 'Yellow like a banana!'],
            'green': ['Green like grass!', 'Lovely green!', 'Green like a frog!'],
            'orange': ['Orange like a pumpkin!', 'Happy orange!', 'Orange like a carrot!'],
            'purple': ['Purple like grapes!', 'Pretty purple!', 'Purple like a flower!'],
            'pink': ['Pink like a flamingo!', 'Sweet pink!', 'Pink like cotton candy!'],
            'brown': ['Brown like chocolate!', 'Warm brown!', 'Brown like a teddy bear!'],
            'black': ['Black like night!', 'Dark black!', 'Black like a cat!'],
            'white': ['White like snow!', 'Pure white!', 'White like a cloud!'],
            'gray': ['Gray like an elephant!', 'Cool gray!', 'Gray like a mouse!']
        };
        
        const phrases = colorPhrases[colorName.toLowerCase()] || [colorName];
        const phrase = phrases[Math.floor(Math.random() * phrases.length)];
        
        this.speak(phrase, { pitch: 1.4, rate: 0.8 });
    }
    
    speakNumber(number) {
        const numberPhrases = {
            1: ['One!', 'Number one!', 'One little one!'],
            2: ['Two!', 'Number two!', 'Two like twins!'],
            3: ['Three!', 'Number three!', 'Three little bears!'],
            4: ['Four!', 'Number four!', 'Four like wheels!'],
            5: ['Five!', 'Number five!', 'Five like fingers!'],
            6: ['Six!', 'Number six!', 'Six like legs on a bug!'],
            7: ['Seven!', 'Number seven!', 'Lucky seven!'],
            8: ['Eight!', 'Number eight!', 'Eight like an octopus!'],
            9: ['Nine!', 'Number nine!', 'Number nine!'],
            10: ['Ten!', 'Number ten!', 'Ten little toes!']
        };
        
        const phrases = numberPhrases[number] || [`${number}!`];
        const phrase = phrases[Math.floor(Math.random() * phrases.length)];
        
        this.speak(phrase, { pitch: 1.3, rate: 0.7 });
    }
    
    speakShape(shapeName) {
        const shapePhrases = {
            'circle': ['Circle! Round and round!', 'A perfect circle!', 'Circle like a ball!'],
            'square': ['Square! Four equal sides!', 'A perfect square!', 'Square like a box!'],
            'triangle': ['Triangle! Three pointy sides!', 'A triangle!', 'Triangle like a mountain!'],
            'rectangle': ['Rectangle! Long and wide!', 'A rectangle!', 'Rectangle like a door!'],
            'star': ['Star! Twinkle twinkle!', 'A shiny star!', 'Star like in the sky!'],
            'heart': ['Heart! Full of love!', 'A sweet heart!', 'Heart shape!'],
            'oval': ['Oval! Like an egg!', 'An oval shape!', 'Oval like a football!']
        };
        
        const phrases = shapePhrases[shapeName.toLowerCase()] || [shapeName];
        const phrase = phrases[Math.floor(Math.random() * phrases.length)];
        
        this.speak(phrase, { pitch: 1.2, rate: 0.8 });
    }
    
    speakCelebration() {
        const celebrations = [
            'Hooray! Great job!',
            'Awesome! You did it!',
            'Wonderful! Keep going!',
            'Amazing! You\'re so smart!',
            'Fantastic! Well done!',
            'Excellent! You\'re learning so much!',
            'Bravo! That was perfect!',
            'Super! You\'re doing great!'
        ];
        
        const phrase = celebrations[Math.floor(Math.random() * celebrations.length)];
        this.speak(phrase, { pitch: 1.5, rate: 0.9 });
        
        // Add celebration sound effect
        this.playSoundEffect('celebration');
    }
    
    speakEncouragement() {
        const encouragements = [
            'Try again! You can do it!',
            'Keep trying! You\'re doing great!',
            'Good try! Let\'s try once more!',
            'Almost there! Keep going!',
            'You\'re learning! That\'s wonderful!',
            'Good job trying! Practice makes perfect!'
        ];
        
        const phrase = encouragements[Math.floor(Math.random() * encouragements.length)];
        this.speak(phrase, { pitch: 1.3, rate: 0.8 });
    }
    
    // ==========================================
    // SOUND EFFECTS
    // ==========================================
    
    playSoundEffect(effectName) {
        if (!this.audioContext || !this.soundBuffers.has(effectName)) {
            return false;
        }
        
        try {
            const buffer = this.soundBuffers.get(effectName);
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();
            
            source.buffer = buffer;
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Adjust volume for toddlers (not too loud)
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            
            source.start(0);
            return true;
        } catch (error) {
            console.warn('⚠️ Could not play sound effect:', effectName, error);
            return false;
        }
    }
    
    // ==========================================
    // SOUND GENERATION
    // ==========================================
    
    generateSuccessSound() {
        if (!this.audioContext) return null;
        
        const duration = 0.3;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            const frequency = 440 + (t * 220); // Rising tone
            data[i] = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 3);
        }
        
        return buffer;
    }
    
    generateCelebrationSound() {
        if (!this.audioContext) return null;
        
        const duration = 0.8;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            const frequency1 = 523 * Math.sin(t * 8); // Wobbling frequency
            const frequency2 = 659 * Math.sin(t * 12);
            data[i] = (Math.sin(2 * Math.PI * frequency1 * t) + 
                      Math.sin(2 * Math.PI * frequency2 * t)) * 0.3 * Math.exp(-t * 2);
        }
        
        return buffer;
    }
    
    generatePopSound() {
        if (!this.audioContext) return null;
        
        const duration = 0.1;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 50);
        }
        
        return buffer;
    }
    
    generateSparkleSound() {
        if (!this.audioContext) return null;
        
        const duration = 0.4;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            const frequency = 800 + (Math.sin(t * 20) * 400);
            data[i] = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 8) * 0.3;
        }
        
        return buffer;
    }
    
    generateChimeSound() {
        if (!this.audioContext) return null;
        
        const duration = 1.0;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        const frequencies = [523, 659, 784]; // C, E, G chord
        
        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            let sample = 0;
            
            for (const freq of frequencies) {
                sample += Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 2);
            }
            
            data[i] = sample * 0.2;
        }
        
        return buffer;
    }
    
    // ==========================================
    // UTILITY FUNCTIONS
    // ==========================================
    
    getAvailableVoices() {
        return this.availableVoices.map(voice => ({
            name: voice.name,
            lang: voice.lang,
            localService: voice.localService,
            default: voice.default
        }));
    }
    
    setVoice(voiceName) {
        const voice = this.availableVoices.find(v => v.name === voiceName);
        if (voice) {
            this.selectedVoice = voice;
            console.log(`🎯 Voice changed to: ${voice.name}`);
            return true;
        }
        return false;
    }
    
    updateSettings(newSettings) {
        Object.assign(this.config, newSettings);
        console.log('⚙️ Audio settings updated');
    }
    
    // Event handlers (can be overridden)
    onSpeechStart = null;
    onSpeechEnd = null;
    onSpeechError = null;
}

// ==========================================
// SINGLETON INSTANCE
// ==========================================

// Create global instance
window.AudioSystem = AudioSystem;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.audioSystem = new AudioSystem();
    });
} else {
    window.audioSystem = new AudioSystem();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioSystem;
}