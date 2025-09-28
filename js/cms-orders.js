// cms-orders.js
import { db } from '../js/firebase-config.js';
import { collection, onSnapshot, doc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

const ordersTable = document.getElementById('ordersTable');

onSnapshot(collection(db, 'orders'), snap => {
  const rows = [];
  snap.forEach(s => rows.push({ id: s.id, ...s.data() }));
  // sort newest first
  rows.sort((a,b)=> (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0));
  renderOrders(rows);
}, err => {
  console.error('orders listen', err);
  ordersTable.innerHTML = '<tr><td colspan="5">Error loading orders</td></tr>';
});

function renderOrders(rows) {
  if (!rows.length) { ordersTable.innerHTML = '<tr><td colspan="7">No orders available</td></tr>'; return; }
  ordersTable.innerHTML = '';
  rows.forEach(o => {
    const tr = document.createElement('tr');
    const addr = o.address ? `${o.address.name}, ${o.address.line1}, ${o.address.city}, ${o.address.state||''} ${o.address.zip||''}, ${o.address.country}` : '-';
    const itemsHtml = Array.isArray(o.items) ? o.items.map(i=>`${i.name} (${i.model||'-'}) × ${i.qty} — ${i.color||'-'}/${i.strap||'-'}/${i.size||'-'}`).join('<br>') : '-';
    tr.innerHTML = `
      <td>${o.id}</td>
      <td>${o.customerName || o.userId || 'Guest'}</td>
      <td>${(o.total||0).toFixed ? o.total.toFixed(2) : Number(o.total||0).toFixed(2)}</td>
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
