/**
 * Contact Page JavaScript for Campus Cafe
 */

// DOM Elements
const contactForm = document.getElementById('contact-form');
const messageModal = document.getElementById('message-modal');
const closeMessageModal = document.getElementById('close-message-modal');
const closeModalX = document.querySelector('#message-modal .close-modal');

// Initialize contact page
function initContactPage() {
    // Add event listeners
    if (contactForm) {
        contactForm.addEventListener('submit', handleFormSubmit);
    }
    
    if (closeMessageModal) {
        closeMessageModal.addEventListener('click', closeModal);
    }
    
    if (closeModalX) {
        closeModalX.addEventListener('click', closeModal);
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === messageModal) {
            closeModal();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && messageModal && messageModal.style.display === 'block') {
            closeModal();
        }
    });
}

/**
 * Handle contact form submission
 * @param {Event} e - Form submit event
 */
function handleFormSubmit(e) {
    e.preventDefault();
    
    // Get form values
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const subject = document.getElementById('subject').value.trim();
    const message = document.getElementById('message').value.trim();
    
    // Validate inputs
    if (!name || !email || !subject || !message) {
        showFormError('Please fill in all fields');
        return;
    }
    
    if (!isValidEmail(email)) {
        showFormError('Please enter a valid email address');
        return;
    }
    
    // In a real application, you would send data to server
    // Here we'll just show success message and reset the form
    
    // Create message object for demo purposes
    const contactMessage = {
        id: generateId(),
        name,
        email,
        subject,
        message,
        date: new Date().toISOString(),
        read: false
    };
    
    // Save to messages in localStorage for demo
    saveMessage(contactMessage);
    
    // Show success message
    showSuccessModal();
    
    // Reset form
    contactForm.reset();
}

/**
 * Show form error message
 * @param {string} message - Error message to display
 */
function showFormError(message) {
    // Check if error element already exists
    let errorEl = document.querySelector('.form-error');
    
    if (!errorEl) {
        // Create error element
        errorEl = document.createElement('div');
        errorEl.className = 'form-error error-message';
        
        // Insert before form submit button
        const submitButton = contactForm.querySelector('button[type="submit"]');
        submitButton.parentNode.insertBefore(errorEl, submitButton);
    }
    
    // Set error message
    errorEl.textContent = message;
    
    // Remove after 5 seconds
    setTimeout(() => {
        if (errorEl && errorEl.parentNode) {
            errorEl.parentNode.removeChild(errorEl);
        }
    }, 5000);
}

/**
 * Show success modal
 */
function showSuccessModal() {
    if (messageModal) {
        messageModal.style.display = 'block';
    }
}

/**
 * Close the modal
 */
function closeModal() {
    if (messageModal) {
        messageModal.style.display = 'none';
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
 * Generate a unique ID
 * @returns {string} - Unique ID
 */
function generateId() {
    return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
}

/**
 * Save message to localStorage
 * @param {Object} message - Message object to save
 */
function saveMessage(message) {
    // Get existing messages
    const messages = JSON.parse(localStorage.getItem('campus_cafe_messages')) || [];
    
    // Add new message
    messages.push(message);
    
    // Save to localStorage
    localStorage.setItem('campus_cafe_messages', JSON.stringify(messages));
}

// Initialize contact page
document.addEventListener('DOMContentLoaded', initContactPage);