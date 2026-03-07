const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// GET /api/store - Get all store items and user inventory
const getStoreData = async (req, res) => {
    try {
        const user_id = req.user.id;
        const items = await query('SELECT * FROM store_items ORDER BY price ASC');
        const inventory = await query('SELECT item_id FROM user_inventory WHERE user_id=$1', [user_id]);

        res.json({
            items: items.rows,
            inventory: inventory.rows.map(row => row.item_id)
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch store data' });
    }
};

// POST /api/store/purchase - Buy an item
const purchaseItem = async (req, res) => {
    try {
        const { item_id } = req.body;
        const user_id = req.user.id;

        // 1. Get item and user points
        const itemRes = await query('SELECT * FROM store_items WHERE id=$1', [item_id]);
        if (itemRes.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
        const item = itemRes.rows[0];

        const userRes = await query('SELECT love_xp FROM users WHERE id=$1', [user_id]);
        const userXP = userRes.rows[0].love_xp;

        if (userXP < item.price) {
            return res.status(400).json({ error: 'Not enough Love XP! Play more games to earn points. ❤️' });
        }

        // 2. Add to inventory and deduct points
        await query('BEGIN');
        await query(
            'INSERT INTO user_inventory (user_id, item_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [user_id, item_id]
        );
        await query('UPDATE users SET love_xp = love_xp - $1 WHERE id=$2', [item.price, user_id]);
        await query('COMMIT');

        res.json({ message: `Successfully unlocked ${item.name}! 🔓`, price: item.price });
    } catch (err) {
        await query('ROLLBACK');
        console.error('Purchase error:', err);
        res.status(500).json({ error: 'Purchase failed' });
    }
};

module.exports = { getStoreData, purchaseItem };
