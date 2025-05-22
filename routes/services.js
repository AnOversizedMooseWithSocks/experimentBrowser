const express = require('express');
const { loadServicesConfig, saveServicesConfig } = require('../lib/servicesConfig');
const processManager = require('../lib/processManager');

const router = express.Router();

/**
 * Get services, commands, and workflows configuration
 */
router.get('/', async (req, res) => {
    try {
        const config = await loadServicesConfig();
        
        // Add status information for services
        const servicesWithStatus = {};
        for (const [serviceId, service] of Object.entries(config.services || {})) {
            servicesWithStatus[serviceId] = {
                ...service,
                isRunning: processManager.isServiceRunning(serviceId),
                type: 'service'
            };
        }
        
        // Add commands information
        const commandsWithStatus = {};
        for (const [commandId, command] of Object.entries(config.commands || {})) {
            commandsWithStatus[commandId] = {
                ...command,
                type: 'command'
            };
        }
        
        // Add workflow information
        const workflowsWithStatus = {};
        for (const [workflowId, workflow] of Object.entries(config.workflows || {})) {
            workflowsWithStatus[workflowId] = {
                ...workflow,
                type: 'workflow'
            };
        }
        
        res.json({ 
            services: servicesWithStatus,
            commands: commandsWithStatus,
            workflows: workflowsWithStatus
        });
    } catch (error) {
        console.error('Error getting services:', error);
        res.status(500).json({ error: 'Failed to load services' });
    }
});

/**
 * Create a new service
 */
router.post('/', async (req, res) => {
    try {
        const config = await loadServicesConfig();
        const { id, ...serviceData } = req.body;
        
        if (!id) {
            return res.status(400).json({ error: 'Service ID is required' });
        }
        
        if (config.services[id]) {
            return res.status(409).json({ error: 'Service ID already exists' });
        }
        
        config.services[id] = serviceData;
        await saveServicesConfig(config);
        
        res.json({ message: 'Service created successfully', id });
    } catch (error) {
        console.error('Error creating service:', error);
        res.status(500).json({ error: 'Failed to create service' });
    }
});

/**
 * Update an existing service
 */
router.put('/:serviceId', async (req, res) => {
    try {
        const { serviceId } = req.params;
        const config = await loadServicesConfig();
        
        if (!config.services[serviceId]) {
            return res.status(404).json({ error: 'Service not found' });
        }
        
        config.services[serviceId] = { ...config.services[serviceId], ...req.body };
        await saveServicesConfig(config);
        
        res.json({ message: 'Service updated successfully' });
    } catch (error) {
        console.error('Error updating service:', error);
        res.status(500).json({ error: 'Failed to update service' });
    }
});

/**
 * Delete a service
 */
router.delete('/:serviceId', async (req, res) => {
    try {
        const { serviceId } = req.params;
        const config = await loadServicesConfig();
        
        if (!config.services[serviceId]) {
            return res.status(404).json({ error: 'Service not found' });
        }
        
        // Stop service if running
        if (processManager.isServiceRunning(serviceId)) {
            processManager.stopService(serviceId);
        }
        
        delete config.services[serviceId];
        await saveServicesConfig(config);
        
        res.json({ message: 'Service deleted successfully' });
    } catch (error) {
        console.error('Error deleting service:', error);
        res.status(500).json({ error: 'Failed to delete service' });
    }
});

/**
 * Start a service
 */
router.post('/:serviceId/start', async (req, res) => {
    try {
        const { serviceId } = req.params;
        const config = await loadServicesConfig();
        const service = config.services[serviceId];
        
        if (!service) {
            return res.status(404).json({ error: 'Service not found' });
        }
        
        if (processManager.isServiceRunning(serviceId)) {
            return res.json({ message: `Service ${serviceId} is already running` });
        }
        
        const message = await processManager.startService(serviceId, service);
        res.json({ message });
    } catch (error) {
        console.error('Error starting service:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Stop a service
 */
router.post('/:serviceId/stop', (req, res) => {
    try {
        const { serviceId } = req.params;
        const message = processManager.stopService(serviceId);
        res.json({ message });
    } catch (error) {
        console.error('Error stopping service:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;