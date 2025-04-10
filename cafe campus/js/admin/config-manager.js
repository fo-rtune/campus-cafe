/**
 * Admin Configuration Manager for Campus Cafe
 * Allows admins to manage credentials in development environment
 */

// DOM Elements
const adminForm = document.getElementById('admin-form');
const adminList = document.getElementById('admin-list');
const adminTable = document.getElementById('admin-table');
const errorMessage = document.getElementById('config-error');
const successMessage = document.getElementById('config-success');

/**
 * Initialize the configuration page
 */
function initConfigPage() {
    // Check if user is logged in
    if (!authManager.isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }
    
    // Check if in development environment
    if (!configManager.isDevelopment()) {
        showError('Configuration is only available in development environment');
        if (adminForm) adminForm.style.display = 'none';
        return;
    }
    
    // Add event listeners
    if (adminForm) {
        adminForm.addEventListener('submit', handleAdminSubmit);
    }
    
    // Load admin list
    loadAdminList();
}

/**
 * Handle admin form submission
 * @param {Event} e - Form submit event
 */
function handleAdminSubmit(e) {
    e.preventDefault();
    
    // Clear messages
    clearMessages();
    
    // Get form values
    const email = document.getElementById('admin-email').value.trim();
    const password = document.getElementById('admin-password').value.trim();
    const confirmPassword = document.getElementById('admin-confirm-password').value.trim();
    
    // Validate inputs
    if (!email || !password || !confirmPassword) {
        showError('Please fill in all fields');
        return;
    }
    
    // Validate email format
    if (!/\S+@\S+\.\S+/.test(email)) {
        showError('Please enter a valid email address');
        return;
    }
    
    // Validate password length
    if (password.length < 8) {
        showError('Password must be at least 8 characters long');
        return;
    }
    
    // Validate password match
    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }
    
    // Add admin
    try {
        const success = authManager.addAdmin(email, password);
        
        if (success) {
            showSuccess(`Admin ${email} has been added successfully`);
            adminForm.reset();
            loadAdminList();
        } else {
            showError('Failed to add admin');
        }
    } catch (error) {
        console.error('Error adding admin:', error);
        showError('An error occurred. Please try again.');
    }
}

/**
 * Load admin list from storage
 */
function loadAdminList() {
    if (!adminTable) return;
    
    // Get users from storage
    const users = JSON.parse(localStorage.getItem('campus_cafe_users')) || [];
    
    if (users.length === 0) {
        adminTable.style.display = 'none';
        return;
    }
    
    // Show table
    adminTable.style.display = 'table';
    
    // Clear existing rows
    if (adminList) {
        adminList.innerHTML = '';
        
        // Add each admin to the list
        users.forEach((user, index) => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${user.email}</td>
                <td><button class="btn btn-danger btn-small delete-admin" data-email="${user.email}">Delete</button></td>
            `;
            
            adminList.appendChild(row);
        });
        
        // Add event listeners to delete buttons
        const deleteButtons = adminList.querySelectorAll('.delete-admin');
        deleteButtons.forEach(button => {
            button.addEventListener('click', handleDeleteAdmin);
        });
    }
}

/**
 * Handle delete admin button
 * @param {Event} e - Click event
 */
function handleDeleteAdmin(e) {
    const email = e.target.dataset.email;
    
    if (!email) return;
    
    // Confirm deletion
    if (!confirm(`Are you sure you want to delete admin ${email}?`)) {
        return;
    }
    
    // Get users from storage
    const users = JSON.parse(localStorage.getItem('campus_cafe_users')) || [];
    
    // Remove admin
    const updatedUsers = users.filter(user => user.email !== email);
    
    // Save to storage
    localStorage.setItem('campus_cafe_users', JSON.stringify(updatedUsers));
    
    // Show success message
    showSuccess(`Admin ${email} has been deleted`);
    
    // Reload admin list
    loadAdminList();
}

/**
 * Show error message
 * @param {string} message - Error message to display
 */
function showError(message) {
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        
        // Hide after 5 seconds
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }
}

/**
 * Show success message
 * @param {string} message - Success message to display
 */
function showSuccess(message) {
    if (successMessage) {
        successMessage.textContent = message;
        successMessage.style.display = 'block';
        
        // Hide after 5 seconds
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 5000);
    }
}

/**
 * Clear all messages
 */
function clearMessages() {
    if (errorMessage) errorMessage.style.display = 'none';
    if (successMessage) successMessage.style.display = 'none';
}

// Initialize configuration page
document.addEventListener('DOMContentLoaded', initConfigPage); 