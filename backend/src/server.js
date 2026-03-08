require('dotenv').config();
const http = require('http');
const app = require('./app');
const { initializeSocket } = require('./socket');
const { cleanDisappearingMessages } = require('./routes/messages');
const { startLetterCron } = require('./routes/letters');
const nodeCron = require('node-cron');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.io
const io = initializeSocket(server);

// Start Cron Jobs
// Clean disappearing messages every minute
nodeCron.schedule('* * * * *', () => {
    cleanDisappearingMessages();
});

// Start checking for Love Letters every hour
startLetterCron(io);

const { pool } = require('./config/database');
const migrateUserProfile = require('../scripts/migrate_user_profile_fields');
const migrateMood = require('../scripts/migrate_mood_fields');
const migrateEternalWall = require('../scripts/migrate_eternal_wall');
const migrateTimeCapsule = require('../scripts/migrate_time_capsule');
const migrateGamification = require('../scripts/migrate_gamification');

const express = require('express');
// Auto-run lightweight migrations
(async () => {
    try {
        await migrateUserProfile(pool);
        await migrateMood(pool);
        await migrateEternalWall(pool);
        await migrateTimeCapsule(pool);
        await migrateGamification(pool);
        console.log('✅ All migrations successful');
    } catch (err) {
        console.error('Auto-migration failed', err);
    }
})();

// Start Server
server.listen(PORT, () => {
    console.log(`🚀 BondSpace API running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
});

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    // Graceful shutdown
    server.close(() => process.exit(1));
});
