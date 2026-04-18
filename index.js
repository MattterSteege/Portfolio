//update the --x and --y values to move the background position when click-dragging the mouse
const grid = document.getElementById("grid");
let isDragging = false;
let lastX, lastY;

window.addEventListener("mousedown", (e) => {
  isDragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
});

window.addEventListener("mousemove", (e) => {
  if (isDragging) {
    let deltaX = e.clientX - lastX;
    let deltaY = e.clientY - lastY;
    const currentX = parseFloat(getComputedStyle(grid).getPropertyValue("--x")) || 0;
    const currentY = parseFloat(getComputedStyle(grid).getPropertyValue("--y")) || 0;

    //the deltaX and deltaY need to change to, since the background position is isometric:     transform: rotateX(60deg) rotateY(0deg) rotateZ(-45deg);

    grid.style.setProperty("--x", `${currentX + deltaX}px`);
    grid.style.setProperty("--y", `${currentY + deltaY}px`);
    lastX = e.clientX;
    lastY = e.clientY;
  }
});

window.addEventListener("mouseup", () => {
  isDragging = false;
});

window.addEventListener("mouseleave", () => {
  isDragging = false;
});

document.querySelectorAll('.grid-item .letter').forEach(el => {
    el.addEventListener('mouseenter', () => {
        const hue = Math.floor(Math.random() * 360);
        el.style.background = `hsl(${hue}, 100%, 50%)`;
    });

    el.addEventListener('mouseleave', () => {
        el.style.background = 'white';
    });
});

//keybinds
window.addEventListener('keydown', (e) => {
    if (e.key === 'r') {
        //reset the background position to center (250px/second)
        const currentX = parseFloat(getComputedStyle(grid).getPropertyValue("--x")) || 0;
        const currentY = parseFloat(getComputedStyle(grid).getPropertyValue("--y")) || 0;
        ease(currentX, 0, 500, (value) => {
            grid.style.setProperty("--x", `${value}px`);
        });
        ease(currentY, 0, 500, (value) => {
            grid.style.setProperty("--y", `${value}px`);
        });
    }
});

//when loading the page, after a second start ease the --grid-size from 120px to 60px in 0.5s
window.addEventListener('load', () => {
    setTimeout(() => {
        const currentSize = 120; //initial size
        ease(currentSize, 60, 500, (value) => {
            grid.style.setProperty("--cell-size", `${value}px`);
        });
    }, 1000);
});

//ease-in-out
function ease(start, end, duration, callback) {
  const startTime = performance.now();

  function animate() {
    const currentTime = performance.now();
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress; // Ease-in-out formula
    const value = start + (end - start) * easedProgress;
    callback(value);

    if (elapsed < duration) {
      requestAnimationFrame(animate);
    }
  }

  requestAnimationFrame(animate);
}