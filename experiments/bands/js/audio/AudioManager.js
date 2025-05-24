// AudioManager.js - Handles audio synthesis for band frequencies
// Uses Web Audio API to generate tones

export class AudioManager {
    constructor() {
        this.audioContext = null;
        this.currentOscillator = null;
        this.gainNode = null;
        
        // Track active collision sounds for proper cleanup
        this.activeCollisionSounds = new Set();
        
        // Initialize audio context on first user interaction
        this.initializeOnUserGesture();
        
        console.log('AudioManager created - waiting for user interaction');
    }
    
    /**
     * Initialize audio context on user gesture (required by browsers)
     */
    initializeOnUserGesture() {
        const initHandler = () => {
            if (!this.audioContext) {
                try {
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    console.log('Audio context initialized');
                    
                    // Remove the event listener after initialization
                    document.removeEventListener('click', initHandler);
                } catch (error) {
                    console.error('Failed to initialize audio context:', error);
                }
            }
        };
        
        // Add event listener for first click
        document.addEventListener('click', initHandler);
    }
    
    /**
     * Play a tone at the specified frequency
     * @param {number} frequency - Frequency in Hz
     * @param {string} waveType - Type of wave (sine, square, sawtooth, triangle)
     */
    playTone(frequency = 440, waveType = 'sine') {
        if (!this.audioContext) {
            console.warn('Audio context not initialized. Click somewhere first.');
            return;
        }
        
        // Stop any existing tone
        this.stopTone();
        
        try {
            // Create oscillator
            this.currentOscillator = this.audioContext.createOscillator();
            this.currentOscillator.type = waveType;
            this.currentOscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            
            // Create gain node for volume control
            this.gainNode = this.audioContext.createGain();
            this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            
            // Fade in to avoid clicks
            this.gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.05);
            
            // Connect nodes
            this.currentOscillator.connect(this.gainNode);
            this.gainNode.connect(this.audioContext.destination);
            
            // Start the oscillator
            this.currentOscillator.start();
            
            console.log(`Playing tone at ${frequency} Hz`);
        } catch (error) {
            console.error('Error playing tone:', error);
        }
    }
    
    /**
     * Stop the currently playing tone
     */
    stopTone() {
        if (this.currentOscillator && this.gainNode) {
            try {
                // Fade out to avoid clicks
                this.gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.05);
                
                // Stop after fade out
                this.currentOscillator.stop(this.audioContext.currentTime + 0.06);
                
                // Clean up references
                this.currentOscillator = null;
                this.gainNode = null;
            } catch (error) {
                console.error('Error stopping tone:', error);
            }
        }
    }
    
    /**
     * Play a collision sound with gradual fade out
     * @param {number} frequency - Frequency in Hz
     * @param {number} duration - Total duration including fade in ms
     * @param {number} initialVolume - Initial volume (0-1)
     */
    playCollisionSound(frequency, duration, initialVolume = 0.1) {
        if (!this.audioContext) {
            console.warn('Audio context not initialized. Click somewhere first.');
            return;
        }
        
        try {
            // Create oscillator for this collision
            const oscillator = this.audioContext.createOscillator();
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            
            // Create gain node for this collision
            const gainNode = this.audioContext.createGain();
            
            // Set up volume envelope
            const now = this.audioContext.currentTime;
            const fadeInTime = 0.01; // Very quick fade in to avoid clicks
            const fadeOutTime = duration / 1000; // Convert ms to seconds
            
            // Volume envelope: quick fade in, then gradual fade out
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(initialVolume, now + fadeInTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + fadeOutTime);
            
            // Connect nodes
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Start the oscillator
            oscillator.start(now);
            oscillator.stop(now + fadeOutTime + 0.01); // Stop slightly after fade complete
            
            // Track this sound
            const soundId = `${frequency}_${Date.now()}`;
            this.activeCollisionSounds.add(soundId);
            
            // Clean up after sound completes
            oscillator.onended = () => {
                this.activeCollisionSounds.delete(soundId);
            };
            
        } catch (error) {
            console.error('Error playing collision sound:', error);
        }
    }
    
    /**
     * Play a chord (multiple frequencies at once)
     * @param {Array<number>} frequencies - Array of frequencies in Hz
     */
    playChord(frequencies) {
        if (!this.audioContext) {
            console.warn('Audio context not initialized. Click somewhere first.');
            return;
        }
        
        // Stop any existing tones
        this.stopTone();
        
        // Store oscillators and gain nodes
        this.chordOscillators = [];
        this.chordGainNodes = [];
        
        frequencies.forEach(frequency => {
            try {
                const oscillator = this.audioContext.createOscillator();
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                
                const gainNode = this.audioContext.createGain();
                gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.05 / frequencies.length, this.audioContext.currentTime + 0.05);
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.start();
                
                this.chordOscillators.push(oscillator);
                this.chordGainNodes.push(gainNode);
            } catch (error) {
                console.error('Error creating chord oscillator:', error);
            }
        });
    }
    
    /**
     * Stop a chord
     */
    stopChord() {
        if (this.chordOscillators && this.chordGainNodes) {
            this.chordOscillators.forEach((oscillator, index) => {
                try {
                    const gainNode = this.chordGainNodes[index];
                    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.05);
                    oscillator.stop(this.audioContext.currentTime + 0.06);
                } catch (error) {
                    console.error('Error stopping chord oscillator:', error);
                }
            });
            
            this.chordOscillators = null;
            this.chordGainNodes = null;
        }
    }
    
    /**
     * Play a band's frequency
     * @param {WigglyBand} band - The band whose frequency to play
     */
    playBandFrequency(band) {
        this.playTone(band.getRepresentedFrequency());
    }
    
    /**
     * Get the audio context status
     * @returns {string} Status of the audio context
     */
    getStatus() {
        if (!this.audioContext) {
            return 'Not initialized';
        }
        return this.audioContext.state;
    }
}