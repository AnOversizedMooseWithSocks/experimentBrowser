# Galaxy Generator - User Documentation

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [User Interface Overview](#user-interface-overview)
4. [Galaxy Generation](#galaxy-generation)
5. [Camera Navigation](#camera-navigation)
6. [Star Systems](#star-systems)
7. [Black Hole Physics](#black-hole-physics)
8. [Post-Processing Effects](#post-processing-effects)
9. [Scientific Concepts](#scientific-concepts)
10. [Advanced Features](#advanced-features)
11. [Keyboard Shortcuts Reference](#keyboard-shortcuts-reference)

## Introduction

The Galaxy Generator is an interactive simulation that allows you to explore and generate realistic 3D spiral galaxies based on actual astrophysical principles. It combines accurate physics simulations with stunning visuals to create an educational and engaging experience.

The simulator demonstrates key astronomical concepts such as:
- Density wave theory of spiral arm formation
- Differential rotation of galactic structures
- Gravitational effects of black holes
- Different stellar populations within galaxies
- Hubble classification of galaxy types

Whether you're an astronomy enthusiast, a student, or just curious about the cosmos, this tool offers an accessible way to visualize and understand galactic structures and dynamics.

## Getting Started

When you first open the Galaxy Generator, you'll see a loading screen as the application initializes the physics engine and 3D renderer. Once loaded, you'll be presented with a randomly generated galaxy and the main control panel on the left side.

To begin exploring:

1. The camera automatically orbits and gives you different views of the galaxy
2. Use your mouse to manually control the camera if desired
3. Generate a new galaxy by clicking the "Random Seed" button
4. Explore the star systems by clicking on visible stars
5. Adjust animation speed, zoom, and effects using the sliders

If the UI panel is hidden, press the **Space** key or click the gear icon (⚙️) in the top-left corner to display it.

## User Interface Overview

The Galaxy Generator interface has several key components:

### Main UI Panel

Located on the left side of the screen, this panel contains all the controls for generating and customizing galaxies:

- **Galaxy Generation**: Controls for creating galaxies with specific seeds
- **Rating System**: Rate and favorite interesting galaxies
- **Animation Controls**: Adjust speed, zoom level, and star brightness
- **Black Hole Physics**: Toggle and adjust black hole gravitational effects
- **Post-Processing**: Visual enhancement effects
- **Screenshot Tools**: Capture still images of your galaxies
- **Galaxy Information**: Technical details about the current galaxy
- **Keyboard Shortcuts**: Quick reference for controls
- **Favorites List**: Access saved galaxies

### Galaxy Analysis Overlay

Access this by pressing **G** or clicking the analysis button. This overlay provides detailed information about the current galaxy:

- **Physical Properties**: Rotation speed, pattern speed, arm pitch, galaxy radius
- **Stellar Populations**: Distribution of different star types
- **Structure**: Galaxy type, spiral arm count, black hole information

### Star Information Overlay

This appears when you click on a star, showing:

- **Stellar Properties**: Star class, temperature, mass, age, etc.
- **Galactic Position**: Location within the galaxy
- **Planetary System**: Information about any planets orbiting the star

## Galaxy Generation

### Creating Galaxies

You can generate galaxies in two ways:

1. **Random Generation**: Click the "Random Seed" button or press **R** to create a completely random galaxy

2. **Seed-Based Generation**: Enter a text string in the "Galaxy Seed" field and click "Generate Galaxy". Using the same seed will always produce identical galaxies, allowing you to share interesting finds with others.

### Understanding Galaxy Types

The generator creates galaxies based on the Hubble classification system:

- **Spiral Galaxies (Sa/Sb/Sc)**: Standard spiral galaxies with varying arm tightness
- **Barred Spiral Galaxies (SBa/SBb/SBc)**: Spiral galaxies with a central bar structure

The galaxy type is displayed at the top of the UI panel and provides information about the structural characteristics of the generated galaxy.

### Saving Favorites

When you find an interesting galaxy:

1. Optionally enter a custom name in the "Name this galaxy" field
2. Click "Add to Favorites"
3. Rate the galaxy using the star rating system (1-5 stars)

Saved galaxies appear in the Favorites list at the bottom of the UI panel. Click on any favorite to instantly load that galaxy.

## Camera Navigation

### Automatic Camera

By default, the camera orbits around the galaxy automatically, showing different angles and perspectives. The camera will cycle through several patterns:

- **Classic Orbital**: Simple orbit around the galaxy
- **Galaxy-Synced**: Rotation synchronized with the galaxy's movement
- **Star Tracking**: Focus on individual stars (when enabled)
- **Spiral Approach**: Gradually spirals in toward the galactic center

Press **V** to manually cycle between these patterns.

### Manual Camera Control

To take control of the camera yourself:

1. Press **M** to toggle manual camera mode
2. Use the following controls:
   - **Left Mouse Button + Drag**: Rotate the camera
   - **Right Mouse Button + Drag**: Pan the camera
   - **Mouse Wheel**: Zoom in/out

The camera will return to automatic mode after 3 seconds of inactivity unless you keep interacting with it.

## Star Systems

The Galaxy Generator creates detailed star systems within the galaxy. Each star has realistic properties and potentially its own planetary system.

### Selecting Stars

To view information about a star:

1. Click directly on a star in the galaxy view
2. Press **S** to select a random visible star

### Star Information

When you select a star, the Star Information overlay appears, showing:

- **Star Class**: The spectral classification (O, B, A, F, G, K, M)
- **Temperature**: Surface temperature in Kelvin
- **Mass**: Star's mass relative to our Sun
- **Radius**: Star's radius relative to our Sun
- **Luminosity**: Brightness relative to our Sun
- **Age**: Star's age in billions of years
- **Population Type**: Which stellar population the star belongs to (bulge, disk, young arm, or halo)

### Planetary Systems

Stars may have planetary systems with various planet types:
- Rocky planets
- Gas giants
- Ocean worlds
- Ice giants

The overlay will indicate if any planets are within the star's habitable zone, where liquid water could potentially exist.

### Star Tracking

To focus the camera on a specific star:

1. Select a star
2. Click "Track Star" in the star information panel
3. The camera will continuously follow this star as it orbits within the galaxy

Press **T** to toggle star tracking while a star is selected.

## Black Hole Physics

The Galaxy Generator simulates the gravitational effects of black holes on nearby stars.

### Black Hole Types

Two types of black holes may appear in the simulation:

1. **Supermassive Black Hole**: Located at the galactic center, with enormous mass and gravitational influence
2. **Stellar Mass Black Holes**: Smaller black holes distributed throughout the galaxy

### Gravitational Effects

Black holes affect the motion of nearby stars, creating distinctive patterns in stellar orbits. You can observe these effects by:

1. Enabling black hole effects using the "Toggle Black Holes" button or pressing **B**
2. Adjusting the "Gravity" slider to control the strength of gravitational effects
3. Adjusting the "Influence" slider to set how far the gravitational effects reach

### Black Hole Information

To see details about the black holes in your galaxy:

1. Press **J** or click the "Black Hole Info" button
2. The status will display information about the number and types of black holes
3. Check the console for more detailed positioning and mass information

## Post-Processing Effects

The Galaxy Generator includes visual enhancements to make the simulation more immersive.

### Available Effects

1. **Basic Post-Processing**: Overall enhanced visual quality
2. **Afterimage Effect**: Creates trailing effects behind moving stars, enhancing the perception of motion

### Adjusting Effects

- Toggle effects on/off using the corresponding buttons
- Adjust the "Afterimage" slider to control the persistence of motion trails
- Press **E** to toggle post-processing effects
- Press **A** to toggle the afterimage effect specifically

## Scientific Concepts

The Galaxy Generator demonstrates several important astrophysical principles:

### Density Wave Theory

The spiral arms in galaxies aren't fixed structures - they're density waves that move through the galaxy. Stars and gas move through these waves, temporarily becoming part of a spiral arm before continuing their orbit.

Observe this by:
1. Watching how individual stars move through the spiral arms
2. Tracking specific stars to see them enter and exit spiral arm regions

### Differential Rotation

In real galaxies, stars closer to the center orbit faster than those at the outer edges. This differential rotation is accurately simulated in the Galaxy Generator.

To observe this:
1. Select stars at different distances from the galactic center
2. Compare their orbital periods in the star information panel
3. Notice how inner stars complete orbits faster than outer stars

### Stellar Populations

Galaxies contain different populations of stars with varying ages, colors, and distributions:

1. **Bulge Stars**: Older, redder stars concentrated in the galactic center
2. **Disk Stars**: Intermediate-age stars forming most of the galactic disk
3. **Young Arm Stars**: Young, hot, blue stars predominantly found in spiral arms
4. **Halo Stars**: Very old stars in the sparse outer halo

Select different stars to see which population they belong to and observe their different characteristics.

### Hubble Classification System

Galaxies are classified according to the Hubble sequence based on their visual appearance:

- **Sa** galaxies have tightly wound spiral arms and a large central bulge
- **Sb** galaxies have moderately wound arms and a medium-sized bulge
- **Sc** galaxies have loose spiral arms and a small bulge
- **SBa/SBb/SBc** variants include a central bar structure

Generate different galaxies to observe these various types in the simulation.

## Advanced Features

### Galaxy Analysis

For a deeper understanding of your current galaxy:

1. Press **G** or click the analysis button
2. Examine the detailed physical properties, stellar population breakdown, and structural information
3. Use this information to better understand the relationships between different galactic properties

### Screenshots

Capture images of interesting galaxies:

1. Standard screenshots: Press **Shift+C** or click "Take Screenshot"
2. High-resolution screenshots: Press **Ctrl+Shift+C** or click "High-Res (2x)"

Screenshots are automatically saved to your computer.

### Performance Monitoring

The Performance panel at the bottom of the UI displays:
- Current FPS (frames per second)
- Galaxy type
- Particle count
- Draw calls and memory usage
- Black hole count and arm count

This information can help you understand the rendering demands of different galaxy configurations.

## Keyboard Shortcuts Reference

### General Controls
- **Space**: Toggle UI panel
- **P**: Pause/resume animation
- **R**: Generate random galaxy
- **H**: Display help information
- **G**: Toggle galaxy analysis overlay
- **I**: Toggle galaxy information panel

### Camera Controls
- **M**: Toggle manual camera mode
- **V**: Cycle camera patterns
- **O**: Toggle camera auto-rotation

### Star Controls
- **S**: Select random star
- **T**: Toggle star tracking
- **Escape**: Close star information

### Effects Controls
- **B**: Toggle black hole effects
- **J**: Show black hole information
- **E**: Toggle post-processing
- **A**: Toggle afterimage effect

### Screenshot Controls
- **Shift+C**: Take screenshot
- **Ctrl+Shift+C**: Take high-resolution screenshot

### Rating Controls
- **1-5 Keys**: Quickly rate the current galaxy

## Learning with the Galaxy Generator

### Educational Applications

The Galaxy Generator can be used as an educational tool in several ways:

1. **Illustrating Astronomical Concepts**: Visualize abstract concepts like density waves and differential rotation
2. **Exploring Stellar Life Cycles**: Compare different star types and their properties
3. **Understanding Galaxy Classification**: Generate and compare different galaxy types
4. **Visualizing Black Hole Effects**: Observe how black holes affect nearby stars

### Projects and Explorations

Try these activities to learn more about galaxies:

1. **Comparative Study**: Generate several galaxies and compare their structures, stellar populations, and black hole distributions
2. **Stellar Evolution Study**: Find stars of different ages and compare their properties
3. **Pattern Speed Analysis**: Observe how changing the pattern speed affects spiral arm structure
4. **Gravitational Influence**: Experiment with black hole gravity settings and observe the effects

### Sharing Discoveries

When you find an interesting galaxy:
1. Save it to your favorites with a descriptive name
2. Take a screenshot to share with others
3. Note the seed value, which allows others to generate the exact same galaxy

This collaborative approach allows for shared discoveries and discussions about unique galactic formations.
