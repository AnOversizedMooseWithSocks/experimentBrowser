/**
 * Star UI module - Handles star information display and user interaction
 * Enhanced with visual selection indicator and draggable info window
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js';
import eventBus from './events.js';
import * as state from './state.js';
import { generateStarSystem } from './stars.js';
import * as cameraControls from './camera-controls.js';
import { calculatePreciseStarPosition } from './renderer.js';

// Keep track of the star indicator object
let starIndicator = null;
let connectionLine = null;
let lineRenderer = null;

/**
 * Set up star information overlay event listeners
 */
export function setupStarInformationOverlay() {
    const starCloseBtn = document.getElementById('star-close-btn');
    const randomStarBtn = document.getElementById('random-star-btn');
    const trackStarBtn = document.getElementById('track-star-btn');
    const starOverlay = document.getElementById('star-info-overlay');
    
    if (starCloseBtn) {
        starCloseBtn.addEventListener('click', hideStarInfo);
    }
    
    if (randomStarBtn) {
        randomStarBtn.addEventListener('click', selectRandomStar);
    }
    
    if (trackStarBtn) {
        trackStarBtn.addEventListener('click', toggleStarTracking);
    }
    
    // Listen for clicks on stars from camera-controls
    eventBus.on('star-clicked', (star) => {
        selectStar(star);
    });
    
    // Make star info window draggable
    if (starOverlay) {
        makeStarInfoDraggable(starOverlay);
    }
    
    // Create line renderer for connection line
    createConnectionLineRenderer();
    
    // Set up animation for the connection line
    setupConnectionLineAnimation();
    
    console.log('Enhanced Star UI initialized with visual selection indicator');
    eventBus.emit('star-ui-initialized');
}

/**
 * Create a renderer for the connection line
 */
function createConnectionLineRenderer() {
    // Create a separate renderer for the connection line
    lineRenderer = document.createElement('div');
    lineRenderer.id = 'star-connection-line';
    lineRenderer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 40;
    `;
    
    // Create the SVG element for drawing the line
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.overflow = 'visible';
    
    // Create the line element
    connectionLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    connectionLine.setAttribute('stroke', '#4CAF50');
    connectionLine.setAttribute('stroke-width', '1.5');
    connectionLine.setAttribute('fill', 'none');
    connectionLine.setAttribute('stroke-dasharray', '5,3');
    connectionLine.setAttribute('opacity', '0.6');
    connectionLine.setAttribute('filter', 'drop-shadow(0 0 3px rgba(76, 175, 80, 0.5))');
    
    // Add the line to the SVG
    svg.appendChild(connectionLine);
    lineRenderer.appendChild(svg);
    
    // Add the line renderer to the body
    document.body.appendChild(lineRenderer);
}

/**
 * Set up animation for the connection line
 */
function setupConnectionLineAnimation() {
    // Create a dash animation for the line
    const style = document.createElement('style');
    style.textContent = `
        @keyframes dash-animation {
            to {
                stroke-dashoffset: -8;
            }
        }
        #star-connection-line path {
            animation: dash-animation 1s linear infinite;
        }
    `;
    document.head.appendChild(style);
}

/**
 * Make the star info window draggable
 * @param {HTMLElement} element - The star info overlay element
 */
function makeStarInfoDraggable(element) {
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;
    
    // Create a drag handle
    const dragHandle = document.createElement('div');
    dragHandle.className = 'star-drag-handle';
    dragHandle.innerHTML = '⋮⋮';
    dragHandle.style.cssText = `
        position: absolute;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        cursor: move;
        font-size: 16px;
        color: rgba(255, 255, 255, 0.5);
        background: rgba(0, 0, 0, 0.3);
        border-radius: 10px;
        padding: 2px 8px;
        opacity: 0.7;
        transition: opacity 0.2s;
        z-index: 55;
    `;
    
    // Add hover effect
    dragHandle.addEventListener('mouseenter', () => {
        dragHandle.style.opacity = '1';
    });
    
    dragHandle.addEventListener('mouseleave', () => {
        if (!isDragging) {
            dragHandle.style.opacity = '0.7';
        }
    });
    
    // Add the drag handle to the star info window
    element.appendChild(dragHandle);
    
    // Mouse down event to start dragging
    dragHandle.addEventListener('mousedown', (e) => {
        isDragging = true;
        const rect = element.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        
        dragHandle.style.opacity = '1';
        element.style.transition = 'none';
        
        // Add a dragging class for visual feedback
        element.classList.add('dragging');
        
        // Prevent text selection while dragging
        e.preventDefault();
    });
    
    // Mouse move event to update position
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            // Calculate new position
            const x = e.clientX - offsetX;
            const y = e.clientY - offsetY;
            
            // Update position
            element.style.left = `${x}px`;
            element.style.top = `${y}px`;
            element.style.bottom = 'auto';
            element.style.right = 'auto';
            
            // Update the connection line
            updateConnectionLine();
        }
    });
    
    // Mouse up event to stop dragging
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            dragHandle.style.opacity = '0.7';
            element.style.transition = 'opacity 0.3s ease';
            
            // Remove dragging class
            element.classList.remove('dragging');
            
            // Store the position in state for persistence
            const rect = element.getBoundingClientRect();
            state.set('starInfoPosition', {
                left: rect.left,
                top: rect.top
            });
        }
    });
    
    // Double click to reset position
    dragHandle.addEventListener('dblclick', () => {
        element.style.transition = 'all 0.3s ease';
        element.style.left = '20px';
        element.style.top = 'auto';
        element.style.bottom = '20px';
        element.style.right = 'auto';
        
        // Clear stored position
        state.set('starInfoPosition', null);
        
        // Update the connection line
        setTimeout(updateConnectionLine, 300);
    });
}

/**
 * Set up star selection via mouse clicks
 * Note: This function now just sets up event handlers.
 * The actual star selection is now handled by camera-controls.js
 */
export function setupStarSelection() {
    // This is now handled by camera-controls.js
    // We just maintain this function for API compatibility
    console.log('Star selection handlers initialized');
}

/**
 * Select a specific star
 * @param {Object} star - The star to select
 */
export function selectStar(star) {
    state.setSelectedStar(star);
    star.id = star.index; // Ensure star has an ID
    
    // Generate star system data
    const starSystem = generateStarSystem(star);
    
    // Create or update visual indicator for selected star
    createStarIndicator(star);
    
    // Display star information
    displayStarInformation(starSystem);
    
    // Position the star info overlay if position is stored
    positionStarInfoOverlay();
    
    // Show star info overlay
    const overlay = document.getElementById('star-info-overlay');
    if (overlay) {
        overlay.classList.add('visible');
        overlay.style.display = 'block';
        
        // Update the connection line
        updateConnectionLine();
    }
    
    console.log('Selected star:', starSystem);
    eventBus.emit('star-selected', starSystem);
    
    // If star tracking is enabled, make sure we transition to this star
    if (state.isTrackingEnabled()) {
        state.setTrackedStar(star);
        updateTrackingButton(true);
    }
}

/**
 * Position the star info overlay based on stored position
 */
function positionStarInfoOverlay() {
    const overlay = document.getElementById('star-info-overlay');
    if (!overlay) return;
    
    const storedPosition = state.get('starInfoPosition');
    if (storedPosition) {
        overlay.style.left = `${storedPosition.left}px`;
        overlay.style.top = `${storedPosition.top}px`;
        overlay.style.bottom = 'auto';
        overlay.style.right = 'auto';
    }
}

/**
 * Create or update a visual indicator for the selected star
 * FIXED: Now uses the same position calculation as camera tracking
 * @param {Object} star - The selected star
 */
function createStarIndicator(star) {
    const scene = state.getScene();
    if (!scene) return;
    
    // Remove existing indicator if any
    if (starIndicator) {
        scene.remove(starIndicator);
        if (starIndicator.geometry) starIndicator.geometry.dispose();
        if (starIndicator.material) starIndicator.material.dispose();
    }
    
    // Calculate current position using the same function as the camera tracking
    // This ensures perfect alignment between indicator and camera focus
    const calculatedPos = calculatePreciseStarPosition({...star, index: star.index});
    if (!calculatedPos) return;
    
    // IMPROVED: Use a more visible ring with better coloring and effects
    // Create a ring around the selected star with increased size
    const ringGeometry = new THREE.RingGeometry(1.5, 2.2, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x4CAF50, // Brighter green for better visibility
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8, // Increased opacity
        blending: THREE.AdditiveBlending
    });
    
    // Create the ring mesh
    starIndicator = new THREE.Mesh(ringGeometry, ringMaterial);
    starIndicator.position.copy(calculatedPos);
    
    // Make the ring face the camera
    const camera = state.getCamera();
    if (camera) {
        starIndicator.lookAt(camera.position);
    } else {
        starIndicator.lookAt(0, 0, 0);
    }
    
    // IMPROVED: Create a brighter point light for better visibility
    const light = new THREE.PointLight(0x4CAF50, 1.5, 8); // Increased intensity and range
    light.position.set(0, 0, 0);
    starIndicator.add(light);
    
    // IMPROVED: Add a small sphere at the center for additional visibility
    const centerGeometry = new THREE.SphereGeometry(0.6, 16, 16);
    const centerMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.0,
        blending: THREE.AdditiveBlending
    });
    const centerSphere = new THREE.Mesh(centerGeometry, centerMaterial);
    starIndicator.add(centerSphere);
    
    // Add to scene
    scene.add(starIndicator);
    
    // Store in state for animations
    state.set('starIndicator', {
        mesh: starIndicator,
        star: star,
        createdAt: state.getTime()
    });
    
    // Start animation for the indicator
    animateStarIndicator();
    
    // Store the calculated position for use by other functions
    star.currentPosition = calculatedPos.clone();
    
    // Log indicator creation for debugging
    console.log(`Star indicator created at position: [${calculatedPos.x.toFixed(2)}, ${calculatedPos.y.toFixed(2)}, ${calculatedPos.z.toFixed(2)}]`);
}

/**
 * Animate the star indicator with pulsing effect
 */
function animateStarIndicator() {
    // Get indicator data using the getter if available, otherwise use generic get
    const indicatorData = typeof state.getStarIndicator === 'function' 
        ? state.getStarIndicator() 
        : state.get('starIndicator');
        
    if (!indicatorData || !indicatorData.mesh) return;
    
    const indicator = indicatorData.mesh;
    const currentTime = state.getTime();
    const age = currentTime - indicatorData.createdAt;
    
    // Pulsing animation for the indicator
    const pulseFactor = 1 + 0.3 * Math.sin(age * 2.5);
    indicator.scale.set(pulseFactor, pulseFactor, pulseFactor);
    
    // Adjust opacity for breathing effect
    if (indicator.material) {
        indicator.material.opacity = 0.5 + 0.3 * Math.sin(age * 3.0);
    }
    
    // Adjust light intensity for the glow
    const light = indicator.children[0];
    if (light && light.isLight) {
        light.intensity = 0.8 + 0.5 * Math.sin(age * 2.0);
    }
    
    // Ensure indicator always faces the camera
    const camera = state.getCamera();
    if (camera) {
        indicator.lookAt(camera.position);
    }
    
    // Continue animation in next frame
    requestAnimationFrame(animateStarIndicator);
}

/**
 * Update the connection line between the selected star and the info window
 * FIXED: Now uses the same position calculation for better accuracy
 */
export function updateConnectionLine() {
    const camera = state.getCamera();
    const scene = state.getScene();
    const renderer = state.getRenderer();
    const overlay = document.getElementById('star-info-overlay');
    
    // Get indicator data using the getter if available, otherwise use generic get
    const indicatorData = typeof state.getStarIndicator === 'function' 
        ? state.getStarIndicator() 
        : state.get('starIndicator');
    
    if (!camera || !scene || !renderer || !overlay || !overlay.classList.contains('visible') || 
        !indicatorData || !indicatorData.mesh || !connectionLine) {
        // Hide the line if any required elements are missing
        if (connectionLine) {
            connectionLine.setAttribute('opacity', '0');
        }
        return;
    }
    
    // Get the selected star with its index
    const star = indicatorData.star;
    if (!star) {
        connectionLine.setAttribute('opacity', '0');
        return;
    }
    
    // IMPROVED: Get the current star position directly from the indicator mesh
    // This ensures we're always pointing to the visible indicator
    const currentPosition = indicatorData.mesh.position.clone();
    
    // As a fallback, use the calculation function
    if (!currentPosition || currentPosition.lengthSq() === 0) {
        const calculatedPos = calculatePreciseStarPosition({...star, index: star.index});
        if (!calculatedPos) {
            connectionLine.setAttribute('opacity', '0');
            return;
        }
        currentPosition.copy(calculatedPos);
    }
    
    // Check if star is in front of the camera
    const projectedPos = currentPosition.clone().project(camera);
    
    // If star is behind camera (z > 1), hide the line
    if (projectedPos.z > 1) {
        connectionLine.setAttribute('opacity', '0');
        return;
    }
    
    // Convert to screen coordinates
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const screenX = (projectedPos.x * 0.5 + 0.5) * screenWidth;
    const screenY = (-(projectedPos.y * 0.5) + 0.5) * screenHeight;
    
    // Get overlay position
    const overlayRect = overlay.getBoundingClientRect();
    const overlayX = overlayRect.left + overlayRect.width / 2;
    const overlayY = overlayRect.top + 20; // Connect to top of info window
    
    // IMPROVED: Check if we have valid coordinates before proceeding
    if (isNaN(screenX) || isNaN(screenY) || isNaN(overlayX) || isNaN(overlayY)) {
        console.warn("Invalid coordinates for connection line", {
            screenX, screenY, overlayX, overlayY
        });
        connectionLine.setAttribute('opacity', '0');
        return;
    }
    
    // Calculate control points for a curved line
    const dx = overlayX - screenX;
    const dy = overlayY - screenY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Adjust curve based on distance
    const curveHeight = Math.min(distance * 0.2, 50);
    
    const midX = (screenX + overlayX) / 2;
    const midY = (screenY + overlayY) / 2 - curveHeight;
    
    // Create a curved path
    const path = `M ${screenX} ${screenY} Q ${midX} ${midY}, ${overlayX} ${overlayY}`;
    connectionLine.setAttribute('d', path);
    
    // IMPROVED: Make line more visible with brighter color and wider stroke
    connectionLine.setAttribute('stroke', '#4CAF50');
    connectionLine.setAttribute('stroke-width', '2.5');
    
    // Make line visible with pulsing opacity
    const pulseOpacity = 0.5 + 0.3 * Math.sin(state.getTime() * 2);
    connectionLine.setAttribute('opacity', pulseOpacity.toString());
    
    // IMPROVED: Log successful line draw for debugging
    // console.log(`Connection line drawn from star at (${screenX.toFixed(0)}, ${screenY.toFixed(0)}) ` +
    //             `to overlay at (${overlayX.toFixed(0)}, ${overlayY.toFixed(0)})`);
}

/**
 * Select a random star that's bright and large enough to be visible
 * Enhanced to prefer larger, brighter stars closer to the camera
 */
export function selectRandomStar() {
    const galaxyData = state.getCurrentGalaxyData();
    if (!galaxyData || !galaxyData.particles) return;
    
    const particles = galaxyData.particles;
    const camera = state.getCamera();
    
    // Parameters for star visibility - REDUCED thresholds to include more stars
    const minSize = 0.8;         // Reduced from 1.2 to catch more stars
    const minBrightness = 0.4;   // Reduced from 0.6 to catch more stars
    const glowIntensity = state.getGlowIntensity() || 0.6;
    
    // Filter particles to get only clearly visible ones
    const visibleStars = [];
    
    // Calculate camera position for distance calculations
    const cameraPos = camera ? camera.position : new THREE.Vector3(0, 0, 0);
    
    console.log("Starting random star selection with glowIntensity:", glowIntensity);
    console.log(`Using thresholds: minSize=${minSize}, minBrightness=${minBrightness}`);
    
    // Debugging counters
    let sizeFilteredCount = 0;
    let brightnessFilteredCount = 0;
    let distanceFilteredCount = 0;
    let screenPosFilteredCount = 0;
    let visibilityFilteredCount = 0;
    let totalEvaluated = 0;
    
    // Filter and calculate scores for each star
    for (let i = 0; i < particles.length; i++) {
        totalEvaluated++;
        const particle = particles[i];
        
        // Apply glow intensity to get effective size and brightness
        const effectiveSize = particle.size * glowIntensity;
        const effectiveBrightness = particle.brightness * glowIntensity;
        
        // Skip if too small 
        if (effectiveSize < minSize) {
            sizeFilteredCount++;
            continue;
        }
        
        // Skip if too dim
        if (effectiveBrightness < minBrightness) {
            brightnessFilteredCount++;
            continue;
        }
        
        // Calculate current position
        const currentPos = calculatePreciseStarPosition({...particle, index: i});
        if (!currentPos) continue;
        
        // Calculate distance from camera
        const cameraDistance = camera ? cameraPos.distanceTo(currentPos) : 1000;
        
        // Skip stars that are very far away
        // MODIFIED: Use higher distance threshold but stricter size+brightness requirement
        // for far away stars to ensure they're still visible
        if (cameraDistance > 180) {
            distanceFilteredCount++;
            continue;
        }
        
        // Skip very far stars unless they're extremely bright/large
        if (cameraDistance > 120 && (effectiveSize * effectiveBrightness < 1.5)) {
            distanceFilteredCount++;
            continue;
        }
        
        // Project to screen to check visibility
        const screenPos = currentPos.clone().project(camera);
        
        // Skip if behind camera
        if (screenPos.z > 1) {
            screenPosFilteredCount++;
            continue;
        }
        
        // Calculate screen coordinates (useful for debugging)
        const screenX = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
        const screenY = (-(screenPos.y * 0.5) + 0.5) * window.innerHeight;
        
        // Skip if outside visible screen (with some margin)
        const margin = 50; // px
        if (screenX < -margin || screenX > window.innerWidth + margin || 
            screenY < -margin || screenY > window.innerHeight + margin) {
            screenPosFilteredCount++;
            continue;
        }
        
        // Calculate visibility score - higher is more visible
        // MODIFIED formula to make size and brightness more important
        const visibilityScore = (effectiveSize * effectiveBrightness * 1.2) / 
                               Math.max(0.1, Math.pow(cameraDistance / 60, 1.3));
        
        // Only include stars that are clearly visible
        // REDUCED threshold to include more candidates
        if (visibilityScore < 0.08) {
            visibilityFilteredCount++;
            continue;
        }
        
        visibleStars.push({
            star: particle,
            index: i,
            currentPos,
            cameraDistance,
            visibilityScore,
            effectiveSize,
            effectiveBrightness,
            screenX,
            screenY
        });
    }
    
    // Debug current filters
    console.log(`Random star filtering stats (total particles: ${particles.length}):`);
    console.log(`Evaluated: ${totalEvaluated}, Found visible: ${visibleStars.length}`);
    console.log(`Filtered by: size=${sizeFilteredCount}, brightness=${brightnessFilteredCount}, ` +
                `distance=${distanceFilteredCount}, screen position=${screenPosFilteredCount}, ` +
                `visibility=${visibilityFilteredCount}`);
    
    // If no visible stars with strict criteria, use adaptive thresholds
    if (visibleStars.length === 0) {
        console.warn('No clearly visible stars found, trying with adaptive thresholds');
        
        // Try with progressively lower thresholds until we find something
        // This is better than just jumping to hard-coded fallback values
        const adaptiveMinSize = minSize * 0.7;
        const adaptiveMinBrightness = minBrightness * 0.7;
        
        for (let i = 0; i < particles.length; i++) {
            const particle = particles[i];
            
            // Apply glow intensity to get effective size and brightness
            const effectiveSize = particle.size * glowIntensity;
            const effectiveBrightness = particle.brightness * glowIntensity;
            
            // More lenient filtering
            if (effectiveSize < adaptiveMinSize || effectiveBrightness < adaptiveMinBrightness) continue;
            
            // Calculate current position
            const currentPos = calculatePreciseStarPosition({...particle, index: i});
            if (!currentPos) continue;
            
            // Calculate distance from camera
            const cameraDistance = camera ? cameraPos.distanceTo(currentPos) : 1000;
            
            // Project to screen to check visibility
            const screenPos = currentPos.clone().project(camera);
            
            // Skip if behind camera
            if (screenPos.z > 1) continue;
            
            // Add to visible stars with a basic visibility score
            visibleStars.push({
                star: particle,
                index: i,
                currentPos,
                cameraDistance,
                visibilityScore: effectiveSize * effectiveBrightness / (cameraDistance * 0.02),
                effectiveSize,
                effectiveBrightness
            });
            
            // Once we find some stars, we can stop
            if (visibleStars.length >= 10) break;
        }
        
        console.log(`Found ${visibleStars.length} stars with adaptive thresholds`);
    }
    
    // If still no visible stars, fall back to the original method
    if (visibleStars.length === 0) {
        console.warn('No visible stars found with adaptive thresholds, using fallback method');
        
        // Last resort - just pick any random star that might be visible
        const allPotentialStars = [];
        
        for (let i = 0; i < particles.length; i++) {
            const particle = particles[i];
            // Just do minimal filtering
            if (particle.size * glowIntensity > 0.3) {
                allPotentialStars.push({
                    star: particle,
                    index: i
                });
            }
        }
        
        if (allPotentialStars.length > 0) {
            const randomIndex = Math.floor(Math.random() * allPotentialStars.length);
            const randomStar = { 
                ...allPotentialStars[randomIndex].star, 
                index: allPotentialStars[randomIndex].index 
            };
            console.log(`Selected random star using fallback method (index: ${randomStar.index})`);
            selectStar(randomStar);
            return;
        } else {
            // Absolute last resort
            console.warn('No stars found at all, using any random particle');
            const randomIndex = Math.floor(Math.random() * particles.length);
            const randomStar = { ...particles[randomIndex], index: randomIndex };
            selectStar(randomStar);
            return;
        }
    }
    
    // Sort by visibility score (highest first)
    visibleStars.sort((a, b) => b.visibilityScore - a.visibilityScore);
    
    // Take one of the top stars randomly for variety
    // MODIFIED: Use more of the top stars to provide more variety
    const topCount = Math.min(15, visibleStars.length);
    const randomTopIndex = Math.floor(Math.random() * topCount);
    const selected = visibleStars[randomTopIndex];
    
    // Find the original index of this star in the particles array
    const origIndex = selected.index;
    const starData = { ...selected.star, index: origIndex };
    
    // Enhanced logging for better diagnosis
    console.log(`Selected random star (rank ${randomTopIndex+1}/${visibleStars.length}): ` +
        `size=${selected.effectiveSize.toFixed(2)}, ` +
        `brightness=${selected.effectiveBrightness.toFixed(2)}, ` +
        `distance=${selected.cameraDistance.toFixed(2)}, ` +
        `visibility=${selected.visibilityScore.toFixed(2)}`);
    
    if (selected.screenX !== undefined) {
        console.log(`Star screen position: (${selected.screenX.toFixed(0)}, ${selected.screenY.toFixed(0)})`);
    }
    
    selectStar(starData);
    eventBus.emit('status-update', 'Random visible star selected');
}

/**
 * Toggle star tracking (camera follows star)
 * @returns {boolean} - New tracking state
 */
export function toggleStarTracking() {
    const selectedStar = state.getSelectedStar();
    if (!selectedStar) return false;
    
    const isTrackingEnabled = !state.isTrackingEnabled();
    state.setIsTrackingEnabled(isTrackingEnabled);
    
    if (isTrackingEnabled) {
        // Store the star we want to track
        state.setTrackedStar(selectedStar);
        
        // Notify camera system about tracking state change
        eventBus.emit('star-tracking-toggled', isTrackingEnabled);
        
        // Log tracking enabled message
        console.log(`Star tracking enabled for star ${selectedStar.id}`);
    } else {
        state.setTrackedStar(null);
        
        // Notify camera system about tracking disabled
        eventBus.emit('star-tracking-toggled', isTrackingEnabled);
        
        console.log('Star tracking disabled');
    }
    
    updateTrackingButton(isTrackingEnabled);
    
    eventBus.emit('status-update', isTrackingEnabled ? 
        `Tracking star system ${selectedStar.id}` : 
        'Star tracking disabled');
    
    return isTrackingEnabled;
}

/**
 * Update the tracking button appearance based on tracking state
 * @param {boolean} isTrackingEnabled - Whether tracking is enabled
 */
function updateTrackingButton(isTrackingEnabled) {
    const trackBtn = document.getElementById('track-star-btn');
    if (!trackBtn) return;
    
    trackBtn.textContent = isTrackingEnabled ? 'Stop Tracking' : 'Track Star';
    trackBtn.style.background = isTrackingEnabled ? 
        'rgba(255, 107, 107, 0.2)' : 'rgba(76, 175, 80, 0.2)';
    trackBtn.style.borderColor = isTrackingEnabled ? '#ff6b6b' : '#4CAF50';
    trackBtn.style.color = isTrackingEnabled ? '#ff6b6b' : '#4CAF50';
}

/**
 * Hide star information overlay and clean up
 */
export function hideStarInfo() {
    const overlay = document.getElementById('star-info-overlay');
    if (overlay) {
        overlay.classList.remove('visible');
        overlay.style.display = 'none';
    }
    
    // Hide connection line
    if (connectionLine) {
        connectionLine.setAttribute('opacity', '0');
    }
    
    // Remove star indicator
    removeStarIndicator();
    
    // Stop tracking if active
    if (state.isTrackingEnabled()) {
        toggleStarTracking();
    }
    
    state.setSelectedStar(null);
    state.setTrackedStar(null);
    eventBus.emit('status-update', 'Star information hidden');
    
    eventBus.emit('star-info-hidden');
}

/**
 * Remove the star indicator from the scene
 */
function removeStarIndicator() {
    const scene = state.getScene();
    
    // Get indicator data using the getter if available, otherwise use generic get
    const indicatorData = typeof state.getStarIndicator === 'function' 
        ? state.getStarIndicator() 
        : state.get('starIndicator');
    
    if (scene && indicatorData && indicatorData.mesh) {
        scene.remove(indicatorData.mesh);
        
        if (indicatorData.mesh.geometry) {
            indicatorData.mesh.geometry.dispose();
        }
        
        if (indicatorData.mesh.material) {
            indicatorData.mesh.material.dispose();
        }
        
        // Use the dedicated setter if available, otherwise fallback to generic set
        if (typeof state.setStarIndicator === 'function') {
            state.setStarIndicator(null);
        } else {
            state.set('starIndicator', null);
        }
    }
}

/**
 * Display star information in the overlay
 * @param {Object} starSystem - Star system data
 */
export function displayStarInformation(starSystem) {
    // Update star title and color indicator
    updateStarHeader(starSystem);
    
    // Update stellar info sections
    updateStellarInfo(starSystem);
    updatePositionInfo(starSystem);
    updatePlanetaryInfo(starSystem);
    
    eventBus.emit('star-info-displayed', starSystem);
}

/**
 * Update the star header with name and color
 * @param {Object} starSystem - Star system data
 */
function updateStarHeader(starSystem) {
    const starTitle = document.getElementById('star-title');
    const colorIndicator = document.getElementById('star-color-indicator');
    
    if (starTitle) {
        starTitle.textContent = `${starSystem.stellar.class}-type Star ${starSystem.designation}`;
    }
    
    if (colorIndicator) {
        colorIndicator.style.backgroundColor = `#${starSystem.color.toString(16).padStart(6, '0')}`;
    }
}

/**
 * Update the stellar properties section
 * @param {Object} starSystem - Star system data
 */
function updateStellarInfo(starSystem) {
    const basicInfo = document.getElementById('star-basic-info');
    if (!basicInfo) return;
    
    basicInfo.innerHTML = `
        <div class="star-property">
            <span>Stellar Class:</span>
            <span>${starSystem.stellar.class}</span>
        </div>
        <div class="star-property">
            <span>Temperature:</span>
            <span>${starSystem.stellar.temperature.toLocaleString()} K</span>
        </div>
        <div class="star-property">
            <span>Mass:</span>
            <span>${starSystem.stellar.mass} M☉</span>
        </div>
        <div class="star-property">
            <span>Radius:</span>
            <span>${starSystem.stellar.radius} R☉</span>
        </div>
        <div class="star-property">
            <span>Luminosity:</span>
            <span>${starSystem.stellar.luminosity} L☉</span>
        </div>
        <div class="star-property">
            <span>Age:</span>
            <span>${starSystem.stellar.age} Gyr</span>
        </div>
        <div class="star-property">
            <span>Population:</span>
            <span>${starSystem.stellar.type}</span>
        </div>
    `;
}

/**
 * Update the position information section
 * @param {Object} starSystem - Star system data
 */
function updatePositionInfo(starSystem) {
    const positionInfo = document.getElementById('star-position-info');
    if (!positionInfo) return;
    
    positionInfo.innerHTML = `
        <div class="star-property">
            <span>Galactic Radius:</span>
            <span>${starSystem.galactic.radius} kpc</span>
        </div>
        <div class="star-property">
            <span>Galactic Height:</span>
            <span>${starSystem.galactic.height} kpc</span>
        </div>
        <div class="star-property">
            <span>Galactic Angle:</span>
            <span>${starSystem.galactic.angle}°</span>
        </div>
        <div class="star-property">
            <span>Orbital Period:</span>
            <span>${starSystem.galactic.orbitalPeriod} Myr</span>
        </div>
        <div class="star-property">
            <span>Spiral Arm Density:</span>
            <span>${starSystem.galactic.armDensity.toFixed(2)}×</span>
        </div>
    `;
}

/**
 * Update the planetary system information section
 * @param {Object} starSystem - Star system data
 */
function updatePlanetaryInfo(starSystem) {
    const planetsInfo = document.getElementById('star-planets-info');
    if (!planetsInfo) return;
    
    let planetHtml = `
        <div class="star-property">
            <span>Planet Count:</span>
            <span>${starSystem.planets.count}</span>
        </div>
        <div class="star-property">
            <span>Habitable Zone:</span>
            <span>${starSystem.planets.habitableZone.inner} - ${starSystem.planets.habitableZone.outer} AU</span>
        </div>
    `;
    
    if (starSystem.planets.count > 0) {
        planetHtml += '<div style="margin-top: 10px; font-size: 11px;">';
        starSystem.planets.planets.forEach(planet => {
            const habitableClass = planet.inHabitableZone ? ' (Habitable Zone)' : '';
            planetHtml += `
                <div style="margin: 3px 0; display: flex; justify-content: space-between;">
                    <span>${planet.name}:</span>
                    <span>${planet.type}${habitableClass}</span>
                </div>
            `;
        });
        planetHtml += '</div>';
    }
    
    planetsInfo.innerHTML = planetHtml;
}