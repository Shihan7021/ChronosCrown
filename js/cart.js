// cart.js
import { db } from './firebase.init.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
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
                        <button class="btn primary" onclick="checkout()">Proceed to Checkout</button>`;
  cartList.appendChild(totalDiv);

  updateBadge();
}

// Cart operations
function updateBadge() {
  const badge = document.querySelector('.cart-badge');
  if (badge) badge.textContent = cart.reduce((sum, i)=> sum + i.qty, 0);
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

window.removeFromCart = (pid) => {
  cart = cart.filter(i => i.productId !== pid);
  saveCart();
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

// Initialize
loadCart();
