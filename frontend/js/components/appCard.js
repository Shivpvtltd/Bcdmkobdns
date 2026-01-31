/**
 * App Card Component
 * Reusable app card for listings
 */

function createAppCard(app) {
    const logoUrl = app.logoURL || 'assets/images/icon.png';
    const category = app.category || 'Uncategorized';
    const rating = app.rating || 0;
    const ratingCount = app.ratingCount || 0;
    
    const card = document.createElement('a');
    card.className = 'app-card';
    card.href = `/app/${app.id}`;
    card.setAttribute('data-route', `/app/${app.id}`);
    
    card.innerHTML = `
        <img src="${logoUrl}" alt="${escapeHtml(app.appName)}" class="app-logo" loading="lazy" onerror="this.src='assets/images/icon.png'">
        <h3 class="app-name">${escapeHtml(app.appName)}</h3>
        <p class="app-category">${escapeHtml(category)}</p>
        <div class="app-rating">
            ${renderStars(rating)}
            <span>${rating.toFixed(1)}</span>
            <span>(${formatNumber(ratingCount)})</span>
        </div>
    `;
    
    return card;
}

function createSkeletonCard() {
    const card = document.createElement('div');
    card.className = 'app-card skeleton';
    
    card.innerHTML = `
        <div class="skeleton-logo"></div>
        <div class="skeleton-text"></div>
        <div class="skeleton-text short"></div>
    `;
    
    return card;
}

function renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let starsHtml = '';
    
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            starsHtml += `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
        } else if (i === fullStars && hasHalfStar) {
            starsHtml += `<svg width="14" height="14" viewBox="0 0 24 24"><defs><linearGradient id="half"><stop offset="50%" stop-color="currentColor"/><stop offset="50%" stop-color="transparent"/></linearGradient></defs><polygon fill="url(#half)" points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/><polygon fill="none" stroke="currentColor" points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
        } else {
            starsHtml += `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
        }
    }
    
    return starsHtml;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

export { createAppCard, createSkeletonCard, renderStars, escapeHtml, formatNumber };
