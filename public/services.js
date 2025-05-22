/**
 * Services Management Module - Refactored for Separate Pages
 * Handles service creation, editing, starting/stopping, and rendering
 */

const ServiceManager = {
    // State for editing services
    editingService: null,

    /**
     * Load services, commands, and workflows configuration from server
     */
    async loadServicesAndWorkflows() {
        try {
            const response = await fetch('/api/services');
            const data = await response.json();
            AppState.services = data.services || {};
            AppState.commands = data.commands || {};
            AppState.workflows = data.workflows || {};
            
            console.log('Loaded services:', AppState.services);
            console.log('Loaded commands:', AppState.commands);
            console.log('Loaded workflows:', AppState.workflows);
            
            // Update the running services indicator
            this.updateRunningServicesIndicator();
            
        } catch (error) {
            console.error('Error loading services and workflows:', error);
            UIUtils.showError('Failed to load services and workflows');
        }
    },

    /**
     * Update the running services indicator in the navbar
     */
    updateRunningServicesIndicator() {
        const indicator = document.getElementById('runningServicesIndicator');
        if (indicator) {
            const runningCount = Object.values(AppState.services).filter(s => s.isRunning).length;
            
            // Update text content and visibility
            indicator.textContent = runningCount;
            
            // Update visibility and style based on count
            if (runningCount > 0) {
                indicator.style.display = 'inline-flex';
                indicator.classList.add('is-danger');
                indicator.classList.remove('is-light');
            } else {
                indicator.classList.remove('is-danger');
                indicator.classList.add('is-light');
            }
        }
    },

    /**
     * Render the services page
     */
    async renderServicesPage() {
        // Update counters
        const totalServices = Object.keys(AppState.services).length;
        const runningServices = Object.values(AppState.services).filter(s => s.isRunning).length;
        
        document.getElementById('totalServicesCount').textContent = totalServices;
        document.getElementById('runningServicesCount').textContent = runningServices;
        
        // Render services
        const servicesContainer = document.getElementById('servicesContainer');
        servicesContainer.innerHTML = '';
        
        if (Object.keys(AppState.services).length === 0) {
            servicesContainer.innerHTML = `
                <div class="has-text-centered has-text-grey">
                    <i class="fas fa-server" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p>No services configured</p>
                    <div style="margin-top: 1rem;">
                        <button class="button is-primary" onclick="ServiceManager.createService()">
                            <i class="fas fa-plus"></i>
                            <span>Create Service</span>
                        </button>
                    </div>
                </div>
            `;
        } else {
            // Sort services with running ones first
            const serviceEntries = Object.entries(AppState.services).sort((a, b) => {
                // Sort running services to the top
                if (a[1].isRunning && !b[1].isRunning) return -1;
                if (!a[1].isRunning && b[1].isRunning) return 1;
                
                // Then sort by name
                const nameA = a[1].name || a[0];
                const nameB = b[1].name || b[0];
                return nameA.localeCompare(nameB);
            });
            
            serviceEntries.forEach(([serviceId, service]) => {
                const serviceCard = this.createServiceCard(serviceId, service);
                servicesContainer.appendChild(serviceCard);
            });
        }
        
        // Update the running services indicator
        this.updateRunningServicesIndicator();
    },

    /**
     * Render the commands page
     */
    async renderCommandsPage() {
        // Update counters
        const totalCommands = Object.keys(AppState.commands).length;
        
        document.getElementById('totalCommandsCount').textContent = totalCommands;
        
        // Render commands
        const commandsContainer = document.getElementById('commandsContainer');
        commandsContainer.innerHTML = '';
        
        if (Object.keys(AppState.commands).length === 0) {
            commandsContainer.innerHTML = `
                <div class="has-text-centered has-text-grey">
                    <i class="fas fa-terminal" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p>No commands configured</p>
                    <div style="margin-top: 1rem;">
                        <button class="button is-primary" onclick="CommandManager.createCommand()">
                            <i class="fas fa-plus"></i>
                            <span>Create Command</span>
                        </button>
                    </div>
                </div>
            `;
        } else {
            Object.entries(AppState.commands).forEach(([commandId, command]) => {
                const commandCard = CommandManager.createCommandCard(commandId, command);
                commandsContainer.appendChild(commandCard);
            });
        }
    },

    /**
     * Render the workflows page
     */
    async renderWorkflowsPage() {
        // Update counters
        const totalWorkflows = Object.keys(AppState.workflows).length;
        
        document.getElementById('totalWorkflowsCount').textContent = totalWorkflows;
        
        // Render workflows
        const workflowsContainer = document.getElementById('workflowsContainer');
        workflowsContainer.innerHTML = '';
        
        if (Object.keys(AppState.workflows).length === 0) {
            workflowsContainer.innerHTML = `
                <div class="has-text-centered has-text-grey">
                    <i class="fas fa-project-diagram" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p>No workflows configured</p>
                    <div style="margin-top: 1rem;">
                        <button class="button is-primary" onclick="WorkflowManager.createWorkflow()">
                            <i class="fas fa-plus"></i>
                            <span>Create Workflow</span>
                        </button>
                    </div>
                </div>
            `;
        } else {
            Object.entries(AppState.workflows).forEach(([workflowId, workflow]) => {
                const workflowCard = WorkflowManager.createWorkflowCard(workflowId, workflow);
                workflowsContainer.appendChild(workflowCard);
            });
        }
    },

    /**
     * Create a service card for the page
     */
    createServiceCard(serviceId, service) {
        const card = document.createElement('div');
        card.className = 'service-card';
        
        // Add highlight class for running services
        if (service.isRunning) {
            card.classList.add('service-running-card');
        }
        
        const statusClass = service.isRunning ? 'running' : 'stopped';
        const statusText = service.isRunning ? 'Running' : 'Stopped';
        const buttonText = service.isRunning ? 'Stop' : 'Start';
        const buttonIcon = service.isRunning ? 'fa-stop' : 'fa-play';
        const buttonClass = service.isRunning ? 'is-danger' : 'is-success';
        
        card.innerHTML = `
            <div class="service-card-header">
                <div class="service-card-title">
                    <span class="service-status-indicator ${statusClass}"></span>
                    <span class="service-name">${service.name || serviceId}</span>
                </div>
                <span class="tag is-small ${service.isRunning ? 'is-success' : 'is-light'}">${statusText}</span>
            </div>
            <div class="service-card-description">
                ${service.description || 'No description'}
            </div>
            <div class="service-card-meta">
                <small class="has-text-grey">
                    <i class="fas fa-folder"></i> ${service.workingDir || 'Current directory'}
                </small>
            </div>
            <div class="service-card-actions">
                <div class="field has-addons">
                    <div class="control">
                        <button class="button ${buttonClass}" onclick="ServiceManager.toggleFromCard('${serviceId}')">
                            <i class="fas ${buttonIcon}"></i>
                            <span>${buttonText}</span>
                        </button>
                    </div>
                    <div class="control">
                        <button class="button is-light" onclick="ConsoleManager.openDialog('${serviceId}', 'service')" title="Open Console">
                            <i class="fas fa-terminal"></i>
                        </button>
                    </div>
                    <div class="control">
                        <button class="button is-info" onclick="ServiceManager.editService('${serviceId}')" title="Edit Service">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                    <div class="control">
                        <button class="button is-danger" onclick="ServiceManager.deleteService('${serviceId}')" title="Delete Service">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        return card;
    },

    /**
     * Render services list in sidebar
     */
    renderServicesList() {
        const query = AppElements.servicesSearch.value.toLowerCase();
        const filteredServices = Object.entries(AppState.services).filter(([id, service]) => {
            if (!query) return true;
            return id.toLowerCase().includes(query) || 
                   (service.name && service.name.toLowerCase().includes(query)) ||
                   (service.description && service.description.toLowerCase().includes(query));
        });
        
        // Sort services with running ones first
        filteredServices.sort((a, b) => {
            if (a[1].isRunning && !b[1].isRunning) return -1;
            if (!a[1].isRunning && b[1].isRunning) return 1;
            return (a[1].name || a[0]).localeCompare(b[1].name || b[0]);
        });
        
        AppElements.servicesList.innerHTML = '';
        
        if (filteredServices.length === 0) {
            AppElements.servicesList.innerHTML = `
                <div class="has-text-centered has-text-grey">
                    <i class="fas fa-search"></i>
                    <p>No services found</p>
                </div>
            `;
            return;
        }
        
        filteredServices.forEach(([serviceId, service]) => {
            const item = this.createServiceListItem(serviceId, service);
            AppElements.servicesList.appendChild(item);
        });
    },

    /**
     * Create service list item for sidebar
     */
    createServiceListItem(serviceId, service) {
        const item = document.createElement('div');
        item.className = 'experiment-item';
        
        // Highlight running services
        if (service.isRunning) {
            item.classList.add('is-running');
        }
        
        const statusIcon = service.isRunning ? 'fa-circle text-success' : 'fa-circle text-muted';
        const statusText = service.isRunning ? 'Running' : 'Stopped';
        
        item.innerHTML = `
            <div class="title">
                <i class="fas ${statusIcon}"></i>
                ${service.name || serviceId}
            </div>
            <div class="subtitle">${service.description || 'Service'}</div>
            <div class="tags">
                <span class="tag is-small ${service.isRunning ? 'is-success' : 'is-light'}">${statusText}</span>
            </div>
        `;
        
        item.addEventListener('click', () => {
            // Scroll to service in main page
            const serviceCard = Array.from(document.querySelectorAll('.service-card'))
                .find(card => card.textContent.includes(service.name || serviceId));
            if (serviceCard) {
                serviceCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                serviceCard.style.backgroundColor = '#f0f8ff';
                setTimeout(() => {
                    serviceCard.style.backgroundColor = '';
                }, 2000);
            }
        });
        
        return item;
    },

    /**
     * Create a service control button for experiment dependencies
     */
    createControlButton(serviceId, service) {
        const button = document.createElement('button');
        button.className = 'button service-button';
        button.dataset.serviceId = serviceId;
        button.dataset.type = 'service';
        
        this.updateControlButtonState(button, service);
        
        button.addEventListener('click', () => this.toggleService(serviceId, button));
        
        return button;
    },

    /**
     * Update the visual state of a service control button
     */
    updateControlButtonState(button, service) {
        const serviceId = button.dataset.serviceId;
        const isRunning = service.isRunning;
        
        button.className = `button service-button ${isRunning ? 'service-running' : 'service-stopped'}`;
        button.innerHTML = `
            <span>${service.name || serviceId}</span>
            <span class="icon">
                <i class="fas ${isRunning ? 'fa-stop' : 'fa-play'}"></i>
            </span>
        `;
        
        // Add console button for services
        if (button.nextElementSibling && button.nextElementSibling.classList.contains('console-button')) {
            return; // Console button already exists
        }
        
        const consoleBtn = document.createElement('button');
        consoleBtn.className = 'button is-small console-button';
        consoleBtn.innerHTML = '<i class="fas fa-terminal"></i>';
        consoleBtn.title = 'Open Console';
        consoleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            ConsoleManager.openDialog(serviceId, 'service');
        });
        
        button.parentNode.insertBefore(consoleBtn, button.nextSibling);
        button.disabled = false;
    },

    /**
     * Create a new service
     */
    createService() {
        this.editingService = null;
        this.clearServiceForm();
        document.getElementById('serviceModalTitle').textContent = 'Create Service';
        document.getElementById('serviceId').disabled = false;
        
        // Clear form type marker
        const form = document.getElementById('serviceForm');
        form.removeAttribute('data-type');
        
        AppElements.serviceModal.classList.add('is-active');
    },

    /**
     * Edit an existing service
     */
    editService(serviceId) {
        this.editingService = serviceId;
        const service = AppState.services[serviceId];
        
        document.getElementById('serviceModalTitle').textContent = 'Edit Service';
        document.getElementById('serviceId').value = serviceId;
        document.getElementById('serviceId').disabled = true;
        document.getElementById('serviceName').value = service.name || '';
        document.getElementById('serviceDescription').value = service.description || '';
        document.getElementById('serviceWorkingDir').value = service.workingDir || '';
        document.getElementById('serviceCommand').value = service.command || '';
        
        AppElements.serviceModal.classList.add('is-active');
    },

    /**
     * Delete a service
     */
    async deleteService(serviceId) {
        if (!confirm(`Are you sure you want to delete the service "${serviceId}"?`)) {
            return;
        }
        
        try {
            const response = await ApiUtils.deleteService(serviceId);
            
            if (response.ok) {
                UIUtils.showNotification(`Service "${serviceId}" deleted successfully`, 'success');
                await this.loadServicesAndWorkflows();
                await this.renderServicesPage();
                this.renderServicesList();
            } else {
                const error = await response.json();
                UIUtils.showError(error.error || 'Failed to delete service');
            }
        } catch (error) {
            console.error('Error deleting service:', error);
            UIUtils.showError('Failed to delete service');
        }
    },

    /**
     * Save service (create or update)
     */
    async saveService() {
        const serviceData = {
            name: document.getElementById('serviceName').value.trim(),
            description: document.getElementById('serviceDescription').value.trim(),
            workingDir: document.getElementById('serviceWorkingDir').value.trim(),
            command: document.getElementById('serviceCommand').value.trim()
        };
        
        const serviceId = document.getElementById('serviceId').value.trim();
        const form = document.getElementById('serviceForm');
        const isCommand = form.dataset.type === 'command';
        
        // Validation
        if (!serviceId) {
            UIUtils.showError(`${isCommand ? 'Command' : 'Service'} ID is required`);
            return;
        }
        
        if (!serviceData.name) {
            UIUtils.showError(`${isCommand ? 'Command' : 'Service'} name is required`);
            return;
        }
        
        if (!serviceData.command) {
            UIUtils.showError('Command is required');
            return;
        }
        
        try {
            let response;
            
            if (isCommand) {
                // This is a command, use command API
                if (CommandManager.editingCommand) {
                    response = await ApiUtils.updateCommand(serviceId, serviceData);
                } else {
                    response = await ApiUtils.createCommand(serviceId, serviceData);
                }
                CommandManager.editingCommand = null;
            } else {
                // This is a service, use service API
                if (this.editingService) {
                    response = await ApiUtils.updateService(serviceId, serviceData);
                } else {
                    response = await ApiUtils.createService(serviceId, serviceData);
                }
            }
            
            if (response.ok) {
                const type = isCommand ? 'command' : 'service';
                const action = (this.editingService || CommandManager.editingCommand) ? 'updated' : 'created';
                UIUtils.showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} "${serviceId}" ${action} successfully`, 'success');
                this.closeServiceModal();
                await this.loadServicesAndWorkflows();
                
                // Refresh appropriate page
                if (isCommand) {
                    await this.renderCommandsPage();
                    CommandManager.renderCommandsList();
                } else {
                    await this.renderServicesPage();
                    this.renderServicesList();
                }
            } else {
                const error = await response.json();
                UIUtils.showError(error.error || `Failed to ${(this.editingService || CommandManager.editingCommand) ? 'update' : 'create'} ${isCommand ? 'command' : 'service'}`);
            }
        } catch (error) {
            console.error('Error saving service:', error);
            UIUtils.showError('Failed to save service');
        }
    },

    /**
     * Clear service form
     */
    clearServiceForm() {
        document.getElementById('serviceId').value = '';
        document.getElementById('serviceName').value = '';
        document.getElementById('serviceDescription').value = '';
        document.getElementById('serviceWorkingDir').value = '';
        document.getElementById('serviceCommand').value = '';
        
        // Clear form type
        const form = document.getElementById('serviceForm');
        form.removeAttribute('data-type');
    },

    /**
     * Close service modal
     */
    closeServiceModal() {
        AppElements.serviceModal.classList.remove('is-active');
        this.editingService = null;
        CommandManager.editingCommand = null;
    },

    /**
     * Toggle service from card (new method for page cards)
     */
    async toggleFromCard(serviceId) {
        const service = AppState.services[serviceId];
        const action = service.isRunning ? 'stop' : 'start';
        
        try {
            if (action === 'start') {
                UIUtils.showLoadingModal(`Starting ${service.name || serviceId}...`);
                // Open console dialog when starting service
                ConsoleManager.openDialog(serviceId, 'service');
            }
            
            const response = await ApiUtils.toggleService(serviceId, action);
            const result = await response.json();
            
            // Update service state
            service.isRunning = action === 'start';
            
            // Re-render page and sidebar
            await this.renderServicesPage();
            this.renderServicesList();
            
            // Update the running services indicator
            this.updateRunningServicesIndicator();
            
            // Show success message
            UIUtils.showNotification(`${service.name || serviceId} ${action}ed successfully`, 'success');
            
        } catch (error) {
            console.error(`Error ${action}ing service:`, error);
            UIUtils.showNotification(`Failed to ${action} ${service.name || serviceId}`, 'danger');
        } finally {
            UIUtils.hideLoadingModal();
        }
    },

    /**
     * Toggle a service (start/stop) from experiment dependencies
     */
    async toggleService(serviceId, button) {
        const service = AppState.services[serviceId];
        const action = service.isRunning ? 'stop' : 'start';
        
        button.disabled = true;
        button.classList.add('is-loading');
        
        if (action === 'start') {
            UIUtils.showLoadingModal(`Starting ${service.name || serviceId}...`);
            // Open console dialog when starting service
            ConsoleManager.openDialog(serviceId, 'service');
        }
        
        try {
            const response = await ApiUtils.toggleService(serviceId, action);
            const result = await response.json();
            console.log(result.message);
            
            // Update service state
            service.isRunning = action === 'start';
            this.updateControlButtonState(button, service);
            
            // Update the running services indicator
            this.updateRunningServicesIndicator();
            
            // Show success message
            UIUtils.showNotification(`${service.name || serviceId} ${action}ed successfully`, 'success');
            
        } catch (error) {
            console.error(`Error ${action}ing service:`, error);
            UIUtils.showNotification(`Failed to ${action} ${service.name || serviceId}`, 'danger');
        } finally {
            UIUtils.hideLoadingModal();
            button.classList.remove('is-loading');
        }
    }
};

// Make functions available globally for HTML onclick handlers
window.refreshServices = () => refreshServices();
window.createService = () => ServiceManager.createService();
window.saveService = () => ServiceManager.saveService();
window.closeServiceModal = () => ServiceManager.closeServiceModal();