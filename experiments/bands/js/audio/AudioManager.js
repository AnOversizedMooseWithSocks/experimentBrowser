// AudioManager.js - Handles audio synthesis for band frequencies with spatial audio
// Uses Web Audio API to generate tones with 3D positioning
// Updated to support spatial audio for listener entity

export class AudioManager {
    constructor() {
        this.audioContext = null;
        this.currentOscillator = null;
        this.gainNode = null;
        
        // Track active collision sounds for proper cleanup
        this.activeCollisionSounds = new Set();
        
        // Track resonating bands
        this.resonatingBands = new Map(); // Map of band to oscillator/gain
        
        // Reference to the listener entity
        this.listener = null;
        
        // Track active spatial sounds
        this.activeSpatialSounds = new Map(); // Map of band to audio nodes
        
        // Master gain for overall volume control
        this.masterGain = null;
        
        // Initialize audio context on first user interaction
        this.initializeOnUserGesture();
        
        console.log('AudioManager created - waiting for user interaction');
    }
    
    /**
     * Clean up all resonating bands
     */
    cleanupResonatingBands() {
        this.resonatingBands.forEach((nodes, band) => {
            this.stopResonance(band);
        });
        this.resonatingBands.clear();
    }
    
    /**
     * Set the listener entity reference
     * @param {Listener} listener - The listener entity
     */
    setListener(listener) {
        // If removing listener, clean up all spatial sounds first
        if (!listener && this.listener) {
            this.cleanupSpatialSounds();
            
            // Also stop all resonating bands
            this.resonatingBands.forEach((nodes, band) => {
                this.stopResonance(band);
            });
        }
        
        this.listener = listener;
        if (this.audioContext && listener) {
            listener.initializeAudio(this.audioContext);
            console.log('Listener connected to audio system');
        }
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
                    
                    // Create master gain node
                    this.masterGain = this.audioContext.createGain();
                    this.masterGain.gain.setValueAtTime(1, this.audioContext.currentTime);
                    this.masterGain.connect(this.audioContext.destination);
                    
                    // Initialize listener if it exists
                    if (this.listener) {
                        this.listener.initializeAudio(this.audioContext);
                    }
                    
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
     * Create a spatial panner node for 3D audio positioning
     * @param {number} x - X position in pixels
     * @param {number} y - Y position in pixels
     * @returns {PannerNode} Configured panner node
     */
    createSpatialPanner(x, y) {
        const panner = this.audioContext.createPanner();
        
        // Configure panner for 2D space (we'll use X and Z axes)
        panner.panningModel = 'HRTF'; // Head-related transfer function for better 3D effect
        panner.distanceModel = 'inverse'; // Volume decreases with distance
        
        // Set distance parameters
        panner.refDistance = 1; // Reference distance in audio units
        panner.maxDistance = 10000; // Maximum distance
        panner.rolloffFactor = 1; // How quickly volume decreases with distance
        
        // Set directional cone (optional - for directional sources)
        panner.coneInnerAngle = 360; // Omnidirectional
        panner.coneOuterAngle = 360;
        panner.coneOuterGain = 0;
        
        // Convert pixel coordinates to audio space
        const audioScale = 0.01; // Same scale as listener
        const audioX = x * audioScale;
        const audioY = 0; // Keep at ground level
        const audioZ = -y * audioScale; // Negative because audio Z is into screen
        
        // Set position
        if (panner.positionX) {
            // Modern API
            panner.positionX.setValueAtTime(audioX, this.audioContext.currentTime);
            panner.positionY.setValueAtTime(audioY, this.audioContext.currentTime);
            panner.positionZ.setValueAtTime(audioZ, this.audioContext.currentTime);
        } else {
            // Fallback for older browsers
            panner.setPosition(audioX, audioY, audioZ);
        }
        
        return panner;
    }
    
    /**
     * Update the position of a spatial sound
     * @param {PannerNode} panner - The panner node to update
     * @param {number} x - New X position in pixels
     * @param {number} y - New Y position in pixels
     */
    updateSpatialPosition(panner, x, y) {
        if (!panner) return;
        
        const audioScale = 0.01;
        const audioX = x * audioScale;
        const audioY = 0;
        const audioZ = -y * audioScale;
        
        if (panner.positionX) {
            // Modern API
            panner.positionX.setValueAtTime(audioX, this.audioContext.currentTime);
            panner.positionY.setValueAtTime(audioY, this.audioContext.currentTime);
            panner.positionZ.setValueAtTime(audioZ, this.audioContext.currentTime);
        } else {
            // Fallback
            panner.setPosition(audioX, audioY, audioZ);
        }
    }
    
    /**
     * Play a tone at the specified frequency (non-spatial, for UI sounds)
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
            
            // Connect nodes - direct to master gain (no spatial positioning)
            this.currentOscillator.connect(this.gainNode);
            this.gainNode.connect(this.masterGain);
            
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
     * Play a collision sound with spatial positioning if listener exists
     * @param {number} frequency - Frequency in Hz
     * @param {number} duration - Total duration including fade in ms
     * @param {number} initialVolume - Initial volume (0-1)
     * @param {Object} position - Position {x, y} for spatial audio (optional)
     */
    playCollisionSound(frequency, duration, initialVolume = 0.1, position = null) {
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
            
            // If we have a listener and position, check if within range
            let effectiveVolume = initialVolume;
            let shouldPlay = true;
            
            if (this.listener && position) {
                const dx = position.x - this.listener.position.x;
                const dy = position.y - this.listener.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Only play if within listening radius
                if (distance > this.listener.listeningRadius) {
                    // Outside listening range, don't play
                    shouldPlay = false;
                } else {
                    // Attenuate volume based on distance within listening radius
                    const distanceRatio = distance / this.listener.listeningRadius;
                    effectiveVolume = initialVolume * (1 - distanceRatio * 0.8); // At edge, volume is 20% of initial
                }
            }
            
            // Don't create the sound if it shouldn't play
            if (!shouldPlay) {
                return;
            }
            
            // Volume envelope: quick fade in, then gradual fade out
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(effectiveVolume, now + fadeInTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + fadeOutTime);
            
            // Connect nodes
            oscillator.connect(gainNode);
            
            // Add spatial positioning if we have a listener and position
            if (this.listener && position) {
                const panner = this.createSpatialPanner(position.x, position.y);
                gainNode.connect(panner);
                panner.connect(this.masterGain);
            } else {
                // No spatial positioning
                gainNode.connect(this.masterGain);
            }
            
            // Start the oscillator
            oscillator.start(now);
            oscillator.stop(now + fadeOutTime + 0.01); // Stop slightly after fade complete
            
            // Track this sound
            const soundId = `${frequency}_${Date.now()}`;
            this.activeCollisionSounds.add(soundId);
            
            // Clean up after sound completes
            oscillator.onended = () => {
                this.activeCollisionSounds.delete(soundId);
                // Disconnect nodes to free resources
                try {
                    oscillator.disconnect();
                    gainNode.disconnect();
                } catch (e) {
                    // Ignore disconnect errors
                }
            };
            
        } catch (error) {
            console.error('Error playing collision sound:', error);
        }
    }
    
    /**
     * Play continuous spatial sound for a band (when emitting)
     * @param {WigglyBand} band - The band emitting sound
     * @param {number} volume - Volume level (0-1)
     */
    playSpatialSound(band, volume = 0.1) {
        if (!this.audioContext || !this.listener) {
            // No listener, so no spatial sound
            return;
        }
        
        // Don't play sounds for bands in harmony rings
        if (band.isInHarmonyRing) {
            return;
        }
        
        // Check if already playing for this band
        if (this.activeSpatialSounds.has(band)) {
            // Already playing, just update position
            const nodes = this.activeSpatialSounds.get(band);
            if (nodes && nodes.panner) {
                this.updateSpatialPosition(nodes.panner, band.position.x, band.position.y);
            }
            return;
        }
        
        // Check if within listening range
        if (!this.listener.canHear(band)) {
            return;
        }
        
        try {
            // Create oscillator
            const oscillator = this.audioContext.createOscillator();
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(band.frequency, this.audioContext.currentTime);
            
            // Create gain node
            const gainNode = this.audioContext.createGain();
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.1);
            
            // Create spatial panner
            const panner = this.createSpatialPanner(band.position.x, band.position.y);
            
            // Connect: oscillator -> gain -> panner -> master
            oscillator.connect(gainNode);
            gainNode.connect(panner);
            panner.connect(this.masterGain);
            
            // Start oscillator
            oscillator.start();
            
            // Store references
            this.activeSpatialSounds.set(band, {
                oscillator: oscillator,
                gainNode: gainNode,
                panner: panner,
                startTime: this.audioContext.currentTime
            });
            
            // Set up cleanup in case oscillator ends unexpectedly
            oscillator.onended = () => {
                this.activeSpatialSounds.delete(band);
            };
            
            // console.log(`Spatial sound started for band at ${band.frequency} Hz`);
        } catch (error) {
            console.error('Error playing spatial sound:', error);
            // Make sure we don't have a partial entry in the map
            this.activeSpatialSounds.delete(band);
        }
    }
    
    /**
     * Stop spatial sound for a band
     * @param {WigglyBand} band - The band to stop sound for
     */
    stopSpatialSound(band) {
        if (!this.activeSpatialSounds.has(band)) return;
        
        try {
            const nodes = this.activeSpatialSounds.get(band);
            
            if (nodes) {
                // Fade out immediately
                if (nodes.gainNode) {
                    nodes.gainNode.gain.cancelScheduledValues(this.audioContext.currentTime);
                    nodes.gainNode.gain.setValueAtTime(nodes.gainNode.gain.value, this.audioContext.currentTime);
                    nodes.gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
                }
                
                // Stop oscillator
                if (nodes.oscillator) {
                    try {
                        nodes.oscillator.stop(this.audioContext.currentTime + 0.15);
                    } catch (e) {
                        // Oscillator might have already been stopped
                        console.warn('Oscillator already stopped:', e.message);
                    }
                }
                
                // Immediately remove from map to prevent multiple stop calls
                this.activeSpatialSounds.delete(band);
            }
        } catch (error) {
            console.error('Error stopping spatial sound:', error);
            // Remove from map even if there was an error
            this.activeSpatialSounds.delete(band);
        }
    }
    
    /**
     * Update all active spatial sounds based on band positions and listener
     * @param {Array} bands - Array of all bands
     */
    updateSpatialSounds(bands) {
        if (!this.listener) {
            // No listener, clean up all spatial sounds
            this.cleanupSpatialSounds();
            return;
        }
        
        // First, clean up sounds for bands that no longer exist or shouldn't be playing
        const bandsToRemove = [];
        this.activeSpatialSounds.forEach((nodes, band) => {
            // Check if band still exists in the bands array
            const stillExists = bands.includes(band);
            
            // Check if band should still be playing
            const canHear = stillExists && this.listener.canHear(band);
            const shouldPlay = stillExists && band.isEmittingSound && canHear;
            
            if (!shouldPlay) {
                // Mark for removal
                bandsToRemove.push(band);
            }
        });
        
        // Remove sounds that shouldn't be playing
        bandsToRemove.forEach(band => {
            this.stopSpatialSound(band);
        });
        
        // Now check each band for whether it should be playing
        bands.forEach(band => {
            // Skip bands in harmony rings - they shouldn't emit independently
            if (band.isInHarmonyRing) {
                // If somehow playing, stop it
                if (this.activeSpatialSounds.has(band)) {
                    this.stopSpatialSound(band);
                }
                return;
            }
            
            const isPlaying = this.activeSpatialSounds.has(band);
            const canHear = this.listener && this.listener.canHear(band);
            const shouldPlay = band.isEmittingSound && canHear;
            
            if (shouldPlay && !isPlaying) {
                // Start playing
                this.playSpatialSound(band, band.soundEmissionVolume);
            } else if (shouldPlay && isPlaying) {
                // Update position and volume
                const nodes = this.activeSpatialSounds.get(band);
                if (nodes && nodes.panner) {
                    this.updateSpatialPosition(nodes.panner, band.position.x, band.position.y);
                    
                    // Check if band moved out of range
                    if (this.listener && !this.listener.canHear(band)) {
                        // Immediately stop if out of range
                        this.stopSpatialSound(band);
                    } else if (nodes.gainNode) {
                        // Update volume based on emission state
                        nodes.gainNode.gain.setTargetAtTime(
                            band.soundEmissionVolume, 
                            this.audioContext.currentTime, 
                            0.1
                        );
                    }
                }
            }
        });
    }
    
    /**
     * Play resonance sound for a band with spatial positioning
     * @param {WigglyBand} band - The resonating band
     * @param {number} volume - Volume level (0-1)
     */
    playResonance(band, volume = 0.05) {
        if (!this.audioContext) {
            console.warn('Audio context not initialized. Click somewhere first.');
            return;
        }
        
        // Check if already resonating
        if (this.resonatingBands.has(band)) {
            // Update volume if needed
            const { gainNode } = this.resonatingBands.get(band);
            if (gainNode) {
                gainNode.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.1);
            }
            return;
        }
        
        try {
            // Create oscillator for resonance
            const oscillator = this.audioContext.createOscillator();
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(band.frequency, this.audioContext.currentTime);
            
            // Add slight frequency wobble for resonance effect
            const lfo = this.audioContext.createOscillator();
            lfo.frequency.setValueAtTime(3, this.audioContext.currentTime); // 3Hz wobble
            const lfoGain = this.audioContext.createGain();
            lfoGain.gain.setValueAtTime(5, this.audioContext.currentTime); // +/- 5Hz wobble
            
            lfo.connect(lfoGain);
            lfoGain.connect(oscillator.frequency);
            
            // Create gain node
            const gainNode = this.audioContext.createGain();
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.1);
            
            // Connect nodes
            oscillator.connect(gainNode);
            
            // Add spatial positioning if we have a listener
            let panner = null;
            if (this.listener) {
                // Only create panner if band is within hearing range
                const canHear = this.listener.canHear(band);
                if (canHear) {
                    panner = this.createSpatialPanner(band.position.x, band.position.y);
                    gainNode.connect(panner);
                    panner.connect(this.masterGain);
                } else {
                    // Band is out of range, don't play resonance
                    return;
                }
            } else {
                // No listener, use non-spatial audio
                gainNode.connect(this.masterGain);
            }
            
            // Start oscillators
            oscillator.start();
            lfo.start();
            
            // Store reference
            this.resonatingBands.set(band, { oscillator, gainNode, lfo, panner });
            
            console.log(`Band resonating at ${band.frequency} Hz`);
        } catch (error) {
            console.error('Error playing resonance:', error);
        }
    }
    
    /**
     * Stop resonance for a band
     * @param {WigglyBand} band - The band to stop resonating
     */
    stopResonance(band) {
        if (!this.resonatingBands.has(band)) return;
        
        try {
            const { oscillator, gainNode, lfo, panner } = this.resonatingBands.get(band);
            
            // Cancel any scheduled changes
            if (gainNode) {
                gainNode.gain.cancelScheduledValues(this.audioContext.currentTime);
                gainNode.gain.setValueAtTime(gainNode.gain.value, this.audioContext.currentTime);
                // Fade out
                gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);
            }
            
            // Stop oscillators
            if (oscillator) oscillator.stop(this.audioContext.currentTime + 0.25);
            if (lfo) lfo.stop(this.audioContext.currentTime + 0.25);
            
            // Remove from map immediately
            this.resonatingBands.delete(band);
            
            // Clean up connections after stopping
            setTimeout(() => {
                try {
                    if (oscillator) oscillator.disconnect();
                    if (gainNode) gainNode.disconnect();
                    if (lfo) lfo.disconnect();
                    if (panner) panner.disconnect();
                } catch (e) {
                    // Ignore disconnect errors
                }
            }, 300);
        } catch (error) {
            console.error('Error stopping resonance:', error);
            // Remove from map even if there was an error
            this.resonatingBands.delete(band);
        }
    }
    
    /**
     * Set the master volume
     * @param {number} volume - Volume level (0-1)
     */
    setMasterVolume(volume) {
        if (this.masterGain) {
            this.masterGain.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.1);
        }
    }
    
    /**
     * Play a band's frequency (non-spatial, for testing)
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
    
    /**
     * Get debug info about active sounds
     * @returns {Object} Debug information
     */
    getDebugInfo() {
        return {
            contextState: this.getStatus(),
            activeSpatialSounds: this.activeSpatialSounds ? this.activeSpatialSounds.size : 0,
            activeCollisionSounds: this.activeCollisionSounds ? this.activeCollisionSounds.size : 0,
            resonatingBands: this.resonatingBands ? this.resonatingBands.size : 0,
            hasListener: !!this.listener
        };
    }
    
    /**
     * Clean up all spatial sounds
     */
    cleanupSpatialSounds() {
        // Stop all active spatial sounds
        this.activeSpatialSounds.forEach((nodes, band) => {
            try {
                // Cancel any scheduled changes
                if (nodes.gainNode) {
                    nodes.gainNode.gain.cancelScheduledValues(this.audioContext.currentTime);
                    nodes.gainNode.gain.setValueAtTime(nodes.gainNode.gain.value, this.audioContext.currentTime);
                    nodes.gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.05);
                }
                
                if (nodes.oscillator) {
                    try {
                        nodes.oscillator.stop(this.audioContext.currentTime + 0.1);
                    } catch (e) {
                        // Oscillator might have already been stopped
                        console.warn('Oscillator already stopped during cleanup');
                    }
                }
                
                // Disconnect nodes to free resources
                setTimeout(() => {
                    try {
                        if (nodes.oscillator) nodes.oscillator.disconnect();
                        if (nodes.gainNode) nodes.gainNode.disconnect();
                        if (nodes.panner) nodes.panner.disconnect();
                    } catch (e) {
                        // Ignore disconnect errors
                    }
                }, 150);
            } catch (error) {
                console.error('Error cleaning up spatial sound:', error);
            }
        });
        
        // Clear the map immediately
        this.activeSpatialSounds.clear();
    }
}