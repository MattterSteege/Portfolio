/*

<div id="cards-container" style="z-index: -5;">
    <div id="domino-day" class="draggable card stationary">
        <img src="/images/Postcard.svg" alt="">
    </div>

    <div id="eenzaamheidsvirus" class="draggable card stationary">
        <img src="/images/Postcard.svg" alt="">
    </div>

    <div id="create_the_escape" class="draggable card stationary">
        <img src="/images/Postcard.svg" alt="">
    </div>

    <div id="miniproject" class="draggable card stationary">
        <img src="/images/Postcard.svg" alt="">
    </div>

    <div id="750_jaar_gouda" class="draggable card stationary">
        <img src="/images/Postcard.svg" alt="">
    </div>
</div>

when a card is dropped ontop of #envelope, place it a bit above the envelope, then animate it to the center of the envelope, and then call flipEnvelope() to close it

you do need to mark the envelope with the css v
*/

const cards = document.querySelectorAll('.draggable');
const envelope = document.querySelector('#envelope');

cards.forEach(card => {
    card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', card.id);
    });

    card.addEventListener('dragend', (e) => {
        card.classList.remove('dragging');
    });

    card.addEventListener('drag', (e) => {
        card.classList.add('dragging');
    });

    card.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    card.addEventListener('drop', (e) => {
        e.preventDefault();
        const cardId = e.dataTransfer.getData('text/plain');
        const droppedCard = document.querySelector(`#${cardId}`);
        //get the x and y positions of the card's center
        const cardRect = droppedCard.getBoundingClientRect();
        const cardCenterX = cardRect.left + cardRect.width / 2;
        const cardCenterY = cardRect.top + cardRect.height / 2;

        const envelopeRect = envelope.getBoundingClientRect();
        const envelopeCenterX = envelopeRect.left + envelopeRect.width / 2;
        const envelopeCenterY = envelopeRect.top + envelopeRect.height / 2;

        droppedCard.style.top = '0';
        droppedCard.style.left = '0';

        //droppedCard.style.transition = 'top 1s, left 1s';
        droppedCard.style.top = `${cardCenterX}px`;
        droppedCard.style.left = `${cardCenterY}px`;

        droppedCard.style.transform = '';
        droppedCard.style.top = `${envelopeCenterY - 300}px`;
        droppedCard.style.left = `50%`;
        setTimeout(() => {
            //set the y position to the center of the envelope
            droppedCard.style.top = `${envelopeCenterY}px`;
            droppedCard.style.left = `${envelopeCenterX}px`;
            //flip the envelope
            setTimeout(() => {
                flipEnvelope();
                setTimeout(() => {
                    droppedCard.style.display = 'none';
                },1000);
            }, 1000);
        }, 1000);
    });
});
