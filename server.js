const express = require('express');
const path = require('path');

// Import route modules
const experimentRoutes = require('./routes/experiments');
const serviceRoutes = require('./routes/services');
const commandRoutes = require('./routes/commands');
const workflowRoutes = require('./routes/workflows');
const consoleRoutes = require('./routes/console');

// Import utility modules
const experimentManager = require('./lib/experimentManager');

const app = express();
const PORT = 7890;

// Middleware to parse JSON and serve static files
app.use(express.json());
app.use(express.static('public'));

// Mount API routes
app.use('/api/experiments', experimentRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/commands', commandRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/console', consoleRoutes);

// Serve experiment assets
app.use('/experiments', express.static(experimentManager.EXPERIMENTS_DIR));

/**
 * Initialize directories and start the server
 */
async function startServer() {
    try {
        // Initialize experiments directory
        await experimentManager.initializeDirectories();
        
        // Start the server
        app.listen(PORT, () => {
            console.log(`Experiment Browser running on http://localhost:${PORT}`);
            console.log(`Experiments directory: ${path.resolve(experimentManager.EXPERIMENTS_DIR)}`);
        });
    } catch (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();