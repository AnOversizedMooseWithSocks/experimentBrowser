// Controls.js - Handles all UI controls and user input
// Manages sliders, buttons, and emits events through the event bus

export class Controls {
    constructor(eventBus) {
        this.eventBus = eventBus;
        
        // Cache control elements
        this.elements = {
            frequency: document.getElementById('frequency'),
            freqDisplay: document.getElementById('freqDisplay'),
            amplitude: document.getElementById('amplitude'),
            ampDisplay: document.getElementById('ampDisplay'),
            phase: document.getElementById('phase'),
            phaseDisplay: document.getElementById('phaseDisplay'),
            charge: document.getElementById('charge'),
            chargeDisplay: document.getElementById('chargeDisplay'),
            fieldStrength: document.getElementById('fieldStrength'),
            fieldStrengthDisplay: document.getElementById('fieldStrengthDisplay'),
            elasticity: document.getElementById('elasticity'),
            elasticityDisplay: document.getElementById('elasticityDisplay'),
            mergeChance: document.getElementById('mergeChance'),
            mergeChanceDisplay: document.getElementById('mergeChanceDisplay'),
            harmonizeChance: document.getElementById('harmonizeChance'),
            harmonizeChanceDisplay: document.getElementById('harmonizeChanceDisplay'),
            soundFade: document.getElementById('soundFade'),
            soundFadeDisplay: document.getElementById('soundFadeDisplay'),
            speedLimit: document.getElementById('speedLimit'),
            speedLimitDisplay: document.getElementById('speedLimitDisplay'),
            fieldTrailDuration: document.getElementById('fieldTrailDuration'),
            fieldTrailDurationDisplay: document.getElementById('fieldTrailDurationDisplay'),
            
            // Harmonize behavior select
            harmonizeBehavior: document.getElementById('harmonizeBehavior'),
            mergeMode: document.getElementById('mergeMode'),
            
            // Buttons
            addRandomBand: document.getElementById('addRandomBand'),
            playTone: document.getElementById('playTone'),
            stopTone: document.getElementById('stopTone'),
            clearAll: document.getElementById('clearAll'),
            togglePhysics: document.getElementById('togglePhysics'),
            exportBands: document.getElementById('exportBands'),
            toggleFieldPoints: document.getElementById('toggleFieldPoints'),
            toggleBandVisibility: document.getElementById('toggleBandVisibility'),
            
            // Checkboxes
            collisionSounds: document.getElementById('collisionSounds'),
            fieldTrails: document.getElementById('fieldTrails'),
            
            // Interaction rule selects
            negToPos: document.getElementById('negToPos'),
            posToPos: document.getElementById('posToPos'),
            negToNeg: document.getElementById('negToNeg'),
            
            // Accordion headers
            accordionHeaders: document.querySelectorAll('.accordion-header')
        };
        
        // Initialize event listeners
        this.setupEventListeners();
        
        // Initialize accordions
        this.initializeAccordions();
        
        console.log('Controls initialized');
    }
    
    /**
     * Initialize accordion functionality
     */
    initializeAccordions() {
        this.elements.accordionHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const content = header.nextElementSibling;
                const isOpen = content.classList.contains('active');
                
                // Toggle active class
                header.classList.toggle('active');
                content.classList.toggle('active');
                
                // Animate height
                if (isOpen) {
                    content.style.maxHeight = null;
                } else {
                    content.style.maxHeight = content.scrollHeight + 'px';
                }
            });
        });
        
        // Open first accordion by default
        if (this.elements.accordionHeaders.length > 0) {
            this.elements.accordionHeaders[0].click();
        }
    }
    
    /**
     * Set up all event listeners for controls
     */
    setupEventListeners() {
        // Frequency controls
        this.elements.frequency.addEventListener('input', () => {
            this.elements.freqDisplay.value = this.elements.frequency.value;
            this.eventBus.emit('frequencyChanged', parseFloat(this.elements.frequency.value));
        });
        
        this.elements.freqDisplay.addEventListener('input', () => {
            const value = parseFloat(this.elements.freqDisplay.value);
            if (!isNaN(value) && value >= 100 && value <= 2000) {
                this.elements.frequency.value = value;
                this.eventBus.emit('frequencyChanged', value);
            }
        });
        
        // Amplitude control
        this.elements.amplitude.addEventListener('input', () => {
            this.elements.ampDisplay.textContent = this.elements.amplitude.value;
            this.eventBus.emit('amplitudeChanged', parseFloat(this.elements.amplitude.value));
        });
        
        // Phase control
        this.elements.phase.addEventListener('input', () => {
            this.elements.phaseDisplay.textContent = this.elements.phase.value;
            this.eventBus.emit('phaseChanged', parseFloat(this.elements.phase.value));
        });
        
        // Charge control
        this.elements.charge.addEventListener('input', () => {
            const value = parseFloat(this.elements.charge.value).toFixed(1);
            this.elements.chargeDisplay.textContent = value;
            this.eventBus.emit('chargeChanged', parseFloat(value));
        });
        
        // Field strength control (now 0 to 100)
        this.elements.fieldStrength.addEventListener('input', () => {
            const value = this.elements.fieldStrength.value;
            this.elements.fieldStrengthDisplay.textContent = value;
            this.eventBus.emit('updateFieldStrength', parseFloat(value));
        });
        
        // Elasticity control
        this.elements.elasticity.addEventListener('input', () => {
            const value = this.elements.elasticity.value;
            this.elements.elasticityDisplay.textContent = value;
            this.eventBus.emit('elasticityChanged', parseFloat(value) / 100); // Convert percentage to 0-1 range
        });
        
        // Merge chance control
        this.elements.mergeChance.addEventListener('input', () => {
            const value = this.elements.mergeChance.value;
            this.elements.mergeChanceDisplay.textContent = value;
            this.eventBus.emit('updateMergeChance', parseFloat(value) / 100); // Convert percentage to 0-1 range
        });
        
        // Harmonize chance control
        this.elements.harmonizeChance.addEventListener('input', () => {
            const value = this.elements.harmonizeChance.value;
            this.elements.harmonizeChanceDisplay.textContent = value;
            this.eventBus.emit('updateHarmonizeChance', parseFloat(value) / 100); // Convert percentage to 0-1 range
        });
        
        // Sound fade control (now up to 5000ms)
        this.elements.soundFade.addEventListener('input', () => {
            const value = this.elements.soundFade.value;
            this.elements.soundFadeDisplay.textContent = value;
            this.eventBus.emit('updateSoundFade', parseFloat(value));
        });
        
        // Speed limit control
        this.elements.speedLimit.addEventListener('input', () => {
            const value = parseFloat(this.elements.speedLimit.value).toFixed(1);
            this.elements.speedLimitDisplay.textContent = value;
            this.eventBus.emit('updateSpeedLimit', parseFloat(value));
        });
        
        // Field trail duration control
        this.elements.fieldTrailDuration.addEventListener('input', () => {
            const value = parseFloat(this.elements.fieldTrailDuration.value).toFixed(1);
            this.elements.fieldTrailDurationDisplay.textContent = value;
            this.eventBus.emit('updateFieldTrailDuration', parseFloat(value));
        });
        
        // Harmonize behavior control
        this.elements.harmonizeBehavior.addEventListener('change', () => {
            this.eventBus.emit('updateHarmonizeBehavior', this.elements.harmonizeBehavior.value);
        });
        
        // Merge mode control
        this.elements.mergeMode.addEventListener('change', () => {
            this.eventBus.emit('updateMergeMode', this.elements.mergeMode.value);
        });
        
        // Collision sounds checkbox
        this.elements.collisionSounds.addEventListener('change', () => {
            this.eventBus.emit('toggleCollisionSounds', this.elements.collisionSounds.checked);
        });
        
        // Field trails checkbox
        this.elements.fieldTrails.addEventListener('change', () => {
            this.eventBus.emit('toggleFieldTrails', this.elements.fieldTrails.checked);
        });
        
        // Button events
        this.elements.addRandomBand.addEventListener('click', () => {
            this.eventBus.emit('addRandomBand');
        });
        
        this.elements.playTone.addEventListener('click', () => {
            const frequency = parseFloat(this.elements.frequency.value);
            this.eventBus.emit('playTone', frequency);
        });
        
        this.elements.stopTone.addEventListener('click', () => {
            this.eventBus.emit('stopTone');
        });
        
        this.elements.clearAll.addEventListener('click', () => {
            if (confirm('Clear all bands?')) {
                this.eventBus.emit('clearAll');
            }
        });
        
        this.elements.togglePhysics.addEventListener('click', () => {
            this.eventBus.emit('togglePhysics');
        });
        
        this.elements.exportBands.addEventListener('click', () => {
            this.eventBus.emit('exportBands');
        });
        
        this.elements.toggleFieldPoints.addEventListener('click', () => {
            this.eventBus.emit('toggleFieldPoints');
        });
        
        this.elements.toggleBandVisibility.addEventListener('click', () => {
            this.eventBus.emit('toggleBandVisibility');
        });
        
        // Interaction rule controls
        this.elements.negToPos.addEventListener('change', () => {
            this.updateInteractionRules();
        });
        
        this.elements.posToPos.addEventListener('change', () => {
            this.updateInteractionRules();
        });
        
        this.elements.negToNeg.addEventListener('change', () => {
            this.updateInteractionRules();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
        });
    }
    
    /**
     * Handle keyboard shortcuts
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyPress(event) {
        // Don't handle if user is typing in an input
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT') return;
        
        switch(event.key.toLowerCase()) {
            case ' ':
                event.preventDefault();
                this.eventBus.emit('togglePhysics');
                break;
            case 'r':
                this.eventBus.emit('addRandomBand');
                break;
            case 'c':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    if (confirm('Clear all bands?')) {
                        this.eventBus.emit('clearAll');
                    }
                }
                break;
            case 'p':
                const frequency = parseFloat(this.elements.frequency.value);
                this.eventBus.emit('playTone', frequency);
                break;
            case 's':
                this.eventBus.emit('stopTone');
                break;
            case 'f':
                this.eventBus.emit('toggleFieldPoints');
                break;
            case 'm':
                // Toggle collision sounds with 'm' key
                this.elements.collisionSounds.checked = !this.elements.collisionSounds.checked;
                this.eventBus.emit('toggleCollisionSounds', this.elements.collisionSounds.checked);
                break;
            case 'v':
                // Toggle band visibility with 'v' key
                this.eventBus.emit('toggleBandVisibility');
                break;
            case 'h':
                // Cycle through harmonize behaviors with 'h' key
                const currentIndex = this.elements.harmonizeBehavior.selectedIndex;
                const nextIndex = (currentIndex + 1) % this.elements.harmonizeBehavior.options.length;
                this.elements.harmonizeBehavior.selectedIndex = nextIndex;
                this.eventBus.emit('updateHarmonizeBehavior', this.elements.harmonizeBehavior.value);
                break;
            case 't':
                // Toggle field trails with 't' key
                this.elements.fieldTrails.checked = !this.elements.fieldTrails.checked;
                this.eventBus.emit('toggleFieldTrails', this.elements.fieldTrails.checked);
                break;
        }
    }
    
    /**
     * Get current control values
     * @returns {Object} Current values of all controls
     */
    getValues() {
        return {
            frequency: parseFloat(this.elements.frequency.value),
            amplitude: parseFloat(this.elements.amplitude.value),
            phase: parseFloat(this.elements.phase.value),
            charge: parseFloat(this.elements.charge.value),
            fieldStrength: parseFloat(this.elements.fieldStrength.value),
            elasticity: parseFloat(this.elements.elasticity.value) / 100,
            mergeChance: parseFloat(this.elements.mergeChance.value) / 100,
            harmonizeChance: parseFloat(this.elements.harmonizeChance.value) / 100,
            soundFade: parseFloat(this.elements.soundFade.value),
            speedLimit: parseFloat(this.elements.speedLimit.value),
            fieldTrailDuration: parseFloat(this.elements.fieldTrailDuration.value),
            collisionSounds: this.elements.collisionSounds.checked,
            fieldTrails: this.elements.fieldTrails.checked,
            harmonizeBehavior: this.elements.harmonizeBehavior.value,
            mergeMode: this.elements.mergeMode.value
        };
    }
    
    /**
     * Set control values
     * @param {Object} values - Values to set
     */
    setValues(values) {
        if (values.frequency !== undefined) {
            this.elements.frequency.value = values.frequency;
            this.elements.freqDisplay.value = values.frequency;
        }
        
        if (values.amplitude !== undefined) {
            this.elements.amplitude.value = values.amplitude;
            this.elements.ampDisplay.textContent = values.amplitude;
        }
        
        if (values.phase !== undefined) {
            this.elements.phase.value = values.phase;
            this.elements.phaseDisplay.textContent = values.phase;
        }
        
        if (values.charge !== undefined) {
            this.elements.charge.value = values.charge;
            this.elements.chargeDisplay.textContent = values.charge;
        }
        
        if (values.fieldStrength !== undefined) {
            this.elements.fieldStrength.value = values.fieldStrength;
            this.elements.fieldStrengthDisplay.textContent = values.fieldStrength;
        }
        
        if (values.elasticity !== undefined) {
            const percentValue = values.elasticity * 100;
            this.elements.elasticity.value = percentValue;
            this.elements.elasticityDisplay.textContent = percentValue;
        }
        
        if (values.mergeChance !== undefined) {
            const percentValue = values.mergeChance * 100;
            this.elements.mergeChance.value = percentValue;
            this.elements.mergeChanceDisplay.textContent = percentValue;
        }
        
        if (values.harmonizeChance !== undefined) {
            const percentValue = values.harmonizeChance * 100;
            this.elements.harmonizeChance.value = percentValue;
            this.elements.harmonizeChanceDisplay.textContent = percentValue;
        }
        
        if (values.soundFade !== undefined) {
            this.elements.soundFade.value = values.soundFade;
            this.elements.soundFadeDisplay.textContent = values.soundFade;
        }
        
        if (values.speedLimit !== undefined) {
            this.elements.speedLimit.value = values.speedLimit;
            this.elements.speedLimitDisplay.textContent = values.speedLimit;
        }
        
        if (values.fieldTrailDuration !== undefined) {
            this.elements.fieldTrailDuration.value = values.fieldTrailDuration;
            this.elements.fieldTrailDurationDisplay.textContent = values.fieldTrailDuration;
        }
        
        if (values.collisionSounds !== undefined) {
            this.elements.collisionSounds.checked = values.collisionSounds;
        }
        
        if (values.fieldTrails !== undefined) {
            this.elements.fieldTrails.checked = values.fieldTrails;
        }
        
        if (values.harmonizeBehavior !== undefined) {
            this.elements.harmonizeBehavior.value = values.harmonizeBehavior;
        }
        
        if (values.mergeMode !== undefined) {
            this.elements.mergeMode.value = values.mergeMode;
        }
    }
    
    /**
     * Enable or disable controls
     * @param {boolean} enabled - Whether controls should be enabled
     */
    setEnabled(enabled) {
        Object.values(this.elements).forEach(element => {
            if (element && element.disabled !== undefined) {
                element.disabled = !enabled;
            }
        });
    }
    
    /**
     * Update interaction rules based on select values
     */
    updateInteractionRules() {
        const rules = {
            negativeToPositive: parseFloat(this.elements.negToPos.value),
            positiveToPositive: parseFloat(this.elements.posToPos.value),
            negativeToNegative: parseFloat(this.elements.negToNeg.value)
        };
        
        console.log('Interaction rules updated:', rules);
        this.eventBus.emit('updateInteractionRules', rules);
    }
}