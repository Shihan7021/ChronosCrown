// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDXV8FNZ1HDdxJz_2IHuZ6sFPYzXESXLaA",
  authDomain: "chronoscrown-cfd9e.firebaseapp.com",
  projectId: "chronoscrown-cfd9e",
  storageBucket: "chronoscrown-cfd9e.firebasestorage.app",
  messagingSenderId: "358791614251",
  appId: "1:358791614251:web:c2404222f2d0fe19727f6e",
  measurementId: "G-QY0N3226BD"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
