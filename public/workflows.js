/**
 * Workflows Management Module - Refactored for Separate Pages
 * Handles workflow creation, editing, execution, and rendering
 * Now only supports existing services and commands (no custom ones)
 */

const WorkflowManager = {
    // State for editing workflows
    editingWorkflow: null,

    /**
     * Create a workflow card for the page
     */
    createWorkflowCard(workflowId, workflow) {
        const card = document.createElement('div');
        card.className = 'workflow-card';
        
        const stepsCount = workflow.steps ? workflow.steps.length : 0;
        
        card.innerHTML = `
            <div class="service-card-header">
                <div class="service-card-title">
                    <i class="fas fa-project-diagram"></i>
                    <span class="workflow-name">${workflow.name || workflowId}</span>
                </div>
                <span class="tag is-small is-info">${stepsCount} steps</span>
            </div>
            <div class="service-card-description">
                ${workflow.description || 'No description'}
            </div>
            <div class="service-card-meta">
                <small class="has-text-grey">
                    <i class="fas fa-folder"></i> ${workflow.workingDir || 'Current directory'}
                </small>
            </div>
            <div class="service-card-actions">
                <div class="field has-addons">
                    <div class="control">
                        <button class="button is-primary" onclick="WorkflowManager.executeFromCard('${workflowId}')">
                            <i class="fas fa-play"></i>
                            <span>Execute</span>
                        </button>
                    </div>
                    <div class="control">
                        <button class="button is-light" onclick="ConsoleManager.openDialog('${workflowId}', 'workflow')" title="Open Console">
                            <i class="fas fa-terminal"></i>
                        </button>
                    </div>
                    <div class="control">
                        <button class="button is-info" onclick="WorkflowManager.editWorkflow('${workflowId}')" title="Edit Workflow">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                    <div class="control">
                        <button class="button is-danger" onclick="WorkflowManager.deleteWorkflow('${workflowId}')" title="Delete Workflow">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        return card;
    },

    /**
     * Render workflows list in sidebar
     */
    renderWorkflowsList() {
        const query = AppElements.workflowsSearch.value.toLowerCase();
        const filteredWorkflows = Object.entries(AppState.workflows).filter(([id, workflow]) => {
            if (!query) return true;
            return id.toLowerCase().includes(query) || 
                   (workflow.name && workflow.name.toLowerCase().includes(query)) ||
                   (workflow.description && workflow.description.toLowerCase().includes(query));
        });
        
        AppElements.workflowsList.innerHTML = '';
        
        if (filteredWorkflows.length === 0) {
            AppElements.workflowsList.innerHTML = `
                <div class="has-text-centered has-text-grey">
                    <i class="fas fa-search"></i>
                    <p>No workflows found</p>
                </div>
            `;
            return;
        }
        
        filteredWorkflows.forEach(([workflowId, workflow]) => {
            const item = this.createWorkflowListItem(workflowId, workflow);
            AppElements.workflowsList.appendChild(item);
        });
    },

    /**
     * Create workflow list item for sidebar
     */
    createWorkflowListItem(workflowId, workflow) {
        const item = document.createElement('div');
        item.className = 'experiment-item';
        
        const stepsCount = workflow.steps ? workflow.steps.length : 0;
        
        item.innerHTML = `
            <div class="title">
                <i class="fas fa-project-diagram"></i>
                ${workflow.name || workflowId}
            </div>
            <div class="subtitle">${workflow.description || 'Workflow'}</div>
            <div class="tags">
                <span class="tag is-small is-info">${stepsCount} steps</span>
            </div>
        `;
        
        item.addEventListener('click', () => {
            // Scroll to workflow in main page
            const workflowCard = Array.from(document.querySelectorAll('.workflow-card'))
                .find(card => card.textContent.includes(workflow.name || workflowId));
            if (workflowCard) {
                workflowCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                workflowCard.style.backgroundColor = '#f0f8ff';
                setTimeout(() => {
                    workflowCard.style.backgroundColor = '';
                }, 2000);
            }
        });
        
        return item;
    },

    /**
     * Create a workflow control button for experiment dependencies
     */
    createControlButton(workflowId, workflow) {
        const button = document.createElement('button');
        button.className = 'button workflow-button';
        button.dataset.workflowId = workflowId;
        button.dataset.type = 'workflow';
        
        button.innerHTML = `
            <span>${workflow.name || workflowId}</span>
            <span class="icon">
                <i class="fas fa-play"></i>
            </span>
        `;
        
        // Add console button
        const consoleBtn = document.createElement('button');
        consoleBtn.className = 'button is-small console-button';
        consoleBtn.innerHTML = '<i class="fas fa-terminal"></i>';
        consoleBtn.title = 'Open Console';
        consoleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            ConsoleManager.openDialog(workflowId, 'workflow');
        });
        
        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'field has-addons';
        buttonGroup.appendChild(button);
        buttonGroup.appendChild(consoleBtn);
        
        button.addEventListener('click', () => this.executeWorkflow(workflowId, button));
        
        return buttonGroup;
    },

    /**
     * Create a new workflow
     */
    createWorkflow() {
        this.editingWorkflow = null;
        this.clearWorkflowForm();
        document.getElementById('workflowModalTitle').textContent = 'Create Workflow';
        document.getElementById('workflowId').disabled = false;
        AppElements.workflowModal.classList.add('is-active');
    },

    /**
     * Edit an existing workflow
     */
    editWorkflow(workflowId) {
        this.editingWorkflow = workflowId;
        const workflow = AppState.workflows[workflowId];
        
        document.getElementById('workflowModalTitle').textContent = 'Edit Workflow';
        document.getElementById('workflowId').value = workflowId;
        document.getElementById('workflowId').disabled = true;
        document.getElementById('workflowName').value = workflow.name || '';
        document.getElementById('workflowDescription').value = workflow.description || '';
        document.getElementById('workflowWorkingDir').value = workflow.workingDir || '';
        
        // Clear existing steps and add workflow steps
        const stepsContainer = document.getElementById('workflowSteps');
        stepsContainer.innerHTML = '';
        
        if (workflow.steps && workflow.steps.length > 0) {
            workflow.steps.forEach(step => {
                // Convert legacy step types to new format if needed
                const convertedStep = this.convertLegacyStep(step);
                this.addWorkflowStep(convertedStep);
            });
        } else {
            stepsContainer.innerHTML = `
                <div class="has-text-centered">
                    <button type="button" class="button is-primary" onclick="WorkflowManager.addWorkflowStep()">
                        <i class="fas fa-plus"></i>
                        <span>Add First Step</span>
                    </button>
                </div>
            `;
        }
        
        AppElements.workflowModal.classList.add('is-active');
    },

    /**
     * Convert legacy step format to new format (existing only)
     */
    convertLegacyStep(step) {
        // Convert legacy steps to only use existing services/commands
        if (step.type === 'command' && step.command) {
            // Try to find if this is an existing command
            const existingCommand = Object.entries(AppState.commands).find(([id, cmd]) => cmd.command === step.command);
            if (existingCommand) {
                return {
                    ...step,
                    type: 'existing-command',
                    commandId: existingCommand[0]
                };
            } else {
                // Convert to existing-command but show warning
                return {
                    ...step,
                    type: 'existing-command',
                    commandId: ''
                };
            }
        } else if (step.type === 'service' && step.serviceId) {
            return {
                ...step,
                type: 'existing-service'
            };
        } else if (step.type === 'custom-command') {
            // Try to find matching existing command
            const existingCommand = Object.entries(AppState.commands).find(([id, cmd]) => cmd.command === step.command);
            if (existingCommand) {
                return {
                    ...step,
                    type: 'existing-command',
                    commandId: existingCommand[0]
                };
            } else {
                return {
                    ...step,
                    type: 'existing-command',
                    commandId: ''
                };
            }
        } else if (step.type === 'custom-service') {
            // Convert to existing service if possible
            const existingService = Object.entries(AppState.services).find(([id, svc]) => id === step.serviceId);
            if (existingService) {
                return {
                    ...step,
                    type: 'existing-service'
                };
            } else {
                return {
                    ...step,
                    type: 'existing-service',
                    serviceId: ''
                };
            }
        }
        
        // Step is already in new format or unknown type
        return step;
    },

    /**
     * Delete a workflow
     */
    async deleteWorkflow(workflowId) {
        if (!confirm(`Are you sure you want to delete the workflow "${workflowId}"?`)) {
            return;
        }
        
        try {
            const response = await ApiUtils.deleteWorkflow(workflowId);
            
            if (response.ok) {
                UIUtils.showNotification(`Workflow "${workflowId}" deleted successfully`, 'success');
                await ServiceManager.loadServicesAndWorkflows();
                await ServiceManager.renderWorkflowsPage();
                this.renderWorkflowsList();
            } else {
                const error = await response.json();
                UIUtils.showError(error.error || 'Failed to delete workflow');
            }
        } catch (error) {
            console.error('Error deleting workflow:', error);
            UIUtils.showError('Failed to delete workflow');
        }
    },

    /**
     * Add a workflow step (now only existing services/commands)
     */
    addWorkflowStep(stepData = null) {
        const stepsContainer = document.getElementById('workflowSteps');
        const stepIndex = stepsContainer.children.length;
        
        // Remove the "Add First Step" button if it exists
        const placeholder = stepsContainer.querySelector('.has-text-centered');
        if (placeholder) {
            placeholder.remove();
        }
        
        const stepDiv = document.createElement('div');
        stepDiv.className = 'workflow-step';
        stepDiv.innerHTML = `
            <div class="box">
                <div class="level">
                    <div class="level-left">
                        <div class="level-item">
                            <h6 class="title is-6">Step ${stepIndex + 1}</h6>
                        </div>
                    </div>
                    <div class="level-right">
                        <div class="level-item">
                            <button type="button" class="button is-small is-danger" onclick="WorkflowManager.removeWorkflowStep(this)">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="columns">
                    <div class="column">
                        <div class="field">
                            <label class="label">Step Name</label>
                            <div class="control">
                                <input class="input step-name" type="text" placeholder="e.g., Start Backend API" value="${stepData?.name || ''}">
                            </div>
                        </div>
                    </div>
                    <div class="column is-narrow">
                        <div class="field">
                            <label class="label">Type</label>
                            <div class="control">
                                <div class="select">
                                    <select class="step-type" onchange="WorkflowManager.updateStepFields(this)">
                                        <option value="existing-service" ${stepData?.type === 'existing-service' ? 'selected' : ''}>Existing Service</option>
                                        <option value="existing-command" ${stepData?.type === 'existing-command' ? 'selected' : ''}>Existing Command</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="step-fields">
                    <!-- Existing Service Field -->
                    <div class="field existing-service-field" style="display: none;">
                        <label class="label">Select Service</label>
                        <div class="control">
                            <div class="select is-fullwidth">
                                <select class="step-existing-service">
                                    <option value="">Select a service...</option>
                                    ${Object.entries(AppState.services).map(([id, service]) => 
                                        `<option value="${id}" ${stepData?.serviceId === id ? 'selected' : ''}>${service.name || id}</option>`
                                    ).join('')}
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Existing Command Field -->
                    <div class="field existing-command-field" style="display: none;">
                        <label class="label">Select Command</label>
                        <div class="control">
                            <div class="select is-fullwidth">
                                <select class="step-existing-command">
                                    <option value="">Select a command...</option>
                                    ${Object.entries(AppState.commands).map(([id, command]) => 
                                        `<option value="${id}" ${stepData?.commandId === id ? 'selected' : ''}>${command.name || id}</option>`
                                    ).join('')}
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div class="columns">
                        <div class="column">
                            <div class="field">
                                <label class="label">Working Directory</label>
                                <div class="control">
                                    <input class="input step-working-dir" type="text" placeholder="(use workflow default)" value="${stepData?.workingDir || ''}">
                                </div>
                                <p class="help">Override workflow's working directory for this step</p>
                            </div>
                        </div>
                        <div class="column is-narrow">
                            <div class="field">
                                <label class="label">Delay (ms)</label>
                                <div class="control">
                                    <input class="input step-delay" type="number" placeholder="0" value="${stepData?.delay || ''}">
                                </div>
                                <p class="help">Wait time after step completion</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="field">
                        <div class="control">
                            <label class="checkbox">
                                <input type="checkbox" class="step-continue-on-error" ${stepData?.continueOnError ? 'checked' : ''}>
                                Continue workflow on step failure
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        stepsContainer.appendChild(stepDiv);
        
        // Show correct fields based on type
        this.updateStepFields(stepDiv.querySelector('.step-type'));
        
        // Add "Add Step" button if it doesn't exist
        if (!stepsContainer.querySelector('.add-step-button')) {
            const addButtonDiv = document.createElement('div');
            addButtonDiv.className = 'has-text-centered add-step-button';
            addButtonDiv.innerHTML = `
                <button type="button" class="button is-primary" onclick="WorkflowManager.addWorkflowStep()">
                    <i class="fas fa-plus"></i>
                    <span>Add Step</span>
                </button>
            `;
            stepsContainer.appendChild(addButtonDiv);
        }
        
        // Update step numbers
        this.updateStepNumbers();
    },

    /**
     * Remove a workflow step
     */
    removeWorkflowStep(button) {
        const stepDiv = button.closest('.workflow-step');
        stepDiv.remove();
        this.updateStepNumbers();
    },

    /**
     * Update step numbers
     */
    updateStepNumbers() {
        const stepsContainer = document.getElementById('workflowSteps');
        const steps = stepsContainer.querySelectorAll('.workflow-step');
        
        steps.forEach((step, index) => {
            const title = step.querySelector('.title');
            title.textContent = `Step ${index + 1}`;
        });
        
        // If no steps left, show the "Add First Step" button
        if (steps.length === 0) {
            stepsContainer.innerHTML = `
                <div class="has-text-centered">
                    <button type="button" class="button is-primary" onclick="WorkflowManager.addWorkflowStep()">
                        <i class="fas fa-plus"></i>
                        <span>Add First Step</span>
                    </button>
                </div>
            `;
        }
    },

    /**
     * Update step fields based on type
     */
    updateStepFields(selectElement) {
        const stepDiv = selectElement.closest('.workflow-step');
        const existingServiceField = stepDiv.querySelector('.existing-service-field');
        const existingCommandField = stepDiv.querySelector('.existing-command-field');
        
        // Hide all fields first
        existingServiceField.style.display = 'none';
        existingCommandField.style.display = 'none';
        
        // Show appropriate field based on selection
        switch (selectElement.value) {
            case 'existing-service':
                existingServiceField.style.display = 'block';
                break;
            case 'existing-command':
                existingCommandField.style.display = 'block';
                break;
        }
    },

    /**
     * Save workflow (create or update)
     */
    async saveWorkflow() {
        const workflowData = {
            name: document.getElementById('workflowName').value.trim(),
            description: document.getElementById('workflowDescription').value.trim(),
            workingDir: document.getElementById('workflowWorkingDir').value.trim() || undefined,
            steps: []
        };
        
        const workflowId = document.getElementById('workflowId').value.trim();
        
        // Validation
        if (!workflowId) {
            UIUtils.showError('Workflow ID is required');
            return;
        }
        
        if (!workflowData.name) {
            UIUtils.showError('Workflow name is required');
            return;
        }
        
        // Collect steps
        const stepElements = document.querySelectorAll('.workflow-step');
        for (let i = 0; i < stepElements.length; i++) {
            const stepEl = stepElements[i];
            const type = stepEl.querySelector('.step-type').value;
            const step = {
                name: stepEl.querySelector('.step-name').value.trim(),
                type: type
            };
            
            // Handle different step types (only existing services/commands now)
            switch (type) {
                case 'existing-service':
                    step.serviceId = stepEl.querySelector('.step-existing-service').value;
                    if (!step.serviceId) {
                        UIUtils.showError(`Step ${i + 1}: Please select a service`);
                        return;
                    }
                    break;
                case 'existing-command':
                    step.commandId = stepEl.querySelector('.step-existing-command').value;
                    if (!step.commandId) {
                        UIUtils.showError(`Step ${i + 1}: Please select a command`);
                        return;
                    }
                    break;
            }
            
            const workingDir = stepEl.querySelector('.step-working-dir').value.trim();
            if (workingDir) step.workingDir = workingDir;
            
            const delay = parseInt(stepEl.querySelector('.step-delay').value);
            if (delay > 0) step.delay = delay;
            
            step.continueOnError = stepEl.querySelector('.step-continue-on-error').checked;
            
            workflowData.steps.push(step);
        }
        
        try {
            let response;
            if (this.editingWorkflow) {
                // Update existing workflow
                response = await ApiUtils.updateWorkflow(workflowId, workflowData);
            } else {
                // Create new workflow
                response = await ApiUtils.createWorkflow(workflowId, workflowData);
            }
            
            if (response.ok) {
                const action = this.editingWorkflow ? 'updated' : 'created';
                UIUtils.showNotification(`Workflow "${workflowId}" ${action} successfully`, 'success');
                this.closeWorkflowModal();
                await ServiceManager.loadServicesAndWorkflows();
                await ServiceManager.renderWorkflowsPage();
                this.renderWorkflowsList();
            } else {
                const error = await response.json();
                UIUtils.showError(error.error || `Failed to ${this.editingWorkflow ? 'update' : 'create'} workflow`);
            }
        } catch (error) {
            console.error('Error saving workflow:', error);
            UIUtils.showError('Failed to save workflow');
        }
    },

    /**
     * Clear workflow form
     */
    clearWorkflowForm() {
        document.getElementById('workflowId').value = '';
        document.getElementById('workflowName').value = '';
        document.getElementById('workflowDescription').value = '';
        document.getElementById('workflowWorkingDir').value = '';
        document.getElementById('workflowSteps').innerHTML = `
            <div class="has-text-centered">
                <button type="button" class="button is-primary" onclick="WorkflowManager.addWorkflowStep()">
                    <i class="fas fa-plus"></i>
                    <span>Add First Step</span>
                </button>
            </div>
        `;
    },

    /**
     * Close workflow modal
     */
    closeWorkflowModal() {
        AppElements.workflowModal.classList.remove('is-active');
        this.editingWorkflow = null;
    },

    /**
     * Execute workflow from card (new method for page cards)
     */
    async executeFromCard(workflowId) {
        const workflow = AppState.workflows[workflowId];
        
        try {
            UIUtils.showLoadingModal(`Executing workflow: ${workflow.name || workflowId}...`);
            
            // Open console dialog for workflow
            ConsoleManager.openDialog(workflowId, 'workflow');
            
            const response = await ApiUtils.executeWorkflow(workflowId);
            const result = await response.json();
            
            UIUtils.showNotification(`Workflow ${workflow.name || workflowId} executed successfully`, 'success');
            
            // Refresh services in case new ones were started
            await ServiceManager.loadServicesAndWorkflows();
            if (AppState.currentPage === 'services') {
                await ServiceManager.renderServicesPage();
                ServiceManager.renderServicesList();
            } else if (AppState.currentPage === 'workflows') {
                await ServiceManager.renderWorkflowsPage();
                this.renderWorkflowsList();
            }
            
        } catch (error) {
            console.error('Error executing workflow:', error);
            UIUtils.showNotification(`Failed to execute workflow ${workflow.name || workflowId}`, 'danger');
        } finally {
            UIUtils.hideLoadingModal();
        }
    },

    /**
     * Execute workflow from dashboard (kept for backward compatibility)
     */
    async executeFromDashboard(workflowId) {
        return this.executeFromCard(workflowId);
    },

    /**
     * Execute a workflow from experiment dependencies
     */
    async executeWorkflow(workflowId, button) {
        button.disabled = true;
        button.classList.add('is-loading');
        
        UIUtils.showLoadingModal(`Executing workflow: ${AppState.workflows[workflowId].name || workflowId}...`);
        
        // Open console dialog for workflow
        ConsoleManager.openDialog(workflowId, 'workflow');
        
        try {
            const response = await ApiUtils.executeWorkflow(workflowId);
            const result = await response.json();
            console.log(result.message);
            
            UIUtils.showNotification(`Workflow ${AppState.workflows[workflowId].name || workflowId} executed successfully`, 'success');
            
        } catch (error) {
            console.error('Error executing workflow:', error);
            UIUtils.showNotification(`Failed to execute workflow ${AppState.workflows[workflowId].name || workflowId}`, 'danger');
        } finally {
            UIUtils.hideLoadingModal();
            button.classList.remove('is-loading');
        }
    }
};

// Make functions available globally for HTML onclick handlers
window.createWorkflow = () => WorkflowManager.createWorkflow();
window.saveWorkflow = () => WorkflowManager.saveWorkflow();
window.closeWorkflowModal = () => WorkflowManager.closeWorkflowModal();
window.refreshWorkflows = () => refreshWorkflows();