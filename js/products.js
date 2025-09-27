// Products functionality
class ProductManager {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.currentFilters = {
            color: '',
            strap: '',
            size: '',
            price: ''
        };
    }

    // Initialize products (in real implementation, this would fetch from Firebase)
    initProducts(category = '') {
        // Sample product data
        this.products = [
            {
                id: 1,
                name: 'Classic Black Chronograph',
                price: 299.99,
                originalPrice: 349.99,
                image: 'https://images.unsplash.com/photo-1523170335258-f5eF6bf8c9a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
                images: [
                    'https://images.unsplash.com/photo-1523170335258-f5eF6bf8c9a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
                    'https://images.unsplash.com/photo-1547996160-81dfa58795a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
                ],
                category: 'him',
                colors: ['black', 'silver'],
                straps: ['leather', 'metal'],
                sizes: ['40mm', '42mm'],
                description: 'Elegant black chronograph watch with leather strap. Perfect for formal occasions.',
                features: ['Water resistant up to 50m', 'Chronograph function', 'Date display', 'Sapphire crystal'],
                inStock: true,
                rating: 4.5,
                reviews: 24
            },
            {
                id: 2,
                name: 'Elegant Silver',
                price: 349.99,
                image: 'https://images.unsplash.com/photo-1547996160-81dfa58795a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
                images: [
                    'https://images.unsplash.com/photo-1547996160-81dfa58795a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
                ],
                category: 'her',
                colors: ['silver', 'rose-gold'],
                straps: ['metal', 'leather'],
                sizes: ['28mm', '32mm'],
                description: 'Beautiful silver watch with diamond accents. A timeless piece for any collection.',
                features: ['Diamond accents', 'Water resistant up to 30m', 'Quartz movement', 'Mother-of-pearl dial'],
                inStock: true,
                rating: 4.8,
                reviews: 18
            },
            {
                id: 3,
                name: 'Modern Blue Diver',
                price: 449.99,
                image: 'https://images.unsplash.com/photo-1539874754764-5a96559165b0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
                images: [
                    'https://images.unsplash.com/photo-1539874754764-5a96559165b0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
                ],
                category: 'him',
                colors: ['blue', 'black'],
                straps: ['metal', 'rubber'],
                sizes: ['42mm', '44mm'],
                description: 'Professional diver watch with luminous markers and rotating bezel.',
                features: ['Water resistant up to 200m', 'Luminous markers', 'Rotating bezel', 'Automatic movement'],
                inStock: true,
                rating: 4.7,
                reviews: 32
            },
            {
                id: 4,
                name: 'Rose Gold Luxury',
                price: 599.99,
                image: 'https://images.unsplash.com/photo-1526045431048-f857369baa09?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
                images: [
                    'https://images.unsplash.com/photo-1526045431048-f857369baa09?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
                ],
                category: 'her',
                colors: ['rose-gold', 'gold'],
                straps: ['metal', 'leather'],
                sizes: ['32mm', '36mm'],
                description: 'Luxurious rose gold watch with genuine leather strap and Swiss movement.',
                features: ['Swiss movement', 'Genuine leather strap', 'Sapphire crystal', 'Date function'],
                inStock: true,
                rating: 4.9,
                reviews: 15
            },
            {
                id: 5,
                name: 'Sport Black',
                price: 199.99,
                image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
                images: [
                    'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
                ],
                category: 'him',
                colors: ['black', 'blue'],
                straps: ['rubber', 'silicone'],
                sizes: ['42mm', '44mm'],
                description: 'Durable sports watch with stopwatch function and comfortable rubber strap.',
                features: ['Stopwatch function', 'Water resistant up to 100m', 'Shock resistant', 'LED backlight'],
                inStock: true,
                rating: 4.3,
                reviews: 28
            },
            {
                id: 6,
                name: 'Pearl White Classic',
                price: 399.99,
                image: 'https://images.unsplash.com/photo-1551816230-ef5deaed4a26?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
                images: [
                    'https://images.unsplash.com/photo-1551816230-ef5deaed4a26?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
                ],
                category: 'her',
                colors: ['pearl', 'white'],
                straps: ['leather', 'metal'],
                sizes: ['28mm', '32mm'],
                description: 'Elegant pearl white watch with minimalist design and mother-of-pearl dial.',
                features: ['Mother-of-pearl dial', 'Minimalist design', 'Quartz movement', 'Water resistant up to 30m'],
                inStock: true,
                rating: 4.6,
                reviews: 22
            }
        ];

        // Filter by category if specified
        if (category) {
            this.filteredProducts = this.products.filter(product => product.category === category);
        } else {
            this.filteredProducts = [...this.products];
        }

        return this.filteredProducts;
    }

    // Apply filters
    applyFilters(filters) {
        this.currentFilters = { ...this.currentFilters, ...filters };
        
        this.filteredProducts = this.products.filter(product => {
            // Category filter
            if (this.currentFilters.category && product.category !== this.currentFilters.category) {
                return false;
            }

            // Color filter
            if (this.currentFilters.color && !product.colors.includes(this.currentFilters.color)) {
                return false;
            }

            // Strap filter
            if (this.currentFilters.strap && !product.straps.includes(this.currentFilters.strap)) {
                return false;
            }

            // Size filter
            if (this.currentFilters.size && !product.sizes.includes(this.currentFilters.size)) {
                return false;
            }

            // Price filter
            if (this.currentFilters.price) {
                const [min, max] = this.currentFilters.price.split('-').map(Number);
                if (max && (product.price < min || product.price > max)) {
                    return false;
                } else if (!max && product.price < min) {
                    return false;
                }
            }

            return true;
        });

        return this.filteredProducts;
    }

    // Get product by ID
    getProductById(id) {
        return this.products.find(product => product.id === parseInt(id));
    }

    // Render products grid
    renderProducts(containerId, products) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (products.length === 0) {
            container.innerHTML = '<p class="no-products">No products found matching your criteria.</p>';
            return;
        }

        container.innerHTML = products.map(product => `
            <div class="product-card fade-in" data-id="${product.id}">
                <img src="${product.image}" alt="${product.name}" class="product-image">
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-rating">
                        <span class="stars">${this.generateStars(product.rating)}</span>
                        <span class="review-count">(${product.reviews})</span>
                    </div>
                    <p class="product-price">$${product.price.toFixed(2)}</p>
                    <button class="add-to-cart" data-id="${product.id}">Add to Cart</button>
                </div>
            </div>
        `).join('');

        // Add event listeners to add to cart buttons
        this.attachAddToCartListeners();
    }

    // Generate star rating
    generateStars(rating) {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        
        return '★'.repeat(fullStars) + (halfStar ? '½' : '') + '☆'.repeat(emptyStars);
    }

    // Render product details
    renderProductDetails(productId) {
        const product = this.getProductById(productId);
        if (!product) {
            window.location.href = '404.html';
            return;
        }

        // Update page title
        document.title = `${product.name} - TimeMachine`;

        // Update product details
        document.getElementById('product-title').textContent = product.name;
        document.getElementById('product-price').textContent = `$${product.price.toFixed(2)}`;
        document.getElementById('product-description').textContent = product.description;
        
        // Update main image
        const mainImage = document.getElementById('main-product-image');
        if (mainImage) {
            mainImage.src = product.image;
            mainImage.alt = product.name;
        }

        // Render thumbnails
        this.renderThumbnails(product.images);

        // Render color options
        this.renderColorOptions(product.colors);

        // Render strap options
        this.renderStrapOptions(product.straps);

        // Render size options
        this.renderSizeOptions(product.sizes);

        // Render features
        this.renderFeatures(product.features);

        // Render reviews
        this.renderReviews(product.id);

        // Add to cart functionality
        this.attachProductDetailListeners(product);
    }

    renderThumbnails(images) {
        const container = document.querySelector('.image-thumbnails');
        if (!container) return;

        container.innerHTML = images.map((image, index) => `
            <img src="${image}" alt="Thumbnail ${index + 1}" class="thumbnail ${index === 0 ? 'active' : ''}" data-image="${image}">
        `).join('');

        // Add thumbnail click listeners
        document.querySelectorAll('.thumbnail').forEach(thumb => {
            thumb.addEventListener('click', () => {
                document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
                document.getElementById('main-product-image').src = thumb.getAttribute('data-image');
            });
        });
    }

    renderColorOptions(colors) {
        const container = document.getElementById('color-options');
        if (!container) return;

        const colorMap = {
            'black': '#000000',
            'silver': '#c0c0c0',
            'gold': '#ffd700',
            'rose-gold': '#b76e79',
            'blue': '#0000ff',
            'pearl': '#f8f6f0',
            'white': '#ffffff'
        };

        container.innerHTML = colors.map((color, index) => `
            <div class="color-option ${index === 0 ? 'active' : ''}" 
                 style="background-color: ${colorMap[color] || '#ccc'}" 
                 data-color="${color}" 
                 title="${color.charAt(0).toUpperCase() + color.slice(1)}">
            </div>
        `).join('');

        // Add color selection listeners
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.color-option').forEach(o => o.classList.remove('active'));
                option.classList.add('active');
            });
        });
    }

    renderStrapOptions(straps) {
        const select = document.getElementById('strap-option');
        if (!select) return;

        select.innerHTML = straps.map(strap => `
            <option value="${strap}">${strap.charAt(0).toUpperCase() + strap.slice(1)}</option>
        `).join('');
    }

    renderSizeOptions(sizes) {
        const select = document.getElementById('size-option');
        if (!select) return;

        select.innerHTML = sizes.map(size => `
            <option value="${size}">${size}</option>
        `).join('');
    }

    renderFeatures(features) {
        const container = document.getElementById('product-features');
        if (!container) return;

        container.innerHTML = features.map(feature => `
            <li>${feature}</li>
        `).join('');
    }

    renderReviews(productId) {
        // Sample reviews - in real implementation, fetch from Firebase
        const reviews = [
            {
                id: 1,
                productId: productId,
                userName: 'John Smith',
                rating: 5,
                comment: 'Excellent quality and fast shipping!',
                date: '2023-11-15'
            },
            {
                id: 2,
                productId: productId,
                userName: 'Sarah Johnson',
                rating: 4,
                comment: 'Beautiful watch, but the strap is a bit tight.',
                date: '2023-11-10'
            }
        ];

        const container = document.getElementById('reviews-container');
        if (!container) return;

        if (reviews.length === 0) {
            container.innerHTML = '<p>No reviews yet. Be the first to review this product!</p>';
            return;
        }

        container.innerHTML = reviews.map(review => `
            <div class="review-item">
                <div class="review-header">
                    <strong>${review.userName}</strong>
                    <span class="review-rating">${this.generateStars(review.rating)}</span>
                    <span class="review-date">${review.date}</span>
                </div>
                <p class="review-comment">${review.comment}</p>
            </div>
        `).join('');
    }

    attachAddToCartListeners() {
        document.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.target.getAttribute('data-id');
                this.addToCart(productId);
            });
        });
    }

    attachProductDetailListeners(product) {
        const addToCartBtn = document.getElementById('add-to-cart');
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', () => {
                const quantity = parseInt(document.getElementById('quantity').value);
                const selectedColor = document.querySelector('.color-option.active')?.getAttribute('data-color');
                const selectedStrap = document.getElementById('strap-option').value;
                const selectedSize = document.getElementById('size-option').value;

                this.addToCart(product.id, quantity, {
                    color: selectedColor,
                    strap: selectedStrap,
                    size: selectedSize
                });
            });
        }

        // Quantity controls
        const decreaseBtn = document.getElementById('decrease-qty');
        const increaseBtn = document.getElementById('increase-qty');
        const quantityInput = document.getElementById('quantity');

        if (decreaseBtn && increaseBtn && quantityInput) {
            decreaseBtn.addEventListener('click', () => {
                const currentValue = parseInt(quantityInput.value);
                if (currentValue > 1) {
                    quantityInput.value = currentValue - 1;
                }
            });

            increaseBtn.addEventListener('click', () => {
                const currentValue = parseInt(quantityInput.value);
                quantityInput.value = currentValue + 1;
            });

            quantityInput.addEventListener('change', () => {
                const value = parseInt(quantityInput.value);
                if (value < 1) quantityInput.value = 1;
            });
        }
    }

    addToCart(productId, quantity = 1, options = {}) {
        const product = this.getProductById(productId);
        if (!product) return;

        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        
        // Check if product with same options already in cart
        const existingIndex = cart.findIndex(item => 
            item.id === productId && 
            item.options.color === options.color &&
            item.options.strap === options.strap &&
            item.options.size === options.size
        );

        if (existingIndex > -1) {
            cart[existingIndex].quantity += quantity;
        } else {
            cart.push({
                id: productId,
                quantity: quantity,
                options: options,
                addedAt: new Date().toISOString()
            });
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        this.updateCartCount();
        
        // Show confirmation
        this.showNotification('Product added to cart!');
    }

    updateCartCount() {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            cartCount.textContent = totalItems;
        }
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: #000;
            color: white;
            padding: 1rem 2rem;
            border-radius: 4px;
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Initialize product manager
const productManager = new ProductManager();

// Page-specific functionality
document.addEventListener('DOMContentLoaded', function() {
    // Him page
    if (document.getElementById('him-products')) {
        const products = productManager.initProducts('him');
        productManager.renderProducts('him-products', products);
        
        // Set up filters
        setupFilters('him');
    }

    // Her page
    if (document.getElementById('her-products')) {
        const products = productManager.initProducts('her');
        productManager.renderProducts('her-products', products);
        
        // Set up filters
        setupFilters('her');
    }

    // Product detail page
    if (window.location.pathname.includes('product-detail.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        
        if (productId) {
            productManager.renderProductDetails(productId);
        } else {
            window.location.href = '404.html';
        }
    }

    // Update cart count on all pages
    productManager.updateCartCount();
});

function setupFilters(category) {
    const filters = {
        color: document.getElementById('color-filter'),
        strap: document.getElementById('strap-filter'),
        size: document.getElementById('size-filter'),
        price: document.getElementById('price-filter'),
        reset: document.getElementById('reset-filters')
    };

    // Add change listeners to filters
    Object.keys(filters).forEach(key => {
        if (filters[key] && key !== 'reset') {
            filters[key].addEventListener('change', () => {
                applyCurrentFilters(category);
            });
        }
    });

    // Reset filters
    if (filters.reset) {
        filters.reset.addEventListener('click', () => {
            Object.keys(filters).forEach(key => {
                if (filters[key] && key !== 'reset') {
                    filters[key].value = '';
                }
            });
            applyCurrentFilters(category);
        });
    }
}

function applyCurrentFilters(category) {
    const filters = {
        category: category,
        color: document.getElementById('color-filter')?.value || '',
        strap: document.getElementById('strap-filter')?.value || '',
        size: document.getElementById('size-filter')?.value || '',
        price: document.getElementById('price-filter')?.value || ''
    };

    const filteredProducts = productManager.applyFilters(filters);
    const containerId = category === 'him' ? 'him-products' : 'her-products';
    productManager.renderProducts(containerId, filteredProducts);
}