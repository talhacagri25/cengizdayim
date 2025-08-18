// Cart page JavaScript with enhanced animations and multilingual support

class CartPage {
    constructor() {
        this.cartItems = [];
        this.deliveryFee = 0;
        this.selectedDelivery = 'free';
        this.parallaxController = new CartParallax();
        this.init();
    }

    async init() {
        this.showLoading();
        
        try {
            this.loadCartItems();
            this.setupEventListeners();
            this.setupParallax();
            this.renderCart();
            await this.loadRecommendedProducts();
            this.hideLoading();
        } catch (error) {
            console.error('Error initializing cart page:', error);
            this.hideLoading();
        }
    }

    loadCartItems() {
        // Get cart items from CartManager
        this.cartItems = cart.cart || [];
        this.updateCartDisplay();
    }

    setupEventListeners() {
        // Listen for cart updates (but not from our own updates)
        window.addEventListener('cartUpdated', (e) => {
            // Skip re-render if update came from this page
            if (e.detail.source === 'cartPage') return;
            
            this.cartItems = e.detail.cart;
            this.renderCart();
            this.updateCartDisplay();
        });

        // Language change handler
        window.addEventListener('languageChanged', () => {
            this.renderCart();
        });

        // Newsletter form
        const newsletterForm = document.querySelector('.newsletter-form');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleNewsletterSignup();
            });
        }
    }

    setupParallax() {
        window.addEventListener('scroll', utils.debounce(() => {
            this.parallaxController.updateParallax();
        }, 16));
    }

    renderCart() {
        const cartContent = document.getElementById('cartContent');
        if (!cartContent) return;

        if (this.cartItems.length === 0) {
            this.renderEmptyCart(cartContent);
        } else {
            this.renderFilledCart(cartContent);
        }

        this.updateItemCount();
    }

    renderEmptyCart(container) {
        container.innerHTML = `
            <div class="cart-empty">
                <div class="empty-icon">🛒</div>
                <h2 class="empty-title" data-i18n="cart.empty">Your cart is empty</h2>
                <p class="empty-desc" data-i18n="cart.empty_desc">Looks like you haven't added any plants yet.</p>
                <a href="/shop.html" class="continue-shopping" data-i18n="cart.continue_shopping">Continue Shopping</a>
            </div>
        `;

        // Apply translations to new elements
        if (window.i18n) {
            i18n.applyTranslations();
        }
    }

    renderFilledCart(container) {
        const subtotal = this.calculateSubtotal();
        const total = subtotal + this.deliveryFee;

        container.innerHTML = `
            <div class="cart-filled">
                <div class="cart-items">
                    <div class="cart-items-header">
                        <div data-i18n="cart.item">Item</div>
                        <div data-i18n="cart.price">Price</div>
                        <div data-i18n="cart.quantity">Quantity</div>
                        <div data-i18n="cart.total">Total</div>
                        <div></div>
                    </div>
                    ${this.cartItems.map(item => this.renderCartItem(item)).join('')}
                </div>
                
                <div class="cart-summary">
                    <h3 class="summary-title" data-i18n="cart.order_summary">Order Summary</h3>
                    
                    <div class="summary-row">
                        <span class="summary-label" data-i18n="cart.subtotal">Subtotal</span>
                        <span class="summary-value">${utils.formatPrice(subtotal)}</span>
                    </div>
                    
                    <div class="delivery-options">
                        <h4 style="margin-bottom: 1rem; color: #2d5a27;" data-i18n="cart.delivery_options">Delivery Options</h4>
                        
                        <label class="delivery-option">
                            <input type="radio" name="delivery" value="free" ${this.selectedDelivery === 'free' ? 'checked' : ''} 
                                   onchange="cartPage.updateDelivery('free', 0)">
                            <div class="delivery-info">
                                <div class="delivery-name" data-i18n="cart.free_delivery">Free Delivery</div>
                                <div class="delivery-desc" data-i18n="cart.free_delivery_desc">5-7 business days</div>
                            </div>
                            <div class="delivery-price" data-i18n="cart.free">Free</div>
                        </label>
                        
                        <label class="delivery-option">
                            <input type="radio" name="delivery" value="express" ${this.selectedDelivery === 'express' ? 'checked' : ''} 
                                   onchange="cartPage.updateDelivery('express', 9.99)">
                            <div class="delivery-info">
                                <div class="delivery-name" data-i18n="cart.express_delivery">Express Delivery</div>
                                <div class="delivery-desc" data-i18n="cart.express_delivery_desc">2-3 business days</div>
                            </div>
                            <div class="delivery-price">${utils.formatPrice(9.99)}</div>
                        </label>
                        
                        <label class="delivery-option">
                            <input type="radio" name="delivery" value="same-day" ${this.selectedDelivery === 'same-day' ? 'checked' : ''} 
                                   onchange="cartPage.updateDelivery('same-day', 19.99)">
                            <div class="delivery-info">
                                <div class="delivery-name" data-i18n="cart.same_day_delivery">Same Day Delivery</div>
                                <div class="delivery-desc" data-i18n="cart.same_day_desc">Order before 2 PM</div>
                            </div>
                            <div class="delivery-price">${utils.formatPrice(19.99)}</div>
                        </label>
                    </div>
                    
                    <div class="summary-row">
                        <span class="summary-label" data-i18n="cart.delivery">Delivery</span>
                        <span class="summary-value">${this.deliveryFee === 0 ? t('cart.free') : utils.formatPrice(this.deliveryFee)}</span>
                    </div>
                    
                    <div class="summary-row">
                        <span class="summary-label" data-i18n="cart.total">Total</span>
                        <span class="summary-value">${utils.formatPrice(total)}</span>
                    </div>
                    
                    <button class="checkout-btn" onclick="cartPage.proceedToCheckout()" data-i18n="cart.proceed_checkout">
                        Proceed to Checkout
                    </button>
                </div>
            </div>
        `;

        // Apply translations to new elements
        if (window.i18n) {
            i18n.applyTranslations();
        }

        // Setup item interactions
        this.setupItemInteractions();
    }

    renderCartItem(item) {
        // Get current language
        const currentLang = localStorage.getItem('florist_language') || 'tr';
        
        // Get translated name
        let displayName = item.name;
        if (currentLang !== 'tr' && item[`name_${currentLang}`]) {
            displayName = item[`name_${currentLang}`];
        }
        
        // Get translated category name
        let displayCategory = item.category || '';
        
        return `
            <div class="cart-item" data-item-id="${item.id}">
                <div class="item-details">
                    <img src="${item.image_url || '/images/placeholder-plant.svg'}" 
                         alt="${displayName}" class="item-image" 
                         onclick="cartPage.viewProduct(${item.id})"
                         onerror="this.style.display=\"none\"">
                    <div class="item-info">
                        <div class="item-name" onclick="cartPage.viewProduct(${item.id})">${displayName}</div>
                        <div class="item-category">${displayCategory}</div>
                    </div>
                </div>
                
                <div class="item-price">${utils.formatPrice(item.price)}</div>
                
                <div class="item-quantity">
                    <button class="qty-btn qty-minus" data-item-id="${item.id}" 
                            ${item.quantity <= 1 ? 'disabled' : ''}>−</button>
                    <input type="number" class="qty-input" value="${item.quantity}" 
                           min="1" max="${item.stock_quantity || 99}"
                           data-item-id="${item.id}">
                    <button class="qty-btn qty-plus" data-item-id="${item.id}" 
                            ${item.quantity >= (item.stock_quantity || 99) ? 'disabled' : ''}>+</button>
                </div>
                
                <div class="item-total">${utils.formatPrice(item.price * item.quantity)}</div>
                
                <button class="remove-btn" onclick="cartPage.removeItem(${item.id})" 
                        title="${t('cart.remove')}">&times;</button>
            </div>
        `;
    }

    setupItemInteractions() {
        // Add hover effects to cart items
        const cartItems = document.querySelectorAll('.cart-item');
        cartItems.forEach(item => {
            item.addEventListener('mouseenter', () => {
                this.createHoverParticles(item);
            });
        });
        
        // Add click handlers for quantity buttons
        document.querySelectorAll('.qty-minus').forEach(btn => {
            btn.addEventListener('click', () => {
                const itemId = parseInt(btn.dataset.itemId);
                const item = this.cartItems.find(i => i.id === itemId);
                if (item && item.quantity > 1) {
                    this.updateQuantity(itemId, item.quantity - 1);
                }
            });
        });
        
        document.querySelectorAll('.qty-plus').forEach(btn => {
            btn.addEventListener('click', () => {
                const itemId = parseInt(btn.dataset.itemId);
                const item = this.cartItems.find(i => i.id === itemId);
                if (item && item.quantity < (item.stock_quantity || 99)) {
                    this.updateQuantity(itemId, item.quantity + 1);
                }
            });
        });
        
        // Add change handler for quantity input
        document.querySelectorAll('.qty-input').forEach(input => {
            input.addEventListener('change', () => {
                const itemId = parseInt(input.dataset.itemId);
                const quantity = parseInt(input.value);
                if (!isNaN(quantity) && quantity > 0) {
                    this.updateQuantity(itemId, quantity);
                }
            });
        });
    }

    createHoverParticles(element) {
        const particleCount = 3;
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'hover-particle';
            particle.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: rgba(45, 90, 39, 0.6);
                border-radius: 50%;
                pointer-events: none;
                z-index: 10;
                animation: particleFloat 1s ease-out forwards;
                top: ${Math.random() * 100}%;
                left: ${Math.random() * 100}%;
            `;
            
            element.style.position = 'relative';
            element.appendChild(particle);
            
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 1000);
        }
    }

    updateQuantity(itemId, newQuantity) {
        if (newQuantity < 1) return;

        const item = this.cartItems.find(item => item.id === itemId);
        if (!item) return;

        if (newQuantity > (item.stock_quantity || 99)) {
            this.showMessage(t('cart.stock_limit'), 'warning');
            return;
        }

        // Update quantity in local array
        item.quantity = newQuantity;
        
        // Update only the affected item's total and summary
        const cartItem = document.querySelector(`[data-item-id="${itemId}"]`);
        if (cartItem) {
            // Update quantity input field
            const qtyInput = cartItem.querySelector('.qty-input');
            if (qtyInput) {
                qtyInput.value = newQuantity;
            }
            
            // Update minus button disabled state
            const minusBtn = cartItem.querySelector('.qty-btn:first-of-type');
            if (minusBtn) {
                minusBtn.disabled = newQuantity <= 1;
            }
            
            // Update plus button disabled state
            const plusBtn = cartItem.querySelector('.qty-btn:last-of-type');
            if (plusBtn) {
                plusBtn.disabled = newQuantity >= (item.stock_quantity || 99);
            }
            
            // Update item total
            const itemTotal = cartItem.querySelector('.item-total');
            if (itemTotal) {
                itemTotal.textContent = utils.formatPrice(item.price * newQuantity);
            }
            
            // Remove visual feedback animation to prevent flickering
            // cartItem.classList.add('quantity-updated');
            // setTimeout(() => {
            //     cartItem.classList.remove('quantity-updated');
            // }, 800);
        }

        // Update cart in storage without triggering re-render
        // Temporarily override the cart's dispatchCartUpdate method
        const originalDispatch = cart.dispatchCartUpdate;
        cart.dispatchCartUpdate = function() {
            window.dispatchEvent(new CustomEvent('cartUpdated', {
                detail: {
                    cart: this.cart,
                    total: this.getCartTotal(),
                    itemCount: this.getCartItemCount(),
                    source: 'cartPage'  // Mark this update as coming from cart page
                }
            }));
        };
        
        cart.updateQuantity(itemId, newQuantity);
        
        // Restore original dispatch method
        cart.dispatchCartUpdate = originalDispatch;
        
        // Update summary and item count without full re-render
        this.updateSummary();
        this.updateItemCount();
        this.updateCartDisplay();
        
        // Don't show message for quantity updates as it's too frequent
        // this.showMessage(t('cart.quantity_updated'), 'success');
    }


    removeItem(itemId) {
        const item = this.cartItems.find(item => item.id === itemId);
        if (!item) return;

        // Add removal animation
        const cartItem = document.querySelector(`[data-item-id="${itemId}"]`);
        if (cartItem) {
            cartItem.classList.add('removing');
            
            setTimeout(() => {
                cart.removeFromCart(itemId);
                this.showMessage(t('cart.item_removed', { name: item.name }), 'success');
            }, 250);
        } else {
            cart.removeFromCart(itemId);
            this.showMessage(t('cart.item_removed', { name: item.name }), 'success');
        }
    }

    updateDelivery(type, fee) {
        this.selectedDelivery = type;
        this.deliveryFee = fee;
        
        // Update summary without full re-render
        this.updateSummary();
        // Don't show message for delivery updates
        // this.showMessage(t('cart.delivery_updated'), 'success');
    }

    updateSummary() {
        const subtotal = this.calculateSubtotal();
        const total = subtotal + this.deliveryFee;

        // Update subtotal
        const subtotalElements = document.querySelectorAll('.summary-row .summary-value');
        if (subtotalElements.length >= 1) {
            subtotalElements[0].textContent = utils.formatPrice(subtotal);
        }

        // Update delivery fee
        if (subtotalElements.length >= 2) {
            subtotalElements[1].textContent = this.deliveryFee === 0 ? t('cart.free') : utils.formatPrice(this.deliveryFee);
        }

        // Update total
        if (subtotalElements.length >= 3) {
            subtotalElements[2].textContent = utils.formatPrice(total);
        }
    }

    calculateSubtotal() {
        return this.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    updateItemCount() {
        const itemCount = document.getElementById('itemCount');
        if (itemCount) {
            const count = this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
            itemCount.textContent = count;
        }
    }

    updateCartDisplay() {
        // Update header cart count
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
            const count = cart.getCartItemCount();
            cartCount.textContent = count;
            cartCount.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    proceedToCheckout() {
        if (this.cartItems.length === 0) {
            this.showMessage(t('cart.empty_checkout'), 'warning');
            return;
        }

        // Store delivery info for checkout
        localStorage.setItem('checkout_delivery', JSON.stringify({
            type: this.selectedDelivery,
            fee: this.deliveryFee
        }));

        // Navigate to checkout
        window.location.href = '/checkout.html';
    }

    viewProduct(productId) {
        window.location.href = `/product.html?id=${productId}`;
    }

    async loadRecommendedProducts() {
        try {
            // First, let's try to get categories from cart items' IDs if categories are missing
            const cartItemIds = this.cartItems.map(item => item.id);
            
            // Load all plants to get full data including categories
            console.log('Loading all plants to get categories...');
            const response = await api.getAllPlants();
            const allPlants = response.plants || [];
            console.log('All plants loaded:', allPlants.length);
            
            // Update cart items with missing category data
            this.cartItems = this.cartItems.map(cartItem => {
                if (!cartItem.category) {
                    const fullPlant = allPlants.find(p => p.id === cartItem.id);
                    if (fullPlant) {
                        return { ...cartItem, category: fullPlant.category };
                    }
                }
                return cartItem;
            });
            
            // Get categories of items in cart (filter out undefined)
            const cartCategories = [...new Set(this.cartItems.map(item => item.category).filter(cat => cat))];
            
            console.log('Cart categories:', cartCategories);
            console.log('Cart items:', this.cartItems);
            console.log('Cart item IDs:', cartItemIds);
            
            if (cartCategories.length === 0) {
                // If no categories found, show any available plants not in cart
                console.log('No categories found, showing random recommendations');
                let recommendations = allPlants.filter(plant => 
                    !cartItemIds.includes(plant.id) &&
                    plant.stock_quantity > 0
                );
                
                // Sort by stock quantity and take top 4
                recommendations.sort((a, b) => b.stock_quantity - a.stock_quantity);
                recommendations = recommendations.slice(0, 4);
                
                const container = document.getElementById('recommendedProducts');
                if (container) {
                    if (recommendations.length > 0) {
                        const categoriesResponse = await api.getAllCategories();
                        const categories = categoriesResponse?.categories || [];
                        const productsHTML = recommendations.map(plant => utils.createPlantCard(plant, categories)).join('');
                        container.innerHTML = productsHTML;
                        console.log('Rendered random recommendations');
                        
                        // Apply translations to new elements
                        if (window.i18n) {
                            i18n.applyTranslations();
                        }
                    } else {
                        container.innerHTML = '<p style="text-align: center; color: #999;">No recommendations available</p>';
                    }
                }
                return;
            }
            
            // Filter plants: same category, not already in cart, in stock
            let recommendations = allPlants.filter(plant => 
                cartCategories.includes(plant.category) && 
                !cartItemIds.includes(plant.id) &&
                plant.stock_quantity > 0
            );
            
            console.log('Filtered recommendations:', recommendations.length);
            
            // Sort by stock quantity in descending order
            recommendations.sort((a, b) => b.stock_quantity - a.stock_quantity);
            
            // Take top 4 recommendations
            recommendations = recommendations.slice(0, 4);
            
            console.log('Final recommendations:', recommendations);
            
            const container = document.getElementById('recommendedProducts');
            if (container) {
                console.log('Container found:', container);
                if (recommendations.length > 0) {
                    // Load categories for proper translation
                    const categoriesResponse = await api.getAllCategories();
                    const categories = categoriesResponse?.categories || [];
                    
                    const productsHTML = recommendations.map(plant => 
                        utils.createPlantCard(plant, categories)
                    ).join('');
                    container.innerHTML = productsHTML;
                    
                    // Apply translations to new elements
                    if (window.i18n) {
                        i18n.applyTranslations();
                    }
                } else {
                    // If no recommendations from same category, show any other available plants
                    let otherRecommendations = allPlants.filter(plant => 
                        !cartItemIds.includes(plant.id) &&
                        plant.stock_quantity > 0
                    );
                    
                    // Sort by stock quantity and take top 4
                    otherRecommendations.sort((a, b) => b.stock_quantity - a.stock_quantity);
                    otherRecommendations = otherRecommendations.slice(0, 4);
                    
                    if (otherRecommendations.length > 0) {
                        const categoriesResponse = await api.getAllCategories();
                        const categories = categoriesResponse?.categories || [];
                        const productsHTML = otherRecommendations.map(plant => utils.createPlantCard(plant, categories)).join('');
                        container.innerHTML = productsHTML;
                        
                        // Apply translations to new elements
                        if (window.i18n) {
                            i18n.applyTranslations();
                        }
                    } else {
                        container.innerHTML = '<p style="text-align: center; color: #999;">No recommendations available</p>';
                    }
                }
            }
        } catch (error) {
            console.error('Error loading recommended products:', error);
        }
    }

    handleNewsletterSignup() {
        const input = document.querySelector('.newsletter-input');
        const button = document.querySelector('.newsletter-btn');
        
        if (!input || !input.value.trim()) return;
        
        const originalText = button.textContent;
        button.textContent = t('common.loading') + '...';
        button.disabled = true;
        
        setTimeout(() => {
            button.textContent = '✓ ' + t('shop.subscribed');
            input.value = '';
            
            setTimeout(() => {
                button.textContent = originalText;
                button.disabled = false;
            }, 3000);
        }, 1000);
    }

    showMessage(message, type = 'info') {
        const messageEl = document.createElement('div');
        messageEl.className = `cart-message ${type}`;
        messageEl.textContent = message;
        
        const colors = {
            success: '#27ae60',
            warning: '#f39c12',
            error: '#e74c3c',
            info: '#3498db'
        };
        
        messageEl.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: messageSlide 0.3s ease, messageFade 0.3s ease 2.5s forwards;
            transform: translateX(100%);
            max-width: 300px;
        `;
        
        // Add animation styles if not already present
        if (!document.getElementById('message-styles')) {
            const style = document.createElement('style');
            style.id = 'message-styles';
            style.textContent = `
                @keyframes messageSlide {
                    to { transform: translateX(0); }
                }
                @keyframes messageFade {
                    to { opacity: 0; transform: translateX(100%); }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 3000);
    }

    showLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'flex';
        }
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.add('fade-out');
            setTimeout(() => {
                loading.style.display = 'none';
            }, 500);
        }
    }
}

// Enhanced Parallax Controller for Cart Page
class CartParallax {
    constructor() {
        this.scrollY = 0;
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        let ticking = false;

        window.addEventListener('scroll', () => {
            this.scrollY = window.scrollY;
            
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.updateParallax();
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    updateParallax() {
        this.updateBreadcrumbParallax();
        this.updateFloatingElements();
        this.updateCartElements();
    }

    updateBreadcrumbParallax() {
        const breadcrumbBg = document.querySelector('.breadcrumb-parallax-bg');
        if (breadcrumbBg) {
            const yPos = -(this.scrollY * 0.3);
            breadcrumbBg.style.transform = `translate3d(0, ${yPos}px, 0)`;
        }
    }

    updateFloatingElements() {
        const floatingElements = document.querySelectorAll('.floating-element');
        floatingElements.forEach((element, index) => {
            const speed = 0.1 + (index * 0.05);
            const yPos = -(this.scrollY * speed);
            const rotation = this.scrollY * speed * 0.2;
            element.style.transform = `translate3d(0, ${yPos}px, 0) rotate(${rotation}deg)`;
        });
    }

    updateCartElements() {
        const cartItems = document.querySelectorAll('.cart-item');
        cartItems.forEach((item, index) => {
            const rect = item.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                const parallaxOffset = (window.innerHeight - rect.top) * 0.02;
                item.style.transform = `translateY(${parallaxOffset}px)`;
            }
        });

        const cartSummary = document.querySelector('.cart-summary');
        if (cartSummary) {
            const rect = cartSummary.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                const parallaxOffset = (window.innerHeight - rect.top) * 0.03;
                cartSummary.style.transform = `translateY(${parallaxOffset}px)`;
            }
        }
    }
}

// Global variable for cart page
let cartPage;

// Initialize cart page
document.addEventListener('DOMContentLoaded', () => {
    cartPage = new CartPage();
    
    // Setup intersection observer for animations
    utils.observeElements();
    
    // Performance optimization for mobile
    if (window.innerWidth <= 768) {
        document.body.classList.add('mobile-optimized');
    }
});

// Handle window resize
window.addEventListener('resize', utils.debounce(() => {
    if (cartPage && cartPage.parallaxController) {
        cartPage.parallaxController.updateParallax();
    }
}, 250));

// Export for global use
window.cartPage = cartPage;