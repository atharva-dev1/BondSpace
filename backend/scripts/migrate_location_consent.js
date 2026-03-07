require('dotenv').config();
const { query, pool } = require('../src/config/database');

async function migrate() {
    console.log('🚀 Starting migration...');
    try {
        await query(`
            ALTER TABLE couples 
            ADD COLUMN IF NOT EXISTS location_sharing_user1 BOOLEAN DEFAULT TRUE;
            
            ALTER TABLE couples 
            ADD COLUMN IF NOT EXISTS location_sharing_user2 BOOLEAN DEFAULT TRUE;
        `);
        console.log('✅ Columns added successfully to "couples" table.');
    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        await pool.end();
        console.log('👋 Database connection closed.');
    }
}

migrate();
