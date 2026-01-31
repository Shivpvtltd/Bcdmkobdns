/**
 * Firebase Configuration
 * Client-side Firebase initialization
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBoFvMjv9vZtXIe1lnodlN27QDr164BsPI",
  authDomain: "uplayg-1.firebaseapp.com",
  projectId: "uplayg-1",
  storageBucket: "uplayg-1.firebasestorage.app",
  messagingSenderId: "271034906725",
  appId: "1:271034906725:web:4c7ff03f28150d6055ee8c",
  measurementId: "G-VM4H2H65H1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Configure Google Provider
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

// Add additional scopes
googleProvider.addScope('email');
googleProvider.addScope('profile');

export { app, auth, googleProvider };
