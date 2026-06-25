// =============================================================================
// index.js — Entry point
// Wires together config, shaders, buffers, assets, input, and the render loop.
// =============================================================================

import { ISO, state }                               from './config.js';
import { invert2x2, easeInOut, animate }            from './math.js';
import { QUAD_VERT, QUAD_FRAG, GRID_VERT, GRID_FRAG, createProgram } from './shaders.js';
import { loadTexture, loadSvgAsTexture, createTextTexture }          from './textures.js';
import { createQuadGeometry, createScreenQuadGeometry,
         drawRect, drawTexture, drawLineStrip }     from './renderer.js';
import { buildScene, findInteractiveTile }          from './scene.js';

// =============================================================================
// Bootstrap WebGL
// =============================================================================

const canvas = document.getElementById('scene');
const gl     = canvas.getContext('webgl2', { antialias: true, alpha: false });
if (!gl) throw new Error('WebGL2 is required.');

gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

// Pre-compute the inverse iso matrix once; it's used in both the CPU-side
// screen→world helpers and the grid fragment shader.
const ISO_INV = invert2x2(ISO);

// =============================================================================
// Programs
// =============================================================================

const quadProgram = createProgram(gl, QUAD_VERT, QUAD_FRAG);
const gridProgram = createProgram(gl, GRID_VERT, GRID_FRAG);

// =============================================================================
// Geometry
// =============================================================================

const { vao: quadVao, vbo: quadVbo } = createQuadGeometry(gl, quadProgram);
const { vao: screenVao }             = createScreenQuadGeometry(gl, gridProgram);

// =============================================================================
// Scene & Assets
// =============================================================================

const scene  = buildScene();
const assets = { textures: {}, texts: {} };

Promise.all([
    loadTexture(gl,      'images/zermos_logo.png'),
    loadTexture(gl,      'images/uu.png'),
    loadTexture(gl,      'images/github.png'),
    loadTexture(gl,      'images/email.png'),
    loadSvgAsTexture(gl, 'images/matt_logo.svg', 1600),
]).then(([logo, uu, github, email, matt]) => {
    assets.textures.logo   = logo;
    assets.textures.github = github;
    assets.textures.email  = email;
    assets.textures.matt   = matt;
    assets.textures.uu   = uu;

    assets.texts.title    = createTextTexture(gl, 'PORTFOLIO', 84, '#333', 'Segoe UI');
    assets.texts.subtitle = createTextTexture(gl, 'Drag to explore. Press R to recenter.', 18, '#555', 'Segoe UI');
    assets.texts.github   = createTextTexture(gl, 'GitHub', 28, '#333', 'Segoe UI');
    assets.texts.email    = createTextTexture(gl, 'Email',  28, '#333', 'Segoe UI');
    assets.texts.contact    = createTextTexture(gl, 'Contact',  28, '#333', 'Segoe UI');
    assets.texts.contact_gray    = createTextTexture(gl, 'Contact',  28, '#999', 'Segoe UI');

    requestAnimationFrame(renderLoop);
});

// =============================================================================
// Render loop
// =============================================================================

function renderLoop() {
    gl.clearColor(0.9725, 0.9725, 0.9725, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    drawGrid();
    drawWires();
    drawTiles();

    requestAnimationFrame(renderLoop);
}

// --- Pass uniforms shared by all quad draws ---------------------------------
function bindQuadUniforms() {
    const u = quadProgram.uniforms;
    gl.uniform4f(u.u_iso,      ISO.a, ISO.b, ISO.c, ISO.d);
    gl.uniform2f(u.u_camera,   state.camera.x, state.camera.y);
    gl.uniform1f(u.u_zoom,     state.zoom * state.dpr);
    gl.uniform2f(u.u_viewport, canvas.width, canvas.height);
}

function drawGrid() {
    gl.useProgram(gridProgram.program);
    gl.bindVertexArray(screenVao);

    const u = gridProgram.uniforms;
    gl.uniform2f(u.u_viewport,       canvas.width, canvas.height);
    gl.uniform4f(u.u_invIso,         ISO_INV.a, ISO_INV.b, ISO_INV.c, ISO_INV.d);
    gl.uniform2f(u.u_camera,         state.camera.x, state.camera.y);
    gl.uniform1f(u.u_zoom,           state.zoom * state.dpr);
    gl.uniform1f(u.u_cellSize,       state.cellSize);
    gl.uniform1f(u.u_crossThickness, state.crossThickness);
    gl.uniform2f(u.u_gridOffset,     state.gridOffset.x, state.gridOffset.y);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function drawTiles() {
    gl.useProgram(quadProgram.program);
    gl.bindVertexArray(quadVao);
    bindQuadUniforms();

    // Converts a top-left (x, y) + full (w, h) into the centre coords the
    function tlToCenter(x, y, w, h) {
        return { cx: x + w / 2, cy: y + h / 2 };
    }

    // Solid tiles
    for (const tile of scene.tiles) {
        const hw = tile.w;
        const hh = tile.h;
        const { cx, cy } = tlToCenter(tile.x, tile.y, tile.w, tile.h);

        if (tile.shadow) {
            drawRect(gl, quadVbo, quadProgram.uniforms,
                cx + 6, cy + 6, hw / 2, hh / 2, [0, 0, 0, 0.08]);
        }
        drawRect(gl, quadVbo, quadProgram.uniforms,
            cx, cy, hw / 2, hh / 2, tile.color);
    }

    // --- Image / texture quads -----------------------------------------------
    for (const image of scene.images) {
        const texInfo = assets.textures[image.textureKey];
        if (!texInfo) continue;

        const tex  = texInfo.texture ?? texInfo;
        const boxW = image.w;
        const boxH = image.h;

        // Fit texture inside the requested box while preserving aspect ratio.
        let finalW = boxW;
        let finalH = boxH;
        if (texInfo.width && texInfo.height) {
            const aspect = texInfo.width / texInfo.height;
            if (boxW / boxH > aspect) {
                finalH = boxH;
                finalW = boxH * aspect;
            } else {
                finalW = boxW;
                finalH = boxW / aspect;
            }
        }

        if (state.debugImages) {
            // Red = requested box, green = aspect-fitted box.
            drawRect(gl, quadVbo, quadProgram.uniforms, image.x, image.y, boxW,   boxH,   [1, 0, 0, 0.12]);
            drawRect(gl, quadVbo, quadProgram.uniforms, image.x, image.y, finalW, finalH, [0, 1, 0, 0.12]);
        }

        drawTexture(gl, quadVbo, quadProgram.uniforms,
            image.x, image.y, finalW, finalH, tex, [1, 1, 1, 1]);
    }

    // --- Text labels ---------------------------------------------------------
    for (const label of scene.text) {
        const tex = assets.texts[label.textKey];
        if (!tex) continue;
        drawTexture(gl, quadVbo, quadProgram.uniforms,
            label.x, label.y, tex.width, tex.height, tex.texture, [1, 1, 1, 1]);
    }
}

function drawWires() {
    gl.useProgram(quadProgram.program);
    gl.bindVertexArray(quadVao);
    bindQuadUniforms();
    gl.uniform1f(quadProgram.uniforms.u_useTexture, 0.0);

    for (const wire of scene.wires) {
        const [r, g, b, a] = wire.color;
        gl.uniform4f(quadProgram.uniforms.u_color, r, g, b, a);
        drawLineStrip(gl, quadVbo, wire.points);
    }
}

// =============================================================================
// Coordinate helpers
// =============================================================================

/** Converts a CSS pixel position to world coordinates. */
function screenToWorld(screenX, screenY) {
    const dx   = screenX * state.dpr - canvas.width  / 2;
    const dy   = screenY * state.dpr - canvas.height / 2;
    const isoX = dx / (state.zoom * state.dpr);
    const isoY = dy / (state.zoom * state.dpr);
    return {
        x: isoX * ISO_INV.a + isoY * ISO_INV.b + state.camera.x,
        y: isoX * ISO_INV.c + isoY * ISO_INV.d + state.camera.y,
    };
}

/** Converts a CSS-pixel drag delta to a world-space delta. */
function screenDeltaToWorld(dx, dy) {
    const isoX = dx / state.zoom;
    const isoY = dy / state.zoom;
    return {
        x: isoX * ISO_INV.a + isoY * ISO_INV.b,
        y: isoX * ISO_INV.c + isoY * ISO_INV.d,
    };
}

// =============================================================================
// Input handling
// =============================================================================

canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    state.isDragging        = true;
    state.lastPointer.x     = e.clientX;
    state.lastPointer.y     = e.clientY;
    canvas.setPointerCapture?.(e.pointerId);
});

canvas.addEventListener('pointermove', (e) => {
    if (state.isDragging) {
        const dx = e.clientX - state.lastPointer.x;
        const dy = e.clientY - state.lastPointer.y;
        state.lastPointer.x = e.clientX;
        state.lastPointer.y = e.clientY;

        const delta      = screenDeltaToWorld(dx, dy);
        state.camera.x  -= delta.x;
        state.camera.y  -= delta.y;
    }

    const world   = screenToWorld(e.clientX, e.clientY);
    const hovered = findInteractiveTile(scene.tiles, world.x, world.y);
    canvas.style.cursor = hovered
        ? 'pointer'
        : (state.isDragging ? 'grabbing' : 'grab');

    //based on hovered, show a simple tooltip at the mouse showing what it is
});

canvas.addEventListener('pointerup', (e) => {
    state.isDragging = false;
    canvas.releasePointerCapture?.(e.pointerId);
});

canvas.addEventListener('click', (e) => {
    const world = screenToWorld(e.clientX, e.clientY);
    const hit   = findInteractiveTile(scene.tiles, world.x, world.y);
    if (hit?.href) window.open(hit.href, '_blank', 'noopener');
});

window.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') {
        // Smoothly animate the camera back to the origin.
        const start = { x: state.camera.x, y: state.camera.y };
        animate(500, (t) => {
            const ease    = easeInOut(t);
            state.camera.x = start.x * (1 - ease);
            state.camera.y = start.y * (1 - ease);
        });
    }
});

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function resizeCanvas() {
    state.dpr      = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width   = Math.floor(canvas.clientWidth  * state.dpr);
    canvas.height  = Math.floor(canvas.clientHeight * state.dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
}
