const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// GET /api/planner/:couple_id - Get all planned events
const getPlannedEvents = async (req, res) => {
    try {
        const { couple_id } = req.params;
        const result = await query(
            'SELECT * FROM planned_events WHERE couple_id=$1 ORDER BY event_date ASC',
            [couple_id]
        );
        res.json({ events: result.rows });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch planned events' });
    }
};

// POST /api/planner/event - Create a new event
const createEvent = async (req, res) => {
    try {
        const { couple_id, title, description, event_date, location, theme } = req.body;
        const result = await query(
            `INSERT INTO planned_events (id, couple_id, title, description, event_date, location, theme)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [uuidv4(), couple_id, title, description, event_date, location, theme]
        );
        res.status(201).json({ event: result.rows[0], message: '📅 Event planned!' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create event' });
    }
};

// PUT /api/planner/event/:id - Update event (mark completed, edit details)
const updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, event_date, location, theme, is_completed } = req.body;

        const result = await query(
            `UPDATE planned_events 
             SET title=COALESCE($1, title), 
                 description=COALESCE($2, description), 
                 event_date=COALESCE($3, event_date), 
                 location=COALESCE($4, location), 
                 theme=COALESCE($5, theme), 
                 is_completed=COALESCE($6, is_completed)
             WHERE id=$7 RETURNING *`,
            [title, description, event_date, location, theme, is_completed, id]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'Event not found' });
        res.json({ event: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update event' });
    }
};

module.exports = { getPlannedEvents, createEvent, updateEvent };
