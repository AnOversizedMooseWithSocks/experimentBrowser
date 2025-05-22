const express = require('express');
const consoleManager = require('../lib/consoleManager');
const processManager = require('../lib/processManager');

const router = express.Router();

/**
 * Server-Sent Events endpoint for real-time console output
 * This must come FIRST before the parameterized routes
 */
router.get('/stream', (req, res) => {
    try {
        // Set SSE headers
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control'
        });
        
        // Add this connection to the console manager
        consoleManager.addSSEConnection(res);
        
        console.log('New console stream connection established');
    } catch (error) {
        console.error('Error setting up console stream:', error);
        res.status(500).json({ error: 'Failed to establish console stream' });
    }
});

/**
 * Get console output for a specific process
 */
router.get('/:processId', (req, res) => {
    try {
        const { processId } = req.params;
        const output = consoleManager.getProcessOutput(processId);
        
        if (!output) {
            return res.status(404).json({ error: 'Process output not found' });
        }
        
        res.json({
            processId,
            type: consoleManager.getProcessType(processId),
            status: output.status,
            output: output.timestamps, // All messages with timestamps
            isRunning: processManager.isServiceRunning(processId)
        });
    } catch (error) {
        console.error('Error getting console output:', error);
        res.status(500).json({ error: 'Failed to get console output' });
    }
});

/**
 * Get list of all processes with console output
 */
router.get('/', (req, res) => {
    try {
        const processes = consoleManager.getAllProcesses();
        
        // Add running status from process manager
        const processesWithStatus = processes.map(proc => ({
            ...proc,
            isRunning: processManager.isServiceRunning(proc.processId)
        }));
        
        res.json(processesWithStatus);
    } catch (error) {
        console.error('Error getting console processes:', error);
        res.status(500).json({ error: 'Failed to get console processes' });
    }
});

/**
 * Clear console output for a specific process
 */
router.delete('/:processId', (req, res) => {
    try {
        const { processId } = req.params;
        const success = consoleManager.clearConsoleOutput(processId);
        
        if (success) {
            res.json({ message: 'Console cleared successfully' });
        } else {
            res.status(404).json({ error: 'Process output not found' });
        }
    } catch (error) {
        console.error('Error clearing console output:', error);
        res.status(500).json({ error: 'Failed to clear console output' });
    }
});

module.exports = router;