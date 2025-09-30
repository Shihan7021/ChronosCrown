// cms-auth.js
import { auth, db } from './firebase-config.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

const form = document.getElementById('cmsLoginForm');
const statusEl = document.getElementById('cmsLoginStatus');

function showStatus(type, msg) {
  if (!statusEl) return;
  statusEl.classList.remove('d-none');
  statusEl.classList.remove('alert-soft', 'alert-danger', 'alert-success');
  statusEl.classList.add('alert', type === 'success' ? 'alert-success' : 'alert-danger');
  statusEl.textContent = msg;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Ensure fresh token (in case rules rely on custom claims)
    try { await user.getIdToken(true); } catch (e) {}

    const userDoc = await getDoc(doc(db, 'users', user.uid));

    // Allow all CMS roles
    const allowedRoles = ['system', 'Admin', 'Manager', 'Associate'];

    if (!userDoc.exists() || !allowedRoles.includes(userDoc.data().role)) {
      showStatus('danger', 'Access denied. Not a CMS user.');
      await auth.signOut();
      return;
    }

    const userData = userDoc.data();

    // Save role + full data in sessionStorage
    sessionStorage.setItem('cmsUser', JSON.stringify({ 
      uid: user.uid, 
      email: user.email,
      role: userData.role,
      displayName: userData.displayName || "System User"
    }));

    showStatus('success', 'Login successful! Redirecting...');
    setTimeout(() => window.location.href = 'cms-dashboard.html', 1000);

  } catch (err) {
    console.error(err);
    if (err && err.code === 'permission-denied') {
      showStatus('danger', 'Access denied: Missing or insufficient Firestore permissions for your user profile. Ensure a user document exists at users/your-uid with an allowed role (system/Admin/Manager/Associate), and that Firestore rules allow you to read your own user doc.');
    } else {
      showStatus('danger', err.message || 'Login failed');
    }
  }
});
