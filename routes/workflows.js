const express = require('express');
const { loadServicesConfig, saveServicesConfig } = require('../lib/servicesConfig');
const processManager = require('../lib/processManager');

const router = express.Router();

/**
 * Create a new workflow
 */
router.post('/', async (req, res) => {
    try {
        const config = await loadServicesConfig();
        const { id, ...workflowData } = req.body;
        
        if (!id) {
            return res.status(400).json({ error: 'Workflow ID is required' });
        }
        
        if (config.workflows[id]) {
            return res.status(409).json({ error: 'Workflow ID already exists' });
        }
        
        config.workflows[id] = workflowData;
        await saveServicesConfig(config);
        
        res.json({ message: 'Workflow created successfully', id });
    } catch (error) {
        console.error('Error creating workflow:', error);
        res.status(500).json({ error: 'Failed to create workflow' });
    }
});

/**
 * Update an existing workflow
 */
router.put('/:workflowId', async (req, res) => {
    try {
        const { workflowId } = req.params;
        const config = await loadServicesConfig();
        
        if (!config.workflows[workflowId]) {
            return res.status(404).json({ error: 'Workflow not found' });
        }
        
        config.workflows[workflowId] = { ...config.workflows[workflowId], ...req.body };
        await saveServicesConfig(config);
        
        res.json({ message: 'Workflow updated successfully' });
    } catch (error) {
        console.error('Error updating workflow:', error);
        res.status(500).json({ error: 'Failed to update workflow' });
    }
});

/**
 * Delete a workflow
 */
router.delete('/:workflowId', async (req, res) => {
    try {
        const { workflowId } = req.params;
        const config = await loadServicesConfig();
        
        if (!config.workflows[workflowId]) {
            return res.status(404).json({ error: 'Workflow not found' });
        }
        
        delete config.workflows[workflowId];
        await saveServicesConfig(config);
        
        res.json({ message: 'Workflow deleted successfully' });
    } catch (error) {
        console.error('Error deleting workflow:', error);
        res.status(500).json({ error: 'Failed to delete workflow' });
    }
});

/**
 * Execute a workflow
 */
router.post('/:workflowId/execute', async (req, res) => {
    try {
        const { workflowId } = req.params;
        const config = await loadServicesConfig();
        const workflow = config.workflows[workflowId];
        
        if (!workflow) {
            return res.status(404).json({ error: 'Workflow not found' });
        }
        
        const results = await processManager.executeWorkflow(workflowId, workflow);
        res.json({ message: `Workflow ${workflowId} executed successfully`, results });
    } catch (error) {
        console.error('Error executing workflow:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;