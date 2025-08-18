const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { authMiddleware, adminOnly } = require('./middleware/auth');
const translationService = require('./services/translationService');

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting configurations
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: { 
        success: false, 
        message: 'Too many login attempts, please try again later.' 
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful requests
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { 
        success: false, 
        message: 'Too many requests, please try again later.' 
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const strictLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // limit each IP to 10 requests per minute for sensitive operations
    message: { 
        success: false, 
        message: 'Too many requests, please try again later.' 
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
app.use(cors());

// Apply general rate limiting to all routes
app.use('/api/', apiLimiter);

// Database connection (needed for router handlers)
const dbPath = path.join(__dirname, process.env.DB_PATH || './database/florist.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
    }
    console.log('Connected to SQLite database');
});

// Create a router for multipart/form-data endpoints BEFORE JSON parsing
const Router = express.Router();

// Configure multer for these routes
const plantUpload = multer({ 
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const uploadPath = path.join(__dirname, 'uploads', 'plants');
            if (!fs.existsSync(uploadPath)) {
                fs.mkdirSync(uploadPath, { recursive: true });
            }
            cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, uniqueSuffix + path.extname(file.originalname));
        }
    })
});

// Plant creation with FormData (before JSON middleware) - handle auth here too
Router.post('/api/plants', (req, res, next) => {
    console.log('Router middleware 1 - headers:', req.headers['content-type']);
    next();
}, plantUpload.single('image'), (req, res, next) => {
    console.log('Router middleware 2 after multer - req.body:', req.body);
    console.log('Router middleware 2 after multer - req.file:', req.file);
    next();
}, authMiddleware, adminOnly, async (req, res) => {
    console.log('Router handler - req.body:', req.body);
    console.log('Router handler - req.file:', req.file);
    
    const {
        name, category_id, price, stock_quantity, status, care_level,
        description, care_instructions
    } = req.body || {};

    if (!name || !category_id || !price) {
        return res.status(400).json({
            success: false,
            message: 'Name, category, and price are required'
        });
    }

    try {
        // Get category name from category_id
        const category = await new Promise((resolve, reject) => {
            db.get('SELECT name FROM categories WHERE id = ?', [category_id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!category) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category'
            });
        }

        // Translate the plant using the translation service
        const translationService = require('./services/translationService');
        const translations = await translationService.translateProduct({
            name: name,
            description: description || '',
            care_instructions: care_instructions || ''
        });

        const image_url = req.file ? `/uploads/plants/${req.file.filename}` : null;

        db.run(
            `INSERT INTO plants (
                name, category, price, stock_quantity, status,
                description, care_instructions, image_url,
                name_en, name_az, name_ru,
                description_en, description_az, description_ru,
                care_instructions_en, care_instructions_az, care_instructions_ru
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name,
                category.name,
                parseFloat(price),
                parseInt(stock_quantity) || 0,
                status || 'available',
                description || '',
                care_instructions || '',
                image_url,
                translations.name.en,
                translations.name.az,
                translations.name.ru,
                translations.description.en,
                translations.description.az,
                translations.description.ru,
                translations.care_instructions.en,
                translations.care_instructions.az,
                translations.care_instructions.ru
            ],
            function(err) {
                if (err) {
                    console.error('Plant creation error:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Error creating plant'
                    });
                }

                res.json({
                    success: true,
                    message: 'Plant created successfully',
                    plant_id: this.lastID
                });
            }
        );
    } catch (error) {
        console.error('Translation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error translating plant'
        });
    }
});

app.use(Router);

// Apply JSON parsing for all other routes
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
app.use('/admin', express.static(path.join(__dirname, 'admin')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));


// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'uploads', 'plants');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});


// Category creation endpoint (JSON version for admin panel)
app.post('/api/categories', authMiddleware, adminOnly, async (req, res) => {
    const { name, description, slug, display_order, is_active } = req.body;

    if (!name) {
        return res.status(400).json({
            success: false,
            message: 'Category name is required'
        });
    }

    try {
        // Translate the category using the translation service
        const translationService = require('./services/translationService');
        const translations = await translationService.translateCategory({
            name: name,
            description: description || ''
        });

        db.run(
            `INSERT INTO categories (
                name, description, image_url, order_index, is_active,
                name_en, name_az, name_ru,
                description_en, description_az, description_ru
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name, 
                description || '', 
                null, // No image for now
                parseInt(display_order) || 0,
                is_active === false ? 0 : 1, // Default to active if not specified
                translations.name.en,
                translations.name.az,
                translations.name.ru,
                translations.description.en,
                translations.description.az,
                translations.description.ru
            ],
            function(err) {
                if (err) {
                    console.error('Category creation error:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Error creating category'
                    });
                }

                res.json({
                    success: true,
                    message: 'Category created successfully',
                    category_id: this.lastID
                });
            }
        );
    } catch (error) {
        console.error('Translation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error translating category'
        });
    }
});

// Authentication Routes
app.post('/api/login', loginLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }

        db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Database error'
                });
            }

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            const token = jwt.sign(
                { 
                    id: user.id, 
                    username: user.username, 
                    role: user.role 
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );

            res.json({
                success: true,
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role
                }
            });
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

app.post('/api/logout', (req, res) => {
    res.json({
        success: true,
        message: 'Logout successful'
    });
});

app.get('/api/verify-token', authMiddleware, (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
});

// Plants Routes
app.get('/api/plants', (req, res) => {
    const { category, featured, limit, offset, search, sort } = req.query;
    let sql = `SELECT 
        plants.*,
        categories.name as category_name 
        FROM plants 
        LEFT JOIN categories ON plants.category = categories.id 
        WHERE plants.status = "available"`;
    let params = [];

    if (category) {
        // Check if category is a number (ID) or string (name)
        if (!isNaN(category)) {
            sql += ' AND plants.category = ?';
            params.push(category);
        } else {
            sql += ' AND categories.name = ?';
            params.push(category);
        }
    }

    if (featured === 'true') {
        sql += ' AND featured = 1';
    }

    if (search) {
        sql += ' AND (name LIKE ? OR description LIKE ? OR scientific_name LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (sort) {
        switch (sort) {
            case 'price_asc':
                sql += ' ORDER BY price ASC';
                break;
            case 'price_desc':
                sql += ' ORDER BY price DESC';
                break;
            case 'name':
                sql += ' ORDER BY name ASC';
                break;
            case 'newest':
                sql += ' ORDER BY created_at DESC';
                break;
            default:
                sql += ' ORDER BY featured DESC, created_at DESC';
        }
    } else {
        sql += ' ORDER BY featured DESC, created_at DESC';
    }

    if (limit) {
        sql += ' LIMIT ?';
        params.push(parseInt(limit));
        
        if (offset) {
            sql += ' OFFSET ?';
            params.push(parseInt(offset));
        }
    }

    db.all(sql, params, (err, plants) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        res.json({
            success: true,
            plants
        });
    });
});

app.get('/api/plants/:id', (req, res) => {
    const plantId = req.params.id;

    db.get('SELECT * FROM plants WHERE id = ? AND status = "available"', [plantId], (err, plant) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        if (!plant) {
            return res.status(404).json({
                success: false,
                message: 'Plant not found'
            });
        }

        db.all('SELECT * FROM reviews WHERE plant_id = ? AND approved = 1 ORDER BY created_at DESC', [plantId], (err, reviews) => {
            if (err) {
                console.error('Error fetching reviews:', err);
                reviews = [];
            }

            res.json({
                success: true,
                plant: {
                    ...plant,
                    reviews
                }
            });
        });
    });
});


// Create new plant
app.post('/api/plants', authMiddleware, adminOnly, upload.single('image'), async (req, res) => {
    const {
        name, scientific_name, category, price, sale_price, stock_quantity,
        description, care_instructions, light_requirements, water_needs,
        pet_friendly, size, growth_rate, gallery_images, featured, status, care_level
    } = req.body;

    // Handle image upload
    let image_url = req.body.image_url || '/images/plants/default.jpg';
    if (req.file) {
        image_url = `/uploads/plants/${req.file.filename}`;
    }

    // Auto-translate plant name and description
    let name_en = name, name_az = name, name_ru = name;
    let description_en = description, description_az = description, description_ru = description;

    try {
        // Translate if translation service is available
        if (global.translationService) {
            const translations = await global.translationService.translatePlantData({
                name, description
            });
            
            name_en = translations.name_en || name;
            name_az = translations.name_az || name;
            name_ru = translations.name_ru || name;
            description_en = translations.description_en || description;
            description_az = translations.description_az || description;
            description_ru = translations.description_ru || description;
        }
    } catch (error) {
        console.log('Translation failed, using original text:', error.message);
    }

    const sql = `INSERT INTO plants (
        name, name_en, name_az, name_ru, scientific_name, category, price, sale_price,
        stock_quantity, description, description_en, description_az, description_ru,
        care_instructions, light_requirements, water_needs, pet_friendly, size,
        growth_rate, image_url, gallery_images, featured, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
        name, name_en, name_az, name_ru, scientific_name || '', category, 
        price, sale_price || null, stock_quantity,
        description, description_en, description_az, description_ru,
        care_instructions || '', light_requirements || '', water_needs || '',
        pet_friendly || 0, size || '', growth_rate || '', image_url,
        gallery_images || '[]', featured || 0, status || 'available'
    ];

    db.run(sql, params, function(err) {
        if (err) {
            console.error('Error creating plant:', err);
            return res.status(500).json({
                success: false,
                message: 'Error creating plant'
            });
        }

        res.json({
            success: true,
            plant: { id: this.lastID, ...req.body, image_url },
            message: 'Plant created successfully'
        });
    });
});

// Update existing plant
app.put('/api/plants/:id', authMiddleware, adminOnly, upload.single('image'), (req, res) => {
    const plantId = req.params.id;
    const {
        name, scientific_name, category, price, sale_price, stock_quantity,
        description, care_instructions, light_requirements, water_needs,
        pet_friendly, size, growth_rate, gallery_images, featured, status
    } = req.body;

    // Handle image upload
    let image_url = req.body.image_url;
    if (req.file) {
        image_url = `/uploads/plants/${req.file.filename}`;
    }

    const sql = `UPDATE plants SET 
        name = ?, scientific_name = ?, category = ?, price = ?, sale_price = ?,
        stock_quantity = ?, description = ?, care_instructions = ?, 
        light_requirements = ?, water_needs = ?, pet_friendly = ?, size = ?,
        growth_rate = ?, image_url = ?, gallery_images = ?, featured = ?, 
        status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`;

    const params = [
        name, scientific_name || '', category, price, sale_price || null, stock_quantity,
        description, care_instructions || '', light_requirements || '', water_needs || '',
        pet_friendly || 0, size || '', growth_rate || '', image_url, gallery_images || '[]', 
        featured || 0, status || 'available', plantId
    ];

    db.run(sql, params, function(err) {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error updating plant'
            });
        }

        if (this.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Plant not found'
            });
        }

        res.json({
            success: true,
            message: 'Plant updated successfully'
        });
    });
});

app.delete('/api/plants/:id', authMiddleware, adminOnly, (req, res) => {
    const plantId = req.params.id;

    db.run('DELETE FROM plants WHERE id = ?', [plantId], function(err) {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error deleting plant'
            });
        }

        if (this.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Plant not found'
            });
        }

        res.json({
            success: true,
            message: 'Plant deleted successfully'
        });
    });
});

// Categories Routes
app.get('/api/categories', (req, res) => {
    // Check if request is from admin (has valid token)
    const token = req.headers['authorization']?.replace('Bearer ', '') || req.headers['x-auth-token'];
    let isAdmin = false;
    
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            isAdmin = decoded.role === 'admin';
        } catch (err) {
            // Invalid token, treat as regular user
        }
    }
    
    // If admin, show all categories; otherwise only show active ones
    const query = isAdmin 
        ? 'SELECT * FROM categories ORDER BY order_index ASC'
        : 'SELECT * FROM categories WHERE is_active = 1 ORDER BY order_index ASC';
    
    db.all(query, (err, categories) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        res.json({
            success: true,
            categories
        });
    });
});

app.put('/api/categories/:id', authMiddleware, adminOnly, (req, res) => {
    const categoryId = req.params.id;
    const { name, description, image_url, order_index, is_active } = req.body;

    db.run(
        'UPDATE categories SET name = ?, description = ?, image_url = ?, order_index = ?, is_active = ? WHERE id = ?',
        [name, description, image_url, order_index, is_active ? 1 : 0, categoryId],
        function(err) {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Error updating category'
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }

            res.json({
                success: true,
                message: 'Category updated successfully'
            });
        }
    );
});

app.delete('/api/categories/:id', authMiddleware, adminOnly, (req, res) => {
    const categoryId = req.params.id;

    db.run('DELETE FROM categories WHERE id = ?', [categoryId], function(err) {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error deleting category'
            });
        }

        if (this.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    });
});

// Orders Routes
app.post('/api/orders', strictLimiter, (req, res) => {
    const {
        customer_name, customer_email, customer_phone, delivery_address,
        delivery_type, order_items, subtotal, delivery_fee, total, notes
    } = req.body;

    if (!customer_name || !customer_email || !customer_phone || !order_items) {
        return res.status(400).json({
            success: false,
            message: 'Required fields missing'
        });
    }

    const orderNumber = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();

    const sql = `INSERT INTO orders (
        order_number, customer_name, customer_email, customer_phone,
        delivery_address, delivery_type, order_items, subtotal, delivery_fee, total, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
        orderNumber, customer_name, customer_email, customer_phone,
        delivery_address, delivery_type, JSON.stringify(order_items),
        subtotal, delivery_fee, total, notes
    ];

    db.run(sql, params, function(err) {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error creating order'
            });
        }

        res.json({
            success: true,
            message: 'Order created successfully',
            order_id: this.lastID,
            order_number: orderNumber
        });
    });
});

app.get('/api/orders', authMiddleware, adminOnly, (req, res) => {
    const { status, limit, offset } = req.query;
    let sql = 'SELECT * FROM orders';
    let params = [];

    if (status) {
        sql += ' WHERE status = ?';
        params.push(status);
    }

    sql += ' ORDER BY created_at DESC';

    if (limit) {
        sql += ' LIMIT ?';
        params.push(parseInt(limit));
        
        if (offset) {
            sql += ' OFFSET ?';
            params.push(parseInt(offset));
        }
    }

    db.all(sql, params, (err, orders) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        const processedOrders = orders.map(order => ({
            ...order,
            order_items: JSON.parse(order.order_items || '[]')
        }));

        res.json({
            success: true,
            orders: processedOrders
        });
    });
});

app.get('/api/orders/:id', (req, res) => {
    const orderId = req.params.id;

    db.get('SELECT * FROM orders WHERE id = ? OR order_number = ?', [orderId, orderId], (err, order) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.json({
            success: true,
            order: {
                ...order,
                order_items: JSON.parse(order.order_items || '[]')
            }
        });
    });
});

// Public Order Tracking Endpoint (Secure - Limited Info)
app.get('/api/orders/track/:orderNumber', (req, res) => {
    const orderNumber = req.params.orderNumber;

    // Only search by order number for security
    db.get('SELECT * FROM orders WHERE order_number = ?', [orderNumber], (err, order) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Parse order items
        let orderItems = [];
        try {
            orderItems = JSON.parse(order.order_items || '[]');
            // Remove sensitive data from items but keep translations
            orderItems = orderItems.map(item => ({
                name: item.name || item.plant_name,
                name_en: item.name_en || item.name,
                name_tr: item.name || item.name,  // name is already Turkish
                name_az: item.name_az || item.name,
                name_ru: item.name_ru || item.name,
                quantity: item.quantity,
                price: item.price,
                image_url: item.image_url
            }));
        } catch (e) {
            orderItems = [];
        }

        // Return limited information for security
        res.json({
            success: true,
            order: {
                order_number: order.order_number,
                status: order.status,
                created_at: order.created_at,
                updated_at: order.updated_at,
                delivery_type: order.delivery_type,
                delivery_address: order.delivery_address ? 
                    order.delivery_address.substring(0, 30) + '...' : null, // Partial address only
                order_items: orderItems,
                subtotal: order.subtotal,
                delivery_fee: order.delivery_fee,
                total: order.total
                // NOT including: customer_phone, customer_email (partially), full address, notes
            }
        });
    });
});

app.put('/api/orders/:id/status', authMiddleware, adminOnly, (req, res) => {
    const orderId = req.params.id;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid status'
        });
    }

    db.run(
        'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, orderId],
        function(err) {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Error updating order status'
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            res.json({
                success: true,
                message: 'Order status updated successfully'
            });
        }
    );
});

// Store Routes
app.get('/api/store', (req, res) => {
    db.get('SELECT * FROM store_profile WHERE id = 1', (err, store) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        res.json({
            success: true,
            store: store || {}
        });
    });
});

app.put('/api/store', authMiddleware, adminOnly, (req, res) => {
    const {
        store_name, tagline, description, email, phone, address,
        hours, delivery_info, social_media
    } = req.body;

    const sql = `UPDATE store_profile SET 
        store_name = ?, tagline = ?, description = ?, email = ?, phone = ?,
        address = ?, hours = ?, delivery_info = ?, social_media = ?, 
        updated_at = CURRENT_TIMESTAMP WHERE id = 1`;

    const params = [
        store_name, tagline, description, email, phone, address,
        hours, delivery_info, social_media
    ];

    db.run(sql, params, function(err) {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error updating store information'
            });
        }

        res.json({
            success: true,
            message: 'Store information updated successfully'
        });
    });
});

// Upload Routes
app.post('/api/upload/:type', authMiddleware, adminOnly, upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const fileUrl = `/uploads/${req.params.type}/${req.file.filename}`;
        
        res.json({
            success: true,
            message: 'File uploaded successfully',
            url: fileUrl,
            filename: req.file.filename
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Upload failed',
            error: error.message
        });
    }
});

app.delete('/api/upload/:filename', authMiddleware, adminOnly, (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);

    fs.unlink(filePath, (err) => {
        if (err) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        res.json({
            success: true,
            message: 'File deleted successfully'
        });
    });
});

// Statistics endpoint for admin dashboard
app.get('/api/dashboard/stats', authMiddleware, adminOnly, (req, res) => {
    const stats = {};

    db.get('SELECT COUNT(*) as total_plants FROM plants WHERE status = "available"', (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        stats.total_plants = result.total_plants;

        db.get('SELECT COUNT(*) as total_orders FROM orders', (err, result) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Database error' });
            }
            stats.total_orders = result.total_orders;

            db.get('SELECT COUNT(*) as pending_orders FROM orders WHERE status = "pending"', (err, result) => {
                if (err) {
                    return res.status(500).json({ success: false, message: 'Database error' });
                }
                stats.pending_orders = result.pending_orders;

                db.get('SELECT COUNT(*) as low_stock FROM plants WHERE stock_quantity <= 5 AND status = "available"', (err, result) => {
                    if (err) {
                        return res.status(500).json({ success: false, message: 'Database error' });
                    }
                    stats.low_stock = result.low_stock;

                    db.get('SELECT SUM(total) as total_revenue FROM orders WHERE status != "cancelled"', (err, result) => {
                        if (err) {
                            return res.status(500).json({ success: false, message: 'Database error' });
                        }
                        stats.total_revenue = result.total_revenue || 0;

                        res.json({
                            success: true,
                            stats
                        });
                    });
                });
            });
        });
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Florist e-commerce server running on port ${PORT}`);
    console.log(`Customer website: http://localhost:${PORT}`);
    console.log(`Admin panel: http://localhost:${PORT}/admin`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down server...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed');
        }
        process.exit(0);
    });
});