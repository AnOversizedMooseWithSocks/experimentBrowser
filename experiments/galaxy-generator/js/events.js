/**
 * Event system for Galaxy Generator
 * Provides a centralized event bus for cross-module communication
 */

class EventEmitter {
    constructor() {
        this.events = {};
    }

    /**
     * Register an event handler
     * @param {string} eventName - Name of the event to listen for
     * @param {Function} callback - Function to call when event is emitted
     * @returns {EventEmitter} - Returns this for chaining
     */
    on(eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(callback);
        return this; // For chaining
    }

    /**
     * Remove an event handler
     * @param {string} eventName - Name of the event to remove
     * @param {Function} [callback] - Specific callback to remove, or all if not provided
     * @returns {EventEmitter} - Returns this for chaining
     */
    off(eventName, callback) {
        if (!this.events[eventName]) return this;
        
        if (!callback) {
            delete this.events[eventName];
        } else {
            this.events[eventName] = this.events[eventName].filter(
                cb => cb !== callback
            );
        }
        return this;
    }

    /**
     * Emit an event
     * @param {string} eventName - Name of the event to emit
     * @param {...any} args - Arguments to pass to event handlers
     * @returns {boolean} - Whether any handlers were called
     */
    emit(eventName, ...args) {
        if (!this.events[eventName]) return false;
        
        try {
            this.events[eventName].forEach(callback => {
                callback(...args);
            });
        } catch (error) {
            console.error(`Error in event handler for ${eventName}:`, error);
            // Rethrow to let calling code decide how to handle it
            throw error;
        }
        
        return true;
    }

    /**
     * Emit an event after a debounce period
     * @param {string} eventName - Name of the event to emit
     * @param {number} delay - Delay in milliseconds
     * @param {...any} args - Arguments to pass to event handlers
     */
    debounceEmit(eventName, delay, ...args) {
        if (this._debounceTimers && this._debounceTimers[eventName]) {
            clearTimeout(this._debounceTimers[eventName]);
        }
        
        if (!this._debounceTimers) this._debounceTimers = {};
        
        this._debounceTimers[eventName] = setTimeout(() => {
            this.emit(eventName, ...args);
            delete this._debounceTimers[eventName];
        }, delay);
    }

    /**
     * Listen for an event once
     * @param {string} eventName - Name of the event to listen for
     * @param {Function} callback - Function to call when event is emitted
     * @returns {EventEmitter} - Returns this for chaining
     */
    once(eventName, callback) {
        const onceWrapper = (...args) => {
            callback(...args);
            this.off(eventName, onceWrapper);
        };
        return this.on(eventName, onceWrapper);
    }

    /**
     * Clear all event listeners
     */
    clear() {
        this.events = {};
        if (this._debounceTimers) {
            Object.values(this._debounceTimers).forEach(timer => clearTimeout(timer));
            this._debounceTimers = {};
        }
    }
}

// Create and export a singleton instance
const eventBus = new EventEmitter();
export default eventBus;