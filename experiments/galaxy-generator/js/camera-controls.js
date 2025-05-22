/**
 * Camera controller module for Galaxy Generator
 * Handles camera movement, patterns, and user interaction
 * Enhanced with advanced motion smoothing to reduce jitter
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js';
import eventBus from './events.js';
import * as state from './state.js';
import { calculatePreciseStarPosition } from './renderer.js';

// Motion queue for pending camera movements
const motionQueue = [];

// Camera movement state
const movementState = {
    // Target data
    targetPosition: new THREE.Vector3(),
    targetLookAt: new THREE.Vector3(),
    
    // Current interpolation data
    currentVelocity: new THREE.Vector3(0, 0, 0),
    lookAtVelocity: new THREE.Vector3(0, 0, 0),
    
    // Input buffer for averaging camera movements
    inputBuffer: [],
    inputBufferMaxSize: 5,
    
    // Time of last significant movement
    lastSignificantMovement: 0,
    
    // Minimum thresholds to process movements (prevents micro-jitter)
    minimumMovementThreshold: 0.01,
    minimumRotationThreshold: 0.001,
    
    // Is in active transition
    isTransitioning: false
};

/**
 * Initialize camera controls and setup event listeners
 */
export function initCameraControls() {
    // Set up event listeners for camera controls
    setupMouseControls();
    setupTouchControls();
    setupKeyboardControls();
    
    // Initialize camera instructions overlay
    initCameraInstructions();
    
    // Setup event listener for star tracking toggles
    setupStarTrackingListener();
    
    console.log('Camera controls initialized with enhanced stabilization');
    eventBus.emit('camera-controls-initialized');
}

/**
 * Setup listener for star tracking events
 * This ensures immediate response when tracking is enabled
 */
function setupStarTrackingListener() {
    eventBus.on('star-tracking-toggled', (isEnabled) => {
        console.log('Camera control received star tracking toggle:', isEnabled);
        
        if (isEnabled) {
            // Force manual mode off when tracking is enabled
            if (state.getCameraControls().manualControl) {
                toggleManualCameraMode(false);
            }
            
            // Set camera pattern to star tracking (pattern 2)
            state.setCameraControlProperty('currentPattern', 2);
            state.setCameraControlProperty('patternStartTime', state.getTime() * 1000);
            
            // Force an immediate and much faster camera transition to the star
            setTimeout(() => {
                if (forceStarTrackingUpdate()) {
                    console.log('Camera actively tracking star');
                }
            }, 50); // Small delay to ensure state is updated
        }
    });
}

/**
 * Initialize camera instructions overlay
 */
function initCameraInstructions() {
    const instructions = document.getElementById('camera-instructions');
    if (instructions) {
        // Show initially for 3 seconds
        instructions.classList.remove('hidden');
        setTimeout(() => instructions.classList.add('hidden'), 3000);
    }
}

/**
 * Update camera position based on current control mode
 * Enhanced with predictive movement and jitter reduction techniques
 */
export function updateCameraPosition() {
    const camera = state.getCamera();
    if (!camera) return;
    
    const cameraControls = state.getCameraControls();
    const time = state.getTime();
    const currentTime = time * 1000; // Convert to milliseconds
    const deltaTime = Math.min(0.05, 1.0 / 60.0); // Clamped delta time for stability
    
    // Process motion queue first
    processMotionQueue();
    
    // Handle camera transitions with enhanced smoothing
    updateCameraTransition(deltaTime);
    
    // REMOVED: Auto-return to automatic mode functionality
    // We want manual mode to persist until explicitly toggled
    
    if (cameraControls.manualControl) {
        // Manual camera control mode with added damping
        updateManualCamera(deltaTime);
    } else {
        // Automatic camera with multiple patterns
        updateAutomaticCamera(deltaTime);
    }
    
    // Get the target point
    const target = new THREE.Vector3(
        cameraControls.target.x,
        cameraControls.target.y,
        cameraControls.target.z
    );
    
    // Enhanced smooth look-at with advanced damping to prevent jitter
    // Using a two-stage approach with stronger filtering for small movements
    if (!cameraControls.isTransitioning) {
        // Create a precise look vector from camera to target
        const lookVector = new THREE.Vector3();
        lookVector.subVectors(target, camera.position).normalize();
        
        // Convert the target into the camera's local space for better accuracy
        const localTarget = target.clone().sub(camera.position);
        const distance = localTarget.length();
        
        // If we're tracking a star, ensure more precise targeting with less damping
        const isTrackingStar = state.isTrackingEnabled() && state.getTrackedStar();
        
        // Adaptive damping based on motion magnitude
        // More damping for smaller movements to reduce jitter
        const currentDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        const angleDifference = currentDirection.angleTo(lookVector);
        
        // Set damping factors dynamically
        let dampingFactor;
        
        if (angleDifference < movementState.minimumRotationThreshold) {
            // Filter out micro-movements entirely
            dampingFactor = 0;
        } else if (angleDifference < 0.01) {
            // Very strong damping for tiny movements
            dampingFactor = 0.02;
        } else if (angleDifference < 0.1) {
            // Strong damping for small movements
            dampingFactor = 0.05;
        } else if (angleDifference < 0.5) {
            // Medium damping for moderate movements
            dampingFactor = 0.1;
        } else {
            // Less damping for large movements
            dampingFactor = 0.2;
        }
        
        // Additional damping reduction for star tracking for more precision
        if (isTrackingStar) {
            dampingFactor = Math.min(0.25, dampingFactor * 1.5);
        }
        
        // Apply damped rotation only if movement is above threshold
        if (angleDifference > movementState.minimumRotationThreshold) {
            // Update the time of last significant movement
            movementState.lastSignificantMovement = currentTime;
            
            // Interpolate the direction with damping
            const dampedDirection = new THREE.Vector3();
            dampedDirection.copy(currentDirection).lerp(lookVector, dampingFactor);
            
            // Create a look-at point at a fixed distance in the damped direction
            const lookAtPoint = new THREE.Vector3();
            lookAtPoint.copy(camera.position).add(dampedDirection.multiplyScalar(100));
            
            // Apply the smooth damped look-at
            camera.lookAt(lookAtPoint);
        }
    } else {
        // During transitions, we still use damping but with a more responsive factor
        const transitionLookVector = new THREE.Vector3();
        transitionLookVector.subVectors(target, camera.position).normalize();
        
        const lookAtPoint = new THREE.Vector3();
        lookAtPoint.copy(camera.position).add(transitionLookVector.multiplyScalar(100));
        
        camera.lookAt(lookAtPoint);
    }
    
    // Update camera light position if it exists
    updateCameraLight();
    
    eventBus.emit('camera-position-updated');
}

/**
 * Process any pending camera movements in the queue
 * This helps avoid jitter from rapid movement requests
 */
function processMotionQueue() {
    // Skip if no motion requests in queue
    if (motionQueue.length === 0) return;
    
    // Get the most recent movement request
    const latestMotion = motionQueue.pop();
    
    // Clear the queue - we only use the most recent request
    motionQueue.length = 0;
    
    // Process the request
    if (latestMotion.type === 'transition') {
        startCameraTransition(
            latestMotion.targetPosition,
            latestMotion.targetLookAt,
            latestMotion.duration,
            latestMotion.easing
        );
    }
}

/**
 * Enhanced SmoothDamp function for camera movement
 * Similar to Unity's SmoothDamp - provides critically damped motion
 * @param {THREE.Vector3} current - Current position
 * @param {THREE.Vector3} target - Target position
 * @param {THREE.Vector3} currentVelocity - Current velocity (will be modified)
 * @param {number} smoothTime - Approximate time to reach target
 * @param {number} deltaTime - Time since last frame
 * @param {number} maxSpeed - Maximum speed
 * @returns {THREE.Vector3} - The new position
 */
function smoothDamp(current, target, currentVelocity, smoothTime, deltaTime, maxSpeed = Infinity) {
    // Based on Unity's SmoothDamp implementation
    smoothTime = Math.max(0.0001, smoothTime);
    
    // Calculate coefficients
    const omega = 2.0 / smoothTime;
    const x = omega * deltaTime;
    const exp = 1.0 / (1.0 + x + 0.48 * x * x + 0.235 * x * x * x);
    
    // Calculate target - current difference
    const diff = new THREE.Vector3();
    diff.subVectors(current, target);
    
    // Calculate target for velocity
    const targetVelocity = new THREE.Vector3();
    
    // Remember original target
    const originalTarget = target.clone();
    
    // Clamp max speed
    if (maxSpeed < Infinity) {
        const maxChange = maxSpeed * smoothTime;
        
        if (diff.lengthSq() > maxChange * maxChange) {
            diff.setLength(maxChange);
        }
    }
    
    // Adjust target based on allowed speed
    target = current.clone().sub(diff);
    
    // Calc velocity changes
    const temp = new THREE.Vector3();
    temp.addVectors(currentVelocity, new THREE.Vector3().copy(diff).multiplyScalar(omega));
    temp.multiplyScalar(deltaTime);
    
    currentVelocity.multiplyScalar(1 - omega * deltaTime).sub(temp);
    
    let output = new THREE.Vector3();
    output.addVectors(target, new THREE.Vector3().copy(diff).multiplyScalar(exp));
    
    // Prevent overshooting
    const origMinusCurrent = new THREE.Vector3();
    origMinusCurrent.subVectors(originalTarget, current);
    const outMinusOrig = new THREE.Vector3(); 
    outMinusOrig.subVectors(output, originalTarget);
    
    if (origMinusCurrent.dot(outMinusOrig) > 0) {
        output.copy(originalTarget);
        currentVelocity.set(0, 0, 0);
    }
    
    return output;
}

/**
 * Handle smooth camera transitions with advanced motion damping
 * Uses optimal control theory for fluid camera movement without oscillation
 * @param {number} deltaTime - Time since last update
 */
function updateCameraTransition(deltaTime) {
    const camera = state.getCamera();
    if (!camera) return;
    
    const cameraControls = state.getCameraControls();
    
    // If we're in a transition
    if (cameraControls.isTransitioning) {
        const currentTime = state.getTime() * 1000;
        const elapsedTime = currentTime - cameraControls.transitionStartTime;
        const progress = Math.min(elapsedTime / cameraControls.transitionDuration, 1.0);
        
        // Apply custom easing function for smoother motion
        const easedProgress = easeOutQuintic(progress);
        
        // Interpolate camera position with SmoothDamp for better motion
        if (cameraControls.transitionFromPosition && cameraControls.transitionToPosition) {
            // Direct movement for star tracking - faster and more direct
            const isTracking = state.isTrackingEnabled() && state.getTrackedStar();
            
            // Different stabilization approach for different situations
            if (isTracking) {
                // For star tracking, use advanced SmoothDamp with predictive targeting
                // Calculate target with prediction
                const predictionFactor = 0.2; // How much to predict ahead
                const predictedTarget = cameraControls.transitionToPosition.clone();
                
                // Use smoothDamp for critically damped motion
                const smoothTime = 0.2; // Quicker for star tracking
                const maxSpeed = 2.0; // Faster max speed for tracking

                camera.position.copy(
                    smoothDamp(
                        camera.position,
                        predictedTarget,
                        movementState.currentVelocity,
                        smoothTime,
                        deltaTime,
                        maxSpeed
                    )
                );
            } else {
                // For regular transitions, use a blend of direct interpolation and smoothing
                // Calculate interpolated position
                const interpolatedPosition = new THREE.Vector3();
                interpolatedPosition.lerpVectors(
                    cameraControls.transitionFromPosition,
                    cameraControls.transitionToPosition,
                    easedProgress
                );
                
                // Apply additional smoothing for the final position
                const smoothingStrength = 0.6; // Higher for smoother camera
                camera.position.lerp(interpolatedPosition, smoothingStrength);
            }
            
            // Force immediate position update
            camera.updateMatrixWorld(true);
        }
        
        // Interpolate target position with similar easing
        if (cameraControls.transitionFromTarget && cameraControls.transitionToTarget) {
            const currentTarget = {
                x: THREE.MathUtils.lerp(cameraControls.transitionFromTarget.x, cameraControls.transitionToTarget.x, easedProgress),
                y: THREE.MathUtils.lerp(cameraControls.transitionFromTarget.y, cameraControls.transitionToTarget.y, easedProgress),
                z: THREE.MathUtils.lerp(cameraControls.transitionFromTarget.z, cameraControls.transitionToTarget.z, easedProgress)
            };
            
            state.setCameraControlProperty('target', currentTarget);
        }
        
        // End transition if complete
        if (progress >= 1.0) {
            state.setCameraControlProperty('isTransitioning', false);
            
            // Ensure we're exactly at the destination
            if (cameraControls.transitionToPosition) {
                camera.position.copy(cameraControls.transitionToPosition);
                camera.updateMatrixWorld(true); // Force matrix update
            }
            
            if (cameraControls.transitionToTarget) {
                state.setCameraControlProperty('target', {
                    x: cameraControls.transitionToTarget.x,
                    y: cameraControls.transitionToTarget.y,
                    z: cameraControls.transitionToTarget.z
                });
            }
            
            // Clean up transition objects
            state.setCameraControlProperty('transitionFromPosition', null);
            state.setCameraControlProperty('transitionToPosition', null);
            state.setCameraControlProperty('transitionFromTarget', null);
            state.setCameraControlProperty('transitionToTarget', null);
            
            // Reset velocity
            movementState.currentVelocity.set(0, 0, 0);
            movementState.lookAtVelocity.set(0, 0, 0);
            
            console.log('Camera transition completed');
            eventBus.emit('camera-transition-completed');
            
            // If we're tracking a star, make sure we keep updating
            if (state.isTrackingEnabled() && state.getTrackedStar()) {
                // Schedule next immediate update after transition completes
                setTimeout(forceStarTrackingUpdate, 50);
            }
        }
    }
}

/**
 * Cubic easing function for smooth transitions
 * @param {number} t - Transition progress (0-1)
 * @returns {number} - Eased value
 */
function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Quintic easing out - very smooth arrival
 * @param {number} t - Transition progress (0-1) 
 * @returns {number} - Eased value
 */
function easeOutQuintic(t) {
    return 1 - Math.pow(1 - t, 5);
}

/**
 * Start a smooth transition between camera positions
 * Enhanced with improved damping and parameters for jitter prevention
 * @param {THREE.Vector3} targetPosition - Target camera position
 * @param {Object} targetLookAt - Target look-at point {x,y,z}
 * @param {number} duration - Transition duration in milliseconds
 * @param {string} easing - Easing function to use
 */
export function startCameraTransition(targetPosition, targetLookAt, duration = 1000, easing = 'easeOutQuintic') {
    const camera = state.getCamera();
    if (!camera) return;
    
    // If we're already transitioning, queue this transition
    // This prevents conflicting movements causing jitter
    const cameraControls = state.getCameraControls();
    if (cameraControls.isTransitioning) {
        // Add to motion queue instead of starting immediately
        motionQueue.push({
            type: 'transition',
            targetPosition: targetPosition.clone(),
            targetLookAt: {...targetLookAt},
            duration: duration,
            easing: easing
        });
        return;
    }
    
    // Store current position as starting point
    const fromPosition = camera.position.clone();
    const fromTarget = { ...cameraControls.target };
    
    // Use a shorter duration for star tracking to be more responsive
    const isTracking = state.isTrackingEnabled() && state.getTrackedStar();
    if (isTracking) {
        duration = Math.min(duration, 500); // Even faster for star tracking
    }
    
    // Calculate distance to tune transition parameters
    const positionDistance = fromPosition.distanceTo(targetPosition);
    const targetDistance = Math.sqrt(
        Math.pow(fromTarget.x - targetLookAt.x, 2) +
        Math.pow(fromTarget.y - targetLookAt.y, 2) +
        Math.pow(fromTarget.z - targetLookAt.z, 2)
    );
    
    // Skip transition for very small movements to prevent jitter
    const minPositionChange = movementState.minimumMovementThreshold * 10; // Higher threshold for transitions
    const minTargetChange = movementState.minimumMovementThreshold * 10;
    
    if (positionDistance < minPositionChange && targetDistance < minTargetChange) {
        // For tiny changes, just set the position directly without transition
        if (positionDistance > 0) {
            camera.position.copy(targetPosition);
            camera.updateMatrixWorld(true);
        }
        if (targetDistance > 0) {
            state.setCameraControlProperty('target', targetLookAt);
        }
        return;
    }
    
    // Set transition parameters
    state.setCameraControlProperty('isTransitioning', true);
    state.setCameraControlProperty('transitionStartTime', state.getTime() * 1000);
    state.setCameraControlProperty('transitionDuration', duration);
    state.setCameraControlProperty('transitionFromPosition', fromPosition);
    state.setCameraControlProperty('transitionToPosition', targetPosition);
    state.setCameraControlProperty('transitionFromTarget', fromTarget);
    state.setCameraControlProperty('transitionToTarget', targetLookAt);
    
    // Reset velocity for clean transition start
    movementState.currentVelocity.set(0, 0, 0);
    movementState.lookAtVelocity.set(0, 0, 0);
    
    // console.log('Starting camera transition to:', 
    //     `Vector3 (x: ${targetPosition.x.toFixed(3)}, y: ${targetPosition.y.toFixed(3)}, z: ${targetPosition.z.toFixed(3)})`,
    //     'looking at:',
    //     `(x: ${targetLookAt.x.toFixed(3)}, y: ${targetLookAt.y.toFixed(3)}, z: ${targetLookAt.z.toFixed(3)})`
    // );
    
    // Force at least one update to the camera position immediately
    // This ensures movement begins right away, providing more responsive feedback
    const initialProgress = 0.05;
    camera.position.lerpVectors(
        fromPosition,
        targetPosition,
        initialProgress
    );
    camera.updateMatrixWorld(true);
    
    // Also update the look-at target immediately for smoother start
    const initialTarget = {
        x: THREE.MathUtils.lerp(fromTarget.x, targetLookAt.x, initialProgress),
        y: THREE.MathUtils.lerp(fromTarget.y, targetLookAt.y, initialProgress),
        z: THREE.MathUtils.lerp(fromTarget.z, targetLookAt.z, initialProgress)
    };
    state.setCameraControlProperty('target', initialTarget);
    
    eventBus.emit('camera-transition-started');
}

/**
 * Update camera position for galaxy size and type
 */
export function updateCameraPositionForGalaxySize() {
    const camera = state.getCamera();
    if (!camera) return;
    
    const physics = state.getCurrentGalaxyPhysics();
    const galaxyRadius = physics?.galaxyRadius || 50;
    const optimalDistance = galaxyRadius * 1.2;
    const cameraDistance = Math.max(optimalDistance, 40);
    
    state.setCameraDistance(cameraDistance);
    
    // Calculate a smooth transition to the new position
    const newPosition = new THREE.Vector3(0, 20, cameraDistance);
    const newTarget = { x: 0, y: 0, z: 0 };
    
    // If we have a previous position, transition smoothly
    if (camera.position.lengthSq() > 0) {
        startCameraTransition(newPosition, newTarget, 1500);
    } else {
        // First initialization, just set position directly
        camera.position.copy(newPosition);
        state.setCameraControlProperty('target', newTarget);
        camera.lookAt(newTarget.x, newTarget.y, newTarget.z);
    }
    
    // Update fog based on galaxy size
    const scene = state.getScene();
    if (scene && scene.fog) {
        scene.fog.near = cameraDistance * 0.8;
        scene.fog.far = cameraDistance * 4;
    }
    
    eventBus.emit('camera-position-updated-for-galaxy');
}

/**
 * Update camera in manual control mode
 * Enhanced with smooth interpolation and jitter prevention
 * @param {number} deltaTime - Time since last update
 */
function updateManualCamera(deltaTime) {
    const camera = state.getCamera();
    if (!camera) return;
    
    // Skip if currently transitioning
    const cameraControls = state.getCameraControls();
    if (cameraControls.isTransitioning) return;
    
    // Convert spherical coordinates to cartesian
    const x = cameraControls.distance * Math.sin(cameraControls.polarAngle) * Math.cos(cameraControls.azimuthAngle);
    const y = cameraControls.distance * Math.cos(cameraControls.polarAngle);
    const z = cameraControls.distance * Math.sin(cameraControls.polarAngle) * Math.sin(cameraControls.azimuthAngle);
    
    const target = new THREE.Vector3(
        cameraControls.target.x,
        cameraControls.target.y,
        cameraControls.target.z
    );
    
    // Calculate the target position
    const targetPosition = new THREE.Vector3(
        x + target.x, 
        y + target.y, 
        z + target.z
    );
    
    // Calculate the movement magnitude to apply variable damping
    const currentPosition = camera.position.clone();
    const movementDistance = currentPosition.distanceTo(targetPosition);
    
    // Skip movement if below threshold
    if (movementDistance < movementState.minimumMovementThreshold) {
        return;
    }
    
    // Update state for tracking significant movements
    movementState.lastSignificantMovement = state.getTime() * 1000;
    
    // Use adaptive smoothing based on movement size
    // Less smoothing for large movements for better responsiveness
    // More smoothing for small movements to reduce jitter
    let smoothTime;
    if (movementDistance < 0.1) {
        smoothTime = 0.3; // More smoothing for small movements
    } else if (movementDistance < 1.0) {
        smoothTime = 0.2; // Medium smoothing for moderate movements
    } else {
        smoothTime = 0.1; // Less smoothing for large movements
    }
    
    // Use SmoothDamp for better movement control
    camera.position.copy(
        smoothDamp(
            camera.position,
            targetPosition,
            movementState.currentVelocity,
            smoothTime,
            deltaTime,
            10.0 // Max speed
        )
    );
    
    // Force matrix update
    camera.updateMatrixWorld(true);
}

/**
 * Update camera with automatic animation patterns
 * Enhanced with smooth interpolation and jitter prevention
 * @param {number} deltaTime - Time since last update
 */
function updateAutomaticCamera(deltaTime) {
    const cameraControls = state.getCameraControls();
    const isTrackingEnabled = state.isTrackingEnabled();
    const trackedStar = state.getTrackedStar();
    
    // Skip if currently transitioning
    if (cameraControls.isTransitioning) return;
    
    // Priority check: If star tracking is enabled and we have a star to track,
    // use star tracking camera regardless of the current pattern
    if (isTrackingEnabled && trackedStar) {
        updateStarTrackingCamera(deltaTime);
        return; // Skip pattern selection
    }
    
    // Skip auto-rotation if disabled
    if (!cameraControls.autoRotate) return;
    
    const time = state.getTime();
    const currentTime = time * 1000;
    
    // Switch between different camera patterns with smooth transitions
    if (currentTime - cameraControls.patternStartTime > cameraControls.patternDuration) {
        const oldPattern = cameraControls.currentPattern;
        const newPattern = (oldPattern + 1) % 4;
        
        // Instead of abruptly changing patterns, transition between them
        transitionToPattern(newPattern);
        return;
    }
    
    const patternProgress = (currentTime - cameraControls.patternStartTime) / cameraControls.patternDuration;
    
    // Execute the current camera pattern
    const patternFunctions = [
        updateClassicOrbitalCamera,
        updateGalaxySyncedCamera,
        updateStarTrackingCamera,
        updateSpiralApproachCamera
    ];
    
    if (cameraControls.currentPattern < patternFunctions.length) {
        patternFunctions[cameraControls.currentPattern](deltaTime);
    } else {
        updateClassicOrbitalCamera(deltaTime);
    }
}

/**
 * Transition smoothly to a new camera pattern
 * @param {number} newPattern - Index of the new pattern
 */
function transitionToPattern(newPattern) {
    const cameraControls = state.getCameraControls();
    const camera = state.getCamera();
    const time = state.getTime();
    const cameraDistance = state.getCameraDistance();
    
    // Calculate the target position based on the new pattern
    let targetPosition = new THREE.Vector3();
    let targetLookAt = { x: 0, y: 0, z: 0 };
    
    // Get appropriate starting position for the new pattern
    switch (newPattern) {
        case 0: // Classic Orbital
            targetPosition = new THREE.Vector3(
                Math.sin(time * cameraControls.autoRotateSpeed) * cameraDistance,
                20 + Math.sin(time * 0.05) * 15,
                Math.cos(time * cameraControls.autoRotateSpeed) * cameraDistance
            );
            break;
        case 1: // Galaxy-Synced
            const physics = state.getCurrentGalaxyPhysics();
            if (physics && physics.patternSpeed) {
                const patternSpeedFactor = physics.patternSpeed / 25.0;
                const adjustedAngle = time * cameraControls.autoRotateSpeed * patternSpeedFactor;
                
                targetPosition = new THREE.Vector3(
                    Math.sin(adjustedAngle) * cameraDistance,
                    20 + Math.sin(time * 0.03) * 25,
                    Math.cos(adjustedAngle) * cameraDistance
                );
            } else {
                targetPosition = new THREE.Vector3(
                    Math.sin(time * cameraControls.autoRotateSpeed) * cameraDistance,
                    20 + Math.sin(time * 0.05) * 15,
                    Math.cos(time * cameraControls.autoRotateSpeed) * cameraDistance
                );
            }
            break;
        case 2: // Star Tracking
            // For star tracking, we'll either find a random star or use the current tracked star
            const trackedStar = state.getTrackedStar();
            if (trackedStar) {
                const starPos = calculatePreciseStarPosition({...trackedStar, index: trackedStar.index});
                if (starPos) {
                    const trackingDistance = 6.0 + Math.sin(time * 0.05) * 0.5;
                    const trackingHeight = 2.0 + Math.cos(time * 0.03) * 0.3;
                    const angleOffset = time * 0.02;
                    
                    targetPosition = new THREE.Vector3(
                        starPos.x + trackingDistance * Math.cos(angleOffset),
                        starPos.y + trackingHeight,
                        starPos.z + trackingDistance * Math.sin(angleOffset)
                    );
                    
                    targetLookAt = { x: starPos.x, y: starPos.y, z: starPos.z };
                } else {
                    // Fall back to default if star position can't be calculated
                    targetPosition = new THREE.Vector3(
                        Math.sin(time * cameraControls.autoRotateSpeed) * cameraDistance,
                        20 + Math.sin(time * 0.05) * 15,
                        Math.cos(time * cameraControls.autoRotateSpeed) * cameraDistance
                    );
                }
            } else {
                // Pick a random star for the camera to track
                const galaxyData = state.getCurrentGalaxyData();
                if (galaxyData && galaxyData.particles && galaxyData.particles.length) {
                    const randomIndex = Math.floor(Math.random() * galaxyData.particles.length);
                    const randomStar = { ...galaxyData.particles[randomIndex], index: randomIndex };
                    const starPos = calculatePreciseStarPosition(randomStar);
                    
                    if (starPos) {
                        const trackingDistance = 6.0 + Math.sin(time * 0.05) * 0.5;
                        const trackingHeight = 2.0 + Math.cos(time * 0.03) * 0.3;
                        const angleOffset = time * 0.02;
                        
                        targetPosition = new THREE.Vector3(
                            starPos.x + trackingDistance * Math.cos(angleOffset),
                            starPos.y + trackingHeight,
                            starPos.z + trackingDistance * Math.sin(angleOffset)
                        );
                        
                        targetLookAt = { x: starPos.x, y: starPos.y, z: starPos.z };
                    } else {
                        // Fall back to default if star position can't be calculated
                        targetPosition = new THREE.Vector3(
                            Math.sin(time * cameraControls.autoRotateSpeed) * cameraDistance,
                            20 + Math.sin(time * 0.05) * 15,
                            Math.cos(time * cameraControls.autoRotateSpeed) * cameraDistance
                        );
                    }
                } else {
                    // Fall back to default if no stars are available
                    targetPosition = new THREE.Vector3(
                        Math.sin(time * cameraControls.autoRotateSpeed) * cameraDistance,
                        20 + Math.sin(time * 0.05) * 15,
                        Math.cos(time * cameraControls.autoRotateSpeed) * cameraDistance
                    );
                }
            }
            break;
        case 3: // Spiral Approach
            const spiralProgress = 0; // Start at the beginning of the spiral
            const maxDistance = cameraDistance * 1.5;
            const minDistance = cameraDistance * 0.6;
            const spiralDistance = maxDistance - (maxDistance - minDistance) * spiralProgress;
            const spiralAngle = time * cameraControls.autoRotateSpeed + spiralProgress * Math.PI * 8;
            
            targetPosition = new THREE.Vector3(
                Math.sin(spiralAngle) * spiralDistance,
                40 - spiralProgress * 25,
                Math.cos(spiralAngle) * spiralDistance
            );
            break;
        default:
            targetPosition = new THREE.Vector3(
                Math.sin(time * cameraControls.autoRotateSpeed) * cameraDistance,
                20 + Math.sin(time * 0.05) * 15,
                Math.cos(time * cameraControls.autoRotateSpeed) * cameraDistance
            );
    }
    
    // Start transition to the new pattern position with better easing
    startCameraTransition(targetPosition, targetLookAt, 2000, 'easeOutQuintic');
    
    // Update pattern state
    state.setCameraControlProperty('currentPattern', newPattern);
    state.setCameraControlProperty('patternStartTime', time * 1000);
    
    const patternNames = ['Classic Orbital', 'Galaxy-Synced', 'Star Tracking', 'Spiral Approach'];
    console.log(`Transitioning to ${patternNames[newPattern]} camera pattern`);
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
 * Classic orbital camera motion - enhanced with smooth interpolation and jitter prevention
 * @param {number} deltaTime - Time since last update
 */
function updateClassicOrbitalCamera(deltaTime) {
    const camera = state.getCamera();
    if (!camera) return;
    
    // Skip if currently transitioning
    const cameraControls = state.getCameraControls();
    if (cameraControls.isTransitioning) return;
    
    const time = state.getTime();
    const cameraDistance = state.getCameraDistance();
    
    const baseAngle = time * cameraControls.autoRotateSpeed;
    
    // Calculate target position
    const targetX = Math.sin(baseAngle) * cameraDistance;
    const targetZ = Math.cos(baseAngle) * cameraDistance;
    
    // Calculate target Y with oscillation
    let targetY = 20; // Base height
    if (cameraControls.verticalOscillation) {
        // Reduced oscillation amplitude and frequency for stability
        const verticalOscillation = Math.sin(time * 0.03) * 12;
        const physics = state.getCurrentGalaxyPhysics();
        const baseHeight = physics?.galaxyRadius ? physics.galaxyRadius * 0.3 : 15;
        targetY = baseHeight + verticalOscillation;
    }
    
    // Create target position
    const targetPosition = new THREE.Vector3(targetX, targetY, targetZ);
    
    // Calculate distance to determine appropriate damping factor
    const currentPosition = camera.position.clone();
    const movementDistance = currentPosition.distanceTo(targetPosition);
    
    // Skip tiny movements to prevent jitter
    if (movementDistance < movementState.minimumMovementThreshold) {
        return;
    }
    
    // Use SmoothDamp for better motion quality
    const smoothTime = 0.3; // Tune for desired smoothness
    
    camera.position.copy(
        smoothDamp(
            camera.position,
            targetPosition,
            movementState.currentVelocity,
            smoothTime,
            deltaTime,
            5.0 // Max speed
        )
    );
    
    // Force matrix update
    camera.updateMatrixWorld(true);
    
    // Ensure we're focused on the galaxy center
    state.setCameraControlProperty('target', { x: 0, y: 0, z: 0 });
}

/**
 * Galaxy rotation-synced camera motion - enhanced with smooth interpolation
 * @param {number} deltaTime - Time since last update
 */
function updateGalaxySyncedCamera(deltaTime) {
    const camera = state.getCamera();
    if (!camera) return;
    
    // Skip if currently transitioning
    const cameraControls = state.getCameraControls();
    if (cameraControls.isTransitioning) return;
    
    const time = state.getTime();
    const cameraDistance = state.getCameraDistance();
    const physics = state.getCurrentGalaxyPhysics();
    
    if (physics && physics.patternSpeed) {
        const patternSpeedFactor = physics.patternSpeed / 25.0;
        const adjustedAngle = time * cameraControls.autoRotateSpeed * patternSpeedFactor;
        
        // Calculate target position
        const targetX = Math.sin(adjustedAngle) * cameraDistance;
        const targetZ = Math.cos(adjustedAngle) * cameraDistance;
        
        // Vary height based on galaxy structure
        const heightVariation = Math.sin(time * 0.03) * 25;
        const targetY = 20 + heightVariation;
        
        // Create target position
        const targetPosition = new THREE.Vector3(targetX, targetY, targetZ);
        
        // Calculate movement distance
        const movementDistance = camera.position.distanceTo(targetPosition);
        
        // Skip tiny movements to prevent jitter
        if (movementDistance < movementState.minimumMovementThreshold) {
            return;
        }
        
        // Use SmoothDamp for better motion quality
        const smoothTime = 0.3; // Tune for desired smoothness
        
        camera.position.copy(
            smoothDamp(
                camera.position,
                targetPosition,
                movementState.currentVelocity,
                smoothTime,
                deltaTime,
                5.0 // Max speed
            )
        );
        
        // Force matrix update
        camera.updateMatrixWorld(true);
        
        // Ensure we're focused on the galaxy center
        state.setCameraControlProperty('target', { x: 0, y: 0, z: 0 });
    } else {
        updateClassicOrbitalCamera(deltaTime);
    }
}

/**
 * Star tracking camera pattern - enhanced with predictive tracking
 * @param {number} deltaTime - Time since last update
 */
function updateStarTrackingCamera(deltaTime) {
    const isTrackingEnabled = state.isTrackingEnabled();
    const trackedStar = state.getTrackedStar();
    
    // Check if we have a tracked star from the UI
    if (isTrackingEnabled && trackedStar) {
        // Track the specific selected star with enhanced smoothing
        trackSpecificStar(trackedStar, deltaTime);
    } else {
        // Automatically track random stars during this pattern
        autoTrackRandomStar(deltaTime);
    }
}

/**
 * Manually trigger a star tracking update
 * Used to force an immediate transition when tracking is enabled
 */
export function forceStarTrackingUpdate() {
    const trackedStar = state.getTrackedStar();
    if (trackedStar) {
        console.log('Forcing camera to track star:', trackedStar.index);
        trackSpecificStar(trackedStar, 0.016);
        return true;
    }
    return false;
}

/**
 * Track a specific star selected by the user with smooth transitions
 * Enhanced for better motion quality and stability
 * @param {Object} star - The star to track
 * @param {number} deltaTime - Time since last update
 * @param {boolean} forceTransition - Force a transition even if already close
 */
function trackSpecificStar(star, deltaTime, forceTransition = false) {
    const camera = state.getCamera();
    const cameraControls = state.getCameraControls();
    if (!camera || !star || !star.position) return;
    
    // Skip if currently transitioning and not forcing an update
    if (cameraControls.isTransitioning && !forceTransition) return;
    
    // Calculate star's current position using the same calculation as the indicator
    // This ensures consistent tracking between the camera and the indicator
    const starPos = calculatePreciseStarPosition({...star, index: star.index});
    if (!starPos) return;
    
    // Position camera relative to the star using more stable calculation
    // Reduced oscillation factors for more stable star tracking
    const time = state.getTime();
    
    // More stable tracking parameters with minimal oscillation
    const trackingDistance = 5.5 + Math.sin(time * 0.02) * 0.2; // Reduced variation
    const trackingHeight = 1.5 + Math.cos(time * 0.01) * 0.1;   // Minimal vertical movement
    const angleOffset = time * 0.01; // Slower rotation for stability
    
    // Calculate camera position that better focuses on the star
    const newCameraPos = new THREE.Vector3(
        starPos.x + trackingDistance * Math.cos(angleOffset),
        starPos.y + trackingHeight,
        starPos.z + trackingDistance * Math.sin(angleOffset)
    );
    
    // Store the precise star position as the exact target
    // This ensures the camera is always looking precisely at the star
    const preciseTarget = {
        x: starPos.x,
        y: starPos.y,
        z: starPos.z
    };
    
    // Apply predictive targeting - anticipate where the star will be
    // This helps produce smoother tracking with less lag
    // Note: This assumes relatively constant velocity
    
    // Calculate a movement threshold based on distance
    // Higher threshold reduces jitter
    const movementThreshold = forceTransition ? 0 : movementState.minimumMovementThreshold * 3;
    const distanceSquared = camera.position.distanceToSquared(newCameraPos);
    
    // Update camera position based on how far we need to move
    if (forceTransition || distanceSquared > movementThreshold) {
        // For major position changes, use a transition
        if (distanceSquared > 10 || forceTransition) {
            // Use a transition duration based on distance
            const transitionDuration = Math.min(800, Math.max(400, distanceSquared * 0.1));
            
            // console.log(`Transitioning camera to star ${star.index} with duration ${transitionDuration}ms`);
            
            // Use the star's precise position as the look-at target for better focus
            startCameraTransition(
                newCameraPos,
                preciseTarget,
                transitionDuration,
                'easeOutQuintic'
            );
        } 
        // For moderate changes, use SmoothDamp for more controlled movement
        else if (distanceSquared > 1) {
            // Update the time of last significant movement
            movementState.lastSignificantMovement = state.getTime() * 1000;
            
            // Use SmoothDamp for better motion control
            const smoothTime = 0.2; 
            
            camera.position.copy(
                smoothDamp(
                    camera.position,
                    newCameraPos,
                    movementState.currentVelocity,
                    smoothTime,
                    deltaTime,
                    5.0 // Max speed
                )
            );
            
            // Immediately update the target for better aiming
            state.setCameraControlProperty('target', preciseTarget);
            camera.updateMatrixWorld(true);
        }
        // For small changes, use direct lerp with strong smoothing
        else {
            // Update the time of last significant movement
            movementState.lastSignificantMovement = state.getTime() * 1000;
            
            // For small movements, use stronger damping to reduce jitter
            camera.position.lerp(newCameraPos, 0.1);
            state.setCameraControlProperty('target', preciseTarget);
            camera.updateMatrixWorld(true); // Force update
        }
    }
}

/**
 * Automatically track random stars
 * @param {number} deltaTime - Time since last update
 */
function autoTrackRandomStar(deltaTime) {
    const galaxyData = state.getCurrentGalaxyData();
    if (!galaxyData || !galaxyData.particles) {
        updateClassicOrbitalCamera(deltaTime);
        return;
    }
    
    const time = state.getTime();
    
    // Pick a different star every 5 seconds during this pattern
    const starChangeInterval = 5000; // 5 seconds
    const starIndex = Math.floor((time * 1000) / starChangeInterval) % galaxyData.particles.length;
    const randomStar = { ...galaxyData.particles[starIndex], index: starIndex };
    
    if (randomStar) {
        // Smoothly track this star
        trackSpecificStar(randomStar, deltaTime);
    }
}

/**
 * Spiral approach pattern - enhanced with smooth interpolation
 * @param {number} deltaTime - Time since last update
 * @param {number} progress - Progress through the pattern (0-1)
 */
function updateSpiralApproachCamera(deltaTime, progress = 0) {
    const camera = state.getCamera();
    if (!camera) return;
    
    // Skip if currently transitioning
    const cameraControls = state.getCameraControls();
    if (cameraControls.isTransitioning) return;
    
    const time = state.getTime();
    const cameraDistance = state.getCameraDistance();
    
    // Calculate the progress based on the elapsed time
    const currentTime = time * 1000;
    const patternTime = currentTime - cameraControls.patternStartTime;
    const calculatedProgress = Math.min(1, patternTime / cameraControls.patternDuration);
    
    // Use provided progress if not 0, otherwise use calculated progress
    progress = progress !== 0 ? progress : calculatedProgress;
    
    const maxDistance = cameraDistance * 1.5;
    const minDistance = cameraDistance * 0.6;
    const distance = maxDistance - (maxDistance - minDistance) * progress;
    
    // Spiral in while rotating
    const spiralAngle = time * cameraControls.autoRotateSpeed + progress * Math.PI * 8;
    
    // Calculate target position
    const targetX = Math.sin(spiralAngle) * distance;
    const targetZ = Math.cos(spiralAngle) * distance;
    const targetY = 40 - progress * 25; // Descend as we spiral in
    
    // Create target position
    const targetPosition = new THREE.Vector3(targetX, targetY, targetZ);
    
    // Calculate movement distance
    const movementDistance = camera.position.distanceTo(targetPosition);
    
    // Skip tiny movements to prevent jitter
    if (movementDistance < movementState.minimumMovementThreshold) {
        return;
    }
    
    // Use SmoothDamp for better motion quality
    const smoothTime = 0.3; // Tune for desired smoothness
    
    camera.position.copy(
        smoothDamp(
            camera.position,
            targetPosition,
            movementState.currentVelocity,
            smoothTime,
            deltaTime,
            5.0 // Max speed
        )
    );
    
    // Force matrix update
    camera.updateMatrixWorld(true);
    
    // Ensure we're focused on the galaxy center
    state.setCameraControlProperty('target', { x: 0, y: 0, z: 0 });
}

/**
 * Update camera light if present
 */
function updateCameraLight() {
    const camera = state.getCamera();
    const scene = state.getScene();
    
    if (!camera || !scene) return;
    
    const cameraLight = scene.children.find(child => child.userData.isCameraLight);
    if (cameraLight) {
        cameraLight.position.copy(camera.position);
    }
}

/**
 * Enhanced zoom control with galaxy physics awareness and smoother transitions
 * @param {number} newDistance - New camera distance
 * @returns {number} - Adjusted camera distance
 */
export function updateZoom(newDistance) {
    const physics = state.getCurrentGalaxyPhysics();
    const galaxyRadius = physics?.galaxyRadius || 50;
    
    // Clamp camera distance to reasonable bounds relative to galaxy size
    const minDistance = galaxyRadius * 0.5;
    const maxDistance = galaxyRadius * 4.0;
    const clampedDistance = Math.max(minDistance, Math.min(maxDistance, newDistance));
    
    state.setCameraDistance(clampedDistance);
    
    // Update fog to match new camera distance
    const scene = state.getScene();
    if (scene && scene.fog) {
        scene.fog.near = clampedDistance * 0.8;
        scene.fog.far = clampedDistance * 4;
    }
    
    // Update camera controls
    state.setCameraControlProperty('distance', clampedDistance);
    
    console.log(`Enhanced zoom: ${clampedDistance} (galaxy radius: ${galaxyRadius})`);
    eventBus.emit('zoom-updated', clampedDistance);
    
    return clampedDistance;
}

/**
 * Set up mouse controls for camera
 * Modified to respect manual mode toggle and reduce jitter
 */
function setupMouseControls() {
    const renderer = state.getRenderer();
    if (!renderer) return;
    
    const canvas = renderer.domElement;
    
    // Mouse down event
    canvas.addEventListener('mousedown', (event) => {
        event.preventDefault();
        
        const cameraControls = state.getCameraControls();
        
        // Only handle camera movement if in manual mode
        if (cameraControls.manualControl) {
            state.setMouseInteractionProperty('isDown', true);
            state.setMouseInteractionProperty('rightClick', event.button === 2);
            state.setMouseInteractionProperty('lastX', event.clientX);
            state.setMouseInteractionProperty('lastY', event.clientY);
            
            canvas.style.cursor = event.button === 2 ? 'move' : 'grabbing';
            
            // Record interaction time
            state.setCameraControlProperty('lastInteractionTime', state.getTime() * 1000);
            
            // Initialize spherical coordinates from current camera position
            initializeSphericalFromCamera();
            
            // Clear input buffer for clean start
            movementState.inputBuffer = [];
        } else {
            // When not in manual mode, handle star selection
            handleStarSelection(event);
        }
    });
    
    // Mouse move event with buffering to reduce jitter
    canvas.addEventListener('mousemove', (event) => {
        const mouseInteraction = state.getMouseInteraction();
        const cameraControls = state.getCameraControls();
        
        // Only process movement if in manual mode and mouse is down
        if (cameraControls.manualControl && mouseInteraction.isDown) {
            event.preventDefault();
            
            // Calculate deltas
            const deltaX = event.clientX - mouseInteraction.lastX;
            const deltaY = event.clientY - mouseInteraction.lastY;
            
            // Add current movement to buffer for smoothing
            movementState.inputBuffer.push({ dx: deltaX, dy: deltaY });
            
            // Keep buffer at maximum size
            if (movementState.inputBuffer.length > movementState.inputBufferMaxSize) {
                movementState.inputBuffer.shift();
            }
            
            // Calculate smoothed deltas by averaging buffer
            let smoothedDeltaX = 0;
            let smoothedDeltaY = 0;
            
            movementState.inputBuffer.forEach((movement) => {
                smoothedDeltaX += movement.dx;
                smoothedDeltaY += movement.dy;
            });
            
            smoothedDeltaX /= movementState.inputBuffer.length;
            smoothedDeltaY /= movementState.inputBuffer.length;
            
            if (mouseInteraction.rightClick) {
                // Pan mode (right mouse button)
                handlePanCamera(smoothedDeltaX, smoothedDeltaY);
            } else {
                // Rotate mode (left mouse button)
                handleRotateCamera(smoothedDeltaX, smoothedDeltaY);
            }
            
            state.setMouseInteractionProperty('lastX', event.clientX);
            state.setMouseInteractionProperty('lastY', event.clientY);
            state.setCameraControlProperty('lastInteractionTime', state.getTime() * 1000);
        }
    });
    
    // Mouse up event
    canvas.addEventListener('mouseup', () => {
        const mouseInteraction = state.getMouseInteraction();
        if (mouseInteraction.isDown) {
            state.setMouseInteractionProperty('isDown', false);
            canvas.style.cursor = 'default';
            
            // Clear input buffer on mouse release
            movementState.inputBuffer = [];
        }
    });
    
    // Prevent context menu on right click
    canvas.addEventListener('contextmenu', (event) => {
        event.preventDefault();
    });
    
    // Mouse wheel for zoom with enhanced smoothing
    canvas.addEventListener('wheel', (event) => {
        event.preventDefault();
        
        const cameraControls = state.getCameraControls();
        
        // Only handle zoom if in manual mode
        if (cameraControls.manualControl) {
            // Use smaller increments for smoother zoom
            const zoomFactor = event.deltaY > 0 ? 1.05 : 0.95;
            const newDistance = cameraControls.distance * zoomFactor;
            
            // Update both camera controls distance and global camera distance
            state.setCameraControlProperty('distance', newDistance);
            updateZoom(newDistance);
            
            // Record interaction time
            state.setCameraControlProperty('lastInteractionTime', state.getTime() * 1000);
        }
    });
}

/**
 * Handle star selection when clicking in viewport
 * Enhanced to select visible stars preferentially
 * @param {MouseEvent} event - The mouse event
 */
function handleStarSelection(event) {
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Create a raycaster for star selection
    const raycaster = new THREE.Raycaster();
    const camera = state.getCamera();
    
    if (camera) {
        // Log the click position for debugging
        console.log(`Star selection click at (${event.clientX}, ${event.clientY}), ` +
                    `normalized: (${mouse.x.toFixed(2)}, ${mouse.y.toFixed(2)})`);
        
        raycaster.setFromCamera(mouse, camera);
        
        // Log the ray direction for debugging
        console.log(`Ray direction: (${raycaster.ray.direction.x.toFixed(2)}, ` +
                    `${raycaster.ray.direction.y.toFixed(2)}, ` +
                    `${raycaster.ray.direction.z.toFixed(2)})`);
        
        // Find the nearest star to the ray with enhanced selection logic
        const selectedStar = findNearestStarToRay(raycaster);
        
        // Handle case when no star is found
        if (!selectedStar) {
            console.log("No star found at click location - consider clicking on a visible star");
            // Optionally show a user-friendly message
            eventBus.emit('status-update', "No star found - try clicking directly on a visible star");
        }
    }
}

/**
 * Find the nearest visible star to a ray
 * Enhanced to prioritize bright, large stars and those closer to the camera
 * With additional visibility checks to ensure we only select stars that are clearly visible
 * @param {THREE.Raycaster} raycaster - The raycaster to use
 */
function findNearestStarToRay(raycaster) {
    const galaxyData = state.getCurrentGalaxyData();
    const camera = state.getCamera();
    if (!galaxyData || !galaxyData.particles || !camera) return null;
    
    const particles = galaxyData.particles;
    const glowIntensity = state.getGlowIntensity() || 0.6;
    
    // Minimal thresholds just to ensure star is visible
    const minSize = 0.5;
    const minBrightness = 0.3;
    
    // Direct hit candidates (stars the ray passes directly through)
    const directHits = [];
    // Near miss candidates (close to the ray but not directly hit)
    const nearMisses = [];
    
    // Small distance for near misses (as a fallback only)
    const nearMissDistance = 5.0;
    
    // Process all stars
    for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        
        // Basic visibility check
        const effectiveSize = particle.size * glowIntensity;
        const effectiveBrightness = particle.brightness * glowIntensity;
        
        // Skip completely invisible stars
        if (effectiveSize < minSize || effectiveBrightness < minBrightness) continue;
        
        // Get current position
        const currentPos = calculatePreciseStarPosition({...particle, index: i});
        if (!currentPos) continue;
        
        // Skip if behind camera
        const screenPos = currentPos.clone().project(camera);
        if (screenPos.z > 1) continue;
        
        // Create a sphere to represent the star's visual size
        // Scale the sphere radius based on the star's visual size and distance from camera
        const cameraDistance = camera.position.distanceTo(currentPos);
        const visualRadius = effectiveSize * 0.2 * (cameraDistance / 50);
        
        // Check if ray passes directly through this star's visual representation
        const rayToStarDistance = raycaster.ray.distanceToPoint(currentPos);
        
        // If ray passes directly through the star (considering its visual size)
        if (rayToStarDistance <= visualRadius) {
            directHits.push({
                star: { ...particle, index: i, currentPosition: currentPos },
                distance: cameraDistance,
                rayDistance: rayToStarDistance,
                screenPos: screenPos,
                screenX: (screenPos.x * 0.5 + 0.5) * window.innerWidth,
                screenY: (-(screenPos.y * 0.5) + 0.5) * window.innerHeight
            });
        } 
        // As a fallback, collect near misses
        else if (rayToStarDistance <= nearMissDistance) {
            nearMisses.push({
                star: { ...particle, index: i, currentPosition: currentPos },
                distance: cameraDistance,
                rayDistance: rayToStarDistance,
                screenPos: screenPos,
                screenX: (screenPos.x * 0.5 + 0.5) * window.innerWidth,
                screenY: (-(screenPos.y * 0.5) + 0.5) * window.innerHeight
            });
        }
    }
    
    console.log(`Found ${directHits.length} direct hits and ${nearMisses.length} near misses`);
    
    // Sort direct hits from closest to furthest
    directHits.sort((a, b) => a.distance - b.distance);
    
    // If we have direct hits, use the closest one
    if (directHits.length > 0) {
        const selected = directHits[0];
        console.log(`Selected direct hit star ${selected.star.index} at distance ${selected.distance.toFixed(1)}`);
        eventBus.emit('star-clicked', selected.star);
        return selected.star;
    }
    
    // Fallback: If no direct hits, use the closest near miss
    if (nearMisses.length > 0) {
        // Sort near misses by ray distance
        nearMisses.sort((a, b) => a.rayDistance - b.rayDistance);
        
        const selected = nearMisses[0];
        console.log(`Selected near miss star ${selected.star.index} at ray distance ${selected.rayDistance.toFixed(1)}`);
        eventBus.emit('star-clicked', selected.star);
        return selected.star;
    }
    
    console.log("No selectable star found at clicked location");
    return null;
}

/**
 * Set up touch controls for mobile devices
 * Modified to respect manual mode toggle and reduce jitter
 */
function setupTouchControls() {
    const renderer = state.getRenderer();
    if (!renderer) return;
    
    const canvas = renderer.domElement;
    let lastTouchDistance = 0;
    
    canvas.addEventListener('touchstart', (event) => {
        event.preventDefault();
        
        const cameraControls = state.getCameraControls();
        
        // Only handle touch interaction if in manual mode
        if (cameraControls.manualControl) {
            if (event.touches.length === 1) {
                // Single touch - rotation
                state.setMouseInteractionProperty('isDown', true);
                state.setMouseInteractionProperty('rightClick', false);
                state.setMouseInteractionProperty('lastX', event.touches[0].clientX);
                state.setMouseInteractionProperty('lastY', event.touches[0].clientY);
                
                state.setCameraControlProperty('lastInteractionTime', state.getTime() * 1000);
                
                // Initialize spherical coordinates
                initializeSphericalFromCamera();
                
                // Clear input buffer for clean start
                movementState.inputBuffer = [];
            } else if (event.touches.length === 2) {
                // Two touches - zoom
                const touch1 = event.touches[0];
                const touch2 = event.touches[1];
                lastTouchDistance = Math.sqrt(
                    Math.pow(touch2.clientX - touch1.clientX, 2) + 
                    Math.pow(touch2.clientY - touch1.clientY, 2)
                );
            }
        } else if (event.touches.length === 1) {
            // When not in manual mode and single touch, handle star selection
            const touch = event.touches[0];
            handleStarSelection({
                clientX: touch.clientX,
                clientY: touch.clientY,
                preventDefault: () => {}
            });
        }
    });
    
    canvas.addEventListener('touchmove', (event) => {
        event.preventDefault();
        
        const mouseInteraction = state.getMouseInteraction();
        const cameraControls = state.getCameraControls();
        
        // Only handle touch movement if in manual mode
        if (cameraControls.manualControl) {
            if (event.touches.length === 1 && mouseInteraction.isDown) {
                // Single touch rotation with smoothing
                const deltaX = event.touches[0].clientX - mouseInteraction.lastX;
                const deltaY = event.touches[0].clientY - mouseInteraction.lastY;
                
                // Add current movement to buffer for smoothing
                movementState.inputBuffer.push({ dx: deltaX, dy: deltaY });
                
                // Keep buffer at maximum size
                if (movementState.inputBuffer.length > movementState.inputBufferMaxSize) {
                    movementState.inputBuffer.shift();
                }
                
                // Calculate smoothed deltas by averaging buffer
                let smoothedDeltaX = 0;
                let smoothedDeltaY = 0;
                
                movementState.inputBuffer.forEach((movement) => {
                    smoothedDeltaX += movement.dx;
                    smoothedDeltaY += movement.dy;
                });
                
                smoothedDeltaX /= movementState.inputBuffer.length;
                smoothedDeltaY /= movementState.inputBuffer.length;
                
                handleRotateCamera(smoothedDeltaX, smoothedDeltaY);
                
                state.setMouseInteractionProperty('lastX', event.touches[0].clientX);
                state.setMouseInteractionProperty('lastY', event.touches[0].clientY);
                state.setCameraControlProperty('lastInteractionTime', state.getTime() * 1000);
            } else if (event.touches.length === 2) {
                // Two touch zoom with smoother factor
                const touch1 = event.touches[0];
                const touch2 = event.touches[1];
                const touchDistance = Math.sqrt(
                    Math.pow(touch2.clientX - touch1.clientX, 2) + 
                    Math.pow(touch2.clientY - touch1.clientY, 2)
                );
                
                if (lastTouchDistance > 0) {
                    // Use a smaller factor for smoother zoom changes
                    const zoomFactor = Math.pow(touchDistance / lastTouchDistance, 0.5);
                    
                    // Update camera distance
                    const cameraControls = state.getCameraControls();
                    const newDistance = cameraControls.distance / zoomFactor;
                    
                    state.setCameraControlProperty('distance', newDistance);
                    updateZoom(newDistance);
                    
                    state.setCameraControlProperty('lastInteractionTime', state.getTime() * 1000);
                }
                
                lastTouchDistance = touchDistance;
            }
        }
    });
    
    canvas.addEventListener('touchend', () => {
        state.setMouseInteractionProperty('isDown', false);
        lastTouchDistance = 0;
        
        // Clear input buffer on touch end
        movementState.inputBuffer = [];
    });
}

/**
 * Set up keyboard shortcuts for camera controls
 */
function setupKeyboardControls() {
    window.addEventListener('keydown', (event) => {
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;
        
        switch (event.code) {
            case 'KeyO':
                event.preventDefault();
                toggleCameraAutoRotate();
                break;
            case 'KeyM':
                event.preventDefault();
                toggleManualCameraMode();
                break;
            case 'KeyV':
                event.preventDefault();
                cycleCameraPattern();
                break;
        }
    });
}

/**
 * Handle panning the camera with enhanced smoothing
 * @param {number} deltaX - X movement
 * @param {number} deltaY - Y movement
 */
function handlePanCamera(deltaX, deltaY) {
    const camera = state.getCamera();
    const cameraControls = state.getCameraControls();
    
    if (!camera) return;
    
    // Apply threshold to filter out tiny movements that cause jitter
    if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) {
        return;
    }
    
    // Pan in camera's local coordinate system
    const panScale = cameraControls.distance * 0.0005;
    const panX = deltaX * panScale;
    const panY = -deltaY * panScale;
    
    // Calculate camera's right and up vectors
    const cameraMatrix = new THREE.Matrix4().extractRotation(camera.matrix);
    const cameraRight = new THREE.Vector3(1, 0, 0).applyMatrix4(cameraMatrix);
    const cameraUp = new THREE.Vector3(0, 1, 0).applyMatrix4(cameraMatrix);
    
    // Create a new target by adding offset to current target
    const currentTarget = new THREE.Vector3(
        cameraControls.target.x,
        cameraControls.target.y,
        cameraControls.target.z
    );
    
    currentTarget.add(cameraRight.multiplyScalar(panX));
    currentTarget.add(cameraUp.multiplyScalar(panY));
    
    // Update target in camera controls
    state.setCameraControlProperty('target', {
        x: currentTarget.x,
        y: currentTarget.y,
        z: currentTarget.z
    });
}

/**
 * Handle rotating the camera with enhanced damping
 * @param {number} deltaX - X movement
 * @param {number} deltaY - Y movement
 */
function handleRotateCamera(deltaX, deltaY) {
    const cameraControls = state.getCameraControls();
    const mouseInteraction = state.getMouseInteraction();
    
    // Ignore very small movements to reduce jitter
    if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) {
        return;
    }
    
    // Apply adaptive damping to mouse movements for smoother control
    // Stronger damping for smaller movements
    const baseMovement = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const damping = baseMovement < 5 ? 0.5 : (baseMovement < 15 ? 0.7 : 0.9);
    
    const dampedDeltaX = deltaX * damping;
    const dampedDeltaY = deltaY * damping;
    
    // Update azimuth and polar angles with smoothed deltas
    const newAzimuth = cameraControls.azimuthAngle - dampedDeltaX * mouseInteraction.sensitivity;
    let newPolar = cameraControls.polarAngle - dampedDeltaY * mouseInteraction.sensitivity;
    
    // Clamp polar angle to prevent flipping
    newPolar = Math.max(0.1, Math.min(Math.PI - 0.1, newPolar));
    
    // Update camera controls
    state.setCameraControlProperty('azimuthAngle', newAzimuth);
    state.setCameraControlProperty('polarAngle', newPolar);
}

/**
 * Initialize spherical coordinates from current camera position
 */
function initializeSphericalFromCamera() {
    const camera = state.getCamera();
    const cameraControls = state.getCameraControls();
    
    if (!camera) return;
    
    // Get target as Vector3
    const target = new THREE.Vector3(
        cameraControls.target.x,
        cameraControls.target.y,
        cameraControls.target.z
    );
    
    // Calculate camera position relative to target
    const position = camera.position.clone().sub(target);
    
    // Calculate spherical coordinates
    const distance = position.length();
    const azimuthAngle = Math.atan2(position.z, position.x);
    const polarAngle = Math.acos(position.y / distance);
    
    // Update camera controls
    state.setCameraControlProperty('distance', distance);
    state.setCameraControlProperty('azimuthAngle', azimuthAngle);
    state.setCameraControlProperty('polarAngle', polarAngle);
}

/**
 * Toggle camera auto-rotation
 * @returns {boolean} - New auto-rotate state
 */
export function toggleCameraAutoRotate() {
    const cameraControls = state.getCameraControls();
    const newAutoRotate = !cameraControls.autoRotate;
    
    state.setCameraControlProperty('autoRotate', newAutoRotate);
    
    eventBus.emit('status-update', `Camera auto-rotation ${newAutoRotate ? 'enabled' : 'disabled'}`);
    return newAutoRotate;
}

/**
 * Toggle camera follow galaxy rotation
 * @returns {boolean} - New follow state
 */
export function toggleCameraFollowGalaxy() {
    const cameraControls = state.getCameraControls();
    const newFollowGalaxy = !cameraControls.followGalaxyRotation;
    
    state.setCameraControlProperty('followGalaxyRotation', newFollowGalaxy);
    
    const status = newFollowGalaxy ? 
        'Camera synced with galaxy rotation pattern' : 
        'Camera independent of galaxy rotation';
    
    eventBus.emit('status-update', status);
    return newFollowGalaxy;
}

/**
 * Toggle manual camera mode
 * Enhanced with smooth transitions in both directions
 * @param {boolean} [enabled] - Optional state to force
 * @returns {boolean} - New manual mode state
 */
export function toggleManualCameraMode(enabled) {
    const cameraControls = state.getCameraControls();
    const newManualMode = enabled !== undefined ? enabled : !cameraControls.manualControl;
    
    if (newManualMode !== cameraControls.manualControl) {
        // Get current camera position and target for transition
        const camera = state.getCamera();
        if (camera) {
            const currentPosition = camera.position.clone();
            const currentTarget = { ...cameraControls.target };
            
            if (newManualMode) {
                // Manual mode just enabled - initialize before setting mode flag
                
                // Initialize spherical coordinates from current camera position
                initializeSphericalFromCamera();
                
                // Reset motion state for clean start
                movementState.currentVelocity.set(0, 0, 0);
                movementState.lookAtVelocity.set(0, 0, 0);
                movementState.inputBuffer = [];
                
                // Now set the manual mode state
                state.setCameraControlProperty('manualControl', newManualMode);
                
                // Show instructions
                const instructions = document.getElementById('camera-instructions');
                if (instructions) {
                    instructions.classList.remove('hidden');
                    setTimeout(() => instructions.classList.add('hidden'), 3000);
                }
                
                eventBus.emit('status-update', 'Manual camera mode - Use mouse/touch to control camera');
            } else {
                // Manual mode just disabled - transition back to auto mode
                
                // Set the manual mode state first
                state.setCameraControlProperty('manualControl', newManualMode);
                
                // If we're tracking a star, keep tracking
                if (state.isTrackingEnabled() && state.getTrackedStar()) {
                    // Force a star tracking update to transition to the tracked star
                    forceStarTrackingUpdate();
                } else {
                    // Calculate a proper destination based on the current pattern
                    const pattern = cameraControls.currentPattern;
                    const cameraDistance = state.getCameraDistance();
                    
                    // Return to galaxy-centered orbit
                    const destPos = new THREE.Vector3(
                        Math.sin(0) * cameraDistance,
                        20 + Math.sin(0 * 0.05) * 15,
                        Math.cos(0) * cameraDistance
                    );
                    
                    const destTarget = { x: 0, y: 0, z: 0 };
                    
                    // Start transition
                    startCameraTransition(destPos, destTarget, 1000);
                }
                
                eventBus.emit('status-update', 'Automatic camera mode');
            }
        } else {
            // No camera available, still update the state
            state.setCameraControlProperty('manualControl', newManualMode);
        }
        
        // Update manual toggle button in UI if exists
        const manualToggleBtn = document.getElementById('manual-camera-toggle');
        if (manualToggleBtn) {
            manualToggleBtn.textContent = newManualMode ? '🔓 Manual Camera Active' : '🔒 Enable Manual Camera';
            manualToggleBtn.classList.toggle('active', newManualMode);
        }
    }
    
    return newManualMode;
}

/**
 * Toggle cinematic camera mode
 * @returns {boolean} - New cinematic mode state
 */
export function toggleCinematicMode() {
    const cameraControls = state.getCameraControls();
    const newCinematicMode = !cameraControls.cinematicMode;
    
    state.setCameraControlProperty('cinematicMode', newCinematicMode);
    
    eventBus.emit('status-update', `Cinematic camera mode ${newCinematicMode ? 'enabled' : 'disabled'}`);
    return newCinematicMode;
}

/**
 * Cycle through camera animation patterns with smooth transitions
 * @returns {number} - New pattern index
 */
export function cycleCameraPattern() {
    const cameraControls = state.getCameraControls();
    const newPattern = (cameraControls.currentPattern + 1) % 4;
    
    // Use transition function for smooth pattern change instead of direct setting
    transitionToPattern(newPattern);
    
    const patternNames = ['Classic Orbital', 'Galaxy-Synced', 'Star Tracking', 'Spiral Approach'];
    
    eventBus.emit('status-update', `Camera pattern: ${patternNames[newPattern]}`);
    console.log(`Manual pattern switch: ${patternNames[newPattern]}`);
    
    return newPattern;
}