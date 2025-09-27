// Authentication functionality
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAdmin = false;
        this.init();
    }

    init() {
        this.checkAuthState();
        this.attachAuthListeners();
    }

    checkAuthState() {
        // Check if user is logged in (from localStorage)
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            this.currentUser = JSON.parse(userData);
            this.updateUI();
        }

        // Check for admin access
        this.isAdmin = localStorage.getItem('isAdmin') === 'true';
    }

    attachAuthListeners() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Register form
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }

        // Logout functionality
        const logoutBtn = document.getElementById('logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        }

        // CMS login
        const cmsLoginBtn = document.querySelector('.cms-login .btn-outline');
        if (cmsLoginBtn) {
            cmsLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = 'cms/login.html';
            });
        }
    }

    handleLogin() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        // Basic validation
        if (!this.validateEmail(email)) {
            this.showMessage('Please enter a valid email address', 'error');
            return;
        }

        if (password.length < 6) {
            this.showMessage('Password must be at least 6 characters', 'error');
            return;
        }

        // Simulate API call - in real implementation, use Firebase Auth
        this.simulateLogin(email, password);
    }

    handleRegister() {
        const firstName = document.getElementById('register-firstname').value;
        const lastName = document.getElementById('register-lastname').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm').value;
        const terms = document.getElementById('terms').checked;

        // Validation
        if (!firstName || !lastName) {
            this.showMessage('Please enter your name', 'error');
            return;
        }

        if (!this.validateEmail(email)) {
            this.showMessage('Please enter a valid email address', 'error');
            return;
        }

        if (password.length < 6) {
            this.showMessage('Password must be at least 6 characters', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showMessage('Passwords do not match', 'error');
            return;
        }

        if (!terms) {
            this.showMessage('Please accept the terms and conditions', 'error');
            return;
        }

        // Simulate API call
        this.simulateRegister({ firstName, lastName, email, password });
    }

    simulateLogin(email, password) {
        // Simulate API delay
        this.showMessage('Logging in...', 'info');

        setTimeout(() => {
            // Check for admin login
            if (email === 'admin@timemachine.com' && password === 'admin123') {
                this.currentUser = {
                    email: email,
                    firstName: 'Admin',
                    lastName: 'User',
                    isAdmin: true
                };
                this.isAdmin = true;
                localStorage.setItem('isAdmin', 'true');
            } else {
                // Regular user login
                this.currentUser = {
                    email: email,
                    firstName: 'John', // In real app, get from database
                    lastName: 'Doe',
                    isAdmin: false
                };
                this.isAdmin = false;
                localStorage.setItem('isAdmin', 'false');
            }

            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            this.showMessage('Login successful!', 'success');
            
            // Redirect after successful login
            setTimeout(() => {
                if (this.isAdmin) {
                    window.location.href = 'cms/dashboard.html';
                } else {
                    window.location.href = 'index.html';
                }
            }, 1000);

        }, 1000);
    }

    simulateRegister(userData) {
        this.showMessage('Creating account...', 'info');

        setTimeout(() => {
            // Check if user already exists
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const existingUser = users.find(u => u.email === userData.email);

            if (existingUser) {
                this.showMessage('User with this email already exists', 'error');
                return;
            }

            // Add new user
            users.push({
                ...userData,
                id: Date.now(),
                createdAt: new Date().toISOString()
            });

            localStorage.setItem('users', JSON.stringify(users));
            this.showMessage('Account created successfully!', 'success');

            // Auto-login after registration
            setTimeout(() => {
                this.simulateLogin(userData.email, userData.password);
            }, 1000);

        }, 1000);
    }

    handleLogout() {
        this.currentUser = null;
        this.isAdmin = false;
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isAdmin');
        
        this.showMessage('Logged out successfully', 'success');
        
        // Redirect to home page
        setTimeout(() => {
            if (window.location.pathname.includes('cms')) {
                window.location.href = '../index.html';
            } else {
                window.location.href = 'index.html';
            }
        }, 1000);
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    showMessage(message, type) {
        // Remove existing messages
        const existingMessage = document.querySelector('.auth-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `auth-message auth-message-${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            padding: 1rem;
            margin: 1rem 0;
            border-radius: 4px;
            text-align: center;
            font-weight: 500;
        `;

        // Style based on type
        if (type === 'error') {
            messageDiv.style.backgroundColor = '#fee';
            messageDiv.style.color = '#c33';
            messageDiv.style.border = '1px solid #fcc';
        } else if (type === 'success') {
            messageDiv.style.backgroundColor = '#efe';
            messageDiv.style.color = '#363';
            messageDiv.style.border = '1px solid #cfc';
        } else {
            messageDiv.style.backgroundColor = '#eef';
            messageDiv.style.color = '#336';
            messageDiv.style.border = '1px solid #ccf';
        }

        // Insert after the first h1 or at the top of the form
        const form = document.querySelector('.auth-form');
        if (form) {
            const h1 = form.querySelector('h1');
            if (h1) {
                h1.parentNode.insertBefore(messageDiv, h1.nextSibling);
            } else {
                form.insertBefore(messageDiv, form.firstChild);
            }
        }
    }

    updateUI() {
        const authButtons = document.querySelector('.auth-buttons');
        const userInfo = document.querySelector('.user-info');

        if (this.currentUser && authButtons) {
            authButtons.innerHTML = `
                <span>Welcome, ${this.currentUser.firstName}</span>
                <a href="#" id="logout" class="login-btn">Logout</a>
            `;

            // Re-attach logout listener
            const logoutBtn = document.getElementById('logout');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.handleLogout();
                });
            }
        }

        if (this.currentUser && userInfo) {
            userInfo.innerHTML = `
                <span>${this.currentUser.firstName} ${this.currentUser.lastName}</span>
                <a href="#" id="logout">Logout</a>
            `;

            // Re-attach logout listener
            const logoutBtn = document.getElementById('logout');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.handleLogout();
                });
            }
        }
    }

    // Protect CMS pages
    protectCMSPages() {
        if (window.location.pathname.includes('cms/')) {
            if (!this.isAdmin) {
                window.location.href = '../login.html';
                return false;
            }
        }
        return true;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if user is admin
    isUserAdmin() {
        return this.isAdmin;
    }
}

// Initialize auth manager
const authManager = new AuthManager();

// Protect CMS pages on load
document.addEventListener('DOMContentLoaded', () => {
    authManager.protectCMSPages();
});