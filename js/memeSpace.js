import { collection, query, addDoc, where, onSnapshot, getDocs, doc, getDoc, updateDoc, arrayUnion, increment, orderBy, arrayRemove } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { db } from "./firebaseConfig.js"; // Import Firestore instance


/* ===================================
    Testing Firebase Connection
=================================== */
// async function testFirestore() {
//     try {
//         // Access the "test" collection
//         const testCollection = collection(db, "teams"); // Use 'collection' to access the collection
//         const snapshot = await getDocs(testCollection); // Fetch documents in the collection

//         if (snapshot.empty) {
//             console.log("No documents found in 'test' collection.");
//         } else {
//             snapshot.forEach((doc) => {
//                 console.log("Document data:", doc.data()); // Log each document's data
//             });
//         }
//     } catch (error) {
//         console.error("Error connecting to Firestore:", error);
//     }
// }
// testFirestore();



/* ===================================
    Team Code Prompt with Browser Cache on Firestore validation
=================================== */
document.addEventListener("DOMContentLoaded", async () => {
    let teamCode = localStorage.getItem("teamCode"); // Check if team code exists in localStorage

    if (!teamCode) {
        // Prompt for team code if not found
        let retryCount = 0;
        while (!teamCode || retryCount < 3) {
            teamCode = prompt("Please enter your Team Code:");

            if (teamCode && teamCode.trim() !== "") {
                const isValidTeamCode = await validateTeamCode(teamCode.trim());

                if (isValidTeamCode) {
                    localStorage.setItem("teamCode", teamCode.trim()); // Save valid team code in localStorage
                    alert("Team Code saved successfully! You can now upload memes, like, and comment.");
                    break; // Exit loop
                } else {
                    alert("Invalid Team Code! Please try again.");
                }
            } else {
                alert("Team Code cannot be empty. Please try again.");
            }
            retryCount++;
        }

        if (!teamCode || retryCount >= 3) {
            alert("Failed to validate Team Code after multiple attempts. Please reload the page.");
            location.reload();
        }
    }
});

async function validateTeamCode(teamCode) {
    try {
        // console.log("Validating team code:", teamCode); // Debug: Log the input team code

        // Access the "teams" collection and query for the matching teamCode
        const teamsCollection = collection(db, "teams");
        const teamQuery = query(teamsCollection, where("teamCode", "==", teamCode.trim()));
        const snapshot = await getDocs(teamQuery); // Execute query
        
        // console.log("Query executed successfully!"); // Debug: Log query success
        // console.log("Snapshot Metadata:", snapshot.metadata); // Debug: Log metadata
        // console.log("Snapshot Empty:", snapshot.empty); // Debug: Log if snapshot is empty

        if (snapshot.empty) {
            // console.log("No matching team code found:", teamCode);
            return false; // No matching document
        } else {
            snapshot.forEach((doc) => {
                // console.log("Team code matched document:", doc.data()); // Debug: Log document data
            });
            return true; // Matching document found
        }
    } catch (error) {
        console.error("Error validating team code:", error.message); // Improved error logging
        // console.log("Stack Trace:", error.stack); // Debug: Log error stack trace
        return false; // Safely handle query errors
    }
}



document.addEventListener("DOMContentLoaded", function () {
    // Setting up likes listener - part of the liking logic 



    /* ===================================
       Leaderboard Logic
    =================================== */
    const leaderboardContent = document.querySelector(".leaderboard-content");

    // Set up a real-time listener for the memes collection
    function setupRealTimeLeaderboard() {
    console.log("[DEBUG] Setting up real-time leaderboard...");

    const memesCollection = collection(db, "memes");
    const memesQuery = query(memesCollection, where("isApproved", "==", true)); // Only approved memes

    onSnapshot(
        memesQuery,
        (snapshot) => {
            console.log("[DEBUG] Real-time listener triggered with", snapshot.size, "meme(s).");

            const memes = snapshot.docs.map((doc) => doc.data());
            console.log("[DEBUG] Fetched real-time memes:", memes);

            fetchTeamsAndCalculatePoints(memes); // Dynamically update leaderboard points
        },
        (error) => {
            console.error("[ERROR] Real-time leaderboard listener failed:", error);
        }
    );
}

    // Fetch teams, calculate points dynamically, and render leaderboard
    async function fetchTeamsAndCalculatePoints(memes) {
    console.log("[DEBUG] Fetching teams for leaderboard...");

    try {
        const teamsCollection = collection(db, "teams");
        const teamsSnapshot = await getDocs(teamsCollection);

        const teams = teamsSnapshot.docs.map((doc) => ({
            teamCode: doc.data().teamCode,
            teamName: doc.data().teamName,
        }));

        console.log("[DEBUG] Teams fetched:", teams);

        // Calculate points for each team based on memes
        const leaderboardData = teams.map((team) => {
            const teamMemes = memes.filter((meme) => meme.uploadedBy === team.teamCode);

            const points = teamMemes.reduce((total, meme) => {
                const basePoints = 5; // Points for submission
                const likePoints = meme.likesCount || 0; // Points from likes
                const commentPoints = (meme.commentsCount || 0) * 2; // Points from comments
                const moderatorPoints = meme.moderatorBonus ? 10 : 0; // Moderator bonus

                return total + basePoints + likePoints + commentPoints + moderatorPoints;
            }, 0);

            console.log(`[DEBUG] Points calculated for team "${team.teamName}": ${points}`);

            return {
                teamName: team.teamName,
                points,
            };
        });

        // Sort teams by points in descending order
        leaderboardData.sort((a, b) => b.points - a.points);

        console.log("[DEBUG] Leaderboard data sorted:", leaderboardData);

        renderLeaderboardWithAnimation(leaderboardData); // Reflect changes dynamically
    } catch (error) {
        console.error("[ERROR] Failed to calculate leaderboard points:", error);
    }
}


    function renderLeaderboardWithAnimation(teams) {
    console.log("[DEBUG] Rendering leaderboard with animation...");

    const container = document.querySelector("#leaderboard .leaderboard-content");
    const rowHeight = 48; // Fixed row height (3rem)
    const rowsMap = {}; // Track existing rows by team

    teams.forEach((team, index) => {
        console.log(`[DEBUG] Updating row for team "${team.teamName}" with ${team.points} points...`);

        let row = container.querySelector(`[data-team="${team.teamName}"]`);
        if (!row) {
            // Create a new row if it doesn't already exist
            row = document.createElement("div");
            row.setAttribute("data-team", team.teamName);
            row.classList.add("leaderboard-row");
            row.style.height = `${rowHeight}px`; // Consistent row height
            container.appendChild(row);
        }

        // Update row content
        const rankClass = index === 0 ? "first-place" : index === 1 ? "second-place" : index === 2 ? "third-place" : "";
        row.innerHTML = `
            <div class="leaderboard-cell" style="width: 15%;">
                <span class="glowing-circle ${rankClass}">${index + 1}</span>
            </div>
            <div class="leaderboard-cell" style="width: 60%;">${team.teamName}</div>
            <div class="leaderboard-cell" style="width: 25%;">${team.points} pts</div>
        `;

        // Move row to its new position
        const targetY = index * rowHeight;
        if (parseFloat(row.style.transform.replace("translateY(", "").replace("px)", "")) !== targetY) {
            row.style.transition = "transform 0.5s ease-in-out"; // Smooth animation
            row.style.transform = `translateY(${targetY}px)`;
        }

        rowsMap[team.teamName] = row;
    });

    // Remove rows that are no longer in the leaderboard
    Array.from(container.children).forEach((row) => {
        const teamName = row.getAttribute("data-team");
        if (!rowsMap[teamName]) {
            row.style.transition = "opacity 0.5s ease"; // Fade-out animation
            row.style.opacity = 0; // Fade out
            setTimeout(() => row.remove(), 500); // Remove row after fade-out
        }
    });

    console.log("[DEBUG] Leaderboard updated successfully.");
}
    setupRealTimeLeaderboard();


    /* ===================================
       Carousel Logic
    =================================== */
    const carousel = document.querySelector(".img-carousel");
    let images = []; // Store meme image URLs
    let currentIndex = 0;

    function preloadImages(imageURLs, callback) {
        let loadedCount = 0;
        const imagesToLoad = [];
        imageURLs.forEach((url) => {
            const img = new Image();
            img.src = url;
            img.onload = () => {
                loadedCount++;
                if (loadedCount === imageURLs.length) {
                    callback(imagesToLoad); // Callback with loaded images
                }
            };
            imagesToLoad.push(img);
        });
    }

    // Real-time listener for memes
    function listenForMemes(type = "all") {
    console.log("[DEBUG] Initializing listenForMemes with type:", type);

    const memesCollection = collection(db, "memes");
    let memesQuery;

    if (type === "official") {
        console.log("[DEBUG] Querying for official memes...");
        memesQuery = query(
            memesCollection,
            where("isApproved", "==", true),
            where("uploadedBy", "==", "270325") // Official team code
        );
    } else if (type === "participants") {
        console.log("[DEBUG] Querying for participant memes...");
        memesQuery = query(
            memesCollection,
            where("isApproved", "==", true),
            where("uploadedBy", "!=", "270325") // Exclude official team
        );
    } else {
        console.log("[DEBUG] Querying for all approved memes...");
        memesQuery = query(memesCollection, where("isApproved", "==", true)); // All approved memes
    }

    onSnapshot(
        memesQuery,
        (snapshot) => {
            console.log("[DEBUG] Real-time listener triggered with", snapshot.size, "meme(s).");

            // Map the latest Firestore data into the carousel
            const memes = snapshot.docs.map((doc) => {
                const memeData = doc.data();
                memeData.id = doc.id; // Add Firestore document ID
                console.log(`[DEBUG] Meme fetched: ${memeData.memeID}`, {
                    flagsCount: memeData.flagsCount,
                    flaggedBy: memeData.flaggedBy,
                });
                return memeData;
            });

            updateCarousel(memes); // Dynamically update carousel
        },
        (error) => {
            console.error("[ERROR] Failed to fetch memes in real-time:", error);
        }
    );
}

    // Scroll to the current image in the carousel
    function showCurrentImage() {
    const containerWidth = carousel.parentElement.offsetWidth;
    const offset = -(currentIndex * containerWidth);
    carousel.style.transform = `translateX(${offset}px)`; // Scroll to the current image

    const visibleImage = carousel.children[currentIndex];
    if (visibleImage) {
        const memeId = visibleImage.dataset.memeId;
        const memeLikes = visibleImage.dataset.likes || 0;
        const likedBy = visibleImage.dataset.likedBy ? visibleImage.dataset.likedBy.split(",") : [];
        const flagsCount = visibleImage.dataset.flags || 0;
        const flaggedBy = visibleImage.dataset.flaggedBy ? visibleImage.dataset.flaggedBy.split(",") : [];

        console.log(`Visible Meme ID: ${memeId}`);
        console.log(`Likes in Dataset for Visible Meme: ${memeLikes}`);
        console.log(`Flags in Dataset for Visible Meme: ${flagsCount}`);

        // Update the likes count `<span>`
        const likesSpan = document.querySelector(".likes-count");
        if (likesSpan) {
            likesSpan.textContent = memeLikes; // Update the UI with the correct likes count
        }

        // Update the like button `<svg>` for the visible meme
        const likeButton = document.querySelector(".instagram__icon--heart");
        if (likeButton) {
            likeButton.setAttribute("data-meme-id", memeId); // Set the correct meme ID

            // Check if the current user has liked this meme
            const currentTeamCode = localStorage.getItem("teamCode");
            if (likedBy.includes(currentTeamCode)) {
                likeButton.classList.add("liked"); // Highlight the heart
            } else {
                likeButton.classList.remove("liked"); // Remove the highlight
            }
        }

        // Update the flags count `<span>`
        const flagsSpan = document.querySelector(".flags-count");
        if (flagsSpan) {
            flagsSpan.textContent = flagsCount; // Update the UI with the correct flags count
        }

        // Update the flag button `<img>` for the visible meme
        const flagIcon = document.getElementById("flag_icon");
        if (flagIcon) {
            const currentTeamCode = localStorage.getItem("teamCode");
            if (flaggedBy.includes(currentTeamCode)) {
                flagIcon.src = "assets/images/flagged.png"; // Highlight the flag
            } else {
                flagIcon.src = "assets/images/unFlagged.png"; // Remove the highlight
            }
        }

        // Sync likes and flags for the visible meme
        setupLikesListener(); // Sync likes in real-time
        setupFlagsListener(); // Sync flags in real-time
    } else {
        console.error(`No visible meme found for index: ${currentIndex}`);
    }
}

    // Update the carousel to ensure alignment at initialization
    function updateCarousel(memes) {
    console.log("[DEBUG] Clearing existing carousel content...");
    carousel.innerHTML = ""; // Clear existing content

    const containerWidth = carousel.parentElement.offsetWidth;
    const containerHeight = carousel.parentElement.offsetHeight;

    console.log("[DEBUG] Rendering", memes.length, "meme(s) in the carousel...");

    memes.forEach((meme, index) => {
        console.log(`[DEBUG] Rendering meme ${index + 1}/${memes.length} with ID: ${meme.memeID}`);

        const img = document.createElement("img");
        img.src = meme.imageBase64;
        img.alt = "Meme Image";
        img.classList.add("instagram__media__image");
        img.dataset.memeId = meme.memeID;
        img.dataset.likes = meme.likesCount || 0;
        img.dataset.flags = meme.flagsCount || 0; // Store flags count
        img.dataset.likedBy = (meme.likedBy || []).join(","); // Store likedBy data
        img.dataset.flaggedBy = (meme.flaggedBy || []).join(","); // Store flaggedBy data

        img.style.width = `${containerWidth}px`;
        img.style.height = `${containerHeight}px`;

        carousel.appendChild(img); // Add meme to carousel

        // If this is the visible meme, update its UI elements dynamically
        if (index === currentIndex) {
            const likeButton = document.querySelector(".instagram__icon--heart");
            const likesSpan = document.querySelector(".likes-count");
            const flagIcon = document.getElementById("flag_icon");
            const flagsSpan = document.querySelector(".flags-count");

            // Update heart icon (liked state)
            const currentTeamCode = localStorage.getItem("teamCode");
            if (meme.likedBy?.includes(currentTeamCode)) {
                console.log("[DEBUG] Meme liked by user. Adding 'liked' class...");
                likeButton.classList.add("liked");
            } else {
                console.log("[DEBUG] Meme not liked by user. Removing 'liked' class...");
                likeButton.classList.remove("liked");
            }

            if (likesSpan) {
                console.log(`[DEBUG] Updating likes count for meme ${meme.memeID}:`, meme.likesCount);
                likesSpan.textContent = meme.likesCount || 0;
            }

            // Update flag icon and flags count
            if (flagIcon) {
                if (meme.flaggedBy?.includes(currentTeamCode)) {
                    console.log("[DEBUG] Meme flagged by user. Setting filled flag...");
                    flagIcon.src = "assets/images/flagged.png"; // Set filled flag
                } else {
                    console.log("[DEBUG] Meme not flagged by user. Setting empty flag...");
                    flagIcon.src = "assets/images/unFlagged.png"; // Set empty flag
                }
            }

            if (flagsSpan) {
                console.log(`[DEBUG] Updating flags count for meme ${meme.memeID}:`, meme.flagsCount);
                flagsSpan.textContent = meme.flagsCount || 0; // Update flags count in the UI
            }
        }
    });

    carousel.style.width = `${memes.length * containerWidth}px`;
    console.log("[DEBUG] Carousel updated successfully.");
}

    // Move to the next image automatically
    function showNextImage() {
    images = Array.from(carousel.children).map((child) => child.src); // Dynamically fetch images
    if (images.length === 0) {
        return;
    }
    currentIndex = (currentIndex + 1) % images.length; // Increment index, loop back at end
    showCurrentImage(); // Scroll to the next image and sync UI elements
}


    // Automatically swipe images every 5 seconds
    if (!carousel.dataset.autoSwipeStarted) {
        setInterval(showNextImage, 5000);
        carousel.dataset.autoSwipeStarted = true;
    }

    // Default behavior: Show "Official Memes" on page load
    listenForMemes("official"); // Fetch official memes by default
    // leftText.classList.add("active-text"); // Ensure correct initial state



    /* ===================================
        Heading Transition Logic
    =================================== */
    const mainElement = document.querySelector(".container main");
    let isDynamic = false;

    // Add a delay before toggling starts
    setTimeout(() => {
        setInterval(() => {
            if (isDynamic) {
                mainElement.classList.remove("dynamic");
            } else {
                mainElement.classList.add("dynamic");
            }
            isDynamic = !isDynamic;
        }, 2000);
    }, 500); // 500ms delay to ensure base styles apply



    /* ===================================
       Meme toggle Logic
    =================================== */
    const toggleImage = document.getElementById("toggle-image");
const leftText = document.querySelector(".left-text");
const rightText = document.querySelector(".right-text");
let showingLeft = true; // Default state: "Official Memes"

// Function to load memes based on the selected toggle
function loadMemesByType(type) {
    console.log("[DEBUG] Loading memes of type:", type);
    currentIndex = 0; // Reset index to the first meme
    listenForMemes(type); // Fetch memes for the selected category
}

// Toggle button functionality
toggleImage.addEventListener("click", () => {
    if (showingLeft) {
        // Switch to Participant Memes
        console.log("[DEBUG] Switching to participant memes...");
        toggleImage.src = "assets/images/spdmRight.png";
        leftText.classList.remove("active-text");
        rightText.classList.add("active-text");
        loadMemesByType("participants"); // Load participant memes
    } else {
        // Switch to Official Memes
        console.log("[DEBUG] Switching to official memes...");
        toggleImage.src = "assets/images/spdmLeft.png";
        rightText.classList.remove("active-text");
        leftText.classList.add("active-text");
        loadMemesByType("official"); // Load official memes
    }
    showingLeft = !showingLeft; // Toggle state
});



    /* ===================================
       Alignment Logic
    =================================== */
    const instagram = document.querySelector(".instagram");
    const rightContainer = document.querySelector(".right-container");
    const leaderboardContainer = document.querySelector(".leaderboard-container");

    function alignContainers() {
    if (window.innerWidth > 768) {
        const instagramRect = instagram.getBoundingClientRect();
        if (rightContainer) {
            rightContainer.style.top = `${instagramRect.top + window.scrollY}px`;
        }
        if (leaderboardContainer) {
            leaderboardContainer.style.top = `${instagramRect.top + window.scrollY - 90}px`;
        }
    } else {
        // Reset styles for phones (relying on CSS grid layout)
        if (rightContainer) rightContainer.style.top = "unset";
        if (leaderboardContainer) leaderboardContainer.style.top = "unset";
    }
}

alignContainers();
window.addEventListener("resize", alignContainers);


    /* ===================================
       Typewriter Effect
    =================================== */
    const typewriter = document.querySelector(".typewriter");
    const phrases = [
        "go five levels deep?",
        "make Cobb laugh?",
        "architect hilarity?",
        "plant laughter in our minds?"
    ];

    let phraseIndex = 0;
    let letterIndex = 0;
    let typing = true;

    function typeEffect() {
        if (typing) {
            typewriter.textContent += phrases[phraseIndex][letterIndex];
            letterIndex++;

            if (letterIndex === phrases[phraseIndex].length) {
                typing = false;
                setTimeout(typeEffect, 2000);
                return;
            }
        } else {
            typewriter.textContent = typewriter.textContent.slice(0, -1);
            letterIndex--;

            if (letterIndex === 0) {
                typing = true;
                phraseIndex = (phraseIndex + 1) % phrases.length;
                setTimeout(typeEffect, 500);
                return;
            }
        }

        setTimeout(typeEffect, typing ? 100 : 50);
    }

    typeEffect();



    /* ===================================
       File Upload Logic
=================================== */
const fileInput = document.querySelector("#file_input");
const uploadButton = document.querySelector("#upload_btn");
const errorMessage = document.querySelector("#upload_error");
const progressContainer = document.querySelector("#upload_progress");
const progressBar = document.querySelector("#upload_progress_bar");
const jumpingImage = document.querySelector("#upload_jumping_image");
const completionImage = document.querySelector("#upload_completion_image");
const uploadAudio = document.querySelector("#upload_audio");
const uploadDuration = 8;
let jumpingAnimation;

// Check for team code in localStorage
document.addEventListener("DOMContentLoaded", () => {
    let teamCode = localStorage.getItem("teamCode");
    if (!teamCode) {
        // Prompt for team code if not stored
        teamCode = prompt("Please enter your Team Code:");
        if (teamCode && teamCode.trim() !== "") {
            localStorage.setItem("teamCode", teamCode.trim());
            alert("Team Code saved! You can now upload memes, like, and comment.");
        } else {
            alert("Invalid Team Code! Reload the page and try again.");
            return; // Halt further interactions until a valid team code is entered
        }
    }
});

uploadButton.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];

    if (!file || !file.type.startsWith("image/")) {
        errorMessage.textContent = "Invalid file format! Please upload an image file.";
        errorMessage.style.display = "block";
        return;
    }

    // Check file size (500 KB limit)
    const maxSize = 500 * 1024; // 500 KB
    if (file.size > maxSize) {
        errorMessage.textContent = "File size exceeds 500 KB! Please upload a smaller image.";
        errorMessage.style.display = "block";
        return;
    }

    errorMessage.style.display = "none";

    // Compress the image before further steps
    compressImage(file)
        .then((compressedFile) => {
            // Proceed to upload the compressed image with team code
            const teamCode = localStorage.getItem("teamCode");
            if (teamCode) {
                startUpload(compressedFile, teamCode);
            } else {
                alert("Team Code not found! Please reload the page and enter your code.");
            }
        })
        .catch((error) => {
            console.error("Image compression failed:", error);
            errorMessage.textContent = "Image compression failed. Try again.";
            errorMessage.style.display = "block";
        });
});

function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");

                const maxWidth = 800; // Max width for compression
                const scale = Math.min(maxWidth / img.width, 1); // Maintain aspect ratio
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;

                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                canvas.toBlob(
                    (blob) => {
                        if (blob) resolve(blob);
                        else reject(new Error("Compression failed."));
                    },
                    "image/jpeg", // Output format
                    0.7 // Compression quality (70%)
                );
            };
            img.onerror = reject;
            img.src = event.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function startUpload(compressedFile, teamCode) {
    console.log("[DEBUG] Starting meme upload...");

    // Hide the upload button during the upload process
    uploadButton.style.display = "none";

    jumpingImage.style.transform = "translateY(0)";
    progressContainer.style.display = "block";
    jumpingImage.style.display = "block";
    uploadAudio.play();

    // Progress bar animation
    gsap.to(progressBar, {
        width: "100%",
        duration: uploadDuration,
        ease: "linear",
        onUpdate: syncJumpingImage,
    });

    // Jumping animation
    jumpingAnimation = gsap.timeline({ repeat: -1, yoyo: true });
    jumpingAnimation.to(jumpingImage, {
        y: -40,
        duration: 0.25,
        ease: "power1.inOut",
    });

    // Simulate uploading to Firebase
    setTimeout(() => {
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64Image = reader.result;

            try {
                const memesCollection = collection(db, "memes"); // Reference to "memes" collection

                // Generate a unique meme ID
                const memeID = `meme_${Date.now()}`;

                // Add document with all required fields
                await addDoc(memesCollection, {
                    imageBase64: base64Image, // Meme image
                    uploadedBy: teamCode, // Team code of uploader
                    createdAt: new Date(), // Timestamp
                    likesCount: 0, // Initial likes count
                    commentsCount: 0, // Initial comments count
                    isApproved: false, // Initially awaiting moderation
                    likedBy: [], // Empty array for likes
                    flaggedBy: [], // Initialize flaggedBy as empty
                    flagsCount: 0, // Initialize flagsCount as zero
                    memeID: memeID, // Unique ID
                    moderatorBonus: false, // Default moderator bonus state
                });

                completeUpload();
                alert("Meme uploaded successfully and awaiting moderation!");
                console.log("[DEBUG] Meme uploaded successfully with ID:", memeID);
            } catch (error) {
                console.error("[ERROR] Failed to upload meme:", error);
                alert("Upload failed. Please try again.");
                resetUpload();
            }
        };

        reader.readAsDataURL(compressedFile);
    }, uploadDuration * 1000);
}

function syncJumpingImage() {
    const progressBarWidth = progressBar.offsetWidth;
    const progressContainerWidth = progressContainer.offsetWidth;
    const progressPercentage = progressBarWidth / progressContainerWidth;
    jumpingImage.style.left = `${progressPercentage * 100}%`;
}

function completeUpload() {
    if (jumpingAnimation) {
        jumpingAnimation.kill();
        jumpingAnimation = null;
    }

    uploadAudio.pause();
    uploadAudio.currentTime = 0;

    progressContainer.style.display = "none";
    jumpingImage.style.display = "none";
    completionImage.style.display = "block";

    // Show the upload button again after completion
    setTimeout(() => {
        resetUpload();
    }, 3000);
}

function resetUpload() {
    progressBar.style.width = "0";
    completionImage.style.display = "none";
    jumpingImage.style.left = "0";

    progressContainer.style.display = "none";
    jumpingImage.style.display = "none";
    uploadButton.style.display = "block"; // Show the upload button again

    // Reset inputs
    fileInput.value = "";
}


    /* ===================================
       Liking memes Logic
    =================================== */
    const heartIcon = document.querySelector(".instagram__icon--heart");
    heartIcon.addEventListener("click", () => {
    const currentImage = carousel.children[currentIndex]; // Get the visible meme
    if (!currentImage) {
        console.error("[ERROR] No visible meme found.");
        return;
    }

    const memeId = currentImage.dataset.memeId; // Meme ID of visible meme
    const currentTeamCode = localStorage.getItem("teamCode");

    if (!memeId || !currentTeamCode) {
        console.error("[ERROR] Missing memeId or teamCode.");
        return;
    }

    // Check if the user has already liked the meme
    const likedBy = currentImage.dataset.likedBy ? currentImage.dataset.likedBy.split(",") : [];
    if (likedBy.includes(currentTeamCode)) {
        console.warn("[DEBUG] User has already liked this meme!");
        alert("You have already liked this meme!");
        return;
    }

    console.log("[DEBUG] Attempting to like meme with ID:", memeId);

    // Query the meme document based on memeID
    const memesCollection = collection(db, "memes");
    const memeQuery = query(memesCollection, where("memeID", "==", memeId));

    getDocs(memeQuery)
        .then((querySnapshot) => {
            if (!querySnapshot.empty) {
                const docSnapshot = querySnapshot.docs[0]; // Assume the first result
                const memeDocRef = docSnapshot.ref; // Reference to the document

                console.log("[DEBUG] Document found for memeID:", memeId);

                // Optimistic UI Update
                const likesSpan = document.querySelector(".likes-count");
                if (likesSpan) {
                    likesSpan.textContent = parseInt(likesSpan.textContent, 10) + 1; // Increment likes count
                }
                heartIcon.classList.add("liked"); // Fill the heart instantly

                // Update Firestore
                updateDoc(memeDocRef, {
                    likedBy: arrayUnion(currentTeamCode), // Add current user's team code
                    likesCount: increment(1), // Increment likes count
                })
                    .then(() => {
                        console.log(`[DEBUG] Successfully liked meme with ID: ${memeId}`);
                        currentImage.dataset.likedBy = [...likedBy, currentTeamCode].join(","); // Update dataset locally
                    })
                    .catch((error) => {
                        console.error(`[ERROR] Failed to update meme with ID: ${memeId}`, error);
                    });
            } else {
                console.error(`[ERROR] No document found for memeID: ${memeId}`);
            }
        })
        .catch((error) => {
            console.error("[ERROR] Failed to query memes collection:", error);
        });
});



    function handleLike(memeId, teamCode) {
        console.log("memeId:", memeId);
        console.log("teamCode:", teamCode);

        if (!memeId || !teamCode) {
            console.error("Error: Missing memeId or teamCode");
            return;
        }

        const memesCollection = collection(db, "memes");
        const memeQuery = query(memesCollection, where("memeID", "==", memeId));

        getDocs(memeQuery).then((querySnapshot) => {
            if (!querySnapshot.empty) {
                const docSnapshot = querySnapshot.docs[0];
                const memeDocRef = docSnapshot.ref;

                console.log("Document found:", docSnapshot.data());

                const likedBy = docSnapshot.data().likedBy || [];
                if (!likedBy.includes(teamCode)) {
                    // Optimistic UI Update
                    const likeButton = document.querySelector(".instagram__icon--heart");
                    const likesSpan = document.querySelector(".likes-count");
                    const visibleImage = carousel.children[currentIndex];

                    if (likesSpan) {
                        likesSpan.textContent = parseInt(likesSpan.textContent, 10) + 1; // Increment likes count
                    }
                    if (visibleImage) {
                        visibleImage.dataset.likes = parseInt(visibleImage.dataset.likes, 10) + 1; // Update dataset
                        const currentLikedBy = visibleImage.dataset.likedBy
                            ? visibleImage.dataset.likedBy.split(",")
                            : [];
                        currentLikedBy.push(teamCode); // Add current user to likedBy
                        visibleImage.dataset.likedBy = currentLikedBy.join(","); // Update dataset
                    }
                    if (likeButton) {
                        likeButton.classList.add("liked"); // Turn the heart red
                    }

                    // Update Firestore
                    updateDoc(memeDocRef, {
                        likedBy: arrayUnion(teamCode),
                        likesCount: increment(1),
                    }).then(() => {
                        console.log(`Successfully liked meme ${memeId}`);
                    });
                } else {
                    console.log(`TeamCode ${teamCode} has already liked meme ${memeId}.`);
                }
            } else {
                console.error(`No document found for memeID ${memeId}.`);
            }
        }).catch((error) => {
            console.error(`Error querying memes collection: ${error}`);
        });
    }


    function setupLikesListener() {
        const currentImage = carousel.children[currentIndex]; // Get the visible meme
        if (!currentImage) {
            console.error("No visible meme found for real-time update.");
            return;
        }

        const memeId = currentImage.dataset.memeId;
        const currentTeamCode = localStorage.getItem("teamCode");

        if (!memeId) {
            console.error("Missing memeId for real-time update.");
            return;
        }

        const memeDocRef = doc(db, "memes", memeId); // Reference directly to the document

        // Real-time listener for the visible meme
        onSnapshot(memeDocRef, (docSnapshot) => {
            const memeData = docSnapshot.data();
            if (!memeData) {
                console.warn(`No data found for memeId ${memeId}.`);
                return;
            }

            // Update the UI for the visible meme
            const likesSpan = document.querySelector(".likes-count");
            if (likesSpan) {
                likesSpan.textContent = memeData.likesCount || 0; // Update likes count
            }

            // Update the heart icon
            const likeButton = document.querySelector(".instagram__icon--heart");
            if (likeButton) {
                if (memeData.likedBy?.includes(currentTeamCode)) {
                    likeButton.classList.add("liked");
                } else {
                    likeButton.classList.remove("liked");
                }
            }
        });
    }

    /* ===================================
       Flagging memes Logic
    =================================== */
    function setupFlagsListener() {
    const currentImage = carousel.children[currentIndex]; // Get the visible meme
    if (!currentImage) {
        console.error("[ERROR] No visible meme found for real-time flags update.");
        return;
    }

    const memeId = currentImage.dataset.memeId; // Meme ID of the visible meme
    const currentTeamCode = localStorage.getItem("teamCode");

    if (!memeId) {
        console.error("[ERROR] Missing memeId for real-time flags update.");
        return;
    }

    const memeDocRef = doc(db, "memes", memeId); // Reference to the document

    // Real-time listener for flags
    onSnapshot(memeDocRef, (docSnapshot) => {
        const memeData = docSnapshot.data();
        if (!memeData) {
            console.warn(`[ERROR] No data found for memeId: ${memeId}`);
            return;
        }

        // Update the flags-count span
        const flagsSpan = document.querySelector(".flags-count");
        if (flagsSpan) {
            console.log(`[DEBUG] Real-time flags count update for meme ${memeId}:`, memeData.flagsCount);
            flagsSpan.textContent = memeData.flagsCount || 0;
        }

        // Update the flag icon
        const flagIcon = document.getElementById("flag_icon");
        if (flagIcon) {
            if (memeData.flaggedBy?.includes(currentTeamCode)) {
                flagIcon.src = "assets/images/flagged.png"; // Set filled flag
            } else {
                flagIcon.src = "assets/images/unFlagged.png"; // Set empty flag
            }
        }
    });
}

    const flagIcon = document.getElementById("flag_icon");
    flagIcon.addEventListener("click", () => {
    const currentImage = carousel.children[currentIndex]; // Get the visible meme
    if (!currentImage) {
        console.error("[ERROR] No visible meme found for flagging.");
        return;
    }

    const memeId = currentImage.dataset.memeId; // Meme ID of the visible meme
    const currentTeamCode = localStorage.getItem("teamCode");

    if (!memeId || !currentTeamCode) {
        console.error("[ERROR] Missing memeId or teamCode for flagging.");
        return;
    }

    console.log("[DEBUG] Attempting to toggle flag for meme with ID:", memeId);

    const memesCollection = collection(db, "memes");
    const memeQuery = query(memesCollection, where("memeID", "==", memeId));

    getDocs(memeQuery)
        .then((querySnapshot) => {
            if (!querySnapshot.empty) {
                const docSnapshot = querySnapshot.docs[0]; // Assume the first result
                const memeDocRef = docSnapshot.ref; // Reference to the document
                const isFlaggedByUser = currentImage.dataset.flaggedBy
                    ? currentImage.dataset.flaggedBy.split(",").includes(currentTeamCode)
                    : false;

                const flagsSpan = document.querySelector(".flags-count");
                if (isFlaggedByUser) {
                    console.log("[DEBUG] Meme is already flagged by user. Unflagging...");

                    // Optimistic UI Update
                    flagIcon.src = "assets/images/unFlagged.png"; // Set empty flag
                    currentImage.dataset.flaggedBy = currentImage.dataset.flaggedBy
                        .split(",")
                        .filter((teamCode) => teamCode !== currentTeamCode)
                        .join(",");
                    currentImage.dataset.flags = parseInt(currentImage.dataset.flags, 10) - 1; // Decrement flagsCount
                    if (flagsSpan) flagsSpan.textContent = currentImage.dataset.flags; // Update UI count

                    // Update Firestore
                    updateDoc(memeDocRef, {
                        flaggedBy: arrayRemove(currentTeamCode), // Remove user's flag
                        flagsCount: increment(-1), // Decrement flagsCount
                    }).then(() => {
                        console.log(`[DEBUG] Successfully unflagged meme with ID: ${memeId}`);
                    }).catch((error) => {
                        console.error(`[ERROR] Failed to unflag meme with ID: ${memeId}`, error);
                    });
                } else {
                    console.log("[DEBUG] Meme is not flagged by user. Flagging...");

                    // Optimistic UI Update
                    flagIcon.src = "assets/images/flagged.png"; // Set filled flag
                    currentImage.dataset.flaggedBy = currentImage.dataset.flaggedBy
                        ? `${currentImage.dataset.flaggedBy},${currentTeamCode}`
                        : currentTeamCode;
                    currentImage.dataset.flags = parseInt(currentImage.dataset.flags, 10) + 1; // Increment flagsCount
                    if (flagsSpan) flagsSpan.textContent = currentImage.dataset.flags; // Update UI count

                    // Update Firestore
                    updateDoc(memeDocRef, {
                        flaggedBy: arrayUnion(currentTeamCode), // Add user's flag
                        flagsCount: increment(1), // Increment flagsCount
                    }).then(() => {
                        console.log(`[DEBUG] Successfully flagged meme with ID: ${memeId}`);
                    }).catch((error) => {
                        console.error(`[ERROR] Failed to flag meme with ID: ${memeId}`, error);
                    });
                }
            } else {
                console.warn(`[ERROR] No document found for memeID: ${memeId}`);
            }
        }).catch((error) => {
            console.error("[ERROR] Failed to query memes collection for flagging:", error);
        });
});
});
