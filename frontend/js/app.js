/**
 * UPlayG App
 * Main application entry point
 */

import router from './router.js';
import { onAuthChange, signInWithGoogle, signOutUser } from './services/auth.js';

async function initApp() {
    await initAuthState();
    initNavigation();
    initSearch();
    initServiceWorker();
    console.log('🚀 UPlayG App initialized');
}

function initNavigation() {
    const menuToggle = document.getElementById('menuToggle');
    const menuClose = document.getElementById('menuClose');
    const menuOverlay = document.getElementById('menuOverlay');
    
    menuToggle?.addEventListener('click', openSideMenu);
    menuClose?.addEventListener('click', closeSideMenu);
    menuOverlay?.addEventListener('click', closeSideMenu);
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeSideMenu();
        }
    });
}

function openSideMenu() {
    const sideMenu = document.getElementById('sideMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    
    sideMenu?.classList.add('open');
    menuOverlay?.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeSideMenu() {
    const sideMenu = document.getElementById('sideMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    
    sideMenu?.classList.remove('open');
    menuOverlay?.classList.remove('open');
    document.body.style.overflow = '';
}

function initAuthState() {
    return new Promise((resolve) => {
        const signInBtn = document.getElementById('signInBtn');
        const signOutBtn = document.getElementById('signOutBtn');
        const sideMenuUser = document.getElementById('sideMenuUser');
        const userPhoto = document.getElementById('userPhoto');
        const userName = document.getElementById('userName');
        const userEmail = document.getElementById('userEmail');
        const myAppsMenuItem = document.getElementById('myAppsMenuItem');
        
        signInBtn?.addEventListener('click', async () => {
            const result = await signInWithGoogle();
            if (result.success) {
                closeSideMenu();
                const redirectUrl = sessionStorage.getItem('redirectAfterSignIn');
                if (redirectUrl) {
                    sessionStorage.removeItem('redirectAfterSignIn');
                    router.navigate(redirectUrl);
                }
            }
        });
        
        signOutBtn?.addEventListener('click', async () => {
            await signOutUser();
            closeSideMenu();
            router.navigate('/');
        });
        
        onAuthChange((user) => {
            if (user) {
                signInBtn.style.display = 'none';
                signOutBtn.style.display = 'flex';
                
                if (sideMenuUser) {
                    sideMenuUser.style.display = 'flex';
                    userPhoto.src = user.photoURL || 'assets/images/icon.png';
                    userPhoto.onerror = () => { userPhoto.src = 'assets/images/icon.png'; };
                    userName.textContent = user.displayName || 'Anonymous';
                    userEmail.textContent = user.email || '';
                }
                
                if (myAppsMenuItem) {
                    myAppsMenuItem.style.display = 'block';
                }
            } else {
                signInBtn.style.display = 'flex';
                signOutBtn.style.display = 'none';
                
                if (sideMenuUser) {
                    sideMenuUser.style.display = 'none';
                }
                
                if (myAppsMenuItem) {
                    myAppsMenuItem.style.display = 'none';
                }
            }
            
            resolve();
        });
    });
}

function initSearch() {
    const searchInput = document.getElementById('searchInput');
    
    if (!searchInput) return;
    
    let searchTimeout;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        
        const query = e.target.value.trim();
        
        if (query.length < 2) return;
        
        searchTimeout = setTimeout(() => {
            router.navigate(`/browse?q=${encodeURIComponent(query)}`);
        }, 500);
    });
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = e.target.value.trim();
            if (query.length >= 2) {
                router.navigate(`/browse?q=${encodeURIComponent(query)}`);
            }
        }
    });
}

function initServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('Service Workerd registered with scope:', registration.scope);
                    
                    registration.onupdatefound = () => {
                        const installingWorker = registration.installing;
                        if (installingWorker) {
                            installingWorker.onstatechange = () => {
                                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    showUpdateBar(installingWorker);
                                }
                            };
                        }
                    };
                })
                .catch(error => {
                    console.error('Service Worker registration failed:', error);
                });
        });
    }
}

function showUpdateBar(worker) {
    const updateBar = document.getElementById('updateNotification');
    const reloadButton = document.getElementById('reloadBtn');
    
    if (updateBar && reloadButton) {
        updateBar.style.display = 'flex';
        
        reloadButton.onclick = () => {
            worker.postMessage({ action: 'skipWaiting' });
        };
    }
    
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
    });
}

document.addEventListener('DOMContentLoaded', initApp);

window.UPlayG = {
    router,
    openSideMenu,
    closeSideMenu
};