/**
 * ============================================
 * Gaming Review Website - Admin Panel JavaScript
 * ============================================
 * 
 * Handles all admin functionality including:
 * - Review CRUD operations
 * - Data import/export
 * - Dashboard statistics
 */

// ============================================
// Helper Functions
// ============================================

/**
 * Generate excerpt from HTML content
 * @param {string} htmlContent - The full review content with HTML
 * @returns {string} - Plain text excerpt (first 150 characters)
 */
function generateExcerpt(htmlContent) {
    // Strip HTML tags
    const plainText = htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    // Take first 150 characters and add ellipsis if needed
    if (plainText.length > 150) {
        return plainText.substring(0, 150).trim() + '...';
    }
    return plainText;
}

// ============================================
// DOM Ready Handler
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    initAdminPanel();
});

/**
 * Initialize admin panel
 */
function initAdminPanel() {
    updateDashboardStats();
    renderRecentReviews();
    renderAllReviews();
    
    // Set default date for new reviews
    const dateInput = document.getElementById('review-date');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
}

// ============================================
// Section Navigation
// ============================================

/**
 * Show a specific admin section
 * @param {string} sectionId - The section to show
 */
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show target section
    const targetSection = document.getElementById(`section-${sectionId}`);
    if (targetSection) {
        targetSection.style.display = 'block';
    }
    
    // Update nav active state
    document.querySelectorAll('.admin-nav a').forEach(link => {
        link.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Reset form when showing add-review
    if (sectionId === 'add-review') {
        resetForm();
    }
    
    // Refresh data when showing reviews
    if (sectionId === 'reviews') {
        renderAllReviews();
    }
}

// ============================================
// Dashboard Functions
// ============================================

/**
 * Update dashboard statistics
 */
function updateDashboardStats() {
    const reviews = window.ReviewsData.getAllReviews();
    
    // Total reviews
    document.getElementById('stat-total').textContent = reviews.length;
    
    // Average rating
    const avgRating = reviews.length > 0 
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : 0;
    document.getElementById('stat-avg').textContent = avgRating;
    
    // Unique genres
    const genres = window.ReviewsData.getUniqueGenres();
    document.getElementById('stat-genres').textContent = genres.length;
    
    // Unique platforms
    const platforms = window.ReviewsData.getUniquePlatforms();
    document.getElementById('stat-platforms').textContent = platforms.length;
}

/**
 * Render recent reviews table on dashboard
 */
function renderRecentReviews() {
    const container = document.getElementById('recent-reviews-table');
    if (!container) return;
    
    const reviews = window.ReviewsData.getLatestReviews(5);
    
    if (reviews.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted);">No reviews yet.</p>';
        return;
    }
    
    container.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Title</th>
                    <th>Rating</th>
                    <th>Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${reviews.map(review => `
                    <tr>
                        <td>
                            <a href="review.html?slug=${review.slug}" target="_blank">${review.title}</a>
                        </td>
                        <td>
                            <span class="${window.ReviewsData.getRatingClass(review.rating)}">${review.rating}/10</span>
                        </td>
                        <td>${window.ReviewsData.formatDate(review.date)}</td>
                        <td>
                            <div class="actions">
                                <button class="btn btn-sm btn-secondary" onclick="editReview(${review.id})">
                                    Edit
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// ============================================
// Reviews Table Functions
// ============================================

/**
 * Render all reviews in the admin table
 */
function renderAllReviews() {
    const container = document.getElementById('reviews-table-body');
    if (!container) return;
    
    const searchTerm = document.getElementById('admin-search')?.value.toLowerCase() || '';
    let reviews = window.ReviewsData.getAllReviews();
    
    // Filter by search
    if (searchTerm) {
        reviews = reviews.filter(r => 
            r.title.toLowerCase().includes(searchTerm) ||
            r.genre.toLowerCase().includes(searchTerm) ||
            r.author.toLowerCase().includes(searchTerm)
        );
    }
    
    // Sort by date (newest first)
    reviews.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (reviews.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: var(--text-muted);">
                    No reviews found.
                </td>
            </tr>
        `;
        return;
    }
    
    container.innerHTML = reviews.map(review => `
        <tr>
            <td>${review.id}</td>
            <td>
                <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
                    ${review.featured ? '[Featured]' : ''}
                    <a href="review.html?slug=${review.slug}" target="_blank">${review.title}</a>
                </div>
            </td>
            <td>${review.genre}</td>
            <td>
                <span class="${window.ReviewsData.getRatingClass(review.rating)}" style="font-weight: 600;">
                    ${review.rating}/10
                </span>
            </td>
            <td>${review.author}</td>
            <td>${window.ReviewsData.formatDate(review.date)}</td>
            <td>
                <div class="actions">
                    <button class="btn btn-sm btn-secondary" onclick="editReview(${review.id})" title="Edit">
                        Edit
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="deleteReviewConfirm(${review.id})" title="Delete" style="color: var(--accent-danger);">
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Filter admin reviews based on search input
 */
function filterAdminReviews() {
    renderAllReviews();
}

// ============================================
// Review Form Functions
// ============================================

/**
 * Handle review form submission
 * @param {Event} event - Form submit event
 */
function handleReviewSubmit(event) {
    event.preventDefault();
    
    const reviewId = document.getElementById('review-id').value;
    const isEditing = reviewId !== '';
    
    // Gather form data
    // Get selected platforms from checkboxes
    const selectedPlatforms = Array.from(document.querySelectorAll('input[name="platform"]:checked')).map(cb => cb.value);
    
    const reviewData = {
        title: document.getElementById('review-title').value.trim(),
        genre: document.getElementById('review-genre').value,
        platform: selectedPlatforms,
        rating: parseInt(document.getElementById('review-rating').value),
        author: document.getElementById('review-author').value,
        date: document.getElementById('review-date').value || new Date().toISOString().split('T')[0],
        featured: document.getElementById('review-featured').checked,
        coverImage: document.getElementById('review-cover').value.trim() || 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&h=600&fit=crop',
        headerImage: document.getElementById('review-header').value.trim() || 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1600&h=900&fit=crop',
        tags: document.getElementById('review-tags').value.split(',').map(t => t.trim()).filter(t => t),
        excerpt: generateExcerpt(document.getElementById('review-content').value.trim()),
        content: document.getElementById('review-content').value.trim(),
        authorAvatar: getAuthorAvatar(document.getElementById('review-author').value)
    };
    
    // Validate
    if (!reviewData.title || !reviewData.genre || !reviewData.platform.length || 
        !reviewData.rating || !reviewData.author || !reviewData.content) {
        if (!reviewData.platform.length) {
            window.GameReviewUtils.showToast('Please select at least one platform.', 'error');
        } else {
            window.GameReviewUtils.showToast('Please fill in all required fields.', 'error');
        }
        return;
    }
    
    // If featured, unset other featured reviews
    if (reviewData.featured) {
        const allReviews = window.ReviewsData.getAllReviews();
        allReviews.forEach(r => {
            if (r.featured && (!isEditing || r.id !== parseInt(reviewId))) {
                window.ReviewsData.updateReview(r.id, { featured: false });
            }
        });
    }
    
    // Save review
    if (isEditing) {
        window.ReviewsData.updateReview(parseInt(reviewId), reviewData);
        window.GameReviewUtils.showToast('Review updated successfully!', 'success');
    } else {
        window.ReviewsData.addReview(reviewData);
        window.GameReviewUtils.showToast('Review added successfully!', 'success');
    }
    
    // Refresh data and show reviews list
    updateDashboardStats();
    renderRecentReviews();
    renderAllReviews();
    
    // Navigate to reviews section
    showSection('reviews');
}

/**
 * Get author avatar URL based on author name
 * @param {string} author - Author name
 * @returns {string} Avatar URL
 */
function getAuthorAvatar(author) {
    const avatars = {
        'Alex': 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
        'Jordan': 'https://images.unsplash.com/photo-1599566150163-29194dcabd36?w=100&h=100&fit=crop'
    };
    return avatars[author] || avatars['Alex'];
}

/**
 * Edit an existing review
 * @param {number} id - Review ID
 */
function editReview(id) {
    const review = window.ReviewsData.getReviewById(id);
    if (!review) {
        window.GameReviewUtils.showToast('Review not found.', 'error');
        return;
    }
    
    // Populate form
    document.getElementById('review-id').value = review.id;
    document.getElementById('review-title').value = review.title;
    document.getElementById('review-genre').value = review.genre;
    
    // Set platform checkboxes
    document.querySelectorAll('input[name="platform"]').forEach(cb => {
        cb.checked = review.platform.includes(cb.value);
    });
    
    document.getElementById('review-rating').value = review.rating;
    document.getElementById('review-author').value = review.author;
    document.getElementById('review-date').value = review.date;
    document.getElementById('review-featured').checked = review.featured;
    document.getElementById('review-cover').value = review.coverImage;
    document.getElementById('review-header').value = review.headerImage;
    document.getElementById('review-tags').value = review.tags.join(', ');
    document.getElementById('review-content').value = review.content;
    
    // Update form title
    document.getElementById('form-title').textContent = 'Edit Review';
    
    // Show form section
    document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none');
    document.getElementById('section-add-review').style.display = 'block';
    
    // Update nav
    document.querySelectorAll('.admin-nav a').forEach(link => link.classList.remove('active'));
}

/**
 * Reset the review form
 */
function resetForm() {
    document.getElementById('review-form').reset();
    document.getElementById('review-id').value = '';
    document.getElementById('form-title').textContent = 'Add New Review';
    document.getElementById('review-date').value = new Date().toISOString().split('T')[0];
    
    // Uncheck all platform checkboxes
    document.querySelectorAll('input[name="platform"]').forEach(cb => {
        cb.checked = false;
    });
}

/**
 * Confirm and delete a review
 * @param {number} id - Review ID
 */
function deleteReviewConfirm(id) {
    const review = window.ReviewsData.getReviewById(id);
    if (!review) return;
    
    if (confirm(`Are you sure you want to delete "${review.title}"? This cannot be undone.`)) {
        window.ReviewsData.deleteReview(id);
        window.GameReviewUtils.showToast('Review deleted successfully.', 'success');
        updateDashboardStats();
        renderRecentReviews();
        renderAllReviews();
    }
}

// ============================================
// Data Import/Export Functions
// ============================================

/**
 * Export all reviews to JSON file
 */
function exportReviews() {
    const reviews = window.ReviewsData.getAllReviews();
    const dataStr = JSON.stringify(reviews, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportName = `gamereviewhub-reviews-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportName);
    linkElement.click();
    
    window.GameReviewUtils.showToast('Reviews exported successfully!', 'success');
}

/**
 * Import reviews from JSON file
 * @param {Event} event - File input change event
 */
function importReviews(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedReviews = JSON.parse(e.target.result);
            
            if (!Array.isArray(importedReviews)) {
                throw new Error('Invalid format');
            }
            
            // Add each imported review
            let addedCount = 0;
            importedReviews.forEach(review => {
                // Remove id to generate new one
                delete review.id;
                delete review.slug;
                window.ReviewsData.addReview(review);
                addedCount++;
            });
            
            updateDashboardStats();
            renderRecentReviews();
            renderAllReviews();
            
            window.GameReviewUtils.showToast(`Successfully imported ${addedCount} reviews!`, 'success');
        } catch (error) {
            window.GameReviewUtils.showToast('Failed to import: Invalid file format.', 'error');
        }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
}

/**
 * Confirm and reset all data to defaults
 */
function confirmReset() {
    if (confirm('Are you sure you want to reset all reviews to default data? This will delete any custom reviews you\'ve added.')) {
        window.ReviewsData.resetReviews();
        updateDashboardStats();
        renderRecentReviews();
        renderAllReviews();
        window.GameReviewUtils.showToast('All data has been reset to defaults.', 'success');
    }
}

/**
 * Reset reviews data (called from table view)
 */
function resetReviewsData() {
    confirmReset();
}

// Export functions for inline handlers
window.showSection = showSection;
window.editReview = editReview;
window.deleteReviewConfirm = deleteReviewConfirm;
window.handleReviewSubmit = handleReviewSubmit;
window.resetForm = resetForm;
window.filterAdminReviews = filterAdminReviews;
window.exportReviews = exportReviews;
window.importReviews = importReviews;
window.confirmReset = confirmReset;
window.resetReviewsData = resetReviewsData;
