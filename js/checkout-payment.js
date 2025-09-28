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
  if (!addrId) { addressDisplay.textContent = 'No address selected.'; return null; }
  const usnap = await getDoc(doc(db, 'users', user.uid));
  if (!usnap.exists()) { addressDisplay.textContent = 'Address not found.'; return null; }
  const arr = Array.isArray(usnap.data().addresses) ? usnap.data().addresses : [];
  const a = arr.find(x => x.id === addrId);
  if (!a) { addressDisplay.textContent = 'Address not found.'; return null; }
  addressDisplay.textContent = `${a.name}, ${a.line1}, ${a.city}, ${a.state || ''} ${a.zip || ''}, ${a.country}`;
  return a;
}

function loadCart() {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  cartItemsDiv.innerHTML = '';
  if (cart.length === 0) { cartItemsDiv.innerHTML = '<p>Your cart is empty.</p>'; return cart; }
  amount = cart.reduce((sum, p) => sum + (p.price || 0) * (p.qty || 1), 0);
  cart.forEach(item => {
    const row = document.createElement('div');
    row.className = 'cart-row';
    row.innerHTML = `${item.name} × ${item.qty} — $${(item.price||0).toFixed(2)} (${item.color || '-'} • ${item.strap || '-'} • ${item.size || '-'})`;
    cartItemsDiv.appendChild(row);
  });
  totalAmountDiv.textContent = `Total: $${amount.toFixed(2)}`;
  return cart;
}

async function createOrder(user, addressId, cart, paymentMethod) {
  orderId = 'ORD' + Date.now();
  const trk = 'TRK' + Date.now() + Math.floor(Math.random() * 1000);

  // build items without images, include options and model
  const items = cart.map(i => ({
    productId: i.productId,
    name: i.name,
    model: i.model || '',
    qty: i.qty || 1,
    price: i.price || 0,
    color: i.color || '',
    strap: i.strap || '',
    size: i.size || ''
  }));
  const total = items.reduce((s, i)=> s + (i.price||0)*(i.qty||1), 0);

  // capture address snapshot
  const addrSnap = await loadAddress(user);

  await setDoc(doc(db, 'orders', orderId), {
    userId: user.uid,
    addressId,
    address: addrSnap || null,
    items,
    total,
    paymentMethod,
    status: 'Dispatch Pending',
    trackingNumber: trk,
    createdAt: serverTimestamp(),
    estimatedDelivery: new Date(Date.now() + 14*24*60*60*1000)
  });

  // decrement inventory
  for (const it of items){
    try{
      const pref = doc(db, 'products', it.productId);
      const psnap = await getDoc(pref);
      if (psnap.exists()){
        const current = psnap.data().quantity || 0;
        const newQty = Math.max(0, Number(current) - Number(it.qty||1));
        await setDoc(pref, { quantity: newQty }, { merge: true });
      }
    }catch(e){ console.warn('inventory update failed', e); }
  }

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
