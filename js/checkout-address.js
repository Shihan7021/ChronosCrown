// checkout-address.js - address selection step
import { auth, db } from './firebase.init.js';
import { collection, addDoc, getDocs, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

const savedContainer = document.getElementById('savedAddresses');
const form = document.getElementById('addressForm');
const nextBtn = document.getElementById('nextToPayment');
let selectedAddressId = null;

async function ensureLogin() {
  return new Promise(resolve => {
    auth.onAuthStateChanged(user => {
      if (!user) {
        alert('Please login first.');
        window.location.href = 'login.html';
      } else {
        resolve(user);
      }
    });
  });
}

async function ensureUserDoc(user){
  try{
    const uref = doc(db, 'users', user.uid);
    const usnap = await getDoc(uref);
    if (!usnap.exists()) {
      await setDoc(uref, { displayName: user.displayName || 'User', email: user.email || '', createdAt: new Date() });
    }
  } catch(e){ console.warn('ensureUserDoc', e); }
}

async function loadAddresses(user) {
  savedContainer.innerHTML = '';
  const ref = collection(db, 'users', user.uid, 'addresses');
  const snap = await getDocs(ref);
  if (snap.empty) {
    savedContainer.innerHTML = '<p>No saved addresses.</p>';
    nextBtn.disabled = true;
    return;
  }
  snap.forEach(docSnap => {
    const addr = docSnap.data();
    const id = docSnap.id;
    const card = document.createElement('label');
    card.className = 'address-card selectable';
    card.innerHTML = `
      <input type=\"radio\" name=\"selAddress\" value=\"${id}\" style=\"accent-color: var(--luxury-blue);\">
      <div class=\"addr\"><strong>${addr.name}</strong><br>${addr.line1}<br>${addr.city}, ${addr.state || ''} ${addr.zip || ''}<br>${addr.country}</div>
    `;
    const radio = card.querySelector('input');
    if (selectedAddressId && selectedAddressId === id) {
      radio.checked = true;
    }
    radio.addEventListener('change', e => {
      selectedAddressId = e.target.value;
      nextBtn.disabled = !selectedAddressId;
    });
    savedContainer.appendChild(card);
  });
  nextBtn.disabled = !selectedAddressId;
}

form.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;
  try{
    await ensureUserDoc(user);
    const address = {
      userId: user.uid,
      name: document.getElementById('fullName').value,
      line1: document.getElementById('street').value,
      city: document.getElementById('city').value,
      state: document.getElementById('state').value,
      zip: document.getElementById('zip').value,
      country: document.getElementById('country').value,
      createdAt: new Date()
    };
    const docRef = await addDoc(collection(db, 'users', user.uid, 'addresses'), address);
    // clear form and show on right
    form.reset();
    selectedAddressId = docRef.id;
    sessionStorage.setItem('selectedAddressId', selectedAddressId);
    await loadAddresses(user);
    nextBtn.disabled = !selectedAddressId;
  } catch(err){
    console.error(err);
    alert('Could not save address: ' + (err?.message || err));
  }
});

nextBtn.addEventListener('click', ()=>{
  if (!selectedAddressId) { alert('Please select an address or add a new one.'); return; }
  sessionStorage.setItem('selectedAddressId', selectedAddressId);
  window.location.href = 'checkout-payment.html';
});

(async function init(){
  const user = await ensureLogin();
  await ensureUserDoc(user);
  // restore previously selected if any
  selectedAddressId = sessionStorage.getItem('selectedAddressId');
  await loadAddresses(user);
  nextBtn.disabled = !selectedAddressId;
})();
