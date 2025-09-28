import { auth, db } from './firebase.init.js';
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

const profileForm = document.getElementById('profileForm');
const passwordForm = document.getElementById('passwordForm');
const profileStatus = document.getElementById('profileStatus');
const passwordStatus = document.getElementById('passwordStatus');
const nameInput = document.getElementById('profileName');
const addrInput = document.getElementById('profileAddress');

function setStatus(el, msg, ok=true){ if(!el) return; el.style.color = ok ? 'green' : 'crimson'; el.textContent = msg; }

auth.onAuthStateChanged(async (user) => {
  if (!user) { window.location.href = 'login.html'; return; }

  try {
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (snap.exists()) {
      const data = snap.data();
      nameInput.value = data.displayName || '';
      addrInput.value = data.address || '';
    }
  } catch(err) {
    console.error(err);
  }

  profileForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    try{
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: nameInput.value.trim(),
        address: addrInput.value.trim(),
        updatedAt: new Date()
      });
      localStorage.setItem('userDisplayName', nameInput.value.trim() || 'User');
      setStatus(profileStatus, 'Profile updated!', true);
    } catch(err){
      console.error(err);
      setStatus(profileStatus, err.message || 'Update failed', false);
    }
  });

  passwordForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
      setStatus(passwordStatus, 'New passwords do not match.', false);
      return;
    }

    try{
      // Reauthenticate with current password
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setStatus(passwordStatus, 'Password updated successfully!', true);
      passwordForm.reset();
    } catch(err){
      console.error(err);
      setStatus(passwordStatus, err.message || 'Password update failed', false);
    }
  });
});
