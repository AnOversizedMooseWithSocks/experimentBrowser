/**
 * Enhanced main application initialization and coordination for Galaxy Generator v2
 * Orchestrates the enhanced loading and initialization using ES Modules
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js';
import eventBus from './events.js';
import * as api from './api.js';
import * as state from './state.js';
import * as renderer from './renderer.js';
import * as galaxy from './galaxy.js';
import * as ui from './ui.js';
import * as effects from './effects.js';
import * as cameraControls from './camera-controls.js';
import { STATUS_MESSAGES } from './config.js';
import './screenshot.js';

// IMPORTANT: Make post-processing functions globally available immediately
// This fixes the "not defined" errors for HTML button onclick handlers
window.togglePostProcessing = effects.togglePostProcessing;
window.toggleAfterimage = effects.toggleAfterimage;

// Enhanced initialization tracking through state management
function resetInitializationProgress() {
    state.setInitializationProgressStep('serverConfig', false);
    state.setInitializationProgressStep('renderer', false);
    state.setInitializationProgressStep('ui', false);
    state.setInitializationProgressStep('galaxy', false);
    state.setInitializationProgressStep('physics', false);
    state.setInitializationProgressStep('effects', false);
}

/**
 * Initialize the entire enhanced application
 * Coordinates the startup process with realistic galaxy physics:
 * 1. Load server configuration
 * 2. Initialize Three.js renderer with enhanced features
 * 3. Set up enhanced UI with galaxy controls
 * 4. Initialize galaxy physics system
 * 5. Generate initial realistic galaxy
 */
async function initializeApp() {
    const loadingMessage = document.getElementById('loading-message');
    const loadingOverlay = document.getElementById('loading-overlay');
    
    try {
        console.log('🚀 Starting Enhanced Galaxy Generator initialization...');
        console.log('Features: Density waves, Differential rotation, Stellar populations, Hubble classification');
        
        resetInitializationProgress();
        
        // Step 1: Load server configuration
        loadingMessage.textContent = 'Loading enhanced server configuration...';
        await api.loadServerConfig();
        state.setInitializationProgressStep('serverConfig', true);
        setInitializationProgress(20);
        
        // Step 2: Initialize Three.js renderer with enhanced capabilities
        loadingMessage.textContent = 'Initializing enhanced 3D renderer with galaxy physics...';
        await new Promise(resolve => setTimeout(resolve, 500));
        await renderer.initRenderer();
        state.setInitializationProgressStep('renderer', true);
        setInitializationProgress(40);
        
        // Step 3: Set up enhanced UI with galaxy controls
        loadingMessage.textContent = 'Setting up enhanced user interface...';
        await new Promise(resolve => setTimeout(resolve, 500));
        ui.setupUI();
        state.setInitializationProgressStep('ui', true);
        setInitializationProgress(60);
        
        // Step 4: Initialize enhanced galaxy physics system
        loadingMessage.textContent = 'Initializing realistic galaxy physics...';
        await new Promise(resolve => setTimeout(resolve, 500));
        initializeGalaxyPhysicsSystem();
        state.setInitializationProgressStep('physics', true);
        setInitializationProgress(75);
        
        // Step 5: Initialize post-processing (MOVED HERE)
        loadingMessage.textContent = 'Setting up visual effects...';
        await new Promise(resolve => setTimeout(resolve, 500));
        effects.initPostProcessing();
        state.setInitializationProgressStep('effects', true);
        setInitializationProgress(85);
        
        // Step 6: Start the enhanced animation loop
        loadingMessage.textContent = 'Starting enhanced animation engine...';
        await new Promise(resolve => setTimeout(resolve, 500));
        renderer.animate();
        setInitializationProgress(90);
        
        // Step 7: Generate initial realistic galaxy
        loadingMessage.textContent = 'Generating initial spiral galaxy...';
        await new Promise(resolve => setTimeout(resolve, 500));
        await galaxy.randomSeed();
        state.setInitializationProgressStep('galaxy', true);
        setInitializationProgress(95);

        // Step 8: Initialize camera
        loadingMessage.textContent = 'Initializing camera system...';
        await new Promise(resolve => setTimeout(resolve, 500));
        initializeCameraSystem();
        state.setInitializationProgressStep('camera', true);
        setInitializationProgress(98);
        
        
        // Step 9: Finalize and show application
        loadingMessage.textContent = 'Ready to explore realistic galaxy formation!';
        await new Promise(resolve => setTimeout(resolve, 500));
        setInitializationProgress(100);
        
        // Initialize enhanced features
        initializeEnhancedFeatures();
        
        // Hide loading screen and show application
        loadingOverlay.style.display = 'none';
        
        // Show welcome message with feature overview
        showWelcomeMessage();
        
        console.log('✅ Enhanced Galaxy Generator initialized successfully');
        console.log('🌌 Features active: Density wave physics, Differential rotation, Stellar populations');
        
        // Emit successful initialization event
        eventBus.emit('app-initialization-completed');
        
    } catch (error) {
        console.error('❌ Failed to initialize Enhanced Galaxy Generator:', error);
        loadingMessage.textContent = 'Error loading enhanced galaxy generator. Please refresh the page.';
        ui.setStatus(STATUS_MESSAGES.ERROR_INIT);
        
        // Show detailed error information
        setTimeout(() => {
            loadingMessage.innerHTML = `
                <div style="color: #ff6b6b;">
                    Enhanced Galaxy Generator Error
                </div>
                <div style="font-size: 14px; margin-top: 10px;">
                    Failed to initialize: ${error.message}
                </div>
                <div style="font-size: 12px; margin-top: 10px; color: #888;">
                    Please check the console for details and ensure the enhanced server is running.
                </div>
                <div style="font-size: 11px; margin-top: 10px;">
                    Initialization Progress: ${getCompletedSteps()}
                </div>
            `;
        }, 1000);
        
        // Emit initialization error event
        eventBus.emit('app-initialization-failed', error);
    }
}

/**
 * Initialize enhanced galaxy physics system
 */
function initializeGalaxyPhysicsSystem() {
    console.log('Initializing enhanced galaxy physics...');
    
    // Initialize galaxy physics if not already done
    galaxy.initializeGalaxyPhysics();
    
    console.log('✅ Enhanced galaxy physics initialized');
    eventBus.emit('galaxy-physics-initialized');
}

/**
 * Initialize enhanced features after main initialization
 */
function initializeEnhancedFeatures() {
    // Enhanced performance monitoring
    setupEnhancedPerformanceMonitoring();
    
    // Enhanced keyboard shortcuts
    setupAdditionalKeyboardShortcuts();
    
    // Initialize post-processing UI controls
    setupPostProcessingUI();
    
    console.log('✅ Enhanced features initialized');
    eventBus.emit('enhanced-features-initialized');
}

/**
 * Set up enhanced performance monitoring
 */
function setupEnhancedPerformanceMonitoring() {
    // Track generation performance
    eventBus.on('galaxy-generated', (data) => {
        const tracker = state.get('performanceTracker') || {
            galaxyGenerations: 0,
            generationTimes: [],
            lastGenerationTime: 0
        };
        
        tracker.galaxyGenerations++;
        const newTime = performance.now() - tracker.generationStartTime;
        tracker.lastGenerationTime = newTime;
        tracker.generationTimes.push(newTime);
        
        // Keep only last 10 measurements
        if (tracker.generationTimes.length > 10) {
            tracker.generationTimes.shift();
        }
        
        // Calculate average
        const avgTime = tracker.generationTimes.reduce((a, b) => a + b, 0) / tracker.generationTimes.length;
        tracker.averageGenerationTime = avgTime;
        
        state.set('performanceTracker', tracker);
        console.log(`Galaxy generation time: ${newTime.toFixed(2)}ms (avg: ${avgTime.toFixed(2)}ms)`);
    });
    
    // Track generation start for timing
    eventBus.on('galaxy-generation-started', () => {
        const tracker = state.get('performanceTracker') || { generationStartTime: 0 };
        tracker.generationStartTime = performance.now();
        state.set('performanceTracker', tracker);
    });
    
    console.log('✅ Enhanced performance monitoring active');
}

/**
 * Set up UI elements for post-processing controls
 * Modified to remove DOF-related controls
 */
function setupPostProcessingUI() {
    // Check if post-processing controls already exist in the DOM
    if (document.getElementById('post-processing-controls')) {
        console.log('Post-processing controls already exist in HTML, skipping dynamic creation');
        
        // Set up event listeners for sliders that already exist in the HTML
        setupPostProcessingSliders();
        return;
    }
    
    console.log('Creating dynamic post-processing controls');
    const effectsControlsSection = document.querySelector('.effects-controls');
    
    // Create post-processing controls without DOF
    const postProcessingControls = document.createElement('div');
    postProcessingControls.id = 'post-processing-controls';
    postProcessingControls.innerHTML = `
        <h4 style="margin: 10px 0 10px 0; color: #fff; font-size: 16px;">Post-Processing Effects</h4>
        
        <button id="toggle-pp-btn" onclick="togglePostProcessing()">Toggle Post-Processing</button>
        <button id="toggle-afterimage-btn" onclick="toggleAfterimage()">Toggle Afterimage</button>
        
        <div class="slider-container">
            <label style="margin: 0; min-width: 80px; font-size: 12px;">Afterimage:</label>
            <input type="range" id="afterimage-slider" min="0.8" max="0.99" step="0.01" value="0.85">
            <span class="slider-value" id="afterimage-value">0.85</span>
        </div>
    `;
    
    // Add to DOM
    if (effectsControlsSection) {
        effectsControlsSection.appendChild(postProcessingControls);
    } else {
        // If effects section doesn't exist, add to UI panel
        const uiPanel = document.getElementById('ui-panel');
        if (uiPanel) {
            const newSection = document.createElement('div');
            newSection.className = 'effects-controls';
            newSection.appendChild(postProcessingControls);
            uiPanel.appendChild(newSection);
        }
    }
    
    // Set up event listeners for sliders
    setupPostProcessingSliders();
}

/**
 * Set up sliders for post-processing effects
 * Simplified to remove DOF-related controls
 */
function setupPostProcessingSliders() {
    // Afterimage slider
    const afterimageSlider = document.getElementById('afterimage-slider');
    const afterimageValue = document.getElementById('afterimage-value');
    if (afterimageSlider && afterimageValue) {
        afterimageSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            effects.updateAfterimageStrength(value);
            afterimageValue.textContent = value.toFixed(2);
        });
    }
}

/**
 * Set up additional keyboard shortcuts for enhanced features
 */
function setupAdditionalKeyboardShortcuts() {
    // These are now handled in the UI module
    console.log('Enhanced keyboard shortcuts available');
}

/**
 * Show welcome message with enhanced features overview
 */
function showWelcomeMessage() {
    const welcomeFeatures = [
        '🌌 Realistic spiral galaxy physics with density wave theory',
        '⭐ Multiple stellar populations (bulge, disk, spiral arms, halo)',
        '🔄 Differential rotation curves (Keplerian → flat)',
        '📊 Hubble classification system (Sa/Sb/Sc/SBa/SBb/SBc)',
        '🌀 Barred spiral galaxies with central bars',
        '⚫ Enhanced black hole gravitational effects',
        '📈 Real-time performance monitoring',
        '🎨 Color-coded stars by age and population',
        '🎥 Advanced post-processing effects',
        '📷 Camera control system with multiple patterns',
        '🔍 Detailed star system information'
    ];
    
    console.log('🎉 Enhanced Galaxy Generator Ready!');
    console.log('Enhanced Features:');
    welcomeFeatures.forEach(feature => console.log(`  ${feature}`));
    
    // Display features in UI
    ui.setStatus('Press \'H\' for help, \'G\' for galaxy analysis, \'Space\' to toggle UI');
    
    eventBus.emit('welcome-message-shown');
}

/**
 * Set initialization progress
 * @param {number} percent - Progress percentage (0-100)
 */
function setInitializationProgress(percent) {
    const progress = document.createElement('div');
    progress.style.cssText = `
        width: 100%;
        height: 4px;
        background: rgba(255,255,255,0.1);
        border-radius: 2px;
        margin-top: 10px;
        overflow: hidden;
    `;
    
    const bar = document.createElement('div');
    bar.style.cssText = `
        width: ${percent}%;
        height: 100%;
        background: linear-gradient(90deg, #4CAF50, #81C784);
        border-radius: 2px;
        transition: width 0.3s ease;
    `;
    
    progress.appendChild(bar);
    
    const loadingContent = document.querySelector('.loading-content');
    let existingProgress = loadingContent?.querySelector('.progress-bar');
    if (existingProgress) {
        existingProgress.remove();
    }
    
    if (loadingContent) {
        progress.className = 'progress-bar';
        loadingContent.appendChild(progress);
    }
    
    eventBus.emit('initialization-progress-updated', percent);
}

/**
 * Get completed initialization steps
 * @returns {string} - Text representation of completed steps
 */
function getCompletedSteps() {
    const progress = state.getInitializationProgress();
    const steps = Object.entries(progress)
        .map(([key, completed]) => `${key}: ${completed ? '✅' : '❌'}`)
        .join(', ');
    return steps;
}

/**
 * Enhanced application shutdown and cleanup
 */
function cleanup() {
    console.log('Cleaning up Enhanced Galaxy Generator...');
    
    // Clean up Three.js resources
    cleanupThreeJsResources();
    
    // Clean up enhanced resources
    cleanupEnhancedResources();
    
    // Clear performance tracking
    const performanceTracker = state.get('performanceTracker');
    if (performanceTracker) {
        console.log('Final Performance Stats:', performanceTracker);
    }
    
    console.log('✅ Enhanced cleanup completed');
    eventBus.emit('app-cleanup-completed');
}

/**
 * Clean up Three.js resources to prevent memory leaks
 */
function cleanupThreeJsResources() {
    const particleSystem = state.getParticleSystem();
    if (particleSystem) {
        if (particleSystem.geometry) particleSystem.geometry.dispose();
        if (particleSystem.material) particleSystem.material.dispose();
    }
    
    const renderer = state.getRenderer();
    if (renderer) {
        renderer.dispose();
    }
    
    // Clean up post-processing resources
    const composer = state.get('composer');
    if (composer) {
        // Dispose of render targets
        if (composer.renderTarget1) composer.renderTarget1.dispose();
        if (composer.renderTarget2) composer.renderTarget2.dispose();
        
        // Dispose of pass textures
        composer.passes.forEach(pass => {
            if (pass.dispose) pass.dispose();
        });
    }
}

/**
 * Clean up enhanced resources and features
 */
function cleanupEnhancedResources() {
    const scene = state.getScene();
    if (scene) {
        // Dispose of all scene objects
        scene.children.forEach(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(material => material.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
    }
}

/**
 * Initialize camera state integration for the app
 * This ensures state is properly initialized for camera operations
 */
function initializeCameraStateIntegration() {
    console.log('Initializing camera state integration...');
    
    // Make sure we have the right transition properties in camera controls
    const defaultCameraControlState = state.getCameraControls();
    
    // Add transition properties if not already in state
    if (!defaultCameraControlState.isTransitioning) {
        state.setCameraControlProperty('isTransitioning', false);
    }
    if (!defaultCameraControlState.transitionStartTime) {
        state.setCameraControlProperty('transitionStartTime', 0);
    }
    if (!defaultCameraControlState.transitionDuration) {
        state.setCameraControlProperty('transitionDuration', 1000);
    }
    if (!defaultCameraControlState.transitionFromPosition) {
        state.setCameraControlProperty('transitionFromPosition', null);
    }
    if (!defaultCameraControlState.transitionToPosition) {
        state.setCameraControlProperty('transitionToPosition', null);
    }
    if (!defaultCameraControlState.transitionFromTarget) {
        state.setCameraControlProperty('transitionFromTarget', null);
    }
    if (!defaultCameraControlState.transitionToTarget) {
        state.setCameraControlProperty('transitionToTarget', null);
    }
    
    console.log('Camera state properties initialized');
}

/**
 * Connect camera events to DOM for UI updates
 */
function setupCameraEventBridge() {
    // Make camera-related events propagate to DOM for UI updates
    eventBus.on('camera-controls-changed', (data) => {
        // Convert our internal event to a DOM event for UI components
        if (data.property === 'manualControl') {
            const event = new CustomEvent('camera-controls-changed', {
                detail: {
                    property: 'manualControl',
                    value: data.value
                }
            });
            window.dispatchEvent(event);
            
            // Update camera instructions
            const instructionsElement = document.getElementById('camera-instructions');
            if (instructionsElement) {
                // Show instructions when mode changes
                instructionsElement.classList.remove('hidden');
                
                // Update content based on mode
                const modeLabelElement = document.querySelector('.camera-mode-label');
                const controlsHintElement = document.getElementById('manual-controls-hint');
                
                if (modeLabelElement) {
                    modeLabelElement.textContent = data.value ? 'Manual Camera Mode' : 'Automatic Camera Mode';
                    modeLabelElement.style.color = data.value ? '#FF5722' : '#64B5F6';
                }
                
                if (controlsHintElement) {
                    controlsHintElement.classList.toggle('hidden', !data.value);
                }
                
                // Auto-hide after a few seconds
                setTimeout(() => {
                    instructionsElement.classList.add('hidden');
                }, 3000);
            }
        }
    });
    
    console.log('Camera event bridge initialized');
}

/**
 * The main camera system initialization function
 */
function initializeCameraSystem() {
    // Initialize state properties for camera transitions
    initializeCameraStateIntegration();
    
    // Connect camera events to DOM
    setupCameraEventBridge();
    
    // Initialize camera controls from the camera-controls module
    if (typeof cameraControls.initCameraControls === 'function') {
        cameraControls.initCameraControls();
    }
    
    // Initialize UI state on page load
    document.addEventListener('DOMContentLoaded', () => {
        // Make sure we have the right state initially
        const cameraControlsState = state.getCameraControls();
        if (cameraControlsState) {
            const event = new CustomEvent('camera-controls-changed', {
                detail: {
                    property: 'manualControl',
                    value: cameraControlsState.manualControl || false
                }
            });
            window.dispatchEvent(event);
        }
    });
    
    console.log('Camera system initialization complete');
}

// Set up event listeners for renderer 
eventBus.on('renderer-initialized', () => {
    // Initialize camera controls when renderer is ready
    if (typeof cameraControls.initCameraControls === 'function') {
        cameraControls.initCameraControls();
    }
});

eventBus.on('window-resized', () => {
    // Update camera aspect ratio
    const camera = state.getCamera();
    if (camera) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    }
});

/**
 * Enhanced star tracking initialization
 * This ensures star tracking works correctly in all camera modes
 */
function initializeStarTracking() {
    console.log('Initializing enhanced star tracking...');
    
    // Make the forceStarTrackingUpdate function available globally
    window.forceStarTrackingUpdate = function() {
        if (typeof cameraControls.forceStarTrackingUpdate === 'function') {
            cameraControls.forceStarTrackingUpdate();
        }
    };
    
    // Listen for star tracking toggles
    eventBus.on('star-tracking-toggled', (enabled) => {
        console.log('Star tracking ' + (enabled ? 'enabled' : 'disabled'));
        
        // If tracking is enabled, ensure we start tracking immediately 
        if (enabled) {
            // Give a small delay to ensure state is properly updated
            setTimeout(() => {
                if (typeof window.forceStarTrackingUpdate === 'function') {
                    window.forceStarTrackingUpdate();
                }
            }, 50);
        } else if (!enabled) {
            // If tracking is disabled, transition back to galaxy view
            const cameraControls = state.getCameraControls();
            const cameraDistance = state.getCameraDistance();
            
            // Only if not in manual mode
            if (cameraControls && !cameraControls.manualControl) {
                const destPos = new THREE.Vector3(
                    Math.sin(0) * cameraDistance,
                    20 + Math.sin(0 * 0.05) * 15,
                    Math.cos(0) * cameraDistance
                );
                
                const destTarget = { x: 0, y: 0, z: 0 };
                
                // Start transition if available
                if (typeof cameraControls.startCameraTransition === 'function') {
                    cameraControls.startCameraTransition(destPos, destTarget, 1000);
                }
            }
        }
    });
    
    // Listen for star selection to enable automatic tracking transition
    eventBus.on('star-selected', (starSystem) => {
        // If already tracking, update immediately to the new star
        if (state.isTrackingEnabled()) {
            // Give a small delay to ensure state is properly updated
            setTimeout(() => {
                if (typeof window.forceStarTrackingUpdate === 'function') {
                    window.forceStarTrackingUpdate();
                }
            }, 50);
        }
    });
    
    console.log('Enhanced star tracking initialized');
}

// Call the initialization once everything is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize star tracking after a short delay
    setTimeout(initializeStarTracking, 1000);
});

// When starting the app, make sure to initialize star tracking
window.addEventListener('load', () => {
    // Original app initialization call is here
    // initializeApp();
    
    // Add star tracking initialization
    setTimeout(initializeStarTracking, 2000);
});

// Enhanced global error handler
window.addEventListener('error', (event) => {
    console.error('Enhanced Galaxy Generator error:', event.error);
    ui.setStatus('Error occurred - check console for details');
    
    // Log enhanced error context
    console.error('Error context:', {
        initializationProgress: state.getInitializationProgress(),
        currentGalaxy: state.getCurrentGalaxyData() ? state.getCurrentGalaxyData().metadata : null,
        physics: state.getCurrentGalaxyPhysics()
    });
    
    eventBus.emit('app-error', { error: event.error, message: event.message });
});

// Enhanced unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection in Enhanced Galaxy Generator:', event.reason);
    ui.setStatus('Promise rejection - check console for details');
    event.preventDefault();
    
    eventBus.emit('app-promise-rejection', { reason: event.reason });
});

// Call the initialization once everything is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize after a short delay to ensure other systems are ready
    setTimeout(initializeCameraSystem, 1000);
});

// Make camera mode toggle available globally
window.toggleManualCameraMode = cameraControls.toggleManualCameraMode;

// Make this available globally for debugging
window.initializeCameraSystem = initializeCameraSystem;

// Make the render animation available globally for debugging
window.startAnimation = renderer.animate;

// Start the application when the window loads
window.addEventListener('load', initializeApp);

// Clean up enhanced resources when page unloads
window.addEventListener('beforeunload', cleanup);