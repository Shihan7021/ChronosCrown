// Navigation Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
}));

// Scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('appear');
        }
    });
}, observerOptions);

// Observe elements with animation classes
document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right');
    animatedElements.forEach(el => observer.observe(el));
    
    // Load featured products
    loadFeaturedProducts();
    
    // Load testimonials
    loadTestimonials();
    
    // Update cart count
    updateCartCount();
});

// Featured Products
function loadFeaturedProducts() {
    const productsGrid = document.querySelector('.products-grid');
    
    // Sample product data - in real implementation, this would come from Firebase
    const featuredProducts = [
        {
            id: 1,
            name: 'Classic Black',
            price: 299.99,
            image: 'https://images.unsplash.com/photo-1523170335258-f5eF6bf8c9a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
            category: 'him'
        },
        {
            id: 2,
            name: 'Elegant Silver',
            price: 349.99,
            image: 'https://images.unsplash.com/photo-1547996160-81dfa58795a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
            category: 'her'
        },
        {
            id: 3,
            name: 'Modern Chronograph',
            price: 449.99,
            image: 'https://images.unsplash.com/photo-1539874754764-5a96559165b0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
            category: 'him'
        },
        {
            id: 4,
            name: 'Rose Gold',
            price: 399.99,
            image: 'https://images.unsplash.com/photo-1526045431048-f857369baa09?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
            category: 'her'
        }
    ];
    
    productsGrid.innerHTML = featuredProducts.map(product => `
        <div class="product-card fade-in">
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-price">$${product.price}</p>
                <button class="add-to-cart" data-id="${product.id}">Add to Cart</button>
            </div>
        </div>
    `).join('');
    
    // Add event listeners to add to cart buttons
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = e.target.getAttribute('data-id');
            addToCart(productId);
        });
    });
}

// Testimonials
function loadTestimonials() {
    const testimonialsSlider = document.querySelector('.testimonials-slider');
    
    // Sample testimonials data
    const testimonials = [
        {
            text: "The quality of my TimeMachine watch exceeded my expectations. It's both stylish and durable.",
            author: "Michael Johnson"
        },
        {
            text: "I've received so many compliments on my watch. The craftsmanship is exceptional.",
            author: "Sarah Williams"
        },
        {
            text: "Perfect gift for my husband. He wears it every day and loves it!",
            author: "Emily Davis"
        },
        {
            text: "The customer service was outstanding. They helped me choose the perfect watch.",
            author: "Robert Brown"
        }
    ];
    
    testimonialsSlider.innerHTML = testimonials.map(testimonial => `
        <div class="testimonial-card slide-in-left">
            <p class="testimonial-text">"${testimonial.text}"</p>
            <p class="testimonial-author">- ${testimonial.author}</p>
        </div>
    `).join('');
}

// Cart functionality
function addToCart(productId) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Check if product already in cart
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: productId,
            quantity: 1
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    
    // Show confirmation
    showNotification('Product added to cart!');
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        cartCount.textContent = totalItems;
    }
}

function showNotification(message) {
    // Create notification element
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
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Animate out and remove
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Newsletter form
document.querySelector('.newsletter-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]').value;
    
    // In a real implementation, this would send to a server
    console.log('Newsletter subscription:', email);
    
    // Show success message
    showNotification('Thank you for subscribing!');
    e.target.reset();
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = 'none';
    }
});