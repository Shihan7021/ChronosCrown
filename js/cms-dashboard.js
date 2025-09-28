// cms-dashboard.js
import { auth, db } from './firebase-config.js';
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

const totalProductsEl = document.getElementById('totalProducts');
const totalOrdersEl = document.getElementById('totalOrders');
const totalSalesEl = document.getElementById('totalSales');
const totalUsersEl = document.getElementById('totalUsers');
const recentOrdersTbody = document.getElementById('recentOrders');

function formatCurrency(v){ return Number(v || 0).toFixed(2); }

auth.onAuthStateChanged(user => {
  if (!user) return;
  // products live count
  onSnapshot(collection(db, 'products'), snap => {
    totalProductsEl.textContent = snap.size || 0;
  });

  // users live count (all user docs)
  onSnapshot(collection(db, 'users'), snap => {
    totalUsersEl.textContent = snap.size || 0;
  });

  // orders live — compute counts and sales
  onSnapshot(collection(db, 'orders'), snap => {
    const orders = [];
    let totalSales = 0;
    snap.forEach(d => {
      const o = d.data();
      orders.push({ id: d.id, ...o });
      if (typeof o.total === 'number') totalSales += o.total;
      else if (Array.isArray(o.items)) totalSales += o.items.reduce((s,i)=> s + (Number(i.price)||0)*(Number(i.qty)||1), 0);
      else if (Array.isArray(o.cart)) totalSales += o.cart.reduce((s,i)=> s + (Number(i.price)||0)*(Number(i.qty)||1), 0);
    });
    totalOrdersEl.textContent = orders.length || 0;
    totalSalesEl.textContent = formatCurrency(totalSales);

    // recent 6 orders table
    recentOrdersTbody.innerHTML = '';
    const recent = orders.slice(-6).reverse();
    if (!recent.length) recentOrdersTbody.innerHTML = '<tr><td colspan="4">No recent orders</td></tr>';
    else {
      recent.forEach(o => {
        const total = typeof o.total === 'number' ? o.total : (Array.isArray(o.items) ? o.items.reduce((s,i)=> s + (Number(i.price)||0)*(Number(i.qty)||1),0) : 0);
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${o.id}</td><td>${o.customerName || o.userId || 'guest'}</td><td>${formatCurrency(total)}</td><td>${o.status || 'Dispatch Pending'}</td>`;
        recentOrdersTbody.appendChild(tr);
      });
    }
  }, err => {
    console.error('orders listen', err);
  });
});
