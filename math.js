// =============================================================================
// math.js — Tiny math helpers
// =============================================================================

/**
 * Inverts a 2×2 matrix given as { a, b, c, d }.
 * The matrix is treated as:
 *   | a  b |
 *   | c  d |
 */
export function invert2x2(m) {
    const det = m.a * m.d - m.b * m.c;
    return {
        a:  m.d / det,
        b: -m.b / det,
        c: -m.c / det,
        d:  m.a / det,
    };
}

/** Easing: smooth-step in-out (t ∈ [0,1]). */
export function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

/** Drives an animation for `duration` ms, calling `onUpdate(t)` each frame. */
export function animate(duration, onUpdate) {
    const start = performance.now();
    const tick  = (now) => {
        const t = Math.min((now - start) / duration, 1);
        onUpdate(t);
        if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
}
