// cart.js
import { db } from './firebase.init.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { formatCurrency } from './utils.js';

const cartList = document.getElementById("cart-list");

// Load cart from localStorage
let cart = JSON.parse(localStorage.getItem('cart') || '[]');

async function loadCart() {
  cartList.innerHTML = '';

  if (cart.length === 0) {
    cartList.innerHTML = '<p>Your cart is empty.</p>';
    updateBadge();
    return;
  }

  let total = 0;

  for (const item of cart) {
    const docRef = doc(db, 'products', item.productId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) continue;

    const product = docSnap.data();

    // Calculate total
    total += product.price * item.qty;

    // Display product in cart
    const cartItem = document.createElement('div');
    cartItem.className = 'cart-item';
    cartItem.innerHTML = `
      <img src="${(product.images && product.images.length) ? product.images[0] : '/assets/placeholder.png'}" alt="${product.name}" style="width:100px;height:100px;object-fit:cover;">
      <div class="cart-info">
        <h3>${product.name}</h3>
        <p>${product.description ? product.description.substring(0,50)+'...' : ''}</p>
        <p>Price: ${formatCurrency(product.price)}</p>
        <p>Qty: ${item.qty}</p>
        <div class="cart-actions">
          <button class="btn" onclick="increaseQty('${item.productId}')">+</button>
          <button class="btn secondary" onclick="decreaseQty('${item.productId}')">-</button>
          <button class="btn danger" onclick="removeFromCart('${item.productId}')">Remove</button>
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

  updateBadge();
}

// Cart operations
function updateBadge() {
  const count = cart.reduce((sum, i)=> sum + i.qty, 0);
  localStorage.setItem('cart_count', String(count));
  const badge = document.querySelector('.cart-badge');
  if (badge) badge.textContent = count;
}

window.increaseQty = (pid) => {
  const item = cart.find(i => i.productId === pid);
  if(item) item.qty +=1;
  saveCart();
};

window.decreaseQty = (pid) => {
  const item = cart.find(i => i.productId === pid);
  if(item && item.qty >1) item.qty -=1;
  saveCart();
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

window.removeFromCart = (pid) => {
  confirmModal.open(()=>{
    cart = cart.filter(i => i.productId !== pid);
    saveCart();
  });
};

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
  loadCart();
}

// Proceed to checkout
function checkout() {
  if(cart.length === 0) {
    alert('Cart is empty.');
    return;
  }
  window.location.href = 'checkout-address.html';
}
// Expose for inline onclick
window.checkout = checkout;

// Initialize
loadCart();
