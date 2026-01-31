/**
 * Hero Slider Component
 * Dynamic hero slider with auto-rotation
 */

import { sliderApi } from '../services/api.js';

class HeroSlider {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.slides = [];
        this.currentSlide = 0;
        this.interval = null;
        this.options = {
            autoPlay: true,
            interval: 5000,
            showDots: true,
            showNav: true,
            ...options
        };
        
        this.init();
    }
    
    async init() {
        if (!this.container) return;
        
        try {
            const response = await sliderApi.getSlides();
            this.slides = response.data || [];
            
            if (this.slides.length > 0) {
                this.render();
                this.startAutoPlay();
                this.attachEvents();
            } else {
                this.renderDefault();
            }
        } catch (error) {
            console.error('Failed to load slides:', error);
            this.renderDefault();
        }
    }
    
    render() {
        const slidesHtml = this.slides.map((slide, index) => `
            <div class="hero-slide ${index === 0 ? 'active' : ''}" data-slide="${index}">
                ${slide.imageUrl ? `<img src="${slide.imageUrl}" alt="${slide.title}" class="hero-slide-bg">` : ''}
                <div class="hero-slide-content">
                    <h1 class="hero-slide-title">${this.escapeHtml(slide.title)}</h1>
                    ${slide.subtitle ? `<p class="hero-slide-subtitle">${this.escapeHtml(slide.subtitle)}</p>` : ''}
                    <div class="hero-slide-actions">
                        ${slide.appId ? `
                            <a href="/app/${slide.appId}" class="btn btn-primary btn-lg" data-route="/app/${slide.appId}">
                                ${slide.buttonText || 'View App'}
                            </a>
                        ` : `
                            <a href="/browse" class="btn btn-primary btn-lg" data-route="/browse">
                                Browse Apps
                            </a>
                        `}
                        <a href="/add-app" class="btn btn-outline btn-lg" data-route="/add-app">
                            Add Your App
                        </a>
                    </div>
                </div>
            </div>
        `).join('');
        
        const dotsHtml = this.options.showDots && this.slides.length > 1 ? `
            <div class="hero-slider-dots">
                ${this.slides.map((_, index) => `
                    <div class="hero-slider-dot ${index === 0 ? 'active' : ''}" data-slide="${index}"></div>
                `).join('')}
            </div>
        ` : '';
        
        const navHtml = this.options.showNav && this.slides.length > 1 ? `
            <button class="hero-slider-nav prev" aria-label="Previous slide">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
            </button>
            <button class="hero-slider-nav next" aria-label="Next slide">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </button>
        ` : '';
        
        this.container.innerHTML = `
            ${slidesHtml}
            ${dotsHtml}
            ${navHtml}
        `;
    }
    
    renderDefault() {
        this.container.innerHTML = `
            <div class="hero-slide active">
                <div class="hero-slide-content">
                    <h1 class="hero-slide-title">Discover Amazing Apps</h1>
                    <p class="hero-slide-subtitle">Explore, download, and share the best apps on UPlayG</p>
                    <div class="hero-slide-actions">
                        <a href="/browse" class="btn btn-primary btn-lg" data-route="/browse">Get Started</a>
                        <a href="/add-app" class="btn btn-outline btn-lg" data-route="/add-app">Add Your App</a>
                    </div>
                </div>
            </div>
        `;
    }
    
    attachEvents() {
        // Dot navigation
        this.container.querySelectorAll('.hero-slider-dot').forEach(dot => {
            dot.addEventListener('click', () => {
                const slideIndex = parseInt(dot.dataset.slide);
                this.goToSlide(slideIndex);
            });
        });
        
        // Arrow navigation
        const prevBtn = this.container.querySelector('.hero-slider-nav.prev');
        const nextBtn = this.container.querySelector('.hero-slider-nav.next');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.prevSlide());
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextSlide());
        }
        
        // Pause on hover
        this.container.addEventListener('mouseenter', () => this.stopAutoPlay());
        this.container.addEventListener('mouseleave', () => this.startAutoPlay());
        
        // Touch/swipe support
        let touchStartX = 0;
        let touchEndX = 0;
        
        this.container.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        this.container.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe(touchStartX, touchEndX);
        }, { passive: true });
    }
    
    handleSwipe(startX, endX) {
        const diff = startX - endX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                this.nextSlide();
            } else {
                this.prevSlide();
            }
        }
    }
    
    goToSlide(index) {
        if (index === this.currentSlide) return;
        
        const slides = this.container.querySelectorAll('.hero-slide');
        const dots = this.container.querySelectorAll('.hero-slider-dot');
        
        slides[this.currentSlide].classList.remove('active');
        if (dots[this.currentSlide]) dots[this.currentSlide].classList.remove('active');
        
        this.currentSlide = index;
        
        slides[this.currentSlide].classList.add('active');
        if (dots[this.currentSlide]) dots[this.currentSlide].classList.add('active');
        
        this.resetAutoPlay();
    }
    
    nextSlide() {
        const nextIndex = (this.currentSlide + 1) % this.slides.length;
        this.goToSlide(nextIndex);
    }
    
    prevSlide() {
        const prevIndex = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
        this.goToSlide(prevIndex);
    }
    
    startAutoPlay() {
        if (this.options.autoPlay && this.slides.length > 1) {
            this.stopAutoPlay();
            this.interval = setInterval(() => this.nextSlide(), this.options.interval);
        }
    }
    
    stopAutoPlay() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
    
    resetAutoPlay() {
        this.stopAutoPlay();
        this.startAutoPlay();
    }
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

export default HeroSlider;
