// auth.js - register / login / session management
import { auth, db } from './firebase.init.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

export async function register(email, password, displayName){
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  // create user profile doc
  await setDoc(doc(db, 'users', cred.user.uid), {
    email, displayName, createdAt: new Date().toISOString()
  });
  return cred;
}

export async function login(email, password){
  return await signInWithEmailAndPassword(auth, email, password);
}

export function onAuth(cb){
  onAuthStateChanged(auth, async (user)=>{
    if(user){
      const docRef = doc(db, 'users', user.uid);
      const snap = await getDoc(docRef);
      const profile = snap.exists()? snap.data() : null;
      cb(user, profile);
    } else {
      cb(null,null);
    }
  });
}

export async function logout(){
  await signOut(auth);
}
