/**
 * ============================================
 * Gaming Review Website - Reviews Data Store
 * ============================================
 * 
 * This file contains utility functions for reviews.
 * Data is now stored in Firebase Firestore.
 * This file serves as a fallback and provides helper functions.
 */

// ============================================
// Default Reviews Data (empty - using Firebase now)
// ============================================
const defaultReviews = [];

// ============================================
// Reviews Data Management
// ============================================

/**
 * Initialize reviews data in localStorage if not exists
 */
function initializeReviews() {
    if (!localStorage.getItem('gameReviews')) {
        localStorage.setItem('gameReviews', JSON.stringify(defaultReviews));
    }
}

/**
 * Get all reviews from localStorage
 * @returns {Array} Array of review objects
 */
function getAllReviews() {
    initializeReviews();
    return JSON.parse(localStorage.getItem('gameReviews'));
}

/**
 * Get a single review by slug
 * @param {string} slug - The review slug
 * @returns {Object|null} Review object or null if not found
 */
function getReviewBySlug(slug) {
    const reviews = getAllReviews();
    return reviews.find(review => review.slug === slug) || null;
}

/**
 * Get a single review by ID
 * @param {number} id - The review ID
 * @returns {Object|null} Review object or null if not found
 */
function getReviewById(id) {
    const reviews = getAllReviews();
    return reviews.find(review => review.id === parseInt(id)) || null;
}

/**
 * Get featured review
 * @returns {Object|null} Featured review object
 */
function getFeaturedReview() {
    const reviews = getAllReviews();
    return reviews.find(review => review.featured) || reviews[0];
}

/**
 * Get latest reviews
 * @param {number} count - Number of reviews to return
 * @returns {Array} Array of review objects
 */
function getLatestReviews(count = 6) {
    const reviews = getAllReviews();
    return reviews
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, count);
}

/**
 * Filter reviews by criteria
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered array of reviews
 */
function filterReviews(filters = {}) {
    let reviews = getAllReviews();
    
    // Filter by genre
    if (filters.genre && filters.genre !== 'all') {
        reviews = reviews.filter(review => 
            review.genre.toLowerCase() === filters.genre.toLowerCase()
        );
    }
    
    // Filter by platform
    if (filters.platform && filters.platform !== 'all') {
        reviews = reviews.filter(review => 
            review.platform.some(p => p.toLowerCase().includes(filters.platform.toLowerCase()))
        );
    }
    
    // Filter by rating
    if (filters.rating && filters.rating !== 'all') {
        const ratingThreshold = parseInt(filters.rating);
        reviews = reviews.filter(review => review.rating >= ratingThreshold);
    }
    
    // Search by title
    if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        reviews = reviews.filter(review => 
            review.title.toLowerCase().includes(searchTerm) ||
            review.excerpt.toLowerCase().includes(searchTerm)
        );
    }
    
    // Sort reviews
    if (filters.sort) {
        switch (filters.sort) {
            case 'date-desc':
                reviews.sort((a, b) => new Date(b.date) - new Date(a.date));
                break;
            case 'date-asc':
                reviews.sort((a, b) => new Date(a.date) - new Date(b.date));
                break;
            case 'rating-desc':
                reviews.sort((a, b) => b.rating - a.rating);
                break;
            case 'rating-asc':
                reviews.sort((a, b) => a.rating - b.rating);
                break;
            case 'title-asc':
                reviews.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'title-desc':
                reviews.sort((a, b) => b.title.localeCompare(a.title));
                break;
        }
    }
    
    return reviews;
}

/**
 * Add a new review
 * @param {Object} reviewData - The review data
 * @returns {Object} The added review with generated ID
 */
function addReview(reviewData) {
    const reviews = getAllReviews();
    
    // Generate new ID
    const maxId = reviews.reduce((max, r) => Math.max(max, r.id), 0);
    const newReview = {
        ...reviewData,
        id: maxId + 1,
        slug: generateSlug(reviewData.title),
        date: reviewData.date || new Date().toISOString().split('T')[0]
    };
    
    reviews.push(newReview);
    localStorage.setItem('gameReviews', JSON.stringify(reviews));
    
    return newReview;
}

/**
 * Update an existing review
 * @param {number} id - The review ID
 * @param {Object} updateData - The data to update
 * @returns {Object|null} Updated review or null if not found
 */
function updateReview(id, updateData) {
    const reviews = getAllReviews();
    const index = reviews.findIndex(review => review.id === parseInt(id));
    
    if (index === -1) return null;
    
    // Update slug if title changed
    if (updateData.title && updateData.title !== reviews[index].title) {
        updateData.slug = generateSlug(updateData.title);
    }
    
    reviews[index] = { ...reviews[index], ...updateData };
    localStorage.setItem('gameReviews', JSON.stringify(reviews));
    
    return reviews[index];
}

/**
 * Delete a review
 * @param {number} id - The review ID
 * @returns {boolean} True if deleted, false if not found
 */
function deleteReview(id) {
    const reviews = getAllReviews();
    const filteredReviews = reviews.filter(review => review.id !== parseInt(id));
    
    if (filteredReviews.length === reviews.length) return false;
    
    localStorage.setItem('gameReviews', JSON.stringify(filteredReviews));
    return true;
}

/**
 * Reset reviews to default data
 */
function resetReviews() {
    localStorage.setItem('gameReviews', JSON.stringify(defaultReviews));
}

// ============================================
// Utility Functions
// ============================================

/**
 * Generate URL-friendly slug from title
 * @param {string} title - The title to convert
 * @returns {string} URL-friendly slug
 */
function generateSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

/**
 * Get unique genres from all reviews
 * @returns {Array} Array of unique genres
 */
function getUniqueGenres() {
    const reviews = getAllReviews();
    const genres = [...new Set(reviews.map(r => r.genre))];
    return genres.sort();
}

/**
 * Get unique platforms from all reviews
 * @returns {Array} Array of unique platforms
 */
function getUniquePlatforms() {
    const reviews = getAllReviews();
    const platforms = new Set();
    reviews.forEach(r => r.platform.forEach(p => platforms.add(p)));
    return [...platforms].sort();
}

/**
 * Format date to readable string
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

/**
 * Get rating class based on score
 * @param {number} rating - Rating value
 * @returns {string} CSS class name
 */
function getRatingClass(rating) {
    if (rating >= 8) return 'high';
    if (rating >= 5) return 'medium';
    return 'low';
}

/**
 * Get rating label based on score
 * @param {number} rating - Rating value
 * @returns {string} Rating label
 */
function getRatingLabel(rating) {
    if (rating >= 9) return 'Masterpiece';
    if (rating >= 8) return 'Great';
    if (rating >= 7) return 'Good';
    if (rating >= 6) return 'Decent';
    if (rating >= 5) return 'Average';
    if (rating >= 4) return 'Below Average';
    return 'Poor';
}

// Initialize on load
initializeReviews();

// Export functions for use in other scripts
window.ReviewsData = {
    getAllReviews,
    getReviewBySlug,
    getReviewById,
    getFeaturedReview,
    getLatestReviews,
    filterReviews,
    addReview,
    updateReview,
    deleteReview,
    resetReviews,
    getUniqueGenres,
    getUniquePlatforms,
    formatDate,
    getRatingClass,
    getRatingLabel,
    generateSlug
};
