const { query } = require('../src/config/database');

async function migrateGamification(pool) {
    const q = pool ? (text, params) => pool.query(text, params) : query;
    console.log('🎮 Migrating Gamification (Phase 20)...');

    try {
        // 1. Daily Challenges Table
        await q(`
            CREATE TABLE IF NOT EXISTS daily_challenges (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                title VARCHAR(100) NOT NULL,
                description TEXT,
                task_type VARCHAR(50) NOT NULL, -- 'chat', 'game', 'wall', 'letter', 'photo'
                target_count INTEGER DEFAULT 1,
                points_reward INTEGER DEFAULT 20,
                xp_reward INTEGER DEFAULT 20,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        // 2. User Challenges Progress
        await q(`
            CREATE TABLE IF NOT EXISTS user_challenges (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                challenge_id UUID NOT NULL REFERENCES daily_challenges(id) ON DELETE CASCADE,
                current_count INTEGER DEFAULT 0,
                is_completed BOOLEAN DEFAULT FALSE,
                completed_at TIMESTAMP,
                reset_at DATE DEFAULT CURRENT_DATE,
                UNIQUE(user_id, challenge_id, reset_at)
            );
        `);

        // 3. Achievements Table
        await q(`
            CREATE TABLE IF NOT EXISTS achievements (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                icon_url TEXT,
                category VARCHAR(50), -- 'social', 'loyalty', 'activity'
                points_reward INTEGER DEFAULT 100,
                requirement_type VARCHAR(50), 
                requirement_value INTEGER
            );
        `);

        // 4. User Achievements (Badges)
        await q(`
            CREATE TABLE IF NOT EXISTS user_achievements (
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
                unlocked_at TIMESTAMP DEFAULT NOW(),
                PRIMARY KEY (user_id, achievement_id)
            );
        `);

        // 5. Seed Initial Data
        const challenges = [
            ['Chatterbox', 'Send 5 messages to your partner', 'chat', 5, 20, 20],
            ['Game Night', 'Play any game together', 'game', 1, 50, 50],
            ['Artist Spirit', 'Add 1 doodle to the Eternal Wall', 'wall', 1, 30, 30],
            ['Time Traveller', 'Seal 1 Time Capsule letter', 'letter', 1, 100, 100],
            ['Memory Keeper', 'Upload 1 photo to gallery', 'photo', 1, 40, 40]
        ];

        for (const [title, desc, type, target, pts, xp] of challenges) {
            await q(
                `INSERT INTO daily_challenges (title, description, task_type, target_count, points_reward, xp_reward)
                 VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING`,
                [title, desc, type, target, pts, xp]
            );
        }

        const achievements = [
            ['Old Souls', 'Stay bonded for more than 7 days', 'loyalty', 500, 'bonded_days', 7],
            ['Chat Master', 'Send 1000 messages in total', 'social', 1000, 'total_messages', 1000],
            ['Adventurers', 'Plan 5 dates with AI Advisor', 'activity', 300, 'planned_dates', 5]
        ];

        for (const [name, desc, cat, pts, reqT, reqV] of achievements) {
            await q(
                `INSERT INTO achievements (name, description, category, points_reward, requirement_type, requirement_value)
                 VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING`,
                [name, desc, cat, pts, reqT, reqV]
            );
        }

        console.log('✅ Gamification tables and seeds ready.');
    } catch (err) {
        console.error('❌ Gamification migration failed:', err.message);
        throw err;
    }
}

module.exports = migrateGamification;
