module.exports = async (pool) => {
    await pool.query(`
        ALTER TABLE couples 
        ADD COLUMN IF NOT EXISTS location_sharing_user1 BOOLEAN DEFAULT TRUE;
        
        ALTER TABLE couples 
        ADD COLUMN IF NOT EXISTS location_sharing_user2 BOOLEAN DEFAULT TRUE;
    `);
};
