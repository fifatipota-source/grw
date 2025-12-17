# 🎮 GameReview Hub

A modern, responsive gaming review website built for two friends who love gaming. Features a clean dark theme, comprehensive review system, and admin panel for managing content.

## 📋 Features

### User-Facing Features
- **Home Page**: Featured reviews, latest posts, and site statistics
- **Reviews Page**: Browse all reviews with filters (genre, platform, rating, search)
- **Individual Review Pages**: Full review with ratings, pros/cons, related content
- **About Us Page**: Team profiles and site information
- **Contact Page**: Contact form and social media links

### Admin Features
- **Dashboard**: Overview statistics and recent reviews
- **Review Management**: Add, edit, and delete reviews
- **Data Export/Import**: Backup and restore reviews as JSON
- **Featured Reviews**: Mark reviews as featured

### Technical Features
- 📱 **Fully Responsive**: Works on all devices (mobile, tablet, desktop)
- 🌙 **Dark Mode**: Professional dark theme with subtle accent colors
- ⚡ **Fast Loading**: Optimized CSS and vanilla JavaScript
- 🔍 **SEO Friendly**: Semantic HTML, meta tags, and Open Graph support
- 💾 **Local Storage**: Data persists in browser (expandable to backend)
- 📝 **Well Commented**: Clean, documented code

## 🚀 Getting Started

### Quick Start
1. Open `index.html` in your web browser
2. That's it! The site works without a server

### For Development
If you want live reload during development:
```bash
# Using Python
python -m http.server 8000

# Using Node.js (npx)
npx serve

# Using VS Code
# Install "Live Server" extension and click "Go Live"
```

## 📁 Project Structure

```
grw/
├── index.html          # Home page
├── reviews.html        # All reviews with filters
├── review.html         # Individual review template
├── about.html          # About us page
├── contact.html        # Contact page
├── admin.html          # Admin panel
├── README.md           # This file
├── css/
│   └── style.css       # Main stylesheet (800+ lines of organized CSS)
└── js/
    ├── main.js         # Main site functionality
    ├── reviews-data.js # Reviews data store & utilities
    └── admin.js        # Admin panel functionality
```

## 🎨 Design System

### Colors
- **Background**: `#0d1117` (primary), `#161b22` (secondary)
- **Text**: `#e6edf3` (primary), `#8b949e` (secondary)
- **Accent**: `#58a6ff` (blue), `#3fb950` (green)
- **Warning**: `#d29922` (gold), `#f85149` (red)

### Typography
- **Headings**: Poppins (Google Fonts)
- **Body**: Inter (Google Fonts)

### Rating System
- **9-10**: Masterpiece (green)
- **7-8**: Great/Good (blue)
- **5-6**: Average/Decent (yellow)
- **1-4**: Below Average/Poor (red)

## 💻 Technologies Used

- **HTML5**: Semantic markup
- **CSS3**: Custom properties, Grid, Flexbox, animations
- **Vanilla JavaScript**: No frameworks required
- **Local Storage**: Client-side data persistence
- **Google Fonts**: Inter & Poppins

## 📝 Adding New Reviews

### Via Admin Panel (Recommended)
1. Click "Admin" in the navigation
2. Click "Add New Review"
3. Fill in the form fields
4. Click "Save Review"

### Programmatically
```javascript
// In browser console or your code
window.ReviewsData.addReview({
    title: "Game Title",
    genre: "Action RPG",
    platform: ["PC", "PS5"],
    rating: 9,
    excerpt: "Short description...",
    content: "<p>Full HTML review content...</p>",
    pros: ["Pro 1", "Pro 2"],
    cons: ["Con 1", "Con 2"],
    author: "Alex",
    tags: ["Open World", "Fantasy"]
});
```

## 🔧 Customization

### Changing Colors
Edit the CSS variables in `css/style.css`:
```css
:root {
    --bg-primary: #0d1117;
    --accent-primary: #58a6ff;
    /* ... more variables */
}
```

### Adding New Genres
Edit the genre dropdown in `admin.html`:
```html
<select id="review-genre">
    <option value="Your New Genre">Your New Genre</option>
    <!-- ... -->
</select>
```

### Adding Team Members
1. Update the author dropdown in `admin.html`
2. Add avatar URL in `js/admin.js` `getAuthorAvatar()` function
3. Add profile card in `about.html`

## 🚀 Future Expansion Ideas

The codebase is designed for easy expansion:

- **Backend Integration**: Replace localStorage with API calls
- **User Authentication**: Add login system for admin
- **Comments System**: Allow user comments on reviews
- **User Ratings**: Let visitors rate reviews
- **Video Reviews**: Add video embed support
- **Newsletter**: Connect to email service
- **Search Engine**: Add Algolia or similar

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## 📄 License

This project is open source and available for personal and commercial use.

## 🤝 Contributing

Feel free to fork, modify, and use this project as a starting point for your own gaming review site!

---

Made with ❤️ and lots of ☕ by two friends who love gaming.
