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
