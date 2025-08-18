// Product page JavaScript with enhanced parallax effects and multilingual support

class ProductPage {
    constructor() {
        this.productId = this.getProductIdFromURL();
        this.product = null;
        this.currentImageIndex = 0;
        this.images = [];
        this.quantity = 1;
        this.parallaxController = new ProductParallax();
        this.init();
    }

    getProductIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    async init() {
        if (!this.productId) {
            this.redirectToShop();
            return;
        }

        this.showLoading();
        
        try {
            await this.loadProduct();
            this.setupEventListeners();
            this.setupParallax();
            this.hideLoading();
        } catch (error) {
            console.error('Error initializing product page:', error);
            this.showError();
            this.hideLoading();
        }
    }

    async loadProduct() {
        try {
            const response = await api.getPlant(this.productId);
            
            if (!response.success || !response.plant) {
                throw new Error('Product not found');
            }

            this.product = response.plant;
            
            // Load categories to get translations for the category name
            try {
                const categoriesResponse = await api.loadCategories();
                this.categories = categoriesResponse || [];
            } catch (error) {
                console.warn('Could not load categories for translations');
                this.categories = [];
            }
            
            this.prepareImages();
            this.renderProduct();
            this.renderReviews();
            await this.loadRelatedProducts();
            this.updateBreadcrumb();
            this.updatePageTitle();
        } catch (error) {
            throw new Error('Failed to load product details');
        }
    }

    prepareImages() {
        this.images = [this.product.image_url];
        
        if (this.product.gallery_images) {
            try {
                const galleryImages = JSON.parse(this.product.gallery_images);
                if (Array.isArray(galleryImages)) {
                    this.images.push(...galleryImages);
                }
            } catch (e) {
                console.warn('Failed to parse gallery images');
            }
        }

        // Remove duplicates and filter out empty/null images
        this.images = [...new Set(this.images)].filter(img => img && img.trim());
        
        // Add placeholder if no images
        if (this.images.length === 0) {
            this.images = ['/images/placeholder-plant.svg'];
        }
    }

    renderProduct() {
        const productContent = document.getElementById('productContent');
        if (!productContent) return;

        const hasDiscount = this.product.sale_price && this.product.sale_price < this.product.price;
        const displayPrice = this.product.sale_price || this.product.price;
        const isInStock = this.product.stock_quantity > 0;
        
        // Get current language and use translated fields
        const currentLang = localStorage.getItem('florist_language') || 'tr';
        let displayName = this.product.name;
        let displayDescription = this.product.description || '';
        let displayCareInstructions = this.product.care_instructions || '';
        let displayCategoryName = this.product.category;
        
        if (currentLang !== 'tr') {
            const langSuffix = currentLang === 'en' ? '_en' : 
                              currentLang === 'az' ? '_az' : 
                              currentLang === 'ru' ? '_ru' : '';
            displayName = this.product[`name${langSuffix}`] || this.product.name;
            displayDescription = this.product[`description${langSuffix}`] || this.product.description || '';
            displayCareInstructions = this.product[`care_instructions${langSuffix}`] || this.product.care_instructions || '';
        }
        
        // Get translated category name if available
        if (this.categories && this.categories.length > 0) {
            const category = this.categories.find(cat => cat.name === this.product.category);
            if (category) {
                if (currentLang !== 'tr') {
                    const langSuffix = currentLang === 'en' ? '_en' : 
                                      currentLang === 'az' ? '_az' : 
                                      currentLang === 'ru' ? '_ru' : '';
                    displayCategoryName = category[`name${langSuffix}`] || category.name;
                }
            }
        }
        
        // Store for later use in care instructions
        this.displayCareInstructions = displayCareInstructions;

        const productHTML = `
            <div class="product-details">
                <div class="product-images">
                    <div class="main-image-container">
                        <img src="${this.images[0]}" alt="${displayName}" 
                             class="main-image" id="mainImage" 
                             onerror="this.style.display=\"none\"">
                        <div class="image-badges">
                            ${this.product.featured ? '<span class="badge featured-badge">⭐ ' + t('product.featured') + '</span>' : ''}
                            ${hasDiscount ? '<span class="badge sale-badge">' + t('product.sale') + '</span>' : ''}
                        </div>
                    </div>
                    ${this.images.length > 1 ? `
                        <div class="image-thumbnails">
                            ${this.images.map((img, index) => `
                                <img src="${img}" alt="${displayName} ${index + 1}" 
                                     class="thumbnail ${index === 0 ? 'active' : ''}" 
                                     data-index="${index}"
                                     onerror="this.style.display=\"none\"">
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                
                <div class="product-info">
                    <h1 class="product-title">${displayName}</h1>
                    ${this.product.scientific_name ? `<p class="product-scientific">${this.product.scientific_name}</p>` : ''}
                    <span class="product-category">${displayCategoryName}</span>
                    
                    <div class="product-price">
                        <span class="current-price ${hasDiscount ? 'sale' : ''}">${utils.formatPrice(displayPrice)}</span>
                        ${hasDiscount ? `<span class="original-price">${utils.formatPrice(this.product.price)}</span>` : ''}
                    </div>
                    
                    <div class="product-stock">
                        <div class="stock-status ${isInStock ? 'in-stock' : 'out-of-stock'}">
                            <span class="stock-indicator ${isInStock ? 'in-stock' : 'out-of-stock'}"></span>
                            ${isInStock ? 
                                `${this.product.stock_quantity} ${t('product.in_stock')}` : 
                                t('product.out_of_stock')
                            }
                        </div>
                    </div>
                    
                    <div class="product-description">
                        ${displayDescription}
                    </div>
                    
                    <div class="product-actions">
                        <div class="quantity-selector">
                            <button class="quantity-btn" id="decreaseQty" ${!isInStock ? 'disabled' : ''}>−</button>
                            <input type="number" class="quantity-input" id="quantityInput" 
                                   value="1" min="1" max="${this.product.stock_quantity}" ${!isInStock ? 'disabled' : ''}>
                            <button class="quantity-btn" id="increaseQty" ${!isInStock ? 'disabled' : ''}>+</button>
                        </div>
                        <button class="add-to-cart-btn" id="addToCartBtn" ${!isInStock ? 'disabled' : ''}>
                            ${isInStock ? t('product.add_to_cart') : t('product.out_of_stock')}
                        </button>
                    </div>
                    
                    ${this.renderCareInfo()}
                </div>
            </div>
        `;

        productContent.innerHTML = productHTML;
        this.setupProductInteractions();
    }

    renderCareInfo() {
        const careItems = [];
        
        if (this.product.light_requirements) {
            careItems.push({
                icon: '☀️',
                label: t('product.light'),
                value: this.product.light_requirements
            });
        }
        
        if (this.product.water_needs) {
            careItems.push({
                icon: '💧',
                label: t('product.water'),
                value: this.product.water_needs
            });
        }
        
        if (this.product.size) {
            careItems.push({
                icon: '📏',
                label: t('product.size'),
                value: this.product.size
            });
        }
        
        if (this.product.growth_rate) {
            careItems.push({
                icon: '📈',
                label: t('product.growth_rate'),
                value: this.product.growth_rate
            });
        }

        if (careItems.length === 0) return '';

        return `
            <div class="care-info">
                <h3 class="care-title">${t('product.care_instructions')}</h3>
                <div class="care-grid">
                    ${careItems.map(item => `
                        <div class="care-item">
                            <span class="care-icon">${item.icon}</span>
                            <div class="care-label">${item.label}</div>
                            <div class="care-value">${item.value}</div>
                        </div>
                    `).join('')}
                </div>
                ${this.displayCareInstructions ? `
                    <div class="care-detailed" style="margin-top: 1rem; padding: 1rem; background: rgba(45,90,39,0.05); border-radius: 8px;">
                        <p style="color: #666; line-height: 1.5; white-space: pre-line;">${this.displayCareInstructions}</p>
                    </div>
                ` : ''}
            </div>
        `;
    }

    setupProductInteractions() {
        // Quantity controls
        const decreaseBtn = document.getElementById('decreaseQty');
        const increaseBtn = document.getElementById('increaseQty');
        const quantityInput = document.getElementById('quantityInput');

        if (decreaseBtn) {
            decreaseBtn.addEventListener('click', () => this.adjustQuantity(-1));
        }

        if (increaseBtn) {
            increaseBtn.addEventListener('click', () => this.adjustQuantity(1));
        }

        if (quantityInput) {
            quantityInput.addEventListener('change', (e) => {
                const value = parseInt(e.target.value);
                if (value >= 1 && value <= this.product.stock_quantity) {
                    this.quantity = value;
                } else {
                    e.target.value = this.quantity;
                }
            });
        }

        // Add to cart
        const addToCartBtn = document.getElementById('addToCartBtn');
        if (addToCartBtn && this.product.stock_quantity > 0) {
            addToCartBtn.addEventListener('click', () => this.addToCart());
        }

        // Image interactions
        this.setupImageInteractions();
    }

    setupImageInteractions() {
        // Main image zoom
        const mainImage = document.getElementById('mainImage');
        if (mainImage) {
            mainImage.addEventListener('click', () => this.openImageModal(this.currentImageIndex));
        }

        // Thumbnail clicks
        const thumbnails = document.querySelectorAll('.thumbnail');
        thumbnails.forEach((thumbnail, index) => {
            thumbnail.addEventListener('click', () => {
                this.switchMainImage(index);
            });
        });

        // Setup image modal
        this.setupImageModal();
    }

    setupImageModal() {
        const modal = document.getElementById('imageModal');
        const backdrop = document.getElementById('modalBackdrop');
        const closeBtn = document.getElementById('modalClose');
        const prevBtn = document.getElementById('modalPrev');
        const nextBtn = document.getElementById('modalNext');

        if (backdrop) {
            backdrop.addEventListener('click', () => this.closeImageModal());
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeImageModal());
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousImage());
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextImage());
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (modal && modal.style.display === 'flex') {
                if (e.key === 'Escape') {
                    this.closeImageModal();
                } else if (e.key === 'ArrowLeft') {
                    this.previousImage();
                } else if (e.key === 'ArrowRight') {
                    this.nextImage();
                }
            }
        });
    }

    switchMainImage(index) {
        if (index < 0 || index >= this.images.length) return;

        this.currentImageIndex = index;
        const mainImage = document.getElementById('mainImage');
        if (mainImage) {
            // Add loading effect
            mainImage.style.opacity = '0.5';
            setTimeout(() => {
                mainImage.src = this.images[index];
                mainImage.style.opacity = '1';
            }, 150);
        }

        // Update active thumbnail
        const thumbnails = document.querySelectorAll('.thumbnail');
        thumbnails.forEach((thumb, i) => {
            thumb.classList.toggle('active', i === index);
        });
    }

    openImageModal(index) {
        const modal = document.getElementById('imageModal');
        const modalImage = document.getElementById('modalImage');
        const thumbnails = document.getElementById('modalThumbnails');

        if (modal && modalImage) {
            this.currentImageIndex = index;
            modalImage.src = this.images[index];
            modalImage.alt = this.product.name;

            // Update modal thumbnails
            if (thumbnails && this.images.length > 1) {
                thumbnails.innerHTML = this.images.map((img, i) => `
                    <img src="${img}" alt="${this.product.name} ${i + 1}" 
                         class="modal-thumbnail ${i === index ? 'active' : ''}" 
                         onclick="productPage.switchModalImage(${i})"
                         onerror="this.style.display=\"none\"">
                `).join('');
            }

            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    switchModalImage(index) {
        if (index < 0 || index >= this.images.length) return;

        this.currentImageIndex = index;
        const modalImage = document.getElementById('modalImage');
        if (modalImage) {
            modalImage.src = this.images[index];
        }

        // Update active modal thumbnail
        const modalThumbnails = document.querySelectorAll('.modal-thumbnail');
        modalThumbnails.forEach((thumb, i) => {
            thumb.classList.toggle('active', i === index);
        });
    }

    closeImageModal() {
        const modal = document.getElementById('imageModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    previousImage() {
        const newIndex = this.currentImageIndex > 0 ? this.currentImageIndex - 1 : this.images.length - 1;
        this.switchModalImage(newIndex);
    }

    nextImage() {
        const newIndex = this.currentImageIndex < this.images.length - 1 ? this.currentImageIndex + 1 : 0;
        this.switchModalImage(newIndex);
    }

    adjustQuantity(change) {
        const newQuantity = this.quantity + change;
        if (newQuantity >= 1 && newQuantity <= this.product.stock_quantity) {
            this.quantity = newQuantity;
            const quantityInput = document.getElementById('quantityInput');
            if (quantityInput) {
                quantityInput.value = this.quantity;
            }
        }
    }

    addToCart() {
        if (this.product && this.product.stock_quantity > 0) {
            // Add multiple items based on quantity
            for (let i = 0; i < this.quantity; i++) {
                cart.addToCart(this.product, 1);
            }
            
            // Show success animation
            this.showAddToCartSuccess();
        }
    }

    showAddToCartSuccess() {
        const btn = document.getElementById('addToCartBtn');
        if (btn) {
            const originalText = btn.textContent;
            btn.textContent = '✓ ' + t('cart.added');
            btn.style.background = '#27ae60';
            
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '#2d5a27';
            }, 2000);
        }
    }

    renderReviews() {
        if (!this.product.reviews || this.product.reviews.length === 0) {
            return;
        }

        const reviewsSection = document.getElementById('reviewsSection');
        const reviewsList = document.getElementById('reviewsList');
        const reviewsSummary = document.getElementById('reviewsSummary');

        if (reviewsSection) {
            reviewsSection.style.display = 'block';
        }

        // Calculate average rating
        const totalRating = this.product.reviews.reduce((sum, review) => sum + review.rating, 0);
        const avgRating = (totalRating / this.product.reviews.length).toFixed(1);

        // Render reviews summary
        if (reviewsSummary) {
            reviewsSummary.innerHTML = `
                <div class="rating-display">
                    <div class="stars">${this.renderStars(avgRating)}</div>
                    <span>${avgRating} ${t('product.out_of')} 5 (${this.product.reviews.length} ${t('product.reviews')})</span>
                </div>
            `;
        }

        // Render reviews list
        if (reviewsList) {
            const reviewsHTML = this.product.reviews.map(review => `
                <div class="review-item">
                    <div class="review-header">
                        <span class="review-author">${review.customer_name}</span>
                        <span class="review-date">${utils.formatDate(review.created_at)}</span>
                    </div>
                    <div class="review-stars">${this.renderStars(review.rating)}</div>
                    <div class="review-comment">${review.comment || ''}</div>
                </div>
            `).join('');

            reviewsList.innerHTML = reviewsHTML;
        }

        // Setup review form
        this.setupReviewForm();
    }

    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        return '★'.repeat(fullStars) + 
               (hasHalfStar ? '☆' : '') + 
               '☆'.repeat(emptyStars);
    }

    setupReviewForm() {
        const reviewForm = document.getElementById('reviewForm');
        const ratingInput = document.getElementById('ratingInput');
        const stars = ratingInput?.querySelectorAll('.star');

        // Setup star rating
        if (stars) {
            stars.forEach((star, index) => {
                star.addEventListener('click', () => {
                    const rating = index + 1;
                    document.getElementById('reviewRating').value = rating;
                    
                    stars.forEach((s, i) => {
                        s.classList.toggle('active', i <= index);
                    });
                });

                star.addEventListener('mouseover', () => {
                    stars.forEach((s, i) => {
                        s.style.color = i <= index ? '#f39c12' : '#ddd';
                    });
                });
            });

            ratingInput.addEventListener('mouseleave', () => {
                const currentRating = parseInt(document.getElementById('reviewRating').value) || 0;
                stars.forEach((s, i) => {
                    s.style.color = i < currentRating ? '#f39c12' : '#ddd';
                });
            });
        }

        // Setup form submission
        if (reviewForm) {
            reviewForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitReview();
            });
        }
    }

    async submitReview() {
        const name = document.getElementById('reviewName').value.trim();
        const rating = parseInt(document.getElementById('reviewRating').value);
        const comment = document.getElementById('reviewComment').value.trim();

        if (!name || !rating || !comment) {
            alert(t('product.fill_all_fields'));
            return;
        }

        try {
            // In a real app, this would submit to the API
            // For now, we'll simulate success
            const reviewData = {
                plant_id: this.productId,
                customer_name: name,
                rating: rating,
                comment: comment
            };

            // Show success message
            alert(t('product.review_submitted'));
            
            // Reset form
            document.getElementById('reviewForm').reset();
            document.getElementById('reviewRating').value = '';
            const stars = document.querySelectorAll('#ratingInput .star');
            stars.forEach(star => star.classList.remove('active'));

        } catch (error) {
            console.error('Error submitting review:', error);
            alert(t('common.error'));
        }
    }

    async loadRelatedProducts() {
        try {
            const response = await api.getPlantsByCategory(this.product.category, { limit: 4 });
            const relatedProducts = response.plants?.filter(p => p.id !== this.product.id) || [];
            
            const container = document.getElementById('relatedProducts');
            if (container && relatedProducts.length > 0) {
                // Pass categories for translation
                const productsHTML = relatedProducts.map(plant => utils.createPlantCard(plant, this.categories)).join('');
                container.innerHTML = productsHTML;
            }
        } catch (error) {
            console.error('Error loading related products:', error);
        }
    }

    updateBreadcrumb() {
        const breadcrumbCurrent = document.getElementById('breadcrumbCurrent');
        if (breadcrumbCurrent && this.product) {
            // Get current language and use translated name
            const currentLang = localStorage.getItem('florist_language') || 'tr';
            let displayName = this.product.name;
            
            if (currentLang !== 'tr') {
                const langSuffix = currentLang === 'en' ? '_en' : 
                                  currentLang === 'az' ? '_az' : 
                                  currentLang === 'ru' ? '_ru' : '';
                displayName = this.product[`name${langSuffix}`] || this.product.name;
            }
            
            breadcrumbCurrent.textContent = displayName;
        }
    }

    updatePageTitle() {
        if (this.product) {
            // Get current language and use translated name
            const currentLang = localStorage.getItem('florist_language') || 'tr';
            let displayName = this.product.name;
            
            if (currentLang !== 'tr') {
                const langSuffix = currentLang === 'en' ? '_en' : 
                                  currentLang === 'az' ? '_az' : 
                                  currentLang === 'ru' ? '_ru' : '';
                displayName = this.product[`name${langSuffix}`] || this.product.name;
            }
            
            document.title = `${displayName} - Hayat Flora`;
        }
    }

    setupEventListeners() {
        // Newsletter form
        const newsletterForm = document.querySelector('.newsletter-form');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleNewsletterSignup();
            });
        }

        // Language change handler
        window.addEventListener('languageChanged', async () => {
            // Reload categories to get updated translations
            try {
                const categoriesResponse = await api.loadCategories();
                this.categories = categoriesResponse || [];
            } catch (error) {
                console.warn('Could not reload categories for translations');
            }
            
            // Re-render product to update translations
            this.renderProduct();
            if (this.product.reviews && this.product.reviews.length > 0) {
                this.renderReviews();
            }
            
            // Reload related products with new language
            await this.loadRelatedProducts();
            
            // Update breadcrumb and page title with new language
            this.updateBreadcrumb();
            this.updatePageTitle();
        });
    }

    setupParallax() {
        window.addEventListener('scroll', utils.debounce(() => {
            this.parallaxController.updateParallax();
        }, 16));
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

    redirectToShop() {
        window.location.href = '/shop.html';
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

    showError() {
        const productContent = document.getElementById('productContent');
        if (productContent) {
            productContent.innerHTML = `
                <div class="error-container" style="text-align: center; padding: 4rem 2rem;">
                    <div style="font-size: 4rem; margin-bottom: 2rem;">🌱</div>
                    <h2 style="color: #2d5a27; margin-bottom: 1rem;">${t('product.not_found')}</h2>
                    <p style="color: #666; margin-bottom: 2rem;">${t('product.not_found_desc')}</p>
                    <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                        <a href="/shop.html" class="btn btn-primary">${t('nav.shop')}</a>
                        <a href="/" class="btn btn-secondary">${t('nav.home')}</a>
                    </div>
                </div>
            `;
        }
    }
}

// Enhanced Parallax Controller for Product Page
class ProductParallax {
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
        this.updateImageParallax();
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

    updateImageParallax() {
        const mainImageContainer = document.querySelector('.main-image-container');
        if (mainImageContainer) {
            const rect = mainImageContainer.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                const parallaxOffset = (window.innerHeight - rect.top) * 0.1;
                mainImageContainer.style.transform = `translateY(${parallaxOffset}px)`;
            }
        }
    }
}

// Global variable for product page
let productPage;

// Initialize product page
document.addEventListener('DOMContentLoaded', () => {
    productPage = new ProductPage();
    
    // Setup intersection observer for animations
    utils.observeElements();
    
    // Performance optimization for mobile
    if (window.innerWidth <= 768) {
        document.body.classList.add('mobile-optimized');
    }
});

// Handle window resize
window.addEventListener('resize', utils.debounce(() => {
    if (productPage && productPage.parallaxController) {
        productPage.parallaxController.updateParallax();
    }
}, 250));

// Export for global use
window.productPage = productPage;