/**
 * UI Utilities Module - Enhanced with workflow progress support
 * Contains common UI functions, notifications, modals, and form helpers
 */

const UIUtils = {
    /**
     * Show loading modal with message - enhanced to support workflow progress
     */
    showLoadingModal(message) {
        const messageEl = document.getElementById('loadingMessage');
        
        // If it's a simple string, show regular loading
        if (typeof message === 'string') {
            messageEl.innerHTML = `<p>${message}</p>`;
        } else {
            // For complex content (like workflow progress), keep as is
            messageEl.textContent = message;
        }
        
        AppElements.loadingModal.classList.add('is-active');
    },

    /**
     * Hide loading modal
     */
    hideLoadingModal() {
        AppElements.loadingModal.classList.remove('is-active');
    },

    /**
     * Show a notification message
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification is-${type} notification-toast`;
        notification.innerHTML = `
            ${message}
            <button class="delete" onclick="this.parentElement.remove()"></button>
        `;
        
        // Add styles for toast notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            min-width: 300px;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    },

    /**
     * Show error message
     */
    showError(message) {
        this.showNotification(message, 'danger');
    },

    /**
     * Create rating stars HTML
     */
    createRatingStars(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += `<span class="star ${i <= rating ? '' : 'empty'}">★</span>`;
        }
        return stars;
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
     * Add a tag to an input container
     */
    addTagToInput(text, container, input) {
        if (!text.trim()) return;
        
        const tagEl = document.createElement('div');
        tagEl.className = 'tag-item';
        tagEl.innerHTML = `
            ${text}
            <button type="button" class="tag-remove" onclick="this.parentElement.remove()">×</button>
        `;
        
        container.insertBefore(tagEl, input);
    },

    /**
     * Get tags from input container
     */
    getTagsFromInput(containerId) {
        const container = document.getElementById(containerId);
        const tags = [];
        container.querySelectorAll('.tag-item').forEach(tagEl => {
            const text = tagEl.textContent.replace('×', '').trim();
            if (text) tags.push(text);
        });
        return tags;
    },

    /**
     * Setup slide-in animation for notifications
     */
    setupNotificationAnimations() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    },

    /**
     * Handle console manager overlay styles
     */
    setupConsoleManagerStyles() {
        // Console Manager overlay styles
        const consoleManagerStyle = document.createElement('style');
        consoleManagerStyle.textContent = `
            /* Console Manager Overlay */
            .console-manager-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                z-index: 2000;
                display: flex;
                justify-content: center;
                align-items: center;
                backdrop-filter: blur(5px);
            }
            
            .console-manager-content {
                background-color: white;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                width: 80%;
                max-width: 600px;
                max-height: 80%;
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }
            
            .console-manager-header {
                background-color: #f5f5f5;
                border-bottom: 1px solid #ddd;
                padding: 1rem 1.25rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .console-manager-body {
                padding: 1.25rem;
                flex: 1;
                overflow-y: auto;
            }
            
            .console-list {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }
            
            .console-item {
                background-color: #f8f9fa;
                border: 1px solid #e8e8e8;
                border-radius: 6px;
                padding: 1rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
                transition: all 0.2s ease;
            }
            
            .console-item:hover {
                background-color: #f0f0f0;
                border-color: #d0d0d0;
            }
            
            .console-item-info {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                flex: 1;
            }
            
            .console-item-name {
                font-weight: 600;
                color: #363636;
            }
            
            .console-item-actions {
                display: flex;
                gap: 0.5rem;
            }
        `;
        document.head.appendChild(consoleManagerStyle);
    },

    /**
     * Create a workflow progress indicator
     */
    createWorkflowProgressIndicator(workflows, currentIndex = -1) {
        const container = document.createElement('div');
        container.className = 'workflow-progress-indicator';
        
        container.innerHTML = `
            <div class="workflow-progress-header">
                <h5 class="title is-6">Required Workflows Progress</h5>
                <progress class="progress is-small is-primary" value="${currentIndex + 1}" max="${workflows.length}"></progress>
            </div>
            <div class="workflow-progress-list">
                ${workflows.map((workflowId, index) => {
                    const workflow = AppState.workflows[workflowId];
                    const status = index < currentIndex ? 'completed' : 
                                  index === currentIndex ? 'active' : 'waiting';
                    const icon = status === 'completed' ? 'fa-check' : 
                                status === 'active' ? 'fa-circle-notch fa-spin' : 'fa-circle';
                    const color = status === 'completed' ? 'has-text-success' : 
                                 status === 'active' ? 'has-text-primary' : 'has-text-grey-light';
                    
                    return `
                        <div class="workflow-progress-item">
                            <span class="icon ${color}">
                                <i class="fas ${icon}"></i>
                            </span>
                            <span class="workflow-name">${workflow ? workflow.name || workflowId : workflowId}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        
        return container;
    }
};

// Initialize UI utilities on load
document.addEventListener('DOMContentLoaded', () => {
    UIUtils.setupNotificationAnimations();
    UIUtils.setupConsoleManagerStyles();
});

// Global functions for tag handling in forms
window.handleTagInput = (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        const input = event.target;
        const container = input.parentElement;
        const value = input.value.trim();
        
        if (value) {
            UIUtils.addTagToInput(value, container, input);
            input.value = '';
        }
    }
};

window.handleDependencyInput = (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        const input = event.target;
        const container = input.parentElement;
        const value = input.value.trim();
        
        if (value) {
            UIUtils.addTagToInput(value, container, input);
            input.value = '';
        }
    }
};

// New function for required workflow input
window.handleRequiredWorkflowInput = (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        const input = event.target;
        const container = input.parentElement;
        const value = input.value.trim();
        
        if (value) {
            UIUtils.addTagToInput(value, container, input);
            input.value = '';
        }
    }
};