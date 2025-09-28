// js/app.js - Main application script
import { db } from './firebase.init.js';
import { collection, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { loadProducts } from './products.js';
import { formatCurrency } from './utils.js';

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Functions for elements on every page
        initSiteWideUI();
        
        // Functions that only run on the homepage
        initHomepageScripts(); 
    } catch (e) {
        console.warn("Initialization error:", e);
    }
});


// --- SITE-WIDE FUNCTIONS ---

/**
 * Initializes UI elements present on all pages, like the header cart badge.
 */
function initSiteWideUI() {
    // Update cart badge from local storage on initial load
    const count = localStorage.getItem('cart_count') || '0';
    const badge = document.querySelector('.cart-badge');
    if (badge) badge.textContent = count;
}


// --- HOMEPAGE-SPECIFIC FUNCTIONS ---

/**
 * Checks if the current page is the homepage and runs the necessary scripts.
 */
function initHomepageScripts() {
    const heroCarousel = document.getElementById('hero-carousel');
    const productsGrid = document.getElementById('products-grid');

    // By checking for the hero-carousel, we ensure this code only runs on index.html
    if (heroCarousel && productsGrid) {
        initCarouselEffect(heroCarousel);
        loadHeroCarousel(heroCarousel);
        
        // Load the 9 featured products into the main grid
        loadProducts({ category: 'all', limit: 9 });
    }
}

/**
 * Loads the latest products from Firestore for the hero carousel.
 * @param {HTMLElement} carouselElement The carousel DOM element to populate.
 */
async function loadHeroCarousel(carouselElement) {
    try {
        const q = query(collection(db, "products"), orderBy("createdAt", "desc"), limit(5));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            carouselElement.innerHTML = '<p>No recent products to show.</p>';
            return;
        }

        let carouselHTML = '';
        querySnapshot.forEach((doc) => {
            const product = { id: doc.id, ...doc.data() };
            const image = product.images && product.images.length > 0 ? product.images[0] : 'https://placehold.co/400x300/EFEFEF/A9A9A9?text=No+Image';
            carouselHTML += `
                <a href="product.html?id=${product.id}" class="carousel-item">
                    <img src="${image}" alt="${product.name}" onerror="this.onerror=null;this.src='https://placehold.co/400x300/EFEFEF/A9A9A9?text=No+Image';">
                    <div class="carousel-caption">
                        <h4>${product.name}</h4>
                        <p>${formatCurrency(product.price)}</p>
                    </div>
                </a>
            `;
        });
        carouselElement.innerHTML = carouselHTML;
    } catch (error) {
        console.error("Error loading hero carousel:", error);
        carouselElement.innerHTML = '<p>Could not load featured products. This requires a `createdAt` field in your Firestore documents.</p>';
    }
}

/**
 * Initializes the parallax/3D mouse-move effect on the hero carousel.
 * @param {HTMLElement} track The carousel element.
 */
function initCarouselEffect(track) {
  if(!track) return;
  
  // Parallax mouse move effect
  track.addEventListener('mousemove', e=>{
    const rect = track.getBoundingClientRect();
    const center = rect.width / 2;
    const diff = (e.clientX - rect.left - center) / center; // -1 to 1
    track.style.transform = `perspective(1200px) rotateY(${diff * 6}deg)`;
  });

  // Gentle auto-scroll
  let offset = 0;
  setInterval(()=>{
    if(!track) return;
    offset = (offset + 0.3) % (track.scrollWidth - track.clientWidth);
    track.scrollLeft = offset;
  }, 40);
}
