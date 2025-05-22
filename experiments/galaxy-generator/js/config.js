/**
 * Config file for Galaxy Generator
 * Added new settings for improved post-processing
 */

// File paths and configuration
export const CONFIG_PATH = './config.json';

// Enhanced default settings with galaxy physics
export const DEFAULT_SETTINGS = {
    animation: {
        speed: 0.6,
        zoom: 60,
        glow: 0.6
    },
    galaxy: {
        patternSpeed: 25.0,
        armPitch: 0.25,
        armStrength: 1.0,
        maxRotationSpeed: 220.0
    },
    blackHoles: {
        gravitationalStrength: 1.0,
        influenceRadius: 15.0,
        enabled: true
    },
    // Simplified post-processing defaults without DOF
    postProcessing: {
        enabled: true,
        afterimageEnabled: true,
        afterimageDamp: 0.85
    }
};

// Galaxy type definitions
export const GALAXY_TYPES = {
    'Sa': { description: 'Early-type spiral', armTightness: 'tight', bulgeDominance: 'large' },
    'Sb': { description: 'Intermediate spiral', armTightness: 'medium', bulgeDominance: 'medium' },
    'Sc': { description: 'Late-type spiral', armTightness: 'loose', bulgeDominance: 'small' },
    'SBa': { description: 'Barred early spiral', armTightness: 'tight', bulgeDominance: 'large', hasBar: true },
    'SBb': { description: 'Barred intermediate spiral', armTightness: 'medium', bulgeDominance: 'medium', hasBar: true },
    'SBc': { description: 'Barred late spiral', armTightness: 'loose', bulgeDominance: 'small', hasBar: true }
};

// Stellar population types
export const STELLAR_POPULATIONS = {
    BULGE: {
        name: 'Bulge Stars',
        description: 'Old, red stars in central region',
        ageRange: [10, 13], // Gyr
        colors: ['#ff6644', '#ff8844', '#ffaa66'],
        layer: 0
    },
    DISK: {
        name: 'Disk Stars',
        description: 'Intermediate-age stars in galactic disk',
        ageRange: [2, 8], // Gyr
        colors: ['#ffcc88', '#ffddaa', '#ffeebb'],
        layer: 1
    },
    YOUNG_ARM: {
        name: 'Spiral Arm Stars',
        description: 'Young, blue stars in star-forming regions',
        ageRange: [0.01, 2], // Gyr
        colors: ['#88bbff', '#bbddff', '#ffffff'],
        layer: 2
    },
    HALO: {
        name: 'Halo Stars',
        description: 'Very old stars in outer halo',
        ageRange: [12, 13.5], // Gyr
        colors: ['#bb6633', '#aa5522', '#996644'],
        layer: 3
    }
};

// Enhanced status messages with physics context
export const STATUS_MESSAGES = {
    READY: 'Ready to explore realistic galaxy formation...',
    LOADING: 'Loading enhanced galaxy physics...',
    GENERATING: 'Generating realistic spiral galaxy...',
    ERROR_CONFIG: 'ERROR: Cannot read config.json. Make sure the server is running.',
    ERROR_GENERATE: 'Error generating galaxy. Check server connection.',
    ERROR_INIT: 'Failed to initialize enhanced galaxy generator. Check console for details.',
    
    // Physics-specific messages
    DENSITY_WAVE_ACTIVE: 'Spiral density waves visible - particles flowing through arms',
    DIFFERENTIAL_ROTATION: 'Differential rotation active - realistic galactic dynamics',
    STELLAR_POPULATIONS: 'Multiple stellar populations loaded',
    BLACK_HOLE_PHYSICS: 'Black hole gravitational effects active',
    GALAXY_TYPE_LOADED: 'Galaxy type loaded with realistic parameters',
    
    // Post-processing messages
    AFTERIMAGE_ENABLED: 'Afterimage effect enabled - trail simulation active',
    AFTERIMAGE_DISABLED: 'Afterimage effect disabled'
};

// Performance monitoring configuration
export const PERFORMANCE_CONFIG = {
    updateInterval: 3000,     // Update performance stats every 3 seconds
    fpsHistory: [],          // Store FPS history for averaging
    maxHistoryLength: 30,    // Keep last 30 FPS samples
    enableDetailedStats: true // Show galaxy-specific performance metrics
};

// Enhanced physics constants for realistic galaxy simulation
export const PHYSICS_CONSTANTS = {
    // Galactic scale constants (approximate)
    GALAXY_SCALE: 1.0,           // Scale factor for display (1 unit = 1 kpc)
    ROTATION_SCALE: 0.01,        // Scale rotation speeds for visual effect
    GRAVITATIONAL_SCALE: 0.005,  // Scale black hole effects for stability
    
    // Pattern speed ranges for different galaxy types (km/s/kpc)
    PATTERN_SPEED_RANGES: {
        'Sa': [15, 25],   // Slow pattern speed for tight arms
        'Sb': [20, 30],   // Medium pattern speed
        'Sc': [25, 35],   // Faster pattern speed for open arms
        'SBa': [10, 20],  // Slower for barred galaxies
        'SBb': [15, 25],  
        'SBc': [20, 30]
    },
    
    // Arm pitch angles for realistic spiral structure (radians)
    ARM_PITCH_RANGES: {
        'Sa': [0.15, 0.25], // Tight spiral arms
        'Sb': [0.20, 0.30], // Medium pitch
        'Sc': [0.25, 0.40], // Open spiral arms
        'SBa': [0.15, 0.25],
        'SBb': [0.20, 0.30],
        'SBc': [0.25, 0.35]
    }
};

// Color schemes for different galaxy types
export const GALAXY_COLOR_SCHEMES = {
    'Sa': {
        name: 'Early-type Spiral',
        bulgeColor: '#ff6644',
        diskColor: '#ffcc88',
        armColor: '#88bbff',
        description: 'Red bulge dominant with blue spiral arms'
    },
    'Sb': {
        name: 'Intermediate Spiral',
        bulgeColor: '#ff8844',
        diskColor: '#ffddaa',
        armColor: '#99ccff',
        description: 'Balanced mix of old and young stars'
    },
    'Sc': {
        name: 'Late-type Spiral',
        bulgeColor: '#ffaa66',
        diskColor: '#ffeedd',
        armColor: '#aaddff',
        description: 'Blue disk dominant with prominent arms'
    },
    'SBa': {
        name: 'Barred Early Spiral',
        bulgeColor: '#ff6644',
        diskColor: '#ffcc88',
        armColor: '#88bbff',
        barColor: '#ff9966',
        description: 'Strong central bar with tight arms'
    },
    'SBb': {
        name: 'Barred Intermediate',
        bulgeColor: '#ff8844',
        diskColor: '#ffddaa',
        armColor: '#99ccff',
        barColor: '#ffaa77',
        description: 'Moderate bar with medium arms'
    },
    'SBc': {
        name: 'Barred Late Spiral',
        bulgeColor: '#ffaa66',
        diskColor: '#ffeedd',
        armColor: '#aaddff',
        barColor: '#ffbb88',
        description: 'Weak bar with open spiral arms'
    }
};

// Enhanced UI configuration for improved post-processing
export const UI_CONFIG = {
    panels: {
        metadata: {
            expanded: true,
            showPhysics: true,
            showPopulations: true
        },
        favorites: {
            showGalaxyTypes: true,
            maxDisplayed: 10
        },
        performance: {
            showDetailed: true,
            updateFrequency: 3000
        },
        postProcessing: {
            showControls: true,
            defaultValues: {
                afterimageDamp: 0.85
            }
        }
    },
    notifications: {
        duration: 4000,           // Standard notification duration
        physicsDuration: 6000,    // Longer duration for physics messages
        errorDuration: 8000       // Longest duration for errors
    }
};

// Export configuration object for use in other modules
export const GALAXY_CONFIG = {
    physics: PHYSICS_CONSTANTS,
    types: GALAXY_TYPES,
    populations: STELLAR_POPULATIONS,
    colors: GALAXY_COLOR_SCHEMES,
    ui: UI_CONFIG,
    performance: PERFORMANCE_CONFIG,
    defaults: DEFAULT_SETTINGS
};

// Enhanced debug configuration with post-processing debug
export const DEBUG_CONFIG = {
    enabled: true,
    logGalaxyGeneration: true,
    logPhysicsUpdates: false,     // Set to true for detailed physics logging
    logPerformance: false,        // Set to true for performance debugging
    logPostProcessing: true,      // Log post-processing details
    showWireframes: false,        // Set to true to see particle system wireframes
    visualizeBlackHoleInfluence: false, // Set to true to visualize black hole influence spheres
};

console.log('✅ Enhanced Galaxy Generator configuration loaded with post-processing improvements');
