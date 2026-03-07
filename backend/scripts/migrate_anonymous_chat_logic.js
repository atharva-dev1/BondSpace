module.exports = async (pool) => {
    // 1. anonymous_chats table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS anonymous_chats (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'ended')),
            created_at TIMESTAMP DEFAULT NOW(),
            ended_at TIMESTAMP
        );
    `);

    // 2. anonymous_messages table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS anonymous_messages (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            chat_id UUID NOT NULL REFERENCES anonymous_chats(id) ON DELETE CASCADE,
            sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            message TEXT NOT NULL,
            nonce TEXT,
            is_encrypted BOOLEAN DEFAULT TRUE,
            timestamp TIMESTAMP DEFAULT NOW()
        );
    `);

    // 3. anonymous_queue table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS anonymous_queue (
            user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            joined_at TIMESTAMP DEFAULT NOW()
        );
    `);
};
