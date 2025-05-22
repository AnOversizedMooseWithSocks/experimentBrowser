/**
 * API Utilities Module
 * Centralized API calls and HTTP request handling
 */

const ApiUtils = {
    /**
     * Base fetch wrapper with error handling
     */
    async fetchWithErrorHandling(url, options = {}) {
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            return response;
        } catch (error) {
            console.error(`API Error (${url}):`, error);
            throw error;
        }
    },

    // Experiment API calls
    /**
     * Update experiment metadata
     */
    async updateExperimentMetadata(folder, metadata) {
        return this.fetchWithErrorHandling(`/api/experiments/${folder}/metadata`, {
            method: 'PUT',
            body: JSON.stringify(metadata)
        });
    },

    // Service API calls
    /**
     * Create a new service
     */
    async createService(serviceId, serviceData) {
        return this.fetchWithErrorHandling('/api/services', {
            method: 'POST',
            body: JSON.stringify({ id: serviceId, ...serviceData })
        });
    },

    /**
     * Update an existing service
     */
    async updateService(serviceId, serviceData) {
        return this.fetchWithErrorHandling(`/api/services/${serviceId}`, {
            method: 'PUT',
            body: JSON.stringify(serviceData)
        });
    },

    /**
     * Delete a service
     */
    async deleteService(serviceId) {
        return this.fetchWithErrorHandling(`/api/services/${serviceId}`, {
            method: 'DELETE'
        });
    },

    /**
     * Start or stop a service
     */
    async toggleService(serviceId, action) {
        return this.fetchWithErrorHandling(`/api/services/${serviceId}/${action}`, {
            method: 'POST'
        });
    },

    /**
     * Stop a service
     */
    async stopService(serviceId) {
        return this.fetchWithErrorHandling(`/api/services/${serviceId}/stop`, {
            method: 'POST'
        });
    },

    // Command API calls
    /**
     * Create a new command
     */
    async createCommand(commandId, commandData) {
        return this.fetchWithErrorHandling('/api/commands', {
            method: 'POST',
            body: JSON.stringify({ id: commandId, ...commandData })
        });
    },

    /**
     * Update an existing command
     */
    async updateCommand(commandId, commandData) {
        return this.fetchWithErrorHandling(`/api/commands/${commandId}`, {
            method: 'PUT',
            body: JSON.stringify(commandData)
        });
    },

    /**
     * Delete a command
     */
    async deleteCommand(commandId) {
        return this.fetchWithErrorHandling(`/api/commands/${commandId}`, {
            method: 'DELETE'
        });
    },

    /**
     * Execute a command
     */
    async executeCommand(commandId) {
        return this.fetchWithErrorHandling(`/api/commands/${commandId}/execute`, {
            method: 'POST'
        });
    },

    // Workflow API calls
    /**
     * Create a new workflow
     */
    async createWorkflow(workflowId, workflowData) {
        return this.fetchWithErrorHandling('/api/workflows', {
            method: 'POST',
            body: JSON.stringify({ id: workflowId, ...workflowData })
        });
    },

    /**
     * Update an existing workflow
     */
    async updateWorkflow(workflowId, workflowData) {
        return this.fetchWithErrorHandling(`/api/workflows/${workflowId}`, {
            method: 'PUT',
            body: JSON.stringify(workflowData)
        });
    },

    /**
     * Delete a workflow
     */
    async deleteWorkflow(workflowId) {
        return this.fetchWithErrorHandling(`/api/workflows/${workflowId}`, {
            method: 'DELETE'
        });
    },

    /**
     * Execute a workflow
     */
    async executeWorkflow(workflowId) {
        return this.fetchWithErrorHandling(`/api/workflows/${workflowId}/execute`, {
            method: 'POST'
        });
    },

    // Console API calls
    /**
     * Get console output for a process
     */
    async getConsoleOutput(processId) {
        return this.fetchWithErrorHandling(`/api/console/${processId}`);
    },

    /**
     * Clear console output for a process
     */
    async clearConsoleOutput(processId) {
        return this.fetchWithErrorHandling(`/api/console/${processId}`, {
            method: 'DELETE'
        });
    },

    /**
     * Get list of all processes with console output
     */
    async getConsoleProcesses() {
        return this.fetchWithErrorHandling('/api/console');
    }
};