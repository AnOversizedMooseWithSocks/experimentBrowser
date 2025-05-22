/**
 * Console Management Module
 * Handles console dialogs, real-time streaming, and output management
 */

const ConsoleManager = {
    // Console state
    consoleDialogs: new Map(), // Track open console dialogs
    eventSource: null, // Server-Sent Events for real-time console output
    consoleManagerVisible: true,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    reconnectDelay: 1000, // Start with 1 second delay

    /**
     * Setup Server-Sent Events for real-time console output
     */
    setupStreaming() {
        // Check if EventSource is supported
        if (typeof EventSource === 'undefined') {
            console.warn('EventSource is not supported by this browser');
            return;
        }
        
        try {
            // Close existing connection if any
            if (this.eventSource) {
                this.eventSource.close();
            }
            
            console.log('Attempting to connect to console stream...');
            this.eventSource = new EventSource('/api/console/stream');
            
            this.eventSource.onopen = (event) => {
                console.log('Console stream connected successfully');
                this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
                this.reconnectDelay = 1000; // Reset delay to initial value
            };
            
            this.eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    
                    if (data.type === 'connected') {
                        console.log('Console stream handshake completed', data);
                        return;
                    }
                    
                    // Update console dialog if open
                    const dialog = this.consoleDialogs.get(data.processId);
                    if (dialog) {
                        this.appendConsoleOutput(dialog, data.message);
                    }
                } catch (error) {
                    console.error('Error parsing console stream data:', error, event.data);
                }
            };
            
            this.eventSource.onerror = (event) => {
                console.error('Console stream error:', event);
                
                // Check the ready state to determine the type of error
                if (this.eventSource.readyState === EventSource.CLOSED) {
                    console.log('Console stream connection was closed');
                    this.handleReconnect();
                } else if (this.eventSource.readyState === EventSource.CONNECTING) {
                    console.log('Console stream attempting to reconnect...');
                }
            };
            
        } catch (error) {
            console.error('Failed to setup console streaming:', error);
            this.handleReconnect();
        }
    },

    /**
     * Handle reconnection logic with exponential backoff
     */
    handleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached. Stopping reconnection.');
            UIUtils.showError('Console stream connection failed. Please refresh the page.');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
        
        console.log(`Attempting to reconnect console stream (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`);
        
        setTimeout(() => {
            this.setupStreaming();
        }, delay);
    },

    /**
     * Update console manager with active consoles
     */
    updateManager() {
        const content = AppElements.consoleManagerBody;
        content.innerHTML = '';
        
        // Update console count badge
        const consoleCount = document.getElementById('consoleCount');
        consoleCount.textContent = this.consoleDialogs.size;
        
        if (this.consoleDialogs.size === 0) {
            content.innerHTML = `
                <div class="has-text-centered has-text-grey">
                    <i class="fas fa-terminal" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p>No active consoles</p>
                </div>
            `;
            return;
        }
        
        // Create console list
        const consoleList = document.createElement('div');
        consoleList.className = 'console-list';
        
        this.consoleDialogs.forEach((dialogInfo, processId) => {
            const item = document.createElement('div');
            item.className = 'console-item';
            
            const type = dialogInfo.processType;
            const name = type === 'service' 
                ? (AppState.services[processId]?.name || processId)
                : type === 'workflow'
                ? (AppState.workflows[processId]?.name || processId)
                : `Command: ${processId}`;
            const icon = type === 'service' ? 'fa-cogs' : 
                        type === 'workflow' ? 'fa-project-diagram' : 'fa-terminal';
            const status = dialogInfo.isHidden ? 'Hidden' : 'Visible';
            
            item.innerHTML = `
                <div class="console-item-info">
                    <i class="fas ${icon}"></i>
                    <span class="console-item-name">${name}</span>
                    <span class="tag is-small">${type}</span>
                    <span class="tag is-small ${dialogInfo.isHidden ? 'is-warning' : 'is-info'}">${status}</span>
                </div>
                <div class="console-item-actions">
                    <button class="button is-small" onclick="ConsoleManager.toggleConsoleVisibility('${processId}')" title="${dialogInfo.isHidden ? 'Show' : 'Hide'}">
                        <i class="fas ${dialogInfo.isHidden ? 'fa-eye' : 'fa-eye-slash'}"></i>
                    </button>
                    <button class="button is-small" onclick="ConsoleManager.closeConsole('${processId}')" title="Close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            
            consoleList.appendChild(item);
        });
        
        content.appendChild(consoleList);
    },

    /**
     * Toggle console manager visibility
     */
    toggleManager() {
        const overlay = AppElements.consoleManagerOverlay;
        
        if (overlay.style.display === 'none' || !overlay.style.display) {
            overlay.style.display = 'flex';
            this.updateManager(); // Refresh the contents
        } else {
            overlay.style.display = 'none';
        }
    },

    /**
     * Focus a console dialog (show and bring to front)
     */
    focusConsole(processId) {
        const dialogInfo = this.consoleDialogs.get(processId);
        if (dialogInfo) {
            const dialog = dialogInfo.dialog;
            dialog.style.display = 'block';
            dialogInfo.isHidden = false;
            this.bringToFront(dialog);
            this.updateManager();
        }
    },

    /**
     * Toggle console visibility (show/hide)
     */
    toggleConsoleVisibility(processId) {
        const dialogInfo = this.consoleDialogs.get(processId);
        if (dialogInfo) {
            const dialog = dialogInfo.dialog;
            if (dialogInfo.isHidden) {
                // Show the console
                dialog.style.display = 'block';
                dialogInfo.isHidden = false;
                this.bringToFront(dialog);
            } else {
                // Hide the console
                dialog.style.display = 'none';
                dialogInfo.isHidden = true;
            }
            this.updateManager();
        }
    },

    /**
     * Create and show a console dialog for a process
     */
    async openDialog(processId, processType) {
        // Check if dialog already exists
        if (this.consoleDialogs.has(processId)) {
            const existingDialog = this.consoleDialogs.get(processId);
            existingDialog.dialog.style.display = 'block';
            existingDialog.isHidden = false;
            this.bringToFront(existingDialog.dialog);
            this.updateManager();
            return;
        }
        
        // Create the console dialog
        const dialog = this.createConsoleDialog(processId, processType);
        this.consoleDialogs.set(processId, {
            dialog,
            processType,
            isHidden: false
        });
        
        // Update console manager
        this.updateManager();
        
        // Load existing console output
        await this.loadConsoleOutput(processId);
    },

    /**
     * Create console dialog HTML
     */
    createConsoleDialog(processId, processType) {
        const dialog = document.createElement('div');
        dialog.className = 'console-dialog';
        dialog.id = `console-${processId}`;
        
        const title = processType === 'service' 
            ? (AppState.services[processId]?.name || processId)
            : processType === 'workflow'
            ? (AppState.workflows[processId]?.name || processId)
            : processId; // For commands, use the processId as it includes the command name
        
        dialog.innerHTML = `
            <div class="console-header">
                <div class="console-title">
                    <i class="fas fa-terminal"></i>
                    <span>${title} Console</span>
                    <span class="console-status" id="status-${processId}">Running</span>
                </div>
                <div class="console-controls">
                    <button class="button is-small" onclick="ConsoleManager.hideConsole('${processId}')" title="Hide">
                        <i class="fas fa-eye-slash"></i>
                    </button>
                    <button class="button is-small" onclick="ConsoleManager.closeConsole('${processId}')" title="Close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="console-content" id="content-${processId}">
                <div class="console-output" id="output-${processId}"></div>
            </div>
            <div class="console-footer">
                <div class="field has-addons">
                    <div class="control is-expanded">
                        <input class="input is-small" type="text" placeholder="Clear output..." readonly>
                    </div>
                    <div class="control">
                        <button class="button is-small" onclick="ConsoleManager.clearConsoleOutput('${processId}')">Clear</button>
                    </div>
                    ${processType === 'service' ? `
                    <div class="control">
                        <button class="button is-small is-danger" onclick="ConsoleManager.stopServiceFromConsole('${processId}')">Stop Service</button>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        // Make dialog draggable
        this.makeDraggable(dialog);
        
        // Add to body
        document.body.appendChild(dialog);
        
        // Position dialog (cascade new dialogs)
        const existingDialogs = document.querySelectorAll('.console-dialog').length - 1;
        const offset = existingDialogs * 30;
        dialog.style.left = `${50 + offset}px`;
        dialog.style.top = `${100 + offset}px`;
        
        return dialog;
    },

    /**
     * Load existing console output for a process
     */
    async loadConsoleOutput(processId) {
        try {
            const response = await fetch(`/api/console/${processId}`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    console.log(`No console output found for process ${processId} yet`);
                    return;
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            const outputEl = document.getElementById(`output-${processId}`);
            const statusEl = document.getElementById(`status-${processId}`);
            
            if (outputEl) {
                // Clear existing output
                outputEl.innerHTML = '';
                
                // Add all messages
                data.output.forEach(message => {
                    this.appendConsoleOutput({ dialog: { id: `console-${processId}` } }, message);
                });
                
                // Scroll to bottom
                outputEl.scrollTop = outputEl.scrollHeight;
            }
            
            if (statusEl) {
                statusEl.textContent = data.isRunning ? 'Running' : data.status;
                statusEl.className = `console-status status-${data.status}`;
            }
            
        } catch (error) {
            console.error('Error loading console output:', error);
            
            // Show a message in the console output area
            const outputEl = document.getElementById(`output-${processId}`);
            if (outputEl) {
                const messageEl = document.createElement('div');
                messageEl.className = 'console-line console-stderr';
                messageEl.innerHTML = `
                    <span class="console-timestamp">[${new Date().toLocaleTimeString()}]</span>
                    <span class="console-message">Error loading previous console output: ${error.message}</span>
                `;
                outputEl.appendChild(messageEl);
            }
        }
    },

    /**
     * Append a message to console output
     */
    appendConsoleOutput(dialogInfo, message) {
        const processId = dialogInfo.dialog.id.replace('console-', '');
        const outputEl = document.getElementById(`output-${processId}`);
        
        if (!outputEl) return;
        
        // Handle different message types
        if (message.type === 'clear') {
            outputEl.innerHTML = '';
            return;
        }
        
        const messageEl = document.createElement('div');
        messageEl.className = `console-line console-${message.type}`;
        
        const timestamp = new Date(message.timestamp).toLocaleTimeString();
        messageEl.innerHTML = `
            <span class="console-timestamp">[${timestamp}]</span>
            <span class="console-message">${this.escapeHtml(message.data)}</span>
        `;
        
        outputEl.appendChild(messageEl);
        
        // Auto-scroll to bottom
        outputEl.scrollTop = outputEl.scrollHeight;
    },

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    /**
     * Make a dialog draggable
     */
    makeDraggable(dialog) {
        const header = dialog.querySelector('.console-header');
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;
        
        const dragStart = (e) => {
            if (e.target.closest('.console-controls')) return;
            
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
            
            if (e.target === header || header.contains(e.target)) {
                isDragging = true;
                this.bringToFront(dialog);
            }
        };
        
        const dragEnd = (e) => {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
        };
        
        const drag = (e) => {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                xOffset = currentX;
                yOffset = currentY;
                
                dialog.style.transform = `translate(${currentX}px, ${currentY}px)`;
            }
        };
        
        header.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);
    },

    /**
     * Bring a dialog to front (z-index management)
     */
    bringToFront(dialog) {
        const allDialogs = document.querySelectorAll('.console-dialog');
        let maxZ = 1000;
        
        allDialogs.forEach(d => {
            const z = parseInt(getComputedStyle(d).zIndex) || 1000;
            if (z > maxZ) maxZ = z;
        });
        
        dialog.style.zIndex = maxZ + 1;
    },

    /**
     * Hide console dialog (new method, replaces minimizeConsole)
     */
    hideConsole(processId) {
        const dialog = document.getElementById(`console-${processId}`);
        const dialogInfo = this.consoleDialogs.get(processId);
        
        if (dialog && dialogInfo) {
            dialog.style.display = 'none';
            dialogInfo.isHidden = true;
            this.updateManager();
        }
    },

    /**
     * Close console dialog
     */
    closeConsole(processId) {
        const dialog = document.getElementById(`console-${processId}`);
        if (dialog) {
            dialog.remove();
        }
        this.consoleDialogs.delete(processId);
        this.updateManager();
    },

    /**
     * Clear console output
     */
    async clearConsoleOutput(processId) {
        try {
            const response = await fetch(`/api/console/${processId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                // The server will broadcast a clear event to all connected clients
                // So we don't need to manually clear the output here
                console.log(`Cleared console output for ${processId}`);
            } else {
                throw new Error(`Failed to clear console output`);
            }
        } catch (error) {
            console.error('Error clearing console output:', error);
            // Fallback: clear locally
            const outputEl = document.getElementById(`output-${processId}`);
            if (outputEl) {
                outputEl.innerHTML = '';
            }
        }
    },

    /**
     * Stop service from console dialog
     */
    async stopServiceFromConsole(processId) {
        try {
            const response = await ApiUtils.stopService(processId);
            const result = await response.json();
            UIUtils.showNotification(result.message, 'success');
            
            // Update button states
            await ServiceManager.loadServicesAndWorkflows();
            if (AppState.selectedExperiment) {
                ExperimentManager.setupDependencyControls(AppState.selectedExperiment.dependencies || []);
            }
            
        } catch (error) {
            console.error('Error stopping service:', error);
            UIUtils.showNotification(`Failed to stop service ${processId}`, 'danger');
        }
    }
};

// Make functions available globally for HTML onclick handlers
window.toggleConsoleManager = () => ConsoleManager.toggleManager();