// auth.js
import { auth, db } from './firebase.init.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updatePassword } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Register user
export async function register(email, password, displayName) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await setDoc(doc(db, "users", user.uid), {
    displayName,
    email,
    role: "user"
  });

  return user;
}

// Login user
export async function login(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (!userDoc.exists()) throw new Error("User profile not found.");

  return { uid: user.uid, ...userDoc.data() };
}

// Logout
export async function logout() {
  await signOut(auth);
}

// Change password
export async function changePassword(newPassword) {
  const user = auth.currentUser;
  if (!user) throw new Error("No user logged in.");
  await updatePassword(user, newPassword);
}
