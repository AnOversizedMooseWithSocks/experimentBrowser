# Experiment Browser - Comprehensive Documentation

## Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Technology Stack](#technology-stack)
4. [Installation & Setup](#installation--setup)
5. [Getting Started Guide](#getting-started-guide)
6. [User Interface Overview](#user-interface-overview)
7. [Experiment Management](#experiment-management)
8. [Service Management](#service-management)
9. [Command Management](#command-management)
10. [Workflow Management](#workflow-management)
11. [Console System](#console-system)
12. [Configuration Guide](#configuration-guide)
13. [Advanced Usage Patterns](#advanced-usage-patterns)
14. [API Reference](#api-reference)
15. [Application Architecture](#application-architecture)
16. [Extending the Application](#extending-the-application)
17. [Troubleshooting Guide](#troubleshooting-guide)
18. [Best Practices](#best-practices)
19. [FAQ](#faq)

## Overview

The Experiment Browser is a comprehensive web-based development tool designed to streamline the management and execution of experimental projects, development services, commands, and automated workflows. Built with simplicity and functionality in mind, it provides a centralized interface for developers to organize, run, and monitor their development environment.

### What Problems Does It Solve?

- **Project Organization**: Keep track of multiple experimental projects and prototypes
- **Development Environment Management**: Easily start/stop development servers, databases, and other services
- **Workflow Automation**: Automate complex multi-step setup processes
- **Real-time Monitoring**: Watch console output from all running processes in one place
- **Team Collaboration**: Share consistent development setups across team members
- **Documentation Integration**: Keep project documentation alongside experiments

### Who Is It For?

- **Full-stack Developers** managing multiple services and frontends
- **Prototype Developers** working on various experimental projects
- **Development Teams** needing consistent environment setup
- **Students and Educators** organizing coding experiments and assignments
- **Anyone** who juggles multiple development projects and wants better organization

## Key Features

### 🧪 Experiment Management
- **HTML Project Browser**: Organize and run HTML-based experiments and prototypes
- **Metadata System**: Rich metadata with names, descriptions, tags, and ratings
- **Dependency Management**: Define required and optional workflows for experiments
- **Multiple Viewing Modes**: Run experiments in embedded iframe or new browser windows
- **Fullscreen Mode**: Distraction-free experiment viewing
- **Documentation Integration**: Automatic detection and rendering of README files and markdown documentation
- **Tag-based Organization**: Powerful tagging system for categorizing experiments
- **Search and Filtering**: Quickly find experiments by name, description, or tags

### ⚙️ Service Management
- **Long-running Process Control**: Start, stop, and monitor continuous services
- **Development Server Support**: Perfect for webpack dev servers, API servers, databases
- **Real-time Status Monitoring**: Visual indicators for running/stopped services
- **Working Directory Support**: Run services from any directory
- **Service Dependencies**: Link services to experiments for automatic startup
- **Console Integration**: Real-time console output for all services

### 🖥️ Command Management
- **One-time Command Execution**: Run build scripts, tests, installations, and maintenance tasks
- **Real-time Output**: Watch command execution with live console feedback
- **Working Directory Control**: Execute commands in specific directories
- **Command Library**: Save frequently used commands for easy reuse
- **Execution History**: Track command execution results

### 🔄 Workflow Management
- **Multi-step Automation**: Create complex workflows combining services and commands
- **Dependency Resolution**: Automatically handle service dependencies
- **Error Handling**: Configure workflows to continue or stop on errors
- **Progress Tracking**: Visual progress indicators for workflow execution
- **Required Workflows**: Enforce workflow completion before experiment loading
- **Optional Workflows**: Provide enhancement workflows that aren't mandatory
- **Flexible Timing**: Add delays between workflow steps for proper startup sequences

### 📊 Advanced Console System
- **Real-time Streaming**: Live console output using Server-Sent Events
- **Multiple Console Windows**: Manage multiple draggable console windows
- **Console Manager**: Centralized overview of all active consoles
- **Output History**: Persistent console history for all processes
- **Console Clearing**: Clear individual console outputs as needed
- **Process Type Identification**: Different handling for services, commands, and workflows

### 🎨 Modern User Interface
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Multi-page Layout**: Dedicated pages for experiments, services, commands, and workflows
- **Collapsible Sidebar**: Maximize screen space when needed
- **Modal Dialogs**: Clean editing interfaces for all components
- **Real-time Updates**: UI updates automatically as processes start/stop
- **Visual Status Indicators**: Clear visual feedback for all system states

## Technology Stack

### Backend Technologies
- **Node.js**: Runtime environment for server-side JavaScript
- **Express.js**: Web application framework for RESTful APIs
- **Native Node.js Modules**: File system operations, child processes, path handling
- **Server-Sent Events (SSE)**: Real-time console output streaming
- **JSON File Storage**: Simple, portable configuration storage

### Frontend Technologies
- **Vanilla JavaScript**: No frameworks - clean, understandable code
- **Bulma CSS Framework**: Modern CSS framework for responsive design
- **Font Awesome**: Icon library for consistent iconography
- **Marked.js**: Markdown rendering for documentation
- **Modern Browser APIs**: EventSource, Fetch API, DOM manipulation

### Architecture Principles
- **RESTful API Design**: Clean separation between frontend and backend
- **Modular Architecture**: Organized code structure with clear responsibilities
- **Real-time Communication**: Live updates without page refreshes
- **Progressive Enhancement**: Works with JavaScript disabled for basic functionality
- **Cross-platform Compatibility**: Runs on Windows, macOS, and Linux

## Installation & Setup

### Prerequisites

Before installing the Experiment Browser, ensure you have:

- **Node.js** version 14 or higher installed
- **npm** (comes with Node.js) or **yarn** package manager
- A modern web browser (Chrome, Firefox, Safari, Edge)
- Basic command line familiarity

### Step-by-Step Installation

1. **Download or Clone the Application**
   ```bash
   # If using git
   git clone <repository-url>
   cd experiment-browser
   
   # Or extract from ZIP file and navigate to the directory
   ```

2. **Install Dependencies**
   ```bash
   # Using npm
   npm install
   
   # Or using yarn
   yarn install
   ```

3. **Start the Application**
   ```bash
   # For production use
   npm start
   
   # For development (auto-restarts on file changes)
   npm run dev
   ```

4. **Access the Application**
   - Open your web browser
   - Navigate to `http://localhost:7890`
   - You should see the Experiment Browser interface

### First Run Setup

When you first start the application, it will automatically:

- Create an `experiments` directory in your project folder
- Generate a sample experiment to demonstrate functionality
- Create a default `services.json` configuration file
- Initialize all necessary directories and files

### Verifying Installation

1. **Check the Sample Experiment**
   - You should see "Sample Experiment" in the experiments list
   - Click on it to view details
   - Click "Load Experiment" to run it

2. **Test Console System**
   - Click "Console Manager" in the top navigation
   - Verify the console management interface works

3. **Check Services Page**
   - Navigate to the Services page
   - Confirm the services interface loads properly

## Getting Started Guide

### Your First Experiment

Let's create your first experiment from scratch:

1. **Create the Experiment Directory**
   ```bash
   mkdir experiments/my-first-project
   cd experiments/my-first-project
   ```

2. **Create Your HTML File**
   Create `index.html`:
   ```html
   <!DOCTYPE html>
   <html lang="en">
   <head>
       <meta charset="UTF-8">
       <meta name="viewport" content="width=device-width, initial-scale=1.0">
       <title>My First Project</title>
       <style>
           body {
               font-family: Arial, sans-serif;
               max-width: 800px;
               margin: 50px auto;
               padding: 20px;
               background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
               color: white;
           }
           .container {
               background: rgba(255, 255, 255, 0.1);
               padding: 40px;
               border-radius: 15px;
               backdrop-filter: blur(10px);
           }
           button {
               background: #4CAF50;
               color: white;
               padding: 15px 32px;
               border: none;
               border-radius: 8px;
               cursor: pointer;
               font-size: 16px;
               margin: 10px 0;
           }
           button:hover {
               background: #45a049;
           }
       </style>
   </head>
   <body>
       <div class="container">
           <h1>🚀 My First Project</h1>
           <p>Welcome to your first experiment in the Experiment Browser!</p>
           <button onclick="showAlert()">Click Me!</button>
           <button onclick="changeBackground()">Change Background</button>
           <div id="output"></div>
       </div>
       
       <script>
           function showAlert() {
               alert('Hello from your first experiment!');
               document.getElementById('output').innerHTML += '<p>Button clicked at: ' + new Date().toLocaleTimeString() + '</p>';
           }
           
           function changeBackground() {
               const colors = ['#667eea', '#f093fb', '#f5576c', '#4facfe', '#43e97b'];
               const randomColor = colors[Math.floor(Math.random() * colors.length)];
               document.body.style.background = `linear-gradient(135deg, ${randomColor} 0%, #764ba2 100%)`;
           }
       </script>
   </body>
   </html>
   ```

3. **Add Documentation (Optional)**
   Create `README.md`:
   ```markdown
   # My First Project
   
   This is my first experiment using the Experiment Browser.
   
   ## Features
   - Interactive buttons
   - Dynamic background changes
   - Click tracking
   
   ## How to Use
   1. Click the "Click Me!" button to see an alert
   2. Click "Change Background" to randomize the background color
   3. Watch the click timestamps appear below the buttons
   ```

4. **Refresh and Test**
   - Go back to the Experiment Browser
   - Refresh the page or click the "Refresh" button
   - Your new experiment should appear in the list
   - Click on it to view details and metadata
   - Click "Load Experiment" to run it

### Setting Up Your First Service

Let's create a simple development server service:

1. **Navigate to Services Page**
   - Click "Services" in the top navigation

2. **Create New Service**
   - Click "New Service" button
   - Fill in the form:
     - **Service ID**: `static-server`
     - **Service Name**: `Static File Server`
     - **Description**: `Simple HTTP server for serving static files`
     - **Working Directory**: `./experiments`
     - **Command**: `python -m http.server 8080`
   - Click "Save Service"

3. **Test Your Service**
   - Click the green "Start" button next to your new service
   - Click the terminal icon to open console output
   - You should see the server starting up
   - Open `http://localhost:8080` in a new browser tab to verify

### Creating Your First Workflow

Let's create a workflow that sets up a complete development environment:

1. **Navigate to Workflows Page**
   - Click "Workflows" in the top navigation

2. **Create New Workflow**
   - Click "New Workflow" button
   - Fill in basic information:
     - **Workflow ID**: `dev-setup`
     - **Workflow Name**: `Development Environment Setup`
     - **Description**: `Complete setup for development environment`
     - **Working Directory**: `./`

3. **Add Workflow Steps**
   - Click "Add First Step"
   - **Step 1**: Install Dependencies
     - **Step Name**: `Install Dependencies`
     - **Type**: `Existing Command` (if you have an install command) or create a new command first
   - Click "Add Step"
   - **Step 2**: Start Static Server
     - **Step Name**: `Start Static Server`
     - **Type**: `Existing Service`
     - **Select Service**: `static-server`
     - **Delay**: `2000` (wait 2 seconds after starting)

4. **Save and Test**
   - Click "Save Workflow"
   - Click "Execute" to run your workflow
   - Watch the console output as each step executes

### Connecting Experiments to Workflows

Now let's make your experiment depend on the workflow:

1. **Edit Your Experiment**
   - Go to Experiments page
   - Click on "My First Project"
   - Click "Edit Metadata"

2. **Add Required Workflow**
   - In the "Required Workflows" section
   - Select `dev-setup` from the dropdown
   - Click "Add"
   - Click "Save Changes"

3. **Test the Integration**
   - Click on your experiment again
   - Notice the yellow "Required Workflows" box
   - The "Load Experiment" button should be disabled
   - Click "Run All Required Workflows"
   - Wait for completion
   - Now "Load Experiment" should be enabled

## User Interface Overview

### Main Navigation Bar

The top navigation provides access to all major sections:

- **Experiment Browser**: Application title and home link
- **Toggle Sidebar**: Show/hide the left sidebar for more screen space
- **Console Manager**: Access the centralized console management interface
- **Page Navigation**: Switch between Experiments, Workflows, Services, and Commands
- **Refresh**: Reload all data from the server

### Sidebar Layout

The collapsible left sidebar contains:

- **Current Page Items**: List of experiments, services, commands, or workflows
- **Search Bar**: Filter items by name, description, or tags
- **Quick Navigation**: Click items to view details or scroll to them in the main view
- **Status Indicators**: Visual cues for running services and workflow states

### Main Content Area

The main area adapts based on the current page:

- **Experiments Page**: Experiment details, documentation, and controls
- **Services Page**: Service cards with start/stop controls and console access
- **Commands Page**: Command cards with execution buttons and history
- **Workflows Page**: Workflow cards with execution controls and step details

### Modal Dialogs

Clean, focused interfaces for:

- **Editing Experiment Metadata**: Name, description, tags, ratings, workflows
- **Creating/Editing Services**: All service configuration options
- **Creating/Editing Commands**: Command setup and configuration
- **Creating/Editing Workflows**: Multi-step workflow builder
- **Documentation Viewer**: Markdown rendering with syntax highlighting

### Console System

- **Floating Console Windows**: Draggable windows for real-time output
- **Console Manager**: Centralized overview of all active consoles
- **Real-time Updates**: Live streaming output using Server-Sent Events
- **Console Controls**: Show/hide, clear, and close individual consoles

## Experiment Management

### Creating Experiments

Experiments are HTML-based projects stored in the `experiments` directory. Each experiment:

1. **Must have an HTML file** (preferably `index.html`)
2. **Automatically gets metadata** (`metadata.json` file)
3. **Can include documentation** (README.md or other .md files)
4. **Supports any web technologies** (CSS, JavaScript, external libraries)

### Experiment Structure

```
experiments/
└── my-experiment/
    ├── index.html          # Main HTML file (required)
    ├── metadata.json       # Auto-generated metadata
    ├── README.md          # Documentation (optional)
    ├── styles.css         # Additional CSS (optional)
    ├── script.js          # Additional JavaScript (optional)
    └── assets/            # Images, fonts, etc. (optional)
        ├── logo.png
        └── data.json
```

### Metadata System

The `metadata.json` file contains:

```json
{
  "name": "My Amazing Experiment",
  "description": "A detailed description of what this experiment does",
  "tags": ["javascript", "visualization", "demo"],
  "rating": 4,
  "requiredWorkflows": ["dev-setup", "api-server"],
  "optionalWorkflows": ["performance-monitoring"],
  "dependencies": ["webpack-dev", "api-server"],
  "relatedExperiments": ["similar-project"]
}
```

### Required vs Optional Workflows

**Required Workflows**:
- Must complete successfully before experiment can load
- Shown in yellow warning box
- "Load Experiment" button disabled until completion
- Perfect for essential services like databases or API servers

**Optional Workflows**:
- Enhance the experiment but aren't mandatory
- Shown in blue information box
- Can be run before or after loading the experiment
- Great for monitoring tools, debugging utilities, or performance analyzers

### Experiment Viewing Modes

1. **Embedded Mode**: Default - experiment runs in iframe within the browser
2. **New Window Mode**: Opens experiment in separate browser window
3. **Fullscreen Mode**: Removes all browser UI for distraction-free viewing

### Documentation Integration

The system automatically detects and displays:

- **README.md files**: Primary documentation
- **Any .md files**: Additional documentation sections
- **README.txt files**: Plain text documentation

Documentation is rendered with:
- **Markdown parsing**: Full markdown syntax support
- **Syntax highlighting**: Code blocks with language detection
- **Responsive layout**: Looks great on all devices
- **Modal viewing**: Clean, focused reading experience

### Tagging and Organization

**Effective Tagging Strategies**:

- **Technology Tags**: `react`, `vue`, `nodejs`, `python`, `css`
- **Purpose Tags**: `demo`, `prototype`, `learning`, `experiment`
- **Status Tags**: `working`, `broken`, `in-progress`, `complete`
- **Category Tags**: `visualization`, `game`, `tool`, `api`, `ui-component`

**Search and Filtering**:
- Search by experiment name
- Filter by description content
- Find by any tag
- Combine multiple search terms

## Service Management

### Understanding Services

Services are long-running processes that continue executing until manually stopped. Common examples:

- **Development Servers**: webpack-dev-server, create-react-app, Next.js dev server
- **API Servers**: Express servers, Flask applications, Django development server
- **Databases**: MongoDB, PostgreSQL, Redis (if running locally)
- **Build Watchers**: Sass/SCSS watchers, TypeScript compilers in watch mode
- **Testing Tools**: Jest in watch mode, Karma test runners

### Service Configuration

When creating a service, you configure:

**Basic Information**:
- **Service ID**: Unique identifier (use kebab-case: `my-api-server`)
- **Name**: Human-readable name for display
- **Description**: What the service does and why it's needed

**Execution Settings**:
- **Working Directory**: Where to run the service (relative to app root)
- **Command**: The exact command to execute

**Common Service Examples**:

```json
{
  "react-dev-server": {
    "name": "React Development Server",
    "description": "Hot-reloading development server for React application",
    "workingDir": "./frontend",
    "command": "npm start"
  },
  
  "express-api": {
    "name": "Express API Server",
    "description": "Backend API server with live reloading",
    "workingDir": "./backend",
    "command": "npm run dev"
  },
  
  "sass-watcher": {
    "name": "Sass Compiler",
    "description": "Watches and compiles SCSS files to CSS",
    "workingDir": "./styles",
    "command": "sass --watch src:dist"
  }
}
```

### Service Lifecycle Management

**Starting Services**:
1. Click the green "Start" button
2. Service spawns as a background process
3. Console output immediately available
4. Status indicator turns green with "Running" label

**Monitoring Services**:
- **Visual Indicators**: Green dot = running, red dot = stopped
- **Real-time Console**: Click terminal icon to view live output
- **Status Information**: See if service is currently active
- **Running Count**: Navbar shows total number of running services

**Stopping Services**:
1. Click the red "Stop" button
2. Service receives SIGTERM signal for graceful shutdown
3. Status indicator turns red with "Stopped" label
4. Console shows shutdown messages

### Service Dependencies

Link services to experiments so they start automatically:

1. **Edit Experiment Metadata**
2. **Add to Dependencies Array**: Include service IDs
3. **Automatic Discovery**: Services appear in experiment details
4. **One-click Starting**: Start all dependencies from experiment view

### Working Directory Best Practices

- **Use Relative Paths**: `./frontend`, `./api`, `./tools/build`
- **Verify Paths Exist**: Application will error if directory doesn't exist
- **Consider Process Dependencies**: Some tools need to run from specific locations
- **Test Thoroughly**: Always test services after creation

## Command Management

### Understanding Commands

Commands are one-time executable tasks that run to completion. Unlike services, they:

- **Execute once** and then finish
- **Return a result** (success or failure)
- **Show all output** during execution
- **Don't continue running** in the background

### Common Command Types

**Installation Commands**:
```json
{
  "install-frontend": {
    "name": "Install Frontend Dependencies",
    "description": "Install all npm packages for the frontend",
    "workingDir": "./frontend",
    "command": "npm install"
  }
}
```

**Build Commands**:
```json
{
  "build-production": {
    "name": "Production Build",
    "description": "Create optimized production build",
    "workingDir": "./",
    "command": "npm run build"
  }
}
```

**Testing Commands**:
```json
{
  "run-tests": {
    "name": "Run Test Suite",
    "description": "Execute all unit and integration tests",
    "workingDir": "./",
    "command": "npm test"
  }
}
```

**Utility Commands**:
```json
{
  "clean-cache": {
    "name": "Clean Node Cache",
    "description": "Clear npm cache and node_modules",
    "workingDir": "./",
    "command": "rm -rf node_modules && npm cache clean --force"
  }
}
```

### Command Execution Process

1. **Click Execute**: Command starts immediately
2. **Console Opens**: Real-time output window appears
3. **Live Output**: Watch command progress in real-time
4. **Completion Status**: Success (green) or failure (red) indication
5. **Output History**: Console remains available for review

### Command Best Practices

**Naming Conventions**:
- Use descriptive, action-oriented names
- Include context: "Install Frontend Dependencies" not just "Install"
- Be specific: "Run Unit Tests" vs "Run All Tests Including E2E"

**Command Design**:
- **Make them idempotent**: Safe to run multiple times
- **Include error handling**: Commands should fail gracefully
- **Provide clear output**: Include progress indicators when possible
- **Keep them focused**: One command, one clear purpose

**Working Directory Strategy**:
- **Be explicit**: Always specify the correct working directory
- **Test paths**: Verify directories exist before saving commands
- **Use relative paths**: Keep configurations portable across machines

## Workflow Management

### Understanding Workflows

Workflows are automated sequences that combine multiple services and commands to achieve complex goals. They're perfect for:

- **Environment Setup**: Install dependencies, start services, run migrations
- **Deployment Pipelines**: Build, test, and deploy applications
- **Testing Workflows**: Set up test environment, run tests, generate reports
- **Development Onboarding**: Complete setup for new team members

### Workflow Architecture

Each workflow consists of:

**Metadata**:
- **Workflow ID**: Unique identifier
- **Name**: Human-readable name
- **Description**: What the workflow accomplishes
- **Working Directory**: Default directory for all steps

**Steps Array**:
- **Ordered sequence** of actions
- **Each step** can be a service or command
- **Error handling** per step
- **Timing control** with delays

### Step Types

**Existing Service Steps**:
- Start a predefined service
- Perfect for starting development servers, databases
- Service continues running after step completes

**Existing Command Steps**:
- Execute a predefined command
- Command runs to completion before next step
- Perfect for builds, installations, tests

### Advanced Step Configuration

Each step supports:

**Basic Settings**:
- **Name**: Descriptive name for the step
- **Type**: Service or command
- **Target**: Which service/command to execute

**Advanced Settings**:
- **Working Directory**: Override workflow default
- **Delay**: Wait time after step completion (milliseconds)
- **Continue on Error**: Whether to proceed if step fails

### Error Handling Strategies

**Stop on Error (Default)**:
- Workflow stops at first failed step
- Prevents cascading failures
- Good for critical setup workflows

**Continue on Error**:
- Workflow continues even if step fails
- Useful for optional steps
- Good for cleanup or reporting workflows

### Workflow Execution Process

1. **Initialization**: Workflow console opens automatically
2. **Step-by-Step Execution**: Each step runs in sequence
3. **Real-time Progress**: Visual progress indicator updates
4. **Console Aggregation**: All step output appears in workflow console
5. **Completion Status**: Success/failure indication with summary

### Workflow Examples

**Complete Development Setup**:
```json
{
  "full-dev-setup": {
    "name": "Complete Development Environment",
    "description": "Set up everything needed for development",
    "workingDir": "./",
    "steps": [
      {
        "name": "Install Frontend Dependencies",
        "type": "existing-command",
        "commandId": "install-frontend"
      },
      {
        "name": "Install Backend Dependencies", 
        "type": "existing-command",
        "commandId": "install-backend"
      },
      {
        "name": "Start Database",
        "type": "existing-service",
        "serviceId": "postgres-db",
        "delay": 3000
      },
      {
        "name": "Run Database Migrations",
        "type": "existing-command", 
        "commandId": "run-migrations",
        "delay": 1000
      },
      {
        "name": "Start API Server",
        "type": "existing-service",
        "serviceId": "express-api",
        "delay": 2000
      },
      {
        "name": "Start Frontend Server",
        "type": "existing-service",
        "serviceId": "react-dev"
      }
    ]
  }
}
```

**Testing Pipeline**:
```json
{
  "test-pipeline": {
    "name": "Complete Testing Pipeline",
    "description": "Run all tests with proper setup and cleanup",
    "steps": [
      {
        "name": "Install Dependencies",
        "type": "existing-command",
        "commandId": "install-deps"
      },
      {
        "name": "Lint Code",
        "type": "existing-command",
        "commandId": "run-lint",
        "continueOnError": true
      },
      {
        "name": "Run Unit Tests",
        "type": "existing-command",
        "commandId": "unit-tests"
      },
      {
        "name": "Start Test Database",
        "type": "existing-service",
        "serviceId": "test-db",
        "delay": 2000
      },
      {
        "name": "Run Integration Tests",
        "type": "existing-command", 
        "commandId": "integration-tests"
      },
      {
        "name": "Generate Coverage Report",
        "type": "existing-command",
        "commandId": "coverage-report",
        "continueOnError": true
      }
    ]
  }
}
```

### Required vs Optional Workflows in Experiments

**Required Workflows**:
- Block experiment loading until completed
- Perfect for essential setup (databases, API servers)
- Shown with warning styling
- "Load Experiment" disabled until completion

**Optional Workflows**:
- Can run before or after experiment loading
- Great for enhancements (monitoring, debugging tools)
- Shown with informational styling
- Don't block experiment loading

## Console System

### Real-time Console Architecture

The console system uses **Server-Sent Events (SSE)** for real-time communication:

1. **Browser Connection**: Establishes SSE connection to server
2. **Process Output**: All process stdout/stderr captured
3. **Broadcast System**: Server broadcasts output to all connected clients
4. **Live Updates**: Console windows update immediately

### Console Window Features

**Draggable Windows**:
- Click and drag console windows anywhere on screen
- Automatic collision detection
- Remember position during session

**Window Controls**:
- **Show/Hide**: Minimize without closing
- **Clear**: Remove all output history
- **Close**: Permanently close console

**Output Types**:
- **Standard Output (stdout)**: Regular output in white text
- **Error Output (stderr)**: Error messages in red text
- **Timestamps**: All messages include precise timestamps

### Console Manager Interface

**Centralized Overview**:
- See all active consoles in one place
- Process type identification (service, command, workflow)
- Status indicators (visible, hidden, running, stopped)
- Quick access controls

**Management Actions**:
- **Toggle Visibility**: Show/hide individual consoles
- **Close All**: Shut down all console windows
- **Filter by Type**: Show only services, commands, or workflows

### Console Output Persistence

**Session Persistence**:
- Console output persists during browser session
- Refresh page without losing history
- Reconnect automatically after brief disconnections

**Output Limits**:
- Automatic cleanup of very old output
- Configurable retention policies
- Memory management for long-running processes

### Console Best Practices

**For Development**:
- Keep relevant consoles open during active development
- Use console manager to organize multiple outputs
- Clear consoles periodically to reduce clutter

**For Debugging**:
- Check both stdout and stderr for complete picture
- Look for timestamp patterns to identify issues
- Save important output before clearing consoles

## Configuration Guide

### services.json Structure

The main configuration file contains three sections:

```json
{
  "services": {
    "service-id": {
      "name": "Display Name",
      "description": "What this service does",
      "workingDir": "./relative/path",
      "command": "command to run"
    }
  },
  "commands": {
    "command-id": {
      "name": "Command Name", 
      "description": "What this command does",
      "workingDir": "./relative/path",
      "command": "command to execute"
    }
  },
  "workflows": {
    "workflow-id": {
      "name": "Workflow Name",
      "description": "What this workflow accomplishes", 
      "workingDir": "./default/path",
      "steps": [
        {
          "name": "Step Name",
          "type": "existing-service|existing-command",
          "serviceId": "service-id",
          "commandId": "command-id",
          "workingDir": "./override/path",
          "delay": 1000,
          "continueOnError": false
        }
      ]
    }
  }
}
```

### Environment Configuration

**Port Configuration**:
```bash
# Set custom port
PORT=8080 npm start

# Default port is 7890
```

**Directory Configuration**:
```bash
# Set custom experiments directory
EXPERIMENTS_DIR=./my-experiments npm start

# Default is ./experiments
```

### File System Layout

```
experiment-browser/
├── package.json                 # Node.js dependencies
├── server.js                   # Main server file
├── services.json              # Services/commands/workflows config
├── experiments/               # Your experiments directory
│   ├── sample-experiment/
│   └── your-projects/
├── public/                    # Frontend files
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── assets/
├── routes/                    # API route handlers
├── lib/                      # Server-side utilities
└── README.md                 # This file
```

### Backup and Version Control

**What to Include in Version Control**:
- `services.json` (team configurations)
- `experiments/` directory (your projects)
- Custom modifications to the application

**What to Exclude**:
- `node_modules/`
- Log files
- Temporary files
- Process-specific data

**Configuration Backup Strategy**:
```bash
# Backup current configuration
cp services.json services.json.backup

# Create dated backup
cp services.json "services-$(date +%Y%m%d).json"
```

## Advanced Usage Patterns

### Team Development Workflows

**Shared Configuration Strategy**:
1. **Commit services.json**: Include in version control
2. **Standardize Paths**: Use relative paths that work for all team members
3. **Document Requirements**: Include setup instructions in README
4. **Environment Variables**: Use for machine-specific settings

**Onboarding New Developers**:
```json
{
  "onboarding-workflow": {
    "name": "New Developer Setup",
    "description": "Complete setup for new team members",
    "steps": [
      {
        "name": "Install Dependencies",
        "type": "existing-command",
        "commandId": "install-all-deps"
      },
      {
        "name": "Setup Development Database",
        "type": "existing-command",
        "commandId": "setup-dev-db"
      },
      {
        "name": "Run Initial Migrations",
        "type": "existing-command", 
        "commandId": "run-migrations"
      },
      {
        "name": "Start All Development Services",
        "type": "existing-workflow",
        "workflowId": "start-dev-environment"
      }
    ]
  }
}
```

### Complex Development Environments

**Microservices Management**:
```json
{
  "microservices-startup": {
    "name": "Start All Microservices",
    "description": "Launch complete microservices architecture",
    "steps": [
      {
        "name": "Start Database Cluster",
        "type": "existing-service",
        "serviceId": "postgres-cluster",
        "delay": 5000
      },
      {
        "name": "Start Redis Cache",
        "type": "existing-service", 
        "serviceId": "redis-cache",
        "delay": 2000
      },
      {
        "name": "Start User Service",
        "type": "existing-service",
        "serviceId": "user-service",
        "delay": 3000
      },
      {
        "name": "Start Order Service", 
        "type": "existing-service",
        "serviceId": "order-service",
        "delay": 3000
      },
      {
        "name": "Start API Gateway",
        "type": "existing-service",
        "serviceId": "api-gateway",
        "delay": 2000
      },
      {
        "name": "Start Frontend",
        "type": "existing-service",
        "serviceId": "react-frontend"
      }
    ]
  }
}
```

### Testing and CI/CD Integration

**Automated Testing Workflow**:
```json
{
  "ci-pipeline": {
    "name": "Continuous Integration Pipeline", 
    "description": "Full CI pipeline with testing and quality checks",
    "steps": [
      {
        "name": "Install Dependencies",
        "type": "existing-command",
        "commandId": "install-deps"
      },
      {
        "name": "Lint Code",
        "type": "existing-command",
        "commandId": "lint"
      },
      {
        "name": "Type Check", 
        "type": "existing-command",
        "commandId": "type-check"
      },
      {
        "name": "Unit Tests",
        "type": "existing-command",
        "commandId": "test-unit"
      },
      {
        "name": "Integration Tests",
        "type": "existing-command",
        "commandId": "test-integration"
      },
      {
        "name": "Build Production",
        "type": "existing-command",
        "commandId": "build-prod"
      },
      {
        "name": "Security Audit",
        "type": "existing-command",
        "commandId": "security-audit",
        "continueOnError": true
      }
    ]
  }
}
```

### Performance Monitoring Setup

**Development Monitoring**:
```json
{
  "monitoring-stack": {
    "name": "Development Monitoring Stack",
    "description": "Start all monitoring and debugging tools",
    "steps": [
      {
        "name": "Start Application",
        "type": "existing-workflow", 
        "workflowId": "dev-environment"
      },
      {
        "name": "Start Performance Monitor",
        "type": "existing-service",
        "serviceId": "perf-monitor",
        "delay": 2000
      },
      {
        "name": "Start Log Aggregator",
        "type": "existing-service",
        "serviceId": "log-aggregator"
      },
      {
        "name": "Open Monitoring Dashboard",
        "type": "existing-command",
        "commandId": "open-dashboard",
        "delay": 3000
      }
    ]
  }
}
```

## API Reference

### Experiments API

**GET /api/experiments**
- Returns array of all experiments with metadata
- Response: `Array<ExperimentObject>`

**GET /api/experiments/:folder/metadata** 
- Returns metadata for specific experiment
- Response: `ExperimentMetadata`

**PUT /api/experiments/:folder/metadata**
- Updates experiment metadata
- Body: `ExperimentMetadata`
- Response: `{ message: string }`

**GET /api/experiments/:folder/documentation**
- Returns list of documentation files
- Response: `Array<DocumentationFile>`

**GET /api/experiments/:folder/documentation/:filename**
- Returns content of specific documentation file
- Response: Raw file content

### Services API

**GET /api/services**
- Returns all services, commands, and workflows with status
- Response: `{ services: Object, commands: Object, workflows: Object }`

**POST /api/services**
- Creates new service
- Body: `{ id: string, name: string, description: string, workingDir: string, command: string }`
- Response: `{ message: string, id: string }`

**PUT /api/services/:serviceId**
- Updates existing service
- Body: `ServiceData`
- Response: `{ message: string }`

**DELETE /api/services/:serviceId**
- Deletes service (stops if running)
- Response: `{ message: string }`

**POST /api/services/:serviceId/start**
- Starts service
- Response: `{ message: string }`

**POST /api/services/:serviceId/stop**
- Stops service
- Response: `{ message: string }`

### Commands API

**POST /api/commands**
- Creates new command
- Body: `{ id: string, name: string, description: string, workingDir: string, command: string }`
- Response: `{ message: string, id: string }`

**PUT /api/commands/:commandId**
- Updates existing command
- Body: `CommandData`
- Response: `{ message: string }`

**DELETE /api/commands/:commandId**
- Deletes command
- Response: `{ message: string }`

**POST /api/commands/:commandId/execute**
- Executes command
- Response: `{ message: string, executionId: string, result: string }`

### Workflows API

**POST /api/workflows**
- Creates new workflow
- Body: `{ id: string, name: string, description: string, workingDir: string, steps: Array<WorkflowStep> }`
- Response: `{ message: string, id: string }`

**PUT /api/workflows/:workflowId**
- Updates existing workflow
- Body: `WorkflowData`
- Response: `{ message: string }`

**DELETE /api/workflows/:workflowId**
- Deletes workflow
- Response: `{ message: string }`

**POST /api/workflows/:workflowId/execute**
- Executes workflow
- Response: `{ message: string, results: Array<string> }`

### Console API

**GET /api/console/stream**
- Server-Sent Events endpoint for real-time console output
- Returns: SSE stream with console updates

**GET /api/console/:processId**
- Returns console output for specific process
- Response: `{ processId: string, type: string, status: string, output: Array<ConsoleMessage>, isRunning: boolean }`

**GET /api/console**
- Returns list of all processes with console output
- Response: `Array<ProcessInfo>`

**DELETE /api/console/:processId**
- Clears console output for specific process
- Response: `{ message: string }`

## Application Architecture

### Backend Architecture

**Express.js Server** (`server.js`):
- Main application entry point
- Route mounting and middleware setup
- Static file serving
- Process management initialization

**Route Modules** (`routes/`):
- `experiments.js`: Experiment CRUD and file operations
- `services.js`: Service lifecycle management
- `commands.js`: Command execution handling
- `workflows.js`: Workflow orchestration
- `console.js`: Real-time console streaming

**Core Libraries** (`lib/`):
- `experimentManager.js`: File system operations for experiments
- `processManager.js`: Child process spawning and management
- `consoleManager.js`: Console output aggregation and broadcasting
- `servicesConfig.js`: Configuration file handling

### Frontend Architecture

**Modular JavaScript Design**:
- `app.js`: Application bootstrap and global state management
- `experiments.js`: Experiment management and UI
- `services.js`: Service management and controls
- `commands.js`: Command execution and management
- `workflows.js`: Workflow creation and execution
- `console.js`: Console window management and SSE handling
- `ui-utils.js`: Common UI utilities and helpers
- `api-utils.js`: Centralized API communication

**CSS Organization**:
- `main.css`: Layout and base styles
- `experiments.css`: Experiment-specific styling
- `services.css`: Service/command/workflow styling  
- `console.css`: Console window styling
- `modals.css`: Modal dialog styling
- `utilities.css`: Shared utility classes

### Data Flow Architecture

**Real-time Updates**:
1. **Process Output**: Child processes generate stdout/stderr
2. **Console Manager**: Captures and timestamps all output
3. **SSE Broadcasting**: Sends updates to all connected browsers
4. **Frontend Reception**: JavaScript receives and displays updates
5. **UI Updates**: Console windows and status indicators update

**State Management**:
- **Server State**: Process registry, console outputs, configuration
- **Client State**: UI state, selected items, filter states
- **Synchronization**: Regular API calls and real-time SSE updates

### Security Considerations

**Input Validation**:
- All API inputs validated and sanitized
- File path validation to prevent directory traversal
- Command injection prevention

**Process Security**:
- Child processes run with same privileges as application
- No elevation of privileges
- Process isolation and cleanup

**Network Security**:
- Local network binding by default
- CORS configuration for development
- No authentication (local development tool)

## Extending the Application

### Adding New Features

**Backend Extensions**:
1. **Create Route File**: Add new route handler in `routes/`
2. **Add to Server**: Mount route in `server.js`
3. **Create Business Logic**: Add corresponding library in `lib/`
4. **Update Configuration**: Modify `services.json` structure if needed

**Frontend Extensions**:
1. **Create JavaScript Module**: Add new `.js` file with clear naming
2. **Add CSS Styles**: Create corresponding `.css` file
3. **Update HTML**: Add necessary UI elements to `index.html`
4. **Register Module**: Include in `app.js` initialization

### Custom Process Types

**Adding New Step Types to Workflows**:
1. **Update Workflow Builder**: Add new type to `workflows.js`
2. **Extend Process Manager**: Handle new type in `processManager.js`
3. **Update UI**: Add form fields and validation
4. **Test Integration**: Ensure proper console output handling

### Plugin Architecture Possibilities

**Potential Plugin System**:
- **Service Plugins**: Custom service types with specialized handling
- **UI Plugins**: Additional pages or dashboard widgets
- **Integration Plugins**: Connections to external tools (Docker, Kubernetes)
- **Notification Plugins**: Custom alerting and notification systems

### Theme Customization

**CSS Customization**:
- Override Bulma CSS variables
- Add custom color schemes
- Modify component styles
- Create responsive breakpoints

**UI Customization**:
- Add custom icons
- Modify layout structure
- Create custom components
- Enhance accessibility features

## Troubleshooting Guide

### Common Installation Issues

**Node.js Version Problems**:
```bash
# Check Node.js version
node --version

# Should be 14.0.0 or higher
# If not, update Node.js from nodejs.org
```

**Port Already in Use**:
```bash
# Error: EADDRINUSE: address already in use :::7890
# Solution 1: Kill process using port
lsof -i :7890
kill -9 <PID>

# Solution 2: Use different port
PORT=8080 npm start
```

**Permission Errors**:
```bash
# If you get permission errors
sudo chown -R $USER ~/.npm
npm cache clean --force
```

### Service Management Issues

**Services Won't Start**:
1. **Check Working Directory**: Ensure path exists and is correct
2. **Verify Command**: Test command manually in terminal
3. **Check Dependencies**: Ensure all required tools are installed
4. **Review Console Output**: Look for specific error messages

**Services Start But Don't Work**:
1. **Check Port Conflicts**: Services might be fighting for same port
2. **Verify Configuration**: Check service-specific config files
3. **Review Environment Variables**: Ensure all required env vars are set
4. **Check File Permissions**: Ensure service has access to required files

**Console Output Not Showing**:
1. **Check Browser Console**: Look for JavaScript errors
2. **Verify SSE Connection**: Check Network tab for `/api/console/stream`
3. **Check Firewall**: Ensure no blocking of local connections
4. **Try Browser Refresh**: Sometimes SSE connections need reset

### Experiment Loading Issues

**Experiments Don't Appear**:
1. **Check HTML Files**: Ensure at least one `.html` file exists
2. **Verify Directory Structure**: Experiments must be in `experiments/` directory
3. **Check File Permissions**: Ensure application can read files
4. **Review Console Errors**: Check browser console for errors

**Required Workflows Block Loading**:
1. **Check Workflow Status**: Ensure all required workflows completed successfully
2. **Verify Services Still Running**: Some workflows start services that might have stopped
3. **Review Workflow Logs**: Check console output for workflow execution errors
4. **Clear Workflow State**: Sometimes requires re-running workflows

**Fullscreen Mode Issues**:
1. **Browser Compatibility**: Some browsers handle fullscreen differently
2. **Popup Blockers**: Ensure popup blockers aren't interfering
3. **Security Restrictions**: Some browsers block fullscreen from iframes

### Performance Issues

**Slow Console Updates**:
1. **Check SSE Connection**: Verify stable connection to server
2. **Limit Console History**: Clear old console data regularly
3. **Check Network**: Ensure stable local network connection
4. **Browser Resources**: Check if browser is running low on memory

**High Memory Usage**:
1. **Console Data Accumulation**: Clear console outputs periodically
2. **Too Many Running Services**: Stop unnecessary services
3. **Browser Memory**: Check browser task manager for memory usage
4. **Process Cleanup**: Restart application if memory usage grows too high

### Configuration Issues

**services.json Corruption**:
```bash
# Backup current file
cp services.json services.json.broken

# Restore from backup
cp services.json.backup services.json

# Or reset to defaults
rm services.json
# Restart application to regenerate
```

**Invalid JSON Format**:
1. **Use JSON Validator**: Paste configuration into online JSON validator
2. **Check Common Errors**: Missing commas, unmatched brackets, unescaped quotes
3. **Use Text Editor**: Use editor with JSON syntax highlighting
4. **Validate Before Saving**: Always validate JSON before saving changes

### Network and Connectivity Issues

**SSE Connection Failures**:
1. **Check Browser Support**: Ensure browser supports EventSource
2. **Verify Server Running**: Confirm server is accessible at correct port
3. **Check Proxy Settings**: Corporate proxies might block SSE
4. **Try Different Browser**: Test with different browser to isolate issue

**API Request Failures**:
1. **Check Network Tab**: Review failed requests in browser dev tools
2. **Verify Server Status**: Ensure server is running and responding
3. **Check Request Format**: Verify API requests have correct format
4. **Review CORS Settings**: Ensure CORS is properly configured

## Best Practices

### Experiment Organization

**Naming Conventions**:
- Use descriptive, kebab-case folder names: `react-todo-app`, `data-visualization-d3`
- Include technology in name when relevant: `vue-component-library`, `node-api-template`
- Use versioning for iterations: `login-form-v1`, `login-form-v2`

**Metadata Management**:
- **Always fill out descriptions**: Future you will thank you
- **Use consistent tagging**: Establish tag conventions and stick to them
- **Rate your experiments**: Helps prioritize which ones to maintain
- **Link related experiments**: Build a knowledge graph of your work

**Documentation Standards**:
- **Include README.md**: Explain what the experiment does and how to use it
- **Document dependencies**: List any required services or setup
- **Add screenshots**: Visual documentation is incredibly helpful
- **Include lessons learned**: Note what worked and what didn't

### Service and Command Design

**Service Best Practices**:
- **Make services stateless**: Services should be able to restart cleanly
- **Use health checks**: Commands that verify service is ready
- **Handle graceful shutdown**: Services should respond properly to SIGTERM
- **Log meaningful information**: Include startup messages and error details

**Command Best Practices**:
- **Make commands idempotent**: Safe to run multiple times
- **Include progress indicators**: Show what's happening during execution
- **Handle errors gracefully**: Provide clear error messages
- **Clean up after yourself**: Remove temporary files and processes

**Configuration Management**:
- **Use relative paths**: Keep configurations portable
- **Document environment requirements**: Note any special setup needed
- **Version your configurations**: Commit services.json to version control
- **Test on fresh environments**: Verify setup works on clean machines

### Workflow Design Principles

**Workflow Structure**:
- **Keep workflows focused**: One clear purpose per workflow
- **Use descriptive step names**: Make it clear what each step does
- **Handle failures gracefully**: Use `continueOnError` appropriately
- **Add appropriate delays**: Give services time to start up properly

**Dependency Management**:
- **Order steps carefully**: Ensure dependencies start before dependents
- **Group related operations**: Keep similar steps together
- **Use conditional logic**: Skip steps that aren't needed
- **Test workflow isolation**: Ensure workflows can run independently

**Error Recovery**:
- **Plan for failures**: What happens when steps fail?
- **Provide rollback options**: Commands to undo changes if needed
- **Log comprehensive information**: Make debugging easier
- **Test failure scenarios**: Deliberately break things to test recovery

### Team Collaboration

**Shared Configuration**:
- **Commit services.json**: Include in version control
- **Document team standards**: Establish naming and organization conventions
- **Use consistent environments**: Ensure everyone has similar setups
- **Share workflow patterns**: Establish common workflow templates

**Documentation Culture**:
- **Document everything**: Err on the side of over-documentation
- **Keep docs updated**: Update documentation when changing configurations
- **Use consistent formatting**: Establish documentation templates
- **Review regularly**: Schedule regular documentation review sessions

**Onboarding Process**:
- **Create onboarding workflow**: Automate new developer setup
- **Maintain setup instructions**: Keep README.md updated with setup steps
- **Test onboarding regularly**: Verify setup works on fresh machines
- **Gather feedback**: Improve process based on new developer experience

### Performance and Maintenance

**Regular Maintenance**:
- **Clean console outputs**: Clear old console data periodically
- **Review running services**: Stop services that aren't needed
- **Update dependencies**: Keep Node.js and npm packages current
- **Backup configurations**: Regular backups of services.json

**Performance Monitoring**:
- **Monitor memory usage**: Watch for memory leaks in long-running processes
- **Check process counts**: Don't let zombie processes accumulate
- **Review startup times**: Optimize slow-starting services
- **Monitor console performance**: Large console outputs can slow UI

**Security Practices**:
- **Limit network exposure**: Only bind to localhost for development
- **Validate all inputs**: Sanitize configuration inputs
- **Review command execution**: Be careful with commands that modify system
- **Keep software updated**: Regular updates for security patches

## FAQ

### General Questions

**Q: What's the difference between this and other development tools?**
A: The Experiment Browser focuses specifically on organizing and running experimental projects with their dependencies. Unlike IDEs or build tools, it's designed for managing multiple projects and their associated services in one interface.

**Q: Can I use this for production deployments?**
A: No, this is designed as a development tool. It lacks production features like authentication, SSL, load balancing, and security hardening.

**Q: Does it work on Windows/Mac/Linux?**
A: Yes, it's built on Node.js and works on all platforms. Commands and services may need platform-specific adjustments.

### Technical Questions

**Q: How do I change the default port?**
A: Set the PORT environment variable: `PORT=8080 npm start`

**Q: Can I run this on a remote server?**
A: It's designed for local development, but you can bind to other interfaces by modifying the server configuration. Add proper security measures if exposing to network.

**Q: How do I add custom CSS themes?**
A: Create custom CSS files and modify the HTML to include them. The application uses Bulma CSS framework which supports easy customization.

**Q: Can I integrate with Docker?**
A: Yes! Create services that run Docker commands, or commands that build and run Docker containers. Example:
```json
{
  "docker-api": {
    "name": "Docker API Server",
    "description": "API server running in Docker container",
    "command": "docker run -p 3000:3000 my-api-image"
  }
}
```

### Workflow Questions

**Q: What happens if a workflow step fails?**
A: By default, the workflow stops. You can set `continueOnError: true` on individual steps to continue despite failures.

**Q: Can workflows call other workflows?**
A: Currently, workflows can only contain services and commands. Nested workflow calls aren't supported but could be added as a future feature.

**Q: How do I make workflows run faster?**
A: Reduce delays between steps, run independent steps in parallel (manually), and optimize individual commands and services.

### Troubleshooting Questions

**Q: Console output isn't showing up, what's wrong?**
A: Check the browser console for errors, verify the SSE connection in the Network tab, and ensure no firewall or proxy is blocking the connection.

**Q: Services start but experiments can't connect to them, why?**
A: Check that services are binding to the correct host/port, verify firewall settings, and ensure experiments are using the correct URLs.

**Q: The application is using too much memory, how do I fix it?**
A: Clear console outputs regularly, stop unnecessary services, and restart the application periodically to clear accumulated memory.

**Q: Can I recover deleted services/commands/workflows?**
A: If you have `services.json` in version control, you can restore from there. Otherwise, you'll need to recreate them manually.

### Advanced Questions

**Q: Can I extend the application with plugins?**
A: The application doesn't have a formal plugin system, but you can modify the source code to add new features. Consider contributing improvements back to the project.

**Q: How do I monitor resource usage of running services?**
A: You can create commands that run system monitoring tools (like `ps`, `top`, `htop`) or integrate with system monitoring tools.

**Q: Can I run this in a team environment?**
A: Yes, but each developer needs their own instance. You can share configuration files through version control for consistent setups.

**Q: How do I backup my entire setup?**
A: Backup the `services.json` file and the entire `experiments/` directory. If using version control, commit these files to preserve your work.

---

*This comprehensive documentation covers all aspects of the Experiment Browser. For additional help or to report issues, please refer to the application's support channels or documentation.*