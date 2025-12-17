/**
 * ============================================
 * RAWG API Integration
 * ============================================
 * 
 * Auto-fill game information in admin panel
 */

const RAWG_API_KEY = '9267f84021844517bc853d4a62e62988';
const RAWG_BASE_URL = 'https://api.rawg.io/api';

/**
 * Search for games by name
 */
async function searchGames(query) {
    if (!query || query.length < 2) {
        return [];
    }
    
    try {
        const response = await fetch(
            `${RAWG_BASE_URL}/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(query)}&page_size=8`
        );
        
        if (!response.ok) {
            throw new Error('RAWG API error');
        }
        
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error('RAWG search error:', error);
        return [];
    }
}

/**
 * Get detailed game information by ID
 */
async function getGameDetails(gameId) {
    try {
        const response = await fetch(
            `${RAWG_BASE_URL}/games/${gameId}?key=${RAWG_API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error('RAWG API error');
        }
        
        return await response.json();
    } catch (error) {
        console.error('RAWG details error:', error);
        return null;
    }
}

/**
 * Map RAWG genre to our genre options
 */
function mapGenre(rawgGenres) {
    if (!rawgGenres || rawgGenres.length === 0) return '';
    
    const genreMap = {
        'action': 'Action Adventure',
        'adventure': 'Action Adventure',
        'rpg': 'RPG',
        'shooter': 'FPS',
        'strategy': 'Strategy',
        'sports': 'Sports',
        'racing': 'Racing',
        'puzzle': 'Puzzle',
        'simulation': 'Simulation',
        'indie': 'Indie',
        'horror': 'Horror'
    };
    
    // Check for Action RPG (has both action and rpg)
    const genreNames = rawgGenres.map(g => g.slug.toLowerCase());
    if (genreNames.includes('action') && genreNames.includes('rpg')) {
        return 'Action RPG';
    }
    
    // Find first matching genre
    for (const genre of rawgGenres) {
        const mapped = genreMap[genre.slug.toLowerCase()];
        if (mapped) return mapped;
    }
    
    return 'Other';
}

/**
 * Map RAWG platforms to our platform checkboxes
 */
function mapPlatforms(rawgPlatforms) {
    if (!rawgPlatforms) return [];
    
    const platformMap = {
        'pc': 'PC',
        'playstation5': 'PS5',
        'playstation4': 'PS4',
        'xbox-series-x': 'Xbox Series X',
        'xbox-one': 'Xbox One',
        'nintendo-switch': 'Nintendo Switch',
        'ios': 'Mobile',
        'android': 'Mobile'
    };
    
    const mapped = new Set();
    
    for (const p of rawgPlatforms) {
        const slug = p.platform?.slug || '';
        if (platformMap[slug]) {
            mapped.add(platformMap[slug]);
        }
    }
    
    return Array.from(mapped);
}

/**
 * Generate tags from RAWG data
 */
function generateTags(game) {
    const tags = [];
    
    // Add genres as tags
    if (game.genres) {
        game.genres.slice(0, 3).forEach(g => tags.push(g.name));
    }
    
    // Add some RAWG tags
    if (game.tags) {
        const goodTags = game.tags
            .filter(t => t.language === 'eng')
            .slice(0, 3)
            .map(t => t.name);
        tags.push(...goodTags);
    }
    
    return [...new Set(tags)].slice(0, 5);
}

/**
 * Map possible game modes from RAWG data (tags or game_modes)
 */
function mapModes(game) {
    if (!game) return [];

    // If RAWG provides a dedicated game_modes field, try to use it
    if (game.game_modes && Array.isArray(game.game_modes) && game.game_modes.length > 0) {
        // game_modes might be array of objects or strings
        return game.game_modes.map(m => (typeof m === 'string' ? m : (m.name || m.title || ''))).filter(Boolean);
    }

    // Fallback: inspect tags for common mode keywords
    const modeKeywords = {
        'singleplayer': 'Singleplayer',
        'multiplayer': 'Multiplayer',
        'co-op': 'Co-op',
        'coop': 'Co-op',
        'cooperative': 'Co-op',
        'local multiplayer': 'Local Multiplayer',
        'online multiplayer': 'Online Multiplayer',
        'split-screen': 'Split-screen',
        'split screen': 'Split-screen'
    };

    const found = new Set();

    if (game.tags && Array.isArray(game.tags)) {
        game.tags.forEach(t => {
            const name = (t.name || t.slug || '').toLowerCase();
            Object.keys(modeKeywords).forEach(k => {
                if (name.includes(k)) found.add(modeKeywords[k]);
            });
        });
    }

    // Also check genres and description/name for hints
    if (game.genres && Array.isArray(game.genres)) {
        game.genres.forEach(g => {
            const name = (g.name || g.slug || '').toLowerCase();
            if (name.includes('multiplayer')) found.add('Multiplayer');
            if (name.includes('co-op') || name.includes('cooperative')) found.add('Co-op');
        });
    }

    // As last resort, check short description or name
    const textFields = [game.name || '', game.description_raw || '', game.description || ''].join(' ').toLowerCase();
    Object.keys(modeKeywords).forEach(k => {
        if (textFields.includes(k)) found.add(modeKeywords[k]);
    });

    return Array.from(found);
}

/**
 * Fill form with game data
 */
function fillFormWithGame(game) {
    // Title
    document.getElementById('review-title').value = game.name || '';

    // Genre
    const genreSelect = document.getElementById('review-genre');
    const mappedGenre = mapGenre(game.genres);
    if (mappedGenre) {
        genreSelect.value = mappedGenre;
    }

    // Platforms
    const platforms = mapPlatforms(game.platforms);
    document.querySelectorAll('#review-platforms input[type="checkbox"]').forEach(cb => {
        cb.checked = platforms.includes(cb.value);
    });

    // Cover Image (use background_image from RAWG)
    if (game.background_image) {
        document.getElementById('review-cover').value = game.background_image;
        document.getElementById('review-header').value = game.background_image;
    }

    // Tags
    const tags = generateTags(game);
    document.getElementById('review-tags').value = tags.join(', ');

    // Developers
    if (game.developers && game.developers.length > 0) {
        document.getElementById('review-developers').value = game.developers.map(d => d.name).join(', ');
    }

    // Publishers
    if (game.publishers && game.publishers.length > 0) {
        document.getElementById('review-publishers').value = game.publishers.map(p => p.name).join(', ');
    }

    // Game Modes
    const modes = mapModes(game);
    if (document.getElementById('review-modes')) {
        document.getElementById('review-modes').value = modes.join(', ');
    }

    // Hide search results
    const resultsContainer = document.getElementById('game-search-results');
    if (resultsContainer) {
        resultsContainer.style.display = 'none';
    }

    // Show success message
    showSearchMessage(`✓ Filled with "${game.name}" data`, 'success');
}

/**
 * Show search status message
 */
function showSearchMessage(message, type = 'info') {
    const msgEl = document.getElementById('search-message');
    if (msgEl) {
        msgEl.textContent = message;
        msgEl.style.color = type === 'success' ? 'var(--accent-success)' : 
                           type === 'error' ? 'var(--accent-danger)' : 
                           'var(--text-muted)';
    }
}

/**
 * Render search results
 */
function renderSearchResults(games) {
    const container = document.getElementById('game-search-results');
    if (!container) return;
    
    if (games.length === 0) {
        container.innerHTML = '<p style="padding: var(--spacing-md); color: var(--text-muted);">No games found</p>';
        container.style.display = 'block';
        return;
    }
    
    container.innerHTML = games.map(game => `
        <div class="search-result-item" onclick="selectGame(${game.id})" style="
            display: flex;
            gap: var(--spacing-md);
            padding: var(--spacing-md);
            cursor: pointer;
            border-bottom: 1px solid var(--border-color);
            transition: background 0.2s;
        " onmouseover="this.style.background='var(--bg-secondary)'" onmouseout="this.style.background='transparent'">
            <img src="${game.background_image || 'https://via.placeholder.com/60x80?text=No+Image'}" 
                 alt="${game.name}" 
                 style="width: 60px; height: 80px; object-fit: cover; border-radius: var(--radius-sm);">
            <div style="flex: 1; min-width: 0;">
                <div style="font-weight: 600; margin-bottom: 4px;">${game.name}</div>
                <div style="font-size: 0.85rem; color: var(--text-muted);">
                    ${game.released ? game.released.substring(0, 4) : 'N/A'} • 
                    ${game.genres?.map(g => g.name).slice(0, 2).join(', ') || 'Unknown genre'}
                </div>
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
                    ${game.platforms?.map(p => p.platform.name).slice(0, 3).join(', ') || ''}
                </div>
            </div>
        </div>
    `).join('');
    
    container.style.display = 'block';
}

/**
 * Select a game and fill the form
 */
async function selectGame(gameId) {
    showSearchMessage('Loading game details...', 'info');
    
    const game = await getGameDetails(gameId);
    if (game) {
        fillFormWithGame(game);
    } else {
        showSearchMessage('Failed to load game details', 'error');
    }
}

/**
 * Handle search input
 */
let searchTimeout;
function handleGameSearch(query) {
    clearTimeout(searchTimeout);
    
    const resultsContainer = document.getElementById('game-search-results');
    
    if (query.length < 2) {
        if (resultsContainer) resultsContainer.style.display = 'none';
        showSearchMessage('', 'info');
        return;
    }
    
    showSearchMessage('Searching...', 'info');
    
    // Debounce search
    searchTimeout = setTimeout(async () => {
        const games = await searchGames(query);
        renderSearchResults(games);
        showSearchMessage(games.length > 0 ? `Found ${games.length} games` : 'No games found', 
                         games.length > 0 ? 'success' : 'info');
    }, 300);
}

// Make functions globally available
window.RAWG = {
    searchGames,
    getGameDetails,
    handleGameSearch,
    selectGame
};

// expose helper for external use
window.RAWG.mapModes = mapModes;
