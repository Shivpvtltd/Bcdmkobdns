/**
 * Router
 * Client-side routing for single-page application
 */

// Import pages
import homePage from './pages/home.js';
import appDetailPage from './pages/appDetail.js';
import notFoundPage from './pages/notFound.js';

// Route definitions
const routes = {
    '/': homePage,
    '/browse': homePage, // Reuse home for browse with filters
    '/app/:id': appDetailPage,
};

// Lazy-loaded pages
const lazyRoutes = {
    '/add-app': () => import('./pages/addApp.js').then(module => module.default),
    '/my-apps': () => import('./pages/myApps.js').then(module => module.default),
    '/edit-app/:id': () => import('./pages/editApp.js').then(module => module.default),
};

class Router {
    constructor() {
        this.currentRoute = null;
        this.currentPage = null;
        this.params = {};
        this.beforeHooks = [];
        this.afterHooks = [];
        
        // Initialize with a slight delay to ensure DOM is ready
        setTimeout(() => this.init(), 0);
    }
    
    init() {
        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            this.handleRoute(window.location.pathname + window.location.search);
        });
        
        // Handle link clicks
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[data-route]');
            if (link) {
                e.preventDefault();
                const href = link.getAttribute('href');
                this.navigate(href);
            }
        });
        
        // Initial route
        this.handleRoute(window.location.pathname + window.location.search);
    }
    
    /**
     * Navigate to a route
     */
    navigate(path, pushState = true) {
        if (pushState) {
            history.pushState(null, '', path);
        }
        
        this.handleRoute(path);
    }
    
    /**
     * Handle route change
     */
    async handleRoute(path) {
        // Parse path and query
        const [pathname, search] = path.split('?');
        const queryParams = new URLSearchParams(search || '');
        
        // Find matching route
        const { page, params } = await this.matchRoute(pathname);
        
        // Run before hooks
        for (const hook of this.beforeHooks) {
            const result = await hook(pathname, params);
            if (result === false) return;
        }
        
        // Unmount current page
        if (this.currentPage && this.currentPage.unmount) {
            this.currentPage.unmount();
        }
        
        // Update state
        this.currentRoute = pathname;
        this.params = { ...params, query: queryParams };
        
        // Render new page
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            // Clear content
            mainContent.innerHTML = '';
            
            // Get page content
            let pageContent;
            if (typeof page === 'function') {
                // Page is a function (async lazy-loaded)
                pageContent = await page(this.params);
            } else if (typeof page.render === 'function') {
                // Page is an object with render method
                pageContent = await page.render(this.params);
            } else {
                // Page is static content
                pageContent = page;
            }
            
            // Insert content
            if (typeof pageContent === 'string') {
                mainContent.innerHTML = pageContent;
            } else if (pageContent instanceof HTMLElement) {
                mainContent.appendChild(pageContent);
            } else if (pageContent && pageContent.nodeType) {
                mainContent.appendChild(pageContent);
            }
            
            // Mount page
            this.currentPage = page;
            if (page && page.mount) {
                await page.mount(this.params);
            }
        }
        
        // Run after hooks
        for (const hook of this.afterHooks) {
            await hook(pathname, params);
        }
        
        // Update active nav links
        this.updateActiveNavLinks(pathname);
        
        // Scroll to top
        window.scrollTo(0, 0);
    }
    
    /**
     * Match route pattern
     */
    async matchRoute(pathname) {
        // Check exact matches first
        if (routes[pathname]) {
            return { page: routes[pathname], params: {} };
        }
        
        // Check pattern matches
        for (const [pattern, page] of Object.entries(routes)) {
            const match = this.matchPattern(pathname, pattern);
            if (match) {
                return { page, params: match };
            }
        }
        
        // Check lazy-loaded routes
        for (const [pattern, loader] of Object.entries(lazyRoutes)) {
            const match = this.matchPattern(pathname, pattern);
            if (match) {
                try {
                    // Load the page module
                    const pageModule = await loader();
                    return { page: pageModule, params: match };
                } catch (error) {
                    console.error(`Failed to load route ${pattern}:`, error);
                    return { page: notFoundPage, params: {} };
                }
            }
        }
        
        // No route found
        return { page: notFoundPage, params: {} };
    }
    
    /**
     * Match URL pattern with params
     */
    matchPattern(pathname, pattern) {
        const patternParts = pattern.split('/');
        const pathParts = pathname.split('/');
        
        if (patternParts.length !== pathParts.length) {
            return null;
        }
        
        const params = {};
        
        for (let i = 0; i < patternParts.length; i++) {
            const patternPart = patternParts[i];
            const pathPart = pathParts[i];
            
            if (patternPart.startsWith(':')) {
                // Param
                params[patternPart.slice(1)] = decodeURIComponent(pathPart);
            } else if (patternPart !== pathPart) {
                // Static part doesn't match
                return null;
            }
        }
        
        return params;
    }
    
    /**
     * Update active navigation links
     */
    updateActiveNavLinks(pathname) {
        document.querySelectorAll('.menu-link, .nav-link').forEach(link => {
            const route = link.getAttribute('data-route');
            if (route) {
                const routePath = route.split('?')[0];
                if (pathname === routePath || pathname.startsWith(routePath + '/')) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            }
        });
    }
    
    /**
     * Add navigation guard
     */
    beforeEach(hook) {
        this.beforeHooks.push(hook);
    }
    
    /**
     * Add after navigation hook
     */
    afterEach(hook) {
        this.afterHooks.push(hook);
    }
    
    /**
     * Get current route
     */
    getCurrentRoute() {
        return this.currentRoute;
    }
    
    /**
     * Get route params
     */
    getParams() {
        return this.params;
    }
}

// Create and export singleton instance
const router = new Router();

export default router;
export { Router };