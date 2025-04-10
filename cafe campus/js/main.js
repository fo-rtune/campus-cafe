/**
 * Main JavaScript for the Campus Cafe website
 */

// DOM Elements
const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
const mainNav = document.querySelector('.main-nav');
const contactForm = document.getElementById('contact-form');
const featuredDishesContainer = document.getElementById('featured-dishes-container');

// Auto-refresh configuration
const REFRESH_INTERVAL = 60000; // 60 seconds
let refreshTimerId = null;

// Toggle mobile navigation
if (mobileNavToggle) {
    mobileNavToggle.addEventListener('click', () => {
        mainNav.classList.toggle('active');
        
        // Change icon based on menu state
        const icon = mobileNavToggle.querySelector('i');
        if (mainNav.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });
}

// Close mobile nav when clicking outside
document.addEventListener('click', (e) => {
    if (mainNav && mainNav.classList.contains('active') && !e.target.closest('.mobile-nav-toggle') && !e.target.closest('.main-nav')) {
        mainNav.classList.remove('active');
        const icon = mobileNavToggle.querySelector('i');
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
    }
});

/**
 * Start auto-refresh timer
 */
function startAutoRefresh() {
    if (refreshTimerId) {
        clearInterval(refreshTimerId);
    }
    
    refreshTimerId = setInterval(() => {
        loadFeaturedDishes();
    }, REFRESH_INTERVAL);
}

/**
 * Stop auto-refresh timer
 */
function stopAutoRefresh() {
    if (refreshTimerId) {
        clearInterval(refreshTimerId);
        refreshTimerId = null;
    }
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether email is valid
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Show alert message to user
 * @param {string} message - Message to display
 * @param {string} type - Alert type ('success' or 'error')
 */
function showAlert(message, type = 'success', container = null) {
    const alertEl = document.createElement('div');
    alertEl.className = `alert alert-${type}`;
    alertEl.textContent = message;
    
    if (container) {
        container.insertBefore(alertEl, container.firstChild);
    } else if (contactForm) {
        const formContainer = contactForm.parentElement;
        formContainer.insertBefore(alertEl, contactForm);
    } else {
        document.body.appendChild(alertEl);
        alertEl.style.position = 'fixed';
        alertEl.style.top = '20px';
        alertEl.style.left = '50%';
        alertEl.style.transform = 'translateX(-50%)';
        alertEl.style.zIndex = '1000';
    }
    
    setTimeout(() => {
        if (alertEl.parentNode) {
            alertEl.parentNode.removeChild(alertEl);
        }
    }, 5000);
}

/**
 * Load featured dishes
 */
async function loadFeaturedDishes() {
    if (!featuredDishesContainer) return;
    
    try {
        const menuItems = storageManager.getMenuItems();
        const featuredDishes = menuItems.filter(item => item.featured);
        
        if (featuredDishes.length > 0) {
            featuredDishesContainer.innerHTML = '';
            
            // Limit to 3 featured dishes
            const displayDishes = featuredDishes.slice(0, 3);
            
            displayDishes.forEach(dish => {
                const dishCard = createDishCard(dish);
                featuredDishesContainer.appendChild(dishCard);
            });
            
            // Add animation effects with staggered delays
            const dishCards = featuredDishesContainer.querySelectorAll('.dish-card');
            dishCards.forEach((card, index) => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 100 * index);
            });
        } else {
            featuredDishesContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-utensils"></i>
                    <p>No featured dishes yet. Check back soon!</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading featured dishes:', error);
        featuredDishesContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Could not load featured dishes. Please try again later.</p>
            </div>
        `;
    }
}

/**
 * Create a dish card element
 * @param {Object} dish - Dish data
 * @returns {HTMLElement} - Dish card element
 */
function createDishCard(dish) {
    const card = document.createElement('div');
    card.className = 'dish-card';
    
    const categoryLabel = formatCategoryLabel(dish.category);
    
    // Determine if we should show image or placeholder
    const imageHtml = dish.imageUrl ? 
        `<img src="${escapeHtml(dish.imageUrl)}" alt="${escapeHtml(dish.name)}" class="dish-img">` :
        `<div class="image-placeholder"><i class="fas fa-utensils"></i><span>${dish.name}</span></div>`;
    
    card.innerHTML = `
        <div class="dish-image">
            ${imageHtml}
        </div>
        <div class="dish-info">
            <div class="dish-category">${categoryLabel}</div>
            <h3 class="dish-name">${escapeHtml(dish.name)}</h3>
            <div class="dish-price">KSh ${dish.price}</div>
            <p class="dish-description">${escapeHtml(dish.description)}</p>
            <div class="dish-actions">
                <a href="menu.html#${dish.id}" class="btn btn-secondary btn-small">View Details</a>
                <button class="btn btn-primary btn-small order-btn" data-id="${dish.id}">
                    <i class="fas fa-shopping-cart"></i> Order
                </button>
            </div>
        </div>
    `;
    
    // Add click event for order button
    const orderBtn = card.querySelector('.order-btn');
    if (orderBtn) {
        orderBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Navigate to menu page with hash
            window.location.href = `menu.html#${dish.id}`;
        });
    }
    
    return card;
}

/**
 * Format category label for display
 * @param {string} category - Category key
 * @returns {string} - Formatted category label
 */
function formatCategoryLabel(category) {
    const categories = {
        'appetizers': 'Breakfast',
        'main-courses': 'Main Course',
        'desserts': 'Dessert',
        'drinks': 'Drink'
    };
    
    return categories[category] || 'Other';
}

/**
 * Escape HTML to prevent XSS
 * @param {string} unsafe - Unsafe string
 * @returns {string} - Escaped string
 */
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') {
        return '';
    }
    
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Check if the device is a mobile device
 * @returns {boolean} - Whether the device is mobile
 */
function isMobileDevice() {
    return window.innerWidth < 768 || 
           navigator.userAgent.match(/Android/i) || 
           navigator.userAgent.match(/iPhone|iPad|iPod/i);
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    storageManager.initStorage();
    loadFeaturedDishes();
    startAutoRefresh();
    
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopAutoRefresh();
        } else {
            loadFeaturedDishes();
            startAutoRefresh();
        }
    });
});

// Clean up resources when page is unloaded
window.addEventListener('beforeunload', () => {
    stopAutoRefresh();
});
