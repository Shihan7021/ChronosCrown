// cms.js - basic CMS checks and operations for admin pages
import { auth, db, storage } from './firebase.init.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { doc, getDoc, collection, addDoc, setDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const adminRedirect = '/login.html';

onAuthStateChanged(auth, async user=>{
  if(!user) { location.href = adminRedirect; return; }
  // verify admin role in users collection
  const snap = await getDoc(doc(db, 'users', user.uid));
  if(!snap.exists() || snap.data().role !== 'admin'){ alert('You are not authorized to view CMS'); auth.signOut(); location.href = '/'; return; }
  // else allow CMS page usage
  initCMS();
});

function initCMS(){
  // placeholder - CMS pages will implement product add/edit using Firestore
  document.querySelectorAll('.cms-welcome').forEach(el=> el.textContent = 'Welcome admin');
}

// export any functions needed across cms pages (product add/edit, user mgmt)
export { initCMS };
