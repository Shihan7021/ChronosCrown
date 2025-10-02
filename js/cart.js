// cart.js
import { auth, db } from './firebase.init.js';
import { doc, getDoc, collection, getDocs, updateDoc, setDoc, deleteDoc, increment } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { formatCurrency } from './utils.js';

const cartList = document.getElementById("cart-list");

async function ensureFreshToken(){
  try { if (auth.currentUser) await auth.currentUser.getIdToken(true); } catch(e) {}
}

async function loadCart() {
  cartList.innerHTML = '';

  const user = auth.currentUser;
  await ensureFreshToken();
  if (!user) {
    cartList.innerHTML = '<p>Please sign in to view your cart.</p>';
    setBadge(0);
    return;
  }

  // Fetch cart items from Firestore: carts/{uid}/items
  await ensureFreshToken();
  const itemsSnap = await getDocs(collection(db, 'carts', user.uid, 'items'));
  if (itemsSnap.empty) {
    cartList.innerHTML = '<p>Your cart is empty.</p>';
    setBadge(0);
    return;
  }

  let total = 0;
  const items = [];
  itemsSnap.forEach(d => items.push({ id: d.id, ...d.data() }));

  for (const item of items) {
    const docRef = doc(db, 'products', item.productId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) continue;

    const product = docSnap.data();
    const qty = Number(item.qty)||0;

    // Calculate total
    total += Number(product.price||0) * qty;

    // Display product in cart
    const cartItem = document.createElement('div');
    cartItem.className = 'cart-item';
    cartItem.innerHTML = `
      <img src="${(product.images && product.images.length) ? product.images[0] : '/assets/placeholder.png'}" alt="${product.name}" style="width:100px;height:100px;object-fit:cover;">
      <div class="cart-info">
        <h3>${product.name}</h3>
        <p>${product.description ? product.description.substring(0,50)+'...' : ''}</p>
        <p>Price: ${formatCurrency(product.price)}</p>
        <p>Qty: ${qty}</p>
        <div class="cart-actions">
          <button class="btn" onclick="increaseQty('${item.id}')">+</button>
          <button class="btn secondary" onclick="decreaseQty('${item.id}')">-</button>
          <button class="btn danger" onclick="removeFromCart('${item.id}')">Remove</button>
        </div>
      </div>
    `;
    cartList.appendChild(cartItem);
  }

  const totalDiv = document.createElement('div');
  totalDiv.className = 'cart-total';
  totalDiv.innerHTML = `<h3>Total: ${formatCurrency(total)}</h3>
                        <button class="btn primary" id="proceedCheckoutBtn" type="button">Proceed to Checkout</button>`;
  cartList.appendChild(totalDiv);

  // Attach click handler without relying on inline onclick
  const proceedBtn = document.getElementById('proceedCheckoutBtn');
  if (proceedBtn) {
    proceedBtn.addEventListener('click', checkout);
  }

  // Update badge from DB
  await refreshBadgeFromDb(user.uid);
}

function setBadge(count){
  localStorage.setItem('cart_count', String(count));
  const badge = document.querySelector('.cart-badge');
  if (badge) badge.textContent = count;
}

async function refreshBadgeFromDb(uid){
  const snap = await getDocs(collection(db, 'carts', uid, 'items'));
  let count = 0;
  snap.forEach(d => { count += Number(d.data().qty)||0; });
  setBadge(count);
}

// Cart operations mapped to Firestore
window.increaseQty = async (itemId) => {
  const user = auth.currentUser; if (!user) return;
  await ensureFreshToken();
  const ref = doc(db, 'carts', user.uid, 'items', itemId);
  await setDoc(ref, { qty: increment(1), updatedAt: new Date().toISOString() }, { merge: true });
  await loadCart();
};

window.decreaseQty = async (itemId) => {
  const user = auth.currentUser; if (!user) return;
  await ensureFreshToken();
  const ref = doc(db, 'carts', user.uid, 'items', itemId);
  // Fetch current qty to decide if we delete
  const cur = await getDoc(ref);
  const q = cur.exists() ? Number(cur.data().qty)||0 : 0;
  if (q <= 1) {
    await deleteDoc(ref);
  } else {
    await updateDoc(ref, { qty: increment(-1), updatedAt: new Date().toISOString() });
  }
  await loadCart();
};

const confirmModal = {
  el: document.getElementById('confirmModal'),
  ok: document.getElementById('confirmOk'),
  cancel: document.getElementById('confirmCancel'),
  open(onConfirm){
    this.el.classList.remove('hidden');
    const close = ()=> this.el.classList.add('hidden');
    const onOk = ()=>{ onConfirm(); cleanup(); };
    const onCancel = ()=> cleanup();
    const cleanup = ()=>{
      this.ok.removeEventListener('click', onOk);
      this.cancel.removeEventListener('click', onCancel);
      close();
    };
    this.ok.addEventListener('click', onOk);
    this.cancel.addEventListener('click', onCancel);
  }
};

window.removeFromCart = async (itemId) => {
  confirmModal.open(async ()=>{
    const user = auth.currentUser; if (!user) return;
    await ensureFreshToken();
    await deleteDoc(doc(db, 'carts', user.uid, 'items', itemId));
    await loadCart();
  });
};

// Proceed to checkout requires non-empty cart
function checkout() {
  const count = Number(localStorage.getItem('cart_count')||'0');
  if(count === 0) {
    alert('Cart is empty.');
    return;
  }
  window.location.href = 'checkout-address.html';
}
// Expose for inline onclick
window.checkout = checkout;

// Initialize after auth ready
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
onAuthStateChanged(auth, async (user)=>{
  await loadCart();
});
