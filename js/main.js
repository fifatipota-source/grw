/**
 * ============================================
 * Gaming Review Website - Main JavaScript
 * ============================================
 * 
 * Handles all frontend functionality including:
 * - Navigation and mobile menu
 * - Review card rendering
 * - Filtering and search
 * - Dynamic content loading
 */

// ============================================
// DOM Ready Handler
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initMobileMenu();
    highlightActiveNav();
    
    // Page-specific initializations
    const currentPage = document.body.dataset.page;
    
    switch(currentPage) {
        case 'home':
            initHomePage();
            break;
        case 'reviews':
            initReviewsPage();
            break;
        case 'review':
            initReviewPage();
            break;
    }
});

// ============================================
// Navigation Functions
// ============================================

/**
 * Initialize navigation functionality
 */
function initNavigation() {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

/**
 * Initialize mobile menu toggle
 */
function initMobileMenu() {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            this.classList.toggle('active');
            
            // Animate hamburger to X
            const spans = this.querySelectorAll('span');
            if (this.classList.contains('active')) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!menuToggle.contains(e.target) && !navLinks.contains(e.target)) {
                navLinks.classList.remove('active');
                menuToggle.classList.remove('active');
            }
        });
    }
}

/**
 * Highlight active navigation link based on current page
 */
function highlightActiveNav() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href').split('/').pop();
        if (linkPath === currentPath) {
            link.classList.add('active');
        }
    });
}

// ============================================
// Home Page Functions
// ============================================

/**
 * Initialize home page content
 */
async function initHomePage() {
    await renderFeaturedReview();
    await renderLatestReviews();
}

/**
 * Render the featured review section with slider for multiple featured reviews
 */
async function renderFeaturedReview() {
    const container = document.getElementById('featured-review');
    const navContainer = document.getElementById('featured-nav');
    const dotsContainer = document.getElementById('featured-dots');
    const prevBtn = document.getElementById('featured-prev');
    const nextBtn = document.getElementById('featured-next');
    if (!container) return;
    
    // Get all featured reviews from Firebase
    let featuredReviews = [];
    if (window.FirebaseReviews) {
        try {
            featuredReviews = await window.FirebaseReviews.getAllFeaturedReviews();
        } catch (e) {
            console.log('Firebase error:', e);
        }
    }
    
    // If no featured reviews, try to get the latest one
    if (featuredReviews.length === 0) {
        let review = null;
        if (window.FirebaseReviews) {
            try {
                review = await window.FirebaseReviews.getFeaturedReview();
            } catch (e) {
                console.log('Firebase error:', e);
            }
        }
        if (review) {
            featuredReviews = [review];
        }
    }
    
    if (featuredReviews.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: var(--spacing-2xl); color: var(--text-muted);">
                <h3>No Featured Review Yet</h3>
                <p>Check back soon for our featured game review!</p>
            </div>
        `;
        if (navContainer) navContainer.style.display = 'none';
        return;
    }
    
    // If only one featured review, show simple layout (no dots)
    if (featuredReviews.length === 1) {
        const review = featuredReviews[0];
        const ratingClass = window.ReviewsData.getRatingClass(review.rating);
        const platforms = Array.isArray(review.platform) ? review.platform.join(', ') : review.platform;
        
        container.innerHTML = `
            <div class="featured-review-image">
                <img src="${review.headerImage}" alt="${review.title}" loading="lazy">
            </div>
            <div class="featured-review-content">
                <span class="featured-badge">Featured Review</span>
                <h2>${review.title}</h2>
                <div class="review-card-meta">
                    <span class="review-card-platform">Platform: ${platforms}</span>
                    <span>Genre: ${review.genre}</span>
                </div>
                <p class="featured-review-excerpt">${review.excerpt}</p>
                <div class="rating" style="margin-bottom: var(--spacing-lg);">
                    <span class="rating-number ${ratingClass}">${review.rating}</span>
                    <span class="rating-max">/10</span>
                    <span style="margin-left: var(--spacing-sm); color: var(--text-muted);">
                        ${window.ReviewsData.getRatingLabel(review.rating)}
                    </span>
                </div>
                <a href="review.html?slug=${review.slug || review.id}" class="btn btn-primary btn-lg">Read Full Review</a>
            </div>
        `;
        if (navContainer) navContainer.style.display = 'none';
        return;
    }
    
    // Multiple featured reviews - show slider
    let currentSlide = 0;
    
    function renderDots(index) {
        if (!dotsContainer) return;
        dotsContainer.innerHTML = featuredReviews.map((_, i) => `
            <button onclick="window.featuredSlider.goTo(${i})" 
                style="width: 12px; height: 12px; border-radius: 50%; border: none; cursor: pointer; transition: all 0.3s ease;
                background: ${i === index ? 'var(--accent-primary)' : 'var(--border-color)'};"
                aria-label="Go to slide ${i + 1}"></button>
        `).join('');
    }
    
    function renderSlide(index) {
        const review = featuredReviews[index];
        const ratingClass = window.ReviewsData.getRatingClass(review.rating);
        const platforms = Array.isArray(review.platform) ? review.platform.join(', ') : review.platform;
        
        container.innerHTML = `
            <div class="featured-review-image">
                <img src="${review.headerImage}" alt="${review.title}" loading="lazy">
            </div>
            <div class="featured-review-content">
                <span class="featured-badge">Featured Review ${index + 1} of ${featuredReviews.length}</span>
                <h2>${review.title}</h2>
                <div class="review-card-meta">
                    <span class="review-card-platform">Platform: ${platforms}</span>
                    <span>Genre: ${review.genre}</span>
                </div>
                <p class="featured-review-excerpt">${review.excerpt}</p>
                <div class="rating" style="margin-bottom: var(--spacing-lg);">
                    <span class="rating-number ${ratingClass}">${review.rating}</span>
                    <span class="rating-max">/10</span>
                    <span style="margin-left: var(--spacing-sm); color: var(--text-muted);">
                        ${window.ReviewsData.getRatingLabel(review.rating)}
                    </span>
                </div>
                <a href="review.html?slug=${review.slug || review.id}" class="btn btn-primary btn-lg">Read Full Review</a>
            </div>
        `;
        
        renderDots(index);
    }
    
    // Create slider controls
    window.featuredSlider = {
        next: function() {
            currentSlide = (currentSlide + 1) % featuredReviews.length;
            renderSlide(currentSlide);
        },
        prev: function() {
            currentSlide = (currentSlide - 1 + featuredReviews.length) % featuredReviews.length;
            renderSlide(currentSlide);
        },
        goTo: function(index) {
            currentSlide = index;
            renderSlide(currentSlide);
        }
    };
    
    // Set up external button click handlers
    if (prevBtn) prevBtn.onclick = () => window.featuredSlider.prev();
    if (nextBtn) nextBtn.onclick = () => window.featuredSlider.next();
    
    // Show navigation container
    if (navContainer) navContainer.style.display = 'flex';
    
    // Render first slide
    renderSlide(0);
}

/**
 * Render latest reviews grid
 */
async function renderLatestReviews() {
    const container = document.getElementById('latest-reviews');
    if (!container) return;
    
    // Get reviews from Firebase
    let reviews = [];
    if (window.FirebaseReviews) {
        try {
            reviews = await window.FirebaseReviews.getLatestReviews(6);
        } catch (e) {
            console.log('Firebase error:', e);
        }
    }
    
    if (!reviews || reviews.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: var(--spacing-2xl); color: var(--text-muted);">
                <h3>No Reviews Yet</h3>
                <p>Be the first to check out our upcoming reviews!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = reviews.map(review => createReviewCard(review)).join('');
}

// ============================================
// Reviews Page Functions
// ============================================

/**
 * Initialize reviews page with filters
 */
async function initReviewsPage() {
    await populateFilters();
    await renderAllReviews();
    attachFilterListeners();
}

/**
 * Populate filter dropdowns with options
 */
async function populateFilters() {
    // Populate genre filter
    const genreSelect = document.getElementById('filter-genre');
    if (genreSelect) {
        const genres = window.ReviewsData.getUniqueGenres();
        genreSelect.innerHTML = '<option value="all">All Genres</option>' +
            genres.map(genre => `<option value="${genre}">${genre}</option>`).join('');
    }
    
    // Populate platform filter
    const platformSelect = document.getElementById('filter-platform');
    if (platformSelect) {
        const platforms = window.ReviewsData.getUniquePlatforms();
        platformSelect.innerHTML = '<option value="all">All Platforms</option>' +
            platforms.map(platform => `<option value="${platform}">${platform}</option>`).join('');
    }
}

/**
 * Render all reviews based on current filters
 */
async function renderAllReviews() {
    const container = document.getElementById('reviews-grid');
    if (!container) return;
    
    const filters = getCurrentFilters();
    
    // Get reviews from Firebase
    let reviews = [];
    if (window.FirebaseReviews) {
        try {
            const allReviews = await window.FirebaseReviews.getAllReviews();
            // Apply local filtering
            reviews = filterReviewsLocal(allReviews, filters);
        } catch (e) {
            console.log('Firebase error:', e);
        }
    }
    
    if (reviews.length === 0) {
        container.innerHTML = `
            <div class="no-results" style="grid-column: 1/-1; text-align: center; padding: var(--spacing-2xl);">
                <h3>No reviews found</h3>
                <p>Try adjusting your filters or check back later for new reviews.</p>
            </div>
        `;
        // Update results count
        const countEl = document.getElementById('results-count');
        if (countEl) {
            countEl.textContent = '0 reviews found';
        }
        return;
    }
    
    container.innerHTML = reviews.map(review => createReviewCard(review)).join('');
    
    // Update results count
    const countEl = document.getElementById('results-count');
    if (countEl) {
        countEl.textContent = `${reviews.length} review${reviews.length !== 1 ? 's' : ''} found`;
    }
}

/**
 * Filter reviews locally (used when data comes from Firebase)
 */
function filterReviewsLocal(reviews, filters) {
    let filtered = [...reviews];
    
    // Filter by genre
    if (filters.genre && filters.genre !== 'all') {
        filtered = filtered.filter(r => r.genre === filters.genre);
    }
    
    // Filter by platform
    if (filters.platform && filters.platform !== 'all') {
        filtered = filtered.filter(r => {
            const platforms = Array.isArray(r.platform) ? r.platform : [r.platform];
            return platforms.includes(filters.platform);
        });
    }
    
    // Filter by rating
    if (filters.rating && filters.rating !== 'all') {
        const minRating = parseInt(filters.rating);
        filtered = filtered.filter(r => r.rating >= minRating);
    }
    
    // Filter by search
    if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(r => 
            r.title.toLowerCase().includes(searchLower) ||
            (r.excerpt && r.excerpt.toLowerCase().includes(searchLower))
        );
    }
    
    // Sort
    if (filters.sort) {
        switch(filters.sort) {
            case 'date-desc':
                filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
                break;
            case 'date-asc':
                filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
                break;
            case 'rating-desc':
                filtered.sort((a, b) => b.rating - a.rating);
                break;
            case 'rating-asc':
                filtered.sort((a, b) => a.rating - b.rating);
                break;
            case 'title-asc':
                filtered.sort((a, b) => a.title.localeCompare(b.title));
                break;
        }
    }
    
    return filtered;
}

/**
 * Get current filter values from the form
 * @returns {Object} Filter criteria
 */
function getCurrentFilters() {
    return {
        genre: document.getElementById('filter-genre')?.value || 'all',
        platform: document.getElementById('filter-platform')?.value || 'all',
        rating: document.getElementById('filter-rating')?.value || 'all',
        sort: document.getElementById('filter-sort')?.value || 'date-desc',
        search: document.getElementById('filter-search')?.value || ''
    };
}

/**
 * Attach event listeners to filter controls
 */
function attachFilterListeners() {
    const filterElements = [
        'filter-genre',
        'filter-platform', 
        'filter-rating',
        'filter-sort'
    ];
    
    filterElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', renderAllReviews);
        }
    });
    
    // Search input with debounce
    const searchInput = document.getElementById('filter-search');
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', function() {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(renderAllReviews, 300);
        });
    }
    
    // Reset filters button
    const resetBtn = document.getElementById('reset-filters');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetFilters);
    }
}

/**
 * Reset all filters to default values
 */
function resetFilters() {
    document.getElementById('filter-genre').value = 'all';
    document.getElementById('filter-platform').value = 'all';
    document.getElementById('filter-rating').value = 'all';
    document.getElementById('filter-sort').value = 'date-desc';
    document.getElementById('filter-search').value = '';
    renderAllReviews();
}

// ============================================
// Individual Review Page Functions
// ============================================

/**
 * Initialize individual review page
 */
async function initReviewPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');
    
    if (!slug) {
        showReviewNotFound();
        return;
    }
    
    // Get review from Firebase
    let review = null;
    if (window.FirebaseReviews) {
        try {
            review = await window.FirebaseReviews.getReviewBySlug(slug);
        } catch (e) {
            console.log('Firebase error:', e);
        }
    }
    
    if (!review) {
        showReviewNotFound();
        return;
    }
    
    renderReviewContent(review);
    updatePageMeta(review);
}

/**
 * Render full review content
 * @param {Object} review - The review object
 */
function renderReviewContent(review) {
    // Update header background
    const headerBg = document.querySelector('.review-header-bg img');
    if (headerBg) {
        headerBg.src = review.headerImage;
        headerBg.alt = review.title;
    }
    
    // Update cover image
    const coverImg = document.querySelector('.review-cover img');
    if (coverImg) {
        coverImg.src = review.coverImage;
        coverImg.alt = review.title;
    }
    
    // Update review info
    document.getElementById('review-title').textContent = review.title;
    
    // Update meta information
    const metaContainer = document.getElementById('review-meta');
    if (metaContainer) {
        const platforms = Array.isArray(review.platform) ? review.platform.join(', ') : review.platform;
        metaContainer.innerHTML = `
            <span class="review-meta-item">Date: ${window.ReviewsData.formatDate(review.date)}</span>
            <span class="review-meta-item">By: ${review.author}</span>
            <span class="review-meta-item">Genre: ${review.genre}</span>
            <span class="review-meta-item">Platform: ${platforms}</span>
        `;
    }
    
    // Update tags
    const tagsContainer = document.getElementById('review-tags');
    if (tagsContainer) {
        tagsContainer.innerHTML = review.tags.map(tag => 
            `<span class="review-tag">${tag}</span>`
        ).join('');
    }
    
    // Update rating
    const ratingContainer = document.getElementById('review-rating');
    if (ratingContainer) {
        const ratingClass = window.ReviewsData.getRatingClass(review.rating);
        ratingContainer.innerHTML = `
            <div class="rating-circle">${review.rating}</div>
            <div class="rating-details">
                <h4>${window.ReviewsData.getRatingLabel(review.rating)}</h4>
                <div class="rating-stars">
                    ${generateStars(review.rating)}
                </div>
            </div>
        `;
    }
    
    // Update review body
    const bodyContainer = document.getElementById('review-body');
    if (bodyContainer) {
        bodyContainer.innerHTML = review.content || '<p>No content available.</p>';
    }
    
    // Update sidebar Game Details
    const platforms = Array.isArray(review.platform) ? review.platform.join(', ') : (review.platform || '-');
    const sidebarPlatforms = document.getElementById('sidebar-platforms');
    if (sidebarPlatforms) sidebarPlatforms.textContent = platforms;
    
    const sidebarGenre = document.getElementById('sidebar-genre');
    if (sidebarGenre) sidebarGenre.textContent = review.genre || '-';
    
    const sidebarAuthor = document.getElementById('sidebar-author');
    if (sidebarAuthor) sidebarAuthor.textContent = review.author || '-';
    
    const sidebarDate = document.getElementById('sidebar-date');
    if (sidebarDate) sidebarDate.textContent = review.date ? window.ReviewsData.formatDate(review.date) : '-';
    
    // Render related reviews
    renderRelatedReviews(review);
}

/**
 * Update page meta information for SEO
 * @param {Object} review - The review object
 */
function updatePageMeta(review) {
    document.title = `${review.title} Review - GameReview Hub`;
    
    // Update meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        document.head.appendChild(metaDesc);
    }
    metaDesc.content = review.excerpt;
}

/**
 * Show review not found message
 */
function showReviewNotFound() {
    const container = document.querySelector('.review-header-content');
    if (container) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: var(--spacing-2xl);">
                <h1>Review Not Found</h1>
                <p>Sorry, we couldn't find the review you're looking for.</p>
                <a href="reviews.html" class="btn btn-primary" style="margin-top: var(--spacing-lg);">
                    Browse All Reviews
                </a>
            </div>
        `;
    }
}

/**
 * Render related reviews section
 * @param {Object} currentReview - The current review
 */
async function renderRelatedReviews(currentReview) {
    const container = document.getElementById('related-reviews');
    if (!container) return;
    
    // Try Firebase first, fall back to local data
    let allReviews;
    if (window.FirebaseReviews) {
        try {
            allReviews = await window.FirebaseReviews.getAllReviews();
        } catch (e) {
            console.log('Firebase not available, using local data');
        }
    }
    if (!allReviews || allReviews.length === 0) {
        allReviews = window.ReviewsData.getAllReviews();
    }
    
    const currentPlatforms = Array.isArray(currentReview.platform) ? currentReview.platform : [currentReview.platform];
    const related = allReviews
        .filter(r => (r.id || r.slug) !== (currentReview.id || currentReview.slug))
        .filter(r => {
            const rPlatforms = Array.isArray(r.platform) ? r.platform : [r.platform];
            return r.genre === currentReview.genre || 
                rPlatforms.some(p => currentPlatforms.includes(p));
        })
        .slice(0, 3);
    
    if (related.length === 0) {
        container.parentElement.style.display = 'none';
        return;
    }
    
    container.innerHTML = related.map(review => createReviewCard(review)).join('');
}

// ============================================
// UI Component Functions
// ============================================

/**
 * Create a review card HTML
 * @param {Object} review - The review object
 * @returns {string} HTML string for the card
 */
function createReviewCard(review) {
    const ratingClass = window.ReviewsData.getRatingClass(review.rating);
    const platforms = Array.isArray(review.platform) ? review.platform : [review.platform];
    const slug = review.slug || review.id;
    
    return `
        <article class="review-card fade-in">
            <a href="review.html?slug=${slug}" class="review-card-image">
                <img src="${review.coverImage}" alt="${review.title}" loading="lazy">
                <span class="review-card-badge">${review.genre}</span>
                <span class="review-card-rating ${ratingClass}">
                    ${review.rating}/10
                </span>
            </a>
            <div class="review-card-content">
                <div class="review-card-meta">
                    <span class="review-card-platform">${platforms[0]}${platforms.length > 1 ? '+' : ''}</span>
                    <span>${window.ReviewsData.formatDate(review.date)}</span>
                </div>
                <h3><a href="review.html?slug=${slug}">${review.title}</a></h3>
                <p class="review-card-excerpt">${review.excerpt}</p>
                <div class="review-card-footer">
                    <div class="review-card-author">
                        <img src="${review.authorAvatar}" alt="${review.author}">
                        <span>${review.author}</span>
                    </div>
                    <a href="review.html?slug=${slug}" class="btn btn-sm btn-secondary">Read More</a>
                </div>
            </div>
        </article>
    `;
}

/**
 * Generate star rating HTML
 * @param {number} rating - Rating out of 10
 * @returns {string} HTML string for stars
 */
function generateStars(rating) {
    const fullStars = Math.floor(rating / 2);
    const halfStar = rating % 2 >= 1;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    let html = '';
    for (let i = 0; i < fullStars; i++) {
        html += '<span class="rating-star filled">★</span>';
    }
    if (halfStar) {
        html += '<span class="rating-star filled">★</span>';
    }
    for (let i = 0; i < emptyStars; i++) {
        html += '<span class="rating-star">★</span>';
    }
    return html;
}

// ============================================
// Utility Functions
// ============================================

/**
 * Debounce function for performance
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function for performance
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in ms
 * @returns {Function} Throttled function
 */
function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type of toast (success, error, info)
 */
function showToast(message, type = 'info') {
    // Remove existing toasts
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: var(--bg-secondary);
        color: var(--text-primary);
        padding: var(--spacing-md) var(--spacing-lg);
        border-radius: var(--radius-md);
        border: 1px solid var(--border-color);
        box-shadow: var(--shadow-lg);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;
    
    // Add color based on type
    if (type === 'success') {
        toast.style.borderLeft = '4px solid var(--accent-secondary)';
    } else if (type === 'error') {
        toast.style.borderLeft = '4px solid var(--accent-danger)';
    } else {
        toast.style.borderLeft = '4px solid var(--accent-primary)';
    }
    
    document.body.appendChild(toast);
    
    // Remove after delay
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add toast animations to document
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Export utilities
window.GameReviewUtils = {
    debounce,
    throttle,
    showToast,
    createReviewCard,
    generateStars
};
