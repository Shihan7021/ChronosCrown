// auth.js
import { auth, db } from './firebase.init.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updatePassword } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Register new website user
export async function register(email, password, displayName) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      displayName,
      email,
      role: "user" // normal user
    });

    return user;
  } catch (err) {
    throw err;
  }
}

// Login user
export async function login(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) throw new Error("User profile not found.");

    return { uid: user.uid, ...userDoc.data() };
  } catch (err) {
    throw err;
  }
}

// Logout user
export async function logout() {
  try {
    await signOut(auth);
  } catch (err) {
    console.error(err);
  }
}

// Change password
export async function changePassword(newPassword) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("No user logged in.");
    await updatePassword(user, newPassword);
  } catch (err) {
    throw err;
  }
}
