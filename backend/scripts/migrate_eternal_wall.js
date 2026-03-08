module.exports = async (pool) => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS eternal_wall_elements (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                bond_id UUID REFERENCES couples(id) ON DELETE CASCADE,
                user_id UUID REFERENCES users(id) ON DELETE SET NULL,
                type VARCHAR(20) NOT NULL, -- 'path', 'text', 'image', 'sticker'
                data JSONB NOT NULL,
                z_index INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_wall_bond ON eternal_wall_elements(bond_id);
        `);
        console.log('✅ Eternal Wall table created/verified');
    } catch (err) {
        console.error('Eternal Wall migration failed:', err.message);
    }
};
