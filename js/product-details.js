// js/product-details.js - Loads and displays details for a single product.
import { db } from './firebase.init.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// --- DOM ELEMENTS ---
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

// --- MAIN FUNCTION ---

async function loadProductDetails() {
    // Get product ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        document.querySelector('.product-details').innerHTML = '<h2>Product not found.</h2><p>Please select a product from our collection.</p>';
        return;
    }

    try {
        const docRef = doc(db, "products", productId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            alert("Product not found");
            return;
        }

        const product = docSnap.data();

        // Populate product info
        document.title = `${product.name} - ChronosCrown`;
        productName.textContent = product.name;
        productDescription.textContent = product.description || '';
        productPrice.textContent = product.price;
        productStock.textContent = product.quantity > 0 ? "In Stock" : "Out of Stock";
        productStock.className = product.quantity > 0 ? 'in-stock' : 'out-of-stock';

        // Render attributes summary
        const info = document.getElementById('product-detail-info');
        const attrs = document.createElement('div');
        attrs.className = 'meta';
        attrs.style.margin = '8px 0';
        attrs.innerHTML = `Type: <strong>${product.type || '-'}</strong> • Strap: <strong>${product.strap || '-'}</strong> • Color: <strong>${product.color || '-'}</strong> • Size: <strong>${product.size || '-'}</strong>`;
        info.insertBefore(attrs, info.querySelector('.payments'));


        // Disable buttons if out of stock
        if (product.quantity <= 0) {
            addToCartBtn.disabled = true;
            buyNowBtn.disabled = true;
        }

        // Build images carousel
        renderImages(product);

        // Populate dropdowns
        populateSelect(productStrap, product.straps || []);
        populateSelect(productColor, product.colors || []);
        populateSelect(productSize, product.sizes || []);

        // Attach event listeners
        addToCartBtn.onclick = () => addToCart(productId, product);
        buyNowBtn.onclick = () => buyNow(productId, product);

    } catch (err) {
        console.error("Error loading product:", err);
        alert("Failed to load product details.");
    }
}


// --- RENDER & UTILITY HELPERS ---

function renderImages(product) {
    imagesCarousel.innerHTML = '';
    if (product.images && product.images.length) {
        product.images.forEach((img, idx) => {
            const imgEl = document.createElement('img');
            imgEl.src = img;
            imgEl.alt = `${product.name} image ${idx + 1}`;
            imgEl.onerror = "this.onerror=null;this.src='https://placehold.co/200x200/EFEFEF/A9A9A9?text=Image+Missing';"
            imagesCarousel.appendChild(imgEl);
        });
    } else {
        imagesCarousel.innerHTML = `<img src="https://placehold.co/200x200/EFEFEF/A9A9A9?text=No+Image" alt="No image available">`;
    }
}

function populateSelect(selectEl, optionsArray) {
    if (!optionsArray || optionsArray.length === 0) {
        selectEl.parentElement.style.display = 'none'; // Hide label if no options
        return;
    }
    selectEl.innerHTML = '';
    optionsArray.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        selectEl.appendChild(option);
    });
}

// --- CART FUNCTIONS ---

function addToCart(pid, product) {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const selectedOptions = {
        strap: productStrap.value,
        color: productColor.value,
        size: productSize.value
    };

    // Find if an identical item (with same options) already exists
    const existingItem = cart.find(item =>
        item.productId === pid &&
        item.strap === selectedOptions.strap &&
        item.color === selectedOptions.color &&
        item.size === selectedOptions.size
    );

    if (existingItem) {
        existingItem.qty += 1;
    } else {
        cart.push({ 
            productId: pid, 
            name: product.name,
            price: product.price,
            image: (product.images && product.images.length) ? product.images[0] : '',
            qty: 1, 
            ...selectedOptions 
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge(cart.length);
    alert('Added to cart');
}

function buyNow(pid, product) {
    addToCart(pid, product); // Ensure item is in the cart
    window.location.href = 'checkout-address.html'; // Go directly to address selection
}

function updateCartBadge(count) {
    localStorage.setItem('cart_count', count);
    const badge = document.querySelector('.cart-badge');
    if (badge) badge.textContent = count;
}


// --- INITIALIZE ---
document.addEventListener('DOMContentLoaded', loadProductDetails);
