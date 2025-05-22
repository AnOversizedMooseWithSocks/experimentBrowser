/**
 * Screenshot module for Galaxy Generator
 * Handles capturing and saving the current view as an image
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js';
import eventBus from './events.js';
import * as state from './state.js';

/**
 * Attempt to access the post-processing state directly from effects.js
 * This is a fallback method if the standard state methods don't work
 * @returns {Object|null} - The post-processing settings or null
 */
function getPostProcessingState() {
    try {
        // Try using the globally exposed function from effects.js
        if (typeof window._getPostProcessingState === 'function') {
            return window._getPostProcessingState();
        }
        
        // Standard state access
        return state.get('postProcessingSettings');
    } catch (error) {
        console.warn('Error accessing post-processing state:', error);
        return null;
    }
}

/**
 * Get the post-processing composer from state with better error checking
 * @returns {Object|null} - The composer object or null if not available
 */
function getPostProcessingComposer() {
    try {
        // Try different ways to access the composer
        // 1. Direct state access
        let composer = state.get('composer');
        
        // 2. Try to access it through updatePostProcessing function if available
        if (!composer && typeof window.updatePostProcessing === 'function') {
            // This might initialize the composer if not already done
            window.updatePostProcessing();
            composer = state.get('composer');
        }
        
        // 3. Try to check if it's available in the global state object
        if (!composer && state.state && state.state.composer) {
            composer = state.state.composer;
        }
        
        // Verify the composer is valid
        if (composer && typeof composer === 'object') {
            return composer;
        }
        
        return null;
    } catch (error) {
        console.warn('Error accessing post-processing composer:', error);
        return null;
    }
}

/**
 * Create a simplified version of the high-resolution screenshot function
 * that doesn't rely on composer adjustments
 * @param {number} multiplier - Resolution multiplier
 * @param {string} [filename] - Optional filename
 * @returns {boolean} - Success status
 */
function captureHighResScreenshotFallback(multiplier = 2, filename = null) {
    try {
        const renderer = state.getRenderer();
        const scene = state.getScene();
        const camera = state.getCamera();
        
        if (!renderer || !scene || !camera) {
            console.error('Cannot capture fallback high-res screenshot: required components not available');
            return false;
        }
        
        // Store original size and pixel ratio
        const originalWidth = renderer.domElement.width;
        const originalHeight = renderer.domElement.height;
        const originalPixelRatio = renderer.getPixelRatio();
        
        // Create a new high-res canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const width = originalWidth;
        const height = originalHeight;
        
        // Set high-res dimensions
        canvas.width = width * multiplier;
        canvas.height = height * multiplier;
        
        // Render at original size first to ensure scene is updated
        renderer.render(scene, camera);
        
        // Copy and scale up the renderer's canvas content to our high-res canvas
        context.drawImage(
            renderer.domElement,
            0, 0, width, height,
            0, 0, width * multiplier, height * multiplier
        );
        
        // Get data URL from the high-res canvas
        const dataURL = canvas.toDataURL('image/png');
        
        // Create filename if not provided
        if (!filename) {
            filename = generateScreenshotFilename(`galaxy_${multiplier}x_fallback`);
        }
        
        // Save the image
        saveScreenshotFile(dataURL, filename);
        
        console.log(`Fallback high-res screenshot (${multiplier}x) saved as ${filename}`);
        eventBus.emit('status-update', `High-res screenshot saved as ${filename}`);
        
        return true;
    } catch (error) {
        console.error('Error capturing fallback high-res screenshot:', error);
        eventBus.emit('status-update', 'Error capturing high-res screenshot');
        return false;
    }
}

/**
 * Capture the current canvas state and download as an image
 * @param {string} [filename="galaxy_screenshot.png"] - The filename to save as
 * @returns {boolean} - Success status
 */
export function captureScreenshot(filename = "galaxy_screenshot.png") {
    try {
        const renderer = state.getRenderer();
        if (!renderer) {
            console.error('Cannot capture screenshot: renderer not available');
            eventBus.emit('status-update', 'Screenshot failed: renderer not available');
            return false;
        }
        
        // Get current state to determine if we should use post-processing
        const postProcessingSettings = getPostProcessingState();
        const composer = getPostProcessingComposer();
        const scene = state.getScene();
        const camera = state.getCamera();
        
        if (!scene || !camera) {
            console.error('Cannot capture screenshot: scene or camera not available');
            eventBus.emit('status-update', 'Screenshot failed: scene or camera not available');
            return false;
        }
        
        // Ensure we get the latest render with all effects
        // If post-processing is enabled and available, capture after its render
        if (postProcessingSettings && postProcessingSettings.enabled && composer) {
            try {
                // Check if composer has render method before calling
                if (typeof composer.render === 'function') {
                    // Force a render with post-processing effects
                    composer.render();
                } else {
                    console.warn('Composer object does not have render method, falling back to standard render');
                    renderer.render(scene, camera);
                }
            } catch (renderError) {
                console.warn('Error using composer render, falling back to standard render:', renderError);
                renderer.render(scene, camera);
            }
        } else {
            // Standard render without post-processing
            renderer.render(scene, camera);
        }
        
        // Get canvas data URL
        const dataURL = renderer.domElement.toDataURL('image/png');
        
        // Use the file saving utility
        saveScreenshotFile(dataURL, filename);
        
        console.log(`Screenshot saved as ${filename}`);
        eventBus.emit('status-update', `Screenshot saved as ${filename}`);
        eventBus.emit('screenshot-captured', { filename, dataURL });
        
        return true;
    } catch (error) {
        console.error('Error capturing screenshot:', error);
        eventBus.emit('status-update', 'Error capturing screenshot');
        eventBus.emit('error', { type: 'screenshot', error });
        return false;
    }
}

/**
 * Generate a timestamp-based filename for the screenshot
 * @param {string} [prefix="galaxy"] - Prefix for the filename
 * @param {string} [extension="png"] - File extension
 * @returns {string} - Generated filename
 */
export function generateScreenshotFilename(prefix = "galaxy", extension = "png") {
    const now = new Date();
    const timestamp = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
        String(now.getHours()).padStart(2, '0'),
        String(now.getMinutes()).padStart(2, '0'),
        String(now.getSeconds()).padStart(2, '0')
    ].join('');
    
    // Get current seed if available
    const seed = state.getCurrentSeed() || 'random';
    
    return `${prefix}_${seed}_${timestamp}.${extension}`;
}

/**
 * Capture a high-resolution screenshot
 * @param {number} multiplier - Resolution multiplier (2 = 2x resolution)
 * @param {string} [filename] - Optional filename
 * @returns {boolean} - Success status
 */
export function captureHighResScreenshot(multiplier = 2, filename = null) {
    try {
        const renderer = state.getRenderer();
        const scene = state.getScene();
        const camera = state.getCamera();
        const composer = getPostProcessingComposer();
        const postProcessingSettings = getPostProcessingState();
        
        if (!renderer || !scene || !camera) {
            console.error('Cannot capture high-res screenshot: renderer, scene, or camera not available');
            eventBus.emit('status-update', 'High-res screenshot failed: required components not available');
            return false;
        }
        
        // Check if composer supports required methods
        const composerSupportsResize = composer && 
                                      typeof composer.setSize === 'function' && 
                                      typeof composer.setPixelRatio === 'function';
        
        // Use fallback method if composer doesn't support required methods
        if (!composerSupportsResize && postProcessingSettings && postProcessingSettings.enabled) {
            console.log('Using fallback high-res screenshot method (composer does not support resizing)');
            return captureHighResScreenshotFallback(multiplier, filename);
        }
        
        // Store original renderer size and pixel ratio
        const originalSize = {
            width: renderer.domElement.width,
            height: renderer.domElement.height,
            pixelRatio: renderer.getPixelRatio()
        };
        
        // Store original post-processing size
        let originalComposerSize = null;
        if (composer && composerSupportsResize) {
            try {
                originalComposerSize = {
                    width: composer.renderTarget1 ? composer.renderTarget1.width : null,
                    height: composer.renderTarget1 ? composer.renderTarget1.height : null
                };
            } catch (error) {
                console.warn('Could not store composer dimensions:', error);
            }
        }
        
        // Set higher resolution renderer
        renderer.setPixelRatio(originalSize.pixelRatio * multiplier);
        renderer.setSize(originalSize.width, originalSize.height);
        
        // Update composer if needed
        if (composer && postProcessingSettings && postProcessingSettings.enabled && composerSupportsResize) {
            try {
                // Resize composer to match new resolution
                composer.setSize(originalSize.width, originalSize.height);
                composer.setPixelRatio(originalSize.pixelRatio * multiplier);
            } catch (sizeError) {
                console.warn('Error adjusting composer size for high-res screenshot:', sizeError);
                // Continue without adjusting composer
            }
        }
        
        // Render the scene
        if (composer && postProcessingSettings && postProcessingSettings.enabled) {
            try {
                // Check if composer has render method before calling
                if (typeof composer.render === 'function') {
                    composer.render();
                } else {
                    console.warn('Composer object does not have render method in high-res mode, falling back to standard render');
                    renderer.render(scene, camera);
                }
            } catch (renderError) {
                console.warn('Error using composer render in high-res mode, falling back to standard render:', renderError);
                renderer.render(scene, camera);
            }
        } else {
            renderer.render(scene, camera);
        }
        
        // Get canvas data
        const dataURL = renderer.domElement.toDataURL('image/png');
        
        // Restore original size and pixel ratio
        renderer.setPixelRatio(originalSize.pixelRatio);
        renderer.setSize(originalSize.width, originalSize.height);
        
        // Restore composer if needed
        if (composer && originalComposerSize && composerSupportsResize) {
            try {
                composer.setSize(originalSize.width, originalSize.height);
                composer.setPixelRatio(originalSize.pixelRatio);
            } catch (restoreError) {
                console.warn('Error restoring composer size after high-res screenshot:', restoreError);
                // Continue without adjusting composer
            }
        }
        
        // Re-render at original size
        if (composer && postProcessingSettings && postProcessingSettings.enabled) {
            try {
                // Check if composer has render method before calling
                if (typeof composer.render === 'function') {
                    composer.render();
                } else {
                    console.warn('Composer object does not have render method when restoring, falling back to standard render');
                    renderer.render(scene, camera);
                }
            } catch (renderError) {
                console.warn('Error using composer render when restoring, falling back to standard render:', renderError);
                renderer.render(scene, camera);
            }
        } else {
            renderer.render(scene, camera);
        }
        
        // Create filename if not provided
        if (!filename) {
            filename = generateScreenshotFilename(`galaxy_${multiplier}x`);
        }
        
        // Use the file saving utility
        saveScreenshotFile(dataURL, filename);
        
        console.log(`High-res screenshot (${multiplier}x) saved as ${filename}`);
        eventBus.emit('status-update', `High-res screenshot (${multiplier}x) saved as ${filename}`);
        eventBus.emit('screenshot-captured', { filename, dataURL, highRes: true, multiplier });
        
        return true;
    } catch (error) {
        console.error('Error capturing high-res screenshot:', error);
        eventBus.emit('status-update', 'Error capturing high-res screenshot');
        eventBus.emit('error', { type: 'screenshot-hires', error });
        
        // Try fallback method as last resort
        console.log('Attempting fallback high-res screenshot method due to error');
        return captureHighResScreenshotFallback(multiplier, filename);
    }
}

/**
 * Handle the file saving operation with special fallback for iOS devices
 * @param {string} dataURL - The data URL of the image
 * @param {string} filename - The filename to save as
 */
function saveScreenshotFile(dataURL, filename) {
    // Create download link
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = filename;
    
    // Special case for iOS devices that don't support download attribute
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    if (iOS) {
        // For iOS devices, open in a new tab which user can save from
        window.open(dataURL, '_blank');
        eventBus.emit('status-update', `Screenshot ready. Please save the opened image.`);
    } else {
        // Normal download process
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

/**
 * Set up keyboard shortcut for screenshots
 */
export function setupScreenshotShortcuts() {
    window.addEventListener('keydown', (event) => {
        // Ignore if input elements are focused
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;
        
        // Normal screenshot: Shift+S
        if (event.key === 'C' && event.shiftKey && !event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            const filename = generateScreenshotFilename();
            captureScreenshot(filename);
        }
        
        // High-res screenshot: Ctrl+Shift+S or Cmd+Shift+S
        if (event.key === 'C' && event.shiftKey && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            const filename = generateScreenshotFilename(`galaxy_highres`);
            captureHighResScreenshot(2, filename);
        }
    });
    
    console.log('Screenshot keyboard shortcuts initialized');
    eventBus.emit('screenshot-shortcuts-initialized');
}

/**
 * Check if the browser supports automatic downloads
 * @returns {boolean} - Whether full download support is available
 */
function checkBrowserSupport() {
    // Check if download attribute is supported
    const isDownloadSupported = 'download' in document.createElement('a');
    
    if (!isDownloadSupported) {
        console.warn('Your browser may not support automatic downloads. ' +
                     'Screenshots will open in a new tab, from which you can save them manually.');
        
        eventBus.emit('status-update', 'Note: Your browser may require manual saving of screenshots');
    }
    
    return isDownloadSupported;
}

/**
 * Check if the renderer is using the EffectComposer for post-processing
 * @returns {boolean} - Whether post-processing is active and available
 */
function checkPostProcessingAvailability() {
    // Check if required files are available
    try {
        // Check if main post-processing module is available
        const hasEffectsJS = typeof window.updatePostProcessing === 'function';
        
        // Get current settings to see if it's enabled
        const settings = getPostProcessingState();
        const enabled = settings && settings.enabled;
        
        // Get composer to check if it's available
        const composer = getPostProcessingComposer();
        const hasComposer = composer && typeof composer === 'object';
        
        const available = hasEffectsJS && enabled && hasComposer;
        
        if (!available) {
            console.log('Post-processing not fully available for screenshots:',
                         { hasEffectsJS, enabled, hasComposer });
        }
        
        return available;
    } catch (e) {
        console.warn('Error checking post-processing availability:', e);
        return false;
    }
}

/**
 * Initialize the screenshot system
 */
export function initScreenshotSystem() {
    // Check browser support
    const fullSupport = checkBrowserSupport();
    
    // Make functions available globally for HTML buttons
    window.captureScreenshot = function() {
        const filename = generateScreenshotFilename();
        return captureScreenshot(filename);
    };
    
    window.captureHighResScreenshot = function() {
        const filename = generateScreenshotFilename(`galaxy_highres`);
        return captureHighResScreenshot(2, filename);
    };
    
    // Set up keyboard shortcuts
    setupScreenshotShortcuts();
    
    // Check post-processing availability
    const hasPostProcessing = checkPostProcessingAvailability();
    
    console.log('Screenshot system initialized:', {
        browserSupport: fullSupport ? 'full' : 'limited',
        postProcessing: hasPostProcessing ? 'available' : 'not available'
    });
    
    eventBus.emit('screenshot-system-initialized', { 
        fullSupport,
        hasPostProcessing
    });
    
    return fullSupport;
}

// Initialize the screenshot system when DOM is loaded
document.addEventListener('DOMContentLoaded', initScreenshotSystem);
