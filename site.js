window.transitionToPage = function(href) {
    document.querySelector('body').style.opacity = 0
    setTimeout(function() {
        window.location.href = href
    }, 500)
}

document.addEventListener('DOMContentLoaded', function(event) {
    setTimeout(function() {
        document.querySelector('body').style.opacity = 1
    }, 0)
});

const openSchoolPortfolio = () =>  transitionToPage('p_grid.html');
const openPersonalPortfolio = () => transitionToPage('s_grid.html');


//image enlargement
function activeImageEnlargement() {
    const images = document.querySelectorAll("#documentElement img");
    const modal = document.getElementById("myModal");
    const span = document.getElementById("close");
    const modalImage = document.getElementById("modal-image");

    images.forEach((img) => {
        // When the user clicks the big picture, set the image and open the modal
        img.onclick = function (e) {
            console.log(e.target.src);
            var src = e.target.src;
            modal.style.display = "block";
            modalImage.src = src;
        };

// When the user clicks on <span> (x), close the modal
        span.onclick = function () {
            modal.style.display = "none";
        };

// When the user clicks anywhere outside of the modal, close it
        window.onclick = function (event) {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        };
    });
}

window.activeImageEnlargement = activeImageEnlargement;