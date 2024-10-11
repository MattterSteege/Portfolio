// ======================================================== dragging cards ========================================================
//    <div class="draggable card">

let dragging = false;
let currentCard = null;
let currentCardIndex = null;
let currentCardInitialIndex = null;
let currentCardInitialX = null;
let currentCardInitialY = null;

document.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('draggable')) {
        dragging = true;
        currentCard = e.target;
        currentCardIndex = [...currentCard.parentElement.children].indexOf(currentCard);
        currentCardInitialIndex = currentCardIndex;
        currentCardInitialX = e.clientX;
        currentCardInitialY = e.clientY;
        currentCard.style.zIndex = 100;
    }
});

document.addEventListener('mousemove', (e) => {
    if (dragging) {
        const deltaX = e.clientX - currentCardInitialX;
        const deltaY = e.clientY - currentCardInitialY;
        currentCard.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    }
});

document.addEventListener('mouseup', (e) => {
    if (dragging) {
        dragging = false;
        currentCard.style.zIndex = 1;
        currentCard.style.transform = '';
        const finalX = e.clientX;
        const finalY = e.clientY;
        const finalIndex = Math.floor(currentCardIndex + (finalY - currentCardInitialY) / 100);
        if (finalIndex < 0) {
            currentCardIndex = 0;
        } else if (finalIndex >= currentCard.parentElement.children.length) {
            currentCardIndex = currentCard.parentElement.children.length - 1;
        } else {
            currentCardIndex = finalIndex;
        }
        if (currentCardIndex !== currentCardInitialIndex) {
            const cards = currentCard.parentElement.children;
            const temp = cards[currentCardIndex];
            cards[currentCardIndex] = cards[currentCardInitialIndex];
            cards[currentCardInitialIndex] = temp;
            for (let i = 0; i < cards.length; i++) {
                cards[i].style.transform = '';
            }
        }
    }

    currentCard = null;
    currentCardIndex = null;
    currentCardInitialIndex = null;
    currentCardInitialX = null;
    currentCardInitialY = null;
});