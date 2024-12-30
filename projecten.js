const markdownConverterOptions = {
    simplifiedAutoLink: true,
    strikethrough: true,
    tables: true,
    tasklists: true,
    simpleLineBreaks: true,
    openLinksInNewWindow: true,
    emoji: true,
    underline: true,
    literalMidWordUnderscores: true,
    ghMentions: true,
    ghMentionsLink: ' ',
    metadata: true,
    parseImgDimensions: true,
    requireSpaceBeforeHeadingText: true,
    ghCodeBlocks: true,
    backticks: 'asciimath',
    disableForced4SpacesIndentedSublists: true,
};

const showdownConverter = new showdown.Converter(markdownConverterOptions);
const cellsContainer = document.querySelector('.cells');
const grid = document.querySelector('.grid');
const projectHeader = document.querySelector('.project-header');
const projectDescription = document.querySelector('.project-description');
const backButton = document.querySelector('.buttons #backButton');
const UI = document.querySelector('.ui');
const gridSize = parseFloat(getComputedStyle(document.body).getPropertyValue('--grid-size')) || 100;
const gap = parseFloat(getComputedStyle(document.body).getPropertyValue('--gap')) || 10;

function generateProjectsWithDelay() {
    let delay = 500;

    //rerder projects based on project.pos.x and then by project.pos.y
    projects.sort((a, b) => a.pos.x - b.pos.x || a.pos.y - b.pos.y);
    projects.forEach((project) => {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.title = project.title;
        cell.dataset.x = project.pos.x;
        cell.dataset.y = project.pos.y;
        //add variable --coords-x and --coords-y
        cell.style.setProperty('--coords-x', project.pos.x);
        cell.style.setProperty('--coords-y', project.pos.y);

        cell.style.opacity = 0;
        cell.style.transform = 'translate(-50%, calc(-50% - 200px))';

        cell.setAttribute('onclick', `selectCube(${project.pos.x}, ${project.pos.y})`);

        const img = document.createElement('img');
        img.src = project.image;
        img.alt = project.title;
        img.height = 80;
        img.width = 80;
        img.style.height = '100%';

        const hoverCover = document.createElement('div');
        hoverCover.classList.add('hover-cover');

        cell.appendChild(img);
        cell.appendChild(hoverCover);
        cellsContainer.appendChild(cell);

        cell.addEventListener('mouseenter', () => {
            if (!cell.classList.contains('selected')) changeText(cell);
        });
    });

    document.querySelectorAll('.cells .cell').forEach((cell) => {
        setTimeout(() => {
            cell.style.opacity = 1;
            cell.style.transform = '';
        }, delay);
        delay += 125;
    });
}

function selectCube(x, y) {
    const cells = document.querySelectorAll('.cells .cell');

    cells.forEach(cell => {
        cell.classList.add('unselected');

        if (cell.dataset.x == x && cell.dataset.y == y) {
            fetch(`/Projecten/${cell.dataset.title.replace(/ /g, '')}.md`)
                .then(response => response.text())
                .then(text => {
                    const html = showdownConverter.makeHtml(text);
                    cell.classList.add('selected');
                    cell.classList.remove('unselected');
                    projectHeader.classList.add('active');
                    projectHeader.innerText = cell.dataset.title;
                    projectDescription.innerHTML = html;
                    projectDescription.classList.remove('hidden');
                    UI.style.pointerEvents = 'all';

                    grid.style.top = '150vh'; // Set initial position
                    cellsContainer.classList.add('animate');
                    cellsContainer.classList.remove('unanimate');

                    backButton.style.transform = 'translateY(0)';
                });
        } else if (x == 0 && y == 0) {
            cell.classList.remove('selected', 'unselected');
            projectHeader.classList.remove('active');
            projectDescription.classList.add('hidden');
            UI.style.pointerEvents = '';

            grid.style.top = '';
            cellsContainer.classList.add ('unanimate');
            cellsContainer.classList.remove('animate');
            backButton.style.transform = '';
        }
    });
}

function changeText(cell) {
    const project = projects.find(project => project.pos.x == cell.dataset.x && project.pos.y == cell.dataset.y);
    projectHeader.innerText = project.title;
}

// Initialize the grid and projects
generateProjectsWithDelay();

// Attach global selectCube function to window for onclick attribute
window.selectCube = selectCube;

// Prevent default behavior for anchor links and scroll to the target element
document.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', function(e) {
        e.preventDefault();
        const element = document.querySelector(this.getAttribute('href'));
        if (element) {
            const elementTop = element.getBoundingClientRect().top;
            const elementHeight = element.getBoundingClientRect().height;
            const windowTop = window.scrollY;
            const windowHeight = window.innerHeight;
            const scrollAmount = elementTop - windowTop - windowHeight / 2 + elementHeight / 2;
            window.scrollBy({top: scrollAmount, behavior: 'smooth'});
        }
    });
});