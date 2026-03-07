require('dotenv').config();
const { query, pool } = require('../src/config/database');

async function migrate() {
    console.log('🚀 Starting Phase 4 & 5 migration...');
    try {
        // 1. planned_events table
        await query(`
            CREATE TABLE IF NOT EXISTS planned_events (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
                title VARCHAR(100) NOT NULL,
                description TEXT,
                event_date TIMESTAMP NOT NULL,
                location TEXT,
                theme VARCHAR(50),
                is_completed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log('✅ Table "planned_events" created.');

        // 2. store_items table
        await query(`
            CREATE TABLE IF NOT EXISTS store_items (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(100) NOT NULL,
                description TEXT,
                price INTEGER NOT NULL DEFAULT 0,
                type VARCHAR(50) NOT NULL, -- 'sticker', 'theme', 'badge', 'avatar_frame'
                media_url TEXT,
                rarity VARCHAR(20) DEFAULT 'common',
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(name)
            );
        `);
        console.log('✅ Table "store_items" created.');

        // 3. user_inventory table
        await query(`
            CREATE TABLE IF NOT EXISTS user_inventory (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                item_id UUID NOT NULL REFERENCES store_items(id) ON DELETE CASCADE,
                purchased_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(user_id, item_id)
            );
        `);
        console.log('✅ Table "user_inventory" created.');

        // 4. Seed initial store items
        const initialItems = [
            ['Neon Rose Sticker', 'A glowing rose sticker for your chat.', 50, 'sticker', '🌹', 'common'],
            ['Midnight Theme', 'A sleek dark purple UI theme.', 200, 'theme', '#2D1B69', 'rare'],
            ['Golden Heart Badge', 'A shiny badge for your profile.', 150, 'badge', '💛', 'rare'],
            ['Cyberpunk Frame', 'A neon-lit frame for your avatar.', 300, 'avatar_frame', '💠', 'epic'],
            ['Lo-fi Beats Sticker', 'Cozy vibes for your messages.', 40, 'sticker', '☕', 'common']
        ];

        for (const [name, desc, price, type, media, rarity] of initialItems) {
            await query(
                `INSERT INTO store_items (name, description, price, type, media_url, rarity)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (name) DO NOTHING`,
                [name, desc, price, type, media, rarity]
            );
        }
        console.log('✅ Initial store items seeded.');

    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        await pool.end();
        console.log('👋 Database connection closed.');
    }
}

migrate();
