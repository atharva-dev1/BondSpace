/**
 * Unified Production Setup Script
 * Sets up schema, runs migrations, and seeds in correct order.
 */
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const logger = require('../src/lib/logger');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Force SSL for external connections (like Render)
});

async function setup() {
    logger.info('Starting production database setup...');

    try {
        // 1. Run Schema
        const schema = fs.readFileSync(path.join(__dirname, '../src/db/schema.sql'), 'utf8');
        logger.info('Creating tables...');
        await pool.query(schema);

        // 2. Run Location Consent Migration
        logger.info('Running location consent migration...');
        const migrateConsent = require('./migrate_location_consent_logic');
        await migrateConsent(pool);

        // 3. Run Anonymous Chat Migration
        logger.info('Running anonymous chat migration...');
        const migrateChat = require('./migrate_anonymous_chat_logic');
        await migrateChat(pool);

        // 4. Run Phase 4 & 5 Migration (Store/Planner)
        logger.info('Running phase 4 & 5 migrations...');
        const migratePhase45 = require('./migrate_phase_4_5_logic');
        await migratePhase45(pool);

        // 4.5. Run User Profile Fields Migration
        logger.info('Running user profile fields migration...');
        const migrateUserProfile = require('./migrate_user_profile_fields');
        await migrateUserProfile(pool);

        // 4.6. Run Mood Sync Fields Migration
        logger.info('Running mood sync fields migration...');
        const migrateMood = require('./migrate_mood_fields');
        await migrateMood(pool);

        // 4.7. Run Eternal Wall Migration
        logger.info('Running eternal wall migration...');
        const migrateEternalWall = require('./migrate_eternal_wall');
        await migrateEternalWall(pool);

        // 4.8. Run Time Capsule Migration
        logger.info('Running time capsule migration...');
        const migrateTimeCapsule = require('./migrate_time_capsule');
        await migrateTimeCapsule(pool);

        // 4.9. Run Gamification Migration
        logger.info('Running gamification migration...');
        const migrateGamification = require('./migrate_gamification');
        await migrateGamification(pool);

        // 5. Seed Games
        logger.info('Seeding 20+ games...');
        const seedGames = require('./seed_games_20_logic');
        await seedGames(pool);

        logger.info('🚀 Production Database Setup Complete!');
    } catch (err) {
        logger.error('Database setup failed:', err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Wrappers for existing scripts to make them importable
// (I will refactor them next to be callable by this script)
setup();
