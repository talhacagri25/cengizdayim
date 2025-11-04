/**
 * Hayat Flora - Shared Navigation Functionality
 * Handles language selector and cart count across all pages
 */

// Initialize navigation when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initLanguageSelector();
    updateCartCount();
});

/**
 * Initialize language selector dropdown
 */
function initLanguageSelector() {
    const langButton = document.getElementById('langButton');
    const langDropdown = document.getElementById('langDropdown');

    if (!langButton || !langDropdown) return;

    // Language configuration
    const langConfig = {
        'tr': { flag: '🇹🇷', abbr: 'TR' },
        'az': { flag: '🇦🇿', abbr: 'AZ' },
        'en': { flag: '🇺🇸', abbr: 'EN' },
        'ru': { flag: '🇷🇺', abbr: 'RU' }
    };

    // Initialize language from localStorage
    const savedLang = localStorage.getItem('florist_language') || 'tr';
    if (langConfig[savedLang]) {
        langButton.querySelector('.lang-flag').textContent = langConfig[savedLang].flag;
        langButton.querySelector('.lang-text').textContent = langConfig[savedLang].abbr;
    }

    // Toggle language dropdown
    langButton.addEventListener('click', function(e) {
        e.stopPropagation();
        langDropdown.classList.toggle('open');
        const arrow = langButton.querySelector('.lang-arrow');
        arrow.style.transform = langDropdown.classList.contains('open') ? 'rotate(180deg)' : 'rotate(0deg)';
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function() {
        langDropdown.classList.remove('open');
        const arrow = langButton.querySelector('.lang-arrow');
        arrow.style.transform = 'rotate(0deg)';
    });

    // Handle language selection
    const langOptions = document.querySelectorAll('.lang-option');
    langOptions.forEach(option => {
        option.addEventListener('click', function() {
            const lang = this.dataset.lang;
            const config = langConfig[lang];

            if (config) {
                // Update button display
                langButton.querySelector('.lang-flag').textContent = config.flag;
                langButton.querySelector('.lang-text').textContent = config.abbr;

                // Save to localStorage
                localStorage.setItem('florist_language', lang);
            }

            // Close dropdown
            langDropdown.classList.remove('open');
            const arrow = langButton.querySelector('.lang-arrow');
            arrow.style.transform = 'rotate(0deg)';

            // Trigger language change if i18n is available
            if (window.i18n && window.i18n.setLanguage) {
                window.i18n.setLanguage(lang);
            }
        });
    });
}

/**
 * Update cart count badge
 */
function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    if (!cartCount) return;

    const cartData = JSON.parse(localStorage.getItem('florist_cart') || '[]');
    const totalItems = cartData.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
}

// Export functions for use in other scripts
window.navigationUtils = {
    updateCartCount: updateCartCount,
    initLanguageSelector: initLanguageSelector
};
