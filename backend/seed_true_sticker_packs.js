require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('render.com') || process.env.DATABASE_URL.includes('supabase.co') || process.env.DATABASE_URL.includes('neon.tech') ? { rejectUnauthorized: false } : false
});

// The previous items to delete
const oldNamesToRemove = [
    'Cat Face Sticker', 'Zzz Sticker', 'Dog Face Sticker', 'Sparkles Sticker',
    'Bunny Face Sticker', 'Two Hearts Sticker', 'Sparkling Heart', 'Love Letter',
    'Kiss Mark', 'Red Heart', 'Pizza Slice', 'Clinking Glasses', 'Coffee Cup',
    'Sunrise', 'Strawberry', 'Fire', 'Hot Face', 'Devil Face',
    'Diamond Ring', 'Crown', 'Neon Rose Sticker', 'Lo-fi Beats Sticker'
];

// The new sticker packs
const stickerPacks = [
    ['Animal Kingdom Pack', 'A collection of cute animal faces.', 100, 'sticker_pack', JSON.stringify(['🐱', '🐶', '🐰', '🐼', '🦊', '🐨', '🐯', '🦁']), 'common'],
    ['True Emotion Pack', 'Express your deepest feelings.', 150, 'sticker_pack', JSON.stringify(['💖', '💌', '💋', '❤️', '🔥', '🥺', '😭', '🥰', '😍', '💕', '💞', '💓']), 'rare'],
    ['Foodie & Dates', 'For those hungry moments.', 120, 'sticker_pack', JSON.stringify(['🍕', '🥂', '☕', '🌅', '🍓', '🍔', '🍟', '🍣', '🍩', '🍹', '🍿', '🍧']), 'common'],
    ['Spicy & Naughty', 'When things get heated!', 250, 'sticker_pack', JSON.stringify(['🔥', '🥵', '😈', '🫦', '💦', '🌶️', '🍑', '🍆']), 'epic'],
    ['Royal Premium Box', 'Flex your digital wealth.', 600, 'sticker_pack', JSON.stringify(['💍', '👑', '💎', '💸', '✨', '🏆', '🥇', '🥂', '🍾']), 'legendary']
];

async function run() {
    try {
        console.log('Connecting to DB to add True Sticker Packs...');

        // 1. Delete the old individual stickers
        for (const name of oldNamesToRemove) {
            await pool.query('DELETE FROM store_items WHERE name = $1', [name]);
        }
        console.log(`Deleted old individual stickers.`);

        // 2. Add the true sticker packs
        for (const [name, desc, price, type, media, rarity] of stickerPacks) {
            await pool.query(
                `INSERT INTO store_items (name, description, price, type, media_url, rarity)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (name) DO UPDATE SET media_url = $5, price = $3, type = $4`,
                [name, desc, price, type, media, rarity]
            );
        }
        console.log(`✅ Inserted 5 NEW True Sticker Packs!`);

    } catch (err) {
        console.error('Error adding true sticker packs:', err);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

run();
