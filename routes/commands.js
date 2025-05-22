const express = require('express');
const { loadServicesConfig, saveServicesConfig } = require('../lib/servicesConfig');
const processManager = require('../lib/processManager');

const router = express.Router();

/**
 * Create a new command
 */
router.post('/', async (req, res) => {
    try {
        const config = await loadServicesConfig();
        const { id, ...commandData } = req.body;
        
        if (!id) {
            return res.status(400).json({ error: 'Command ID is required' });
        }
        
        if (config.commands[id]) {
            return res.status(409).json({ error: 'Command ID already exists' });
        }
        
        config.commands[id] = commandData;
        await saveServicesConfig(config);
        
        res.json({ message: 'Command created successfully', id });
    } catch (error) {
        console.error('Error creating command:', error);
        res.status(500).json({ error: 'Failed to create command' });
    }
});

/**
 * Update an existing command
 */
router.put('/:commandId', async (req, res) => {
    try {
        const { commandId } = req.params;
        const config = await loadServicesConfig();
        
        if (!config.commands[commandId]) {
            return res.status(404).json({ error: 'Command not found' });
        }
        
        config.commands[commandId] = { ...config.commands[commandId], ...req.body };
        await saveServicesConfig(config);
        
        res.json({ message: 'Command updated successfully' });
    } catch (error) {
        console.error('Error updating command:', error);
        res.status(500).json({ error: 'Failed to update command' });
    }
});

/**
 * Delete a command
 */
router.delete('/:commandId', async (req, res) => {
    try {
        const { commandId } = req.params;
        const config = await loadServicesConfig();
        
        if (!config.commands[commandId]) {
            return res.status(404).json({ error: 'Command not found' });
        }
        
        delete config.commands[commandId];
        await saveServicesConfig(config);
        
        res.json({ message: 'Command deleted successfully' });
    } catch (error) {
        console.error('Error deleting command:', error);
        res.status(500).json({ error: 'Failed to delete command' });
    }
});

/**
 * Execute a command
 */
router.post('/:commandId/execute', async (req, res) => {
    try {
        const { commandId } = req.params;
        const config = await loadServicesConfig();
        const command = config.commands[commandId];
        
        if (!command) {
            return res.status(404).json({ error: 'Command not found' });
        }
        
        // Generate unique execution ID
        const executionId = `${commandId}-${Date.now()}`;
        
        console.log(`Executing command ${commandId} with execution ID: ${executionId}`);
        console.log(`Command: ${command.command}`);
        console.log(`Working directory: ${command.workingDir || 'current directory'}`);
        
        // Execute the command - this will handle console output internally
        try {
            const result = await processManager.executeCommand(executionId, command.command, command.workingDir);
            res.json({ 
                message: `Command ${commandId} executed successfully`, 
                executionId, 
                result: typeof result === 'string' ? result.trim() : result 
            });
        } catch (error) {
            console.error(`Error executing command ${commandId}:`, error);
            res.status(500).json({ 
                error: `Command execution failed: ${error.message}`,
                executionId
            });
        }
    } catch (error) {
        console.error('Error in command execute endpoint:', error);
        res.status(500).json({ error: 'Internal server error during command execution' });
    }
});

module.exports = router;