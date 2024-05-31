var pages = document.querySelectorAll(".page");
pages.forEach(function (page, index) {
    page.style.zIndex = pages.length - index;

    if (page.classList.contains('left')){
        page.children[0].style.transform = `scaleX(-1)`;
    }
});

currentPage = 0;

const isBookOpen = () => document.body.style.getPropertyValue('--page-gap') === '3.75px';

function openBook() {
    document.body.style.setProperty('--page-gap', `3.75px`);
}

function closeBook() {
    document.body.style.setProperty('--page-gap', `0`);
}

function nextPage() {
    if (isEasing) return;
    if (currentPage >= pages.length - 1) return;
    if (!isBookOpen()) openBook();
    var page1 = pages[currentPage];
    var page2 = pages[currentPage + 1];

    ease(0, -180, 500, function (value) {
        page1.style.transform = `rotateY(${value}deg)`;
        page2.style.transform = `rotateY(${value}deg)`;

        if (value * -1 > 90) {
            page1.style.zIndex = currentPage + 1;
            page2.style.zIndex = currentPage;
        }
    });

    currentPage += 2;

    if (currentPage >= pages.length) closeBook();
}

function prevPage() {
    if (isEasing) return;
    if (currentPage === 0) return;
    if (currentPage >= 0) openBook();

    var page1 = pages[currentPage - 2];
    var page2 = pages[currentPage - 1];

    ease(-180, 0, 500, function (value) {
        page1.style.transform = `rotateY(${value}deg)`;
        page2.style.transform = `rotateY(${value}deg)`;

        if (value * -1 < 90) {
            page1.style.zIndex = pages.length - currentPage;
            page2.style.zIndex = pages.length - currentPage - 1;
        }
    });

    currentPage -= 2;

    if (isBookOpen() && currentPage === 0) closeBook();
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

function changeTransform(element, type, value) {
    //type = 'rotateY'
    //value = 90
    //style.transform = `rotateY(180deg) translateX(100px)`;
    //will become style.transform = `rotateY(90deg) translateX(100px)`;

    var transform = element.style.transform;
    var transformArray = transform.split(' ');
    var newTransform = '';
    transformArray.forEach(function (item) {
        if (item.includes(type)) {
            newTransform += `${type}(${value}deg) `;
        } else {
            newTransform += `${item} `;
        }
    });
    element.style.transform = newTransform;
}