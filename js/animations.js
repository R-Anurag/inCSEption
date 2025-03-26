$(document).ready(function () {
    // Wait until FlipClock is initialized
    const waitForFlipClock = setInterval(() => {
        if (window.flipClockInstance) {
            console.log('FlipClock instance found!', window.flipClockInstance); // Debugging log
            clearInterval(waitForFlipClock); // Stop checking
            startAnimations(window.flipClockInstance); // Start animations now that FlipClock is ready
        } else {
            console.warn('Waiting for FlipClock instance...');
        }
    }, 100); // Check every 100ms
});

/**
 * Start animations linked to FlipClock countdown.
 * @param {object} flipClock - The initialized FlipClock instance
 */
function startAnimations(flipClock) {
    const startTime = new Date();
    startTime.setHours(8, 30, 0, 0); // 8:30 AM
    const endTime = new Date();
    endTime.setHours(14, 30, 0, 0); // 2:30 PM

    // Calculate total countdown duration in seconds
    const totalTimeInSeconds = Math.floor((endTime - startTime) / 1000);

    // Create interval to synchronize animations dynamically
    const interval = setInterval(() => {
        const remainingTime = flipClock.getTime().time; // Get remaining time in seconds
        updateAnimations(remainingTime, totalTimeInSeconds); // Pass total time for percentage calculation

        // Stop interval if countdown has ended
        if (remainingTime <= 0) {
            clearInterval(interval);
            stopAnimations(); // Stop animations
        }
    }, 1000); // Update every second
}

/**
 * Update animations based on remaining time.
 * @param {number} remainingTime - Remaining time in seconds
 */
function updateAnimations(remainingTime, totalTimeInSeconds) {
    const progressPercentage = 100 - (remainingTime / totalTimeInSeconds) * 100;

    // Update progress bar position
    $('#progress-time-fill').attr('x', `${-100 + progressPercentage}%`);

    // Update death group position
    const deathPosition = (remainingTime / totalTimeInSeconds) * 581; // Total movement range
    $('#death-group').css('transform', `translateX(${581 - deathPosition}px)`);
}


/**
 * Stop all animations when the countdown ends.
 */
function stopAnimations() {
    console.log('Stopping all animations...');
    $('#progress-time-fill, #red-flame, #yellow-flame, #white-flame').css('animation-play-state', 'paused');
    $('#death-arm, #death-tool, #designer-arm-grop').css('animation-play-state', 'paused');
    $('.deadline-days .day').text(0); // Ensure days display 0
}
