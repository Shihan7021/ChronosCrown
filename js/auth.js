// Authentication functionality with Firebase
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAdmin = false;
        this.init();
    }

    async init() {
        await this.checkAuthState();
        this.attachAuthListeners();
    }

    async checkAuthState() {
        try {
            // Check Firebase authentication state
            if (firebaseHelper.isAvailable()) {
                return new Promise((resolve) => {
                    firebase.auth().onAuthStateChanged(async (user) => {
                        if (user) {
                            this.currentUser = user;
                            // Get additional user data from Firestore
                            await this.loadUserData(user.uid);
                            this.updateUI();
                        } else {
                            this.currentUser = null;
                            this.isAdmin = false;
                        }
                        resolve();
                    });
                });
            } else {
                // Fallback to localStorage if Firebase not available
                const userData = localStorage.getItem('currentUser');
                if (userData) {
                    this.currentUser = JSON.parse(userData);
                    this.isAdmin = localStorage.getItem('isAdmin') === 'true';
                    this.updateUI();
                }
            }
        } catch (error) {
            console.error('Error checking auth state:', error);
        }
    }

    async loadUserData(userId) {
        try {
            if (firebaseHelper.isAvailable()) {
                const userDoc = await firebaseDb.collection('users').doc(userId).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    this.isAdmin = userData.role === 'admin';
                    
                    // Store in localStorage as fallback
                    localStorage.setItem('currentUser', JSON.stringify({
                        uid: userId,
                        email: this.currentUser.email,
                        firstName: userData.firstName,
                        lastName: userData.lastName,
                        isAdmin: this.isAdmin
                    }));
                    localStorage.setItem('isAdmin', this.isAdmin.toString());
                }
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
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

    async handleLogin() {
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

        this.showMessage('Logging in...', 'info');

        try {
            if (firebaseHelper.isAvailable()) {
                // Firebase authentication
                const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
                this.currentUser = userCredential.user;
                
                // Load user data from Firestore
                await this.loadUserData(this.currentUser.uid);
                
                this.showMessage('Login successful!', 'success');
                
                // Redirect after successful login
                setTimeout(() => {
                    if (this.isAdmin) {
                        window.location.href = 'cms/dashboard.html';
                    } else {
                        window.location.href = 'index.html';
                    }
                }, 1000);
                
            } else {
                // Fallback to localStorage simulation
                this.simulateLogin(email, password);
            }
        } catch (error) {
            this.showMessage(this.getFirebaseError(error), 'error');
        }
    }

    async handleRegister() {
        const firstName = document.getElementById('register-firstname').value;
        const lastName = document.getElementById('register-lastname').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm').value;
        const terms = document.getElementById('terms').checked;

        // Validation
        if (!this.validateForm(firstName, lastName, email, password, confirmPassword, terms)) {
            return;
        }

        this.showMessage('Creating account...', 'info');

        try {
            if (firebaseHelper.isAvailable()) {
                // Firebase registration
                const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
                this.currentUser = userCredential.user;

                // Save user data to Firestore
                await firebaseDb.collection('users').doc(this.currentUser.uid).set({
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    role: 'customer',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                this.isAdmin = false;
                
                this.showMessage('Account created successfully!', 'success');
                
                // Auto-login after registration
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
                
            } else {
                // Fallback to localStorage simulation
                this.simulateRegister({ firstName, lastName, email, password });
            }
        } catch (error) {
            this.showMessage(this.getFirebaseError(error), 'error');
        }
    }

    async handleLogout() {
        try {
            if (firebaseHelper.isAvailable()) {
                await firebase.auth().signOut();
            }
            
            // Clear local data
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
            
        } catch (error) {
            this.showMessage('Error logging out: ' + error.message, 'error');
        }
    }

    // Firebase error message helper
    getFirebaseError(error) {
        switch (error.code) {
            case 'auth/invalid-email':
                return 'Invalid email address format.';
            case 'auth/user-disabled':
                return 'This account has been disabled.';
            case 'auth/user-not-found':
                return 'No account found with this email.';
            case 'auth/wrong-password':
                return 'Incorrect password.';
            case 'auth/email-already-in-use':
                return 'An account with this email already exists.';
            case 'auth/weak-password':
                return 'Password should be at least 6 characters.';
            case 'auth/network-request-failed':
                return 'Network error. Please check your connection.';
            default:
                return error.message || 'An error occurred. Please try again.';
        }
    }

   

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    validateForm(firstName, lastName, email, password, confirmPassword, terms) {
        if (!firstName || !lastName) {
            this.showMessage('Please enter your name', 'error');
            return false;
        }

        if (!this.validateEmail(email)) {
            this.showMessage('Please enter a valid email address', 'error');
            return false;
        }

        if (password.length < 6) {
            this.showMessage('Password must be at least 6 characters', 'error');
            return false;
        }

        if (password !== confirmPassword) {
            this.showMessage('Passwords do not match', 'error');
            return false;
        }

        if (!terms) {
            this.showMessage('Please accept the terms and conditions', 'error');
            return false;
        }

        return true;
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
            const displayName = this.currentUser.displayName || 
                              (this.currentUser.firstName ? `${this.currentUser.firstName}` : this.currentUser.email);
            
            authButtons.innerHTML = `
                <span>Welcome, ${displayName}</span>
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
            const displayName = this.currentUser.firstName && this.currentUser.lastName ? 
                              `${this.currentUser.firstName} ${this.currentUser.lastName}` : 
                              this.currentUser.email;
            
            userInfo.innerHTML = `
                <span>${displayName}</span>
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

    // Check if user is authenticated
    isAuthenticated() {
        return this.currentUser !== null;
    }

    // Get user ID
    getUserId() {
        return this.currentUser ? this.currentUser.uid || this.currentUser.id : null;
    }
}

// Initialize auth manager
const authManager = new AuthManager();

// Protect CMS pages on load
document.addEventListener('DOMContentLoaded', () => {
    authManager.protectCMSPages();
});

// Export for use in other files
window.authManager = authManager;