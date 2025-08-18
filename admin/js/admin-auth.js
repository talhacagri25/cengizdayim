// Admin authentication JavaScript with enhanced animations

class AdminAuth {
    constructor() {
        this.apiBaseURL = window.location.origin;
        this.token = localStorage.getItem('admin_token');
        this.init();
    }

    init() {
        const currentPath = window.location.pathname;
        const isLoginPage = currentPath === '/admin/' || currentPath === '/admin/index.html';
        const isAdminPage = currentPath.startsWith('/admin/') && !isLoginPage;

        // Check if already logged in and on login page
        if (this.token && isLoginPage) {
            this.verifyTokenAndRedirect();
            return;
        }

        // Check if accessing protected admin pages without token
        if (!this.token && isAdminPage) {
            this.redirectToLogin();
            return;
        }

        // Setup login form if on login page
        if (isLoginPage) {
            this.setupLoginForm();
            this.setupAnimations();
        }
    }

    async verifyTokenAndRedirect() {
        try {
            const response = await fetch(`${this.apiBaseURL}/api/verify-token`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'x-auth-token': this.token
                }
            });

            if (response.ok) {
                // Token is valid, redirect to dashboard
                window.location.href = '/admin/dashboard.html';
            } else {
                // Token is invalid, remove it and stay on login
                localStorage.removeItem('admin_token');
                this.token = null;
            }
        } catch (error) {
            console.error('Token verification failed:', error);
            localStorage.removeItem('admin_token');
            this.token = null;
        }
    }

    redirectToLogin() {
        window.location.href = '/admin/';
    }

    setupLoginForm() {
        const form = document.getElementById('loginForm');
        const passwordToggle = document.getElementById('passwordToggle');

        if (form) {
            form.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (passwordToggle) {
            passwordToggle.addEventListener('click', () => this.togglePassword());
        }

        // Setup real-time validation
        const inputs = document.querySelectorAll('.form-input');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearError(input));
            input.addEventListener('focus', () => this.handleInputFocus(input));
        });

        // Setup remember me
        const rememberMe = document.getElementById('rememberMe');
        if (rememberMe) {
            const remembered = localStorage.getItem('remember_username');
            if (remembered) {
                document.getElementById('username').value = remembered;
                rememberMe.checked = true;
            }
        }
    }

    setupAnimations() {
        // Animate particles on mouse move
        document.addEventListener('mousemove', (e) => {
            this.animateParticles(e);
        });

        // Add input focus animations
        const inputs = document.querySelectorAll('.form-input');
        inputs.forEach(input => {
            input.addEventListener('focus', (e) => {
                this.createInputRipple(e.target);
            });
        });

        // Animate security items
        this.animateSecurityItems();
    }

    animateParticles(e) {
        const particles = document.querySelectorAll('.particle');
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;

        particles.forEach((particle, index) => {
            const speed = (index + 1) * 0.5;
            const x = (mouseX - 0.5) * speed * 10;
            const y = (mouseY - 0.5) * speed * 10;
            
            particle.style.transform = `translate(${x}px, ${y}px)`;
        });
    }

    createInputRipple(input) {
        const ripple = input.parentElement.querySelector('.input-ripple');
        if (ripple) {
            ripple.style.transform = 'translate(-50%, -50%) scale(0)';
            setTimeout(() => {
                ripple.style.transform = 'translate(-50%, -50%) scale(1)';
            }, 50);
        }
    }

    animateSecurityItems() {
        const items = document.querySelectorAll('.security-item');
        items.forEach((item, index) => {
            setTimeout(() => {
                item.style.animation = `securityFadeIn 0.6s ease-out forwards`;
            }, index * 200);
        });
    }

    validateField(input) {
        const value = input.value.trim();
        let isValid = true;
        let errorMessage = '';

        switch (input.name) {
            case 'username':
                if (!value) {
                    isValid = false;
                    errorMessage = 'Username is required';
                } else if (value.length < 3) {
                    isValid = false;
                    errorMessage = 'Username must be at least 3 characters';
                }
                break;
            case 'password':
                if (!value) {
                    isValid = false;
                    errorMessage = 'Password is required';
                } else if (value.length < 6) {
                    isValid = false;
                    errorMessage = 'Password must be at least 6 characters';
                }
                break;
        }

        if (isValid) {
            this.clearError(input);
        } else {
            this.showError(input, errorMessage);
        }

        return isValid;
    }

    showError(input, message) {
        input.classList.add('error');
        const errorElement = document.getElementById(input.name + 'Error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }

    clearError(input) {
        input.classList.remove('error');
        const errorElement = document.getElementById(input.name + 'Error');
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.classList.remove('show');
        }
    }

    handleInputFocus(input) {
        // Add focus animation to label
        const label = input.parentElement.previousElementSibling;
        if (label && label.classList.contains('form-label')) {
            label.style.color = 'var(--primary-color)';
        }
        
        // Clear error on focus
        this.clearError(input);
    }

    togglePassword() {
        const passwordInput = document.getElementById('password');
        const toggleBtn = document.getElementById('passwordToggle');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleBtn.textContent = '🙈';
        } else {
            passwordInput.type = 'password';
            toggleBtn.textContent = '👁️';
        }

        // Add toggle animation
        toggleBtn.style.transform = 'scale(0.8)';
        setTimeout(() => {
            toggleBtn.style.transform = 'scale(1)';
        }, 100);
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        const username = formData.get('username').trim();
        const password = formData.get('password');
        const rememberMe = formData.get('rememberMe');

        // Validate inputs
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        
        let isValid = true;
        
        if (!this.validateField(usernameInput)) isValid = false;
        if (!this.validateField(passwordInput)) isValid = false;

        if (!isValid) {
            this.showLoginStatus('Please fix the errors above', 'error');
            return;
        }

        // Show loading state
        this.setLoadingState(true);

        try {
            const response = await fetch(`${this.apiBaseURL}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    password
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Store token
                localStorage.setItem('admin_token', data.token);
                
                // Store user info
                localStorage.setItem('admin_user', JSON.stringify(data.user));

                // Handle remember me
                if (rememberMe) {
                    localStorage.setItem('remember_username', username);
                } else {
                    localStorage.removeItem('remember_username');
                }

                this.showLoginStatus('Login successful! Redirecting...', 'success');
                
                // Show loading overlay
                this.showLoadingOverlay();

                // Redirect after animation
                setTimeout(() => {
                    window.location.href = '/admin/dashboard.html';
                }, 1500);

            } else {
                throw new Error(data.message || 'Login failed');
            }

        } catch (error) {
            console.error('Login error:', error);
            this.showLoginStatus(error.message || 'Login failed. Please try again.', 'error');
            this.setLoadingState(false);
            
            // Shake the form
            this.shakeForm();
        }
    }

    setLoadingState(loading) {
        const btn = document.getElementById('loginBtn');
        const btnText = btn.querySelector('.btn-text');
        const btnLoader = btn.querySelector('.btn-loader');

        if (loading) {
            btn.classList.add('loading');
            btn.disabled = true;
            btnText.style.opacity = '0';
            btnLoader.style.opacity = '1';
        } else {
            btn.classList.remove('loading');
            btn.disabled = false;
            btnText.style.opacity = '1';
            btnLoader.style.opacity = '0';
        }
    }

    showLoginStatus(message, type) {
        const statusElement = document.getElementById('loginStatus');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `login-status ${type} show`;
            
            // Auto hide after 5 seconds
            setTimeout(() => {
                statusElement.classList.remove('show');
            }, 5000);
        }
    }

    shakeForm() {
        const card = document.querySelector('.login-card');
        if (card) {
            card.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
                card.style.animation = '';
            }, 500);
        }
    }

    showLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.add('show');
        }
    }

    // Method to logout (used in other admin pages)
    logout() {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/admin/';
    }

    // Method to get current user (used in other admin pages)
    getCurrentUser() {
        try {
            const userStr = localStorage.getItem('admin_user');
            return userStr ? JSON.parse(userStr) : null;
        } catch (error) {
            return null;
        }
    }

    // Method to get auth headers (used in other admin pages)
    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'x-auth-token': this.token,
            'Content-Type': 'application/json'
        };
    }

    // Method to make authenticated requests (used in other admin pages)
    async authenticatedFetch(url, options = {}) {
        if (!this.token) {
            this.redirectToLogin();
            return;
        }

        // Don't set Content-Type for FormData - let browser set it with boundary
        const isFormData = options.body instanceof FormData;
        
        const defaultHeaders = {
            'Authorization': `Bearer ${this.token}`,
            'x-auth-token': this.token
        };
        
        if (!isFormData) {
            defaultHeaders['Content-Type'] = 'application/json';
        }

        const defaultOptions = {
            headers: defaultHeaders
        };

        const config = { ...defaultOptions, ...options };
        
        // Merge headers properly (but don't override Content-Type for FormData)
        if (options.headers) {
            config.headers = { ...defaultOptions.headers, ...options.headers };
            if (isFormData && config.headers['Content-Type']) {
                delete config.headers['Content-Type'];
            }
        }

        try {
            const response = await fetch(`${this.apiBaseURL}${url}`, config);
            
            // Check if token is invalid
            if (response.status === 401) {
                this.logout();
                return;
            }

            return response;
        } catch (error) {
            console.error('Authenticated request failed:', error);
            throw error;
        }
    }
}

// Add additional CSS for animations
const additionalStyles = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
    
    @keyframes securityFadeIn {
        0% {
            opacity: 0;
            transform: translateY(20px);
        }
        100% {
            opacity: 0.9;
            transform: translateY(0);
        }
    }
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Initialize admin auth
const adminAuth = new AdminAuth();

// Export for use in other admin pages
window.adminAuth = adminAuth;