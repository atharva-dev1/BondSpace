require('dotenv').config();
const { query } = require('./src/config/database');

async function checkSchema() {
    try {
        const res = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'love_letters'
        `);
        console.log('Columns in love_letters:');
        res.rows.forEach(row => {
            console.log(`- ${row.column_name} (${row.data_type})`);
        });
    } catch (err) {
        console.error('Error checking schema:', err.message);
    } finally {
        process.exit();
    }
}

checkSchema();
