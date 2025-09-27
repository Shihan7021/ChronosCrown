// js/register.js
// Uses the auth.register() function provided in js/auth.js (which uses firebase.init.js)
import { register } from './auth.js'; // should exist from earlier provided auth.js

const form = document.getElementById('registerForm');
const statusEl = document.getElementById('regStatus');
const cancelBtn = document.getElementById('cancelBtn');

if (cancelBtn) {
  cancelBtn.addEventListener('click', () => {
    window.location.href = 'index.html';
  });
}

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusEl.style.color = 'var(--muted)';
    statusEl.textContent = 'Creating account...';

    const displayName = document.getElementById('displayName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('passwordConfirm').value;

    // basic validation
    if (!displayName || !email || !password || !passwordConfirm) {
      statusEl.style.color = 'crimson';
      statusEl.textContent = 'Please fill all required fields.';
      return;
    }
    if (password.length < 6) {
      statusEl.style.color = 'crimson';
      statusEl.textContent = 'Password must be at least 6 characters.';
      return;
    }
    if (password !== passwordConfirm) {
      statusEl.style.color = 'crimson';
      statusEl.textContent = 'Passwords do not match.';
      return;
    }

    try {
      // register() is implemented in your auth.js (creates user and user doc in Firestore)
      await register(email, password, displayName);
      statusEl.style.color = 'green';
      statusEl.textContent = 'Account created — redirecting to home...';

      // small delay so user sees message, then redirect
      setTimeout(() => {
        // after register we redirect user to home, or to login if you prefer:
        window.location.href = 'index.html';
      }, 900);
    } catch (err) {
      console.error(err);
      statusEl.style.color = 'crimson';
      // show reasonable error message
      statusEl.textContent = err?.message || 'Registration failed. Try again.';
    }
  });
}
