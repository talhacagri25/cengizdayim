// Admin Orders Management JavaScript

class OrdersManager {
    constructor() {
        this.orders = [];
        this.filteredOrders = [];
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.currentOrderId = null;
        this.searchTimeout = null;
        this.stats = {};
        this.init();
    }

    init() {
        // Check authentication
        if (!adminAuth.token) {
            adminAuth.redirectToLogin();
            return;
        }

        this.setupUI();
        this.loadData();
        this.setupEventListeners();
    }

    setupUI() {
        this.setupSidebar();
        this.setupUserMenu();
        this.setupModals();
    }

    setupSidebar() {
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');

        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
                mainContent.classList.toggle('expanded');
                localStorage.setItem('sidebar_collapsed', sidebar.classList.contains('collapsed'));
            });
        }

        // Restore sidebar state
        const isCollapsed = localStorage.getItem('sidebar_collapsed') === 'true';
        if (isCollapsed) {
            sidebar.classList.add('collapsed');
            mainContent.classList.add('expanded');
        }
    }

    setupUserMenu() {
        const userAvatar = document.getElementById('userAvatar');
        const userDropdown = document.getElementById('userDropdown');
        
        const user = adminAuth.getCurrentUser();
        if (user && userAvatar) {
            userAvatar.textContent = user.username.charAt(0).toUpperCase();
        }

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

    setupModals() {
        // Setup modal close on outside click
        document.addEventListener('click', (e) => {
            const orderModal = document.getElementById('orderModal');
            const statusModal = document.getElementById('statusModal');
            
            if (e.target === orderModal) {
                this.closeOrderModal();
            }
            if (e.target === statusModal) {
                this.closeStatusModal();
            }
        });
    }

    setupEventListeners() {
        // URL parameters handling
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('id');
        const status = urlParams.get('status');
        
        if (orderId) {
            setTimeout(() => {
                const order = this.orders.find(o => o.id == orderId);
                if (order) {
                    this.viewOrderDetails(order);
                }
            }, 1000);
        }
        
        if (status) {
            document.getElementById('statusFilter').value = status;
            setTimeout(() => {
                this.handleFilter();
            }, 500);
        }
    }

    async loadData() {
        this.showLoading();
        try {
            await Promise.all([
                this.loadOrders(),
                this.loadStats()
            ]);
            this.renderOrders();
            this.renderStats();
        } catch (error) {
            console.error('Error loading data:', error);
            this.showToast('Veri yüklenemedi', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async loadOrders() {
        try {
            const response = await adminAuth.authenticatedFetch('/api/orders');
            const data = await response.json();
            
            if (data.success) {
                this.orders = data.orders || [];
                this.filteredOrders = [...this.orders];
            }
        } catch (error) {
            console.error('Error loading orders:', error);
            this.orders = [];
            this.filteredOrders = [];
        }
    }

    async loadStats() {
        try {
            const response = await adminAuth.authenticatedFetch('/api/dashboard/stats');
            const data = await response.json();
            
            if (data.success) {
                this.stats = data.stats || {};
            }
        } catch (error) {
            console.error('Error loading stats:', error);
            this.stats = {};
        }
    }

    renderStats() {
        const pendingCount = this.orders.filter(o => o.status === 'pending').length;
        const completedCount = this.orders.filter(o => o.status === 'delivered').length;
        const totalRevenue = this.orders
            .filter(o => o.status !== 'cancelled')
            .reduce((sum, order) => sum + parseFloat(order.total || 0), 0);

        document.getElementById('totalOrders').textContent = this.orders.length;
        document.getElementById('pendingOrders').textContent = pendingCount;
        document.getElementById('completedOrders').textContent = completedCount;
        document.getElementById('totalRevenue').textContent = `$${totalRevenue.toFixed(2)}`;
    }

    renderOrders() {
        const totalPages = Math.ceil(this.filteredOrders.length / this.itemsPerPage);
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const ordersToShow = this.filteredOrders.slice(startIndex, endIndex);

        this.renderOrdersTable(ordersToShow);
        this.renderPagination(totalPages);
        this.updatePaginationInfo();
    }

    renderOrdersTable(orders) {
        const tableBody = document.getElementById('ordersTableBody');
        const emptyState = document.getElementById('emptyState');

        if (orders.length === 0) {
            tableBody.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        const ordersHTML = orders.map(order => {
            const orderItems = this.getOrderItemsPreview(order);
            
            return `
                <tr data-order-id="${order.id}">
                    <td>
                        <strong>${order.order_number}</strong>
                    </td>
                    <td>
                        <div class="customer-info">
                            <div class="customer-name">${order.customer_name}</div>
                            <div class="customer-email">${order.customer_email}</div>
                        </div>
                    </td>
                    <td>
                        <div class="order-items-preview">${orderItems}</div>
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
                            <button class="btn btn-sm btn-primary" onclick="ordersManager.viewOrderDetails(${JSON.stringify(order).replace(/"/g, '&quot;')})">
                                Görüntüle
                            </button>
                            ${order.status !== 'delivered' && order.status !== 'cancelled' ? 
                                `<button class="btn btn-sm btn-secondary" onclick="ordersManager.openStatusModal(${order.id}, '${order.status}')">
                                    Güncelle
                                </button>` : 
                                ''
                            }
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        tableBody.innerHTML = ordersHTML;

        // Add status badge styles
        this.addStatusStyles();
    }

    getOrderItemsPreview(order) {
        if (!order.items || order.items.length === 0) {
            return 'Ürün yok';
        }
        
        const itemCount = order.items.length;
        const firstItem = order.items[0];
        
        if (itemCount === 1) {
            return `${firstItem.plant_name} (${firstItem.quantity})`;
        } else {
            return `${firstItem.plant_name} +${itemCount - 1} daha`;
        }
    }

    renderPagination(totalPages) {
        const paginationSection = document.getElementById('paginationSection');
        const paginationControls = document.getElementById('paginationControls');

        if (totalPages <= 1) {
            paginationSection.style.display = 'none';
            return;
        }

        paginationSection.style.display = 'flex';

        let paginationHTML = '';

        // Previous button
        paginationHTML += `
            <button class="page-btn" ${this.currentPage === 1 ? 'disabled' : ''} 
                    onclick="ordersManager.goToPage(${this.currentPage - 1})">
                Önceki
            </button>
        `;

        // Page numbers
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="page-btn ${i === this.currentPage ? 'active' : ''}" 
                        onclick="ordersManager.goToPage(${i})">
                    ${i}
                </button>
            `;
        }

        // Next button
        paginationHTML += `
            <button class="page-btn" ${this.currentPage === totalPages ? 'disabled' : ''} 
                    onclick="ordersManager.goToPage(${this.currentPage + 1})">
                Sonraki
            </button>
        `;

        paginationControls.innerHTML = paginationHTML;
    }

    updatePaginationInfo() {
        const paginationInfo = document.getElementById('paginationInfo');
        const total = this.filteredOrders.length;
        const startIndex = (this.currentPage - 1) * this.itemsPerPage + 1;
        const endIndex = Math.min(this.currentPage * this.itemsPerPage, total);

        paginationInfo.textContent = total > 0 ? 
            `${total} siparişten ${startIndex}-${endIndex} arası gösteriliyor` : 
            '0 siparişten 0 tanesi gösteriliyor';
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderOrders();
    }

    handleSearch(query) {
        clearTimeout(this.searchTimeout);
        
        this.searchTimeout = setTimeout(() => {
            this.applyFilters();
        }, 300);
    }

    handleFilter() {
        this.applyFilters();
    }

    applyFilters() {
        const searchQuery = document.getElementById('searchInput').value.toLowerCase();
        const statusFilter = document.getElementById('statusFilter').value;
        const dateFilter = document.getElementById('dateFilter').value;
        const sortFilter = document.getElementById('sortFilter').value;

        this.filteredOrders = this.orders.filter(order => {
            // Search filter
            const matchesSearch = !searchQuery || 
                order.order_number.toLowerCase().includes(searchQuery) ||
                order.customer_name.toLowerCase().includes(searchQuery) ||
                order.customer_email.toLowerCase().includes(searchQuery);

            // Status filter
            const matchesStatus = !statusFilter || order.status === statusFilter;

            // Date filter
            const matchesDate = this.matchesDateFilter(order.created_at, dateFilter);

            return matchesSearch && matchesStatus && matchesDate;
        });

        // Apply sorting
        this.applySorting(sortFilter);

        this.currentPage = 1; // Reset to first page
        this.renderOrders();
    }

    matchesDateFilter(dateString, filter) {
        if (!filter) return true;
        
        const orderDate = new Date(dateString);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        
        switch (filter) {
            case 'today':
                return orderDate >= today;
            case 'yesterday':
                return orderDate >= yesterday && orderDate < today;
            case 'week':
                const weekAgo = new Date(today);
                weekAgo.setDate(today.getDate() - 7);
                return orderDate >= weekAgo;
            case 'month':
                const monthAgo = new Date(today);
                monthAgo.setMonth(today.getMonth() - 1);
                return orderDate >= monthAgo;
            default:
                return true;
        }
    }

    applySorting(sortFilter) {
        switch (sortFilter) {
            case 'created_at_desc':
                this.filteredOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
            case 'created_at_asc':
                this.filteredOrders.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                break;
            case 'total_desc':
                this.filteredOrders.sort((a, b) => parseFloat(b.total) - parseFloat(a.total));
                break;
            case 'total_asc':
                this.filteredOrders.sort((a, b) => parseFloat(a.total) - parseFloat(b.total));
                break;
        }
    }

    clearFilters() {
        document.getElementById('searchInput').value = '';
        document.getElementById('statusFilter').value = '';
        document.getElementById('dateFilter').value = '';
        document.getElementById('sortFilter').value = 'created_at_desc';
        
        this.filteredOrders = [...this.orders];
        this.applySorting('created_at_desc');
        this.currentPage = 1;
        this.renderOrders();
    }

    viewOrderDetails(order) {
        this.currentOrderId = order.id;
        this.renderOrderDetails(order);
        document.getElementById('orderModal').classList.add('show');
        document.getElementById('orderModal').style.display = 'flex';
    }

    renderOrderDetails(order) {
        const orderDetails = document.getElementById('orderDetails');
        const orderActions = document.getElementById('orderActions');

        // Calculate totals
        const subtotal = order.items ? order.items.reduce((sum, item) => 
            sum + (parseFloat(item.price) * parseInt(item.quantity)), 0) : 0;
        const deliveryFee = parseFloat(order.delivery_fee || 0);
        const total = parseFloat(order.total || 0);

        const detailsHTML = `
            <div class="order-header">
                <div class="order-info-group">
                    <h4>Sipariş Bilgileri</h4>
                    <p><strong>Sipariş No:</strong> ${order.order_number}</p>
                    <p><strong>Tarih:</strong> ${this.formatFullDate(order.created_at)}</p>
                    <p><strong>Durum:</strong> 
                        <span class="status-badge status-${order.status}">
                            ${this.formatStatus(order.status)}
                        </span>
                    </p>
                </div>
                <div class="order-info-group">
                    <h4>Müşteri Bilgileri</h4>
                    <p><strong>Ad:</strong> ${order.customer_name}</p>
                    <p><strong>E-posta:</strong> ${order.customer_email}</p>
                    <p><strong>Telefon:</strong> ${order.customer_phone || 'Belirtilmemiş'}</p>
                </div>
            </div>

            <div class="order-info-group">
                <h4>Teslimat Bilgileri</h4>
                <p><strong>Tür:</strong> ${order.delivery_type === 'pickup' ? 'Mağazadan Alım' : 'Ev Teslimi'}</p>
                ${order.delivery_type === 'delivery' ? `
                    <p><strong>Adres:</strong> ${order.delivery_address}</p>
                    <p><strong>Şehir:</strong> ${order.delivery_city}</p>
                    <p><strong>Posta Kodu:</strong> ${order.delivery_postal}</p>
                ` : ''}
                <p><strong>Tercih Edilen Tarih:</strong> ${this.formatDate(order.preferred_date)}</p>
                ${order.delivery_notes ? `<p><strong>Notlar:</strong> ${order.delivery_notes}</p>` : ''}
            </div>

            <div class="order-items">
                <h4>Sipariş Ürünleri</h4>
                ${order.items ? order.items.map(item => `
                    <div class="order-item">
                        <div class="item-info">
                            <img src="${item.image_url || '/images/placeholder-plant.svg'}" 
                                 alt="${item.plant_name}" class="item-image"
                                 onerror="this.style.display=\"none\"">
                            <div class="item-details">
                                <h5>${item.plant_name}</h5>
                                <p>Adet: ${item.quantity}</p>
                                <p>Fiyat: $${parseFloat(item.price).toFixed(2)} adet</p>
                            </div>
                        </div>
                        <div class="item-price">
                            $${(parseFloat(item.price) * parseInt(item.quantity)).toFixed(2)}
                        </div>
                    </div>
                `).join('') : '<p>Ürün bulunamadı</p>'}
            </div>

            <div class="order-summary">
                <h4>Sipariş Özeti</h4>
                <div class="summary-row">
                    <span>Ara Toplam:</span>
                    <span>$${subtotal.toFixed(2)}</span>
                </div>
                ${deliveryFee > 0 ? `
                    <div class="summary-row">
                        <span>Teslimat Ücreti:</span>
                        <span>$${deliveryFee.toFixed(2)}</span>
                    </div>
                ` : ''}
                <div class="summary-row total">
                    <span>Toplam:</span>
                    <span>$${total.toFixed(2)}</span>
                </div>
            </div>
        `;

        orderDetails.innerHTML = detailsHTML;

        // Add status update actions
        if (order.status !== 'delivered' && order.status !== 'cancelled') {
            orderActions.innerHTML = `
                <button class="btn btn-primary" onclick="ordersManager.openStatusModal(${order.id}, '${order.status}')">
                    Durumu Güncelle
                </button>
            `;
        } else {
            orderActions.innerHTML = '';
        }
    }

    closeOrderModal() {
        document.getElementById('orderModal').classList.remove('show');
        document.getElementById('orderModal').style.display = 'none';
        this.currentOrderId = null;
    }

    openStatusModal(orderId, currentStatus) {
        document.getElementById('statusOrderId').value = orderId;
        document.getElementById('newStatus').value = '';
        document.getElementById('statusNote').value = '';
        
        // Set next logical status based on current status
        const nextStatus = this.getNextStatus(currentStatus);
        if (nextStatus) {
            document.getElementById('newStatus').value = nextStatus;
        }
        
        document.getElementById('statusModal').classList.add('show');
        document.getElementById('statusModal').style.display = 'flex';
    }

    getNextStatus(currentStatus) {
        const statusFlow = {
            'pending': 'confirmed',
            'confirmed': 'preparing',
            'preparing': 'ready',
            'ready': 'delivered'
        };
        return statusFlow[currentStatus] || '';
    }

    closeStatusModal() {
        document.getElementById('statusModal').classList.remove('show');
        document.getElementById('statusModal').style.display = 'none';
    }

    async updateOrderStatus() {
        const orderId = document.getElementById('statusOrderId').value;
        const newStatus = document.getElementById('newStatus').value;
        const statusNote = document.getElementById('statusNote').value;

        if (!newStatus) {
            this.showToast('Lütfen bir durum seçin', 'error');
            return;
        }

        this.setStatusLoadingState(true);

        try {
            const response = await adminAuth.authenticatedFetch(`/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: newStatus,
                    note: statusNote
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.showToast('Sipariş durumu başarıyla güncellendi!', 'success');
                this.closeStatusModal();
                
                // Close order modal if open
                if (this.currentOrderId) {
                    this.closeOrderModal();
                }
                
                await this.loadData();
            } else {
                throw new Error(data.message || 'Sipariş durumu güncellenemedi');
            }

        } catch (error) {
            console.error('Error updating order status:', error);
            this.showToast(error.message || 'Sipariş durumu güncellenemedi', 'error');
        } finally {
            this.setStatusLoadingState(false);
        }
    }

    async refreshData() {
        await this.loadData();
        this.showToast('Veriler başarıyla yenilendi', 'success');
    }

    exportOrders() {
        // Create CSV content
        const headers = ['Sipariş No', 'Müşteri Adı', 'Müşteri E-postası', 'Toplam', 'Durum', 'Tarih'];
        const csvContent = [
            headers.join(','),
            ...this.filteredOrders.map(order => [
                order.order_number,
                `"${order.customer_name}"`,
                order.customer_email,
                order.total,
                order.status,
                this.formatFullDate(order.created_at)
            ].join(','))
        ].join('\n');

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        this.showToast('Siparişler başarıyla dışa aktarıldı', 'success');
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

    formatFullDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
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
                flex-wrap: wrap;
            }
        `;
        document.head.appendChild(style);
    }

    setStatusLoadingState(loading) {
        const btn = document.getElementById('updateStatusBtn');
        const btnText = btn.querySelector('.btn-text');
        const btnLoader = btn.querySelector('.btn-loader');

        if (loading) {
            btn.disabled = true;
            btnText.style.opacity = '0';
            btnLoader.style.display = 'inline-block';
            btnLoader.style.opacity = '1';
        } else {
            btn.disabled = false;
            btnText.style.opacity = '1';
            btnLoader.style.display = 'none';
            btnLoader.style.opacity = '0';
        }
    }

    showLoading() {
        const loading = document.getElementById('ordersLoading');
        if (loading) loading.style.display = 'block';
    }

    hideLoading() {
        const loading = document.getElementById('ordersLoading');
        if (loading) loading.style.display = 'none';
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

// Initialize orders manager
document.addEventListener('DOMContentLoaded', () => {
    window.ordersManager = new OrdersManager();
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
        const isCollapsed = localStorage.getItem('sidebar_collapsed') === 'true';
        if (isCollapsed) {
            sidebar?.classList.add('collapsed');
            mainContent?.classList.add('expanded');
        }
    }
});