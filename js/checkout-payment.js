// checkout-payment.js - payment step and order creation
import { auth, db } from './firebase.init.js';
import { doc, setDoc, getDoc, collection, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

const addressDisplay = document.getElementById('addressDisplay');
const cartItemsDiv = document.getElementById('cartItems');
const totalAmountDiv = document.getElementById('totalAmount');
const payNowBtn = document.getElementById('payNowBtn');

let amount = 0;
let orderId = '';

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

async function loadAddress(user) {
  const addrId = sessionStorage.getItem('selectedAddressId');
  if (!addrId) { addressDisplay.textContent = 'No address selected.'; return; }
  const ref = doc(db, 'addresses', addrId);
  const snap = await getDoc(ref);
  if (snap.exists() && snap.data().userId !== user.uid) { addressDisplay.textContent = 'Address not found.'; return; }
  if (!snap.exists()) { addressDisplay.textContent = 'Address not found.'; return; }
  const a = snap.data();
  addressDisplay.textContent = `${a.name}, ${a.line1}, ${a.city}, ${a.state || ''} ${a.zip || ''}, ${a.country}`;
}

function loadCart() {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  cartItemsDiv.innerHTML = '';
  if (cart.length === 0) { cartItemsDiv.innerHTML = '<p>Your cart is empty.</p>'; return cart; }
  amount = cart.reduce((sum, p) => sum + (p.price || 0) * (p.qty || 1), 0);
  cart.forEach(item => {
    const row = document.createElement('div');
    row.className = 'cart-row';
    row.innerHTML = `${item.name} × ${item.qty} — Rs.${(item.price||0).toFixed(2)}`;
    cartItemsDiv.appendChild(row);
  });
  totalAmountDiv.textContent = `Total: $${amount.toFixed(2)}`;
  return cart;
}

async function createOrder(user, addressId, cart, paymentMethod) {
  orderId = 'ORD' + Date.now();
  const trk = 'TRK' + Date.now() + Math.floor(Math.random() * 1000);
  await setDoc(doc(db, 'orders', orderId), {
    userId: user.uid,
    addressId,
    cart,
    paymentMethod,
    status: paymentMethod === 'ipg' ? 'Payment Pending' : 'Order Accepted',
    trackingNumber: trk,
    createdAt: serverTimestamp(),
    estimatedDelivery: new Date(Date.now() + 14*24*60*60*1000)
  });
  // Persist for thank-you page
  sessionStorage.setItem('lastOrderId', orderId);
  sessionStorage.setItem('lastOrderTrk', trk);
}

payNowBtn.addEventListener('click', async ()=>{
  const user = auth.currentUser;
  const addrId = sessionStorage.getItem('selectedAddressId');
  if (!user || !addrId) { alert('Missing user or address.'); return; }
  const method = (document.querySelector('input[name="payment"]:checked') || {}).value || 'ipg';
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  if (cart.length === 0) { alert('Your cart is empty.'); return; }

  await createOrder(user, addrId, cart, method);

  if (method === 'ipg') {
    // Simulated IPG redirect
    const params = new URLSearchParams({ order: orderId, amt: String(amount) });
    window.location.href = `payment-gateway.html?${params.toString()}`;
  } else {
    // COD: clear cart and go to thank you
    localStorage.removeItem('cart');
    localStorage.removeItem('cart_count');
    window.location.href = `thankyou.html?order=${orderId}`;
  }
});

(async function init(){
  const user = await ensureLogin();
  await loadAddress(user);
  loadCart();
})();
