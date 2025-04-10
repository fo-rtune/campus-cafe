/**
 * Storage Manager for Campus Cafe
 * Handles localStorage operations for menu items and orders
 */

// Storage manager for managing localStorage operations
const storageManager = (function() {
    // Storage keys
    const MENU_ITEMS_KEY = 'campus_cafe_menu_items';
    const ORDERS_KEY = 'campus_cafe_orders';
    const MESSAGES_KEY = 'campus_cafe_messages';
    
    /**
     * Initialize storage with default data if empty
     */
    function initStorage() {
        // Check if menu items already exist
        if (!localStorage.getItem(MENU_ITEMS_KEY)) {
            // Initialize with default menu items
            localStorage.setItem(MENU_ITEMS_KEY, JSON.stringify(getDefaultMenuItems()));
        }
    }
    
    /**
     * Clear all storage data
     * Note: For development purposes only - don't call this automatically
     */
    function clearStorage() {
        localStorage.removeItem(MENU_ITEMS_KEY);
        localStorage.removeItem(ORDERS_KEY);
        localStorage.removeItem(MESSAGES_KEY);
        console.log('Storage cleared');
    }
    
    /**
     * Get all menu items
     * @returns {Array} - Array of menu items
     */
    function getMenuItems() {
        const menuItems = localStorage.getItem(MENU_ITEMS_KEY);
        return menuItems ? JSON.parse(menuItems) : [];
    }
    
    /**
     * Get menu item by ID
     * @param {string} id - Item ID
     * @returns {Object|null} - Menu item or null if not found
     */
    function getMenuItemById(id) {
        const menuItems = getMenuItems();
        return menuItems.find(item => item.id === id) || null;
    }
    
    /**
     * Save menu item (create or update)
     * @param {Object} item - Menu item to save
     */
    function saveMenuItem(item) {
        if (!item || !item.id || !item.name || !item.price) {
            console.error('Invalid menu item data');
            return null;
        }
        
        const menuItems = getMenuItems();
        const existingIndex = menuItems.findIndex(i => i.id === item.id);
        
        if (existingIndex !== -1) {
            // Update existing item
            menuItems[existingIndex] = item;
        } else {
            // Add new item
            menuItems.push(item);
        }
        
        localStorage.setItem(MENU_ITEMS_KEY, JSON.stringify(menuItems));
        return item;
    }
    
    /**
     * Delete menu item by ID
     * @param {string} id - Item ID to delete
     */
    function deleteMenuItem(id) {
        const menuItems = getMenuItems();
        const updatedItems = menuItems.filter(item => item.id !== id);
        
        if (updatedItems.length === menuItems.length) {
            return false; // No item was deleted
        }
        
        localStorage.setItem(MENU_ITEMS_KEY, JSON.stringify(updatedItems));
        return true;
    }
    
    /**
     * Get all orders
     * @returns {Array} - Array of orders
     */
    function getOrders() {
        const orders = localStorage.getItem(ORDERS_KEY);
        return orders ? JSON.parse(orders) : [];
    }
    
    /**
     * Save an order
     * @param {Object} order - Order object to save
     * @returns {Object} - Saved order
     */
    function saveOrder(order) {
        // Validate order
        if (!order || !order.id || !order.item || !order.quantity) {
            throw new Error('Invalid order');
        }
        
        // Get current orders
        const orders = getOrders();
        
        // Calculate total price
        let totalPrice = order.item.price * order.quantity;
        
        // Apply discount if eligible
        if (totalPrice > 500) {
            totalPrice -= 300; // Apply 300 bob discount
        }
        
        // Add additional fields if needed
        const newOrder = {
            ...order,
            totalPrice: totalPrice.toFixed(2),
            status: order.status || 'pending',
            orderTime: order.orderTime || new Date().toISOString(),
            estimatedPickupTime: order.estimatedPickupTime || new Date(Date.now() + 20 * 60000).toISOString()
        };
        
        // Add order to the orders list
        orders.push(newOrder);
        
        // Save to localStorage
        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
        
        // Update customer stats
        updateCustomerStats();
        
        return newOrder;
    }
    
    /**
     * Update order status
     * @param {string} id - Order ID to update
     * @param {string} status - New status (pending, ready, completed, cancelled)
     * @returns {Object|null} - Updated order or null if not found
     */
    function updateOrderStatus(id, status) {
        try {
            // Get orders from storage
            const orders = getOrders();
            
            // Find order index
            const orderIndex = orders.findIndex(order => order.id === id);
            
            // If order not found, return null
            if (orderIndex === -1) {
                return null;
            }
            
            // Update order status
            orders[orderIndex].status = status;
            
            // If status is completed, update customer stats
            if (status === 'completed' && typeof statsManager !== 'undefined') {
                statsManager.incrementCompleteOrder();
            }
            
            // Save to storage
            localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
            
            // Return updated order
            return orders[orderIndex];
        } catch (error) {
            console.error('Error updating order status:', error);
            return null;
        }
    }
    
    /**
     * Get all contact messages
     * @returns {Array} - Array of messages
     */
    function getMessages() {
        const messages = localStorage.getItem(MESSAGES_KEY);
        return messages ? JSON.parse(messages) : [];
    }
    
    /**
     * Save a new contact message
     * @param {Object} message - Message to save
     * @returns {Object} - Saved message
     */
    function saveMessage(message) {
        if (!message || !message.name || !message.email || !message.message) {
            return null;
        }
        
        const messages = getMessages();
        const now = new Date();
        
        const newMessage = {
            id: 'msg_' + now.getTime(),
            name: message.name,
            email: message.email,
            subject: message.subject || '',
            message: message.message,
            date: now.toISOString(),
            read: false
        };
        
        messages.push(newMessage);
        localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
        
        return newMessage;
    }
    
    /**
     * Mark message as read
     * @param {string} id - Message ID
     * @returns {Object|null} - Updated message or null if not found
     */
    function markMessageAsRead(id) {
        const messages = getMessages();
        const messageIndex = messages.findIndex(msg => msg.id === id);
        
        if (messageIndex === -1) {
            return false;
        }
        
        messages[messageIndex].read = true;
        localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
        
        return true;
    }
    
    /**
     * Default menu items
     * @returns {Array} - Array of default menu items
     */
    function getDefaultMenuItems() {
        return [
            {
                id: 'breakfast1',
                name: 'Smocha',
                price: 450,
                category: 'breakfast',
                description: 'A delicious combination of chapati, smokies, and kachumbari - a perfect campus breakfast.',
                ingredients: ['Chapati', 'Smokies', 'Kachumbari', 'Tomato Sauce'],
                imageUrl: 'https://cdn.standardmedia.co.ke/images/wysiwyg/images/TwRzggyrLJCEh7gwzsLlPZ90VHf4imSUigQh5aiv.jpg',
                featured: true
            },
            {
                id: 'breakfast2',
                name: 'Pancake Stack',
                price: 380,
                category: 'breakfast',
                description: 'Fluffy pancakes served with maple syrup and fresh berries.',
                ingredients: ['Flour', 'Eggs', 'Milk', 'Butter', 'Maple Syrup', 'Mixed Berries'],
                imageUrl: 'https://images.unsplash.com/photo-1554520735-0a6b8b6ce8b7?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
                featured: false
            },
            {
                id: 'lunch1',
                name: 'Chapo Beans',
                price: 80,
                category: 'lunch',
                description: 'Kenyan chapati served with tasty beans, salad, and soup on the side.',
                ingredients: ['Chapati', 'Beans', 'Salad', 'Vegetable Soup'],
                imageUrl: 'https://www.shutterstock.com/image-photo/chapati-bean-curry-made-beans-600nw-2162323019.jpg',
                featured: true
            },
            {
                id: 'lunch2',
                name: 'Beef Stir Fry',
                price: 550,
                category: 'lunch',
                description: 'Tender strips of beef stir-fried with vegetables, served with rice.',
                ingredients: ['Beef', 'Mixed Vegetables', 'Soy Sauce', 'Rice'],
                imageUrl: 'https://images.unsplash.com/photo-1572715376701-98568319fd0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
                featured: false
            },
            {
                id: 'snack1',
                name: 'Samosa',
                price: 40,
                category: 'snacks',
                description: 'Crispy triangular pastry filled with spiced potatoes and peas.',
                ingredients: ['Pastry', 'Potatoes', 'Peas', 'Spices'],
                imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
                featured: true
            },
            {
                id: 'drink1',
                name: 'Kenyan Tea',
                price: 100,
                category: 'drinks',
                description: 'Traditional Kenyan tea brewed with milk and spices.',
                ingredients: ['Tea Leaves', 'Milk', 'Sugar', 'Spices'],
                imageUrl: 'https://images.unsplash.com/photo-1565200003367-2a3ad7ee95cc?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
                featured: false
            },
            {
                id: 'drink2',
                name: 'Fresh Fruit Juice',
                price: 180,
                category: 'drinks',
                description: 'Freshly squeezed seasonal fruit juice.',
                ingredients: ['Seasonal Fruits', 'Ice'],
                imageUrl: 'https://images.unsplash.com/photo-1563677716816-48158a8e59eaf?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
                featured: true
            }
        ];
    }
    
    /**
     * Update customer stats when an order is placed
     */
    function updateCustomerStats() {
        // Check if statsManager exists
        if (typeof statsManager !== 'undefined') {
            statsManager.incrementOrderSubmitted();
        }
    }
    
    // Public API
    return {
        initStorage,
        getMenuItems,
        getMenuItemById,
        saveMenuItem,
        deleteMenuItem,
        getOrders,
        saveOrder,
        updateOrderStatus,
        getMessages,
        saveMessage,
        markMessageAsRead
    };
})();

// Initialize storage on page load
document.addEventListener('DOMContentLoaded', function() {
    storageManager.initStorage();
});

// Cart manager for managing cart operations
const cartManager = (function() {
    // Storage key
    const CART_KEY = 'campus_cafe_cart';
    
    /**
     * Get cart items
     * @returns {Array} - Array of cart items
     */
    function getCart() {
        const cart = localStorage.getItem(CART_KEY);
        return cart ? JSON.parse(cart) : [];
    }
    
    /**
     * Add item to cart
     * @param {Object} item - Menu item to add
     * @param {number} quantity - Quantity to add
     * @returns {Array} - Updated cart
     */
    function addToCart(item, quantity = 1) {
        // Validate item
        if (!item || !item.id || !item.name || !item.price) {
            throw new Error('Invalid menu item');
        }
        
        // Validate quantity
        if (quantity < 1) {
            throw new Error('Quantity must be at least 1');
        }
        
        // Get current cart
        const cart = getCart();
        
        // Check if item already exists in cart
        const existingItemIndex = cart.findIndex(cartItem => cartItem.item.id === item.id);
        
        if (existingItemIndex !== -1) {
            // Update quantity
            cart[existingItemIndex].quantity += quantity;
        } else {
            // Add new item
            cart.push({
                item: item,
                quantity: quantity
            });
        }
        
        // Save to localStorage
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        
        // Update cart badge immediately
        updateCartBadge();
        
        return cart;
    }
    
    /**
     * Remove item from cart
     * @param {string} itemId - Item ID to remove
     * @returns {Array} - Updated cart
     */
    function removeFromCart(itemId) {
        // Get current cart
        const cart = getCart();
        
        // Remove item
        const updatedCart = cart.filter(cartItem => cartItem.item.id !== itemId);
        
        // Save to localStorage
        localStorage.setItem(CART_KEY, JSON.stringify(updatedCart));
        
        // Update cart badge immediately
        updateCartBadge();
        
        return updatedCart;
    }
    
    /**
     * Update item quantity
     * @param {string} itemId - Item ID to update
     * @param {number} quantity - New quantity
     * @returns {Array} - Updated cart
     */
    function updateQuantity(itemId, quantity) {
        // Validate quantity
        if (quantity < 1) {
            throw new Error('Quantity must be at least 1');
        }
        
        // Get current cart
        const cart = getCart();
        
        // Find item
        const itemIndex = cart.findIndex(cartItem => cartItem.item.id === itemId);
        
        if (itemIndex === -1) {
            throw new Error('Item not found in cart');
        }
        
        // Update quantity
        cart[itemIndex].quantity = quantity;
        
        // Save to localStorage
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        
        // Update cart badge immediately
        updateCartBadge();
        
        return cart;
    }
    
    /**
     * Clear cart
     * @returns {Array} - Empty cart
     */
    function clearCart() {
        localStorage.removeItem(CART_KEY);
        
        // Update cart badge immediately
        updateCartBadge();
        
        return [];
    }
    
    /**
     * Calculate the total price of items in the cart
     * @returns {number} - Total price
     */
    function getTotalPrice() {
        const cart = getCart();
        return cart.reduce((total, cartItem) => {
            return total + (cartItem.item.price * cartItem.quantity);
        }, 0);
    }
    
    /**
     * Apply discount to orders above a certain amount
     * @param {number} total - The total order amount
     * @returns {number} - Discounted total
     */
    function applyDiscount(total) {
        // Apply 300 bob discount for orders above 500 bob
        if (total > 500) {
            return total - 300;
        }
        return total;
    }
    
    /**
     * Calculate the total number of items in the cart
     * @returns {number} - Total number of items
     */
    function getTotalItems() {
        const cart = getCart();
        return cart.reduce((total, cartItem) => {
            return total + cartItem.quantity;
        }, 0);
    }
    
    /**
     * Update the cart badge to show total items
     * This function can be called from any page to update the cart count
     */
    function updateCartBadge() {
        const cartBadge = document.getElementById('cart-badge');
        if (!cartBadge) return;
        
        // Get the total number of items in the cart
        const totalItems = getTotalItems();
        
        // Update the badge
        cartBadge.textContent = totalItems;
        
        // Show or hide badge based on cart contents
        if (totalItems > 0) {
            cartBadge.style.display = 'flex';
        } else {
            cartBadge.style.display = 'none';
        }
    }
    
    // Initialize cart badge on page load
    document.addEventListener('DOMContentLoaded', updateCartBadge);
    
    // Public API
    return {
        getCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalPrice,
        getTotalItems,
        applyDiscount,
        updateCartBadge
    };
})();

