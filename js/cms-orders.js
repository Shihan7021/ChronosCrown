// cms-orders.js
import { auth, db } from './firebase-config.js';
import { collection, onSnapshot, doc, updateDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

const ordersTable = document.getElementById('ordersTable');

// Wait for auth so Firestore rules get request.auth
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    ordersTable.innerHTML = '<tr><td colspan="7">Please login to view orders.</td></tr>';
    return;
  }
  // Initial load to avoid blank screen in case snapshot is delayed
  (async function initialLoad(){
    try{
      const snap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt','desc')));
      const rows = [];
      snap.forEach(s => rows.push({ id: s.id, ...s.data() }));
      renderOrders(rows);
    }catch(e){ console.error('initial orders load', e); ordersTable.innerHTML = '<tr><td colspan="7">Insufficient permissions to read orders.</td></tr>'; }
  })();

  // Live updates
  onSnapshot(query(collection(db, 'orders'), orderBy('createdAt','desc')),
    snap => {
      const rows = [];
      snap.forEach(s => rows.push({ id: s.id, ...s.data() }));
      renderOrders(rows);
    },
    err => {
      console.error('orders listen', err);
      ordersTable.innerHTML = '<tr><td colspan="7">Insufficient permissions to read orders.</td></tr>';
    }
  );
});

function renderOrders(rows) {
  if (!rows.length) { ordersTable.innerHTML = '<tr><td colspan="7">No orders available</td></tr>'; return; }
  ordersTable.innerHTML = '';
  rows.forEach(o => {
    const tr = document.createElement('tr');
    const addr = o.address ? `${o.address.name}, ${o.address.line1}, ${o.address.city}, ${o.address.state||''} ${o.address.zip||''}, ${o.address.country}` : '-';
    const itemsArr = Array.isArray(o.items) ? o.items : (Array.isArray(o.cart) ? o.cart.map(c=>({ name:c.name, model:c.model, qty:c.qty, color:c.color, strap:c.strap, size:c.size, price:c.price })) : []);
    const itemsHtml = itemsArr.length ? itemsArr.map(i=>`${i.name || i.productId || '-'} (${i.model||'-'}) × ${i.qty||1} — ${i.color||'-'}/${i.strap||'-'}/${i.size||'-'}`).join('<br>') : '-';
    const displayTotal = typeof o.total === 'number' ? o.total : itemsArr.reduce((s,i)=> s + (Number(i.price)||0)*(Number(i.qty)||1), 0);
    tr.innerHTML = `
      <td>${o.id}</td>
      <td>${o.customerName || o.userId || 'Guest'}</td>
      <td>${displayTotal.toFixed(2)}</td>
      <td>
        <select data-id="${o.id}" class="status-select">
          <option ${o.status==='Dispatch Pending'?'selected':''}>Dispatch Pending</option>
          <option ${o.status==='Packed'?'selected':''}>Packed</option>
          <option ${o.status==='On The Way'?'selected':''}>On The Way</option>
          <option ${o.status==='Delivered'?'selected':''}>Delivered</option>
          <option ${o.status==='Cancelled'?'selected':''}>Cancelled</option>
        </select>
      </td>
      <td>${o.trackingNumber || '-'}</td>
      <td>${addr}</td>
      <td>${itemsHtml}</td>`;
    ordersTable.appendChild(tr);
  });

  // attach change listeners
  ordersTable.querySelectorAll('.status-select').forEach(sel => sel.addEventListener('change', async (e) => {
    const id = e.target.dataset.id;
    const newStatus = e.target.value;
    try {
      await updateDoc(doc(db, 'orders', id), { status: newStatus, updatedAt: new Date().toISOString() });
      // dashboard listens to orders and will auto-update counts
      alert('Order updated');
    } catch (err) {
      console.error(err);
      alert('Failed to update order: ' + err.message);
    }
  }));
}
