// products.js - listing, filters, pagination
import { db } from './firebase.init.js';
import { collection, query, where, getDocs, limit, orderBy, startAfter } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { formatCurrency } from './utils.js';

let currentCategory = 'all';
let pageSize = 20;

export async function loadProducts({category='all', page=1, filters={}} = {}){
  currentCategory = category;
  pageSize = Number(localStorage.getItem('pageSize') || 20);
  const container = document.querySelector('#products-grid');
  container.innerHTML = '<div>Loading...</div>';
  // Build Firestore query
  let q = collection(db, 'products');
  // In Firestore you cannot do dynamic ORs. Use simple queries for demos.
  const qSnapshot = await getDocs(q);
  const results = [];
  qSnapshot.forEach(doc=> results.push({ id: doc.id, ...doc.data() }));
  // Apply client-side filters (price, strap, color, size)
  let filtered = results.filter(p=>{
    if(category !== 'all' && p.gender && p.gender.toLowerCase() !== category.toLowerCase()) return false;
    if(filters.priceMin && p.price < filters.priceMin) return false;
    if(filters.priceMax && p.price > filters.priceMax) return false;
    if(filters.strap && p.strap !== filters.strap) return false;
    if(filters.color && p.color !== filters.color) return false;
    if(filters.size && p.size !== filters.size) return false;
    return true;
  });
  // pagination
  const startIndex = (page-1)*pageSize;
  const pageItems = filtered.slice(startIndex, startIndex+pageSize);

  container.innerHTML = '';
  const grid = document.createElement('div'); grid.className='grid';
  pageItems.forEach(prod=>{
    const card = document.createElement('div'); card.className='product-card';
    card.innerHTML = `
      <div style="display:flex; gap:12px;">
        <img src="${prod.image || '/assets/placeholder.png'}" alt="${prod.name}" style="width:120px;height:120px; border-radius:8px; object-fit:cover;">
        <div style="flex:1;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div><h3 style="margin-bottom:6px;">${prod.name}</h3><div class="meta">${prod.brand || ''}</div></div>
            <div class="price">${formatCurrency(prod.price)}</div>
          </div>
          <div class="meta">Strap: ${prod.strap || '—'} • Color: ${prod.color || '—'} • Size: ${prod.size || '—'}</div>
          <div style="margin-top:10px; display:flex; gap:6px;">
            <button class="btn" onclick="location.href='product.html?id=${prod.id}'">View</button>
            <button class="btn secondary" onclick="addToCart('${prod.id}')">Add to cart</button>
          </div>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
  container.appendChild(grid);

  // pagination controls
  const pages = Math.ceil(filtered.length / pageSize);
  const pager = document.createElement('div'); pager.style.marginTop='16px';
  pager.innerHTML = `Page ${page} of ${pages} ${page>1?`<button class="btn secondary" onclick="changePage(${page-1})">Prev</button>`:''} ${page<pages?`<button class="btn" onclick="changePage(${page+1})">Next</button>`:''}`;
  container.appendChild(pager);

  // Expose functions globally used by inline onclicks
  window.addToCart = async function(pid){
    // add minimal client-side cart; auth-update handled in cart.js
    const cart = JSON.parse(localStorage.getItem('cart')||'[]');
    cart.push({ productId: pid, qty:1 });
    localStorage.setItem('cart', JSON.stringify(cart));
    localStorage.setItem('cart_count', cart.length);
    const badge = document.querySelector('.cart-badge');
    if(badge) badge.textContent = cart.length;
    alert('Added to cart');
  };
  window.changePage = (p)=> loadProducts({category, page:p, filters});
}
