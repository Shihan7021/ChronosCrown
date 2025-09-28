// js/products.js - Handles product listing, filtering, and pagination.
import { db } from './firebase.init.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { formatCurrency } from './utils.js';

// --- STATE ---
let currentCategory = 'all';
// Always fetch fresh from Firestore to ensure latest flags (featured/animated) and inventory are shown
let allProducts = [];

// --- CORE FUNCTION ---

/**
 * Fetches products from Firestore and renders them to the grid.
 * @param {object} options - The options for loading products.
 * @param {string} options.category - The product category ('all', 'Him', 'Her').
 * @param {number} options.page - The current page number for pagination.
 * @param {object} options.filters - The filter criteria.
 * @param {number} options.limit - The max number of products to show (for homepage).
 */
export async function loadProducts({category = 'all', page = 1, filters = {}, limit = 0} = {}) {
    currentCategory = category;
    const rowsPerPage = Number(localStorage.getItem('rowsPerPage') || 5);
    const pageSize = rowsPerPage * 4; // 4 products per row
    const container = document.querySelector('#products-grid');

    if (!container) {
        console.error("Products grid container not found.");
        return;
    }
    container.innerHTML = '<div>Loading products...</div>';

    try {
        // Always fetch fresh
        allProducts = [];
        const querySnapshot = await getDocs(collection(db, 'products'));
        querySnapshot.forEach(doc => {
            allProducts.push({ id: doc.id, ...doc.data() });
        });

        // --- FILTERING ---
        const filtered = allProducts.filter(p => {
            // Category filter
            if (category !== 'all') {
                if (!p.type || p.type.toLowerCase() !== category.toLowerCase()) return false;
            }
            // Attribute filters
            if (filters.priceMin && p.price < filters.priceMin) return false;
            if (filters.priceMax && p.price > filters.priceMax) return false;
            if (filters.strap && p.strap !== filters.strap) return false;
            if (filters.color && p.color !== filters.color) return false;
            if (filters.size && String(p.size) !== String(filters.size)) return false;
            return true;
        });
        
        // --- PAGINATION / LIMITING ---
        let itemsToRender;
        if (limit > 0) {
            // For homepage featured grid
            itemsToRender = filtered.slice(0, limit);
        } else {
            // For paginated category pages
            const startIndex = (page - 1) * pageSize;
            itemsToRender = filtered.slice(startIndex, startIndex + pageSize);
        }

        // --- RENDERING ---
        renderProductGrid(container, itemsToRender);

        // Render pagination controls if not on homepage
        if (limit === 0) {
            renderPagination(container, page, filtered.length, pageSize, filters);
        }

    } catch (error) {
        console.error("Error loading products:", error);
        container.innerHTML = '<div>Error loading products. Please try again later.</div>';
    }
}

// --- RENDER HELPERS ---

function renderProductGrid(container, products) {
    container.classList.add('grid','grid-4');
    container.innerHTML = ''; // Clear loading message
    if (products.length === 0) {
        container.innerHTML = '<div>No products found matching your criteria.</div>';
        return;
    }

    products.forEach(prod => {
        const mainImage = (prod.images && prod.images.length) ? prod.images[0] : 'https://placehold.co/120x120/EFEFEF/A9A9A9?text=No+Image';
        const card = document.createElement('a');
        card.className = 'product-card';
        card.href = `product.html?id=${prod.id}`;
        card.innerHTML = `
            <div class="product-card-image">
                <img src="${mainImage}" alt="${prod.name}" onerror="this.onerror=null;this.src='https://placehold.co/120x120/EFEFEF/A9A9A9?text=No+Image';">
                ${prod.quantity <= 0 ? '<div class="out-of-stock-badge">Out of Stock</div>' : ''}
            </div>
            <div class="product-card-info">
                <h3>${prod.name}</h3>
                <p class="meta">${prod.brand || 'ChronosCrown'}</p>
                <p class="description">${prod.description ? prod.description.substring(0, 50) + '...' : ''}</p>
                <div class="product-card-footer">
                    <div class="price">${formatCurrency(prod.price)}</div>
                    <button class="btn secondary" ${prod.quantity <= 0 ? 'disabled' : ''}>View</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderPagination(container, currentPage, totalItems, pageSize, filters) {
    const totalPages = Math.ceil(totalItems / pageSize);
    if (totalPages <= 1) return;

    const pager = document.createElement('div');
    pager.className = 'pagination';
    
    let pagerHTML = `<span>Page ${currentPage} of ${totalPages}</span>`;
    
    const prevButton = `<button class="btn secondary" onclick="changePage(${currentPage - 1})">Previous</button>`;
    const nextButton = `<button class="btn" onclick="changePage(${currentPage + 1})">Next</button>`;
    
    if (currentPage > 1) {
        pagerHTML += prevButton;
    }
    if (currentPage < totalPages) {
        pagerHTML += nextButton;
    }

    pager.innerHTML = pagerHTML;
    container.appendChild(pager);

    // Expose changePage function to global scope for the inline onclick handler
    window.changePage = (p) => loadProducts({ category: currentCategory, page: p, filters });
}
