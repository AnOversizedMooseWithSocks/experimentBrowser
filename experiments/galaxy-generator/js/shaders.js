/**
 * Enhanced shader code for realistic galaxy rendering
 * Refactored to use ES Modules and event-based architecture
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js';
import eventBus from './events.js';

// Enhanced vertex shader with density wave theory and differential rotation
// This shader creates realistic spiral galaxy motion and structure
const enhancedVertexShader = `
    // Particle attributes passed from the geometry
    attribute float size;           // Base size of the particle (star)
    attribute vec3 customColor;     // RGB color of the particle
    attribute float brightness;     // Brightness multiplier
    attribute vec3 velocity;        // Velocity for orbital motion (now includes differential rotation)
    attribute vec3 oscillation;     // amplitude, frequency, phase for natural movement
    attribute float mass;           // Particle mass for gravitational effects
    attribute float armDensity;     // Spiral arm density enhancement (NEW)
    attribute float stellarType;    // Stellar population type
    
    // Variables passed to fragment shader
    varying vec3 vColor;
    varying float vBrightness;
    varying float vArmDensity;      // Pass density to fragment shader for effects
    varying float vStellarType;     // Pass type to fragment shader
    
    // Uniforms (values that change over time or are galaxy-specific)
    uniform float time;                     // Current animation time
    uniform float glowIntensity;            // Global glow intensity
    uniform int blackHoleCount;             // Number of black holes
    uniform vec3 blackHolePositions[10];    // Black hole positions (max 10)
    uniform float blackHoleMasses[10];      // Black hole masses
    uniform float gravitationalStrength;    // Gravitational force multiplier
    uniform float blackHoleInfluenceRadius; // Maximum influence distance
    
    // NEW: Galaxy structure parameters
    uniform float patternSpeed;          // Angular speed of spiral pattern (km/s/kpc)
    uniform float galaxyRadius;          // Total galaxy radius for normalization
    uniform float maxRotationSpeed;      // Maximum rotation velocity
    uniform float armPitch;              // Spiral arm pitch angle
    uniform int armCount;                // Number of spiral arms
    uniform float armStrength;           // Strength of spiral arm density enhancement
    
    // Realistic rotation curve calculation
    // Implements: solid body (core) → rising curve → flat rotation
    float getRotationSpeed(float radius) {
        float r = radius / galaxyRadius; // Normalize radius
        
        // Core region: solid body rotation
        if (r < 0.1) {
            return maxRotationSpeed * (r / 0.1);
        }
        // Rising curve to flat rotation
        else if (r < 0.8) {
            float x = (r - 0.1) / 0.7;
            return maxRotationSpeed * (1.0 - exp(-x * 3.0));
        }
        // Flat rotation curve (dark matter dominated)
        else {
            return maxRotationSpeed * 0.95;
        }
    }
    
    // Calculate spiral arm density using simplified Lin-Shu theory
    float calculateSpiralDensity(float radius, float theta) {
        float totalDensity = 1.0;
        
        // For each spiral arm
        for (int arm = 0; arm < 4; arm++) {
            if (arm >= armCount) break;
            
            float armAngle = float(arm) * 2.0 * 3.14159 / float(armCount);
            
            // Logarithmic spiral equation: theta = pitch * ln(r) + arm_angle
            float spiralAngle = armPitch * log(radius / galaxyRadius + 1.0) + armAngle;
            
            // Calculate angular distance from spiral arm
            float deltaTheta = theta - spiralAngle;
            
            // Normalize angle to [-π, π]
            deltaTheta = mod(deltaTheta + 3.14159, 6.28318) - 3.14159;
            
            // Gaussian density enhancement around spiral arm
            float armWidth = 0.3; // radians
            float densityEnhancement = armStrength * exp(-(deltaTheta * deltaTheta) / (2.0 * armWidth * armWidth));
            
            totalDensity += densityEnhancement;
        }
        
        return totalDensity;
    }
    
    void main() {
        // Start with original particle position
        vec3 pos = position;
        
        // Calculate galactic coordinates
        float radius = length(pos.xz);
        float theta = atan(pos.z, pos.x);
        
        // Apply realistic differential rotation
        // Each particle orbits with speed determined by galactic radius
        float rotationSpeed = getRotationSpeed(radius);
        float angularVelocity = rotationSpeed / (radius + 0.1); // Prevent division by zero
        
        // Calculate time-evolved position with differential rotation
        float deltaAngle = angularVelocity * time * 0.01; // Scale time for visual effect
        float newTheta = theta + deltaAngle;
        
        // Update position with new angle (differential rotation)
        pos.x = radius * cos(newTheta);
        pos.z = radius * sin(newTheta);
        
        // Add vertical motion (slight up/down oscillation)
        pos.y += velocity.y * time * 0.05;
        
        // Add small-scale turbulent motion for realism
        pos.x += oscillation.x * sin(time * oscillation.y + oscillation.z);
        pos.y += oscillation.x * 0.5 * cos(time * oscillation.y * 1.3 + oscillation.z);
        pos.z += oscillation.x * sin(time * oscillation.y * 0.8 + oscillation.z);
        
        // Calculate spiral arm density at current position
        float spiralDensity = calculateSpiralDensity(radius, newTheta);
        vArmDensity = spiralDensity;
        
        // Enhanced brightness in spiral arms (star formation regions)
        float densityMultiplier = 0.7 + 0.3 * spiralDensity;
        
        // Apply black hole gravitational effects
        vec3 gravitationalForce = vec3(0.0);
        
        for(int i = 0; i < 10; i++) {
            if(i >= blackHoleCount) break;
            
            // Calculate vector from particle to black hole
            vec3 toBlackHole = blackHolePositions[i] - pos;
            float distance = length(toBlackHole);
            
            // Skip if outside influence radius
            if(distance > blackHoleInfluenceRadius) continue;
            
            // Calculate gravitational force (simplified Newton's law)
            float forceMagnitude = gravitationalStrength * blackHoleMasses[i] * mass / (distance * distance + 0.1);
            
            // Apply distance falloff for smoother effect
            float falloff = 1.0 - smoothstep(0.0, blackHoleInfluenceRadius, distance);
            forceMagnitude *= falloff;
            
            // Add to total gravitational force
            gravitationalForce += normalize(toBlackHole) * forceMagnitude;
        }
        
        // Apply gravitational acceleration over time (creates inward drift toward black holes)
        pos += gravitationalForce * time * 0.005;
        
        // Transform position to screen space
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        
        // Calculate particle size with multiple factors:
        // 1. Distance-based perspective scaling
        // 2. Brightness from spiral arms
        // 3. Enhanced size near black holes
        float perspectiveScale = 300.0 / -mvPosition.z;
        
        // Black hole proximity effect (particles appear brighter/larger when close)
        float blackHoleProximity = 1.0;
        for(int i = 0; i < 10; i++) {
            if(i >= blackHoleCount) break;
            float dist = length(blackHolePositions[i] - pos);
            if(dist < blackHoleInfluenceRadius) {
                blackHoleProximity += (1.0 - dist / blackHoleInfluenceRadius) * 0.15;
            }
        }
        
        // Final particle size combines all effects
        gl_PointSize = size * perspectiveScale * glowIntensity * densityMultiplier * blackHoleProximity;
        
        // Pass color and brightness to fragment shader
        vColor = customColor;
        // Enhance brightness based on spiral arm density and original arm density from server
        vBrightness = brightness * glowIntensity * densityMultiplier * (0.8 + 0.2 * armDensity);
        vStellarType = stellarType;
        
        // Final position for rendering
        gl_Position = projectionMatrix * mvPosition;
    }
`;

// Enhanced fragment shader with stellar population effects
// Creates realistic star appearances with spiral arm enhancements
const enhancedFragmentShader = `
    // Variables received from vertex shader
    varying vec3 vColor;
    varying float vBrightness;
    varying float vArmDensity;    // Spiral arm density
    varying float vStellarType;   // Stellar population type
    
    void main() {
        // Calculate distance from center of particle (creates circular stars)
        vec2 center = gl_PointCoord - vec2(0.5);
        float distance = length(center);
        
        // Discard pixels outside the particle circle (creates clean edges)
        if (distance > 0.5) discard;
        
        // Create soft glow effect with enhanced brightness in spiral arms
        // Stars in spiral arms appear more luminous due to active star formation
        float alpha = 1.0 - (distance * 2.0);
        alpha = pow(alpha, 1.5);  // Softer falloff than original
        
        // Enhanced core effect for stars in spiral arms
        float core = 1.0 - (distance * 4.0);
        core = max(0.0, core);
        
        // Stars in spiral arms have more pronounced cores (young, hot stars)
        float coreExponent = mix(2.0, 4.0, clamp(vArmDensity - 1.0, 0.0, 1.0));
        core = pow(core, coreExponent);
        
        // Combine glow and core effects
        alpha += core;
        
        // Apply brightness with arm enhancement
        alpha *= vBrightness;
        
        // Stellar population color enhancement
        // Young stars in spiral arms get slight blue shift
        vec3 finalColor = vColor;
        
        // Apply color shifting based on stellar type
        if (vStellarType > 1.5 && vStellarType < 2.5) { // Young arm stars
            // Enhance blue component for young stars in spiral arms
            finalColor.b = min(1.0, finalColor.b * 1.1);
            finalColor.r = min(1.0, finalColor.r * 0.98);
        } else if (vStellarType < 0.5) { // Bulge stars
            // Enhance red for old bulge stars
            finalColor.r = min(1.0, finalColor.r * 1.05);
            finalColor.b = min(1.0, finalColor.b * 0.95);
        } else if (vStellarType > 2.5) { // Halo stars
            // Fainter, slightly yellowish for old halo stars
            finalColor = mix(finalColor, vec3(0.9, 0.8, 0.7), 0.2);
        }
        
        // Output final color with alpha for transparency
        gl_FragColor = vec4(finalColor, alpha);
    }
`;

// Compatibility versions for older hardware
const compatibilityVertexShader = `
    attribute float size;
    attribute vec3 customColor;
    attribute float brightness;
    attribute vec3 velocity;
    attribute vec3 oscillation;
    attribute float mass;
    
    varying vec3 vColor;
    varying float vBrightness;
    
    uniform float time;
    uniform float glowIntensity;
    uniform int blackHoleCount;
    uniform vec3 blackHolePositions[10];
    uniform float blackHoleMasses[10];
    uniform float gravitationalStrength;
    uniform float blackHoleInfluenceRadius;
    
    void main() {
        vColor = customColor;
        vBrightness = brightness * glowIntensity;
        
        vec3 pos = position;
        
        // Simple orbital motion (original behavior)
        float orbitRadius = length(pos.xz);
        float angle = atan(pos.z, pos.x) + velocity.z * time * 0.1;
        pos.x = orbitRadius * cos(angle);
        pos.z = orbitRadius * sin(angle);
        
        pos.y += velocity.y * time * 0.1;
        
        // Add oscillation for natural movement
        pos.x += oscillation.x * sin(time * oscillation.y + oscillation.z);
        pos.y += oscillation.x * 0.5 * cos(time * oscillation.y * 1.3 + oscillation.z);
        pos.z += oscillation.x * sin(time * oscillation.y * 0.8 + oscillation.z);
        
        // Apply black hole gravitational effects (same as enhanced version)
        vec3 gravitationalForce = vec3(0.0);
        
        for(int i = 0; i < 10; i++) {
            if(i >= blackHoleCount) break;
            
            vec3 toBlackHole = blackHolePositions[i] - pos;
            float distance = length(toBlackHole);
            
            if(distance > blackHoleInfluenceRadius) continue;
            
            float forceMagnitude = gravitationalStrength * blackHoleMasses[i] * mass / (distance * distance + 0.1);
            float falloff = 1.0 - smoothstep(0.0, blackHoleInfluenceRadius, distance);
            forceMagnitude *= falloff;
            
            gravitationalForce += normalize(toBlackHole) * forceMagnitude;
        }
        
        pos += gravitationalForce * time * 0.005;
        
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = size * (300.0 / -mvPosition.z) * glowIntensity;
        gl_Position = projectionMatrix * mvPosition;
    }
`;

const compatibilityFragmentShader = `
    varying vec3 vColor;
    varying float vBrightness;
    
    void main() {
        // Calculate distance from center of particle
        vec2 center = gl_PointCoord - vec2(0.5);
        float distance = length(center);
        
        // Discard pixels outside the particle circle
        if (distance > 0.5) discard;
        
        // Create soft glow effect
        float alpha = 1.0 - (distance * 2.0);
        alpha = pow(alpha, 2.0);
        
        // Add bright core effect
        float core = 1.0 - (distance * 4.0);
        core = max(0.0, core);
        core = pow(core, 3.0);
        
        // Combine glow and core effects
        alpha += core;
        alpha *= vBrightness;
        
        // Output final color with alpha
        gl_FragColor = vec4(vColor, alpha);
    }
`;

/**
 * Helper function to check shader compilation
 * @param {WebGLRenderingContext} gl - WebGL context
 * @param {WebGLShader} shader - Shader to check
 * @param {string} type - Shader type for logging
 * @returns {boolean} - Whether compilation was successful
 */
function checkShaderCompilation(gl, shader, type) {
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(`Shader compilation error (${type}):`, gl.getShaderInfoLog(shader));
        eventBus.emit('shader-compilation-error', { type, error: gl.getShaderInfoLog(shader) });
        return false;
    }
    return true;
}

/**
 * Create galaxy shader material with enhanced features
 * @param {Object} galaxyData - Galaxy data from server
 * @returns {THREE.ShaderMaterial} - The shader material
 */
export function createGalaxyShaderMaterial(galaxyData) {
    // Prepare default uniforms that work for both enhanced and basic shaders
    const baseUniforms = {
        time: { value: 0.0 },
        glowIntensity: { value: 0.6 },
        blackHoleCount: { value: 0 },
        blackHolePositions: { value: new Float32Array(30) }, // Max 10 black holes * 3 components
        blackHoleMasses: { value: new Float32Array(10) },
        gravitationalStrength: { value: 1.0 },
        blackHoleInfluenceRadius: { value: 15.0 }
    };
    
    // Enhanced uniforms for galaxy physics (with fallbacks)
    const enhancedUniforms = {
        ...baseUniforms,
        patternSpeed: { value: galaxyData?.metadata?.patternSpeed || 25.0 },
        galaxyRadius: { value: galaxyData?.metadata?.galaxyRadius || 50.0 },
        maxRotationSpeed: { value: galaxyData?.metadata?.maxRotationSpeed || 220.0 },
        armPitch: { value: galaxyData?.metadata?.armPitch || 0.25 },
        armCount: { value: galaxyData?.metadata?.armCount || 2 },
        armStrength: { value: galaxyData?.metadata?.armStrength || 1.0 }
    };
    
    try {
        // First try the enhanced shaders
        const material = new THREE.ShaderMaterial({
            vertexShader: enhancedVertexShader,
            fragmentShader: enhancedFragmentShader,
            uniforms: enhancedUniforms,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        console.log('✅ Created enhanced galaxy shader with density wave physics');
        eventBus.emit('enhanced-shader-created');
        return material;
        
    } catch (error) {
        console.warn('⚠️ Enhanced shaders failed, trying compatibility mode:', error);
        eventBus.emit('shader-error', { type: 'enhanced', error });
        
        try {
            // Fallback to compatibility shaders
            const material = new THREE.ShaderMaterial({
                vertexShader: compatibilityVertexShader,
                fragmentShader: compatibilityFragmentShader,
                uniforms: baseUniforms,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });
            
            console.log('✅ Created compatibility galaxy shader');
            eventBus.emit('compatibility-shader-created');
            return material;
            
        } catch (fallbackError) {
            console.error('❌ All shader creation attempts failed:', fallbackError);
            eventBus.emit('shader-error', { type: 'compatibility', error: fallbackError });
            
            // Last resort: use basic THREE.js material
            const basicMaterial = new THREE.PointsMaterial({
                color: 0xffffff,
                size: 2,
                transparent: true,
                blending: THREE.AdditiveBlending
            });
            
            eventBus.emit('basic-material-fallback-used');
            return basicMaterial;
        }
    }
}

// Export shaders for direct access if needed
export { enhancedVertexShader, enhancedFragmentShader, compatibilityVertexShader, compatibilityFragmentShader };
