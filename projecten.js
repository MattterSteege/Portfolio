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
        const CellHtml = `
        <div class="cell" data-title="${project.title}" data-x="${project.pos.x}" data-y="${project.pos.y}" onclick="selectCube(${project.pos.x}, ${project.pos.y})" style="--coords-x: ${project.pos.x}; --coords-y: ${project.pos.y}; transform: translate(-50%, -100%);">
            <img src="${project.image}" alt="${project.title}" height="80" width="80" style="height: 100%;">
            <div class="hover-cover"></div>
        </div>
        `;

        const cell = new DOMParser().parseFromString(CellHtml, 'text/html').body.firstChild;

        cellsContainer.appendChild(cell);

        cell.addEventListener('mouseenter', () => {
            if (!cell.classList.contains('selected')) {
                projectHeader.innerText = project.title;
            }
        });
    });

    document.querySelectorAll('.cells .cell').forEach((cell) => {
        setTimeout(() => {
            cell.style.opacity = 1;
            cell.style.transform = '';
        }, delay += 125);
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

generateProjectsWithDelay(); // Initialize the grid and projects
window.selectCube = selectCube; // Attach global selectCube function to window for onclick attribute