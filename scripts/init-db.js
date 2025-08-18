const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

const dbPath = path.join(__dirname, '..', process.env.DB_PATH || './database/florist.db');

function initDatabase() {
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Error opening database:', err);
            return;
        }
        console.log('Connected to SQLite database');
    });

    const tables = [
        `CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'admin',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        `CREATE TABLE IF NOT EXISTS store_profile (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            store_name TEXT NOT NULL,
            tagline TEXT,
            description TEXT,
            email TEXT,
            phone TEXT,
            address TEXT,
            hours TEXT,
            delivery_info TEXT,
            social_media TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        `CREATE TABLE IF NOT EXISTS plants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            scientific_name TEXT,
            category TEXT NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            sale_price DECIMAL(10,2),
            stock_quantity INTEGER DEFAULT 0,
            description TEXT,
            care_instructions TEXT,
            light_requirements TEXT,
            water_needs TEXT,
            pet_friendly BOOLEAN DEFAULT 0,
            size TEXT,
            growth_rate TEXT,
            image_url TEXT,
            gallery_images TEXT,
            featured BOOLEAN DEFAULT 0,
            status TEXT DEFAULT 'available',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        `CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            image_url TEXT,
            order_index INTEGER DEFAULT 0
        )`,
        
        `CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_number TEXT UNIQUE NOT NULL,
            customer_name TEXT NOT NULL,
            customer_email TEXT NOT NULL,
            customer_phone TEXT NOT NULL,
            delivery_address TEXT,
            delivery_type TEXT,
            order_items TEXT NOT NULL,
            subtotal DECIMAL(10,2) NOT NULL,
            delivery_fee DECIMAL(10,2),
            total DECIMAL(10,2) NOT NULL,
            status TEXT DEFAULT 'pending',
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        `CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            plant_id INTEGER NOT NULL,
            customer_name TEXT NOT NULL,
            rating INTEGER NOT NULL,
            comment TEXT,
            approved BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (plant_id) REFERENCES plants(id)
        )`,
        
        `CREATE TABLE IF NOT EXISTS stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            label TEXT NOT NULL,
            value TEXT NOT NULL,
            order_index INTEGER DEFAULT 0
        )`
    ];

    db.serialize(() => {
        tables.forEach(sql => {
            db.run(sql, (err) => {
                if (err) {
                    console.error('Error creating table:', err);
                } else {
                    console.log('Table created successfully');
                }
            });
        });

        const hashedPassword = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);
        
        db.run(`INSERT OR REPLACE INTO users (username, password, role) VALUES (?, ?, ?)`,
            [process.env.ADMIN_USERNAME || 'admin', hashedPassword, 'admin'],
            function(err) {
                if (err) {
                    console.error('Error creating admin user:', err);
                } else {
                    console.log('Admin user created/updated');
                }
            }
        );

        db.run(`INSERT OR REPLACE INTO store_profile (id, store_name, tagline, description, email, phone, address, hours, delivery_info) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'Bloom & Blossom Florist',
                'Where Nature Meets Beauty',
                'Welcome to our enchanting world of flowers and plants. We specialize in creating stunning arrangements and providing healthy, beautiful plants for your home and garden.',
                'info@bloomandblossom.com',
                '+1 (555) 123-4567',
                '123 Garden Street, Flower City, FC 12345',
                'Mon-Sat: 8:00 AM - 7:00 PM, Sun: 10:00 AM - 5:00 PM',
                'Free delivery within 5 miles. Same-day delivery available for orders placed before 2 PM.'
            ],
            function(err) {
                if (err) {
                    console.error('Error creating store profile:', err);
                } else {
                    console.log('Store profile created/updated');
                }
            }
        );

        const defaultCategories = [
            ['Indoor Plants', 'Perfect plants for your home interior', '', 1],
            ['Outdoor Plants', 'Beautiful plants for gardens and patios', '', 2],
            ['Flowering Plants', 'Colorful blooming plants', '', 3],
            ['Succulents', 'Low-maintenance water-storing plants', '', 4],
            ['Herbs & Vegetables', 'Grow your own fresh herbs and vegetables', '', 5],
            ['Trees & Shrubs', 'Larger plants for landscaping', '', 6]
        ];

        defaultCategories.forEach(([name, description, image_url, order_index]) => {
            db.run(`INSERT OR IGNORE INTO categories (name, description, image_url, order_index) VALUES (?, ?, ?, ?)`,
                [name, description, image_url, order_index],
                function(err) {
                    if (err) {
                        console.error('Error creating category:', err);
                    } else if (this.changes > 0) {
                        console.log(`Category "${name}" created`);
                    }
                }
            );
        });

        const samplePlants = [
            {
                name: 'Snake Plant',
                scientific_name: 'Sansevieria trifasciata',
                category: 'Indoor Plants',
                price: 29.99,
                stock_quantity: 15,
                description: 'A hardy indoor plant that purifies air and requires minimal care.',
                care_instructions: 'Water sparingly, allow soil to dry between waterings.',
                light_requirements: 'Low to bright indirect light',
                water_needs: 'Low',
                pet_friendly: 0,
                size: 'Medium',
                growth_rate: 'Slow',
                featured: 1,
                status: 'available'
            },
            {
                name: 'Fiddle Leaf Fig',
                scientific_name: 'Ficus lyrata',
                category: 'Indoor Plants',
                price: 79.99,
                sale_price: 69.99,
                stock_quantity: 8,
                description: 'A stunning statement plant with large, glossy leaves.',
                care_instructions: 'Bright indirect light, water when topsoil is dry.',
                light_requirements: 'Bright indirect light',
                water_needs: 'Medium',
                pet_friendly: 0,
                size: 'Large',
                growth_rate: 'Medium',
                featured: 1,
                status: 'available'
            },
            {
                name: 'Lavender',
                scientific_name: 'Lavandula angustifolia',
                category: 'Flowering Plants',
                price: 18.99,
                stock_quantity: 25,
                description: 'Fragrant purple flowers, perfect for aromatherapy and cooking.',
                care_instructions: 'Full sun, well-draining soil, prune after flowering.',
                light_requirements: 'Full sun',
                water_needs: 'Low',
                pet_friendly: 1,
                size: 'Small',
                growth_rate: 'Medium',
                featured: 1,
                status: 'available'
            }
        ];

        samplePlants.forEach(plant => {
            db.run(`INSERT OR IGNORE INTO plants (name, scientific_name, category, price, sale_price, stock_quantity, description, care_instructions, light_requirements, water_needs, pet_friendly, size, growth_rate, featured, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [plant.name, plant.scientific_name, plant.category, plant.price, plant.sale_price, plant.stock_quantity, plant.description, plant.care_instructions, plant.light_requirements, plant.water_needs, plant.pet_friendly, plant.size, plant.growth_rate, plant.featured, plant.status],
                function(err) {
                    if (err) {
                        console.error('Error creating plant:', err);
                    } else if (this.changes > 0) {
                        console.log(`Plant "${plant.name}" created`);
                    }
                }
            );
        });
    });

    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database initialization completed');
        }
    });
}

if (require.main === module) {
    initDatabase();
}

module.exports = { initDatabase };