/**
 * Star system generation and display for Galaxy Generator
 * Handles the generation of procedural star systems and their display in the UI
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js';
import * as state from './state.js';
import eventBus from './events.js';

/**
 * Generate a seeded random number generator for consistent procedural generation
 * @param {string} seed - The seed string to use
 * @returns {Object} - A random number generator object
 */
export function createSeededRandom(seed) {
    let seedValue = 0;
    for (let i = 0; i < seed.length; i++) {
        seedValue = ((seedValue << 5) - seedValue + seed.charCodeAt(i)) & 0xffffffff;
    }
    seedValue = Math.abs(seedValue);
    
    return {
        random: function() {
            seedValue = (seedValue * 16807) % 2147483647;
            return (seedValue - 1) / 2147483646;
        },
        range: function(min, max) {
            return min + this.random() * (max - min);
        },
        int: function(min, max) {
            return Math.floor(this.range(min, max + 1));
        },
        choice: function(array) {
            return array[Math.floor(this.random() * array.length)];
        }
    };
}

/**
 * Generate procedural star system data based on star properties and position
 * @param {Object} star - Star data with position and properties
 * @returns {Object} - Generated star system data
 */
export function generateStarSystem(star) {
    const currentSeed = state.getCurrentSeed();
    
    // Create seeded random generator for this specific star
    const starSeed = `${currentSeed}-star-${star.index}`;
    const rng = createSeededRandom(starSeed);
    
    // Determine star properties based on stellar population
    const stellarType = star.stellarType || 'disk';
    const starProps = generateStarProperties(stellarType, rng);
    
    // Generate planetary system
    const planetarySystem = generatePlanetarySystem(starProps, rng);
    
    // Calculate galactic properties
    const galacticProps = calculateGalacticProperties(star);
    
    return {
        id: star.index,
        designation: `${currentSeed.slice(0, 6)}-${String(star.index).padStart(6, '0')}`,
        stellar: starProps,
        planets: planetarySystem,
        galactic: galacticProps,
        position: star.position,
        color: star.color
    };
}

/**
 * Generate star properties based on stellar population
 * @param {string} stellarType - Type of star (bulge, disk, youngArm, halo)
 * @param {Object} rng - Seeded random number generator
 * @returns {Object} - Star properties
 */
function generateStarProperties(stellarType, rng) {
    let starClass, temperature, mass, radius, luminosity, age;
    
    switch (stellarType) {
        case 'youngArm':
            // Young, hot stars in spiral arms
            const youngClasses = ['O', 'B', 'A'];
            starClass = rng.choice(youngClasses);
            temperature = rng.range(7000, 50000);
            mass = rng.range(1.5, 20);
            age = rng.range(0.01, 2); // Very young
            break;
            
        case 'bulge':
            // Old, red stars in bulge
            const oldClasses = ['K', 'M'];
            starClass = rng.choice(oldClasses);
            temperature = rng.range(3000, 5000);
            mass = rng.range(0.3, 0.9);
            age = rng.range(10, 13);
            break;
            
        case 'halo':
            // Very old, metal-poor stars
            const haloClasses = ['K', 'M'];
            starClass = rng.choice(haloClasses);
            temperature = rng.range(3000, 4500);
            mass = rng.range(0.2, 0.8);
            age = rng.range(12, 13.5);
            break;
            
        default: // 'disk'
            // Mix of star types
            const diskClasses = ['M', 'K', 'G', 'F'];
            starClass = rng.choice(diskClasses);
            temperature = rng.range(3000, 7000);
            mass = rng.range(0.5, 1.5);
            age = rng.range(2, 8);
    }
    
    // Calculate derived properties
    radius = Math.pow(mass, 0.8); // Stellar radius in solar radii
    luminosity = Math.pow(mass, 3.5); // Stellar luminosity in solar luminosities
    
    return {
        class: starClass,
        temperature: Math.round(temperature),
        mass: Math.round(mass * 100) / 100,
        radius: Math.round(radius * 100) / 100,
        luminosity: Math.round(luminosity * 100) / 100,
        age: Math.round(age * 100) / 100,
        type: stellarType
    };
}

/**
 * Generate planetary system
 * @param {Object} starProps - Star properties
 * @param {Object} rng - Seeded random number generator
 * @returns {Object} - Planetary system data
 */
function generatePlanetarySystem(starProps, rng) {
    const planetCount = rng.int(0, 8);
    const planets = [];
    
    // Calculate habitable zone
    const habitableZoneInner = Math.sqrt(starProps.luminosity) * 0.95;
    const habitableZoneOuter = Math.sqrt(starProps.luminosity) * 1.37;
    
    for (let i = 0; i < planetCount; i++) {
        const distance = rng.range(0.1, 50) * Math.pow(1.5, i); // Increasing distances
        const planet = {
            name: `Planet ${String.fromCharCode(98 + i)}`, // b, c, d, etc.
            distance: Math.round(distance * 100) / 100,
            type: determinePlanetType(distance, starProps, rng),
            inHabitableZone: distance >= habitableZoneInner && distance <= habitableZoneOuter
        };
        planets.push(planet);
    }
    
    return {
        count: planetCount,
        planets: planets,
        habitableZone: {
            inner: Math.round(habitableZoneInner * 100) / 100,
            outer: Math.round(habitableZoneOuter * 100) / 100
        }
    };
}

/**
 * Determine planet type based on distance and star properties
 * @param {number} distance - Distance from star in AU
 * @param {Object} starProps - Star properties
 * @param {Object} rng - Seeded random number generator
 * @returns {string} - Planet type
 */
function determinePlanetType(distance, starProps, rng) {
    const frostLine = Math.sqrt(starProps.luminosity) * 2.7;
    
    if (distance < 0.5) {
        return rng.choice(['Hot Rocky', 'Lava World']);
    } else if (distance < frostLine) {
        return rng.choice(['Rocky', 'Super-Earth', 'Ocean World']);
    } else {
        return rng.choice(['Gas Giant', 'Ice Giant', 'Cold Rocky']);
    }
}

/**
 * Calculate galactic properties of the star
 * @param {Object} star - Star data with position
 * @returns {Object} - Galactic properties
 */
function calculateGalacticProperties(star) {
    const position = star.position;
    const galacticRadius = Math.sqrt(position.x * position.x + position.z * position.z);
    const galacticAngle = Math.atan2(position.z, position.x);
    
    // Estimate orbital period around galactic center (simplified)
    const orbitalPeriod = Math.pow(galacticRadius / 8.0, 1.5) * 225; // Million years
    
    return {
        radius: Math.round(galacticRadius * 100) / 100,
        height: Math.round(position.y * 100) / 100,
        angle: Math.round((galacticAngle * 180 / Math.PI) * 100) / 100,
        orbitalPeriod: Math.round(orbitalPeriod),
        armDensity: star.armDensity || 1.0
    };
}

/**
 * Display star information in the overlay
 * @param {Object} starSystem - Star system data
 */
export function displayStarInformation(starSystem) {
    // Update star title and color indicator
    const starTitle = document.getElementById('star-title');
    const colorIndicator = document.getElementById('star-color-indicator');
    
    if (starTitle) {
        starTitle.textContent = `${starSystem.stellar.class}-type Star ${starSystem.designation}`;
    }
    
    if (colorIndicator) {
        colorIndicator.style.backgroundColor = `#${starSystem.color.toString(16).padStart(6, '0')}`;
    }
    
    // Update basic stellar info
    const basicInfo = document.getElementById('star-basic-info');
    if (basicInfo) {
        basicInfo.innerHTML = `
            <div class="star-property">
                <span>Stellar Class:</span>
                <span>${starSystem.stellar.class}</span>
            </div>
            <div class="star-property">
                <span>Temperature:</span>
                <span>${starSystem.stellar.temperature.toLocaleString()} K</span>
            </div>
            <div class="star-property">
                <span>Mass:</span>
                <span>${starSystem.stellar.mass} M☉</span>
            </div>
            <div class="star-property">
                <span>Radius:</span>
                <span>${starSystem.stellar.radius} R☉</span>
            </div>
            <div class="star-property">
                <span>Luminosity:</span>
                <span>${starSystem.stellar.luminosity} L☉</span>
            </div>
            <div class="star-property">
                <span>Age:</span>
                <span>${starSystem.stellar.age} Gyr</span>
            </div>
            <div class="star-property">
                <span>Population:</span>
                <span>${starSystem.stellar.type}</span>
            </div>
        `;
    }
    
    // Update galactic position info
    const positionInfo = document.getElementById('star-position-info');
    if (positionInfo) {
        positionInfo.innerHTML = `
            <div class="star-property">
                <span>Galactic Radius:</span>
                <span>${starSystem.galactic.radius} kpc</span>
            </div>
            <div class="star-property">
                <span>Galactic Height:</span>
                <span>${starSystem.galactic.height} kpc</span>
            </div>
            <div class="star-property">
                <span>Galactic Angle:</span>
                <span>${starSystem.galactic.angle}°</span>
            </div>
            <div class="star-property">
                <span>Orbital Period:</span>
                <span>${starSystem.galactic.orbitalPeriod} Myr</span>
            </div>
            <div class="star-property">
                <span>Spiral Arm Density:</span>
                <span>${starSystem.galactic.armDensity.toFixed(2)}×</span>
            </div>
        `;
    }
    
    // Update planetary system info
    const planetsInfo = document.getElementById('star-planets-info');
    if (planetsInfo) {
        let planetHtml = `
            <div class="star-property">
                <span>Planet Count:</span>
                <span>${starSystem.planets.count}</span>
            </div>
            <div class="star-property">
                <span>Habitable Zone:</span>
                <span>${starSystem.planets.habitableZone.inner} - ${starSystem.planets.habitableZone.outer} AU</span>
            </div>
        `;
        
        if (starSystem.planets.count > 0) {
            planetHtml += '<div style="margin-top: 10px; font-size: 11px;">';
            starSystem.planets.planets.forEach(planet => {
                const habitableClass = planet.inHabitableZone ? ' (Habitable Zone)' : '';
                planetHtml += `
                    <div style="margin: 3px 0; display: flex; justify-content: space-between;">
                        <span>${planet.name}:</span>
                        <span>${planet.type}${habitableClass}</span>
                    </div>
                `;
            });
            planetHtml += '</div>';
        }
        
        planetsInfo.innerHTML = planetHtml;
    }
    
    eventBus.emit('star-info-displayed', starSystem);
}
