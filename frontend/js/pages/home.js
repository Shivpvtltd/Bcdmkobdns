/**
 * Home Page
 * Main landing page with hero slider, categories, and featured apps
 */

import HeroSlider from '../components/heroSlider.js';
import { createAppCard, createSkeletonCard } from '../components/appCard.js';
import { appsApi, categoriesApi } from '../services/api.js';
import { cache } from '../services/storage.js';

const homePage = {
    name: 'home',
    
    async render() {
        return `
            <!-- Hero Slider -->
            <section class="hero-slider" id="heroSlider"></section>
            
            <!-- Categories Section -->
            <section class="categories-section">
                <div class="container">
                    <div class="section-header">
                        <div>
                            <h2 class="section-title">Categories</h2>
                            <p class="section-subtitle">Browse apps by category</p>
                        </div>
                    </div>
                    <div class="category-grid" id="categoryGrid">
                        ${this.renderCategorySkeletons()}
                    </div>
                </div>
            </section>
            
            <!-- Featured Apps Section -->
            <section class="apps-section">
                <div class="container">
                    <div class="section-header">
                        <div>
                            <h2 class="section-title">Featured Apps</h2>
                            <p class="section-subtitle">Discover the latest and greatest</p>
                        </div>
                        <div class="filter-tabs">
                            <button class="filter-tab active" data-filter="all">All</button>
                            <button class="filter-tab" data-filter="games">Games</button>
                            <button class="filter-tab" data-filter="apps">Apps</button>
                        </div>
                    </div>
                    
                    <!-- Skeleton Loader -->
                    <div class="apps-grid skeleton-grid" id="skeletonGrid">
                        ${this.renderAppSkeletons()}
                    </div>
                    
                    <!-- Apps Grid -->
                    <div class="apps-grid" id="appsGrid" style="display: none;"></div>
                    
                    <!-- Empty State -->
                    <div class="empty-state" id="emptyState" style="display: none;">
                        <div class="empty-icon">📱</div>
                        <h3>No apps found</h3>
                        <p>Be the first to add an app!</p>
                        <a href="/add-app" class="btn btn-primary" data-route="/add-app">Add Your App</a>
                    </div>
                </div>
            </section>
            
            <!-- Footer -->
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
    
    renderCategorySkeletons() {
        return Array(6).fill(0).map(() => `
            <div class="category-card skeleton">
                <div class="skeleton-logo" style="width: 32px; height: 32px;"></div>
                <div class="skeleton-text short" style="width: 60%;"></div>
            </div>
        `).join('');
    },
    
    renderAppSkeletons() {
        return Array(8).fill(0).map(() => {
            const card = createSkeletonCard();
            return card.outerHTML;
        }).join('');
    },
    
    async mount() {
        // Initialize hero slider
        new HeroSlider('heroSlider');
        
        // Load categories
        this.loadCategories();
        
        // Load apps
        this.loadApps();
        
        // Attach filter events
        this.attachFilterEvents();
    },
    
    async loadCategories() {
        try {
            // Check cache first
            let categories = cache.get('categories');
            
            if (!categories) {
                const response = await categoriesApi.getCategories();
                categories = response.data || [];
                cache.set('categories', categories, 60); // Cache for 60 minutes
            }
            
            const grid = document.getElementById('categoryGrid');
            if (grid && categories.length > 0) {
                grid.innerHTML = categories.map(cat => `
                    <a href="/browse?category=${cat.id}" class="category-card" data-route="/browse?category=${cat.id}">
                        <div class="category-icon">${cat.icon}</div>
                        <span class="category-name">${cat.name}</span>
                    </a>
                `).join('');
            }
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    },
    
    async loadApps() {
        try {
            const skeletonGrid = document.getElementById('skeletonGrid');
            const appsGrid = document.getElementById('appsGrid');
            const emptyState = document.getElementById('emptyState');
            
            // Check cache first
            let apps = cache.get('featured_apps');
            
            if (!apps) {
                const response = await appsApi.getApps({ limit: 12 });
                apps = response.data || [];
                cache.set('featured_apps', apps, 5); // Cache for 5 minutes
            }
            
            if (skeletonGrid) skeletonGrid.style.display = 'none';
            
            if (apps.length === 0) {
                if (emptyState) emptyState.style.display = 'block';
                if (appsGrid) appsGrid.style.display = 'none';
                return;
            }
            
            if (appsGrid) {
                appsGrid.innerHTML = '';
                apps.forEach(app => {
                    appsGrid.appendChild(createAppCard(app));
                });
                appsGrid.style.display = 'grid';
            }
            
            if (emptyState) emptyState.style.display = 'none';
            
            // Store apps for filtering
            this.allApps = apps;
        } catch (error) {
            console.error('Failed to load apps:', error);
            const skeletonGrid = document.getElementById('skeletonGrid');
            const emptyState = document.getElementById('emptyState');
            
            if (skeletonGrid) skeletonGrid.style.display = 'none';
            if (emptyState) {
                emptyState.style.display = 'block';
                emptyState.querySelector('h3').textContent = 'Failed to load apps';
                emptyState.querySelector('p').textContent = 'Please try again later';
            }
        }
    },
    
    attachFilterEvents() {
        const filterTabs = document.querySelectorAll('.filter-tab');
        
        filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Update active state
                filterTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Filter apps
                const filter = tab.dataset.filter;
                this.filterApps(filter);
            });
        });
    },
    
    filterApps(filter) {
        if (!this.allApps) return;
        
        const appsGrid = document.getElementById('appsGrid');
        if (!appsGrid) return;
        
        let filteredApps = this.allApps;
        
        if (filter === 'games') {
            filteredApps = this.allApps.filter(app => 
                app.category?.toLowerCase() === 'games'
            );
        } else if (filter === 'apps') {
            filteredApps = this.allApps.filter(app => 
                app.category?.toLowerCase() !== 'games'
            );
        }
        
        appsGrid.innerHTML = '';
        
        if (filteredApps.length === 0) {
            const emptyState = document.getElementById('emptyState');
            if (emptyState) {
                emptyState.style.display = 'block';
                emptyState.querySelector('h3').textContent = 'No apps found';
                emptyState.querySelector('p').textContent = `No ${filter} apps available`;
            }
            appsGrid.style.display = 'none';
        } else {
            filteredApps.forEach(app => {
                appsGrid.appendChild(createAppCard(app));
            });
            appsGrid.style.display = 'grid';
            const emptyState = document.getElementById('emptyState');
            if (emptyState) emptyState.style.display = 'none';
        }
    }
};

export default homePage;
