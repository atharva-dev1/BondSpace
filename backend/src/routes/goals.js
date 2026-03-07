const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// GET /api/goals/:couple_id — Get all goals
const getGoals = async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM couple_goals WHERE couple_id=$1 ORDER BY created_at DESC',
            [req.params.couple_id]
        );
        res.json({ goals: result.rows });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch goals' });
    }
};

// POST /api/goals — Create a new goal
const createGoal = async (req, res) => {
    try {
        const { couple_id, title, type, target_value, unit, target_date } = req.body;
        const result = await query(
            `INSERT INTO couple_goals (id, couple_id, title, type, target_value, unit, target_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
            [uuidv4(), couple_id, title, type || 'custom', target_value, unit, target_date]
        );
        res.status(201).json({ goal: result.rows[0], message: '🎯 Goal set! Let\'s achieve it together.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create goal' });
    }
};

// PUT /api/goals/:id — Update progress
const updateProgress = async (req, res) => {
    try {
        const { current_value } = req.body;
        const { id } = req.params;

        const goalRes = await query('SELECT target_value FROM couple_goals WHERE id=$1', [id]);
        if (!goalRes.rows[0]) return res.status(404).json({ error: 'Goal not found' });

        const is_achieved = parseFloat(current_value) >= parseFloat(goalRes.rows[0].target_value);

        const result = await query(
            'UPDATE couple_goals SET current_value=$1, is_achieved=$2, updated_at=NOW() WHERE id=$3 RETURNING *',
            [current_value, is_achieved, id]
        );

        res.json({
            goal: result.rows[0],
            message: is_achieved ? '🎉 Goal achieved! Amazing teamwork!' : 'Progress updated 📈',
            achieved: is_achieved,
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update progress' });
    }
};

module.exports = { getGoals, createGoal, updateProgress };
