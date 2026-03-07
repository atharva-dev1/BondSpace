const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { getIo } = require('../socket');

// POST /api/location/request-disable — Request partner consent to disable location
const requestDisableLocation = async (req, res) => {
    try {
        const user_id = req.user.id;

        // Find the couple and identify the partner
        const bondRes = await query(
            `SELECT id, user1_id, user2_id FROM couples WHERE (user1_id=$1 OR user2_id=$1) AND status='bonded'`,
            [user_id]
        );

        if (bondRes.rows.length === 0) {
            return res.status(404).json({ error: 'Active bond not found' });
        }

        const bond = bondRes.rows[0];
        const partner_id = bond.user1_id === user_id ? bond.user2_id : bond.user1_id;

        // Create a notification for the partner
        const notification_id = uuidv4();
        await query(
            `INSERT INTO notifications (id, user_id, type, title, body, meta) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                notification_id,
                partner_id,
                'location_consent_request',
                'Location Privacy Request',
                `${req.user.name} wants to disable location sharing. Do you agree?`,
                JSON.stringify({ requester_id: user_id, bond_id: bond.id })
            ]
        );

        // Emit real-time event via socket
        const io = getIo();
        io.to(partner_id).emit('notification', {
            id: notification_id,
            type: 'location_consent_request',
            title: 'Location Privacy Request',
            body: `${req.user.name} wants to disable location sharing.`,
            meta: { requester_id: user_id, bond_id: bond.id }
        });

        res.json({ message: 'Consent request sent to partner', notification_id });
    } catch (err) {
        console.error('Request disable location error:', err);
        res.status(500).json({ error: 'Failed to send consent request' });
    }
};

// POST /api/location/respond-disable — Respond to location disable request
const respondToDisableRequest = async (req, res) => {
    try {
        const { notification_id, approved, force_enable } = req.body;
        const user_id = req.user.id; // The one responding (the partner) or the user themselves if force_enable

        // If force_enable is true, we allow the user to turn their OWN location sharing back ON
        if (force_enable && approved) {
            const bondRes = await query(
                `SELECT id, user1_id, user2_id FROM couples WHERE (user1_id=$1 OR user2_id=$1) AND status='bonded'`,
                [user_id]
            );
            if (bondRes.rows.length === 0) return res.status(404).json({ error: 'Bond not found' });

            const bond = bondRes.rows[0];
            const columnToUpdate = bond.user1_id === user_id ? 'location_sharing_user1' : 'location_sharing_user2';

            await query(`UPDATE couples SET ${columnToUpdate} = TRUE WHERE id = $1`, [bond.id]);
            return res.json({ message: 'Location sharing re-enabled' });
        }

        // Verify notification exists and belongs to the user
        const notifRes = await query(
            'SELECT * FROM notifications WHERE id=$1 AND user_id=$2 AND type=$3',
            [notification_id, user_id, 'location_consent_request']
        );

        if (notifRes.rows.length === 0) {
            return res.status(404).json({ error: 'Request not found' });
        }

        const notification = notifRes.rows[0];
        const { requester_id, bond_id } = notification.meta;

        if (approved) {
            // Update the couples table to disable location for the requester
            const bond = (await query('SELECT * FROM couples WHERE id=$1', [bond_id])).rows[0];
            const columnToUpdate = bond.user1_id === requester_id ? 'location_sharing_user1' : 'location_sharing_user2';

            await query(
                `UPDATE couples SET ${columnToUpdate} = FALSE WHERE id = $1`,
                [bond_id]
            );

            // Notify requester of approval
            const io = getIo();
            io.to(requester_id).emit('location_consent_response', { approved: true });
        } else {
            // Notify requester of rejection
            const io = getIo();
            io.to(requester_id).emit('location_consent_response', { approved: false });
        }

        // Mark notification as read or delete it
        await query('DELETE FROM notifications WHERE id=$1', [notification_id]);

        res.json({ message: approved ? 'Location sharing disabled' : 'Request rejected' });
    } catch (err) {
        console.error('Respond to disable request error:', err);
        res.status(500).json({ error: 'Failed to process response' });
    }
};

module.exports = { requestDisableLocation, respondToDisableRequest };
