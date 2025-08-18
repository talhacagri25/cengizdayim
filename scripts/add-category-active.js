const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/florist.db');
const db = new sqlite3.Database(dbPath);

console.log('Adding is_active column to categories table...');

db.serialize(() => {
    // Add is_active column to categories table
    db.run(`ALTER TABLE categories ADD COLUMN is_active INTEGER DEFAULT 1`, (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log('✓ Column is_active already exists');
            } else {
                console.error('Error adding is_active column:', err);
            }
        } else {
            console.log('✓ Added is_active column to categories table');
        }
    });

    // Set all existing categories to active
    db.run(`UPDATE categories SET is_active = 1 WHERE is_active IS NULL`, (err) => {
        if (err) {
            console.error('Error updating existing categories:', err);
        } else {
            console.log('✓ Set all existing categories to active');
        }
    });

    // Show current categories
    db.all('SELECT id, name, is_active FROM categories', (err, rows) => {
        if (err) {
            console.error('Error fetching categories:', err);
        } else {
            console.log('\nCurrent categories:');
            rows.forEach(row => {
                console.log(`- ${row.name} (ID: ${row.id}, Active: ${row.is_active ? 'Yes' : 'No'})`);
            });
        }
    });
});

db.close((err) => {
    if (err) {
        console.error('Error closing database:', err);
    } else {
        console.log('\n✓ Database migration completed');
    }
});