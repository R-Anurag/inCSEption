import { collection, query, addDoc, where, onSnapshot, getDocs, doc, getDoc, updateDoc, arrayUnion, increment, orderBy } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
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
        const memesCollection = collection(db, "memes");
        const memesQuery = query(memesCollection, where("isApproved", "==", true)); // Only approved memes

        // Listen for real-time updates in the memes collection
        onSnapshot(memesQuery, (snapshot) => {
            const memes = snapshot.docs.map((doc) => doc.data()); // Fetch all real-time meme data
            fetchTeamsAndCalculatePoints(memes); // Fetch teams and calculate leaderboard
        });
    }

    // Fetch teams, calculate points dynamically, and render leaderboard
    async function fetchTeamsAndCalculatePoints(memes) {
    try {
        const teamsCollection = collection(db, "teams"); // Reference to teams collection
        const teamsSnapshot = await getDocs(teamsCollection); // Get all teams
        const teams = teamsSnapshot.docs.map((doc) => ({
            teamCode: doc.data().teamCode,
            teamName: doc.data().teamName
        }));

        // Calculate points dynamically for each team, even those without memes
        const leaderboardData = teams.map((team) => {
            const teamMemes = memes.filter((meme) => meme.uploadedBy === team.teamCode);

            const points = teamMemes.reduce((total, meme) => {
                const basePoints = 5; // Points for submission
                const likePoints = meme.likesCount || 0; // Points from likes
                const commentPoints = (meme.commentsCount || 0) * 2; // Points from comments
                const moderatorPoints = meme.moderatorBonus ? 10 : 0; // Moderator bonus

                return total + basePoints + likePoints + commentPoints + moderatorPoints;
            }, 0);

            return {
                teamName: team.teamName,
                points
            };
        });

        // Sort leaderboard by points in descending order
        leaderboardData.sort((a, b) => b.points - a.points);

        renderLeaderboardWithAnimation(leaderboardData); // Render the leaderboard with animations
    } catch (error) {
        console.error("Error fetching leaderboard data:", error);
        leaderboardContent.innerHTML = "<p>Error loading leaderboard.</p>";
    }
}

    function renderLeaderboardWithAnimation(teams) {
        const rowsMap = {}; // Track existing rows by team

        const container = document.querySelector("#leaderboard .leaderboard-content"); // Select the leaderboard content div
        const rowHeight = 48; // Fixed row height (3rem)

        // Loop through each team to dynamically update or add rows
        teams.forEach((team, index) => {
            let row = container.querySelector(`[data-team="${team.teamName}"]`);

            if (!row) {
                // Create a new row for a team if it doesn't already exist
                row = document.createElement("div");
                row.setAttribute("data-team", team.teamName);
                row.classList.add("leaderboard-row");
                row.style.height = `${rowHeight}px`; // Maintain consistent row height
                container.appendChild(row);
            }

            // Update content inside the row
            const rankClass = index === 0 ? "first-place" : index === 1 ? "second-place" : index === 2 ? "third-place" : "";
            row.innerHTML = `
                <div class="leaderboard-cell" style="width: 15%;">
                    <span class="glowing-circle ${rankClass}">${index + 1}</span>
                </div>
                <div class="leaderboard-cell" style="width: 60%;">${team.teamName}</div>
                <div class="leaderboard-cell" style="width: 25%;">${team.points} pts</div>
            `;

            // Apply animation logic for row positioning
            const targetY = index * rowHeight; // Rows are offset without gaps
            if (parseFloat(row.style.transform.replace("translateY(", "").replace("px)", "")) !== targetY) {
                row.style.transition = "transform 0.5s ease-in-out"; // Smooth animation
                row.style.transform = `translateY(${targetY}px)`; // Move row into position
            }

            rowsMap[team.teamName] = row; // Track row updates for future reference
        });

        // Remove rows that no longer exist in the provided team list
        Array.from(container.children).forEach((row) => {
            const teamName = row.getAttribute("data-team");
            if (!rowsMap[teamName]) {
                row.style.transition = "opacity 0.5s ease"; // Fade-out animation
                row.style.opacity = 0; // Set opacity to 0 to fade out
                setTimeout(() => row.remove(), 500); // Remove the row after the fade-out
            }
        });

        // Reapply alternate row highlighting
        teams.forEach((team, index) => {
            const row = container.querySelector(`[data-team="${team.teamName}"]`);
            if (row) {
                row.style.background = index % 2 === 0
                    ? "rgba(255, 255, 255, 0.1)" // Highlight odd rows
                    : "rgba(255, 255, 255, 0.05)"; // Default background for even rows
            }
        });
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
    const memesCollection = collection(db, "memes");
    let memesQuery;

    if (type === "official") {
        memesQuery = query(
            memesCollection,
            where("isApproved", "==", true),
            where("uploadedBy", "==", "270325")
        );
    } else if (type === "participants") {
        memesQuery = query(
            memesCollection,
            where("isApproved", "==", true),
            where("uploadedBy", "!=", "270325")
        );
    } else {
        memesQuery = query(memesCollection, where("isApproved", "==", true));
    }

    onSnapshot(memesQuery, (snapshot) => {
        const memes = snapshot.docs.map((doc) => doc.data());
        updateCarousel(memes); // Update the carousel
        setupLikesListener(type); // Synchronize likes in real time based on toggle type
    });
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

        console.log(`Visible Meme ID: ${memeId}`);
        console.log(`Likes in Dataset for Visible Meme: ${memeLikes}`);

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
    } else {
        console.error(`No visible meme found for index: ${currentIndex}`);
    }
}

    // Update the carousel to ensure alignment at initialization
    function updateCarousel(memes) {
    carousel.innerHTML = ""; // Clear existing content

    const containerWidth = carousel.parentElement.offsetWidth;
    const containerHeight = carousel.parentElement.offsetHeight;

    memes.forEach((meme) => {
        const img = document.createElement("img");
        img.src = meme.imageBase64;
        img.alt = "Meme Image";
        img.classList.add("instagram__media__image");
        img.dataset.memeId = meme.memeID;
        img.dataset.likes = meme.likesCount || 0;
        img.dataset.likedBy = (meme.likedBy || []).join(","); // Store likedBy as a comma-separated string

        img.style.width = `${containerWidth}px`;
        img.style.height = `${containerHeight}px`;

        carousel.appendChild(img);
        console.log(`Updated Meme in Carousel: Meme ID=${meme.memeID}`);
    });

    carousel.style.width = `${memes.length * containerWidth}px`;
    console.log("Carousel updated successfully.");
}

    // Move to the next image automatically
    function showNextImage() {
    images = Array.from(carousel.children).map((child) => child.src); // Dynamically fetch images
    if (images.length === 0) {
        return;
    }
    currentIndex = (currentIndex + 1) % images.length; // Increment index, loop back at end
    showCurrentImage(); // Scroll to the next image
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

    // Toggle button functionality
    toggleImage.addEventListener("click", function () {
        currentIndex = 0; // Reset index
        if (showingLeft) {
            toggleImage.src = "assets/images/spdmRight.png";
            leftText.classList.remove("active-text");
            rightText.classList.add("active-text");
            listenForMemes("participants"); // Fetch participant memes
            setupLikesListener("participants"); // Real-time sync for participants
        } else {
            toggleImage.src = "assets/images/spdmLeft.png";
            rightText.classList.remove("active-text");
            leftText.classList.add("active-text");
            listenForMemes("official"); // Fetch official memes
            setupLikesListener("official"); // Real-time sync for official memes
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
        const instagramRect = instagram.getBoundingClientRect();
        if (rightContainer) {
            rightContainer.style.top = `${instagramRect.top + window.scrollY}px`;
        }
        if (leaderboardContainer) {
            leaderboardContainer.style.top = `${instagramRect.top + window.scrollY}px`;
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
        onUpdate: syncJumpingImage
    });

    // Jumping animation
    jumpingAnimation = gsap.timeline({ repeat: -1, yoyo: true });
    jumpingAnimation.to(jumpingImage, {
        y: -40,
        duration: 0.25,
        ease: "power1.inOut"
    });

    // Simulate uploading to Firebase
    setTimeout(() => {
        // Convert compressed image blob to Base64 for Firestore
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64Image = reader.result;

            try {
                const memesCollection = collection(db, "memes"); // Reference to "memes" collection

                // Generate a unique meme ID
                const memeID = `meme_${Date.now()}`;

                // Add document with all required fields
                await addDoc(memesCollection, {
                    imageBase64: base64Image,
                    uploadedBy: teamCode,
                    createdAt: new Date(), // Timestamp
                    likesCount: 0,
                    commentsCount: 0,
                    isApproved: false, // Initially awaiting moderation
                    likedBy: [], // Empty array for likes
                    memeID: memeID, // Unique ID
                    moderatorBonus: false // Default moderator bonus state
                });

                completeUpload();
                alert("Meme uploaded successfully and awaiting moderation!");
            } catch (error) {
                console.error("Error uploading to Firebase:", error);
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
        const parent = heartIcon.parentElement; // Container for positioning

        for (let i = 0; i < 6; i++) {
            // Create a new SVG heart
            const popHeart = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            popHeart.setAttribute("viewBox", "0 0 24 24");
            popHeart.setAttribute("class", "heart-pop");

            // Create a path using the provided `d` attribute
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute(
                "d",
                "M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z"
            );
            path.setAttribute("fill", "#00FF9D"); // Red color for hearts

            // Append the path to the SVG
            popHeart.appendChild(path);

            // Set random position and direction
            popHeart.style.position = "absolute";
            popHeart.style.left = "50%";
            popHeart.style.top = "50%";
            popHeart.style.transform = `translate(-50%, -50%) scale(0)`;

            // Append the heart to the parent container
            parent.appendChild(popHeart);

            // Animate the heart
            setTimeout(() => {
                popHeart.style.transform = `translate(-50%, -50%) scale(2.5)`;
                popHeart.style.opacity = "0";
            }, 100);

            // Remove the heart after animation completes
            setTimeout(() => {
                popHeart.remove();
            }, 900); // Match animation duration
        }
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


    function setupLikesListener(type = "all") {
        const memesCollection = collection(db, "memes");
        const currentTeamCode = localStorage.getItem("teamCode");
        let memesQuery;

        // Adjust query based on the toggle state
        if (type === "official") {
            memesQuery = query(
                memesCollection,
                where("isApproved", "==", true),
                where("uploadedBy", "==", "270325")
            );
        } else if (type === "participants") {
            memesQuery = query(
                memesCollection,
                where("isApproved", "==", true),
                where("uploadedBy", "!=", "270325")
            );
        } else {
            memesQuery = query(memesCollection, where("isApproved", "==", true));
        }

        // Attach the snapshot listener to the relevant memes
        onSnapshot(memesQuery, (snapshot) => {
            snapshot.docs.forEach((doc) => {
                const memeData = doc.data();
                const memeId = memeData.memeID;
                const likesCount = memeData.likesCount || 0;
                const likedBy = memeData.likedBy || [];

                // Update all relevant memes in the carousel
                Array.from(carousel.children).forEach((image) => {
                    if (image.dataset.memeId === memeId) {
                        // Update likes count
                        image.dataset.likes = likesCount;

                        // Update the heart icon
                        const likeButton = document.querySelector(`.instagram__icon--heart[data-meme-id="${memeId}"]`);
                        if (likeButton) {
                            if (likedBy.includes(currentTeamCode)) {
                                likeButton.classList.add("liked");
                            } else {
                                likeButton.classList.remove("liked");
                            }
                        }

                        // If the current meme is visible, update its UI
                        if (carousel.children[currentIndex] === image) {
                            const likesSpan = document.querySelector(".likes-count");
                            if (likesSpan) {
                                likesSpan.textContent = likesCount;
                            }
                        }
                    }
                });
            });
        });
    }

});
