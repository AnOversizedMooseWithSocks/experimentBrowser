/**
 * API communication module for Galaxy Generator
 * Handles all server communication using ES Modules and EventBus
 */
import { CONFIG_PATH, STATUS_MESSAGES } from './config.js';
import eventBus from './events.js';
import * as state from './state.js';

// Module-private state
let serverConfig = null;
let apiBaseUrl = '';

/**
 * Load server configuration from config file
 * This allows the frontend to automatically detect which port the server is running on
 * @returns {Promise<Object|null>} Server configuration or null on error
 */
export async function loadServerConfig() {
    try {
        const response = await fetch(CONFIG_PATH);
        if (response.ok) {
            const config = await response.json();
            const apiUrl = config.apiBaseUrl || `http://localhost:${config.serverPort}/api`;
            
            // Store in state
            state.setServerConfig(config);
            state.setApiBaseUrl(apiUrl);
            
            console.log('✅ Server config loaded:', config);
            
            // Emit events instead of modifying global state
            eventBus.emit('status-update', `Connected to server on port ${config.serverPort}`);
            eventBus.emit('server-config-loaded', config);
            
            return config;
        } else {
            throw new Error('Config file not found');
        }
    } catch (error) {
        console.error('❌ Error loading server config:', error);
        eventBus.emit('status-update', STATUS_MESSAGES.ERROR_CONFIG);
        eventBus.emit('error', { type: 'config', error });
        throw error;
    }
}

/**
 * Generic API call function to reduce code duplication
 * @param {string} endpoint - The API endpoint to call
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {Object} data - Data to send in request body (for POST/PUT)
 * @returns {Promise<Object|null>} - Response data or null on error
 */
export async function apiCall(endpoint, method = 'GET', data = null) {
    try {
        const apiBaseUrl = state.getApiBaseUrl();
        if (!apiBaseUrl) {
            throw new Error('API base URL not set. Make sure server configuration is loaded.');
        }
        
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(`${apiBaseUrl}${endpoint}`, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        eventBus.emit('status-update', 'Server communication error');
        eventBus.emit('error', { type: 'api', endpoint, error });
        return null;
    }
}

/**
 * Generate galaxy data from the server
 * @param {string} seed - The seed string for galaxy generation
 * @returns {Promise<Object|null>} - Galaxy data object or null on error
 */
export async function fetchGalaxyData(seed) {
    try {
        const apiBaseUrl = state.getApiBaseUrl();
        if (!apiBaseUrl) {
            throw new Error('API base URL not set. Make sure server configuration is loaded.');
        }
        
        const response = await fetch(`${apiBaseUrl}/galaxy/${seed}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const galaxyData = await response.json();
        eventBus.emit('galaxy-data-loaded', { seed, galaxyData });
        return galaxyData;
    } catch (error) {
        console.error('Error generating galaxy:', error);
        eventBus.emit('status-update', STATUS_MESSAGES.ERROR_GENERATE);
        eventBus.emit('error', { type: 'galaxy-generation', error });
        return null;
    }
}

// Favorites Management API Functions

/**
 * Toggle favorite status for a galaxy
 * @param {string} seed - Galaxy seed
 * @param {string} name - Custom name for the galaxy (optional)
 * @returns {Promise<Object|null>} - Response object with message
 */
export async function toggleFavoriteAPI(seed, name) {
    const result = await apiCall('/favorites', 'POST', { seed, name });
    if (result) {
        eventBus.emit('favorite-toggled', result);
    }
    return result;
}

/**
 * Check if a galaxy is in favorites
 * @param {string} seed - Galaxy seed to check
 * @returns {Promise<Object|null>} - Object with isFavorite boolean
 */
export async function checkFavoriteStatus(seed) {
    const result = await apiCall(`/favorites/${seed}`);
    if (result) {
        eventBus.emit('favorite-status-updated', result);
    }
    return result;
}

/**
 * Get all favorites with metadata
 * @returns {Promise<Object|null>} - Object containing favorites array
 */
export async function getAllFavorites() {
    const result = await apiCall('/favorites');
    if (result) {
        eventBus.emit('favorites-loaded', result);
    }
    return result;
}

// Ratings Management API Functions

/**
 * Set or update rating for a galaxy
 * @param {string} seed - Galaxy seed
 * @param {number} rating - Rating value (1-5)
 * @returns {Promise<Object|null>} - Response object with message
 */
export async function setRatingAPI(seed, rating) {
    const result = await apiCall('/ratings', 'POST', { seed, rating });
    if (result) {
        eventBus.emit('rating-updated', { seed, rating, result });
    }
    return result;
}

/**
 * Get rating for a specific galaxy
 * @param {string} seed - Galaxy seed
 * @returns {Promise<Object|null>} - Object with rating value
 */
export async function getRating(seed) {
    const result = await apiCall(`/ratings/${seed}`);
    if (result) {
        eventBus.emit('rating-loaded', result);
    }
    return result;
}

/**
 * Get all ratings with statistics
 * @returns {Promise<Object|null>} - Object with ratings and statistics
 */
export async function getAllRatings() {
    const result = await apiCall('/ratings');
    if (result) {
        eventBus.emit('ratings-loaded', result);
    }
    return result;
}

/**
 * Health check endpoint
 * @returns {Promise<Object|null>} - Server status object
 */
export async function checkServerHealth() {
    const result = await apiCall('/health');
    if (result) {
        eventBus.emit('server-health-checked', result);
    }
    return result;
}

/**
 * Get the current server configuration
 * @returns {Object|null} - Current server configuration
 */
export function getServerConfig() {
    return state.getServerConfig();
}

/**
 * Get the current API base URL
 * @returns {string} - Current API base URL
 */
export function getApiBaseUrl() {
    return state.getApiBaseUrl();
}
