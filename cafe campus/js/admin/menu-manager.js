/**
 * Menu Manager JavaScript for Campus Cafe
 */

// DOM Elements
const menuItemsBody = document.getElementById('menu-items-body');
const noItemsMessage = document.getElementById('no-items-message');
const addItemBtn = document.getElementById('add-item-btn');
const addFirstItemBtn = document.getElementById('add-first-item-btn');
const itemModal = document.getElementById('item-modal');
const itemForm = document.getElementById('item-form');
const modalTitle = document.getElementById('modal-title');
const cancelBtn = document.getElementById('cancel-btn');
const closeModal = document.querySelector('.close-modal');
const deleteModal = document.getElementById('delete-modal');
const deleteItemName = document.getElementById('delete-item-name');
const deleteConfirmBtn = document.getElementById('delete-confirm-btn');
const deleteCancelBtn = document.getElementById('delete-cancel-btn');
const categoryFilter = document.getElementById('category-filter');
const menuSearch = document.getElementById('menu-search');
const searchBtn = document.getElementById('search-btn');
const logoutBtn = document.getElementById('logout-btn');
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
const imageUrlInput = document.getElementById('item-image-url');
const previewImage = document.getElementById('preview-image');
const imagePlaceholder = document.querySelector('.preview-container .image-placeholder');

// Current state
let currentItemId = null;
let itemBeingDeleted = null;
let currentFilter = 'all';
let currentSearchTerm = '';

/**
 * Initialize the menu manager page
 */
function initMenuManager() {
    // Check if user is logged in
    if (!authManager.isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }
    
    // Add event listeners
    addEventListeners();
    
    // Load menu items
    loadMenuItems();
}

/**
 * Add all event listeners
 */
function addEventListeners() {
    // Add new item button
    if (addItemBtn) {
        addItemBtn.addEventListener('click', () => openItemModal());
    }
    
    // Add first item button (shown when no items exist)
    if (addFirstItemBtn) {
        addFirstItemBtn.addEventListener('click', () => openItemModal());
    }
    
    // Item form
    if (itemForm) {
        itemForm.addEventListener('submit', handleSaveItem);
    }
    
    // Image URL input for preview
    if (imageUrlInput) {
        imageUrlInput.addEventListener('input', updateImagePreview);
        imageUrlInput.addEventListener('paste', () => {
            // Add slight delay to allow paste to complete
            setTimeout(updateImagePreview, 100);
        });
    }
    
    // Cancel button in modal
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeItemModal);
    }
    
    // Close modal X button
    if (closeModal) {
        closeModal.addEventListener('click', closeItemModal);
    }
    
    // Delete modal buttons
    if (deleteConfirmBtn) {
        deleteConfirmBtn.addEventListener('click', confirmDeleteItem);
    }
    
    if (deleteCancelBtn) {
        deleteCancelBtn.addEventListener('click', closeDeleteModal);
    }
    
    // Category filter
    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => {
            currentFilter = categoryFilter.value;
            filterMenuItems();
        });
    }
    
    // Search
    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }
    
    if (menuSearch) {
        menuSearch.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }
    
    // Logout button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Mobile menu toggle
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    }
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === itemModal) {
            closeItemModal();
        }
        if (e.target === deleteModal) {
            closeDeleteModal();
        }
    });
    
    // Close modals with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (itemModal && itemModal.style.display === 'block') {
                closeItemModal();
            }
            if (deleteModal && deleteModal.style.display === 'block') {
                closeDeleteModal();
            }
        }
    });
}

/**
 * Update image preview when URL changes
 */
function updateImagePreview() {
    if (!imageUrlInput || !previewImage || !imagePlaceholder) return;
    
    const imageUrl = imageUrlInput.value.trim();
    
    if (imageUrl) {
        // Show loading state
        previewImage.src = '';
        previewImage.style.display = 'none';
        imagePlaceholder.style.display = 'flex';
        imagePlaceholder.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Loading...</span>';
        
        // Check if image exists and load it
        const img = new Image();
        img.onload = function() {
            previewImage.src = imageUrl;
            previewImage.style.display = 'block';
            imagePlaceholder.style.display = 'none';
        };
        img.onerror = function() {
            previewImage.style.display = 'none';
            imagePlaceholder.style.display = 'flex';
            imagePlaceholder.innerHTML = '<i class="fas fa-exclamation-circle"></i><span>Invalid image URL</span>';
        };
        img.src = imageUrl;
    } else {
        // No URL, show placeholder
        previewImage.style.display = 'none';
        imagePlaceholder.style.display = 'flex';
        imagePlaceholder.innerHTML = '<i class="fas fa-image"></i><span>No image</span>';
    }
}

/**
 * Handle search functionality
 */
function handleSearch() {
    currentSearchTerm = menuSearch.value.trim().toLowerCase();
    filterMenuItems();
}

/**
 * Handle logout
 * @param {Event} e - Click event
 */
function handleLogout(e) {
    e.preventDefault();
    
    authManager.logout();
    window.location.href = 'login.html';
}

/**
 * Toggle mobile menu
 */
function toggleMobileMenu() {
    const sidebar = document.querySelector('.admin-sidebar');
    sidebar.classList.toggle('active');
    
    // Change icon based on menu state
    const icon = mobileMenuToggle.querySelector('i');
    if (sidebar.classList.contains('active')) {
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-times');
    } else {
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
    }
}

/**
 * Load menu items from storage
 */
function loadMenuItems() {
    try {
        // Get menu items
        const menuItems = storageManager.getMenuItems();
        
        // Apply current filters
        filterMenuItems();
    } catch (error) {
        console.error('Error loading menu items:', error);
        if (menuItemsBody) {
            menuItemsBody.innerHTML = `
                <tr>
                    <td colspan="6">
                        <div class="error-message">
                            Failed to load menu items. Please try refreshing the page.
                        </div>
                    </td>
                </tr>
            `;
        }
    }
}

/**
 * Filter and display menu items
 */
function filterMenuItems() {
    // Get menu items
    const menuItems = storageManager.getMenuItems();
    
    // Apply filters
    let filteredItems = menuItems;
    
    // Filter by category
    if (currentFilter !== 'all') {
        filteredItems = filteredItems.filter(item => item.category === currentFilter);
    }
    
    // Filter by search term
    if (currentSearchTerm) {
        filteredItems = filteredItems.filter(item => {
            return (
                item.name.toLowerCase().includes(currentSearchTerm) ||
                item.description.toLowerCase().includes(currentSearchTerm)
            );
        });
    }
    
    // Display filtered items
    displayMenuItems(filteredItems);
}

/**
 * Display menu items in the table
 * @param {Array} items - Array of menu items to display
 */
function displayMenuItems(items) {
    if (!menuItemsBody) return;
    
    // Clear table
    menuItemsBody.innerHTML = '';
    
    if (items.length === 0) {
        // Show no items message
        if (noItemsMessage) {
            noItemsMessage.style.display = 'block';
        }
        return;
    }
    
    // Hide no items message
    if (noItemsMessage) {
        noItemsMessage.style.display = 'none';
    }
    
    // Sort items by name
    const sortedItems = [...items].sort((a, b) => 
        a.name.localeCompare(b.name)
    );
    
    // Add items to table
    sortedItems.forEach(item => {
        const row = document.createElement('tr');
        row.dataset.id = item.id;
        
        const categoryLabel = formatCategoryLabel(item.category);
        
        // Create image column content
        let imageHtml = '';
        if (item.imageUrl) {
            imageHtml = `<img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.name)}" class="menu-item-thumbnail">`;
        } else {
            imageHtml = '<span class="no-image"><i class="fas fa-image"></i></span>';
        }
        
        row.innerHTML = `
            <td>${escapeHtml(item.name)}</td>
            <td>${categoryLabel}</td>
            <td>KSh ${item.price.toFixed(2)}</td>
            <td class="image-cell">${imageHtml}</td>
            <td>${item.featured ? '<span class="featured-badge">Featured</span>' : 'No'}</td>
            <td>
                <div class="action-buttons">
                    <button type="button" class="action-btn edit-btn" title="Edit item">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button type="button" class="action-btn delete-btn" title="Delete item">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </td>
        `;
        
        // Add event listeners to action buttons
        const editBtn = row.querySelector('.edit-btn');
        const deleteBtn = row.querySelector('.delete-btn');
        
        if (editBtn) {
            editBtn.addEventListener('click', () => openItemModal(item));
        }
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => openDeleteModal(item));
        }
        
        menuItemsBody.appendChild(row);
    });
}

/**
 * Open the item modal
 * @param {Object} item - Item to edit (null for new item)
 */
function openItemModal(item = null) {
    if (!itemModal || !itemForm) return;
    
    // Set modal title and form values
    if (item) {
        modalTitle.textContent = 'Edit Menu Item';
        currentItemId = item.id;
        
        // Set form values
        document.getElementById('item-id').value = item.id;
        document.getElementById('item-name').value = item.name;
        document.getElementById('item-category').value = item.category;
        document.getElementById('item-price').value = item.price;
        document.getElementById('item-featured').checked = item.featured;
        document.getElementById('item-description').value = item.description;
        
        // Set image URL if exists
        if (imageUrlInput) {
            imageUrlInput.value = item.imageUrl || '';
            updateImagePreview();
        }
        
        // Set ingredients
        if (item.ingredients && Array.isArray(item.ingredients)) {
            document.getElementById('item-ingredients').value = item.ingredients.join('\n');
        } else {
            document.getElementById('item-ingredients').value = '';
        }
    } else {
        modalTitle.textContent = 'Add New Menu Item';
        currentItemId = null;
        
        // Reset form
        itemForm.reset();
        document.getElementById('item-id').value = '';
        
        // Reset image preview
        if (previewImage && imagePlaceholder) {
            previewImage.style.display = 'none';
            imagePlaceholder.style.display = 'flex';
            imagePlaceholder.innerHTML = '<i class="fas fa-image"></i><span>No image</span>';
        }
    }
    
    // Show modal
    itemModal.style.display = 'block';
    
    // Focus first input
    setTimeout(() => {
        document.getElementById('item-name').focus();
    }, 100);
}

/**
 * Close the item modal
 */
function closeItemModal() {
    if (!itemModal) return;
    
    itemModal.style.display = 'none';
    currentItemId = null;
}

/**
 * Open the delete confirmation modal
 * @param {Object} item - Item to delete
 */
function openDeleteModal(item) {
    if (!deleteModal || !deleteItemName) return;
    
    // Set item being deleted
    itemBeingDeleted = item;
    
    // Set item name in modal
    deleteItemName.textContent = item.name;
    
    // Show modal
    deleteModal.style.display = 'block';
}

/**
 * Close the delete modal
 */
function closeDeleteModal() {
    if (!deleteModal) return;
    
    deleteModal.style.display = 'none';
    itemBeingDeleted = null;
}

/**
 * Handle save item form submission
 * @param {Event} e - Form submit event
 */
function handleSaveItem(e) {
    e.preventDefault();
    
    try {
        // Get form values
        const id = document.getElementById('item-id').value;
        const name = document.getElementById('item-name').value.trim();
        const category = document.getElementById('item-category').value;
        const price = parseFloat(document.getElementById('item-price').value);
        const featured = document.getElementById('item-featured').checked;
        const description = document.getElementById('item-description').value.trim();
        const ingredientsText = document.getElementById('item-ingredients').value.trim();
        const imageUrl = imageUrlInput ? imageUrlInput.value.trim() : '';
        
        // Validate inputs
        if (!name) {
            showFormError('Item name is required');
            return;
        }
        
        if (!category) {
            showFormError('Please select a category');
            return;
        }
        
        if (isNaN(price) || price < 0) {
            showFormError('Please enter a valid price');
            return;
        }
        
        if (!description) {
            showFormError('Item description is required');
            return;
        }
        
        // Process ingredients
        let ingredients = [];
        if (ingredientsText) {
            ingredients = ingredientsText
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);
        }
        
        // Create item object
        const item = {
            id: id || generateId(),
            name,
            category,
            price,
            featured,
            description,
            ingredients,
            imageUrl: imageUrl || null
        };
        
        // Save to storage
        storageManager.saveMenuItem(item);
        
        // Close modal
        closeItemModal();
        
        // Reload menu items
        loadMenuItems();
        
        // Show success message
        showAlert(`Menu item "${name}" has been ${id ? 'updated' : 'added'} successfully`);
    } catch (error) {
        console.error('Error saving menu item:', error);
        showFormError('Failed to save menu item. Please try again.');
    }
}

/**
 * Confirm delete item
 */
function confirmDeleteItem() {
    if (!itemBeingDeleted) return;
    
    try {
        // Delete from storage
        storageManager.deleteMenuItem(itemBeingDeleted.id);
        
        // Close modal
        closeDeleteModal();
        
        // Reload menu items
        loadMenuItems();
        
        // Show success message
        showAlert(`Menu item "${itemBeingDeleted.name}" has been deleted`);
    } catch (error) {
        console.error('Error deleting menu item:', error);
        showAlert('Failed to delete menu item. Please try again.', 'error');
    }
}

/**
 * Show form error
 * @param {string} message - Error message
 */
function showFormError(message) {
    // Check if error element already exists
    let errorEl = document.querySelector('.form-error');
    
    if (!errorEl) {
        // Create error element
        errorEl = document.createElement('div');
        errorEl.className = 'form-error error-message';
        
        // Insert before form actions
        const formActions = document.querySelector('.form-actions');
        formActions.parentNode.insertBefore(errorEl, formActions);
    }
    
    // Set error message
    errorEl.textContent = message;
    
    // Remove after 5 seconds
    setTimeout(() => {
        errorEl.remove();
    }, 5000);
}

/**
 * Show alert message
 * @param {string} message - Message to display
 * @param {string} type - Alert type ('success' or 'error')
 */
function showAlert(message, type = 'success') {
    // Create alert element
    const alertEl = document.createElement('div');
    alertEl.className = `admin-alert ${type}`;
    alertEl.textContent = message;
    
    // Add to document
    document.body.appendChild(alertEl);
    
    // Display with animation
    setTimeout(() => {
        alertEl.classList.add('show');
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        alertEl.classList.remove('show');
        
        // Remove element after animation
        setTimeout(() => {
            alertEl.remove();
        }, 300);
    }, 3000);
}

/**
 * Generate a unique ID
 * @returns {string} - Unique ID
 */
function generateId() {
    return 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
}

/**
 * Format category label for display
 * @param {string} category - Category key
 * @returns {string} - Formatted category label
 */
function formatCategoryLabel(category) {
    const categories = {
        'appetizers': 'Breakfast',
        'main-courses': 'Main Course',
        'desserts': 'Dessert',
        'drinks': 'Drink'
    };
    
    return categories[category] || 'Other';
}

/**
 * Escape HTML to prevent XSS
 * @param {string} unsafe - Unsafe string
 * @returns {string} - Escaped string
 */
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') {
        return '';
    }
    
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Initialize menu manager
document.addEventListener('DOMContentLoaded', initMenuManager);
