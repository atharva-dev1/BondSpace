require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    try {
        const pts = await pool.query("SELECT * FROM points");
        // const sess = await pool.query("SELECT * FROM game_sessions");
        const users = await pool.query("SELECT * FROM users");
        const bonds = await pool.query("SELECT * FROM bonds");

        fs.writeFileSync('db_debug2.json', JSON.stringify({
            points: pts.rows,
            // sessions: sess.rows,
            users: users.rows,
            bonds: bonds.rows
        }, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
run();
