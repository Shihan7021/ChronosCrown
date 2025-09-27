// firebase.init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDXV8FNZ1HDdxJz_2IHuZ6sFPYzXESXLaA",
  authDomain: "chronoscrown-cfd9e.firebaseapp.com",
  projectId: "chronoscrown-cfd9e",
  storageBucket: "chronoscrown-cfd9e.firebasestorage.app",
  messagingSenderId: "358791614251",
  appId: "1:358791614251:web:c2404222f2d0fe19727f6e",
  measurementId: "G-QY0N3226BD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
