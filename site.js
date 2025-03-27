window.config = {
    showParticles: true,
}

// Example usage
const particleSystem = new ParticleSystem({
    gravity: 150,  // Pixels/second^2 for visual effect
    container: document.querySelector('#particles-js'),
    colors: ['#23161f', "#2d1b28", "#36212d", "#432f3d"]
});

// Event listener for demonstration
document.addEventListener('click', (e) => {
    particleSystem.burst(e.clientX, e.clientY, 20, {
        angle: -90,
        speed: 300
    });
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