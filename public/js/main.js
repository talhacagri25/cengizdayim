// Main JavaScript file for the homepage with parallax effects

class ParallaxController {
    constructor() {
        this.scrollY = 0;
        this.elements = [];
        this.isEnabled = true;
        this.ticking = false;
        this.init();
        this.createAnimationToggle();
    }

    init() {
        this.setupParallaxElements();
        this.bindEvents();
        this.checkAnimationPreference();
    }

    setupParallaxElements() {
        // Professional parallax elements with subtle, smooth effects
        this.elements = [
            {
                selector: '.hero-bg-layer',
                speed: 0.3,
                type: 'translateY',
                range: 100
            },
            {
                selector: '.parallax-back',
                speed: -0.5,
                type: 'translateY',
                range: 200
            },
            {
                selector: '.parallax-front',
                speed: 0.2,
                type: 'translateY',
                range: 80
            },
            {
                selector: '.animate-on-scroll',
                speed: 0.1,
                type: 'fadeInUp',
                range: 50
            }
        ];

        // Initialize elements with will-change for performance
        this.elements.forEach(config => {
            const elements = document.querySelectorAll(config.selector);
            elements.forEach(element => {
                element.style.willChange = 'transform, opacity';
            });
        });
    }

    checkAnimationPreference() {
        // Check for reduced motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.isEnabled = false;
            document.body.classList.add('no-animations');
            return;
        }
    }

    bindEvents() {
        let ticking = false;
        let lastScrollY = 0;
        const scrollThreshold = 2; // Minimum scroll delta to trigger updates
        
        // Optimized scroll handler with throttling and threshold
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            const scrollDelta = Math.abs(currentScrollY - lastScrollY);
            
            // Only update if scroll delta is significant
            if (scrollDelta > scrollThreshold) {
                this.scrollY = currentScrollY;
                lastScrollY = currentScrollY;
                
                if (!ticking) {
                    requestAnimationFrame(() => {
                        this.updateParallax();
                        ticking = false;
                    });
                    ticking = true;
                }
            }
        };

        // Use passive event listener for better performance
        window.addEventListener('scroll', handleScroll, { passive: true });

        // Smooth scroll for navigation links with performance optimization
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = anchor.getAttribute('href');
                const target = document.querySelector(targetId);
                
                if (target) {
                    // Use native smooth scrolling when available, fallback to polyfill
                    if ('scrollBehavior' in document.documentElement.style) {
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    } else {
                        // Fallback smooth scroll for older browsers
                        this.smoothScrollTo(target.offsetTop);
                    }
                }
            });
        });

        // Optimize resize events
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        }, { passive: true });

        // Performance monitoring for development
        if (window.performance && window.performance.mark) {
            window.performance.mark('parallax-events-bound');
        }
    }

    // Smooth scroll fallback for older browsers
    smoothScrollTo(targetY) {
        const startY = window.scrollY;
        const distance = targetY - startY;
        const duration = 800;
        let startTime = null;

        const animate = (currentTime) => {
            if (startTime === null) startTime = currentTime;
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const easeInOutCubic = progress < 0.5 
                ? 4 * progress * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            
            window.scrollTo(0, startY + distance * easeInOutCubic);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    // Handle resize events efficiently
    handleResize() {
        // Recalculate viewport dimensions
        this.viewportHeight = window.innerHeight;
        this.viewportWidth = window.innerWidth;
        
        // Update parallax calculations if needed
        this.updateParallax();
        
        // Performance optimization: reduce calculations on mobile
        if (this.viewportWidth <= 768) {
            this.enableMobileOptimizations();
        } else {
            this.disableMobileOptimizations();
        }
    }

    // Mobile performance optimizations
    enableMobileOptimizations() {
        this.isMobileOptimized = true;
        
        // Reduce parallax sensitivity on mobile
        this.elements.forEach(element => {
            if (element.originalSpeed === undefined) {
                element.originalSpeed = element.speed;
            }
            element.speed = element.originalSpeed * 0.5;
        });
    }

    // Disable mobile optimizations for desktop
    disableMobileOptimizations() {
        if (this.isMobileOptimized) {
            this.isMobileOptimized = false;
            
            // Restore original parallax speeds
            this.elements.forEach(element => {
                if (element.originalSpeed !== undefined) {
                    element.speed = element.originalSpeed;
                }
            });
        }
    }

    updateParallax() {
        if (!this.isEnabled) return;
        
        this.elements.forEach(config => {
            const elements = document.querySelectorAll(config.selector);
            elements.forEach((element, index) => {
                const rect = element.getBoundingClientRect();
                const elementTop = rect.top + window.scrollY;
                const elementHeight = rect.height;
                const windowHeight = window.innerHeight;
                
                // Only apply parallax if element is in viewport or near it
                if (elementTop < this.scrollY + windowHeight && 
                    elementTop + elementHeight > this.scrollY) {
                    
                    if (config.type === 'translateY') {
                        const yOffset = (this.scrollY - elementTop) * config.speed;
                        const clampedOffset = Math.max(-config.range, Math.min(config.range, yOffset));
                        element.style.transform = `translate3d(0, ${clampedOffset}px, 0)`;
                        
                    } else if (config.type === 'fadeInUp') {
                        // Smooth fade-in with parallax movement for scroll animations
                        const progress = Math.max(0, Math.min(1, 
                            (this.scrollY + windowHeight - elementTop) / (windowHeight * 0.8)
                        ));
                        
                        const yOffset = (1 - progress) * config.range;
                        const opacity = Math.max(0, Math.min(1, progress));
                        
                        element.style.transform = `translate3d(0, ${yOffset}px, 0)`;
                        element.style.opacity = opacity;
                    }
                }
            });
        });

        // Update header background on scroll
        this.updateHeaderScroll();
    }

    updateHeaderScroll() {
        const header = document.getElementById('header');
        if (header) {
            if (this.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
    }

    animate() {
        // Continuous animation loop for ambient effects
        const animateElements = () => {
            if (!this.isEnabled) {
                requestAnimationFrame(animateElements);
                return;
            }
            
            const time = Date.now() * 0.001;

            // Animate hero particles (much gentler)
            document.querySelectorAll('.hero-particles .particle').forEach((particle, index) => {
                const speed = 0.1 + (index * 0.05);  // Much slower
                const amplitude = 3 + (index * 2);    // Much smaller movement
                const xOffset = Math.sin(time * speed) * amplitude;
                const yOffset = Math.cos(time * speed * 0.7) * (amplitude * 0.5);
                
                particle.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
            });

            // Animate floating elements (much gentler)
            document.querySelectorAll('.floating-element').forEach((element, index) => {
                const speed = 0.05 + (index * 0.02);  // Much slower
                const amplitude = 5 + (index * 2);     // Much smaller movement
                const xOffset = Math.sin(time * speed + index) * amplitude;
                const yOffset = Math.cos(time * speed * 0.8 + index) * (amplitude * 0.7);
                const rotation = Math.sin(time * 0.05 + index) * 5;  // Much less rotation
                
                element.style.transform = `translate(${xOffset}px, ${yOffset}px) rotate(${rotation}deg)`;
            });

            requestAnimationFrame(animateElements);
        };

        animateElements();
    }

    createAnimationToggle() {
        // Create a floating toggle button for animations
        const toggleBtn = document.createElement('div');
        toggleBtn.innerHTML = `
            <button id="animationToggle" style="
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: rgba(45, 90, 39, 0.9);
                color: white;
                border: none;
                font-size: 24px;
                cursor: pointer;
                z-index: 1000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                transition: all 0.3s ease;
            " title="Toggle Animations">
                🎭
            </button>
        `;
        document.body.appendChild(toggleBtn);

        document.getElementById('animationToggle').addEventListener('click', () => {
            this.toggleAnimations();
        });
    }

    toggleAnimations() {
        this.isEnabled = !this.isEnabled;
        const button = document.getElementById('animationToggle');
        
        if (this.isEnabled) {
            button.innerHTML = '🎭';
            button.style.background = 'rgba(45, 90, 39, 0.9)';
            document.body.classList.remove('no-animations');
        } else {
            button.innerHTML = '⏸️';
            button.style.background = 'rgba(200, 200, 200, 0.9)';
            document.body.classList.add('no-animations');
            
            // Reset all transforms when disabling
            document.querySelectorAll('.floating-element, .hero-particles .particle, .hero-bg, .section::before').forEach(el => {
                el.style.transform = '';
            });
        }
    }
}

// Page initialization
class HomePage {
    constructor() {
        this.parallaxController = new ParallaxController();
        this.featuredPlants = [];
        this.categories = [];
        this.storeInfo = {};
        this.init();
    }

    async init() {
        // Show loading screen
        this.showLoading();

        try {
            // Load page data
            await this.loadPageData();
            
            // Initialize parallax effects
            this.initializeParallax();
            
            // Setup intersection observer for animations
            this.setupAnimations();
            
            // Setup language change listener
            this.setupLanguageListener();
            
            // Hide loading screen
            this.hideLoading();
            
        } catch (error) {
            console.error('Error initializing homepage:', error);
            this.hideLoading();
        }
    }

    async loadPageData() {
        try {
            // Load featured plants and categories in parallel
            const [featuredPlants, categories, storeInfo] = await Promise.all([
                api.loadFeaturedPlants(),
                api.loadCategories(),
                api.loadStoreInfo()
            ]);

            // Store data for language changes
            this.featuredPlants = featuredPlants;
            this.categories = categories;
            this.storeInfo = storeInfo;

            // Update page content
            this.renderFeaturedPlants(featuredPlants);
            this.renderCategories(categories);
            this.updateStoreInfo(storeInfo);

        } catch (error) {
            console.error('Error loading page data:', error);
            this.showError();
        }
    }

    renderFeaturedPlants(plants) {
        const container = document.getElementById('featuredPlants');
        if (!container || !plants.length) {
            return;
        }

        const plantsHTML = plants.map((plant, index) => {
            const card = utils.createPlantCard(plant, this.categories);
            // Add staggered animation delay
            return card.replace('plant-card', `plant-card animate-on-scroll`);
        }).join('');

        container.innerHTML = plantsHTML;
    }

    renderCategories(categories) {
        const container = document.getElementById('categoriesGrid');
        if (!container || !categories.length) {
            return;
        }

        // Clear container first
        container.innerHTML = '';
        
        // Create each category card as a real DOM element for better control
        categories.forEach((category, index) => {
            const link = document.createElement('a');
            link.href = `/shop.html?category=${encodeURIComponent(category.name)}`;
            link.style.textDecoration = 'none';
            link.style.display = 'block';
            
            const card = document.createElement('div');
            card.style.cssText = `
                background: white;
                border-radius: 16px;
                padding: 32px;
                text-align: center;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                transition: all 0.3s ease;
                cursor: pointer;
                height: 100%;
            `;
            
            // Add hover effect
            card.onmouseenter = () => {
                card.style.transform = 'translateY(-8px)';
                card.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.15)';
            };
            card.onmouseleave = () => {
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
            };
            
            // Get display name based on language
            const currentLang = localStorage.getItem('florist_language') || 'tr';
            let displayName = category.name;
            let displayDescription = category.description || '';
            
            if (currentLang !== 'tr') {
                const langSuffix = currentLang === 'en' ? '_en' : 
                                  currentLang === 'az' ? '_az' : 
                                  currentLang === 'ru' ? '_ru' : '';
                displayName = category[`name${langSuffix}`] || category.name;
                displayDescription = category[`description${langSuffix}`] || category.description || '';
            }
            
            card.innerHTML = `
                <div style="font-size: 48px; margin-bottom: 16px;">🌱</div>
                <h3 style="font-size: 24px; font-weight: bold; margin: 16px 0; color: #333;">${displayName}</h3>
                <p style="color: #666; margin-bottom: 24px; line-height: 1.6;">${displayDescription}</p>
            `;
            
            link.appendChild(card);
            container.appendChild(link);
        });
    }

    updateStoreInfo(storeInfo) {
        if (!storeInfo || !Object.keys(storeInfo).length) return;

        // Update any store-specific information on the page
        const storeElements = {
            'store-name': storeInfo.store_name,
            'store-tagline': storeInfo.tagline,
            'store-description': storeInfo.description,
            'store-phone': storeInfo.phone,
            'store-email': storeInfo.email,
            'store-address': storeInfo.address,
            'store-hours': storeInfo.hours
        };

        Object.entries(storeElements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element && value) {
                element.textContent = value;
            }
        });
    }

    initializeParallax() {
        // Create additional parallax effects for specific sections
        const parallaxSections = document.querySelectorAll('.section');
        
        parallaxSections.forEach((section, index) => {
            section.style.transform = 'translateZ(0)'; // Enable hardware acceleration
            
            // Add parallax background elements
            if (!section.querySelector('.parallax-bg')) {
                const parallaxBg = document.createElement('div');
                parallaxBg.className = 'parallax-bg';
                parallaxBg.style.cssText = `
                    position: absolute;
                    top: -20%;
                    left: -20%;
                    width: 140%;
                    height: 140%;
                    opacity: 0.05;
                    background: radial-gradient(circle, #2d5a27 2px, transparent 2px);
                    background-size: 50px 50px;
                    z-index: -1;
                    animation: parallaxMove ${20 + index * 5}s linear infinite;
                `;
                section.appendChild(parallaxBg);
            }
        });
    }

    setupAnimations() {
        // Simplified animations to prevent click interference
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };

        const animationObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    // Only add a class, don't manipulate transforms directly
                    entry.target.classList.add('in-view');
                    animationObserver.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Only observe section headers, not interactive elements
        document.querySelectorAll('.section-header, .section-title, .section-subtitle').forEach(el => {
            animationObserver.observe(el);
        });

        // Disable animations for interactive grids to prevent click issues
        // this.setupCardAnimations();
        // this.setupSectionAnimations();
    }

    animateElement(element) {
        if (element.classList.contains('animated')) return;
        
        const animationType = element.dataset.animation || 'fadeInUp';
        const delay = parseInt(element.dataset.delay) || 0;
        
        setTimeout(() => {
            element.classList.add('animated');
            element.style.animationName = animationType;
            element.style.animationDuration = '0.8s';
            element.style.animationTimingFunction = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            element.style.animationFillMode = 'both';
        }, delay);
    }

    animateGroup(container) {
        if (container.classList.contains('group-animated')) return;
        
        container.classList.add('group-animated');
        const children = container.children;
        
        Array.from(children).forEach((child, index) => {
            // Skip animation for category links to prevent click issues
            if (child.tagName === 'A' && child.href && child.href.includes('/shop.html')) {
                return;
            }
            
            if (!child.classList.contains('animated')) {
                setTimeout(() => {
                    child.classList.add('animated');
                    child.style.animationName = 'slideInUp';
                    child.style.animationDuration = '0.6s';
                    child.style.animationDelay = `${index * 0.1}s`;
                    child.style.animationTimingFunction = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                    child.style.animationFillMode = 'both';
                }, index * 50);
            }
        });
    }

    setupSectionAnimations() {
        // Animate section headers with a more sophisticated approach
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const header = entry.target;
                    const title = header.querySelector('.section-title');
                    const subtitle = header.querySelector('.section-subtitle');
                    
                    if (title && !title.classList.contains('animated')) {
                        setTimeout(() => {
                            title.classList.add('animated');
                            title.style.animation = 'titleReveal 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards';
                        }, 100);
                    }
                    
                    if (subtitle && !subtitle.classList.contains('animated')) {
                        setTimeout(() => {
                            subtitle.classList.add('animated');
                            subtitle.style.animation = 'subtitleReveal 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards';
                        }, 300);
                    }
                }
            });
        }, { threshold: 0.2 });

        document.querySelectorAll('.section-header').forEach(header => {
            sectionObserver.observe(header);
        });
    }

    setupCardAnimations() {
        // Only animate plant cards, not category cards
        const cards = document.querySelectorAll('.plant-card');
        
        cards.forEach((card, index) => {
            // Stagger the initial animation
            card.style.animationDelay = `${index * 0.1}s`;
            
            card.addEventListener('mouseenter', () => {
                this.animateCardHover(card, true);
            });
            
            card.addEventListener('mouseleave', () => {
                this.animateCardHover(card, false);
            });
        });
    }

    animateCardHover(card, isHovering) {
        // Don't manipulate category cards - let CSS handle their hover
        if (card.classList.contains('category-card')) {
            return;
        }
        
        if (isHovering) {
            // Store the initial transform state only once
            if (!card.dataset.hasStoredTransform) {
                card.dataset.originalTransform = card.style.transform || '';
                card.dataset.hasStoredTransform = 'true';
            }
            card.style.transform = `${card.dataset.originalTransform} scale(1.02)`.trim();
            
            // Animate child elements
            const image = card.querySelector('.plant-image');
            if (image) {
                image.style.transform = 'scale(1.1) rotate(1deg)';
            }
            
            // Add floating animation only for plant cards
            if (card.classList.contains('plant-card')) {
                card.style.animation = 'cardFloat 2s ease-in-out infinite';
            }
        } else {
            // Restore original transform
            card.style.transform = card.dataset.originalTransform || '';
            
            const image = card.querySelector('.plant-image');
            if (image) {
                image.style.transform = 'scale(1)';
            }
            
            card.style.animation = '';
        }
    }

    setupLanguageListener() {
        // Listen for language change events and re-render dynamic content
        window.addEventListener('languageChanged', (event) => {
            console.log('Language changed to:', event.detail.language);
            this.refreshDynamicContent();
        });
    }

    async refreshDynamicContent() {
        try {
            // Re-render the dynamic content with stored data (using fresh translations)
            this.renderFeaturedPlants(this.featuredPlants);
            this.renderCategories(this.categories);

            // Apply translations to the newly rendered content
            if (window.i18n) {
                window.i18n.applyTranslations();
            }

        } catch (error) {
            console.error('Error refreshing dynamic content:', error);
        }
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
        const featuredContainer = document.getElementById('featuredPlants');
        const categoriesContainer = document.getElementById('categoriesGrid');
        
        if (featuredContainer) {
            utils.showError(featuredContainer, 'Failed to load featured plants');
        }
        
        if (categoriesContainer) {
            utils.showError(categoriesContainer, 'Failed to load categories');
        }
    }
}

// Enhanced scroll effects
class ScrollEffects {
    constructor() {
        this.init();
    }

    init() {
        this.setupScrollReveal();
        this.setupParallaxText();
        this.setupScrollProgress();
    }

    setupScrollReveal() {
        const revealElements = document.querySelectorAll('.section-title, .section-subtitle, .feature-item');
        
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animation = 'revealFromBottom 0.8s ease-out forwards';
                }
            });
        }, { threshold: 0.2 });

        revealElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(50px)';
            revealObserver.observe(el);
        });
    }

    setupParallaxText() {
        const textElements = document.querySelectorAll('.hero-title, .hero-subtitle');
        
        window.addEventListener('scroll', () => {
            const scrolled = window.scrollY;
            const rate = scrolled * -0.5;
            
            textElements.forEach((el, index) => {
                const speed = 0.5 + (index * 0.1);
                el.style.transform = `translate3d(0, ${scrolled * speed}px, 0)`;
            });
        });
    }

    setupScrollProgress() {
        // Create scroll progress indicator
        const progressBar = document.createElement('div');
        progressBar.className = 'scroll-progress';
        progressBar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 0%;
            height: 3px;
            background: linear-gradient(90deg, #2d5a27, #67a573);
            z-index: 10001;
            transition: width 0.1s ease;
        `;
        
        document.body.appendChild(progressBar);
        
        window.addEventListener('scroll', () => {
            const scrollProgress = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
            progressBar.style.width = `${Math.min(scrollProgress, 100)}%`;
        });
    }
}

// Mouse parallax effect
class MouseParallax {
    constructor() {
        this.mouseX = 0;
        this.mouseY = 0;
        this.init();
    }

    init() {
        document.addEventListener('mousemove', (e) => {
            this.mouseX = (e.clientX / window.innerWidth) - 0.5;
            this.mouseY = (e.clientY / window.innerHeight) - 0.5;
            
            this.updateParallaxElements();
        });
    }

    updateParallaxElements() {
        const parallaxElements = document.querySelectorAll('.hero-content, .floating-element');
        
        parallaxElements.forEach((el, index) => {
            const speed = (index + 1) * 2;
            const x = this.mouseX * speed;
            const y = this.mouseY * speed;
            
            // Store base transform if not already stored
            if (!el.dataset.baseTransform) {
                el.dataset.baseTransform = el.style.transform || '';
            }
            
            // Apply transform without accumulation
            el.style.transform = `${el.dataset.baseTransform} translate(${x}px, ${y}px)`.trim();
        });
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes revealFromBottom {
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes cardFloat {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-5px); }
    }
    
    @keyframes parallaxMove {
        from { transform: translate(0, 0) rotate(0deg); }
        to { transform: translate(50px, 50px) rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const homePage = new HomePage();
    const scrollEffects = new ScrollEffects();
    const mouseParallax = new MouseParallax();
    
    // Setup utilities
    utils.observeElements();
    
    // Performance optimization: reduce animations on mobile
    if (window.innerWidth <= 768) {
        document.body.classList.add('mobile-optimized');
        // Reduce particle count on mobile
        const particles = document.querySelectorAll('.particle');
        particles.forEach((particle, index) => {
            if (index > 4) particle.remove();
        });
    }
});

// Handle window resize
window.addEventListener('resize', utils.debounce(() => {
    // Recalculate parallax on resize
    window.dispatchEvent(new Event('scroll'));
}, 250));

// Optimize performance by pausing animations when page is not visible
document.addEventListener('visibilitychange', () => {
    const animations = document.querySelectorAll('[style*="animation"]');
    animations.forEach(el => {
        if (document.hidden) {
            el.style.animationPlayState = 'paused';
        } else {
            el.style.animationPlayState = 'running';
        }
    });
});