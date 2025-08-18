const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const dbPath = path.join(__dirname, '..', process.env.DB_PATH || './database/florist.db');

function updateSchemaForTranslations() {
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Error opening database:', err);
            return;
        }
        console.log('Connected to SQLite database for schema update');
    });

    db.serialize(() => {
        // First, clear existing demo data
        console.log('🗑️  Clearing existing demo data...');
        
        db.run(`DELETE FROM plants`, function(err) {
            if (err) {
                console.error('Error clearing plants:', err);
            } else {
                console.log(`✅ Cleared ${this.changes} existing plants`);
            }
        });

        db.run(`DELETE FROM categories`, function(err) {
            if (err) {
                console.error('Error clearing categories:', err);
            } else {
                console.log(`✅ Cleared ${this.changes} existing categories`);
            }
        });

        // Update store profile to use new company name
        db.run(`UPDATE store_profile SET 
            store_name = 'Hayat Flora',
            tagline = 'Where Nature Meets Beauty',
            description = 'Welcome to our enchanting world of flowers and plants. We specialize in creating stunning arrangements and providing healthy, beautiful plants for your home and garden.',
            email = 'info@hayatflora.com'
            WHERE id = 1`, function(err) {
            if (err) {
                console.error('Error updating store profile:', err);
            } else {
                console.log('✅ Updated store profile with new company name');
            }
        });

        // Add translation columns to plants table
        console.log('🔄 Adding translation columns to plants table...');
        
        const plantTranslationColumns = [
            `ALTER TABLE plants ADD COLUMN name_en TEXT`,
            `ALTER TABLE plants ADD COLUMN name_az TEXT`, 
            `ALTER TABLE plants ADD COLUMN name_ru TEXT`,
            `ALTER TABLE plants ADD COLUMN description_en TEXT`,
            `ALTER TABLE plants ADD COLUMN description_az TEXT`,
            `ALTER TABLE plants ADD COLUMN description_ru TEXT`,
            `ALTER TABLE plants ADD COLUMN care_instructions_en TEXT`,
            `ALTER TABLE plants ADD COLUMN care_instructions_az TEXT`,
            `ALTER TABLE plants ADD COLUMN care_instructions_ru TEXT`,
            `ALTER TABLE plants ADD COLUMN translation_status TEXT DEFAULT 'pending'`,
            `ALTER TABLE plants ADD COLUMN last_translated DATETIME`
        ];

        plantTranslationColumns.forEach(sql => {
            db.run(sql, (err) => {
                if (err && !err.message.includes('duplicate column name')) {
                    console.error('Error adding plant translation column:', err.message);
                } else if (!err) {
                    console.log('✅ Added plant translation column');
                }
            });
        });

        // Add translation columns to categories table
        console.log('🔄 Adding translation columns to categories table...');
        
        const categoryTranslationColumns = [
            `ALTER TABLE categories ADD COLUMN name_en TEXT`,
            `ALTER TABLE categories ADD COLUMN name_az TEXT`,
            `ALTER TABLE categories ADD COLUMN name_ru TEXT`,
            `ALTER TABLE categories ADD COLUMN description_en TEXT`,
            `ALTER TABLE categories ADD COLUMN description_az TEXT`,
            `ALTER TABLE categories ADD COLUMN description_ru TEXT`,
            `ALTER TABLE categories ADD COLUMN translation_status TEXT DEFAULT 'pending'`,
            `ALTER TABLE categories ADD COLUMN last_translated DATETIME`
        ];

        categoryTranslationColumns.forEach(sql => {
            db.run(sql, (err) => {
                if (err && !err.message.includes('duplicate column name')) {
                    console.error('Error adding category translation column:', err.message);
                } else if (!err) {
                    console.log('✅ Added category translation column');
                }
            });
        });

        // Create translations log table to track API usage
        const translationsLogTable = `CREATE TABLE IF NOT EXISTS translation_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entity_type TEXT NOT NULL, -- 'plant' or 'category'
            entity_id INTEGER NOT NULL,
            source_text TEXT NOT NULL,
            target_language TEXT NOT NULL,
            translated_text TEXT NOT NULL,
            character_count INTEGER NOT NULL,
            api_provider TEXT DEFAULT 'google_translate',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`;

        db.run(translationsLogTable, (err) => {
            if (err) {
                console.error('Error creating translation_logs table:', err);
            } else {
                console.log('✅ Created translation_logs table');
            }
        });

        // Create translation settings table
        const translationSettingsTable = `CREATE TABLE IF NOT EXISTS translation_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            google_cloud_project_id TEXT,
            api_key_configured BOOLEAN DEFAULT 0,
            monthly_character_limit INTEGER DEFAULT 500000,
            current_month_usage INTEGER DEFAULT 0,
            usage_reset_date TEXT,
            auto_translate BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`;

        db.run(translationSettingsTable, (err) => {
            if (err) {
                console.error('Error creating translation_settings table:', err);
            } else {
                console.log('✅ Created translation_settings table');
                
                // Insert default settings
                db.run(`INSERT OR IGNORE INTO translation_settings (id, monthly_character_limit, current_month_usage, auto_translate) VALUES (1, 500000, 0, 1)`, (err) => {
                    if (err) {
                        console.error('Error inserting default translation settings:', err);
                    } else {
                        console.log('✅ Inserted default translation settings');
                    }
                });
            }
        });

        console.log('🎉 Database schema updated successfully for multi-language support!');
        console.log('');
        console.log('📝 Next steps:');
        console.log('   1. Add products through admin panel - they will be auto-translated');
        console.log('   2. Set up Google Cloud credentials for production (optional for development)');
        console.log('   3. Monitor translation usage in the translation_logs table');
    });

    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('✅ Database schema update completed');
        }
    });
}

if (require.main === module) {
    updateSchemaForTranslations();
}

module.exports = { updateSchemaForTranslations };