document.addEventListener('DOMContentLoaded', () => {
    (function ($) {
        $(function () {
            // Initialize and resize FlipClock
            agDetectmob();
            agChangeResize();

            $(window).resize(function () {
                agChangeResize();
            });

            function agChangeResize() {
                var agFlipClock = $('.js-flipclock');

                // Add or remove class based on screen width
                if (window.innerWidth > 480) {
                    agFlipClock.removeClass('js-ag-show');
                } else {
                    agFlipClock.addClass('js-ag-show');
                }
            }

            function agDetectmob() {
                // Set countdown time (e.g., 4.1 hours in seconds)
                var agDiff = 60 * 5;

                // Initialize FlipClock and attach the instance to a global variable
                window.flipClockInstance = $('.js-flipclock').FlipClock(agDiff, {
                    clockFace: 'HourlyCounter',
                    countdown: true,
                });

                // Add labels for hours, minutes, and seconds
                setTimeout(() => {
                    removeDefaultLabels(); // Remove default labels
                    addLabels();
                }, 500); // Delay to ensure FlipClock renders

                return true;
            }


            function addLabels() {
                const flipClockWrapper = document.querySelector('.flip-clock-wrapper');

                if (flipClockWrapper) {
                    const units = ['Hours', 'Minutes', 'Seconds']; // Labels for each group
                    const ulElements = Array.from(flipClockWrapper.querySelectorAll('ul')); // Select all digit elements

                    // Loop through and group every 2 UL elements for Hours, Minutes, Seconds
                    for (let i = 0; i < ulElements.length; i += 2) {
                        // Create the main container for the group
                        const groupContainer = document.createElement('div');
                        groupContainer.className = 'group-container';

                        // Create a row for the two digits
                        const digitRow = document.createElement('div');
                        digitRow.className = 'digit-row';

                        // Append the two UL elements (digits) to the digit row
                        digitRow.appendChild(ulElements[i]); // First digit
                        digitRow.appendChild(ulElements[i + 1]); // Second digit

                        // Create the label and append it below the digit row
                        const label = document.createElement('div');
                        label.textContent = units[i / 2]; // Assign appropriate label (Hours, Minutes, Seconds)
                        label.className = 'label';

                        // Assemble the group container
                        groupContainer.appendChild(digitRow); // Add the digit row
                        groupContainer.appendChild(label); // Add the label

                        // Append the group container into the FlipClock wrapper
                        flipClockWrapper.appendChild(groupContainer);
                    }
                    // Adjust colons (divider elements) between groups
                    adjustColons();
                }
            }

            function adjustColons() {
                const dividers = document.querySelectorAll('.flip-clock-divider');
                const groupContainers = document.querySelectorAll('.group-container');

                if (dividers.length >= 2 && groupContainers.length >= 2) {
                    // Insert the first colon between Hours and Minutes
                    groupContainers[0].after(dividers[1]);

                    // Insert the second colon between Minutes and Seconds
                    groupContainers[1].after(dividers[2]);
                }
            }

            function removeDefaultLabels() {
                const defaultLabels = document.querySelectorAll('.flip-clock-divider .flip-clock-label');
                defaultLabels.forEach(label => label.remove()); // Remove each label
            }

        });
    })(jQuery);
});
