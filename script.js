// https://www.gameuidatabase.com/gameData.php?id=322
// References to DOM Elements
const book = document.querySelector("#book");

const bookSize = 0.75 * window.innerHeight; // 75% of the window height, width == 75% * 0.66 * window.innerHeight
const bookWidth = bookSize * 2 / 3;
const pageOffset = 7.5; //px

const papers = document.querySelectorAll(".paper");
papers.forEach((paper, index) => {
    paper.style.zIndex = -index;
    paper.style.width = "0.0001px";
});
const paperWidth = papers[0].clientWidth;

// Event Listener
document.querySelectorAll('div:has(> .fas.fa-arrow-left)').forEach((el) => {
    el.addEventListener('click', goPrevPage)
});

//div:has(> .fas.fa-arrow-right)

document.querySelectorAll('div:has(> .fas.fa-arrow-right)').forEach((el) => {
    el.addEventListener('click', goNextPage)
});

// Business Logic
let currentLocation = 1;
const numOfPapers = papers.length;
const maxLocation = numOfPapers + 1;

book.style.transform = "translateX(" + (-bookWidth / 2) + "px)";

function openBook() {
    book.style.transform = "translateX(0)";
    papers.forEach((paper, index) => {
        paper.style.width = pageOffset + "px";
    });
}

function closeBook(isAtBeginning) {
    if (isAtBeginning) {
        book.style.transform = "translateX(" + (-bookWidth / 2) + "px)";
    } else {
        book.style.transform = "translateX(" + (bookWidth / 2) + "px)";
    }

    papers.forEach((paper, index) => {
        paper.style.width = "0.0001px";
    });
}

function goNextPage() {
    if (isEasing) return;
    if (currentLocation < maxLocation) {
        if (currentLocation === 1) {
            openBook();
        } else if (currentLocation === numOfPapers) {
            closeBook(false);
        }

        const currentPaper = papers[currentLocation - 1];
        const frontPaper = currentPaper.querySelector(".front");
        const backPaper = currentPaper.querySelector(".back");
        //currentPaper.classList.add("flipped");

        var temp = -1 * currentPaper.style.zIndex
        ease(0, -180, 500, (value) => {
            frontPaper.style.transform = "rotateY(" + value + "deg)";
            backPaper.style.transform = "rotateY(" + value + "deg)";

            //if ease is halfway done, change z-index
            if ((value * -1) < 90) {
                currentPaper.style.zIndex = temp
            }
        });
        currentLocation++;
    }
}

function goPrevPage() {
    if (isEasing) return;

    if (currentLocation > 1) {
        currentLocation--;

        if (currentLocation === 1) {
            closeBook(true);
        } else if (currentLocation === numOfPapers) {
            openBook();
        }

        const currentPaper = papers[currentLocation - 1];
        const frontPaper = currentPaper.querySelector(".front");
        const backPaper = currentPaper.querySelector(".back");
        //currentPaper.classList.remove("flipped");



        ease(-180, 0, 500, (value) => {
            frontPaper.style.transform = "rotateY(" + value + "deg)";
            backPaper.style.transform = "rotateY(" + value + "deg)";

            //if ease is halfway done, change z-index
            if (value === 0) {
                console.log(value)
                currentPaper.style.zIndex = 1 - currentLocation
            }
        });
    }
}

var isEasing = false;

function ease(start, end, time, callback) {
    if (isEasing) return;
    isEasing = true;
    start = Number(start);
    end = Number(end);
    const startTime = Date.now();
    const duration = time;

    function update() {
        if (!isEasing) return;

        const currentTime = Date.now();
        const elapsed = currentTime - startTime;

        if (elapsed >= duration) {
            callback(end);
            isEasing = false;
        } else {
            const progress = elapsed / duration;
            const easedValue = start + (end - start) * (progress * (2 - progress));
            callback(easedValue);
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}