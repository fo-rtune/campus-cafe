/**
 * Admin Login JavaScript for Campus Cafe
 */

// DOM Elements
const loginForm = document.getElementById('login-form');
const errorMessage = document.getElementById('login-error');
const togglePassword = document.querySelector('.toggle-password');

/**
 * Initialize the login page
 */
function initLoginPage() {
    // Check if user is already logged in
    if (authManager.isLoggedIn()) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    // Add event listeners
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (togglePassword) {
        togglePassword.addEventListener('click', togglePasswordVisibility);
    }
}

/**
 * Handle login form submission
 * @param {Event} e - Form submit event
 */
function handleLogin(e) {
    e.preventDefault();
    
    // Get form values
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    
    // Clear previous error
    if (errorMessage) {
        errorMessage.style.display = 'none';
    }
    
    // Validate inputs
    if (!email || !password) {
        showError('Please enter both email and password');
        return;
    }
    
    // Validate email format
    if (!/\S+@\S+\.\S+/.test(email)) {
        showError('Please enter a valid email address');
        return;
    }
    
    // Try to login
    try {
        const success = authManager.login(email, password);
        
        if (success) {
            // Redirect to dashboard
            window.location.href = 'dashboard.html';
        } else {
            showError('Invalid email or password');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('An error occurred. Please try again.');
    }
}

/**
 * Show error message
 * @param {string} message - Error message to display
 */
function showError(message) {
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }
}

/**
 * Toggle password visibility
 */
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            togglePassword.classList.remove('fa-eye');
            togglePassword.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            togglePassword.classList.remove('fa-eye-slash');
            togglePassword.classList.add('fa-eye');
        }
    }
}

// Initialize login page
document.addEventListener('DOMContentLoaded', initLoginPage);
