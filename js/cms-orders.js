// cms-orders.js
import { db } from '../js/firebase-config.js';
import { collection, onSnapshot, doc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

const ordersTable = document.getElementById('ordersTable');

onSnapshot(collection(db, 'orders'), snap => {
  const rows = [];
  snap.forEach(s => rows.push({ id: s.id, ...s.data() }));
  renderOrders(rows);
}, err => {
  console.error('orders listen', err);
  ordersTable.innerHTML = '<tr><td colspan="5">Error loading orders</td></tr>';
});

function renderOrders(rows) {
  if (!rows.length) { ordersTable.innerHTML = '<tr><td colspan="5">No orders available</td></tr>'; return; }
  ordersTable.innerHTML = '';
  rows.forEach(o => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${o.id}</td>
      <td>${o.customerName || o.userId || 'Guest'}</td>
      <td>${o.total || 0}</td>
      <td>${o.status || 'pending'}</td>
      <td>
        <select data-id="${o.id}" class="status-select">
          <option ${o.status==='pending_payment'?'selected':''}>pending_payment</option>
          <option ${o.status==='accepted'?'selected':''}>accepted</option>
          <option ${o.status==='packed'?'selected':''}>packed</option>
          <option ${o.status==='on_the_way'?'selected':''}>on_the_way</option>
          <option ${o.status==='delivered'?'selected':''}>delivered</option>
        </select>
      </td>`;
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
