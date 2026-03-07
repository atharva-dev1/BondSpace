require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
    try {
        const active = await pool.query("SELECT id, status, game_id FROM game_sessions WHERE status='active'");
        console.log('ACTIVE SESSIONS:', active.rows);

        // check errors in last few mins
        // Let's just create a test request to start a game via axios

    } catch (e) { console.error(e); } finally { pool.end(); }
}
check();
