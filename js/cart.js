// Cart functionality
class CartManager {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('cart')) || [];
        this.products = []; // This would be populated from products data
    }

    init() {
        this.loadProductsData();
        this.renderCart();
        this.attachEventListeners();
    }

    loadProductsData() {
        // In a real implementation, this would fetch from Firebase
        // For now, we'll use sample data (same as in products.js)
        this.products = [
            {
                id: 1,
                name: 'Classic Black Chronograph',
                price: 299.99,
                image: 'https://images.unsplash.com/photo-1523170335258-f5eF6bf8c9a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
            },
            {
                id: 2,
                name: 'Elegant Silver',
                price: 349.99,
                image: 'https://images.unsplash.com/photo-1547996160-81dfa58795a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
            },
            {
                id: 3,
                name: 'Modern Blue Diver',
                price: 449.99,
                image: 'https://images.unsplash.com/photo-1539874754764-5a96559165b0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
            },
            {
                id: 4,
                name: 'Rose Gold Luxury',
                price: 599.99,
                image: 'https://images.unsplash.com/photo-1526045431048-f857369baa09?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
            },
            {
                id: 5,
                name: 'Sport Black',
                price: 199.99,
                image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
            },
            {
                id: 6,
                name: 'Pearl White Classic',
                price: 399.99,
                image: 'https://images.unsplash.com/photo-1551816230-ef5deaed4a26?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
            }
        ];
    }

    renderCart() {
        const cartItemsContainer = document.getElementById('cart-items');
        const emptyCart = document.getElementById('empty-cart');
        const checkoutBtn = document.getElementById('checkout-btn');

        if (this.cart.length === 0) {
            if (emptyCart) emptyCart.style.display = 'block';
            if (checkoutBtn) checkoutBtn.style.display = 'none';
            this.updateSummary(0);
            return;
        }

        if (emptyCart) emptyCart.style.display = 'none';
        if (checkoutBtn) checkoutBtn.style.display = 'block';

        let cartHTML = '';
        let subtotal = 0;

        this.cart.forEach((item, index) => {
            const product = this.products.find(p => p.id === item.id);
            if (!product) return;

            const itemTotal = product.price * item.quantity;
            subtotal += itemTotal;

            cartHTML += `
                <div class="cart-item" data-index="${index}">
                    <img src="${product.image}" alt="${product.name}" class="cart-item-image">
                    <div class="cart-item-details">
                        <h3 class="cart-item-title">${product.name}</h3>
                        <div class="cart-item-options">
                            ${this.renderOptions(item.options)}
                        </div>
                        <p class="cart-item-price">$${product.price.toFixed(2)}</p>
                        <div class="cart-item-actions">
                            <div class="quantity-selector">
                                <button class="quantity-btn decrease" data-index="${index}">-</button>
                                <input type="number" class="quantity-input" value="${item.quantity}" min="1" data-index="${index}">
                                <button class="quantity-btn increase" data-index="${index}">+</button>
                            </div>
                            <button class="remove-item" data-index="${index}">Remove</button>
                        </div>
                    </div>
                </div>
            `;
        });

        if (cartItemsContainer) {
            cartItemsContainer.innerHTML = cartHTML;
        }

        this.updateSummary(subtotal);
    }

    renderOptions(options) {
        if (!options || Object.keys(options).length === 0) return '';
        
        let optionsHTML = '';
        if (options.color) optionsHTML += `<span>Color: ${options.color}</span>`;
        if (options.strap) optionsHTML += `<span>Strap: ${options.strap}</span>`;
        if (options.size) optionsHTML += `<span>Size: ${options.size}</span>`;
        
        return `<div class="options-list">${optionsHTML}</div>`;
    }

    updateSummary(subtotal) {
        const shipping = subtotal > 0 ? 9.99 : 0;
        const tax = subtotal * 0.08; // 8% tax
        const total = subtotal + shipping + tax;

        document.getElementById('cart-subtotal').textContent = `$${subtotal.toFixed(2)}`;
        document.getElementById('cart-shipping').textContent = `$${shipping.toFixed(2)}`;
        document.getElementById('cart-tax').textContent = `$${tax.toFixed(2)}`;
        document.getElementById('cart-total').textContent = `$${total.toFixed(2)}`;
    }

    attachEventListeners() {
        // Delegate events for dynamic content
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('decrease')) {
                this.updateQuantity(parseInt(e.target.getAttribute('data-index')), -1);
            } else if (e.target.classList.contains('increase')) {
                this.updateQuantity(parseInt(e.target.getAttribute('data-index')), 1);
            } else if (e.target.classList.contains('remove-item')) {
                this.removeItem(parseInt(e.target.getAttribute('data-index')));
            }
        });

        // Input changes
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('quantity-input')) {
                const index = parseInt(e.target.getAttribute('data-index'));
                const newQuantity = parseInt(e.target.value);
                if (newQuantity > 0) {
                    this.setQuantity(index, newQuantity);
                }
            }
        });

        // Checkout page specific
        if (window.location.pathname.includes('checkout.html')) {
            this.renderCheckoutItems();
            this.setupCheckoutForm();
        }
    }

    updateQuantity(index, change) {
        if (this.cart[index]) {
            const newQuantity = this.cart[index].quantity + change;
            if (newQuantity > 0) {
                this.cart[index].quantity = newQuantity;
                this.saveCart();
                this.renderCart();
            }
        }
    }

    setQuantity(index, quantity) {
        if (this.cart[index] && quantity > 0) {
            this.cart[index].quantity = quantity;
            this.saveCart();
            this.renderCart();
        }
    }

    removeItem(index) {
        this.cart.splice(index, 1);
        this.saveCart();
        this.renderCart();
    }

    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
        this.updateCartCount();
    }

    updateCartCount() {
        const totalItems = this.cart.reduce((total, item) => total + item.quantity, 0);
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            cartCount.textContent = totalItems;
        }
    }

    // Checkout page functionality
    renderCheckoutItems() {
        const container = document.getElementById('checkout-items');
        if (!container) return;

        if (this.cart.length === 0) {
            container.innerHTML = '<p>Your cart is empty</p>';
            return;
        }

        let itemsHTML = '';
        let subtotal = 0;

        this.cart.forEach(item => {
            const product = this.products.find(p => p.id === item.id);
            if (!product) return;

            const itemTotal = product.price * item.quantity;
            subtotal += itemTotal;

            itemsHTML += `
                <div class="checkout-item">
                    <img src="${product.image}" alt="${product.name}" class="checkout-item-image">
                    <div class="checkout-item-details">
                        <h4>${product.name}</h4>
                        <p>Quantity: ${item.quantity}</p>
                        <p>$${product.price.toFixed(2)} each</p>
                    </div>
                    <div class="checkout-item-total">
                        $${itemTotal.toFixed(2)}
                    </div>
                </div>
            `;
        });

        container.innerHTML = itemsHTML;
        this.updateCheckoutSummary(subtotal);
    }

    updateCheckoutSummary(subtotal) {
        const shipping = subtotal > 0 ? 9.99 : 0;
        const tax = subtotal * 0.08;
        const total = subtotal + shipping + tax;

        document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
        document.getElementById('shipping').textContent = `$${shipping.toFixed(2)}`;
        document.getElementById('tax').textContent = `$${tax.toFixed(2)}`;
        document.getElementById('total').textContent = `$${total.toFixed(2)}`;
    }

    setupCheckoutForm() {
        const form = document.getElementById('shipping-form');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            if (this.cart.length === 0) {
                alert('Your cart is empty');
                return;
            }

            // Validate form
            if (this.validateCheckoutForm()) {
                // Process order
                this.processOrder();
            }
        });
    }

    validateCheckoutForm() {
        // Basic validation - in real implementation, add more robust validation
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
                field.style.borderColor = 'red';
            } else {
                field.style.borderColor = '';
            }
        });

        return isValid;
    }

    processOrder() {
        // Generate order ID
        const orderId = 'TM-' + Date.now().toString().slice(-6);
        
        // Create order object
        const order = {
            id: orderId,
            items: [...this.cart],
            total: this.calculateTotal(),
            date: new Date().toISOString(),
            status: 'pending'
        };

        // Save order to localStorage (in real implementation, save to Firebase)
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        orders.push(order);
        localStorage.setItem('orders', JSON.stringify(orders));

        // Clear cart
        this.cart = [];
        this.saveCart();

        // Redirect to thank you page with order ID
        window.location.href = `thank-you.html?order=${orderId}`;
    }

    calculateTotal() {
        let subtotal = 0;
        this.cart.forEach(item => {
            const product = this.products.find(p => p.id === item.id);
            if (product) {
                subtotal += product.price * item.quantity;
            }
        });
        
        const shipping = subtotal > 0 ? 9.99 : 0;
        const tax = subtotal * 0.08;
        return subtotal + shipping + tax;
    }
}

// Initialize cart manager
const cartManager = new CartManager();

// Initialize on cart and checkout pages
if (window.location.pathname.includes('cart.html') || 
    window.location.pathname.includes('checkout.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        cartManager.init();
    });
}

// Update cart count on all pages
document.addEventListener('DOMContentLoaded', () => {
    cartManager.updateCartCount();
});