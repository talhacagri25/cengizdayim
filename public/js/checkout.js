// Checkout page JavaScript with form validation and multilingual support

class CheckoutPage {
    constructor() {
        this.cartItems = [];
        this.deliveryInfo = null;
        this.formData = {};
        this.validators = {};
        this.parallaxController = new CheckoutParallax();
        this.init();
    }

    async init() {
        this.showLoading();
        
        try {
            this.loadCartItems();
            this.loadDeliveryInfo();
            
            if (this.cartItems.length === 0) {
                this.renderEmptyCheckout();
            } else {
                this.renderCheckout();
                this.setupFormValidation();
            }
            
            this.setupEventListeners();
            this.setupParallax();
            this.hideLoading();
        } catch (error) {
            console.error('Error initializing checkout page:', error);
            this.hideLoading();
        }
    }

    loadCartItems() {
        this.cartItems = cart.cart || [];
        this.updateCartDisplay();
    }

    loadDeliveryInfo() {
        try {
            const stored = localStorage.getItem('checkout_delivery');
            this.deliveryInfo = stored ? JSON.parse(stored) : { type: 'free', fee: 0 };
        } catch (error) {
            console.error('Error loading delivery info:', error);
            this.deliveryInfo = { type: 'free', fee: 0 };
        }
    }

    setupEventListeners() {
        // Language change handler
        window.addEventListener('languageChanged', () => {
            if (this.cartItems.length > 0) {
                this.renderCheckout();
                this.setupFormValidation();
            }
        });

        // Form submission
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'checkoutForm') {
                e.preventDefault();
                this.handleFormSubmit();
            }
        });

        // Real-time validation
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('form-input') || 
                e.target.classList.contains('form-select') || 
                e.target.classList.contains('form-textarea')) {
                this.validateField(e.target);
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target.name === 'deliveryType') {
                this.updateDeliveryType(e.target.value);
            }
        });
    }

    setupParallax() {
        window.addEventListener('scroll', utils.debounce(() => {
            this.parallaxController.updateParallax();
        }, 16));
    }

    renderEmptyCheckout() {
        const checkoutContent = document.getElementById('checkoutContent');
        if (!checkoutContent) return;

        checkoutContent.innerHTML = `
            <div class="checkout-empty">
                <div class="empty-icon">🛒</div>
                <h2 class="empty-title" data-i18n="cart.empty">Your cart is empty</h2>
                <p class="empty-desc" data-i18n="checkout.empty_desc">Add some plants to your cart before proceeding to checkout.</p>
                <a href="/shop.html" class="btn btn-primary" data-i18n="cart.continue_shopping">Continue Shopping</a>
            </div>
        `;

        // Apply translations
        if (window.i18n) {
            i18n.applyTranslations();
        }
    }

    renderCheckout() {
        const checkoutContent = document.getElementById('checkoutContent');
        if (!checkoutContent) return;

        const subtotal = this.calculateSubtotal();
        const total = subtotal + (this.deliveryInfo?.fee || 0);

        checkoutContent.innerHTML = `
            <div class="checkout-filled">
                <div class="checkout-form">
                    <form id="checkoutForm" novalidate>
                        <!-- Customer Information -->
                        <div class="form-section">
                            <h3 class="section-title">
                                <span class="section-icon">👤</span>
                                <span data-i18n="checkout.customer_info">Customer Information</span>
                            </h3>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="fullName" class="form-label" data-i18n="checkout.full_name">Full Name</label>
                                    <input type="text" id="fullName" name="fullName" class="form-input" required>
                                    <div class="form-error"></div>
                                    <div class="form-success"></div>
                                </div>
                                <div class="form-group">
                                    <label for="email" class="form-label" data-i18n="checkout.email">Email Address</label>
                                    <input type="email" id="email" name="email" class="form-input" required>
                                    <div class="form-error"></div>
                                    <div class="form-success"></div>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="phone" class="form-label" data-i18n="checkout.phone">Phone Number</label>
                                    <input type="tel" id="phone" name="phone" class="form-input" required>
                                    <div class="form-error"></div>
                                    <div class="form-success"></div>
                                </div>
                                <div class="form-group">
                                    <label for="language" class="form-label" data-i18n="checkout.preferred_language">Preferred Language</label>
                                    <select id="language" name="language" class="form-select">
                                        <option value="en" ${i18n.currentLanguage === 'en' ? 'selected' : ''}>English</option>
                                        <option value="tr" ${i18n.currentLanguage === 'tr' ? 'selected' : ''}>Türkçe</option>
                                        <option value="az" ${i18n.currentLanguage === 'az' ? 'selected' : ''}>Azərbaycanca</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- Delivery Information -->
                        <div class="form-section">
                            <h3 class="section-title">
                                <span class="section-icon">🚚</span>
                                <span data-i18n="checkout.delivery_info">Delivery Information</span>
                            </h3>
                            
                            <div class="delivery-options">
                                <label class="delivery-option ${this.deliveryInfo?.type === 'pickup' ? 'selected' : ''}">
                                    <input type="radio" name="deliveryType" value="pickup" ${this.deliveryInfo?.type === 'pickup' ? 'checked' : ''}>
                                    <div class="delivery-info">
                                        <div class="delivery-name" data-i18n="checkout.store_pickup">Store Pickup</div>
                                        <div class="delivery-desc" data-i18n="checkout.pickup_desc">Pick up from our store - Ready in 2 hours</div>
                                    </div>
                                    <div class="delivery-price" data-i18n="cart.free">Free</div>
                                </label>
                                
                                <label class="delivery-option ${this.deliveryInfo?.type === 'free' ? 'selected' : ''}">
                                    <input type="radio" name="deliveryType" value="free" ${this.deliveryInfo?.type === 'free' ? 'checked' : ''}>
                                    <div class="delivery-info">
                                        <div class="delivery-name" data-i18n="cart.free_delivery">Free Delivery</div>
                                        <div class="delivery-desc" data-i18n="cart.free_delivery_desc">5-7 business days</div>
                                    </div>
                                    <div class="delivery-price" data-i18n="cart.free">Free</div>
                                </label>
                                
                                <label class="delivery-option ${this.deliveryInfo?.type === 'express' ? 'selected' : ''}">
                                    <input type="radio" name="deliveryType" value="express" ${this.deliveryInfo?.type === 'express' ? 'checked' : ''}>
                                    <div class="delivery-info">
                                        <div class="delivery-name" data-i18n="cart.express_delivery">Express Delivery</div>
                                        <div class="delivery-desc" data-i18n="cart.express_delivery_desc">2-3 business days</div>
                                    </div>
                                    <div class="delivery-price">${utils.formatPrice(9.99)}</div>
                                </label>
                                
                                <label class="delivery-option ${this.deliveryInfo?.type === 'same-day' ? 'selected' : ''}">
                                    <input type="radio" name="deliveryType" value="same-day" ${this.deliveryInfo?.type === 'same-day' ? 'checked' : ''}>
                                    <div class="delivery-info">
                                        <div class="delivery-name" data-i18n="cart.same_day_delivery">Same Day Delivery</div>
                                        <div class="delivery-desc" data-i18n="cart.same_day_desc">Order before 2 PM</div>
                                    </div>
                                    <div class="delivery-price">${utils.formatPrice(19.99)}</div>
                                </label>
                            </div>
                            
                            <div class="delivery-address-section" id="deliveryAddressSection" 
                                 style="display: ${this.deliveryInfo?.type !== 'pickup' ? 'block' : 'none'}; margin-top: 1.5rem;">
                                <div class="form-group full-width">
                                    <label for="address" class="form-label" data-i18n="checkout.delivery_address">Delivery Address</label>
                                    <textarea id="address" name="address" class="form-textarea" rows="3" 
                                             ${this.deliveryInfo?.type !== 'pickup' ? 'required' : ''}></textarea>
                                    <div class="form-error"></div>
                                    <div class="form-success"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Additional Information -->
                        <div class="form-section">
                            <h3 class="section-title">
                                <span class="section-icon">📝</span>
                                <span data-i18n="checkout.additional_info">Additional Information</span>
                            </h3>
                            <div class="form-group full-width">
                                <label for="notes" class="form-label" data-i18n="checkout.order_notes">Order Notes (Optional)</label>
                                <textarea id="notes" name="notes" class="form-textarea" rows="3" 
                                         data-i18n="checkout.notes_placeholder" placeholder="Special instructions for delivery, plant care requests, etc."></textarea>
                            </div>
                        </div>

                        <!-- Submit Button -->
                        <button type="submit" class="place-order-btn" id="placeOrderBtn">
                            <span data-i18n="checkout.place_order">Place Order</span>
                        </button>
                    </form>
                </div>

                <div class="order-summary">
                    <h3 class="summary-title" data-i18n="checkout.order_summary">Order Summary</h3>
                    
                    <div class="order-items">
                        ${this.cartItems.map(item => this.renderOrderItem(item)).join('')}
                    </div>
                    
                    <div class="summary-totals">
                        <div class="summary-row">
                            <span class="summary-label" data-i18n="cart.subtotal">Subtotal</span>
                            <span class="summary-value">${utils.formatPrice(subtotal)}</span>
                        </div>
                        <div class="summary-row">
                            <span class="summary-label" data-i18n="cart.delivery">Delivery</span>
                            <span class="summary-value" id="deliveryCost">
                                ${this.deliveryInfo?.fee === 0 ? t('cart.free') : utils.formatPrice(this.deliveryInfo?.fee || 0)}
                            </span>
                        </div>
                        <div class="summary-row">
                            <span class="summary-label" data-i18n="cart.total">Total</span>
                            <span class="summary-value" id="orderTotal">${utils.formatPrice(total)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Apply translations
        if (window.i18n) {
            i18n.applyTranslations();
        }

        // Setup delivery option interactions
        this.setupDeliveryOptions();
    }

    renderOrderItem(item) {
        // Get current language
        const currentLang = localStorage.getItem('florist_language') || 'tr';
        
        // Get translated name
        let displayName = item.name;
        if (currentLang !== 'tr' && item[`name_${currentLang}`]) {
            displayName = item[`name_${currentLang}`];
        }
        
        return `
            <div class="order-item">
                <img src="${item.image_url || '/images/placeholder-plant.svg'}" 
                     alt="${displayName}" class="item-image"
                     onerror="this.style.display=\"none\"">
                <div class="item-details">
                    <div class="item-name">${displayName}</div>
                    <div class="item-quantity">${t('cart.quantity')}: ${item.quantity}</div>
                </div>
                <div class="item-price">${utils.formatPrice(item.price * item.quantity)}</div>
            </div>
        `;
    }

    setupDeliveryOptions() {
        const deliveryOptions = document.querySelectorAll('input[name="deliveryType"]');
        deliveryOptions.forEach(option => {
            option.addEventListener('change', () => {
                // Update visual selection
                document.querySelectorAll('.delivery-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                option.closest('.delivery-option').classList.add('selected');
            });
        });
    }

    updateDeliveryType(type) {
        const fees = {
            'pickup': 0,
            'free': 0,
            'express': 9.99,
            'same-day': 19.99
        };

        this.deliveryInfo = {
            type: type,
            fee: fees[type] || 0
        };

        // Update delivery cost display
        const deliveryCostEl = document.getElementById('deliveryCost');
        const orderTotalEl = document.getElementById('orderTotal');
        
        if (deliveryCostEl && orderTotalEl) {
            deliveryCostEl.textContent = this.deliveryInfo.fee === 0 ? 
                t('cart.free') : utils.formatPrice(this.deliveryInfo.fee);
            
            const subtotal = this.calculateSubtotal();
            const total = subtotal + this.deliveryInfo.fee;
            orderTotalEl.textContent = utils.formatPrice(total);
        }

        // Show/hide address section
        const addressSection = document.getElementById('deliveryAddressSection');
        const addressField = document.getElementById('address');
        
        if (addressSection && addressField) {
            if (type === 'pickup') {
                addressSection.style.display = 'none';
                addressField.required = false;
                addressField.value = '';
                this.clearFieldValidation(addressField);
            } else {
                addressSection.style.display = 'block';
                addressField.required = true;
            }
        }

        // Store delivery info
        localStorage.setItem('checkout_delivery', JSON.stringify(this.deliveryInfo));
    }

    setupFormValidation() {
        this.validators = {
            fullName: {
                required: true,
                minLength: 2,
                pattern: /^[a-zA-ZÀ-ÿĞğIıİiÖöÜüÇçŞşƏəÇçĞğÜüÖöŞş\s]+$/,
                messages: {
                    required: t('checkout.name_required'),
                    minLength: t('checkout.name_min_length'),
                    pattern: t('checkout.name_invalid')
                }
            },
            email: {
                required: true,
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                messages: {
                    required: t('checkout.email_required'),
                    pattern: t('checkout.email_invalid')
                }
            },
            phone: {
                required: true,
                pattern: /^[\+]?[\d\s\-\(\)]+$/,
                minLength: 10,
                messages: {
                    required: t('checkout.phone_required'),
                    pattern: t('checkout.phone_invalid'),
                    minLength: t('checkout.phone_min_length')
                }
            },
            address: {
                required: true,
                minLength: 10,
                messages: {
                    required: t('checkout.address_required'),
                    minLength: t('checkout.address_min_length')
                }
            }
        };
    }

    validateField(field) {
        const fieldName = field.name;
        const value = field.value.trim();
        const validator = this.validators[fieldName];
        
        if (!validator) return true;

        let isValid = true;
        let errorMessage = '';

        // Skip validation if field is not required and empty
        if (!validator.required && !value) {
            this.showFieldSuccess(field);
            return true;
        }

        // Required validation
        if (validator.required && !value) {
            isValid = false;
            errorMessage = validator.messages.required;
        }
        // Pattern validation
        else if (validator.pattern && value && !validator.pattern.test(value)) {
            isValid = false;
            errorMessage = validator.messages.pattern;
        }
        // Min length validation
        else if (validator.minLength && value && value.length < validator.minLength) {
            isValid = false;
            errorMessage = validator.messages.minLength;
        }

        if (isValid) {
            this.showFieldSuccess(field);
        } else {
            this.showFieldError(field, errorMessage);
        }

        return isValid;
    }

    showFieldError(field, message) {
        field.classList.remove('success');
        field.classList.add('error', 'shake');
        
        const errorEl = field.parentElement.querySelector('.form-error');
        const successEl = field.parentElement.querySelector('.form-success');
        
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.add('show');
        }
        
        if (successEl) {
            successEl.classList.remove('show');
        }

        // Remove shake animation
        setTimeout(() => {
            field.classList.remove('shake');
        }, 500);
    }

    showFieldSuccess(field) {
        field.classList.remove('error');
        field.classList.add('success');
        
        const errorEl = field.parentElement.querySelector('.form-error');
        const successEl = field.parentElement.querySelector('.form-success');
        
        if (errorEl) {
            errorEl.classList.remove('show');
        }
        
        if (successEl && field.value.trim()) {
            successEl.textContent = '✓';
            successEl.classList.add('show');
        }
    }

    clearFieldValidation(field) {
        field.classList.remove('error', 'success');
        
        const errorEl = field.parentElement.querySelector('.form-error');
        const successEl = field.parentElement.querySelector('.form-success');
        
        if (errorEl) {
            errorEl.classList.remove('show');
        }
        
        if (successEl) {
            successEl.classList.remove('show');
        }
    }

    validateForm() {
        const form = document.getElementById('checkoutForm');
        const inputs = form.querySelectorAll('.form-input, .form-select, .form-textarea');
        let isValid = true;

        inputs.forEach(input => {
            if (input.hasAttribute('required') || this.validators[input.name]) {
                const fieldValid = this.validateField(input);
                if (!fieldValid) {
                    isValid = false;
                }
            }
        });

        return isValid;
    }

    async handleFormSubmit() {
        const isValid = this.validateForm();
        
        if (!isValid) {
            this.showMessage(t('checkout.form_invalid'), 'error');
            return;
        }

        const formData = new FormData(document.getElementById('checkoutForm'));
        const orderData = {
            customer_name: formData.get('fullName'),
            customer_email: formData.get('email'),
            customer_phone: formData.get('phone'),
            delivery_type: formData.get('deliveryType'),
            delivery_address: formData.get('address') || null,
            order_items: this.cartItems,
            subtotal: this.calculateSubtotal(),
            delivery_fee: this.deliveryInfo?.fee || 0,
            total: this.calculateSubtotal() + (this.deliveryInfo?.fee || 0),
            notes: formData.get('notes') || null,
            language: formData.get('language') || 'en'
        };

        await this.placeOrder(orderData);
    }

    async placeOrder(orderData) {
        const placeOrderBtn = document.getElementById('placeOrderBtn');
        const originalText = placeOrderBtn.innerHTML;
        
        // Show loading state
        placeOrderBtn.classList.add('processing');
        placeOrderBtn.innerHTML = t('checkout.processing');
        placeOrderBtn.disabled = true;

        try {
            const response = await api.createOrder(orderData);
            
            if (response.success) {
                // Clear cart
                cart.clearCart();
                
                // Show success modal
                this.showSuccessModal(response.order_number);
            } else {
                throw new Error(response.message || 'Order failed');
            }
        } catch (error) {
            console.error('Error placing order:', error);
            this.showMessage(t('checkout.order_failed'), 'error');
            
            // Reset button
            placeOrderBtn.classList.remove('processing');
            placeOrderBtn.innerHTML = originalText;
            placeOrderBtn.disabled = false;
        }
    }

    showSuccessModal(orderNumber) {
        const modal = document.getElementById('successModal');
        const message = document.getElementById('successMessage');
        
        if (modal && message) {
            message.innerHTML = `
                ${t('checkout.order_number')}: <strong>${orderNumber}</strong><br>
                ${t('checkout.confirmation_email')}
            `;
            
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Update progress to final step
            this.updateProgressStep(3);
        }
    }

    updateProgressStep(step) {
        const steps = document.querySelectorAll('.progress-step');
        const lines = document.querySelectorAll('.progress-line');
        
        steps.forEach((stepEl, index) => {
            if (index + 1 < step) {
                stepEl.classList.add('completed');
                stepEl.classList.remove('active');
            } else if (index + 1 === step) {
                stepEl.classList.add('active');
                stepEl.classList.remove('completed');
            } else {
                stepEl.classList.remove('active', 'completed');
            }
        });
        
        lines.forEach((line, index) => {
            if (index + 1 < step) {
                line.classList.add('completed');
            } else {
                line.classList.remove('completed');
            }
        });
    }

    goToHome() {
        window.location.href = '/';
    }

    continueShopping() {
        window.location.href = '/shop.html';
    }

    calculateSubtotal() {
        return this.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
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

    showMessage(message, type = 'info') {
        const messageEl = document.createElement('div');
        messageEl.className = `checkout-message ${type}`;
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
            animation: messageSlide 0.3s ease, messageFade 0.3s ease 4s forwards;
            transform: translateX(100%);
            max-width: 350px;
        `;
        
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 4500);
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

// Enhanced Parallax Controller for Checkout Page
class CheckoutParallax {
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
        this.updateProgressParallax();
        this.updateFloatingElements();
        this.updateFormElements();
    }

    updateProgressParallax() {
        const progressBg = document.querySelector('.progress-bg');
        if (progressBg) {
            const yPos = -(this.scrollY * 0.3);
            progressBg.style.transform = `translate3d(0, ${yPos}px, 0)`;
        }
    }

    updateFloatingElements() {
        const floatingElements = document.querySelectorAll('.floating-element');
        floatingElements.forEach((element, index) => {
            const speed = 0.1 + (index * 0.05);
            const yPos = -(this.scrollY * speed);
            const rotation = this.scrollY * speed * 0.1;
            element.style.transform = `translate3d(0, ${yPos}px, 0) rotate(${rotation}deg)`;
        });
    }

    updateFormElements() {
        const formSections = document.querySelectorAll('.form-section');
        formSections.forEach((section, index) => {
            const rect = section.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                const parallaxOffset = (window.innerHeight - rect.top) * 0.02;
                section.style.transform = `translateY(${parallaxOffset}px)`;
            }
        });

        const orderSummary = document.querySelector('.order-summary');
        if (orderSummary) {
            const rect = orderSummary.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                const parallaxOffset = (window.innerHeight - rect.top) * 0.03;
                orderSummary.style.transform = `translateY(${parallaxOffset}px)`;
            }
        }
    }
}

// Global variable for checkout page
let checkoutPage;

// Initialize checkout page
document.addEventListener('DOMContentLoaded', () => {
    checkoutPage = new CheckoutPage();
    
    // Setup intersection observer for animations
    utils.observeElements();
    
    // Performance optimization for mobile
    if (window.innerWidth <= 768) {
        document.body.classList.add('mobile-optimized');
    }
});

// Handle window resize
window.addEventListener('resize', utils.debounce(() => {
    if (checkoutPage && checkoutPage.parallaxController) {
        checkoutPage.parallaxController.updateParallax();
    }
}, 250));

// Export for global use
window.checkoutPage = checkoutPage;