/* ============================================
   SIMPLE AUDIO SYSTEM - NUMBERS ONLY
   Purpose: Clean number speech for kids with friendly voice
   ============================================ */

class SimpleAudioSystem {
    constructor() {
        this.isInitialized = false;
        this.synth = null;
        this.selectedVoice = null;
        this.voicesLoaded = false;
        
        this.init();
    }
    
    async init() {
        if ('speechSynthesis' in window) {
            this.synth = window.speechSynthesis;
            
            // Wait for voices to load
            await this.loadVoices();
            
            this.isInitialized = true;
            console.log('✅ Simple Audio System Ready');
            console.log(`🎤 Using voice: ${this.selectedVoice ? this.selectedVoice.name : 'default'}`);
        } else {
            console.warn('⚠️ Speech not supported');
        }
    }
    
    /* ============================================
       VOICE SELECTION - FRIENDLY VOICES
       ============================================ */
    
    async loadVoices() {
        return new Promise((resolve) => {
            let voices = this.synth.getVoices();
            
            if (voices.length > 0) {
                this.selectBestVoice(voices);
                this.voicesLoaded = true;
                resolve();
            } else {
                // Wait for voices to load
                this.synth.addEventListener('voiceschanged', () => {
                    voices = this.synth.getVoices();
                    this.selectBestVoice(voices);
                    this.voicesLoaded = true;
                    resolve();
                });
                
                // Timeout fallback
                setTimeout(() => {
                    if (!this.voicesLoaded) {
                        voices = this.synth.getVoices();
                        this.selectBestVoice(voices);
                        this.voicesLoaded = true;
                        resolve();
                    }
                }, 1000);
            }
        });
    }
    
    selectBestVoice(voices) {
        console.log(`🎤 Found ${voices.length} voices`);
        
        // Priority list of friendly voices for kids
        const preferredVoices = [
            // English voices - kid-friendly
            'Samantha',           // macOS - very friendly
            'Google US English',  // Android/Chrome
            'Microsoft Zira',     // Windows - female, clear
            'Karen',              // macOS
            'Victoria',           // macOS
            'Fiona',              // macOS - Scottish, fun
            'Google UK English Female',
            'Microsoft David',    // Windows - male, clear
            'Fred',               // macOS - novelty but clear
            'Alex'                // macOS - clear male
        ];
        
        // Try to find preferred voice
        for (const preferredName of preferredVoices) {
            const voice = voices.find(v => 
                v.name.includes(preferredName) && 
                v.lang.startsWith('en')
            );
            
            if (voice) {
                this.selectedVoice = voice;
                console.log(`✅ Selected: ${voice.name}`);
                return;
            }
        }
        
        // Fallback: Any English female voice
        const femaleVoice = voices.find(v => 
            v.lang.startsWith('en') && 
            (v.name.toLowerCase().includes('female') || 
             v.name.toLowerCase().includes('woman') ||
             v.name.toLowerCase().includes('samantha') ||
             v.name.toLowerCase().includes('victoria'))
        );
        
        if (femaleVoice) {
            this.selectedVoice = femaleVoice;
            console.log(`✅ Selected female voice: ${femaleVoice.name}`);
            return;
        }
        
        // Final fallback: First English voice
        const englishVoice = voices.find(v => v.lang.startsWith('en'));
        
        if (englishVoice) {
            this.selectedVoice = englishVoice;
            console.log(`✅ Selected English voice: ${englishVoice.name}`);
        } else {
            console.log('⚠️ No English voice found, using default');
        }
    }
    
    /* ============================================
       CORE - SPEAK NUMBER
       ============================================ */
    
    speakNumber(number) {
        if (!this.synth) return;
        
        // Cancel any current speech
        this.synth.cancel();
        
        // Create utterance
        const utterance = new SpeechSynthesisUtterance(number.toString());
        
        // Use selected voice
        if (this.selectedVoice) {
            utterance.voice = this.selectedVoice;
        }
        
        // Friendly settings
        utterance.rate = 0.75;  // Slow and clear
        utterance.pitch = 1.2;   // Slightly higher = friendlier
        utterance.volume = 1.0;
        
        // Speak
        this.synth.speak(utterance);
        
        console.log(`🔊 Speaking: ${number}`);
    }
    
    /* ============================================
       CELEBRATION
       ============================================ */
    
    speakCelebration() {
        if (!this.synth) return;
        
        this.synth.cancel();
        
        const phrases = [
            'Great job!',
            'Awesome!',
            'You did it!',
            'Perfect!',
            'Excellent!',
            'Amazing!',
            'Wonderful!'
        ];
        
        const phrase = phrases[Math.floor(Math.random() * phrases.length)];
        const utterance = new SpeechSynthesisUtterance(phrase);
        
        if (this.selectedVoice) {
            utterance.voice = this.selectedVoice;
        }
        
        utterance.rate = 0.75;
        utterance.pitch = 1.3;  // Extra happy
        utterance.volume = 1.0;
        
        this.synth.speak(utterance);
    }
    
    /* ============================================
       CUSTOM SPEECH
       ============================================ */
    
    speak(text, options = {}) {
        if (!this.synth) return;
        
        this.synth.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        if (this.selectedVoice) {
            utterance.voice = this.selectedVoice;
        }
        
        utterance.rate = options.rate || 0.75;
        utterance.pitch = options.pitch || 1;
        utterance.volume = 1.0;
        
        this.synth.speak(utterance);
    }
    
    /* ============================================
       STOP
       ============================================ */
    
    stop() {
        if (this.synth) {
            this.synth.cancel();
        }
    }
}

// Auto-initialize
window.audioSystem = new SimpleAudioSystem();