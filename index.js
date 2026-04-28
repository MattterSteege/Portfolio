const grid = document.getElementById("grid");

// ── State ─────────────────────────────────────────────────────────────────────
let isDragging = false, lastX, lastY, rafPending = false;
let offsetX = 0, offsetY = 0;
let currentRotate = 0; // radians — extend this if you add rotation
let cellSize = 60;

// ── Inverse-isometric matrix constants ───────────────────────────────────────
// Derived from: skewX(-48) * skewY(14) * scaleX(2) * scale(0.371484375)
const A = 1.345970, B = 1.494851, C = 0.671183, D = 1.946543;

// ── Cache grid items + their grid coordinates ─────────────────────────────────
const gridItems = Array.from(document.querySelectorAll('#grid .grid-item')).map(el => ({
    el,
    gx: parseFloat(el.style.getPropertyValue('--grid-x')) || 0,
    gy: parseFloat(el.style.getPropertyValue('--grid-y')) || 0,
}));

// ── Core: compute normalised offset and push to DOM ───────────────────────────
function updatePositions() {
    const t4x = A * offsetX + B * offsetY;
    const t4y = -C * offsetX + D * offsetY;
    const cos = Math.cos(currentRotate), sin = Math.sin(currentRotate);
    const nx = cos * t4x + sin * t4y;
    const ny = -sin * t4x + cos * t4y;

    // ::before / ::after can't be styled from JS, so we still pass CSS vars —
    // but now just plain pixel values; the only calc left in CSS is "50% + value".
    grid.style.setProperty('--normalized-x', `${nx}px`);
    grid.style.setProperty('--normalized-y', `${ny}px`);

    // Translate each grid item with a single pre-computed value — no CSS calc at all.
    const half = Math.max(window.innerHeight, window.innerWidth) * 1.5; // == --size / 2
    for (const { el, gx, gy } of gridItems) {
        el.style.translate =
            `${gx * 2 * cellSize - cellSize + nx - 5 + half}px ` +
            `${gy * 2 * cellSize - cellSize + ny - 5 + half}px`;
    }
}

// ── Drag ──────────────────────────────────────────────────────────────────────
window.addEventListener("mousedown", (e) => {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
});

window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    offsetX += e.clientX - lastX;
    offsetY += e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    // Throttle DOM writes to one per animation frame
    if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(() => { updatePositions(); rafPending = false; });
    }
});

window.addEventListener("mouseup",    () => { isDragging = false; });
window.addEventListener("mouseleave", () => { isDragging = false; });

// ── Letter hover colours ──────────────────────────────────────────────────────
document.querySelectorAll('.grid-item .letter').forEach(el => {
    el.addEventListener('mouseenter', () => {
        el.style.background = `hsl(${Math.floor(Math.random() * 360)}, 100%, 50%)`;
    });
    el.addEventListener('mouseleave', () => { el.style.background = 'white'; });
});

// ── Keybinds ──────────────────────────────────────────────────────────────────
window.addEventListener('keydown', (e) => {
    if (e.key === 'r') {
        const sx = offsetX, sy = offsetY;
        ease(sx, 0, 500, v => { offsetX = v; updatePositions(); });
        ease(sy, 0, 500, v => { offsetY = v; updatePositions(); });
    }
});

// ── Init & resize ─────────────────────────────────────────────────────────────
window.addEventListener('load', () => {
    updatePositions();
    setTimeout(() => {
        ease(120, 60, 500, v => {
            cellSize = v;
            grid.style.setProperty('--cell-size', `${v}px`); // kept for CSS sizing only
            updatePositions();
        });
    }, 1000);
});

window.addEventListener('resize', updatePositions);

// ── Tooltip ───────────────────────────────────────────────────────────────────
const tooltip = document.createElement('div');
tooltip.id = 'tooltip';
tooltip.innerHTML = `<svg width="44" height="28" viewBox="0 0 44 28" fill="none"><line x1="2" y1="26" x2="42" y2="2" stroke="#222" stroke-width="1.5" stroke-linecap="round"/></svg><span class="tooltip-text"></span>`;
document.body.appendChild(tooltip);

document.querySelectorAll('[data-tooltip]').forEach(el => {
    el.addEventListener('mouseenter', () => {
        tooltip.querySelector('.tooltip-text').textContent = el.dataset.tooltip;
        const rect = el.getBoundingClientRect();
        tooltip.style.left = (rect.right + 6) + 'px';
        tooltip.style.top  = (rect.top + rect.height / 3) + 'px';
        tooltip.classList.add('visible');
    });
    el.addEventListener('mouseleave', () => tooltip.classList.remove('visible'));
});

// ── Easing helper ─────────────────────────────────────────────────────────────
function ease(start, end, duration, callback) {
    const t0 = performance.now();
    (function animate() {
        const p = Math.min((performance.now() - t0) / duration, 1);
        callback(start + (end - start) * (p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p));
        if (p < 1) requestAnimationFrame(animate);
    })();
}

// ─── WIRE ─────────────────────────────────────────────────────────────
/**
 * Generates a wire SVG group element
 * @param {string} pathD - SVG path definition for the wire core (e.g., "M50 100 C150 20, 250 180, 350 100")
 * @param {string} color - Wire color for the pulse effect (default: #00e0ff)
 * @param {number} wireWidth - Width of the main wire core (default: 10)
 * @param {number} offsetAmount - Offset distance for shadow and highlight (default: 6)
 * @returns {SVGGElement} - Group containing all wire elements
 */
function createWire(pathD, color = '#00e0ff', wireWidth = 10, offsetAmount = 6) {
    // Create the main group
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', 'wire');
    group.setAttribute('style', `--wire-color:${color}`);

    // Helper function to offset a path perpendicular to its direction
    function offsetPath(pathD, offset) {
        // This is a simplified offset - for complex paths, you might want to use a library
        // For now, we'll apply a transform offset (not true perpendicular offset, but works for most cases)
        return pathD;
    }

    // Helper function to create a path element
    function createPathElement(pathD, className) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('class', className);
        path.setAttribute('d', pathD);
        return path;
    }

    // Create shadow (offset down and darkened)
    const shadowPath = createPathElement(pathD, 'wire-shadow');
    // For shadow, we apply a transform to offset it
    const shadowGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    shadowGroup.setAttribute('transform', `translate(6, ${offsetAmount})`);
    shadowGroup.appendChild(shadowPath);
    group.appendChild(shadowGroup);

    // Create main wire core (dark black)
    group.appendChild(createPathElement(pathD, 'wire-core'));

    // Create highlight (offset up and brightened)
    const highlightPath = createPathElement(pathD, 'wire-highlight');
    const highlightGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    highlightGroup.setAttribute('transform', `translate(6, -${offsetAmount})`);
    highlightGroup.appendChild(highlightPath);
    group.appendChild(highlightGroup);

    // Create pulsing glow
    group.appendChild(createPathElement(pathD, 'wire-pulse'));

    return group;
}