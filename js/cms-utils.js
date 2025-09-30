// js/cms-utils.js
import { auth } from './firebase-config.js';

export function getCmsUser() {
  try {
    const raw = sessionStorage.getItem('cmsUser');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
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
