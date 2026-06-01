// =============================================================================
// scene.js — Declarative scene description
// =============================================================================
// All positions are world-space coordinates.  The origin (0, 0) aligns with
// the grid by default — the cross at (0,0) is intentional so that tiles snap
// cleanly to grid intersections.
//
// Tile / image geometry uses the tile unit (= 2 × cellSize) as a base measure
// so that objects stay grid-aligned regardless of cellSize.
// =============================================================================

import { state } from './config.js';
import { LINKS  } from './config.js';

export function buildScene() {
    const cell = state.cellSize;
    const tile = cell * 2; // one "tile" = one main-grid cell

    return {
        /**
         * tiles — solid coloured cards.
         * Each entry: { id, x, y, w, h, color, shadow?, href? }
         * x/y  = world-space centre
         * w/h  = full width/height (halved internally before drawing)
         */
        tiles: [
            {
                id:     'title',
                x:      0,
                y:      0,
                w:      tile,
                h:      tile,
                color:  [1, 0, 0, 1],
                shadow: true,
            },
            // Uncomment and configure more tiles as needed:
            // { id: 'github', x: tile * 1.5, y: -tile * 0.5, w: tile, h: tile, color: [1,1,1,1], shadow: true, href: LINKS.github },
            // { id: 'email',  x: tile * 1.5, y:  tile * 1.2, w: tile, h: tile, color: [1,1,1,1], shadow: true, href: LINKS.email  },
        ],

        /**
         * images — textured quads drawn over (or instead of) tiles.
         * Each entry: { x, y, w, h, textureKey }
         * The renderer fits the texture inside [w/2 × h/2] preserving aspect.
         */
        images: [
            { x: -0.3 * tile, y: -0.38 * tile, w: 13.5 / 4 * tile, h: 5.7 / 4 * tile, textureKey: 'matt' },
        ],

        /**
         * text — pre-rasterised text labels.
         * Each entry: { x, y, textKey }
         * The renderer looks up the texture size automatically.
         */
        text: [],

        /**
         * wires — polylines drawn in world space.
         * Each entry: { points: [[x,y], …], color: [r,g,b,a] }
         */
        wires: [
            { points: [[-0.75 * tile ,0], [1 * tile,4 * tile]], color: [0,1,0,1] }
        ],
    };
}

/**
 * Returns the first tile under world-space point (x, y) that has an `href`,
 * or null if no such tile is hit.
 */
export function findInteractiveTile(tiles, x, y) {
    for (const tile of tiles) {
        if (!tile.href) continue;
        const hw = tile.w ;
        const hh = tile.h;
        if (x >= tile.x - hw && x <= tile.x + hw &&
            y >= tile.y - hh && y <= tile.y + hh) {
            return tile;
        }
    }
    return null;
}
