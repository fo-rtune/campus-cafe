/**
 * Menu Page JavaScript for Campus Cafe
 */

// DOM Elements
const menuContainer = document.getElementById('menu-container');
const searchInput = document.getElementById('menu-search');
const searchBtn = document.getElementById('search-btn');
const menuTabs = document.querySelectorAll('.menu-tab');
const noResults = document.querySelector('.no-results');
const itemModal = document.getElementById('item-modal');
const closeModalBtns = document.querySelectorAll('.close-modal');
const orderItemBtn = document.getElementById('order-item-btn');
const orderConfirmationModal = document.getElementById('order-confirmation-modal');
const closeConfirmationBtn = document.getElementById('close-confirmation');
const orderNumberSpan = document.getElementById('order-number');
const currentOrdersContainer = document.getElementById('current-orders');

// Current filter state
let currentCategory = 'all';
let currentSearchTerm = '';
let currentItem = null;
// Auto-refresh interval (in milliseconds)
const REFRESH_INTERVAL = 30000; // 30 seconds
let refreshTimerId = null;

/**
 * Initialize the menu page
 */
function initMenu() {
    // Load menu items
    loadMenuItems();
    
    // Display current orders if any
    displayCurrentOrders();
    
    // Add event listeners
    addEventListeners();
    
    // Start auto-refresh timer
    startAutoRefresh();
}

/**
 * Start auto-refresh timer
 */
function startAutoRefresh() {
    // Clear any existing timer
    if (refreshTimerId) {
        clearInterval(refreshTimerId);
    }
    
    // Set up auto-refresh timer
    refreshTimerId = setInterval(() => {
        console.log('Auto-refreshing menu data...');
        // Refresh menu items while preserving current filters
        filterMenuItems(currentCategory, currentSearchTerm);
        // Refresh current orders
        displayCurrentOrders();
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
 * Add all event listeners for the menu page
 */
function addEventListeners() {
    // Search functionality
    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }
    
    if (searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                handleSearch();
            }
            // Show all items when search field is cleared
            if (searchInput.value.trim() === '') {
                currentSearchTerm = '';
                filterMenuItems(currentCategory, '');
            }
        });
    }
    
    // Category tabs
    menuTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const category = tab.dataset.category;
            setActiveTab(tab);
            filterMenuItems(category, currentSearchTerm);
        });
    });
    
    // Close modals
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (e.target.closest('#item-modal')) {
                closeItemModal();
            } else if (e.target.closest('#order-confirmation-modal')) {
                closeConfirmationModal();
            }
        });
    });
    
    // Order button
    if (orderItemBtn) {
        orderItemBtn.addEventListener('click', placeOrder);
    }
    
    // Close confirmation button
    if (closeConfirmationBtn) {
        closeConfirmationBtn.addEventListener('click', closeConfirmationModal);
    }
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === itemModal) {
            closeItemModal();
        } else if (e.target === orderConfirmationModal) {
            closeConfirmationModal();
        }
    });
    
    // Close modals with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (itemModal && itemModal.style.display === 'block') {
                closeItemModal();
            } else if (orderConfirmationModal && orderConfirmationModal.style.display === 'block') {
                closeConfirmationModal();
            }
        }
    });
    
    // Handle hash in URL
    window.addEventListener('hashchange', handleHashChange);
    if (window.location.hash) {
        handleHashChange();
    }
    
    // Stop auto-refresh when page is hidden to save resources
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopAutoRefresh();
        } else {
            startAutoRefresh();
        }
    });
}

/**
 * Handle search functionality
 */
function handleSearch() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    currentSearchTerm = searchTerm;
    filterMenuItems(currentCategory, searchTerm);
}

/**
 * Set the active tab
 * @param {HTMLElement} activeTab - The tab to set as active
 */
function setActiveTab(activeTab) {
    menuTabs.forEach(tab => {
        tab.classList.remove('active');
    });
    activeTab.classList.add('active');
    currentCategory = activeTab.dataset.category;
}

/**
 * Filter menu items by category and search term
 * @param {string} category - Category to filter by
 * @param {string} searchTerm - Search term to filter by
 */
function filterMenuItems(category, searchTerm = '') {
    const menuItems = storageManager.getMenuItems();
    
    // Apply filters
    let filteredItems = menuItems;
    
    // Filter by category
    if (category !== 'all') {
        filteredItems = filteredItems.filter(item => item.category === category);
    }
    
    // Filter by search term
    if (searchTerm) {
        filteredItems = filteredItems.filter(item => {
            return (
                item.name.toLowerCase().includes(searchTerm) ||
                item.description.toLowerCase().includes(searchTerm) ||
                (item.ingredients && item.ingredients.some(ing => 
                    ing.toLowerCase().includes(searchTerm)
                ))
            );
        });
    }
    
    // Display filtered items
    displayMenuItems(filteredItems);
}

/**
 * Display menu items in the container
 * @param {Array} items - Array of menu items to display
 */
function displayMenuItems(items) {
    if (!menuContainer) return;
    
    // Clear container
    menuContainer.innerHTML = '';
    
    // Show "no results" message if needed
    if (items.length === 0) {
        if (noResults) {
            noResults.style.display = 'block';
        }
        return;
    }
    
    // Hide "no results" message
    if (noResults) {
        noResults.style.display = 'none';
    }
    
    // Create and append menu item elements
    items.forEach(item => {
        const menuItem = createMenuItem(item);
        menuContainer.appendChild(menuItem);
    });
    
    // Add animation effects with staggered delays
    const menuElements = menuContainer.querySelectorAll('.menu-item');
    menuElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, 50 * index);
    });
}

/**
 * Create a menu item element
 * @param {Object} item - Menu item data
 * @returns {HTMLElement} - Menu item element
 */
function createMenuItem(item) {
    const menuItem = document.createElement('div');
    menuItem.className = 'menu-item';
    menuItem.dataset.id = item.id;
    
    const categoryLabel = formatCategoryLabel(item.category);
    
    // Determine if we should show image or placeholder
    const imageHtml = item.imageUrl ? 
        `<img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.name)}" class="menu-item-img">` :
        `<div class="image-placeholder"><i class="fas fa-utensils"></i></div>`;
        
    menuItem.innerHTML = `
        <div class="menu-item-image">
            ${imageHtml}
        </div>
        <div class="menu-item-info">
            <div class="menu-item-category">${categoryLabel}</div>
            <h3 class="menu-item-name">${escapeHtml(item.name)}</h3>
            <div class="menu-item-price">KSh ${item.price}</div>
            <p class="menu-item-description">${escapeHtml(item.description)}</p>
            <button class="order-btn btn btn-small">Order Now</button>
        </div>
    `;
    
    // Add click event to open modal
    const orderBtn = menuItem.querySelector('.order-btn');
    orderBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openItemModal(item);
    });
    
    menuItem.addEventListener('click', () => {
        openItemModal(item);
    });
    
    return menuItem;
}

/**
 * Open modal with item details
 * @param {Object} item - Menu item data
 */
function openItemModal(item) {
    if (!itemModal) return;
    
    // Store current item reference
    currentItem = item;
    
    // Set modal content
    document.getElementById('modal-item-name').textContent = item.name;
    document.getElementById('modal-item-description').textContent = item.description;
    document.getElementById('modal-item-price').textContent = `KSh ${item.price}`;
    document.getElementById('modal-item-category').textContent = formatCategoryLabel(item.category);
    
    // Set the image
    const imageContainer = document.getElementById('modal-item-image');
    if (imageContainer) {
        if (item.imageUrl) {
            imageContainer.innerHTML = `<img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.name)}" class="modal-item-img">`;
        } else {
            imageContainer.innerHTML = `<div class="image-placeholder"><i class="fas fa-utensils"></i></div>`;
        }
    }
    
    // Set ingredients list
    const ingredientsList = document.getElementById('modal-item-ingredients');
    ingredientsList.innerHTML = '';
    
    if (item.ingredients && item.ingredients.length > 0) {
        item.ingredients.forEach(ingredient => {
            const li = document.createElement('li');
            li.textContent = ingredient;
            ingredientsList.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.textContent = 'No ingredients listed';
        ingredientsList.appendChild(li);
    }
    
    // Add quantity controls
    const actionsContainer = document.querySelector('.modal-item-actions');
    if (actionsContainer) {
        actionsContainer.innerHTML = `
            <div class="quantity-control">
                <button class="quantity-btn decrease-btn" id="decrease-quantity">-</button>
                <input type="number" id="item-quantity" class="quantity-input" value="1" min="1" max="99">
                <button class="quantity-btn increase-btn" id="increase-quantity">+</button>
            </div>
            <div class="action-buttons">
                <button id="add-to-cart-btn" class="btn btn-secondary">
                    <i class="fas fa-cart-plus"></i> Add to Cart
                </button>
                <button id="order-item-btn" class="btn btn-primary">
                    <i class="fas fa-shopping-cart"></i> Order Now
                </button>
            </div>
        `;
        
        // Add event listeners for quantity buttons
        const decreaseBtn = document.getElementById('decrease-quantity');
        const increaseBtn = document.getElementById('increase-quantity');
        const quantityInput = document.getElementById('item-quantity');
        const addToCartBtn = document.getElementById('add-to-cart-btn');
        const orderBtn = document.getElementById('order-item-btn');
        
        if (decreaseBtn) {
            decreaseBtn.addEventListener('click', () => {
                let quantity = parseInt(quantityInput.value) - 1;
                if (quantity < 1) quantity = 1;
                quantityInput.value = quantity;
            });
        }
        
        if (increaseBtn) {
            increaseBtn.addEventListener('click', () => {
                let quantity = parseInt(quantityInput.value) + 1;
                if (quantity > 99) quantity = 99;
                quantityInput.value = quantity;
            });
        }
        
        if (quantityInput) {
            quantityInput.addEventListener('change', () => {
                let quantity = parseInt(quantityInput.value);
                if (isNaN(quantity) || quantity < 1) {
                    quantity = 1;
                    quantityInput.value = 1;
                } else if (quantity > 99) {
                    quantity = 99;
                    quantityInput.value = 99;
                }
            });
        }
        
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', addToCart);
        }
        
        if (orderBtn) {
            orderBtn.addEventListener('click', placeOrder);
        }
    }
    
    // Update URL hash
    window.location.hash = item.id;
    
    // Show modal
    itemModal.style.display = 'block';
    
    // Apply entrance animation
    const modalContent = itemModal.querySelector('.modal-content');
    modalContent.style.opacity = '0';
    modalContent.style.transform = 'translateY(-20px)';
    
    setTimeout(() => {
        modalContent.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        modalContent.style.opacity = '1';
        modalContent.style.transform = 'translateY(0)';
    }, 10);
}

/**
 * Close the item modal
 */
function closeItemModal() {
    if (!itemModal) return;
    
    // Update URL hash
    history.pushState('', document.title, window.location.pathname + window.location.search);
    
    // Apply exit animation
    const modalContent = itemModal.querySelector('.modal-content');
    modalContent.style.opacity = '0';
    modalContent.style.transform = 'translateY(-20px)';
    
    setTimeout(() => {
        itemModal.style.display = 'none';
        // Reset animation
        modalContent.style.transition = '';
    }, 300);
}

/**
 * Close the order confirmation modal
 */
function closeConfirmationModal() {
    if (!orderConfirmationModal) return;
    
    // Apply exit animation
    const modalContent = orderConfirmationModal.querySelector('.modal-content');
    modalContent.style.opacity = '0';
    modalContent.style.transform = 'translateY(-20px)';
    
    setTimeout(() => {
        orderConfirmationModal.style.display = 'none';
        // Reset animation
        modalContent.style.transition = '';
    }, 300);
    
    // Update current orders display
    displayCurrentOrders();
}

/**
 * Add current item to cart
 */
function addToCart() {
    if (!currentItem) return;
    
    // Get quantity
    const quantityInput = document.getElementById('item-quantity');
    const quantity = parseInt(quantityInput ? quantityInput.value : 1);
    
    // Add to cart
    cartManager.addToCart(currentItem, quantity);
    
    // Update cart badge count immediately
    updateCartBadge();
    
    // Create and show the popup
    const popup = document.createElement('div');
    popup.className = 'cart-popup';
    popup.innerHTML = `
        <div class="cart-popup-content">
            <div class="cart-popup-header">
                <i class="fas fa-check-circle"></i>
                <h4>Item Added to Cart</h4>
                <button class="close-popup"><i class="fas fa-times"></i></button>
            </div>
            <div class="cart-popup-body">
                <p>${currentItem.name} (${quantity}) has been added to your cart!</p>
                <div class="cart-popup-actions">
                    <button class="btn btn-outline continue-browsing">Continue Browsing</button>
                    <a href="cart.html" class="btn btn-primary">View Cart</a>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(popup);
    
    // Show popup with animation
    setTimeout(() => {
        popup.classList.add('show');
    }, 10);
    
    // Add event listeners for popup buttons
    const closeBtn = popup.querySelector('.close-popup');
    const continueBtn = popup.querySelector('.continue-browsing');
    
    // Close popup function
    const closePopup = () => {
        popup.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(popup);
        }, 300);
    };
    
    // Add event listeners
    closeBtn.addEventListener('click', closePopup);
    continueBtn.addEventListener('click', closePopup);
    
    // Auto-close after 5 seconds
    setTimeout(closePopup, 5000);
    
    // Close modal
    closeItemModal();
}

/**
 * Place an order for the current item
 */
function placeOrder() {
    if (!currentItem) return;
    
    // Get quantity
    const quantityInput = document.getElementById('item-quantity');
    const quantity = parseInt(quantityInput ? quantityInput.value : 1);
    
    // Add to cart first
    cartManager.addToCart(currentItem, quantity);
    
    // Close item modal
    closeItemModal();
    
    // Redirect to cart page
    window.location.href = "cart.html?checkout=true";
}

/**
 * Show order confirmation modal
 * @param {Object} order - Order object
 */
function showOrderConfirmation(order) {
    if (!orderConfirmationModal || !orderNumberSpan) return;
    
    // Set order number
    orderNumberSpan.textContent = order.id;
    
    // Show modal
    orderConfirmationModal.style.display = 'block';
    
    // Apply entrance animation
    const modalContent = orderConfirmationModal.querySelector('.modal-content');
    modalContent.style.opacity = '0';
    modalContent.style.transform = 'translateY(-20px)';
    
    setTimeout(() => {
        modalContent.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        modalContent.style.opacity = '1';
        modalContent.style.transform = 'translateY(0)';
    }, 10);
}

/**
 * Display current orders
 */
function displayCurrentOrders() {
    if (!currentOrdersContainer) return;
    
    // Get current orders
    const orders = getOrders();
    
    // Filter to only show recent pending orders (last 24 hours)
    const recentOrders = orders.filter(order => {
        const orderDate = new Date(order.orderTime);
        const now = new Date();
        const timeDiff = now - orderDate;
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        return hoursDiff < 24 && order.status === 'pending';
    });
    
    // Clear container
    currentOrdersContainer.innerHTML = '';
    
    if (recentOrders.length === 0) {
        currentOrdersContainer.innerHTML = `
            <div class="empty-state">
                <p>No current orders. Order something delicious!</p>
            </div>
        `;
        return;
    }
    
    // Create and display order cards
    recentOrders.forEach(order => {
        const orderCard = createOrderCard(order);
        currentOrdersContainer.appendChild(orderCard);
    });
}

/**
 * Create an order card element
 * @param {Object} order - Order object
 * @returns {HTMLElement} - Order card element
 */
function createOrderCard(order) {
    const orderCard = document.createElement('div');
    orderCard.className = 'order-card';
    
    const pickupTime = new Date(order.estimatedPickupTime);
    const formattedTime = pickupTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    orderCard.innerHTML = `
        <div class="order-header">
            <h3>Order #${order.id}</h3>
            <span class="order-status">${order.status}</span>
        </div>
        <div class="order-details">
            <p><strong>${order.item.name}</strong> x${order.quantity}</p>
            <p>Est. Pickup: ${formattedTime}</p>
            <a href="order-details.html?id=${order.id}" class="btn btn-small btn-primary">View Details</a>
        </div>
    `;
    
    return orderCard;
}

/**
 * Handle hash change to open menu item from URL
 */
function handleHashChange() {
    const hash = window.location.hash.slice(1);
    if (hash) {
        // Find menu item with this ID
        const menuItems = storageManager.getMenuItems();
        const item = menuItems.find(item => item.id === hash);
        
        if (item) {
            openItemModal(item);
        }
    }
}

/**
 * Load all menu items from storage
 */
function loadMenuItems() {
    try {
        // Get menu items
        const menuItems = storageManager.getMenuItems();
        
        // Update category labels for Campus Cafe
        menuItems.forEach(item => {
            if (item.category === 'appetizers') {
                item.category = 'appetizers'; // Keeping as is, but could change to 'breakfast'
            }
        });
        
        // Display all items
        displayMenuItems(menuItems);
    } catch (error) {
        console.error('Error loading menu items:', error);
        if (menuContainer) {
            menuContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Could not load menu items. Please try again later.</p>
                </div>
            `;
        }
    }
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
 * Generate a unique order ID
 * @returns {string} - Unique order ID
 */
function generateOrderId() {
    // Simple order number format: current timestamp + random chars
    return Math.floor(Math.random() * 900 + 100).toString();
}

/**
 * Calculate estimated pickup time (15-30 minutes from now)
 * @returns {string} - ISO string of estimated pickup time
 */
function getEstimatedPickupTime() {
    const now = new Date();
    // Random time between 15-30 minutes from now
    const minutesToAdd = Math.floor(Math.random() * 16) + 15;
    const pickupTime = new Date(now.getTime() + minutesToAdd * 60000);
    return pickupTime.toISOString();
}

/**
 * Save order to localStorage
 * @param {Object} order - Order to save
 */
function saveOrder(order) {
    // Get existing orders
    const orders = getOrders();
    
    // Add new order
    orders.push(order);
    
    // Save to localStorage
    localStorage.setItem('campus_cafe_orders', JSON.stringify(orders));
}

/**
 * Get all orders from localStorage
 * @returns {Array} - Array of orders
 */
function getOrders() {
    return JSON.parse(localStorage.getItem('campus_cafe_orders')) || [];
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
 * Clean up resources when page is unloaded
 */
window.addEventListener('beforeunload', () => {
    stopAutoRefresh();
});

// Initialize menu page
document.addEventListener('DOMContentLoaded', function() {
    // Initialize menu
    initMenu();
    
    // Update cart badge
    updateCartBadge();
    
    // Update customer stats
    updateCustomerStats();
});

/**
 * Update cart badge
 */
function updateCartBadge() {
    const cartBadge = document.getElementById('cart-badge');
    if (!cartBadge) return;
    
    // Get the total number of items in the cart
    const totalItems = cartManager.getTotalItems();
    
    // Update the badge
    cartBadge.textContent = totalItems;
    
    // Show or hide badge based on cart contents
    if (totalItems > 0) {
        cartBadge.style.display = 'flex';
    } else {
        cartBadge.style.display = 'none';
    }
}

/**
 * Update customer stats in footer
 */
function updateCustomerStats() {
    // Get stats elements
    const customersToday = document.getElementById('customers-today');
    const customersTotal = document.getElementById('customers-total');
    const ordersCount = document.getElementById('orders-count');
    
    if (!customersToday || !customersTotal || !ordersCount) return;
    
    // Get stats from storage
    const stats = JSON.parse(localStorage.getItem('campus_cafe_stats')) || {
        customersServedToday: 0,
        customersEverServed: 0,
        ordersSubmitted: 0
    };
    
    // Get orders to count total submissions
    const orders = storageManager.getOrders() || [];
    stats.ordersSubmitted = orders.length;
    
    // Update elements with animation
    animateCounter(customersToday, 0, stats.customersServedToday);
    animateCounter(customersTotal, 0, stats.customersEverServed);
    animateCounter(ordersCount, 0, stats.ordersSubmitted);
}

/**
 * Animate a counter from start to end value
 * @param {HTMLElement} element - Element to update
 * @param {number} start - Start value
 * @param {number} end - End value
 * @param {number} duration - Animation duration in ms
 */
function animateCounter(element, start, end, duration = 1000) {
    if (!element) return;
    
    // Ensure minimum values for visual effect
    end = Math.max(end, 5);
    
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        element.textContent = value;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            element.textContent = end;
        }
    };
    window.requestAnimationFrame(step);
}
