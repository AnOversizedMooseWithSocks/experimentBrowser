/**
 * Integration script to connect camera events to UI state
 * This file ensures smooth camera movement is properly integrated with UI
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js';
import eventBus from './events.js';
import * as state from './state.js';
import * as cameraControls from './camera-controls.js';

/**
 * Initialize camera state integration for smooth transitions
 */
export function initCameraStateIntegration() {
    console.log('Initializing camera state integration...');
    
    // Make sure transition properties are in camera controls state
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
    
    // Ensure the interactionTimeout is properly set (this value will be ignored in our fixed code)
    if (!defaultCameraControlState.interactionTimeout) {
        state.setCameraControlProperty('interactionTimeout', 3000);
    }
    
    console.log('Camera state properties initialized for smooth transitions');
}

// Make sure camera-related events propagate to DOM for UI updates
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

// Listen for star tracking changes to ensure smooth transitions
eventBus.on('star-tracking-toggled', (enabled) => {
    // If tracking is enabled, ensure we start tracking immediately with proper transitions
    if (enabled && typeof cameraControls.forceStarTrackingUpdate === 'function') {
        // Small delay to ensure state is updated properly
        setTimeout(() => {
            cameraControls.forceStarTrackingUpdate();
        }, 50);
    }
    // If disabled, transition is already handled in updated camera-controls.js
});

// Listen for camera transitions to update UI elements
eventBus.on('camera-transition-started', () => {
    // You could add effects or UI indicators for the transition here
    // For example, showing a brief camera movement indicator
    console.log('Camera transition started - smooth movement in progress');
});

eventBus.on('camera-transition-completed', () => {
    console.log('Camera transition completed smoothly');
});

// Initialize camera state on page load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize transition properties
    initCameraStateIntegration();
    
    // Make sure we have the right state initially
    const cameraControls = state.getCameraControls();
    if (cameraControls) {
        const event = new CustomEvent('camera-controls-changed', {
            detail: {
                property: 'manualControl',
                value: cameraControls.manualControl || false
            }
        });
        window.dispatchEvent(event);
    }
    
    // Set up keyboard shortcut for manual mode toggle - only process if not in input field
    document.addEventListener('keydown', (event) => {
        if (event.key === 'm' || event.key === 'M') {
            // Only if not in an input field
            if (event.target.tagName !== 'INPUT' && event.target.tagName !== 'TEXTAREA') {
                if (typeof cameraControls.toggleManualCameraMode === 'function') {
                    // This needs to be a direct event handler not connected to the other M key handler
                    // This ensures no conflicts between the two keyboard handlers
                    cameraControls.toggleManualCameraMode();
                    
                    // Prevent default behavior and stop propagation
                    event.preventDefault();
                    event.stopPropagation();
                }
            }
        }
    });
    
    console.log('Camera integration initialized with smooth transition support');
});

// Make forceStarTrackingUpdate available globally for external triggers
window.forceStarTrackingUpdate = function() {
    if (typeof cameraControls.forceStarTrackingUpdate === 'function') {
        return cameraControls.forceStarTrackingUpdate();
    }
    return false;
};

// Expose functions for external use
window.startCameraTransition = function(position, target, duration) {
    if (typeof cameraControls.startCameraTransition === 'function') {
        const targetPosition = new THREE.Vector3(position.x, position.y, position.z);
        cameraControls.startCameraTransition(targetPosition, target, duration);
    }
};

// Add function to toggle manual camera mode from HTML UI elements
window.toggleManualCameraMode = function() {
    if (typeof cameraControls.toggleManualCameraMode === 'function') {
        return cameraControls.toggleManualCameraMode();
    }
    return false;
};

// Export functions for module use
export { initCameraStateIntegration };

console.log('Camera integration ready with enhanced smooth movement support');
