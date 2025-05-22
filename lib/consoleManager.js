// Store process outputs and SSE connections
const processOutputs = new Map(); // Store console output for each process
const processTypes = new Map(); // Track if process is a service, command, or workflow
const sseConnections = new Set(); // Store active SSE connections

/**
 * Initialize console output tracking for a process
 */
function initializeConsoleOutput(processId) {
    if (!processOutputs.has(processId)) {
        processOutputs.set(processId, {
            stdout: [],
            stderr: [],
            timestamps: [],
            status: 'running'
        });
        console.log(`Initialized console output tracking for process: ${processId}`);
    }
}

/**
 * Set the type of a process (service, command, workflow)
 */
function setProcessType(processId, type) {
    processTypes.set(processId, type);
    console.log(`Set process type for ${processId}: ${type}`);
}

/**
 * Get process output for a specific process
 */
function getProcessOutput(processId) {
    return processOutputs.get(processId);
}

/**
 * Get process type for a specific process
 */
function getProcessType(processId) {
    return processTypes.get(processId) || 'unknown';
}

/**
 * Add output to process console log
 */
function addConsoleOutput(processId, type, data) {
    const output = processOutputs.get(processId);
    if (!output) {
        console.warn(`No console output tracker found for process: ${processId}`);
        return;
    }
    
    const timestamp = new Date().toISOString();
    const message = {
        type,
        data: data.toString(),
        timestamp
    };
    
    if (type === 'stdout') {
        output.stdout.push(message);
    } else if (type === 'stderr') {
        output.stderr.push(message);
    }
    
    output.timestamps.push(message);
    
    // Log to console for debugging
    console.log(`[${processId}] ${type}: ${data.toString().trim()}`);
    
    // Broadcast to active console viewers
    broadcastConsoleUpdate(processId, message);
}

/**
 * Broadcast console update to all active SSE connections
 */
function broadcastConsoleUpdate(processId, message) {
    const eventData = JSON.stringify({
        processId,
        message
    });
    
    // Track how many connections received the message
    let successCount = 0;
    let errorCount = 0;
    
    // Send to all active SSE connections
    sseConnections.forEach((connection) => {
        try {
            connection.write(`data: ${eventData}\n\n`);
            successCount++;
        } catch (error) {
            console.error(`Failed to send console update to connection:`, error);
            errorCount++;
            // Connection was closed, remove it
            sseConnections.delete(connection);
        }
    });
    
    // Log broadcast results for debugging
    if (sseConnections.size > 0) {
        console.log(`Broadcasted console update for ${processId} to ${successCount} connections (${errorCount} failed)`);
    }
}

/**
 * Clear console output for a specific process
 */
function clearConsoleOutput(processId) {
    const output = processOutputs.get(processId);
    
    if (output) {
        // Clear all output arrays but keep the process entry
        output.stdout = [];
        output.stderr = [];
        output.timestamps = [];
        
        // Broadcast clear event to active connections
        const eventData = JSON.stringify({
            processId,
            message: { type: 'clear' }
        });
        
        sseConnections.forEach((connection) => {
            try {
                connection.write(`data: ${eventData}\n\n`);
            } catch (error) {
                console.error(`Failed to send clear event to connection:`, error);
                sseConnections.delete(connection);
            }
        });
        
        console.log(`Cleared console output for process: ${processId}`);
        return true;
    }
    return false;
}

/**
 * Get all processes with their output status
 */
function getAllProcesses() {
    const processes = [];
    
    processOutputs.forEach((output, processId) => {
        processes.push({
            processId,
            type: processTypes.get(processId) || 'unknown',
            status: output.status,
            lastActivity: output.timestamps.length > 0 
                ? output.timestamps[output.timestamps.length - 1].timestamp 
                : null
        });
    });
    
    return processes;
}

/**
 * Add an SSE connection to the active connections set
 */
function addSSEConnection(connection) {
    sseConnections.add(connection);
    console.log(`Added new SSE connection. Total connections: ${sseConnections.size}`);
    
    // Send initial connection message
    connection.write(`data: ${JSON.stringify({
        type: 'connected',
        message: 'Console stream connected',
        activeProcesses: Array.from(processOutputs.keys())
    })}\n\n`);
    
    // Send a heartbeat every 30 seconds to keep the connection alive
    const heartbeat = setInterval(() => {
        try {
            connection.write(`: heartbeat\n\n`);
        } catch (error) {
            console.error(`Heartbeat failed for SSE connection:`, error);
            clearInterval(heartbeat);
            sseConnections.delete(connection);
        }
    }, 30000);
    
    // Handle connection close
    const cleanup = () => {
        clearInterval(heartbeat);
        sseConnections.delete(connection);
        console.log(`Console stream connection closed. Total connections: ${sseConnections.size}`);
    };
    
    connection.on('close', cleanup);
    connection.on('aborted', cleanup);
    connection.on('error', (error) => {
        console.error('SSE connection error:', error);
        cleanup();
    });
}

module.exports = {
    initializeConsoleOutput,
    setProcessType,
    getProcessOutput,
    getProcessType,
    addConsoleOutput,
    broadcastConsoleUpdate,
    clearConsoleOutput,
    getAllProcesses,
    addSSEConnection
};