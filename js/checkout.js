// checkout.js
import { db, auth } from './firebase.init.js';
import { collection, doc, addDoc, setDoc, getDocs, serverTimestamp, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// DOM elements
const savedAddressesDiv = document.getElementById('saved-addresses');
const addressForm = document.getElementById('address-form');
const nextToPaymentBtn = document.getElementById('toPayment');

let selectedAddressId = null;

// Load user's saved addresses
async function loadAddresses() {
  const user = auth.currentUser;
  if (!user) {
    alert("Please login first");
    window.location.href = 'login.html';
    return;
  }

  savedAddressesDiv.innerHTML = '';
  const addressesRef = collection(db, 'users', user.uid, 'addresses');
  const snapshot = await getDocs(addressesRef);

  if (snapshot.empty) {
    savedAddressesDiv.innerHTML = '<p>No saved addresses.</p>';
    return;
  }

  snapshot.forEach(docSnap => {
    const addr = docSnap.data();
    const div = document.createElement('div');
    div.className = 'address-card';
    div.innerHTML = `
      <input type="radio" name="selectedAddress" value="${docSnap.id}" id="addr-${docSnap.id}">
      <label for="addr-${docSnap.id}">
        ${addr.name}, ${addr.line1}, ${addr.city}, ${addr.state || ''}, ${addr.zip || ''}, ${addr.country}
      </label>
    `;
    savedAddressesDiv.appendChild(div);
  });

  document.querySelectorAll('input[name="selectedAddress"]').forEach(radio => {
    radio.addEventListener('change', e => {
      selectedAddressId = e.target.value;
    });
  });
}

// Add new address
addressForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;

  const newAddr = {
    name: addressForm.name.value,
    line1: addressForm.line1.value,
    city: addressForm.city.value,
    state: addressForm.state?.value || '',
    zip: addressForm.zip?.value || '',
    country: addressForm.country.value,
    createdAt: new Date()
  };

  await addDoc(collection(db, 'users', user.uid, 'addresses'), newAddr);
  addressForm.reset();
  loadAddresses();
});

// Proceed to payment / place order
nextToPaymentBtn.addEventListener('click', async () => {
  const user = auth.currentUser;
  if (!user) {
    alert("Please login first.");
    window.location.href = 'login.html';
    return;
  }

  if (!selectedAddressId) {
    alert("Please select an address or add a new one.");
    return;
  }

  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  if (cart.length === 0) {
    alert("Your cart is empty.");
    return;
  }

  // Ask user to select payment method
  const paymentMethod = prompt("Enter payment method: ipg (card) or cod (cash)").toLowerCase();
  if (!['ipg', 'cod'].includes(paymentMethod)) {
    alert("Invalid payment method.");
    return;
  }

  // Generate unique order ID and tracking number
  const orderId = 'ORD' + Date.now();
  const trk = 'TRK' + Date.now() + Math.floor(Math.random() * 1000);

  // Save order in Firestore
  await setDoc(doc(db, 'orders', orderId), {
    userId: user.uid,
    addressId: selectedAddressId,
    cart,
    paymentMethod,
    status: 'Order Accepted',
    trackingNumber: trk,
    createdAt: serverTimestamp(),
    estimatedDelivery: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
  });

  // Clear cart
  localStorage.removeItem('cart');
  localStorage.removeItem('cart_count');

  // Store last order info for thank-you page
  sessionStorage.setItem('lastOrderId', orderId);
  sessionStorage.setItem('lastOrderTrk', trk);

  // Redirect to Thank You page with query params
  const queryParams = new URLSearchParams({
    order: orderId,
    trk: trk,
    amt: cart.reduce((sum, p) => sum + (p.price || 0) * (p.qty || 1), 0)
  });
  window.location.href = `thank-you.html?${queryParams.toString()}`;
});

// Initialize
auth.onAuthStateChanged(() => {
  loadAddresses();
});
