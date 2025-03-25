function createParticle (x, y) {
    // Create a custom particle element
    const particle = document.createElement('particle');
    // Append the element into the body
    document.body.appendChild(particle);

    // Calculate a random size from 5px to 25px
    const size = Math.floor(Math.random() * 8 + 2);
    // Apply the size on each particle
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    // Generate a random color in a blue/purple palette
    particle.style.background = `hsl(${Math.random() * 30 + 300}, 18%, 22%)`;

    // Generate a random x & y destination within a distance of 75px from the mouse
    const destinationX = x + (Math.random() - 0.5) * 30 * 2;
    const destinationY = y + (Math.random() - 0.25) * 30 * 2;

    // Store the animation in a variable because we will need it later
    const animation = particle.animate([
        {
            // Set the origin position of the particle
            // We offset the particle with half its size to center it around the mouse
            transform: `translate(${x - (size / 2)}px, ${y - (size / 2)}px)`,
            opacity: 1
        },
        {
            // We define the final coordinates as the second keyframe
            transform: `translate(${destinationX}px, ${destinationY}px)`,
            opacity: 0
        }
    ], {
        // Set a random duration from 500 to 1500ms
        duration: 500 + Math.random() * 1000,
        easing: 'cubic-bezier(0, .9, .57, 1)',
        // Delay every particle with a random value from 0ms to 200ms
        delay: Math.random() * 100
    });

    // Same as before
    // When the animation is finished, remove the element from the DOM
    animation.onfinish = () => {
        particle.remove();
    };
}

function pop(e) {
    // Loop to generate 30 particles at once
    for (let i = 0; i < 50; i++) {
        // We pass the mouse coordinates to the createParticle() function
        createParticle(e.clientX, e.clientY);
    }
}

addEventListener('click', (e) => {
    pop(e);
});