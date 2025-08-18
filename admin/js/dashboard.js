// Admin Dashboard JavaScript with enhanced animations and real-time data

class AdminDashboard {
    constructor() {
        this.stats = {};
        this.recentOrders = [];
        this.lowStockItems = [];
        this.refreshInterval = null;
        this.init();
    }

    init() {
        // Check authentication
        if (!adminAuth.token) {
            adminAuth.redirectToLogin();
            return;
        }

        this.setupUI();
        this.loadDashboard();
        this.startAutoRefresh();
    }

    setupUI() {
        this.setupSidebar();
        this.setupUserMenu();
        this.initializeAnimations();
    }

    setupSidebar() {
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');

        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
                mainContent.classList.toggle('expanded');
                
                // Store sidebar state
                localStorage.setItem('sidebar_collapsed', sidebar.classList.contains('collapsed'));
            });
        }

        // Restore sidebar state
        const isCollapsed = localStorage.getItem('sidebar_collapsed') === 'true';
        if (isCollapsed) {
            sidebar.classList.add('collapsed');
            mainContent.classList.add('expanded');
        }

        // Mobile sidebar toggle
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('collapsed');
            sidebar.classList.add('mobile-hidden');
        }
    }

    setupUserMenu() {
        const userAvatar = document.getElementById('userAvatar');
        const userDropdown = document.getElementById('userDropdown');
        
        // Set user initial
        const user = adminAuth.getCurrentUser();
        if (user && userAvatar) {
            userAvatar.textContent = user.username.charAt(0).toUpperCase();
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!userAvatar?.contains(e.target)) {
                userDropdown?.classList.remove('show');
            }
        });
    }

    toggleUserMenu() {
        const userDropdown = document.getElementById('userDropdown');
        if (userDropdown) {
            userDropdown.classList.toggle('show');
        }
    }

    initializeAnimations() {
        // Animate stats cards on load
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animation = 'slideInUp 0.6s ease-out forwards';
                }
            });
        }, { threshold: 0.1 });

        // Add CSS for animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInUp {
                0% {
                    opacity: 0;
                    transform: translateY(30px);
                }
                100% {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            @keyframes countUp {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);

        // Observe elements
        document.querySelectorAll('.stat-card').forEach(card => {
            observer.observe(card);
        });
    }

    async loadDashboard() {
        try {
            this.showLoading();
            
            // Load all dashboard data in parallel
            await Promise.all([
                this.loadStats(),
                this.loadRecentOrders(),
                this.loadLowStock(),
                this.loadRecentActivity()
            ]);

            this.renderDashboard();
            this.hideLoading();
            
        } catch (error) {
            console.error('Error loading dashboard:', error);
            this.showError();
        }
    }

    async loadStats() {
        try {
            const response = await adminAuth.authenticatedFetch('/api/dashboard/stats');
            const data = await response.json();
            
            if (data.success) {
                this.stats = data.stats;
            } else {
                throw new Error('Failed to load stats');
            }
        } catch (error) {
            console.error('Error loading stats:', error);
            // Provide default stats
            this.stats = {
                total_plants: 0,
                total_orders: 0,
                pending_orders: 0,
                low_stock: 0,
                total_revenue: 0
            };
        }
    }

    async loadRecentOrders() {
        try {
            const response = await adminAuth.authenticatedFetch('/api/orders?limit=5');
            const data = await response.json();
            
            if (data.success) {
                this.recentOrders = data.orders || [];
            }
        } catch (error) {
            console.error('Error loading recent orders:', error);
            this.recentOrders = [];
        }
    }

    async loadLowStock() {
        try {
            const response = await adminAuth.authenticatedFetch('/api/plants?limit=50');
            const data = await response.json();
            
            if (data.success) {
                // Filter plants with stock <= 5
                this.lowStockItems = (data.plants || []).filter(plant => 
                    plant.stock_quantity <= 5 && plant.status === 'available'
                );
            }
        } catch (error) {
            console.error('Error loading low stock items:', error);
            this.lowStockItems = [];
        }
    }

    async loadRecentActivity() {
        // This would typically load from an activity log
        // For now, we'll generate some mock activity data
        this.recentActivity = [
            {
                icon: '📦',
                title: 'Yeni Sipariş Alındı',
                description: 'Sipariş #12345 - John Doe',
                time: '2 dakika önce'
            },
            {
                icon: '🌱',
                title: 'Bitki Eklendi',
                description: 'Sansevieria envantere eklendi',
                time: '15 dakika önce'
            },
            {
                icon: '✅',
                title: 'Sipariş Tamamlandı',
                description: 'Sipariş #12340 teslim edildi olarak işaretlendi',
                time: '1 saat önce'
            },
            {
                icon: '⚠️',
                title: 'Düşük Stok Uyarısı',
                description: 'Fiddle Leaf Fig stoku azalıyor',
                time: '2 saat önce'
            }
        ];
    }

    renderDashboard() {
        this.renderStats();
        this.renderRecentOrders();
        this.renderLowStock();
        this.renderRecentActivity();
    }

    renderStats() {
        const statsGrid = document.getElementById('statsGrid');
        if (!statsGrid) return;

        const statsData = [
            {
                icon: '🌱',
                value: this.stats.total_plants || 0,
                label: 'Toplam Bitki',
                color: 'var(--primary-color)'
            },
            {
                icon: '📦',
                value: this.stats.total_orders || 0,
                label: 'Toplam Sipariş',
                color: 'var(--info-color)'
            },
            {
                icon: '⏳',
                value: this.stats.pending_orders || 0,
                label: 'Bekleyen Siparişler',
                color: 'var(--warning-color)'
            },
            {
                icon: '⚠️',
                value: this.stats.low_stock || 0,
                label: 'Düşük Stok Öğeleri',
                color: 'var(--danger-color)'
            },
            {
                icon: '💰',
                value: `$${(this.stats.total_revenue || 0).toFixed(2)}`,
                label: 'Toplam Gelir',
                color: 'var(--success-color)'
            }
        ];

        const statsHTML = statsData.map((stat, index) => `
            <div class="stat-card" style="animation-delay: ${index * 0.1}s">
                <div class="stat-icon" style="background: ${stat.color}">
                    ${stat.icon}
                </div>
                <div class="stat-content">
                    <div class="stat-value" data-target="${typeof stat.value === 'string' ? stat.value : stat.value}">
                        ${stat.value}
                    </div>
                    <div class="stat-label">${stat.label}</div>
                </div>
            </div>
        `).join('');

        statsGrid.innerHTML = statsHTML;

        // Animate numbers
        this.animateStats();
    }

    animateStats() {
        const statValues = document.querySelectorAll('.stat-value');
        
        statValues.forEach((element, index) => {
            setTimeout(() => {
                const target = element.getAttribute('data-target');
                
                if (!target.startsWith('$')) {
                    this.animateNumber(element, 0, parseInt(target) || 0, 1000);
                } else {
                    // For revenue, animate the number part
                    const number = parseFloat(target.replace('$', ''));
                    this.animateRevenue(element, 0, number, 1000);
                }
            }, index * 200);
        });
    }

    animateNumber(element, start, end, duration) {
        const increment = (end - start) / (duration / 16);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= end) {
                current = end;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current);
        }, 16);
    }

    animateRevenue(element, start, end, duration) {
        const increment = (end - start) / (duration / 16);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= end) {
                current = end;
                clearInterval(timer);
            }
            element.textContent = `$${current.toFixed(2)}`;
        }, 16);
    }

    renderRecentOrders() {
        const tableBody = document.getElementById('recentOrdersTable');
        if (!tableBody) return;

        if (this.recentOrders.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: var(--secondary-color); padding: 2rem;">
                        Son sipariş bulunamadı
                    </td>
                </tr>
            `;
            return;
        }

        const ordersHTML = this.recentOrders.map(order => `
            <tr>
                <td>
                    <strong>${order.order_number}</strong>
                </td>
                <td>
                    <div>
                        <strong>${order.customer_name}</strong><br>
                        <small style="color: var(--secondary-color)">${order.customer_email}</small>
                    </div>
                </td>
                <td>
                    <strong>$${parseFloat(order.total).toFixed(2)}</strong>
                </td>
                <td>
                    <span class="status-badge status-${order.status}">
                        ${this.formatStatus(order.status)}
                    </span>
                </td>
                <td>
                    <small>${this.formatDate(order.created_at)}</small>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-sm btn-primary" onclick="adminDashboard.viewOrder('${order.id}')">
                            Görüntüle
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        tableBody.innerHTML = ordersHTML;

        // Add status badge styles
        this.addStatusStyles();
    }

    renderLowStock() {
        const lowStockSection = document.getElementById('lowStockSection');
        const lowStockItems = document.getElementById('lowStockItems');
        
        if (!lowStockItems || this.lowStockItems.length === 0) {
            if (lowStockSection) {
                lowStockSection.style.display = 'none';
            }
            return;
        }

        lowStockSection.style.display = 'block';

        const itemsHTML = this.lowStockItems.map(item => `
            <div class="low-stock-item">
                <div class="stock-info">
                    <img src="${item.image_url || '/images/placeholder-plant.svg'}" 
                         alt="${item.name}" class="stock-image"
                         onerror="this.style.display=\"none\"">
                    <div class="stock-details">
                        <h4>${item.name}</h4>
                        <p>Stokta sadece ${item.stock_quantity} adet kaldı</p>
                    </div>
                </div>
                <div class="stock-actions">
                    <button class="btn btn-sm btn-primary" onclick="adminDashboard.restockItem(${item.id})">
                        Stok Ekle
                    </button>
                </div>
            </div>
        `).join('');

        lowStockItems.innerHTML = itemsHTML;
    }

    renderRecentActivity() {
        const activityTimeline = document.getElementById('activityTimeline');
        if (!activityTimeline) return;

        const activityHTML = this.recentActivity.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">${activity.icon}</div>
                <div class="activity-content">
                    <div class="activity-title">${activity.title}</div>
                    <div class="activity-description">${activity.description}</div>
                </div>
                <div class="activity-time">${activity.time}</div>
            </div>
        `).join('');

        activityTimeline.innerHTML = activityHTML;
    }

    addStatusStyles() {
        if (document.getElementById('status-styles')) return;

        const style = document.createElement('style');
        style.id = 'status-styles';
        style.textContent = `
            .status-badge {
                padding: 0.25rem 0.75rem;
                border-radius: 15px;
                font-size: 0.8rem;
                font-weight: 500;
                text-transform: uppercase;
            }
            
            .status-pending {
                background: rgba(243, 156, 18, 0.2);
                color: var(--warning-color);
            }
            
            .status-confirmed {
                background: rgba(52, 152, 219, 0.2);
                color: var(--info-color);
            }
            
            .status-preparing {
                background: rgba(155, 89, 182, 0.2);
                color: #9b59b6;
            }
            
            .status-ready {
                background: rgba(39, 174, 96, 0.2);
                color: var(--success-color);
            }
            
            .status-delivered {
                background: rgba(46, 204, 113, 0.2);
                color: #2ecc71;
            }
            
            .status-cancelled {
                background: rgba(231, 76, 60, 0.2);
                color: var(--danger-color);
            }
            
            .table-actions {
                display: flex;
                gap: 0.5rem;
            }
        `;
        document.head.appendChild(style);
    }

    formatStatus(status) {
        const statusMap = {
            'pending': 'Bekliyor',
            'confirmed': 'Onaylandı',
            'preparing': 'Hazırlanıyor',
            'ready': 'Hazır',
            'delivered': 'Teslim Edildi',
            'cancelled': 'İptal Edildi'
        };
        return statusMap[status] || status;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            const minutes = Math.floor(diffInHours * 60);
            return `${minutes} dk önce`;
        } else if (diffInHours < 24) {
            const hours = Math.floor(diffInHours);
            return `${hours}s önce`;
        } else {
            return date.toLocaleDateString();
        }
    }

    async refreshData() {
        const refreshBtn = document.querySelector('[onclick="adminDashboard.refreshData()"]');
        if (refreshBtn) {
            refreshBtn.innerHTML = '🔄 Yenileniyor...';
            refreshBtn.disabled = true;
        }

        try {
            await this.loadDashboard();
            this.showToast('Ana sayfa başarıyla yenilendi', 'success');
        } catch (error) {
            this.showToast('Ana sayfa yenilenemedi', 'error');
        } finally {
            if (refreshBtn) {
                refreshBtn.innerHTML = '🔄 Yenile';
                refreshBtn.disabled = false;
            }
        }
    }

    startAutoRefresh() {
        // Refresh dashboard every 10 minutes (less aggressive)
        this.refreshInterval = setInterval(() => {
            console.log('Auto-refreshing dashboard data...');
            this.loadDashboard();
        }, 10 * 60 * 1000);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    viewOrder(orderId) {
        window.location.href = `/admin/orders.html?id=${orderId}`;
    }

    viewPendingOrders() {
        window.location.href = `/admin/orders.html?status=pending`;
    }

    restockItem(plantId) {
        window.location.href = `/admin/plants.html?edit=${plantId}`;
    }

    showLoading() {
        const loading = document.getElementById('dashboardLoading');
        const content = document.getElementById('dashboardContent');
        const error = document.getElementById('dashboardError');

        if (loading) loading.style.display = 'flex';
        if (content) content.style.display = 'none';
        if (error) error.style.display = 'none';
    }

    hideLoading() {
        const loading = document.getElementById('dashboardLoading');
        const content = document.getElementById('dashboardContent');

        if (loading) loading.style.display = 'none';
        if (content) content.style.display = 'block';
    }

    showError() {
        const loading = document.getElementById('dashboardLoading');
        const content = document.getElementById('dashboardContent');
        const error = document.getElementById('dashboardError');

        if (loading) loading.style.display = 'none';
        if (content) content.style.display = 'none';
        if (error) error.style.display = 'block';
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        const colors = {
            success: '#27ae60',
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db'
        };

        toast.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${colors[type]};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideInRight 0.3s ease, slideOutRight 0.3s ease 2.5s forwards;
            max-width: 300px;
        `;

        // Add animation styles if not present
        if (!document.getElementById('toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(toast);

        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.adminDashboard) {
        window.adminDashboard.stopAutoRefresh();
    }
});

// Handle responsive sidebar
window.addEventListener('resize', () => {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    
    if (window.innerWidth <= 768) {
        sidebar?.classList.add('mobile-hidden');
        mainContent?.classList.remove('expanded');
    } else {
        sidebar?.classList.remove('mobile-hidden');
        // Restore collapsed state on desktop
        const isCollapsed = localStorage.getItem('sidebar_collapsed') === 'true';
        if (isCollapsed) {
            sidebar?.classList.add('collapsed');
            mainContent?.classList.add('expanded');
        }
    }
});