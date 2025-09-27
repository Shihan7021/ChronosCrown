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
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
            displayName,
            email,
            role: "user"   // <-- assign role here
        });

        statusEl.style.color = "green";
        statusEl.textContent = "Account created — redirecting to home...";
        setTimeout(() => { window.location.href = "index.html"; }, 900);
        } catch (err) {
        console.error(err);
        statusEl.style.color = "crimson";
        statusEl.textContent = err?.message || "Registration failed. Try again.";
        }

  });
}
