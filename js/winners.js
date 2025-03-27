// document.addEventListener("DOMContentLoaded", function () {
//     // Create a hidden input modal
//     let modal = document.createElement("div");
//     modal.style.position = "fixed";
//     modal.style.top = "0";
//     modal.style.left = "0";
//     modal.style.width = "100%";
//     modal.style.height = "100%";
//     modal.style.background = "rgba(0, 0, 0, 0.9)";
//     modal.style.display = "flex";
//     modal.style.alignItems = "center";
//     modal.style.justifyContent = "center";
//     modal.style.zIndex = "1000";

//     let box = document.createElement("div");
//     box.style.background = "#222";
//     box.style.padding = "20px";
//     box.style.borderRadius = "8px";
//     box.style.boxShadow = "0 0 10px rgba(255, 255, 255, 0.3)";
//     box.style.textAlign = "center";

//     let label = document.createElement("p");
//     label.textContent = "Enter Moderator Code:";
//     label.style.color = "#fff";
//     label.style.marginBottom = "10px";
//     label.style.fontFamily = "Arial, sans-serif";

//     let input = document.createElement("input");
//     input.type = "password"; // Hidden input
//     input.style.padding = "10px";
//     input.style.border = "1px solid #444";
//     input.style.borderRadius = "5px";
//     input.style.background = "#333";
//     input.style.color = "#fff";
//     input.style.fontSize = "16px";
//     input.style.textAlign = "center";
//     input.autofocus = true;

//     let button = document.createElement("button");
//     button.textContent = "Submit";
//     button.style.marginTop = "10px";
//     button.style.padding = "10px 20px";
//     button.style.border = "none";
//     button.style.borderRadius = "5px";
//     button.style.background = "#28a745";
//     button.style.color = "#fff";
//     button.style.fontSize = "16px";
//     button.style.cursor = "pointer";

//     // Handle authentication
//     button.onclick = function () {
//         if (input.value === "270325") {
//             document.body.removeChild(modal); // Remove modal if correct
//         } else {
//             alert("Incorrect Code! Redirecting to memeSpace...");
//             window.location.href = "memeSpace.html"; // Redirect if incorrect
//         }
//     };

//     // Append elements to modal
//     box.appendChild(label);
//     box.appendChild(input);
//     box.appendChild(button);
//     modal.appendChild(box);
//     document.body.appendChild(modal);
// });

