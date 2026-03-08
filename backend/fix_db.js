require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('render.com') || process.env.DATABASE_URL.includes('supabase.co') || process.env.DATABASE_URL.includes('neon.tech') ? { rejectUnauthorized: false } : false
});

async function run() {
    try {
        console.log('Connecting to DB...');

        await pool.query('ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_message_type_check;');
        console.log('Old constraint dropped.');

        await pool.query("ALTER TABLE messages ADD CONSTRAINT messages_message_type_check CHECK (message_type IN ('text', 'voice', 'image', 'video', 'reaction', 'pinned', 'sticker'));");
        console.log('New constraint added.');

    } catch (err) {
        console.error('Error applying fix:', err);
    } finally {
        await pool.end();
        console.log('Done.');
        process.exit(0);
    }
}
run();
