// =============================================================================
// shaders.js — GLSL sources and WebGL program/shader helpers
// =============================================================================

// -----------------------------------------------------------------------------
// Quad shader
// Renders a textured or solid-colour axis-aligned rectangle in world space,
// projected through the isometric matrix.
// -----------------------------------------------------------------------------
export const QUAD_VERT = /* glsl */`#version 300 es
    in vec2 a_position;
    in vec2 a_uv;

    uniform vec4  u_iso;       // isometric matrix [a, b, c, d]
    uniform vec2  u_camera;    // world-space camera position
    uniform float u_zoom;
    uniform vec2  u_viewport;  // canvas size in physical pixels

    out vec2 v_uv;

    void main() {
        vec2 world  = a_position - u_camera;
        vec2 iso    = vec2(
            world.x * u_iso.x + world.y * u_iso.y,
            world.x * u_iso.z + world.y * u_iso.w
        );
        vec2 screen = iso * u_zoom + u_viewport * 0.5;
        vec2 clip   = vec2(
             screen.x / u_viewport.x * 2.0 - 1.0,
            1.0 - screen.y / u_viewport.y * 2.0
        );
        gl_Position = vec4(clip, 0.0, 1.0);
        v_uv        = a_uv;
    }
`;

export const QUAD_FRAG = /* glsl */`#version 300 es
    precision highp float;

    uniform sampler2D u_texture;
    uniform vec4      u_color;
    uniform float     u_useTexture;

    in  vec2 v_uv;
    out vec4 outColor;

    void main() {
        vec4 base = u_color;
        if (u_useTexture > 0.5) {
            base *= texture(u_texture, v_uv);
        }
        if (base.a <= 0.0) discard;
        outColor = base;
    }
`;

// -----------------------------------------------------------------------------
// Grid shader
// Full-screen pass that draws:
//   • a continuous sub-grid of thin lines at every cellSize interval, and
//   • short cross marks at every 2×cellSize intersection.
//
// u_gridOffset shifts the entire pattern in world space so the cross at (0,0)
// can be repositioned without moving tiles or wires.
// -----------------------------------------------------------------------------
export const GRID_VERT = /* glsl */`#version 300 es
    in vec2 a_position;
    out vec2 v_position;

    void main() {
        v_position  = a_position;
        gl_Position = vec4(a_position, 0.0, 1.0);
    }
`;

export const GRID_FRAG = /* glsl */`#version 300 es
    #extension GL_OES_standard_derivatives : enable
    precision highp float;

    uniform vec2  u_viewport;
    uniform vec4  u_invIso;       // inverse iso matrix [a, b, c, d]
    uniform vec2  u_camera;
    uniform float u_zoom;
    uniform float u_cellSize;
    uniform float u_crossThickness;
    uniform vec2  u_gridOffset;   // world-space shift for the whole grid pattern

    out vec4 outColor;

    // Convert a screen-space pixel coordinate to world space.
    vec2 screenToWorld(vec2 screen) {
        vec2 iso = (screen - u_viewport * 0.5) / u_zoom;
        return vec2(
            iso.x * u_invIso.x + iso.y * u_invIso.y,
            iso.x * u_invIso.z + iso.y * u_invIso.w
        ) + u_camera;
    }

    void main() {
        // gl_FragCoord has y-up; flip to match the CSS/canvas y-down convention.
        vec2 screen = vec2(gl_FragCoord.x, u_viewport.y - gl_FragCoord.y);
        vec2 world  = screenToWorld(screen) - u_gridOffset;

        float subCell  = u_cellSize;
        float mainCell = u_cellSize * 2.0;

        // Pixel footprint in world space — used to set line widths in world units.
        vec2  fw        = fwidth(world);
        float pixelSize = max(fw.x, fw.y);

        // ---- Sub-grid: thin continuous lines at every cellSize ---------------
        vec2  subCoord    = world / subCell;
        vec2  subDist     = abs(fract(subCoord + 0.5) - 0.5) * subCell;
        float subLineW    = pixelSize * 1.2;   // ~1.2 px wide
        float subH        = 1.0 - smoothstep(0.0, subLineW, subDist.x);
        float subV        = 1.0 - smoothstep(0.0, subLineW, subDist.y);
        float subGrid     = clamp(max(subH, subV), 0.0, 1.0);

        // ---- Cross marks: short ticks at every 2×cellSize intersection -------
        vec2  mainCoord   = world / mainCell;
        vec2  mainDist    = abs(fract(mainCoord + 0.5) - 0.5) * mainCell;
        float crossLineW  = pixelSize * u_crossThickness * 3.0;
        float crossArmLen = mainCell * 0.04;

        float hArm = (1.0 - smoothstep(0.0, crossLineW, mainDist.y))
                   * (1.0 - smoothstep(crossArmLen, crossArmLen + crossLineW * 2.0, mainDist.x));
        float vArm = (1.0 - smoothstep(0.0, crossLineW, mainDist.x))
                   * (1.0 - smoothstep(crossArmLen, crossArmLen + crossLineW * 2.0, mainDist.y));
        float crossMark = clamp(max(hArm, vArm), 0.0, 1.0);

        // ---- Compose layers --------------------------------------------------
        vec3 bg         = vec3(0.9725);   // #f8f8f8
        vec3 subColor   = vec3(0.80);     // light-grey lines
        vec3 crossColor = vec3(0.50);     // darker cross marks

        vec3 col = bg;
        col = mix(col, subColor,   subGrid   * 0.55);
        col = mix(col, crossColor, crossMark * 0.90);

        outColor = vec4(col, 1.0);
    }
`;

// -----------------------------------------------------------------------------
// WebGL helpers
// -----------------------------------------------------------------------------

/** Compiles a single shader stage and throws a readable error on failure. */
export function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(`Shader compile error:\n${info}`);
    }
    return shader;
}

/**
 * Links a vertex + fragment shader pair into a program object.
 * Returns `{ program, uniforms }` where `uniforms` is a map of every
 * known uniform name to its WebGLUniformLocation.
 */
export function createProgram(gl, vertSource, fragSource) {
    const program = gl.createProgram();
    gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER,   vertSource));
    gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, fragSource));
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(`Shader link error:\n${gl.getProgramInfoLog(program)}`);
    }

    const uniformNames = [
        'u_iso', 'u_invIso',
        'u_camera', 'u_zoom', 'u_viewport',
        'u_cellSize', 'u_crossThickness', 'u_gridOffset',
        'u_texture', 'u_color', 'u_useTexture',
    ];

    const uniforms = Object.fromEntries(
        uniformNames.map(name => [name, gl.getUniformLocation(program, name)])
    );

    return { program, uniforms };
}
