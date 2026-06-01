// =============================================================================
// renderer.js — WebGL buffer setup and low-level draw primitives
// =============================================================================

// Reusable Float32Array for the dynamic quad VBO.
// Each vertex: [x, y, u, v] = 4 floats × 4 bytes = 16 bytes.
// Two triangles = 6 vertices.
const quadData = new Float32Array(6 * 4);

/**
 * Creates and configures the VAO/VBO used for all quad (rect / texture) draws.
 * The buffer is DYNAMIC_DRAW because we rewrite it every draw call.
 */
export function createQuadGeometry(gl, quadProgram) {
    const vao = gl.createVertexArray();
    const vbo = gl.createBuffer();

    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, quadData.byteLength, gl.DYNAMIC_DRAW);

    const posLoc = gl.getAttribLocation(quadProgram.program, 'a_position');
    const uvLoc  = gl.getAttribLocation(quadProgram.program, 'a_uv');

    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 16, 0);

    gl.enableVertexAttribArray(uvLoc);
    gl.vertexAttribPointer(uvLoc,  2, gl.FLOAT, false, 16, 8);

    return { vao, vbo };
}

/**
 * Creates the full-screen triangle-pair VAO used by the grid shader.
 * Vertices are in clip space (−1 … +1) so the vertex shader can pass them
 * straight to `gl_Position`.
 */
export function createScreenQuadGeometry(gl, gridProgram) {
    const vao = gl.createVertexArray();
    const vbo = gl.createBuffer();

    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
        -1,  1,
         1, -1,
         1,  1,
    ]), gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(gridProgram.program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 8, 0);

    return { vao, vbo };
}

// --- Draw primitives ---------------------------------------------------------
// All functions assume the correct program and VAO are already bound by the
// caller (see render.js).

/**
 * Writes two screen-aligned triangles covering [x0,y0]–[x1,y1] into the
 * dynamic quad VBO.
 */
function uploadQuadVertices(gl, vbo, x0, y0, x1, y1) {
    quadData.set([
        x0, y0, 0, 0,
        x1, y0, 1, 0,
        x0, y1, 0, 1,
        x0, y1, 0, 1,
        x1, y0, 1, 0,
        x1, y1, 1, 1,
    ]);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, quadData, gl.DYNAMIC_DRAW);
}

/** Draws a solid-colour rectangle centred at (x, y) with half-extents (w, h). */
export function drawRect(gl, quadVbo, uniforms, x, y, w, h, color) {
    uploadQuadVertices(gl, quadVbo, x - w, y - h, x + w, y + h);
    gl.uniform1f(uniforms.u_useTexture, 0.0);
    gl.uniform4f(uniforms.u_color, color[0], color[1], color[2], color[3]);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

/**
 * Draws a textured rectangle centred at (x, y) with half-extents (w, h).
 * `tint` multiplies the texture colour (use [1,1,1,1] for no tint).
 */
export function drawTexture(gl, quadVbo, uniforms, x, y, w, h, texture, tint) {
    uploadQuadVertices(gl, quadVbo, x - w, y - h, x + w, y + h);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    if (uniforms.u_texture) gl.uniform1i(uniforms.u_texture, 0);
    gl.uniform1f(uniforms.u_useTexture, 1.0);
    gl.uniform4f(uniforms.u_color, tint[0], tint[1], tint[2], tint[3]);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

/**
 * Draws a polyline through `points` (array of [x, y] pairs) using LINE_STRIP.
 * Temporarily overwrites the quad VBO, then restores the original data.
 */
export function drawLineStrip(gl, quadVbo, points) {
    if (points.length < 2) return;

    const data = new Float32Array(points.length * 4);
    for (let i = 0; i < points.length; i++) {
        data[i * 4]     = points[i][0];
        data[i * 4 + 1] = points[i][1];
        // u, v left as 0
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, quadVbo);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
    gl.drawArrays(gl.LINE_STRIP, 0, points.length);

    // Restore the quad VBO to its expected size so subsequent quad draws work.
    gl.bufferData(gl.ARRAY_BUFFER, quadData, gl.DYNAMIC_DRAW);
}
