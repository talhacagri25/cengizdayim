// Shop page JavaScript with enhanced parallax effects

class ShopPage {
    constructor() {
        this.plants = [];
        this.filteredPlants = [];
        this.categories = [];
        this.currentPage = 1;
        this.plantsPerPage = 12;
        this.currentView = 'grid';
        this.filters = {
            search: '',
            category: '',
            priceRange: '',
            sort: ''
        };
        this.parallaxController = new ShopParallax();
        this.init();
    }

    async init() {
        this.showLoading();
        
        try {
            await this.loadData();
            this.setupEventListeners();
            this.setupParallax();
            this.parseURLParams();
            this.applyFilters();
            this.hideLoading();
        } catch (error) {
            console.error('Error initializing shop:', error);
            this.showError();
            this.hideLoading();
        }
    }

    async loadData() {
        try {
            const [plantsResponse, categoriesResponse] = await Promise.all([
                api.getAllPlants(),
                api.getAllCategories()
            ]);

            this.plants = plantsResponse.plants || [];
            this.categories = categoriesResponse.categories || [];
            this.filteredPlants = [...this.plants];

            this.populateCategoryFilter();
        } catch (error) {
            throw new Error('Failed to load shop data');
        }
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');

        if (searchInput) {
            searchInput.addEventListener('input', utils.debounce(() => {
                this.filters.search = searchInput.value.trim();
                this.applyFilters();
                this.updateURL();
            }, 300));

            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.filters.search = searchInput.value.trim();
                    this.applyFilters();
                    this.updateURL();
                }
            });
        }

        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.filters.search = searchInput.value.trim();
                this.applyFilters();
                this.updateURL();
            });
        }

        // Filter controls
        const categoryFilter = document.getElementById('categoryFilter');
        const priceFilter = document.getElementById('priceFilter');
        const sortFilter = document.getElementById('sortFilter');

        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                this.filters.category = categoryFilter.value;
                this.applyFilters();
                this.updateURL();
            });
        }

        if (priceFilter) {
            priceFilter.addEventListener('change', () => {
                this.filters.priceRange = priceFilter.value;
                this.applyFilters();
                this.updateURL();
            });
        }

        if (sortFilter) {
            sortFilter.addEventListener('change', () => {
                this.filters.sort = sortFilter.value;
                this.applyFilters();
                this.updateURL();
            });
        }

        // Clear filters
        const clearFilters = document.getElementById('clearFilters');
        const clearAllFilters = document.getElementById('clearAllFilters');

        if (clearFilters) {
            clearFilters.addEventListener('click', () => {
                this.clearFilters();
            });
        }

        if (clearAllFilters) {
            clearAllFilters.addEventListener('click', () => {
                this.clearFilters();
            });
        }

        // View controls
        const gridView = document.getElementById('gridView');
        const listView = document.getElementById('listView');

        if (gridView) {
            gridView.addEventListener('click', () => {
                this.switchView('grid');
            });
        }

        if (listView) {
            listView.addEventListener('click', () => {
                this.switchView('list');
            });
        }

        // Newsletter form
        const newsletterForm = document.querySelector('.newsletter-form');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleNewsletterSignup();
            });
        }
        
        // Language change listener - re-render plants when language changes
        window.addEventListener('languageChanged', () => {
            this.renderPlants();
            // Also re-render categories in the filter dropdown
            this.populateCategoryFilter();
        });
    }

    setupParallax() {
        // Enhanced parallax effects for shop elements
        window.addEventListener('scroll', utils.debounce(() => {
            this.parallaxController.updateParallax();
        }, 16));
    }

    parseURLParams() {
        const urlParams = new URLSearchParams(window.location.search);
        
        if (urlParams.has('category')) {
            this.filters.category = urlParams.get('category');
        }
        if (urlParams.has('search')) {
            this.filters.search = urlParams.get('search');
        }
        if (urlParams.has('sort')) {
            this.filters.sort = urlParams.get('sort');
        }
        if (urlParams.has('price')) {
            this.filters.priceRange = urlParams.get('price');
        }

        // Update form inputs
        this.updateFilterInputs();
    }

    updateFilterInputs() {
        const searchInput = document.getElementById('searchInput');
        const categoryFilter = document.getElementById('categoryFilter');
        const priceFilter = document.getElementById('priceFilter');
        const sortFilter = document.getElementById('sortFilter');

        if (searchInput) searchInput.value = this.filters.search;
        if (categoryFilter) categoryFilter.value = this.filters.category;
        if (priceFilter) priceFilter.value = this.filters.priceRange;
        if (sortFilter) sortFilter.value = this.filters.sort;
    }

    populateCategoryFilter() {
        const categoryFilter = document.getElementById('categoryFilter');
        if (!categoryFilter) return;

        const currentValue = categoryFilter.value;
        categoryFilter.innerHTML = '<option value="">All Categories</option>';

        // Get current language
        const currentLang = localStorage.getItem('florist_language') || 'tr';

        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.name; // Keep original name as value for filtering
            
            // Use translated name for display
            let displayName = category.name;
            if (currentLang !== 'tr') {
                const langSuffix = currentLang === 'en' ? '_en' : 
                                  currentLang === 'az' ? '_az' : 
                                  currentLang === 'ru' ? '_ru' : '';
                displayName = category[`name${langSuffix}`] || category.name;
            }
            
            option.textContent = displayName;
            categoryFilter.appendChild(option);
        });

        categoryFilter.value = currentValue;
    }

    applyFilters() {
        let filtered = [...this.plants];

        // Apply search filter
        if (this.filters.search) {
            const searchTerm = this.filters.search.toLowerCase();
            filtered = filtered.filter(plant => 
                plant.name.toLowerCase().includes(searchTerm) ||
                plant.description.toLowerCase().includes(searchTerm) ||
                plant.scientific_name?.toLowerCase().includes(searchTerm) ||
                plant.category_name?.toLowerCase().includes(searchTerm)
            );
        }

        // Apply category filter
        if (this.filters.category) {
            // Check both category ID and category name for compatibility
            filtered = filtered.filter(plant => 
                plant.category === this.filters.category || 
                plant.category_name === this.filters.category
            );
        }

        // Apply price range filter
        if (this.filters.priceRange) {
            filtered = this.filterByPrice(filtered, this.filters.priceRange);
        }

        // Apply sorting
        if (this.filters.sort) {
            filtered = this.sortPlants(filtered, this.filters.sort);
        } else {
            // Default sort: featured first, then by creation date
            filtered.sort((a, b) => {
                if (a.featured && !b.featured) return -1;
                if (!a.featured && b.featured) return 1;
                return new Date(b.created_at) - new Date(a.created_at);
            });
        }

        this.filteredPlants = filtered;
        this.currentPage = 1;
        this.renderPlants();
        this.renderPagination();
        this.updateResultsCount();
    }

    filterByPrice(plants, priceRange) {
        switch (priceRange) {
            case '0-25':
                return plants.filter(plant => (plant.sale_price || plant.price) <= 25);
            case '25-50':
                return plants.filter(plant => {
                    const price = plant.sale_price || plant.price;
                    return price > 25 && price <= 50;
                });
            case '50-100':
                return plants.filter(plant => {
                    const price = plant.sale_price || plant.price;
                    return price > 50 && price <= 100;
                });
            case '100+':
                return plants.filter(plant => (plant.sale_price || plant.price) > 100);
            default:
                return plants;
        }
    }

    sortPlants(plants, sortBy) {
        switch (sortBy) {
            case 'name':
                return plants.sort((a, b) => a.name.localeCompare(b.name));
            case 'price_asc':
                return plants.sort((a, b) => (a.sale_price || a.price) - (b.sale_price || b.price));
            case 'price_desc':
                return plants.sort((a, b) => (b.sale_price || b.price) - (a.sale_price || a.price));
            case 'newest':
                return plants.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            default:
                return plants;
        }
    }

    renderPlants() {
        const plantsGrid = document.getElementById('plantsGrid');
        const noResults = document.getElementById('noResults');
        
        if (!plantsGrid) return;

        if (this.filteredPlants.length === 0) {
            plantsGrid.style.display = 'none';
            if (noResults) noResults.style.display = 'block';
            return;
        }

        if (noResults) noResults.style.display = 'none';
        plantsGrid.style.display = 'grid';

        // Calculate pagination
        const startIndex = (this.currentPage - 1) * this.plantsPerPage;
        const endIndex = startIndex + this.plantsPerPage;
        const plantsToShow = this.filteredPlants.slice(startIndex, endIndex);

        // Add loading class
        plantsGrid.classList.add('loading');

        setTimeout(() => {
            const plantsHTML = plantsToShow.map((plant, index) => {
                const card = utils.createPlantCard(plant, this.categories);
                // Add animation delay for staggered effect
                return card.replace('plant-card', `plant-card fade-in`);
            }).join('');

            plantsGrid.innerHTML = plantsHTML;
            plantsGrid.classList.remove('loading');

            // Trigger parallax animations for new cards
            this.animateCards();
        }, 300);
    }

    animateCards() {
        const cards = document.querySelectorAll('.plant-card');
        cards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.05}s`;
            
            // Add enhanced hover effects
            this.setupCardHoverEffects(card);
        });
    }

    setupCardHoverEffects(card) {
        card.addEventListener('mouseenter', () => {
            // Create floating particles effect
            this.createHoverParticles(card);
        });

        card.addEventListener('mousemove', (e) => {
            // Mouse parallax effect within card
            const rect = card.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
            const y = ((e.clientY - rect.top) / rect.height - 0.5) * 10;
            
            const image = card.querySelector('.plant-image');
            if (image) {
                image.style.transform = `scale(1.08) translate(${x}px, ${y}px)`;
            }
        });

        card.addEventListener('mouseleave', () => {
            const image = card.querySelector('.plant-image');
            if (image) {
                image.style.transform = '';
            }
        });
    }

    createHoverParticles(card) {
        const particleCount = 5;
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
            
            card.style.position = 'relative';
            card.appendChild(particle);
            
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 1000);
        }
    }

    renderPagination() {
        const paginationContainer = document.getElementById('paginationContainer');
        if (!paginationContainer) return;

        const totalPages = Math.ceil(this.filteredPlants.length / this.plantsPerPage);
        
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `
            <button class="pagination-btn ${this.currentPage === 1 ? 'disabled' : ''}" 
                    onclick="shopPage.goToPage(${this.currentPage - 1})"
                    ${this.currentPage === 1 ? 'disabled' : ''}>
                ‹
            </button>
        `;

        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}"
                        onclick="shopPage.goToPage(${i})">
                    ${i}
                </button>
            `;
        }

        // Next button
        paginationHTML += `
            <button class="pagination-btn ${this.currentPage === totalPages ? 'disabled' : ''}"
                    onclick="shopPage.goToPage(${this.currentPage + 1})"
                    ${this.currentPage === totalPages ? 'disabled' : ''}>
                ›
            </button>
        `;

        paginationContainer.innerHTML = paginationHTML;
    }

    goToPage(page) {
        if (page < 1 || page > Math.ceil(this.filteredPlants.length / this.plantsPerPage)) {
            return;
        }
        
        this.currentPage = page;
        this.renderPlants();
        this.renderPagination();
        
        // Scroll to top of results
        const resultsSection = document.querySelector('.results-section');
        if (resultsSection) {
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    switchView(view) {
        this.currentView = view;
        
        const plantsGrid = document.getElementById('plantsGrid');
        const gridViewBtn = document.getElementById('gridView');
        const listViewBtn = document.getElementById('listView');
        
        if (!plantsGrid) return;

        // Update classes
        plantsGrid.className = `plants-grid ${view}-view`;
        
        // Update button states
        if (gridViewBtn && listViewBtn) {
            gridViewBtn.classList.toggle('active', view === 'grid');
            listViewBtn.classList.toggle('active', view === 'list');
        }
        
        // Re-render plants with new view
        this.renderPlants();
    }

    clearFilters() {
        this.filters = {
            search: '',
            category: '',
            priceRange: '',
            sort: ''
        };
        
        this.updateFilterInputs();
        this.applyFilters();
        this.updateURL();
    }

    updateResultsCount() {
        const resultsCount = document.getElementById('resultsCount');
        if (resultsCount) {
            const total = this.filteredPlants.length;
            const showing = Math.min(this.plantsPerPage, total - (this.currentPage - 1) * this.plantsPerPage);
            const start = total > 0 ? (this.currentPage - 1) * this.plantsPerPage + 1 : 0;
            const end = (this.currentPage - 1) * this.plantsPerPage + showing;
            
            resultsCount.textContent = `Showing ${start}-${end} of ${total} plants`;
        }
    }

    updateURL() {
        const params = new URLSearchParams();
        
        if (this.filters.search) params.set('search', this.filters.search);
        if (this.filters.category) params.set('category', this.filters.category);
        if (this.filters.priceRange) params.set('price', this.filters.priceRange);
        if (this.filters.sort) params.set('sort', this.filters.sort);
        
        const url = params.toString() ? `?${params.toString()}` : window.location.pathname;
        window.history.replaceState({}, '', url);
    }

    handleNewsletterSignup() {
        const input = document.querySelector('.newsletter-input');
        const button = document.querySelector('.newsletter-btn');
        
        if (!input || !input.value.trim()) return;
        
        // Simulate signup process
        const originalText = button.textContent;
        button.textContent = 'Subscribing...';
        button.disabled = true;
        
        setTimeout(() => {
            button.textContent = 'Subscribed! ✓';
            input.value = '';
            
            setTimeout(() => {
                button.textContent = originalText;
                button.disabled = false;
            }, 3000);
        }, 1000);
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
        const plantsGrid = document.getElementById('plantsGrid');
        if (plantsGrid) {
            utils.showError(plantsGrid, 'Failed to load plants. Please try again.');
        }
    }
}

// Enhanced Parallax Controller for Shop Page
class ShopParallax {
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
        this.updateHeroParallax();
        this.updateSectionParallax();
        this.updateCardParallax();
    }

    updateHeroParallax() {
        const heroBg = document.querySelector('.hero-parallax-bg');
        if (heroBg) {
            const yPos = -(this.scrollY * 0.5);
            heroBg.style.transform = `translate3d(0, ${yPos}px, 0)`;
        }

        const particles = document.querySelectorAll('.shop-hero .particle');
        particles.forEach((particle, index) => {
            const speed = 0.3 + (index * 0.05);
            const yPos = -(this.scrollY * speed);
            const xPos = Math.sin((this.scrollY + index * 100) * 0.01) * 15;
            particle.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
        });
    }

    updateSectionParallax() {
        const newsletterBg = document.querySelector('.newsletter-bg');
        if (newsletterBg) {
            const yPos = -(this.scrollY * 0.2);
            newsletterBg.style.transform = `translate3d(0, ${yPos}px, 0)`;
        }
    }

    updateCardParallax() {
        const cards = document.querySelectorAll('.plant-card');
        cards.forEach((card, index) => {
            const rect = card.getBoundingClientRect();
            const cardCenter = rect.top + rect.height / 2;
            const viewportCenter = window.innerHeight / 2;
            const distance = cardCenter - viewportCenter;
            const parallaxOffset = distance * 0.05;
            
            // Only apply if card is in viewport
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                card.style.transform = `translateY(${parallaxOffset}px)`;
            }
        });
    }
}

// Add additional CSS for hover particles
const style = document.createElement('style');
style.textContent = `
    @keyframes particleFloat {
        0% {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
        100% {
            opacity: 0;
            transform: translateY(-30px) scale(0);
        }
    }
    
    .hover-particle {
        animation: particleFloat 1s ease-out forwards;
    }
`;
document.head.appendChild(style);

// Global variable for shop page
let shopPage;

// Initialize shop page
document.addEventListener('DOMContentLoaded', () => {
    shopPage = new ShopPage();
    
    // Setup intersection observer for animations
    utils.observeElements();
    
    // Performance optimization for mobile
    if (window.innerWidth <= 768) {
        document.body.classList.add('mobile-optimized');
    }
});

// Handle window resize
window.addEventListener('resize', utils.debounce(() => {
    if (shopPage) {
        shopPage.renderPlants();
    }
}, 250));

// Export for global use
window.shopPage = shopPage;