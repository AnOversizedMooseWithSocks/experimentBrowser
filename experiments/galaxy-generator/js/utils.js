/**
 * Utility functions for Galaxy Generator
 * Contains reusable helper functions used across modules
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js';
import eventBus from './events.js';

/**
 * Generate random number with seeded RNG
 * @param {number|string} seed - Seed for random number generator
 * @returns {object} - Random number generator object
 */
export function createSeededRandom(seed) {
    // Convert string seed to number if needed
    let seedValue = typeof seed === 'string' ? 
        hashString(seed) : 
        seed;
    
    return {
        /**
         * Generate random number between 0 and 1
         * @returns {number} - Random number
         */
        random: function() {
            seedValue = (seedValue * 16807) % 2147483647;
            return (seedValue - 1) / 2147483646;
        },
        
        /**
         * Generate random number in range
         * @param {number} min - Minimum value
         * @param {number} max - Maximum value
         * @returns {number} - Random number in range
         */
        range: function(min, max) {
            return min + this.random() * (max - min);
        },
        
        /**
         * Generate random integer in range (inclusive)
         * @param {number} min - Minimum value
         * @param {number} max - Maximum value
         * @returns {number} - Random integer
         */
        int: function(min, max) {
            return Math.floor(this.range(min, max + 1));
        },
        
        /**
         * Choose random item from array
         * @param {Array} array - Array to choose from
         * @returns {*} - Random array item
         */
        choice: function(array) {
            return array[Math.floor(this.random() * array.length)];
        },
        
        /**
         * Shuffle array in random order
         * @param {Array} array - Array to shuffle
         * @returns {Array} - Shuffled array copy
         */
        shuffle: function(array) {
            const result = [...array];
            for (let i = result.length - 1; i > 0; i--) {
                const j = Math.floor(this.random() * (i + 1));
                [result[i], result[j]] = [result[j], result[i]];
            }
            return result;
        }
    };
}

/**
 * Hash a string to a number for seeding
 * @param {string} str - String to hash
 * @returns {number} - Hashed number
 */
export function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
}

/**
 * Format large number with commas
 * @param {number} num - Number to format
 * @returns {string} - Formatted number
 */
export function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Debounce function for performance-heavy operations
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

/**
 * Throttle function for limiting execution rate
 * @param {Function} func - Function to throttle
 * @param {number} limit - Minimum time between calls in milliseconds
 * @returns {Function} - Throttled function
 */
export function throttle(func, limit) {
    let lastCall = 0;
    return function(...args) {
        const now = Date.now();
        if (now - lastCall >= limit) {
            lastCall = now;
            func.apply(this, args);
        }
    };
}

/**
 * Deep clone an object (better than JSON method for handling special types)
 * @param {*} obj - Object to clone
 * @returns {*} - Cloned object
 */
export function deepClone(obj) {
    // Handle simple types
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    
    // Handle Date
    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }
    
    // Handle Array
    if (Array.isArray(obj)) {
        return obj.map(item => deepClone(item));
    }
    
    // Handle THREE.js objects
    if (obj instanceof THREE.Vector3) {
        return new THREE.Vector3().copy(obj);
    }
    
    if (obj instanceof THREE.Color) {
        return new THREE.Color().copy(obj);
    }
    
    // Handle Object
    const result = {};
    Object.keys(obj).forEach(key => {
        result[key] = deepClone(obj[key]);
    });
    
    return result;
}

/**
 * Make sure a value stays within specified limits
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} - Clamped value
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation between two values
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} - Interpolated value
 */
export function lerp(a, b, t) {
    return a + (b - a) * clamp(t, 0, 1);
}

/**
 * Convert RGB values to hexadecimal color
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {number} - Hex color value
 */
export function rgbToHex(r, g, b) {
    return (r << 16) + (g << 8) + b;
}

/**
 * Convert hexadecimal color to RGB object
 * @param {number} hex - Hexadecimal color
 * @returns {object} - RGB values
 */
export function hexToRgb(hex) {
    return {
        r: (hex >> 16) & 255,
        g: (hex >> 8) & 255,
        b: hex & 255
    };
}

/**
 * Get distance between two 3D points
 * @param {object} p1 - First point {x,y,z}
 * @param {object} p2 - Second point {x,y,z}
 * @returns {number} - Distance
 */
export function distance3D(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dz = p2.z - p1.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Apply a function to all scene objects that match criteria
 * @param {THREE.Scene} scene - Scene to traverse
 * @param {Function} predicate - Function to test objects
 * @param {Function} action - Function to apply to matching objects
 */
export function traverseSceneObjects(scene, predicate, action) {
    if (!scene) return;
    
    scene.children.forEach(child => {
        if (predicate(child)) {
            action(child);
        }
        
        // Recursive traversal
        if (child.children && child.children.length > 0) {
            traverseSceneObjects(child, predicate, action);
        }
    });
}

/**
 * Log performance of a function
 * @param {Function} fn - Function to measure
 * @param {string} name - Name for logging
 * @returns {Function} - Wrapped function
 */
export function measurePerformance(fn, name) {
    return function(...args) {
        const start = performance.now();
        const result = fn.apply(this, args);
        const end = performance.now();
        console.log(`${name || fn.name} took ${(end - start).toFixed(2)}ms`);
        return result;
    };
}

/**
 * Check if WebGL is supported and which version
 * @returns {object} - WebGL support information
 */
export function checkWebGLSupport() {
    try {
        // Try WebGL 2 first
        const canvas = document.createElement('canvas');
        const gl2 = canvas.getContext('webgl2');
        
        if (gl2) {
            return { supported: true, version: 2, context: gl2 };
        }
        
        // Fall back to WebGL 1
        const gl1 = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (gl1) {
            return { supported: true, version: 1, context: gl1 };
        }
        
        return { supported: false, version: 0, context: null };
    } catch (e) {
        console.error('Error checking WebGL support:', e);
        return { supported: false, version: 0, error: e.message };
    }
}

/**
 * Check for advanced rendering features support
 * @param {WebGLRenderingContext} gl - WebGL context
 * @returns {object} - Feature support information
 */
export function checkAdvancedFeatureSupport(gl) {
    if (!gl) return { floatTextures: false, instancedArrays: false };
    
    return {
        floatTextures: !!gl.getExtension('OES_texture_float') || 
                      !!gl.getExtension('EXT_color_buffer_float'),
        instancedArrays: !!gl.getExtension('ANGLE_instanced_arrays') ||
                        gl instanceof WebGL2RenderingContext,
        anisotropicFiltering: !!gl.getExtension('EXT_texture_filter_anisotropic'),
        shaderTextureLOD: !!gl.getExtension('EXT_shader_texture_lod')
    };
}
