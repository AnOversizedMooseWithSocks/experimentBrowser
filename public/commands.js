/**
 * Commands Management Module - Refactored for Separate Pages
 * Handles command creation, editing, execution, and rendering
 */

const CommandManager = {
    // State for editing commands
    editingCommand: null,

    /**
     * Create a command card for the page
     */
    createCommandCard(commandId, command) {
        const card = document.createElement('div');
        card.className = 'service-card command-card';
        
        card.innerHTML = `
            <div class="service-card-header">
                <div class="service-card-title">
                    <i class="fas fa-terminal"></i>
                    <span class="service-name">${command.name || commandId}</span>
                </div>
                <span class="tag is-small is-info">Command</span>
            </div>
            <div class="service-card-description">
                ${command.description || 'No description'}
            </div>
            <div class="service-card-meta">
                <small class="has-text-grey">
                    <i class="fas fa-folder"></i> ${command.workingDir || 'Current directory'}
                </small>
            </div>
            <div class="service-card-actions">
                <div class="field has-addons">
                    <div class="control">
                        <button class="button is-primary" onclick="CommandManager.executeFromCard('${commandId}')">
                            <i class="fas fa-play"></i>
                            <span>Execute</span>
                        </button>
                    </div>
                    <div class="control">
                        <button class="button is-light" onclick="CommandManager.openConsoleForCommand('${commandId}')" title="View Previous Executions">
                            <i class="fas fa-terminal"></i>
                        </button>
                    </div>
                    <div class="control">
                        <button class="button is-info" onclick="CommandManager.editCommand('${commandId}')" title="Edit Command">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                    <div class="control">
                        <button class="button is-danger" onclick="CommandManager.deleteCommand('${commandId}')" title="Delete Command">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        return card;
    },

    /**
     * Render commands list in sidebar
     */
    renderCommandsList() {
        const query = AppElements.commandsSearch.value.toLowerCase();
        const filteredCommands = Object.entries(AppState.commands).filter(([id, command]) => {
            if (!query) return true;
            return id.toLowerCase().includes(query) || 
                   (command.name && command.name.toLowerCase().includes(query)) ||
                   (command.description && command.description.toLowerCase().includes(query));
        });
        
        AppElements.commandsList.innerHTML = '';
        
        if (filteredCommands.length === 0) {
            AppElements.commandsList.innerHTML = `
                <div class="has-text-centered has-text-grey">
                    <i class="fas fa-search"></i>
                    <p>No commands found</p>
                </div>
            `;
            return;
        }
        
        filteredCommands.forEach(([commandId, command]) => {
            const item = this.createCommandListItem(commandId, command);
            AppElements.commandsList.appendChild(item);
        });
    },

    /**
     * Create command list item for sidebar
     */
    createCommandListItem(commandId, command) {
        const item = document.createElement('div');
        item.className = 'experiment-item';
        
        item.innerHTML = `
            <div class="title">
                <i class="fas fa-terminal"></i>
                ${command.name || commandId}
            </div>
            <div class="subtitle">${command.description || 'Command'}</div>
            <div class="tags">
                <span class="tag is-small is-info">Command</span>
            </div>
        `;
        
        item.addEventListener('click', () => {
            // Scroll to command in main page
            const commandCard = Array.from(document.querySelectorAll('.command-card'))
                .find(card => card.textContent.includes(command.name || commandId));
            if (commandCard) {
                commandCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                commandCard.style.backgroundColor = '#f0f8ff';
                setTimeout(() => {
                    commandCard.style.backgroundColor = '';
                }, 2000);
            }
        });
        
        return item;
    },

    /**
     * Open console for command (for viewing previous executions)
     */
    openConsoleForCommand(commandId) {
        // For commands, we can't predict the execution ID ahead of time
        // So we'll show a message about executing to see real-time output
        UIUtils.showNotification('Execute the command to see real-time output', 'info');
    },

    /**
     * Create a new command
     */
    createCommand() {
        this.editingCommand = null;
        ServiceManager.clearServiceForm(); // Reuse the same form
        document.getElementById('serviceModalTitle').textContent = 'Create Command';
        document.getElementById('serviceId').disabled = false;
        
        // Update form labels for command creation
        const form = document.getElementById('serviceForm');
        form.dataset.type = 'command';
        
        AppElements.serviceModal.classList.add('is-active');
    },

    /**
     * Edit an existing command
     */
    editCommand(commandId) {
        this.editingCommand = commandId;
        const command = AppState.commands[commandId];
        
        document.getElementById('serviceModalTitle').textContent = 'Edit Command';
        document.getElementById('serviceId').value = commandId;
        document.getElementById('serviceId').disabled = true;
        document.getElementById('serviceName').value = command.name || '';
        document.getElementById('serviceDescription').value = command.description || '';
        document.getElementById('serviceWorkingDir').value = command.workingDir || '';
        document.getElementById('serviceCommand').value = command.command || '';
        
        // Update form for command editing
        const form = document.getElementById('serviceForm');
        form.dataset.type = 'command';
        
        AppElements.serviceModal.classList.add('is-active');
    },

    /**
     * Delete a command
     */
    async deleteCommand(commandId) {
        if (!confirm(`Are you sure you want to delete the command "${commandId}"?`)) {
            return;
        }
        
        try {
            const response = await ApiUtils.deleteCommand(commandId);
            
            if (response.ok) {
                UIUtils.showNotification(`Command "${commandId}" deleted successfully`, 'success');
                await ServiceManager.loadServicesAndWorkflows();
                await ServiceManager.renderCommandsPage();
                this.renderCommandsList();
            } else {
                const error = await response.json();
                UIUtils.showError(error.error || 'Failed to delete command');
            }
        } catch (error) {
            console.error('Error deleting command:', error);
            UIUtils.showError('Failed to delete command');
        }
    },

    /**
     * Save command (create or update)
     */
    async saveCommand() {
        const commandData = {
            name: document.getElementById('serviceName').value.trim(),
            description: document.getElementById('serviceDescription').value.trim(),
            workingDir: document.getElementById('serviceWorkingDir').value.trim() || undefined,
            command: document.getElementById('serviceCommand').value.trim()
        };
        
        const commandId = document.getElementById('serviceId').value.trim();
        
        // Validation
        if (!commandId) {
            UIUtils.showError('Command ID is required');
            return;
        }
        
        if (!commandData.name) {
            UIUtils.showError('Command name is required');
            return;
        }
        
        if (!commandData.command) {
            UIUtils.showError('Command is required');
            return;
        }
        
        try {
            let response;
            
            if (this.editingCommand) {
                // Update existing command
                response = await ApiUtils.updateCommand(commandId, commandData);
            } else {
                // Create new command
                response = await ApiUtils.createCommand(commandId, commandData);
            }
            
            if (response.ok) {
                const action = this.editingCommand ? 'updated' : 'created';
                UIUtils.showNotification(`Command "${commandId}" ${action} successfully`, 'success');
                ServiceManager.closeServiceModal();
                await ServiceManager.loadServicesAndWorkflows();
                await ServiceManager.renderCommandsPage();
                this.renderCommandsList();
            } else {
                const error = await response.json();
                UIUtils.showError(error.error || `Failed to ${this.editingCommand ? 'update' : 'create'} command`);
            }
        } catch (error) {
            console.error('Error saving command:', error);
            UIUtils.showError('Failed to save command');
        }
    },

    /**
     * Execute command from card (new method for page cards)
     */
    async executeFromCard(commandId) {
        const command = AppState.commands[commandId];
        
        try {
            UIUtils.showLoadingModal(`Executing command: ${command.name || commandId}...`);
            
            console.log(`Executing command: ${commandId}`);
            
            // Execute the command first
            const response = await ApiUtils.executeCommand(commandId);
            const result = await response.json();
            
            console.log('Command execution response:', result);
            
            // Open console dialog using the execution ID returned from the server
            if (result.executionId) {
                ConsoleManager.openDialog(result.executionId, 'command');
                UIUtils.showNotification(`Command ${command.name || commandId} executed successfully`, 'success');
            } else {
                console.error('No execution ID returned from command execution');
                UIUtils.showError('Command executed but console output may not be available');
            }
            
        } catch (error) {
            console.error('Error executing command:', error);
            UIUtils.showNotification(`Failed to execute command ${command.name || commandId}`, 'danger');
        } finally {
            UIUtils.hideLoadingModal();
        }
    },

    /**
     * Execute command from dashboard (kept for backward compatibility)
     */
    async executeFromDashboard(commandId) {
        return this.executeFromCard(commandId);
    }
};

// Make functions available globally for HTML onclick handlers
window.createCommand = () => CommandManager.createCommand();
window.refreshCommands = () => refreshCommands();