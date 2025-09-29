// checkout-address.js - address selection step
import { auth, db } from './firebase.init.js';
import { collection, addDoc, getDocs, doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

const savedContainer = document.getElementById('savedAddresses');
const form = document.getElementById('addressForm');
const nextBtn = document.getElementById('nextToPayment');
let selectedAddressId = null;
let editAddressId = null;

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
  try {
    const ref = collection(db, 'users', user.uid, 'addresses');
    const snap = await getDocs(ref);
    if (snap.empty) {
      savedContainer.innerHTML = '<p>No saved addresses.</p>';
      nextBtn.disabled = true;
      return;
    }
    snap.forEach(function(docSnap){
      const addr = docSnap.data();
      const id = docSnap.id;
      const card = document.createElement('div');
      card.className = 'address-card selectable';
      var mobileSpan = addr.mobile ? ' <span class="meta">(' + addr.mobile + ')</span>' : '';
      card.innerHTML =
        '<input type="radio" name="selAddress" value="' + id + '" style="accent-color: var(--luxury-blue); margin-right:8px;">' +
        '<div class="addr">' +
        '<strong>' + (addr.name || '') + '</strong>' + mobileSpan + '<br>' +
        (addr.line1 || '') + '<br>' +
        (addr.city || '') + ', ' + (addr.state || '') + ' ' + (addr.zip || '') + '<br>' +
        (addr.country || '') +
        '<div style="margin-top:6px;"><button class="btn small" data-edit="' + id + '" type="button">Edit</button></div>' +
        '</div>';
      const radio = card.querySelector('input[type="radio"]');
      if (selectedAddressId && selectedAddressId === id) {
        radio.checked = true;
      }
      radio.addEventListener('change', function(e){
        selectedAddressId = e.target.value;
        sessionStorage.setItem('selectedAddressId', selectedAddressId);
        nextBtn.disabled = !selectedAddressId;
      });
      const editBtn = card.querySelector('[data-edit]');
      if (editBtn) {
        editBtn.addEventListener('click', function(e){
          e.preventDefault();
          e.stopPropagation();
          document.getElementById('fullName').value = addr.name || '';
          document.getElementById('mobile').value = addr.mobile || '';
          document.getElementById('street').value = addr.line1 || '';
          document.getElementById('city').value = addr.city || '';
          document.getElementById('state').value = addr.state || '';
          document.getElementById('zip').value = addr.zip || '';
          document.getElementById('country').value = addr.country || '';
          editAddressId = id;
          const submitBtn = form.querySelector('button[type="submit"]');
          if (submitBtn) submitBtn.textContent = 'Update';
        });
      }
      savedContainer.appendChild(card);
    });
  } catch (e) {
    console.error('Failed to load addresses from subcollection, trying legacy array', e);
    // fallback: legacy array on user doc
    const uref = doc(db, 'users', user.uid);
    const usnap = await getDoc(uref);
    if (!usnap.exists()) {
      savedContainer.innerHTML = '<p>No saved addresses.</p>';
      nextBtn.disabled = true;
      return;
    }
    var data = usnap.data();
    var arr = Array.isArray(data.addresses) ? data.addresses : [];
    if (!arr.length) {
      savedContainer.innerHTML = '<p>No saved addresses.</p>';
      nextBtn.disabled = true;
      return;
    }
    arr.forEach(function(addr){
      const id = addr.id;
      const card = document.createElement('div');
      card.className = 'address-card selectable';
      var mobileSpan = addr.mobile ? ' <span class="meta">(' + addr.mobile + ')</span>' : '';
      card.innerHTML =
        '<input type="radio" name="selAddress" value="' + id + '" style="accent-color: var(--luxury-blue); margin-right:8px;">' +
        '<div class="addr">' +
        '<strong>' + (addr.name || '') + '</strong>' + mobileSpan + '<br>' +
        (addr.line1 || '') + '<br>' +
        (addr.city || '') + ', ' + (addr.state || '') + ' ' + (addr.zip || '') + '<br>' +
        (addr.country || '') +
        '<div style="margin-top:6px;"><button class="btn small" data-edit="' + id + '" type="button">Edit</button></div>' +
        '</div>';
      const radio = card.querySelector('input[type="radio"]');
      if (selectedAddressId && selectedAddressId === id) {
        radio.checked = true;
      }
      radio.addEventListener('change', function(e){
        selectedAddressId = e.target.value;
        sessionStorage.setItem('selectedAddressId', selectedAddressId);
        nextBtn.disabled = !selectedAddressId;
      });
      const editBtn = card.querySelector('[data-edit]');
      if (editBtn) {
        editBtn.addEventListener('click', function(e){
          e.preventDefault();
          e.stopPropagation();
          document.getElementById('fullName').value = addr.name || '';
          document.getElementById('mobile').value = addr.mobile || '';
          document.getElementById('street').value = addr.line1 || '';
          document.getElementById('city').value = addr.city || '';
          document.getElementById('state').value = addr.state || '';
          document.getElementById('zip').value = addr.zip || '';
          document.getElementById('country').value = addr.country || '';
          editAddressId = id;
          const submitBtn = form.querySelector('button[type="submit"]');
          if (submitBtn) submitBtn.textContent = 'Update';
        });
      }
      savedContainer.appendChild(card);
    });
  }
  nextBtn.disabled = !selectedAddressId;
}

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
    const payload = {
      name: document.getElementById('fullName').value.trim(),
      mobile: document.getElementById('mobile').value.trim(),
      line1: document.getElementById('street').value.trim(),
      city: document.getElementById('city').value.trim(),
      state: document.getElementById('state').value.trim(),
      zip: document.getElementById('zip').value.trim(),
      country: document.getElementById('country').value.trim()
    };

    try {
      if (editAddressId) {
        await updateDoc(doc(db, 'users', user.uid, 'addresses', editAddressId), payload);
        selectedAddressId = editAddressId;
        editAddressId = null;
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.textContent = 'Add address';
      } else {
        const docRef = await addDoc(collection(db, 'users', user.uid, 'addresses'), payload);
        selectedAddressId = docRef.id;
      }
    } catch (subErr) {
      console.error('Subcollection write failed, attempting legacy array model', subErr);
      // fallback to array on user doc
      const uref = doc(db, 'users', user.uid);
      const usnap = await getDoc(uref);
      var data = usnap.exists() ? usnap.data() : {};
      var arr = Array.isArray(data.addresses) ? data.addresses : [];
      if (editAddressId) {
        for (var i=0;i<arr.length;i++) if (arr[i].id === editAddressId) { arr[i] = { id: editAddressId, userId: user.uid, createdAt: new Date(), ...payload }; break; }
        await setDoc(uref, { addresses: arr }, { merge: true });
        selectedAddressId = editAddressId;
        editAddressId = null;
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.textContent = 'Add address';
      } else {
        const newAddr = { id: 'ADDR' + Date.now(), userId: user.uid, createdAt: new Date(), ...payload };
        arr.push(newAddr);
        await setDoc(uref, { addresses: arr }, { merge: true });
        selectedAddressId = newAddr.id;
      }
    }

    form.reset();
    sessionStorage.setItem('selectedAddressId', selectedAddressId);
    await loadAddresses(user);
    nextBtn.disabled = !selectedAddressId;
  } catch(err){
    console.error(err);
    var msg = (err && err.message) ? err.message : String(err);
    alert('Could not save address: ' + msg);
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
