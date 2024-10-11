// ======================================================== envelope flip ========================================================
const envelopeFlap = document.querySelector('#envelope-lid');
const envelopeFlapInside = document.querySelector('#envelope-lid-in');
const envelopeFlapOutside = document.querySelector('#envelope-lid-out');
let isFlipped = false;
function flipEnvelope(flipTime = 1000) {
    //rotate envelopeFlap to 90deg, then set the envelopeFlapInside to z-index: 2, then rotate envelopeFlap to 180deg (using ease function and flipEnvelope function)
    if (!isFlipped) {
        ease(0, 90, flipTime / 2, (value) => {
            envelopeFlap.style.transform = `rotateX(${value}deg)`;
        }, 'easeIn');
        setTimeout(() => {
            envelopeFlapInside.style.zIndex = 0;
            envelopeFlapOutside.style.zIndex = 2;
            ease(90, 180, flipTime / 2, (value) => {
                envelopeFlap.style.transform = `rotateX(${value}deg)`;
            }, 'easeOut');

            setTimeout(() => {
                envelopeFlap.style.zIndex = 1;
            }, flipTime / 2);
        }, flipTime / 2);
        isFlipped = true;
    } else {
        ease(180, 90, flipTime / 2, (value) => {
            envelopeFlap.style.transform = `rotateX(${value}deg)`;
        }, 'easeIn');
        setTimeout(() => {
            envelopeFlapInside.style.zIndex = 2;
            envelopeFlapOutside.style.zIndex = 0;
            ease(90, 0, flipTime / 2, (value) => {
                envelopeFlap.style.transform = `rotateX(${value}deg)`;
            }, 'easeOut');

            setTimeout(() => {
                envelopeFlap.style.zIndex = -100;
            }, flipTime / 2);
        }, flipTime / 2);
        isFlipped = false;
    }
}

function ease(start, end, time, callback, easeType = 'ease') {
    start = Number(start);
    end = Number(end);
    const startTime = performance.now();
    const duration = time;

    function easeIn(t) {
        return t * t;
    }

    function easeOut(t) {
        return t * (2 - t);
    }

    function easeInOut(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    function update(currentTime) {
        const elapsed = currentTime - startTime;

        if (elapsed >= duration) {
            callback(end);
            return;
        }
        const progress = elapsed / duration;
        let easedProgress;

        switch (easeType) {
            case 'easeIn':
                easedProgress = easeIn(progress);
                break;
            case 'easeOut':
                easedProgress = easeOut(progress);
                break;
            case 'ease':
            default:
                easedProgress = easeInOut(progress);
                break;
        }
        const easedValue = start + (end - start) * easedProgress;
        callback(easedValue);

        requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}