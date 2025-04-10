/**
 * Theme Manager for Campus Cafe
 * Handles switching between light and dark modes
 */

const themeManager = (function() {
    // DOM Elements
    const themeToggles = document.querySelectorAll('.theme-toggle');
    
    // Theme settings
    const THEME_KEY = 'campus_cafe_theme';
    const DARK_CLASS = 'dark-mode';
    const LIGHT_CLASS = 'light-mode';
    
    /**
     * Initialize theme manager
     */
    function init() {
        // Load saved theme preference or use system preference
        loadTheme();
        
        // Add event listeners to theme toggles
        addEventListeners();
    }
    
    /**
     * Add event listeners to theme toggle buttons
     */
    function addEventListeners() {
        themeToggles.forEach(toggle => {
            toggle.addEventListener('click', toggleTheme);
        });
    }
    
    /**
     * Toggle between light and dark themes
     */
    function toggleTheme() {
        if (document.body.classList.contains(DARK_CLASS)) {
            setTheme(LIGHT_CLASS);
        } else {
            setTheme(DARK_CLASS);
        }
    }
    
    /**
     * Set specific theme
     * @param {string} theme - Theme class to apply
     */
    function setTheme(theme) {
        // Remove both theme classes
        document.body.classList.remove(DARK_CLASS, LIGHT_CLASS);
        
        // Add the selected theme class
        document.body.classList.add(theme);
        
        // Update theme icons
        updateThemeIcons(theme);
        
        // Save preference to localStorage
        localStorage.setItem(THEME_KEY, theme);
    }
    
    /**
     * Update theme icons based on current theme
     * @param {string} theme - Current theme
     */
    function updateThemeIcons(theme) {
        themeToggles.forEach(toggle => {
            const icon = toggle.querySelector('i');
            if (icon) {
                if (theme === DARK_CLASS) {
                    icon.classList.remove('fa-moon');
                    icon.classList.add('fa-sun');
                } else {
                    icon.classList.remove('fa-sun');
                    icon.classList.add('fa-moon');
                }
            }
        });
    }
    
    /**
     * Load saved theme or use system preference
     */
    function loadTheme() {
        // Check if user has saved preference
        const savedTheme = localStorage.getItem(THEME_KEY);
        
        if (savedTheme) {
            // Use saved preference
            setTheme(savedTheme);
        } else {
            // Use system preference
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                setTheme(DARK_CLASS);
            } else {
                setTheme(LIGHT_CLASS);
            }
            
            // Listen for system theme changes
            if (window.matchMedia) {
                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                    if (e.matches) {
                        setTheme(DARK_CLASS);
                    } else {
                        setTheme(LIGHT_CLASS);
                    }
                });
            }
        }
    }
    
    // Initialize on page load
    document.addEventListener('DOMContentLoaded', init);
    
    // Public API
    return {
        toggleTheme,
        setTheme,
        loadTheme
    };
})();

