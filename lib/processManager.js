const { spawn, exec } = require('child_process');
const path = require('path');
const { loadServicesConfig } = require('./servicesConfig');
const consoleManager = require('./consoleManager');

// Store running processes
const runningProcesses = new Map();

/**
 * Execute a single command (quick action)
 * Uses exec() for commands that run and complete
 */
function executeCommand(commandId, command, workingDir, workflowId = null) {
    return new Promise((resolve, reject) => {
        console.log(`[ProcessManager] Executing command: ${commandId}`);
        console.log(`[ProcessManager] Command: ${command}`);
        console.log(`[ProcessManager] Working directory: ${workingDir || 'current directory'}`);
        
        // Use workflow console if this command is part of a workflow
        const consoleId = workflowId || commandId;
        
        // Initialize console output tracking before starting command (if not part of workflow)
        if (!workflowId) {
            consoleManager.initializeConsoleOutput(commandId);
            consoleManager.setProcessType(commandId, 'command');
        }
        
        const cwd = workingDir ? path.resolve(workingDir) : process.cwd();
        
        // Add initial messages to console
        if (workflowId) {
            consoleManager.addConsoleOutput(workflowId, 'stdout', `\n=== Executing Command: ${commandId} ===`);
            consoleManager.addConsoleOutput(workflowId, 'stdout', `Command: ${command}`);
            consoleManager.addConsoleOutput(workflowId, 'stdout', `Working directory: ${cwd}`);
        } else {
            consoleManager.addConsoleOutput(commandId, 'stdout', `Starting command: ${command}`);
            consoleManager.addConsoleOutput(commandId, 'stdout', `Working directory: ${cwd}`);
        }
        
        // Clean up the command - remove extra quotes if present
        let cleanCommand = command;
        if (command.startsWith('"') && command.endsWith('"')) {
            cleanCommand = command.slice(1, -1);
        }
        
        console.log(`[ProcessManager] Cleaned command: ${cleanCommand}`);
        
        // Use exec() for commands with shell option for better compatibility
        const proc = exec(cleanCommand, { 
            cwd,
            shell: true,
            encoding: 'utf8'
        });
        
        let stdout = '';
        let stderr = '';
        
        // Capture real-time output - send to appropriate console
        proc.stdout.on('data', (data) => {
            const dataStr = data.toString();
            stdout += dataStr;
            consoleManager.addConsoleOutput(consoleId, 'stdout', dataStr);
        });
        
        proc.stderr.on('data', (data) => {
            const dataStr = data.toString();
            stderr += dataStr;
            consoleManager.addConsoleOutput(consoleId, 'stderr', dataStr);
        });
        
        // Handle process events
        proc.on('spawn', () => {
            consoleManager.addConsoleOutput(consoleId, 'stdout', `Process spawned with PID: ${proc.pid}`);
        });
        
        proc.on('error', (error) => {
            console.error(`[ProcessManager] Command error:`, error);
            if (!workflowId) {
                const output = consoleManager.getProcessOutput(commandId);
                if (output) {
                    output.status = 'error';
                }
            }
            consoleManager.addConsoleOutput(consoleId, 'stderr', `[EXECUTION ERROR] ${error.message}`);
            reject(error);
        });
        
        proc.on('close', (code, signal) => {
            console.log(`[ProcessManager] Command finished with code: ${code}, signal: ${signal}`);
            
            if (workflowId) {
                consoleManager.addConsoleOutput(workflowId, 'stdout', `=== Command ${commandId} completed with exit code: ${code} ===\n`);
            } else {
                const output = consoleManager.getProcessOutput(commandId);
                if (output) {
                    output.status = code === 0 ? 'completed' : 'error';
                }
            }
            
            if (code === 0) {
                if (!workflowId) {
                    consoleManager.addConsoleOutput(commandId, 'stdout', `Command completed successfully (exit code: ${code})`);
                }
                resolve(stdout);
            } else {
                const errorMsg = `Command failed with exit code: ${code}`;
                consoleManager.addConsoleOutput(consoleId, 'stderr', errorMsg);
                reject(new Error(errorMsg));
            }
        });
    });
}

/**
 * Start a service (long-running process)
 * Uses spawn() for services that run continuously
 */
function startService(serviceId, service, workflowId = null) {
    return new Promise((resolve, reject) => {
        console.log(`Starting service: ${serviceId}`);
        
        // Check if service is already running
        if (runningProcesses.has(serviceId)) {
            const message = `Service ${serviceId} is already running`;
            console.log(message);
            if (workflowId) {
                consoleManager.addConsoleOutput(workflowId, 'stdout', message);
            }
            resolve(message);
            return;
        }
        
        // Use workflow console if this service is part of a workflow
        const consoleId = workflowId || serviceId;
        
        // Initialize console output tracking (if not part of workflow)
        if (!workflowId) {
            consoleManager.initializeConsoleOutput(serviceId);
            consoleManager.setProcessType(serviceId, 'service');
        }
        
        const { workingDir, command, commands } = service;
        const cwd = workingDir ? path.resolve(workingDir) : process.cwd();
        
        // Handle both single command and legacy commands array format
        const finalCommand = command || (commands && commands[commands.length - 1]);
        if (!finalCommand) {
            reject(new Error('No command specified for service'));
            return;
        }
        
        if (workflowId) {
            consoleManager.addConsoleOutput(workflowId, 'stdout', `\n=== Starting Service: ${serviceId} ===`);
            consoleManager.addConsoleOutput(workflowId, 'stdout', `Command: ${finalCommand}`);
            consoleManager.addConsoleOutput(workflowId, 'stdout', `Working directory: ${cwd}`);
        } else {
            consoleManager.addConsoleOutput(serviceId, 'stdout', `Starting service: ${serviceId}`);
            consoleManager.addConsoleOutput(serviceId, 'stdout', `Command: ${finalCommand}`);
            consoleManager.addConsoleOutput(serviceId, 'stdout', `Working directory: ${cwd}`);
        }
        
        // For Windows compatibility, we need to handle shell built-ins like 'echo'
        // Also helps with commands that have complex arguments or pipes
        const isWindows = process.platform === 'win32';
        let proc;
        
        if (isWindows) {
            // On Windows, use cmd.exe to run the command
            proc = spawn('cmd', ['/c', finalCommand], {
                cwd,
                stdio: ['inherit', 'pipe', 'pipe']
            });
        } else {
            // On Unix-like systems, use sh
            proc = spawn('sh', ['-c', finalCommand], {
                cwd,
                stdio: ['inherit', 'pipe', 'pipe']
            });
        }
        
        // Store the process
        runningProcesses.set(serviceId, proc);
        
        // Set up output handling - send to appropriate console
        proc.stdout.on('data', (data) => {
            consoleManager.addConsoleOutput(consoleId, 'stdout', data);
        });
        
        proc.stderr.on('data', (data) => {
            consoleManager.addConsoleOutput(consoleId, 'stderr', data);
        });
        
        proc.on('spawn', () => {
            consoleManager.addConsoleOutput(consoleId, 'stdout', `Service process spawned with PID: ${proc.pid}`);
        });
        
        proc.on('close', (code) => {
            if (!workflowId) {
                const output = consoleManager.getProcessOutput(serviceId);
                if (output) {
                    output.status = code === 0 ? 'completed' : 'error';
                }
            }
            
            const message = `Service exited with code ${code}`;
            consoleManager.addConsoleOutput(consoleId, 'stdout', workflowId ? `=== ${message} ===\n` : message);
            runningProcesses.delete(serviceId);
        });
        
        proc.on('error', (error) => {
            if (!workflowId) {
                const output = consoleManager.getProcessOutput(serviceId);
                if (output) {
                    output.status = 'error';
                }
            }
            
            consoleManager.addConsoleOutput(consoleId, 'stderr', `[ERROR] ${error.message}`);
            runningProcesses.delete(serviceId);
            reject(error);
        });
        
        // Give the process a moment to start
        setTimeout(() => {
            resolve(`Service ${serviceId} started successfully`);
        }, 1000);
    });
}

/**
 * Execute a workflow (series of commands/services)
 * Enhanced to skip already-running services and show skip messages
 */
async function executeWorkflow(workflowId, workflow) {
    console.log(`Starting workflow: ${workflowId}`);
    
    // Initialize console output tracking for the workflow
    consoleManager.initializeConsoleOutput(workflowId);
    consoleManager.setProcessType(workflowId, 'workflow');
    
    consoleManager.addConsoleOutput(workflowId, 'stdout', `Starting workflow: ${workflowId}`);
    consoleManager.addConsoleOutput(workflowId, 'stdout', `Workflow: ${workflow.name || workflowId}`);
    if (workflow.description) {
        consoleManager.addConsoleOutput(workflowId, 'stdout', `Description: ${workflow.description}`);
    }
    consoleManager.addConsoleOutput(workflowId, 'stdout', `Total steps: ${workflow.steps ? workflow.steps.length : 0}\n`);
    
    const steps = workflow.steps || [];
    const results = [];
    const config = await loadServicesConfig(); // Load current services and commands
    
    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const stepId = `${workflowId}-step-${i}`;
        
        consoleManager.addConsoleOutput(workflowId, 'stdout', 
            `\n>>> [Step ${i + 1}/${steps.length}] ${step.name || step.type} <<<`);
        
        try {
            let result;
            
            switch (step.type) {
                case 'existing-service':
                    // Check if service is already running
                    if (runningProcesses.has(step.serviceId)) {
                        consoleManager.addConsoleOutput(workflowId, 'stdout', 
                            `⏸️  SKIP: Service ${step.serviceId} is already running`);
                        result = `Service ${step.serviceId} already running (skipped)`;
                    } else {
                        // Start existing service - pass workflowId to aggregate output
                        const service = config.services[step.serviceId];
                        if (!service) {
                            throw new Error(`Service ${step.serviceId} not found`);
                        }
                        
                        // Create a modified service object with workflow workingDir as fallback
                        const serviceWithWorkingDir = {
                            ...service,
                            workingDir: step.workingDir || service.workingDir || workflow.workingDir
                        };
                        
                        result = await startService(step.serviceId, serviceWithWorkingDir, workflowId);
                    }
                    break;
                    
                case 'existing-command':
                    // Execute existing command - pass workflowId to aggregate output
                    const command = config.commands[step.commandId];
                    if (!command) {
                        throw new Error(`Command ${step.commandId} not found`);
                    }
                    result = await executeCommand(
                        `${stepId}-${step.commandId}`, 
                        command.command, 
                        step.workingDir || command.workingDir || workflow.workingDir,
                        workflowId  // Pass workflow ID to aggregate output
                    );
                    break;
                    
                case 'custom-command':
                    // Execute custom command - pass workflowId to aggregate output
                    result = await executeCommand(
                        stepId, 
                        step.command, 
                        step.workingDir || workflow.workingDir,
                        workflowId  // Pass workflow ID to aggregate output
                    );
                    break;
                    
                case 'custom-service':
                    // Check if custom service is already running
                    if (runningProcesses.has(step.serviceId)) {
                        consoleManager.addConsoleOutput(workflowId, 'stdout', 
                            `⏸️  SKIP: Custom service ${step.serviceId} is already running`);
                        result = `Custom service ${step.serviceId} already running (skipped)`;
                    } else {
                        // Start custom service - pass workflowId to aggregate output
                        const customService = {
                            command: step.command,
                            workingDir: step.workingDir || workflow.workingDir  // Properly inherit workflow workingDir
                        };
                        result = await startService(step.serviceId, customService, workflowId);
                    }
                    break;
                    
                default:
                    throw new Error(`Unknown step type: ${step.type}`);
            }
            
            results.push(result);
            
            // Show different completion messages based on whether step was skipped
            if (result.includes('already running') || result.includes('skipped')) {
                consoleManager.addConsoleOutput(workflowId, 'stdout', 
                    `Step ${i + 1} skipped (service already running)`);
            } else {
                consoleManager.addConsoleOutput(workflowId, 'stdout', 
                    `Step ${i + 1} completed successfully`);
            }
            
            // Optional delay between steps
            if (step.delay) {
                consoleManager.addConsoleOutput(workflowId, 'stdout', 
                    `Waiting ${step.delay}ms before next step...`);
                await new Promise(resolve => setTimeout(resolve, step.delay));
            }
            
        } catch (error) {
            const errorMsg = `Step ${i + 1} failed: ${error.message}`;
            consoleManager.addConsoleOutput(workflowId, 'stderr', errorMsg);
            
            // Stop workflow on error unless configured to continue
            if (!step.continueOnError) {
                // Mark workflow as failed
                const output = consoleManager.getProcessOutput(workflowId);
                if (output) {
                    output.status = 'error';
                }
                throw new Error(errorMsg);
            } else {
                consoleManager.addConsoleOutput(workflowId, 'stdout', 
                    `Continuing workflow despite error (continueOnError=true)`);
            }
        }
    }
    
    consoleManager.addConsoleOutput(workflowId, 'stdout', 
        `\n✓ Workflow completed successfully! All ${steps.length} steps finished.`);
    
    const output = consoleManager.getProcessOutput(workflowId);
    if (output) {
        output.status = 'completed';
    }
    
    return results;
}

/**
 * Stop a service or kill a running process
 */
function stopService(serviceId) {
    const process = runningProcesses.get(serviceId);
    
    if (process) {
        consoleManager.addConsoleOutput(serviceId, 'stdout', 
            `Stopping service: ${serviceId}`);
        
        process.kill('SIGTERM');
        runningProcesses.delete(serviceId);
        
        const output = consoleManager.getProcessOutput(serviceId);
        if (output) {
            output.status = 'stopped';
        }
        
        return `Service ${serviceId} stopped`;
    }
    return `Service ${serviceId} was not running`;
}

/**
 * Check if a service is running
 */
function isServiceRunning(serviceId) {
    return runningProcesses.has(serviceId);
}

/**
 * Get all running processes
 */
function getRunningProcesses() {
    return Array.from(runningProcesses.keys());
}

module.exports = {
    executeCommand,
    startService,
    executeWorkflow,
    stopService,
    isServiceRunning,
    getRunningProcesses
};