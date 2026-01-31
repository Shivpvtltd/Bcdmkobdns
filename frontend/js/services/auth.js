/**
 * Authentication Service
 * Firebase authentication with backend integration
 */

import { auth, googleProvider } from './firebase-config.js';
import { 
    signInWithPopup, 
    signOut, 
    onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

let currentUser = null;
let idToken = null;
let authListeners = [];
let signInInProgress = false;

function onAuthChange(callback) {
    authListeners.push(callback);
    callback(currentUser);
    
    return () => {
        authListeners = authListeners.filter(cb => cb !== callback);
    };
}

function notifyListeners() {
    authListeners.forEach(callback => {
        try {
            callback(currentUser);
        } catch (error) {
            console.error('Auth listener error:', error);
        }
    });
}

function initAuth() {
    onAuthStateChanged(auth, async (user) => {
        currentUser = user;
        
        if (user) {
            try {
                idToken = await user.getIdToken(true);
            } catch (error) {
                console.error('Error getting ID token:', error);
                idToken = null;
            }
        } else {
            idToken = null;
        }
        
        notifyListeners();
    });
}

async function signInWithGoogle() {
    if (signInInProgress) {
        console.log('Sign-in already in progress, skipping duplicate request');
        return {
            success: false,
            error: 'Sign-in already in progress'
        };
    }
    
    signInInProgress = true;
    
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return {
            success: true,
            user: result.user
        };
    } catch (error) {
        console.error('Sign in error:', error.code, error.message);
        
        if (error.code === 'auth/cancelled-popup-request') {
            console.log('Popup request was cancelled - likely duplicate request');
        } else if (error.code === 'auth/popup-closed-by-user') {
            console.log('User closed the sign-in popup');
        } else if (error.code === 'auth/network-request-failed') {
            console.log('Network error during sign-in');
        }
        
        return {
            success: false,
            error: error.message,
            code: error.code
        };
    } finally {
        signInInProgress = false;
    }
}

async function signOutUser() {
    try {
        await signOut(auth);
        return { success: true };
    } catch (error) {
        console.error('Sign out error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

function getCurrentUser() {
    return currentUser;
}

async function getIdToken() {
    if (!currentUser) return null;
    
    try {
        return await currentUser.getIdToken(true);
    } catch (error) {
        console.error('Error getting ID token:', error);
        return null;
    }
}

function isAuthenticated() {
    return currentUser !== null;
}

function getUserName() {
    return currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Anonymous';
}

function getUserEmail() {
    return currentUser?.email || '';
}

function getUserPhoto() {
    return currentUser?.photoURL || null;
}

function getUserId() {
    return currentUser?.uid || null;
}

function requireAuth(redirectUrl = window.location.pathname) {
    if (!isAuthenticated()) {
        sessionStorage.setItem('redirectAfterSignIn', redirectUrl);
        showToast('Please sign in to access this page', 'warning');
        return false;
    }
    return true;
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'toast-out 0.5s ease forwards';
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 4000);
}

if (!document.querySelector('#toast-animation-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-animation-styles';
    style.innerHTML = `
        @keyframes toast-out {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(100%);
            }
        }
    `;
    document.head.appendChild(style);
}

initAuth();

export {
    signInWithGoogle,
    signOutUser,
    getCurrentUser,
    getIdToken,
    isAuthenticated,
    getUserName,
    getUserEmail,
    getUserPhoto,
    getUserId,
    onAuthChange,
    requireAuth,
    showToast
};