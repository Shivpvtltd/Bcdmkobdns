/**
 * My Apps Page
 * List of user's submitted apps
 */

import { appsApi } from '../services/api.js';
import { isAuthenticated, signInWithGoogle, showToast } from '../services/auth.js';
import { escapeHtml } from '../components/appCard.js';
import router from '../router.js';

const myAppsPage = {
    name: 'myApps',
    
    async render() {
        if (!isAuthenticated()) {
            return `
                <header class="page-header">
                    <div class="page-header-content">
                        <h1 class="page-title">My Apps</h1>
                        <p class="page-subtitle">Manage your submitted apps</p>
                    </div>
                </header>
                <main class="page-content">
                    <div class="empty-state">
                        <div class="empty-icon">🔐</div>
                        <h3>Authentication Required</h3>
                        <p>You need to be signed in to view your apps.</p>
                        <button id="signInToViewMyAppsBtn" class="btn btn-primary" style="margin-top: 16px;">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            Sign In with Google
                        </button>
                    </div>
                </main>
            `;
        }

        return `
            <header class="page-header">
                <div class="page-header-content">
                    <h1 class="page-title">My Apps</h1>
                    <p class="page-subtitle">Manage your submitted apps</p>
                </div>
            </header>
            
            <main class="page-content">
                <div id="loadingState" class="apps-list">
                    ${Array(3).fill(0).map(() => `
                        <div class="my-app-card skeleton" style="border: none; box-shadow: none;">
                            <div class="skeleton-logo" style="width: 80px; height: 80px; border-radius: 12px;"></div>
                            <div style="flex: 1;">
                                <div class="skeleton-text" style="width: 60%; height: 20px; margin-bottom: 12px;"></div>
                                <div class="skeleton-text" style="width: 30%; height: 16px; margin-bottom: 16px;"></div>
                                <div class="skeleton-text" style="width: 80%; height: 14px;"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="apps-list" id="appsList" style="display: none;"></div>
                
                <div class="empty-state" id="emptyState" style="display: none;">
                    <div class="empty-icon">📱</div>
                    <h3>No apps yet</h3>
                    <p>You haven't submitted any apps yet.</p>
                    <a href="/add-app" class="btn btn-primary" style="margin-top: 16px;" data-route="/add-app">Add Your First App</a>
                </div>
            </main>
            
            <footer class="footer">
                <div class="footer-content">
                    <div class="footer-brand">
                        <a href="/" class="logo" data-route="/">
                            <img src="assets/images/icon.png" alt="UPlayG" class="logo-img">
                            <span class="logo-text">UPlayG</span>
                        </a>
                        <p class="footer-tagline">Discover and share amazing apps</p>
                    </div>
                    <div class="footer-links">
                        <a href="/" data-route="/">Home</a>
                        <a href="/browse" data-route="/browse">Browse</a>
                        <a href="/add-app" data-route="/add-app">Add App</a>
                    </div>
                </div>
                <div class="footer-bottom">
                    <p>&copy; ${new Date().getFullYear()} UPlayG. All rights reserved.</p>
                </div>
            </footer>
        `;
    },
    
    async mount() {
        if (!isAuthenticated()) {
            document.getElementById('signInToViewMyAppsBtn')?.addEventListener('click', async () => {
                const result = await signInWithGoogle();
                if (result.success) {
                    router.handleRoute(window.location.pathname);
                }
            });
            return;
        }
        
        this.loadApps();
    },
    
    async loadApps() {
        try {
            const response = await appsApi.getMyApps();
            const apps = response.data || [];
            
            document.getElementById('loadingState').style.display = 'none';
            
            if (apps.length === 0) {
                document.getElementById('emptyState').style.display = 'block';
                return;
            }
            
            const appsList = document.getElementById('appsList');
            appsList.innerHTML = apps.map(app => this.renderAppCard(app)).join('');
            appsList.style.display = 'flex';
            
            appsList.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const appId = e.currentTarget.dataset.appId;
                    const appName = e.currentTarget.dataset.appName;
                    this.confirmDelete(appId, appName);
                });
            });
        } catch (error) {
            console.error('Failed to load apps:', error);
            showToast('Failed to load your apps', 'error');
            
            document.getElementById('loadingState').style.display = 'none';
            const emptyState = document.getElementById('emptyState');
            if (emptyState) {
                emptyState.style.display = 'block';
                emptyState.querySelector('h3').textContent = 'Error loading apps';
                emptyState.querySelector('p').textContent = 'Please try again later';
            }
        }
    },
    
    renderAppCard(app) {
        const logoUrl = app.logoURL || 'assets/images/icon.png';
        const statusClass = `status-${app.status}`;
        const statusText = app.status.charAt(0).toUpperCase() + app.status.slice(1);
        const createdDate = app.createdAt ? this.formatDate(app.createdAt) : 'Unknown';
        
        return `
            <div class="my-app-card" data-app-id="${app.id}">
                <img src="${logoUrl}" alt="${escapeHtml(app.appName)}" class="my-app-logo" loading="lazy" onerror="this.src='assets/images/icon.png'">
                <div class="my-app-info">
                    <h3 class="my-app-name">${escapeHtml(app.appName)}</h3>
                    <span class="my-app-status ${statusClass}">${statusText}</span>
                    <p class="my-app-meta">${escapeHtml(app.category || 'Uncategorized')} • Created ${createdDate}</p>
                    <div class="my-app-actions">
                        <a href="/app/${app.id}" class="btn btn-primary" data-route="/app/${app.id}">View</a>
                        <a href="/edit-app/${app.id}" class="btn btn-secondary" data-route="/edit-app/${app.id}">Edit</a>
                        <button type="button" class="btn btn-secondary btn-delete" data-app-id="${app.id}" data-app-name="${escapeHtml(app.appName)}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },
    
    confirmDelete(appId, appName) {
        if (confirm(`Are you sure you want to delete "${appName}"? This action cannot be undone.`)) {
            this.deleteApp(appId);
        }
    },
    
    async deleteApp(appId) {
        try {
            await appsApi.deleteApp(appId);
            
            const card = document.querySelector(`.my-app-card[data-app-id="${appId}"]`);
            if (card) {
                card.remove();
            }
            
            showToast('App deleted successfully', 'success');
            
            const remainingCards = document.querySelectorAll('.my-app-card');
            if (remainingCards.length === 0) {
                document.getElementById('appsList').style.display = 'none';
                document.getElementById('emptyState').style.display = 'block';
            }
        } catch (error) {
            console.error('Delete error:', error);
            showToast(error.message || 'Failed to delete app', 'error');
        }
    },
    
    formatDate(dateString) {
        if (!dateString) return 'Unknown';
        
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) return 'today';
        if (days === 1) return 'yesterday';
        if (days < 7) return `${days} days ago`;
        if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
        
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }
};

export default myAppsPage;