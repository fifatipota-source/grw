/**
 * ============================================
 * Firebase Configuration
 * ============================================
 */

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBglbsNUnOUUB1R4nuAxVnAVgTObdtu2G8",
    authDomain: "game-review-website-1bf16.firebaseapp.com",
    projectId: "game-review-website-1bf16",
    storageBucket: "game-review-website-1bf16.firebasestorage.app",
    messagingSenderId: "586974085336",
    appId: "1:586974085336:web:2805a78a4720768a5f97ad"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const db = firebase.firestore();

// Auth is only available on pages that include firebase-auth-compat.js
let auth = null;
try {
    auth = firebase.auth();
} catch (e) {
    // Auth not loaded on this page - that's OK for public pages
}

// ============================================
// Admin Emails - ADD YOUR EMAILS HERE
// ============================================
// Only these emails can access the admin panel
const ADMIN_EMAILS = [
    "fifatipota@gmail.com",       // Your email
    "friend2@gmail.com",          // Replace with friend 2's email
    "friend3@gmail.com"           // Replace with friend 3's email
];

// ============================================
// Auth Functions
// ============================================

/**
 * Check if user is an admin
 */
function isAdmin(user) {
    return user && ADMIN_EMAILS.includes(user.email);
}

/**
 * Auth state observer
 */
function onAuthStateChanged(callback) {
    if (!auth) return () => {};
    return auth.onAuthStateChanged(callback);
}

/**
 * Sign in with email and password
 */
async function signIn(email, password) {
    if (!auth) return { success: false, error: 'Auth not available' };
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        return { success: true, user: userCredential.user };
    } catch (error) {
        console.error("Sign in error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Sign out
 */
async function signOut() {
    if (!auth) return { success: false, error: 'Auth not available' };
    try {
        await auth.signOut();
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Make functions globally available
window.firebaseAuth = {
    isAdmin,
    onAuthStateChanged,
    signIn,
    signOut,
    auth
};
