// js/cms-utils.js
import { auth, db } from './firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

export function getCmsUser() {
  try {
    const raw = sessionStorage.getItem('cmsUser');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export async function requireCmsAuthAndRole() {
  // Wait for Firebase Auth user
  const user = await new Promise(resolve => {
    if (auth.currentUser) return resolve(auth.currentUser);
    const unsub = auth.onAuthStateChanged(u => { if (u) { unsub(); resolve(u); } });
  });

  // Fetch role from users/{uid}
  const snap = await getDoc(doc(db, 'users', user.uid));
  if (!snap.exists()) {
    alert('Access denied. Missing user profile.');
    await auth.signOut();
    sessionStorage.removeItem('cmsUser');
    window.location.href = 'cms-login.html';
    return;
  }

  const data = snap.data() || {};
  const role = (typeof data.role === 'string' ? data.role : '').trim();
  const roleNorm = role.toLowerCase();
  const allowed = ['system', 'admin', 'manager', 'associate'];
  if (!allowed.includes(roleNorm)) {
    alert('Access denied. Insufficient role.');
    await auth.signOut();
    sessionStorage.removeItem('cmsUser');
    window.location.href = 'cms-login.html';
    return;
  }

  // Normalize and store into session for UI usage
  const titleCase = roleNorm === 'system' ? 'system' : (roleNorm.charAt(0).toUpperCase() + roleNorm.slice(1));
  sessionStorage.setItem('cmsUser', JSON.stringify({
    uid: user.uid,
    email: user.email,
    role: titleCase,
    displayName: data.displayName || 'System User'
  }));
}

export function setupGreetingAndLogout() {
  const greet = document.getElementById('cmsGreeting');
  const btn = document.getElementById('cmsLogoutBtn');
  const cmsUser = getCmsUser();
  if (cmsUser && greet) greet.textContent = `Hi, ${cmsUser.displayName || 'User'}`;
  if (btn) btn.addEventListener('click', async () => {
    await auth.signOut();
    sessionStorage.removeItem('cmsUser');
    window.location.href = 'cms-login.html';
  });
}
