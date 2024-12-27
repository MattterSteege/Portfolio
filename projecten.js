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
}
const showdownConverter = new showdown.Converter(markdownConverterOptions);

const cellsContainer = document.querySelector('.cells');
const grid = document.querySelector('.grid');
const projectHeader = document.querySelector('.project-header');
const projectDescription = document.querySelector('.project-description');
const backButton = document.querySelector('.buttons #backButton');
const UI = document.querySelector('.ui');

function generateProjectsWithDelay() {
    const gridSize = parseFloat(getComputedStyle(document.body).getPropertyValue('--grid-size')) || 100;
    const gap = parseFloat(getComputedStyle(document.body).getPropertyValue('--gap')) || 10;
    let delay = 500;
    const viewWidth = window.innerWidth;

    projects.forEach((project) => {
        const cell = document.createElement('div');
        cell.classList.add('cell');

        // Set dataset attributes
        cell.dataset.title = project.title;
        cell.dataset.x = project.pos.x;
        cell.dataset.y = project.pos.y;

        var top = `calc(${gridSize}px * ${project.pos.y - 1} + ${gap}px * ${project.pos.y - 1})`;
        var left = `calc(${gridSize}px * ${project.pos.x - 1} + ${gap}px * ${project.pos.x - 1})`;
        cell.style.top = top;
        cell.style.left = left;
        cell.style.zIndex = 1000 - (project.pos.x * 10 + project.pos.y);
        cell.style.opacity = 0;
        cell.style.transform = 'translateY(-200px)';

        // Add onclick event for selection
        cell.setAttribute('onclick', `selectCube(${project.pos.x}, ${project.pos.y})`);

        // Add image and hover cover
        const img = document.createElement('img');
        img.src = project.image;
        img.alt = project.title;
        img.height = 80;
        img.width = 80;

        img.style.height = '100%';
        img.style.translate = '0% 0%';

        const hoverCover = document.createElement('div');
        hoverCover.classList.add('hover-cover');

        cell.appendChild(img);
        cell.appendChild(hoverCover);
        cellsContainer.appendChild(cell);

        // Add mouseenter event listener
        cell.addEventListener('mouseenter', () => {
            if (cell.classList.contains('selected')) return;
            changeText(cell)
        });
    });

    render();

    document.querySelectorAll('.cells .cell').forEach((cell) => {
        setTimeout(() => {
            cell.style.opacity = 1;
            cell.style.transform = '';
        }, delay);

        delay += 125;
    });
}

const cells = [];
const cellsCount = Number(getComputedStyle(document.body).getPropertyValue('--cells'));
function render() {
    // Render grid lines based on gap
    if (getComputedStyle(grid).getPropertyValue('--gap').trim() === '0' ||
        getComputedStyle(grid).getPropertyValue('--gap').trim() === '0px') {
        grid.style.backgroundImage = 'none';
    } else {
        grid.style.backgroundImage = 'linear-gradient(0deg, var(--line-color) 1px, transparent 0), linear-gradient(90deg, var(--line-color) 1px, transparent 0)';
    }


    // Create grid cells

    if (grid.children.length === 0) {
        for (let x = 1; x < cellsCount + 1; x++) {
            for (let y = 1; y < cellsCount + 1; y++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.x = x;
                cell.dataset.y = y;
                cell.style.top = `calc(100% - var(--grid-size) * ${cell.dataset.y} - var(--gap) * ${cell.dataset.y - 1})`;
                cell.style.left = `calc(100% - var(--grid-size) * ${cell.dataset.x} - var(--gap) * ${cell.dataset.x - 1})`;
                cell.style.zIndex = 1000 - (cell.dataset.x - 1) * 10 - (cell.dataset.y - 1);

                const positioner = document.createElement('div');
                positioner.classList.add('positioner');
                cell.appendChild(positioner);
                grid.appendChild(cell);
            }
        }
    }

    const gridCells = grid.querySelectorAll('.cell');

    gridCells.forEach((cell) => {
        const x = cell.dataset.x;
        const y = cell.dataset.y;
        const gridCell = document.querySelector(`.grid .cell[data-x="${x}"][data-y="${y}"]`);
        const cellsCell = document.querySelectorAll(`.cells .cell[data-x="${x}"][data-y="${y}"]`);

        if (gridCell && cellsCell) {
            if (cellsCell.length === 1) {
                cells.push({coords: {x, y}, grid: gridCell, cell: cellsCell[0]});
                calculatePosition(cells[cells.length - 1]);
                window.addEventListener('resize', () => {
                    calculatePosition(cells[cells.length - 1]);
                });
            }
            else if (cellsCell.length > 1) {
                cellsCell.forEach((cell) => {
                    cells.push({coords: {x, y}, grid: gridCell, cell: cell});
                    calculatePosition(cells[cells.length - 1]);
                    window.addEventListener('resize', () => {
                        calculatePosition(cells[cells.length - 1]);
                    });
                });
            }
        }
    });

    // Position cells based on grid
    function calculatePosition(cell) {
        const screenPositioner = cell.grid.querySelector('.positioner');
        const screenPosition = screenPositioner.getBoundingClientRect();
        const relativePosition = grid.getBoundingClientRect();

        cell.cell.style.zIndex = 1000 - (cell.grid.dataset.x - 1) * 10 - (cell.grid.dataset.y - 1);
        cell.cell.style.top = `${screenPosition.top - relativePosition.top}px`;
        cell.cell.style.left = `${screenPosition.left - relativePosition.left}px`;
    }

    //calculatePosition();
}

function selectCube(x, y) {
    const cells = document.querySelectorAll('.cells .cell');

    cells.forEach(cell => {
        cell.classList.add('unselected');

        if (cell.dataset.x == x && cell.dataset.y == y) {{

            fetch("/Projecten/" + cell.dataset.title.replace(/ /g, '') + ".md")
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

                    grid.style.top = '150vh';
                    cellsContainer.classList.add('animate');
                    cellsContainer.classList.remove('unanimate');

                    backButton.style.transform = 'translateY(0)';

                });
        }
        }
        else if (x == 0 && y == 0) {
            cell.classList.remove('selected');
            cell.classList.remove('unselected');
            projectHeader.classList.remove('active');
            projectDescription.classList.add('hidden');
            UI.style.pointerEvents = '';

            grid.style.top = '';
            cellsContainer.classList.add('unanimate');
            cellsContainer.classList.remove('animate');


            backButton.style.transform = '';
        }
    });
}

function changeText(cell) {
    var project = projects.find(project => project.pos.x == cell.dataset.x && project.pos.y == cell.dataset.y);
    projectHeader.innerText = project.title;
}

// Initialize the grid and projects
render();
generateProjectsWithDelay();

// Attach global selectCube function to window for onclick attribute
window.selectCube = selectCube;

//when a user clicks on a link <a> tag and it is to #, prevent the default behaviour and scroll the description element till that element is in view
document.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', function(e) {
        e.preventDefault();
        const element = document.querySelector(this.getAttribute('href'));
        if (element) {
            //scroll to the element (without using built in scrollIntoView)
            const elementTop = element.getBoundingClientRect().top;
            const elementHeight = element.getBoundingClientRect().height;
            const windowTop = window.scrollY;
            const windowHeigth = window.innerHeight;
            const scrollAmount = elementTop - windowTop - windowHeigth / 2 + elementHeight / 2;
            window.scrollBy({top: scrollAmount, behavior: 'smooth'});
        }
    });
});