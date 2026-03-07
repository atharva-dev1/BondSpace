require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    try {
        const res = await pool.query("UPDATE game_sessions SET status='abandoned' WHERE status='active'");
        console.log(`Abandoned ${res.rowCount} stuck active sessions.`);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

run();
