// checkout.js - address selection + payment step + order creation
import { db, auth } from './firebase.init.js';
import { collection, addDoc, setDoc, doc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { uid, addDays } from './utils.js';

document.addEventListener('DOMContentLoaded', initCheckout);

async function initCheckout(){
  // address page has id 'address-form' and button with id 'toPayment'
  const quick = new URLSearchParams(location.search).get('quick');
  const savedAddressesContainer = document.getElementById('saved-addresses');
  if(savedAddressesContainer && auth.currentUser){
    // load addresses
    const res = await fetchAddresses(); // implement actual firestore query in your env
    savedAddressesContainer.innerHTML = res.map(a=>`<div class="address-card"><input type="radio" name="addr" value="${a.id}"> ${a.line1}, ${a.city}</div>`).join('');
  }
  const toPayment = document.getElementById('toPayment');
  if(toPayment) toPayment.addEventListener('click', ()=>{
    // store chosen address in local storage for payment page
    const form = document.getElementById('address-form');
    const data = { name: form['name'].value, line1: form['line1'].value, city: form['city'].value, country: form['country'].value };
    localStorage.setItem('checkout_address', JSON.stringify(data));
    // proceed to payment
    location.href = 'checkout-payment.html' + (quick ? '?quick=1' : '');
  });

  // On payment page, when user clicks "Pay", we simulate IPG redirect
  const payBtn = document.getElementById('payNow');
  if(payBtn) payBtn.addEventListener('click', async ()=>{
    // create an order doc locally in firestore with status pending (server validation recommended)
    const orderId = uid();
    const address = JSON.parse(localStorage.getItem('checkout_address')||'{}');
    const quickCheckout = JSON.parse(localStorage.getItem('checkout_quick')||'null');
    let items = [];
    if(quickCheckout){
      items = [{ productId: quickCheckout.productId, qty: quickCheckout.qty, price: quickCheckout.price }];
    } else {
      const cart = JSON.parse(localStorage.getItem('cart')||'[]');
      items = cart.map(c=> ({ productId: c.productId, qty: c.qty, price: c.price || 0 }) );
    }
    const total = items.reduce((s,i)=> s + (i.price||0)*i.qty, 0);
    // in production, create order via secure cloud function to prevent price tampering
    const orderDoc = {
      orderId, items, total, address, status: 'pending_payment', createdAt: new Date().toISOString(),
      estimatedDelivery: addDays(new Date(), 14)
    };
    // save to Firestore
    const userId = auth.currentUser?.uid || 'guest';
    await setDoc(doc(db, 'orders', orderId), { ...orderDoc, userId });
    // simulate IPG - in real case redirect to IPG and on return validate
    simulateIPG(orderId, total);
  });
}

function simulateIPG(orderId, amount){
  // Simulate an external payment gateway redirect and callback (for the demo)
  // In real integration, redirect to gateway, which will return transaction id & signature -> verify server-side.
  const tracking = orderId;
  // set order as paid (in real app, do server-side verification)
  setTimeout(()=>{
    // update order status to paid (for demo)
    fetch('/__order_paid_simulator__?orderId='+orderId);
    // redirect to thank you with params
    location.href = `thankyou.html?order=${orderId}&amt=${amount}&trk=${tracking}`;
  }, 1200);
}
