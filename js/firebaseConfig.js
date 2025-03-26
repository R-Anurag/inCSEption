// Import the functions you need from the Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js"; // Import Firestore

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDm9OzrIe6fAdSWP0absciUPTu6vuiJKgk",
    authDomain: "incseption-memes.firebaseapp.com",
    projectId: "incseption-memes",
    storageBucket: "incseption-memes.firebasestorage.app",
    messagingSenderId: "596455532561",
    appId: "1:596455532561:web:ece9fb0f9f1d743d6da9b0",
    measurementId: "G-SBZEHERNW4"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// console.log("Firebase initialized:", app);

// Initialize Firestore
export const db = getFirestore(app); // Export Firestore for use in other files
// console.log("Firestore initialized:", db);
