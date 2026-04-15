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