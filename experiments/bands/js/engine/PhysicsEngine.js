// PhysicsEngine.js - Wrapper for Matter.js physics engine
// Handles all physics simulation aspects

export class PhysicsEngine {
    constructor(width, height) {
        // Create Matter.js engine
        this.engine = Matter.Engine.create();
        this.world = this.engine.world;
        
        // Configure physics settings
        this.world.gravity.x = 0; // No gravity for 2D space simulation
        this.world.gravity.y = 0;
        
        // Improve collision detection
        this.engine.enableSleeping = false; // Keep all bodies active
        this.engine.constraintIterations = 4; // More iterations for stability
        this.engine.positionIterations = 8;   // More iterations for accuracy
        this.engine.velocityIterations = 6;   // More iterations for velocity
        
        // Set collision detection to continuous for better accuracy
        Matter.Resolver._restingThresh = 0.001; // Lower threshold for resting detection
        
        // Reduce time scaling to prevent physics explosions
        this.engine.timing.timeScale = 0.9; // Slightly slow down time for stability
        
        // Store dimensions
        this.width = width;
        this.height = height;
        
        // Create boundaries
        this.boundaries = [];
        this.createBoundaries();
        
        console.log('Physics engine initialized');
    }
    
    /**
     * Create invisible boundary walls
     */
    createBoundaries() {
        // Clear existing boundaries
        if (this.boundaries.length > 0) {
            Matter.World.remove(this.world, this.boundaries);
            this.boundaries = [];
        }
        
        const thickness = 100; // Increased thickness for better collision detection
        
        // Create boundary walls with high restitution
        const boundaryOptions = {
            isStatic: true,
            restitution: 0.85, // Slightly reduced from 0.9 to prevent too much speed gain
            friction: 0.1,     // Reduced from 0.2 for smoother bounces
            density: 1000,     // High density to be immovable
            slop: 0.05         // Match band slop for consistency
        };
        
        this.boundaries = [
            // Top wall (positioned just outside visible area)
            Matter.Bodies.rectangle(
                this.width / 2, -thickness / 2, 
                this.width + thickness * 2, thickness, 
                { ...boundaryOptions, label: 'boundary-top' }
            ),
            // Bottom wall
            Matter.Bodies.rectangle(
                this.width / 2, this.height + thickness / 2, 
                this.width + thickness * 2, thickness, 
                { ...boundaryOptions, label: 'boundary-bottom' }
            ),
            // Left wall
            Matter.Bodies.rectangle(
                -thickness / 2, this.height / 2, 
                thickness, this.height + thickness * 2, 
                { ...boundaryOptions, label: 'boundary-left' }
            ),
            // Right wall
            Matter.Bodies.rectangle(
                this.width + thickness / 2, this.height / 2, 
                thickness, this.height + thickness * 2, 
                { ...boundaryOptions, label: 'boundary-right' }
            )
        ];
        
        // Add boundaries to world
        Matter.World.add(this.world, this.boundaries);
    }
    
    /**
     * Update boundaries when canvas resizes
     * @param {number} width - New width
     * @param {number} height - New height
     */
    updateBoundaries(width, height) {
        this.width = width;
        this.height = height;
        this.createBoundaries();
    }
    
    /**
     * Add a wiggly band to the physics world
     * @param {WigglyBand} band - The band to add
     */
    addBand(band) {
        if (band.body) {
            Matter.World.add(this.world, band.body);
            console.log(`Band added to physics world. Total bodies: ${this.getBodies().length}`);
        }
    }
    
    /**
     * Remove a wiggly band from the physics world
     * @param {WigglyBand} band - The band to remove
     */
    removeBand(band) {
        if (band.body) {
            Matter.World.remove(this.world, band.body);
        }
    }
    
    /**
     * Apply a force to a band
     * @param {WigglyBand} band - The band to apply force to
     * @param {Object} force - Force vector {x, y}
     */
    applyForce(band, force) {
        if (band.body && (Math.abs(force.x) > 0.0001 || Math.abs(force.y) > 0.0001)) {
            // Apply force directly without scaling
            Matter.Body.applyForce(band.body, band.body.position, force);
        }
    }
    
    /**
     * Update the physics simulation
     * @param {number} deltaTime - Time elapsed in seconds
     */
    update(deltaTime) {
        // Update the engine
        // Use a fixed timestep for stability, but clamp deltaTime to prevent spiral of death
        const fixedTimeStep = 1000 / 60; // 60 FPS in milliseconds
        const maxDelta = fixedTimeStep * 1.5; // Don't allow more than 1.5 frames worth
        const clampedDelta = Math.min(fixedTimeStep, maxDelta);
        
        // The timeScale is already applied in the engine settings
        Matter.Engine.update(this.engine, clampedDelta);
    }
    
    /**
     * Get all bodies in the world
     * @returns {Array} Array of Matter.js bodies
     */
    getBodies() {
        return Matter.Composite.allBodies(this.world);
    }
    
    /**
     * Clear all non-boundary bodies from the world
     */
    clearBodies() {
        const bodies = this.getBodies();
        const bodiesToRemove = bodies.filter(body => 
            !body.label || !body.label.startsWith('boundary-')
        );
        Matter.World.remove(this.world, bodiesToRemove);
    }
}