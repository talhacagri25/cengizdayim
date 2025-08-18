// API utility functions for the florist website
class FloristAPI {
    constructor() {
        this.baseURL = window.location.origin;
        this.endpoints = {
            plants: '/api/plants',
            categories: '/api/categories',
            orders: '/api/orders',
            store: '/api/store',
            upload: '/api/upload'
        };
    }

    // Generic API call method
    async makeRequest(url, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const config = { ...defaultOptions, ...options };
        
        try {
            const response = await fetch(`${this.baseURL}${url}`, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'API request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Plants API methods
    async getAllPlants(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${this.endpoints.plants}?${queryString}` : this.endpoints.plants;
        return await this.makeRequest(url);
    }

    async getFeaturedPlants() {
        return await this.makeRequest(`${this.endpoints.plants}?featured=true&limit=6`);
    }

    async getPlant(id) {
        return await this.makeRequest(`${this.endpoints.plants}/${id}`);
    }

    async searchPlants(searchTerm, filters = {}) {
        const params = {
            search: searchTerm,
            ...filters
        };
        return await this.getAllPlants(params);
    }

    async getPlantsByCategory(category, params = {}) {
        const queryParams = {
            category: category,
            ...params
        };
        return await this.getAllPlants(queryParams);
    }

    // Categories API methods
    async getAllCategories() {
        return await this.makeRequest(this.endpoints.categories);
    }

    // Orders API methods
    async createOrder(orderData) {
        return await this.makeRequest(this.endpoints.orders, {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    }

    async getOrder(orderId) {
        return await this.makeRequest(`${this.endpoints.orders}/${orderId}`);
    }

    // Store API methods
    async getStoreInfo() {
        return await this.makeRequest(this.endpoints.store);
    }

    // Utility methods for common operations
    async loadFeaturedPlants() {
        try {
            const response = await this.getFeaturedPlants();
            return response.plants || [];
        } catch (error) {
            console.error('Error loading featured plants:', error);
            return [];
        }
    }

    async loadCategories() {
        try {
            const response = await this.getAllCategories();
            return response.categories || [];
        } catch (error) {
            console.error('Error loading categories:', error);
            return [];
        }
    }

    async loadStoreInfo() {
        try {
            const response = await this.getStoreInfo();
            return response.store || {};
        } catch (error) {
            console.error('Error loading store info:', error);
            return {};
        }
    }
}

// Cart management utilities
class CartManager {
    constructor() {
        this.cartKey = 'florist_cart';
        this.cart = this.loadCart();
        this.updateCartDisplay();
    }

    loadCart() {
        try {
            const saved = localStorage.getItem(this.cartKey);
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading cart:', error);
            return [];
        }
    }

    saveCart() {
        try {
            localStorage.setItem(this.cartKey, JSON.stringify(this.cart));
            this.updateCartDisplay();
            this.dispatchCartUpdate();
        } catch (error) {
            console.error('Error saving cart:', error);
        }
    }

    addToCart(plant, quantity = 1) {
        const existingItem = this.cart.find(item => item.id === plant.id);
        
        // Get current language for displaying correct name
        const currentLang = localStorage.getItem('florist_language') || 'tr';
        let displayName = plant.name;
        
        if (currentLang !== 'tr') {
            const langSuffix = currentLang === 'en' ? '_en' : 
                              currentLang === 'az' ? '_az' : 
                              currentLang === 'ru' ? '_ru' : '';
            displayName = plant[`name${langSuffix}`] || plant.name;
        }
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.cart.push({
                id: plant.id,
                name: plant.name,  // Store original name for consistency
                name_en: plant.name_en,
                name_az: plant.name_az,
                name_ru: plant.name_ru,
                category: plant.category,  // Add category for recommendations
                price: plant.sale_price || plant.price,
                originalPrice: plant.price,
                image_url: plant.image_url,
                quantity: quantity,
                stock_quantity: plant.stock_quantity
            });
        }
        
        this.saveCart();
        this.showAddToCartNotification(displayName);
    }

    removeFromCart(plantId) {
        this.cart = this.cart.filter(item => item.id !== plantId);
        this.saveCart();
    }

    updateQuantity(plantId, quantity) {
        const item = this.cart.find(item => item.id === plantId);
        if (item) {
            if (quantity <= 0) {
                this.removeFromCart(plantId);
            } else {
                item.quantity = Math.min(quantity, item.stock_quantity);
                this.saveCart();
            }
        }
    }

    clearCart() {
        this.cart = [];
        this.saveCart();
    }

    getCartTotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    getCartItemCount() {
        return this.cart.reduce((total, item) => total + item.quantity, 0);
    }

    updateCartDisplay() {
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
            const count = this.getCartItemCount();
            cartCount.textContent = count;
            cartCount.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    dispatchCartUpdate() {
        window.dispatchEvent(new CustomEvent('cartUpdated', {
            detail: {
                cart: this.cart,
                total: this.getCartTotal(),
                itemCount: this.getCartItemCount()
            }
        }));
    }

    showAddToCartNotification(plantName) {
        // Create and show a notification
        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">✅</span>
                <span class="notification-text">${plantName} added to cart!</span>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: #2d5a27;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.5s forwards;
            transform: translateX(100%);
        `;
        
        // Add animation styles
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideInRight {
                    to { transform: translateX(0); }
                }
                @keyframes fadeOut {
                    to { opacity: 0; transform: translateX(100%); }
                }
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Remove notification after animation
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
}

// Utility functions
const utils = {
    // Format price with currency
    formatPrice(price) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(price);
    },

    // Format date
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    // Debounce function for search
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Create plant card HTML
    createPlantCard(plant, categories = null) {
        const hasDiscount = plant.sale_price && plant.sale_price < plant.price;
        const displayPrice = plant.sale_price || plant.price;
        
        // Get current language
        const currentLang = localStorage.getItem('florist_language') || 'tr';
        
        // Get translated name and description based on current language
        let displayName = plant.name;
        let displayDescription = plant.description || '';
        let displayCategoryName = plant.category;
        
        if (currentLang !== 'tr') {
            // Use translated fields for non-Turkish languages
            const langSuffix = currentLang === 'en' ? '_en' : 
                              currentLang === 'az' ? '_az' : 
                              currentLang === 'ru' ? '_ru' : '';
            
            displayName = plant[`name${langSuffix}`] || plant.name;
            displayDescription = plant[`description${langSuffix}`] || plant.description || '';
            
            // Try to get translated category name if categories are provided
            if (categories && categories.length > 0) {
                const category = categories.find(cat => cat.name === plant.category);
                if (category) {
                    displayCategoryName = category[`name${langSuffix}`] || category.name;
                }
            }
        }
        
        return `
            <div class="plant-card" data-plant-id="${plant.id}">
                <img src="${plant.image_url || '/images/placeholder-plant.svg'}" 
                     alt="${displayName}" class="plant-image" 
                     onerror="this.style.display=\"none\"">
                <div class="plant-info">
                    <h3 class="plant-name">${displayName}</h3>
                    ${plant.scientific_name ? `<p class="plant-scientific">${plant.scientific_name}</p>` : ''}
                    <div class="plant-price">
                        <span class="price ${hasDiscount ? 'sale-price' : ''}">${utils.formatPrice(displayPrice)}</span>
                        ${hasDiscount ? `<span class="original-price">${utils.formatPrice(plant.price)}</span>` : ''}
                    </div>
                    <p class="plant-description">${displayDescription.substring(0, 100)}${displayDescription.length > 100 ? '...' : ''}</p>
                    <div class="plant-meta">
                        <span class="plant-category">📂 ${displayCategoryName}</span>
                        <span class="plant-stock">📦 ${plant.stock_quantity} <span data-i18n="product.in_stock">${window.t?.('product.in_stock') || 'in stock'}</span></span>
                    </div>
                    <div class="plant-actions">
                        <button class="btn-view-details" onclick="viewPlantDetails(${plant.id})" data-i18n="product.view_details">
                            ${window.t?.('product.view_details') || 'View Details'}
                        </button>
                        <button class="add-to-cart ${plant.stock_quantity === 0 ? 'disabled' : ''}" 
                                onclick="addPlantToCart(${plant.id})"
                                ${plant.stock_quantity === 0 ? 'disabled' : ''}
                                data-i18n="${plant.stock_quantity === 0 ? 'product.out_of_stock' : 'product.add_to_cart'}">
                            ${plant.stock_quantity === 0 ? window.t?.('product.out_of_stock') || 'Out of Stock' : window.t?.('product.add_to_cart') || 'Add to Cart'}
                        </button>
                    </div>
                </div>
                ${plant.featured ? '<div class="featured-badge" data-i18n="product.featured">⭐ Featured</div>' : ''}
                ${hasDiscount ? '<div class="discount-badge" data-i18n="product.sale">Sale!</div>' : ''}
            </div>
        `;
    },

    // Create category card HTML
    createCategoryCard(category) {
        const categoryIcons = {
            'Indoor Plants': '🏠',
            'Outdoor Plants': '🌳',
            'Flowering Plants': '🌸',
            'Succulents': '🌵',
            'Herbs & Vegetables': '🌿',
            'Trees & Shrubs': '🌲'
        };

        // Get current language
        const currentLang = localStorage.getItem('florist_language') || 'tr';
        
        // Get translated name and description based on current language
        let displayName = category.name;
        let displayDescription = category.description || '';
        
        if (currentLang !== 'tr') {
            // Use translated fields for non-Turkish languages
            const langSuffix = currentLang === 'en' ? '_en' : 
                              currentLang === 'az' ? '_az' : 
                              currentLang === 'ru' ? '_ru' : '';
            
            displayName = category[`name${langSuffix}`] || category.name;
            displayDescription = category[`description${langSuffix}`] || category.description || '';
        }

        return `
            <a href="/shop.html?category=${encodeURIComponent(category.name)}" class="category-card-link">
                <div class="category-card-simple">
                    <div class="category-icon">${categoryIcons[category.name] || '🌱'}</div>
                    <h3 class="category-name">${displayName}</h3>
                    <p class="category-description">${displayDescription}</p>
                    <span class="category-action">
                        ${window.t?.('nav.shop') || 'Alışveriş'} →
                    </span>
                </div>
            </a>
        `;
    },

    // Show loading state
    showLoading(container) {
        if (typeof container === 'string') {
            container = document.getElementById(container);
        }
        if (container) {
            container.innerHTML = `
                <div class="loading-container" style="text-align: center; padding: 3rem;">
                    <div class="loading-spinner" style="margin: 0 auto 1rem;"></div>
                    <p>Loading...</p>
                </div>
            `;
        }
    },

    // Show error state
    showError(container, message = 'Something went wrong. Please try again.') {
        if (typeof container === 'string') {
            container = document.getElementById(container);
        }
        if (container) {
            container.innerHTML = `
                <div class="error-container" style="text-align: center; padding: 3rem; color: #e74c3c;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
                    <h3>Oops!</h3>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="window.location.href='/')" style="margin-top: 1rem;">
                        Go to Homepage
                    </button>
                </div>
            `;
        }
    },

    // Intersection Observer for animations
    observeElements() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            observer.observe(el);
        });
    }
};

// Global instances
const api = new FloristAPI();
const cart = new CartManager();

// Global functions for HTML onclick handlers
window.viewPlantDetails = function(plantId) {
    window.location.href = `/product.html?id=${plantId}`;
};

window.addPlantToCart = function(plantId) {
    api.getPlant(plantId).then(response => {
        if (response.success && response.plant) {
            cart.addToCart(response.plant);
        }
    }).catch(error => {
        console.error('Error adding plant to cart:', error);
    });
};

window.viewCategory = function(categoryName) {
    window.location.href = `/shop.html?category=${encodeURIComponent(categoryName)}`;
};

// Export for use in other scripts
window.FloristAPI = FloristAPI;
window.CartManager = CartManager;
window.utils = utils;
window.api = api;
window.cart = cart;