import { db } from './firebase.init.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Get product ID from URL
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');

// DOM elements
const imagesCarousel = document.getElementById("imagesCarousel");
const productName = document.getElementById("productName");
const productDescription = document.getElementById("productDescription");
const productPrice = document.getElementById("productPrice");
const productStrap = document.getElementById("productStrap");
const productColor = document.getElementById("productColor");
const productSize = document.getElementById("productSize");
const productStock = document.getElementById("productStock");
const addToCartBtn = document.getElementById("addToCartBtn");
const buyNowBtn = document.getElementById("buyNowBtn");

// Load product data
async function loadProductDetails() {
  try {
    const docRef = doc(db, "products", productId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      alert("Product not found");
      return;
    }

    const product = docSnap.data();

    // Set basic info
    productName.textContent = product.name;
    productDescription.textContent = product.description || '';
    productPrice.textContent = product.price;
    productStock.textContent = product.quantity > 0 ? "In Stock" : "Out of Stock";

    // Disable buttons if out of stock
    if (product.quantity <= 0) {
      addToCartBtn.disabled = true;
      buyNowBtn.disabled = true;
    }

    // Build images carousel
    imagesCarousel.innerHTML = '';
    if (product.images && product.images.length) {
      product.images.forEach((img, idx) => {
        const imgEl = document.createElement('img');
        imgEl.src = img;
        imgEl.alt = `${product.name} image ${idx+1}`;
        imgEl.style.width = '200px';
        imgEl.style.height = '200px';
        imgEl.style.objectFit = 'cover';
        imgEl.style.marginRight = '8px';
        imagesCarousel.appendChild(imgEl);
      });
    } else {
      imagesCarousel.innerHTML = '<img src="assets/no-image.png" alt="No image available" style="width:200px;height:200px;">';
    }

    // Populate dropdowns
    populateSelect(productStrap, product.straps || []);
    populateSelect(productColor, product.colors || []);
    populateSelect(productSize, product.sizes || []);

    // Add to cart / Buy now
    addToCartBtn.onclick = () => addToCart(productId);
    buyNowBtn.onclick = () => buyNow(productId);

  } catch (err) {
    console.error("Error loading product:", err);
    alert("Failed to load product details.");
  }
}

// Populate select element
function populateSelect(selectEl, optionsArray) {
  selectEl.innerHTML = '';
  optionsArray.forEach(opt => {
    const option = document.createElement('option');
    option.value = opt;
    option.textContent = opt;
    selectEl.appendChild(option);
  });
}

// Cart functions
function addToCart(pid) {
  const cart = JSON.parse(localStorage.getItem('cart')||'[]');
  
  const selectedOptions = {
    strap: productStrap.value,
    color: productColor.value,
    size: productSize.value
  };

  const existing = cart.find(item =>
    item.productId === pid &&
    item.strap === selectedOptions.strap &&
    item.color === selectedOptions.color &&
    item.size === selectedOptions.size
  );

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ productId: pid, qty: 1, ...selectedOptions });
  }

  localStorage.setItem('cart', JSON.stringify(cart));
  localStorage.setItem('cart_count', cart.length);
  const badge = document.querySelector('.cart-badge');
  if(badge) badge.textContent = cart.length;
  alert('Added to cart');
}

function buyNow(pid) {
  addToCart(pid); // ensure it's in cart
  window.location.href = 'checkout-address.html';
}

// Initialize
loadProductDetails();
