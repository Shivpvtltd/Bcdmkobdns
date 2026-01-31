/**
 * App Detail Page
 * Detailed view of an app with ratings and reviews
 */

import { appsApi, ratingsApi } from '../services/api.js';
import { RatingStars, renderRatingDisplay } from '../components/ratingStars.js';
import { isAuthenticated, getCurrentUser, showToast } from '../services/auth.js';
import { escapeHtml, formatNumber } from '../components/appCard.js';

const appDetailPage = {
    name: 'appDetail',
    
    async render(params) {
        const appId = params.id;
        
        if (!appId) {
            return this.renderNotFound();
        }
        
        return `
            <!-- Loading State -->
            <div id="loadingState" class="app-hero" style="padding-top: 100px;">
                <div class="app-hero-content" style="margin: 0 auto; display: flex; gap: 24px;">
                    <div class="skeleton-logo" style="width: 120px; height: 120px; border-radius: 16px;"></div>
                    <div style="flex: 1;">
                        <div class="skeleton-text" style="width: 60%; height: 24px; margin-bottom: 12px;"></div>
                        <div class="skeleton-text short" style="width: 40%; height: 16px;"></div>
                    </div>
                </div>
            </div>
            
            <!-- App Content -->
            <div id="appContent" style="display: none;">
                <!-- App Hero -->
                <section class="app-hero">
                    <div class="app-hero-content">
                        <img src="" alt="" id="appLogo" class="app-hero-logo" loading="lazy">
                        <div class="app-hero-info">
                            <h1 id="appName" class="app-hero-name"></h1>
                            <div class="app-hero-meta">
                                <span id="appCategory"></span>
                                <span id="appDownloads"></span>
                            </div>
                            <div class="app-hero-rating" id="appRating"></div>
                            <div class="app-hero-actions">
                                <a href="#" id="installBtn" class="btn btn-primary btn-lg" target="_blank">Install</a>
                                <button id="shareBtn" class="btn btn-secondary btn-lg">Share</button>
                            </div>
                        </div>
                    </div>
                </section>
                
                <!-- App Details -->
                <section class="app-details">
                    <!-- Rating Section -->
                    <div class="rating-section" id="ratingSection">
                        <div class="rating-summary">
                            <div class="rating-average">
                                <div class="rating-average-value" id="ratingAverage">0.0</div>
                                <div class="rating-average-stars" id="ratingAverageStars"></div>
                                <div class="rating-average-count" id="ratingTotalCount">0 reviews</div>
                            </div>
                            <div class="rating-bars" id="ratingBars"></div>
                        </div>
                        
                        <!-- User Rating -->
                        <div class="user-rating" id="userRatingSection">
                            <h3 class="user-rating-title">Rate this app</h3>
                            <div class="user-rating-stars" id="userRatingStars"></div>
                            <textarea class="user-rating-textarea" id="userReviewText" placeholder="Write a review (optional)"></textarea>
                            <button class="btn btn-primary" id="submitRatingBtn">Submit Rating</button>
                        </div>
                    </div>
                    
                    <!-- About Section -->
                    <div class="detail-section">
                        <h2 class="detail-section-title">About this app</h2>
                        <p id="appDescription"></p>
                    </div>
                    
                    <!-- Features Section -->
                    <div class="detail-section" id="featuresSection" style="display: none;">
                        <h2 class="detail-section-title">Features</h2>
                        <div class="features-grid" id="featuresGrid"></div>
                    </div>
                    
                    <!-- Screenshots Section -->
                    <div class="detail-section" id="screenshotsSection" style="display: none;">
                        <h2 class="detail-section-title">Screenshots</h2>
                        <div class="screenshots-scroll" id="screenshotsScroll"></div>
                    </div>
                    
                    <!-- Reviews Section -->
                    <div class="detail-section">
                        <h2 class="detail-section-title">Reviews</h2>
                        <div class="reviews-list" id="reviewsList"></div>
                    </div>
                </section>
            </div>
            
            <!-- Not Found State -->
            <div id="notFoundState" class="empty-state" style="display: none; padding-top: 100px;">
                <div class="empty-icon">😕</div>
                <h3>App not found</h3>
                <p>The app you're looking for doesn't exist or has been removed.</p>
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
    
    async mount(params) {
        const appId = params.id;
        if (!appId) return;
        
        try {
            // Load app data
            const response = await appsApi.getApp(appId);
            const app = response.data;
            
            if (!app) {
                this.showNotFound();
                return;
            }
            
            this.currentApp = app;
            this.renderApp(app);
            this.loadRatings(appId);
            this.attachEvents(app);
        } catch (error) {
            console.error('Failed to load app:', error);
            this.showNotFound();
        }
    },
    
    renderApp(app) {
        // Hide loading, show content
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('appContent').style.display = 'block';
        
        // Update page title
        document.title = `${app.appName} - UPlayG`;
        
        // Set app info
        const logo = document.getElementById('appLogo');
        logo.src = app.logoURL || 'assets/images/icon.png';
        logo.alt = app.appName;
        logo.onerror = () => { logo.src = 'assets/images/icon.png'; };
        
        document.getElementById('appName').textContent = app.appName;
        document.getElementById('appCategory').textContent = app.category || 'Uncategorized';
        document.getElementById('appDownloads').textContent = `${formatNumber(app.downloadCount || 0)} downloads`;
        
        // Rating display
        const ratingEl = document.getElementById('appRating');
        ratingEl.innerHTML = renderRatingDisplay(app.rating || 0, app.ratingCount || 0);
        
        // Install button
        const installBtn = document.getElementById('installBtn');
        if (app.downloadURL) {
            installBtn.href = app.downloadURL;
        } else {
            installBtn.style.display = 'none';
        }
        
        // Description
        document.getElementById('appDescription').textContent = app.description || 'No description available.';
        
        // Features
        if (app.features && app.features.length > 0) {
            const featuresGrid = document.getElementById('featuresGrid');
            featuresGrid.innerHTML = app.features.map(f => `
                <span class="feature-tag">${escapeHtml(f)}</span>
            `).join('');
            document.getElementById('featuresSection').style.display = 'block';
        }
        
        // Screenshots
        if (app.screenshots && app.screenshots.length > 0) {
            const screenshotsScroll = document.getElementById('screenshotsScroll');
            screenshotsScroll.innerHTML = app.screenshots.map(url => `
                <div class="screenshot">
                    <img src="${url}" alt="Screenshot" loading="lazy">
                </div>
            `).join('');
            document.getElementById('screenshotsSection').style.display = 'block';
        }
    },
    
    async loadRatings(appId) {
        try {
            // Load rating summary
            const summaryResponse = await ratingsApi.getSummary(appId);
            const summary = summaryResponse.data;
            
            this.renderRatingSummary(summary);
            
            // Load reviews
            const reviewsResponse = await ratingsApi.getRatings(appId, { includeUserInfo: true, limit: 10 });
            const reviews = reviewsResponse.data || [];
            
            this.renderReviews(reviews);
            
            // Check if user has rated
            if (isAuthenticated()) {
                this.loadUserRating(appId);
            } else {
                document.getElementById('userRatingSection').innerHTML = `
                    <p class="form-hint">Sign in to rate this app</p>
                `;
            }
        } catch (error) {
            console.error('Failed to load ratings:', error);
        }
    },
    
    renderRatingSummary(summary) {
        document.getElementById('ratingAverage').textContent = summary.average.toFixed(1);
        document.getElementById('ratingAverageStars').innerHTML = renderRatingDisplay(summary.average);
        document.getElementById('ratingTotalCount').textContent = `${summary.total} review${summary.total !== 1 ? 's' : ''}`;
        
        // Rating bars
        const barsContainer = document.getElementById('ratingBars');
        const maxCount = Math.max(...Object.values(summary.distribution));
        
        barsContainer.innerHTML = Object.entries(summary.distribution)
            .sort((a, b) => b[0] - a[0]) // Sort 5 to 1
            .map(([star, count]) => {
                const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                return `
                    <div class="rating-bar">
                        <span class="rating-bar-label">${star}</span>
                        <div class="rating-bar-track">
                            <div class="rating-bar-fill" style="width: ${percentage}%"></div>
                        </div>
                        <span class="rating-bar-count">${count}</span>
                    </div>
                `;
            }).join('');
    },
    
    renderReviews(reviews) {
        const container = document.getElementById('reviewsList');
        
        if (reviews.length === 0) {
            container.innerHTML = '<p class="form-hint">No reviews yet. Be the first to review!</p>';
            return;
        }
        
        container.innerHTML = reviews.map(review => `
            <div class="review-item">
                <div class="review-header">
                    <img src="${review.user?.photoURL || 'assets/images/icon.png'}" alt="" class="review-avatar">
                    <div class="review-meta">
                        <div class="review-author">${escapeHtml(review.user?.name || 'Anonymous')}</div>
                        <div class="review-date">${this.formatDate(review.createdAt)}</div>
                    </div>
                    <div class="review-rating">
                        ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
                    </div>
                </div>
                ${review.review ? `<p class="review-text">${escapeHtml(review.review)}</p>` : ''}
            </div>
        `).join('');
    },
    
    async loadUserRating(appId) {
        try {
            const response = await ratingsApi.getMyRating(appId);
            const userRating = response.data;
            
            if (userRating) {
                document.getElementById('userReviewText').value = userRating.review || '';
            }
            
            // Initialize rating stars
            const userRatingStars = new RatingStars('userRatingStars', {
                initialRating: userRating?.rating || 0,
                size: 32
            });
            
            this.userRatingStars = userRatingStars;
        } catch (error) {
            console.error('Failed to load user rating:', error);
        }
    },
    
    attachEvents(app) {
        // Share button
        document.getElementById('shareBtn').addEventListener('click', async () => {
            const shareData = {
                title: app.appName,
                text: `Check out ${app.appName} on UPlayG!`,
                url: window.location.href
            };
            
            if (navigator.share) {
                try {
                    await navigator.share(shareData);
                } catch (err) {
                    // User cancelled
                }
            } else {
                try {
                    await navigator.clipboard.writeText(window.location.href);
                    showToast('Link copied to clipboard!');
                } catch (err) {
                    showToast('Failed to copy link', 'error');
                }
            }
        });
        
        // Submit rating
        document.getElementById('submitRatingBtn').addEventListener('click', async () => {
            if (!isAuthenticated()) {
                showToast('Please sign in to rate', 'warning');
                return;
            }
            
            const rating = this.userRatingStars?.getRating() || 0;
            if (rating === 0) {
                showToast('Please select a rating', 'warning');
                return;
            }
            
            const review = document.getElementById('userReviewText').value.trim();
            
            try {
                await ratingsApi.submitRating(app.id, rating, review);
                showToast('Rating submitted successfully!', 'success');
                
                // Reload ratings
                this.loadRatings(app.id);
            } catch (error) {
                showToast(error.message || 'Failed to submit rating', 'error');
            }
        });
    },
    
    showNotFound() {
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('appContent').style.display = 'none';
        document.getElementById('notFoundState').style.display = 'block';
        document.title = 'App Not Found - UPlayG';
    },
    
    renderNotFound() {
        return `
            <div class="empty-state" style="padding-top: 100px;">
                <div class="empty-icon">😕</div>
                <h3>App not found</h3>
                <p>The app you're looking for doesn't exist or has been removed.</p>
                <a href="/" class="btn btn-primary" style="margin-top: 16px;" data-route="/">Go Home</a>
            </div>
        `;
    },
    
    formatDate(dateString) {
        if (!dateString) return 'Unknown';
        
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
        
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }
};

export default appDetailPage;
