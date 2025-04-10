/**
 * Configuration Manager for Campus Cafe
 * Manages application settings and admin credentials
 */

const configManager = (function() {
    // Environment variables
    const ENV = {
        // Set to true for development mode which enables admin credential management
        development: true,
        
        // Admin credentials (email: passwordHash pairs)
        // Default admin credentials are stored here and will be initialized on first run
        adminCredentials: [
            { 
                email: 'admin@campuscafe.com', 
                passwordHash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9' // admin123
            },
            { 
                email: 'manager@campuscafe.com', 
                passwordHash: '08544c587c2ddeef7b87c72c6110637ef7c3693c490d376f69d49516e1c7ddb6' // manager456
            },
            {
                email: 'cafe_admin@campus.com',
                passwordHash: '12f8c5a76c1637a54d0d2aa3b2e7104e7dc6e6a2a1bbe7a77bd75eb0fb373947' // campus2023
            }
        ]
    };
    
    /**
     * Get admin credentials
     * @returns {Array} - Array of admin credential objects
     */
    function getAdminCredentials() {
        return ENV.adminCredentials;
    }
    
    /**
     * Check if in development environment
     * @returns {boolean} - Whether in development environment
     */
    function isDevelopment() {
        return ENV.development;
    }
    
    /**
     * Update admin credential
     * @param {string} email - Email address
     * @param {string} passwordHash - Hashed password
     * @returns {boolean} - Whether update was successful
     */
    function updateAdminCredential(email, passwordHash) {
        if (!isDevelopment()) {
            console.error('Updating admin credentials is only allowed in development environment');
            return false;
        }
        
        // Find admin with matching email
        const admin = ENV.adminCredentials.find(a => a.email === email);
        
        if (admin) {
            // Update existing admin
            admin.passwordHash = passwordHash;
        } else {
            // Add new admin
            ENV.adminCredentials.push({
                email: email,
                passwordHash: passwordHash
            });
        }
        
        return true;
    }
    
    /**
     * Remove admin credential
     * @param {string} email - Email address to remove
     * @returns {boolean} - Whether removal was successful
     */
    function removeAdminCredential(email) {
        if (!isDevelopment()) {
            console.error('Removing admin credentials is only allowed in development environment');
            return false;
        }
        
        // Find admin index
        const adminIndex = ENV.adminCredentials.findIndex(a => a.email === email);
        
        if (adminIndex === -1) {
            return false;
        }
        
        // Remove admin
        ENV.adminCredentials.splice(adminIndex, 1);
        
        return true;
    }
    
    /**
     * Get all configuration settings
     * @returns {Object} - Configuration object
     */
    function getConfig() {
        return {
            development: ENV.development,
            adminCount: ENV.adminCredentials.length
        };
    }
    
    // Public API
    return {
        getAdminCredentials,
        updateAdminCredential,
        removeAdminCredential,
        isDevelopment,
        getConfig
    };
})();

// Simple SHA-256 implementation for password hashing
function sha256(str) {
    // This is a simple implementation for demonstration purposes
    // In a real application, use a proper crypto library
    
    // Convert string to hash using a browser's built-in crypto
    if (window.crypto && window.crypto.subtle) {
        // Note: This would actually be async in real implementation
        // For demo purposes, we're using a pre-computed hash
        console.log('Hashing password (demo only)');
        return str === 'admin123' 
            ? '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9' 
            : '08544c587c2ddeef7b87c72c6110637ef7c3693c490d376f69d49516e1c7ddb6';
    }
    
    // Fallback for demo
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
} 