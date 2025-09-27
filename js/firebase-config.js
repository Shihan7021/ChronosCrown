// Firebase configuration (replace with your actual config)
const firebaseConfig = {
    apiKey: "your-api-key-here",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};

// Initialize Firebase
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    
    // Initialize Firebase services
    const auth = firebase.auth();
    const db = firebase.firestore();
    const storage = firebase.storage();
    
    // Firebase Auth state listener
    auth.onAuthStateChanged((user) => {
        if (user) {
            // User is signed in
            console.log('User signed in:', user.email);
            
            // Check if user is admin (you would typically check this in Firestore)
            const isAdmin = user.email === 'admin@timemachine.com';
            localStorage.setItem('isAdmin', isAdmin.toString());
            
            if (window.location.pathname.includes('cms/') && !isAdmin) {
                // Redirect non-admin users trying to access CMS
                window.location.href = '../index.html';
            }
        } else {
            // User is signed out
            console.log('User signed out');
            localStorage.removeItem('isAdmin');
            
            // Redirect from CMS pages if not authenticated
            if (window.location.pathname.includes('cms/')) {
                window.location.href = '../login.html';
            }
        }
    });
    
    // Export Firebase services for use in other files
    window.firebaseAuth = auth;
    window.firebaseDb = db;
    window.firebaseStorage = storage;
} else {
    console.warn('Firebase SDK not loaded. Using localStorage fallback.');
}

// Firebase helper functions
class FirebaseHelper {
    // Products
    static async getProducts() {
        if (window.firebaseDb) {
            try {
                const snapshot = await window.firebaseDb.collection('products').get();
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (error) {
                console.error('Error getting products:', error);
                return JSON.parse(localStorage.getItem('products')) || [];
            }
        }
        return JSON.parse(localStorage.getItem('products')) || [];
    }
    
    static async saveProduct(product) {
        if (window.firebaseDb) {
            try {
                if (product.id) {
                    await window.firebaseDb.collection('products').doc(product.id.toString()).set(product);
                } else {
                    const docRef = await window.firebaseDb.collection('products').add(product);
                    product.id = docRef.id;
                }
                return product;
            } catch (error) {
                console.error('Error saving product:', error);
            }
        }
        
        // Fallback to localStorage
        const products = JSON.parse(localStorage.getItem('products')) || [];
        if (product.id) {
            const index = products.findIndex(p => p.id === product.id);
            if (index > -1) {
                products[index] = product;
            } else {
                products.push(product);
            }
        } else {
            product.id = Date.now();
            products.push(product);
        }
        localStorage.setItem('products', JSON.stringify(products));
        return product;
    }
    
    // Orders
    static async getOrders() {
        if (window.firebaseDb) {
            try {
                const snapshot = await window.firebaseDb.collection('orders').get();
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (error) {
                console.error('Error getting orders:', error);
                return JSON.parse(localStorage.getItem('orders')) || [];
            }
        }
        return JSON.parse(localStorage.getItem('orders')) || [];
    }
    
    static async saveOrder(order) {
        if (window.firebaseDb) {
            try {
                const docRef = await window.firebaseDb.collection('orders').add(order);
                order.id = docRef.id;
                return order;
            } catch (error) {
                console.error('Error saving order:', error);
            }
        }
        
        // Fallback to localStorage
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        order.id = 'TM-' + Date.now().toString().slice(-6);
        orders.push(order);
        localStorage.setItem('orders', JSON.stringify(orders));
        return order;
    }
    
    // Testimonials
    static async getTestimonials() {
        if (window.firebaseDb) {
            try {
                const snapshot = await window.firebaseDb.collection('testimonials').where('approved', '==', true).get();
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (error) {
                console.error('Error getting testimonials:', error);
                return JSON.parse(localStorage.getItem('testimonials')) || [];
            }
        }
        return JSON.parse(localStorage.getItem('testimonials')) || [];
    }
    
    static async saveTestimonial(testimonial) {
        if (window.firebaseDb) {
            try {
                const docRef = await window.firebaseDb.collection('testimonials').add(testimonial);
                testimonial.id = docRef.id;
                return testimonial;
            } catch (error) {
                console.error('Error saving testimonial:', error);
            }
        }
        
        // Fallback to localStorage
        const testimonials = JSON.parse(localStorage.getItem('testimonials')) || [];
        testimonial.id = Date.now();
        testimonials.push(testimonial);
        localStorage.setItem('testimonials', JSON.stringify(testimonials));
        return testimonial;
    }
}

// Make FirebaseHelper available globally
window.FirebaseHelper = FirebaseHelper;