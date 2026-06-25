// =============================================================================
// config.js — Shared state and configuration constants
// =============================================================================

export const LINKS = {
    github: 'https://github.com/',
    email:  'mailto:hello@example.com',
    uu:     '/uu',
};

// semi-Isometric projection matrix (world → screen-iso)
//export const ISO = { a: 1, b: -0.5, c: 0.3, d: 0.5 };

//full Isometric projection matrix (world → screen-iso)
//export const ISO = { a: 1, b: -1, c: 0.5, d: 0.5 };

//no rotation projection matrix (world → screen-iso)
export const ISO = { a: 1, b: 0, c: 0, d: 1 };

/**
 * Runtime state. Everything that can change lives here.
 *
 * gridOffset: shifts the grid lines in world space without moving tiles or
 *             wires. Because (0,0) is the natural intersection of all grid
 *             lines, set gridOffset to { x: 0, y: 0 } to have a cross at the
 *             origin, or tweak it to reposition the whole grid pattern.
 */
export const state = {
    dpr:            Math.min(window.devicePixelRatio || 1, 2),
    camera:         { x: 0, y: 0 },
    zoom:           1,
    cellSize:       40,
    crossThickness: 0.3,
    gridOffset:     { x: 0, y: 0 },  // ← new: shift grid lines in world units
    isDragging:     false,
    lastPointer:    { x: 0, y: 0 },
    debugImages:    false,            // overlay red/green debug boxes on images
};
