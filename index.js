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

//when the user loads this page, the --rotate value on the grid should start at 0 and then animate to 360 degrees over the course of 5 seconds. that is the loading screen
window.addEventListener("load", () => {
  grid.style.setProperty("--rotate", "-90deg");
  setTimeout(() => {
    ease(-90, 0, 1000, (value) => {
      grid.style.setProperty("--rotate", `${value}deg`);
    });
  }, 100); // Start the animation after a short delay
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