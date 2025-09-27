// cms-auth.js
import { auth, db } from './firebase-config.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

const form = document.getElementById('cmsLoginForm');
const statusEl = document.getElementById('cmsLoginStatus');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  try {
    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Fetch user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists() || userDoc.data().role !== 'system') {
      statusEl.style.color = 'crimson';
      statusEl.textContent = 'Access denied. Not a system user.';
      await auth.signOut();
      return;
    }

    // Save CMS session
    sessionStorage.setItem('cmsUser', JSON.stringify({ uid: user.uid, email: email }));
    statusEl.style.color = 'green';
    statusEl.textContent = 'Login successful! Redirecting...';
    setTimeout(() => window.location.href = 'cms-dashboard.html', 1000);

  } catch (err) {
    console.error(err);
    statusEl.style.color = 'crimson';
    statusEl.textContent = err.message;
  }
});
