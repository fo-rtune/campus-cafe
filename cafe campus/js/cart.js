function showSuccessModal(orders, orderId, totalAmount, orderCode) {
    const orderNumbersEl = document.getElementById('order-numbers');
    orderNumbersEl.innerHTML = '';
    
    // Create a single order number entry
    const p = document.createElement('p');
    p.innerHTML = `<strong>Order Number</strong>: ${orderId}`;
    orderNumbersEl.appendChild(p);
    
    // Update continue button to redirect to order status
    const continueBtn = document.getElementById('close-success-modal');
    if (continueBtn) {
        continueBtn.textContent = 'View Order Status';
        continueBtn.addEventListener('click', function() {
            // Redirect to order-details.html with the order ID
            window.location.href = `order-details.html?id=${orderId}`;
        });
    }
    
    // Show the modal
    const modal = document.getElementById('checkout-success-modal');
    modal.classList.add('show');
}

/**
 * Handle checkout form submission
 * @param {Event} e - Form submission event
 */
function handleCheckout(e) {
    e.preventDefault();
    
    // Get customer information
    const customerName = document.getElementById('customer-name').value.trim();
    const admissionNumber = document.getElementById('admission-number').value.trim();
    const orderNotes = document.getElementById('order-notes').value.trim();
    
    // Validate required fields
    if (!customerName) {
        alert('Please enter your full name');
        return;
    }
    
    if (!admissionNumber || !/^\d{5}$/.test(admissionNumber)) {
        alert('Please enter exactly 5 digits for your admission number');
        return;
    }
    
    // Get the order code
    const orderCode = localStorage.getItem('temp_order_code') || 
                      Math.floor(1000 + Math.random() * 9000).toString();
    
    // Create orders from cart with payment info
    const cart = cartManager.getCart();
    const orders = [];
    
    // Generate a unique order ID using the order code
    const mainOrderId = 'ORD-' + orderCode + '-' + Date.now().toString().slice(-4);
    
    // Calculate the total order amount
    let totalOrderAmount = cartManager.getTotalPrice();
    
    // Apply discount if eligible
    totalOrderAmount = cartManager.applyDiscount(totalOrderAmount);
    
    // Create an order for each item
    cart.forEach(cartItem => {
        // Calculate item total (already discounted in the order)
        const itemTotal = cartItem.item.price * cartItem.quantity;
        
        const order = {
            id: mainOrderId, // Use the same order ID for all items in this checkout
            orderCode: orderCode, // Store the 4-digit code
            item: cartItem.item,
            quantity: cartItem.quantity,
            status: 'pending',
            orderTime: new Date().toISOString(),
            estimatedPickupTime: new Date(Date.now() + 20 * 60000).toISOString(), // 20 minutes from now
            notes: orderNotes || null,
            customerName: customerName,
            admissionNumber: admissionNumber,
            paymentMethod: 'mpesa', // Always use M-Pesa as payment method
            paymentStatus: 'pending',
            totalAmount: totalOrderAmount.toFixed(2)
        };
        
        // Save order
        storageManager.saveOrder(order);
        orders.push(order);
    });
    
    // Clear cart
    cartManager.clearCart();
    
    // Store order ID in localStorage to access it on the order status page
    localStorage.setItem('last_order_id', mainOrderId);
    localStorage.removeItem('temp_order_code'); // Clean up
    
    // Close checkout modal
    checkoutModal.classList.remove('show');
    
    // Redirect directly to my-orders.html
    window.location.href = "my-orders.html";
}

function openCheckoutModal() {
    // Check if cart is empty
    const cart = cartManager.getCart();
    
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    // Generate a 4-digit order code for payment reference
    const orderCode = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Store order code temporarily
    localStorage.setItem('temp_order_code', orderCode);
    
    // Show checkout modal
    if (checkoutModal) {
        checkoutModal.classList.add('show');
    }
}

/**
 * Initialize the cart page
 */
function initCart() {
    // Load cart items
    displayCartItems();
    
    // Add event listeners
    addEventListeners();
    
    // Update cart badge
    updateCartBadge();
}

/**
 * Update the cart badge to show total items
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
 * Calculate and display the cart summary
 */
function updateCartSummary() {
    if (!cartSummaryList || !cartTotalPrice) return;
    
    // Clear summary list
    cartSummaryList.innerHTML = '';
    
    // Get cart items
    const cart = cartManager.getCart();
    
    // Get total price
    let totalPrice = cartManager.getTotalPrice();
    const originalTotal = totalPrice;
    
    // Apply discount if eligible
    const discountedTotal = cartManager.applyDiscount(totalPrice);
    const hasDiscount = discountedTotal < originalTotal;
    
    // Add items to summary
    cart.forEach(cartItem => {
        const itemTotal = cartItem.item.price * cartItem.quantity;
        
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${cartItem.item.name} x${cartItem.quantity}</span>
            <span>KSh ${itemTotal.toFixed(2)}</span>
        `;
        cartSummaryList.appendChild(li);
    });
    
    // Add discount line if applicable
    if (hasDiscount) {
        const discountLi = document.createElement('li');
        discountLi.className = 'discount-line';
        discountLi.innerHTML = `
            <span>Original Total</span>
            <span>KSh ${originalTotal.toFixed(2)}</span>
        `;
        cartSummaryList.appendChild(discountLi);
        
        const savingsLi = document.createElement('li');
        savingsLi.className = 'discount-savings';
        savingsLi.innerHTML = `
            <span>Discount (-300 bob)</span>
            <span>-KSh 300.00</span>
        `;
        cartSummaryList.appendChild(savingsLi);
    }
    
    // Update total price
    cartTotalPrice.textContent = `KSh ${discountedTotal.toFixed(2)}`;
    
    // Also update checkout total if visible
    if (checkoutTotalPrice) {
        checkoutTotalPrice.textContent = `KSh ${discountedTotal.toFixed(2)}`;
    }
    
    // Update checkout amount in M-Pesa instructions if visible
    const checkoutAmount = document.getElementById('checkout-amount');
    if (checkoutAmount) {
        checkoutAmount.textContent = `KSh ${discountedTotal.toFixed(2)}`;
    }
} 