// Admin Plants Management JavaScript

class PlantsManager {
    constructor() {
        this.plants = [];
        this.filteredPlants = [];
        this.categories = [];
        this.categoriesMap = {};
        this.currentView = 'grid';
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.currentPlantId = null;
        this.deletePlantId = null;
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
            const plantModal = document.getElementById('plantModal');
            const deleteModal = document.getElementById('deleteModal');
            
            if (e.target === plantModal) {
                this.closeModal();
            }
            if (e.target === deleteModal) {
                this.closeDeleteModal();
            }
        });

        // Setup form submission
        const plantForm = document.getElementById('plantForm');
        plantForm.addEventListener('submit', (e) => this.handleSavePlant(e));
    }

    setupFormValidation() {
        const inputs = document.querySelectorAll('.form-input, .form-select, .form-textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearError(input));
        });
    }

    setupEventListeners() {
        // URL parameters handling for edit mode
        const urlParams = new URLSearchParams(window.location.search);
        const editId = urlParams.get('edit');
        if (editId) {
            setTimeout(() => {
                const plant = this.plants.find(p => p.id == editId);
                if (plant) {
                    this.openEditModal(plant.id);
                }
            }, 1000);
        }
    }

    async loadData() {
        this.showLoading();
        try {
            await Promise.all([
                this.loadPlants(),
                this.loadCategories()
            ]);
            this.renderPlants();
        } catch (error) {
            console.error('Error loading data:', error);
            this.showToast('Veri yüklenemedi', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async loadPlants() {
        try {
            const response = await adminAuth.authenticatedFetch('/api/plants');
            const data = await response.json();
            
            if (data.success) {
                this.plants = data.plants || [];
                this.filteredPlants = [...this.plants];
            }
        } catch (error) {
            console.error('Error loading plants:', error);
            this.plants = [];
            this.filteredPlants = [];
        }
    }

    async loadCategories() {
        try {
            const response = await adminAuth.authenticatedFetch('/api/categories');
            const data = await response.json();
            
            if (data.success) {
                this.categories = data.categories || [];
                // Create categories map for quick lookup
                this.categoriesMap = {};
                this.categories.forEach(cat => {
                    this.categoriesMap[cat.id] = cat.name;
                });
                this.populateCategoryFilters();
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            this.categories = [];
            this.categoriesMap = {};
        }
    }

    populateCategoryFilters() {
        const categoryFilter = document.getElementById('categoryFilter');
        const plantCategory = document.getElementById('plantCategory');
        
        // Clear existing options (except first one)
        if (categoryFilter) {
            const firstOption = categoryFilter.firstElementChild;
            categoryFilter.innerHTML = '';
            categoryFilter.appendChild(firstOption);
        }
        
        if (plantCategory) {
            const firstOption = plantCategory.firstElementChild;
            plantCategory.innerHTML = '';
            plantCategory.appendChild(firstOption);
        }

        this.categories.forEach(category => {
            // Filter dropdown
            if (categoryFilter) {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categoryFilter.appendChild(option);
            }
            
            // Form dropdown
            if (plantCategory) {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                plantCategory.appendChild(option);
            }
        });
    }

    renderPlants() {
        const totalPages = Math.ceil(this.filteredPlants.length / this.itemsPerPage);
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const plantsToShow = this.filteredPlants.slice(startIndex, endIndex);

        if (this.currentView === 'grid') {
            this.renderPlantsGrid(plantsToShow);
        } else {
            this.renderPlantsList(plantsToShow);
        }

        this.renderPagination(totalPages);
        this.updatePaginationInfo();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    escapeJsString(text) {
        if (!text) return '';
        return text.replace(/\\/g, '\\\\')
                   .replace(/'/g, "\\'")
                   .replace(/"/g, '\\"')
                   .replace(/\n/g, '\\n')
                   .replace(/\r/g, '\\r')
                   .replace(/\t/g, '\\t');
    }

    renderPlantsGrid(plants) {
        const grid = document.getElementById('plantsGrid');
        const list = document.getElementById('plantsList');
        const emptyState = document.getElementById('emptyState');

        grid.style.display = 'grid';
        list.style.display = 'none';

        if (plants.length === 0) {
            grid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        const plantsHTML = plants.map(plant => {
            const categoryName = this.categoriesMap[plant.category] || plant.category_name || plant.category || 'Kategori Yok';
            const stockClass = plant.stock_quantity === 0 ? 'stock-out' : 
                              plant.stock_quantity <= 5 ? 'stock-low' : '';
            const escapedName = this.escapeJsString(plant.name);
            const htmlName = this.escapeHtml(plant.name);
            
            return `
                <div class="plant-card" data-plant-id="${plant.id}">
                    <div class="plant-image">
                        <img src="${this.escapeHtml(plant.image_url || '/images/placeholder-plant.svg')}" 
                             alt="${htmlName}" 
                             onerror="this.style.display='none'">
                        <span class="plant-status status-${plant.status}">
                            ${plant.status}
                        </span>
                    </div>
                    <div class="plant-info">
                        <h4 class="plant-name">${htmlName}</h4>
                        <p class="plant-category">${this.escapeHtml(categoryName)}</p>
                        <div class="plant-details">
                            <span class="plant-price">$${parseFloat(plant.price).toFixed(2)}</span>
                            <span class="plant-stock ${stockClass}">
                                Stock: ${plant.stock_quantity}
                            </span>
                        </div>
                        <div class="plant-actions">
                            <button class="btn btn-sm btn-primary" onclick="plantsManager.openEditModal(${plant.id})">
                                ✏️ Düzenle
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="plantsManager.openDeleteModal(${plant.id}, '${escapedName}')">
                                🗑️ Sil
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        grid.innerHTML = plantsHTML;
    }

    renderPlantsList(plants) {
        const grid = document.getElementById('plantsGrid');
        const list = document.getElementById('plantsList');
        const tableBody = document.getElementById('plantsTableBody');
        const emptyState = document.getElementById('emptyState');

        grid.style.display = 'none';
        list.style.display = 'block';

        if (plants.length === 0) {
            list.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        const plantsHTML = plants.map(plant => {
            const categoryName = this.categoriesMap[plant.category] || plant.category_name || plant.category || 'Kategori Yok';
            const stockClass = plant.stock_quantity === 0 ? 'stock-out' : 
                              plant.stock_quantity <= 5 ? 'stock-low' : '';
            const escapedName = this.escapeJsString(plant.name);
            const htmlName = this.escapeHtml(plant.name);
            
            return `
                <tr data-plant-id="${plant.id}">
                    <td>
                        <img src="${this.escapeHtml(plant.image_url || '/images/placeholder-plant.svg')}" 
                             alt="${htmlName}" 
                             style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;"
                             onerror="this.style.display='none'">
                    </td>
                    <td>
                        <strong>${htmlName}</strong>
                    </td>
                    <td>${this.escapeHtml(categoryName)}</td>
                    <td>$${parseFloat(plant.price).toFixed(2)}</td>
                    <td>
                        <span class="${stockClass}">${plant.stock_quantity}</span>
                    </td>
                    <td>
                        <span class="status-badge status-${plant.status}">
                            ${plant.status}
                        </span>
                    </td>
                    <td>
                        <div class="table-actions">
                            <button class="btn btn-sm btn-primary" onclick="plantsManager.openEditModal(${plant.id})">
                                Düzenle
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="plantsManager.openDeleteModal(${plant.id}, '${escapedName}')">
                                Sil
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        tableBody.innerHTML = plantsHTML;
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
                    onclick="plantsManager.goToPage(${this.currentPage - 1})">
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
                        onclick="plantsManager.goToPage(${i})">
                    ${i}
                </button>
            `;
        }

        // Next button
        paginationHTML += `
            <button class="page-btn" ${this.currentPage === totalPages ? 'disabled' : ''} 
                    onclick="plantsManager.goToPage(${this.currentPage + 1})">
                Sonraki
            </button>
        `;

        paginationControls.innerHTML = paginationHTML;
    }

    updatePaginationInfo() {
        const paginationInfo = document.getElementById('paginationInfo');
        const total = this.filteredPlants.length;
        const startIndex = (this.currentPage - 1) * this.itemsPerPage + 1;
        const endIndex = Math.min(this.currentPage * this.itemsPerPage, total);

        paginationInfo.textContent = total > 0 ? 
            `${total} bitkiden ${startIndex}-${endIndex} arası gösteriliyor` : 
            '0 bitkiden 0 tanəsi gösteriliyor';
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderPlants();
    }

    changeView(view) {
        this.currentView = view;
        
        // Update view buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');

        this.renderPlants();
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
        const categoryFilter = document.getElementById('categoryFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;
        const stockFilter = document.getElementById('stockFilter').value;

        this.filteredPlants = this.plants.filter(plant => {
            // Search filter
            const matchesSearch = !searchQuery || 
                plant.name.toLowerCase().includes(searchQuery) ||
                (plant.description && plant.description.toLowerCase().includes(searchQuery));

            // Category filter
            const matchesCategory = !categoryFilter || plant.category_id == categoryFilter;

            // Status filter
            const matchesStatus = !statusFilter || plant.status === statusFilter;

            // Stock filter
            let matchesStock = true;
            if (stockFilter === 'low') {
                matchesStock = plant.stock_quantity <= 5 && plant.stock_quantity > 0;
            } else if (stockFilter === 'normal') {
                matchesStock = plant.stock_quantity > 5;
            } else if (stockFilter === 'out') {
                matchesStock = plant.stock_quantity === 0;
            }

            return matchesSearch && matchesCategory && matchesStatus && matchesStock;
        });

        this.currentPage = 1; // Reset to first page
        this.renderPlants();
    }

    clearFilters() {
        document.getElementById('searchInput').value = '';
        document.getElementById('categoryFilter').value = '';
        document.getElementById('statusFilter').value = '';
        document.getElementById('stockFilter').value = '';
        
        this.filteredPlants = [...this.plants];
        this.currentPage = 1;
        this.renderPlants();
    }

    openAddModal() {
        this.currentPlantId = null;
        document.getElementById('modalTitle').textContent = 'Yeni Bitki Ekle';
        document.getElementById('plantForm').reset();
        this.clearAllErrors();
        this.removeImage();
        document.getElementById('plantModal').classList.add('show');
        document.getElementById('plantModal').style.display = 'flex';
    }

    openEditModal(plantId) {
        const plant = this.plants.find(p => p.id === plantId);
        if (!plant) {
            this.showToast('Bitki bulunamadı', 'error');
            return;
        }
        this.currentPlantId = plant.id;
        document.getElementById('modalTitle').textContent = 'Bitkiyi Düzenle';
        this.populateForm(plant);
        this.clearAllErrors();
        document.getElementById('plantModal').classList.add('show');
        document.getElementById('plantModal').style.display = 'flex';
    }

    populateForm(plant) {
        document.getElementById('plantId').value = plant.id;
        document.getElementById('plantName').value = plant.name;
        document.getElementById('plantCategory').value = plant.category || '';
        document.getElementById('plantPrice').value = plant.price;
        document.getElementById('plantStock').value = plant.stock_quantity;
        document.getElementById('plantStatus').value = plant.status;
        document.getElementById('plantCareLevel').value = plant.care_level || 'Easy';
        document.getElementById('plantDescription').value = plant.description || '';
        document.getElementById('plantCareInstructions').value = plant.care_instructions || '';

        // Show existing image if available
        if (plant.image_url) {
            this.showImagePreview(plant.image_url);
        }
    }

    closeModal() {
        document.getElementById('plantModal').classList.remove('show');
        document.getElementById('plantModal').style.display = 'none';
        this.clearAllErrors();
        document.getElementById('plantForm').reset();
        this.removeImage();
    }

    openDeleteModal(plantId, plantName) {
        this.deletePlantId = plantId;
        const deleteItem = document.getElementById('deleteItem');
        deleteItem.innerHTML = `
            <div class="plant-info">
                <strong>${plantName}</strong>
            </div>
        `;
        document.getElementById('deleteModal').classList.add('show');
        document.getElementById('deleteModal').style.display = 'flex';
    }

    closeDeleteModal() {
        document.getElementById('deleteModal').classList.remove('show');
        document.getElementById('deleteModal').style.display = 'none';
        this.deletePlantId = null;
    }

    async handleSavePlant(e) {
        e.preventDefault();
        
        if (!this.validateForm()) {
            this.showToast('Please fix the errors in the form', 'error');
            return;
        }

        this.setLoadingState(true);

        try {
            const form = document.getElementById('plantForm');
            const formData = new FormData();
            
            // Add form fields to FormData
            formData.append('name', form.name.value.trim());
            formData.append('category', document.getElementById('plantCategory').value);
            formData.append('price', form.price.value);
            formData.append('stock_quantity', form.stock_quantity.value);
            formData.append('status', form.status.value);
            formData.append('care_level', form.care_level.value || '');
            formData.append('description', form.description.value.trim());
            formData.append('care_instructions', form.care_instructions.value.trim());
            formData.append('scientific_name', '');
            formData.append('sale_price', '');
            formData.append('light_requirements', '');
            formData.append('water_needs', '');
            formData.append('pet_friendly', '0');
            formData.append('size', '');
            formData.append('growth_rate', '');
            formData.append('featured', '0');
            formData.append('gallery_images', '[]');
            
            // Add image if uploaded
            const imageFile = form.image?.files?.[0];
            if (imageFile) {
                formData.append('image', imageFile);
            } else {
                formData.append('image_url', '');
            }

            const url = this.currentPlantId ? 
                `/api/plants/${this.currentPlantId}` : 
                '/api/plants';
            const method = this.currentPlantId ? 'PUT' : 'POST';

            const response = await adminAuth.authenticatedFetch(url, {
                method: method,
                body: formData,
                headers: {
                    'Authorization': `Bearer ${adminAuth.token}`,
                    'x-auth-token': adminAuth.token
                    // Don't set Content-Type for FormData - browser will set it with boundary
                }
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.showToast(
                    this.currentPlantId ? 'Bitki başarıyla güncellendi!' : 'Bitki başarıyla oluşturuldu!', 
                    'success'
                );
                this.closeModal();
                await this.loadPlants();
                this.renderPlants();
            } else {
                throw new Error(data.message || 'Bitki kaydedilemedi');
            }

        } catch (error) {
            console.error('Error saving plant:', error);
            this.showToast(error.message || 'Bitki kaydedilemedi', 'error');
        } finally {
            this.setLoadingState(false);
        }
    }

    async confirmDelete() {
        if (!this.deletePlantId) return;

        this.setDeleteLoadingState(true);

        try {
            const response = await adminAuth.authenticatedFetch(`/api/plants/${this.deletePlantId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.showToast('Bitki başarıyla silindi!', 'success');
                this.closeDeleteModal();
                await this.loadPlants();
                this.renderPlants();
            } else {
                throw new Error(data.message || 'Bitki silinemedi');
            }

        } catch (error) {
            console.error('Error deleting plant:', error);
            this.showToast(error.message || 'Bitki silinemedi', 'error');
        } finally {
            this.setDeleteLoadingState(false);
        }
    }

    handleImageUpload(input) {
        const file = input.files[0];
        if (!file) return;

        // Validate file
        if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
            this.showToast('Please select a valid image file (JPG, PNG, WEBP)', 'error');
            input.value = '';
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB
            this.showToast('Image file must be smaller than 5MB', 'error');
            input.value = '';
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            this.showImagePreview(e.target.result);
        };
        reader.readAsDataURL(file);
    }

    showImagePreview(imageSrc) {
        const previewImage = document.getElementById('previewImage');
        const uploadPlaceholder = document.getElementById('uploadPlaceholder');
        const removeImageBtn = document.getElementById('removeImageBtn');

        previewImage.src = imageSrc;
        previewImage.style.display = 'block';
        uploadPlaceholder.style.display = 'none';
        removeImageBtn.style.display = 'inline-block';
    }

    removeImage() {
        const previewImage = document.getElementById('previewImage');
        const uploadPlaceholder = document.getElementById('uploadPlaceholder');
        const removeImageBtn = document.getElementById('removeImageBtn');
        const plantImage = document.getElementById('plantImage');

        previewImage.src = '';
        previewImage.style.display = 'none';
        uploadPlaceholder.style.display = 'flex';
        removeImageBtn.style.display = 'none';
        plantImage.value = '';
    }

    validateForm() {
        const name = document.getElementById('plantName');
        const category = document.getElementById('plantCategory');
        const price = document.getElementById('plantPrice');
        const stock = document.getElementById('plantStock');

        let isValid = true;

        if (!this.validateField(name)) isValid = false;
        if (!this.validateField(category)) isValid = false;
        if (!this.validateField(price)) isValid = false;
        if (!this.validateField(stock)) isValid = false;

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
                    errorMessage = 'Plant name is required';
                } else if (value.length < 2) {
                    isValid = false;
                    errorMessage = 'Plant name must be at least 2 characters';
                }
                break;
            case 'category_id':
                if (!value) {
                    isValid = false;
                    errorMessage = 'Category is required';
                }
                break;
            case 'price':
                if (!value || isNaN(value) || parseFloat(value) < 0) {
                    isValid = false;
                    errorMessage = 'Valid price is required';
                }
                break;
            case 'stock_quantity':
                if (!value || isNaN(value) || parseInt(value) < 0) {
                    isValid = false;
                    errorMessage = 'Valid stock quantity is required';
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
        document.querySelectorAll('.form-input, .form-select').forEach(input => {
            input.classList.remove('error');
        });
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
        const loading = document.getElementById('plantsLoading');
        if (loading) loading.style.display = 'block';
    }

    hideLoading() {
        const loading = document.getElementById('plantsLoading');
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

// Initialize plants manager
document.addEventListener('DOMContentLoaded', () => {
    window.plantsManager = new PlantsManager();
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