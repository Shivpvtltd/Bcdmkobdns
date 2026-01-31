/**
 * Firebase Admin SDK Configuration
 * Centralized Firebase initialization and service access
 */

const admin = require('firebase-admin');

let db = null;
let storage = null;
let auth = null;

/**
 * Initialize Firebase Admin SDK
 */
function initializeFirebase() {
    try {
        // Check if already initialized
        if (admin.apps.length > 0) {
            console.log('Firebase Admin already initialized');
            db = admin.firestore();
            storage = admin.storage();
            auth = admin.auth();
            return;
        }

        // Use service account credentials from environment variable
        let serviceAccount;
        
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            // Parse service account from environment variable
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        } else {
            // Fallback: try to load from file
            try {
                serviceAccount = require('../serviceAccountKey.json');
            } catch (e) {
                console.warn('No Firebase service account found. Using application default credentials.');
            }
        }

        // Initialize the app
        if (serviceAccount) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'uplayg-1.firebasestorage.app'
            });
        } else {
            admin.initializeApp({
                storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'uplayg-1.firebasestorage.app'
            });
        }

        // Initialize services
        db = admin.firestore();
        storage = admin.storage();
        auth = admin.auth();

        // Configure Firestore settings
        db.settings({
            ignoreUndefinedProperties: true,
            timestampsInSnapshots: true
        });

        console.log('✅ Firebase Admin initialized successfully');
    } catch (error) {
        console.error('❌ Firebase Admin initialization error:', error);
        throw error;
    }
}

/**
 * Get Firestore database instance
 */
function getFirestore() {
    if (!db) {
        throw new Error('Firestore not initialized. Call initializeFirebase() first.');
    }
    return db;
}

/**
 * Get Storage instance
 */
function getStorage() {
    if (!storage) {
        throw new Error('Storage not initialized. Call initializeFirebase() first.');
    }
    return storage;
}

/**
 * Get Auth instance
 */
function getAuth() {
    if (!auth) {
        throw new Error('Auth not initialized. Call initializeFirebase() first.');
    }
    return auth;
}

/**
 * Verify Firebase ID Token
 */
async function verifyIdToken(idToken) {
    try {
        const decodedToken = await auth.verifyIdToken(idToken);
        return decodedToken;
    } catch (error) {
        console.error('Token verification error:', error);
        throw new Error('Invalid or expired token');
    }
}

/**
 * Get user by UID
 */
async function getUserByUid(uid) {
    try {
        const userRecord = await auth.getUser(uid);
        return userRecord;
    } catch (error) {
        console.error('Get user error:', error);
        return null;
    }
}

/**
 * Check if user is admin
 */
async function isAdmin(uid) {
    try {
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) return false;
        return userDoc.data().role === 'admin';
    } catch (error) {
        console.error('Admin check error:', error);
        return false;
    }
}

/**
 * Server timestamp
 */
function serverTimestamp() {
    return admin.firestore.FieldValue.serverTimestamp();
}

/**
 * Increment field value
 */
function increment(n) {
    return admin.firestore.FieldValue.increment(n);
}

/**
 * Array union
 */
function arrayUnion(...elements) {
    return admin.firestore.FieldValue.arrayUnion(...elements);
}

module.exports = {
    initializeFirebase,
    getFirestore,
    getStorage,
    getAuth,
    verifyIdToken,
    getUserByUid,
    isAdmin,
    serverTimestamp,
    increment,
    arrayUnion,
    admin
};
