import { auth } from './firebase.init.js'; // make sure path is correct
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getDoc, doc, db } from './firebase.init.js'; // make sure db is imported too

const form = document.getElementById('cmsLoginForm');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // check role for CMS
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists() || userDoc.data().role !== 'system') {
      alert('Access denied. Not a system user.');
      await auth.signOut();
      return;
    }

    // Save CMS session
    sessionStorage.setItem('cmsUser', JSON.stringify({ uid: user.uid, email: email }));
    window.location.href = 'cms-dashboard.html';

  } catch (err) {
    console.error(err);
    alert(err.message);
  }
});
