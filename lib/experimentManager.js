const fs = require('fs').promises;
const path = require('path');

const EXPERIMENTS_DIR = './experiments';

/**
 * Find the main HTML file in an experiment directory
 * Looks for index.html first, then any .html file
 */
async function findHtmlFile(experimentPath) {
    try {
        // First try index.html
        await fs.access(path.join(experimentPath, 'index.html'));
        return 'index.html';
    } catch {
        // If index.html doesn't exist, find any .html file
        const files = await fs.readdir(experimentPath);
        const htmlFile = files.find(file => file.endsWith('.html'));
        return htmlFile || null;
    }
}

/**
 * Create default metadata for an experiment folder
 */
function createDefaultMetadata(folderName) {
    // Convert folder name to a readable experiment name
    const name = folderName
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase());
    
    return {
        name,
        description: `Experiment: ${name}`,
        tags: [],
        rating: 0,
        relatedExperiments: [],
        dependencies: [] // Service/workflow dependencies
    };
}

/**
 * Scan the experiments directory and return metadata for each experiment
 * Creates metadata.json if it doesn't exist
 */
async function scanExperiments() {
    try {
        const experiments = [];
        
        // Ensure experiments directory exists
        try {
            await fs.access(EXPERIMENTS_DIR);
        } catch {
            await fs.mkdir(EXPERIMENTS_DIR, { recursive: true });
        }
        
        const entries = await fs.readdir(EXPERIMENTS_DIR, { withFileTypes: true });
        
        for (const entry of entries) {
            if (entry.isDirectory()) {
                const experimentPath = path.join(EXPERIMENTS_DIR, entry.name);
                const metadataPath = path.join(experimentPath, 'metadata.json');
                
                let metadata;
                try {
                    // Try to read existing metadata
                    const metadataContent = await fs.readFile(metadataPath, 'utf8');
                    metadata = JSON.parse(metadataContent);
                } catch (error) {
                    // Create default metadata if file doesn't exist
                    console.log(`Creating metadata for ${entry.name}`);
                    metadata = createDefaultMetadata(entry.name);
                    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
                }
                
                // Find the HTML file
                const htmlFile = await findHtmlFile(experimentPath);
                
                if (htmlFile) {
                    metadata.folder = entry.name;
                    metadata.htmlFile = htmlFile;
                    experiments.push(metadata);
                } else {
                    console.log(`Skipping ${entry.name}: No HTML file found`);
                }
            }
        }
        
        return experiments;
    } catch (error) {
        console.error('Error scanning experiments:', error);
        return [];
    }
}

/**
 * Create the experiments directory with a sample experiment if it doesn't exist
 */
async function initializeDirectories() {
    try {
        await fs.access(EXPERIMENTS_DIR);
    } catch {
        console.log('Creating experiments directory...');
        await fs.mkdir(EXPERIMENTS_DIR, { recursive: true });
        
        // Create a sample experiment
        const sampleDir = path.join(EXPERIMENTS_DIR, 'sample-experiment');
        await fs.mkdir(sampleDir, { recursive: true });
        
        const sampleMetadata = {
            name: "Sample Experiment",
            description: "A simple example experiment to show how the browser works",
            tags: ["sample", "demo"],
            rating: 5,
            relatedExperiments: [],
            dependencies: ["webpack-dev"] // Example dependency
        };
        
        const sampleHtml = `<!DOCTYPE html>
<html>
<head>
    <title>Sample Experiment</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .box { background: #f0f0f0; padding: 20px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="box">
        <h1>Sample Experiment</h1>
        <p>This is a sample experiment to demonstrate the experiment browser.</p>
        <button onclick="alert('Hello from the experiment!')">Click Me</button>
    </div>
</body>
</html>`;
        
        await fs.writeFile(path.join(sampleDir, 'metadata.json'), JSON.stringify(sampleMetadata, null, 2));
        await fs.writeFile(path.join(sampleDir, 'index.html'), sampleHtml);
    }
}

module.exports = {
    EXPERIMENTS_DIR,
    findHtmlFile,
    createDefaultMetadata,
    scanExperiments,
    initializeDirectories
};