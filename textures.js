// =============================================================================
// textures.js — Loading raster/SVG images and rasterised text as WebGL textures
// =============================================================================

/**
 * All texture helpers return a promise that resolves to:
 *   { texture: WebGLTexture, width: number, height: number }
 *
 * `width` and `height` are the natural pixel dimensions of the source, which
 * the renderer uses to preserve the correct aspect ratio.
 */

// --- Internal helpers --------------------------------------------------------

function uploadTexture(gl, source) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    return texture;
}

// --- Public API --------------------------------------------------------------

/**
 * Loads a raster image (PNG, JPEG, …) from `src` and uploads it as a texture.
 */
export function loadTexture(gl, src) {
    return new Promise((resolve, reject) => {
        const image     = new Image();
        image.decoding  = 'async';
        image.onload    = () => {
            const texture = uploadTexture(gl, image);
            resolve({
                texture,
                width:  image.naturalWidth  || image.width,
                height: image.naturalHeight || image.height,
            });
        };
        image.onerror = reject;
        image.src     = src;
    });
}

/**
 * Fetches an SVG, rasterises it onto an offscreen canvas at `maxPixelWidth`
 * (preserving aspect ratio), then uploads the result as a texture.
 *
 * Using a canvas rasterisation step gives predictable sizing regardless of
 * how the browser would normally render the SVG.
 */
export function loadSvgAsTexture(gl, src, maxPixelWidth = 1024) {
    return fetch(src)
        .then(res => {
            if (!res.ok) throw new Error(`Failed to fetch SVG: ${res.status}`);
            return res.text();
        })
        .then(svgText => {
            const { w, h } = parseSvgDimensions(svgText, maxPixelWidth);
            return rasteriseSvg(gl, svgText, w, h);
        });
}

/** Parses intrinsic SVG dimensions from the markup; falls back to a square. */
function parseSvgDimensions(svgText, maxPixelWidth) {
    let iw = null;
    let ih = null;

    // Prefer viewBox (most reliable)
    const viewBoxMatch = svgText.match(/viewBox\s*=\s*"([^"]+)"/i);
    if (viewBoxMatch) {
        const parts = viewBoxMatch[1].trim().split(/\s+/).map(Number);
        if (parts.length === 4 && parts.every(n => !isNaN(n))) {
            [, , iw, ih] = parts; // minX minY width height
        }
    }

    // Fall back to explicit width/height attributes
    if (!iw || !ih) {
        const parseNum   = s => parseFloat(s.replace(/px$/i, '')) || null;
        const widthMatch  = svgText.match(/width\s*=\s*"([^"]+)"/i);
        const heightMatch = svgText.match(/height\s*=\s*"([^"]+)"/i);
        if (widthMatch && heightMatch) {
            iw = parseNum(widthMatch[1]);
            ih = parseNum(heightMatch[1]);
        }
    }

    // Last resort: assume square
    iw = (iw && iw > 0) ? iw : maxPixelWidth;
    ih = (ih && ih > 0) ? ih : maxPixelWidth;

    const aspect = iw / ih;
    const w = Math.max(1, Math.floor(maxPixelWidth));
    const h = Math.max(1, Math.floor(w / aspect));
    return { w, h };
}

/** Draws an SVG string into an offscreen canvas and uploads it as a texture. */
function rasteriseSvg(gl, svgText, w, h) {
    const blob   = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
    const url    = URL.createObjectURL(blob);

    return new Promise((resolve, reject) => {
        const img  = new Image();
        img.onload = () => {
            try {
                const offscreen = document.createElement('canvas');
                offscreen.width  = w;
                offscreen.height = h;
                const ctx = offscreen.getContext('2d');
                ctx.clearRect(0, 0, w, h);
                ctx.drawImage(img, 0, 0, w, h);

                const texture = uploadTexture(gl, offscreen);
                URL.revokeObjectURL(url);
                resolve({ texture, width: w, height: h });
            } catch (err) {
                URL.revokeObjectURL(url);
                reject(err);
            }
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('SVG image failed to load'));
        };
        img.src = url;
    });
}

/**
 * Renders `text` onto an offscreen canvas using the 2D API and uploads it as
 * a WebGL texture.  Returns `{ texture, width, height }`.
 */
export function createTextTexture(gl, text, size, color, font) {
    const padding    = 8;
    const dpr        = (window.devicePixelRatio || 1) * 5;
    const offscreen  = document.createElement('canvas');
    const ctx        = offscreen.getContext('2d');

    // Use the scaled font size for measurement
    const scaledSize = size * dpr;
    ctx.font = `${scaledSize}px ${font}`;
    const metrics     = ctx.measureText(text);

    // Canvas size in CSS pixels
    const cssWidth   = Math.ceil(metrics.width / dpr + padding * 2);
    const cssHeight  = Math.ceil(size + padding * 2);

    // Actual pixel dimensions
    offscreen.width   = cssWidth * dpr;
    offscreen.height  = cssHeight * dpr;

    // Scale context to match device pixel ratio
    ctx.scale(dpr / 5, dpr / 5);

    // Re-set font after resize
    ctx.font         = `${scaledSize}px ${font}`;
    ctx.textBaseline = 'top';
    ctx.fillStyle    = color;
    ctx.fillText(text, padding, padding);

    const texture = uploadTexture(gl, offscreen);
    return { texture, width: cssWidth, height: cssHeight };
}
