/**
 * Enhanced renderer module for Galaxy Generator
 * Includes rendering updates for star selection and connection line
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js';
import eventBus from './events.js';
import * as state from './state.js';
import { PHYSICS_CONSTANTS } from './config.js';
import * as effects from './effects.js';
import * as cameraControls from './camera-controls.js';
import { updateConnectionLine } from './star-ui.js'; // Import the connection line update function

/**
 * Initialize the enhanced Three.js scene, camera, and renderer
 * @returns {Promise<Object>} - The initialized Three.js objects
 */
export async function initRenderer() {
    console.log('Initializing enhanced Three.js renderer with galaxy physics...');
    
    // Create the scene with enhanced fog for depth
    const scene = new THREE.Scene();
    const fogNear = 80;
    const fogFar = 400;
    scene.fog = new THREE.Fog(0x000011, fogNear, fogFar);
    
    // Create perspective camera with optimized parameters
    const camera = new THREE.PerspectiveCamera(
        75,                               // Field of view
        window.innerWidth / window.innerHeight,  // Aspect ratio
        0.1,                             // Near clipping plane
        1000                             // Far clipping plane
    );
    
    // Store in state
    state.setScene(scene);
    state.setCamera(camera);
    
    // Enhanced initial camera positioning
    cameraControls.updateCameraPositionForGalaxySize();
    
    // Create WebGL renderer with enhanced settings
    const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        powerPreference: "high-performance",
        alpha: false,                    // Better performance when we don't need transparency
        stencil: false,                  // Disable stencil buffer for performance
        depth: true,                     // Keep depth buffer for proper rendering
        premultipliedAlpha: false        // Better color accuracy
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000008, 1);  // Deep space blue-black
    
    // Enhanced pixel ratio handling for better performance on high-DPI displays
    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    renderer.setPixelRatio(pixelRatio);
    
    // Enable enhanced rendering features
    renderer.sortObjects = true;         // Proper depth sorting for transparency
    renderer.autoClear = true;          // Automatic buffer clearing
    
    // Add renderer to DOM
    document.getElementById('canvas-container').appendChild(renderer.domElement);
    
    // Store in state
    state.setRenderer(renderer);
    
    // Enhanced lighting setup for better visual depth
    setupEnhancedLighting();
    
    console.log('✅ Enhanced Three.js renderer initialized');
    console.log(`   Pixel ratio: ${pixelRatio}, Antialiasing: enabled`);
    
    // Notify the rest of the application
    eventBus.emit('renderer-initialized', { scene, camera, renderer });
    
    return { scene, camera, renderer };
}

/**
 * Set up enhanced lighting for better galaxy visualization
 */
function setupEnhancedLighting() {
    const scene = state.getScene();
    if (!scene) return;
    
    // Very subtle ambient light to prevent pure black shadows
    const ambientLight = new THREE.AmbientLight(0x1a1a2e, 0.02);
    scene.add(ambientLight);
    
    // Add a subtle point light at camera position for rim lighting effect
    const camera = state.getCamera();
    const cameraLight = new THREE.PointLight(0x2a2a4e, 0.05, 1000);
    if (camera) {
        cameraLight.position.copy(camera.position);
    }
    scene.add(cameraLight);
    cameraLight.userData.isCameraLight = true;
    
    eventBus.emit('lighting-setup-completed');
}

/**
 * Enhanced main animation loop with galaxy physics updates
 * Now includes update for star indicator and connection line
 */
export function animate() {
    requestAnimationFrame(animate);
    
    // Update animation time when not paused
    const isAnimating = state.isAnimating();
    if (isAnimating) {
        const animationSpeed = state.getAnimationSpeed();
        const deltaTime = 0.016 * animationSpeed; // Assuming 60fps base
        const newTime = state.getTime() + deltaTime;
        state.setTime(newTime);
        
        // Update shader uniforms for enhanced galaxy physics
        updateShaderUniforms(deltaTime);
        
        // Update camera with enhanced motion
        cameraControls.updateCameraPosition();
        
        // Update galaxy-specific animations
        updateGalaxyAnimations(deltaTime);
    }
    
    // IMPORTANT: Update star indicator position whether animation is running or not
    // This keeps the indicator in sync with the particle even when paused
    updateStarIndicator();
    
    // Render the scene with enhanced pipeline
    renderEnhancedScene();
    
    // Update the star connection line
    updateConnectionLine();
    
    // Update performance metrics
    updateRendererPerformance();
}

/**
 * Calculate the precise current position of a star based on the same 
 * calculations used in the vertex shader
 * @param {Object} star - Original star data with position and properties
 * @returns {THREE.Vector3} - Current calculated position
 */
function calculatePreciseStarPosition(star) {
    if (!star || !star.position) return null;
    
    // Get original position
    const origPos = star.position;
    const time = state.getTime();
    
    // Create a new vector to store the calculated position
    const pos = new THREE.Vector3(origPos.x, origPos.y, origPos.z);
    
    // Get physics parameters
    const physics = state.getCurrentGalaxyPhysics();
    const blackHoles = state.getBlackHoles();
    const gravitationalStrength = state.isBlackHoleEnabled() ? state.getGravitationalStrength() : 0;
    const blackHoleInfluenceRadius = state.getBlackHoleInfluenceRadius();
    
    // Step 1: Calculate galactic coordinates
    const radius = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
    const theta = Math.atan2(pos.z, pos.x);
    
    // Step 2: Calculate rotation speed based on radius (must match shader algorithm)
    let rotationSpeed = 200; // Default value
    
    if (physics) {
        const maxSpeed = physics.maxRotationSpeed || 200;
        const galaxyRadius = physics.galaxyRadius || 50;
        
        if (radius < galaxyRadius * 0.1) {
            // Solid body rotation in core
            rotationSpeed = maxSpeed * (radius / (galaxyRadius * 0.1));
        } else if (radius < galaxyRadius * 0.8) {
            // Flat rotation curve in disk
            rotationSpeed = maxSpeed;
        } else {
            // Slightly declining in outer regions
            rotationSpeed = maxSpeed * 0.95;
        }
    }
    
    // Step 3: Apply differential rotation (matches shader calculation)
    const angularVelocity = rotationSpeed / (radius + 0.1); // Prevent division by zero
    const deltaAngle = angularVelocity * time * 0.01; // Scale factor must match shader
    const newTheta = theta + deltaAngle;
    
    // Update position with new angle
    pos.x = radius * Math.cos(newTheta);
    pos.z = radius * Math.sin(newTheta);
    
    // Step 4: Apply vertical motion (if velocity is available)
    if (star.velocity && typeof star.velocity.y === 'number') {
        pos.y += star.velocity.y * time * 0.05; // Scale factor must match shader
    }
    
    // Step 5: Apply oscillation for natural movement (if available)
    if (star.oscillation) {
        const osc = star.oscillation;
        pos.x += osc.amplitude * Math.sin(time * osc.frequency + osc.phase);
        pos.y += osc.amplitude * 0.5 * Math.cos(time * osc.frequency * 1.3 + osc.phase);
        pos.z += osc.amplitude * Math.sin(time * osc.frequency * 0.8 + osc.phase);
    }
    
    // Step 6: Apply black hole gravitational effects
    if (gravitationalStrength > 0 && blackHoles && blackHoles.length > 0) {
        const gravitationalForce = new THREE.Vector3(0, 0, 0);
        
        for (const blackHole of blackHoles) {
            // Calculate vector from particle to black hole
            const toBlackHole = new THREE.Vector3(
                blackHole.position.x - pos.x,
                blackHole.position.y - pos.y,
                blackHole.position.z - pos.z
            );
            
            const distance = toBlackHole.length();
            
            // Skip if outside influence radius
            if (distance > blackHoleInfluenceRadius) continue;
            
            // Calculate gravitational force (simplified Newton's law)
            const mass = star.mass || 1.0;
            const blackHoleMass = blackHole.mass || 10.0;
            const forceMagnitude = gravitationalStrength * blackHoleMass * mass / 
                                  (distance * distance + 0.1);
            
            // Apply distance falloff for smoother effect
            const falloff = 1.0 - Math.min(1.0, distance / blackHoleInfluenceRadius);
            
            // Add to total gravitational force
            toBlackHole.normalize().multiplyScalar(forceMagnitude * falloff);
            gravitationalForce.add(toBlackHole);
        }
        
        // Apply gravitational acceleration over time
        pos.add(gravitationalForce.multiplyScalar(time * 0.005)); // Scale factor must match shader
    }
    
    return pos;
}

/**
 * Update the star indicator position based on precise calculation
 * FIXED: Now properly tracks stars during animation by using shader-identical math
 */
function updateStarIndicator() {
    const scene = state.getScene();
    
    // Get indicator data
    const indicatorData = state.get('starIndicator');
    if (!scene || !indicatorData || !indicatorData.mesh || !indicatorData.star) return;
    
    const star = indicatorData.star;
    const indicator = indicatorData.mesh;
    const camera = state.getCamera();
    
    // FIXED: Ensure we're using EXACTLY the same calculation as the shader
    // Pass the full star object with index to match selection calculations
    const calculatedPos = calculatePreciseStarPosition({...star, index: star.index});
    
    if (calculatedPos) {
        // Update the indicator position immediately
        indicator.position.copy(calculatedPos);
        
        // Make sure indicator faces the camera for visibility
        if (camera) {
            indicator.lookAt(camera.position);
        }
        
        // FIXED: Adjust indicator size based on zoom level
        if (camera) {
            const distance = camera.position.distanceTo(calculatedPos);
            // Increase base size for better visibility
            const baseSize = 1.0; 
            const scaleFactor = baseSize * (distance / 50);
            indicator.scale.set(scaleFactor, scaleFactor, scaleFactor);
        }
        
        // FIXED: Make light more visible at all distances
        const light = indicator.children.find(child => child.isLight);
        if (light) {
            const distToCamera = camera ? camera.position.distanceTo(calculatedPos) : 50;
            // Increase base brightness
            const baseBrightness = 1.0; 
            const distanceFactor = Math.min(1.0, 100 / distToCamera);
            light.intensity = baseBrightness * distanceFactor * (0.7 + 0.3 * Math.sin(state.getTime() * 2.5));
            
            // FIXED: Increase light range
            light.distance = 10; // Increased from 8
        }
        
        // Store current position for other functions (like connection line)
        star.currentPosition = calculatedPos.clone();
    }
}

/**
 * Get rotation speed at a specific radius
 * @param {number} radius - Distance from galactic center
 * @param {Object} physics - Galaxy physics parameters
 * @returns {number} - Rotation speed
 */
function getRotationSpeed(radius, physics) {
    if (!physics) return 200; // Default value
    
    const maxSpeed = physics.maxRotationSpeed || 200;
    const galaxyRadius = physics.galaxyRadius || 50;
    
    // Simplified rotation curve
    if (radius < galaxyRadius * 0.1) {
        // Solid body rotation in core
        return maxSpeed * (radius / (galaxyRadius * 0.1));
    } else if (radius < galaxyRadius * 0.8) {
        // Flat rotation curve in disk
        return maxSpeed;
    } else {
        // Slightly declining in outer regions
        return maxSpeed * 0.9;
    }
}

/**
 * Update enhanced shader uniforms with galaxy physics
 * @param {number} deltaTime - Time elapsed since last frame
 */
function updateShaderUniforms(deltaTime) {
    const particleSystem = state.getParticleSystem();
    if (!particleSystem || !particleSystem.material || !particleSystem.material.uniforms) return;
    
    const uniforms = particleSystem.material.uniforms;
    const time = state.getTime();
    const glowIntensity = state.getGlowIntensity();
    const physics = state.getCurrentGalaxyPhysics();
    
    // Update core animation uniforms
    uniforms.time.value = time;
    uniforms.glowIntensity.value = glowIntensity;
    
    // Update enhanced galaxy physics uniforms
    if (physics && uniforms.patternSpeed) {
        uniforms.patternSpeed.value = physics.patternSpeed;
        uniforms.galaxyRadius.value = physics.galaxyRadius;
        uniforms.maxRotationSpeed.value = physics.maxRotationSpeed;
        uniforms.armPitch.value = physics.armPitch;
        uniforms.armCount.value = physics.armCount;
        uniforms.armStrength.value = physics.armStrength;
    }
    
    // Update black hole uniforms
    updateBlackHoleUniforms(uniforms);
}

/**
 * Update black hole-related shader uniforms
 * @param {Object} uniforms - Shader uniforms
 */
function updateBlackHoleUniforms(uniforms) {
    if (!uniforms) return;
    
    // Get black hole data from state
    const blackHoles = state.getBlackHoles();
    const isBlackHoleEnabled = state.isBlackHoleEnabled();
    
    // Update black hole uniforms
    uniforms.gravitationalStrength.value = isBlackHoleEnabled 
        ? state.getGravitationalStrength() 
        : 0.0;
    uniforms.blackHoleInfluenceRadius.value = state.getBlackHoleInfluenceRadius();
    uniforms.blackHoleCount.value = isBlackHoleEnabled 
        ? blackHoles.length 
        : 0;
        
    // Update black hole positions and masses if available
    if (uniforms.blackHolePositions && uniforms.blackHoleMasses) {
        uniforms.blackHolePositions.value = getBlackHolePositions();
        uniforms.blackHoleMasses.value = getBlackHoleMasses();
    }
}

/**
 * Get black hole positions as a flat array for shader uniforms
 * @returns {Float32Array} - Array of black hole positions
 */
function getBlackHolePositions() {
    const blackHoles = state.getBlackHoles();
    const positions = new Float32Array(Math.max(blackHoles.length * 3, 3));
    
    blackHoles.forEach((blackHole, i) => {
        positions[i * 3] = blackHole.position.x;
        positions[i * 3 + 1] = blackHole.position.y;
        positions[i * 3 + 2] = blackHole.position.z;
    });
    
    return positions;
}

/**
 * Get black hole masses as an array for shader uniforms
 * @returns {Float32Array} - Array of black hole masses
 */
function getBlackHoleMasses() {
    const blackHoles = state.getBlackHoles();
    const masses = new Float32Array(Math.max(blackHoles.length, 1));
    
    blackHoles.forEach((blackHole, i) => {
        masses[i] = blackHole.mass;
    });
    
    return masses;
}

/**
 * Update galaxy-specific animations and effects
 * @param {number} deltaTime - Time elapsed since last frame
 */
function updateGalaxyAnimations(deltaTime) {
    const scene = state.getScene();
    const time = state.getTime();
    
    if (!scene) return;
    
    // Animate black hole accretion disks if they exist
    scene.children.filter(child => child.userData && child.userData.isBlackHole).forEach(blackHoleGroup => {
        if (!blackHoleGroup.children) return;
        
        // Get black hole index to differentiate between central and smaller black holes
        const isSmaller = blackHoleGroup.userData.index !== 0;
        
        // Animate accretion disk rotation
        const disks = blackHoleGroup.children.filter(child => 
            child && child.geometry && child.geometry.type === 'RingGeometry');
        
        disks.forEach((disk, diskIndex) => {
            // Different rotation speeds for different rings
            const rotationSpeed = diskIndex === 0 ? 2.0 : 1.5;
            disk.rotation.z += deltaTime * rotationSpeed * (isSmaller ? 1.5 : 1.0);
            
            // Vary opacity for dynamic effect
            if (disk.material) {
                // Base opacity varies by disk type
                const baseOpacity = diskIndex === 0 ? (isSmaller ? 0.3 : 0.2) : 0.15;
                
                // Different pulse rates for different black holes
                const pulseRate = isSmaller ? 3.0 : 2.0;
                disk.material.opacity = baseOpacity + Math.sin(time * pulseRate) * 0.05;
            }
        });
        
        // Animate point light intensity (glow effect)
        const light = blackHoleGroup.children.find(child => child.isPointLight);
        if (light) {
            const baseLightIntensity = isSmaller ? 0.7 : 1.0;
            const pulseFactor = isSmaller ? 0.3 : 0.2;
            light.intensity = baseLightIntensity + Math.sin(time * 2.5) * pulseFactor;
        }
        
        // Animate influence sphere for smaller black holes
        if (isSmaller) {
            const influenceSphere = blackHoleGroup.children.find(child => 
                child.geometry && child.geometry.type === 'SphereGeometry' && child.material.wireframe);
            
            if (influenceSphere) {
                // Pulse the influence sphere
                influenceSphere.scale.set(
                    1.0 + Math.sin(time * 0.7) * 0.1,
                    1.0 + Math.sin(time * 0.7) * 0.1,
                    1.0 + Math.sin(time * 0.7) * 0.1
                );
                
                // Vary opacity slightly
                if (influenceSphere.material) {
                    influenceSphere.material.opacity = 0.03 + Math.abs(Math.sin(time * 0.5)) * 0.02;
                }
            }
        }
    });
}

/**
 * Enhanced scene rendering with post-processing
 */
function renderEnhancedScene() {
    try {
        // Always delegate rendering to the effects module
        // which will handle both post-processing and fallback rendering
        effects.updatePostProcessing();
    } catch (error) {
        console.error('Error in enhanced rendering, using standard render:', error);
        // Emergency fallback if even the effects module fails
        const renderer = state.getRenderer();
        const scene = state.getScene();
        const camera = state.getCamera();
        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        }
    }
}

/**
 * Enhanced window resize handler with galaxy physics consideration
 */
export function onWindowResize() {
    const camera = state.getCamera();
    const renderer = state.getRenderer();
    
    if (!camera || !renderer) return;
    
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
    
    // Update camera aspect ratio
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    
    // Update renderer size with enhanced pixel ratio handling
    renderer.setSize(newWidth, newHeight);
    
    // Update particle system shader uniforms that depend on screen size
    updateScreenSpaceUniforms(newWidth, newHeight);
    
    // Update post-processing for new screen size
    try {
        effects.resizePostProcessing();
    } catch (error) {
        console.warn('Error resizing post-processing:', error);
    }
    
    console.log(`Enhanced renderer resized to ${newWidth}x${newHeight}`);
    eventBus.emit('window-resized', { width: newWidth, height: newHeight });
}

/**
 * Update screen-space shader uniforms
 * @param {number} width - New screen width
 * @param {number} height - New screen height
 */
function updateScreenSpaceUniforms(width, height) {
    const particleSystem = state.getParticleSystem();
    if (!particleSystem || !particleSystem.material || !particleSystem.material.uniforms) return;
    
    // Update any uniforms that depend on screen dimensions
    const uniforms = particleSystem.material.uniforms;
    
    // Example: Update screen resolution uniform (if implemented in shaders)
    if (uniforms.resolution) {
        uniforms.resolution.value.set(width, height);
    }
}

/**
 * Enhanced pause/resume functionality
 * @returns {boolean} - New animation state
 */
export function togglePause() {
    const isCurrentlyAnimating = state.isAnimating();
    const newState = !isCurrentlyAnimating;
    state.setIsAnimating(newState);
    
    // Enhanced feedback based on galaxy state
    let status = newState ? 'Animation resumed' : 'Animation paused';
    
    const galaxyData = state.getCurrentGalaxyData();
    if (galaxyData && galaxyData.metadata) {
        const galaxyType = galaxyData.metadata.galaxyType;
        status += ` - ${galaxyType} galaxy dynamics ${newState ? 'active' : 'frozen'}`;
    }
    
    eventBus.emit('status-update', status);
    console.log(status);
    
    return newState;
}

/**
 * Enhanced glow control with stellar population consideration
 * @param {number} newGlowIntensity - New glow intensity value
 * @returns {number} - Updated glow intensity
 */
export function updateGlow(newGlowIntensity) {
    state.setGlowIntensity(newGlowIntensity);
    
    // Update shader uniform immediately
    const particleSystem = state.getParticleSystem();
    if (particleSystem && particleSystem.material && particleSystem.material.uniforms) {
        particleSystem.material.uniforms.glowIntensity.value = newGlowIntensity;
    }
    
    // Provide enhanced feedback
    let feedback = `Glow intensity: ${newGlowIntensity.toFixed(1)}`;
    const galaxyData = state.getCurrentGalaxyData();
    
    if (galaxyData) {
        if (newGlowIntensity > 2.0) {
            feedback += ' - Highlighting star formation regions in spiral arms';
        } else if (newGlowIntensity < 1.0) {
            feedback += ' - Realistic stellar brightnesses visible';
        }
    }
    
    console.log(feedback);
    eventBus.emit('glow-updated', newGlowIntensity);
    
    return newGlowIntensity;
}

/**
 * Enhanced animation speed control
 * @param {number} newSpeed - New animation speed
 * @returns {number} - Updated animation speed
 */
export function updateAnimationSpeed(newSpeed) {
    state.setAnimationSpeed(newSpeed);
    
    // Enhanced feedback with physics context
    let feedback = `Animation speed: ${newSpeed.toFixed(1)}`;
    const physics = state.getCurrentGalaxyPhysics();
    
    if (physics) {
        if (newSpeed === 0) {
            feedback += ' - Galaxy frozen in time';
        } else if (newSpeed > 2.0) {
            feedback += ' - Fast-forward galaxy evolution';
        } else if (newSpeed < 0.5) {
            feedback += ' - Slow motion: observe individual stellar orbits';
        }
    }
    
    eventBus.emit('status-update', feedback);
    console.log(feedback);
    
    return newSpeed;
}

/**
 * Enhanced renderer performance monitoring
 */
function updateRendererPerformance() {
    const now = performance.now();
    const lastFrameTime = state.get('lastFrameTime') || now;
    const deltaTime = now - lastFrameTime;
    
    // Calculate FPS (avoid division by zero)
    const fps = deltaTime > 0 ? Math.round(1000 / deltaTime) : 60;
    
    // Update state
    state.set('lastFrameTime', now);
    state.updateFps(fps);
}

// Make calculatePreciseStarPosition available for other modules
export { calculatePreciseStarPosition };

// Set up event listeners
window.addEventListener('resize', onWindowResize, false);