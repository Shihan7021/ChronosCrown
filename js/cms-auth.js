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
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists() || userDoc.data().role !== 'system') {
      statusEl.style.color = 'crimson';
      statusEl.textContent = 'Access denied. Not a system user.';
      await auth.signOut();
      return;
    }

    const userData = userDoc.data();

    // ✅ Save role + full data
    sessionStorage.setItem('cmsUser', JSON.stringify({ 
      uid: user.uid, 
      email: user.email,
      role: userData.role,
      displayName: userData.displayName || "System User"
    }));

    statusEl.style.color = 'green';
    statusEl.textContent = 'Login successful! Redirecting...';
    setTimeout(() => window.location.href = 'cms-dashboard.html', 1000);

  } catch (err) {
    console.error(err);
    statusEl.style.color = 'crimson';
    statusEl.textContent = err.message;
  }
});
