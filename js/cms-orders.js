// cms-orders.js
import { auth, db } from './firebase-config.js';
import { collection, onSnapshot, doc, updateDoc, getDocs, query, orderBy, deleteDoc, getDoc, increment } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

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

let _ordersIndex = {};
function money(v){ return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(v||0)); }

function renderOrders(rows) {
  _ordersIndex = {};
  if (!rows.length) { ordersTable.innerHTML = '<tr><td colspan="7">No orders available</td></tr>'; return; }
  ordersTable.innerHTML = '';
  rows.forEach(o => {
  _ordersIndex[o.id] = o;
    const tr = document.createElement('tr');
    const addr = o.address ? `${o.address.name}, ${o.address.line1}, ${o.address.city}, ${o.address.state||''} ${o.address.zip||''}, ${o.address.country}` : '-';
    const itemsArr = Array.isArray(o.items) ? o.items : (Array.isArray(o.cart) ? o.cart.map(c=>({ name:c.name, model:c.model, qty:c.qty, color:c.color, strap:c.strap, size:c.size, price:c.price })) : []);
    const itemsHtml = itemsArr.length ? itemsArr.map(i=>`${i.name || i.productId || '-'} (${i.model||'-'}) × ${i.qty||1} — ${i.color||'-'}/${i.strap||'-'}/${i.size||'-'}`).join('<br>') : '-';
    const displayTotal = typeof o.total === 'number' ? o.total : itemsArr.reduce((s,i)=> s + (Number(i.price)||0)*(Number(i.qty)||1), 0);
    tr.innerHTML = `
      <td>${o.id}</td>
      <td>${o.customerName || o.userId || 'Guest'}</td>
      <td>${money(displayTotal)}</td>
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
      <td>${itemsHtml}
        <div style="margin-top:6px;">
          <button class="btn small" data-print="${o.id}">Print address</button>
        </div>
      </td>
      <td>
        <button class="btn btn-danger small" data-del="${o.id}">Delete</button>
      </td>`;
    ordersTable.appendChild(tr);
  });

  // attach change listeners
  ordersTable.querySelectorAll('.status-select').forEach(sel => sel.addEventListener('change', async (e) => {
    const id = e.target.dataset.id;
    const newStatus = e.target.value;
    try {
      await updateDoc(doc(db, 'orders', id), { status: newStatus, updatedAt: new Date().toISOString() });
      alert('Order updated');
    } catch (err) {
      console.error(err);
      alert('Failed to update order: ' + err.message);
    }
  }));

  // attach print handlers
  ordersTable.querySelectorAll('[data-print]').forEach(btn => btn.addEventListener('click', (e)=>{
    const id = e.currentTarget.getAttribute('data-print');
    const o = _ordersIndex[id];
    if (!o || !o.address) { alert('No address found on order.'); return; }
    const addr = o.address;
    const win = window.open('', 'PRINT', 'height=700,width=560');
    const html = `<!doctype html><html><head><title>Shipping Label - ${id}</title>
      <style>
        body{ font-family: Arial, sans-serif; padding:20px; }
        .label{ border:1px solid #ddd; border-radius:8px; padding:16px; max-width:480px; }
        .row{ display:flex; justify-content:space-between; }
        .box{ width:48%; border:1px dashed #bbb; border-radius:6px; padding:10px; min-height:120px; }
        .box h4{ margin:0 0 8px; font-size:14px; text-transform:uppercase; letter-spacing:0.5px; color:#334155; }
        .company{ font-weight:700; }
      </style></head><body>
      <div class="label">
        <div class="row">
          <div class="box">
            <h4>From</h4>
            <div class="company">ChronosCrown</div>
          </div>
          <div class="box">
            <h4>To</h4>
            <div><strong>${addr.name}</strong></div>
            <div>${addr.line1}</div>
            <div>${addr.city}, ${addr.state || ''} ${addr.zip || ''}</div>
            <div>${addr.country}</div>
            <div>${addr.mobile ? 'Mobile: ' + addr.mobile : ''}</div>
          </div>
        </div>
      </div>
      <script>window.print(); setTimeout(()=>window.close(), 300);</script>
    </body></html>`;
    win.document.open();
    win.document.write(html);
    win.document.close();
  }));

  // attach delete handlers
  ordersTable.querySelectorAll('[data-del]').forEach(btn => btn.addEventListener('click', async (e) => {
    const id = e.currentTarget.getAttribute('data-del');
    const order = _ordersIndex[id];
    if (!order) { alert('Order not found'); return; }

    const confirmed = confirm('Delete this order? This will restore product stock quantities.');
    if (!confirmed) return;

    // Build items list from order
    const itemsArr = Array.isArray(order.items) ? order.items : (Array.isArray(order.cart) ? order.cart.map(c=>({ productId:c.productId, qty:c.qty })) : []);

    try {
      // Restore stock quantities (atomic increments)
      for (const it of itemsArr) {
        if (!it.productId) continue;
        try {
          await updateDoc(doc(db, 'products', it.productId), { quantity: increment(Number(it.qty)||1) });
        } catch (invErr) {
          // If product doc missing, skip gracefully
          console.warn('Inventory restore failed for', it.productId, invErr);
        }
      }
      // Delete order
      await deleteDoc(doc(db, 'orders', id));
      alert('Order deleted and stock restored.');
      // Live snapshots on dashboard/products/financials/sales will update automatically.
    } catch (err) {
      console.error('Delete order failed', err);
      alert('Failed to delete order: ' + (err.message || err));
    }
  }));
}
