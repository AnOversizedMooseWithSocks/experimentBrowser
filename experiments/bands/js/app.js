// Main application entry point
// This file coordinates all the modules and initializes the simulation

import { PhysicsEngine } from './engine/PhysicsEngine.js';
import { Renderer } from './rendering/Renderer.js';
import { WigglyBand } from './entities/WigglyBand.js';
import { AudioManager } from './audio/AudioManager.js';
import { Controls } from './ui/Controls.js';
import { EventBus } from './utils/EventBus.js';

// Global application state
const app = {
    engine: null,
    renderer: null,
    audioManager: null,
    controls: null,
    eventBus: null,
    bands: [],
    tethers: [], // Store tether connections
    physicsEnabled: true,
    animationId: null,
    mergeChance: 0.5, // 50% chance to merge on collision
    harmonizeChance: 0.7, // 70% chance for harmonization effects (independent of merge)
    collisionSoundsEnabled: true,
    mergeCount: 0, // Track number of merges
    baselineSoundFade: 2000, // Baseline fade duration in ms (default 2 seconds)
    harmonizeBehavior: 'random', // 'random', 'merge', 'rings', 'tether', 'oscillate'
    mergeMode: 'all', // 'all', 'harmonize', 'non-harmonize' - controls when merges happen
    // Interaction rules for charge-based forces
    // Values: -1 = attraction, 0 = neutral, 1 = repulsion
    interactionRules: {
        negativeToPositive: -1,  // Attraction (negative value)
        positiveToPositive: 1,   // Repulsion (positive value)
        negativeToNegative: 0    // Neutral (zero value)
    },
    fieldStrengthSliderValue: 50,  // Slider value 0-100
    fieldStrengthMultiplier: 0.05,  // Actual multiplier (50/1000 = 0.05)
    speedLimit: 5.0, // Maximum velocity magnitude (increased back to 5.0)
    fieldTrailsEnabled: true, // Whether to show field point trails (enabled by default)
    fieldTrailDuration: 2.0 // Duration of field trails in seconds (0.5 to 5)
};

// Initialize the application
async function init() {
    console.log('Initializing Wiggly Band Simulation...');
    
    // Create event bus for communication between modules
    app.eventBus = new EventBus();
    
    // Get canvas element
    const canvas = document.getElementById('canvas');
    app.canvas = canvas; // Store reference for boundary checking
    
    // Initialize physics engine
    app.engine = new PhysicsEngine(canvas.width, canvas.height);
    
    // Initialize renderer
    app.renderer = new Renderer(canvas);
    app.renderer.setFieldTrailsEnabled(app.fieldTrailsEnabled); // Enable field trails
    
    // Initialize audio manager
    app.audioManager = new AudioManager();
    
    // Initialize controls
    app.controls = new Controls(app.eventBus);
    
    // Set up event listeners
    setupEventListeners();
    
    // Set up collision detection
    setupCollisionDetection();
    
    // Start the animation loop
    startAnimation();
    
    console.log('Simulation initialized successfully!');
    console.log('Default interaction rules:', app.interactionRules);
    console.log('Field Strength Slider:', app.fieldStrengthSliderValue);
    console.log('Tips: 1) Bands need to be close to interact');
    console.log('      2) Try Field Strength = 50-100 for stronger effects');
    console.log('      3) Toggle Field Points to see interaction zones');
    console.log('      4) Harmonizing bands randomly choose special behaviors');
}

// Check if two frequencies harmonize (simple integer ratios)
function areFrequenciesHarmonious(freq1, freq2) {
    // Common harmonious frequency ratios
    const harmonicRatios = [
        { ratio: 2/1, tolerance: 0.03, name: 'octave' },
        { ratio: 3/2, tolerance: 0.03, name: 'perfect fifth' },
        { ratio: 4/3, tolerance: 0.03, name: 'perfect fourth' },
        { ratio: 5/4, tolerance: 0.03, name: 'major third' },
        { ratio: 6/5, tolerance: 0.03, name: 'minor third' },
        { ratio: 5/3, tolerance: 0.03, name: 'major sixth' },
        { ratio: 8/5, tolerance: 0.03, name: 'minor sixth' }
    ];
    
    // Get the ratio with higher frequency on top
    const ratio = Math.max(freq1, freq2) / Math.min(freq1, freq2);
    
    // Check each harmonic ratio
    for (const harmonic of harmonicRatios) {
        const diff = Math.abs(ratio - harmonic.ratio);
        if (diff < harmonic.tolerance) {
            console.log(`Harmonic match found: ${harmonic.name} (ratio: ${ratio.toFixed(3)})`);
            return true;
        }
        // Also check the inverse for ratios like 2/3, 3/4, etc.
        const inverseDiff = Math.abs(ratio - 1/harmonic.ratio);
        if (inverseDiff < harmonic.tolerance) {
            console.log(`Harmonic match found: inverse ${harmonic.name} (ratio: ${ratio.toFixed(3)})`);
            return true;
        }
    }
    
    return false;
}

// Set up collision detection using Matter.js events
function setupCollisionDetection() {
    // Track processed collisions to prevent multiple handling
    const processedCollisions = new Set();
    
    Matter.Events.on(app.engine.engine, 'collisionStart', (event) => {
        const pairs = event.pairs;
        
        pairs.forEach(pair => {
            const bandA = pair.bodyA.wigglyBand;
            const bandB = pair.bodyB.wigglyBand;
            
            // Check if both bodies are bands
            if (bandA && bandB) {
                // Create unique collision ID
                const idA = bandA._rendererId || (bandA._rendererId = Math.random().toString(36).substr(2, 9));
                const idB = bandB._rendererId || (bandB._rendererId = Math.random().toString(36).substr(2, 9));
                const collisionId = [idA, idB].sort().join('-');
                
                // Skip if already processed this frame
                if (processedCollisions.has(collisionId)) return;
                
                processedCollisions.add(collisionId);
                handleBandCollision(bandA, bandB);
                
                // Clear after a short delay
                setTimeout(() => processedCollisions.delete(collisionId), 100);
            }
        });
    });
}

// Handle collision between two bands
function handleBandCollision(bandA, bandB) {
    // Don't process if either band is already in a harmony ring
    if (bandA.isInHarmonyRing || bandB.isInHarmonyRing) {
        return;
    }
    
    // Prevent overlapping bodies that cause glitches
    if (bandA.body && bandB.body) {
        const dx = bandB.position.x - bandA.position.x;
        const dy = bandB.position.y - bandA.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = (bandA.radiusX + bandB.radiusX) * 0.5 + (bandA.radiusY + bandB.radiusY) * 0.5;
        
        // If bands are overlapping too much, separate them slightly
        if (distance < minDistance * 0.7) {
            const separationForce = 0.1;
            const fx = (dx / distance) * separationForce;
            const fy = (dy / distance) * separationForce;
            
            Matter.Body.setPosition(bandA.body, {
                x: bandA.position.x - fx,
                y: bandA.position.y - fy
            });
            Matter.Body.setPosition(bandB.body, {
                x: bandB.position.x + fx,
                y: bandB.position.y + fy
            });
        }
        
        // Limit velocities to prevent explosion
        const maxCollisionSpeed = app.speedLimit * 0.8;
        const velA = bandA.body.velocity;
        const velB = bandB.body.velocity;
        const speedA = Math.sqrt(velA.x * velA.x + velA.y * velA.y);
        const speedB = Math.sqrt(velB.x * velB.x + velB.y * velB.y);
        
        if (speedA > maxCollisionSpeed) {
            const scale = maxCollisionSpeed / speedA;
            Matter.Body.setVelocity(bandA.body, {
                x: velA.x * scale,
                y: velA.y * scale
            });
        }
        if (speedB > maxCollisionSpeed) {
            const scale = maxCollisionSpeed / speedB;
            Matter.Body.setVelocity(bandB.body, {
                x: velB.x * scale,
                y: velB.y * scale
            });
        }
        
        // Gentle velocity damping
        const dampingFactor = 0.98;
        Matter.Body.setVelocity(bandA.body, {
            x: bandA.body.velocity.x * dampingFactor,
            y: bandA.body.velocity.y * dampingFactor
        });
        Matter.Body.setVelocity(bandB.body, {
            x: bandB.body.velocity.x * dampingFactor,
            y: bandB.body.velocity.y * dampingFactor
        });
    }
    
    // Play collision sound if enabled
    if (app.collisionSoundsEnabled) {
        playCollisionSound(bandA, bandB);
    }
    
    // Check if bands harmonize
    const harmonize = areFrequenciesHarmonious(bandA.frequency, bandB.frequency);
    
    // Harmonization effects have their own chance (independent of merge)
    if (harmonize && Math.random() < app.harmonizeChance) {
        // Apply harmonize behavior
        let behavior = app.harmonizeBehavior;
        
        // If random, pick one of the behaviors (including merge)
        if (behavior === 'random') {
            const behaviors = ['rings', 'tether', 'oscillate', 'merge'];
            behavior = behaviors[Math.floor(Math.random() * behaviors.length)];
            console.log(`Random harmonization selected: ${behavior}`);
        }
        
        // Apply the selected behavior
        switch (behavior) {
            case 'rings':
                createHarmonyRing(bandA, bandB);
                return; // Exit early, no merge check
            case 'tether':
                createTether(bandA, bandB);
                return; // Exit early, no merge check
            case 'oscillate':
                createOscillatingBand(bandA, bandB);
                return; // Exit early, no merge check
            case 'merge':
                // Fall through to merge check below
                break;
        }
    }
    
    // Separate merge chance check
    // Check merge mode restrictions
    let canMerge = false;
    switch (app.mergeMode) {
        case 'harmonize':
            canMerge = harmonize;
            break;
        case 'non-harmonize':
            canMerge = !harmonize;
            break;
        case 'all':
        default:
            canMerge = true;
            break;
    }
    
    // Check if bands should merge based on merge chance and mode
    if (canMerge && Math.random() < app.mergeChance) {
        mergeBands(bandA, bandB);
    }
}

// Create harmony ring - bands nest inside each other
function createHarmonyRing(bandA, bandB) {
    // Don't create rings if already at max capacity or in a ring
    if (bandA.harmonyRing && bandA.harmonyRing.length >= 8) return;
    if (bandB.harmonyRing && bandB.harmonyRing.length >= 8) return;
    
    // Determine which band should be outer (larger one)
    const sizeA = (bandA.radiusX + bandA.radiusY) / 2;
    const sizeB = (bandB.radiusX + bandB.radiusY) / 2;
    
    let outerBand, innerBand;
    if (sizeA > sizeB) {
        outerBand = bandA;
        innerBand = bandB;
    } else {
        outerBand = bandB;
        innerBand = bandA;
    }
    
    // Initialize harmony ring if needed
    if (!outerBand.harmonyRing) {
        outerBand.harmonyRing = [outerBand];
        outerBand.isOuterRing = true;
    }
    
    // Add inner band to the ring
    outerBand.harmonyRing.push(innerBand);
    innerBand.isInHarmonyRing = true;
    innerBand.ringParent = outerBand;
    
    // Remove inner band from physics (it will follow outer band)
    app.engine.removeBand(innerBand);
    
    // Resize inner band to fit nicely
    const scaleFactor = 0.7 - (outerBand.harmonyRing.length - 2) * 0.1;
    innerBand.radiusX *= scaleFactor;
    innerBand.radiusY *= scaleFactor;
    innerBand.originalRadiusX *= scaleFactor;
    innerBand.originalRadiusY *= scaleFactor;
    
    // Position inner band at center of outer band
    innerBand.position = { ...outerBand.position };
    
    console.log(`Harmony ring created! Ring size: ${outerBand.harmonyRing.length} bands`);
}

// Create tether between two bands
function createTether(bandA, bandB) {
    // Check if bands can accept more tethers (max 2 each)
    const tethersA = app.tethers.filter(t => t.bandA === bandA || t.bandB === bandA).length;
    const tethersB = app.tethers.filter(t => t.bandA === bandB || t.bandB === bandB).length;
    
    if (tethersA >= 2 || tethersB >= 2) {
        console.log('One of the bands already has maximum tethers');
        return;
    }
    
    // Check if already tethered to each other
    const existingTether = app.tethers.find(t => 
        (t.bandA === bandA && t.bandB === bandB) || 
        (t.bandA === bandB && t.bandB === bandA)
    );
    
    if (existingTether) {
        console.log('Bands are already tethered');
        return;
    }
    
    // Create tether
    const tether = {
        bandA: bandA,
        bandB: bandB,
        restLength: 150, // Natural length of tether
        strength: 0.1 // Visual stretching factor
    };
    
    app.tethers.push(tether);
    console.log(`Tether created between bands! Total tethers: ${app.tethers.length}`);
}

// Create oscillating band from two harmonizing bands
function createOscillatingBand(bandA, bandB) {
    // Store original properties from both bands
    const propsA = bandA.getProperties();
    const propsB = bandB.getProperties();
    
    // Calculate position for merged band (center of mass)
    const totalMass = propsA.mass + propsB.mass;
    const mergedX = (bandA.position.x * propsA.mass + bandB.position.x * propsB.mass) / totalMass;
    const mergedY = (bandA.position.y * propsA.mass + bandB.position.y * propsB.mass) / totalMass;
    
    // Create oscillating band with initial properties from bandA
    const oscillatingBand = new WigglyBand(mergedX, mergedY, propsA);
    
    // Set up oscillation between the two property sets
    oscillatingBand.isOscillating = true;
    oscillatingBand.oscillatePropsA = propsA;
    oscillatingBand.oscillatePropsB = propsB;
    oscillatingBand.oscillateTime = 0;
    oscillatingBand.oscillatePeriod = 3; // 3 seconds per full cycle
    
    // Calculate velocity for merged band (conservation of momentum)
    if (oscillatingBand.body && bandA.body && bandB.body) {
        const vx = (bandA.body.velocity.x * propsA.mass + bandB.body.velocity.x * propsB.mass) / totalMass;
        const vy = (bandA.body.velocity.y * propsA.mass + bandB.body.velocity.y * propsB.mass) / totalMass;
        
        // Ensure minimum velocity
        const speed = Math.sqrt(vx * vx + vy * vy);
        if (speed < 0.5) {
            const angle = Math.random() * Math.PI * 2;
            Matter.Body.setVelocity(oscillatingBand.body, { 
                x: Math.cos(angle) * 0.5, 
                y: Math.sin(angle) * 0.5 
            });
        } else {
            Matter.Body.setVelocity(oscillatingBand.body, { x: vx, y: vy });
        }
    }
    
    // Remove original bands
    removeBand(bandA);
    removeBand(bandB);
    
    // Add oscillating band
    app.engine.addBand(oscillatingBand);
    app.bands.push(oscillatingBand);
    
    // Update merge count
    app.mergeCount++;
    document.getElementById('mergeCount').textContent = app.mergeCount;
    
    // Update band count
    updateBandCount();
    
    console.log('Oscillating band created!');
}

// Play a collision sound based on the bands' frequencies
function playCollisionSound(bandA, bandB) {
    // Get all frequencies involved (including harmony ring members)
    const frequencies = [];
    const sizes = [];
    
    if (bandA.harmonyRing) {
        bandA.harmonyRing.forEach(band => {
            frequencies.push(band.frequency);
            sizes.push((band.radiusX + band.radiusY) / 2);
        });
    } else {
        frequencies.push(bandA.frequency);
        sizes.push((bandA.radiusX + bandA.radiusY) / 2);
    }
    
    if (bandB.harmonyRing) {
        bandB.harmonyRing.forEach(band => {
            frequencies.push(band.frequency);
            sizes.push((band.radiusX + band.radiusY) / 2);
        });
    } else {
        frequencies.push(bandB.frequency);
        sizes.push((bandB.radiusX + bandB.radiusY) / 2);
    }
    
    // Also check for tethered bands
    const tetheredToA = app.tethers
        .filter(t => t.bandA === bandA || t.bandB === bandA)
        .map(t => t.bandA === bandA ? t.bandB : t.bandA);
    
    const tetheredToB = app.tethers
        .filter(t => t.bandA === bandB || t.bandB === bandB)
        .map(t => t.bandA === bandB ? t.bandB : t.bandA);
    
    tetheredToA.forEach(band => {
        if (!frequencies.includes(band.frequency)) {
            frequencies.push(band.frequency);
            sizes.push((band.radiusX + band.radiusY) / 2);
        }
    });
    
    tetheredToB.forEach(band => {
        if (!frequencies.includes(band.frequency)) {
            frequencies.push(band.frequency);
            sizes.push((band.radiusX + band.radiusY) / 2);
        }
    });
    
    // Play all frequencies with size-based duration
    frequencies.forEach((freq, index) => {
        // Calculate fade duration based on band size
        // Base size ~40 gets baseline fade, larger bands get longer fade
        const size = sizes[index];
        const sizeMultiplier = size / 40; // Normalize around typical band size
        const fadeDuration = app.baselineSoundFade * sizeMultiplier;
        
        // Calculate initial volume based on band sizes
        const volumeFactor = Math.min(size / 60, 1);
        const initialVolume = 0.05 + (volumeFactor * 0.1);
        
        app.audioManager.playCollisionSound(freq, fadeDuration, initialVolume);
    });
}

// Check if two sets of properties are similar (small delta)
function arePropertiesSimilar(propsA, propsB) {
    // Define thresholds for what constitutes "similar"
    const thresholds = {
        frequency: 50,      // Hz
        amplitude: 3,       // amplitude units
        phaseOffset: 0.5,   // radians
        charge: 0.5,        // charge units
        elasticity: 0.05,   // elasticity units
        radiusX: 5,         // pixels
        radiusY: 5          // pixels
    };
    
    // Check if all deltas are below thresholds
    for (const prop in thresholds) {
        const delta = Math.abs(propsA[prop] - propsB[prop]);
        if (delta > thresholds[prop]) {
            return false; // Not similar
        }
    }
    
    return true; // All properties are similar
}

// Merge two bands together
function mergeBands(bandA, bandB) {
    // Get properties of both bands
    const propsA = bandA.getProperties();
    const propsB = bandB.getProperties();
    
    // Check if properties are similar for additive merge
    const similar = arePropertiesSimilar(propsA, propsB);
    
    let mergedProps;
    let createDelta = false;
    
    if (similar) {
        // Additive merge - sum all properties
        console.log('Similar bands detected - using additive merge');
        mergedProps = {
            frequency: propsA.frequency + propsB.frequency,
            amplitude: propsA.amplitude + propsB.amplitude,
            phaseOffset: propsA.phaseOffset + propsB.phaseOffset,
            charge: propsA.charge + propsB.charge,
            elasticity: propsA.elasticity + propsB.elasticity,
            radiusX: propsA.radiusX + propsB.radiusX,
            radiusY: propsA.radiusY + propsB.radiusY,
            mass: propsA.mass + propsB.mass
        };
        
        // Apply some reasonable limits to prevent bands from becoming too extreme
        mergedProps.frequency = Math.min(Math.max(mergedProps.frequency, 100), 2000);
        mergedProps.amplitude = Math.min(mergedProps.amplitude, 50);
        mergedProps.elasticity = Math.min(mergedProps.elasticity, 0.5);
        mergedProps.radiusX = Math.min(mergedProps.radiusX, 90); // Reduced from 100
        mergedProps.radiusY = Math.min(mergedProps.radiusY, 70); // Reduced from 80
    } else {
        // Average merge - but preserve total mass for conservation
        console.log('Different bands detected - using averaging merge with conservation');
        
        // Calculate total mass before merge
        const totalMass = propsA.mass + propsB.mass;
        
        // Average most properties
        mergedProps = {
            frequency: (propsA.frequency + propsB.frequency) / 2,
            amplitude: (propsA.amplitude + propsB.amplitude) / 2,
            phaseOffset: (propsA.phaseOffset + propsB.phaseOffset) / 2,
            charge: (propsA.charge + propsB.charge) / 2,
            elasticity: (propsA.elasticity + propsB.elasticity) / 2,
            radiusX: (propsA.radiusX + propsB.radiusX) / 2,
            radiusY: (propsA.radiusY + propsB.radiusY) / 2,
            mass: totalMass * 0.7 // Merged band gets 70% of total mass
        };
        
        createDelta = true; // Always create delta for conservation
    }
    
    // Calculate position for merged band (center of mass)
    const totalMass = propsA.mass + propsB.mass;
    const mergedX = (bandA.position.x * propsA.mass + bandB.position.x * propsB.mass) / totalMass;
    const mergedY = (bandA.position.y * propsA.mass + bandB.position.y * propsB.mass) / totalMass;
    
    // Create merged band
    const mergedBand = new WigglyBand(mergedX, mergedY, mergedProps);
    
    // Calculate velocity for merged band (conservation of momentum)
    if (mergedBand.body && bandA.body && bandB.body) {
        const vx = (bandA.body.velocity.x * propsA.mass + bandB.body.velocity.x * propsB.mass) / totalMass;
        const vy = (bandA.body.velocity.y * propsA.mass + bandB.body.velocity.y * propsB.mass) / totalMass;
        
        // Ensure minimum velocity
        const speed = Math.sqrt(vx * vx + vy * vy);
        if (speed < 0.5) {
            const angle = Math.random() * Math.PI * 2;
            Matter.Body.setVelocity(mergedBand.body, { 
                x: Math.cos(angle) * 0.5, 
                y: Math.sin(angle) * 0.5 
            });
        } else {
            Matter.Body.setVelocity(mergedBand.body, { x: vx, y: vy });
        }
    }
    
    // Create delta band for conservation of energy
    if (createDelta) {
        // Calculate remaining mass for delta band (30% of total)
        const deltaMass = totalMass * 0.3;
        
        // Calculate delta properties (differences + conservation requirements)
        const deltaProps = {
            frequency: Math.max(Math.abs(propsA.frequency - propsB.frequency), 200), // Minimum frequency
            amplitude: Math.max(Math.abs(propsA.amplitude - propsB.amplitude), 10),
            phaseOffset: Math.abs(propsA.phaseOffset - propsB.phaseOffset) || Math.random() * Math.PI,
            charge: Math.abs(propsA.charge - propsB.charge) || 1, // Ensure non-zero charge
            elasticity: Math.max(Math.abs(propsA.elasticity - propsB.elasticity), 0.1),
            mass: deltaMass,
            // Size based on mass conservation - larger to better preserve energy
            radiusX: Math.max(30, Math.sqrt(deltaMass * 100) * 0.8), // Increased sizing
            radiusY: Math.max(25, Math.sqrt(deltaMass * 100) * 0.6)  // Increased sizing
        };
        
        // Only create delta band if it meets minimum size requirements
        const minTotalRadius = 55; // Increased minimum combined radius from 45
        if (deltaProps.radiusX + deltaProps.radiusY >= minTotalRadius) {
            // Position delta band offset from merged band
            const angle = Math.random() * Math.PI * 2;
            const distance = 80; // Reduced from 100
            let deltaX = mergedX + Math.cos(angle) * distance;
            let deltaY = mergedY + Math.sin(angle) * distance;
            
            // Ensure delta band stays within bounds
            const margin = 60;
            deltaX = Math.max(margin, Math.min(app.canvas.width - margin, deltaX));
            deltaY = Math.max(margin, Math.min(app.canvas.height - margin, deltaY));
            
            // Create delta band
            const deltaBand = new WigglyBand(deltaX, deltaY, deltaProps);
            
            // Give delta band velocity away from merged band (but limited)
            if (deltaBand.body) {
                // Velocity based on conservation of momentum
                const deltaVx = Math.cos(angle) * 2.5 + (Math.random() - 0.5) * 1;  // Increased from 2
                const deltaVy = Math.sin(angle) * 2.5 + (Math.random() - 0.5) * 1;  // Increased from 2
                
                // Limit velocity to prevent escaping
                const deltaSpeed = Math.sqrt(deltaVx * deltaVx + deltaVy * deltaVy);
                const maxDeltaSpeed = app.speedLimit * 0.6;  // Increased from 0.5
                
                if (deltaSpeed > maxDeltaSpeed) {
                    const scale = maxDeltaSpeed / deltaSpeed;
                    Matter.Body.setVelocity(deltaBand.body, { x: deltaVx * scale, y: deltaVy * scale });
                } else {
                    Matter.Body.setVelocity(deltaBand.body, { x: deltaVx, y: deltaVy });
                }
            }
            
            // Add delta band to simulation
            app.engine.addBand(deltaBand);
            app.bands.push(deltaBand);
            
            console.log(`Delta band created with mass ${deltaMass.toFixed(2)} for conservation`);
        } else {
            // If delta band would be too small, give the merged band 100% of the mass
            mergedProps.mass = totalMass;
            console.log('Delta band too small, merged band gets full mass');
            
            // Update the merged band's mass
            if (mergedBand.body) {
                Matter.Body.setMass(mergedBand.body, totalMass);
            }
        }
    }
    
    // Remove original bands
    removeBand(bandA);
    removeBand(bandB);
    
    // Add merged band
    app.engine.addBand(mergedBand);
    app.bands.push(mergedBand);
    
    // Update merge count
    app.mergeCount++;
    document.getElementById('mergeCount').textContent = app.mergeCount;
    
    // Update band count
    updateBandCount();
    
    console.log(`Bands merged (${similar ? 'additive' : 'averaging with conservation'})! Total mass conserved: ${totalMass.toFixed(2)}`);
}

// Remove a band from the simulation
function removeBand(band) {
    // Remove from physics engine
    app.engine.removeBand(band);
    
    // Remove from bands array
    const index = app.bands.indexOf(band);
    if (index !== -1) {
        app.bands.splice(index, 1);
    }
    
    // Remove any tethers connected to this band
    app.tethers = app.tethers.filter(t => t.bandA !== band && t.bandB !== band);
    
    // If band was in a harmony ring, handle cleanup
    if (band.isInHarmonyRing && band.ringParent) {
        const ring = band.ringParent.harmonyRing;
        const ringIndex = ring.indexOf(band);
        if (ringIndex !== -1) {
            ring.splice(ringIndex, 1);
        }
    } else if (band.isOuterRing && band.harmonyRing) {
        // Release all inner bands
        band.harmonyRing.forEach((innerBand, index) => {
            if (index > 0) { // Skip the outer band itself
                innerBand.isInHarmonyRing = false;
                innerBand.ringParent = null;
                // Add back to physics with slight offset
                innerBand.position.x += (Math.random() - 0.5) * 50;
                innerBand.position.y += (Math.random() - 0.5) * 50;
                app.engine.addBand(innerBand);
                
                // Give released band some velocity
                if (innerBand.body) {
                    const releaseSpeed = 1.5;
                    const angle = Math.random() * Math.PI * 2;
                    Matter.Body.setVelocity(innerBand.body, {
                        x: Math.cos(angle) * releaseSpeed,
                        y: Math.sin(angle) * releaseSpeed
                    });
                }
            }
        });
        band.harmonyRing = null;
        band.isOuterRing = false;
    }
}

// Set up event listeners for user interactions
function setupEventListeners() {
    const canvas = document.getElementById('canvas');
    
    // Canvas click - add band at position
    canvas.addEventListener('click', (event) => {
        const rect = canvas.getBoundingClientRect();
        let x = event.clientX - rect.left;
        let y = event.clientY - rect.top;
        
        // Ensure band is created with margin from edges
        const margin = 50;
        x = Math.max(margin, Math.min(canvas.width - margin, x));
        y = Math.max(margin, Math.min(canvas.height - margin, y));
        
        app.eventBus.emit('addBand', { x, y });
    });
    
    // Control events
    app.eventBus.on('addBand', (data) => {
        addBandAtPosition(data.x, data.y);
    });
    
    app.eventBus.on('addRandomBand', () => {
        addRandomBand();
    });
    
    app.eventBus.on('clearAll', () => {
        clearAllBands();
    });
    
    app.eventBus.on('togglePhysics', () => {
        togglePhysics();
    });
    
    app.eventBus.on('exportBands', () => {
        exportBands();
    });
    
    app.eventBus.on('playTone', (frequency) => {
        app.audioManager.playTone(frequency);
    });
    
    app.eventBus.on('stopTone', () => {
        app.audioManager.stopTone();
    });
    
    app.eventBus.on('elasticityChanged', (elasticity) => {
        // Update elasticity for all existing bands
        app.bands.forEach(band => {
            band.elasticity = elasticity;
        });
    });
    
    app.eventBus.on('updateInteractionRules', (rules) => {
        updateInteractionRules(rules);
    });
    
    app.eventBus.on('updateFieldStrength', (sliderValue) => {
        app.fieldStrengthSliderValue = sliderValue;
        // Convert slider value (0-100) to actual multiplier (0-0.1)
        app.fieldStrengthMultiplier = sliderValue / 1000;
        console.log('Field strength slider:', sliderValue, 'Actual multiplier:', app.fieldStrengthMultiplier);
    });
    
    app.eventBus.on('toggleFieldPoints', () => {
        app.renderer.toggleFieldPoints();
    });
    
    app.eventBus.on('updateMergeChance', (chance) => {
        app.mergeChance = chance;
        console.log('Merge chance updated to:', (chance * 100).toFixed(0) + '%');
    });
    
    app.eventBus.on('updateHarmonizeChance', (chance) => {
        app.harmonizeChance = chance;
        console.log('Harmonize chance updated to:', (chance * 100).toFixed(0) + '%');
    });
    
    app.eventBus.on('toggleCollisionSounds', (enabled) => {
        app.collisionSoundsEnabled = enabled;
        console.log('Collision sounds', enabled ? 'enabled' : 'disabled');
    });
    
    app.eventBus.on('updateSoundFade', (fade) => {
        app.baselineSoundFade = fade;
        console.log('Baseline sound fade updated to:', fade + 'ms');
    });
    
    app.eventBus.on('toggleBandVisibility', () => {
        app.renderer.toggleBandShapes();
    });
    
    app.eventBus.on('updateHarmonizeBehavior', (behavior) => {
        app.harmonizeBehavior = behavior;
        console.log('Harmonize behavior updated to:', behavior);
    });
    
    app.eventBus.on('updateMergeMode', (mode) => {
        app.mergeMode = mode;
        console.log('Merge mode updated to:', mode);
    });
    
    app.eventBus.on('updateSpeedLimit', (limit) => {
        app.speedLimit = limit;
        console.log('Speed limit updated to:', limit);
    });
    
    app.eventBus.on('toggleFieldTrails', (enabled) => {
        app.fieldTrailsEnabled = enabled;
        app.renderer.setFieldTrailsEnabled(enabled);
        console.log('Field trails', enabled ? 'enabled' : 'disabled');
    });
    
    app.eventBus.on('updateFieldTrailDuration', (duration) => {
        app.fieldTrailDuration = duration;
        app.renderer.setFieldTrailDuration(duration);
        console.log('Field trail duration updated to:', duration + 's');
    });
    
    // Window resize
    window.addEventListener('resize', () => {
        resizeCanvas();
    });
}

// Add a band at specific position
function addBandAtPosition(x, y) {
    const controls = app.controls.getValues();
    
    // Create band with current control values
    const band = new WigglyBand(x, y, {
        radiusX: 40 + Math.random() * 20,
        radiusY: 25 + Math.random() * 15,
        frequency: controls.frequency,
        amplitude: controls.amplitude,
        phaseOffset: controls.phase / 100,
        charge: controls.charge * (Math.random() > 0.5 ? 1 : -1),
        rotation: Math.random() * Math.PI * 2,
        elasticity: controls.elasticity
    });
    
    // Add to physics engine
    app.engine.addBand(band);
    
    // Add to our band list
    app.bands.push(band);
    
    // Give a small random initial velocity to show physics is working
    if (band.body) {
        const initialSpeed = Math.min(2, app.speedLimit * 0.4); // Increased back to 40% of speed limit
        Matter.Body.setVelocity(band.body, {
            x: (Math.random() - 0.5) * 2 * initialSpeed,
            y: (Math.random() - 0.5) * 2 * initialSpeed
        });
    }
    
    // Update UI
    updateBandCount();
    
    console.log(`Band added at (${x.toFixed(0)}, ${y.toFixed(0)}) with charge ${band.charge > 0 ? '+' : '-'}`);
}

// Add a random band
function addRandomBand() {
    const canvas = document.getElementById('canvas');
    
    // Randomize position with margin from edges
    const margin = 100;
    const x = Math.random() * (canvas.width - 2 * margin) + margin;
    const y = Math.random() * (canvas.height - 2 * margin) + margin;
    
    // Randomize all properties
    const randomProps = {
        radiusX: 30 + Math.random() * 40,        // 30-70
        radiusY: 20 + Math.random() * 30,        // 20-50
        frequency: 100 + Math.random() * 1900,   // 100-2000 Hz
        amplitude: 5 + Math.random() * 45,       // 5-50
        phaseOffset: Math.random() * Math.PI * 2, // 0-2π
        charge: (0.1 + Math.random() * 4.9) * (Math.random() > 0.5 ? 1 : -1), // ±0.1 to ±5
        rotation: Math.random() * Math.PI * 2,   // 0-2π
        elasticity: 0.01 + Math.random() * 0.49  // 0.01-0.5 (1%-50%)
    };
    
    // Create band with randomized properties
    const band = new WigglyBand(x, y, randomProps);
    
    // Add to physics engine
    app.engine.addBand(band);
    
    // Add to our band list
    app.bands.push(band);
    
    // Give a small random initial velocity
    if (band.body) {
        const initialSpeed = Math.min(2, app.speedLimit * 0.4);
        Matter.Body.setVelocity(band.body, {
            x: (Math.random() - 0.5) * 2 * initialSpeed,
            y: (Math.random() - 0.5) * 2 * initialSpeed
        });
    }
    
    // Update UI
    updateBandCount();
    
    console.log(`Random band added at (${x.toFixed(0)}, ${y.toFixed(0)}) with:
        Frequency: ${randomProps.frequency.toFixed(0)} Hz
        Amplitude: ${randomProps.amplitude.toFixed(1)}
        Elasticity: ${(randomProps.elasticity * 100).toFixed(1)}%
        Size: ${randomProps.radiusX.toFixed(0)}x${randomProps.radiusY.toFixed(0)}
        Charge: ${randomProps.charge > 0 ? '+' : '-'}${Math.abs(randomProps.charge).toFixed(1)}`);
}

// Clear all bands
function clearAllBands() {
    // Remove from physics engine
    app.bands.forEach(band => {
        app.engine.removeBand(band);
    });
    
    // Clear arrays
    app.bands = [];
    app.tethers = [];
    
    // Reset merge count
    app.mergeCount = 0;
    document.getElementById('mergeCount').textContent = app.mergeCount;
    
    // Update UI
    updateBandCount();
}

// Toggle physics simulation
function togglePhysics() {
    app.physicsEnabled = !app.physicsEnabled;
    document.getElementById('physicsStatus').textContent = app.physicsEnabled ? 'ON' : 'OFF';
    console.log('Physics', app.physicsEnabled ? 'enabled' : 'disabled');
}

// Export band data
function exportBands() {
    const exportData = {
        bands: app.bands.map(band => ({
            position: band.position,
            originalRadiusX: band.originalRadiusX,
            originalRadiusY: band.originalRadiusY,
            radiusX: band.radiusX,
            radiusY: band.radiusY,
            frequency: band.frequency,
            amplitude: band.amplitude,
            phaseOffset: band.phaseOffset,
            charge: band.charge,
            color: band.color,
            rotation: band.rotation,
            elasticity: band.elasticity,
            isOscillating: band.isOscillating,
            oscillatePropsA: band.oscillatePropsA,
            oscillatePropsB: band.oscillatePropsB,
            harmonyRing: band.harmonyRing ? band.harmonyRing.length : 0
        })),
        tethers: app.tethers.map(t => ({
            bandAIndex: app.bands.indexOf(t.bandA),
            bandBIndex: app.bands.indexOf(t.bandB)
        })),
        settings: {
            interactionRules: app.interactionRules,
            fieldStrengthSliderValue: app.fieldStrengthSliderValue,
            fieldStrengthMultiplier: app.fieldStrengthMultiplier,
            mergeChance: app.mergeChance,
            harmonizeChance: app.harmonizeChance,
            mergeCount: app.mergeCount,
            baselineSoundFade: app.baselineSoundFade,
            harmonizeBehavior: app.harmonizeBehavior,
            mergeMode: app.mergeMode,
            speedLimit: app.speedLimit,
            fieldTrailsEnabled: app.fieldTrailsEnabled,
            fieldTrailDuration: app.fieldTrailDuration
        }
    };
    
    // Create download
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'wiggly_bands.json';
    link.click();
    
    URL.revokeObjectURL(url);
}

// Update band count display
function updateBandCount() {
    document.getElementById('bandCount').textContent = app.bands.length;
}

// Update interaction rules
function updateInteractionRules(rules) {
    app.interactionRules = { ...app.interactionRules, ...rules };
    console.log('Updated interaction rules:', app.interactionRules);
}

// Resize canvas to fit window
function resizeCanvas() {
    const container = document.getElementById('container');
    const canvas = document.getElementById('canvas');
    
    canvas.width = container.clientWidth - 40;
    canvas.height = container.clientHeight - 40;
    
    // Update physics engine boundaries
    if (app.engine) {
        app.engine.updateBoundaries(canvas.width, canvas.height);
    }
}

// Animation loop
let lastTime = 0;
let frameCount = 0;

function animate(currentTime = 0) {
    const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
    lastTime = currentTime;
    
    // Update FPS counter
    frameCount++;
    if (frameCount % 60 === 0) {
        const fps = Math.round(1 / deltaTime);
        document.getElementById('fps').textContent = fps;
    }
    
    // Update physics
    if (app.physicsEnabled && deltaTime > 0) {
        // Apply field forces between bands
        for (let i = 0; i < app.bands.length; i++) {
            for (let j = i + 1; j < app.bands.length; j++) {
                const bandA = app.bands[i];
                const bandB = app.bands[j];
                
                // Skip if band is in harmony ring (only outer band interacts)
                if (bandA.isInHarmonyRing || bandB.isInHarmonyRing) {
                    continue;
                }
                
                // Calculate mutual field influences with interaction rules
                const forceOnB = bandA.getFieldInfluenceOn(bandB, app.interactionRules, app.fieldStrengthMultiplier);
                const forceOnA = bandB.getFieldInfluenceOn(bandA, app.interactionRules, app.fieldStrengthMultiplier);
                
                // Apply position forces
                app.engine.applyForce(bandB, forceOnB);
                app.engine.applyForce(bandA, forceOnA);
                
                // Store for debugging
                bandB.lastAppliedForce = forceOnB;
                bandA.lastAppliedForce = forceOnA;
            }
        }
        
        // Update physics engine
        app.engine.update(deltaTime);
        
        // Then update all bands (this includes deformation)
        app.bands.forEach(band => {
            // Check boundaries and enforce speed limit
            if (band.body && !band.isInHarmonyRing) {
                // Get current position
                const pos = band.body.position;
                const vel = band.body.velocity;
                
                // Check if band is out of bounds
                const margin = 50; // How far outside before we teleport
                
                if (pos.x < -margin || pos.x > app.canvas.width + margin || 
                    pos.y < -margin || pos.y > app.canvas.height + margin) {
                    
                    console.log(`Band out of bounds at (${pos.x.toFixed(0)}, ${pos.y.toFixed(0)}), teleporting to center`);
                    
                    // Teleport to near center with some randomness
                    const newX = app.canvas.width / 2 + (Math.random() - 0.5) * 100;
                    const newY = app.canvas.height / 2 + (Math.random() - 0.5) * 100;
                    
                    Matter.Body.setPosition(band.body, { x: newX, y: newY });
                    Matter.Body.setVelocity(band.body, { x: 0, y: 0 });
                }
                
                // Enforce speed limit and apply progressive damping
                const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
                if (speed > app.speedLimit) {
                    const scale = app.speedLimit / speed;
                    Matter.Body.setVelocity(band.body, {
                        x: vel.x * scale,
                        y: vel.y * scale
                    });
                } else if (speed > 0.5) { // Minimum speed threshold
                    // Progressive damping - less damping at lower speeds
                    const speedRatio = speed / app.speedLimit;
                    const dampingFactor = 1 - (0.01 * speedRatio); // Max 1% damping at full speed
                    Matter.Body.setVelocity(band.body, {
                        x: vel.x * dampingFactor,
                        y: vel.y * dampingFactor
                    });
                } else if (speed < 0.2) {
                    // Add tiny random force to keep bands moving
                    const nudge = 0.02;
                    Matter.Body.applyForce(band.body, band.body.position, {
                        x: (Math.random() - 0.5) * nudge,
                        y: (Math.random() - 0.5) * nudge
                    });
                }
                // Between 0.2 and 0.5, no damping or nudging
            }
            
            band.update(deltaTime);
            
            // Update harmony ring positions
            if (band.isOuterRing && band.harmonyRing) {
                band.harmonyRing.forEach((innerBand, index) => {
                    if (index > 0) { // Skip outer band itself
                        innerBand.position.x = band.position.x;
                        innerBand.position.y = band.position.y;
                        innerBand.update(deltaTime);
                    }
                });
            }
        });
    } else {
        // Even if physics is disabled, update band animations and check boundaries
        app.bands.forEach(band => {
            // Still check boundaries even with physics off
            if (band.body && !band.isInHarmonyRing) {
                const pos = band.body.position;
                const margin = 50;
                
                if (pos.x < -margin || pos.x > app.canvas.width + margin || 
                    pos.y < -margin || pos.y > app.canvas.height + margin) {
                    
                    console.log(`Band out of bounds (physics off), teleporting to center`);
                    
                    const newX = app.canvas.width / 2 + (Math.random() - 0.5) * 100;
                    const newY = app.canvas.height / 2 + (Math.random() - 0.5) * 100;
                    
                    Matter.Body.setPosition(band.body, { x: newX, y: newY });
                    Matter.Body.setVelocity(band.body, { x: 0, y: 0 });
                }
            }
            
            band.update(deltaTime);
            
            // Update harmony ring positions
            if (band.isOuterRing && band.harmonyRing) {
                band.harmonyRing.forEach((innerBand, index) => {
                    if (index > 0) {
                        innerBand.position.x = band.position.x;
                        innerBand.position.y = band.position.y;
                        innerBand.update(deltaTime);
                    }
                });
            }
        });
    }
    
    // Render the scene
    app.renderer.clear();
    
    // Render tethers first (behind bands)
    app.renderer.renderTethers(app.tethers);
    
    // Render bands
    app.bands.forEach(band => {
        app.renderer.renderBand(band);
        
        // Also render harmony ring members
        if (band.isOuterRing && band.harmonyRing) {
            band.harmonyRing.forEach((innerBand, index) => {
                if (index > 0) { // Skip outer band itself
                    app.renderer.renderBand(innerBand);
                }
            });
        }
    });
    
    // Continue animation
    app.animationId = requestAnimationFrame(animate);
}

// Start the animation loop
function startAnimation() {
    // Initial canvas resize
    resizeCanvas();
    
    // Start animation
    animate();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}