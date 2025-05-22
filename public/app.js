/**
 * Main Application Bootstrap and Core Functionality - Refactored
 * This file handles application initialization, page management, and global state
 */

// Global application state
const AppState = {
    experiments: [],
    services: {},
    commands: {},
    workflows: {},
    selectedExperiment: null,
    sidebarCollapsed: false,
    currentPage: 'experiments'
};

// DOM element references - initialized once for performance
const AppElements = {
    // Main containers
    experimentList: null,
    servicesList: null,
    commandsList: null,
    workflowsList: null,
    experimentDetails: null,
    experimentFrame: null,
    defaultState: null,
    
    // Pages
    experimentsPage: null,
    servicesPage: null,
    commandsPage: null,
    workflowsPage: null,
    
    // Sidebar sections
    experimentsSidebar: null,
    servicesSidebar: null,
    commandsSidebar: null,
    workflowsSidebar: null,
    
    // Search inputs
    searchInput: null,
    servicesSearch: null,
    commandsSearch: null,
    workflowsSearch: null,
    
    // Layout
    sidebarColumn: null,
    contentColumn: null,
    
    // Modals
    loadingModal: null,
    editModal: null,
    serviceModal: null,
    workflowModal: null,
    documentationModal: null,
    consoleManagerOverlay: null,
    consoleManagerBody: null,
    
    // Indicators
    runningServicesIndicator: null
};

/**
 * Initialize the application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Experiment Browser starting...');
    
    // Initialize DOM element references
    initializeElements();
    
    // Load initial data
    await ExperimentManager.loadExperiments();
    await ServiceManager.loadServicesAndWorkflows();
    
    // Setup event handlers and UI components
    setupSearchFilters();
    ConsoleManager.setupStreaming();
    
    // Render initial views
    await renderCurrentPage();
    ConsoleManager.updateManager();
    
    // Update running services indicator
    ServiceManager.updateRunningServicesIndicator();
    
    console.log('Experiment Browser initialized successfully');
});

/**
 * Initialize all DOM element references
 * This prevents repeated DOM queries throughout the application
 */
function initializeElements() {
    // Main containers
    AppElements.experimentList = document.getElementById('experimentList');
    AppElements.servicesList = document.getElementById('servicesList');
    AppElements.commandsList = document.getElementById('commandsList');
    AppElements.workflowsList = document.getElementById('workflowsList');
    AppElements.experimentDetails = document.getElementById('experimentDetails');
    AppElements.experimentFrame = document.getElementById('experimentFrame');
    AppElements.defaultState = document.getElementById('defaultState');
    
    // Pages
    AppElements.experimentsPage = document.getElementById('experimentsPage');
    AppElements.servicesPage = document.getElementById('servicesPage');
    AppElements.commandsPage = document.getElementById('commandsPage');
    AppElements.workflowsPage = document.getElementById('workflowsPage');
    
    // Sidebar sections
    AppElements.experimentsSidebar = document.getElementById('experimentsSidebar');
    AppElements.servicesSidebar = document.getElementById('servicesSidebar');
    AppElements.commandsSidebar = document.getElementById('commandsSidebar');
    AppElements.workflowsSidebar = document.getElementById('workflowsSidebar');
    
    // Search inputs
    AppElements.searchInput = document.getElementById('searchInput');
    AppElements.servicesSearch = document.getElementById('servicesSearch');
    AppElements.commandsSearch = document.getElementById('commandsSearch');
    AppElements.workflowsSearch = document.getElementById('workflowsSearch');
    
    // Layout
    AppElements.sidebarColumn = document.getElementById('sidebarColumn');
    AppElements.contentColumn = document.getElementById('contentColumn');
    
    // Modals
    AppElements.loadingModal = document.getElementById('loadingModal');
    AppElements.editModal = document.getElementById('editModal');
    AppElements.serviceModal = document.getElementById('serviceModal');
    AppElements.workflowModal = document.getElementById('workflowModal');
    AppElements.documentationModal = document.getElementById('documentationModal');
    AppElements.consoleManagerOverlay = document.getElementById('consoleManagerOverlay');
    AppElements.consoleManagerBody = document.getElementById('consoleManagerBody');
    
    // Indicators
    AppElements.runningServicesIndicator = document.getElementById('runningServicesIndicator');
}

/**
 * Switch between main application pages
 */
async function switchToPage(page) {
    AppState.currentPage = page;
    
    // Update navigation button states
    document.getElementById('navExperiments').classList.toggle('is-active', page === 'experiments');
    document.getElementById('navServices').classList.toggle('is-active', page === 'services');
    document.getElementById('navCommands').classList.toggle('is-active', page === 'commands');
    document.getElementById('navWorkflows').classList.toggle('is-active', page === 'workflows');
    
    // Show/hide appropriate pages
    AppElements.experimentsPage.style.display = page === 'experiments' ? 'flex' : 'none';
    AppElements.servicesPage.style.display = page === 'services' ? 'flex' : 'none';
    AppElements.commandsPage.style.display = page === 'commands' ? 'flex' : 'none';
    AppElements.workflowsPage.style.display = page === 'workflows' ? 'flex' : 'none';
    
    // Show/hide appropriate sidebar sections
    AppElements.experimentsSidebar.style.display = page === 'experiments' ? 'flex' : 'none';
    AppElements.servicesSidebar.style.display = page === 'services' ? 'flex' : 'none';
    AppElements.commandsSidebar.style.display = page === 'commands' ? 'flex' : 'none';
    AppElements.workflowsSidebar.style.display = page === 'workflows' ? 'flex' : 'none';
    
    // Hide experiment frame when switching pages
    AppElements.experimentFrame.style.display = 'none';
    
    // Render the current page
    await renderCurrentPage();
}

/**
 * Render content for the current page
 */
async function renderCurrentPage() {
    switch (AppState.currentPage) {
        case 'experiments':
            ExperimentManager.renderList();
            break;
        case 'services':
            await ServiceManager.renderServicesPage();
            ServiceManager.renderServicesList();
            break;
        case 'commands':
            await ServiceManager.renderCommandsPage();
            CommandManager.renderCommandsList();
            break;
        case 'workflows':
            await ServiceManager.renderWorkflowsPage();
            WorkflowManager.renderWorkflowsList();
            break;
    }
}

/**
 * Toggle sidebar visibility for more screen space
 */
function toggleSidebar() {
    AppState.sidebarCollapsed = !AppState.sidebarCollapsed;
    
    // Apply CSS classes for collapsed state
    if (AppState.sidebarCollapsed) {
        AppElements.sidebarColumn.classList.add('collapsed');
        AppElements.contentColumn.classList.add('expanded');
    } else {
        AppElements.sidebarColumn.classList.remove('collapsed');
        AppElements.contentColumn.classList.remove('expanded');
    }
    
    // Update toggle button appearance
    const toggleBtn = document.getElementById('sidebarToggle');
    const icon = toggleBtn.querySelector('i');
    const span = toggleBtn.querySelector('span');
    
    if (AppState.sidebarCollapsed) {
        icon.className = 'fas fa-chevron-right';
        span.textContent = 'Show Sidebar';
    } else {
        icon.className = 'fas fa-bars';
        span.textContent = 'Toggle Sidebar';
    }
    
    // Update experiment frame layout if it's visible
    if (AppElements.experimentFrame.style.display === 'block') {
        if (AppState.sidebarCollapsed) {
            AppElements.experimentFrame.classList.remove('sidebar-visible');
        } else {
            AppElements.experimentFrame.classList.add('sidebar-visible');
        }
    }
}

/**
 * Setup search/filter functionality for all pages
 */
function setupSearchFilters() {
    // Experiments search
    AppElements.searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        if (!query) {
            ExperimentManager.renderList(AppState.experiments);
            return;
        }
        
        // Filter experiments by name, description, or tags
        const filtered = AppState.experiments.filter(exp => {
            return exp.name.toLowerCase().includes(query) ||
                   (exp.description && exp.description.toLowerCase().includes(query)) ||
                   (exp.tags && exp.tags.some(tag => tag.toLowerCase().includes(query)));
        });
        
        ExperimentManager.renderList(filtered);
    });
    
    // Services search
    AppElements.servicesSearch.addEventListener('input', (e) => {
        ServiceManager.renderServicesList();
    });
    
    // Commands search
    AppElements.commandsSearch.addEventListener('input', (e) => {
        CommandManager.renderCommandsList();
    });
    
    // Workflows search
    AppElements.workflowsSearch.addEventListener('input', (e) => {
        WorkflowManager.renderWorkflowsList();
    });
}

/**
 * Refresh all data from the server
 */
async function refreshAll() {
    try {
        UIUtils.showNotification('Refreshing all data...', 'info');
        await ExperimentManager.loadExperiments();
        await ServiceManager.loadServicesAndWorkflows();
        await renderCurrentPage();
        
        // Update running services indicator
        ServiceManager.updateRunningServicesIndicator();
        
        UIUtils.showNotification('All data refreshed successfully', 'success');
    } catch (error) {
        console.error('Error refreshing data:', error);
        UIUtils.showError('Failed to refresh data');
    }
}

/**
 * Refresh experiments only
 */
async function refreshExperiments() {
    try {
        UIUtils.showNotification('Refreshing experiments...', 'info');
        await ExperimentManager.loadExperiments();
        if (AppState.currentPage === 'experiments') {
            ExperimentManager.renderList();
        }
        UIUtils.showNotification('Experiments refreshed successfully', 'success');
    } catch (error) {
        console.error('Error refreshing experiments:', error);
        UIUtils.showError('Failed to refresh experiments');
    }
}

/**
 * Refresh services, commands, and workflows
 */
async function refreshServices() {
    try {
        UIUtils.showNotification('Refreshing services data...', 'info');
        await ServiceManager.loadServicesAndWorkflows();
        await renderCurrentPage();
        
        // Update running services indicator
        ServiceManager.updateRunningServicesIndicator();
        
        UIUtils.showNotification('Services data refreshed successfully', 'success');
    } catch (error) {
        console.error('Error refreshing services:', error);
        UIUtils.showError('Failed to refresh services');
    }
}

/**
 * Refresh commands only
 */
async function refreshCommands() {
    try {
        UIUtils.showNotification('Refreshing commands...', 'info');
        await ServiceManager.loadServicesAndWorkflows();
        if (AppState.currentPage === 'commands') {
            await ServiceManager.renderCommandsPage();
            CommandManager.renderCommandsList();
        }
        UIUtils.showNotification('Commands refreshed successfully', 'success');
    } catch (error) {
        console.error('Error refreshing commands:', error);
        UIUtils.showError('Failed to refresh commands');
    }
}

/**
 * Refresh workflows only
 */
async function refreshWorkflows() {
    try {
        UIUtils.showNotification('Refreshing workflows...', 'info');
        await ServiceManager.loadServicesAndWorkflows();
        if (AppState.currentPage === 'workflows') {
            await ServiceManager.renderWorkflowsPage();
            WorkflowManager.renderWorkflowsList();
        }
        UIUtils.showNotification('Workflows refreshed successfully', 'success');
    } catch (error) {
        console.error('Error refreshing workflows:', error);
        UIUtils.showError('Failed to refresh workflows');
    }
}

// Make core functions available globally
window.switchToPage = switchToPage;
window.toggleSidebar = toggleSidebar;
window.refreshAll = refreshAll;
window.refreshExperiments = refreshExperiments;
window.refreshServices = refreshServices;
window.refreshCommands = refreshCommands;
window.refreshWorkflows = refreshWorkflows;