import { auth, db } from './firebase-config.js';
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

window.addEventListener('DOMContentLoaded', () => {
  const headerContainer = document.querySelector('.header div[style*="display:flex"]');
  if (!headerContainer) return;

  const updateHeader = async (user) => {
    if (user) {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.exists() ? userDoc.data() : { displayName: 'User' };

      headerContainer.innerHTML = `
        <div class="greeting">Hi, ${userData.displayName}</div>
        <div class="person-icon" style="position:relative; cursor:pointer;">
          <img src="/assets/icons/person.svg" alt="Profile" style="height:22px;">
          <div class="dropdown" style="display:none; position:absolute; right:0; background:white; border:1px solid #ccc; padding:8px;">
            <a href="my-profile.html">My Profile</a><br>
            <a href="#" id="logoutBtn">Logout</a>
          </div>
        </div>
      `;

      const personIcon = document.querySelector('.person-icon');
      const dropdown = personIcon.querySelector('.dropdown');
      personIcon.addEventListener('click', () => {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
      });

      document.getElementById('logoutBtn').addEventListener('click', async () => {
        await auth.signOut();
        window.location.reload();
      });
    } else {
      // No user logged in: show original buttons
      headerContainer.innerHTML = `
        <a href="login.html" class="btn secondary">Sign In</a>
        <a href="cart.html" class="icon-btn" aria-label="Cart">
          <img src="/assets/icons/cart.svg" alt="Cart" style="height:22px;">
          <div class="badge cart-badge">0</div>
        </a>
      `;
    }
  };

  // Listen to auth state changes
  auth.onAuthStateChanged(updateHeader);
});
