// track-order.js
import { db } from './firebase.init.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { addDays } from './utils.js';

const trackBtn = document.getElementById('trackBtn');
const trackInput = document.getElementById('trk');
const trackResult = document.getElementById('trackResult');

async function fetchOrderStatus(trackingNumber) {
  if (!trackingNumber) return alert('Please enter a tracking number.');

  try {
    // Query Firestore orders collection by trackingNumber
    const q = query(collection(db, 'orders'), where('trackingNumber', '==', trackingNumber));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      trackResult.innerHTML = `<div>No order found for tracking number <strong>${trackingNumber}</strong>.</div>`;
      return;
    }

    const orderDoc = snapshot.docs[0];
    const order = orderDoc.data();

    const estimatedDelivery = addDays(order.dateOrdered.toDate(), 14);

    trackResult.innerHTML = `
      <div style="display:flex; gap:16px; align-items:center; margin-top:12px;">
        <img src="${order.productImage || '/assets/placeholder.png'}" alt="${order.productName}" 
             style="width:120px; height:120px; object-fit:cover; border-radius:8px;">
        <div>
          <div>Tracking #: <strong>${order.trackingNumber}</strong></div>
          <div>Product: <strong>${order.productName}</strong></div>
          <div>Status: <strong>${order.status}</strong></div>
          <div>Estimated Delivery: <strong>${estimatedDelivery.toISOString().split('T')[0]}</strong></div>
          <div>Amount Paid: <strong>$${Number(order.amount).toFixed(2)}</strong></div>
        </div>
      </div>
    `;

  } catch (err) {
    console.error(err);
    trackResult.innerHTML = `<div>Error fetching order. Please try again later.</div>`;
  }
}

trackBtn.addEventListener('click', () => fetchOrderStatus(trackInput.value));

// Auto-load if query param exists
const queryTrk = new URLSearchParams(window.location.search).get('trk');
if (queryTrk) {
  trackInput.value = queryTrk;
  fetchOrderStatus(queryTrk);
}
