/**
 * Bond Invite Link System
 * Generates shareable invite codes stored in Redis (or in-memory)
 * so partner can join by clicking a link instead of pasting UUIDs
 */
const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const redis = require('../config/redis');

// POST /api/bond/invite — Generate an invite link code
const createInvite = async (req, res) => {
    try {
        const userId = req.user.id;

        // Check if already fully bonded
        const bonded = await query(
            `SELECT id FROM couples WHERE (user1_id=$1 OR user2_id=$1) AND status='bonded'`,
            [userId]
        );
        if (bonded.rows.length > 0) {
            return res.status(409).json({ error: 'already_bonded', message: 'You are already bonded' });
        }

        // Clean up any stale pending entries (from old bond-request flow) before issuing invite
        await query(
            `DELETE FROM couples WHERE (user1_id=$1 OR user2_id=$1) AND status='pending'`,
            [userId]
        );

        // Generate a short, URL-friendly code
        const code = uuidv4().replace(/-/g, '').substring(0, 10).toUpperCase();
        const key = `invite:${code}`;

        // Store: code → userId, expires in 48h
        await redis.set(key, userId, { EX: 48 * 60 * 60 });

        res.json({
            code,
            invite_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/join/${code}`,
            expires_in: '48 hours'
        });
    } catch (err) {
        console.error('Create invite error:', err);
        res.status(500).json({ error: 'Failed to create invite' });
    }
};

// POST /api/bond/join/:code — Accept a partner's invite
const joinWithCode = async (req, res) => {
    try {
        const { code } = req.params;
        const joiningUserId = req.user.id;

        const key = `invite:${code}`;
        const inviterId = await redis.get(key);

        if (!inviterId) {
            return res.status(404).json({ error: 'Invalid or expired invite link. Ask your partner to generate a new one.' });
        }

        if (inviterId === joiningUserId) {
            return res.status(400).json({ error: "You can't join your own invite link 😅" });
        }

        // Check neither user has an active bond
        const existing = await query(
            `SELECT id FROM couples WHERE (user1_id=$1 OR user2_id=$1 OR user1_id=$2 OR user2_id=$2) AND status IN ('pending','bonded')`,
            [inviterId, joiningUserId]
        );
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'One of you is already bonded to someone else' });
        }

        // Create the bond as 'bonded' directly (invite = implicit acceptance)
        const result = await query(
            `INSERT INTO couples (id, user1_id, user2_id, status, connected_at) VALUES ($1,$2,$3,'bonded',NOW()) RETURNING *`,
            [uuidv4(), inviterId, joiningUserId]
        );

        // Delete the invite code (one-time use)
        await redis.del(key);

        // Fetch full bond with user details
        const bond = await query(
            `SELECT c.*, u1.name as user1_name, u1.avatar as user1_avatar, u2.name as user2_name, u2.avatar as user2_avatar
             FROM couples c
             JOIN users u1 ON c.user1_id = u1.id
             JOIN users u2 ON c.user2_id = u2.id
             WHERE c.id = $1`,
            [result.rows[0].id]
        );

        res.status(201).json({
            bond: bond.rows[0],
            message: '💞 You are now bonded! Welcome to your private universe.'
        });
    } catch (err) {
        console.error('Join invite error:', err);
        res.status(500).json({ error: 'Failed to join bond' });
    }
};

// GET /api/bond/invite/check/:code — Preview invite info before joining
const checkInvite = async (req, res) => {
    try {
        const { code } = req.params;
        const inviterId = await redis.get(`invite:${code}`);

        if (!inviterId) {
            return res.status(404).json({ error: 'Invalid or expired invite link' });
        }

        const user = await query('SELECT id, name, avatar, bio FROM users WHERE id=$1', [inviterId]);
        if (!user.rows[0]) return res.status(404).json({ error: 'User not found' });

        res.json({ inviter: user.rows[0], valid: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to check invite' });
    }
};

module.exports = { createInvite, joinWithCode, checkInvite };
