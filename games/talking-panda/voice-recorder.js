/* ============================================
   VOICE-RECORDER.JS - Voice Recording & Playback
   Purpose: Records voice and plays back with funny pitch shift
   ============================================ */

class VoiceRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.recordedBlob = null;
        this.isRecording = false;
        this.hasPermission = false;
        this.stream = null;
        
        // Audio context for pitch shifting
        this.audioContext = null;
        this.audioSource = null;
        
        // Recording settings
        this.maxRecordingTime = 3000; // 3 seconds max
        this.recordingTimer = null;
        
        // Callbacks
        this.onRecordingStart = null;
        this.onRecordingStop = null;
        this.onPlaybackStart = null;
        this.onPlaybackEnd = null;
        this.onPermissionGranted = null;
        this.onPermissionDenied = null;
    }
    
    /* ============================================
       PERMISSION HANDLING
       ============================================ */
    
    async requestPermission() {
        console.log('🎤 Requesting microphone permission...');
        
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            
            this.hasPermission = true;
            console.log('✅ Microphone permission granted');
            
            if (this.onPermissionGranted) {
                this.onPermissionGranted();
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Microphone permission denied:', error);
            this.hasPermission = false;
            
            if (this.onPermissionDenied) {
                this.onPermissionDenied();
            }
            
            return false;
        }
    }
    
    /* ============================================
       RECORDING
       ============================================ */
    
    async startRecording() {
        if (!this.hasPermission) {
            console.warn('⚠️ No microphone permission');
            const granted = await this.requestPermission();
            if (!granted) return false;
        }
        
        if (this.isRecording) {
            console.warn('⚠️ Already recording');
            return false;
        }
        
        console.log('🔴 Starting recording...');
        
        try {
            // Reset chunks
            this.audioChunks = [];
            this.recordedBlob = null;
            
            // Create MediaRecorder
            this.mediaRecorder = new MediaRecorder(this.stream, {
                mimeType: 'audio/webm'
            });
            
            // Handle data available
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };
            
            // Handle stop
            this.mediaRecorder.onstop = () => {
                this.recordedBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                console.log('✅ Recording stopped, blob created');
                
                if (this.onRecordingStop) {
                    this.onRecordingStop(this.recordedBlob);
                }
            };
            
            // Start recording
            this.mediaRecorder.start();
            this.isRecording = true;
            
            // Callback
            if (this.onRecordingStart) {
                this.onRecordingStart();
            }
            
            // Auto-stop after max time
            this.recordingTimer = setTimeout(() => {
                if (this.isRecording) {
                    this.stopRecording();
                }
            }, this.maxRecordingTime);
            
            return true;
            
        } catch (error) {
            console.error('❌ Recording failed:', error);
            return false;
        }
    }
    
    stopRecording() {
        if (!this.isRecording) {
            console.warn('⚠️ Not recording');
            return;
        }
        
        console.log('⏹️ Stopping recording...');
        
        // Clear timer
        if (this.recordingTimer) {
            clearTimeout(this.recordingTimer);
            this.recordingTimer = null;
        }
        
        // Stop recorder
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        
        this.isRecording = false;
    }
    
    /* ============================================
       PLAYBACK WITH PITCH SHIFT
       ============================================ */
    
    async playRecording() {
        if (!this.recordedBlob) {
            console.warn('⚠️ No recording to play');
            return false;
        }
        
        console.log('▶️ Playing recording with funny voice...');
        
        try {
            // Create audio context if needed
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            // Convert blob to array buffer
            const arrayBuffer = await this.recordedBlob.arrayBuffer();
            
            // Decode audio data
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            // Create source
            this.audioSource = this.audioContext.createBufferSource();
            this.audioSource.buffer = audioBuffer;
            
            // Apply pitch shift (higher = funnier)
            this.audioSource.playbackRate.value = 1.4; // 40% faster = higher pitch
            
            // Connect to destination
            this.audioSource.connect(this.audioContext.destination);
            
            // Handle playback end
            this.audioSource.onended = () => {
                console.log('✅ Playback ended');
                
                if (this.onPlaybackEnd) {
                    this.onPlaybackEnd();
                }
            };
            
            // Callback
            if (this.onPlaybackStart) {
                this.onPlaybackStart();
            }
            
            // Start playback
            this.audioSource.start(0);
            
            return true;
            
        } catch (error) {
            console.error('❌ Playback failed:', error);
            
            if (this.onPlaybackEnd) {
                this.onPlaybackEnd();
            }
            
            return false;
        }
    }
    
    /* ============================================
       UTILITIES
       ============================================ */
    
    hasRecording() {
        return this.recordedBlob !== null;
    }
    
    clearRecording() {
        this.recordedBlob = null;
        this.audioChunks = [];
        console.log('🗑️ Recording cleared');
    }
    
    stopPlayback() {
        if (this.audioSource) {
            try {
                this.audioSource.stop();
            } catch (error) {
                // Already stopped
            }
            this.audioSource = null;
        }
    }
    
    /* ============================================
       CLEANUP
       ============================================ */
    
    destroy() {
        // Stop recording
        if (this.isRecording) {
            this.stopRecording();
        }
        
        // Stop playback
        this.stopPlayback();
        
        // Close audio context
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        // Stop stream
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        console.log('🧹 Voice recorder destroyed');
    }
}