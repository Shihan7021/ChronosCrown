// product-details.js
import { db, auth } from './firebase.init.js';
import { doc, getDoc, updateDoc, collection, addDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { formatCurrency } from './utils.js';

const params = new URLSearchParams(window.location.search);
const id = params.get('id');

async function init(){
  if(!id) return document.body.innerHTML = '<h2>Product not found</h2>';
  const docSnap = await getDoc(doc(db, 'products', id));
  if(!docSnap.exists()) return document.body.innerHTML = '<h2>Product not found</h2>';
  const p = { id: docSnap.id, ...docSnap.data() };
  render(p);
}

function render(p){
  document.title = p.name + ' - ChronosCrown';
  const container = document.querySelector('#product-detail');
  container.innerHTML = `
    <div style="display:flex; gap:20px; align-items:flex-start;">
      <div style="min-width:420px;">
        <div style="position:relative;">
          <img src="${p.image||'/assets/placeholder.png'}" style="width:420px;height:420px;object-fit:cover;border-radius:12px;">
          ${p.stock<=0?`<div style="position:absolute; left:12px; top:12px; background:rgba(0,0,0,0.6); color:white; padding:8px 12px; border-radius:6px; font-weight:800;">OUT OF STOCK</div>`:''}
        </div>
      </div>
      <div style="flex:1;">
        <h2>${p.name}</h2>
        <div class="meta">${p.brand || ''} • ${p.model || ''}</div>
        <div style="margin-top:12px;" class="price">${formatCurrency(p.price)}</div>
        <p style="margin-top:12px;">${p.description || 'No description provided.'}</p>
        <div style="margin-top:14px; display:flex; gap:8px;">
          <button class="btn" id="buyNow">Buy Now</button>
          <button class="btn secondary" id="addCart">Add to Cart</button>
          <button class="btn secondary" id="favBtn">♡ Favorite</button>
        </div>
        <div style="margin-top:12px;">
          <strong>Accepted payments:</strong>
          <div style="margin-top:8px;">
            <img src="/assets/payment-icons/visa.svg" alt="visa" style="height:28px;margin-right:8px;">
            <img src="/assets/payment-icons/mastercard.svg" alt="mc" style="height:28px;margin-right:8px;">
            <img src="/assets/payment-icons/pay.svg" alt="pay" style="height:28px;">
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('buyNow').addEventListener('click', ()=>{
    if(p.stock<=0){ alert('Sorry this product is out of stock.'); return; }
    // store quick checkout payload
    localStorage.setItem('checkout_quick', JSON.stringify({ productId:p.id, qty:1, price:p.price }));
    location.href = 'checkout-address.html?quick=1';
  });

  document.getElementById('addCart').addEventListener('click', ()=>{
    // reuse simple cart
    const cart = JSON.parse(localStorage.getItem('cart')||'[]');
    cart.push({ productId: p.id, qty:1 });
    localStorage.setItem('cart', JSON.stringify(cart));
    localStorage.setItem('cart_count', cart.length);
    const badge = document.querySelector('.cart-badge');
    if(badge) badge.textContent = cart.length;
    // If logged in, add to user's cart collection
    if(auth.currentUser){
      const userCartRef = collection(db, 'users', auth.currentUser.uid, 'cart');
      addDoc(userCartRef, { productId: p.id, qty:1, addedAt: new Date().toISOString() });
    }
    alert('Added to cart');
  });

  document.getElementById('favBtn').addEventListener('click', async ()=>{
    if(!auth.currentUser){ alert('Log in to save favorites'); return; }
    const favRef = doc(db, 'users', auth.currentUser.uid, 'favorites', p.id);
    await setDoc(favRef, { productId: p.id, addedAt: new Date().toISOString() });
    alert('Saved to favorites');
  });
}

init();
