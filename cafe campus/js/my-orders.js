/**
 * My Orders Page Script
 * Handles displaying the user's orders from localStorage
 */

// DOM Elements
const ordersContainer = document.getElementById('orders-container');
const cartBadge = document.getElementById('cart-badge');
const clearCompletedBtn = document.getElementById('clear-completed-btn');

// Initialize the page
document.addEventListener('DOMContentLoaded', initMyOrdersPage);

/**
 * Initialize My Orders page
 */
function initMyOrdersPage() {
    // Load orders
    loadOrders();
    
    // Update cart badge count
    updateCartBadge();
    
    // Add event listeners
    if (clearCompletedBtn) {
        clearCompletedBtn.addEventListener('click', clearCompletedOrders);
    }
    
    // Stats are now handled by the statsManager
}

/**
 * Load and display all orders
 */
function loadOrders() {
    // Get orders from localStorage
    const orders = storageManager.getOrders();
    
    // Sort orders by date (newest first)
    const sortedOrders = [...orders].sort((a, b) => 
        new Date(b.orderTime) - new Date(a.orderTime)
    );
    
    // Check if there are any orders
    if (sortedOrders.length === 0) {
        displayEmptyState();
        return;
    }
    
    // Display orders
    displayOrders(sortedOrders);
}

/**
 * Display all orders
 * @param {Array} orders - Array of order objects
 */
function displayOrders(orders) {
    if (!ordersContainer) return;
    
    // Clear container
    ordersContainer.innerHTML = '';
    
    // Add each order
    orders.forEach(order => {
        const orderCard = createOrderCard(order);
        ordersContainer.appendChild(orderCard);
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
    
    // Format dates
    const orderDate = new Date(order.orderTime);
    const formattedOrderDate = orderDate.toLocaleString([], { 
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const pickupTime = new Date(order.estimatedPickupTime);
    const formattedPickupTime = pickupTime.toLocaleTimeString([], { 
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Determine status class
    let statusClass = '';
    switch (order.status) {
        case 'pending':
            statusClass = 'status-pending';
            break;
        case 'ready':
            statusClass = 'status-ready';
            break;
        case 'completed':
            statusClass = 'status-completed';
            break;
        case 'cancelled':
            statusClass = 'status-cancelled';
            break;
    }
    
    // Check if order can be cancelled (only pending orders)
    const canCancel = order.status === 'pending';
    
    // Check if order can be restored (only cancelled orders)
    const canRestore = order.status === 'cancelled';
    
    // Format payment method
    let paymentMethod = order.paymentMethod || 'cash';
    let formattedPaymentMethod = '';
    
    switch (paymentMethod) {
        case 'cash':
            formattedPaymentMethod = 'On Pickup';
            break;
        case 'mpesa':
            formattedPaymentMethod = 'On Pickup';
            break;
        case 'card':
            formattedPaymentMethod = 'On Pickup';
            break;
        case 'paypal':
            formattedPaymentMethod = 'On Pickup';
            break;
        case 'bitcoin':
            formattedPaymentMethod = 'On Pickup';
            break;
        default:
            formattedPaymentMethod = 'On Pickup';
    }
    
    // Create HTML
    orderCard.innerHTML = `
        <div class="order-header">
            <h3>Order #${order.id}</h3>
            <span class="order-status ${statusClass}">${order.status}</span>
        </div>
        <div class="order-details">
            <p><strong>${order.item.name}</strong></p>
            <p>Quantity: ${order.quantity}</p>
            <p>Price: KSh ${(order.item.price * order.quantity).toFixed(2)}</p>
            <p><strong>Payment:</strong> ${formattedPaymentMethod}</p>
            <p><strong>Ordered:</strong> ${formattedOrderDate}</p>
            <p><strong>Est. Pickup:</strong> ${formattedPickupTime}</p>
        </div>
        <div class="order-footer">
            <a href="order-details.html?id=${order.id}" class="btn btn-small btn-primary">View Details</a>
            ${canCancel ? `<button class="btn btn-small btn-danger cancel-order-btn" data-id="${order.id}">Cancel</button>` : ''}
            ${canRestore ? `<button class="btn btn-small btn-success restore-order-btn" data-id="${order.id}">Undo Cancel</button>` : ''}
        </div>
    `;
    
    // Add event listener for cancel button
    if (canCancel) {
        const cancelBtn = orderCard.querySelector('.cancel-order-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to cancel this order?')) {
                    cancelOrder(order.id);
                }
            });
        }
    }
    
    // Add event listener for restore button
    if (canRestore) {
        const restoreBtn = orderCard.querySelector('.restore-order-btn');
        if (restoreBtn) {
            restoreBtn.addEventListener('click', () => {
                restoreOrder(order.id);
            });
        }
    }
    
    return orderCard;
}

/**
 * Display empty state when no orders
 */
function displayEmptyState() {
    if (!ordersContainer) return;
    
    ordersContainer.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-receipt"></i>
            <p>You don't have any orders yet.</p>
            <a href="menu.html" class="btn btn-primary">Browse Menu</a>
        </div>
    `;
}

/**
 * Cancel an order
 * @param {string} orderId - Order ID to cancel
 */
function cancelOrder(orderId) {
    // Get the order first
    const orders = storageManager.getOrders();
    const orderToCancel = orders.find(order => order.id === orderId);
    
    if (!orderToCancel) {
        showMessage('Order not found');
        return;
    }
    
    // Update order status in storage
    const updatedOrder = storageManager.updateOrderStatus(orderId, 'cancelled');
    
    if (updatedOrder) {
        // Add the item back to the cart
        cartManager.addToCart(orderToCancel.item, orderToCancel.quantity);
        
        // Reload orders to reflect changes
        loadOrders();
        
        // Update cart badge
        updateCartBadge();
        
        // Show success message
        showMessage('Order cancelled successfully. Item has been added back to your cart.');
    } else {
        // Show error message
        showMessage('Failed to cancel order. Please try again.');
    }
}

/**
 * Show a message to the user
 * @param {string} message - Message to display
 */
function showMessage(message) {
    // Create message element if it doesn't exist
    if (!document.getElementById('message-alert')) {
        const messageElement = document.createElement('div');
        messageElement.id = 'message-alert';
        messageElement.className = 'message-alert';
        document.body.appendChild(messageElement);
    }
    
    // Get message element
    const messageAlert = document.getElementById('message-alert');
    
    // Set message text
    messageAlert.textContent = message;
    
    // Show message
    messageAlert.classList.add('show');
    
    // Hide message after 3 seconds
    setTimeout(() => {
        messageAlert.classList.remove('show');
    }, 3000);
}

/**
 * Update the cart badge with current number of items
 */
function updateCartBadge() {
    if (!cartBadge) return;
    
    // Get the total number of items in the cart
    const totalItems = cartManager.getTotalItems();
    
    // Update the badge
    cartBadge.textContent = totalItems;
    
    // Toggle badge visibility
    if (totalItems > 0) {
        cartBadge.style.display = 'flex';
    } else {
        cartBadge.style.display = 'none';
    }
}

/**
 * Clear all completed and cancelled orders
 */
function clearCompletedOrders() {
    if (confirm('Are you sure you want to clear all completed and cancelled orders? This cannot be undone.')) {
        // Get all orders
        const orders = storageManager.getOrders();
        
        // Filter out completed and cancelled orders
        const remainingOrders = orders.filter(order => 
            order.status !== 'completed' && order.status !== 'cancelled');
        
        // Save remaining orders
        localStorage.setItem('campus_cafe_orders', JSON.stringify(remainingOrders));
        
        // Reload orders
        loadOrders();
        
        // Show success message
        showMessage('Completed and cancelled orders have been cleared.');
    }
}

/**
 * Restore a cancelled order
 * @param {string} orderId - Order ID to restore
 */
function restoreOrder(orderId) {
    // Get the order first
    const orders = storageManager.getOrders();
    const orderToRestore = orders.find(order => order.id === orderId);
    
    if (!orderToRestore) {
        showMessage('Order not found');
        return;
    }
    
    // Update order status in storage
    const updatedOrder = storageManager.updateOrderStatus(orderId, 'pending');
    
    if (updatedOrder) {
        // Reload orders to reflect changes
        loadOrders();
        
        // Show success message
        showMessage('Order has been restored to pending status.');
    } else {
        // Show error message
        showMessage('Failed to restore order. Please try again.');
    }
} 