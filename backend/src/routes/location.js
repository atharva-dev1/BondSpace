const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { requestDisableLocation, respondToDisableRequest } = require('./location_consent');

// POST /api/location — Update live location
const updateLocation = async (req, res) => {
    try {
        const { lat, lng, address, place_name, battery_level } = req.body;
        const user_id = req.user.id;

        // Check if location sharing is enabled for this user in their bond
        const bondRes = await query(
            `SELECT user1_id, user2_id, location_sharing_user1, location_sharing_user2 
             FROM couples WHERE (user1_id=$1 OR user2_id=$1) AND status='bonded'`,
            [user_id]
        );

        if (bondRes.rows.length > 0) {
            const bond = bondRes.rows[0];
            const isSharingEnabled = bond.user1_id === user_id ? bond.location_sharing_user1 : bond.location_sharing_user2;

            if (!isSharingEnabled) {
                return res.status(403).json({ error: 'Location sharing is disabled. Request consent to re-enable.' });
            }
        }

        // Check "reached home" — check if current location is within 200m of home
        const isHome = place_name?.toLowerCase().includes('home') || false;

        const result = await query(
            'INSERT INTO location_logs (id, user_id, lat, lng, address, place_name, battery_level, is_reached_home) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
            [uuidv4(), user_id, lat, lng, address, place_name, battery_level, isHome]
        );

        // Cache latest location in Redis for real-time access
        const redis = require('../config/redis');
        await redis.set(`location:${user_id}`, JSON.stringify({ lat, lng, address, place_name, battery_level, isHome, timestamp: new Date() }), { EX: 3600 });

        res.json({ location: result.rows[0], is_home: isHome });
    } catch (err) {
        console.error('Location update error:', err);
        res.status(500).json({ error: 'Failed to update location' });
    }
};

// GET /api/location/partner/:partner_id — Get partner live location
const getPartnerLocation = async (req, res) => {
    try {
        const { partner_id } = req.params;
        const redis = require('../config/redis');
        const cached = await redis.get(`location:${partner_id}`);

        if (cached) {
            return res.json({ location: JSON.parse(cached), source: 'live' });
        }

        // Fallback to DB for last known
        const result = await query(
            'SELECT * FROM location_logs WHERE user_id=$1 ORDER BY timestamp DESC LIMIT 1',
            [partner_id]
        );
        res.json({ location: result.rows[0] || null, source: 'last_known' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get partner location' });
    }
};

// GET /api/location/history/:user_id — Location timeline travel history
const getLocationHistory = async (req, res) => {
    try {
        const { user_id } = req.params;
        const { date } = req.query;

        let q = 'SELECT * FROM location_logs WHERE user_id=$1';
        const params = [user_id];

        if (date) {
            q += ` AND DATE(timestamp) = $2`;
            params.push(date);
        }

        q += ' ORDER BY timestamp DESC LIMIT 100';
        const result = await query(q, params);
        res.json({ history: result.rows });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get location history' });
    }
};

// GET /api/location/battery/:partner_id — Get partner battery status
const getPartnerBattery = async (req, res) => {
    try {
        const { partner_id } = req.params;
        const redis = require('../config/redis');
        const cached = await redis.get(`location:${partner_id}`);
        if (cached) {
            const loc = JSON.parse(cached);
            return res.json({ battery_level: loc.battery_level, timestamp: loc.timestamp });
        }
        const result = await query('SELECT battery_level, timestamp FROM location_logs WHERE user_id=$1 ORDER BY timestamp DESC LIMIT 1', [partner_id]);
        res.json({ battery_level: result.rows[0]?.battery_level || null });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get battery status' });
    }
};

module.exports = { 
    updateLocation, 
    getPartnerLocation, 
    getLocationHistory, 
    getPartnerBattery,
    requestDisableLocation,
    respondToDisableRequest
};
