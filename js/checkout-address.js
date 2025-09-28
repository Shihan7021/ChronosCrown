// checkout-address.js - address selection step
import { auth, db } from './firebase.init.js';
import { collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

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

async function loadAddresses(user) {
  savedContainer.innerHTML = '';
  const ref = collection(db, 'users', user.uid, 'addresses');
  const snap = await getDocs(ref);
  if (snap.empty) {
    savedContainer.innerHTML = '<p>No saved addresses.</p>';
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
    card.querySelector('input').addEventListener('change', e => {
      selectedAddressId = e.target.value;
    });
    savedContainer.appendChild(card);
  });
}

form.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;
  const address = {
    name: document.getElementById('fullName').value,
    line1: document.getElementById('street').value,
    city: document.getElementById('city').value,
    state: document.getElementById('state').value,
    zip: document.getElementById('zip').value,
    country: document.getElementById('country').value,
    createdAt: new Date()
  };
  const docRef = await addDoc(collection(db, 'users', user.uid, 'addresses'), address);
  // proceed immediately with new address
  sessionStorage.setItem('selectedAddressId', docRef.id);
  window.location.href = 'checkout-payment.html';
});

nextBtn.addEventListener('click', ()=>{
  if (!selectedAddressId) { alert('Please select an address or add a new one.'); return; }
  sessionStorage.setItem('selectedAddressId', selectedAddressId);
  window.location.href = 'checkout-payment.html';
});

(async function init(){
  const user = await ensureLogin();
  await loadAddresses(user);
})();
