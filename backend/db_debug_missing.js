require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    try {
        const users = await pool.query("SELECT id, name, email FROM users");
        const bonds = await pool.query("SELECT * FROM couples");

        fs.writeFileSync('db_debug_missing.json', JSON.stringify({
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
