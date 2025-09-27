// CMS functionality
class CMSManager {
    constructor() {
        this.currentPage = 'dashboard';
        this.products = JSON.parse(localStorage.getItem('cms-products')) || [];
        this.orders = JSON.parse(localStorage.getItem('orders')) || [];
        this.testimonials = JSON.parse(localStorage.getItem('testimonials')) || [];
        this.init();
    }

    init() {
        this.loadData();
        this.setupNavigation();
        this.loadPageContent();
        this.attachEventListeners();
    }

    loadData() {
        // Load products from main site data
        const mainProducts = JSON.parse(localStorage.getItem('products'));
        if (mainProducts && this.products.length === 0) {
            this.products = mainProducts;
        }

        // Load testimonials from main site
        const mainTestimonials = JSON.parse(localStorage.getItem('testimonials'));
        if (mainTestimonials) {
            this.testimonials = mainTestimonials;
        }
    }

    setupNavigation() {
        // Highlight current page in navigation
        const currentPath = window.location.pathname;
        const pageName = currentPath.split('/').pop().replace('.html', '');
        
        document.querySelectorAll('.sidebar-nav a').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(pageName)) {
                link.classList.add('active');
            }
        });

        this.currentPage = pageName;
    }

    loadPageContent() {
        switch (this.currentPage) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'products':
                this.loadProducts();
                break;
            case 'orders':
                this.loadOrders();
                break;
            case 'content':
                this.loadContent();
                break;
            case 'feedback':
                this.loadFeedback();
                break;
            case 'analytics':
                this.loadAnalytics();
                break;
        }
    }

    loadDashboard() {
        // Update stats
        this.updateDashboardStats();
        
        // Load recent orders
        this.loadRecentOrders();
    }

    updateDashboardStats() {
        const totalRevenue = this.orders.reduce((sum, order) => sum + order.total, 0);
        const totalOrders = this.orders.length;
        const totalProducts = this.products.length;
        const avgRating = this.testimonials.length > 0 ? 
            this.testimonials.reduce((sum, t) => sum + t.rating, 0) / this.testimonials.length : 0;

        document.querySelector('.stat-card:nth-child(1) h3').textContent = `$${totalRevenue.toFixed(2)}`;
        document.querySelector('.stat-card:nth-child(2) h3').textContent = totalOrders;
        document.querySelector('.stat-card:nth-child(3) h3').textContent = this.getCustomerCount();
        document.querySelector('.stat-card:nth-child(4) h3').textContent = avgRating.toFixed(1);
    }

    getCustomerCount() {
        const customers = new Set(this.orders.map(order => order.customerEmail));
        return customers.size;
    }

    loadRecentOrders() {
        const recentOrders = this.orders.slice(-5).reverse();
        const tbody = document.querySelector('.data-table tbody');
        
        if (tbody) {
            tbody.innerHTML = recentOrders.map(order => `
                <tr>
                    <td>${order.id}</td>
                    <td>${order.customerName || 'N/A'}</td>
                    <td>${new Date(order.date).toLocaleDateString()}</td>
                    <td>$${order.total.toFixed(2)}</td>
                    <td><span class="status ${order.status}">${order.status}</span></td>
                    <td>
                        <button class="btn-small view-order" data-id="${order.id}">View</button>
                        <button class="btn-small btn-danger delete-order" data-id="${order.id}">Delete</button>
                    </td>
                </tr>
            `).join('');
        }
    }

    loadProducts() {
        const container = document.getElementById('products-container');
        if (!container) return;

        container.innerHTML = `
            <div class="section-header">
                <h2>Product Management</h2>
                <button class="btn btn-success" id="add-product-btn">Add New Product</button>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Image</th>
                            <th>Name</th>
                            <th>Price</th>
                            <th>Category</th>
                            <th>Stock</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="products-tbody">
                        ${this.products.map(product => `
                            <tr>
                                <td>${product.id}</td>
                                <td><img src="${product.image}" alt="${product.name}" class="product-thumb"></td>
                                <td>${product.name}</td>
                                <td>$${product.price.toFixed(2)}</td>
                                <td>${product.category}</td>
                                <td>${product.inStock ? 'In Stock' : 'Out of Stock'}</td>
                                <td>
                                    <button class="btn-small edit-product" data-id="${product.id}">Edit</button>
                                    <button class="btn-small btn-danger delete-product" data-id="${product.id}">Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    loadOrders() {
        const container = document.getElementById('orders-container');
        if (!container) return;

        container.innerHTML = `
            <div class="section-header">
                <h2>Order Management</h2>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.orders.map(order => `
                            <tr>
                                <td>${order.id}</td>
                                <td>${order.customerName || 'N/A'}</td>
                                <td>${new Date(order.date).toLocaleDateString()}</td>
                                <td>$${order.total.toFixed(2)}</td>
                                <td>
                                    <select class="status-select" data-id="${order.id}">
                                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                                        <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                                        <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                                        <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                                    </select>
                                </td>
                                <td>
                                    <button class="btn-small view-order" data-id="${order.id}">View</button>
                                    <button class="btn-small btn-danger delete-order" data-id="${order.id}">Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    loadContent() {
        const container = document.getElementById('content-container');
        if (!container) return;

        // Load current content from localStorage or use defaults
        const siteContent = JSON.parse(localStorage.getItem('site-content')) || {
            heroTitle: 'Timeless Elegance',
            heroSubtitle: 'Discover our premium collection of watches designed for every moment',
            aboutText: 'Our story content...',
            contactInfo: 'Contact information...'
        };

        container.innerHTML = `
            <div class="section-header">
                <h2>Site Content Management</h2>
            </div>
            <form id="content-form">
                <div class="form-group">
                    <label for="hero-title">Hero Title</label>
                    <input type="text" id="hero-title" name="heroTitle" value="${siteContent.heroTitle}" class="form-control">
                </div>
                <div class="form-group">
                    <label for="hero-subtitle">Hero Subtitle</label>
                    <textarea id="hero-subtitle" name="heroSubtitle" class="form-control" rows="3">${siteContent.heroSubtitle}</textarea>
                </div>
                <div class="form-group">
                    <label for="about-text">About Us Text</label>
                    <textarea id="about-text" name="aboutText" class="form-control" rows="6">${siteContent.aboutText}</textarea>
                </div>
                <div class="form-group">
                    <label for="contact-info">Contact Information</label>
                    <textarea id="contact-info" name="contactInfo" class="form-control" rows="4">${siteContent.contactInfo}</textarea>
                </div>
                <button type="submit" class="btn btn-success">Update Content</button>
            </form>
        `;
    }

    loadFeedback() {
        const container = document.getElementById('feedback-container');
        if (!container) return;

        container.innerHTML = `
            <div class="section-header">
                <h2>Customer Feedback</h2>
            </div>
            <div class="feedback-list">
                ${this.testimonials.map(testimonial => `
                    <div class="feedback-item">
                        <div class="feedback-header">
                            <strong>${testimonial.name}</strong>
                            <span class="rating">${'★'.repeat(testimonial.rating)}${'☆'.repeat(5-testimonial.rating)}</span>
                            <span class="date">${new Date(testimonial.date).toLocaleDateString()}</span>
                        </div>
                        <p class="feedback-text">${testimonial.message}</p>
                        <div class="feedback-actions">
                            <button class="btn-small approve-testimonial" data-id="${testimonial.id}">Approve</button>
                            <button class="btn-small btn-danger delete-testimonial" data-id="${testimonial.id}">Delete</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    loadAnalytics() {
        const container = document.getElementById('analytics-container');
        if (!container) return;

        // Simple analytics data
        const revenueData = this.getRevenueData();
        const popularProducts = this.getPopularProducts();

        container.innerHTML = `
            <div class="section-header">
                <h2>Sales Analytics</h2>
            </div>
            <div class="analytics-grid">
                <div class="analytics-card">
                    <h3>Revenue Last 30 Days</h3>
                    <div class="revenue-chart">
                        ${revenueData.map(day => `
                            <div class="bar-container">
                                <div class="bar" style="height: ${(day.revenue / 1000) * 100}%"></div>
                                <span>$${day.revenue}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="analytics-card">
                    <h3>Popular Products</h3>
                    <div class="products-list">
                        ${popularProducts.map(product => `
                            <div class="product-item">
                                <span>${product.name}</span>
                                <span>${product.orders} orders</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    getRevenueData() {
        // Generate sample revenue data for last 7 days
        return Array.from({length: 7}, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            return {
                date: date.toLocaleDateString(),
                revenue: Math.floor(Math.random() * 1000) + 500
            };
        });
    }

    getPopularProducts() {
        // Get product order counts
        const productOrders = {};
        this.orders.forEach(order => {
            order.items.forEach(item => {
                if (!productOrders[item.id]) {
                    productOrders[item.id] = 0;
                }
                productOrders[item.id] += item.quantity;
            });
        });

        return Object.entries(productOrders)
            .map(([id, orders]) => {
                const product = this.products.find(p => p.id == id);
                return {
                    name: product ? product.name : `Product ${id}`,
                    orders: orders
                };
            })
            .sort((a, b) => b.orders - a.orders)
            .slice(0, 5);
    }

    attachEventListeners() {
        // Product management
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-product')) {
                this.deleteProduct(e.target.getAttribute('data-id'));
            } else if (e.target.classList.contains('edit-product')) {
                this.editProduct(e.target.getAttribute('data-id'));
            }
        });

        // Order management
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('status-select')) {
                this.updateOrderStatus(e.target.getAttribute('data-id'), e.target.value);
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-order')) {
                this.deleteOrder(e.target.getAttribute('data-id'));
            }
        });

        // Content management
        const contentForm = document.getElementById('content-form');
        if (contentForm) {
            contentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateSiteContent(new FormData(contentForm));
            });
        }

        // Feedback management
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-testimonial')) {
                this.deleteTestimonial(e.target.getAttribute('data-id'));
            } else if (e.target.classList.contains('approve-testimonial')) {
                this.approveTestimonial(e.target.getAttribute('data-id'));
            }
        });

        // Add product button
        const addProductBtn = document.getElementById('add-product-btn');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => {
                this.showAddProductModal();
            });
        }
    }

    deleteProduct(productId) {
        if (confirm('Are you sure you want to delete this product?')) {
            this.products = this.products.filter(p => p.id != productId);
            this.saveProducts();
            this.loadProducts();
            this.showMessage('Product deleted successfully', 'success');
        }
    }

    editProduct(productId) {
        // In a real implementation, show edit modal
        this.showMessage('Edit functionality would open a modal here', 'info');
    }

    updateOrderStatus(orderId, status) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            order.status = status;
            this.saveOrders();
            this.showMessage(`Order ${orderId} status updated to ${status}`, 'success');
        }
    }

    deleteOrder(orderId) {
        if (confirm('Are you sure you want to delete this order?')) {
            this.orders = this.orders.filter(o => o.id !== orderId);
            this.saveOrders();
            this.loadOrders();
            this.showMessage('Order deleted successfully', 'success');
        }
    }

    updateSiteContent(formData) {
        const content = Object.fromEntries(formData);
        localStorage.setItem('site-content', JSON.stringify(content));
        this.showMessage('Site content updated successfully', 'success');
        
        // Push to live site (simulated)
        this.pushToLive();
    }

    deleteTestimonial(testimonialId) {
        if (confirm('Are you sure you want to delete this testimonial?')) {
            this.testimonials = this.testimonials.filter(t => t.id != testimonialId);
            this.saveTestimonials();
            this.loadFeedback();
            this.showMessage('Testimonial deleted successfully', 'success');
        }
    }

    approveTestimonial(testimonialId) {
        const testimonial = this.testimonials.find(t => t.id == testimonialId);
        if (testimonial) {
            testimonial.approved = true;
            this.saveTestimonials();
            this.showMessage('Testimonial approved and published', 'success');
            
            // Push to live site
            this.pushToLive();
        }
    }

    showAddProductModal() {
        // In a real implementation, show a modal form for adding products
        this.showMessage('Add product modal would open here', 'info');
    }

    pushToLive() {
        // Simulate pushing content to live site
        this.showMessage('Content pushed to live site successfully', 'success');
        
        // In real implementation, this would sync with Firebase
        console.log('Content pushed to live site:', {
            products: this.products,
            content: JSON.parse(localStorage.getItem('site-content')),
            testimonials: this.testimonials.filter(t => t.approved)
        });
    }

    saveProducts() {
        localStorage.setItem('cms-products', JSON.stringify(this.products));
        // Also update main site products
        localStorage.setItem('products', JSON.stringify(this.products));
    }

    saveOrders() {
        localStorage.setItem('orders', JSON.stringify(this.orders));
    }

    saveTestimonials() {
        localStorage.setItem('testimonials', JSON.stringify(this.testimonials));
    }

    showMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `cms-message cms-message-${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 2rem;
            border-radius: 4px;
            z-index: 1000;
            color: white;
            font-weight: 500;
        `;

        if (type === 'success') {
            messageDiv.style.backgroundColor = '#27ae60';
        } else if (type === 'error') {
            messageDiv.style.backgroundColor = '#e74c3c';
        } else {
            messageDiv.style.backgroundColor = '#3498db';
        }

        document.body.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
}

// Initialize CMS manager when on CMS pages
if (window.location.pathname.includes('cms/')) {
    document.addEventListener('DOMContentLoaded', () => {
        new CMSManager();
    });
}