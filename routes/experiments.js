const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const experimentManager = require('../lib/experimentManager');

const router = express.Router();

/**
 * Get list of all experiments
 */
router.get('/', async (req, res) => {
    try {
        const experiments = await experimentManager.scanExperiments();
        res.json(experiments);
    } catch (error) {
        console.error('Error getting experiments:', error);
        res.status(500).json({ error: 'Failed to load experiments' });
    }
});

/**
 * Get specific experiment metadata
 */
router.get('/:folder/metadata', async (req, res) => {
    try {
        const { folder } = req.params;
        const metadataPath = path.join(experimentManager.EXPERIMENTS_DIR, folder, 'metadata.json');
        const content = await fs.readFile(metadataPath, 'utf8');
        const metadata = JSON.parse(content);
        res.json(metadata);
    } catch (error) {
        console.error('Error getting experiment metadata:', error);
        res.status(404).json({ error: 'Metadata not found' });
    }
});

/**
 * Update experiment metadata
 */
router.put('/:folder/metadata', async (req, res) => {
    try {
        const { folder } = req.params;
        const metadataPath = path.join(experimentManager.EXPERIMENTS_DIR, folder, 'metadata.json');
        
        // Validate the incoming data
        const metadata = req.body;
        if (!metadata.name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        
        await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
        res.json({ message: 'Metadata updated successfully' });
    } catch (error) {
        console.error('Error updating metadata:', error);
        res.status(500).json({ error: 'Failed to update metadata' });
    }
});

/**
 * Get documentation files for an experiment
 */
router.get('/:folder/documentation', async (req, res) => {
    try {
        const { folder } = req.params;
        const experimentPath = path.join(experimentManager.EXPERIMENTS_DIR, folder);
        
        // Check if experiment directory exists
        try {
            await fs.access(experimentPath);
        } catch (error) {
            return res.status(404).json({ error: 'Experiment not found' });
        }
        
        // Get all files in the experiment directory
        const files = await fs.readdir(experimentPath);
        
        // Filter for documentation files
        const docFiles = [];
        
        for (const file of files) {
            const filePath = path.join(experimentPath, file);
            const stat = await fs.stat(filePath);
            
            // Skip directories
            if (stat.isDirectory()) continue;
            
            const lowerFile = file.toLowerCase();
            
            // Check for readme files or .md files
            if (lowerFile === 'readme' || 
                lowerFile === 'readme.txt' || 
                lowerFile === 'readme.md' || 
                lowerFile.endsWith('.md')) {
                
                docFiles.push({
                    name: file,
                    filename: file,
                    isMarkdown: lowerFile.endsWith('.md'),
                    size: stat.size,
                    modified: stat.mtime
                });
            }
        }
        
        // Sort by name, with readme files first
        docFiles.sort((a, b) => {
            const aIsReadme = a.name.toLowerCase().startsWith('readme');
            const bIsReadme = b.name.toLowerCase().startsWith('readme');
            
            if (aIsReadme && !bIsReadme) return -1;
            if (!aIsReadme && bIsReadme) return 1;
            
            return a.name.localeCompare(b.name);
        });
        
        res.json(docFiles);
    } catch (error) {
        console.error('Error getting documentation:', error);
        res.status(500).json({ error: 'Failed to load documentation' });
    }
});

/**
 * Get specific documentation file content
 */
router.get('/:folder/documentation/:filename', async (req, res) => {
    try {
        const { folder, filename } = req.params;
        const filePath = path.join(experimentManager.EXPERIMENTS_DIR, folder, filename);
        
        // Security check: ensure the file is within the experiment directory
        const experimentPath = path.join(experimentManager.EXPERIMENTS_DIR, folder);
        const resolvedPath = path.resolve(filePath);
        const resolvedExperimentPath = path.resolve(experimentPath);
        
        if (!resolvedPath.startsWith(resolvedExperimentPath)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        // Check if file exists
        try {
            await fs.access(filePath);
        } catch (error) {
            return res.status(404).json({ error: 'Documentation file not found' });
        }
        
        // Read and return the file content
        const content = await fs.readFile(filePath, 'utf8');
        res.type('text/plain').send(content);
        
    } catch (error) {
        console.error('Error getting documentation file:', error);
        res.status(500).json({ error: 'Failed to load documentation file' });
    }
});

/**
 * Get specific experiment HTML content
 */
router.get('/:folder/html', async (req, res) => {
    try {
        const { folder } = req.params;
        const experimentPath = path.join(experimentManager.EXPERIMENTS_DIR, folder);
        const htmlFile = await experimentManager.findHtmlFile(experimentPath);
        
        if (!htmlFile) {
            return res.status(404).json({ error: 'No HTML file found' });
        }
        
        const htmlPath = path.join(experimentPath, htmlFile);
        const content = await fs.readFile(htmlPath, 'utf8');
        res.send(content);
    } catch (error) {
        console.error('Error getting experiment HTML:', error);
        res.status(404).json({ error: 'Experiment not found' });
    }
});

/**
 * Get project README file
 */
router.get('/project/readme', async (req, res) => {
    try {
        const readmePath = path.join(process.cwd(), 'README.md');
        
        // Check if readme file exists
        try {
            await fs.access(readmePath);
        } catch (error) {
            return res.status(404).json({ error: 'README file not found' });
        }
        
        // Read and return the file content
        const content = await fs.readFile(readmePath, 'utf8');
        res.type('text/plain').send(content);
        
    } catch (error) {
        console.error('Error getting README file:', error);
        res.status(500).json({ error: 'Failed to load README file' });
    }
});

module.exports = router;