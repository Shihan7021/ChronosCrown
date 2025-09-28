import { register } from './auth.js';

const form = document.getElementById('registerForm');
const statusEl = document.getElementById('regStatus');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const displayName = document.getElementById('displayName').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const passwordConfirm = document.getElementById('passwordConfirm').value;

  if (!displayName || !email || !password || !passwordConfirm) {
    statusEl.style.color = 'crimson';
    statusEl.textContent = 'Please fill all fields.';
    return;
  }

  if (password !== passwordConfirm) {
    statusEl.style.color = 'crimson';
    statusEl.textContent = 'Passwords do not match.';
    return;
  }

  try {
    await register(email, password, displayName);
    localStorage.setItem('userDisplayName', displayName);
    statusEl.style.color = 'green';
    statusEl.textContent = 'Account created successfully! Redirecting...';
    setTimeout(() => window.location.href = 'index.html', 800);
  } catch (err) {
    console.error(err);
    statusEl.style.color = 'crimson';
    statusEl.textContent = err.message || 'Registration failed.';
  }
});
