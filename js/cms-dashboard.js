// cms-dashboard.js
import { db } from '../js/firebase-config.js';
import { collection, onSnapshot, query } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

const totalProductsEl = document.getElementById('totalProducts');
const totalOrdersEl = document.getElementById('totalOrders');
const totalSalesEl = document.getElementById('totalSales');
const totalUsersEl = document.getElementById('totalUsers');
const recentOrdersTbody = document.getElementById('recentOrders');

function formatCurrency(v){ return Number(v || 0).toFixed(2); }

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
  snap.forEach(d => { const o = d.data(); orders.push({ id: d.id, ...o }); totalSales += Number(o.total || 0); });
  totalOrdersEl.textContent = orders.length || 0;
  totalSalesEl.textContent = formatCurrency(totalSales);

  // recent 6 orders
  recentOrdersTbody.innerHTML = '';
  const recent = orders.slice(-6).reverse();
  if (!recent.length) recentOrdersTbody.innerHTML = '<tr><td colspan="4">No recent orders</td></tr>';
  else {
    recent.forEach(o => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${o.id}</td><td>${o.customerName || o.userId || 'guest'}</td><td>${formatCurrency(o.total)}</td><td>${o.status || 'pending'}</td>`;
      recentOrdersTbody.appendChild(tr);
    });
  }
});
