const fs = require('fs').promises;

const SERVICES_CONFIG = './services.json';

/**
 * Load services configuration
 * Enhanced to support workflows, commands, and service types
 */
async function loadServicesConfig() {
    try {
        const content = await fs.readFile(SERVICES_CONFIG, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        // Return default empty services config if file doesn't exist
        console.log('No services config found, creating default');
        const defaultConfig = { 
            services: {},
            commands: {}, // Support for one-time commands
            workflows: {} // Support for multi-step workflows
        };
        await fs.writeFile(SERVICES_CONFIG, JSON.stringify(defaultConfig, null, 2));
        return defaultConfig;
    }
}

/**
 * Save services configuration
 */
async function saveServicesConfig(config) {
    await fs.writeFile(SERVICES_CONFIG, JSON.stringify(config, null, 2));
}

module.exports = {
    SERVICES_CONFIG,
    loadServicesConfig,
    saveServicesConfig
};