/**
 * Post-processing effects module with afterimage implementation
 * Using Three.js for effects
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/postprocessing/RenderPass.js';
import { AfterimagePass } from 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/postprocessing/AfterimagePass.js';
import { ShaderPass } from 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/postprocessing/ShaderPass.js';
import { CopyShader } from 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/shaders/CopyShader.js';
import eventBus from './events.js';
import * as state from './state.js';

// Default settings with DOF removed
const DEFAULT_SETTINGS = {
    enabled: true,
    afterimageEnabled: false,
    afterimageDamp: 0.85
};

// Post-processing components
let composer = null;
let renderPass = null;
let afterimagePass = null;
let copyPass = null;

// Initialization state flag
let isInitialized = false;

/**
 * Initialize the post-processing state in a safe manner
 * @returns {boolean} - Success or failure
 */
function ensurePostProcessingState() {
    try {
        // Always make sure we have post-processing settings in state
        if (!state.get('postProcessingSettings')) {
            console.log('Initializing post-processing settings in state');
            // Initialize with default settings
            state.set('postProcessingSettings', {...DEFAULT_SETTINGS});
        }
        return true;
    } catch (error) {
        console.error('Failed to initialize post-processing state:', error);
        return false;
    }
}

/**
 * Initialize post-processing with Three.js
 * @returns {boolean} - Success or failure
 */
export function initPostProcessing() {
    console.log('Initializing post-processing...');
    
    // If already initialized, don't do it again
    if (isInitialized) {
        console.log('Post-processing already initialized, skipping');
        return true;
    }
    
    try {
        // Step 1: First ensure we have settings in state
        if (!ensurePostProcessingState()) {
            throw new Error('Could not initialize post-processing state');
        }
        
        // Step 2: Check if we have the required renderer and camera
        const renderer = state.getRenderer();
        const scene = state.getScene();
        const camera = state.getCamera();
        
        if (!renderer) {
            throw new Error('Renderer not initialized for post-processing');
        }
        
        if (!scene || !camera) {
            throw new Error('Scene or Camera not initialized for post-processing');
        }
        
        // Step 3: Get current settings (now we're sure they exist)
        const settings = state.get('postProcessingSettings');
        
        // Step 4: Create render targets
        const width = window.innerWidth;
        const height = window.innerHeight;
        const pixelRatio = renderer.getPixelRatio();
        
        // Step 5: Create EffectComposer
        composer = new EffectComposer(renderer);
        composer.setSize(width, height);
        
        // Step 6: Add RenderPass
        renderPass = new RenderPass(scene, camera);
        composer.addPass(renderPass);
        
        // Step 7: Add afterimage pass
        afterimagePass = new AfterimagePass(settings.afterimageDamp);
        afterimagePass.enabled = settings.afterimageEnabled;
        composer.addPass(afterimagePass);
        
        // Step 8: Final copy pass
        copyPass = new ShaderPass(CopyShader);
        copyPass.renderToScreen = true;
        composer.addPass(copyPass);
        
        // Step 9: Store composer in state for renderer to access
        state.set('composer', composer);
        
        // Mark as initialized
        isInitialized = true;
        
        console.log('✅ Post-processing initialized');
        eventBus.emit('post-processing-initialized');
        
        return true;
    } catch (error) {
        console.error('❌ Error initializing post-processing:', error);
        eventBus.emit('post-processing-error', { error });
        return false;
    }
}

/**
 * Update post-processing effects for new frame
 */
export function updatePostProcessing() {
    // Initialize if not already done
    if (!isInitialized) {
        initPostProcessing();
        return;
    }
    
    // Get settings, with fallback to defaults if not in state yet
    const settings = state.get('postProcessingSettings') || DEFAULT_SETTINGS;
    
    // Render with or without effects based on settings
    if (isInitialized && composer && settings && settings.enabled) {
        try {
            composer.render();
        } catch (error) {
            console.error('Error rendering with effects, falling back to standard rendering:', error);
            renderWithoutEffects();
        }
    } else {
        renderWithoutEffects();
    }
}

/**
 * Handle window resize for post-processing
 */
export function resizePostProcessing() {
    if (!isInitialized || !composer) return;
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    const renderer = state.getRenderer();
    
    if (renderer) {
        const pixelRatio = renderer.getPixelRatio();
        composer.setSize(width, height);
        
        console.log('Post-processing resized to', width, 'x', height);
        eventBus.emit('post-processing-resized', { width, height });
    }
}

/**
 * Fallback render function when post-processing is unavailable
 */
function renderWithoutEffects() {
    const renderer = state.getRenderer();
    const scene = state.getScene();
    const camera = state.getCamera();
    
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

/**
 * Toggle post-processing on/off
 */
export function togglePostProcessing() {
    // Ensure state is initialized
    ensurePostProcessingState();
    
    // Get current settings
    let settings = state.get('postProcessingSettings');
    
    // Toggle enabled state
    settings.enabled = !settings.enabled;
    state.set('postProcessingSettings', settings);
    
    console.log('Post-processing', settings.enabled ? 'enabled' : 'disabled');
    eventBus.emit('status-update', `Post-processing ${settings.enabled ? 'enabled' : 'disabled'}`);
    
    // Emit setting changed event for UI updates
    eventBus.emit('post-processing-setting-changed', { key: 'enabled', value: settings.enabled });
    eventBus.emit('post-processing-state-changed');
    
    return settings.enabled;
}

/**
 * Toggle Afterimage effect
 */
export function toggleAfterimage() {
    // Ensure state is initialized
    ensurePostProcessingState();
    
    // Get current settings
    let settings = state.get('postProcessingSettings');
    
    // Toggle afterimage state
    settings.afterimageEnabled = !settings.afterimageEnabled;
    state.set('postProcessingSettings', settings);
    
    // Update afterimage pass
    if (afterimagePass) {
        afterimagePass.enabled = settings.afterimageEnabled;
    }
    
    console.log('Afterimage effect', settings.afterimageEnabled ? 'enabled' : 'disabled');
    eventBus.emit('status-update', `Afterimage effect ${settings.afterimageEnabled ? 'enabled' : 'disabled'}`);
    
    // Emit setting changed event for UI updates
    eventBus.emit('post-processing-setting-changed', { key: 'afterimageEnabled', value: settings.afterimageEnabled });
    eventBus.emit('post-processing-state-changed');
    
    return settings.afterimageEnabled;
}

/**
 * Update afterimage damping factor
 * @param {number} strength - Damping factor (0-1)
 * @returns {number} - The new damping value
 */
export function updateAfterimageStrength(strength) {
    // Ensure state is initialized
    ensurePostProcessingState();
    
    // Get current settings
    let settings = state.get('postProcessingSettings');
    
    // Update strength value
    settings.afterimageDamp = strength;
    state.set('postProcessingSettings', settings);
    
    // Update AfterimagePass if available
    if (afterimagePass) {
        afterimagePass.uniforms["damp"].value = strength;
        console.log('Afterimage strength updated:', strength);
    }
    
    // Emit setting changed event for UI updates
    eventBus.emit('post-processing-setting-changed', { key: 'afterimageDamp', value: strength });
    eventBus.emit('post-processing-state-changed');
    
    return strength;
}

/**
 * Get current post-processing state for external use
 * Used by UI components to update effect indicators
 * @returns {Object} - Current post-processing settings
 */
export function getPostProcessingState() {
    return state.get('postProcessingSettings');
}

// Make this function available globally for UI updates
window._getPostProcessingState = getPostProcessingState;

// Set up event listeners for window resize
eventBus.on('window-resized', resizePostProcessing);
eventBus.on('renderer-initialized', () => {
    // Wait a short time after renderer is ready to initialize post-processing
    setTimeout(initPostProcessing, 100);
});

// Initialize settings at module load time
ensurePostProcessingState();

// Make functions globally available for HTML buttons
window.togglePostProcessing = togglePostProcessing;
window.toggleAfterimage = toggleAfterimage;
