window.config = {
    showParticles: true,
}

function createParticle(x, y, colors, burst) {
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
    particle.style.background = colors[Math.floor(Math.random() * colors.length)];


    const destinationX = x + (Math.random() - 0.5) * burst * 2;
    const destinationY = y + (Math.random() - 0.25) * burst * 2;

    // Store the animation in a variable because we will need it later
    const animation = particle.animate([{
        // Set the origin position of the particle
        // We offset the particle with half its size to center it around the mouse
        transform: `translate(${x - (size / 2)}px, ${y - (size / 2)}px)`, opacity: 1
    }, {
        // We define the final coordinates as the second keyframe
        transform: `translate(${destinationX}px, ${destinationY}px)`, opacity: 0
    }], {
        // Set a random duration from 500 to 1500ms
        duration: 500 + Math.random() * 1000,
        easing: 'cubic-bezier(0, .9, .57, 1)', // Delay every particle with a random value from 0ms to 200ms
        delay: Math.random() * 100
    });

    // When the animation is complete, remove the element from the DOM
    animation.onfinish = () => {
        particle.remove();
    };
}

// Event listener for demonstration
document.addEventListener('click', (e) => {
    // Loop to generate 30 particles at once
    for (let i = 0; i < 30; i++) {
        // We pass the mouse coordinates to the createParticle() function
        createParticle(e.clientX, e.clientY, ['#23161f', "#2d1b28", "#36212d", "#432f3d"], 30);
    }
});

function pop(e) {
    if (!window.config.showParticles) return
    // Loop to generate 30 particles at once
    for (let i = 0; i < 50; i++) {
        // We pass the mouse coordinates to the createParticle() function
        //createParticle(e.clientX, e.clientY, ['#23161f', "#2d1b28", "#36212d", "#432f3d"], 30); //background colorscheme
    }
}

addEventListener('click', (e) => {
    pop(e);
});

//===================================================================================================

addEventListener('DOMContentLoaded', () => {
    if (!window.config.showParticles) return
    //every 6-10 seconds
    setInterval(() => {
        //sandy colorscheme
        const posX = Math.random() * window.innerWidth;
        for (let i = 0; i < 50; i++) {
            createParticle(posX, -2, ['#f6d7b0', '#f2d2a9', '#eccca2', '#e7c496', '#e1bf92'], 30);
        }
    }, 6000 + Math.random() * 4000);
})

//===================================================================================================
let currentPage = 0;

function nextPage() {
    const views = document.querySelectorAll(".view");
    if (currentPage > 0) {
        views[currentPage].style.transform = "translate(100%, 0)";
        views[currentPage - 1].style.transform = "translate(0, 0)";
        currentPage--;
    }
}

function prevPage() {
    const views = document.querySelectorAll(".view");
    if (currentPage < views.length - 1) {
        views[currentPage].style.transform = "translate(-100%, 0)";
        views[currentPage + 1].style.transform = "translate(0, 0)";
        currentPage++;
    }
}

//===================================================================================================
function replacePage(url) {
    //close scroll and fetch
    closeScroll().then(() => {
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    document.querySelector("main").innerHTML = "<h1 style='text-align: center; justify-content: center'>De pagina kon niet worden geladen?<br>Meer weet ik ook niet!</h1>";
                    openScroll();
                    throw new Error("Failed to load page");
                }

                return response.text();
            })
            .then(html => {
                document.querySelector("main").innerHTML = html;
                openScroll();
                currentPage = 0;
            });
    });
}

const animationDuration = 500;
const scroll = document.getElementById("scroll");
function closeScroll() {
    return new Promise((resolve) => {
        scroll.classList.remove("open");
        scroll.classList.add("close");
        setTimeout(resolve, animationDuration);
    });
}

function openScroll() {
    return new Promise((resolve) => {
        scroll.classList.remove("close");
        scroll.classList.add("open");
        setTimeout(resolve, animationDuration);
    });
}