const { Pool } = require('pg');

// Determine if the URL is an external cloud provider that requires SSL
const isExternalCloud = process.env.DATABASE_URL && (
    process.env.DATABASE_URL.includes('.render.com') ||
    process.env.DATABASE_URL.includes('supabase.co') ||
    process.env.DATABASE_URL.includes('neon.tech') ||
    process.env.DATABASE_URL.includes('amazonaws.com')
);

// Render internal URLs (e.g., dpg-xyz-a) do NOT support SSL. Localhost does NOT support SSL.
const sslConfig = isExternalCloud ? { rejectUnauthorized: false } : false;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: sslConfig,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
    console.log('✅ PostgreSQL connected');
});

pool.on('error', (err) => {
    console.error('❌ PostgreSQL error', err);
    process.exit(-1);
});

const query = (text, params) => pool.query(text, params);
const getClient = () => pool.connect();

module.exports = { query, getClient, pool };
