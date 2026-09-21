var timeAlive = document.getElementById("time-alive");

var dateOfBirth = new Date("2007-05-24T00:00:00"); // Replace with your date of birth

//=======================================
timeAlive.innerHTML = calculateTimeAlive(dateOfBirth);

function calculateTimeAlive(dob) {
    //string is just amount of full days
    var now = new Date();
    var timeDiff = now - dob; // Difference in milliseconds
    var daysAlive = Math.floor(timeDiff / (1000 * 60 * 60 * 24)); // Convert to days
    return "DAY " + daysAlive;
}