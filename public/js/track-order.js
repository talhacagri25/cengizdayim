// Track Order Page JavaScript

// Helper function for safe translation
function translate(key, fallback = '') {
    if (window.t && typeof window.t === 'function') {
        return window.t(key);
    }
    return fallback || key;
}

// Alias for convenience
const t = translate;

class TrackOrder {
    constructor() {
        this.form = document.getElementById('trackOrderForm');
        this.resultSection = document.getElementById('orderResult');
        this.errorSection = document.getElementById('errorMessage');
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkUrlParams();
    }

    setupEventListeners() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.trackOrder();
        });
    }

    checkUrlParams() {
        // Check if order number is passed in URL
        const urlParams = new URLSearchParams(window.location.search);
        const orderNumber = urlParams.get('order');
        
        if (orderNumber) {
            document.getElementById('orderNumber').value = orderNumber;
            this.trackOrder();
        }
    }

    async trackOrder() {
        const orderNumber = document.getElementById('orderNumber').value.trim();
        
        if (!orderNumber) {
            this.showError(t('track.error_empty', 'Please enter an order number'));
            return;
        }

        // Show loading
        this.showLoading();

        try {
            const response = await fetch(`/api/orders/track/${encodeURIComponent(orderNumber)}`);
            const data = await response.json();

            if (response.ok && data.success && data.order) {
                this.displayOrder(data.order);
            } else {
                this.showError();
            }
        } catch (error) {
            console.error('Error tracking order:', error);
            this.showError();
        } finally {
            this.hideLoading();
        }
    }

    displayOrder(order) {
        // Hide error if shown
        this.errorSection.style.display = 'none';
        
        // Format dates
        const orderDate = new Date(order.created_at).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Get status info
        const statusInfo = this.getStatusInfo(order.status);
        const statusSteps = this.getStatusSteps(order.status);

        // Parse order items
        const orderItems = order.order_items || [];

        // Build HTML
        let html = `
            <div class="order-header">
                <div class="order-number">${t('track.order_number')}: ${order.order_number}</div>
                <div class="order-date">${t('track.order_date')}: ${orderDate}</div>
            </div>

            <div class="order-status-container">
                <h3>${t('track.order_status')}</h3>
                <div class="status-timeline">
                    ${statusSteps.map(step => `
                        <div class="status-item ${step.completed ? 'completed' : ''} ${step.active ? 'active' : ''}">
                            <div class="status-icon">${step.icon}</div>
                            <div class="status-details">
                                <div class="status-title">${step.title}</div>
                                <div class="status-desc">${step.description}</div>
                                ${step.time ? `<div class="status-time">${step.time}</div>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="current-status">
                    <span class="status-badge status-${order.status}">${statusInfo.text}</span>
                </div>
            </div>

            <div class="order-details">
                ${orderItems.length > 0 ? `
                    <div class="detail-group">
                        <h4 class="detail-title">
                            <span>📦</span>
                            <span>${t('track.order_items')}</span>
                        </h4>
                        <div class="order-items">
                            ${orderItems.map(item => `
                                <div class="order-item">
                                    ${item.image_url ? `
                                        <img src="${item.image_url}" alt="${item.name}" class="item-image" onerror="this.style.display='none'">
                                    ` : ''}
                                    <div class="item-info">
                                        <div class="item-name">${this.getLocalizedName(item)}</div>
                                        <div class="item-quantity">${t('track.quantity')}: ${item.quantity}</div>
                                    </div>
                                    <div class="item-price">₺${(item.price * item.quantity).toFixed(2)}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <div class="detail-group">
                    <h4 class="detail-title">
                        <span>📍</span>
                        <span>${t('track.delivery_info')}</span>
                    </h4>
                    <div class="detail-content">
                        <div class="detail-row">
                            <span class="detail-label">${t('track.delivery_type')}:</span>
                            <span class="detail-value">${order.delivery_type === 'delivery' ? t('track.home_delivery') : t('track.store_pickup')}</span>
                        </div>
                        ${order.delivery_address ? `
                            <div class="detail-row">
                                <span class="detail-label">${t('track.delivery_address')}:</span>
                                <span class="detail-value">${order.delivery_address}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <div class="detail-group">
                    <h4 class="detail-title">
                        <span>💰</span>
                        <span>${t('track.payment_summary')}</span>
                    </h4>
                    <div class="detail-content">
                        <div class="detail-row">
                            <span class="detail-label">${t('track.subtotal')}:</span>
                            <span class="detail-value">₺${parseFloat(order.subtotal || 0).toFixed(2)}</span>
                        </div>
                        ${order.delivery_fee > 0 ? `
                            <div class="detail-row">
                                <span class="detail-label">${t('track.delivery_fee')}:</span>
                                <span class="detail-value">₺${parseFloat(order.delivery_fee).toFixed(2)}</span>
                            </div>
                        ` : ''}
                        <div class="detail-row" style="font-weight: bold; font-size: 1.1rem; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #ddd;">
                            <span class="detail-label">${t('track.total', 'Total')}:</span>
                            <span class="detail-value">₺${parseFloat(order.total || 0).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Display result
        const resultCard = this.resultSection.querySelector('.order-result-card');
        resultCard.innerHTML = html;
        this.resultSection.style.display = 'block';

        // Smooth scroll to result
        this.resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    getStatusInfo(status) {
        const statusMap = {
            'pending': { text: t('status.pending', 'Pending'), color: 'warning' },
            'confirmed': { text: t('status.confirmed', 'Confirmed'), color: 'info' },
            'preparing': { text: t('status.preparing', 'Preparing'), color: 'purple' },
            'ready': { text: t('status.ready', 'Ready'), color: 'success' },
            'delivered': { text: t('status.delivered', 'Delivered'), color: 'success' },
            'cancelled': { text: t('status.cancelled', 'Cancelled'), color: 'danger' }
        };
        return statusMap[status] || { text: status, color: 'secondary' };
    }

    getStatusSteps(currentStatus) {
        const steps = [
            {
                key: 'pending',
                icon: '📝',
                title: t('status.pending', 'Pending'),
                description: t('status.pending_desc', 'Your order has been received and is awaiting confirmation')
            },
            {
                key: 'confirmed',
                icon: '✅',
                title: t('status.confirmed', 'Confirmed'),
                description: t('status.confirmed_desc', 'Your order has been confirmed and is being prepared')
            },
            {
                key: 'preparing',
                icon: '🌿',
                title: t('status.preparing', 'Preparing'),
                description: t('status.preparing_desc', 'Your beautiful plants are being carefully prepared')
            },
            {
                key: 'ready',
                icon: '📦',
                title: t('status.ready', 'Ready'),
                description: t('status.ready_desc', 'Your order is ready for delivery or pickup')
            },
            {
                key: 'delivered',
                icon: '🎉',
                title: t('status.delivered', 'Delivered'),
                description: t('status.delivered_desc', 'Your order has been successfully delivered')
            }
        ];

        const statusOrder = ['pending', 'confirmed', 'preparing', 'ready', 'delivered'];
        const currentIndex = statusOrder.indexOf(currentStatus);

        // Mark completed and active steps
        return steps.map((step, index) => {
            const stepIndex = statusOrder.indexOf(step.key);
            return {
                ...step,
                completed: stepIndex < currentIndex,
                active: stepIndex === currentIndex
            };
        });
    }

    getLocalizedName(item) {
        // Get current language
        const currentLang = localStorage.getItem('florist_language') || 'tr';
        
        // Return the appropriate name based on current language
        if (currentLang === 'en' && item.name_en) {
            return item.name_en;
        } else if (currentLang === 'az' && item.name_az) {
            return item.name_az;
        } else if (currentLang === 'ru' && item.name_ru) {
            return item.name_ru;
        }
        
        // Default to base name (Turkish) or fallback name
        return item.name || item.plant_name || 'Product';
    }

    showError(message) {
        this.resultSection.style.display = 'none';
        this.errorSection.style.display = 'block';
        
        if (message) {
            this.errorSection.querySelector('p').textContent = message;
        }
        
        // Smooth scroll to error
        this.errorSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    showLoading() {
        const button = this.form.querySelector('button[type="submit"]');
        button.disabled = true;
        button.innerHTML = `
            <span>${t('common.loading')}...</span>
            <span class="btn-icon">⏳</span>
        `;
    }

    hideLoading() {
        const button = this.form.querySelector('button[type="submit"]');
        button.disabled = false;
        button.innerHTML = `
            <span data-i18n="track.track_button">${t('track.track_button')}</span>
            <span class="btn-icon">🔍</span>
        `;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Hide loading screen
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
    
    new TrackOrder();
});