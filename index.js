var timeAlive = document.getElementById("time-alive");
var backstory = document.getElementById("backstory");
var backstoryBox = document.getElementById("backstory-box");
var backstoryStoryBox = document.getElementById("backstory-story-box");

var dateOfBirth = new Date("2007-05-24T00:00:00"); // Replace with your date of birth
var currentBackstory = 0;

//=======================================
timeAlive.innerHTML = calculateTimeAlive(dateOfBirth);

function calculateTimeAlive(dob) {
    //string is just amount of full days
    var now = new Date();
    var timeDiff = now - dob; // Difference in milliseconds
    var daysAlive = Math.floor(timeDiff / (1000 * 60 * 60 * 24)); // Convert to days
    return "DAY " + daysAlive;
}

backstory.addEventListener("click", function() {
    backstoryBox.style.opacity = "1";
});

document.addEventListener("click", function(event) {
    if (currentBackstory >= 0 && currentBackstory < 3 && event.target !== backstory && backstoryBox.style.opacity === "1") {
        nextStoryPage();
    }
    else {
        backstoryBox.style.opacity = "0";
        currentBackstory = 0;
    }
});



function nextStoryPage(){
    var texts = [
        "Hi, I'm Matt!",
        "I was born on May 24, 2007.",
        "I love coding and creating new things."
    ]

    movieWrite(backstoryStoryBox, texts[currentBackstory], 50);
    currentBackstory++;
}

let interval;

function movieWrite(element, text, speed) {
    clearInterval(interval);
    element.innerHTML = "​"; // Clear the element's content
    let i = 0;
     interval = setInterval(function() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
        } else {
            clearInterval(interval);
        }
    }, speed);
}