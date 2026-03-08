module.exports = async (pool) => {
    try {
        await pool.query(`
            ALTER TABLE love_letters 
            ADD COLUMN IF NOT EXISTS nonce TEXT,
            ADD COLUMN IF NOT EXISTS media_url TEXT;
        `);
        console.log('✅ Time Capsule (Letters) table updated with nonce and media_url');
    } catch (err) {
        console.error('Time Capsule migration failed:', err.message);
    }
};
