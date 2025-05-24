// WigglyBand.js - The main entity class for wiggly bands
// Represents an oscillating elliptical band with physics properties

export class WigglyBand {
    constructor(x, y, options = {}) {
        // Position and size properties
        this.position = { x, y };
        
        // Original dimensions (rest state)
        this.originalRadiusX = options.radiusX || 40;
        this.originalRadiusY = options.radiusY || 25;
        
        // Current dimensions (can be deformed)
        this.radiusX = this.originalRadiusX;
        this.radiusY = this.originalRadiusY;
        
        // Deformation velocities
        this.radiusVelocityX = 0;
        this.radiusVelocityY = 0;
        
        this.rotation = options.rotation || 0;
        
        // Physics properties (set charge first for color generation)
        this.velocity = { x: 0, y: 0 };
        this.mass = options.mass || 1;
        this.charge = options.charge || (Math.random() > 0.5 ? 1 : -1);
        
        // Elasticity - how quickly the band returns to original shape (0.01 to 0.5)
        this.elasticity = options.elasticity || 0.1;
        
        // Damping for radius oscillations
        this.radiusDamping = 0.99; // Increased from 0.98 for less bouncy deformation
        
        // Oscillation properties for the wiggly effect
        this.frequency = options.frequency || 440; // Hz
        this.amplitude = options.amplitude || 15;
        this.phaseOffset = options.phaseOffset || Math.random() * Math.PI * 2;
        this.time = 0;
        
        // Harmony ring properties
        this.harmonyRing = null; // Array of bands in this ring (if outer band)
        this.isOuterRing = false; // Is this the outer band of a harmony ring?
        this.isInHarmonyRing = false; // Is this band inside a harmony ring?
        this.ringParent = null; // Reference to outer band if this is inner
        
        // Oscillating band properties (for harmonize behavior)
        this.isOscillating = false;
        this.oscillatePropsA = null;
        this.oscillatePropsB = null;
        this.oscillateTime = 0;
        this.oscillatePeriod = 3; // seconds per full cycle
        
        // Generate color based on properties
        this.updateColor();
        
        // Field properties
        this.fieldRadius = Math.max(this.originalRadiusX, this.originalRadiusY) * 2.8; // Increased from 2.5
        this.oscillationPoints = [];
        this.fieldPoints = [];
        
        // Track forces for deformation
        this.deformationForce = { x: 0, y: 0 };
        
        // Debug: track last applied force for visualization
        this.lastAppliedForce = { x: 0, y: 0 };
        
        // Create physics body using Matter.js
        this.createPhysicsBody();
        
        // Initialize oscillation points
        this.updateOscillationPoints();
    }
    
    /**
     * Generate color based on band properties
     * Uses frequency, amplitude, and charge to determine color
     */
    updateColor() {
        // Map frequency to hue (100-2000 Hz to 0-360 degrees)
        // Low frequencies = red/orange, high frequencies = blue/purple
        const freqNormalized = (this.frequency - 100) / (2000 - 100);
        const hue = (1 - freqNormalized) * 240; // 240 to 0 (blue to red)
        
        // Map amplitude to saturation (5-50 to 50-100%)
        const ampNormalized = (this.amplitude - 5) / (50 - 5);
        const saturation = 50 + ampNormalized * 50;
        
        // Map charge to lightness (negative = darker, positive = lighter)
        const lightness = this.charge > 0 ? 60 : 40;
        
        // Convert HSL to hex
        this.color = this.hslToHex(hue, saturation, lightness);
    }
    
    /**
     * Convert HSL to hex color
     */
    hslToHex(h, s, l) {
        // Convert percentages to decimals
        s /= 100;
        l /= 100;
        
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c / 2;
        
        let r = 0, g = 0, b = 0;
        
        if (0 <= h && h < 60) {
            r = c; g = x; b = 0;
        } else if (60 <= h && h < 120) {
            r = x; g = c; b = 0;
        } else if (120 <= h && h < 180) {
            r = 0; g = c; b = x;
        } else if (180 <= h && h < 240) {
            r = 0; g = x; b = c;
        } else if (240 <= h && h < 300) {
            r = x; g = 0; b = c;
        } else if (300 <= h && h < 360) {
            r = c; g = 0; b = x;
        }
        
        // Convert to hex
        const toHex = (n) => {
            const hex = Math.round((n + m) * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        
        return '#' + toHex(r) + toHex(g) + toHex(b);
    }
    
    /**
     * Generate a random vibrant color (deprecated - now uses property-based color)
     */
    generateRandomColor() {
        // This method is kept for compatibility but now just calls updateColor
        this.updateColor();
        return this.color;
    }
    
    /**
     * Create the Matter.js physics body
     * Since Matter.js doesn't have ellipse, we create vertices
     */
    createPhysicsBody() {
        // Generate ellipse vertices
        const vertices = [];
        const numPoints = 32;
        
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const x = this.radiusX * Math.cos(angle);
            const y = this.radiusY * Math.sin(angle);
            vertices.push({ x, y });
        }
        
        // Create body from vertices
        this.body = Matter.Bodies.fromVertices(this.position.x, this.position.y, vertices, {
            density: 0.01,
            frictionAir: 0.005,  // Reduced from 0.01 for less air resistance
            restitution: 0.75,   // Slightly increased from 0.7 for consistent bounce
            friction: 0.2,       // Reduced from 0.3
            angle: this.rotation,
            slop: 0.05,          // Increased from 0.01 to reduce jitter
            // Ensure vertices are centered properly
            position: this.position
        });
        
        // Ensure the body is properly centered
        if (this.body) {
            Matter.Body.setPosition(this.body, this.position);
        }
        
        // Set custom mass if provided
        if (this.mass && this.body) {
            Matter.Body.setMass(this.body, this.mass);
        }
        
        // Store reference to this band in the body for easy access
        this.body.wigglyBand = this;
        
        // Log successful creation
        if (this.body) {
            console.log(`Physics body created with mass: ${this.body.mass.toFixed(4)}`);
        }
    }
    
    /**
     * Update band properties (for merging or external changes)
     */
    updateProperties(properties) {
        // Update properties
        if (properties.frequency !== undefined) this.frequency = properties.frequency;
        if (properties.amplitude !== undefined) this.amplitude = properties.amplitude;
        if (properties.phaseOffset !== undefined) this.phaseOffset = properties.phaseOffset;
        if (properties.charge !== undefined) this.charge = properties.charge;
        if (properties.elasticity !== undefined) this.elasticity = properties.elasticity;
        
        // Update color when properties change
        this.updateColor();
    }
    
    /**
     * Get a copy of all mergeable properties
     */
    getProperties() {
        return {
            frequency: this.frequency,
            amplitude: this.amplitude,
            phaseOffset: this.phaseOffset,
            charge: this.charge,
            elasticity: this.elasticity,
            radiusX: this.originalRadiusX,
            radiusY: this.originalRadiusY,
            mass: this.body ? this.body.mass : this.mass
        };
    }
    
    /**
     * Update the band's state
     * @param {number} deltaTime - Time elapsed in seconds
     */
    update(deltaTime) {
        // Update time for oscillation
        this.time += deltaTime;
        
        // Update position from physics body
        if (this.body && !this.isInHarmonyRing) {
            this.position.x = this.body.position.x;
            this.position.y = this.body.position.y;
            this.rotation = this.body.angle;
        }
        
        // Handle oscillating band property animation
        if (this.isOscillating && this.oscillatePropsA && this.oscillatePropsB) {
            this.updateOscillatingProperties(deltaTime);
        }
        
        // Update radius deformation based on forces
        this.updateDeformation(deltaTime);
        
        // Update oscillation points for the wiggly effect
        this.updateOscillationPoints();
        
        // Update field interaction points
        this.updateFieldPoints();
        
        // Reset deformation force for next frame
        this.deformationForce = { x: 0, y: 0 };
    }
    
    /**
     * Update properties for oscillating band (harmonize behavior)
     * @param {number} deltaTime - Time elapsed in seconds
     */
    updateOscillatingProperties(deltaTime) {
        this.oscillateTime += deltaTime;
        
        // Calculate interpolation factor (0 to 1)
        const t = (Math.sin(this.oscillateTime * Math.PI * 2 / this.oscillatePeriod) + 1) / 2;
        
        // Interpolate between property sets
        const propsA = this.oscillatePropsA;
        const propsB = this.oscillatePropsB;
        
        this.frequency = propsA.frequency + (propsB.frequency - propsA.frequency) * t;
        this.amplitude = propsA.amplitude + (propsB.amplitude - propsA.amplitude) * t;
        this.phaseOffset = propsA.phaseOffset + (propsB.phaseOffset - propsA.phaseOffset) * t;
        this.charge = propsA.charge + (propsB.charge - propsA.charge) * t;
        this.elasticity = propsA.elasticity + (propsB.elasticity - propsA.elasticity) * t;
        
        // Also oscillate size
        this.originalRadiusX = propsA.radiusX + (propsB.radiusX - propsA.radiusX) * t;
        this.originalRadiusY = propsA.radiusY + (propsB.radiusY - propsA.radiusY) * t;
        
        // Update color to reflect changing properties
        this.updateColor();
    }
    
    /**
     * Update the band's deformation based on forces
     * @param {number} deltaTime - Time elapsed in seconds
     */
    updateDeformation(deltaTime) {
        // Apply deformation force to radius velocities
        // Force in X direction stretches radiusX, force in Y stretches radiusY
        const deformationScale = 0.006; // Reduced from 0.008 for stability
        this.radiusVelocityX += this.deformationForce.x * deformationScale;
        this.radiusVelocityY += this.deformationForce.y * deformationScale;
        
        // Apply spring force to return to original shape
        const springForceX = (this.originalRadiusX - this.radiusX) * this.elasticity;
        const springForceY = (this.originalRadiusY - this.radiusY) * this.elasticity;
        
        this.radiusVelocityX += springForceX;
        this.radiusVelocityY += springForceY;
        
        // Apply damping
        this.radiusVelocityX *= this.radiusDamping;
        this.radiusVelocityY *= this.radiusDamping;
        
        // Update radii
        this.radiusX += this.radiusVelocityX * deltaTime * 60; // Scale by 60 for frame-independent
        this.radiusY += this.radiusVelocityY * deltaTime * 60;
        
        // Constrain radii to reasonable bounds (25% to 250% of original size)
        const minRadius = Math.min(this.originalRadiusX, this.originalRadiusY) * 0.25;
        const maxRadiusX = this.originalRadiusX * 2.5;
        const maxRadiusY = this.originalRadiusY * 2.5;
        
        this.radiusX = Math.max(minRadius, Math.min(maxRadiusX, this.radiusX));
        this.radiusY = Math.max(minRadius, Math.min(maxRadiusY, this.radiusY));
        
        // Update field radius based on current size
        this.fieldRadius = Math.max(this.radiusX, this.radiusY) * 2.8; // Increased from 2.5
    }
    
    /**
     * Calculate the wiggly oscillation points around the ellipse
     */
    updateOscillationPoints() {
        this.oscillationPoints = [];
        const numPoints = 32; // Number of points around the ellipse
        
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            
            // Base ellipse calculation
            const baseX = this.radiusX * Math.cos(angle);
            const baseY = this.radiusY * Math.sin(angle);
            
            // Add oscillation (wiggly effect)
            // The oscillation varies around the ellipse perimeter
            const oscillation = Math.sin(
                this.time * this.frequency * 0.01 + 
                angle * 3 + 
                this.phaseOffset
            ) * this.amplitude;
            
            // Apply oscillation perpendicular to the ellipse edge
            const normalX = Math.cos(angle);
            const normalY = Math.sin(angle);
            
            const wigglyX = baseX + normalX * oscillation * 0.3;
            const wigglyY = baseY + normalY * oscillation * 0.3;
            
            // Rotate and translate to world position
            const rotatedX = wigglyX * Math.cos(this.rotation) - wigglyY * Math.sin(this.rotation);
            const rotatedY = wigglyX * Math.sin(this.rotation) + wigglyY * Math.cos(this.rotation);
            
            this.oscillationPoints.push({
                x: this.position.x + rotatedX,
                y: this.position.y + rotatedY,
                oscillation: oscillation,
                angle: angle
            });
        }
    }
    
    /**
     * Update field points at oscillation extrema
     */
    updateFieldPoints() {
        this.fieldPoints = [];
        
        // Find local maxima and minima points
        for (let i = 0; i < this.oscillationPoints.length; i++) {
            const current = this.oscillationPoints[i];
            const prev = this.oscillationPoints[(i - 1 + this.oscillationPoints.length) % this.oscillationPoints.length];
            const next = this.oscillationPoints[(i + 1) % this.oscillationPoints.length];
            
            // Check for local maximum (positive charge region)
            if (current.oscillation > prev.oscillation && current.oscillation > next.oscillation) {
                this.fieldPoints.push({
                    x: current.x,
                    y: current.y,
                    charge: this.charge,
                    type: 'max',
                    strength: Math.abs(current.oscillation) + 15 // Increased base strength
                });
            }
            
            // Check for local minimum (negative charge region)
            if (current.oscillation < prev.oscillation && current.oscillation < next.oscillation) {
                this.fieldPoints.push({
                    x: current.x,
                    y: current.y,
                    charge: -this.charge,
                    type: 'min',
                    strength: Math.abs(current.oscillation) + 15 // Increased base strength
                });
            }
        }
        
        // Ensure we have at least some field points
        if (this.fieldPoints.length === 0) {
            // Add field points at cardinal directions if no extrema found
            const numPoints = 4;
            for (let i = 0; i < numPoints; i++) {
                const angle = (i / numPoints) * Math.PI * 2;
                const x = this.position.x + this.radiusX * Math.cos(angle) * Math.cos(this.rotation) 
                         - this.radiusY * Math.sin(angle) * Math.sin(this.rotation);
                const y = this.position.y + this.radiusX * Math.cos(angle) * Math.sin(this.rotation) 
                         + this.radiusY * Math.sin(angle) * Math.cos(this.rotation);
                
                this.fieldPoints.push({
                    x: x,
                    y: y,
                    charge: (i % 2 === 0) ? this.charge : -this.charge,
                    type: (i % 2 === 0) ? 'max' : 'min',
                    strength: 25  // Increased from 20
                });
            }
        }
    }
    
    /**
     * Get the frequency that this band's shape represents
     * @returns {number} Frequency in Hz
     */
    getRepresentedFrequency() {
        return this.frequency;
    }
    
    /**
     * Apply a sound frequency to this band
     * @param {number} freq - Frequency in Hz
     */
    applyFrequency(freq) {
        this.frequency = freq;
        this.updateColor(); // Update color when frequency changes
    }
    
    /**
     * Calculate field influence on another band
     * @param {WigglyBand} otherBand - The band to calculate influence on
     * @param {Object} interactionRules - Rules for charge interactions
     * @param {number} fieldStrengthMultiplier - Global field strength multiplier (0 to 0.1)
     * @returns {Object} Force vector {x, y} and deformation info
     */
    getFieldInfluenceOn(otherBand, interactionRules = null, fieldStrengthMultiplier = 1) {
        // Default interaction rules
        const rules = interactionRules || {
            negativeToPositive: -1,  // Attraction (negative value)
            positiveToPositive: 1,   // Repulsion (positive value)
            negativeToNegative: 0    // Neutral (zero value)
        };
        
        let totalForce = { x: 0, y: 0 };
        let deformationForce = { x: 0, y: 0 };
        
        for (const fieldPoint of this.fieldPoints) {
            const dx = otherBand.position.x - fieldPoint.x;
            const dy = otherBand.position.y - fieldPoint.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Skip if distance is too small to prevent division errors
            if (distance < 0.1) continue;
            
            // Calculate field radius for this point
            // Each field point extends to cover a portion of the total field
            const pointFieldRadius = this.fieldRadius * 0.65; // Increased from 0.6
            
            if (distance < pointFieldRadius && distance > 0) {
                // Determine interaction multiplier based on charge types
                let interactionMultiplier = 0;
                
                if (fieldPoint.charge < 0 && otherBand.charge > 0) {
                    // Negative to positive: attraction
                    interactionMultiplier = rules.negativeToPositive;
                } else if (fieldPoint.charge > 0 && otherBand.charge < 0) {
                    // Positive to negative: attraction (symmetric)
                    interactionMultiplier = rules.negativeToPositive;
                } else if (fieldPoint.charge > 0 && otherBand.charge > 0) {
                    // Positive to positive: repulsion
                    interactionMultiplier = rules.positiveToPositive;
                } else if (fieldPoint.charge < 0 && otherBand.charge < 0) {
                    // Negative to negative: neutral (or as configured)
                    interactionMultiplier = rules.negativeToNegative;
                }
                
                // Skip if interaction is neutral
                if (interactionMultiplier === 0) continue;
                
                // Calculate force magnitude (adjusted for new field strength range)
                const baseForceMagnitude = fieldStrengthMultiplier * 6; // Reduced from 8 for stability
                const distanceFactor = Math.max(0, 1 - distance / pointFieldRadius);
                // Apply a smoother falloff curve
                const smoothFactor = distanceFactor * distanceFactor; // Quadratic falloff
                const forceMagnitude = baseForceMagnitude * smoothFactor * Math.abs(interactionMultiplier);
                
                // Cap maximum force to prevent glitches
                const maxForce = 0.5;
                const cappedMagnitude = Math.min(forceMagnitude, maxForce);
                
                // Calculate force direction
                // Positive multiplier = repulsion (away), negative = attraction (towards)
                const forceX = (dx / distance) * cappedMagnitude * Math.sign(interactionMultiplier);
                const forceY = (dy / distance) * cappedMagnitude * Math.sign(interactionMultiplier);
                
                totalForce.x += forceX;
                totalForce.y += forceY;
                
                // Accumulate deformation force (stronger when closer)
                const deformationStrength = (1 - distance / pointFieldRadius) * cappedMagnitude * 6; // Reduced from 8
                deformationForce.x += Math.abs(dx / distance) * deformationStrength;
                deformationForce.y += Math.abs(dy / distance) * deformationStrength;
            }
        }
        
        // Store deformation force on the other band
        otherBand.deformationForce.x += deformationForce.x;
        otherBand.deformationForce.y += deformationForce.y;
        
        return totalForce;
    }
    
    /**
     * Get the oscillation extrema points
     * @returns {Array} Array of extrema points
     */
    getOscillationExtrema() {
        return this.fieldPoints;
    }
}