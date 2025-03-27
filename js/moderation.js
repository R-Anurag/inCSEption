import { collection, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { db } from "./firebaseConfig.js";

document.addEventListener("DOMContentLoaded", async () => {
    const memeContainer = document.getElementById("memeContainer");
    let teamCache = {}; // Cache for team codes and names

    async function fetchTeams() {
        try {
            const teamsCollection = collection(db, "teams");
            const snapshot = await getDocs(teamsCollection);
            snapshot.forEach((doc) => {
                const teamData = doc.data();
                teamCache[teamData.teamCode] = teamData.teamName; // Map teamCode to teamName
            });
        } catch (error) {
            console.error("Error fetching team data:", error);
        }
    }

    async function fetchMemes() {
        memeContainer.innerHTML = "<p>Loading memes...</p>";

        try {
            const memesCollection = collection(db, "memes");
            const snapshot = await getDocs(memesCollection);

            memeContainer.innerHTML = ""; // Clear loading message

            if (snapshot.empty) {
                memeContainer.innerHTML = "<p>No memes found.</p>";
            } else {
                let memesArray = [];

                snapshot.forEach((doc) => {
                    const memeData = doc.data();
                    const memeId = doc.id;
                    const teamName = teamCache[memeData.uploadedBy] || "Unknown Team"; // Map teamName dynamically

                    memesArray.push({
                        ...memeData,
                        teamName,
                        memeId,
                        flagsCount: memeData.flagsCount || 0, // Default to 0 if undefined
                    });
                });

                // 🔹 Sort memes by flagsCount in descending order (highest flagged first)
                memesArray.sort((a, b) => b.flagsCount - a.flagsCount);

                // 🔹 Display sorted memes
                memesArray.forEach((meme) => displayMeme(meme, meme.memeId));
            }
        } catch (error) {
            console.error("Error fetching memes:", error);
            memeContainer.innerHTML = "<p>Error loading memes. Please try again later.</p>";
        }
    }

    function displayMeme(meme, memeId) {
        const memeDiv = document.createElement("div");
        memeDiv.className = "meme";

        memeDiv.innerHTML = `
            <img src="${meme.imageBase64}" alt="Meme" class="meme-image">
            <p><strong>Team Name:</strong> ${meme.teamName}</p>
            <p><strong>Flags Count:</strong> ${meme.flagsCount}</p> <!-- Shows flags count -->
            <div class="toggle-label">
                <span>Approval</span>
                <label class="switch">
                    <input type="checkbox" class="toggle-button isApproved" ${meme.isApproved ? "checked" : ""} data-id="${memeId}">
                    <span class="slider"></span>
                </label>
            </div>
            <div class="toggle-label">
                <span>Moderator Bonus</span>
                <label class="switch">
                    <input type="checkbox" class="toggle-button moderatorBonus" ${meme.moderatorBonus ? "checked" : ""} data-id="${memeId}">
                    <span class="slider"></span>
                </label>
            </div>
        `;

        memeContainer.appendChild(memeDiv);

        // ✅ Meme Approval Toggle
        memeDiv.querySelector(".isApproved").addEventListener("change", async (event) => {
            const isApproved = event.target.checked;

            try {
                const memeDoc = doc(db, "memes", memeId);
                await updateDoc(memeDoc, { isApproved });
                // alert(`Meme ${isApproved ? "approved" : "approval revoked"} successfully!`);
            } catch (error) {
                console.error("Error toggling meme approval status:", error);
                alert("Failed to update meme status. Please try again.");
            }
        });

        // ✅ Moderator Bonus Toggle
        memeDiv.querySelector(".moderatorBonus").addEventListener("change", async (event) => {
            const moderatorBonus = event.target.checked;

            try {
                const memeDoc = doc(db, "memes", memeId);
                await updateDoc(memeDoc, { moderatorBonus });
                // alert(`Moderator bonus ${moderatorBonus ? "enabled" : "disabled"} successfully!`);
            } catch (error) {
                console.error("Error updating bonus status:", error);
                alert("Failed to update moderator bonus. Please try again.");
            }
        });
    }

    await fetchTeams(); // Load team data
    fetchMemes(); // Load memes on page load
});
