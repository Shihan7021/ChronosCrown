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
  addressDisplay.textContent = `${a.name} (${a.mobile || '-'})\n${a.line1}, ${a.city}, ${a.state || ''} ${a.zip || ''}, ${a.country}`;
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
    // Real IPG flow via backend-created session
    try {
      payNowBtn.disabled = true;
      payNowBtn.textContent = 'Redirecting to bank...';

      // Build PayHere-required context
      const addr = await loadAddress(user).catch(()=>null);
      const [firstName, ...restName] = String((addr && addr.name) || (user.displayName || 'Customer')).split(' ');
      const lastName = restName.join(' ') || 'User';
      const origin = window.location.origin;
      const returnUrl = `${origin}/thankyou.html?order=${orderId}`;
      const cancelUrl = `${origin}/checkout-payment.html?order=${orderId}`;
      const notifyUrl = `${origin}/api/ipg/notify`;

      const res = await fetch('/api/ipg/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          amount: Number(amount),
          currency: 'LKR',
          returnUrl,
          cancelUrl,
          notifyUrl,
          items: `ChronosCrown Order ${orderId}`,
          customer: {
            firstName,
            lastName,
            email: (user && user.email) || '',
            phone: (addr && addr.mobile) || '',
            address: (addr && addr.line1) || '',
            city: (addr && addr.city) || '',
            country: (addr && addr.country) || 'Sri Lanka'
          }
        })
      });

      if (!res.ok) {
        const txt = await res.text().catch(()=>'');
        throw new Error(`Failed to create payment session (${res.status}). ${txt}`);
      }
      const data = await res.json().catch(() => ({}));

      if (data && typeof data.redirectUrl === 'string' && data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }

      // Optional: if backend returns an HTML form to auto-submit (some IPGs require POST redirect)
      if (data && typeof data.formHtml === 'string' && data.formHtml) {
        const wrap = document.createElement('div');
        wrap.style.display = 'none';
        wrap.innerHTML = data.formHtml;
        document.body.appendChild(wrap);
        const f = wrap.querySelector('form');
        if (f) { f.submit(); return; }
      }

      throw new Error('Backend did not return a redirectUrl or formHtml.');
    } catch (err) {
      console.error('IPG init error', err);
      alert('Sorry, we could not reach the payment gateway. Please try again or use Cash on Delivery.');
      payNowBtn.disabled = false;
      payNowBtn.textContent = 'Pay Now';
      return;
    }
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
