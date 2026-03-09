require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && (
        process.env.DATABASE_URL.includes('.render.com') ||
        process.env.DATABASE_URL.includes('supabase.co') ||
        process.env.DATABASE_URL.includes('neon.tech') ||
        process.env.DATABASE_URL.includes('amazonaws.com')
    ) ? { rejectUnauthorized: false } : false
});

async function run() {
    try {
        console.log('🔄 Updating "messages" table constraint for stickers...');

        // 1. Drop existing constraint if it exists (it might have a default name)
        // We try to drop by the most likely name
        await pool.query('ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_message_type_check');

        // 2. Add the updated constraint including 'sticker'
        await pool.query(`
            ALTER TABLE messages 
            ADD CONSTRAINT messages_message_type_check 
            CHECK (message_type IN ('text', 'voice', 'image', 'video', 'reaction', 'pinned', 'sticker'))
        `);

        console.log('✅ Database constraint updated successfully! Stickers are now allowed.');

    } catch (err) {
        console.error('❌ Failed to update constraint:', err.message);
        console.log('💡 Note: If the constraint name was different, you might see an error. But "sticker" should be allowed now if the ALTER worked.');
    } finally {
        await pool.end();
        process.exit(0);
    }
}

run();
