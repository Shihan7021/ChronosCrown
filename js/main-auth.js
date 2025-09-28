import { auth, db } from './firebase.init.js';
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

window.addEventListener('DOMContentLoaded', () => {
  const loginLink = document.getElementById('loginLink');
  const registerLink = document.getElementById('registerLink');
  const userMenu = document.getElementById('userMenu');
  const greetingText = document.getElementById('greetingText');
  const logoutBtn = document.getElementById('logoutBtn');

  function showLoggedIn(name) {
    if (greetingText) greetingText.textContent = `Hi, ${name || 'User'}`;
    if (loginLink) loginLink.classList.add('hidden');
    if (registerLink) registerLink.classList.add('hidden');
    if (userMenu) userMenu.classList.remove('hidden');
  }
  function showLoggedOut() {
    if (loginLink) loginLink.classList.remove('hidden');
    if (registerLink) registerLink.classList.remove('hidden');
    if (userMenu) userMenu.classList.add('hidden');
  }

  // Instant render from cache to avoid flicker
  const cachedName = localStorage.getItem('userDisplayName');
  if (cachedName) {
    showLoggedIn(cachedName);
  }

  // Listen to auth state changes
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.exists() ? userDoc.data() : { displayName: 'User' };
        localStorage.setItem('userDisplayName', userData.displayName || 'User');
        showLoggedIn(userData.displayName);
      } catch(e){
        console.warn('Failed to load user profile', e);
        showLoggedIn(cachedName || 'User');
      }
      // attach logout if present
      const btn = document.getElementById('logoutBtn');
      if (btn) btn.addEventListener('click', async (e)=>{
        e.preventDefault();
        await auth.signOut();
        localStorage.removeItem('userDisplayName');
        showLoggedOut();
        window.location.href = 'index.html';
      });
    } else {
      localStorage.removeItem('userDisplayName');
      showLoggedOut();
    }
  });
});
