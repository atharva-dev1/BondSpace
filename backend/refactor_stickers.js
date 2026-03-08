require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('render.com') || process.env.DATABASE_URL.includes('supabase.co') || process.env.DATABASE_URL.includes('neon.tech') ? { rejectUnauthorized: false } : false
});

// The previous stickers that need to be removed (so users don't have compound emojis)
const oldNamesToRemove = [
    'Sleepy Cat Sticker', 'Happy Dog Sticker', 'Shy Bunny Sticker',
    'Floating Hearts', 'Love Letter Sticker', 'Infinity Love',
    'Pizza Date', 'Coffee Morning', 'Sweet Treat',
    'Fire Emoji', 'Devil Smirk',
    'Diamond Ring', 'Crown'
];

// The new individual stickers
const individualStickers = [
    // Animals
    ['Cat Face Sticker', 'A cute kitty.', 30, 'sticker', '🐱', 'common'],
    ['Zzz Sticker', 'Sleepy vibes.', 30, 'sticker', '💤', 'common'],
    ['Dog Face Sticker', 'A happy puppy.', 30, 'sticker', '🐶', 'common'],
    ['Sparkles Sticker', 'Shiny magical sparkles.', 30, 'sticker', '✨', 'common'],
    ['Bunny Face Sticker', 'A bashful bunny.', 40, 'sticker', '🐰', 'rare'],
    ['Two Hearts Sticker', 'Love is in the air.', 40, 'sticker', '💕', 'rare'],

    // Romance
    ['Sparkling Heart', 'A glowing heart.', 25, 'sticker', '💖', 'common'],
    ['Love Letter', 'A sealed message.', 50, 'sticker', '💌', 'rare'],
    ['Kiss Mark', 'A big kiss.', 50, 'sticker', '💋', 'rare'],
    ['Red Heart', 'Classic love.', 75, 'sticker', '❤️', 'epic'],

    // Food & Dates
    ['Pizza Slice', 'Yummy pizza.', 20, 'sticker', '🍕', 'common'],
    ['Clinking Glasses', 'Cheers!', 20, 'sticker', '🥂', 'common'],
    ['Coffee Cup', 'Hot coffee.', 20, 'sticker', '☕', 'common'],
    ['Sunrise', 'Beautiful morning.', 20, 'sticker', '🌅', 'common'],
    ['Strawberry', 'Sweet strawberry.', 35, 'sticker', '🍓', 'rare'],

    // Spicy
    ['Fire', 'Hot!', 45, 'sticker', '🔥', 'rare'],
    ['Hot Face', 'Sweating.', 45, 'sticker', '🥵', 'rare'],
    ['Devil Face', 'Mischievous.', 60, 'sticker', '😈', 'epic'],

    // Premium
    ['Diamond Ring', 'Precious ring.', 200, 'sticker', '💍', 'legendary'],
    ['Crown', 'Royal vibes.', 200, 'sticker', '👑', 'legendary']
];

async function run() {
    try {
        console.log('Connecting to DB to refactor stickers...');

        // 1. Delete the old compound stickers
        for (const name of oldNamesToRemove) {
            await pool.query('DELETE FROM store_items WHERE name = $1', [name]);
        }
        console.log(`Deleted ${oldNamesToRemove.length} compound stickers.`);

        // 2. Insert the new individual stickers
        for (const [name, desc, price, type, media, rarity] of individualStickers) {
            await pool.query(
                `INSERT INTO store_items (name, description, price, type, media_url, rarity)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (name) DO UPDATE SET media_url = $5, price = $3`,
                [name, desc, price, type, media, rarity]
            );
        }
        console.log(`✅ inserted ${individualStickers.length} NEW individual stickers!`);

    } catch (err) {
        console.error('Error refactoring stickers:', err);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

run();
