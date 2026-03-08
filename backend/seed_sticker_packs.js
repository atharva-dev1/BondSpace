require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('render.com') || process.env.DATABASE_URL.includes('supabase.co') || process.env.DATABASE_URL.includes('neon.tech') ? { rejectUnauthorized: false } : false
});

const newStickers = [
    // Cute Animals Pack
    ['Sleepy Cat Sticker', 'A cute sleepy kitty.', 60, 'sticker', '🐱💤', 'common'],
    ['Happy Dog Sticker', 'An excited puppy.', 60, 'sticker', '🐶✨', 'common'],
    ['Shy Bunny Sticker', 'A bashful little bunny.', 80, 'sticker', '🐰💕', 'rare'],

    // Romantic Pack
    ['Floating Hearts', 'Hearts bubbling up.', 50, 'sticker', '💖✨', 'common'],
    ['Love Letter Sticker', 'Sealed with a kiss.', 100, 'sticker', '💌💋', 'rare'],
    ['Infinity Love', 'Forever and always.', 150, 'sticker', '♾️❤️', 'epic'],

    // Food & Dates Pack
    ['Pizza Date', 'Let\'s get pizza!', 40, 'sticker', '🍕🥂', 'common'],
    ['Coffee Morning', 'Morning coffee vibes.', 40, 'sticker', '☕🌅', 'common'],
    ['Sweet Treat', 'For the sweet tooth.', 70, 'sticker', '🍰🍓', 'rare'],

    // Spicy/Flirty Pack
    ['Fire Emoji', 'Looking hot!', 90, 'sticker', '🔥🥵', 'rare'],
    ['Devil Smirk', 'Feeling mischievous.', 120, 'sticker', '😈✨', 'epic'],

    // Premium Pack
    ['Diamond Ring', 'Shiny and precious.', 500, 'sticker', '💍✨', 'legendary'],
    ['Crown', 'Royalty vibes.', 400, 'sticker', '👑💖', 'legendary']
];

async function run() {
    try {
        console.log('Connecting to DB to add new stickers...');
        for (const [name, desc, price, type, media, rarity] of newStickers) {
            await pool.query(
                `INSERT INTO store_items (name, description, price, type, media_url, rarity)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (name) DO NOTHING`,
                [name, desc, price, type, media, rarity]
            );
        }
        console.log('✅ 13 New Stickers successfully added to the Love Arena store!');
    } catch (err) {
        console.error('Error adding stickers:', err);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

run();
