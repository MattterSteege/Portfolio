const canvas = document.getElementById('scene');
const gl = canvas.getContext('webgl2', { antialias: true, alpha: false });

if (!gl) {
    throw new Error('WebGL2 is required to render the canvas scene.');
}

// --- Configuration -----------------------------------------------------------
const LINKS = {
    github: 'https://github.com/',
    email: 'mailto:hello@example.com',
};

const state = {
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    camera: { x: 0, y: 0 },
    zoom: 1,
    cellSize: 40,
    crossThickness: 0.6,
    isDragging: false,
    lastPointer: { x: 0, y: 0 },
    showSubgrid: true,
    debugImages: false, // toggle visual debug for image boxes
};

// Isometric projection (2x2 matrix)
const BASE_ISO = { a: 1, b: -0.5, c: 0.3, d: 0.5 };
const ISO = { a: BASE_ISO.a, b: BASE_ISO.b, c: BASE_ISO.c, d: BASE_ISO.d };
const ISO_INV = invert2x2(ISO);

// --- Shaders ----------------------------------------------------------------
const quadProgram = createProgram(
    `#version 300 es
    in vec2 a_position;
    in vec2 a_uv;
    uniform vec4 u_iso;
    uniform vec2 u_camera;
    uniform float u_zoom;
    uniform vec2 u_viewport;
    out vec2 v_uv;
    void main() {
        vec2 world = a_position - u_camera;
        vec2 iso = vec2(
            world.x * u_iso.x + world.y * u_iso.y,
            world.x * u_iso.z + world.y * u_iso.w
        );
        vec2 screen = iso * u_zoom + u_viewport * 0.5;
        vec2 clip = vec2(
            screen.x / u_viewport.x * 2.0 - 1.0,
            1.0 - screen.y / u_viewport.y * 2.0
        );
        gl_Position = vec4(clip, 0.0, 1.0);
        v_uv = a_uv;
    }`,
    `#version 300 es
    precision highp float;
    uniform sampler2D u_texture;
    uniform vec4 u_color;
    uniform float u_useTexture;
    in vec2 v_uv;
    out vec4 outColor;
    void main() {
        vec4 base = u_color;
        if (u_useTexture > 0.5) {
            base *= texture(u_texture, v_uv);
        }
        if (base.a <= 0.0) discard;
        outColor = base;
    }`
);

const gridProgram = createProgram(
    `#version 300 es
    in vec2 a_position;
    out vec2 v_position;
    void main() {
        v_position = a_position;
        gl_Position = vec4(a_position, 0.0, 1.0);
    }`,
    `#version 300 es
    #extension GL_OES_standard_derivatives : enable
    precision highp float;
    uniform vec2 u_viewport;
    uniform vec4 u_invIso;
    uniform vec2 u_camera;
    uniform float u_zoom;
    uniform float u_cellSize;
    uniform float u_crossThickness;
    out vec4 outColor;

    vec2 screenToWorld(vec2 screen) {
        vec2 iso = (screen - u_viewport * 0.5) / u_zoom;
        return vec2(
            iso.x * u_invIso.x + iso.y * u_invIso.y,
            iso.x * u_invIso.z + iso.y * u_invIso.w
        ) + u_camera;
    }

    void main() {
        vec2 screen = vec2(gl_FragCoord.x, u_viewport.y - gl_FragCoord.y);
        vec2 world = screenToWorld(screen);

        float subCell  = u_cellSize;
        float mainCell = u_cellSize * 2.0;

        // Pixel footprint in world space — used to set line widths in world units
        vec2 fw = fwidth(world);
        float pixelSize = max(fw.x, fw.y);

        // ---- Sub-grid: continuous thin lines at every cellSize ----
        // Distance to nearest grid line along each axis, in world units
        vec2 subCoord  = world / subCell;
        vec2 subDist   = abs(fract(subCoord + 0.5) - 0.5) * subCell;

        float subLineWidth = pixelSize * 1.2;   // ~1.2 pixels wide
        float subH = 1.0 - smoothstep(0.0, subLineWidth, subDist.x);
        float subV = 1.0 - smoothstep(0.0, subLineWidth, subDist.y);
        float subGrid = clamp(max(subH, subV), 0.0, 1.0);

        // ---- Main grid: short crosses at every 2*cellSize intersection ----
        vec2 mainCoord = world / mainCell;
        vec2 mainDist  = abs(fract(mainCoord + 0.5) - 0.5) * mainCell;

        float crossLineWidth = pixelSize * u_crossThickness * 3.0;
        float crossArmLen    = mainCell * 0.04;   // arm half-length

        // Each arm: thin along its own axis, length-limited along the other
        float hArm = (1.0 - smoothstep(0.0, crossLineWidth, mainDist.y))
                   * (1.0 - smoothstep(crossArmLen, crossArmLen + crossLineWidth * 2.0, mainDist.x));
        float vArm = (1.0 - smoothstep(0.0, crossLineWidth, mainDist.x))
                   * (1.0 - smoothstep(crossArmLen, crossArmLen + crossLineWidth * 2.0, mainDist.y));
        float crossMark = clamp(max(hArm, vArm), 0.0, 1.0);

        // ---- Compose ----
        vec3 bg         = vec3(0.9725);           // #f8f8f8
        vec3 subColor   = vec3(0.80);             // light gray lines
        vec3 crossColor = vec3(0.50);             // darker cross marks

        vec3 col = bg;
        col = mix(col, subColor,   subGrid   * 0.55);
        col = mix(col, crossColor, crossMark * 0.90);

        outColor = vec4(col, 1.0);
    }`
);

// --- Buffers ----------------------------------------------------------------
const quadVao = gl.createVertexArray();
const quadVbo = gl.createBuffer();
const quadData = new Float32Array(6 * 4);

setupQuadAttributes(quadProgram, quadVao, quadVbo, quadData.byteLength);

const screenVao = gl.createVertexArray();
const screenVbo = gl.createBuffer();
setupScreenQuad(screenVao, screenVbo);

// --- Scene ------------------------------------------------------------------
const assets = {
    textures: {},
    texts: {},
};

const scene = buildScene();

Promise.all([
    loadTexture('images/zermos_logo.png'),
    loadTexture('images/GitHub_Invertocat_Black_Clearspace.svg'),
    loadTexture('images/email-icon.svg'),
    // rasterize SVG for predictable aspect/size
    loadSvgAsTexture('images/matt_logo.svg', 1600),
]).then(([logo, github, email, matt]) => {
    assets.textures.logo = logo;
    assets.textures.github = github;
    assets.textures.email = email;
    assets.textures.matt = matt; // register matt logo texture (object with texture,width,height)

    console.log('Loaded matt logo texture:', matt);

    assets.texts.title = createTextTexture('PORTFOLIO', 84, '#333', 'Segoe UI');
    assets.texts.subtitle = createTextTexture('Drag to explore. Press R to recenter.', 18, '#555', 'Segoe UI');
    assets.texts.github = createTextTexture('GitHub', 28, '#333', 'Segoe UI');
    assets.texts.email = createTextTexture('Email', 28, '#333', 'Segoe UI');

    requestAnimationFrame(render);
});

// --- Interaction ------------------------------------------------------------
canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    state.isDragging = true;
    state.lastPointer.x = e.clientX;
    state.lastPointer.y = e.clientY;
    canvas.setPointerCapture?.(e.pointerId);
});

canvas.addEventListener('pointermove', (e) => {
    if (state.isDragging) {
        const dx = e.clientX - state.lastPointer.x;
        const dy = e.clientY - state.lastPointer.y;
        state.lastPointer.x = e.clientX;
        state.lastPointer.y = e.clientY;
        const worldDelta = screenDeltaToWorld(dx, dy);
        state.camera.x -= worldDelta.x;
        state.camera.y -= worldDelta.y;
    }

    const world = screenToWorld(e.clientX, e.clientY);
    const hovered = findInteractive(world.x, world.y);
    canvas.style.cursor = hovered ? 'pointer' : (state.isDragging ? 'grabbing' : 'grab');
});

canvas.addEventListener('pointerup', (e) => {
    state.isDragging = false;
    canvas.releasePointerCapture?.(e.pointerId);
});

canvas.addEventListener('click', (e) => {
    const world = screenToWorld(e.clientX, e.clientY);
    const hit = findInteractive(world.x, world.y);
    if (hit && hit.href) {
        window.open(hit.href, '_blank', 'noopener');
    }
});

window.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') {
        const start = { x: state.camera.x, y: state.camera.y };
        animate(500, (t) => {
            const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            state.camera.x = start.x * (1 - eased);
            state.camera.y = start.y * (1 - eased);
        });
    }
});

window.addEventListener('resize', resize);
resize();

// --- Render -----------------------------------------------------------------
function render() {
    gl.clearColor(0.9725, 0.9725, 0.9725, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    drawGrid();
    drawWires();
    drawTiles();

    requestAnimationFrame(render);
}

function drawGrid() {
    gl.useProgram(gridProgram.program);
    gl.bindVertexArray(screenVao);

    gl.uniform2f(gridProgram.uniforms.u_viewport, canvas.width, canvas.height);
    gl.uniform4f(gridProgram.uniforms.u_invIso, ISO_INV.a, ISO_INV.b, ISO_INV.c, ISO_INV.d);
    gl.uniform2f(gridProgram.uniforms.u_camera, state.camera.x, state.camera.y);
    gl.uniform1f(gridProgram.uniforms.u_zoom, state.zoom * state.dpr);
    gl.uniform1f(gridProgram.uniforms.u_cellSize, state.cellSize);
    gl.uniform1f(gridProgram.uniforms.u_crossThickness, state.crossThickness);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function drawTiles() {
    gl.useProgram(quadProgram.program);
    gl.bindVertexArray(quadVao);
    bindQuadUniforms();

    for (const tile of scene.tiles) {
        if (tile.shadow) {
            drawRect(tile.x + 6, tile.y + 6, tile.w / 2, tile.h / 2, [0, 0, 0, 0.08]);
        }
        drawRect(tile.x, tile.y, tile.w / 2, tile.h / 2, tile.color);
    }

    for (const image of scene.images) {
        const texInfo = assets.textures[image.textureKey];
        if (texInfo) {
            // texInfo may be either a WebGLTexture (old) or an object {texture, width, height}
            const tex = texInfo.texture ? texInfo.texture : texInfo;

            // requested box (drawTexture previously used image.w/2, image.h/2)
            const boxW = image.w / 2;
            const boxH = image.h / 2;

            let finalW = boxW;
            let finalH = boxH;

            if (texInfo.width && texInfo.height) {
                const aspect = texInfo.width / texInfo.height;
                // Fit the image inside boxW x boxH, preserving aspect
                if (boxW / boxH > aspect) {
                    // box is wider than image aspect -> limit by height
                    finalH = boxH;
                    finalW = boxH * aspect;
                } else {
                    // limit by width
                    finalW = boxW;
                    finalH = boxW / aspect;
                }
            }

            // debug overlays: show requested box (red) and final fitted box (green)
            if (state.debugImages) {
                // requested area
                drawRect(image.x, image.y, boxW, boxH, [1, 0, 0, 0.12]);
                // fitted area
                drawRect(image.x, image.y, finalW, finalH, [0, 1, 0, 0.12]);
            }

            drawTexture(image.x, image.y, finalW, finalH, tex, [1, 1, 1, 1]);
        }
    }

    for (const label of scene.text) {
        const tex = assets.texts[label.textKey];
        if (tex) {
            drawTexture(label.x, label.y, tex.width, tex.height, tex.texture, [1, 1, 1, 1]);
        }
    }
}

function drawWires() {
    gl.useProgram(quadProgram.program);
    gl.bindVertexArray(quadVao);
    bindQuadUniforms();
    gl.uniform1f(quadProgram.uniforms.u_useTexture, 0.0);

    for (const wire of scene.wires) {
        gl.uniform4f(quadProgram.uniforms.u_color, wire.color[0], wire.color[1], wire.color[2], wire.color[3]);
        drawLineStrip(wire.points);
    }
}

// --- Scene Builders ---------------------------------------------------------
function buildScene() {
    const cell = state.cellSize;
    const tile = cell * 2;

    return {
        tiles: [
            // { id: 'title', x: 0, y: 0, w: tile * 2, h: tile, color: [1, 1, 1, 1], shadow: true },
            // { id: 'logo', x: 0, y: 0, w: tile, h: tile, color: [1, 1, 1, 1], shadow: true },
            // { id: 'github', x: tile * 1.5, y: -tile * 0.5, w: tile, h: tile, color: [1, 1, 1, 1], shadow: true },
            // { id: 'email', x: tile * 1.5, y: tile * 1.2, w: tile, h: tile, color: [1, 1, 1, 1], shadow: true, href: LINKS.email },
        ],
        images: [
            // { x: 0, y: 0, w: tile * 0.9, h: tile * 0.9, textureKey: 'logo' },
            // Example: matt logo sized to 13/2 by 5/2 tiles.
            // drawTexture uses image.w/2, image.h/2 when drawing, so stored w/h must be twice the desired final size.
            // Desired final width = tile * (13/2) => stored w = desired * 2 = tile * 13
            // Desired final height = tile * (5/2)  => stored h = desired * 2 = tile * 5
            { x: 0.3 * tile, y: 0.25 * tile, w: tile * 13.5, h: tile * 5 * 1.16307, textureKey: 'matt' },
            // { x: tile * 1.5, y: -tile * 0.5, w: tile * 0.75, h: tile * 0.75, textureKey: 'github' },
            // { x: tile * 1.5, y: tile * 1.2, w: tile * 0.75, h: tile * 0.75, textureKey: 'email' },
        ],
        text: [],
        wires: [],
    };
}

function findInteractive(x, y) {
    for (const tile of scene.tiles) {
        if (!tile.href) continue;
        if (x >= tile.x - tile.w / 2 && x <= tile.x + tile.w / 2 && y >= tile.y - tile.h / 2 && y <= tile.y + tile.h / 2) {
            return tile;
        }
    }
    return null;
}

// --- Helpers ----------------------------------------------------------------
function resize() {
    state.dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(canvas.clientWidth * state.dpr);
    canvas.height = Math.floor(canvas.clientHeight * state.dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
}

function screenToWorld(screenX, screenY) {
    const dx = screenX * state.dpr - canvas.width / 2;
    const dy = screenY * state.dpr - canvas.height / 2;
    const isoX = dx / (state.zoom * state.dpr);
    const isoY = dy / (state.zoom * state.dpr);
    return {
        x: isoX * ISO_INV.a + isoY * ISO_INV.b + state.camera.x,
        y: isoX * ISO_INV.c + isoY * ISO_INV.d + state.camera.y,
    };
}

function screenDeltaToWorld(dx, dy) {
    const isoX = dx / state.zoom;
    const isoY = dy / state.zoom;
    return {
        x: isoX * ISO_INV.a + isoY * ISO_INV.b,
        y: isoX * ISO_INV.c + isoY * ISO_INV.d,
    };
}

function bindQuadUniforms() {
    gl.uniform4f(quadProgram.uniforms.u_iso, ISO.a, ISO.b, ISO.c, ISO.d);
    gl.uniform2f(quadProgram.uniforms.u_camera, state.camera.x, state.camera.y);
    gl.uniform1f(quadProgram.uniforms.u_zoom, state.zoom * state.dpr);
    gl.uniform2f(quadProgram.uniforms.u_viewport, canvas.width, canvas.height);
}

function drawRect(x, y, w, h, color) {
    const x0 = x - w / 2;
    const x1 = x + w / 2;
    const y0 = y - h / 2;
    const y1 = y + h / 2;
    setQuadVertices(x0, y0, x1, y1);
    gl.uniform1f(quadProgram.uniforms.u_useTexture, 0.0);
    gl.uniform4f(quadProgram.uniforms.u_color, color[0], color[1], color[2], color[3]);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function drawTexture(x, y, w, h, texture, tint) {
    const x0 = x - w / 2;
    const x1 = x + w / 2;
    const y0 = y - h / 2;
    const y1 = y + h / 2;
    setQuadVertices(x0, y0, x1, y1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // set sampler to texture unit 0
    if (quadProgram.uniforms.u_texture) gl.uniform1i(quadProgram.uniforms.u_texture, 0);
    gl.uniform1f(quadProgram.uniforms.u_useTexture, 1.0);
    gl.uniform4f(quadProgram.uniforms.u_color, tint[0], tint[1], tint[2], tint[3]);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function drawLineStrip(points) {
    if (points.length < 2) return;
    const data = new Float32Array(points.length * 4);
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        data[i * 4 + 0] = p[0];
        data[i * 4 + 1] = p[1];
        data[i * 4 + 2] = 0;
        data[i * 4 + 3] = 0;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, quadVbo);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
    gl.drawArrays(gl.LINE_STRIP, 0, points.length);
    gl.bufferData(gl.ARRAY_BUFFER, quadData, gl.DYNAMIC_DRAW);
}

function setQuadVertices(x0, y0, x1, y1) {
    quadData.set([
        x0, y0, 0, 0,
        x1, y0, 1, 0,
        x0, y1, 0, 1,
        x0, y1, 0, 1,
        x1, y0, 1, 0,
        x1, y1, 1, 1,
    ]);
    gl.bindBuffer(gl.ARRAY_BUFFER, quadVbo);
    gl.bufferData(gl.ARRAY_BUFFER, quadData, gl.DYNAMIC_DRAW);
}

function loadTexture(src) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.decoding = 'async';
        image.onload = () => {
            const texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            // return both the WebGL texture and the natural image size to preserve aspect ratio
            resolve({ texture, width: image.naturalWidth || image.width, height: image.naturalHeight || image.height });
        };
        image.onerror = reject;
        image.src = src;
    });
}

// Rasterize an SVG into an offscreen canvas and upload as a WebGL texture.
// src: URL to SVG
// maxPixelWidth: requested raster width in pixels (keeps aspect)
function loadSvgAsTexture(src, maxPixelWidth = 1024) {
    return fetch(src)
        .then(res => {
            if (!res.ok) throw new Error(`Failed to fetch SVG: ${res.status}`);
            return res.text();
        })
        .then(svgText => {
            // Try to extract intrinsic width/height or viewBox from the SVG markup
            let iw = null, ih = null;
            const viewBoxMatch = svgText.match(/viewBox\s*=\s*"([^"]+)"/i);
            if (viewBoxMatch) {
                const parts = viewBoxMatch[1].trim().split(/\s+/).map(Number);
                if (parts.length === 4 && parts.every(n => !isNaN(n))) {
                    // viewBox = minX minY width height
                    iw = parts[2];
                    ih = parts[3];
                }
            }
            if (!iw || !ih) {
                // try width/height attributes (may include px)
                const widthMatch = svgText.match(/width\s*=\s*"([^"]+)"/i);
                const heightMatch = svgText.match(/height\s*=\s*"([^"]+)"/i);
                if (widthMatch && heightMatch) {
                    const parseNum = (s) => parseFloat(s.replace(/px$/i, '')) || null;
                    iw = parseNum(widthMatch[1]);
                    ih = parseNum(heightMatch[1]);
                }
            }
            // fallback to square if nothing found
            if (!iw || !ih || iw <= 0 || ih <= 0) {
                iw = iw || maxPixelWidth;
                ih = ih || maxPixelWidth;
            }

            const aspect = iw / ih;
            const w = Math.min(maxPixelWidth, Math.max(1, Math.floor(maxPixelWidth)));
            const h = Math.max(1, Math.floor(w / aspect));

            // Create a Blob URL so the browser rasterizes with correct SVG content
            const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);

            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    try {
                        const canvasOff = document.createElement('canvas');
                        canvasOff.width = w;
                        canvasOff.height = h;
                        const ctx = canvasOff.getContext('2d');
                        ctx.clearRect(0, 0, w, h);
                        ctx.drawImage(img, 0, 0, w, h);

                        const texture = gl.createTexture();
                        gl.bindTexture(gl.TEXTURE_2D, texture);
                        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvasOff);

                        URL.revokeObjectURL(url);
                        resolve({ texture, width: w, height: h });
                    } catch (err) {
                        URL.revokeObjectURL(url);
                        reject(err);
                    }
                };
                img.onerror = (e) => {
                    URL.revokeObjectURL(url);
                    reject(new Error('SVG image failed to load'));
                };
                img.src = url;
            });
        });
}

function createTextTexture(text, size, color, font) {
    const padding = 8;
    const textCanvas = document.createElement('canvas');
    const ctx = textCanvas.getContext('2d');
    ctx.font = `${size}px ${font}`;
    const metrics = ctx.measureText(text);
    textCanvas.width = Math.ceil(metrics.width + padding * 2);
    textCanvas.height = Math.ceil(size + padding * 2);

    ctx.font = `${size}px ${font}`;
    ctx.textBaseline = 'top';
    ctx.fillStyle = color;
    ctx.fillText(text, padding, padding);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);

    return { texture, width: textCanvas.width, height: textCanvas.height };
}

function setupQuadAttributes(program, vao, vbo, size) {
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, size, gl.DYNAMIC_DRAW);

    const posLoc = gl.getAttribLocation(program.program, 'a_position');
    const uvLoc = gl.getAttribLocation(program.program, 'a_uv');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(uvLoc);
    gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 16, 8);
}

function setupScreenQuad(vao, vbo) {
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1,
        1, -1,
        -1, 1,
        -1, 1,
        1, -1,
        1, 1,
    ]), gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(gridProgram.program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 8, 0);
}

function createProgram(vertexSource, fragmentSource) {
    const program = gl.createProgram();
    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(program);
        throw new Error(`Shader link error: ${info}`);
    }

    return {
        program,
        uniforms: {
            u_iso: gl.getUniformLocation(program, 'u_iso'),
            u_invIso: gl.getUniformLocation(program, 'u_invIso'),
            u_camera: gl.getUniformLocation(program, 'u_camera'),
            u_zoom: gl.getUniformLocation(program, 'u_zoom'),
            u_viewport: gl.getUniformLocation(program, 'u_viewport'),
            u_cellSize: gl.getUniformLocation(program, 'u_cellSize'),
            u_crossThickness: gl.getUniformLocation(program, 'u_crossThickness'),
            u_texture: gl.getUniformLocation(program, 'u_texture'),
            u_color: gl.getUniformLocation(program, 'u_color'),
            u_useTexture: gl.getUniformLocation(program, 'u_useTexture'),
        },
    };
}

function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(`Shader compile error: ${info}`);
    }
    return shader;
}

function invert2x2(m) {
    const det = m.a * m.d - m.b * m.c;
    return { a: m.d / det, b: -m.b / det, c: -m.c / det, d: m.a / det };
}

function animate(duration, onUpdate) {
    const start = performance.now();
    const tick = (now) => {
        const t = Math.min((now - start) / duration, 1);
        onUpdate(t);
        if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
}

// Enable blending for textures
gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

