// Admin Categories Management JavaScript

class CategoriesManager {
    constructor() {
        this.categories = [];
        this.filteredCategories = [];
        this.plants = [];
        this.currentCategoryId = null;
        this.deleteCategoryId = null;
        this.searchTimeout = null;
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
        this.setupFormValidation();
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
            const categoryModal = document.getElementById('categoryModal');
            const deleteModal = document.getElementById('deleteModal');
            
            if (e.target === categoryModal) {
                this.closeModal();
            }
            if (e.target === deleteModal) {
                this.closeDeleteModal();
            }
        });

        // Setup form submission
        const categoryForm = document.getElementById('categoryForm');
        categoryForm.addEventListener('submit', (e) => this.handleSaveCategory(e));
    }

    setupFormValidation() {
        const inputs = document.querySelectorAll('.form-input, .form-textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => {
                this.clearError(input);
                if (input.name === 'name') {
                    this.generateSlug();
                }
            });
        });
    }

    setupEventListeners() {
        // Any additional event listeners can be added here
    }

    async loadData() {
        this.showLoading();
        try {
            await Promise.all([
                this.loadCategories(),
                this.loadPlants()
            ]);
            this.renderCategories();
            this.renderStats();
        } catch (error) {
            console.error('Error loading data:', error);
            this.showToast('Veri yüklenemedi', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async loadCategories() {
        try {
            const response = await adminAuth.authenticatedFetch('/api/categories');
            const data = await response.json();
            
            if (data.success) {
                this.categories = data.categories || [];
                this.filteredCategories = [...this.categories];
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            this.categories = [];
            this.filteredCategories = [];
        }
    }

    async loadPlants() {
        try {
            const response = await adminAuth.authenticatedFetch('/api/plants');
            const data = await response.json();
            
            if (data.success) {
                this.plants = data.plants || [];
            }
        } catch (error) {
            console.error('Error loading plants:', error);
            this.plants = [];
        }
    }

    renderStats() {
        const totalCategories = this.categories.length;
        const activeCategories = this.categories.filter(cat => cat.is_active).length;
        const categorizedPlants = this.plants.filter(plant => plant.category_id).length;
        const avgPlantsPerCategory = totalCategories > 0 ? 
            Math.round(categorizedPlants / totalCategories) : 0;

        document.getElementById('totalCategories').textContent = totalCategories;
        document.getElementById('activeCategories').textContent = activeCategories;
        document.getElementById('categorizedPlants').textContent = categorizedPlants;
        document.getElementById('avgPlantsPerCategory').textContent = avgPlantsPerCategory;
    }

    renderCategories() {
        this.renderCategoriesGrid();
    }

    renderCategoriesGrid() {
        const grid = document.getElementById('categoriesGrid');
        const emptyState = document.getElementById('emptyState');

        if (this.filteredCategories.length === 0) {
            grid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        grid.style.display = 'grid';

        const categoriesHTML = this.filteredCategories.map(category => {
            const plantsInCategory = this.plants.filter(plant => plant.category_id === category.id);
            const plantsCount = plantsInCategory.length;
            const activePlantsCount = plantsInCategory.filter(plant => plant.status === 'available').length;
            
            return `
                <div class="category-card" data-category-id="${category.id}">
                    <div class="category-header">
                        <h3 class="category-title">${category.name}</h3>
                        <div class="category-meta">
                            <div class="category-status">
                                <span class="status-dot ${category.is_active ? '' : 'inactive'}"></span>
                                ${category.is_active ? 'Aktif' : 'Pasif'}
                            </div>
                            <span>Order: ${category.display_order || 0}</span>
                        </div>
                    </div>
                    <div class="category-body">
                        <p class="category-description">
                            ${category.description || 'Açıklama belirtilmemiş'}
                        </p>
                        
                        <div class="category-stats">
                            <div class="stat-item">
                                <div class="stat-number">${plantsCount}</div>
                                <div class="stat-text">Toplam Bitki</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-number">${activePlantsCount}</div>
                                <div class="stat-text">Aktif Bitki</div>
                            </div>
                        </div>
                        
                        <div class="category-actions">
                            <button class="btn btn-sm btn-primary" onclick="categoriesManager.openEditModal(${JSON.stringify(category).replace(/"/g, '&quot;')})">
                                ✏️ Düzenle
                            </button>
                            <button class="btn btn-sm btn-secondary" onclick="window.location.href='/admin/plants.html?category=${category.id}'">
                                🌱 Bitkileri Gör
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="categoriesManager.openDeleteModal(${category.id}, '${category.name}', ${plantsCount})">
                                🗑️ Sil
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Use safe HTML insertion
        grid.innerHTML = '';  // Clear existing content
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = categoriesHTML;
        while (tempDiv.firstChild) {
            grid.appendChild(tempDiv.firstChild);
        }
    }

    handleSearch(query) {
        clearTimeout(this.searchTimeout);
        
        this.searchTimeout = setTimeout(() => {
            this.applySearch(query);
        }, 300);
    }

    applySearch(query) {
        if (!query.trim()) {
            this.filteredCategories = [...this.categories];
        } else {
            const searchTerm = query.toLowerCase();
            this.filteredCategories = this.categories.filter(category => 
                category.name.toLowerCase().includes(searchTerm) ||
                (category.description && category.description.toLowerCase().includes(searchTerm)) ||
                (category.slug && category.slug.toLowerCase().includes(searchTerm))
            );
        }
        
        this.renderCategories();
    }

    clearSearch() {
        document.getElementById('searchInput').value = '';
        this.filteredCategories = [...this.categories];
        this.renderCategories();
    }

    openAddModal() {
        this.currentCategoryId = null;
        document.getElementById('modalTitle').textContent = 'Yeni Kategori Ekle';
        document.getElementById('categoryForm').reset();
        document.getElementById('categoryActive').checked = true;
        this.clearAllErrors();
        document.getElementById('categoryModal').classList.add('show');
        document.getElementById('categoryModal').style.display = 'flex';
    }

    openEditModal(category) {
        this.currentCategoryId = category.id;
        document.getElementById('modalTitle').textContent = 'Kategoriyi Düzenle';
        this.populateForm(category);
        this.clearAllErrors();
        document.getElementById('categoryModal').classList.add('show');
        document.getElementById('categoryModal').style.display = 'flex';
    }

    populateForm(category) {
        document.getElementById('categoryId').value = category.id;
        document.getElementById('categoryName').value = category.name;
        document.getElementById('categoryDescription').value = category.description || '';
        document.getElementById('categorySlug').value = category.slug || '';
        document.getElementById('categoryOrder').value = category.display_order || 0;
        document.getElementById('categoryActive').checked = category.is_active;
    }

    closeModal() {
        document.getElementById('categoryModal').classList.remove('show');
        document.getElementById('categoryModal').style.display = 'none';
        this.clearAllErrors();
        document.getElementById('categoryForm').reset();
    }

    openDeleteModal(categoryId, categoryName, plantsCount) {
        this.deleteCategoryId = categoryId;
        
        const deleteItem = document.getElementById('deleteItem');
        const deleteWarning = document.getElementById('deleteWarning');
        
        // Safely set content without innerHTML
        deleteItem.innerHTML = '';
        const categoryInfo = document.createElement('div');
        categoryInfo.className = 'category-info';
        const strong = document.createElement('strong');
        strong.textContent = categoryName;
        const p = document.createElement('p');
        p.textContent = `Bu kategoride ${plantsCount} bitki`;
        categoryInfo.appendChild(strong);
        categoryInfo.appendChild(p);
        deleteItem.appendChild(categoryInfo);

        if (plantsCount > 0) {
            // Safely set warning without innerHTML
            deleteWarning.innerHTML = '';
            const warningStrong = document.createElement('strong');
            warningStrong.textContent = 'Uyarı:';
            const warningText = document.createTextNode(` Bu kategori ${plantsCount} bitki içeriyor. Bu kategoriyi silmek tüm bitkilerden kategori atamasını kaldıracaktır, ancak bitkilerin kendileri silinmeyecektir.`);
            deleteWarning.appendChild(warningStrong);
            deleteWarning.appendChild(warningText);
            deleteWarning.style.display = 'block';
        } else {
            deleteWarning.style.display = 'none';
        }

        document.getElementById('deleteModal').classList.add('show');
        document.getElementById('deleteModal').style.display = 'flex';
    }

    closeDeleteModal() {
        document.getElementById('deleteModal').classList.remove('show');
        document.getElementById('deleteModal').style.display = 'none';
        this.deleteCategoryId = null;
    }

    async handleSaveCategory(e) {
        e.preventDefault();
        
        if (!this.validateForm()) {
            this.showToast('Lütfen formdaki hataları düzeltin', 'error');
            return;
        }

        this.setLoadingState(true);

        try {
            const form = document.getElementById('categoryForm');
            
            const categoryData = {
                name: form.name.value.trim(),
                description: form.description.value.trim(),
                slug: form.slug.value.trim() || this.slugify(form.name.value.trim()),
                display_order: parseInt(form.display_order.value) || 0,
                is_active: form.is_active.checked
            };

            const url = this.currentCategoryId ? 
                `/api/categories/${this.currentCategoryId}` : 
                '/api/categories';
            const method = this.currentCategoryId ? 'PUT' : 'POST';

            const response = await adminAuth.authenticatedFetch(url, {
                method: method,
                body: JSON.stringify(categoryData),
                headers: {
                    'Authorization': `Bearer ${adminAuth.token}`,
                    'x-auth-token': adminAuth.token,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.showToast(
                    this.currentCategoryId ? 'Kategori başarıyla güncellendi!' : 'Kategori başarıyla oluşturuldu!', 
                    'success'
                );
                this.closeModal();
                await this.loadData();
            } else {
                throw new Error(data.message || 'Kategori kaydedilemedi');
            }

        } catch (error) {
            console.error('Error saving category:', error);
            this.showToast(error.message || 'Kategori kaydedilemedi', 'error');
        } finally {
            this.setLoadingState(false);
        }
    }

    async confirmDelete() {
        if (!this.deleteCategoryId) return;

        this.setDeleteLoadingState(true);

        try {
            const response = await adminAuth.authenticatedFetch(`/api/categories/${this.deleteCategoryId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.showToast('Kategori başarıyla silindi!', 'success');
                this.closeDeleteModal();
                await this.loadData();
            } else {
                throw new Error(data.message || 'Kategori silinemedi');
            }

        } catch (error) {
            console.error('Error deleting category:', error);
            this.showToast(error.message || 'Kategori silinemedi', 'error');
        } finally {
            this.setDeleteLoadingState(false);
        }
    }

    generateSlug() {
        const nameInput = document.getElementById('categoryName');
        const slugInput = document.getElementById('categorySlug');
        
        if (nameInput.value && !slugInput.value) {
            slugInput.value = this.slugify(nameInput.value);
        }
    }

    slugify(text) {
        return text.toString().toLowerCase()
            .replace(/\s+/g, '-')           // Replace spaces with -
            .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
            .replace(/\-\-+/g, '-')         // Replace multiple - with single -
            .replace(/^-+/, '')             // Trim - from start of text
            .replace(/-+$/, '');            // Trim - from end of text
    }

    validateForm() {
        const name = document.getElementById('categoryName');
        const slug = document.getElementById('categorySlug');
        const order = document.getElementById('categoryOrder');

        let isValid = true;

        if (!this.validateField(name)) isValid = false;
        if (!this.validateField(slug)) isValid = false;
        if (!this.validateField(order)) isValid = false;

        return isValid;
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        switch (field.name) {
            case 'name':
                if (!value) {
                    isValid = false;
                    errorMessage = 'Kategori adı gereklidir';
                } else if (value.length < 2) {
                    isValid = false;
                    errorMessage = 'Kategori adı en az 2 karakter olmalıdır';
                } else if (value.length > 100) {
                    isValid = false;
                    errorMessage = 'Kategori adı 100 karakterden az olmalıdır';
                }
                break;
            case 'slug':
                if (value && !/^[a-z0-9-]+$/.test(value)) {
                    isValid = false;
                    errorMessage = 'Kısaltma yalnızca küçük harfler, sayılar ve tireler içerebilir';
                } else if (value && value.length > 100) {
                    isValid = false;
                    errorMessage = 'Kısaltma 100 karakterden az olmalıdır';
                }
                break;
            case 'display_order':
                if (value && (isNaN(value) || parseInt(value) < 0)) {
                    isValid = false;
                    errorMessage = 'Görüntüleme sırası negatif olmayan bir sayı olmalıdır';
                }
                break;
        }

        if (isValid) {
            this.clearError(field);
        } else {
            this.showError(field, errorMessage);
        }

        return isValid;
    }

    showError(field, message) {
        field.classList.add('error');
        const errorElement = document.getElementById(field.name + 'Error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }

    clearError(field) {
        field.classList.remove('error');
        const errorElement = document.getElementById(field.name + 'Error');
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.classList.remove('show');
        }
    }

    clearAllErrors() {
        document.querySelectorAll('.form-error').forEach(error => {
            error.textContent = '';
            error.classList.remove('show');
        });
        document.querySelectorAll('.form-input, .form-textarea').forEach(input => {
            input.classList.remove('error');
        });
    }

    async refreshData() {
        await this.loadData();
        this.showToast('Veriler başarıyla yenilendi', 'success');
    }

    setLoadingState(loading) {
        const btn = document.getElementById('saveBtn');
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

    setDeleteLoadingState(loading) {
        const btn = document.getElementById('deleteBtn');
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
        const loading = document.getElementById('categoriesLoading');
        if (loading) loading.style.display = 'block';
    }

    hideLoading() {
        const loading = document.getElementById('categoriesLoading');
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

// Initialize categories manager
document.addEventListener('DOMContentLoaded', () => {
    window.categoriesManager = new CategoriesManager();
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