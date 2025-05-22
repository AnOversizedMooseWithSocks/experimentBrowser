const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const http = require('http');

const app = express();
let PORT = 3002; // Starting port number

// File paths for data and config storage
const DATA_DIR = './data';
const CONFIG_FILE = './config.json'; // Config file in the same directory as HTML
const FAVORITES_FILE = path.join(DATA_DIR, 'favorites.json');
const RATINGS_FILE = path.join(DATA_DIR, 'ratings.json');

// CORS middleware to allow cross-origin requests
app.use((req, res, next) => {
    // Allow requests from any origin during development
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files (your HTML experiment)
app.use(express.static('.'));

/**
 * Check if a port is available by attempting to create a server on it
 * @param {number} port - The port number to test
 * @returns {Promise<boolean>} - True if port is available, false otherwise
 */
function isPortAvailable(port) {
    return new Promise((resolve) => {
        const server = http.createServer();
        
        server.listen(port, () => {
            server.once('close', () => {
                resolve(true);
            });
            server.close();
        });
        
        server.on('error', () => {
            resolve(false);
        });
    });
}

/**
 * Find the next available port starting from the given port number
 * @param {number} startPort - The port to start checking from
 * @returns {Promise<number>} - The first available port number
 */
async function findAvailablePort(startPort) {
    let port = startPort;
    while (!(await isPortAvailable(port))) {
        console.log(`Port ${port} is in use, trying next port...`);
        port++;
        // Prevent infinite loop - stop at port 65535
        if (port > 65535) {
            throw new Error('No available ports found');
        }
    }
    return port;
}

/**
 * Create or update the config file with the current server port
 * @param {number} port - The port number the server is using
 */
async function writeConfigFile(port) {
    try {
        const config = {
            serverPort: port,
            lastUpdated: new Date().toISOString(),
            apiBaseUrl: `http://localhost:${port}/api`
        };
        
        await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
        console.log(`Config file created at ${CONFIG_FILE} with port ${port}`);
    } catch (error) {
        console.error('Error writing config file:', error);
        throw error;
    }
}

// Enhanced seeded random number generator class
class SeededRandom {
    constructor(seed) {
        this.seed = this.hashSeed(seed.toString());
    }
    
    hashSeed(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }
    
    random() {
        this.seed = (this.seed * 16807) % 2147483647;
        return (this.seed - 1) / 2147483646;
    }
    
    // Generate random number in range
    range(min, max) {
        return min + this.random() * (max - min);
    }
    
    // Generate integer in range
    int(min, max) {
        return Math.floor(this.range(min, max + 1));
    }
    
    // Pick random element from array
    choice(array) {
        return array[Math.floor(this.random() * array.length)];
    }
}

/**
 * Generate galaxy data based on seed with realistic spiral structure
 * Now includes density wave theory and differential rotation
 */
function generateGalaxyData(seed) {
    const rng = new SeededRandom(seed);
    
    // Galaxy type determination
    const galaxyTypes = ['Sa', 'Sb', 'Sc', 'SBa', 'SBb', 'SBc']; // Normal and barred spirals
    const galaxyType = rng.choice(galaxyTypes);
    const isBarred = galaxyType.startsWith('SB');
    const spiralClass = galaxyType.charAt(galaxyType.length - 1);
    
    // Basic galaxy parameters
    const armCount = rng.int(2, 4); // 2-4 spiral arms
    const totalParticles = rng.int(10000, 20000); // Increased for better density waves
    const galaxyRadius = rng.range(40, 80); // kpc equivalent
    const diskHeight = galaxyRadius * 0.1; // Thin disk
    
    // Density wave parameters (core of the enhancement)
    const patternSpeed = rng.range(15, 35); // km/s/kpc (angular frequency of spiral pattern)
    const armPitch = rng.range(0.15, 0.4); // radians per scale length (tightness of spiral)
    const armStrength = rng.range(0.5, 1.5); // how pronounced the spiral arms are
    
    // Differential rotation parameters
    const maxRotationSpeed = rng.range(200, 280); // km/s maximum rotation
    const coreRadius = galaxyRadius * rng.range(0.05, 0.15); // solid body rotation region
    const flatRadius = galaxyRadius * rng.range(0.5, 0.8); // where rotation curve flattens
    
    // Bar parameters (for barred galaxies)
    let barParams = { hasBar: false };
    if (isBarred) {
        barParams = {
            hasBar: true,
            barLength: galaxyRadius * rng.range(0.2, 0.4),
            barWidth: galaxyRadius * rng.range(0.08, 0.15),
            barAngle: rng.random() * Math.PI,
            barStrength: rng.range(0.3, 0.7),
            barEccentricity: rng.range(0.5, 0.8)
        };
    }
    
    // Black hole generation (enhanced for galaxy type)
    const blackHoleCount = spiralClass === 'a' ? rng.int(1, 2) : rng.int(0, 1);
    const blackHoles = [];
    
    // Central supermassive black hole (more likely in early-type spirals)
    if (blackHoleCount > 0) {
        blackHoles.push({
            position: { x: 0, y: 0, z: 0 },
            mass: rng.range(10, 50), // Central SMBH
            radius: rng.range(0.1, 0.3),
            influenceRadius: coreRadius,
            rotationSpeed: rng.range(1.0, 3.0),
            index: 0
        });
    }

    // Generate rare smaller black holes throughout the galaxy
    const smallerBlackHoleChance = 0.4; // Increased from 0.25 to 0.4 for more common smaller black holes
    if (rng.random() < smallerBlackHoleChance) {
        // Determine how many smaller black holes to generate (2-5) - increased from (1-4)
        const smallerBlackHoleCount = rng.int(2, 5);
        
        for (let i = 0; i < smallerBlackHoleCount; i++) {
            // Position within the galaxy disk but not at the center
            let validPosition = false;
            let position, distance, angle, height, spiralDensity;
            
            // Try to find a position not in a dense spiral arm
            for (let attempt = 0; attempt < 10; attempt++) {
                distance = rng.range(galaxyRadius * 0.2, galaxyRadius * 0.9); // 20-90% of galaxy radius
                angle = rng.random() * Math.PI * 2; // Random angle
                height = rng.range(-diskHeight * 0.7, diskHeight * 0.7); // Random height within disk
                
                // Check if this position is in a spiral arm
                spiralDensity = calculateSpiralDensity(distance, angle, armCount, armPitch, armStrength);
                
                // If density is low enough, this is not in a dense arm
                if (spiralDensity < 1.3) {
                    validPosition = true;
                    break;
                }
            }
            
            // Convert polar to cartesian coordinates
            position = {
                x: distance * Math.cos(angle),
                y: height,
                z: distance * Math.sin(angle)
            };
            
            // Smaller mass and radius than central black hole, but slightly increased for visibility
            const mass = rng.range(3, 10); // Increased from (2, 8) for more visibility
            const radius = rng.range(0.08, 0.18); // Increased from (0.04, 0.12) for more visibility
            const influenceRadius = radius * 25; // Increased from radius * 15 for more visibility
            
            blackHoles.push({
                position,
                mass,
                radius,
                influenceRadius,
                rotationSpeed: rng.range(0.5, 2.0),
                index: blackHoles.length // Index based on position in array
            });
        }
    }
    
    // Color themes based on galaxy type and stellar populations
    const colorThemes = {
        // Early-type spirals (Sa, SBa) - redder, older stars dominate
        'Sa': {
            bulge: [0xff6644, 0xff8844, 0xffaa66],
            arms: [0x88bbff, 0xbbddff, 0xffffff],
            disk: [0xffcc88, 0xffddaa, 0xffeebb],
            halo: [0xbb6633, 0xaa5522, 0x996644]
        },
        'SBa': {
            bulge: [0xff6644, 0xff8844, 0xffaa66],
            arms: [0x88bbff, 0xbbddff, 0xffffff],
            disk: [0xffcc88, 0xffddaa, 0xffeebb],
            halo: [0xbb6633, 0xaa5522, 0x996644]
        },
        // Late-type spirals (Sc, SBc) - bluer, younger stars prominent
        'Sc': {
            bulge: [0xffaa66, 0xffcc88, 0xffeebb],
            arms: [0x66aaff, 0x88ccff, 0xaaddff],
            disk: [0xddddff, 0xeeeeff, 0xffffff],
            halo: [0x888899, 0x9999aa, 0xaaaacc]
        },
        'SBc': {
            bulge: [0xffaa66, 0xffcc88, 0xffeebb],
            arms: [0x66aaff, 0x88ccff, 0xaaddff],
            disk: [0xddddff, 0xeeeeff, 0xffffff],
            halo: [0x888899, 0x9999aa, 0xaaaacc]
        },
        // Intermediate types (Sb, SBb)
        'Sb': {
            bulge: [0xff8844, 0xffaa66, 0xffcc88],
            arms: [0x77bbff, 0x99ccff, 0xbbddff],
            disk: [0xffddbb, 0xffeedd, 0xffffeee],
            halo: [0x997755, 0xaa8866, 0xbb9977]
        },
        'SBb': {
            bulge: [0xff8844, 0xffaa66, 0xffcc88],
            arms: [0x77bbff, 0x99ccff, 0xbbddff],
            disk: [0xffddbb, 0xffeedd, 0xffffeee],
            halo: [0x997755, 0xaa8866, 0xbb9977]
        }
    };
    
    const theme = colorThemes[galaxyType];
    
    // Generate particles with realistic stellar populations
    const particles = [];
    
    for (let i = 0; i < totalParticles; i++) {
        let particle;
        let attempts = 0;
        const maxAttempts = 10;
        
        // Generate particle position and determine stellar population
        do {
            particle = generateRealisticParticle(rng, {
                galaxyRadius,
                diskHeight,
                coreRadius,
                armCount,
                patternSpeed,
                armPitch,
                armStrength,
                maxRotationSpeed,
                flatRadius,
                theme,
                barParams,
                galaxyType
            });
            attempts++;
        } while (attempts < maxAttempts && isParticleTooCloseToBlackHole(particle, blackHoles));
        
        particles.push(particle);
    }
    
    // Sort particles by layer for proper rendering order (bulge -> disk -> arms -> halo)
    particles.sort((a, b) => a.layer - b.layer);
    
    return {
        seed,
        particles,
        blackHoles,
        metadata: {
            galaxyType,
            armCount,
            totalParticles,
            galaxyRadius,
            patternSpeed,
            armPitch,
            armStrength,
            maxRotationSpeed,
            hasBar: isBarred,
            theme: galaxyType
        }
    };
}

/**
 * Generate a realistic particle based on galactic structure and stellar populations
 */
function generateRealisticParticle(rng, params) {
    const { galaxyRadius, diskHeight, coreRadius, armCount, patternSpeed, armPitch, armStrength, 
            maxRotationSpeed, flatRadius, theme, barParams, galaxyType } = params;
    
    // Randomly choose particle region based on realistic distributions
    const regionRand = rng.random();
    
    let particle;
    if (regionRand < 0.15) {
        // Bulge particles (15% - central region with older stars)
        particle = generateBulgeParticle(rng, coreRadius, diskHeight, theme.bulge, maxRotationSpeed);
    } else if (regionRand < 0.85) {
        // Disk particles (70% - main disk with spiral structure)
        particle = generateDiskParticle(rng, galaxyRadius, diskHeight, armCount, 
                                       patternSpeed, armPitch, armStrength, maxRotationSpeed, 
                                       flatRadius, theme, barParams);
    } else {
        // Halo particles (15% - outer region with old stars)
        particle = generateHaloParticle(rng, galaxyRadius, theme.halo, maxRotationSpeed);
    }
    
    return particle;
}

/**
 * Generate a bulge particle (central region)
 */
function generateBulgeParticle(rng, coreRadius, diskHeight, colors, maxRotationSpeed) {
    // Exponential distribution for bulge - more concentrated toward center
    const r = rng.range(0, 1);
    const radius = -coreRadius * Math.log(1 - r * 0.9); // Prevents log(0)
    
    const theta = rng.random() * Math.PI * 2;
    const z = rng.range(-diskHeight, diskHeight) * 2; // Bulge is thicker than disk
    
    const position = {
        x: radius * Math.cos(theta),
        y: z,
        z: radius * Math.sin(theta)
    };
    
    // Bulge stars have roughly circular orbits with some random motion
    const rotationSpeed = getRotationSpeed(radius, maxRotationSpeed, coreRadius, coreRadius * 2);
    const angularVelocity = rotationSpeed / (radius + 0.1);
    
    return {
        position,
        velocity: {
            x: -position.z * angularVelocity + rng.range(-0.2, 0.2),
            y: rng.range(-0.1, 0.1),
            z: position.x * angularVelocity + rng.range(-0.2, 0.2)
        },
        color: rng.choice(colors),
        size: rng.range(0.8, 1.5),
        brightness: rng.range(0.7, 1.0),
        mass: rng.range(0.8, 1.2),
        stellarType: 'bulge',
        age: rng.range(10, 13), // Gyr - old stars
        layer: 0, // Render first (background)
        oscillation: {
            amplitude: rng.range(0.02, 0.08),
            frequency: rng.range(0.5, 1.5),
            phase: rng.random() * Math.PI * 2
        }
    };
}

/**
 * Generate a disk particle with spiral structure and realistic stellar populations
 */
function generateDiskParticle(rng, galaxyRadius, diskHeight, armCount, patternSpeed, armPitch, 
                             armStrength, maxRotationSpeed, flatRadius, theme, barParams) {
    // Exponential disk distribution
    const r = rng.range(0, 1);
    const radius = -galaxyRadius * 0.3 * Math.log(1 - r * 0.95); // Scale length ~ galaxyRadius/3
    
    const theta = rng.random() * Math.PI * 2;
    
    // Calculate density enhancement from spiral arms
    const armDensity = calculateSpiralDensity(radius, theta, armCount, armPitch, armStrength);
    
    // Calculate bar potential if galaxy is barred
    let barEffect = 1.0;
    if (barParams.hasBar) {
        barEffect = calculateBarDensity(radius, theta, barParams);
    }
    
    // Total density enhancement
    const totalDensity = armDensity * barEffect;
    
    // Determine if particle is in a spiral arm (higher density)
    const inSpiralArm = totalDensity > 1.3;
    
    // Add some randomness to position
    const spiralNoise = rng.range(-1, 1) * 2.0;
    const finalTheta = theta + spiralNoise / radius;
    
    const z = rng.range(-diskHeight, diskHeight) * Math.exp(-radius / (galaxyRadius * 0.5));
    
    const position = {
        x: radius * Math.cos(finalTheta),
        y: z,
        z: radius * Math.sin(finalTheta)
    };
    
    // Apply differential rotation (Keplerian -> flat rotation curve)
    const rotationSpeed = getRotationSpeed(radius, maxRotationSpeed, flatRadius * 0.1, flatRadius);
    const angularVelocity = rotationSpeed / radius;
    
    // Assign stellar population based on location
    let stellarType, color, size, brightness, age;
    
    if (inSpiralArm && radius > flatRadius * 0.3) {
        // Young, blue stars in spiral arms (star formation regions)
        stellarType = 'youngArm';
        color = rng.choice(theme.arms);
        size = rng.range(1.2, 2.5);
        brightness = rng.range(1.2, 1.8);
        age = rng.range(0.01, 2); // Very young - 10 Myr to 2 Gyr
    } else {
        // Older disk stars between arms
        stellarType = 'disk';
        color = rng.choice(theme.disk);
        size = rng.range(0.6, 1.2);
        brightness = rng.range(0.6, 1.0);
        age = rng.range(2, 8); // Intermediate age 2-8 Gyr
    }
    
    return {
        position,
        velocity: {
            x: -position.z * angularVelocity + rng.range(-0.05, 0.05),
            y: rng.range(-0.02, 0.02),
            z: position.x * angularVelocity + rng.range(-0.05, 0.05)
        },
        color,
        size,
        brightness,
        mass: rng.range(0.8, 1.2),
        stellarType,
        age,
        layer: inSpiralArm ? 2 : 1, // Arms render over disk
        armDensity: totalDensity, // Store for shader use
        oscillation: {
            amplitude: rng.range(0.01, 0.03),
            frequency: rng.range(0.5, 1.0),
            phase: rng.random() * Math.PI * 2
        }
    };
}

/**
 * Generate a halo particle (outer region)
 */
function generateHaloParticle(rng, galaxyRadius, colors, maxRotationSpeed) {
    // Halo follows r^(-3) distribution (de Vaucouleurs profile approximation)
    const r = rng.range(0, 1);
    const radius = galaxyRadius * (0.8 + 1.5 * Math.pow(r, 0.25));
    
    const theta = rng.random() * Math.PI * 2;
    const phi = (rng.random() - 0.5) * Math.PI; // Full spherical distribution
    
    const position = {
        x: radius * Math.cos(theta) * Math.cos(phi),
        y: radius * Math.sin(phi),
        z: radius * Math.sin(theta) * Math.cos(phi)
    };
    
    // Halo stars have slower, more elliptical orbits
    const rotationSpeed = getRotationSpeed(radius, maxRotationSpeed, galaxyRadius * 0.1, galaxyRadius);
    const angularVelocity = rotationSpeed / radius * 0.6; // Slower rotation
    
    return {
        position,
        velocity: {
            x: -position.z * angularVelocity + rng.range(-0.1, 0.1),
            y: rng.range(-0.05, 0.05),
            z: position.x * angularVelocity + rng.range(-0.1, 0.1)
        },
        color: rng.choice(colors),
        size: rng.range(0.3, 0.8),
        brightness: rng.range(0.3, 0.6),
        mass: rng.range(0.8, 1.2),
        stellarType: 'halo',
        age: rng.range(12, 13.5), // Very old stars - 12-13.5 Gyr
        layer: 3, // Render last (foreground)
        oscillation: {
            amplitude: rng.range(0.01, 0.02),
            frequency: rng.range(0.1, 0.5),
            phase: rng.random() * Math.PI * 2
        }
    };
}

/**
 * Calculate spiral arm density enhancement using simplified Lin-Shu density wave theory
 */
function calculateSpiralDensity(radius, theta, armCount, armPitch, armStrength) {
    let totalDensity = 1.0;
    
    // For each spiral arm
    for (let arm = 0; arm < armCount; arm++) {
        const armAngle = (arm * 2 * Math.PI) / armCount;
        
        // Logarithmic spiral equation: theta = ln(r) * cot(pitch) + phi0
        const spiralAngle = armPitch * Math.log(radius + 1) + armAngle;
        
        // Calculate angular distance from spiral arm
        let deltaTheta = theta - spiralAngle;
        
        // Normalize angle to [-π, π]
        while (deltaTheta > Math.PI) deltaTheta -= 2 * Math.PI;
        while (deltaTheta < -Math.PI) deltaTheta += 2 * Math.PI;
        
        // Gaussian density enhancement around spiral arm
        const armWidth = 0.3; // radians
        const densityEnhancement = armStrength * Math.exp(-(deltaTheta * deltaTheta) / (2 * armWidth * armWidth));
        
        totalDensity += densityEnhancement;
    }
    
    return totalDensity;
}

/**
 * Calculate bar density enhancement for barred galaxies
 */
function calculateBarDensity(radius, theta, barParams) {
    if (!barParams.hasBar) return 1.0;
    
    // Transform to bar coordinate system
    const cosBarAngle = Math.cos(barParams.barAngle);
    const sinBarAngle = Math.sin(barParams.barAngle);
    
    const x = radius * Math.cos(theta);
    const z = radius * Math.sin(theta);
    
    const xBar = x * cosBarAngle + z * sinBarAngle;
    const zBar = -x * sinBarAngle + z * cosBarAngle;
    
    // Elliptical bar potential
    const a = barParams.barLength;
    const b = barParams.barWidth;
    
    const ellipticalRadius = Math.sqrt((xBar * xBar) / (a * a) + (zBar * zBar) / (b * b));
    
    // Density enhancement in bar region
    if (ellipticalRadius < 1.0) {
        return 1.0 + barParams.barStrength * (1.0 - ellipticalRadius);
    }
    
    return 1.0;
}

/**
 * Realistic galactic rotation curve
 * Combines solid-body rotation (inner), rising curve (middle), and flat curve (outer)
 */
function getRotationSpeed(radius, vMax, rCore, rFlat) {
    if (radius < rCore) {
        // Solid body rotation in very center
        return vMax * (radius / rCore);
    } else if (radius < rFlat) {
        // Rising rotation curve
        const x = (radius - rCore) / (rFlat - rCore);
        return vMax * (1 - Math.exp(-x * 3));
    } else {
        // Flat rotation curve (dark matter dominated)
        return vMax * 0.95;
    }
}

/**
 * Check if a particle is too close to any black hole
 */
function isParticleTooCloseToBlackHole(particle, blackHoles) {
    for (const blackHole of blackHoles) {
        const dx = particle.position.x - blackHole.position.x;
        const dy = particle.position.y - blackHole.position.y;
        const dz = particle.position.z - blackHole.position.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (distance < blackHole.radius * 2) {
            return true;
        }
    }
    return false;
}

// ... [REST OF THE SERVER CODE REMAINS THE SAME - initialization, API routes, etc.] ...

// Initialize data storage
async function initializeDataStorage() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        
        try {
            await fs.access(FAVORITES_FILE);
        } catch {
            await fs.writeFile(FAVORITES_FILE, JSON.stringify([]));
            console.log('Created favorites.json');
        }
        
        try {
            await fs.access(RATINGS_FILE);
        } catch {
            await fs.writeFile(RATINGS_FILE, JSON.stringify({}));
            console.log('Created ratings.json');
        }
        
        console.log('Data storage initialized');
    } catch (error) {
        console.error('Error initializing data storage:', error);
    }
}

// Helper function to read JSON file
async function readJsonFile(filePath, defaultValue = null) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return defaultValue;
    }
}

// Helper function to write JSON file
async function writeJsonFile(filePath, data) {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error writing ${filePath}:`, error);
        return false;
    }
}

// API Routes

// Serve the config file for the frontend to read
app.get('/api/config', async (req, res) => {
    try {
        const config = await readJsonFile(CONFIG_FILE, { serverPort: PORT });
        res.json(config);
    } catch (error) {
        console.error('Error reading config:', error);
        res.status(500).json({ error: 'Failed to read config' });
    }
});

// Generate galaxy data for a given seed
app.get('/api/galaxy/:seed', async (req, res) => {
    try {
        const { seed } = req.params;
        console.log(`Generating galaxy for seed: ${seed}`);
        
        const galaxyData = generateGalaxyData(seed);
        
        res.json(galaxyData);
    } catch (error) {
        console.error('Error generating galaxy:', error);
        res.status(500).json({ error: 'Failed to generate galaxy data' });
    }
});

// Get all favorites with galaxy metadata
app.get('/api/favorites', async (req, res) => {
    try {
        const favorites = await readJsonFile(FAVORITES_FILE, []);
        
        // Enrich favorites with basic galaxy metadata
        const enrichedFavorites = favorites.map(fav => {
            const galaxyData = generateGalaxyData(fav.seed);
            return {
                ...fav,
                metadata: {
                    ...galaxyData.metadata,
                    blackHoles: galaxyData.blackHoles.length
                }
            };
        });
        
        // Sort by timestamp (newest first)
        enrichedFavorites.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        res.json({ favorites: enrichedFavorites });
    } catch (error) {
        console.error('Error getting favorites:', error);
        res.status(500).json({ error: 'Failed to load favorites' });
    }
});

// Check if a seed is favorited
app.get('/api/favorites/:seed', async (req, res) => {
    try {
        const { seed } = req.params;
        const favorites = await readJsonFile(FAVORITES_FILE, []);
        
        const isFavorite = favorites.some(fav => fav.seed === seed);
        
        res.json({ isFavorite, seed });
    } catch (error) {
        console.error('Error checking favorite:', error);
        res.status(500).json({ error: 'Failed to check favorite status' });
    }
});

// Toggle favorite (add or remove)
app.post('/api/favorites', async (req, res) => {
    try {
        const { seed, name } = req.body;
        
        if (!seed) {
            return res.status(400).json({ error: 'Seed is required' });
        }
        
        const favorites = await readJsonFile(FAVORITES_FILE, []);
        const existingIndex = favorites.findIndex(fav => fav.seed === seed);
        
        let message;
        
        if (existingIndex >= 0) {
            favorites.splice(existingIndex, 1);
            message = 'Removed from favorites';
        } else {
            const ratings = await readJsonFile(RATINGS_FILE, {});
            const favorite = {
                seed,
                name: name || seed,
                timestamp: new Date().toISOString(),
                rating: ratings[seed] || null
            };
            favorites.push(favorite);
            message = 'Added to favorites';
        }
        
        const success = await writeJsonFile(FAVORITES_FILE, favorites);
        
        if (success) {
            res.json({ message, seed, name: name || seed });
        } else {
            res.status(500).json({ error: 'Failed to update favorites' });
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
        res.status(500).json({ error: 'Failed to toggle favorite' });
    }
});

// Get rating for a specific seed
app.get('/api/ratings/:seed', async (req, res) => {
    try {
        const { seed } = req.params;
        const ratings = await readJsonFile(RATINGS_FILE, {});
        
        const rating = ratings[seed] || null;
        
        res.json({ seed, rating });
    } catch (error) {
        console.error('Error getting rating:', error);
        res.status(500).json({ error: 'Failed to get rating' });
    }
});

// Set or update rating for a seed
app.post('/api/ratings', async (req, res) => {
    try {
        const { seed, rating } = req.body;
        
        if (!seed || rating === undefined) {
            return res.status(400).json({ error: 'Seed and rating are required' });
        }
        
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }
        
        const ratings = await readJsonFile(RATINGS_FILE, {});
        ratings[seed] = rating;
        
        const success = await writeJsonFile(RATINGS_FILE, ratings);
        
        if (success) {
            const favorites = await readJsonFile(FAVORITES_FILE, []);
            const favoriteIndex = favorites.findIndex(fav => fav.seed === seed);
            
            if (favoriteIndex >= 0) {
                favorites[favoriteIndex].rating = rating;
                await writeJsonFile(FAVORITES_FILE, favorites);
            }
            
            res.json({ message: 'Rating saved', seed, rating });
        } else {
            res.status(500).json({ error: 'Failed to save rating' });
        }
    } catch (error) {
        console.error('Error setting rating:', error);
        res.status(500).json({ error: 'Failed to set rating' });
    }
});

// Get all ratings with statistics
app.get('/api/ratings', async (req, res) => {
    try {
        const ratings = await readJsonFile(RATINGS_FILE, {});
        
        const ratingValues = Object.values(ratings);
        const average = ratingValues.length > 0 
            ? ratingValues.reduce((sum, r) => sum + r, 0) / ratingValues.length 
            : 0;
        
        const distribution = {};
        for (let i = 1; i <= 5; i++) {
            distribution[i] = ratingValues.filter(r => r === i).length;
        }
        
        res.json({
            ratings,
            statistics: {
                total: ratingValues.length,
                average: Math.round(average * 100) / 100,
                distribution
            }
        });
    } catch (error) {
        console.error('Error getting ratings:', error);
        res.status(500).json({ error: 'Failed to get ratings' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        server: 'Galaxy Generator API v2 - Enhanced',
        port: PORT
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server with dynamic port detection
async function startServer() {
    try {
        // Initialize data storage first
        await initializeDataStorage();
        
        // Find an available port starting from our preferred port
        console.log(`Checking for available port starting from ${PORT}...`);
        PORT = await findAvailablePort(PORT);
        
        // Write the config file with the actual port being used
        await writeConfigFile(PORT);
        
        // Start the server on the found port
        app.listen(PORT, () => {
            console.log(`\n🚀 Galaxy Generator server v2 Enhanced running on http://localhost:${PORT}`);
            console.log(`📄 Config file written to: ${CONFIG_FILE}`);
            console.log('✅ CORS enabled for cross-origin requests');
            console.log('\nEnhanced Features:');
            console.log('  ✨ Realistic spiral galaxy structure with density waves');
            console.log('  🌌 Differential rotation (Keplerian → flat rotation curve)');
            console.log('  ⭐ Stellar populations: bulge, disk, spiral arms, halo');
            console.log('  🌟 Barred spiral galaxies (SB types)');
            console.log('  📏 Hubble classification (Sa/SBa to Sc/SBc)');
            console.log('  🎨 Color-coded stellar populations by age/type');
            console.log('\nAPI endpoints available:');
            console.log(`  GET  http://localhost:${PORT}/api/config          - Get server configuration`);
            console.log(`  GET  http://localhost:${PORT}/api/galaxy/:seed    - Generate realistic galaxy data`);
            console.log(`  GET  http://localhost:${PORT}/api/favorites       - Get all favorites with metadata`);
            console.log(`  GET  http://localhost:${PORT}/api/favorites/:seed - Check if seed is favorited`);
            console.log(`  POST http://localhost:${PORT}/api/favorites       - Toggle favorite`);
            console.log(`  GET  http://localhost:${PORT}/api/ratings/:seed   - Get rating for seed`);
            console.log(`  POST http://localhost:${PORT}/api/ratings         - Set rating for seed`);
            console.log(`  GET  http://localhost:${PORT}/api/ratings         - Get all ratings with stats`);
            console.log(`  GET  http://localhost:${PORT}/api/health          - Health check`);
            console.log('\nFrontend will automatically detect server port from API endpoint.\n');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n📴 Received SIGINT. Graceful shutdown...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n📴 Received SIGTERM. Graceful shutdown...');
    process.exit(0);
});

// Start the server
startServer();