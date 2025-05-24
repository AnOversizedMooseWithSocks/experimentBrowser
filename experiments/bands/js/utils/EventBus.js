// EventBus.js - Simple event system for module communication
// This allows different parts of the app to communicate without direct dependencies

export class EventBus {
    constructor() {
        // Store event listeners by event name
        this.events = {};
    }
    
    /**
     * Subscribe to an event
     * @param {string} eventName - Name of the event
     * @param {Function} callback - Function to call when event fires
     * @returns {Function} Unsubscribe function
     */
    on(eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        
        this.events[eventName].push(callback);
        
        // Return unsubscribe function
        return () => {
            this.off(eventName, callback);
        };
    }
    
    /**
     * Unsubscribe from an event
     * @param {string} eventName - Name of the event
     * @param {Function} callback - Function to remove
     */
    off(eventName, callback) {
        if (!this.events[eventName]) return;
        
        const index = this.events[eventName].indexOf(callback);
        if (index !== -1) {
            this.events[eventName].splice(index, 1);
        }
    }
    
    /**
     * Emit an event with optional data
     * @param {string} eventName - Name of the event
     * @param {*} data - Data to pass to listeners
     */
    emit(eventName, data) {
        if (!this.events[eventName]) return;
        
        // Call all listeners for this event
        this.events[eventName].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event listener for ${eventName}:`, error);
            }
        });
    }
    
    /**
     * Clear all listeners for an event or all events
     * @param {string} [eventName] - Optional event name to clear
     */
    clear(eventName) {
        if (eventName) {
            delete this.events[eventName];
        } else {
            this.events = {};
        }
    }
}