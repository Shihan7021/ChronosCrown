// cart.js - shows cart and writes to DB if logged
import { db, auth } from './firebase.init.js';
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { formatCurrency } from './utils.js';

document.addEventListener('DOMContentLoaded', ()=> renderCart());

function renderCart(){
  const cart = JSON.parse(localStorage.getItem('cart')||'[]');
  const container = document.querySelector('#cart-list');
  if(!container) return;
  if(cart.length===0) { container.innerHTML = '<div>Your cart is empty</div>'; return; }
  container.innerHTML = '';
  cart.forEach(async (item, idx)=>{
    // for demo, fetch product details quickly via Firestore
    const pSnap = await (await fetchProduct(item.productId));
    const price = pSnap.price || 0;
    const row = document.createElement('div'); row.className='product-card';
    row.innerHTML = `<div style="display:flex; gap:12px;"><img src="${pSnap.image||'/assets/placeholder.png'}" style="width:120px;height:120px;object-fit:cover;border-radius:8px;">
      <div style="flex:1;">
        <h4>${pSnap.name}</h4>
        <div class="meta">${pSnap.brand || ''}</div>
        <div style="margin-top:6px;">${formatCurrency(price)}</div>
      </div>
      <div style="display:flex; flex-direction:column; gap:6px; align-items:flex-end;">
        <button class="btn" onclick="gotoCheckout()">Checkout</button>
      </div>
    </div>`;
    container.appendChild(row);
  });
}

async function fetchProduct(id){
  const res = await fetch('/__product_proxy__?id='+id); // placeholder - users should replace with client fetch or include getDoc call
  try{
    const json = await res.json();
    return json;
  }catch(e){
    return { name:'Product', price:0, image:'/assets/placeholder.png' };
  }
}

window.gotoCheckout = function(){
  window.location.href = 'checkout-address.html';
}
