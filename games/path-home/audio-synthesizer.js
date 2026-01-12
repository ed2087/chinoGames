// ==========================================
// PROCEDURAL AUDIO SYNTHESIS FOR PATH GAME
// ==========================================

class AudioSynthesizer {
    constructor() {
        this.audioContext = null;
        this.masterVolume = 0.3; // Child-friendly volume
        this.soundCache = new Map();
        this.isInitialized = false;
        
        this.init();
    }
    
    async init() {
        // Don't create AudioContext immediately - wait for user interaction
        this.isInitialized = true;
        console.log('Audio synthesizer ready (context will be created on first use)');
    }
    
    // Ensure AudioContext is created and resumed
    ensureAudioContext() {
        if (!this.audioContext) {
            try {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                this.audioContext = new AudioContextClass();
                console.log('Audio context created');
            } catch (error) {
                console.warn('Could not create audio context:', error);
                return false;
            }
        }
        
        // Resume if suspended
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().catch(error => {
                console.warn('Could not resume audio context:', error);
            });
        }
        
        return this.audioContext.state !== 'closed';
    }
    
    // Master gain node for volume control
    createGainNode(volume = 1.0) {
        if (!this.ensureAudioContext()) return null;
        
        const gainNode = this.audioContext.createGain();
        gainNode.gain.setValueAtTime(volume * this.masterVolume, this.audioContext.currentTime);
        gainNode.connect(this.audioContext.destination);
        return gainNode;
    }
    
    // Animal movement sounds
    playWalkingSound(animalType) {
        if (!this.ensureAudioContext()) return;
        
        switch (animalType) {
            case 'penguin':
                this.playPenguinWaddle();
                break;
            case 'teddy':
                this.playTeddySteps();
                break;
            case 'ducky':
                this.playDuckyBounce();
                break;
        }
    }
    
    playPenguinWaddle() {
        if (!this.ensureAudioContext()) return;
        
        const gainNode = this.createGainNode(0.4);
        if (!gainNode) return;
        
        // Low-frequency wobble sound
        const oscillator = this.audioContext.createOscillator();
        const filter = this.audioContext.createBiquadFilter();
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(80, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(60, this.audioContext.currentTime + 0.3);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, this.audioContext.currentTime);
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        
        // Envelope
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.4 * this.masterVolume, this.audioContext.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }
    
    playTeddySteps() {
        if (!this.ensureAudioContext()) return;
        
        const gainNode = this.createGainNode(0.3);
        if (!gainNode) return;
        
        // Soft thud sound
        const oscillator = this.audioContext.createOscillator();
        const filter = this.audioContext.createBiquadFilter();
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.2);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, this.audioContext.currentTime);
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        
        // Quick thud envelope
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3 * this.masterVolume, this.audioContext.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.2);
    }
    
    playDuckyBounce() {
        if (!this.ensureAudioContext()) return;
        
        const gainNode = this.createGainNode(0.35);
        if (!gainNode) return;
        
        // Higher pitched bounce
        const oscillator = this.audioContext.createOscillator();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(600, this.audioContext.currentTime + 0.1);
        oscillator.frequency.exponentialRampToValueAtTime(300, this.audioContext.currentTime + 0.15);
        
        oscillator.connect(gainNode);
        
        // Bouncy envelope
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.35 * this.masterVolume, this.audioContext.currentTime + 0.03);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.15);
    }
    
    // Path drawing feedback sounds
    playDrawingSound(pressure = 0.5) {
        if (!this.ensureAudioContext()) return;
        
        const gainNode = this.createGainNode(0.2);
        if (!gainNode) return;
        
        // Gentle drawing sound that varies with pressure
        const oscillator = this.audioContext.createOscillator();
        const filter = this.audioContext.createBiquadFilter();
        
        const baseFreq = 800 + (pressure * 400); // Higher pressure = higher pitch
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(baseFreq, this.audioContext.currentTime);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000 + (pressure * 500), this.audioContext.currentTime);
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        
        // Very short sound for continuous drawing
        gainNode.gain.setValueAtTime(0.2 * pressure * this.masterVolume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.05);
    }
    
    // Success and validation sounds
    playSuccessChime() {
        if (!this.ensureAudioContext()) return;
        
        const gainNode = this.createGainNode(0.6);
        if (!gainNode) return;
        
        // Happy ascending chime
        const frequencies = [523, 659, 784, 1047]; // C, E, G, C (major chord)
        
        frequencies.forEach((freq, index) => {
            const oscillator = this.audioContext.createOscillator();
            const noteGain = this.audioContext.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
            
            const startTime = this.audioContext.currentTime + (index * 0.15);
            const duration = 0.4;
            
            noteGain.gain.setValueAtTime(0, startTime);
            noteGain.gain.linearRampToValueAtTime(0.6 * this.masterVolume, startTime + 0.05);
            noteGain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
            
            oscillator.connect(noteGain);
            noteGain.connect(this.audioContext.destination);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        });
    }
    
    playValidationPop() {
        if (!this.ensureAudioContext()) return;
        
        const gainNode = this.createGainNode(0.4);
        if (!gainNode) return;
        
        // Quick pop sound
        const oscillator = this.audioContext.createOscillator();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(500, this.audioContext.currentTime + 0.1);
        
        oscillator.connect(gainNode);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.4 * this.masterVolume, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }
    
    playErrorSound() {
        if (!this.ensureAudioContext()) return;
        
        const gainNode = this.createGainNode(0.3);
        if (!gainNode) return;
        
        // Gentle "try again" sound (not harsh)
        const oscillator = this.audioContext.createOscillator();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(250, this.audioContext.currentTime + 0.3);
        
        oscillator.connect(gainNode);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3 * this.masterVolume, this.audioContext.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }
    
    // Environmental ambient sounds
    playAmbientNature() {
        if (!this.ensureAudioContext()) return;
        
        // Very quiet background ambience
        const gainNode = this.createGainNode(0.1);
        if (!gainNode) return;
        
        // Wind-like sound
        const bufferSize = this.audioContext.sampleRate * 2; // 2 seconds
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Generate pink noise for wind
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.3;
        }
        
        const source = this.audioContext.createBufferSource();
        const filter = this.audioContext.createBiquadFilter();
        
        source.buffer = buffer;
        source.loop = true;
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, this.audioContext.currentTime);
        
        source.connect(filter);
        filter.connect(gainNode);
        
        source.start(this.audioContext.currentTime);
        
        // Auto-stop after 30 seconds
        source.stop(this.audioContext.currentTime + 30);
    }
    
    // Animal arrival sounds
    playAnimalHappy(animalType) {
        if (!this.ensureAudioContext()) return;
        
        switch (animalType) {
            case 'penguin':
                this.playPenguinHappy();
                break;
            case 'teddy':
                this.playTeddyHappy();
                break;
            case 'ducky':
                this.playDuckyHappy();
                break;
        }
    }
    
    playPenguinHappy() {
        if (!this.ensureAudioContext()) return;
        
        // Penguin "squeak" sound
        const gainNode = this.createGainNode(0.5);
        if (!gainNode) return;
        
        const oscillator = this.audioContext.createOscillator();
        oscillator.type = 'square';
        
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(1200, this.audioContext.currentTime + 0.1);
        oscillator.frequency.linearRampToValueAtTime(900, this.audioContext.currentTime + 0.2);
        
        oscillator.connect(gainNode);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5 * this.masterVolume, this.audioContext.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }
    
    playTeddyHappy() {
        if (!this.ensureAudioContext()) return;
        
        // Soft happy rumble
        const gainNode = this.createGainNode(0.4);
        if (!gainNode) return;
        
        const oscillator = this.audioContext.createOscillator();
        oscillator.type = 'sawtooth';
        
        oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(250, this.audioContext.currentTime + 0.3);
        
        oscillator.connect(gainNode);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.4 * this.masterVolume, this.audioContext.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }
    
    playDuckyHappy() {
        if (!this.ensureAudioContext()) return;
        
        // Quick duck-like quacks
        const gainNode = this.createGainNode(0.45);
        if (!gainNode) return;
        
        // Three quick quacks
        for (let i = 0; i < 3; i++) {
            const oscillator = this.audioContext.createOscillator();
            const startTime = this.audioContext.currentTime + (i * 0.15);
            
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(600, startTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, startTime + 0.1);
            
            const noteGain = this.audioContext.createGain();
            noteGain.gain.setValueAtTime(0, startTime);
            noteGain.gain.linearRampToValueAtTime(0.45 * this.masterVolume, startTime + 0.02);
            noteGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);
            
            oscillator.connect(noteGain);
            noteGain.connect(this.audioContext.destination);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + 0.1);
        }
    }
    
    // Volume control
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }
    
    // Cleanup
    dispose() {
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}