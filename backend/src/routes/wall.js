const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const protect = require('../middleware/auth');

// Get all elements for the couple's wall
router.get('/', protect, async (req, res) => {
    try {
        const bondResult = await query(
            'SELECT id FROM couples WHERE user1_id = $1 OR user2_id = $1',
            [req.user.id]
        );

        if (bondResult.rows.length === 0) {
            return res.status(404).json({ message: 'No bond found' });
        }

        const bondId = bondResult.rows[0].id;
        const elements = await query(
            'SELECT * FROM eternal_wall_elements WHERE bond_id = $1 ORDER BY z_index ASC, created_at ASC',
            [bondId]
        );

        res.json({ elements: elements.rows });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
