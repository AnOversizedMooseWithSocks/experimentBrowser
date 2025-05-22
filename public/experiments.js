/**
 * Experiment Management Module - Enhanced with better required workflow feedback
 * Handles loading, displaying, and managing experiment data with support for required workflows and documentation
 */

const ExperimentManager = {
    // State for editing experiments
    editingExperiment: null,
    
    // Track required workflow completion state and last run times
    requiredWorkflowsCompleted: false,
    workflowLastRun: new Map(), // Track when workflows were last executed

    /**
     * Load experiments from the server
     */
    async loadExperiments() {
        try {
            const response = await fetch('/api/experiments');
            AppState.experiments = await response.json();
            this.renderList();
        } catch (error) {
            console.error('Error loading experiments:', error);
            UIUtils.showError('Failed to load experiments');
        }
    },

    /**
     * Render the list of experiments in the sidebar
     */
    renderList(filteredExperiments = AppState.experiments) {
        AppElements.experimentList.innerHTML = '';
        
        if (filteredExperiments.length === 0) {
            AppElements.experimentList.innerHTML = `
                <div class="has-text-centered has-text-grey">
                    <i class="fas fa-search"></i>
                    <p>No experiments found</p>
                </div>
            `;
            return;
        }
        
        filteredExperiments.forEach(experiment => {
            const item = this.createExperimentItem(experiment);
            AppElements.experimentList.appendChild(item);
        });
    },

    /**
     * Create a single experiment list item
     */
    createExperimentItem(experiment) {
        const item = document.createElement('div');
        item.className = 'experiment-item';
        item.dataset.folder = experiment.folder;
        
        // Create rating stars
        const rating = UIUtils.createRatingStars(experiment.rating || 0);
        
        // Create tags (limit to 3 for display)
        const tags = (experiment.tags || []).slice(0, 3).map(tag => 
            `<span class="tag is-small">${tag}</span>`
        ).join('');
        
        item.innerHTML = `
            <div class="title">${experiment.name}</div>
            <div class="subtitle">${experiment.description || 'No description'}</div>
            <div class="tags">${tags}</div>
            <div class="experiment-rating">${rating}</div>
        `;
        
        // Add click handler to select experiment
        item.addEventListener('click', () => this.selectExperiment(experiment));
        
        return item;
    },

    /**
     * Select an experiment and show its details
     */
    selectExperiment(experiment) {
        AppState.selectedExperiment = experiment;
        
        // Check if required workflows have been run for this experiment
        this.checkRequiredWorkflowsStatus(experiment);
        
        // Update active state in sidebar list
        document.querySelectorAll('.experiment-item').forEach(item => {
            item.classList.remove('is-active');
        });
        
        const selectedItem = document.querySelector(`[data-folder="${experiment.folder}"]`);
        if (selectedItem) {
            selectedItem.classList.add('is-active');
        }
        
        // Show experiment details
        this.showDetails(experiment);
        
        // Hide experiment frame and show details
        AppElements.experimentFrame.style.display = 'none';
        AppElements.defaultState.style.display = 'none';
        AppElements.experimentDetails.style.display = 'block';
    },

    /**
     * Check if required workflows have been completed for this experiment
     */
    checkRequiredWorkflowsStatus(experiment) {
        if (!experiment.requiredWorkflows || experiment.requiredWorkflows.length === 0) {
            this.requiredWorkflowsCompleted = true;
            return;
        }
        
        // Check if all required workflows have been run and their services are still running
        let allCompleted = true;
        for (const workflowId of experiment.requiredWorkflows) {
            const lastRun = this.workflowLastRun.get(workflowId);
            if (!lastRun) {
                allCompleted = false;
                break;
            }
            
            // Check if workflow started any services that should still be running
            const workflow = AppState.workflows[workflowId];
            if (workflow && workflow.steps) {
                for (const step of workflow.steps) {
                    if ((step.type === 'existing-service' || step.type === 'custom-service') && step.serviceId) {
                        // If a service was started but is no longer running, workflows need to be re-run
                        if (!AppState.services[step.serviceId]?.isRunning) {
                            allCompleted = false;
                            break;
                        }
                    }
                }
                if (!allCompleted) break;
            }
        }
        
        this.requiredWorkflowsCompleted = allCompleted;
    },

    /**
     * Show experiment details panel with enhanced features
     */
    async showDetails(experiment) {
        // Update basic information
        document.getElementById('experimentTitle').textContent = experiment.name;
        document.getElementById('experimentDescription').textContent = experiment.description || 'No description';
        
        // Update rating display
        const ratingEl = document.getElementById('experimentRating');
        ratingEl.innerHTML = UIUtils.createRatingStars(experiment.rating || 0);
        
        // Update tags
        const tagsEl = document.getElementById('experimentTags');
        tagsEl.innerHTML = '';
        (experiment.tags || []).forEach(tag => {
            const tagEl = document.createElement('span');
            tagEl.className = 'tag is-info is-light';
            tagEl.textContent = tag;
            tagsEl.appendChild(tagEl);
        });
        
        // Setup required workflows
        this.setupRequiredWorkflows(experiment.requiredWorkflows || []);
        
        // Setup optional workflows
        this.setupOptionalWorkflows(experiment.optionalWorkflows || []);
        
        // Setup service and workflow dependencies
        this.setupDependencyControls(experiment.dependencies || []);
        
        // Load and display documentation
        await this.loadDocumentation(experiment);
        
        // Update Load Experiment button state
        this.updateLoadExperimentButton(experiment);
    },

    /**
     * Setup required workflows section with last run information and service status
     */
    setupRequiredWorkflows(requiredWorkflows) {
        const requiredSection = document.getElementById('requiredWorkflows');
        const buttonsContainer = document.getElementById('requiredWorkflowButtons');
        const runRequiredBtn = document.getElementById('runRequiredBtn');
        
        if (requiredWorkflows.length === 0) {
            requiredSection.style.display = 'none';
            runRequiredBtn.style.display = 'none';
            this.requiredWorkflowsCompleted = true;
            return;
        }
        
        requiredSection.style.display = 'block';
        buttonsContainer.innerHTML = '';
        
        // Create workflow buttons with last run information
        requiredWorkflows.forEach(workflowId => {
            const workflow = AppState.workflows[workflowId];
            if (workflow) {
                const buttonContainer = this.createWorkflowButtonWithStatus(workflowId, workflow);
                buttonsContainer.appendChild(buttonContainer);
            } else {
                // Show a warning for missing required workflow
                const warningBtn = document.createElement('span');
                warningBtn.className = 'tag is-warning';
                warningBtn.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${workflowId} (missing)`;
                buttonsContainer.appendChild(warningBtn);
            }
        });
        
        // Show/hide run required button based on completion status
        if (this.requiredWorkflowsCompleted) {
            runRequiredBtn.style.display = 'none';
        } else {
            runRequiredBtn.style.display = 'inline-flex';
        }
        
        // Update Load Experiment button after setting up required workflows
        this.updateLoadExperimentButton(AppState.selectedExperiment);
    },

    /**
     * Setup optional workflows section with last run information and service status
     */
    setupOptionalWorkflows(optionalWorkflows) {
        const optionalSection = document.getElementById('optionalWorkflows');
        const buttonsContainer = document.getElementById('optionalWorkflowButtons');
        
        if (!optionalWorkflows || optionalWorkflows.length === 0) {
            optionalSection.style.display = 'none';
            return;
        }
        
        optionalSection.style.display = 'block';
        buttonsContainer.innerHTML = '';
        
        // Create workflow buttons with last run information
        optionalWorkflows.forEach(workflowId => {
            const workflow = AppState.workflows[workflowId];
            if (workflow) {
                const buttonContainer = this.createWorkflowButtonWithStatus(workflowId, workflow);
                buttonsContainer.appendChild(buttonContainer);
            } else {
                // Show a warning for missing optional workflow
                const warningBtn = document.createElement('span');
                warningBtn.className = 'tag is-warning';
                warningBtn.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${workflowId} (missing)`;
                buttonsContainer.appendChild(warningBtn);
            }
        });
    },

    /**
     * Create workflow button with last run time and service status
     */
    createWorkflowButtonWithStatus(workflowId, workflow) {
        const container = document.createElement('div');
        container.className = 'workflow-button-container';
        
        // Create main workflow button
        const button = document.createElement('button');
        button.className = 'button workflow-button';
        button.innerHTML = `
            <span>${workflow.name || workflowId}</span>
            <span class="icon">
                <i class="fas fa-play"></i>
            </span>
        `;
        
        // Create console button
        const consoleBtn = document.createElement('button');
        consoleBtn.className = 'button is-small console-button';
        consoleBtn.innerHTML = '<i class="fas fa-terminal"></i>';
        consoleBtn.title = 'Open Console';
        consoleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            ConsoleManager.openDialog(workflowId, 'workflow');
        });
        
        // Create status information
        const statusInfo = document.createElement('div');
        statusInfo.className = 'workflow-status-info';
        
        const lastRun = this.workflowLastRun.get(workflowId);
        if (lastRun) {
            const timeAgo = this.getTimeAgo(lastRun);
            statusInfo.innerHTML = `<small class="has-text-grey">Last run: ${timeAgo}</small>`;
            
            // Check for running services started by this workflow
            const runningServices = this.getRunningServicesFromWorkflow(workflow);
            if (runningServices.length > 0) {
                const servicesList = runningServices.map(s => s.name || s.id).join(', ');
                statusInfo.innerHTML += `<br><small class="has-text-success"><i class="fas fa-circle"></i> Services running: ${servicesList}</small>`;
            }
        } else {
            statusInfo.innerHTML = `<small class="has-text-warning">Not yet run</small>`;
        }
        
        // Button group for workflow and console
        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'field has-addons';
        buttonGroup.style.marginBottom = '0.5rem';
        
        const buttonControl = document.createElement('div');
        buttonControl.className = 'control';
        buttonControl.appendChild(button);
        
        const consoleControl = document.createElement('div');
        consoleControl.className = 'control';
        consoleControl.appendChild(consoleBtn);
        
        buttonGroup.appendChild(buttonControl);
        buttonGroup.appendChild(consoleControl);
        
        container.appendChild(buttonGroup);
        container.appendChild(statusInfo);
        
        button.addEventListener('click', () => this.executeRequiredWorkflow(workflowId, button));
        
        return container;
    },

    /**
     * Get services that are currently running from a workflow's steps
     */
    getRunningServicesFromWorkflow(workflow) {
        const runningServices = [];
        
        if (!workflow.steps) return runningServices;
        
        for (const step of workflow.steps) {
            if ((step.type === 'existing-service' || step.type === 'custom-service') && step.serviceId) {
                const service = AppState.services[step.serviceId];
                if (service && service.isRunning) {
                    runningServices.push({ id: step.serviceId, name: service.name });
                }
            }
        }
        
        return runningServices;
    },

    /**
     * Get human-readable time ago string
     */
    getTimeAgo(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        return 'Just now';
    },

    /**
     * Execute a single required workflow
     */
    async executeRequiredWorkflow(workflowId, button) {
        button.disabled = true;
        button.classList.add('is-loading');
        
        UIUtils.showLoadingModal(`Executing workflow: ${AppState.workflows[workflowId].name || workflowId}...`);
        
        // Open console dialog for workflow
        ConsoleManager.openDialog(workflowId, 'workflow');
        
        try {
            const response = await ApiUtils.executeWorkflow(workflowId);
            const result = await response.json();
            
            // Record the execution time
            this.workflowLastRun.set(workflowId, new Date());
            
            // Check if all required workflows are now completed
            this.checkRequiredWorkflowsStatus(AppState.selectedExperiment);
            
            // Refresh services in case new ones were started
            await ServiceManager.loadServicesAndWorkflows();
            
            // Re-setup the required workflows section to show updated status
            this.setupRequiredWorkflows(AppState.selectedExperiment.requiredWorkflows || []);
            this.setupOptionalWorkflows(AppState.selectedExperiment.optionalWorkflows || []);
            this.setupDependencyControls(AppState.selectedExperiment.dependencies || []);
            
            UIUtils.showNotification(`Workflow ${AppState.workflows[workflowId].name || workflowId} executed successfully`, 'success');
            
        } catch (error) {
            console.error('Error executing workflow:', error);
            UIUtils.showNotification(`Failed to execute workflow ${AppState.workflows[workflowId].name || workflowId}`, 'danger');
        } finally {
            UIUtils.hideLoadingModal();
            button.classList.remove('is-loading');
            button.disabled = false;
        }
    },

    /**
     * Update Load Experiment button state based on required workflows
     */
    updateLoadExperimentButton(experiment) {
        const loadExperimentBtn = document.getElementById('loadExperimentBtn');
        const loadExperimentNewWindowBtn = document.getElementById('loadExperimentNewWindowBtn');
        
        if (!experiment) {
            loadExperimentBtn.disabled = true;
            loadExperimentNewWindowBtn.disabled = true;
            return;
        }
        
        const hasRequiredWorkflows = experiment.requiredWorkflows && experiment.requiredWorkflows.length > 0;
        
        if (hasRequiredWorkflows && !this.requiredWorkflowsCompleted) {
            // Disable buttons if required workflows haven't been completed
            loadExperimentBtn.disabled = true;
            loadExperimentNewWindowBtn.disabled = true;
            loadExperimentBtn.title = 'Please run required workflows first';
            loadExperimentNewWindowBtn.title = 'Please run required workflows first';
            loadExperimentBtn.innerHTML = `
                <i class="fas fa-lock"></i>
                <span>Run Required Workflows First</span>
            `;
            loadExperimentNewWindowBtn.innerHTML = `
                <i class="fas fa-lock"></i>
                <span>Run Required Workflows First</span>
            `;
        } else {
            // Enable buttons if no required workflows or they're completed
            loadExperimentBtn.disabled = false;
            loadExperimentNewWindowBtn.disabled = false;
            loadExperimentBtn.title = 'Load and run the experiment';
            loadExperimentNewWindowBtn.title = 'Open the experiment in a new window';
            loadExperimentBtn.innerHTML = `
                <i class="fas fa-play"></i>
                <span>Load Experiment</span>
            `;
            loadExperimentNewWindowBtn.innerHTML = `
                <i class="fas fa-external-link-alt"></i>
                <span>Open in New Window</span>
            `;
        }
    },

    /**
     * Setup service and workflow control buttons for dependencies
     */
    setupDependencyControls(dependencies) {
        const serviceControls = document.getElementById('serviceControls');
        const serviceButtons = document.getElementById('serviceButtons');
        
        if (dependencies.length === 0) {
            serviceControls.style.display = 'none';
            return;
        }
        
        serviceControls.style.display = 'block';
        serviceButtons.innerHTML = '';
        
        dependencies.forEach(dependencyId => {
            const service = AppState.services[dependencyId];
            const workflow = AppState.workflows[dependencyId];
            
            if (service) {
                const button = ServiceManager.createControlButton(dependencyId, service);
                serviceButtons.appendChild(button);
            } else if (workflow) {
                const button = WorkflowManager.createControlButton(dependencyId, workflow);
                serviceButtons.appendChild(button);
            } else {
                console.warn(`Dependency ${dependencyId} not found in services or workflows`);
                // Show a warning for missing dependency
                const warningBtn = document.createElement('span');
                warningBtn.className = 'tag is-warning';
                warningBtn.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${dependencyId} (missing)`;
                serviceButtons.appendChild(warningBtn);
            }
        });
    },

    /**
     * Load and display documentation files for an experiment
     */
    async loadDocumentation(experiment) {
        const docSection = document.getElementById('documentationSection');
        const docButtons = document.getElementById('documentationButtons');
        
        try {
            const response = await fetch(`/api/experiments/${experiment.folder}/documentation`);
            if (response.ok) {
                const docs = await response.json();
                
                if (docs.length === 0) {
                    docSection.style.display = 'none';
                    return;
                }
                
                docSection.style.display = 'block';
                docButtons.innerHTML = '';
                
                docs.forEach(doc => {
                    const button = document.createElement('button');
                    button.className = 'button is-small documentation-button';
                    
                    // Determine icon based on file type
                    const icon = doc.isMarkdown ? 'fa-markdown' : 'fa-file-text';
                    
                    button.innerHTML = `
                        <span class="icon">
                            <i class="fab ${icon}"></i>
                        </span>
                        <span>${doc.name}</span>
                    `;
                    
                    button.addEventListener('click', () => this.showDocumentation(experiment.folder, doc));
                    docButtons.appendChild(button);
                });
            } else {
                docSection.style.display = 'none';
            }
        } catch (error) {
            console.error('Error loading documentation:', error);
            docSection.style.display = 'none';
        }
    },

    /**
     * Show documentation in a modal
     */
    async showDocumentation(folder, doc) {
        try {
            const response = await fetch(`/api/experiments/${folder}/documentation/${doc.filename}`);
            if (response.ok) {
                const content = await response.text();
                
                document.getElementById('documentationTitle').textContent = doc.name;
                const contentEl = document.getElementById('documentationContent');
                
                if (doc.isMarkdown) {
                    // Use Marked.js to parse markdown
                    contentEl.innerHTML = marked.parse(content);
                } else {
                    // Display as preformatted text
                    contentEl.innerHTML = `<pre style="white-space: pre-wrap;">${this.escapeHtml(content)}</pre>`;
                }
                
                AppElements.documentationModal.classList.add('is-active');
            } else {
                UIUtils.showError(`Failed to load documentation: ${doc.name}`);
            }
        } catch (error) {
            console.error('Error showing documentation:', error);
            UIUtils.showError('Failed to display documentation');
        }
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
     * Close documentation modal
     */
    closeDocumentationModal() {
        AppElements.documentationModal.classList.remove('is-active');
    },

    /**
     * Run all required workflows for the selected experiment - Enhanced with better feedback
     */
    async runRequiredWorkflows() {
        if (!AppState.selectedExperiment || !AppState.selectedExperiment.requiredWorkflows) {
            return;
        }
        
        const requiredWorkflows = AppState.selectedExperiment.requiredWorkflows;
        
        try {
            // Show enhanced progress modal
            this.showWorkflowProgressModal(requiredWorkflows);
            
            for (let i = 0; i < requiredWorkflows.length; i++) {
                const workflowId = requiredWorkflows[i];
                const workflow = AppState.workflows[workflowId];
                
                if (workflow) {
                    // Update progress
                    this.updateWorkflowProgress(i + 1, requiredWorkflows.length, workflowId, workflow.name || workflowId);
                    
                    console.log(`Running required workflow: ${workflowId}`);
                    
                    // Open console for the workflow
                    ConsoleManager.openDialog(workflowId, 'workflow');
                    
                    // Execute the workflow
                    const response = await ApiUtils.executeWorkflow(workflowId);
                    const result = await response.json();
                    
                    console.log(`Required workflow ${workflowId} completed`);
                    
                    // Record the execution time
                    this.workflowLastRun.set(workflowId, new Date());
                    
                    // Update progress to completed state
                    this.updateWorkflowProgressItem(i, 'completed');
                } else {
                    console.warn(`Required workflow ${workflowId} not found`);
                    this.updateWorkflowProgressItem(i, 'error', `Workflow not found: ${workflowId}`);
                    UIUtils.showError(`Required workflow ${workflowId} not found`);
                }
                
                // Small delay between workflows
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            // All workflows completed
            this.updateWorkflowProgress(requiredWorkflows.length, requiredWorkflows.length, 'All workflows', 'All required workflows completed successfully', true);
            
            // Mark required workflows as completed
            this.requiredWorkflowsCompleted = true;
            
            // Refresh service states after running workflows
            await ServiceManager.loadServicesAndWorkflows();
            this.setupRequiredWorkflows(requiredWorkflows);
            this.setupOptionalWorkflows(AppState.selectedExperiment.optionalWorkflows || []);
            this.setupDependencyControls(AppState.selectedExperiment.dependencies || []);
            
            // Hide progress modal after a short delay
            setTimeout(() => {
                UIUtils.hideLoadingModal();
            }, 2000);
            
            UIUtils.showNotification('All required workflows completed successfully - experiment ready to load!', 'success');
        } catch (error) {
            console.error('Error running required workflows:', error);
            UIUtils.showError('Failed to run required workflows');
            UIUtils.hideLoadingModal();
        }
    },

    /**
     * Show enhanced workflow progress modal
     */
    showWorkflowProgressModal(workflows) {
        const modal = AppElements.loadingModal;
        const messageEl = document.getElementById('loadingMessage');
        
        // Create enhanced progress content
        messageEl.innerHTML = `
            <div class="workflow-progress-container">
                <div class="progress-header">
                    <h4 class="title is-5">Running Required Workflows</h4>
                    <div class="progress-bar-container">
                        <progress class="progress is-primary" id="workflowProgress" value="0" max="${workflows.length}"></progress>
                        <div class="progress-text">
                            <span id="progressText">Preparing...</span>
                        </div>
                    </div>
                </div>
                <div class="workflow-list" id="workflowProgressList">
                    ${workflows.map((workflowId, index) => {
                        const workflow = AppState.workflows[workflowId];
                        return `
                            <div class="workflow-progress-item" id="workflow-${index}">
                                <div class="workflow-progress-icon">
                                    <i class="fas fa-circle-notch fa-spin" style="display: none;"></i>
                                    <i class="fas fa-clock" style="color: #666;"></i>
                                    <i class="fas fa-check-circle" style="display: none; color: #48c774;"></i>
                                    <i class="fas fa-times-circle" style="display: none; color: #f14668;"></i>
                                </div>
                                <div class="workflow-progress-info">
                                    <div class="workflow-progress-name">${workflow ? workflow.name || workflowId : workflowId}</div>
                                    <div class="workflow-progress-status">Waiting...</div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        
        modal.classList.add('is-active');
    },

    /**
     * Update workflow progress
     */
    updateWorkflowProgress(current, total, currentWorkflow, currentName, allCompleted = false) {
        const progressBar = document.getElementById('workflowProgress');
        const progressText = document.getElementById('progressText');
        
        if (progressBar && progressText) {
            progressBar.value = current;
            
            if (allCompleted) {
                progressText.textContent = 'All workflows completed!';
            } else {
                progressText.textContent = `${current}/${total} - Running: ${currentName}`;
            }
        }
    },

    /**
     * Update individual workflow progress item
     */
    updateWorkflowProgressItem(index, status, errorMessage = null) {
        const item = document.getElementById(`workflow-${index}`);
        if (!item) return;
        
        const icons = item.querySelectorAll('i');
        const statusEl = item.querySelector('.workflow-progress-status');
        
        // Hide all icons first
        icons.forEach(icon => icon.style.display = 'none');
        
        switch (status) {
            case 'running':
                icons[0].style.display = 'inline-block'; // spinning icon
                statusEl.textContent = 'Running...';
                statusEl.style.color = '#3273dc';
                break;
            case 'completed':
                icons[2].style.display = 'inline-block'; // check icon
                statusEl.textContent = 'Completed';
                statusEl.style.color = '#48c774';
                break;
            case 'error':
                icons[3].style.display = 'inline-block'; // error icon
                statusEl.textContent = errorMessage || 'Error';
                statusEl.style.color = '#f14668';
                break;
            default:
                icons[1].style.display = 'inline-block'; // waiting icon
                statusEl.textContent = 'Waiting...';
                statusEl.style.color = '#666';
        }
    },

    /**
     * Load the selected experiment in an iframe
     */
    loadExperiment() {
        if (!AppState.selectedExperiment) return;
        
        // Check if required workflows are needed and completed
        const hasRequiredWorkflows = AppState.selectedExperiment.requiredWorkflows && 
                                     AppState.selectedExperiment.requiredWorkflows.length > 0;
        
        if (hasRequiredWorkflows && !this.requiredWorkflowsCompleted) {
            UIUtils.showError('Please run required workflows before loading the experiment');
            return;
        }
        
        const frameTitle = document.getElementById('frameTitle');
        const iframe = document.getElementById('experimentIframe');
        
        frameTitle.textContent = AppState.selectedExperiment.name;
        // Use the actual HTML file name instead of assuming index.html
        iframe.src = `/experiments/${AppState.selectedExperiment.folder}/${AppState.selectedExperiment.htmlFile || 'index.html'}`;
        
        // Show frame and hide details
        AppElements.experimentDetails.style.display = 'none';
        AppElements.defaultState.style.display = 'none';
        AppElements.experimentFrame.style.display = 'block';
        
        // Update the experiment frame sidebar state
        if (!AppState.sidebarCollapsed) {
            AppElements.experimentFrame.classList.add('sidebar-visible');
        }
    },
    
    /**
     * Load the selected experiment in a new window
     */
    loadExperimentInNewWindow() {
        if (!AppState.selectedExperiment) return;
        
        // Check if required workflows are needed and completed
        const hasRequiredWorkflows = AppState.selectedExperiment.requiredWorkflows && 
                                     AppState.selectedExperiment.requiredWorkflows.length > 0;
        
        if (hasRequiredWorkflows && !this.requiredWorkflowsCompleted) {
            UIUtils.showError('Please run required workflows before opening the experiment');
            return;
        }
        
        // Generate the URL for the experiment
        const experimentUrl = `/experiments/${AppState.selectedExperiment.folder}/${AppState.selectedExperiment.htmlFile || 'index.html'}`;
        
        // Open the experiment in a new window
        window.open(experimentUrl, '_blank', 'width=1024,height=768');
        
        // Show a notification
        UIUtils.showNotification(`Opened ${AppState.selectedExperiment.name} in new window`, 'success');
    },

    /**
     * Close the experiment frame
     */
    closeExperiment() {
        const iframe = document.getElementById('experimentIframe');
        iframe.src = '';
        
        // Show details again
        AppElements.experimentFrame.style.display = 'none';
        if (AppState.selectedExperiment) {
            AppElements.experimentDetails.style.display = 'block';
        } else {
            AppElements.defaultState.style.display = 'block';
        }
    },

    /**
     * Open the edit modal for the selected experiment
     */
    editExperiment() {
        if (!AppState.selectedExperiment) return;
        
        this.editingExperiment = { ...AppState.selectedExperiment };
        
        // Fill the form with current values
        document.getElementById('editName').value = this.editingExperiment.name;
        document.getElementById('editDescription').value = this.editingExperiment.description || '';
        document.getElementById('editRating').value = this.editingExperiment.rating || 0;
        
        // Update rating display
        this.updateRatingDisplay();
        
        // Set up tags and required/optional workflows
        this.setupTagsInput(this.editingExperiment.tags || []);
        this.setupRequiredWorkflowsSelector(this.editingExperiment.requiredWorkflows || []);
        this.setupOptionalWorkflowsSelector(this.editingExperiment.optionalWorkflows || []);
        
        // Show modal
        AppElements.editModal.classList.add('is-active');
    },

    /**
     * Close the edit modal
     */
    closeEditModal() {
        AppElements.editModal.classList.remove('is-active');
        this.editingExperiment = null;
    },

    /**
     * Update the rating display in the edit modal
     */
    updateRatingDisplay() {
        const rating = parseInt(document.getElementById('editRating').value);
        const display = document.getElementById('editRatingDisplay');
        
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += `<span class="rating-star ${i <= rating ? '' : 'empty'}">★</span>`;
        }
        display.innerHTML = stars;
    },

    /**
     * Setup tags input with existing tags
     */
    setupTagsInput(tags) {
        const container = document.getElementById('tagsInput');
        const input = document.getElementById('tagInput');
        
        // Clear existing tags
        const existingTags = container.querySelectorAll('.tag-item');
        existingTags.forEach(tag => tag.remove());
        
        // Add existing tags
        tags.forEach(tag => UIUtils.addTagToInput(tag, container, input));
    },

    /**
     * Setup required workflows selector with existing workflows
     */
    setupRequiredWorkflowsSelector(selectedWorkflows) {
        const selector = document.getElementById('workflowSelector');
        const selectedContainer = document.getElementById('selectedWorkflows');
        
        // Clear existing options and selections
        selector.innerHTML = '<option value="">Select a workflow to add...</option>';
        selectedContainer.innerHTML = '';
        
        // Populate selector with available workflows
        Object.entries(AppState.workflows).forEach(([workflowId, workflow]) => {
            if (!selectedWorkflows.includes(workflowId)) {
                const option = document.createElement('option');
                option.value = workflowId;
                option.textContent = workflow.name || workflowId;
                selector.appendChild(option);
            }
        });
        
        // Add selected workflows as tags
        selectedWorkflows.forEach(workflowId => {
            const workflow = AppState.workflows[workflowId];
            this.addWorkflowTag(workflowId, workflow ? workflow.name || workflowId : workflowId, 'required');
        });
    },

    /**
     * Setup optional workflows selector with existing workflows
     */
    setupOptionalWorkflowsSelector(selectedWorkflows) {
        const selector = document.getElementById('optionalWorkflowSelector');
        const selectedContainer = document.getElementById('selectedOptionalWorkflows');
        
        if (!selectedWorkflows) selectedWorkflows = [];
        
        // Clear existing options and selections
        selector.innerHTML = '<option value="">Select a workflow to add...</option>';
        selectedContainer.innerHTML = '';
        
        // Get all workflows that aren't already in required workflows
        const requiredWorkflows = this.getSelectedWorkflows();
        
        // Populate selector with available workflows
        Object.entries(AppState.workflows).forEach(([workflowId, workflow]) => {
            if (!selectedWorkflows.includes(workflowId) && !requiredWorkflows.includes(workflowId)) {
                const option = document.createElement('option');
                option.value = workflowId;
                option.textContent = workflow.name || workflowId;
                selector.appendChild(option);
            }
        });
        
        // Add selected workflows as tags
        selectedWorkflows.forEach(workflowId => {
            const workflow = AppState.workflows[workflowId];
            this.addWorkflowTag(workflowId, workflow ? workflow.name || workflowId : workflowId, 'optional');
        });
    },

    /**
     * Add a workflow tag to the selected workflows container
     */
    addWorkflowTag(workflowId, workflowName, type = 'required') {
        const selectedContainer = type === 'required' ? 
            document.getElementById('selectedWorkflows') : 
            document.getElementById('selectedOptionalWorkflows');
            
        const tag = document.createElement('span');
        tag.className = 'tag is-primary workflow-tag';
        tag.dataset.workflowId = workflowId;
        tag.innerHTML = `
            ${workflowName}
            <button class="delete is-small" onclick="ExperimentManager.removeWorkflowTag('${workflowId}', '${type}')"></button>
        `;
        selectedContainer.appendChild(tag);
    },

    /**
     * Remove a workflow tag from the selected workflows
     */
    removeWorkflowTag(workflowId, type = 'required') {
        const containerSelector = type === 'required' ? '.workflow-tag[data-workflow-id="${workflowId}"]' : 
                                                     '#selectedOptionalWorkflows .workflow-tag[data-workflow-id="${workflowId}"]';
        
        const tag = document.querySelector(containerSelector.replace('${workflowId}', workflowId));
        if (tag) {
            tag.remove();
            
            // Add the workflow back to the appropriate selector
            const selector = type === 'required' ? 
                document.getElementById('workflowSelector') : 
                document.getElementById('optionalWorkflowSelector');
                
            const workflow = AppState.workflows[workflowId];
            if (workflow) {
                const option = document.createElement('option');
                option.value = workflowId;
                option.textContent = workflow.name || workflowId;
                selector.appendChild(option);
            }
        }
    },

    /**
     * Add selected workflow from dropdown
     */
    addSelectedWorkflow() {
        const selector = document.getElementById('workflowSelector');
        const workflowId = selector.value;
        
        if (!workflowId) return;
        
        const workflow = AppState.workflows[workflowId];
        const workflowName = workflow ? workflow.name || workflowId : workflowId;
        
        // Add the workflow tag
        this.addWorkflowTag(workflowId, workflowName, 'required');
        
        // Remove from selector
        const option = selector.querySelector(`option[value="${workflowId}"]`);
        if (option) {
            option.remove();
        }
        
        // Also remove from optional selector if present
        const optionalSelector = document.getElementById('optionalWorkflowSelector');
        const optionalOption = optionalSelector.querySelector(`option[value="${workflowId}"]`);
        if (optionalOption) {
            optionalOption.remove();
        }
        
        // Reset selector
        selector.value = '';
    },

    /**
     * Add selected optional workflow from dropdown
     */
    addSelectedOptionalWorkflow() {
        const selector = document.getElementById('optionalWorkflowSelector');
        const workflowId = selector.value;
        
        if (!workflowId) return;
        
        const workflow = AppState.workflows[workflowId];
        const workflowName = workflow ? workflow.name || workflowId : workflowId;
        
        // Add the workflow tag
        this.addWorkflowTag(workflowId, workflowName, 'optional');
        
        // Remove from selector
        const option = selector.querySelector(`option[value="${workflowId}"]`);
        if (option) {
            option.remove();
        }
        
        // Also remove from required selector if present
        const requiredSelector = document.getElementById('workflowSelector');
        const requiredOption = requiredSelector.querySelector(`option[value="${workflowId}"]`);
        if (requiredOption) {
            requiredOption.remove();
        }
        
        // Reset selector
        selector.value = '';
    },

    /**
     * Get selected workflows from the tags
     */
    getSelectedWorkflows() {
        const workflowTags = document.querySelectorAll('#selectedWorkflows .workflow-tag');
        return Array.from(workflowTags).map(tag => tag.dataset.workflowId);
    },

    /**
     * Get selected optional workflows from the tags
     */
    getSelectedOptionalWorkflows() {
        const workflowTags = document.querySelectorAll('#selectedOptionalWorkflows .workflow-tag');
        return Array.from(workflowTags).map(tag => tag.dataset.workflowId);
    },

    /**
     * Save metadata changes
     */
    async saveMetadata() {
        if (!this.editingExperiment) return;
        
        try {
            // Gather form data
            const metadata = {
                name: document.getElementById('editName').value.trim(),
                description: document.getElementById('editDescription').value.trim(),
                rating: parseInt(document.getElementById('editRating').value),
                tags: UIUtils.getTagsFromInput('tagsInput'),
                requiredWorkflows: this.getSelectedWorkflows(),
                optionalWorkflows: this.getSelectedOptionalWorkflows(),
                relatedExperiments: this.editingExperiment.relatedExperiments || []
            };
            
            // Validate required fields
            if (!metadata.name) {
                UIUtils.showError('Experiment name is required');
                return;
            }
            
            // Save to server
            const response = await ApiUtils.updateExperimentMetadata(this.editingExperiment.folder, metadata);
            
            if (!response.ok) {
                throw new Error('Failed to save metadata');
            }
            
            // Update local data
            const experimentIndex = AppState.experiments.findIndex(exp => exp.folder === this.editingExperiment.folder);
            if (experimentIndex !== -1) {
                AppState.experiments[experimentIndex] = { ...AppState.experiments[experimentIndex], ...metadata };
                
                // Update selected experiment if it's the one being edited
                if (AppState.selectedExperiment && AppState.selectedExperiment.folder === this.editingExperiment.folder) {
                    AppState.selectedExperiment = AppState.experiments[experimentIndex];
                    // Re-check workflow completion status since metadata changed
                    this.checkRequiredWorkflowsStatus(AppState.selectedExperiment);
                    await this.showDetails(AppState.selectedExperiment);
                }
            }
            
            // Refresh the list
            this.renderList();
            
            // Close modal and show success
            this.closeEditModal();
            UIUtils.showNotification('Metadata saved successfully', 'success');
            
        } catch (error) {
            console.error('Error saving metadata:', error);
            UIUtils.showError('Failed to save metadata');
        }
    },

    /**
     * Toggle fullscreen mode for the experiment iframe
     */
    toggleExperimentFullscreen() {
        const experimentFrame = document.getElementById('experimentFrame');
        const frameHeader = experimentFrame.querySelector('.frame-header');
        const navBar = document.querySelector('.navbar');
        const fullscreenBtn = experimentFrame.querySelector('.fullscreen-btn i');
        
        // Toggle fullscreen class
        experimentFrame.classList.toggle('is-fullscreen');
        
        if (experimentFrame.classList.contains('is-fullscreen')) {
            // Enter fullscreen mode
            experimentFrame.style.top = '0';
            frameHeader.style.display = 'none';
            navBar.style.display = 'none';
            fullscreenBtn.className = 'fas fa-compress';
            
            // Add exit fullscreen button at top center
            const exitBtn = document.createElement('button');
            exitBtn.className = 'button is-small exit-fullscreen-btn';
            exitBtn.innerHTML = '<i class="fas fa-compress"></i> Exit Fullscreen';
            exitBtn.onclick = toggleExperimentFullscreen;
            exitBtn.id = 'exitFullscreenBtn';
            experimentFrame.appendChild(exitBtn);
        } else {
            // Exit fullscreen mode
            experimentFrame.style.top = '52px';
            frameHeader.style.display = 'block';
            navBar.style.display = 'flex';
            fullscreenBtn.className = 'fas fa-expand';
            
            // Remove exit button
            const exitBtn = document.getElementById('exitFullscreenBtn');
            if (exitBtn) {
                exitBtn.remove();
            }
        }
    },

    /**
     * Show project README.md file
     */
    async showProjectReadme() {
        try {
            const response = await fetch('/api/experiments/project/readme');
            
            if (response.ok) {
                const content = await response.text();
                
                // Hide experiment frame
                AppElements.experimentFrame.style.display = 'none';
                
                // Hide experiment details if showing
                if (AppElements.experimentDetails) {
                    AppElements.experimentDetails.style.display = 'none';
                }
                
                // Hide default state
                AppElements.defaultState.style.display = 'none';
                
                // Create or get the readme container
                let readmeContainer = document.getElementById('projectReadmeContainer');
                if (!readmeContainer) {
                    readmeContainer = document.createElement('div');
                    readmeContainer.id = 'projectReadmeContainer';
                    readmeContainer.className = 'content-box readme-container';
                    AppElements.contentColumn.appendChild(readmeContainer);
                }
                
                // Set content with parsed markdown
                readmeContainer.innerHTML = `
                    <div class="level readme-header">
                        <div class="level-left">
                            <div class="level-item">
                                <h3 class="title is-4">Project README</h3>
                            </div>
                        </div>
                        <div class="level-right">
                            <div class="level-item">
                                <button class="button is-light" onclick="ExperimentManager.closeProjectReadme()">
                                    <i class="fas fa-times"></i>
                                    <span>Close</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="readme-content-wrapper">
                        <div class="content readme-content">
                            ${marked.parse(content)}
                        </div>
                    </div>
                `;
                
                readmeContainer.style.display = 'flex';
                readmeContainer.style.flexDirection = 'column';
                
            } else {
                UIUtils.showError('Failed to load README file');
            }
        } catch (error) {
            console.error('Error showing README:', error);
            UIUtils.showError('Error displaying README file');
        }
    },

    /**
     * Close project README view
     */
    closeProjectReadme() {
        const readmeContainer = document.getElementById('projectReadmeContainer');
        if (readmeContainer) {
            readmeContainer.style.display = 'none';
        }
        
        // Show default state again
        AppElements.defaultState.style.display = 'block';
        
        // If there's a selected experiment, show its details instead
        if (AppState.selectedExperiment) {
            AppElements.defaultState.style.display = 'none';
            AppElements.experimentDetails.style.display = 'block';
        }
    },
};

// Make functions available globally for HTML onclick handlers
window.loadExperiment = () => ExperimentManager.loadExperiment();
window.loadExperimentInNewWindow = () => ExperimentManager.loadExperimentInNewWindow();
window.closeExperiment = () => ExperimentManager.closeExperiment();
window.editExperiment = () => ExperimentManager.editExperiment();
window.closeEditModal = () => ExperimentManager.closeEditModal();
window.closeDocumentationModal = () => ExperimentManager.closeDocumentationModal();
window.updateRatingDisplay = () => ExperimentManager.updateRatingDisplay();
window.saveMetadata = () => ExperimentManager.saveMetadata();
window.runRequiredWorkflows = () => ExperimentManager.runRequiredWorkflows();
window.focusTagInput = () => document.getElementById('tagInput').focus();
window.addSelectedWorkflow = () => ExperimentManager.addSelectedWorkflow();
window.addSelectedOptionalWorkflow = () => ExperimentManager.addSelectedOptionalWorkflow();
window.toggleExperimentFullscreen = () => ExperimentManager.toggleExperimentFullscreen();
window.showProjectReadme = () => ExperimentManager.showProjectReadme();
window.closeProjectReadme = () => ExperimentManager.closeProjectReadme();