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
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
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
