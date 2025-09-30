// js/product-details.js - Loads and displays details for a single product.
import { db } from './firebase.init.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { formatCurrency } from './utils.js';

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

// Buy Now confirmation modal elements
const buyConfirmModalEl = document.getElementById('buyConfirmModal');
const buyConfirmCheckoutBtn = document.getElementById('buyConfirmCheckout');
const buyConfirmShopMoreBtn = document.getElementById('buyConfirmShopMore');

// Added to Cart message modal
const addedCartModalEl = document.getElementById('addedCartModal');
function showAddedModal(){
    if(!addedCartModalEl) return;
    addedCartModalEl.classList.remove('hidden');
    setTimeout(()=> addedCartModalEl.classList.add('hidden'), 1200);
}

const buyConfirm = {
    el: buyConfirmModalEl,
    checkout: buyConfirmCheckoutBtn,
    shop: buyConfirmShopMoreBtn,
    open(onCheckout, onShopMore) {
        if (!this.el || !this.checkout || !this.shop) {
            // Fallback: go straight to cart if modal isn't present
            onCheckout();
            return;
        }
        this.el.classList.remove('hidden');
        const close = () => this.el.classList.add('hidden');
        const onOk = () => { onCheckout(); cleanup(); };
        const onShop = () => { onShopMore(); cleanup(); };
        const cleanup = () => {
            this.checkout.removeEventListener('click', onOk);
            this.shop.removeEventListener('click', onShop);
            close();
        };
        this.checkout.addEventListener('click', onOk);
        this.shop.addEventListener('click', onShop);
    }
};

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
        productPrice.textContent = formatCurrency(Number(product.price || 0));
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

function addToCart(pid, product, { showAlert = true } = {}) {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const selectedOptions = {
        strap: productStrap.value || product.strap || '',
        color: productColor.value || product.color || '',
        size: productSize.value || product.size || ''
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
            model: product.model || '',
            price: product.price,
            image: (product.images && product.images.length) ? product.images[0] : '',
            qty: 1, 
            ...selectedOptions 
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
    if (showAlert) showAddedModal();
}

function buyNow(pid, product) {
    // Ensure item is in the cart but avoid showing the "Added to cart" alert
    addToCart(pid, product, { showAlert: false });
    // Show confirmation modal similar to cart removal confirmation
    buyConfirm.open(
        () => { window.location.href = 'cart.html'; },
        () => { window.location.href = 'all-products.html'; }
    );
}

function updateCartBadge() {
    try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const count = cart.reduce((sum, i) => sum + (Number(i.qty) || 0), 0);
        localStorage.setItem('cart_count', String(count));
        const badge = document.querySelector('.cart-badge');
        if (badge) badge.textContent = count;
    } catch (e) {
        console.warn('Failed updating cart badge', e);
    }
}


// --- INITIALIZE ---
document.addEventListener('DOMContentLoaded', loadProductDetails);
