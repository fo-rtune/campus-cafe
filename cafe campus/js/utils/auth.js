/**
 * Authentication Manager for Campus Cafe Admin
 */

const authManager = (function() {
    // Storage keys
    const USER_KEY = 'campus_cafe_user';
    const TOKEN_KEY = 'campus_cafe_token';
    
    /**
     * Initialize authentication
     */
    function init() {
        // Check if admin user exists in storage
        const users = JSON.parse(localStorage.getItem('campus_cafe_users')) || [];
        
        // If no admin exists, create default admins from config
        if (users.length === 0 && configManager) {
            const defaultAdmins = configManager.getAdminCredentials();
            localStorage.setItem('campus_cafe_users', JSON.stringify(defaultAdmins));
        }
    }
    
    /**
     * Hash a password
     * @param {string} password - The password to hash
     * @returns {string} - Hashed password
     */
    function hashPassword(password) {
        // Simple hash function using SHA-256
        // In a real application, this would use a more secure method with salt
        return sha256(password);
    }
    
    /**
     * SHA-256 hash function
     * @param {string} str - String to hash
     * @returns {string} - Hashed string
     */
    function sha256(str) {
        // This is a simplified SHA-256 implementation for demo purposes
        // In a real application, use a proper crypto library
        
        // Convert string to an array of bytes
        const buffer = new TextEncoder().encode(str);
        
        // Use SubtleCrypto API if available (modern browsers)
        if (window.crypto && window.crypto.subtle) {
            return window.crypto.subtle.digest('SHA-256', buffer)
                .then(hash => {
                    // Convert hash to hex string
                    return Array.from(new Uint8Array(hash))
                        .map(b => b.toString(16).padStart(2, '0'))
                        .join('');
                });
        }
        
        // Fallback for older browsers (simplified hash)
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        
        return hash.toString(16);
    }
    
    /**
     * Attempt to login a user
     * @param {string} email - Email address
     * @param {string} password - Password
     * @returns {boolean} - Whether login was successful
     */
    function login(email, password) {
        // Get users from storage
        const users = JSON.parse(localStorage.getItem('campus_cafe_users')) || [];
        
        // Find user with matching email
        const user = users.find(u => u.email === email);
        
        if (!user) {
            return false;
        }
        
        // Check password
        const passwordHash = hashPassword(password);
        
        // For demo purposes, also allow default admin credentials
        const isDefaultAdmin = (email === 'admin@campuscafe.com' && password === 'admin123') || 
                              (email === 'manager@campuscafe.com' && password === 'manager456');
        
        if (user.passwordHash === passwordHash || isDefaultAdmin) {
            // Create session
            const sessionUser = {
                email: user.email
            };
            
            // Generate simple token (in real app, this would be JWT or similar)
            const token = 'token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            // Save to storage
            localStorage.setItem(USER_KEY, JSON.stringify(sessionUser));
            localStorage.setItem(TOKEN_KEY, token);
            
            return true;
        }
        
        return false;
    }
    
    /**
     * Check if user is logged in
     * @returns {boolean} - Whether user is logged in
     */
    function isLoggedIn() {
        const user = localStorage.getItem(USER_KEY);
        const token = localStorage.getItem(TOKEN_KEY);
        
        return !!(user && token);
    }
    
    /**
     * Get current logged in user
     * @returns {Object|null} - Current user or null if not logged in
     */
    function getCurrentUser() {
        if (!isLoggedIn()) {
            return null;
        }
        
        return JSON.parse(localStorage.getItem(USER_KEY));
    }
    
    /**
     * Logout current user
     */
    function logout() {
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(TOKEN_KEY);
    }
    
    /**
     * Add a new admin (development only)
     * @param {string} email - Admin email
     * @param {string} password - Admin password (unhashed)
     * @returns {boolean} - Whether admin was added successfully
     */
    function addAdmin(email, password) {
        // Only allow in development environment
        if (!configManager || !configManager.isDevelopment()) {
            console.error('Adding admins is only allowed in development environment');
            return false;
        }
        
        // Validate email format
        if (!email || !/\S+@\S+\.\S+/.test(email)) {
            console.error('Invalid email format');
            return false;
        }
        
        // Validate password
        if (!password || password.length < 8) {
            console.error('Password must be at least 8 characters long');
            return false;
        }
        
        // Hash password
        const passwordHash = hashPassword(password);
        
        // Get users from storage
        const users = JSON.parse(localStorage.getItem('campus_cafe_users')) || [];
        
        // Check if user already exists
        const existingUser = users.find(u => u.email === email);
        
        if (existingUser) {
            // Update existing user
            existingUser.passwordHash = passwordHash;
        } else {
            // Add new user
            users.push({
                email: email,
                passwordHash: passwordHash
            });
        }
        
        // Save to storage
        localStorage.setItem('campus_cafe_users', JSON.stringify(users));
        
        // Also update the config if we're in development
        if (configManager && configManager.updateAdminCredential) {
            configManager.updateAdminCredential(email, passwordHash);
        }
        
        return true;
    }
    
    // Initialize on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Public API
    return {
        login,
        logout,
        isLoggedIn,
        getCurrentUser,
        hashPassword,
        addAdmin
    };
})();
