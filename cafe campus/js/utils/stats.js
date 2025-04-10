/**
 * Stats Manager for Campus Cafe
 * Handles displaying and updating customer stats with gamification
 */

const statsManager = (function() {
    // Storage keys
    const STATS_KEY = 'campus_cafe_stats';
    const LAST_VISIT_KEY = 'campus_cafe_last_visit';
    
    // Default starting values
    const DEFAULT_STATS = {
        customersServedToday: 38,
        customersEverServed: 18540,
        ordersSubmitted: 22098,
        lastResetDate: new Date().toISOString().split('T')[0],
        lastUpdateTime: Date.now()
    };
    
    // Increment rates per second (extremely slowed down)
    const INCREMENT_RATES = {
        customersServedToday: 0.008,  // ~0.5 per minute
        customersEverServed: 0.012,   // ~0.7 per minute
        ordersSubmitted: 0.018        // ~1.1 per minute
    };
    
    // Maximum values for each stat
    const MAX_VALUES = {
        customersServedToday: 312,     // Reset after this value
        customersEverServed: 100000,   // Keeps growing but slows down
        ordersSubmitted: 150000        // Keeps growing but slows down
    };
    
    // Next update time in milliseconds for each stat
    let nextUpdateTime = {
        customersServedToday: 0,
        customersEverServed: 0,
        ordersSubmitted: 0
    };
    
    // Track if animations are currently running
    let animationInProgress = {
        customersServedToday: false,
        customersEverServed: false,
        ordersSubmitted: false
    };
    
    /**
     * Initialize stats
     */
    function initStats() {
        let stats = getStats();
        const lastVisit = localStorage.getItem(LAST_VISIT_KEY) || Date.now();
        const currentTime = Date.now();
        const elapsedSeconds = Math.floor((currentTime - parseInt(lastVisit)) / 1000);
        
        // Check if we need to reset daily counter (new day)
        const today = new Date().toISOString().split('T')[0];
        if (stats.lastResetDate !== today) {
            stats.customersServedToday = DEFAULT_STATS.customersServedToday;
            stats.lastResetDate = today;
        }
        
        // Update stats based on time elapsed since last visit (if over 30 seconds ago)
        if (elapsedSeconds > 30) {
            // Update each stat with elapsed time but at a reduced rate for idle time
            stats = incrementStatsForElapsedTime(stats, elapsedSeconds * 0.5);
            stats.lastUpdateTime = currentTime;
            
            // Save updated stats
            saveStats(stats);
        }
        
        // Setup initial variation in update times - much longer intervals
        nextUpdateTime.customersServedToday = Date.now() + (Math.random() * 8000) + 12000; // 12-20 seconds
        nextUpdateTime.customersEverServed = Date.now() + (Math.random() * 10000) + 15000; // 15-25 seconds
        nextUpdateTime.ordersSubmitted = Date.now() + (Math.random() * 7000) + 10000; // 10-17 seconds
        
        // Set current time as last visit
        localStorage.setItem(LAST_VISIT_KEY, currentTime.toString());
        
        // Initial display update
        updateStatsDisplay();
        
        // Start continuous update
        startContinuousUpdate();
        
        // Add custom styling for stats
        addStatsStyling();
    }
    
    /**
     * Add custom styling for stats elements
     */
    function addStatsStyling() {
        // Create style element if it doesn't exist
        let styleEl = document.getElementById('stats-custom-styles');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'stats-custom-styles';
            document.head.appendChild(styleEl);
            
            // Add custom styles for stats counters
            styleEl.textContent = `
                .stat-value {
                    display: inline-block;
                    font-weight: bold;
                    transition: all 0.5s ease;
                    position: relative;
                }
                
                .stat-value.updating {
                    color: #be0027;
                }
                
                .stat-wrapper {
                    display: inline-flex;
                    align-items: center;
                    position: relative;
                }
                
                .stat-icon {
                    margin-right: 6px;
                    opacity: 0.7;
                }
                
                .stat-highlight {
                    position: absolute;
                    bottom: -2px;
                    left: 0;
                    height: 2px;
                    background: linear-gradient(90deg, #be0027 0%, #006b3f 100%);
                    width: 0;
                    transition: width 5s ease-in-out;
                }
                
                .stat-highlight.active {
                    width: 100%;
                }
                
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.05); opacity: 0.9; }
                    100% { transform: scale(1); opacity: 1; }
                }
                
                .stat-pulse {
                    animation: pulse 5s infinite ease-in-out;
                }
            `;
        }
        
        // Apply custom styling to stat elements
        setTimeout(() => {
            const statElements = document.querySelectorAll('[id^="customers-"], [id^="orders-"]');
            statElements.forEach(el => {
                // Skip if already styled
                if (el.parentElement.classList.contains('stat-wrapper')) return;
                
                // Create wrapper
                const wrapper = document.createElement('div');
                wrapper.className = 'stat-wrapper';
                
                // Create highlight bar
                const highlight = document.createElement('div');
                highlight.className = 'stat-highlight';
                
                // Add appropriate icon
                const icon = document.createElement('span');
                icon.className = 'stat-icon';
                
                if (el.id === 'customers-today') {
                    icon.innerHTML = '🧑‍🎓';
                } else if (el.id === 'customers-total') {
                    icon.innerHTML = '👥';
                } else if (el.id === 'orders-count') {
                    icon.innerHTML = '🍽️';
                }
                
                // Replace element with wrapper containing everything
                el.parentNode.insertBefore(wrapper, el);
                wrapper.appendChild(icon);
                wrapper.appendChild(el);
                wrapper.appendChild(highlight);
                
                // Add stat-value class to element
                el.classList.add('stat-value');
            });
        }, 1000);
    }
    
    /**
     * Get stats from storage
     */
    function getStats() {
        const stats = localStorage.getItem(STATS_KEY);
        return stats ? JSON.parse(stats) : {...DEFAULT_STATS};
    }
    
    /**
     * Save stats to storage
     */
    function saveStats(stats) {
        localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    }
    
    /**
     * Increment stats based on time elapsed
     */
    function incrementStatsForElapsedTime(stats, seconds) {
        // Customers served today - resets at max value
        stats.customersServedToday += Math.floor(INCREMENT_RATES.customersServedToday * seconds);
        if (stats.customersServedToday >= MAX_VALUES.customersServedToday) {
            stats.customersServedToday = DEFAULT_STATS.customersServedToday;
        }
        
        // Total customers ever served - keeps growing but at reduced rate past threshold
        const everServedIncrement = stats.customersEverServed > MAX_VALUES.customersEverServed * 0.8 
            ? INCREMENT_RATES.customersEverServed * 0.3 * seconds 
            : INCREMENT_RATES.customersEverServed * seconds;
        stats.customersEverServed += Math.floor(everServedIncrement);
        
        // Orders submitted - keeps growing but at reduced rate past threshold
        const ordersIncrement = stats.ordersSubmitted > MAX_VALUES.ordersSubmitted * 0.8 
            ? INCREMENT_RATES.ordersSubmitted * 0.3 * seconds 
            : INCREMENT_RATES.ordersSubmitted * seconds;
        stats.ordersSubmitted += Math.floor(ordersIncrement);
        
        return stats;
    }
    
    /**
     * Start continuous update of stats
     */
    function startContinuousUpdate() {
        // Check and update at more frequent intervals, but only update the DOM when needed
        const checkInterval = setInterval(() => {
            const currentTime = Date.now();
            let stats = getStats();
            let hasUpdates = false;
            
            // Check if it's time to update customers served today
            if (currentTime >= nextUpdateTime.customersServedToday && !animationInProgress.customersServedToday) {
                // Update with 5-12 seconds of increments (typically 0-1 customers)
                const increment = Math.random() < 0.7 ? 1 : 0; // 70% chance of +1, 30% chance of no change
                
                if (increment > 0) {
                    stats.customersServedToday += increment;
                    
                    // Check for reset
                    if (stats.customersServedToday >= MAX_VALUES.customersServedToday) {
                        stats.customersServedToday = DEFAULT_STATS.customersServedToday;
                    }
                    
                    hasUpdates = true;
                    
                    // Add visual indicator
                    const el = document.getElementById('customers-today');
                    if (el) {
                        animationInProgress.customersServedToday = true;
                        const wrapper = el.closest('.stat-wrapper');
                        if (wrapper) {
                            const highlight = wrapper.querySelector('.stat-highlight');
                            if (highlight) highlight.classList.add('active');
                        }
                        el.classList.add('updating');
                        
                        setTimeout(() => {
                            el.classList.remove('updating');
                            if (wrapper) {
                                const highlight = wrapper.querySelector('.stat-highlight');
                                if (highlight) highlight.classList.remove('active');
                            }
                            animationInProgress.customersServedToday = false;
                        }, 5000);
                    }
                }
                
                // Set next update time (12-30 seconds from now)
                nextUpdateTime.customersServedToday = currentTime + (Math.random() * 18000) + 12000;
            }
            
            // Check if it's time to update total customers ever served
            if (currentTime >= nextUpdateTime.customersEverServed && !animationInProgress.customersEverServed) {
                // Update with small increment
                const increment = stats.customersEverServed > MAX_VALUES.customersEverServed * 0.8
                    ? (Math.random() < 0.6 ? 1 : 0) // 60% chance of +1
                    : (Math.random() < 0.8 ? 1 : 2); // 80% chance of +1, 20% chance of +2
                
                if (increment > 0) {
                    stats.customersEverServed += increment;
                    hasUpdates = true;
                    
                    // Add visual indicator
                    const el = document.getElementById('customers-total');
                    if (el) {
                        animationInProgress.customersEverServed = true;
                        const wrapper = el.closest('.stat-wrapper');
                        if (wrapper) {
                            const highlight = wrapper.querySelector('.stat-highlight');
                            if (highlight) highlight.classList.add('active');
                        }
                        el.classList.add('updating');
                        
                        setTimeout(() => {
                            el.classList.remove('updating');
                            if (wrapper) {
                                const highlight = wrapper.querySelector('.stat-highlight');
                                if (highlight) highlight.classList.remove('active');
                            }
                            animationInProgress.customersEverServed = false;
                        }, 5000);
                    }
                }
                
                // Set next update time (15-35 seconds from now)
                nextUpdateTime.customersEverServed = currentTime + (Math.random() * 20000) + 15000;
            }
            
            // Check if it's time to update orders submitted
            if (currentTime >= nextUpdateTime.ordersSubmitted && !animationInProgress.ordersSubmitted) {
                // Update with small increment
                const increment = stats.ordersSubmitted > MAX_VALUES.ordersSubmitted * 0.8
                    ? (Math.random() < 0.7 ? 1 : 0) // 70% chance of +1
                    : (Math.random() < 0.7 ? 1 : 2); // 70% chance of +1, 30% chance of +2
                
                if (increment > 0) {
                    stats.ordersSubmitted += increment;
                    hasUpdates = true;
                    
                    // Add visual indicator
                    const el = document.getElementById('orders-count');
                    if (el) {
                        animationInProgress.ordersSubmitted = true;
                        const wrapper = el.closest('.stat-wrapper');
                        if (wrapper) {
                            const highlight = wrapper.querySelector('.stat-highlight');
                            if (highlight) highlight.classList.add('active');
                        }
                        el.classList.add('updating');
                        
                        setTimeout(() => {
                            el.classList.remove('updating');
                            if (wrapper) {
                                const highlight = wrapper.querySelector('.stat-highlight');
                                if (highlight) highlight.classList.remove('active');
                            }
                            animationInProgress.ordersSubmitted = false;
                        }, 5000);
                    }
                }
                
                // Set next update time (10-25 seconds from now)
                nextUpdateTime.ordersSubmitted = currentTime + (Math.random() * 15000) + 10000;
            }
            
            // Save and update if any changes were made
            if (hasUpdates) {
                stats.lastUpdateTime = currentTime;
                saveStats(stats);
                updateStatsDisplay();
            }
        }, 1000); // Check every second but update DOM less frequently
        
        // Store interval ID in window object to keep it running
        window.statsUpdateInterval = checkInterval;
    }
    
    /**
     * Update stats display in DOM
     */
    function updateStatsDisplay() {
        const customersToday = document.getElementById('customers-today');
        const customersTotal = document.getElementById('customers-total');
        const ordersCount = document.getElementById('orders-count');
        
        if (!customersToday || !customersTotal || !ordersCount) return;
        
        const stats = getStats();
        
        // Update elements with animation
        animateCounter(customersToday, parseInt(customersToday.textContent) || 0, stats.customersServedToday);
        animateCounter(customersTotal, parseInt(customersTotal.textContent) || 0, stats.customersEverServed);
        animateCounter(ordersCount, parseInt(ordersCount.textContent) || 0, stats.ordersSubmitted);
    }
    
    /**
     * Manually increment stats when order is completed
     */
    function incrementCompleteOrder() {
        const stats = getStats();
        
        // Increment counters
        stats.customersServedToday += 1;
        stats.customersEverServed += 1;
        
        // Check if we need to reset daily counter
        if (stats.customersServedToday >= MAX_VALUES.customersServedToday) {
            stats.customersServedToday = DEFAULT_STATS.customersServedToday;
        }
        
        // Save updated stats
        saveStats(stats);
        
        // Add visual indication for manual increment
        const todayEl = document.getElementById('customers-today');
        const totalEl = document.getElementById('customers-total');
        
        if (todayEl) {
            todayEl.classList.add('stat-pulse');
            setTimeout(() => todayEl.classList.remove('stat-pulse'), 5000);
        }
        
        if (totalEl) {
            totalEl.classList.add('stat-pulse');
            setTimeout(() => totalEl.classList.remove('stat-pulse'), 5000);
        }
        
        // Update DOM immediately
        updateStatsDisplay();
    }
    
    /**
     * Manually increment stats when order is placed
     */
    function incrementOrderSubmitted() {
        const stats = getStats();
        
        // Increment counter
        stats.ordersSubmitted += 1;
        
        // Save updated stats
        saveStats(stats);
        
        // Add visual indication for manual increment
        const ordersEl = document.getElementById('orders-count');
        if (ordersEl) {
            ordersEl.classList.add('stat-pulse');
            setTimeout(() => ordersEl.classList.remove('stat-pulse'), 5000);
        }
        
        // Update DOM immediately
        updateStatsDisplay();
    }
    
    /**
     * Animate a counter from start to end value
     * @param {HTMLElement} element - DOM element to update
     * @param {number} start - Starting value
     * @param {number} end - Target value
     * @param {number} duration - Animation duration in ms
     */
    function animateCounter(element, start, end, duration = 4000) {
        if (!element) return;
        
        // Ensure proper number conversion
        start = isNaN(start) ? 0 : start;
        end = isNaN(end) ? 0 : end;
        
        // If no change, no need to animate
        if (start === end) return;
        
        // Clear any existing animation
        if (element._animationFrame) {
            cancelAnimationFrame(element._animationFrame);
        }
        
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            
            // Use easeInOutCubic for smoother animation
            let cubicProgress;
            if (progress < 0.5) {
                cubicProgress = 4 * progress * progress * progress;
            } else {
                const f = ((2 * progress) - 2);
                cubicProgress = 0.5 * f * f * f + 1;
            }
            
            const value = Math.floor(cubicProgress * (end - start) + start);
            element.textContent = value.toLocaleString();
            
            if (progress < 1) {
                element._animationFrame = requestAnimationFrame(step);
            } else {
                element.textContent = end.toLocaleString();
                element._animationFrame = null;
            }
        };
        
        element._animationFrame = requestAnimationFrame(step);
    }
    
    // Public API
    return {
        initStats,
        getStats,
        updateStatsDisplay,
        incrementCompleteOrder,
        incrementOrderSubmitted
    };
})();

// Initialize stats when DOM is loaded
document.addEventListener('DOMContentLoaded', statsManager.initStats); 