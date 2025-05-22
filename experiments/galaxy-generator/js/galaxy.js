/**
 * Enhanced Galaxy generation and particle system management
 * Refactored to use ES Modules and the event system
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js';
import eventBus from './events.js';
import * as state from './state.js';
import { STATUS_MESSAGES } from './config.js';
import { createGalaxyShaderMaterial } from './shaders.js';

/**
 * Initialize galaxy physics parameters
 * @returns {Object} The initialized galaxy physics parameters
 */
export function initializeGalaxyPhysics() {
    // Get current physics or initialize if not set
    const physics = state.getCurrentGalaxyPhysics();
    
    if (!physics || Object.keys(physics).length === 0) {
        const defaultPhysics = {
            patternSpeed: 25.0,
            armPitch: 0.25,
            armCount: 2,
            armStrength: 1.0,
            maxRotationSpeed: 220.0,
            galaxyRadius: 50.0,
            differentialRotation: true
        };
        
        state.setCurrentGalaxyPhysics(defaultPhysics);
        console.log('✅ Galaxy physics initialized with default values');
        eventBus.emit('galaxy-physics-initialized', defaultPhysics);
        return defaultPhysics;
    }
    
    return physics;
}

/**
 * Generate a random seed string
 * @returns {string} - Random alphanumeric seed
 */
export function generateRandomSeed() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
}

/**
 * Generate galaxy with a random seed
 * @returns {Promise<Object|null>} Generated galaxy data or null on error
 */
export async function randomSeed() {
    const randomSeed = generateRandomSeed();
    return await generateGalaxy(randomSeed);
}

/**
 * Generate galaxy based on current seed input
 * Enhanced to include realistic galaxy physics
 * @param {string} seed - The seed to use for generation
 * @returns {Promise<Object|null>} Generated galaxy data or null on error
 */
export async function generateGalaxy(seed) {
    // Initialize galaxy physics if not already done
    initializeGalaxyPhysics();
    
    // Update state with current seed
    state.setCurrentSeed(seed);
    
    // Update UI with current seed
    document.getElementById('current-seed').textContent = seed;
    document.getElementById('seed-input').value = seed;
    
    // Clear the favorite name input when generating a new galaxy
    document.getElementById('favorite-name-input').value = '';
    
    // Show loading state
    document.getElementById('ui-panel').classList.add('loading');
    eventBus.emit('status-update', STATUS_MESSAGES.GENERATING);
    
    try {
        // Get API base URL from state
        const apiBaseUrl = state.getApiBaseUrl();
        if (!apiBaseUrl) {
            throw new Error('API base URL not set. Make sure server configuration is loaded.');
        }
        
        // Fetch enhanced galaxy data from server
        const response = await fetch(`${apiBaseUrl}/galaxy/${seed}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const galaxyData = await response.json();
        
        if (galaxyData) {
            // Store galaxy data in state
            state.setCurrentGalaxyData(galaxyData);
            
            // Extract galaxy physics parameters from server data
            updateGalaxyPhysics(galaxyData.metadata);
            
            // Extract black holes from galaxy data
            state.setBlackHoles(galaxyData.blackHoles || []);
            
            // Create enhanced particle system from server data
            createEnhancedParticleSystem(galaxyData);
            
            // Create black hole visualization
            createBlackHoleSystem();
            
            // Emit event for UI updates
            eventBus.emit('galaxy-generated', { seed, galaxyData });
            
            // Enhanced status message with galaxy type
            const galaxyType = galaxyData.metadata.galaxyType || 'Spiral';
            const barredText = galaxyData.metadata.hasBar ? 'Barred ' : '';
            eventBus.emit('status-update', `${barredText}${galaxyType} galaxy generated: ${galaxyData.particles.length} stars, ${(galaxyData.blackHoles || []).length} black holes`);
        }
        
        return galaxyData;
    } catch (error) {
        console.error('Error generating galaxy:', error);
        eventBus.emit('status-update', STATUS_MESSAGES.ERROR_GENERATE);
        eventBus.emit('error', { type: 'galaxy-generation', error });
        return null;
    } finally {
        document.getElementById('ui-panel').classList.remove('loading');
    }
}

/**
 * Update galaxy physics parameters from server metadata
 * @param {Object} metadata - Galaxy metadata from server
 * @returns {Object} Updated physics parameters
 */
export function updateGalaxyPhysics(metadata) {
    if (!metadata) return state.getCurrentGalaxyPhysics();
    
    const updatedPhysics = {
        patternSpeed: metadata.patternSpeed || 25.0,
        armPitch: metadata.armPitch || 0.25,
        armCount: metadata.armCount || 2,
        armStrength: metadata.armStrength || 1.0,
        maxRotationSpeed: metadata.maxRotationSpeed || 220.0,
        galaxyRadius: metadata.galaxyRadius || 50.0,
        differentialRotation: true
    };
    
    state.setCurrentGalaxyPhysics(updatedPhysics);
    console.log('Updated galaxy physics:', updatedPhysics);
    
    return updatedPhysics;
}

/**
 * Create enhanced Three.js particle system with realistic galaxy physics
 * @param {Object} galaxyData - Galaxy data from server
 * @returns {THREE.Points} The created particle system
 */
export function createEnhancedParticleSystem(galaxyData) {
    const scene = state.getScene();
    if (!scene) {
        console.error('Scene not initialized');
        return null;
    }
    
    // Get existing particle system if any
    let particleSystem = state.getParticleSystem();
    
    // Remove existing particle system if it exists
    if (particleSystem) {
        scene.remove(particleSystem);
        // Dispose of geometry and material to free memory
        particleSystem.geometry.dispose();
        particleSystem.material.dispose();
    }
    
    const particles = galaxyData.particles;
    const particleCount = particles.length;
    
    console.log(`Creating enhanced particle system with ${particleCount} particles`);
    console.log(`Galaxy type: ${galaxyData.metadata.galaxyType}`);
    
    // Create buffer geometry for efficient rendering
    const geometry = new THREE.BufferGeometry();
    
    // Create arrays for particle attributes (enhanced with new properties)
    const positions = new Float32Array(particleCount * 3);      // x, y, z
    const colors = new Float32Array(particleCount * 3);         // r, g, b
    const sizes = new Float32Array(particleCount);              // size
    const brightness = new Float32Array(particleCount);         // brightness
    const velocities = new Float32Array(particleCount * 3);     // velocity for motion
    const oscillations = new Float32Array(particleCount * 3);   // oscillation parameters
    const masses = new Float32Array(particleCount);             // mass for gravity
    const armDensities = new Float32Array(particleCount);       // spiral arm density
    const stellarTypes = new Float32Array(particleCount);       // stellar population type
    
    // Fill arrays with particle data from server
    for (let i = 0; i < particleCount; i++) {
        const particle = particles[i];
        const i3 = i * 3;  // Index for 3-component vectors
        
        // Position coordinates
        positions[i3] = particle.position.x;
        positions[i3 + 1] = particle.position.y;
        positions[i3 + 2] = particle.position.z;
        
        // Convert hex color to RGB values (0-1 range)
        const color = new THREE.Color(particle.color);
        colors[i3] = color.r;
        colors[i3 + 1] = color.g;
        colors[i3 + 2] = color.b;
        
        // Particle properties
        sizes[i] = particle.size;
        brightness[i] = particle.brightness;
        masses[i] = particle.mass || 1.0;
        
        // Enhanced properties for realistic galaxy physics
        armDensities[i] = particle.armDensity || 1.0;  // Spiral arm density enhancement
        
        // Stellar type encoding (for shader differentiation)
        const stellarTypeMap = {
            'bulge': 0.0,
            'disk': 1.0,
            'youngArm': 2.0,  // Young stars in spiral arms
            'halo': 3.0
        };
        stellarTypes[i] = stellarTypeMap[particle.stellarType] || 1.0;
        
        // Velocity for orbital motion (server now calculates differential rotation)
        velocities[i3] = particle.velocity.x;
        velocities[i3 + 1] = particle.velocity.y;
        velocities[i3 + 2] = particle.velocity.z;
        
        // Oscillation parameters for natural movement
        oscillations[i3] = particle.oscillation.amplitude;
        oscillations[i3 + 1] = particle.oscillation.frequency;
        oscillations[i3 + 2] = particle.oscillation.phase;
    }
    
    // Set attributes on the geometry
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('brightness', new THREE.BufferAttribute(brightness, 1));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('oscillation', new THREE.BufferAttribute(oscillations, 3));
    geometry.setAttribute('mass', new THREE.BufferAttribute(masses, 1));
    geometry.setAttribute('armDensity', new THREE.BufferAttribute(armDensities, 1));
    geometry.setAttribute('stellarType', new THREE.BufferAttribute(stellarTypes, 1));
    
    // Create enhanced shader material with galaxy physics
    const material = createGalaxyShaderMaterial(galaxyData);
    
    // Update uniforms with current galaxy data
    updateShaderUniforms(material, galaxyData);
    
    // Create the particle system
    particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);
    
    // Store in state
    state.setParticleSystem(particleSystem);
    
    console.log(`✨ Created enhanced particle system with realistic galaxy physics`);
    const physics = state.getCurrentGalaxyPhysics();
    console.log(`   Spiral arms: ${physics.armCount}, Pattern speed: ${physics.patternSpeed} km/s/kpc`);
    
    eventBus.emit('particle-system-created', particleSystem);
    
    return particleSystem;
}

/**
 * Update shader uniforms with galaxy-specific parameters
 * @param {THREE.ShaderMaterial} material - The shader material
 * @param {Object} galaxyData - Galaxy data containing physics parameters
 */
export function updateShaderUniforms(material, galaxyData) {
    const uniforms = material.uniforms;
    const physics = state.getCurrentGalaxyPhysics();
    
    // Update galaxy physics uniforms
    if (uniforms.patternSpeed) uniforms.patternSpeed.value = physics.patternSpeed;
    if (uniforms.galaxyRadius) uniforms.galaxyRadius.value = physics.galaxyRadius;
    if (uniforms.maxRotationSpeed) uniforms.maxRotationSpeed.value = physics.maxRotationSpeed;
    if (uniforms.armPitch) uniforms.armPitch.value = physics.armPitch;
    if (uniforms.armCount) uniforms.armCount.value = physics.armCount;
    if (uniforms.armStrength) uniforms.armStrength.value = physics.armStrength;
    
    // Update black hole uniforms
    const blackHoles = state.getBlackHoles();
    uniforms.blackHoleCount.value = blackHoles.length;
    uniforms.blackHolePositions.value = getBlackHolePositions();
    uniforms.blackHoleMasses.value = getBlackHoleMasses();
    uniforms.gravitationalStrength.value = state.isBlackHoleEnabled() 
        ? state.getGravitationalStrength() 
        : 0.0;
    uniforms.blackHoleInfluenceRadius.value = state.getBlackHoleInfluenceRadius();
}

/**
 * Calculate spiral arm density enhancement using Lin-Shu density wave theory
 * (Client-side implementation matching server-side calculations)
 * @param {number} radius - Distance from galactic center
 * @param {number} theta - Angle in galactic plane
 * @returns {number} - Density enhancement factor
 */
export function calculateSpiralDensity(radius, theta) {
    const physics = state.getCurrentGalaxyPhysics();
    let totalDensity = 1.0;
    
    // For each spiral arm
    for (let arm = 0; arm < physics.armCount; arm++) {
        const armAngle = (arm * 2 * Math.PI) / physics.armCount;
        
        // Logarithmic spiral equation
        const spiralAngle = physics.armPitch * Math.log(radius / physics.galaxyRadius + 1) + armAngle;
        
        // Calculate angular distance from spiral arm
        let deltaTheta = theta - spiralAngle;
        
        // Normalize angle to [-π, π]
        while (deltaTheta > Math.PI) deltaTheta -= 2 * Math.PI;
        while (deltaTheta < -Math.PI) deltaTheta += 2 * Math.PI;
        
        // Gaussian density enhancement around spiral arm
        const armWidth = 0.3; // radians
        const densityEnhancement = physics.armStrength * 
                                  Math.exp(-(deltaTheta * deltaTheta) / (2 * armWidth * armWidth));
        
        totalDensity += densityEnhancement;
    }
    
    return totalDensity;
}

/**
 * Create visual representation of black holes with enhanced effects
 */
export function createBlackHoleSystem() {
    const scene = state.getScene();
    if (!scene) {
        console.error('Scene not initialized');
        return;
    }
    
    const blackHoles = state.getBlackHoles();
    
    // Remove existing black hole objects
    scene.children.filter(child => child.userData.isBlackHole).forEach(blackHole => {
        scene.remove(blackHole);
        if (blackHole.geometry) blackHole.geometry.dispose();
        if (blackHole.material) blackHole.material.dispose();
    });
    
    blackHoles.forEach((blackHole, index) => {
        // Create enhanced black hole visualization
        const blackHoleGroup = createEnhancedBlackHoleVisualization(blackHole, index);
        scene.add(blackHoleGroup);
    });
    
    console.log(`Created ${blackHoles.length} enhanced black hole visualizations`);
    
    eventBus.emit('black-hole-system-created', blackHoles);
}

/**
 * Create enhanced visual representation of a single black hole
 * @param {Object} blackHole - Black hole data
 * @param {number} index - Black hole index
 * @returns {THREE.Group} - Group containing black hole visualization
 */
export function createEnhancedBlackHoleVisualization(blackHole, index) {
    const group = new THREE.Group();
    group.userData.isBlackHole = true;
    group.userData.index = index;
    
    // Determine if this is a central (supermassive) or stellar mass black hole
    const isCentral = index === 0 && blackHole.mass > 30;
    
    // Visual scale factor to make smaller black holes more visible
    const visualScaleFactor = isCentral ? 1.0 : 2.5;
    
    // Enhanced event horizon visualization (with larger visual size for smaller black holes)
    const sphereGeometry = new THREE.SphereGeometry(blackHole.radius * visualScaleFactor, 32, 16);
    const sphereMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x000000,  // True black for event horizon
        transparent: true,
        opacity: 0.95
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    group.add(sphere);
    
    // Add glow effect using a point light
    const glowIntensity = isCentral ? 1.0 : 0.7;
    const glowColor = isCentral ? 0xff3300 : 0x6633ff; // Different color for smaller black holes
    const glow = new THREE.PointLight(glowColor, glowIntensity, blackHole.radius * 20);
    glow.position.set(0, 0, 0);
    group.add(glow);
    
    // Add accretion disk to all black holes with appropriate scaling
    const diskInnerRadius = blackHole.radius * (isCentral ? 2.0 : 3.0);
    const diskOuterRadius = blackHole.radius * (isCentral ? 6.0 : 8.0);
    const diskGeometry = new THREE.RingGeometry(diskInnerRadius, diskOuterRadius, 32);
    const diskMaterial = new THREE.MeshBasicMaterial({
        color: isCentral ? 0xff4400 : 0x9966ff, // Different color for smaller black holes
        transparent: true,
        opacity: isCentral ? 0.2 : 0.3, // More visible for smaller black holes
        side: THREE.DoubleSide
    });
    const disk = new THREE.Mesh(diskGeometry, diskMaterial);
    disk.rotation.x = Math.PI / 2; // Make it horizontal
    
    // Add subtle tilt for non-central black holes for variety
    if (!isCentral) {
        disk.rotation.y = Math.random() * Math.PI * 0.25; // Random small tilt
        disk.rotation.z = Math.random() * Math.PI * 0.25;
    }
    
    group.add(disk);
    
    // Add a second outer ring for smaller black holes to improve visibility
    if (!isCentral) {
        const outerRingGeometry = new THREE.RingGeometry(
            diskOuterRadius * 1.2, 
            diskOuterRadius * 1.5, 
            32
        );
        const outerRingMaterial = new THREE.MeshBasicMaterial({
            color: 0x3399ff, // Bluish outer ring
            transparent: true,
            opacity: 0.15,
            side: THREE.DoubleSide
        });
        const outerRing = new THREE.Mesh(outerRingGeometry, outerRingMaterial);
        outerRing.rotation.x = Math.PI / 2;
        outerRing.rotation.y = Math.random() * Math.PI * 0.5; // More tilt for the outer ring
        group.add(outerRing);
    }
    
    // Add visual influence sphere to show gravitational reach (only for smaller black holes)
    if (!isCentral) {
        const influenceSphereGeometry = new THREE.SphereGeometry(blackHole.influenceRadius * 0.8, 16, 12);
        const influenceSphereMaterial = new THREE.MeshBasicMaterial({
            color: 0x3366ff,
            transparent: true,
            opacity: 0.03,
            wireframe: true
        });
        // FIX: Correct order of arguments (geometry first, then material)
        const influenceSphere = new THREE.Mesh(influenceSphereGeometry, influenceSphereMaterial);
        group.add(influenceSphere);
    }
    
    // Position the black hole
    group.position.set(blackHole.position.x, blackHole.position.y, blackHole.position.z);
    
    return group;
}

/**
 * Get black hole positions as a flat array for shader uniforms
 * @returns {Float32Array} - Array of black hole positions
 */
export function getBlackHolePositions() {
    const blackHoles = state.getBlackHoles();
    const positions = new Float32Array(Math.max(blackHoles.length * 3, 3));
    
    blackHoles.forEach((blackHole, i) => {
        positions[i * 3] = blackHole.position.x;
        positions[i * 3 + 1] = blackHole.position.y;
        positions[i * 3 + 2] = blackHole.position.z;
    });
    
    return positions;
}

/**
 * Get black hole masses as an array for shader uniforms
 * @returns {Float32Array} - Array of black hole masses
 */
export function getBlackHoleMasses() {
    const blackHoles = state.getBlackHoles();
    const masses = new Float32Array(Math.max(blackHoles.length, 1));
    
    blackHoles.forEach((blackHole, i) => {
        masses[i] = blackHole.mass;
    });
    
    return masses;
}

/**
 * Update black hole effects in the shader with enhanced parameters
 */
export function updateBlackHoleEffects() {
    const particleSystem = state.getParticleSystem();
    if (!particleSystem || !particleSystem.material.uniforms) return;
    
    const uniforms = particleSystem.material.uniforms;
    
    // Update black hole parameters
    uniforms.gravitationalStrength.value = state.isBlackHoleEnabled() 
        ? state.getGravitationalStrength() 
        : 0.0;
    uniforms.blackHoleInfluenceRadius.value = state.getBlackHoleInfluenceRadius();
    uniforms.blackHoleCount.value = state.isBlackHoleEnabled() 
        ? state.getBlackHoles().length 
        : 0;
    uniforms.blackHolePositions.value = getBlackHolePositions();
    uniforms.blackHoleMasses.value = getBlackHoleMasses();
    
    eventBus.emit('black-hole-effects-updated');
}

/**
 * Toggle black hole effects on/off
 */
export function toggleBlackHoleEffects() {
    const enabled = !state.isBlackHoleEnabled();
    state.setBlackHoleEnabled(enabled);
    
    const scene = state.getScene();
    if (scene) {
        // Toggle visibility of black hole visualizations
        scene.children
            .filter(child => child.userData.isBlackHole)
            .forEach(blackHole => {
                blackHole.visible = enabled;
            });
    }
    
    // Update shader uniforms
    updateBlackHoleEffects();
    
    eventBus.emit('status-update', `Black hole effects ${enabled ? 'enabled' : 'disabled'}`);
    return enabled;
}

/**
 * Update gravitational strength with enhanced feedback
 * @param {number} strength - New gravitational strength value
 */
export function updateGravitationalStrength(strength) {
    state.setGravitationalStrength(strength);
    updateBlackHoleEffects();
    
    // Visual feedback for strength changes
    if (strength > 2.0) {
        eventBus.emit('status-update', 'High gravitational strength - strong black hole effects');
    } else if (strength < 0.5) {
        eventBus.emit('status-update', 'Low gravitational strength - subtle black hole effects');
    }
    
    return strength;
}

/**
 * Update black hole influence radius with enhanced feedback
 * @param {number} radius - New influence radius value
 */
export function updateBlackHoleInfluenceRadius(radius) {
    state.setBlackHoleInfluenceRadius(radius);
    updateBlackHoleEffects();
    
    // Visual feedback for radius changes
    const physics = state.getCurrentGalaxyPhysics();
    const radiusPercent = (radius / physics.galaxyRadius * 100).toFixed(1);
    eventBus.emit('status-update', `Black hole influence: ${radius} units (${radiusPercent}% of galaxy)`);
    
    return radius;
}

/**
 * Get detailed information about current galaxy for debugging/analysis
 * @returns {Object} - Comprehensive galaxy information
 */
export function getGalaxyAnalysis() {
    const galaxyData = state.getCurrentGalaxyData();
    const physics = state.getCurrentGalaxyPhysics();
    const seed = state.getCurrentSeed();
    const blackHoles = state.getBlackHoles();
    
    if (!galaxyData) return null;
    
    // Count particles by type
    const bulgeCount = galaxyData.particles.filter(p => p.stellarType === 'bulge').length;
    const diskCount = galaxyData.particles.filter(p => p.stellarType === 'disk').length;
    const youngArmCount = galaxyData.particles.filter(p => p.stellarType === 'youngArm').length;
    const haloCount = galaxyData.particles.filter(p => p.stellarType === 'halo').length;
    
    return {
        basic: {
            seed,
            type: galaxyData.metadata.galaxyType,
            isBarred: galaxyData.metadata.hasBar,
            particles: galaxyData.particles.length,
            blackHoles: blackHoles.length
        },
        physics,
        structure: {
            arms: physics.armCount,
            patternSpeed: physics.patternSpeed,
            armPitch: physics.armPitch,
            maxRotation: physics.maxRotationSpeed
        },
        populations: {
            bulge: bulgeCount,
            disk: diskCount,
            youngArm: youngArmCount,
            halo: haloCount
        }
    };
}

// Set up event listeners
eventBus.on('galaxy-physics-requested', initializeGalaxyPhysics);
eventBus.on('random-seed-requested', randomSeed);
eventBus.on('black-hole-effects-toggle-requested', toggleBlackHoleEffects);