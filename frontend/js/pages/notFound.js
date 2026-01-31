/**
 * Not Found Page
 * 404 error page
 */

const notFoundPage = {
    name: 'notFound',
    
    render() {
        return `
            <div class="empty-state" style="padding-top: 100px; min-height: 60vh;">
                <div class="empty-icon">😕</div>
                <h3>Page not found</h3>
                <p>The page you're looking for doesn't exist or has been moved.</p>
                <a href="/" class="btn btn-primary" style="margin-top: 16px;" data-route="/">Go Home</a>
            </div>
            
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
    
    mount() {
        document.title = 'Page Not Found - UPlayG';
    }
};

export default notFoundPage;
