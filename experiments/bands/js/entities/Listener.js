// Listener.js - The listener entity that can be placed and interacts with fields
// Represents a listening point that can be dragged around and has spatial audio capabilities
// Updated to include listening radius and directional hearing

export class Listener {
    constructor(x, y) {
        // Position
        this.position = { x, y };
        
        // Direction (angle in radians, 0 = right, PI/2 = down, etc)
        this.direction = 0;
        
        // Visual properties
        this.radius = 25; // Size of the listener circle
        this.color = '#ffdd44'; // Golden yellow color
        
        // Listening properties
        this.listeningRadius = 300; // Default listening radius in pixels
        this.showListeningRadius = true; // Whether to show the listening radius visually
        
        // Dragging state
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        
        // Physics properties when field interaction is enabled
        this.velocity = { x: 0, y: 0 };
        this.mass = 2; // Similar to band mass
        this.fieldInteractionEnabled = false;
        
        // Visual pulse effect
        this.pulseTime = 0;
        
        // Audio context reference (will be set by AudioManager)
        this.audioContext = null;
        this.listenerNode = null;
        
        console.log('Listener created at', x, y);
    }
    
    /**
     * Initialize audio listener node
     * @param {AudioContext} audioContext - The Web Audio context
     */
    initializeAudio(audioContext) {
        this.audioContext = audioContext;
        this.listenerNode = audioContext.listener;
        
        // Update the audio listener's initial position
        this.updateAudioPosition();
        
        console.log('Listener audio initialized');
    }
    
    /**
     * Update the audio listener's position and orientation in 3D space
     */
    updateAudioPosition() {
        if (!this.listenerNode || !this.audioContext) return;
        
        // Convert 2D position to 3D audio space
        // We'll use a scale factor to convert pixels to audio units
        const audioScale = 0.01; // 1 pixel = 0.01 audio units
        
        const x = this.position.x * audioScale;
        const y = 0; // Keep at ground level for 2D simulation
        const z = -this.position.y * audioScale; // Negative because audio Z is into screen
        
        // Set position (using deprecated method for compatibility)
        if (this.listenerNode.positionX) {
            // Modern API
            this.listenerNode.positionX.setValueAtTime(x, this.audioContext.currentTime);
            this.listenerNode.positionY.setValueAtTime(y, this.audioContext.currentTime);
            this.listenerNode.positionZ.setValueAtTime(z, this.audioContext.currentTime);
        } else {
            // Fallback for older browsers
            this.listenerNode.setPosition(x, y, z);
        }
        
        // Calculate forward and up vectors from direction
        const forwardX = Math.cos(this.direction);
        const forwardY = 0;
        const forwardZ = -Math.sin(this.direction);
        
        // Up vector is always pointing up in our 2D simulation
        const upX = 0;
        const upY = 1;
        const upZ = 0;
        
        // Set orientation
        if (this.listenerNode.forwardX) {
            // Modern API
            this.listenerNode.forwardX.setValueAtTime(forwardX, this.audioContext.currentTime);
            this.listenerNode.forwardY.setValueAtTime(forwardY, this.audioContext.currentTime);
            this.listenerNode.forwardZ.setValueAtTime(forwardZ, this.audioContext.currentTime);
            this.listenerNode.upX.setValueAtTime(upX, this.audioContext.currentTime);
            this.listenerNode.upY.setValueAtTime(upY, this.audioContext.currentTime);
            this.listenerNode.upZ.setValueAtTime(upZ, this.audioContext.currentTime);
        } else {
            // Fallback for older browsers
            this.listenerNode.setOrientation(forwardX, forwardY, forwardZ, upX, upY, upZ);
        }
    }
    
    /**
     * Check if a band is within listening range
     * @param {WigglyBand} band - The band to check
     * @returns {boolean} True if band is within range
     */
    canHear(band) {
        const dx = band.position.x - this.position.x;
        const dy = band.position.y - this.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance <= this.listeningRadius;
    }
    
    /**
     * Get the relative position of a band from the listener's perspective
     * @param {WigglyBand} band - The band to get position for
     * @returns {Object} Object with distance and angle relative to listener
     */
    getRelativePosition(band) {
        const dx = band.position.x - this.position.x;
        const dy = band.position.y - this.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate angle from listener to band
        const angleToband = Math.atan2(dy, dx);
        
        // Calculate relative angle (how far off from listener's forward direction)
        let relativeAngle = angleToband - this.direction;
        
        // Normalize to -PI to PI range
        while (relativeAngle > Math.PI) relativeAngle -= 2 * Math.PI;
        while (relativeAngle < -Math.PI) relativeAngle += 2 * Math.PI;
        
        return {
            distance: distance,
            angle: relativeAngle,
            // Helper properties for debugging
            isInFront: Math.abs(relativeAngle) < Math.PI / 2,
            isToRight: relativeAngle > 0
        };
    }
    
    /**
     * Update the listener's state
     * @param {number} deltaTime - Time elapsed in seconds
     */
    update(deltaTime) {
        // Update pulse animation
        this.pulseTime += deltaTime;
        
        // If field interaction is enabled and not dragging, update position based on velocity
        if (this.fieldInteractionEnabled && !this.isDragging && deltaTime > 0) {
            // Apply some damping to velocity
            const damping = 0.98;
            this.velocity.x *= damping;
            this.velocity.y *= damping;
            
            // Update position
            this.position.x += this.velocity.x * deltaTime * 60; // Scale by 60 for frame-independent
            this.position.y += this.velocity.y * deltaTime * 60;
            
            // Update direction based on velocity if moving
            const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
            if (speed > 0.1) {
                this.direction = Math.atan2(this.velocity.y, this.velocity.x);
            }
            
            // Update audio position when moving
            this.updateAudioPosition();
        }
    }
    
    /**
     * Apply a force to the listener (when field interaction is enabled)
     * @param {Object} force - Force vector {x, y}
     */
    applyForce(force) {
        if (!this.fieldInteractionEnabled || this.isDragging) return;
        
        // F = ma, so a = F/m
        const ax = force.x / this.mass;
        const ay = force.y / this.mass;
        
        // Update velocity
        this.velocity.x += ax;
        this.velocity.y += ay;
        
        // Apply speed limit
        const speedLimit = 3; // Lower than bands since listener should move more gently
        const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        if (speed > speedLimit) {
            const scale = speedLimit / speed;
            this.velocity.x *= scale;
            this.velocity.y *= scale;
        }
    }
    
    /**
     * Start dragging the listener
     * @param {number} mouseX - Mouse X position
     * @param {number} mouseY - Mouse Y position
     */
    startDrag(mouseX, mouseY) {
        this.isDragging = true;
        this.dragOffset.x = mouseX - this.position.x;
        this.dragOffset.y = mouseY - this.position.y;
        
        // Stop any velocity when dragging starts
        this.velocity.x = 0;
        this.velocity.y = 0;
    }
    
    /**
     * Update position while dragging
     * @param {number} mouseX - Mouse X position
     * @param {number} mouseY - Mouse Y position
     */
    updateDrag(mouseX, mouseY) {
        if (!this.isDragging) return;
        
        // Calculate new position
        const newX = mouseX - this.dragOffset.x;
        const newY = mouseY - this.dragOffset.y;
        
        // Calculate direction based on movement
        const dx = newX - this.position.x;
        const dy = newY - this.position.y;
        const moveDistance = Math.sqrt(dx * dx + dy * dy);
        
        if (moveDistance > 1) {
            // Update direction to point in movement direction
            this.direction = Math.atan2(dy, dx);
        }
        
        // Update position
        this.position.x = newX;
        this.position.y = newY;
        
        // Update audio position while dragging
        this.updateAudioPosition();
    }
    
    /**
     * Stop dragging
     */
    stopDrag() {
        this.isDragging = false;
    }
    
    /**
     * Check if a point is inside the listener
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean} True if point is inside
     */
    containsPoint(x, y) {
        const dx = x - this.position.x;
        const dy = y - this.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= this.radius;
    }
    
    /**
     * Set the listening radius
     * @param {number} radius - New listening radius in pixels
     */
    setListeningRadius(radius) {
        this.listeningRadius = radius;
        console.log('Listening radius set to:', radius);
    }
    
    /**
     * Toggle visibility of listening radius
     */
    toggleListeningRadiusVisibility() {
        this.showListeningRadius = !this.showListeningRadius;
    }
    
    /**
     * Set whether field interaction is enabled
     * @param {boolean} enabled - Whether to enable field interaction
     */
    setFieldInteractionEnabled(enabled) {
        this.fieldInteractionEnabled = enabled;
        if (!enabled) {
            // Stop movement when disabling
            this.velocity.x = 0;
            this.velocity.y = 0;
        }
        console.log('Listener field interaction', enabled ? 'enabled' : 'disabled');
    }
    
    /**
     * Rotate the listener by a given angle
     * @param {number} angleDelta - Angle to rotate by (in radians)
     */
    rotate(angleDelta) {
        this.direction += angleDelta;
        // Keep direction in 0 to 2*PI range
        while (this.direction < 0) this.direction += Math.PI * 2;
        while (this.direction > Math.PI * 2) this.direction -= Math.PI * 2;
        
        // Update audio orientation
        this.updateAudioPosition();
    }
    
    /**
     * Set the listener's direction to point towards a position
     * @param {number} x - Target X coordinate
     * @param {number} y - Target Y coordinate
     */
    lookAt(x, y) {
        const dx = x - this.position.x;
        const dy = y - this.position.y;
        this.direction = Math.atan2(dy, dx);
        
        // Update audio orientation
        this.updateAudioPosition();
    }
    
    /**
     * Get the listener's forward vector based on direction
     * @returns {Object} Normalized forward vector {x, y}
     */
    getForwardVector() {
        return {
            x: Math.cos(this.direction),
            y: Math.sin(this.direction)
        };
    }
    
    /**
     * Keep listener within bounds
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     */
    constrainToBounds(width, height) {
        const margin = this.radius;
        
        // Constrain position
        if (this.position.x < margin) {
            this.position.x = margin;
            this.velocity.x = Math.abs(this.velocity.x) * 0.5; // Bounce with damping
        }
        if (this.position.x > width - margin) {
            this.position.x = width - margin;
            this.velocity.x = -Math.abs(this.velocity.x) * 0.5;
        }
        if (this.position.y < margin) {
            this.position.y = margin;
            this.velocity.y = Math.abs(this.velocity.y) * 0.5;
        }
        if (this.position.y > height - margin) {
            this.position.y = height - margin;
            this.velocity.y = -Math.abs(this.velocity.y) * 0.5;
        }
    }
}