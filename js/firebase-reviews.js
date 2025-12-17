/**
 * ============================================
 * Firebase Reviews Data Management
 * ============================================
 */

// Collection reference
const reviewsCollection = db.collection('reviews');

// ============================================
// Read Operations (Public)
// ============================================

/**
 * Get all reviews
 */
async function getAllReviewsFirebase() {
    try {
        const snapshot = await reviewsCollection.orderBy('date', 'desc').get();
        const reviews = [];
        snapshot.forEach(doc => {
            reviews.push({ id: doc.id, slug: doc.id, ...doc.data() });
        });
        return reviews;
    } catch (error) {
        console.error("Error getting reviews:", error);
        return [];
    }
}

/**
 * Get single review by slug/ID
 */
async function getReviewBySlug(slug) {
    try {
        const doc = await reviewsCollection.doc(slug).get();
        if (doc.exists) {
            return { id: doc.id, slug: doc.id, ...doc.data() };
        }
        return null;
    } catch (error) {
        console.error("Error getting review:", error);
        return null;
    }
}

/**
 * Get featured review
 */
async function getFeaturedReviewFirebase() {
    try {
        // Get all reviews and find featured one
        const snapshot = await reviewsCollection.get();
        let featuredReview = null;
        let latestReview = null;
        let latestDate = null;
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const review = { id: doc.id, slug: doc.id, ...data };
            
            // Check if this is the featured review
            if (data.featured === true) {
                featuredReview = review;
            }
            
            // Track latest review by date
            const reviewDate = data.date ? new Date(data.date) : new Date(0);
            if (!latestDate || reviewDate > latestDate) {
                latestDate = reviewDate;
                latestReview = review;
            }
        });
        
        // Return featured if found, otherwise return latest
        return featuredReview || latestReview || null;
    } catch (error) {
        console.error("Error getting featured review:", error);
        return null;
    }
}

/**
 * Get latest reviews
 */
async function getLatestReviews(limit = 6) {
    try {
        const snapshot = await reviewsCollection.orderBy('date', 'desc').limit(limit).get();
        const reviews = [];
        snapshot.forEach(doc => {
            reviews.push({ id: doc.id, slug: doc.id, ...doc.data() });
        });
        return reviews;
    } catch (error) {
        console.error("Error getting latest reviews:", error);
        return [];
    }
}

/**
 * Filter reviews
 */
async function filterReviewsFirebase(filters) {
    try {
        let reviews = await getAllReviewsFirebase();
        
        // Filter by genre
        if (filters.genre && filters.genre !== 'all') {
            reviews = reviews.filter(r => r.genre === filters.genre);
        }
        
        // Filter by platform
        if (filters.platform && filters.platform !== 'all') {
            reviews = reviews.filter(r => 
                r.platform && (
                    Array.isArray(r.platform) 
                        ? r.platform.includes(filters.platform)
                        : r.platform === filters.platform
                )
            );
        }
        
        // Filter by rating
        if (filters.rating && filters.rating !== 'all') {
            const [min, max] = filters.rating.split('-').map(Number);
            reviews = reviews.filter(r => r.rating >= min && r.rating <= max);
        }
        
        // Filter by search
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            reviews = reviews.filter(r => 
                r.title.toLowerCase().includes(searchLower) ||
                (r.excerpt && r.excerpt.toLowerCase().includes(searchLower))
            );
        }
        
        return reviews;
    } catch (error) {
        console.error("Error filtering reviews:", error);
        return [];
    }
}

// ============================================
// Write Operations (Admin Only)
// ============================================

/**
 * Generate URL-friendly slug from title
 */
function generateSlug(title) {
    return title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

/**
 * Remove featured status from all reviews
 */
async function clearFeaturedStatus() {
    try {
        const snapshot = await reviewsCollection.get();
        const batch = db.batch();
        
        snapshot.forEach(doc => {
            if (doc.data().featured === true) {
                batch.update(doc.ref, { featured: false });
            }
        });
        
        await batch.commit();
    } catch (error) {
        console.error("Error clearing featured status:", error);
    }
}

/**
 * Get all featured reviews
 */
async function getAllFeaturedReviews() {
    try {
        const snapshot = await reviewsCollection.get();
        const featuredReviews = [];
        
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.featured === true) {
                featuredReviews.push({ id: doc.id, slug: doc.id, ...data });
            }
        });
        
        // Sort by date descending
        featuredReviews.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        return featuredReviews;
    } catch (error) {
        console.error("Error getting featured reviews:", error);
        return [];
    }
}

/**
 * Add new review (admin only)
 */
async function addReviewFirebase(reviewData) {
    const user = auth.currentUser;
    if (!user || !window.firebaseAuth.isAdmin(user)) {
        return { success: false, error: "Unauthorized" };
    }
    
    try {
        const slug = generateSlug(reviewData.title);
        
        const review = {
            ...reviewData,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: user.email
        };
        
        await reviewsCollection.doc(slug).set(review);
        return { success: true, id: slug };
    } catch (error) {
        console.error("Error adding review:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Update review (admin only)
 */
async function updateReviewFirebase(id, reviewData) {
    const user = auth.currentUser;
    if (!user || !window.firebaseAuth.isAdmin(user)) {
        return { success: false, error: "Unauthorized" };
    }
    
    try {
        const review = {
            ...reviewData,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: user.email
        };
        
        await reviewsCollection.doc(id).update(review);
        return { success: true };
    } catch (error) {
        console.error("Error updating review:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Delete review (admin only)
 */
async function deleteReviewFirebase(id) {
    const user = auth.currentUser;
    if (!user || !window.firebaseAuth.isAdmin(user)) {
        return { success: false, error: "Unauthorized" };
    }
    
    try {
        await reviewsCollection.doc(id).delete();
        return { success: true };
    } catch (error) {
        console.error("Error deleting review:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Get dashboard stats
 */
async function getDashboardStats() {
    const reviews = await getAllReviewsFirebase();
    
    const totalReviews = reviews.length;
    const avgRating = reviews.length > 0 
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : 0;
    const featuredCount = reviews.filter(r => r.featured).length;
    const genres = [...new Set(reviews.map(r => r.genre))];
    
    return {
        totalReviews,
        avgRating,
        featuredCount,
        genreCount: genres.length,
        genres
    };
}

// Make functions globally available
window.FirebaseReviews = {
    getAllReviews: getAllReviewsFirebase,
    getReviewBySlug,
    getFeaturedReview: getFeaturedReviewFirebase,
    getAllFeaturedReviews,
    getLatestReviews,
    filterReviews: filterReviewsFirebase,
    addReview: addReviewFirebase,
    updateReview: updateReviewFirebase,
    deleteReview: deleteReviewFirebase,
    getDashboardStats,
    generateSlug
};
