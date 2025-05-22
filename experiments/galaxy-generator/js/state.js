/**
 * State manager for Galaxy Generator
 * Centralizes app state management previously attached to window
 */
import eventBus from './events.js';
import { DEFAULT_SETTINGS } from './config.js';

// Initial state definition with all expected keys and default values
const initialState = {
    // Galaxy generation and physics state
    currentSeed: '',
    currentGalaxyData: null,
    currentGalaxyPhysics: {
        patternSpeed: 25.0,
        armPitch: 0.25,
        armCount: 2,
        armStrength: 1.0,
        maxRotationSpeed: 220.0,
        galaxyRadius: 50.0,
        differentialRotation: true
    },
    
    // Post-processing settings - simplified without DOF
    postProcessingSettings: {
        enabled: DEFAULT_SETTINGS.postProcessing.enabled,
        afterimageEnabled: DEFAULT_SETTINGS.postProcessing.afterimageEnabled,
        afterimageDamp: DEFAULT_SETTINGS.postProcessing.afterimageDamp
    },
    
    // Three.js scene objects (initialized as null)
    scene: null,
    camera: null,
    renderer: null,
    particleSystem: null,
    composer: null,
    
    // Animation control variables
    animationSpeed: DEFAULT_SETTINGS.animation.speed,
    isAnimating: true,
    cameraDistance: DEFAULT_SETTINGS.animation.zoom,
    glowIntensity: DEFAULT_SETTINGS.animation.glow,
    time: 0,
    
    // Black hole related state
    blackHoles: [],
    blackHoleEnabled: DEFAULT_SETTINGS.blackHoles.enabled,
    gravitationalStrength: DEFAULT_SETTINGS.blackHoles.gravitationalStrength,
    blackHoleInfluenceRadius: DEFAULT_SETTINGS.blackHoles.influenceRadius,
    
    // Performance tracking
    fps: 0,
    frameCount: 0,
    lastFrameTime: 0,
    fpsHistory: [],
    
    // Star selection system
    selectedStar: null,
    trackedStar: null,
    isTrackingEnabled: false,
    starIndicator: null,  // Added for star selection visual indicator
    starInfoPosition: null, // Added to store star info window position
    
    // Enhanced camera control state
    cameraControls: {
        autoRotate: true,
        autoRotateSpeed: 0.1,
        verticalOscillation: true,
        followGalaxyRotation: false,
        cinematicMode: false,
        manualControl: false,
        lastInteractionTime: 0,
        interactionTimeout: 3000,
        azimuthAngle: 0,
        polarAngle: Math.PI / 3,
        distance: DEFAULT_SETTINGS.animation.zoom,
        target: { x: 0, y: 0, z: 0 },
        currentPattern: 0,
        patternStartTime: 0,
        patternDuration: 20000
    },
    
    // Mouse interaction state
    mouseInteraction: {
        isDown: false,
        rightClick: false,
        lastX: 0,
        lastY: 0,
        sensitivity: 0.005,
        zoomSensitivity: 0.1,
        panSensitivity: 0.01
    },
    
    // Initialization progress tracking
    initializationProgress: {
        serverConfig: false,
        renderer: false,
        ui: false,
        galaxy: false,
        physics: false,
        effects: false
    },
    
    // API information
    apiBaseUrl: null,
    serverConfig: null,
    
    // Population tracking
    stellarPopulations: {
        bulge: 0,
        disk: 0,
        youngArm: 0,
        halo: 0
    },
    
    // Galaxy type history
    galaxyTypeHistory: [],
    
    // Performance tracking
    performanceTracker: {
        startTime: 0,
        frameCount: 0,
        galaxyGenerations: 0,
        averageGenerationTime: 0,
        lastGenerationTime: 0,
        generationStartTime: 0,
        generationTimes: []
    }
};

// Create a working copy of the state with all defaults
const state = Object.assign({}, initialState);

/**
 * Check if an object is from Three.js library
 * @param {any} obj - Object to check
 * @returns {boolean} - True if it's a Three.js object
 */
function isThreeJsObject(obj) {
    if (!obj) return false;
    // Check for common Three.js objects
    return (
        obj.isObject3D || 
        obj.isBufferGeometry || 
        obj.isMaterial || 
        obj.isTexture ||
        obj.isMatrix4 ||
        obj.isVector3 ||
        obj.isQuaternion ||
        obj.isEuler ||
        // Check constructor name as fallback
        (obj.constructor && obj.constructor.name && 
         obj.constructor.name.startsWith && 
         obj.constructor.name.startsWith('Three'))
    );
}

/**
 * Create a safe copy of an object without trying to clone functions or Three.js objects
 * @param {any} obj - Object to copy
 * @returns {any} - Safe copy
 */
function safeCopy(obj) {
    // Handle null, undefined, or primitive types
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    
    // If it's a Three.js object, return the original (no cloning)
    if (isThreeJsObject(obj)) {
        return obj;
    }
    
    // Handle Date
    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }
    
    // Handle Array
    if (Array.isArray(obj)) {
        return obj.map(item => safeCopy(item));
    }
    
    // Handle regular objects
    const result = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            // Skip functions
            if (typeof obj[key] !== 'function') {
                result[key] = safeCopy(obj[key]);
            } else {
                result[key] = obj[key]; // Keep function references
            }
        }
    }
    
    return result;
}

/**
 * Get a copy of a specific state slice
 * @param {string} key - State key to retrieve
 * @returns {any} - Copy of the state value
 */
export function get(key) {
    if (key in state) {
        // Return a safe copy to prevent direct mutation
        if (state[key] !== null && typeof state[key] === 'object') {
            return safeCopy(state[key]);
        }
        return state[key];
    }
    console.warn(`State key "${key}" does not exist`);
    return undefined;
}

/**
 * Get entire state (for debugging)
 * @returns {Object} A defensive copy of the state
 */
export function getState() {
    return safeCopy(state);
}

/**
 * Update a specific state property
 * @param {string} key - State key to update
 * @param {any} value - New value
 * @returns {any} - The new value
 */
export function set(key, value) {
    if (key in state) {
        const oldValue = state[key];
        state[key] = value;
        
        // Emit event for state change
        eventBus.emit(`state-changed:${key}`, { newValue: value, oldValue });
        return value;
    }
    console.warn(`Cannot update: State key "${key}" does not exist`);
    return undefined;
}

/**
 * Update a nested state property
 * @param {string} key - Primary state key
 * @param {string} subKey - Nested property to update
 * @param {any} value - New value
 * @returns {any} - The new value
 */
export function setNested(key, subKey, value) {
    if (key in state && typeof state[key] === 'object' && state[key] !== null) {
        const oldValue = state[key][subKey];
        state[key][subKey] = value;
        
        // Emit event for nested state change
        eventBus.emit(`state-changed:${key}.${subKey}`, { 
            newValue: value, 
            oldValue,
            parent: state[key]
        });
        return value;
    }
    console.warn(`Cannot update nested: State key "${key}.${subKey}" does not exist`);
    return undefined;
}

/**
 * Reset state to initial values
 * @param {string} [key] - Specific key to reset, or entire state if omitted
 */
export function reset(key) {
    // Reset specific key to initial value
    if (key && key in initialState) {
        set(key, safeCopy(initialState[key]));
        console.log(`State key "${key}" reset to initial value`);
    } 
    // Reset entire state
    else if (!key) {
        Object.keys(initialState).forEach(k => {
            state[k] = safeCopy(initialState[k]);
        });
        console.log('Full state reset to initial values');
    }
    
    eventBus.emit('state-reset', { key });
}

// API state getters and setters
export function getApiBaseUrl() {
    return state.apiBaseUrl;
}

export function setApiBaseUrl(url) {
    state.apiBaseUrl = url;
    eventBus.emit('api-base-url-changed', url);
    return url;
}

export function getServerConfig() {
    return state.serverConfig;
}

export function setServerConfig(config) {
    state.serverConfig = config;
    eventBus.emit('server-config-changed', config);
    return config;
}

// Specific getters/setters for commonly used state
// These make the code more readable by providing specific accessors

// Galaxy state
export function getCurrentSeed() { return state.currentSeed; }
export function setCurrentSeed(seed) { 
    state.currentSeed = seed; 
    eventBus.emit('current-seed-changed', seed);
    return seed;
}

export function getCurrentGalaxyData() { return state.currentGalaxyData; }
export function setCurrentGalaxyData(data) { 
    state.currentGalaxyData = data; 
    eventBus.emit('current-galaxy-data-changed', data);
    return data;
}

export function getCurrentGalaxyPhysics() { return safeCopy(state.currentGalaxyPhysics); }
export function setCurrentGalaxyPhysics(physics) { 
    state.currentGalaxyPhysics = physics; 
    eventBus.emit('current-galaxy-physics-changed', physics);
    return physics;
}

// Three.js objects
export function getScene() { return state.scene; }
export function setScene(scene) { 
    state.scene = scene; 
    eventBus.emit('scene-changed', scene);
    return scene;
}

export function getCamera() { return state.camera; }
export function setCamera(camera) { 
    state.camera = camera; 
    eventBus.emit('camera-changed', camera);
    return camera;
}

export function getRenderer() { return state.renderer; }
export function setRenderer(renderer) { 
    state.renderer = renderer; 
    eventBus.emit('renderer-changed', renderer);
    return renderer;
}

export function getParticleSystem() { return state.particleSystem; }
export function setParticleSystem(particleSystem) { 
    state.particleSystem = particleSystem; 
    eventBus.emit('particle-system-changed', particleSystem);
    return particleSystem;
}

// Animation control
export function getAnimationSpeed() { return state.animationSpeed; }
export function setAnimationSpeed(speed) { 
    state.animationSpeed = speed; 
    eventBus.emit('animation-speed-changed', speed);
    return speed;
}

export function isAnimating() { return state.isAnimating; }
export function setIsAnimating(isAnimating) { 
    state.isAnimating = isAnimating; 
    eventBus.emit('is-animating-changed', isAnimating);
    return isAnimating;
}

export function getCameraDistance() { return state.cameraDistance; }
export function setCameraDistance(distance) { 
    state.cameraDistance = distance; 
    eventBus.emit('camera-distance-changed', distance);
    return distance;
}

export function getGlowIntensity() { return state.glowIntensity; }
export function setGlowIntensity(intensity) { 
    state.glowIntensity = intensity; 
    eventBus.emit('glow-intensity-changed', intensity);
    return intensity;
}

export function getTime() { return state.time; }
export function setTime(time) { 
    state.time = time; 
    // Don't emit for time updates - too frequent
    return time;
}

// Post-processing settings getters and setters
export function getPostProcessingSettings() { return safeCopy(state.postProcessingSettings); }
export function setPostProcessingSettings(settings) { 
    state.postProcessingSettings = settings; 
    eventBus.emit('post-processing-settings-changed', settings);
    return settings;
}

export function updatePostProcessingSetting(key, value) {
    if (state.postProcessingSettings && key in state.postProcessingSettings) {
        state.postProcessingSettings[key] = value;
        eventBus.emit('post-processing-setting-changed', { key, value });
        return value;
    }
    console.warn(`Cannot update post-processing setting: "${key}" does not exist`);
    return undefined;
}

// Black hole state
export function getBlackHoles() { return state.blackHoles; }
export function setBlackHoles(blackHoles) { 
    state.blackHoles = blackHoles; 
    eventBus.emit('black-holes-changed', blackHoles);
    return blackHoles;
}

export function isBlackHoleEnabled() { return state.blackHoleEnabled; }
export function setBlackHoleEnabled(enabled) { 
    state.blackHoleEnabled = enabled; 
    eventBus.emit('black-hole-enabled-changed', enabled);
    return enabled;
}

export function getGravitationalStrength() { return state.gravitationalStrength; }
export function setGravitationalStrength(strength) { 
    state.gravitationalStrength = strength; 
    eventBus.emit('gravitational-strength-changed', strength);
    return strength;
}

export function getBlackHoleInfluenceRadius() { return state.blackHoleInfluenceRadius; }
export function setBlackHoleInfluenceRadius(radius) { 
    state.blackHoleInfluenceRadius = radius; 
    eventBus.emit('black-hole-influence-radius-changed', radius);
    return radius;
}

// Star selection state
export function getSelectedStar() { return state.selectedStar; }
export function setSelectedStar(star) { 
    state.selectedStar = star; 
    eventBus.emit('selected-star-changed', star);
    return star;
}

export function getTrackedStar() { return state.trackedStar; }
export function setTrackedStar(star) { 
    state.trackedStar = star; 
    eventBus.emit('tracked-star-changed', star);
    return star;
}

export function isTrackingEnabled() { return state.isTrackingEnabled; }
export function setIsTrackingEnabled(enabled) { 
    state.isTrackingEnabled = enabled; 
    eventBus.emit('tracking-enabled-changed', enabled);
    return enabled;
}

/**
 * Get the current star indicator data
 * @returns {Object|null} - Star indicator data or null if none
 */
export function getStarIndicator() { 
    return state.starIndicator;
}

/**
 * Set star indicator data
 * @param {Object|null} indicator - The star indicator data to store
 * @returns {Object|null} - The updated indicator data
 */
export function setStarIndicator(indicator) { 
    state.starIndicator = indicator; 
    eventBus.emit('star-indicator-changed', indicator);
    return indicator;
}

// Camera controls
export function getCameraControls() { return safeCopy(state.cameraControls); }
export function setCameraControlProperty(prop, value) {
    if (prop in state.cameraControls) {
        state.cameraControls[prop] = value;
        eventBus.emit('camera-controls-changed', { 
            property: prop, 
            value,
            controls: state.cameraControls
        });
        return value;
    }
    return undefined;
}

// Mouse interaction
export function getMouseInteraction() { return safeCopy(state.mouseInteraction); }
export function setMouseInteractionProperty(prop, value) {
    if (prop in state.mouseInteraction) {
        state.mouseInteraction[prop] = value;
        eventBus.emit('mouse-interaction-changed', { 
            property: prop, 
            value,
            interaction: state.mouseInteraction
        });
        return value;
    }
    return undefined;
}

// Initialization progress
export function getInitializationProgress() { return safeCopy(state.initializationProgress); }
export function setInitializationProgressStep(step, completed) {
    if (step in state.initializationProgress) {
        state.initializationProgress[step] = completed;
        eventBus.emit('initialization-progress-changed', { 
            step, 
            completed,
            progress: state.initializationProgress
        });
        return completed;
    }
    return undefined;
}

// Performance tracking
export function updateFps(newFps) {
    state.fps = newFps;
    state.fpsHistory.push(newFps);
    
    // Maintain history size
    if (state.fpsHistory.length > 30) {
        state.fpsHistory.shift();
    }
    
    // Only emit occasionally to avoid spam
    if (state.frameCount % 30 === 0) {
        eventBus.emit('fps-updated', {
            current: newFps,
            average: state.fpsHistory.reduce((a, b) => a + b, 0) / state.fpsHistory.length
        });
    }
    
    state.frameCount++;
    return newFps;
}

// Subscribe to state changes
export function onStateChange(key, callback) {
    return eventBus.on(`state-changed:${key}`, callback);
}

// Initialize listeners for debugging if needed
if (typeof DEBUG_CONFIG !== 'undefined' && DEBUG_CONFIG.enabled) {
    eventBus.on('state-changed:*', (data) => {
        console.log('State changed:', data);
    });
}

// Log state initialization
console.log('State system initialized with default values');
