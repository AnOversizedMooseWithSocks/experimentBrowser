// Renderer.js - Handles all canvas rendering
// Responsible for drawing bands, their fields, and the listener entity
// Updated to include listener visualization with direction and range

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Rendering options
        this.showFields = true;
        this.showFieldPoints = true;  // Turn on by default for debugging
        this.showBandShapes = true;   // Toggle for band shape visibility
        this.showSoundWaves = true;   // Toggle for sound visualization (on by default)
        this.trailEffect = true;
        this.showListenerRange = true; // Toggle for listener range visibility
        
        // Field trails
        this.fieldTrailsEnabled = false; // Will be set by app initialization
        this.fieldTrailDuration = 2.0; // seconds
        this.fieldTrails = new Map(); // Map of band ID to trail points
        
        // Sound ripples tracking
        this.soundRipples = []; // Array of active ripples
        
        console.log('Renderer initialized');
    }
    
    /**
     * Clear the canvas
     * @param {boolean} fullClear - If true, completely clear. If false, use trail effect
     */
    clear(fullClear = false) {
        if (fullClear || !this.trailEffect) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        } else {
            // Slight trail effect by drawing semi-transparent background
            this.ctx.fillStyle = 'rgba(10, 10, 10, 0.1)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
    
    /**
     * Render the listener entity
     * @param {Listener} listener - The listener to render
     */
    renderListener(listener) {
        if (!listener) return;
        
        this.ctx.save();
        
        // Draw listening radius if enabled
        if (this.showListenerRange && listener.showListeningRadius) {
            // Draw the listening area
            this.ctx.beginPath();
            this.ctx.arc(listener.position.x, listener.position.y, listener.listeningRadius, 0, Math.PI * 2);
            
            // Gradient fill for listening area
            const gradient = this.ctx.createRadialGradient(
                listener.position.x, listener.position.y, 0,
                listener.position.x, listener.position.y, listener.listeningRadius
            );
            gradient.addColorStop(0, 'rgba(255, 221, 68, 0.05)');
            gradient.addColorStop(0.5, 'rgba(255, 221, 68, 0.02)');
            gradient.addColorStop(1, 'transparent');
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            // Draw the listening radius border
            this.ctx.strokeStyle = 'rgba(255, 221, 68, 0.3)';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 10]);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
        
        // Draw pulsing effect
        const pulseScale = 1 + Math.sin(listener.pulseTime * 3) * 0.1;
        
        // Draw outer glow
        const glowRadius = listener.radius * pulseScale * 1.5;
        const glowGradient = this.ctx.createRadialGradient(
            listener.position.x, listener.position.y, 0,
            listener.position.x, listener.position.y, glowRadius
        );
        glowGradient.addColorStop(0, 'rgba(255, 221, 68, 0.3)');
        glowGradient.addColorStop(1, 'transparent');
        this.ctx.fillStyle = glowGradient;
        this.ctx.beginPath();
        this.ctx.arc(listener.position.x, listener.position.y, glowRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw the listener body
        this.ctx.beginPath();
        this.ctx.arc(listener.position.x, listener.position.y, listener.radius * pulseScale, 0, Math.PI * 2);
        
        // Gradient fill for body
        const bodyGradient = this.ctx.createRadialGradient(
            listener.position.x - listener.radius * 0.3, 
            listener.position.y - listener.radius * 0.3, 
            0,
            listener.position.x, listener.position.y, listener.radius
        );
        bodyGradient.addColorStop(0, '#ffeb3b');
        bodyGradient.addColorStop(0.7, listener.color);
        bodyGradient.addColorStop(1, '#ff9800');
        this.ctx.fillStyle = bodyGradient;
        this.ctx.fill();
        
        // Draw border
        this.ctx.strokeStyle = '#ff9800';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        // Draw direction indicator
        const forward = listener.getForwardVector();
        const arrowLength = listener.radius * 1.8;
        const arrowTipX = listener.position.x + forward.x * arrowLength;
        const arrowTipY = listener.position.y + forward.y * arrowLength;
        
        // Draw direction line
        this.ctx.beginPath();
        this.ctx.moveTo(listener.position.x, listener.position.y);
        this.ctx.lineTo(arrowTipX, arrowTipY);
        this.ctx.strokeStyle = '#ff6b6b';
        this.ctx.lineWidth = 4;
        this.ctx.stroke();
        
        // Draw arrowhead
        const arrowSize = 12;
        const arrowAngle = Math.atan2(forward.y, forward.x);
        
        this.ctx.beginPath();
        this.ctx.moveTo(arrowTipX, arrowTipY);
        this.ctx.lineTo(
            arrowTipX - arrowSize * Math.cos(arrowAngle - Math.PI / 6),
            arrowTipY - arrowSize * Math.sin(arrowAngle - Math.PI / 6)
        );
        this.ctx.moveTo(arrowTipX, arrowTipY);
        this.ctx.lineTo(
            arrowTipX - arrowSize * Math.cos(arrowAngle + Math.PI / 6),
            arrowTipY - arrowSize * Math.sin(arrowAngle + Math.PI / 6)
        );
        this.ctx.strokeStyle = '#ff6b6b';
        this.ctx.lineWidth = 4;
        this.ctx.stroke();
        
        // Draw inner ear icon
        this.ctx.save();
        this.ctx.translate(listener.position.x, listener.position.y);
        this.ctx.rotate(listener.direction);
        
        // Simplified ear shape
        this.ctx.beginPath();
        this.ctx.arc(0, 0, listener.radius * 0.5, -Math.PI * 0.7, Math.PI * 0.7);
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        // Inner ear detail
        this.ctx.beginPath();
        this.ctx.arc(5, 0, listener.radius * 0.3, -Math.PI * 0.5, Math.PI * 0.5);
        this.ctx.stroke();
        
        this.ctx.restore();
        
        // Draw status text if dragging
        if (listener.isDragging) {
            this.ctx.font = '12px Arial';
            this.ctx.fillStyle = '#fff';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                `(${Math.round(listener.position.x)}, ${Math.round(listener.position.y)})`,
                listener.position.x,
                listener.position.y - listener.radius - 10
            );
        }
        
        this.ctx.restore();
    }
    
    /**
     * Update sound ripples for all bands that are emitting sound
     * @param {Array} bands - Array of all bands
     */
    updateSoundRipples(bands) {
        if (!this.showSoundWaves) return; // Don't update if sound waves are hidden
        
        // Remove old ripples
        this.soundRipples = this.soundRipples.filter(ripple => {
            const age = (Date.now() - ripple.startTime) / 1000;
            return age < ripple.maxAge;
        });
        
        // Add new ripples for bands that just started emitting
        bands.forEach(band => {
            if (band.isEmittingSound && !band.isInHarmonyRing) {
                // Check if we already have recent ripples for this band
                const hasRecentRipple = this.soundRipples.some(ripple => 
                    ripple.band === band && 
                    (Date.now() - ripple.startTime) < 200 // Less than 200ms old
                );
                
                if (!hasRecentRipple) {
                    // Calculate the starting radius (band surface)
                    const bandRadius = Math.max(band.radiusX, band.radiusY);
                    
                    // Calculate max radius based on amplitude
                    // Amplitude 5-50 maps to 2x-10x band diameter
                    const ampNormalized = (band.amplitude - 5) / 45; // 0 to 1
                    const radiusMultiplier = 2 + ampNormalized * 8; // 2x to 10x
                    const maxRadius = bandRadius * radiusMultiplier;
                    
                    // Create a new ripple
                    this.soundRipples.push({
                        band: band,
                        x: band.position.x,
                        y: band.position.y,
                        startTime: Date.now(),
                        startRadius: bandRadius, // Start from band surface
                        maxRadius: maxRadius,
                        maxAge: 3, // Ripple lasts 3 seconds
                        color: band.color,
                        frequency: band.frequency
                    });
                }
            }
        });
    }
    
    /**
     * Render sound ripples
     */
    renderSoundRipples() {
        if (!this.showSoundWaves) return;
        
        this.ctx.save();
        
        this.soundRipples.forEach(ripple => {
            const age = (Date.now() - ripple.startTime) / 1000; // Age in seconds
            const ageRatio = age / ripple.maxAge;
            
            // Create multiple concentric circles for the ripple effect
            const numCircles = 5;
            for (let i = 0; i < numCircles; i++) {
                const circleAge = ageRatio - (i * 0.1);
                if (circleAge < 0 || circleAge > 1) continue;
                
                // Calculate radius for this circle
                const radius = ripple.maxRadius * circleAge;
                
                // Calculate opacity (fade out as it expands)
                const opacity = (1 - circleAge) * 0.3;
                
                // Draw the circle
                this.ctx.beginPath();
                this.ctx.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2);
                this.ctx.strokeStyle = ripple.color + Math.floor(opacity * 255).toString(16).padStart(2, '0');
                this.ctx.lineWidth = 2 + (1 - circleAge) * 3; // Thicker when younger
                this.ctx.stroke();
            }
        });
        
        this.ctx.restore();
    }
    
    /**
     * Render resonance glow for a band
     * @param {WigglyBand} band - The resonating band
     */
    renderResonanceGlow(band) {
        if (!band.isResonating) return;
        
        this.ctx.save();
        
        // Create pulsing glow effect
        // The glow pulsates to show the band is resonating with another band's sound
        const glowRadius = Math.max(band.radiusX, band.radiusY) * (1.5 + band.resonanceGlow);
        
        // Multiple layers for softer glow
        for (let i = 3; i >= 0; i--) {
            const layerRadius = glowRadius * (1 + i * 0.2);
            const opacity = band.resonanceGlow * (0.1 / (i + 1));
            
            const gradient = this.ctx.createRadialGradient(
                band.position.x, band.position.y, 0,
                band.position.x, band.position.y, layerRadius
            );
            
            gradient.addColorStop(0, band.color + Math.floor(opacity * 255).toString(16).padStart(2, '0'));
            gradient.addColorStop(1, 'transparent');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(band.position.x, band.position.y, layerRadius, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Add small ripples for resonating bands
        if (this.showSoundWaves) {
            const resonanceAge = (Date.now() - band.resonanceStartTime) / 1000;
            const pulseRadius = (Math.max(band.radiusX, band.radiusY) + 20) + 
                               Math.sin(resonanceAge * 6) * 10;
            
            this.ctx.beginPath();
            this.ctx.arc(band.position.x, band.position.y, pulseRadius, 0, Math.PI * 2);
            this.ctx.strokeStyle = band.color + '60';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
        
        this.ctx.restore();
    }
    
    /**
     * Render sound emission indicator
     * @param {WigglyBand} band - The band emitting sound
     */
    renderSoundEmissionIndicator(band) {
        if (!band.isEmittingSound || !this.showSoundWaves) return;
        
        this.ctx.save();
        
        // Draw speaker icon or musical note
        const iconSize = 20; // Increased from 16
        const iconX = band.position.x;
        const iconY = band.position.y - band.radiusY - 30; // Increased offset
        
        // Pulsing effect
        const pulseScale = 1 + Math.sin(Date.now() * 0.005) * 0.3; // Increased pulse
        
        // Add glow effect behind the note
        const glowRadius = iconSize * pulseScale * 0.8;
        const gradient = this.ctx.createRadialGradient(iconX, iconY, 0, iconX, iconY, glowRadius);
        gradient.addColorStop(0, band.color + '40');
        gradient.addColorStop(1, 'transparent');
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(iconX, iconY, glowRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw the note
        this.ctx.font = `bold ${iconSize * pulseScale}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = band.color;
        this.ctx.fillText('♪', iconX, iconY);
        
        // Draw volume indicator bars
        const volumeBars = 3;
        for (let i = 0; i < volumeBars; i++) {
            const barHeight = 6 + i * 3; // Increased size
            const barX = iconX + 15 + i * 5;
            const barY = iconY - barHeight / 2;
            const opacity = band.soundEmissionVolume > (i * 0.3) ? 1 : 0.3;
            
            this.ctx.fillStyle = band.color + Math.floor(opacity * 255).toString(16).padStart(2, '0');
            this.ctx.fillRect(barX, barY, 3, barHeight);
        }
        
        this.ctx.restore();
    }
    
    /**
     * Render tethers between bands
     * @param {Array} tethers - Array of tether objects
     */
    renderTethers(tethers) {
        this.ctx.save();
        
        tethers.forEach(tether => {
            if (!tether.bandA || !tether.bandB) return;
            
            const posA = tether.bandA.position;
            const posB = tether.bandB.position;
            
            // Calculate distance between bands
            const dx = posB.x - posA.x;
            const dy = posB.y - posA.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Calculate stretch factor (how much the tether is stretched)
            const stretchFactor = Math.max(0, (distance - tether.restLength) / tether.restLength);
            
            // Draw tether as a curved line
            this.ctx.beginPath();
            this.ctx.moveTo(posA.x, posA.y);
            
            // Calculate control points for bezier curve
            const midX = (posA.x + posB.x) / 2;
            const midY = (posA.y + posB.y) / 2;
            
            // Add some sag to the tether based on stretch
            const sagAmount = 20 + stretchFactor * 30;
            const perpX = -dy / distance * sagAmount;
            const perpY = dx / distance * sagAmount;
            
            // Draw quadratic bezier curve
            this.ctx.quadraticCurveTo(
                midX + perpX,
                midY + perpY,
                posB.x,
                posB.y
            );
            
            // Style the tether
            const opacity = 0.3 + stretchFactor * 0.3; // More opaque when stretched
            const thickness = 2 + stretchFactor * 2; // Thicker when stretched
            
            // Color based on connected bands' frequencies
            const avgFreq = (tether.bandA.frequency + tether.bandB.frequency) / 2;
            const hue = ((avgFreq - 100) / 1900) * 240; // Map to hue
            
            this.ctx.strokeStyle = `hsla(${hue}, 70%, 50%, ${opacity})`;
            this.ctx.lineWidth = thickness;
            this.ctx.stroke();
            
            // Add pulsing effect at connection points
            const pulseSize = 3 + Math.sin(Date.now() * 0.003) * 2;
            
            this.ctx.beginPath();
            this.ctx.arc(posA.x, posA.y, pulseSize, 0, Math.PI * 2);
            this.ctx.fillStyle = `hsla(${hue}, 70%, 60%, 0.8)`;
            this.ctx.fill();
            
            this.ctx.beginPath();
            this.ctx.arc(posB.x, posB.y, pulseSize, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        this.ctx.restore();
    }
    
    /**
     * Render a wiggly band
     * @param {WigglyBand} band - The band to render
     */
    renderBand(band) {
        this.ctx.save();
        
        // Render resonance glow first (behind everything)
        this.renderResonanceGlow(band);
        
        // Draw the field visualization if enabled
        if (this.showFields && !band.isInHarmonyRing) {
            this.renderField(band);
        }
        
        // Update and render field trails if enabled
        if (this.fieldTrailsEnabled && !band.isInHarmonyRing) {
            this.updateFieldTrails(band);
            this.renderFieldTrails(band);
        }
        
        // Draw the wiggly ellipse only if band shapes are visible
        if (this.showBandShapes) {
            this.renderWigglyEllipse(band);
        }
        
        // Draw field points for debugging if enabled
        if (this.showFieldPoints && !band.isInHarmonyRing) {
            this.renderFieldPoints(band);
            this.renderForceVector(band);
        }
        
        // Draw charge indicator even if band shape is hidden
        if (!this.showBandShapes) {
            this.renderChargeIndicator(band);
        }
        
        // Draw harmony ring indicator if applicable
        if (band.isOuterRing && band.harmonyRing) {
            this.renderHarmonyRingIndicator(band);
        }
        
        // Draw oscillating band indicator
        if (band.isOscillating) {
            this.renderOscillatingIndicator(band);
        }
        
        // Draw sound emission indicator
        this.renderSoundEmissionIndicator(band);
        
        // Draw deformation indicator (optional - for debugging)
        if (false) { // Set to true to see deformation values
            this.renderDeformationInfo(band);
        }
        
        this.ctx.restore();
    }
    
    /**
     * Render the wiggly ellipse shape
     * @param {WigglyBand} band - The band to render
     */
    renderWigglyEllipse(band) {
        if (band.oscillationPoints.length < 3) return;
        
        this.ctx.beginPath();
        
        // Move to first point
        this.ctx.moveTo(
            band.oscillationPoints[0].x, 
            band.oscillationPoints[0].y
        );
        
        // Draw smooth curve through oscillation points
        for (let i = 1; i < band.oscillationPoints.length; i++) {
            const current = band.oscillationPoints[i];
            const prev = band.oscillationPoints[i - 1];
            
            // Use quadratic curve for smooth shape
            const cpx = (prev.x + current.x) / 2;
            const cpy = (prev.y + current.y) / 2;
            
            this.ctx.quadraticCurveTo(prev.x, prev.y, cpx, cpy);
        }
        
        // Close the path
        const first = band.oscillationPoints[0];
        const last = band.oscillationPoints[band.oscillationPoints.length - 1];
        this.ctx.quadraticCurveTo(last.x, last.y, first.x, first.y);
        this.ctx.closePath();
        
        // Special styling for bands in harmony rings
        if (band.isInHarmonyRing) {
            // Inner bands are more transparent
            this.ctx.fillStyle = band.color + '20'; // 20 = ~12% opacity
            this.ctx.fill();
            
            // Thinner, more subtle outline
            this.ctx.strokeStyle = band.color + '60';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        } else {
            // Normal band styling
            let fillOpacity = '40'; // Default: 40 = ~25% opacity
            let strokeWidth = 2;
            
            // Make emitting bands slightly brighter
            if (band.isEmittingSound) {
                fillOpacity = '60'; // Brighter fill
                strokeWidth = 3;    // Thicker stroke
            }
            
            this.ctx.fillStyle = band.color + fillOpacity;
            this.ctx.fill();
            
            // Stroke the outline
            this.ctx.strokeStyle = band.color;
            this.ctx.lineWidth = strokeWidth;
            this.ctx.stroke();
        }
        
        // Add charge indicator in center
        this.ctx.save();
        this.ctx.font = band.isInHarmonyRing ? '12px Arial' : '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = band.charge > 0 ? '#ff6666' : '#6666ff';
        this.ctx.fillText(band.charge > 0 ? '+' : '−', band.position.x, band.position.y);
        this.ctx.restore();
    }
    
    /**
     * Render harmony ring indicator
     * @param {WigglyBand} band - The outer band of a harmony ring
     */
    renderHarmonyRingIndicator(band) {
        if (!band.harmonyRing || band.harmonyRing.length <= 1) return;
        
        this.ctx.save();
        
        // Draw ring count indicator
        const ringCount = band.harmonyRing.length;
        const indicatorRadius = band.radiusX + 15;
        
        // Draw decorative ring
        this.ctx.beginPath();
        this.ctx.arc(band.position.x, band.position.y, indicatorRadius, 0, Math.PI * 2);
        this.ctx.strokeStyle = '#ffdd44';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // Draw ring count
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#ffdd44';
        this.ctx.fillText(
            `♫ ${ringCount}`,
            band.position.x,
            band.position.y - indicatorRadius - 10
        );
        
        this.ctx.restore();
    }
    
    /**
     * Render oscillating band indicator
     * @param {WigglyBand} band - The oscillating band
     */
    renderOscillatingIndicator(band) {
        this.ctx.save();
        
        // Draw oscillation waves
        const time = band.oscillateTime || 0;
        const numWaves = 3;
        
        for (let i = 0; i < numWaves; i++) {
            const phase = (time + i * 0.3) % band.oscillatePeriod;
            const alpha = 0.3 - i * 0.1;
            const scale = 1.2 + i * 0.1 + Math.sin(phase * Math.PI * 2 / band.oscillatePeriod) * 0.1;
            
            this.ctx.beginPath();
            this.ctx.ellipse(
                band.position.x,
                band.position.y,
                band.radiusX * scale,
                band.radiusY * scale,
                band.rotation,
                0,
                Math.PI * 2
            );
            
            this.ctx.strokeStyle = band.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        }
        
        // Draw oscillation symbol
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#88ff88';
        this.ctx.fillText('∞', band.position.x, band.position.y - band.radiusY - 15);
        
        this.ctx.restore();
    }
    
    /**
     * Render just the charge indicator (when band shape is hidden)
     * @param {WigglyBand} band - The band whose charge to render
     */
    renderChargeIndicator(band) {
        this.ctx.save();
        
        // Draw a small circle at band center
        this.ctx.beginPath();
        this.ctx.arc(band.position.x, band.position.y, 8, 0, Math.PI * 2);
        this.ctx.fillStyle = band.color + '80'; // Semi-transparent
        this.ctx.fill();
        this.ctx.strokeStyle = band.color;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Add charge symbol
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(band.charge > 0 ? '+' : '−', band.position.x, band.position.y);
        
        this.ctx.restore();
    }
    
    /**
     * Render the field visualization
     * @param {WigglyBand} band - The band whose field to render
     */
    renderField(band) {
        // Draw a subtle gradient for the overall field
        const gradient = this.ctx.createRadialGradient(
            band.position.x, band.position.y, 0,
            band.position.x, band.position.y, band.fieldRadius
        );
        
        // Use different colors based on charge
        const fieldColor = band.charge > 0 ? '255, 100, 100' : '100, 100, 255';
        gradient.addColorStop(0, `rgba(${fieldColor}, 0.08)`);
        gradient.addColorStop(1, 'transparent');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(band.position.x, band.position.y, band.fieldRadius, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    /**
     * Render field points for visualization/debugging
     * @param {WigglyBand} band - The band whose field points to render
     */
    renderFieldPoints(band) {
        // Draw small dots at field points
        for (const point of band.fieldPoints) {
            // Draw field radius for this point
            const pointFieldRadius = band.fieldRadius / band.fieldPoints.length * 0.8; // Adjusted for visibility
            
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, pointFieldRadius, 0, Math.PI * 2);
            
            // Very subtle field area
            const gradient = this.ctx.createRadialGradient(
                point.x, point.y, 0,
                point.x, point.y, pointFieldRadius
            );
            
            if (point.charge > 0) {
                gradient.addColorStop(0, 'rgba(255, 100, 100, 0.1)');
            } else {
                gradient.addColorStop(0, 'rgba(100, 100, 255, 0.1)');
            }
            gradient.addColorStop(1, 'transparent');
            
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            // Draw the field point itself
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
            
            // Color based on charge
            this.ctx.fillStyle = point.charge > 0 ? '#ff6666' : '#6666ff';
            this.ctx.fill();
            
            // Small charge indicator
            this.ctx.save();
            this.ctx.font = '8px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = '#fff';
            this.ctx.fillText(point.charge > 0 ? '+' : '−', point.x, point.y);
            this.ctx.restore();
        }
    }
    
    /**
     * Toggle field visualization
     */
    toggleFields() {
        this.showFields = !this.showFields;
    }
    
    /**
     * Toggle field points visualization
     */
    toggleFieldPoints() {
        this.showFieldPoints = !this.showFieldPoints;
    }
    
    /**
     * Toggle band shape visibility
     */
    toggleBandShapes() {
        this.showBandShapes = !this.showBandShapes;
        console.log('Band shapes', this.showBandShapes ? 'visible' : 'hidden');
    }
    
    /**
     * Toggle sound wave visualization
     */
    toggleSoundWaves() {
        this.showSoundWaves = !this.showSoundWaves;
        console.log('Sound waves', this.showSoundWaves ? 'visible' : 'hidden');
    }
    
    /**
     * Toggle trail effect
     */
    toggleTrailEffect() {
        this.trailEffect = !this.trailEffect;
    }
    
    /**
     * Toggle listener range visibility
     */
    toggleListenerRange() {
        this.showListenerRange = !this.showListenerRange;
        console.log('Listener range', this.showListenerRange ? 'visible' : 'hidden');
    }
    
    /**
     * Render deformation info for debugging
     * @param {WigglyBand} band - The band whose info to render
     */
    renderDeformationInfo(band) {
        this.ctx.save();
        this.ctx.font = '10px Arial';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.textAlign = 'center';
        
        const deformX = ((band.radiusX / band.originalRadiusX - 1) * 100).toFixed(1);
        const deformY = ((band.radiusY / band.originalRadiusY - 1) * 100).toFixed(1);
        
        this.ctx.fillText(
            `X: ${deformX}% Y: ${deformY}%`, 
            band.position.x, 
            band.position.y + band.radiusY + 20
        );
        this.ctx.restore();
    }
    
    /**
     * Render force vector for debugging
     * @param {WigglyBand} band - The band whose force to render
     */
    renderForceVector(band) {
        if (!band.lastAppliedForce) return;
        
        const force = band.lastAppliedForce;
        const magnitude = Math.sqrt(force.x * force.x + force.y * force.y);
        
        if (magnitude < 0.0001) return;
        
        this.ctx.save();
        
        // Draw force vector as arrow
        const scale = 1000; // Scale for visibility
        const endX = band.position.x + force.x * scale;
        const endY = band.position.y + force.y * scale;
        
        this.ctx.beginPath();
        this.ctx.moveTo(band.position.x, band.position.y);
        this.ctx.lineTo(endX, endY);
        this.ctx.strokeStyle = '#ffff00';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Draw arrowhead
        const angle = Math.atan2(force.y, force.x);
        const arrowLength = 10;
        
        this.ctx.beginPath();
        this.ctx.moveTo(endX, endY);
        this.ctx.lineTo(
            endX - arrowLength * Math.cos(angle - Math.PI / 6),
            endY - arrowLength * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.moveTo(endX, endY);
        this.ctx.lineTo(
            endX - arrowLength * Math.cos(angle + Math.PI / 6),
            endY - arrowLength * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    /**
     * Update field trails for a band
     * @param {WigglyBand} band - The band whose trails to update
     */
    updateFieldTrails(band) {
        // Create unique ID for band if it doesn't exist
        if (!band._rendererId) {
            band._rendererId = Math.random().toString(36).substr(2, 9);
        }
        
        // Get or create trail array for this band
        if (!this.fieldTrails.has(band._rendererId)) {
            this.fieldTrails.set(band._rendererId, []);
        }
        
        const trails = this.fieldTrails.get(band._rendererId);
        const now = Date.now();
        
        // Add current field points to trails
        band.fieldPoints.forEach(point => {
            trails.push({
                x: point.x,
                y: point.y,
                charge: point.charge,
                timestamp: now,
                bandColor: band.color
            });
        });
        
        // Remove old trail points
        const cutoffTime = now - (this.fieldTrailDuration * 1000);
        const validTrails = trails.filter(trail => trail.timestamp > cutoffTime);
        this.fieldTrails.set(band._rendererId, validTrails);
        
        // Clean up if band has no trails
        if (validTrails.length === 0) {
            this.fieldTrails.delete(band._rendererId);
        }
    }
    
    /**
     * Render field trails for a band
     * @param {WigglyBand} band - The band whose trails to render
     */
    renderFieldTrails(band) {
        if (!band._rendererId || !this.fieldTrails.has(band._rendererId)) {
            return;
        }
        
        const trails = this.fieldTrails.get(band._rendererId);
        const now = Date.now();
        
        this.ctx.save();
        
        trails.forEach(trail => {
            // Calculate age and opacity
            const age = (now - trail.timestamp) / 1000; // Age in seconds
            const normalizedAge = age / this.fieldTrailDuration;
            const opacity = Math.max(0, 1 - normalizedAge);
            
            // Draw trail point
            const size = 2 + opacity * 2; // Size fades with age
            
            this.ctx.beginPath();
            this.ctx.arc(trail.x, trail.y, size, 0, Math.PI * 2);
            
            // Color based on charge with fading opacity
            const alpha = Math.floor(opacity * 255).toString(16).padStart(2, '0');
            if (trail.charge > 0) {
                this.ctx.fillStyle = '#ff6666' + alpha;
            } else {
                this.ctx.fillStyle = '#6666ff' + alpha;
            }
            
            this.ctx.fill();
            
            // Add a subtle glow for newer points
            if (opacity > 0.5) {
                const glowSize = size + 3;
                const glowOpacity = (opacity - 0.5) * 0.3;
                const glowAlpha = Math.floor(glowOpacity * 255).toString(16).padStart(2, '0');
                
                this.ctx.beginPath();
                this.ctx.arc(trail.x, trail.y, glowSize, 0, Math.PI * 2);
                this.ctx.fillStyle = trail.bandColor + glowAlpha;
                this.ctx.fill();
            }
        });
        
        this.ctx.restore();
    }
    
    /**
     * Set field trails enabled state
     * @param {boolean} enabled - Whether field trails should be shown
     */
    setFieldTrailsEnabled(enabled) {
        this.fieldTrailsEnabled = enabled;
        if (!enabled) {
            // Clear all trails when disabled
            this.fieldTrails.clear();
        }
    }
    
    /**
     * Set field trail duration
     * @param {number} duration - Duration in seconds
     */
    setFieldTrailDuration(duration) {
        this.fieldTrailDuration = duration;
    }
}