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
                x:      -0.5 * tile,
                y:      -0.5 * tile,
                w:      tile,
                h:      tile,
                color:  [1, 0, 0, 0.1],
                shadow: false,
            },
            // Uncomment and configure more tiles as needed:
            { id: 'github', x: tile * 5.5, y: -tile * 0.5, w: tile, h: tile, color: [1,1,1,0], shadow: false, href: LINKS.github },
            { id: 'email',  x: tile * 7, y:  -tile * 0.5, w: tile, h: tile, color: [1,1,1,0], shadow: false, href: LINKS.email  },
            { id: 'uu',  x: tile * -1, y: tile * 4, w: tile * 2, h: tile * 2, color: [1,1,1,0], shadow: false, href: LINKS.uu },
        ],

        /**
         * images — textured quads drawn over (or instead of) tiles.
         * Each entry: { x, y, w, h, textureKey }
         * The renderer fits the texture inside [w/2 × h/2] preserving aspect.
         */
        images: [
            { x: -0.3 * tile, y: -0.38 * tile, w: 13.5 / 4 * tile, h: 5.7 / 4 * tile, textureKey: 'matt' },
            { x: tile * 6, y: 0, w: tile / 2, h: tile / 2, textureKey: 'github' },
            { x: tile * 7.5, y:  0, w: tile / 2, h: tile / 2, textureKey: 'email' },
            { x: 0, y: 5 * tile, w: tile, h: tile, textureKey: 'uu' },
        ],

        /**
         * text — pre-rasterised text labels.
         * Each entry: { x, y, textKey }
         * The renderer looks up the texture size automatically.
         */
        text: [
            { x: 6.95 * tile, y: -1.2 * tile , textKey: 'contact_gray' },
            { x: 6.9 * tile, y: -1.25 * tile , textKey: 'contact' },
        ],

        /**
         * wires — polylines drawn in world space.
         * Each entry: { points: [[x,y], …], color: [r,g,b,a] }
         */
        wires: []
    };
}

/**
 * Returns the first tile under world-space point (x, y) that has an `href`,
 * or null if no such tile is hit.
 */
export function findInteractiveTile(tiles, x, y) {
    for (const tile of tiles) {
        if (!tile.href) continue;
        const left = tile.x;
        const right = tile.x + tile.w;
        const top = tile.y;
        const bottom = tile.y + tile.h;

        if (x >= left && x <= right && y >= top && y <= bottom) {
            return tile;
        }
    }
    return null;
}
