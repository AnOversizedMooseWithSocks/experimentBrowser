import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js';
import eventBus from './events.js';
import * as state from './state.js';
import { DEFAULT_SETTINGS } from './config.js';
import * as api from './api.js';
import * as galaxy from './galaxy.js';
import * as renderer from './renderer.js';
import * as cameraControls from './camera-controls.js';
import * as effects from './effects.js';
import * as starUI from './star-ui.js';

/**
 * Set up all UI event listeners with enhanced galaxy controls
 */
export function setupUI() {
    console.log('Setting up enhanced UI event listeners...');
    
    // Animation control sliders
    setupAnimationControls();
    
    // Enhanced black hole controls with physics parameters
    setupEnhancedBlackHoleControls();
    
    // Rating stars - click to rate galaxy
    setupRatingSystem();
    
    // Enhanced keyboard shortcuts
    setupEnhancedKeyboardShortcuts();
    
    // Set up galaxy analysis overlay
    setupGalaxyAnalysisOverlay();
    
    // Set up star information overlay
    starUI.setupStarInformationOverlay();
    
    // Set up star selection (click on canvas)
    starUI.setupStarSelection();
    
    // Set up status message handling
    setupStatusListener();
    
    // Load favorites on startup
    loadFavorites();
    
    // Initialize enhanced performance monitoring
    initializeEnhancedPerformanceMonitoring();
    
    // Add Black Hole Info Button
    setupBlackHoleInfoButton();
    
    console.log('✅ Enhanced UI event listeners set up');
    
    // Mark UI initialization as complete
    state.setInitializationProgressStep('ui', true);
    eventBus.emit('ui-ready');
}

/**
 * Setup the Black Hole Info button
 */
function setupBlackHoleInfoButton() {
    // Check if the button already exists
    if (document.getElementById('black-holes-info-btn')) {
        return;
    }
    
    // Find the black hole controls section
    const blackHoleControlsSection = document.querySelector('.effects-controls');
    if (!blackHoleControlsSection) {
        return;
    }
    
    // Create the new button
    const infoButton = document.createElement('button');
    infoButton.id = 'black-holes-info-btn';
    infoButton.textContent = 'ℹ️ Black Hole Info';
    infoButton.onclick = showBlackHoleInfo;
    
    // Add the button to the black hole controls section
    blackHoleControlsSection.appendChild(infoButton);
}

/**
 * Display information about black holes in the current galaxy
 */
function showBlackHoleInfo() {
    const blackHoles = state.getBlackHoles();
    if (!blackHoles || blackHoles.length === 0) {
        setStatus('No black holes in this galaxy');
        return;
    }
    
    // Format the output
    let info = `Found ${blackHoles.length} black hole${blackHoles.length > 1 ? 's' : ''} in this galaxy:\n\n`;
    
    blackHoles.forEach((bh, index) => {
        const distance = Math.sqrt(bh.position.x ** 2 + bh.position.z ** 2).toFixed(2);
        const heightFromPlane = Math.abs(bh.position.y).toFixed(2);
        
        info += `Black Hole #${index}:\n`;
        info += `  Mass: ${bh.mass.toFixed(2)} units\n`;
        info += `  Radius: ${bh.radius.toFixed(2)} units\n`;
        info += `  Distance from center: ${distance} kpc\n`;
        info += `  Height from galactic plane: ${heightFromPlane} kpc\n`;
        
        if (index === 0 && distance < 0.1) {
            info += `  Type: Supermassive (Central)\n`;
        } else {
            info += `  Type: Stellar-mass (Galactic)\n`;
        }
        
        if (index < blackHoles.length - 1) {
            info += '\n';
        }
    });
    
    // Log to console for detailed view
    console.log('Black Hole Information:');
    console.log(info);
    
    // Create a summary for the status display
    const centralBH = blackHoles.find(bh => Math.sqrt(bh.position.x ** 2 + bh.position.z ** 2) < 0.1);
    const smallerBHs = blackHoles.filter(bh => Math.sqrt(bh.position.x ** 2 + bh.position.z ** 2) >= 0.1);
    
    let statusMsg = '';
    if (centralBH) {
        statusMsg += `Central supermassive black hole: Mass ${centralBH.mass.toFixed(1)}`;
    }
    
    if (smallerBHs.length > 0) {
        if (statusMsg) statusMsg += ' + ';
        statusMsg += `${smallerBHs.length} smaller black hole${smallerBHs.length > 1 ? 's' : ''} throughout galaxy`;
    }
    
    // Show in status
    setStatus(statusMsg + ' (see console for details)');
    
    // Show in blackhole indicator
    updateBlackHoleIndicator(blackHoles);
}

/**
 * Update the black hole indicator with more details
 */
function updateBlackHoleIndicator(blackHoles) {
    const indicator = document.getElementById('blackhole-indicator');
    if (!indicator) return;
    
    // Count black holes by type
    const central = blackHoles.filter(bh => Math.sqrt(bh.position.x ** 2 + bh.position.z ** 2) < 0.1).length;
    const galactic = blackHoles.length - central;
    
    // Update indicator with more dramatic styling
    indicator.innerHTML = `
        <div style="font-size: 12px; color: #ff3300; font-weight: bold;">
            ${blackHoles.length} Black Hole${blackHoles.length > 1 ? 's' : ''} Detected
        </div>
        <div style="font-size: 11px; margin-top: 5px; display: flex; justify-content: center; gap: 10px;">
            ${central ? `<span style="color: #ff6600;">
                <span style="font-weight: bold;">${central}</span> Supermassive
                </span>` : ''}
            ${central && galactic ? '•' : ''}
            ${galactic ? `<span style="color: #9966ff;">
                <span style="font-weight: bold;">${galactic}</span> Stellar Mass
                </span>` : ''}
        </div>
    `;
    
    // Add active class and enhance styling
    indicator.classList.add('active');
    indicator.style.background = 'rgba(0, 0, 0, 0.6)';
    indicator.style.borderColor = central ? '#ff3300' : '#9966ff';
    indicator.style.boxShadow = `0 0 10px ${central ? 'rgba(255, 51, 0, 0.3)' : 'rgba(153, 102, 255, 0.3)'}`;
}

/**
 * Set up status message listener
 */
function setupStatusListener() {
    eventBus.on('status-update', setStatus);
}

/**
 * Set up galaxy analysis overlay event listeners
 */
function setupGalaxyAnalysisOverlay() {
    const closeBtn = document.getElementById('analysis-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', toggleGalaxyAnalysisOverlay);
    }
    
    // Make function globally available
    window.toggleGalaxyAnalysisOverlay = toggleGalaxyAnalysisOverlay;
}

/**
 * Toggle the galaxy analysis overlay
 */
export function toggleGalaxyAnalysisOverlay() {
    const overlay = document.getElementById('galaxy-analysis-overlay');
    if (!overlay) return;
    
    if (overlay.classList.contains('visible')) {
        // Hide overlay
        overlay.classList.remove('visible');
        overlay.style.display = 'none';
        setStatus('Galaxy analysis overlay hidden');
    } else {
        // Show overlay and populate with current data
        if (state.getCurrentGalaxyData()) {
            displayGalaxyAnalysis();
            overlay.classList.add('visible');
            overlay.style.display = 'block';
        } else {
            setStatus('No galaxy data available for analysis');
        }
    }
}

/**
 * Set up animation control sliders with enhanced feedback
 */
function setupAnimationControls() {
    // Speed slider - controls animation speed
    const speedSlider = document.getElementById('speed-slider');
    const speedValue = document.getElementById('speed-value');
    if (speedSlider) {
        speedSlider.addEventListener('input', (e) => {
            const newSpeed = parseFloat(e.target.value);
            renderer.updateAnimationSpeed(newSpeed);
            speedValue.textContent = newSpeed.toFixed(1);
            
            // Enhanced feedback for speed changes
            if (newSpeed === 0) {
                setStatus('Animation paused (speed: 0)');
            } else if (newSpeed > 2.0) {
                setStatus('High speed: Observing galaxy evolution');
            } else if (newSpeed < 0.5) {
                setStatus('Slow motion: Detailed orbital mechanics visible');
            }
        });
    }
    
    // Zoom slider - controls camera distance
    const zoomSlider = document.getElementById('zoom-slider');
    const zoomValue = document.getElementById('zoom-value');
    if (zoomSlider) {
        zoomSlider.addEventListener('input', (e) => {
            const newZoom = parseFloat(e.target.value);
            cameraControls.updateZoom(newZoom);
            zoomValue.textContent = newZoom.toString();
            
            // Enhanced feedback for zoom changes
            const physics = state.getCurrentGalaxyPhysics();
            const galaxyRadius = physics?.galaxyRadius || 50;
            const viewPercent = ((galaxyRadius * 2) / newZoom * 100).toFixed(0);
            setStatus(`Zoom: ${newZoom} units (viewing ${viewPercent}% of galaxy)`);
        });
    }
    
    // Glow slider - controls particle glow intensity
    const glowSlider = document.getElementById('glow-slider');
    const glowValue = document.getElementById('glow-value');
    if (glowSlider) {
        glowSlider.addEventListener('input', (e) => {
            const newGlow = parseFloat(e.target.value);
            renderer.updateGlow(newGlow);
            glowValue.textContent = newGlow.toFixed(1);
            
            // Enhanced feedback for glow changes
            if (newGlow > 2.0) {
                setStatus('High glow: Emphasizing star-forming regions');
            } else if (newGlow < 1.0) {
                setStatus('Low glow: Realistic stellar brightness');
            }
        });
    }
}

/**
 * Set up enhanced black hole effects controls with physics feedback
 */
function setupEnhancedBlackHoleControls() {
    // Gravitational strength slider with enhanced feedback
    const gravitySlider = document.getElementById('gravity-slider');
    const gravityValue = document.getElementById('gravity-value');
    if (gravitySlider) {
        gravitySlider.addEventListener('input', (e) => {
            const newStrength = parseFloat(e.target.value);
            galaxy.updateGravitationalStrength(newStrength);
            gravityValue.textContent = newStrength.toFixed(1);
            
            // Physics-based feedback
            if (newStrength > 3.0) {
                setStatus('Extreme gravity: Stellar streams and tidal disruption visible');
            } else if (newStrength > 1.5) {
                setStatus('Strong gravity: Clear orbital perturbations');
            } else if (newStrength < 0.5) {
                setStatus('Weak gravity: Minimal black hole interaction');
            }
        });
    }
    
    // Black hole influence radius slider with enhanced feedback
    const influenceSlider = document.getElementById('influence-slider');
    const influenceValue = document.getElementById('influence-value');
    if (influenceSlider) {
        influenceSlider.addEventListener('input', (e) => {
            const newRadius = parseFloat(e.target.value);
            galaxy.updateBlackHoleInfluenceRadius(newRadius);
            influenceValue.textContent = newRadius.toFixed(1);
            
            // Calculate influence as percentage of galaxy
            const physics = state.getCurrentGalaxyPhysics();
            const galaxyRadius = physics?.galaxyRadius || 50;
            const influencePercent = (newRadius / galaxyRadius * 100).toFixed(1);
            setStatus(`Black hole influence: ${influencePercent}% of galaxy radius`);
        });
    }
}

/**
 * Generate galaxy with seed from input field
 * Acts as a bridge to the galaxy module
 */
export async function generateGalaxy() {
    // Get seed from input field or generate random one
    const seedInput = document.getElementById('seed-input').value.trim();
    const seed = seedInput || galaxy.generateRandomSeed();
    
    return await galaxy.generateGalaxy(seed);
}

/**
 * Generate galaxy with a random seed
 * Acts as a bridge to the galaxy module
 */
export async function randomSeed() {
    return await galaxy.randomSeed();
}

/**
 * Toggle black hole effects
 * Acts as a bridge to the galaxy module
 */
export function toggleBlackHoleEffects() {
    return galaxy.toggleBlackHoleEffects();
}

/**
 * Toggle pause/play state
 * Acts as a bridge to the renderer module
 */
export function togglePause() {
    return renderer.togglePause();
}

/**
 * Toggle UI panel visibility with enhanced transitions
 */
export function toggleUIPanel() {
    const panel = document.getElementById('ui-panel');
    const toggle = document.getElementById('ui-toggle');
    
    if (panel.classList.contains('hidden')) {
        // Show panel with enhanced animation
        panel.classList.remove('hidden');
        toggle.classList.remove('panel-hidden');
        toggle.textContent = '⚙️';
        toggle.title = 'Hide UI Panel (Space)';
        setStatus('UI panel shown - Full galaxy control available');
    } else {
        // Hide panel for full-screen viewing
        panel.classList.add('hidden');
        toggle.classList.add('panel-hidden');
        toggle.textContent = '👁️';
        toggle.title = 'Show UI Panel (Space)';
        setStatus('UI panel hidden - Pure galaxy view (Press \'H\' for shortcuts)');
    }
    
    eventBus.emit('ui-panel-toggled', !panel.classList.contains('hidden'));
}

/**
 * Enhanced keyboard shortcuts with additional galaxy controls
 */
function setupEnhancedKeyboardShortcuts() {
    window.addEventListener('keydown', (event) => {
        // Prevent action if user is typing in an input field
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }
        
        switch (event.code) {
            case 'Space':
                event.preventDefault();
                toggleUIPanel();
                break;
                
            case 'KeyP':
                event.preventDefault();
                togglePause();
                break;
                
            case 'KeyR':
                event.preventDefault();
                randomSeed();
                break;
                
            case 'KeyB':
                event.preventDefault();
                toggleBlackHoleEffects();
                break;
                
            // Enhanced shortcuts for galaxy analysis
            case 'KeyG':
                event.preventDefault();
                toggleGalaxyAnalysisOverlay();
                break;
                
            case 'KeyI':
                event.preventDefault();
                toggleGalaxyInfo();
                break;
                
            case 'KeyH':
                event.preventDefault();
                showKeyboardHelp();
                break;
                
            // Star selection shortcuts
            case 'KeyS':
                event.preventDefault();
                starUI.selectRandomStar();
                break;
                
            case 'KeyT':
                event.preventDefault();
                if (state.getSelectedStar()) {
                    starUI.toggleStarTracking();
                } else {
                    setStatus('No star selected. Press S or click on a star first.');
                }
                break;
                
            case 'Escape':
                event.preventDefault();
                starUI.hideStarInfo();
                break;
                
            // Post-processing effects shortcuts
            case 'KeyE':
                event.preventDefault();
                if (typeof window.togglePostProcessing === 'function') {
                    window.togglePostProcessing();
                } else {
                    console.error('togglePostProcessing is not defined as a global function');
                    setStatus('Error: Post-processing toggle not available');
                }
                break;
                
            case 'KeyA':
                event.preventDefault();
                if (typeof window.toggleAfterimage === 'function') {
                    window.toggleAfterimage();
                } else {
                    console.error('toggleAfterimage is not defined as a global function');
                    setStatus('Error: Afterimage toggle not available');
                }
                break;
                
            // Show black hole info
            case 'KeyJ':
                event.preventDefault();
                showBlackHoleInfo();
                break;
                
            // Number keys for quick favoriting
            case 'Digit1':
            case 'Digit2':
            case 'Digit3':
            case 'Digit4':
            case 'Digit5':
                event.preventDefault();
                const rating = parseInt(event.code.slice(-1));
                setRating(rating);
                break;
        }
    });
}

/**
 * Toggle extended galaxy information display
 */
function toggleGalaxyInfo() {
    const metadataPanel = document.getElementById('galaxy-metadata');
    if (metadataPanel) {
        metadataPanel.style.display = metadataPanel.style.display === 'none' ? 'block' : 'none';
        const action = metadataPanel.style.display === 'none' ? 'hidden' : 'shown';
        setStatus(`Galaxy information ${action}`);
    }
}

/**
 * Show keyboard shortcuts help with camera controls
 */
function showKeyboardHelp() {
    const helpText = [
        '🚀 Galaxy Generator Enhanced Shortcuts:',
        '',
        'Galaxy Controls:',
        '• Space - Toggle UI Panel',
        '• P - Pause/Resume Animation',  
        '• R - Generate Random Galaxy',
        '• B - Toggle Black Holes',
        '• J - Show Black Hole Info',
        '• G - Toggle Galaxy Analysis Overlay',
        '• I - Toggle Galaxy Info',
        '• H - Show This Help',
        '• 1-5 - Quick Star Rating',
        '',
        'Star System Controls:',
        '• S - Select Random Star',
        '• T - Toggle Star Tracking',
        '• Escape - Hide Star Info',
        '• Click - Select Star at Mouse Position',
        '',
        'Effects Controls:',
        '• E - Toggle Post-Processing',
        '• A - Toggle Afterimage Effect',
        '',
        'Camera Controls:',
        '• O - Toggle Auto-Rotation',
        '• M - Toggle Cinematic Mode',
        '• V - Cycle Animation Patterns',
        '',
        'Screenshot Controls:',
        '• Shift + C - Capture Screenshot',
        '• Ctrl + Shift + C - Capture High Resolution Screenshot',
        '• V - Cycle Animation Patterns',
        '',
        'Mouse Controls:',
        '• Left Drag - Rotate Camera',
        '• Right Drag - Pan Camera',
        '• Mouse Wheel - Zoom',
        '• Touch: Single finger (rotate), Pinch (zoom)',
        '',
        'Camera returns to auto mode after 3 seconds of inactivity'
    ].join('\n');
    
    setStatus('Complete keyboard shortcuts and controls logged to console');
    console.log(helpText);
}

/**
 * Set status message with enhanced formatting and auto-clear
 * @param {string} message - Status message to display
 */
export function setStatus(message) {
    const statusElement = document.getElementById('status');
    if (!statusElement) return;
    
    statusElement.textContent = message;
    
    // Enhanced auto-clear logic
    if (message !== DEFAULT_SETTINGS.STATUS_READY && !message.includes('ERROR')) {
        // Longer display time for physics-related messages
        const isPhysicsMessage = message.includes('gravity') || message.includes('rotation') || message.includes('spiral');
        const clearTime = isPhysicsMessage ? 6000 : 4000;
        
        setTimeout(() => {
            if (statusElement.textContent === message) {
                statusElement.textContent = DEFAULT_SETTINGS.STATUS_READY;
            }
        }, clearTime);
    }
    
    eventBus.emit('status-changed', message);
}

/**
 * Initialize enhanced performance monitoring with galaxy-specific metrics
 */
function initializeEnhancedPerformanceMonitoring() {
    // Set up periodic updates for performance stats
    setInterval(updatePerformanceStats, 3000);
}

/**
 * Update performance statistics display
 */
function updatePerformanceStats() {
    const statsElement = document.getElementById('performance-stats');
    if (!statsElement) return;
    
    const particleSystem = state.getParticleSystem();
    const galaxyData = state.getCurrentGalaxyData();
    const renderer = state.getRenderer();
    
    if (!particleSystem || !galaxyData || !renderer) {
        statsElement.innerHTML = '<h5 style="margin: 0 0 8px 0; color: #4CAF50;">Performance</h5><div>Loading enhanced metrics...</div>';
        return;
    }
    
    const fps = state.get('fps') || 0;
    const particleCount = galaxyData.particles.length;
    const galaxyType = galaxyData.metadata.galaxyType || 'Unknown';
    const blackHoles = state.getBlackHoles();
    const physics = state.getCurrentGalaxyPhysics();
    
    // Get stats from renderer
    const rendererInfo = renderer.info || { render: {}, memory: {} };
    const renderStats = rendererInfo.render || {};
    const memoryStats = rendererInfo.memory || {};
    
    statsElement.innerHTML = `
        <h5 style="margin: 0 0 8px 0; color: #4CAF50;">Performance</h5>
        <div>FPS: ${fps}</div>
        <div>Galaxy: ${galaxyType}</div>
        <div>Particles: ${particleCount.toLocaleString()}</div>
        <div>Draw Calls: ${renderStats.calls || 0}</div>
        <div>Memory: ${(memoryStats.geometries || 0) + (memoryStats.textures || 0)} objects</div>
        <div>Black Holes: ${blackHoles.length}</div>
        <div>Spiral Arms: ${physics.armCount}</div>
    `;
    
    eventBus.emit('performance-stats-updated');
}

/**
 * Display detailed galaxy analysis in the analysis overlay
 */
function displayGalaxyAnalysis() {
    const analysis = galaxy.getGalaxyAnalysis();
    if (!analysis) {
        setStatus('No galaxy data available for analysis');
        return;
    }
    
    // Update the physics section
    updatePhysicsSection(analysis);
    
    // Update the populations section
    updatePopulationsSection(analysis);
    
    // Update the structure section
    updateStructureSection(analysis);
    
    // Update the black holes section (new section)
    updateBlackHolesSection();
    
    // Create analysis summary for status
    const summary = `${analysis.basic.type} galaxy: ${analysis.structure.arms} arms, ` +
                   `${analysis.structure.patternSpeed} km/s/kpc pattern speed, ` +
                   `${analysis.populations.youngArm} young arm stars of ${analysis.basic.particles} total`;
    
    setStatus(summary);
}

/**
 * Update physics section of galaxy analysis
 * @param {Object} analysis - Galaxy analysis data
 */
function updatePhysicsSection(analysis) {
    const physicsSection = document.getElementById('analysis-physics');
    if (!physicsSection) return;
    
    physicsSection.innerHTML = `
        <div class="analysis-item">
            <span>Rotation Speed:</span>
            <span>${analysis.physics.maxRotationSpeed} km/s</span>
        </div>
        <div class="analysis-item">
            <span>Pattern Speed:</span>
            <span>${analysis.physics.patternSpeed} km/s/kpc</span>
        </div>
        <div class="analysis-item">
            <span>Arm Pitch:</span>
            <span>${analysis.physics.armPitch.toFixed(2)} radians</span>
        </div>
        <div class="analysis-item">
            <span>Galaxy Radius:</span>
            <span>${analysis.physics.galaxyRadius} kpc</span>
        </div>
    `;
}

/**
 * Update populations section of galaxy analysis
 * @param {Object} analysis - Galaxy analysis data
 */
function updatePopulationsSection(analysis) {
    const popSection = document.getElementById('analysis-populations');
    if (!popSection) return;
    
    const total = analysis.basic.particles;
    popSection.innerHTML = `
        <div class="analysis-item">
            <span>Bulge Stars:</span>
            <span>${analysis.populations.bulge} (${(analysis.populations.bulge/total*100).toFixed(1)}%)</span>
        </div>
        <div class="analysis-item">
            <span>Disk Stars:</span>
            <span>${analysis.populations.disk} (${(analysis.populations.disk/total*100).toFixed(1)}%)</span>
        </div>
        <div class="analysis-item">
            <span>Arm Stars:</span>
            <span>${analysis.populations.youngArm} (${(analysis.populations.youngArm/total*100).toFixed(1)}%)</span>
        </div>
        <div class="analysis-item">
            <span>Halo Stars:</span>
            <span>${analysis.populations.halo} (${(analysis.populations.halo/total*100).toFixed(1)}%)</span>
        </div>
    `;
}

/**
 * Update structure section of galaxy analysis
 * @param {Object} analysis - Galaxy analysis data
 */
function updateStructureSection(analysis) {
    const structureSection = document.getElementById('analysis-structure');
    if (!structureSection) return;
    
    structureSection.innerHTML = `
        <div class="analysis-item">
            <span>Galaxy Type:</span>
            <span>${analysis.basic.type}${analysis.basic.isBarred ? ' (Barred)' : ''}</span>
        </div>
        <div class="analysis-item">
            <span>Spiral Arms:</span>
            <span>${analysis.structure.arms}</span>
        </div>
        <div class="analysis-item">
            <span>Black Holes:</span>
            <span>${analysis.basic.blackHoles}</span>
        </div>
        <div class="analysis-item">
            <span>Seed:</span>
            <span>${analysis.basic.seed}</span>
        </div>
    `;
}

/**
 * Add a new section to display black hole information in detail
 */
function updateBlackHolesSection() {
    // First, check if we need to add a new section
    const analysisContent = document.getElementById('analysis-content');
    if (!analysisContent) return;
    
    // Check if section already exists
    let bhSection = document.getElementById('analysis-blackholes');
    
    // If not, create it
    if (!bhSection) {
        // Create the section
        bhSection = document.createElement('div');
        bhSection.className = 'analysis-section';
        bhSection.innerHTML = `
            <h5>Black Holes</h5>
            <div id="analysis-blackholes-content"></div>
        `;
        analysisContent.appendChild(bhSection);
    }
    
    // Get the content div
    const bhContent = document.getElementById('analysis-blackholes-content');
    if (!bhContent) return;
    
    // Get black holes data
    const blackHoles = state.getBlackHoles();
    
    // Create the content
    if (!blackHoles || blackHoles.length === 0) {
        bhContent.innerHTML = `<div class="analysis-item"><span>No black holes detected in this galaxy</span></div>`;
        return;
    }
    
    // Count types
    const central = blackHoles.filter(bh => Math.sqrt(bh.position.x ** 2 + bh.position.z ** 2) < 0.1);
    const smaller = blackHoles.filter(bh => Math.sqrt(bh.position.x ** 2 + bh.position.z ** 2) >= 0.1);
    
    // Create detailed display
    let html = '';
    
    if (central.length > 0) {
        html += `
            <div class="analysis-item">
                <span>Supermassive Black Holes:</span>
                <span>${central.length}</span>
            </div>
        `;
        
        central.forEach((bh, index) => {
            html += `
                <div class="analysis-item" style="margin-left: 15px; font-size: 11px;">
                    <span>Central #${index} Mass:</span>
                    <span>${bh.mass.toFixed(1)} units</span>
                </div>
            `;
        });
    }
    
    if (smaller.length > 0) {
        html += `
            <div class="analysis-item">
                <span>Stellar Mass Black Holes:</span>
                <span>${smaller.length}</span>
            </div>
        `;
        
        // Group by regions
        const inner = smaller.filter(bh => Math.sqrt(bh.position.x ** 2 + bh.position.z ** 2) < 20);
        const middle = smaller.filter(bh => {
            const dist = Math.sqrt(bh.position.x ** 2 + bh.position.z ** 2);
            return dist >= 20 && dist < 40;
        });
        const outer = smaller.filter(bh => Math.sqrt(bh.position.x ** 2 + bh.position.z ** 2) >= 40);
        
        if (inner.length > 0) {
            html += `
                <div class="analysis-item" style="margin-left: 15px; font-size: 11px;">
                    <span>Inner Region:</span>
                    <span>${inner.length} BH</span>
                </div>
            `;
        }
        
        if (middle.length > 0) {
            html += `
                <div class="analysis-item" style="margin-left: 15px; font-size: 11px;">
                    <span>Middle Region:</span>
                    <span>${middle.length} BH</span>
                </div>
            `;
        }
        
        if (outer.length > 0) {
            html += `
                <div class="analysis-item" style="margin-left: 15px; font-size: 11px;">
                    <span>Outer Region:</span>
                    <span>${outer.length} BH</span>
                </div>
            `;
        }
    }
    
    bhContent.innerHTML = html;
}

// Enhanced Favorites Management

/**
 * Update favorite button with galaxy type information
 */
async function updateFavoriteButton() {
    const currentSeed = state.getCurrentSeed();
    const result = await api.checkFavoriteStatus(currentSeed);
    const btn = document.getElementById('favorite-btn');
    
    if (!btn) return;
    
    if (result && result.isFavorite) {
        btn.textContent = '♥ Remove from Favorites';
        btn.classList.add('favorited');
    } else {
        btn.textContent = '♡ Add to Favorites';
        btn.classList.remove('favorited');
    }
    
    // Add galaxy type to button tooltip
    const galaxyData = state.getCurrentGalaxyData();
    const galaxyType = galaxyData?.metadata?.galaxyType || 'Unknown';
    btn.title = `${galaxyType} galaxy - ${currentSeed}`;
}

/**
 * Toggle favorite with enhanced feedback
 */
export async function toggleFavorite() {
    const nameInput = document.getElementById('favorite-name-input');
    const customName = nameInput.value.trim();
    const currentSeed = state.getCurrentSeed();
    const galaxyData = state.getCurrentGalaxyData();
    
    // Enhanced name suggestion based on galaxy type
    let suggestedName = customName;
    if (!suggestedName && galaxyData?.metadata) {
        const meta = galaxyData.metadata;
        const typePrefix = meta.hasBar ? 'SB' : 'SA';
        const armText = meta.armCount === 2 ? 'Binary' : 
                       meta.armCount === 3 ? 'Triple' : 'Multi';
        suggestedName = `${typePrefix} ${armText} ${currentSeed.slice(0, 6)}`;
    }
    
    const result = await api.toggleFavoriteAPI(currentSeed, suggestedName || currentSeed);
    
    if (result) {
        updateFavoriteButton();
        loadFavorites();
        
        // Enhanced feedback with galaxy type
        const galaxyType = galaxyData?.metadata?.galaxyType || 'Galaxy';
        const action = result.message.includes('Added') ? 'Added' : 'Removed';
        setStatus(`${action} ${galaxyType.toLowerCase()} galaxy to favorites`);
        
        // Clear the name input after adding
        nameInput.value = '';
    }
    
    return result;
}

/**
 * Load and display favorites with enhanced galaxy information
 */
export async function loadFavorites() {
    const result = await api.getAllFavorites();
    const container = document.getElementById('favorites-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (result && result.favorites) {
        result.favorites.forEach(fav => {
            const item = createEnhancedFavoriteElement(fav);
            container.appendChild(item);
        });
        
        // Update favorites counter
        const favCount = result.favorites.length;
        const favoritesTitle = document.querySelector('#favorites-list h4');
        if (favoritesTitle) {
            favoritesTitle.textContent = `✨ Favorites (${favCount})`;
        }
    }
    
    return result;
}

/**
 * Create enhanced DOM element for favorite galaxy with detailed information
 * @param {Object} fav - Favorite galaxy data
 * @returns {HTMLElement} - DOM element for the favorite
 */
function createEnhancedFavoriteElement(fav) {
    const item = document.createElement('div');
    item.className = 'favorite-item';
    
    // Enhanced favorite item with galaxy physics information
    const galaxyType = fav.metadata?.galaxyType || 'Spiral';
    const barredIcon = fav.metadata?.hasBar ? '🌀' : '🌌';
    const armText = `${fav.metadata?.armCount || 2} arms`;
    const rotationSpeed = fav.metadata?.maxRotationSpeed || 220;
    
    // Add the black hole count information
    const blackHoleCount = fav.metadata?.blackHoles || 0;
    const blackHoleText = blackHoleCount > 0 ? 
        `⚫ ${blackHoleCount} black hole${blackHoleCount > 1 ? 's' : ''}` : 
        '';
    
    item.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong>${barredIcon} ${fav.name || fav.seed}</strong>
            <span style="font-size: 11px; color: #4CAF50;">
                ${armText} • ${rotationSpeed}km/s
            </span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 5px;">
            <span style="font-size: 11px; color: #888;">
                ${galaxyType}${fav.metadata?.hasBar ? ' (Barred)' : ''}
            </span>
            <span style="font-size: 11px; color: #888;">
                ${new Date(fav.timestamp).toLocaleDateString()}
            </span>
        </div>
        <div style="text-align: center; margin-top: 5px; font-size: 10px;">
            <span>⭐ Rating: ${fav.rating || 'Unrated'}/5</span>
            <span style="margin-left: 10px;">${blackHoleText}</span>
            <span style="margin-left: ${blackHoleText ? '10px' : '0px'};">🔢 ${(fav.metadata?.totalParticles || 0).toLocaleString()} stars</span>
        </div>
        <div style="margin-top: 3px; font-size: 9px; color: #666; text-align: center;">
            Seed: ${fav.seed}
        </div>
    `;
    
    // Enhanced click handler with loading feedback
    item.addEventListener('click', () => {
        setStatus(`Loading ${galaxyType.toLowerCase()} galaxy...`);
        loadFavoriteGalaxy(fav.seed);
    });
    
    // Enhanced hover effects
    item.addEventListener('mouseenter', () => {
        const bhText = blackHoleCount > 0 ? ` • ${blackHoleCount} black holes` : '';
        setStatus(`${galaxyType} galaxy - Pattern speed: ${fav.metadata?.patternSpeed?.toFixed(1) || 'N/A'} km/s/kpc${bhText}`);
    });
    
    item.addEventListener('mouseleave', () => {
        setStatus(DEFAULT_SETTINGS.STATUS_READY);
    });
    
    return item;
}

/**
 * Load favorite galaxy
 * @param {string} seed - Galaxy seed
 */
function loadFavoriteGalaxy(seed) {
    document.getElementById('seed-input').value = seed;
    generateGalaxy();
}

// Enhanced Rating System

/**
 * Set up rating system
 */
function setupRatingSystem() {
    const stars = document.querySelectorAll('.star');
    stars.forEach(star => {
        star.addEventListener('click', () => {
            const rating = parseInt(star.dataset.rating);
            setRating(rating);
        });
        
        // Enhanced hover effects with galaxy type consideration
        star.addEventListener('mouseenter', () => {
            const rating = parseInt(star.dataset.rating);
            updateStarDisplay(rating);
            
            // Show rating description
            const descriptions = [
                '',
                'Poor - Unrealistic structure',
                'Fair - Some spiral features',
                'Good - Clear spiral arms',
                'Excellent - Beautiful galaxy',
                'Perfect - Spectacular formation'
            ];
            setStatus(descriptions[rating] || '');
        });
    });
    
    // Reset stars and status when mouse leaves rating area
    document.getElementById('rating-stars')?.addEventListener('mouseleave', () => {
        updateStarDisplay(getCurrentRating());
        setStatus(DEFAULT_SETTINGS.STATUS_READY);
    });
}

/**
 * Set rating with enhanced feedback for galaxy quality
 * @param {number} rating - Rating value (1-5)
 */
async function setRating(rating) {
    const currentSeed = state.getCurrentSeed();
    const result = await api.setRatingAPI(currentSeed, rating);
    
    if (result) {
        updateStarDisplay(rating);
        
        // Enhanced feedback based on galaxy type and rating
        const galaxyData = state.getCurrentGalaxyData();
        const galaxyType = galaxyData?.metadata?.galaxyType || 'Galaxy';
        const ratingDescriptions = {
            1: 'Poor structure',
            2: 'Fair formation',
            3: 'Good spiral definition',
            4: 'Excellent galaxy',
            5: 'Perfect spiral structure'
        };
        
        setStatus(`${galaxyType} rated ${rating}/5 stars - ${ratingDescriptions[rating]}`);
        loadFavorites(); // Refresh to show new rating
    }
    
    return result;
}

/**
 * Load rating with enhanced display
 * @param {string} seed - Galaxy seed
 */
export async function loadRatingForSeed(seed) {
    const result = await api.getRating(seed);
    const rating = result && result.rating ? result.rating : 0;
    updateStarDisplay(rating);
    
    // Show rating in metadata if available
    if (rating > 0) {
        const metaContainer = document.getElementById('galaxy-metadata');
        let ratingElement = document.getElementById('meta-rating');
        
        if (!ratingElement && metaContainer) {
            const ratingMeta = document.createElement('div');
            ratingMeta.className = 'metadata-item';
            ratingMeta.innerHTML = `<span>User Rating:</span><span id="meta-rating">${rating}/5 ⭐</span>`;
            metaContainer.appendChild(ratingMeta);
        } else if (ratingElement) {
            ratingElement.textContent = `${rating}/5 ⭐`;
        }
    }
    
    return rating;
}

/**
 * Enhanced star display with smooth animations
 * @param {number} rating - Rating value (1-5)
 */
function updateStarDisplay(rating) {
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('filled');
            // Enhanced visual feedback
            star.style.transform = 'scale(1.1)';
            setTimeout(() => {
                star.style.transform = 'scale(1)';
            }, 150);
        } else {
            star.classList.remove('filled');
        }
    });
}

/**
 * Get current rating from star display
 * @returns {number} - Current rating
 */
function getCurrentRating() {
    return document.querySelectorAll('.star.filled').length;
}

// Event listeners for galaxy data updates
eventBus.on('galaxy-generated', (data) => {
    updateFavoriteButton();
    loadRatingForSeed(data.seed);
    
    // Update galaxy type display if available
    updateGalaxyTypeDisplay(data);
    
    // Update enhanced galaxy metadata
    updateEnhancedGalaxyMetadata(data.galaxyData.metadata);
    
    // Update black hole indicator
    updateBlackHoleIndicator(data.galaxyData.blackHoles);
});

/**
 * Update galaxy type display
 * @param {Object} data - Galaxy data
 */
function updateGalaxyTypeDisplay(data) {
    const galaxyTypeIndicator = document.getElementById('galaxy-type-indicator');
    const blackholeIndicator = document.getElementById('blackhole-indicator');
    
    if (galaxyTypeIndicator && data.galaxyData && data.galaxyData.metadata) {
        const meta = data.galaxyData.metadata;
        const galaxyType = meta.galaxyType || 'Spiral';
        const hasBar = meta.hasBar ? ' (Barred)' : '';
        const armCount = meta.armCount || 2;
        
        // Update galaxy type indicator
        galaxyTypeIndicator.textContent = `${galaxyType}${hasBar} • ${armCount} arms`;
        galaxyTypeIndicator.style.display = 'block';
    }
    
    if (blackholeIndicator) {
        const blackHoleCount = data.galaxyData.blackHoles ? data.galaxyData.blackHoles.length : 0;
        if (blackHoleCount > 0) {
            updateBlackHoleIndicator(data.galaxyData.blackHoles);
        } else {
            blackholeIndicator.innerHTML = `
                <div style="font-size: 11px; color: #666;">
                    No black holes in this galaxy
                </div>
            `;
            blackholeIndicator.classList.remove('active');
        }
    }
}

/**
 * Enhanced galaxy metadata display with new physics parameters
 * @param {Object} metadata - Galaxy metadata from server
 */
function updateEnhancedGalaxyMetadata(metadata) {
    if (!metadata) return;
    
    // Update existing metadata
    document.getElementById('meta-arms').textContent = metadata.armCount;
    document.getElementById('meta-particles').textContent = metadata.totalParticles.toLocaleString();
    document.getElementById('meta-blackholes').textContent = state.getBlackHoles().length;
    document.getElementById('meta-radius').textContent = metadata.galaxyRadius.toFixed(1) + ' kpc';
    
    // Update theme display with galaxy type
    const galaxyType = metadata.galaxyType || 'Spiral';
    const barredText = metadata.hasBar ? ' (Barred)' : '';
    document.getElementById('meta-theme').textContent = galaxyType + barredText;
    
    // Add new metadata if UI elements exist
    const metaContainer = document.getElementById('galaxy-metadata');
    
    // Check if we need to add new metadata fields
    if (!document.getElementById('meta-pattern-speed')) {
        // Add new metadata fields for enhanced galaxy physics
        const additionalMeta = `
            <div class="metadata-item">
                <span>Pattern Speed:</span>
                <span id="meta-pattern-speed">${metadata.patternSpeed?.toFixed(1) || 'N/A'} km/s/kpc</span>
            </div>
            <div class="metadata-item">
                <span>Max Rotation:</span>
                <span id="meta-max-rotation">${metadata.maxRotationSpeed?.toFixed(0) || 'N/A'} km/s</span>
            </div>
            <div class="metadata-item">
                <span>Arm Pitch:</span>
                <span id="meta-arm-pitch">${metadata.armPitch?.toFixed(2) || 'N/A'} rad</span>
            </div>
            <div class="metadata-item">
                <span>Arm Strength:</span>
                <span id="meta-arm-strength">${metadata.armStrength?.toFixed(1) || 'N/A'}</span>
            </div>
        `;
        metaContainer.insertAdjacentHTML('beforeend', additionalMeta);
    } else {
        // Update existing enhanced metadata
        document.getElementById('meta-pattern-speed').textContent = 
            metadata.patternSpeed?.toFixed(1) + ' km/s/kpc' || 'N/A';
        document.getElementById('meta-max-rotation').textContent = 
            metadata.maxRotationSpeed?.toFixed(0) + ' km/s' || 'N/A';
        document.getElementById('meta-arm-pitch').textContent = 
            metadata.armPitch?.toFixed(2) + ' rad' || 'N/A';
        document.getElementById('meta-arm-strength').textContent = 
            metadata.armStrength?.toFixed(1) || 'N/A';
    }
    
    // Show the metadata panel
    metaContainer.style.display = 'block';
    
    console.log('Enhanced galaxy metadata updated:', metadata);
}

// Export functions needed to be accessed globally
window.generateGalaxy = generateGalaxy;
window.randomSeed = randomSeed;
window.toggleFavorite = toggleFavorite;
window.toggleUIPanel = toggleUIPanel;
window.togglePause = togglePause;
window.toggleBlackHoleEffects = toggleBlackHoleEffects;
window.toggleGalaxyAnalysisOverlay = toggleGalaxyAnalysisOverlay;
window.showBlackHoleInfo = showBlackHoleInfo;