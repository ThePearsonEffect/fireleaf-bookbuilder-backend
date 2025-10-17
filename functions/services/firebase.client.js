// public/js/firebase.client.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

export const firebaseConfig = {
  apiKey: "AIzaSyAPMz9yGzOhXZAz3g8zBT2BVpqUnwoAg-E",
  authDomain: "tribelifeinspired-3d888.firebaseapp.com",
  projectId: "tribelifeinspired-3d888",
  storageBucket: "tribelifeinspired-3d888.firebasestorage.app",
  messagingSenderId: "617062636859",
  appId: "1:617062636859:web:2571d60d27bc34987d6b1e",
  measurementId: "G-3QB8FQDE7R"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// optional: expose for debugging
window.auth = auth;
