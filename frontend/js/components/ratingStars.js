/**
 * Rating Stars Component
 * Interactive rating stars for user input
 */

class RatingStars {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.rating = options.initialRating || 0;
        this.onChange = options.onChange || (() => {});
        this.readonly = options.readonly || false;
        this.size = options.size || 32;
        
        this.init();
    }
    
    init() {
        if (!this.container) return;
        
        this.render();
        this.attachEvents();
    }
    
    render() {
        let starsHtml = '';
        
        for (let i = 1; i <= 5; i++) {
            const filled = i <= this.rating;
            starsHtml += `
                <span class="star ${filled ? 'filled' : ''}" data-rating="${i}" 
                      style="font-size: ${this.size}px; cursor: ${this.readonly ? 'default' : 'pointer'};">
                    ★
                </span>
            `;
        }
        
        this.container.innerHTML = starsHtml;
    }
    
    attachEvents() {
        if (this.readonly) return;
        
        const stars = this.container.querySelectorAll('.star');
        
        stars.forEach(star => {
            // Hover effect
            star.addEventListener('mouseenter', () => {
                const rating = parseInt(star.dataset.rating);
                this.highlightStars(rating);
            });
            
            // Click to set rating
            star.addEventListener('click', () => {
                const rating = parseInt(star.dataset.rating);
                this.setRating(rating);
            });
        });
        
        // Reset on mouse leave
        this.container.addEventListener('mouseleave', () => {
            this.highlightStars(this.rating);
        });
    }
    
    highlightStars(rating) {
        const stars = this.container.querySelectorAll('.star');
        
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('filled');
            } else {
                star.classList.remove('filled');
            }
        });
    }
    
    setRating(rating) {
        this.rating = rating;
        this.highlightStars(rating);
        this.onChange(rating);
    }
    
    getRating() {
        return this.rating;
    }
}

/**
 * Render static rating display
 */
function renderRatingDisplay(rating, count = 0) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    let starsHtml = '';
    
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            starsHtml += '★';
        } else if (i === fullStars && hasHalfStar) {
            starsHtml += '⯪';
        } else {
            starsHtml += '☆';
        }
    }
    
    return `
        <span class="rating-stars-display" title="${rating.toFixed(1)} out of 5">
            ${starsHtml}
        </span>
        ${count > 0 ? `<span class="rating-count">(${formatNumber(count)})</span>` : ''}
    `;
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

export { RatingStars, renderRatingDisplay };
